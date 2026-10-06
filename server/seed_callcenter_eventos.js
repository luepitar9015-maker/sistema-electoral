const sequelize = require('./database/db');
const Campaign = require('./models/Campaign');
const Reunion = require('./models/Reunion');
const Voter = require('./models/Voter');
const User = require('./models/User');
const CallCenterLog = require('./models/CallCenterLog');
const ReunionAsistente = require('./models/ReunionAsistente');

async function seedCallCenterEventos() {
    console.log('--- SEMBRANDO EVENTOS Y CONVOCATORIA PARA CALL CENTER ---');
    try {
        await sequelize.authenticate();

        let campana = await Campaign.findByPk(1);
        if (!campana) {
            campana = await Campaign.findOne();
        }
        if (!campana) {
            console.log('No se encontró campaña activa.');
            return;
        }

        const campana_id = campana.id;
        const adminUser = await User.findOne({ where: { role: 'admin' } }) || await User.findOne();

        // 1. Crear o buscar Reunión Comunitaria
        let reunion = await Reunion.findOne({
            where: {
                campana_id,
                titulo: 'Encuentro Ciudadano y Rendición de Cuentas - Comuna 13'
            }
        });

        if (!reunion) {
            reunion = await Reunion.create({
                campana_id,
                titulo: 'Encuentro Ciudadano y Rendición de Cuentas - Comuna 13',
                descripcion: 'Diálogo abierto con líderes comunitarios y vecinos del sector para priorizar proyectos de inversión social, seguridad y juventud.',
                fecha: '2026-10-25',
                hora_inicio: '18:30',
                hora_fin: '20:30',
                lugar_nombre: 'Salón Comunal San Javier',
                direccion: 'Calle 44 # 92-35',
                departamento: 'Antioquia',
                municipio: 'Medellín',
                barrio_vereda: 'San Javier',
                aforo_estimado: 120,
                presidida_por: 'candidato',
                estado: 'programada',
                creado_por: adminUser ? adminUser.id : null
            });
            console.log('Reunión comunitaria creada:', reunion.titulo);
        } else {
            console.log('Reunión comunitaria existente:', reunion.titulo);
        }

        // 2. Obtener votantes de la campaña para simular llamadas
        const votantes = await Voter.findAll({ where: { campana_id }, limit: 6 });
        if (votantes.length > 0 && adminUser) {
            // Limpiar llamadas previas de demo para esta reunion
            await CallCenterLog.destroy({ where: { reunion_id: reunion.id } });
            await ReunionAsistente.destroy({ where: { reunion_id: reunion.id } });

            const logsData = [
                {
                    voter: votantes[0],
                    resultado: 'asiste_confirmado',
                    asistencia_confirmada: true,
                    cantidad_acompanantes: 2,
                    notas: 'Asistirá con su esposo y su hija mayor. Muy motivada.',
                    necesidad_peticion: null
                },
                {
                    voter: votantes[1] || votantes[0],
                    resultado: 'asiste_confirmado',
                    asistencia_confirmada: true,
                    cantidad_acompanantes: 1,
                    notas: 'Líder comunal del sector. Llevará propuesta escrita de pavimentación.',
                    necesidad_peticion: 'Pavimentación de la carrera 93 entre calles 43 y 44.'
                },
                {
                    voter: votantes[2] || votantes[0],
                    resultado: 'apoya_no_asiste',
                    asistencia_confirmada: false,
                    cantidad_acompanantes: 0,
                    notas: 'Trabaja en turno nocturno, pero ratifica su respaldo total y pide que le envíen el acta de compromisos.',
                    necesidad_peticion: null
                },
                {
                    voter: votantes[3] || votantes[0],
                    resultado: 'deja_peticion',
                    asistencia_confirmada: false,
                    cantidad_acompanantes: 0,
                    notas: 'No puede ir personalmente pero solicita tratar la iluminación del parque.',
                    necesidad_peticion: 'Instalación de luminarias LED en el parque infantil de San Javier.'
                },
                {
                    voter: votantes[4] || votantes[0],
                    resultado: 'no_contesta',
                    asistencia_confirmada: false,
                    cantidad_acompanantes: 0,
                    notas: 'Timbró 5 veces y entró a buzón.',
                    necesidad_peticion: null
                }
            ];

            for (const item of logsData) {
                await CallCenterLog.create({
                    campana_id,
                    voter_id: item.voter.id,
                    usuario_id: adminUser.id,
                    tipo_campana: 'convocatoria_evento',
                    reunion_id: reunion.id,
                    evento_nombre: reunion.titulo,
                    evento_lugar: `${reunion.lugar_nombre} - ${reunion.direccion}`,
                    evento_fecha_hora: `${reunion.fecha} ${reunion.hora_inicio}`,
                    asistencia_confirmada: item.asistencia_confirmada,
                    cantidad_acompanantes: item.cantidad_acompanantes,
                    necesidad_peticion: item.necesidad_peticion,
                    resultado: item.resultado,
                    notas: item.notas,
                    duracion_segundos: 65
                });

                if (item.asistencia_confirmada) {
                    await ReunionAsistente.create({
                        reunion_id: reunion.id,
                        cedula: item.voter.cedula,
                        nombre_completo: `${item.voter.nombres} ${item.voter.apellidos}`.trim(),
                        telefono: item.voter.cedula,
                        departamento: reunion.departamento,
                        municipio: reunion.municipio,
                        barrio: reunion.barrio_vereda,
                        lider_referido: 'Call Center Convocatoria',
                        asistio: false,
                        observaciones: `Confirmado Call Center (+${item.cantidad_acompanantes} acompañantes)`
                    });
                }
            }
            console.log('Se sembraron 5 llamadas de convocatoria y asistentes en puerta de demo.');
        }

        console.log('--- SEED CALL CENTER EVENTOS COMPLETADO ---');
    } catch (e) {
        console.error('Error al sembrar datos de call center eventos:', e);
    }
}

if (require.main === module) {
    seedCallCenterEventos().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}

module.exports = seedCallCenterEventos;
