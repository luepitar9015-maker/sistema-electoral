const { Op } = require('sequelize');
const Voter = require('../models/Voter');
const TestigoElectoral = require('../models/TestigoElectoral');
const DiaDMesaReporte = require('../models/DiaDMesaReporte');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const path = require('path');
const fs = require('fs');

// Obtener resumen estratégico en tiempo real del Día D
exports.getDashboardSummary = async (req, res) => {
    try {
        const campana_id = req.campaignId || req.query.campana_id;
        if (!campana_id) {
            return res.status(400).json({ message: 'ID de campaña requerido' });
        }

        const whereVoter = { campana_id };
        // Si el usuario es líder, filtrar solo sus votantes
        if (req.user && req.user.role === 'lider') {
            whereVoter[Op.or] = [
                { lider_cedula: req.user.cedula },
                { usuario_registro_id: req.user.id }
            ];
        }

        const totalVotantes = await Voter.count({ where: whereVoter });
        const votantesSufragaron = await Voter.count({ 
            where: { ...whereVoter, ha_votado: true } 
        });

        // Curva de afluencia por franjas horarias
        const votantesConHora = await Voter.findAll({
            where: { ...whereVoter, ha_votado: true, hora_voto: { [Op.ne]: null } },
            attributes: ['hora_voto']
        });

        const franjas = {
            '08:00 - 10:00': 0,
            '10:00 - 12:00': 0,
            '12:00 - 14:00': 0,
            '14:00 - 16:00': 0,
            'Después 16:00': 0
        };

        votantesConHora.forEach(v => {
            if (!v.hora_voto) return;
            const hour = new Date(v.hora_voto).getHours();
            if (hour >= 8 && hour < 10) franjas['08:00 - 10:00']++;
            else if (hour >= 10 && hour < 12) franjas['10:00 - 12:00']++;
            else if (hour >= 12 && hour < 14) franjas['12:00 - 14:00']++;
            else if (hour >= 14 && hour < 16) franjas['14:00 - 16:00']++;
            else if (hour >= 16) franjas['Después 16:00']++;
        });

        // Estadísticas de Testigos Electorales
        const totalTestigos = await TestigoElectoral.count({ where: { campana_id } });
        const testigosEnMesa = await TestigoElectoral.count({ where: { campana_id, estado: 'en_mesa' } });

        // Estadísticas de Escrutinio Rápido (Actas E-14)
        const reportesMesas = await DiaDMesaReporte.findAll({ where: { campana_id } });
        const totalMesasEscrutadas = reportesMesas.length;
        const totalVotosPropiosEscrutados = reportesMesas.reduce((acc, curr) => acc + (curr.votos_lista_propia || 0), 0);
        const totalVotosCandidato = reportesMesas.reduce((acc, curr) => acc + (curr.votos_candidato_principal || 0), 0);
        const actasConFoto = reportesMesas.filter(r => !!r.acta_e14_url).length;

        const porcentajeParticipacion = totalVotantes > 0 
            ? ((votantesSufragaron / totalVotantes) * 100).toFixed(1) 
            : 0;

        return res.json({
            campana_id,
            meta_votantes: totalVotantes,
            votos_efectivos: votantesSufragaron,
            votos_pendientes: Math.max(0, totalVotantes - votantesSufragaron),
            porcentaje_participacion: Number(porcentajeParticipacion),
            curva_horaria: franjas,
            testigos: {
                total: totalTestigos,
                en_mesa: testigosEnMesa,
                porcentaje_cobertura: totalTestigos > 0 ? Math.round((testigosEnMesa / totalTestigos) * 100) : 0
            },
            escrutinio: {
                mesas_escrutadas: totalMesasEscrutadas,
                votos_propios_total: totalVotosPropiosEscrutados,
                votos_candidato_principal: totalVotosCandidato,
                actas_digitalizadas: actasConFoto
            }
        });
    } catch (error) {
        console.error('Error al obtener resumen de Día D:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
};

// Monitor GOTV (Get Out The Vote) - Lista y filtros de votantes el Día D
exports.getVotersGOTV = async (req, res) => {
    try {
        const campana_id = req.campaignId || req.query.campana_id;
        const { puesto, mesa, lider, estado, search, page = 1, limit = 50 } = req.query;

        const where = { campana_id };

        if (req.user && req.user.role === 'lider') {
            where[Op.or] = [
                { lider_cedula: req.user.cedula },
                { usuario_registro_id: req.user.id }
            ];
        }

        if (puesto) where.lugar_votacion = puesto;
        if (mesa) where.mesa = mesa;
        if (lider) where.lider_nombre = { [Op.iLike || Op.like]: `%${lider}%` };

        if (estado === 'votaron') where.ha_votado = true;
        if (estado === 'pendientes') where.ha_votado = false;

        if (search) {
            where[Op.and] = [
                {
                    [Op.or]: [
                        { nombres: { [Op.iLike || Op.like]: `%${search}%` } },
                        { apellidos: { [Op.iLike || Op.like]: `%${search}%` } },
                        { cedula: { [Op.iLike || Op.like]: `%${search}%` } }
                    ]
                }
            ];
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { count, rows } = await Voter.findAndCountAll({
            where,
            offset,
            limit: parseInt(limit),
            order: [['ha_votado', 'ASC'], ['apellidos', 'ASC']]
        });

        return res.json({
            total: count,
            totalPages: Math.ceil(count / parseInt(limit)),
            currentPage: parseInt(page),
            votantes: rows
        });
    } catch (error) {
        console.error('Error al obtener votantes GOTV:', error);
        return res.status(500).json({ message: 'Error al listar votantes' });
    }
};

// Registrar Voto Efectivo (Check-in Día D)
exports.toggleVoterCheckIn = async (req, res) => {
    try {
        const { voterId } = req.params;
        const { ha_votado } = req.body;

        const voter = await Voter.findByPk(voterId);
        if (!voter) {
            return res.status(404).json({ message: 'Votante no encontrado' });
        }

        const nuevoEstado = ha_votado !== undefined ? Boolean(ha_votado) : !voter.ha_votado;
        voter.ha_votado = nuevoEstado;
        voter.hora_voto = nuevoEstado ? new Date() : null;
        voter.registrado_por_voto_id = nuevoEstado ? req.user.id : null;

        await voter.save();

        if (AuditLog) {
            await AuditLog.create({
                user_id: req.user.id,
                campana_id: voter.campana_id,
                action: nuevoEstado ? 'VOTO_REGISTRADO_DIA_D' : 'VOTO_ANULADO_DIA_D',
                target_type: 'Voter',
                target_id: voter.id,
                details: { cedula: voter.cedula, puesto: voter.lugar_votacion, mesa: voter.mesa },
                ip_address: req.ip
            }).catch(() => {});
        }

        return res.json({
            message: nuevoEstado ? 'Voto efectivo registrado exitosamente' : 'Check-in de voto revertido',
            voter
        });
    } catch (error) {
        console.error('Error al registrar voto efectivo:', error);
        return res.status(500).json({ message: 'Error al actualizar voto' });
    }
};

// Sincronización Masiva Offline (para recolectas en campo sin internet)
exports.syncOfflineBatch = async (req, res) => {
    try {
        const { checkIns = [] } = req.body;
        let procesados = 0;

        for (const item of checkIns) {
            if (!item.voterId && !item.cedula) continue;
            const where = item.voterId ? { id: item.voterId } : { cedula: item.cedula };
            const voter = await Voter.findOne({ where });
            if (voter) {
                voter.ha_votado = true;
                voter.hora_voto = item.hora_voto ? new Date(item.hora_voto) : new Date();
                voter.registrado_por_voto_id = req.user.id;
                await voter.save();
                procesados++;
            }
        }

        return res.json({
            message: `Sincronización completada. ${procesados} registros de voto aplicados.`,
            procesados
        });
    } catch (error) {
        console.error('Error en syncOfflineBatch:', error);
        return res.status(500).json({ message: 'Error al procesar lote offline' });
    }
};

// Gestión de Testigos Electorales
exports.getTestigos = async (req, res) => {
    try {
        const campana_id = req.campaignId || req.query.campana_id;
        const testigos = await TestigoElectoral.findAll({
            where: { campana_id },
            order: [['puesto_votacion', 'ASC'], ['mesa', 'ASC']]
        });
        return res.json(testigos);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener testigos' });
    }
};

exports.createTestigo = async (req, res) => {
    try {
        const campana_id = req.campaignId || req.body.campana_id;
        const { nombre, cedula, telefono, departamento, municipio, puesto_votacion, mesa, rol, credencial_numero, observaciones } = req.body;

        if (!nombre || !cedula || !puesto_votacion) {
            return res.status(400).json({ message: 'Nombre, cédula y puesto de votación son obligatorios' });
        }

        const testigo = await TestigoElectoral.create({
            campana_id,
            nombre,
            cedula,
            telefono,
            departamento,
            municipio,
            puesto_votacion,
            mesa: mesa || 'TODAS',
            rol: rol || 'testigo_mesa',
            credencial_numero,
            observaciones,
            usuario_id: req.user.id
        });

        return res.status(201).json({ message: 'Testigo electoral registrado', testigo });
    } catch (error) {
        console.error('Error al crear testigo:', error);
        return res.status(500).json({ message: 'Error al registrar testigo' });
    }
};

exports.updateTestigoEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        const testigo = await TestigoElectoral.findByPk(id);
        if (!testigo) return res.status(404).json({ message: 'Testigo no encontrado' });

        testigo.estado = estado;
        await testigo.save();
        return res.json({ message: 'Estado actualizado', testigo });
    } catch (error) {
        return res.status(500).json({ message: 'Error al actualizar estado' });
    }
};

exports.deleteTestigo = async (req, res) => {
    try {
        const { id } = req.params;
        await TestigoElectoral.destroy({ where: { id } });
        return res.json({ message: 'Testigo eliminado exitosamente' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar testigo' });
    }
};

// Reporte de Escrutinio Rápido y Acta E-14
exports.reportarMesaE14 = async (req, res) => {
    try {
        const campana_id = req.campaignId || req.body.campana_id;
        const {
            puesto_votacion,
            mesa,
            departamento,
            municipio,
            total_sufragantes = 0,
            votos_lista_propia = 0,
            votos_candidato_principal = 0,
            votos_en_blanco = 0,
            votos_nulos = 0,
            votos_no_marcados = 0,
            votos_partidos_rivales,
            observaciones,
            ocr_detectado
        } = req.body;

        if (!puesto_votacion || !mesa) {
            return res.status(400).json({ message: 'Puesto de votación y mesa son obligatorios' });
        }

        let acta_e14_url = null;
        if (req.file) {
            acta_e14_url = `/uploads/actas/${req.file.filename}`;
        }

        // Buscar si ya existe reporte para esta mesa o crear uno nuevo
        let reporte = await DiaDMesaReporte.findOne({
            where: { campana_id, puesto_votacion, mesa }
        });

        if (reporte) {
            reporte.total_sufragantes = total_sufragantes;
            reporte.votos_lista_propia = votos_lista_propia;
            reporte.votos_candidato_principal = votos_candidato_principal;
            reporte.votos_en_blanco = votos_en_blanco;
            reporte.votos_nulos = votos_nulos;
            reporte.votos_no_marcados = votos_no_marcados;
            if (votos_partidos_rivales) reporte.votos_partidos_rivales = typeof votos_partidos_rivales === 'string' ? votos_partidos_rivales : JSON.stringify(votos_partidos_rivales);
            if (acta_e14_url) reporte.acta_e14_url = acta_e14_url;
            if (ocr_detectado) reporte.ocr_detectado = ocr_detectado;
            reporte.observaciones = observaciones;
            await reporte.save();
        } else {
            reporte = await DiaDMesaReporte.create({
                campana_id,
                puesto_votacion,
                mesa,
                departamento,
                municipio,
                total_sufragantes,
                votos_lista_propia,
                votos_candidato_principal,
                votos_en_blanco,
                votos_nulos,
                votos_no_marcados,
                votos_partidos_rivales: typeof votos_partidos_rivales === 'string' ? votos_partidos_rivales : JSON.stringify(votos_partidos_rivales || {}),
                acta_e14_url,
                ocr_detectado,
                observaciones
            });
        }

        return res.status(200).json({
            message: 'Reporte de mesa y acta E-14 guardados con éxito',
            reporte
        });
    } catch (error) {
        console.error('Error al reportar mesa E-14:', error);
        return res.status(500).json({ message: 'Error al registrar acta de mesa' });
    }
};

exports.getMesaReportes = async (req, res) => {
    try {
        const campana_id = req.campaignId || req.query.campana_id;
        const reportes = await DiaDMesaReporte.findAll({
            where: { campana_id },
            order: [['puesto_votacion', 'ASC'], ['mesa', 'ASC']]
        });
        return res.json(reportes);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener reportes de mesas' });
    }
};
