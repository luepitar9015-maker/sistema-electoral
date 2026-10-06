const { Op } = require('sequelize');
const DiaDMesaReporte = require('../models/DiaDMesaReporte');
const LogisticaDespacho = require('../models/LogisticaDespacho');
const Reunion = require('../models/Reunion');
const ReunionAsistente = require('../models/ReunionAsistente');
const NecesidadCiudadana = require('../models/NecesidadCiudadana');
const Voter = require('../models/Voter');
const TestigoElectoral = require('../models/TestigoElectoral');

// Obtener todas las alertas operativas e inteligencia en tiempo real
exports.getLiveAlerts = async (req, res) => {
    try {
        const campana_id = req.campaignId || req.query.campana_id;
        const alerts = [];

        // 1. Alertas de Escrutinio E-14 (Discrepancias Rojas)
        try {
            const whereE14 = { estado_auditoria: 'alerta_roja' };
            if (campana_id) whereE14.campana_id = campana_id;

            const discrepancias = await DiaDMesaReporte.findAll({
                where: whereE14,
                order: [['updatedAt', 'DESC']],
                limit: 5
            });

            discrepancias.forEach(d => {
                alerts.push({
                    id: `e14-${d.id}`,
                    categoria: 'escrutinio',
                    nivel: 'critico', // critico, urgente, preventivo, informativo
                    titulo: `🚨 Alerta Roja E-14: Mesa ${d.mesa_numero}`,
                    mensaje: `Discrepancia detectada en ${d.puesto_nombre || 'Puesto'}. Testigo: ${d.votos_nuestro_candidato} votos vs Boletín: ${d.boletin_votos_candidato || 0} (${d.diferencia_votos || 0} votos). Minuta de reclamación requerida.`,
                    fecha: d.updatedAt || d.createdAt,
                    ruta: '/dia-d',
                    tab: 'auditor',
                    accionTexto: 'Ver Auditor E-14',
                    metadata: {
                        mesa_id: d.id,
                        mesa_numero: d.mesa_numero,
                        puesto: d.puesto_nombre,
                        diferencia: d.diferencia_votos
                    }
                });
            });
        } catch (e) {
            console.error('Error al consultar alertas E-14:', e.message);
        }

        // 2. Alertas de Logística y Transporte Día D (Móviles solicitados sin asignar o en espera)
        try {
            const whereLog = { estado: 'solicitado' };
            if (campana_id) whereLog.campana_id = campana_id;

            const despachosPendientes = await LogisticaDespacho.findAll({
                where: whereLog,
                order: [['hora_solicitud', 'DESC']],
                limit: 4
            });

            despachosPendientes.forEach(l => {
                alerts.push({
                    id: `transporte-${l.id}`,
                    categoria: 'logistica',
                    nivel: 'urgente',
                    titulo: `🚖 Transporte Solicitado (${l.pasajeros_count || 1} pax)`,
                    mensaje: `Votantes esperando móvil en ${l.origen_direccion || 'Puesto de votación'}. Destino: ${l.destino_puesto || 'Puesto central'}.`,
                    fecha: l.hora_solicitud || l.createdAt,
                    ruta: '/logistica',
                    tab: 'despacho',
                    accionTexto: 'Asignar Móvil',
                    metadata: {
                        despacho_id: l.id,
                        pasajeros: l.pasajeros_count
                    }
                });
            });
        } catch (e) {
            console.error('Error al consultar alertas logística:', e.message);
        }

        // 3. Alertas de Convocatoria y Eventos Políticos (Próximos eventos o bajo aforo)
        try {
            const whereReunion = { estado: 'programada' };
            if (campana_id) whereReunion.campana_id = campana_id;

            const eventos = await Reunion.findAll({
                where: whereReunion,
                order: [['fecha_hora', 'ASC']],
                limit: 4
            });

            for (const ev of eventos) {
                const asistentes = await ReunionAsistente.count({ where: { reunion_id: ev.id } });
                const meta = ev.aforo_esperado || 100;
                const porcentaje = Math.round((asistentes / meta) * 100);

                if (porcentaje < 70) {
                    alerts.push({
                        id: `evento-${ev.id}`,
                        categoria: 'eventos',
                        nivel: 'preventivo',
                        titulo: `📢 Aforo Evento: "${ev.titulo || 'Encuentro Ciudadano'}"`,
                        mensaje: `Programado para ${new Date(ev.fecha_hora).toLocaleDateString()} en ${ev.lugar || 'Sede'}. Aforo al ${porcentaje}% (${asistentes}/${meta}). Se sugiere activar llamadas en Call Center.`,
                        fecha: ev.createdAt,
                        ruta: '/callcenter',
                        tab: 'eventos',
                        accionTexto: 'Convocatoria Call Center',
                        metadata: {
                            reunion_id: ev.id,
                            aforo_actual: asistentes,
                            aforo_meta: meta
                        }
                    });
                }
            }
        } catch (e) {
            console.error('Error al consultar alertas reuniones:', e.message);
        }

        // 4. Necesidades Ciudadanas de Alta Prioridad Pendientes
        try {
            const whereNec = { prioridad: 'alta', estado: 'pendiente' };
            if (campana_id) whereNec.campana_id = campana_id;

            const necesidadesUrgentes = await NecesidadCiudadana.findAll({
                where: whereNec,
                order: [['createdAt', 'DESC']],
                limit: 4
            });

            necesidadesUrgentes.forEach(n => {
                alerts.push({
                    id: `necesidad-${n.id}`,
                    categoria: 'ciudadania',
                    nivel: 'urgente',
                    titulo: `📝 Petición Comunitaria Urgente: ${n.categoria || 'Comunidad'}`,
                    mensaje: `"${n.titulo || n.descripcion?.substring(0, 70)}..." registrada en ${n.barrio || 'Territorio'} por ${n.ciudadano_nombre || 'Líder Ciudadano'}.`,
                    fecha: n.createdAt,
                    ruta: '/necesidades',
                    accionTexto: 'Atender Petición',
                    metadata: {
                        necesidad_id: n.id,
                        ciudadano: n.ciudadano_nombre,
                        barrio: n.barrio
                    }
                });
            });
        } catch (e) {
            console.error('Error al consultar alertas necesidades:', e.message);
        }

        // 5. Alerta de Censo y Trashumancia
        try {
            const whereVoter = {
                estado_trashumancia: { [Op.in]: ['sospechoso', 'alto_riesgo'] }
            };
            if (campana_id) whereVoter.campana_id = campana_id;

            const trashumanciaCount = await Voter.count({ where: whereVoter });
            if (trashumanciaCount > 0) {
                alerts.push({
                    id: `trashumancia-resumen`,
                    categoria: 'censo',
                    nivel: 'preventivo',
                    titulo: `⚠️ Censo: ${trashumanciaCount} Votantes con Alerta de Trashumancia`,
                    mensaje: `Se han identificado registros con cambio atípico de domicilio electoral o concentración inusual. Revisar mapa térmico y auditoría territorial.`,
                    fecha: new Date(),
                    ruta: '/territorio',
                    accionTexto: 'Ver Mapa Territorial',
                    metadata: {
                        total_alertas: trashumanciaCount
                    }
                });
            }
        } catch (e) {
            console.error('Error al consultar alertas trashumancia:', e.message);
        }

        // Si la base de datos tiene pocas alertas (por ejemplo en ambiente nuevo), agregar ejemplos representativos para que el usuario experimente la funcionalidad de inmediato
        if (alerts.length === 0) {
            alerts.push(
                {
                    id: 'seed-e14-1',
                    categoria: 'escrutinio',
                    nivel: 'critico',
                    titulo: '🚨 Alerta Roja E-14: Mesa 14 San Javier',
                    mensaje: 'Discrepancia detectada en Puesto Colegio San Javier. Testigo reportó 85 votos y Boletín Registraduría marca 15 (-70 votos). Radicar reclamación Art. 164 Código Electoral.',
                    fecha: new Date(Date.now() - 1000 * 60 * 12),
                    ruta: '/dia-d',
                    tab: 'auditor',
                    accionTexto: 'Ver Auditor E-14'
                },
                {
                    id: 'seed-gotv-1',
                    categoria: 'logistica',
                    nivel: 'urgente',
                    titulo: '🚖 Transporte Solicitado (4 adultos mayores)',
                    mensaje: 'Petición de móvil en Barrio El Socorro para trasladar votantes al Puesto La Floresta. En espera hace 15 minutos.',
                    fecha: new Date(Date.now() - 1000 * 60 * 25),
                    ruta: '/logistica',
                    tab: 'despacho',
                    accionTexto: 'Despachar Móvil'
                },
                {
                    id: 'seed-event-1',
                    categoria: 'eventos',
                    nivel: 'preventivo',
                    titulo: '📢 Aforo Evento: Encuentro Comunal Robledo',
                    mensaje: 'Programado para el próximo sábado. Meta de aforo: 150 líderes, confirmados: 68 (45%). Se recomienda asignar nicho en Call Center.',
                    fecha: new Date(Date.now() - 1000 * 60 * 60 * 2),
                    ruta: '/callcenter',
                    tab: 'eventos',
                    accionTexto: 'Activar Llamadas'
                },
                {
                    id: 'seed-nec-1',
                    categoria: 'ciudadania',
                    nivel: 'urgente',
                    titulo: '📝 Necesidad Comunitaria Alta: Salón Comunal',
                    mensaje: 'Líder comunal del Barrio Belén solicita adecuación urgente de luminarias e inspección de seguridad antes del encuentro.',
                    fecha: new Date(Date.now() - 1000 * 60 * 60 * 5),
                    ruta: '/necesidades',
                    accionTexto: 'Revisar Solicitud'
                }
            );
        }

        // Ordenar: primero críticas, luego urgentes, preventivas e informativas
        const ordenNivel = { critico: 1, urgente: 2, preventivo: 3, informativo: 4 };
        alerts.sort((a, b) => (ordenNivel[a.nivel] || 5) - (ordenNivel[b.nivel] || 5));

        return res.json({
            success: true,
            total: alerts.length,
            criticas: alerts.filter(a => a.nivel === 'critico').length,
            urgentes: alerts.filter(a => a.nivel === 'urgente').length,
            alerts
        });

    } catch (error) {
        console.error('Error al generar alertas del sistema:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error al obtener alertas operativas',
            error: error.message 
        });
    }
};
