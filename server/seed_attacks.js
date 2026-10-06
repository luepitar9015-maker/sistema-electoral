const sequelize = require('./database/db');
const SocialCompetitor = require('./models/SocialCompetitor');
const SocialCompetitorAttack = require('./models/SocialCompetitorAttack');

async function seedAttacks() {
    try {
        console.log('Conectando a base de datos...');
        await sequelize.authenticate();

        const count = await SocialCompetitorAttack.count();
        if (count > 0) {
            console.log(`Ya existen ${count} ataques en la bitácora.`);
            process.exit(0);
        }

        const competitors = await SocialCompetitor.findAll();
        const comp1 = competitors[0] || { id: null, nombre_candidato: 'Senador Jorge Enrique Robledo' };
        const comp2 = competitors[1] || { id: null, nombre_candidato: 'Candidato Oposición Radical' };

        console.log('Sembrando ataques de prueba estratégicos...');
        await SocialCompetitorAttack.bulkCreate([
            {
                campana_id: 1,
                competitor_id: comp1.id,
                adversario_nombre: comp1.nombre_candidato,
                plataforma: 'twitter',
                url_publicacion: 'https://x.com/JERobledo/status/17892182910291',
                fecha_ataque: new Date(),
                blanco_ataque: 'alcalde',
                descripcion_blanco: 'Gestión de obras públicas y vías de la ciudad',
                contenido_ataque: 'La malla vial de la ciudad está completamente destruida. El alcalde promete y promete en campaña pero no hay una sola obra concluida. Exigimos auditoría de la Contraloría a los contratos de pavimentación.',
                tema_ataque: 'Obras e Infraestructura',
                nivel_amenaza: 'alto',
                alcance_estimado: 120000,
                likes: 1450,
                reposts: 380,
                comentarios: 240,
                es_fake_news: false,
                posible_red_bots: false,
                tactica_recomendada: 'redireccionar',
                analisis_estrategico: 'El rival busca capitalizar el malestar del tráfico y baches en vías secundarias para frenar el impulso del candidato en zonas urbanas. Táctica: No pelear en el lodo, sino publicar video hoy mismo entregando el nuevo tramo de la avenida principal y anunciar el cronograma de bacheo.',
                guion_candidato: '"A las calumnias de quienes solo hacen política desde un escritorio, respondemos con hechos. Hoy entregamos 15 kilómetros de vías completamente rehabilitadas y no vamos a parar. La oposición destruye con palabras, nosotros construimos con hechos."',
                guion_voceros: '"Invitamos al señor Robledo a recorrer las obras en marcha. El 82% del presupuesto de infraestructura está ejecutado con pliegos tipo y vigilancia de veedurías ciudadanas. Los datos demuestran una inversión histórica que ellos jamás hicieron."',
                guion_tropa_digital: 'Comentario 1: "Curioso que hablen de vías ahora que hay elecciones, cuando tuvieron curul por 20 años y no gestionaron un peso para la ciudad. ¡Aquí los resultados sí se ven! 🏗️👏"\nComentario 2: "Los datos son públicos y las obras están abiertas al tránsito. Menos show en Twitter y más trabajo real."',
                guion_debates: '"Candidato, entiendo su angustia por los votos, pero las elecciones se ganan con propuestas. Si usted hubiera revisado el portal de contratación antes de twittear, sabría que el contrato de pavimentación tiene un avance del 94%. Le regalo el informe impreso para que se informe."',
                estado: 'estrategia_desplegada',
                notas_director: 'Publicar reel con el dron mostrando el tramo terminado.'
            },
            {
                campana_id: 1,
                competitor_id: comp2.id,
                adversario_nombre: comp2.nombre_candidato,
                plataforma: 'tiktok',
                url_publicacion: 'https://tiktok.com/@seguridad_total/video/739182918291',
                fecha_ataque: new Date(Date.now() - 3600000 * 24),
                blanco_ataque: 'partido',
                descripcion_blanco: 'Desprestigio a la bancada y partido por alianzas políticas',
                contenido_ataque: '¡Miren quiénes respaldan a esta candidatura! Los mismos partidos tradicionales de siempre que se han repartido los ministerios. Votar por ellos es votar por la reelección de la politiquería.',
                tema_ataque: 'Incoherencia Política / Maquinarias',
                nivel_amenaza: 'muy_alto',
                alcance_estimado: 350000,
                likes: 8900,
                reposts: 2100,
                comentarios: 1200,
                es_fake_news: true,
                posible_red_bots: true,
                tactica_recomendada: 'contraatacar',
                analisis_estrategico: 'Ataque de alta viralidad en TikTok orientado al voto joven indeciso. Utilizan fotos sacadas de contexto para crear la narrativa de maquinaria. Urge desmentir con formato corto de TikTok y contrastar mostrando quién financia realmente al adversario.',
                guion_candidato: '"Nuestra alianza más grande y sagrada es con la gente decente de este país. No le debemos favores a ninguna mafia. Por eso nos tienen miedo: porque gobernaremos con las manos limpias y sin hipotecas políticas."',
                guion_voceros: '"El video que circula en TikTok es un burdo montaje que recicla fotografías de hace 8 años en eventos gremiales abiertos. Nuestra campaña es financiada con aportes transparentes bancarizados, a diferencia del oscurantismo de nuestros atacantes."',
                guion_tropa_digital: 'Comentario 1: "Video cortado y sacado de contexto. Vayan y miren las propuestas reales en vez de consumir montajes de bodegas 🚩"\nComentario 2: "¿Y por qué no muestran los contratos que el primo del candidato radical firmó el año pasado? Memoria selectiva."',
                guion_debates: '"El adversario viene aquí a darnos lecciones de moral cuando toda su campaña se sostiene en mentiras prefabricadas en bodegas digitales. Lo reto aquí en vivo a que presente una sola prueba ante los tribunales."',
                estado: 'en_monitoreo',
                notas_director: 'Activar brigada de respuesta en los comentarios de TikTok para desacreditar el audio manipulado.'
            },
            {
                campana_id: 1,
                competitor_id: null,
                adversario_nombre: 'Perfil Anónimo de Oposición',
                plataforma: 'instagram',
                url_publicacion: 'https://instagram.com/p/C992182012',
                fecha_ataque: new Date(Date.now() - 3600000 * 48),
                blanco_ataque: 'candidato',
                descripcion_blanco: 'Ataque a la capacidad moral y personal del candidato',
                contenido_ataque: 'El candidato no tiene el carácter ni la preparación académica para gobernar. Miren cómo tartamudea cuando le preguntan por la economía.',
                tema_ataque: 'Vida Personal / Preparación',
                nivel_amenaza: 'bajo',
                alcance_estimado: 1500,
                likes: 42,
                reposts: 6,
                comentarios: 18,
                es_fake_news: false,
                posible_red_bots: false,
                tactica_recomendada: 'ignorar',
                analisis_estrategico: 'Cuenta pequeña de ataque sin tracción orgánica. No cruza hacia audiencias masivas. Aplicar Silencio Estratégico: responderle solo aumentaría el alcance del post.',
                guion_candidato: '"No perderemos ni un segundo respondiendo a agravios personales. Toda nuestra energía está volcada en generar empleo y aliviar el bolsillo de las familias."',
                guion_voceros: '"No comentamos rumores ni agresiones anónimas sin fundamento."',
                guion_tropa_digital: 'Comentario 1: "Seguimos firmes con el candidato de las propuestas serias. ¡Adelante!"',
                guion_debates: '"A palabras vacías, oídos sordos. Hablemos de cómo vamos a reactivar la economía."',
                estado: 'neutralizado',
                notas_director: 'Mantener en silencio estratégico. Se verificó que la cuenta perdió interacción tras 24 horas.'
            }
        ]);

        console.log('✅ Ataques de prueba sembrados exitosamente.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error sembrando ataques:', err);
        process.exit(1);
    }
}

seedAttacks();
