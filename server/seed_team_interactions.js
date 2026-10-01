const sequelize = require('./database/db');
const User = require('./models/User');
const SocialMediaPost = require('./models/SocialMediaPost');
const SocialTeamAccount = require('./models/SocialTeamAccount');
const SocialTeamInteraction = require('./models/SocialTeamInteraction');
const bcrypt = require('bcrypt');

async function seedTeamInteractions() {
    try {
        await sequelize.sync();

        // 1. Asegurar usuarios del equipo de campaña en la BD
        const defaultPassword = await bcrypt.hash('123456', 10);

        const teamUsersData = [
            {
                nombre: 'Dr. Alejandro Gaviria',
                email: 'candidato@campana.com',
                telefono: '+57 310 987 6543',
                role: 'candidato',
                campana_id: 1,
                password: defaultPassword
            },
            {
                nombre: 'Dra. Valentina Morales - Jefe de Prensa',
                email: 'prensa@campana.com',
                telefono: '+57 315 444 3322',
                role: 'apoyo_bd',
                campana_id: 1,
                password: defaultPassword
            },
            {
                nombre: 'Santiago Ríos - Estratega Digital',
                email: 'redes@campana.com',
                telefono: '+57 320 888 7766',
                role: 'apoyo_bd',
                campana_id: 1,
                password: defaultPassword
            },
            {
                nombre: 'Lucía Fernández - Coordinadora Territorial',
                email: 'territorial@campana.com',
                telefono: '+57 311 222 9900',
                role: 'lider',
                campana_id: 1,
                password: defaultPassword
            }
        ];

        for (const uData of teamUsersData) {
            const exists = await User.findOne({ where: { email: uData.email } });
            if (!exists) {
                await User.create(uData);
                console.log(`Usuario creado: ${uData.nombre}`);
            }
        }

        // Obtener todos los usuarios del equipo
        const allUsers = await User.findAll();
        const userMap = {};
        allUsers.forEach(u => {
            userMap[u.email] = u;
        });

        // 2. Asociar cuentas del equipo con usuarios de la BD si aún no están vinculadas
        const teamAccounts = await SocialTeamAccount.findAll();
        for (const acc of teamAccounts) {
            if (!acc.user_id) {
                if (acc.nombre_miembro.includes('Mariana Gómez') && userMap['avanzada@campana.com']) {
                    acc.user_id = userMap['avanzada@campana.com'].id;
                    await acc.save();
                } else if (acc.nombre_miembro.includes('Carlos Mario') && userMap['orador@campana.com']) {
                    acc.user_id = userMap['orador@campana.com'].id;
                    await acc.save();
                } else if (acc.nombre_miembro.includes('Santiago') && userMap['redes@campana.com']) {
                    acc.user_id = userMap['redes@campana.com'].id;
                    await acc.save();
                } else if (acc.nombre_miembro.includes('Valentina') && userMap['prensa@campana.com']) {
                    acc.user_id = userMap['prensa@campana.com'].id;
                    await acc.save();
                }
            }
        }

        // 3. Crear interacciones reales del equipo en los posts existentes
        const posts = await SocialMediaPost.findAll();
        if (posts.length > 0) {
            await SocialTeamInteraction.destroy({ where: {} }); // reset para tener datos consistentes y limpios

            const now = new Date().toISOString().slice(0, 16).replace('T', ' ');

            const sampleInteractions = [
                // Para el post 1 (Reactivación económica)
                {
                    campana_id: posts[0].campana_id,
                    post_id: posts[0].id,
                    user_id: userMap['avanzada@campana.com'] ? userMap['avanzada@campana.com'].id : null,
                    nombre_miembro: 'Mariana Gómez',
                    rol_equipo: 'Coordinadora de Avanzada',
                    usuario_handle: '@marianagomez_col',
                    plataforma: posts[0].plataforma,
                    tipo_reaccion: 'me_encanta',
                    comento: true,
                    texto_comentario: '¡Excelente propuesta para el empleo juvenil! Desde la avanzada comunal ya estamos socializando estos 5 pilares en los barrios populares.',
                    compartio: true,
                    url_compartido: 'https://instagram.com/stories/marianagomez_col/345',
                    fecha_interaccion: now
                },
                {
                    campana_id: posts[0].campana_id,
                    post_id: posts[0].id,
                    user_id: userMap['orador@campana.com'] ? userMap['orador@campana.com'].id : null,
                    nombre_miembro: 'Dr. Carlos Mario Restrepo',
                    rol_equipo: 'Orador y Vocero Político',
                    usuario_handle: '@carlosmariovocero',
                    plataforma: posts[0].plataforma,
                    tipo_reaccion: 'like',
                    comento: true,
                    texto_comentario: 'Propuesta sólida y con sustento fiscal real. ¡Todo el equipo apoyando la reactivación económica!',
                    compartio: true,
                    url_compartido: 'https://twitter.com/carlosmariovocero/status/9871',
                    fecha_interaccion: now
                },
                {
                    campana_id: posts[0].campana_id,
                    post_id: posts[0].id,
                    user_id: userMap['redes@campana.com'] ? userMap['redes@campana.com'].id : null,
                    nombre_miembro: 'Santiago Ríos',
                    rol_equipo: 'Estratega Digital',
                    usuario_handle: '@santiagocampaña',
                    plataforma: posts[0].plataforma,
                    tipo_reaccion: 'apoyo',
                    comento: true,
                    texto_comentario: 'Pauta y viralización en marcha en Santander y Antioquia. ¡A romper el algoritmo con este mensaje!',
                    compartio: true,
                    url_compartido: 'https://facebook.com/santiagocampaña/posts/102',
                    fecha_interaccion: now
                },
                {
                    campana_id: posts[0].campana_id,
                    post_id: posts[0].id,
                    user_id: userMap['territorial@campana.com'] ? userMap['territorial@campana.com'].id : null,
                    nombre_miembro: 'Lucía Fernández',
                    rol_equipo: 'Coordinadora Territorial',
                    usuario_handle: '@luciafernandez_lider',
                    plataforma: posts[0].plataforma,
                    tipo_reaccion: 'me_encanta',
                    comento: false,
                    texto_comentario: null,
                    compartio: true,
                    url_compartido: 'https://whatsapp.com/channel/0029',
                    fecha_interaccion: now
                },
                {
                    campana_id: posts[0].campana_id,
                    post_id: posts[0].id,
                    user_id: userMap['prensa@campana.com'] ? userMap['prensa@campana.com'].id : null,
                    nombre_miembro: 'Dra. Valentina Morales',
                    rol_equipo: 'Jefe de Prensa',
                    usuario_handle: '@valentinaprensa',
                    plataforma: posts[0].plataforma,
                    tipo_reaccion: 'like',
                    comento: true,
                    texto_comentario: 'Boletín de prensa oficial despachado a Caracol, RCN y medios regionales con este contenido.',
                    compartio: true,
                    url_compartido: 'https://twitter.com/valentinaprensa/status/7762',
                    fecha_interaccion: now
                }
            ];

            // Si hay post 2 (En Vivo TikTok)
            if (posts.length > 1) {
                sampleInteractions.push(
                    {
                        campana_id: posts[1].campana_id,
                        post_id: posts[1].id,
                        user_id: userMap['avanzada@campana.com'] ? userMap['avanzada@campana.com'].id : null,
                        nombre_miembro: 'Mariana Gómez',
                        rol_equipo: 'Coordinadora de Avanzada',
                        usuario_handle: '@marianagomez_col',
                        plataforma: posts[1].plataforma,
                        tipo_reaccion: 'me_encanta',
                        comento: true,
                        texto_comentario: '¡Estamos en vivo desde Aranjuez! Más de 300 personas conectadas y respondiendo preguntas en directo.',
                        compartio: true,
                        url_compartido: 'https://tiktok.com/@marianagomez/live_share',
                        fecha_interaccion: now
                    },
                    {
                        campana_id: posts[1].campana_id,
                        post_id: posts[1].id,
                        user_id: userMap['redes@campana.com'] ? userMap['redes@campana.com'].id : null,
                        nombre_miembro: 'Santiago Ríos',
                        rol_equipo: 'Estratega Digital',
                        usuario_handle: '@santiagocampaña',
                        plataforma: posts[1].plataforma,
                        tipo_reaccion: 'apoyo',
                        comento: true,
                        texto_comentario: 'Monitoreando comentarios en tiempo real para filtrar preguntas prioritarias al candidato.',
                        compartio: true,
                        url_compartido: 'https://instagram.com/santiagocampaña',
                        fecha_interaccion: now
                    },
                    {
                        campana_id: posts[1].campana_id,
                        post_id: posts[1].id,
                        user_id: userMap['orador@campana.com'] ? userMap['orador@campana.com'].id : null,
                        nombre_miembro: 'Dr. Carlos Mario Restrepo',
                        rol_equipo: 'Orador y Vocero Político',
                        usuario_handle: '@carlosmariovocero',
                        plataforma: posts[1].plataforma,
                        tipo_reaccion: 'like',
                        comento: false,
                        texto_comentario: null,
                        compartio: true,
                        url_compartido: null,
                        fecha_interaccion: now
                    }
                );
            }

            // Si hay post 3
            if (posts.length > 2) {
                sampleInteractions.push(
                    {
                        campana_id: posts[2].campana_id,
                        post_id: posts[2].id,
                        user_id: userMap['prensa@campana.com'] ? userMap['prensa@campana.com'].id : null,
                        nombre_miembro: 'Dra. Valentina Morales',
                        rol_equipo: 'Jefe de Prensa',
                        usuario_handle: '@valentinaprensa',
                        plataforma: posts[2].plataforma,
                        tipo_reaccion: 'like',
                        comento: true,
                        texto_comentario: 'Excelente aclaración frente a la desinformación de la oposición. Muy oportuno.',
                        compartio: true,
                        url_compartido: 'https://twitter.com/valentinaprensa/repost/100',
                        fecha_interaccion: now
                    },
                    {
                        campana_id: posts[2].campana_id,
                        post_id: posts[2].id,
                        user_id: userMap['territorial@campana.com'] ? userMap['territorial@campana.com'].id : null,
                        nombre_miembro: 'Lucía Fernández',
                        rol_equipo: 'Coordinadora Territorial',
                        usuario_handle: '@luciafernandez_lider',
                        plataforma: posts[2].plataforma,
                        tipo_reaccion: 'me_encanta',
                        comento: true,
                        texto_comentario: 'Compartido en los 45 grupos de WhatsApp de líderes barriales.',
                        compartio: true,
                        url_compartido: 'https://whatsapp.com/broadcast',
                        fecha_interaccion: now
                    }
                );
            }

            await SocialTeamInteraction.bulkCreate(sampleInteractions);
            console.log(`Se sembraron ${sampleInteractions.length} interacciones de miembros del equipo.`);
        }

        console.log('Seed de interacciones del equipo finalizado con éxito.');
        process.exit(0);
    } catch (error) {
        console.error('Error en seed de interacciones:', error);
        process.exit(1);
    }
}

seedTeamInteractions();
