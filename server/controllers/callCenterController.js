const { Op } = require('sequelize');
const Voter = require('../models/Voter');
const CallCenterLog = require('../models/CallCenterLog');
const LogisticaDespacho = require('../models/LogisticaDespacho');
const User = require('../models/User');
const Reunion = require('../models/Reunion');
const ReunionAsistente = require('../models/ReunionAsistente');
const NecesidadCiudadana = require('../models/NecesidadCiudadana');
const Campaign = require('../models/Campaign');

// =========================================================================
// MODO 1: GOTV Y MOVILIZACIÓN ELECTORAL DÍA D
// =========================================================================

exports.getNextVoter = async (req, res) => {
    try {
        let campana_id = req.campaignId || req.campana_id || req.query.campana_id;
        if (!campana_id) {
            const firstCamp = await Campaign.findOne({ order: [['id', 'ASC']] });
            if (firstCamp) campana_id = firstCamp.id;
        }
        const { puesto, soloPendientesDiaD, minFidelidad = 1 } = req.query;

        const where = campana_id ? { campana_id } : {};
        if (puesto) where.lugar_votacion = puesto;
        if (soloPendientesDiaD === 'true') where.ha_votado = false;
        if (minFidelidad && parseInt(minFidelidad, 10) > 1) {
            where.fidelidad_score = { [Op.gte]: parseInt(minFidelidad, 10) };
        }

        // Excluir votantes llamados en las últimas 3 horas
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
        const callWhere = { 
            fecha_llamada: { [Op.gte]: threeHoursAgo },
            tipo_campana: 'gotv_dia_d'
        };
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
            tipo_campana: 'gotv_dia_d',
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
        let campana_id = req.campaignId || req.campana_id || req.query.campana_id;
        if (!campana_id) {
            const firstCamp = await Campaign.findOne({ order: [['id', 'ASC']] });
            if (firstCamp) campana_id = firstCamp.id;
        }
        const baseWhere = {
            campana_id,
            tipo_campana: 'gotv_dia_d'
        };

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


// =========================================================================
// MODO 2: CONVOCATORIA A EVENTOS Y ENCUENTROS COMUNITARIOS (CAMPAÑA / MANDATO)
// =========================================================================

// 1. Obtener eventos activos y programados para convocatoria
exports.getEventosActivos = async (req, res) => {
    try {
        let campana_id = req.campaignId || req.campana_id || req.query.campana_id;
        if (!campana_id) {
            const firstCamp = await Campaign.findOne({ order: [['id', 'ASC']] });
            if (firstCamp) campana_id = firstCamp.id;
        }

        const eventos = await Reunion.findAll({
            where: {
                campana_id,
                estado: { [Op.in]: ['programada', 'en_curso'] }
            },
            order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']]
        });

        // Contar confirmados por evento
        const eventosConMetricas = await Promise.all(eventos.map(async (ev) => {
            const confirmadosLogs = await CallCenterLog.findAll({
                where: {
                    reunion_id: ev.id,
                    asistencia_confirmada: true
                },
                attributes: ['cantidad_acompanantes']
            });
            const totalConfirmados = confirmadosLogs.length;
            const totalAcompanantes = confirmadosLogs.reduce((acc, curr) => acc + (curr.cantidad_acompanantes || 0), 0);
            const aforoProyectado = totalConfirmados + totalAcompanantes;
            const totalLlamadas = await CallCenterLog.count({ where: { reunion_id: ev.id } });

            return {
                ...ev.toJSON(),
                confirmados_directos: totalConfirmados,
                acompanantes_estimados: totalAcompanantes,
                aforo_proyectado: aforoProyectado,
                total_llamadas_realizadas: totalLlamadas,
                porcentaje_aforo_cubierto: ev.aforo_estimado > 0 ? Math.round((aforoProyectado / ev.aforo_estimado) * 100) : 0
            };
        }));

        return res.json({ eventos: eventosConMetricas });
    } catch (e) {
        console.error('Error al obtener eventos activos:', e);
        return res.status(500).json({ message: 'Error al consultar eventos comunitarios' });
    }
};

// 2. Crear evento o encuentro comunitario directamente desde el Call Center
exports.crearEventoConvocatoria = async (req, res) => {
    try {
        let campana_id = req.campaignId || req.campana_id || req.body.campana_id;
        if (!campana_id) {
            const firstCamp = await Campaign.findOne({ order: [['id', 'ASC']] });
            if (firstCamp) campana_id = firstCamp.id;
        }

        const {
            titulo,
            descripcion,
            fecha,
            hora_inicio,
            hora_fin,
            lugar_nombre,
            direccion,
            departamento,
            municipio,
            barrio_vereda,
            aforo_estimado,
            presidida_por = 'candidato'
        } = req.body;

        if (!titulo || !fecha || !hora_inicio) {
            return res.status(400).json({ message: 'Título, fecha y hora de inicio son obligatorios' });
        }

        const nuevoEvento = await Reunion.create({
            campana_id,
            titulo,
            descripcion: descripcion || `Convocatoria de encuentro comunitario para ${barrio_vereda || municipio || 'la comunidad'}`,
            fecha,
            hora_inicio,
            hora_fin: hora_fin || null,
            lugar_nombre: lugar_nombre || 'Salón Comunitario / Espacio Público',
            direccion: direccion || '',
            departamento: departamento || '',
            municipio: municipio || '',
            barrio_vereda: barrio_vereda || '',
            aforo_estimado: parseInt(aforo_estimado, 10) || 100,
            presidida_por,
            estado: 'programada',
            creado_por: req.user ? req.user.id : null
        });

        return res.status(201).json({
            message: 'Evento comunitario creado exitosamente para convocatoria',
            evento: nuevoEvento
        });
    } catch (e) {
        console.error('Error al crear evento para convocatoria:', e);
        return res.status(500).json({ message: 'Error al crear evento' });
    }
};

// 3. Obtener segmentos geográficos únicos para filtros de nicho
exports.getSegmentosGeograficos = async (req, res) => {
    try {
        let campana_id = req.campaignId || req.campana_id || req.query.campana_id;
        const where = campana_id ? { campana_id } : {};

        const voters = await Voter.findAll({
            where,
            attributes: ['municipio', 'lugar_votacion', 'direccion']
        });

        const municipios = [...new Set(voters.map(v => v.municipio).filter(Boolean))].sort();
        const puestos = [...new Set(voters.map(v => v.lugar_votacion).filter(Boolean))].sort();

        const barriosSet = new Set();
        voters.forEach(v => {
            if (v.direccion) {
                const match = v.direccion.match(/barrio\s+([^,]+)/i);
                if (match && match[1]) barriosSet.add(match[1].trim());
            }
        });
        const barrios = [...barriosSet].sort();

        return res.json({
            municipios,
            puestos,
            barrios
        });
    } catch (e) {
        console.error('Error al obtener segmentos geográficos:', e);
        return res.status(500).json({ message: 'Error al consultar geografía' });
    }
};

// 4. Obtener siguiente ciudadano en el nicho geográfico del evento
exports.getNextVoterEvento = async (req, res) => {
    try {
        let campana_id = req.campaignId || req.campana_id || req.query.campana_id;
        if (!campana_id) {
            const firstCamp = await Campaign.findOne({ order: [['id', 'ASC']] });
            if (firstCamp) campana_id = firstCamp.id;
        }

        const { reunion_id, municipio, barrio, puesto, minFidelidad = 1 } = req.query;

        if (!reunion_id) {
            return res.status(400).json({ message: 'reunion_id es requerido para el modo evento' });
        }

        const where = campana_id ? { campana_id } : {};

        // Filtro geográfico de nicho
        if (municipio && municipio !== 'todos') {
            where.municipio = municipio;
        }
        if (puesto && puesto !== 'todos') {
            where.lugar_votacion = puesto;
        }
        if (barrio && barrio.trim()) {
            where.direccion = { [Op.like]: `%${barrio.trim()}%` };
        }
        if (minFidelidad && parseInt(minFidelidad, 10) > 1) {
            where.fidelidad_score = { [Op.gte]: parseInt(minFidelidad, 10) };
        }

        // Excluir votantes ya contactados para esta reunión específica en las últimas 24 horas
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentCalled = await CallCenterLog.findAll({
            where: {
                reunion_id,
                fecha_llamada: { [Op.gte]: twentyFourHoursAgo }
            },
            attributes: ['voter_id']
        });
        const calledIds = recentCalled.map(c => c.voter_id);

        if (calledIds.length > 0) {
            where.id = { [Op.notIn]: calledIds };
        }

        const totalEnNicho = await Voter.count({ where });

        const voter = await Voter.findOne({
            where,
            order: [
                ['fidelidad_score', 'DESC'],
                ['id', 'ASC']
            ]
        });

        if (!voter) {
            return res.json({
                message: 'No hay más ciudadanos en el nicho geográfico seleccionado',
                voter: null,
                totalEnNicho
            });
        }

        return res.json({ voter, totalEnNicho });
    } catch (e) {
        console.error('Error al obtener siguiente votante para evento:', e);
        return res.status(500).json({ message: 'Error en cola de llamadas para evento' });
    }
};

// 5. Registrar llamada de convocatoria para evento
exports.recordCallEvento = async (req, res) => {
    try {
        const {
            voter_id,
            reunion_id,
            resultado, // 'asiste_confirmado', 'apoya_no_asiste', 'deja_peticion', 'reagendar', 'no_contesta', 'no_le_interesa'
            cantidad_acompanantes = 0,
            notas,
            necesidad_peticion,
            duracion_segundos = 0
        } = req.body;

        const voter = await Voter.findByPk(voter_id);
        if (!voter) return res.status(404).json({ message: 'Votante no encontrado' });

        const reunion = await Reunion.findByPk(reunion_id);
        if (!reunion) return res.status(404).json({ message: 'Evento / Reunión no encontrada' });

        let campana_id = req.campaignId || req.campana_id || voter.campana_id || reunion.campana_id || 1;
        const acompanantesNum = parseInt(cantidad_acompanantes, 10) || 0;
        const asistenciaConfirmada = resultado === 'asiste_confirmado';

        // 1. Guardar log de llamada
        const log = await CallCenterLog.create({
            campana_id,
            voter_id: voter.id,
            usuario_id: req.user.id,
            tipo_campana: 'convocatoria_evento',
            reunion_id: reunion.id,
            evento_nombre: reunion.titulo,
            evento_lugar: `${reunion.lugar_nombre || ''} - ${reunion.direccion || ''}`,
            evento_fecha_hora: `${reunion.fecha} ${reunion.hora_inicio}`,
            asistencia_confirmada: asistenciaConfirmada,
            cantidad_acompanantes: acompanantesNum,
            necesidad_peticion: necesidad_peticion || null,
            resultado,
            notas: notas || null,
            duracion_segundos: parseInt(duracion_segundos, 10) || 0
        });

        // 2. Si confirmó asistencia, registrar en ReunionAsistente para control de acceso en puerta
        if (asistenciaConfirmada) {
            const telefono = voter.direccion?.includes('Tel:') 
                ? voter.direccion.replace(/.*Tel:\s*/, '').trim() 
                : voter.cedula;

            await ReunionAsistente.findOrCreate({
                where: {
                    reunion_id: reunion.id,
                    cedula: voter.cedula
                },
                defaults: {
                    reunion_id: reunion.id,
                    cedula: voter.cedula,
                    nombre_completo: `${voter.nombres} ${voter.apellidos}`.trim(),
                    telefono,
                    departamento: voter.departamento || reunion.departamento || '',
                    municipio: voter.municipio || reunion.municipio || '',
                    barrio: voter.barrio || voter.direccion || reunion.barrio_vereda || '',
                    lider_referido: voter.lider_nombre || 'Directo Call Center',
                    asistio: false, // se marca true al entrar a la puerta
                    observaciones: `Confirmado Call Center (+${acompanantesNum} acompañantes)`
                }
            });

            // Subir fidelidad del votante
            voter.fidelidad_score = Math.min(5, (voter.fidelidad_score || 3) + 1);
            await voter.save();
        }

        // 3. Si dejó petición o necesidad ciudadana, registrar en NecesidadCiudadana
        if (necesidad_peticion && necesidad_peticion.trim()) {
            try {
                await NecesidadCiudadana.create({
                    campana_id,
                    usuario_id: req.user.id,
                    ciudadano_nombre: `${voter.nombres} ${voter.apellidos}`,
                    ciudadano_cedula: voter.cedula,
                    ciudadano_telefono: voter.direccion?.includes('Tel:') ? voter.direccion.replace(/.*Tel:\s*/, '').trim() : '',
                    departamento: voter.departamento || reunion.departamento,
                    municipio: voter.municipio || reunion.municipio,
                    barrio_comuna: voter.direccion || reunion.barrio_vereda || 'Comunidad local',
                    categoria: 'comunitario',
                    titulo: `Petición para evento: ${reunion.titulo}`,
                    descripcion: necesidad_peticion,
                    prioridad: 'media',
                    estado: 'pendiente'
                });
            } catch (errNec) {
                console.warn('Aviso: no se pudo guardar en NecesidadCiudadana:', errNec.message);
            }
        }

        return res.status(201).json({
            message: 'Llamada de convocatoria registrada exitosamente',
            log,
            voter
        });
    } catch (e) {
        console.error('Error al registrar llamada de convocatoria:', e);
        return res.status(500).json({ message: 'Error al registrar llamada de evento' });
    }
};

// 6. Auditoría integral, trazabilidad de acciones y lista de puerta (Check-in) para un evento
exports.getEventoAuditoria = async (req, res) => {
    try {
        const { reunionId } = req.params;
        const reunion = await Reunion.findByPk(reunionId);
        if (!reunion) return res.status(404).json({ message: 'Evento no encontrado' });

        // Todas las llamadas realizadas para este evento
        const logs = await CallCenterLog.findAll({
            where: { reunion_id: reunionId },
            include: [
                { model: Voter, attributes: ['id', 'nombres', 'apellidos', 'cedula', 'municipio', 'direccion', 'lugar_votacion', 'lider_nombre'] },
                { model: User, as: 'operador', attributes: ['id', 'username', 'email', 'role'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        const totalLlamadas = logs.length;
        const confirmadosLogs = logs.filter(l => l.asistencia_confirmada);
        const totalConfirmados = confirmadosLogs.length;
        const totalAcompanantes = confirmadosLogs.reduce((acc, curr) => acc + (curr.cantidad_acompanantes || 0), 0);
        const aforoProyectado = totalConfirmados + totalAcompanantes;
        const capacidadSalon = reunion.aforo_estimado || 100;
        const porcentajeAforo = Math.round((aforoProyectado / capacidadSalon) * 100);

        const apoyaNoAsiste = logs.filter(l => l.resultado === 'apoya_no_asiste').length;
        const dejaPeticion = logs.filter(l => l.resultado === 'deja_peticion' || !!l.necesidad_peticion).length;
        const noContesta = logs.filter(l => l.resultado === 'no_contesta').length;
        const reagendados = logs.filter(l => l.resultado === 'reagendar').length;
        const noLeInteresa = logs.filter(l => l.resultado === 'no_le_interesa' || l.resultado === 'en_contra').length;

        const tasaAceptacion = totalLlamadas > 0 ? Math.round(((totalConfirmados + apoyaNoAsiste) / totalLlamadas) * 100) : 0;

        // Desglose por Operador
        const operadoresMap = {};
        logs.forEach(l => {
            const opName = l.operador?.username || `Operador #${l.usuario_id}`;
            if (!operadoresMap[opName]) {
                operadoresMap[opName] = { nombre: opName, llamadas: 0, confirmados: 0, noContesta: 0 };
            }
            operadoresMap[opName].llamadas++;
            if (l.asistencia_confirmada) operadoresMap[opName].confirmados++;
            if (l.resultado === 'no_contesta') operadoresMap[opName].noContesta++;
        });
        const operadoresStats = Object.values(operadoresMap);

        // Lista de Puerta (Check-In) desde ReunionAsistente
        const listaPuerta = await ReunionAsistente.findAll({
            where: { reunion_id: reunionId },
            order: [['nombre_completo', 'ASC']]
        });

        return res.json({
            evento: reunion,
            kpis: {
                total_llamadas: totalLlamadas,
                confirmados_directos: totalConfirmados,
                acompanantes_estimados: totalAcompanantes,
                aforo_proyectado: aforoProyectado,
                capacidad_salon: capacidadSalon,
                porcentaje_aforo_cubierto: porcentajeAforo,
                apoya_no_asiste: apoyaNoAsiste,
                deja_peticion: dejaPeticion,
                no_contesta: noContesta,
                reagendados: reagendados,
                no_le_interesa: noLeInteresa,
                tasa_aceptacion_pct: tasaAceptacion
            },
            operadores: operadoresStats,
            bitacora: logs.map(l => ({
                id: l.id,
                fecha: l.createdAt,
                operador: l.operador?.username || `ID ${l.usuario_id}`,
                votante: l.Voter ? `${l.Voter.nombres} ${l.Voter.apellidos}` : 'Ciudadano',
                cedula: l.Voter?.cedula || '',
                telefono: l.Voter?.direccion?.includes('Tel:') ? l.Voter.direccion.replace(/.*Tel:\s*/, '').trim() : l.Voter?.cedula || '',
                barrio_sector: l.Voter?.direccion || l.Voter?.municipio || 'Local',
                resultado: l.resultado,
                confirmado: l.asistencia_confirmada,
                acompanantes: l.cantidad_acompanantes || 0,
                notas: l.notas,
                peticion: l.necesidad_peticion
            })),
            lista_puerta: listaPuerta
        });
    } catch (e) {
        console.error('Error al obtener auditoría de evento:', e);
        return res.status(500).json({ message: 'Error al consultar auditoría del evento' });
    }
};
