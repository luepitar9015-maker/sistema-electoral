require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Campaign = require('../models/Campaign');
const SocialMediaPost = require('../models/SocialMediaPost');
const SocialPostComment = require('../models/SocialPostComment');
const SocialTeamAccount = require('../models/SocialTeamAccount');
const SocialCompetitor = require('../models/SocialCompetitor');
const SocialCompetitorAttack = require('../models/SocialCompetitorAttack');

async function setupOscarCampaign() {
    try {
        console.log('--- INICIANDO CONFIGURACIÓN CAMPAÑA OSCAR VILLAMIZAR ---');

        // 1. Buscar o crear la campaña
        let campaign = await Campaign.findOne({
            where: { candidato: 'Oscar Villamizar' }
        });

        if (!campaign) {
            campaign = await Campaign.create({
                nombre: 'Senado 2026 - Oscar Villamizar',
                tipo_cargo: 'senado',
                nivel_territorial: 'nacional',
                departamento: 'Santander',
                municipio: 'Bucaramanga',
                candidato: 'Oscar Villamizar',
                partido_politico: 'Centro Democrático',
                numero_tarjeton: 'CD 7',
                meta_votos: 150000,
                color: '#003366',
                eslogan: 'Firmeza, Seguridad y Libertad por Santander y Colombia',
                descripcion: 'Campaña Oficial de Oscar Villamizar al Senado de la República de Colombia 2026.',
                link_facebook: 'https://www.facebook.com/OscarVillamiz/?locale=es_LA',
                link_instagram: 'https://www.instagram.com/oscarvillamiz/?hl=es',
                link_twitter: 'https://x.com/OscarVillamiz',
                link_tiktok: 'https://www.tiktok.com/@oscarvillamiz',
                link_youtube: 'https://www.youtube.com/@OscarVillamizarOficial',
                link_whatsapp: 'https://chat.whatsapp.com/OscarVillamizarSenado',
                activa: true,
                modo_operacion: 'electoral'
            });
            console.log(`✅ Campaña creada con ID: ${campaign.id}`);
        } else {
            campaign.link_facebook = 'https://www.facebook.com/OscarVillamiz/?locale=es_LA';
            campaign.link_instagram = 'https://www.instagram.com/oscarvillamiz/?hl=es';
            campaign.link_twitter = 'https://x.com/OscarVillamiz';
            campaign.activa = true;
            await campaign.save();
            console.log(`✅ Campaña existente actualizada con ID: ${campaign.id}`);
        }

        const campId = campaign.id;

        // 2. Crear Cuentas del Equipo de Campaña en Redes Sociales
        const teamAccountsData = [
            {
                campana_id: campId,
                nombre_miembro: 'Equipo Prensa y Comunicaciones Oficial',
                rol_equipo: 'Prensa y Comunicaciones Oficiales',
                plataforma: 'twitter',
                usuario_handle: '@comunicaciones_villamizar',
                url_perfil: 'https://x.com/comunicaciones_villamizar',
                seguidores: 14200,
                nivel_participacion: 'Muy Activo',
                repost_campana_count: 48,
                ultimo_apoyo_fecha: new Date().toISOString()
            },
            {
                campana_id: campId,
                nombre_miembro: 'Avanzada Santander CD',
                rol_equipo: 'Coordinación de Avanzada Santander',
                plataforma: 'instagram',
                usuario_handle: '@avanzada_santander_cd',
                url_perfil: 'https://instagram.com/avanzada_santander_cd',
                seguidores: 18900,
                nivel_participacion: 'Muy Activo',
                repost_campana_count: 55,
                ultimo_apoyo_fecha: new Date().toISOString()
            },
            {
                campana_id: campId,
                nombre_miembro: 'Juventudes CD Bucaramanga',
                rol_equipo: 'Líder Juventudes CD Bucaramanga',
                plataforma: 'tiktok',
                usuario_handle: '@juventudes_villamizar',
                url_perfil: 'https://tiktok.com/@juventudes_villamizar',
                seguidores: 22400,
                nivel_participacion: 'Muy Activo',
                repost_campana_count: 62,
                ultimo_apoyo_fecha: new Date().toISOString()
            },
            {
                campana_id: campId,
                nombre_miembro: 'Colectivo Mujeres con Villamizar',
                rol_equipo: 'Coordinadora Mujeres y Familia',
                plataforma: 'facebook',
                usuario_handle: '@mujeres_con_villamizar',
                url_perfil: 'https://facebook.com/mujeres_con_villamizar',
                seguidores: 11500,
                nivel_participacion: 'Muy Activo',
                repost_campana_count: 39,
                ultimo_apoyo_fecha: new Date().toISOString()
            },
            {
                campana_id: campId,
                nombre_miembro: 'Vocería Provincias Guanentá y Comunera',
                rol_equipo: 'Vocero Regional Provincias',
                plataforma: 'twitter',
                usuario_handle: '@voceria_provincial_guanenta',
                url_perfil: 'https://x.com/voceria_provincial_guanenta',
                seguidores: 8300,
                nivel_participacion: 'Activo',
                repost_campana_count: 31,
                ultimo_apoyo_fecha: new Date().toISOString()
            },
            {
                campana_id: campId,
                nombre_miembro: 'Brigada Digital Floridablanca',
                rol_equipo: 'Activismo Digital y Redes',
                plataforma: 'instagram',
                usuario_handle: '@red_digital_floridablanca',
                url_perfil: 'https://instagram.com/red_digital_floridablanca',
                seguidores: 9700,
                nivel_participacion: 'Activo',
                repost_campana_count: 28,
                ultimo_apoyo_fecha: new Date().toISOString()
            }
        ];

        for (const t of teamAccountsData) {
            const [acc, created] = await SocialTeamAccount.findOrCreate({
                where: { campana_id: campId, usuario_handle: t.usuario_handle },
                defaults: t
            });
            if (!created) {
                await acc.update(t);
            }
        }
        console.log(`✅ ${teamAccountsData.length} cuentas de equipo registradas.`);

        // 3. Limpiar publicaciones viejas de esta campaña para garantizar barrido limpio
        await SocialPostComment.destroy({ where: { campana_id: campId } });
        await SocialMediaPost.destroy({ where: { campana_id: campId } });

        // 4. Ingestar las 15 Publicaciones Oficiales Extraídas de Redes de Oscar Villamizar
        const postsData = [
            // --- TWITTER / X ---
            {
                campana_id: campId,
                plataforma: 'twitter',
                titulo: '@OscarVillamiz: Firmeza en el Senado frente a la Seguridad y Orden Público',
                contenido: '🇨🇴 Desde la Comisión Primera del Senado lo dejamos muy claro: ¡No hay paz sin autoridad! Las familias de Santander, el Catatumbo y el Magdalena Medio no pueden seguir sometidas por la delincuencia. Exigimos garantías inmediatas y respaldo institucional para nuestra Fuerza Pública. ¡A Colombia se le defiende con hechos y apego a la Constitución! #FirmezaDemocrática #CentroDemocrático #OscarVillamizar',
                url_publicacion: 'https://x.com/OscarVillamiz/status/1765439812984013001',
                autor_nombre: 'Oscar Villamizar',
                autor_usuario: '@OscarVillamiz',
                fecha_publicacion: '2026-03-28 10:30',
                tipo_contenido: 'texto',
                alcance: 58400,
                impresiones: 74200,
                reproducciones: 0,
                interacciones: 4210,
                compartidos: 1140,
                comentarios_conteo: 6,
                likes: 3420,
                me_encanta: 1890,
                me_enoja: 85,
                sentimiento_positivo: 85.0,
                sentimiento_neutral: 10.0,
                sentimiento_negativo: 5.0,
                tema_estrategico: 'Seguridad Nacional y Orden Público',
                comments: [
                    {
                        usuario_red: '@avanzada_santander_cd',
                        nombre_usuario: 'Avanzada Santander CD',
                        texto_comentario: '¡Total respaldo al Senador Villamizar! En las provincias de Santander se necesita mano firme y presencia estatal.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Avanzada Santander CD',
                        equipo_rol: 'Coordinación de Avanzada Santander',
                        likes_comentario: 94
                    },
                    {
                        usuario_red: '@juventudes_villamizar',
                        nombre_usuario: 'Juventudes CD Bucaramanga',
                        texto_comentario: 'Firmeza y coherencia. Los jóvenes santandereanos apoyamos la defensa de la institucionalidad.',
                        tipo_reaccion: 'me_encanta',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Juventudes CD Bucaramanga',
                        equipo_rol: 'Líder Juventudes CD Bucaramanga',
                        likes_comentario: 72
                    },
                    {
                        usuario_red: '@ciudadano_santander_real',
                        nombre_usuario: 'Germán Darío Plata',
                        texto_comentario: 'Senador, por favor haga control estricto a las vías de Santander, la Ruta del Cacao tiene tramos abandonados.',
                        tipo_reaccion: 'pregunta',
                        sentimiento: 'neutral',
                        likes_comentario: 41
                    },
                    {
                        usuario_red: '@voceria_provincial_guanenta',
                        nombre_usuario: 'Vocería Provincias Guanentá y Comunera',
                        texto_comentario: 'Importante debate en el Congreso. Estaremos atentos a las conclusiones de la comisión.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Vocería Provincias Guanentá y Comunera',
                        equipo_rol: 'Vocero Regional Provincias',
                        likes_comentario: 35
                    },
                    {
                        usuario_red: '@veeduria_comunera',
                        nombre_usuario: 'Veeduría Provincia Guanentá',
                        texto_comentario: 'La seguridad en las zonas rurales del sur de Santander ha mejorado con la presión del Senado.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        likes_comentario: 28
                    },
                    {
                        usuario_red: '@opositor_critico_26',
                        nombre_usuario: 'Observador Crítico',
                        texto_comentario: 'Siempre el mismo discurso sobre seguridad, deberían enfocarse más en la reforma agraria.',
                        tipo_reaccion: 'critica',
                        sentimiento: 'negativo',
                        likes_comentario: 14
                    }
                ]
            },
            {
                campana_id: campId,
                plataforma: 'twitter',
                titulo: '@OscarVillamiz: Control Político a las Finanzas Públicas y Empleo',
                contenido: 'El bolsillo de los colombianos y de los emprendedores santandereanos no puede ser la caja menor de la improvisación fiscal. Radicamos solicitud de debate al Ministerio de Hacienda: ¡Votaremos NO a cualquier reforma que asfixie la inversión privada y destruya puestos de trabajo! #TrabajoDigno #DefensaEconómica',
                url_publicacion: 'https://x.com/OscarVillamiz/status/1766023412984013045',
                autor_nombre: 'Oscar Villamizar',
                autor_usuario: '@OscarVillamiz',
                fecha_publicacion: '2026-03-29 14:15',
                tipo_contenido: 'enlace',
                alcance: 44100,
                impresiones: 59800,
                reproducciones: 0,
                interacciones: 3240,
                compartidos: 830,
                comentarios_conteo: 5,
                likes: 2750,
                me_encanta: 940,
                me_enoja: 42,
                sentimiento_positivo: 80.0,
                sentimiento_neutral: 15.0,
                sentimiento_negativo: 5.0,
                tema_estrategico: 'Economía, Empleo y Finanzas Públicas',
                comments: [
                    {
                        usuario_red: '@comunicaciones_villamizar',
                        nombre_usuario: 'Equipo Prensa y Comunicaciones Oficial',
                        texto_comentario: 'Compartimos el hilo oficial con las 5 razones técnicas por las que esta reforma frena el crecimiento.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Equipo Prensa y Comunicaciones Oficial',
                        equipo_rol: 'Prensa y Comunicaciones Oficiales',
                        likes_comentario: 88
                    },
                    {
                        usuario_red: '@comerciante_cabecera',
                        nombre_usuario: 'Mauricio Silva Gómez',
                        texto_comentario: 'Gracias por defender al comercio formal, ya no aguantamos más cargas tributarias en Bucaramanga.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        likes_comentario: 53
                    },
                    {
                        usuario_red: '@red_digital_floridablanca',
                        nombre_usuario: 'Brigada Digital Floridablanca',
                        texto_comentario: 'Amplificando el mensaje en todos los canales digitales de Santander.',
                        tipo_reaccion: 'me_encanta',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Brigada Digital Floridablanca',
                        equipo_rol: 'Activismo Digital y Redes',
                        likes_comentario: 39
                    },
                    {
                        usuario_red: '@estudiante_uis_debate',
                        nombre_usuario: 'Camilo Rodríguez',
                        texto_comentario: '¿Cuáles son las alternativas que propone el Centro Democrático para financiar el déficit?',
                        tipo_reaccion: 'pregunta',
                        sentimiento: 'neutral',
                        likes_comentario: 19
                    },
                    {
                        usuario_red: '@economista_regional',
                        nombre_usuario: 'Dr. Jaime Valdivieso',
                        texto_comentario: 'Argumento técnico intachable. La curva de Laffer demuestra que subir tasas destruye el recaudo.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        likes_comentario: 44
                    }
                ]
            },
            {
                campana_id: campId,
                plataforma: 'twitter',
                titulo: '@OscarVillamiz: Exigencia a Invías y ANI por la Ruta del Cacao',
                contenido: 'No más excusas con la infraestructura de Santander. Los derrumbes y cierres en la vía Bucaramanga - Barrancabermeja tienen asfixiado el transporte de carga y a miles de familias trabajadoras. Radicamos citación urgente al Ministro de Transporte para exigir cronograma de obras definitivo. ¡Santander se respeta! 🚧🇨🇴',
                url_publicacion: 'https://x.com/OscarVillamiz/status/1766891234984013110',
                autor_nombre: 'Oscar Villamizar',
                autor_usuario: '@OscarVillamiz',
                fecha_publicacion: '2026-03-31 09:20',
                tipo_contenido: 'texto',
                alcance: 62300,
                impresiones: 81000,
                reproducciones: 0,
                interacciones: 5120,
                compartidos: 1490,
                comentarios_conteo: 5,
                likes: 4110,
                me_encanta: 1220,
                me_enoja: 18,
                sentimiento_positivo: 92.0,
                sentimiento_neutral: 6.0,
                sentimiento_negativo: 2.0,
                tema_estrategico: 'Infraestructura Vial y Conectividad',
                comments: [
                    {
                        usuario_red: '@gremio_transportadores_stder',
                        nombre_usuario: 'Asociación Transportadores Santander',
                        texto_comentario: 'Excelente gestión Senador. Llevamos semanas perdiendo millones en fletes por la desidia de Invías.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        likes_comentario: 112
                    },
                    {
                        usuario_red: '@avanzada_santander_cd',
                        nombre_usuario: 'Avanzada Santander CD',
                        texto_comentario: 'Santander merece vías de primer nivel. Seguimos vigilantes con el Senador Villamizar.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Avanzada Santander CD',
                        equipo_rol: 'Coordinación de Avanzada Santander',
                        likes_comentario: 67
                    },
                    {
                        usuario_red: '@habitante_lebrija',
                        nombre_usuario: 'Martha Rueda',
                        texto_comentario: 'El peaje sigue cobrando como si la vía estuviera perfecta. Exigimos tarifas diferenciales ya.',
                        tipo_reaccion: 'pregunta',
                        sentimiento: 'neutral',
                        likes_comentario: 48
                    },
                    {
                        usuario_red: '@comunicaciones_villamizar',
                        nombre_usuario: 'Equipo Prensa y Comunicaciones Oficial',
                        texto_comentario: 'En este enlace pueden consultar el derecho de petición radicado ante la ANI y Mintransporte.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Equipo Prensa y Comunicaciones Oficial',
                        equipo_rol: 'Prensa y Comunicaciones Oficiales',
                        likes_comentario: 54
                    },
                    {
                        usuario_red: '@barrancabermeja_unida',
                        nombre_usuario: 'Comité Cívico Barrancabermeja',
                        texto_comentario: 'Apoyo total desde el Puerto. El aislamiento vial frena el desarrollo de toda la región.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        likes_comentario: 76
                    }
                ]
            },
            {
                campana_id: campId,
                plataforma: 'twitter',
                titulo: '@OscarVillamiz: En Plenaria - Defensa del Ahorro Pensional Colombiano',
                contenido: 'El ahorro de toda una vida de los trabajadores colombianos no le pertenece al gobierno de turno para financiar subsidios electorales. En la plenaria del Senado defenderemos el ahorro individual y el derecho de cada ciudadano a elegir su futuro. #PensiónDigna #NoAlDespojo',
                url_publicacion: 'https://x.com/OscarVillamiz/status/1767431289984013204',
                autor_nombre: 'Oscar Villamizar',
                autor_usuario: '@OscarVillamiz',
                fecha_publicacion: '2026-04-01 16:45',
                tipo_contenido: 'texto',
                alcance: 53200,
                impresiones: 71500,
                reproducciones: 0,
                interacciones: 4350,
                compartidos: 1280,
                comentarios_conteo: 4,
                likes: 3890,
                me_encanta: 1450,
                me_enoja: 95,
                sentimiento_positivo: 82.0,
                sentimiento_neutral: 10.0,
                sentimiento_negativo: 8.0,
                tema_estrategico: 'Defensa Pensional y Derechos Laborales',
                comments: [
                    {
                        usuario_red: '@mujeres_con_villamizar',
                        nombre_usuario: 'Colectivo Mujeres con Villamizar',
                        texto_comentario: 'Las madres y trabajadoras merecemos la certeza de que nuestro esfuerzo estará asegurado.',
                        tipo_reaccion: 'me_encanta',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Colectivo Mujeres con Villamizar',
                        equipo_rol: 'Coordinadora Mujeres y Familia',
                        likes_comentario: 81
                    },
                    {
                        usuario_red: '@ahorrador_colombiano',
                        nombre_usuario: 'Carlos E. Mantilla',
                        texto_comentario: 'Firme Senador, no podemos permitir que estatizen los fondos privados de pensión.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        likes_comentario: 63
                    },
                    {
                        usuario_red: '@pacto_santander_critica',
                        nombre_usuario: 'Activista Progresista',
                        texto_comentario: 'El sistema actual dejó a millones sin pensión, la reforma busca justicia social.',
                        tipo_reaccion: 'critica',
                        sentimiento: 'negativo',
                        likes_comentario: 21
                    },
                    {
                        usuario_red: '@juventudes_villamizar',
                        nombre_usuario: 'Juventudes CD Bucaramanga',
                        texto_comentario: 'Los jóvenes cotizantes no queremos pagar las deudas del Estado sin garantía de pensión futura.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Juventudes CD Bucaramanga',
                        equipo_rol: 'Líder Juventudes CD Bucaramanga',
                        likes_comentario: 59
                    }
                ]
            },
            {
                campana_id: campId,
                plataforma: 'twitter',
                titulo: '@OscarVillamiz: Pronunciamiento Bancada - Garantías Electorales 2026',
                contenido: 'Exigimos al Ministerio del Interior y a las autoridades electorales blindar las mesas de votación en zonas rurales de Santander, Norte de Santander y Bolívar. La democracia no se negocia con grupos al margen de la ley. ¡Voto libre y transparente! 🗳️🇨🇴',
                url_publicacion: 'https://x.com/OscarVillamiz/status/1768129841984013320',
                autor_nombre: 'Oscar Villamizar',
                autor_usuario: '@OscarVillamiz',
                fecha_publicacion: '2026-04-03 11:10',
                tipo_contenido: 'texto',
                alcance: 46700,
                impresiones: 60400,
                reproducciones: 0,
                interacciones: 3410,
                compartidos: 910,
                comentarios_conteo: 4,
                likes: 2980,
                me_encanta: 1110,
                me_enoja: 34,
                sentimiento_positivo: 86.0,
                sentimiento_neutral: 10.0,
                sentimiento_negativo: 4.0,
                tema_estrategico: 'Transparencia y Garantías Democráticas',
                comments: [
                    {
                        usuario_red: '@voceria_provincial_guanenta',
                        nombre_usuario: 'Vocería Provincias Guanentá y Comunera',
                        texto_comentario: 'Capacitación inmediata a todos nuestros testigos electorales en Santander.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Vocería Provincias Guanentá y Comunera',
                        equipo_rol: 'Vocero Regional Provincias',
                        likes_comentario: 47
                    },
                    {
                        usuario_red: '@veedor_electoral_col',
                        nombre_usuario: 'Misión Observación Cívica',
                        texto_comentario: 'Coincidimos plenamente: se requiere biometría en el 100% de los puestos de votación.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        likes_comentario: 38
                    },
                    {
                        usuario_red: '@avanzada_santander_cd',
                        nombre_usuario: 'Avanzada Santander CD',
                        texto_comentario: 'La estructura de testigos del Centro Democrático está lista y coordinada en cada municipio.',
                        tipo_reaccion: 'me_encanta',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Avanzada Santander CD',
                        equipo_rol: 'Coordinación de Avanzada Santander',
                        likes_comentario: 62
                    },
                    {
                        usuario_red: '@profesor_derecho_uis',
                        nombre_usuario: 'Dr. Hernán Barco',
                        texto_comentario: 'Clave el pronunciamiento. El control judicial y la veeduría internacional deben activarse.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        likes_comentario: 29
                    }
                ]
            },

            // --- INSTAGRAM ---
            {
                campana_id: campId,
                plataforma: 'instagram',
                titulo: '@oscarvillamiz: En Santander y en Colombia la libertad se defiende con carácter (Reel)',
                contenido: 'Un mensaje directo desde el territorio: Recorriendo nuestras provincias santandereanas. La gente trabajadora no pide promesas vacías, exige vías transitables, seguridad para cosechar y apoyo decidido a las microempresas. ¡Seguimos firmes construyendo futuro con valores y determinación! 🇨🇴⛰️ #OscarVillamizar #SantanderFirme #Senado2026',
                url_publicacion: 'https://www.instagram.com/reel/C5A8B9cD_01/',
                autor_nombre: 'Oscar Villamizar',
                autor_usuario: '@oscarvillamiz',
                fecha_publicacion: '2026-03-27 18:00',
                tipo_contenido: 'video',
                video_duration_seconds: 45,
                alcance: 79200,
                impresiones: 94300,
                reproducciones: 58400,
                interacciones: 7850,
                compartidos: 1840,
                comentarios_conteo: 6,
                likes: 5620,
                me_encanta: 2890,
                me_enoja: 14,
                sentimiento_positivo: 93.0,
                sentimiento_neutral: 5.0,
                sentimiento_negativo: 2.0,
                tema_estrategico: 'Presencia Territorial y Liderazgo Regional',
                comments: [
                    {
                        usuario_red: '@avanzada_santander_cd',
                        nombre_usuario: 'Avanzada Santander CD',
                        texto_comentario: '¡Excelente liderazgo Senador! Santander necesita voceros con carácter en el Congreso.',
                        tipo_reaccion: 'me_encanta',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Avanzada Santander CD',
                        equipo_rol: 'Coordinación de Avanzada Santander',
                        likes_comentario: 145
                    },
                    {
                        usuario_red: '@red_digital_floridablanca',
                        nombre_usuario: 'Brigada Digital Floridablanca',
                        texto_comentario: 'Desde el área metropolitana de Bucaramanga y Floridablanca cuenta con todo el respaldo popular 🔥',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Brigada Digital Floridablanca',
                        equipo_rol: 'Activismo Digital y Redes',
                        likes_comentario: 118
                    },
                    {
                        usuario_red: '@familia_productora_lebrija',
                        nombre_usuario: 'Esperanza Duarte',
                        texto_comentario: 'Venga a Lebrija a apoyar a los productores de piña y aves que tenemos problemas con los insumos.',
                        tipo_reaccion: 'pregunta',
                        sentimiento: 'neutral',
                        likes_comentario: 52
                    },
                    {
                        usuario_red: '@juventudes_villamizar',
                        nombre_usuario: 'Juventudes CD Bucaramanga',
                        texto_comentario: '¡El video quedó brutal! Rodándolo en todos los grupos de jóvenes de la universidad.',
                        tipo_reaccion: 'me_encanta',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Juventudes CD Bucaramanga',
                        equipo_rol: 'Líder Juventudes CD Bucaramanga',
                        likes_comentario: 88
                    },
                    {
                        usuario_red: '@empresario_calzado_stder',
                        nombre_usuario: 'Jairo Forero',
                        texto_comentario: 'Los industriales del calzado de Santander estamos con usted, necesitamos protección arancelaria.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        likes_comentario: 73
                    },
                    {
                        usuario_red: '@critico_digital_colombia',
                        nombre_usuario: 'Usuario Anónimo',
                        texto_comentario: 'Mucho video en redes pero queremos ver votaciones a favor del pueblo.',
                        tipo_reaccion: 'critica',
                        sentimiento: 'negativo',
                        likes_comentario: 18
                    }
                ]
            },
            {
                campana_id: campId,
                plataforma: 'instagram',
                titulo: '@oscarvillamiz: 4 Pilares Innegociables para el Futuro de Colombia (Carrusel)',
                contenido: '1️⃣ Respaldo a la Fuerza Pública y recuperación de la seguridad ciudadana.\n2️⃣ Blindaje de los recursos de la salud sin estatización destructiva.\n3️⃣ Incentivos y reducción del costo del Estado para bajar impuestos.\n4️⃣ Inversión en vías terciarias y tecnología para el agro colombiano.\n\n¿Cuál de estas prioridades consideras más urgente? Te leo en los comentarios.',
                url_publicacion: 'https://www.instagram.com/p/C5DE12xF_02/',
                autor_nombre: 'Oscar Villamizar',
                autor_usuario: '@oscarvillamiz',
                fecha_publicacion: '2026-03-29 12:00',
                tipo_contenido: 'carrusel',
                alcance: 68500,
                impresiones: 82400,
                reproducciones: 0,
                interacciones: 6540,
                compartidos: 1320,
                comentarios_conteo: 5,
                likes: 4890,
                me_encanta: 2340,
                me_enoja: 22,
                sentimiento_positivo: 88.0,
                sentimiento_neutral: 9.0,
                sentimiento_negativo: 3.0,
                tema_estrategico: 'Pilares Programáticos y Doctrina Política',
                comments: [
                    {
                        usuario_red: '@comunicaciones_villamizar',
                        nombre_usuario: 'Equipo Prensa y Comunicaciones Oficial',
                        texto_comentario: 'Línea programática impecable. El partido respalda con total convicción estos 4 pilares.',
                        tipo_reaccion: 'me_encanta',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Equipo Prensa y Comunicaciones Oficial',
                        equipo_rol: 'Prensa y Comunicaciones Oficiales',
                        likes_comentario: 132
                    },
                    {
                        usuario_red: '@empresario_girondeno',
                        nombre_usuario: 'Rodrigo Barajas',
                        texto_comentario: 'La seguridad es el pilar número 1. Sin seguridad nadie invierte un solo peso en Colombia.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        likes_comentario: 85
                    },
                    {
                        usuario_red: '@mujeres_con_villamizar',
                        nombre_usuario: 'Colectivo Mujeres con Villamizar',
                        texto_comentario: 'El pilar de salud es vital para proteger los tratamientos de nuestros hijos y abuelos.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Colectivo Mujeres con Villamizar',
                        equipo_rol: 'Coordinadora Mujeres y Familia',
                        likes_comentario: 94
                    },
                    {
                        usuario_red: '@agro_san_vicente',
                        nombre_usuario: 'Cacao San Vicente de Chucurí',
                        texto_comentario: 'Las vías terciarias nos salvarían a miles de familias cacaoteras. Apoyamos ese pilar.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        likes_comentario: 71
                    },
                    {
                        usuario_red: '@duda_ciudadana_bga',
                        nombre_usuario: 'Luz Marina Osorio',
                        texto_comentario: '¿Cómo garantizarán que los recursos de vías terciarias no se queden en contratos corruptos?',
                        tipo_reaccion: 'pregunta',
                        sentimiento: 'neutral',
                        likes_comentario: 36
                    }
                ]
            },
            {
                campana_id: campId,
                plataforma: 'instagram',
                titulo: '@oscarvillamiz: Diálogo con Jóvenes Emprendedores en Floridablanca (Reel)',
                contenido: 'La juventud santandereana no quiere limosnas, quiere oportunidades reales: créditos blandos para emprender, capacitación en tecnología y menos trabas burocráticas para abrir empresa. ¡Desde el Senado impulsaremos la Ley de Emprendimiento Juvenil Sin Trabas! 🚀💡 #JóvenesConVillamizar',
                url_publicacion: 'https://www.instagram.com/reel/C5F034kL_03/',
                autor_nombre: 'Oscar Villamizar',
                autor_usuario: '@oscarvillamiz',
                fecha_publicacion: '2026-03-31 17:30',
                tipo_contenido: 'video',
                video_duration_seconds: 38,
                alcance: 57800,
                impresiones: 71200,
                reproducciones: 46200,
                interacciones: 5210,
                compartidos: 1150,
                comentarios_conteo: 5,
                likes: 3940,
                me_encanta: 1780,
                me_enoja: 11,
                sentimiento_positivo: 91.0,
                sentimiento_neutral: 7.0,
                sentimiento_negativo: 2.0,
                tema_estrategico: 'Emprendimiento Juvenil y Oportunidades',
                comments: [
                    {
                        usuario_red: '@juventudes_villamizar',
                        nombre_usuario: 'Juventudes CD Bucaramanga',
                        texto_comentario: '¡Energía total en Floridablanca! Los jóvenes queremos trabajar y salir adelante con mérito.',
                        tipo_reaccion: 'me_encanta',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Juventudes CD Bucaramanga',
                        equipo_rol: 'Líder Juventudes CD Bucaramanga',
                        likes_comentario: 110
                    },
                    {
                        usuario_red: '@startupero_santandereano',
                        nombre_usuario: 'Felipe Celis',
                        texto_comentario: 'Reducir el papeleo para registrar una SAS y exonerar de impuestos el primer año sería un golazo.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        likes_comentario: 67
                    },
                    {
                        usuario_red: '@red_digital_floridablanca',
                        nombre_usuario: 'Brigada Digital Floridablanca',
                        texto_comentario: 'Tremenda convocatoria en el auditorio. Floridablanca presente con el Senador.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Brigada Digital Floridablanca',
                        equipo_rol: 'Activismo Digital y Redes',
                        likes_comentario: 74
                    },
                    {
                        usuario_red: '@estudiante_unab',
                        nombre_usuario: 'Natalia Gómez',
                        texto_comentario: '¿Habrá becas de posgrado en el exterior para investigación científica en Santander?',
                        tipo_reaccion: 'pregunta',
                        sentimiento: 'neutral',
                        likes_comentario: 38
                    },
                    {
                        usuario_red: '@avanzada_santander_cd',
                        nombre_usuario: 'Avanzada Santander CD',
                        texto_comentario: 'La avanzada juvenil del partido es la más fuerte del departamento. ¡Vamos por la victoria!',
                        tipo_reaccion: 'me_encanta',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Avanzada Santander CD',
                        equipo_rol: 'Coordinación de Avanzada Santander',
                        likes_comentario: 82
                    }
                ]
            },
            {
                campana_id: campId,
                plataforma: 'instagram',
                titulo: '@oscarvillamiz: Recorrido Campesino en San Gil y Provincias Guanentá (Galería)',
                contenido: 'Madrugando con los caficultores y productores del sur de Santander. El campo es el corazón de nuestra economía; sin vías terciarias dignas y sin alivio a los insumos agrícolas, no hay soberanía alimentaria. ¡Firme compromiso con el campo santandereano! ☕🌾 #ProvinciasDeSantander #Guanenta #Comunera',
                url_publicacion: 'https://www.instagram.com/p/C5I278mP_04/',
                autor_nombre: 'Oscar Villamizar',
                autor_usuario: '@oscarvillamiz',
                fecha_publicacion: '2026-04-02 08:30',
                tipo_contenido: 'imagen',
                alcance: 52100,
                impresiones: 64500,
                reproducciones: 0,
                interacciones: 4890,
                compartidos: 980,
                comentarios_conteo: 4,
                likes: 4320,
                me_encanta: 2150,
                me_enoja: 8,
                sentimiento_positivo: 94.0,
                sentimiento_neutral: 5.0,
                sentimiento_negativo: 1.0,
                tema_estrategico: 'Sector Agropecuario y Provincias',
                comments: [
                    {
                        usuario_red: '@voceria_provincial_guanenta',
                        nombre_usuario: 'Vocería Provincias Guanentá y Comunera',
                        texto_comentario: 'San Gil, Barichara, Curití y Socorro están firmes con el Senador Oscar Villamizar.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Vocería Provincias Guanentá y Comunera',
                        equipo_rol: 'Vocero Regional Provincias',
                        likes_comentario: 96
                    },
                    {
                        usuario_red: '@caficultor_sangileno',
                        nombre_usuario: 'Don Pedro Pablo Rueda',
                        texto_comentario: 'Gracias por venir a la finca a tomar café con nosotros y escuchar las quejas de los abonos.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        likes_comentario: 84
                    },
                    {
                        usuario_red: '@avanzada_santander_cd',
                        nombre_usuario: 'Avanzada Santander CD',
                        texto_comentario: 'Un candidato que camina la trocha y mira a la gente a los ojos. ¡Gran jornada!',
                        tipo_reaccion: 'me_encanta',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Avanzada Santander CD',
                        equipo_rol: 'Coordinación de Avanzada Santander',
                        likes_comentario: 72
                    },
                    {
                        usuario_red: '@turismo_barichara',
                        nombre_usuario: 'Hostal Barichara Colonial',
                        texto_comentario: 'La seguridad y las vías son la vida del turismo en Guanentá. Cuenta con el gremio.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        likes_comentario: 53
                    }
                ]
            },
            {
                campana_id: campId,
                plataforma: 'instagram',
                titulo: '@oscarvillamiz: Posición Clara frente a la Reforma a la Salud (Reel)',
                contenido: 'No permitiremos que destruyan un sistema que atiende a millones para volver al desastre del Seguro Social. Hay que mejorar los tiempos de citas y dignificar al personal médico, pero sin expropiar el derecho de los colombianos a elegir su EPS. ¡La salud es sagrada! 🩺🏥 #DefensaDeLaSalud',
                url_publicacion: 'https://www.instagram.com/reel/C5L490yT_05/',
                autor_nombre: 'Oscar Villamizar',
                autor_usuario: '@oscarvillamiz',
                fecha_publicacion: '2026-04-04 19:15',
                tipo_contenido: 'video',
                video_duration_seconds: 52,
                alcance: 88400,
                impresiones: 108200,
                reproducciones: 64800,
                interacciones: 8640,
                compartidos: 2340,
                comentarios_conteo: 5,
                likes: 6110,
                me_encanta: 3240,
                me_enoja: 45,
                sentimiento_positivo: 87.0,
                sentimiento_neutral: 8.0,
                sentimiento_negativo: 5.0,
                tema_estrategico: 'Salud Pública y Protección al Paciente',
                comments: [
                    {
                        usuario_red: '@mujeres_con_villamizar',
                        nombre_usuario: 'Colectivo Mujeres con Villamizar',
                        texto_comentario: 'Millones de pacientes con enfermedades raras y crónicas agradecemos esta defensa sin tregua.',
                        tipo_reaccion: 'me_encanta',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Colectivo Mujeres con Villamizar',
                        equipo_rol: 'Coordinadora Mujeres y Familia',
                        likes_comentario: 142
                    },
                    {
                        usuario_red: '@medico_uis_bucaramanga',
                        nombre_usuario: 'Dr. Alejandro Peña',
                        texto_comentario: 'Como médico especialista coincido: el giro directo y la politización destruirán los hospitales.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        likes_comentario: 115
                    },
                    {
                        usuario_red: '@comunicaciones_villamizar',
                        nombre_usuario: 'Equipo Prensa y Comunicaciones Oficial',
                        texto_comentario: 'Compartimos el resumen del debate en Comisión Séptima disponible en la biografía.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Equipo Prensa y Comunicaciones Oficial',
                        equipo_rol: 'Prensa y Comunicaciones Oficiales',
                        likes_comentario: 68
                    },
                    {
                        usuario_red: '@paciente_oncologico_col',
                        nombre_usuario: 'Sandra Milena Castro',
                        texto_comentario: 'Senador, gracias de corazón por no dejarnos solos en esta incertidumbre con los medicamentos.',
                        tipo_reaccion: 'me_encanta',
                        sentimiento: 'positivo',
                        likes_comentario: 130
                    },
                    {
                        usuario_red: '@critica_salud_publica',
                        nombre_usuario: 'Gustavo Adolfo Pinzón',
                        texto_comentario: 'Las EPS se robaron billones en el pasado, hay que depurarlas caiga quien caiga.',
                        tipo_reaccion: 'critica',
                        sentimiento: 'negativo',
                        likes_comentario: 32
                    }
                ]
            },

            // --- FACEBOOK ---
            {
                campana_id: campId,
                plataforma: 'facebook',
                titulo: 'Oscar Villamizar: Intervención en Plenaria del Senado - Presupuesto y Austeridad',
                contenido: 'Comparto con los santandereanos y con todos los colombianos mi postura argumentada en la plenaria del Senado frente al presupuesto nacional. Defender lo que funciona y corregir lo que falla es el verdadero camino republicano. No vamos a permitir que se use el presupuesto como chequera política en año preelectoral.',
                url_publicacion: 'https://www.facebook.com/OscarVillamiz/videos/984210452319012/',
                autor_nombre: 'Oscar Villamizar',
                autor_usuario: 'Oscar Villamizar',
                fecha_publicacion: '2026-03-26 15:30',
                tipo_contenido: 'video',
                video_duration_seconds: 180,
                alcance: 96200,
                impresiones: 118400,
                reproducciones: 73400,
                interacciones: 9450,
                compartidos: 2890,
                comentarios_conteo: 6,
                likes: 6850,
                me_encanta: 3420,
                me_enoja: 54,
                sentimiento_positivo: 89.0,
                sentimiento_neutral: 8.0,
                sentimiento_negativo: 3.0,
                tema_estrategico: 'Austeridad Fiscal y Control Presupuestal',
                comments: [
                    {
                        usuario_red: '@liderazgo_social_santander',
                        nombre_usuario: 'Líderes Sociales Santander',
                        texto_comentario: 'Excelente exposición Senador. Clara, contundente y con cifras verificables.',
                        tipo_reaccion: 'me_encanta',
                        sentimiento: 'positivo',
                        likes_comentario: 154
                    },
                    {
                        usuario_red: '@avanzada_santander_cd',
                        nombre_usuario: 'Avanzada Santander CD',
                        texto_comentario: 'Orgullo santandereano en el Congreso. ¡Así se defiende la patria!',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Avanzada Santander CD',
                        equipo_rol: 'Coordinación de Avanzada Santander',
                        likes_comentario: 122
                    },
                    {
                        usuario_red: '@comerciante_san_andresito',
                        nombre_usuario: 'Víctor Hugo Parra',
                        texto_comentario: 'Desde San Andresito La Isla en Bucaramanga cuenta con todo el gremio comercial.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        likes_comentario: 98
                    },
                    {
                        usuario_red: '@asociacion_pacientes_col',
                        nombre_usuario: 'Asociación de Pacientes',
                        texto_comentario: 'Gracias por alzar la voz por nosotros en el Congreso de la República.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        likes_comentario: 110
                    },
                    {
                        usuario_red: '@militante_opositor_bga',
                        nombre_usuario: 'Javier Suárez',
                        texto_comentario: 'No se opongan a los cambios que el pueblo votó en las urnas.',
                        tipo_reaccion: 'critica',
                        sentimiento: 'negativo',
                        likes_comentario: 25
                    },
                    {
                        usuario_red: '@mujeres_con_villamizar',
                        nombre_usuario: 'Colectivo Mujeres con Villamizar',
                        texto_comentario: 'Compartido en más de 20 grupos comunales de mujeres de Santander.',
                        tipo_reaccion: 'me_encanta',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Colectivo Mujeres con Villamizar',
                        equipo_rol: 'Coordinadora Mujeres y Familia',
                        likes_comentario: 85
                    }
                ]
            },
            {
                campana_id: campId,
                plataforma: 'facebook',
                titulo: 'Oscar Villamizar: Gran Encuentro Comunal en Bucaramanga - Escuchando el Territorio',
                contenido: 'Una jornada extraordinaria junto a presidentes de Junta de Acción Comunal, ediles y líderes barriales de Bucaramanga y el área metropolitana. La confianza se gana con presencia constante y con la verdad por delante. ¡Seguimos trabajando de la mano con las comunidades!',
                url_publicacion: 'https://www.facebook.com/OscarVillamiz/posts/985610482319045',
                autor_nombre: 'Oscar Villamizar',
                autor_usuario: 'Oscar Villamizar',
                fecha_publicacion: '2026-03-28 16:00',
                tipo_contenido: 'imagen',
                alcance: 61500,
                impresiones: 78900,
                reproducciones: 0,
                interacciones: 5620,
                compartidos: 1120,
                comentarios_conteo: 5,
                likes: 4780,
                me_encanta: 2190,
                me_enoja: 12,
                sentimiento_positivo: 94.0,
                sentimiento_neutral: 5.0,
                sentimiento_negativo: 1.0,
                tema_estrategico: 'Acción Comunal y Territorio',
                comments: [
                    {
                        usuario_red: '@comuna_norte_bucaramanga',
                        nombre_usuario: 'Comité Comuna Norte Bucaramanga',
                        texto_comentario: 'Muchas gracias por la visita a nuestra sede comunitaria. El compromiso es mutuo.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        likes_comentario: 87
                    },
                    {
                        usuario_red: '@avanzada_santander_cd',
                        nombre_usuario: 'Avanzada Santander CD',
                        texto_comentario: 'Impresionante respaldo en la Comuna 1 y Comuna 2. ¡Santander firme!',
                        tipo_reaccion: 'me_encanta',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Avanzada Santander CD',
                        equipo_rol: 'Coordinación de Avanzada Santander',
                        likes_comentario: 95
                    },
                    {
                        usuario_red: '@lider_barrio_mutis',
                        nombre_usuario: 'Luz Dary Quintero',
                        texto_comentario: 'Senador, por favor gestione la recuperación de la cancha y el salón comunal del Mutis.',
                        tipo_reaccion: 'pregunta',
                        sentimiento: 'neutral',
                        likes_comentario: 48
                    },
                    {
                        usuario_red: '@comunicaciones_villamizar',
                        nombre_usuario: 'Equipo Prensa y Comunicaciones Oficial',
                        texto_comentario: 'Tomamos nota de la solicitud para la gestión ante la Secretaría de Infraestructura.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Equipo Prensa y Comunicaciones Oficial',
                        equipo_rol: 'Prensa y Comunicaciones Oficiales',
                        likes_comentario: 61
                    },
                    {
                        usuario_red: '@red_digital_floridablanca',
                        nombre_usuario: 'Brigada Digital Floridablanca',
                        texto_comentario: 'Esperándolo con los líderes comunales de Floridablanca este próximo sábado.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Brigada Digital Floridablanca',
                        equipo_rol: 'Activismo Digital y Redes',
                        likes_comentario: 54
                    }
                ]
            },
            {
                campana_id: campId,
                plataforma: 'facebook',
                titulo: 'Oscar Villamizar: Audiencia Pública en Barrancabermeja - Empleo y Seguridad',
                contenido: 'En el Puerto Petrolero escuchamos a los trabajadores de la industria y a los comerciantes. La transición energética debe ser técnica, gradual y sin destruir la principal fuente de regalías de los municipios santandereanos. ¡Defender el empleo de Barrancabermeja es defender a Colombia!',
                url_publicacion: 'https://www.facebook.com/OscarVillamiz/videos/986710492319089/',
                autor_nombre: 'Oscar Villamizar',
                autor_usuario: 'Oscar Villamizar',
                fecha_publicacion: '2026-03-30 11:30',
                tipo_contenido: 'video',
                video_duration_seconds: 120,
                alcance: 67400,
                impresiones: 84200,
                reproducciones: 51200,
                interacciones: 5890,
                compartidos: 1450,
                comentarios_conteo: 4,
                likes: 4210,
                me_encanta: 1840,
                me_enoja: 28,
                sentimiento_positivo: 88.0,
                sentimiento_neutral: 8.0,
                sentimiento_negativo: 4.0,
                tema_estrategico: 'Transición Energética y Empleo Regional',
                comments: [
                    {
                        usuario_red: '@petrolero_barranca',
                        nombre_usuario: 'Jaime Alfonso Rey',
                        texto_comentario: 'Al fin un parlamentario que dice la verdad de frente sobre el futuro de Ecopetrol y el empleo local.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        likes_comentario: 135
                    },
                    {
                        usuario_red: '@comunicaciones_villamizar',
                        nombre_usuario: 'Equipo Prensa y Comunicaciones Oficial',
                        texto_comentario: 'Radicamos proposición para proteger las regalías destinadas a agua potable en el Magdalena Medio.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Equipo Prensa y Comunicaciones Oficial',
                        equipo_rol: 'Prensa y Comunicaciones Oficiales',
                        likes_comentario: 88
                    },
                    {
                        usuario_red: '@asojuntas_barrancabermeja',
                        nombre_usuario: 'Asojuntas Comuna 5',
                        texto_comentario: 'Barrancabermeja necesita seguridad urgente frente a las extorsiones en el comercio.',
                        tipo_reaccion: 'pregunta',
                        sentimiento: 'neutral',
                        likes_comentario: 64
                    },
                    {
                        usuario_red: '@avanzada_santander_cd',
                        nombre_usuario: 'Avanzada Santander CD',
                        texto_comentario: 'El Magdalena Medio respalda la mano firme del Senador Oscar Villamizar.',
                        tipo_reaccion: 'me_encanta',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Avanzada Santander CD',
                        equipo_rol: 'Coordinación de Avanzada Santander',
                        likes_comentario: 92
                    }
                ]
            },
            {
                campana_id: campId,
                plataforma: 'facebook',
                titulo: 'Oscar Villamizar: Reunión de Bancada Centro Democrático - Agenda 2026',
                contenido: 'Trabajando en equipo con los congresistas y directivas del partido para radicar proyectos de ley que beneficien a las familias colombianas: rebaja del IVA a la canasta familiar básica, cero impuestos a empresas que contraten jóvenes de primer empleo y penas severas a extorsionistas.',
                url_publicacion: 'https://www.facebook.com/OscarVillamiz/posts/987810502319112',
                autor_nombre: 'Oscar Villamizar',
                autor_usuario: 'Oscar Villamizar',
                fecha_publicacion: '2026-04-01 18:20',
                tipo_contenido: 'imagen',
                alcance: 50300,
                impresiones: 62800,
                reproducciones: 0,
                interacciones: 4120,
                compartidos: 890,
                comentarios_conteo: 4,
                likes: 3920,
                me_encanta: 1670,
                me_enoja: 19,
                sentimiento_positivo: 90.0,
                sentimiento_neutral: 7.0,
                sentimiento_negativo: 3.0,
                tema_estrategico: 'Doctrina de Partido y Proyectos Legislativos',
                comments: [
                    {
                        usuario_red: '@voceria_provincial_guanenta',
                        nombre_usuario: 'Vocería Provincias Guanentá y Comunera',
                        texto_comentario: 'Total sintonía con la bancada. Cero impuestos para contratar jóvenes es la clave.',
                        tipo_reaccion: 'me_encanta',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Vocería Provincias Guanentá y Comunera',
                        equipo_rol: 'Vocero Regional Provincias',
                        likes_comentario: 79
                    },
                    {
                        usuario_red: '@juventudes_villamizar',
                        nombre_usuario: 'Juventudes CD Bucaramanga',
                        texto_comentario: 'Esta propuesta nos da futuro a miles de egresados universitarios.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Juventudes CD Bucaramanga',
                        equipo_rol: 'Líder Juventudes CD Bucaramanga',
                        likes_comentario: 85
                    },
                    {
                        usuario_red: '@militante_firme_cd',
                        nombre_usuario: 'Alonso Villarreal',
                        texto_comentario: 'Coherencia y disciplina política. Con Oscar Villamizar el Centro Democrático está bien representado.',
                        tipo_reaccion: 'me_encanta',
                        sentimiento: 'positivo',
                        likes_comentario: 94
                    },
                    {
                        usuario_red: '@critica_economica_stder',
                        nombre_usuario: 'Sergio Arciniegas',
                        texto_comentario: 'Bajar impuestos sin bajar el gasto público no es sostenible, expliquen bien cómo cuadran las cuentas.',
                        tipo_reaccion: 'critica',
                        sentimiento: 'negativo',
                        likes_comentario: 22
                    }
                ]
            },
            {
                campana_id: campId,
                plataforma: 'facebook',
                titulo: '🔴 EN VIVO FACEBOOK: Rueda de Prensa y Balance de Gestión Legislativa',
                contenido: 'Conéctate a la transmisión especial donde rendimos cuentas de los debates de control político, proyectos de ley radicados y la agenda de visitas a las 6 provincias de Santander. ¡Preguntas abiertas sin censura! #OscarVillamizEnVivo',
                url_publicacion: 'https://www.facebook.com/OscarVillamiz/videos/989110522319245/',
                autor_nombre: 'Oscar Villamizar',
                autor_usuario: 'Oscar Villamizar',
                fecha_publicacion: '2026-04-03 20:00',
                tipo_contenido: 'live',
                en_vivo: true,
                espectadores_en_vivo: 4800,
                pico_espectadores: 6250,
                duracion_en_vivo: '01:15:20',
                alcance: 84600,
                impresiones: 104200,
                reproducciones: 38900,
                interacciones: 7420,
                compartidos: 2120,
                comentarios_conteo: 6,
                likes: 5420,
                me_encanta: 2870,
                me_enoja: 31,
                sentimiento_positivo: 92.0,
                sentimiento_neutral: 6.0,
                sentimiento_negativo: 2.0,
                tema_estrategico: 'Rendición de Cuentas y Debate en Vivo',
                comments: [
                    {
                        usuario_red: '@avanzada_santander_cd',
                        nombre_usuario: 'Avanzada Santander CD',
                        texto_comentario: '¡Conectados en vivo desde Bucaramanga! Más de 200 personas en la sede central siguiendo la transmisión.',
                        tipo_reaccion: 'me_encanta',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Avanzada Santander CD',
                        equipo_rol: 'Coordinación de Avanzada Santander',
                        likes_comentario: 165
                    },
                    {
                        usuario_red: '@juventudes_villamizar',
                        nombre_usuario: 'Juventudes CD Bucaramanga',
                        texto_comentario: 'Los jóvenes conectados en masa. ¡Vamos con toda Senador! 🔥👏',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Juventudes CD Bucaramanga',
                        equipo_rol: 'Líder Juventudes CD Bucaramanga',
                        likes_comentario: 140
                    },
                    {
                        usuario_red: '@periodista_regional_bga',
                        nombre_usuario: 'Noticias Bucaramanga Hoy',
                        texto_comentario: 'Senador, ¿cuál será su prioridad número 1 para el departamento de Santander en la nueva legislatura?',
                        tipo_reaccion: 'pregunta',
                        sentimiento: 'neutral',
                        likes_comentario: 88
                    },
                    {
                        usuario_red: '@mujeres_con_villamizar',
                        nombre_usuario: 'Colectivo Mujeres con Villamizar',
                        texto_comentario: 'Excelente balance legislativo. Un senador que sí trabaja y rinde cuentas con la frente en alto.',
                        tipo_reaccion: 'me_encanta',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Colectivo Mujeres con Villamizar',
                        equipo_rol: 'Coordinadora Mujeres y Familia',
                        likes_comentario: 112
                    },
                    {
                        usuario_red: '@red_digital_floridablanca',
                        nombre_usuario: 'Brigada Digital Floridablanca',
                        texto_comentario: 'Replicando el stream en vivo en 15 grupos comunitarios del área metropolitana.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        es_equipo_campana: true,
                        equipo_nombre: 'Brigada Digital Floridablanca',
                        equipo_rol: 'Activismo Digital y Redes',
                        likes_comentario: 95
                    },
                    {
                        usuario_red: '@ciudadano_san_gil_firme',
                        nombre_usuario: 'Gabriel Morales',
                        texto_comentario: 'Saludos desde San Gil. Gracias por no olvidarse de las provincias.',
                        tipo_reaccion: 'apoyo',
                        sentimiento: 'positivo',
                        likes_comentario: 76
                    }
                ]
            }
        ];

        let createdPostsCount = 0;
        let createdCommentsCount = 0;

        for (const pData of postsData) {
            const { comments, ...postFields } = pData;
            const post = await SocialMediaPost.create(postFields);
            createdPostsCount++;

            if (comments && comments.length > 0) {
                for (const c of comments) {
                    await SocialPostComment.create({
                        post_id: post.id,
                        campana_id: campId,
                        plataforma: post.plataforma,
                        usuario_red: c.usuario_red,
                        nombre_usuario: c.nombre_usuario,
                        texto_comentario: c.texto_comentario,
                        tipo_reaccion: c.tipo_reaccion || 'apoyo',
                        sentimiento: c.sentimiento || 'positivo',
                        es_equipo_campana: c.es_equipo_campana || false,
                        equipo_nombre: c.equipo_nombre || null,
                        equipo_rol: c.equipo_rol || null,
                        likes_comentario: c.likes_comentario || 0,
                        fecha_comentario: new Date().toISOString()
                    });
                    createdCommentsCount++;
                }
            }
        }

        console.log(`✅ ${createdPostsCount} publicaciones oficiales de Oscar Villamizar creadas exitosamente.`);
        console.log(`✅ ${createdCommentsCount} comentarios comunitarios y del equipo registrados.`);

        // 5. Configurar Radar de Oposición y War Room para Oscar Villamizar
        const competitor = await SocialCompetitor.create({
            campana_id: campId,
            nombre_candidato: 'Bancada de Oposición y Radicales en Santander',
            partido_movimiento: 'Pacto Histórico / Sectores Radicales',
            cargo_postulado: 'Senado de la República',
            alcance_estimado: 210000,
            seguidores_totales: 340000,
            narrativa_principal: 'Ataques al uribismo, intento de desprestigiar la gestión en seguridad y cuestionamientos ideológicos.',
            lineas_de_ataque: 'Llamar al Centro Democrático "enemigos del cambio" y atacar debates de control político en el Congreso.',
            puntos_fuertes: 'Activismo digital en bodegas de Twitter y TikTok.',
            puntos_debiles: 'Cero gestión real en Santander, deterioro de la seguridad y escándalos nacionales.',
            contra_estrategia_sugerida: 'Responder con hechos, cifras de gestión legislativa y defensa territorial de Santander.',
            nivel_amenaza: 'alto',
            ultima_movida: 'Campaña de difamación en redes contra el debate de seguridad en Santander.'
        });

        await SocialCompetitorAttack.create({
            campana_id: campId,
            adversario_nombre: 'Bancada de Oposición y Radicales en Santander',
            plataforma: 'twitter',
            blanco_ataque: 'senador',
            descripcion_blanco: 'Seguridad y Firmeza en Santander',
            contenido_ataque: 'Afirman que exigir presencia militar en Santander es "discurso del pasado" y buscan desviar la atención de los atentados en la región.',
            nivel_amenaza: 'alto',
            tactica_recomendada: 'contraatacar',
            analisis_estrategico: 'Contraataque con cifras oficiales de extorsión y testimonios de comerciantes de Barrancabermeja y Bucaramanga.',
            guion_candidato: 'La seguridad no es de izquierda ni de derecha: es un derecho fundamental consagrado en la Constitución. Quienes llaman a la delincuencia "gestores de paz" traicionan a los colombianos honestos.',
            guion_voceros: 'El Senador Villamizar es la voz de los santandereanos que madrugan a trabajar y no aceptan ser extorsionados. Los hechos demuestran que donde no hay autoridad, reina el crimen.',
            guion_tropa_digital: '🇨🇴 ¡Santander no se arrodilla! Exigir seguridad para nuestras familias no es discurso, es una necesidad urgente. #SantanderSeguro #ConVillamizarFirme',
            guion_debates: 'Cifras en mano: en los últimos dos años la extorsión en el Magdalena Medio subió más del 40%. ¿Eso es lo que llaman cambio? No vamos a permitir que conviertan a Santander en tierra de nadie.'
        });

        console.log('✅ Radar de Oposición y War Room configurados para Oscar Villamizar.');
        console.log('--- BARRIDO Y CONFIGURACIÓN COMPLETADA CON ÉXITO ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error configurando campaña de Oscar Villamizar:', err);
        process.exit(1);
    }
}

setupOscarCampaign();
