const sequelize = require('./database/db');

async function seedLiveStreams() {
    try {
        const lives = [
            {
                campana_id: 1,
                plataforma: 'tiktok',
                titulo: '🔴 TRANSMISIÓN EN VIVO: Diálogo Abierto con la Juventud y Comuna 4',
                contenido: 'Estamos en vivo desde Aranjuez escuchando a los jóvenes sobre seguridad, empleo y transporte. ¡Comenta tu pregunta para el candidato!',
                url_publicacion: 'https://tiktok.com/@campanacolombia/live',
                autor_nombre: 'Alejandro Gaviria',
                autor_usuario: '@campanacolombia',
                fecha_publicacion: new Date().toISOString().slice(0, 16).replace('T', ' '),
                tipo_contenido: 'live',
                alcance: 92000,
                impresiones: 135000,
                reproducciones: 78000,
                interacciones: 18400,
                compartidos: 1950,
                comentarios_conteo: 2420,
                engagement_rate: 13.8,
                likes: 12500,
                me_encanta: 2400,
                me_enoja: 110,
                en_vivo: 1,
                estado_en_vivo: 'en_directo',
                espectadores_en_vivo: 4820,
                pico_espectadores: 6410,
                duracion_en_vivo: '00:44:18',
                tema_estrategico: 'Juventud y Territorio',
                clics_link_candidato: 340,
                link_candidato: 'http://localhost:3000/r/2'
            },
            {
                campana_id: 1,
                plataforma: 'instagram',
                titulo: '🔴 INSTAGRAM LIVE: Rueda de Prensa y Respuestas sin Filtro con Alejandro Gaviria',
                contenido: 'En directo respondiendo las dudas de los ciudadanos sobre la reforma a la salud y propuestas económicas para Colombia.',
                url_publicacion: 'https://instagram.com/agaviriau/live',
                autor_nombre: 'Alejandro Gaviria',
                autor_usuario: '@agaviriau',
                fecha_publicacion: new Date().toISOString().slice(0, 16).replace('T', ' '),
                tipo_contenido: 'live',
                alcance: 68000,
                impresiones: 89000,
                reproducciones: 45000,
                interacciones: 11200,
                compartidos: 840,
                comentarios_conteo: 1890,
                engagement_rate: 11.2,
                likes: 8400,
                me_encanta: 1650,
                me_enoja: 45,
                en_vivo: 1,
                estado_en_vivo: 'en_directo',
                espectadores_en_vivo: 3250,
                pico_espectadores: 4120,
                duracion_en_vivo: '00:38:50',
                tema_estrategico: 'Propuestas de Salud',
                clics_link_candidato: 215,
                link_candidato: 'http://localhost:3000/r/6'
            },
            {
                campana_id: 1,
                plataforma: 'facebook',
                titulo: '🔴 FACEBOOK LIVE: Gran Encuentro con Líderes Comunales y Veredales',
                contenido: 'Transmisión comunitaria con más de 20 juntas de acción comunal. El poder de las regiones se hace sentir.',
                url_publicacion: 'https://facebook.com/AlejandroGaviriaOficial/live',
                autor_nombre: 'Alejandro Gaviria Oficial',
                autor_usuario: '@AlejandroGaviriaOficial',
                fecha_publicacion: new Date().toISOString().slice(0, 16).replace('T', ' '),
                tipo_contenido: 'live',
                alcance: 115000,
                impresiones: 160000,
                reproducciones: 82000,
                interacciones: 15400,
                compartidos: 3100,
                comentarios_conteo: 2800,
                engagement_rate: 12.5,
                likes: 9800,
                me_encanta: 2900,
                me_enoja: 80,
                en_vivo: 1,
                estado_en_vivo: 'en_directo',
                espectadores_en_vivo: 5120,
                pico_espectadores: 7300,
                duracion_en_vivo: '00:52:10',
                tema_estrategico: 'Liderazgo Comunal',
                clics_link_candidato: 510,
                link_candidato: 'http://localhost:3000/r/7'
            },
            {
                campana_id: 1,
                plataforma: 'youtube',
                titulo: '🔴 YOUTUBE LIVE HD: Presentación del Plan de Gobierno Colombia Unida 2026',
                contenido: 'Señal oficial en alta definición con intérprete de señas y moderación de panelistas académicos.',
                url_publicacion: 'https://youtube.com/@alejandrogaviria/live',
                autor_nombre: 'Alejandro Gaviria',
                autor_usuario: '@alejandrogaviria',
                fecha_publicacion: new Date().toISOString().slice(0, 16).replace('T', ' '),
                tipo_contenido: 'live',
                alcance: 42000,
                impresiones: 58000,
                reproducciones: 31000,
                interacciones: 7600,
                compartidos: 920,
                comentarios_conteo: 1100,
                engagement_rate: 9.8,
                likes: 5400,
                me_encanta: 890,
                me_enoja: 30,
                en_vivo: 1,
                estado_en_vivo: 'en_directo',
                espectadores_en_vivo: 2180,
                pico_espectadores: 2950,
                duracion_en_vivo: '00:55:00',
                tema_estrategico: 'Plan de Gobierno',
                clics_link_candidato: 190,
                link_candidato: 'http://localhost:3000/r/8'
            },
            {
                campana_id: 1,
                plataforma: 'twitter',
                titulo: '🔴 X SPACES / LIVE: Debate Ciudadano y Preguntas Incómodas de la Prensa',
                contenido: 'Espacio de audio y video en directo para debatir con líderes de opinión y periodistas regionales.',
                url_publicacion: 'https://x.com/agaviriau/spaces',
                autor_nombre: 'Alejandro Gaviria',
                autor_usuario: '@agaviriau',
                fecha_publicacion: new Date().toISOString().slice(0, 16).replace('T', ' '),
                tipo_contenido: 'live',
                alcance: 35000,
                impresiones: 49000,
                reproducciones: 22000,
                interacciones: 5800,
                compartidos: 1200,
                comentarios_conteo: 890,
                engagement_rate: 10.1,
                likes: 3800,
                me_encanta: 450,
                me_enoja: 70,
                en_vivo: 1,
                estado_en_vivo: 'en_directo',
                espectadores_en_vivo: 1480,
                pico_espectadores: 2100,
                duracion_en_vivo: '00:32:45',
                tema_estrategico: 'Debate de Opinión',
                clics_link_candidato: 145,
                link_candidato: 'http://localhost:3000/r/9'
            }
        ];

        for (const item of lives) {
            // Check if already exists by platform and en_vivo
            const [rows] = await sequelize.query(`
                SELECT id FROM SocialMediaPosts WHERE plataforma = '${item.plataforma}' AND en_vivo = 1 LIMIT 1;
            `);
            if (rows.length > 0) {
                const id = rows[0].id;
                await sequelize.query(`
                    UPDATE SocialMediaPosts 
                    SET titulo = '${item.titulo.replace(/'/g, "''")}',
                        contenido = '${item.contenido.replace(/'/g, "''")}',
                        url_publicacion = '${item.url_publicacion}',
                        espectadores_en_vivo = ${item.espectadores_en_vivo},
                        pico_espectadores = ${item.pico_espectadores},
                        duracion_en_vivo = '${item.duracion_en_vivo}',
                        estado_en_vivo = '${item.estado_en_vivo}',
                        en_vivo = 1
                    WHERE id = ${id};
                `);
                console.log(`Updated live stream for ${item.plataforma} (ID: ${id})`);
            } else {
                await sequelize.query(`
                    INSERT INTO SocialMediaPosts (
                        campana_id, plataforma, titulo, contenido, url_publicacion, autor_nombre,
                        autor_usuario, fecha_publicacion, tipo_contenido, alcance, impresiones,
                        reproducciones, interacciones, compartidos, comentarios_conteo,
                        engagement_rate, likes, me_encanta, me_enoja, en_vivo, estado_en_vivo,
                        espectadores_en_vivo, pico_espectadores, duracion_en_vivo, tema_estrategico,
                        clics_link_candidato, link_candidato, createdAt, updatedAt
                    ) VALUES (
                        ${item.campana_id}, '${item.plataforma}', '${item.titulo.replace(/'/g, "''")}',
                        '${item.contenido.replace(/'/g, "''")}', '${item.url_publicacion}', '${item.autor_nombre}',
                        '${item.autor_usuario}', '${item.fecha_publicacion}', '${item.tipo_contenido}',
                        ${item.alcance}, ${item.impresiones}, ${item.reproducciones}, ${item.interacciones},
                        ${item.compartidos}, ${item.comentarios_conteo}, ${item.engagement_rate},
                        ${item.likes}, ${item.me_encanta}, ${item.me_enoja}, 1, '${item.estado_en_vivo}',
                        ${item.espectadores_en_vivo}, ${item.pico_espectadores}, '${item.duracion_en_vivo}',
                        '${item.tema_estrategico}', ${item.clics_link_candidato}, '${item.link_candidato}',
                        DATETIME('now'), DATETIME('now')
                    );
                `);
                console.log(`Inserted new live stream for ${item.plataforma}`);
            }
        }

        console.log('ALL LIVE STREAMS SEEDED SUCCESSFULLY ACROSS ALL PLATFORMS!');
        process.exit(0);
    } catch (e) {
        console.error('Seeding error:', e);
        process.exit(1);
    }
}

seedLiveStreams();
