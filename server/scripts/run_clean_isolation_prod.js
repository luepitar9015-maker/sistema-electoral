const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const sequelize = require('../database/db');
const Campaign = require('../models/Campaign');
const SocialMediaPost = require('../models/SocialMediaPost');
const SocialPostComment = require('../models/SocialPostComment');
const SocialTeamAccount = require('../models/SocialTeamAccount');
const SocialTeamInteraction = require('../models/SocialTeamInteraction');
const SocialNegativeComment = require('../models/SocialNegativeComment');
const SocialCompetitor = require('../models/SocialCompetitor');
const SocialCompetitorAttack = require('../models/SocialCompetitorAttack');
const SocialAccount = require('../models/SocialAccount');
const SocialConnection = require('../models/SocialConnection');
const ContentAlert = require('../models/ContentAlert');
const Voter = require('../models/Voter');
const User = require('../models/User');

async function cleanAndIsolate() {
    console.log('=== INICIANDO LIMPIEZA Y AISLAMIENTO DE CAMPAÑAS ===');

    // 1. Mostrar estado actual de campañas
    const allCamps = await Campaign.findAll({ order: [['id', 'ASC']] });
    console.log('Campañas actuales:');
    allCamps.forEach(c => {
        console.log(`[#${c.id}] ${c.nombre} | Candidato: ${c.candidato} | Partido: ${c.partido_politico}`);
    });

    // 2. Fusionar datos de Campaña 7 en Campaña 6 (Diego Frank Ariza)
    const c6 = await Campaign.findByPk(6);
    const c7 = await Campaign.findByPk(7);

    // Obtener todas las tablas que tengan columna campana_id
    const [tablesWithCampId] = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'campana_id' 
        AND table_schema = 'public' 
        AND table_name != 'Campaigns';
    `);
    const tableNames = tablesWithCampId.map(t => t.table_name);
    console.log(`Tablas con campana_id encontradas: ${tableNames.join(', ')}`);

    if (c6 && c7) {
        console.log('\n--- Fusionando Campaña 7 dentro de Campaña 6 (Diego Frank Ariza) ---');
        
        // Copiar enlaces de redes de 7 a 6
        c6.candidato = 'DIEGO FRANK ARIZA';
        c6.nombre = 'Cámara de Representantes - DIEGO FRANK ARIZA';
        c6.partido_politico = 'PARTIDO DE LA U';
        c6.link_facebook = c7.link_facebook || c6.link_facebook || 'https://facebook.com/diegofranariza';
        c6.link_instagram = c7.link_instagram || c6.link_instagram || 'https://instagram.com/diegofranariza';
        c6.link_youtube = c7.link_youtube || c6.link_youtube || 'https://youtube.com/@diegofranariza';
        c6.link_tiktok = c7.link_tiktok || c6.link_tiktok || 'https://tiktok.com/@diegofranariza';
        c6.link_twitter = c7.link_twitter || c6.link_twitter || 'https://x.com/diegofranariza';
        await c6.save();
        console.log('✓ Campaña 6 actualizada con datos y enlaces oficiales de Diego Frank Ariza');

        // Mover dependencias de 7 a 6 en todas las tablas
        for (const tbl of tableNames) {
            try {
                await sequelize.query(`UPDATE "${tbl}" SET campana_id = 6 WHERE campana_id = 7;`);
            } catch (err) {
                console.log(`Aviso al actualizar ${tbl}: ${err.message}`);
            }
        }
        console.log('✓ Todos los registros de Campaña 7 reasignados a Campaña 6');

        // Eliminar campaña 7 redundante
        await sequelize.query('DELETE FROM "Campaigns" WHERE id = 7;');
        console.log('✓ Campaña 7 redundante eliminada con éxito');
    }

    // 3. Fusionar datos de Campaña 2 en Campaña 5 (Oscar Villamizar) si aplica
    const c2 = await Campaign.findByPk(2);
    const c5 = await Campaign.findByPk(5);
    if (c2 && c5) {
        console.log('\n--- Fusionando Campaña 2 dentro de Campaña 5 (Oscar Villamizar) ---');
        for (const tbl of tableNames) {
            try {
                await sequelize.query(`UPDATE "${tbl}" SET campana_id = 5 WHERE campana_id = 2;`);
            } catch (err) {
                console.log(`Aviso al actualizar ${tbl}: ${err.message}`);
            }
        }
        await sequelize.query('DELETE FROM "Campaigns" WHERE id = 2;');
        console.log('✓ Campaña 2 eliminada y unificada en Campaña 5');
    }

    // Eliminar también campaña 3 si era de prueba
    try {
        const c3 = await Campaign.findByPk(3);
        if (c3 && c3.nombre.includes('Prueba')) {
            for (const tbl of tableNames) {
                try {
                    await sequelize.query(`UPDATE "${tbl}" SET campana_id = 1 WHERE campana_id = 3;`);
                } catch (e) {}
            }
            await sequelize.query('DELETE FROM "Campaigns" WHERE id = 3;');
            console.log('✓ Campaña 3 de prueba eliminada');
        }
    } catch (e) {
        console.log('Aviso c3:', e.message);
    }

    // 4. Mover estrictamente cualquier post de Diego Ariza a Campaña 6
    const [dRes] = await sequelize.query(`
        UPDATE "SocialMediaPosts" 
        SET campana_id = 6 
        WHERE (LOWER(autor_nombre) LIKE '%diego%ariza%' OR LOWER(titulo) LIKE '%diego%ariza%' OR LOWER(autor_nombre) LIKE '%diego frank%')
        AND campana_id != 6;
    `);
    console.log(`✓ Posts de Diego asegurados estrictamente en Campaña 6`);

    // 5. Mover estrictamente cualquier post de Oscar Villamizar a Campaña 5
    const [oRes] = await sequelize.query(`
        UPDATE "SocialMediaPosts" 
        SET campana_id = 5 
        WHERE (LOWER(autor_nombre) LIKE '%villamizar%' OR LOWER(titulo) LIKE '%villamizar%')
        AND campana_id != 5;
    `);
    console.log(`✓ Posts de Oscar Villamizar asegurados estrictamente en Campaña 5`);

    // 6. Sincronizar campana_id en SocialPostComments y SocialTeamInteractions con su respectivo post
    await sequelize.query(`
        UPDATE "SocialPostComments" 
        SET campana_id = "SocialMediaPosts".campana_id
        FROM "SocialMediaPosts"
        WHERE "SocialPostComments".post_id = "SocialMediaPosts".id
        AND "SocialPostComments".campana_id != "SocialMediaPosts".campana_id;
    `);

    await sequelize.query(`
        UPDATE "SocialTeamInteractions" 
        SET campana_id = "SocialMediaPosts".campana_id
        FROM "SocialMediaPosts"
        WHERE "SocialTeamInteractions".post_id = "SocialMediaPosts".id
        AND "SocialTeamInteractions".campana_id != "SocialMediaPosts".campana_id;
    `);
    console.log('✓ Comentarios e interacciones de equipo sincronizados 100% con su post.');

    // 7. Resumen final
    console.log('\n=== RESUMEN FINAL TRAS AISLAMIENTO ===');
    const finalCamps = await Campaign.findAll({ order: [['id', 'ASC']] });
    for (const c of finalCamps) {
        const [posts] = await sequelize.query(`SELECT count(*) as c FROM "SocialMediaPosts" WHERE campana_id = ${c.id}`);
        const [voters] = await sequelize.query(`SELECT count(*) as c FROM "Voters" WHERE campana_id = ${c.id}`);
        const [comments] = await sequelize.query(`SELECT count(*) as c FROM "SocialPostComments" WHERE campana_id = ${c.id}`);
        console.log(`Campaña #${c.id} [${c.candidato} - ${c.nombre}]: ${posts[0].c} posts, ${comments[0].c} comentarios, ${voters[0].c} votantes`);
    }

    await sequelize.close();
    console.log('\n✓ PROCESO COMPLETADO EXITOSAMENTE');
    process.exit(0);
}

cleanAndIsolate().catch(err => {
    console.error('Error fatal durante aislamiento:', err);
    process.exit(1);
});
