const { Op } = require('sequelize');
const Voter = require('../models/Voter');
const CallCenterLog = require('../models/CallCenterLog');
const LogisticaDespacho = require('../models/LogisticaDespacho');
const User = require('../models/User');

exports.getNextVoter = async (req, res) => {
    try {
        const campana_id = req.campaignId || req.campana_id || req.query.campana_id;
        const { puesto, soloPendientesDiaD, minFidelidad = 1 } = req.query;

        const where = campana_id ? { campana_id } : {};
        if (puesto) where.lugar_votacion = puesto;
        if (soloPendientesDiaD === 'true') where.ha_votado = false;
        if (minFidelidad) where.fidelidad_score = { [Op.gte]: parseInt(minFidelidad, 10) };

        // Excluir votantes llamados en las últimas 3 horas
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
        const callWhere = { fecha_llamada: { [Op.gte]: threeHoursAgo } };
        if (campana_id) callWhere.campana_id = campana_id;
        const recentCalled = await CallCenterLog.findAll({
            where: callWhere,
            attributes: ['voter_id']
        });
        const calledIds = recentCalled.map(c => c.voter_id);

        if (calledIds.length > 0) {
            where.id = { [Op.notIn]: calledIds };
        }

        const voter = await Voter.findOne({
            where,
            order: [
                ['ha_votado', 'ASC'],
                ['fidelidad_score', 'DESC'],
                ['id', 'ASC']
            ]
        });

        if (!voter) {
            return res.json({ message: 'No hay más votantes en cola con estos criterios', voter: null });
        }

        return res.json({ voter });
    } catch (e) {
        console.error('Error al obtener siguiente votante:', e);
        return res.status(500).json({ message: 'Error en cola de llamadas' });
    }
};

exports.recordCall = async (req, res) => {
    try {
        const { voter_id, resultado, notas, duracion_segundos = 0, origen_direccion, destino_puesto } = req.body;

        const voter = await Voter.findByPk(voter_id);
        if (!voter) return res.status(404).json({ message: 'Votante no encontrado' });

        let campana_id = req.campaignId || req.campana_id || req.body.campana_id || voter.campana_id || 1;

        const log = await CallCenterLog.create({
            campana_id,
            voter_id,
            usuario_id: req.user.id,
            resultado,
            notas,
            duracion_segundos: parseInt(duracion_segundos, 10) || 0
        });

        // Acciones automáticas según tipificación:
        if (resultado === 'confirmo_voto') {
            voter.intencion_voto = 'seguro';
            voter.fidelidad_score = Math.min(5, (voter.fidelidad_score || 3) + 1);
            await voter.save();
        } else if (resultado === 'requiere_transporte') {
            voter.intencion_voto = 'seguro';
            await voter.save();

            // Crear solicitud automática en la central de despacho logístico
            await LogisticaDespacho.create({
                campana_id,
                voter_id: voter.id,
                usuario_despachador_id: req.user.id,
                solicitante_nombre: `${voter.nombres} ${voter.apellidos}`,
                solicitante_telefono: voter.direccion?.includes('Tel:') ? voter.direccion.replace('Tel:', '').trim() : voter.cedula,
                origen_direccion: origen_direccion || voter.direccion || 'Domicilio votante',
                destino_puesto: destino_puesto || voter.lugar_votacion || 'Puesto asignado',
                cantidad_pasajeros: 1,
                estado: 'solicitado',
                notas: `Generado automáticamente desde Call Center. Notas: ${notas || 'Sin notas'}`
            });
        } else if (resultado === 'indeciso') {
            voter.intencion_voto = 'dudoso';
            await voter.save();
        } else if (resultado === 'en_contra') {
            voter.intencion_voto = 'en_contra';
            voter.fidelidad_score = 1;
            await voter.save();
        }

        return res.status(201).json({
            message: 'Llamada tipificada exitosamente',
            log,
            voter
        });
    } catch (e) {
        console.error('Error al registrar llamada:', e);
        return res.status(500).json({ message: 'Error al guardar registro de llamada' });
    }
};

exports.getCallCenterStats = async (req, res) => {
    try {
        const campana_id = req.campaignId || req.campana_id || req.query.campana_id;
        const baseWhere = campana_id ? { campana_id } : {};

        const totalLlamadas = await CallCenterLog.count({ where: baseWhere });
        const misLlamadas = await CallCenterLog.count({ where: { ...baseWhere, usuario_id: req.user.id } });

        const confirmados = await CallCenterLog.count({ where: { ...baseWhere, resultado: 'confirmo_voto' } });
        const transporte = await CallCenterLog.count({ where: { ...baseWhere, resultado: 'requiere_transporte' } });
        const noContesta = await CallCenterLog.count({ where: { ...baseWhere, resultado: 'no_contesta' } });
        const indecisos = await CallCenterLog.count({ where: { ...baseWhere, resultado: 'indeciso' } });

        const efectividad = totalLlamadas > 0 ? Math.round(((confirmados + transporte) / totalLlamadas) * 100) : 0;

        return res.json({
            total_llamadas: totalLlamadas,
            mis_llamadas: misLlamadas,
            confirmados,
            transporte_solicitado: transporte,
            no_contesta: noContesta,
            indecisos,
            tasa_efectividad_pct: efectividad
        });
    } catch (e) {
        return res.status(500).json({ message: 'Error al obtener métricas de call center' });
    }
};
