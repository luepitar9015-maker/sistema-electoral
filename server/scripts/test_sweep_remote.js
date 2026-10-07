require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { syncProfileFromUrl, executeFullCandidateSweep } = require('../services/socialSyncService');
const SocialMediaPost = require('../models/SocialMediaPost');
const SocialPostComment = require('../models/SocialPostComment');

(async () => {
    try {
        console.log('--- TEST 1: Sincronizar link de Facebook en Campaña 2 ---');
        const fbRes = await syncProfileFromUrl({
            url: 'https://www.facebook.com/OscarVillamiz/?locale=es_LA',
            campanaId: 2
        });
        console.log('Resultado Facebook:', fbRes);

        console.log('\n--- TEST 2: Sincronizar link de Instagram en Campaña 2 ---');
        const igRes = await syncProfileFromUrl({
            url: 'https://www.instagram.com/oscarvillamiz/?hl=es',
            campanaId: 2
        });
        console.log('Resultado Instagram:', igRes);

        console.log('\n--- TEST 3: Sincronizar link de Twitter en Campaña 2 ---');
        const twRes = await syncProfileFromUrl({
            url: 'https://x.com/OscarVillamiz',
            campanaId: 2
        });
        console.log('Resultado Twitter:', twRes);

        console.log('\n--- TEST 4: Barrido Integral Completo en Campaña 2 ---');
        const sweep2 = await executeFullCandidateSweep({ campanaId: 2 });
        console.log('Resultado Barrido Campaña 2:', sweep2);

        console.log('\n--- TEST 5: Barrido Integral Completo en Campaña 5 ---');
        const sweep5 = await executeFullCandidateSweep({ campanaId: 5 });
        console.log('Resultado Barrido Campaña 5:', sweep5);

        const postsC2 = await SocialMediaPost.findAll({ where: { campana_id: 2 } });
        const commentsC2 = await SocialPostComment.findAll({ where: { campana_id: 2 } });
        console.log(`\n=== ESTADO FINAL CAMPAÑA 2: ${postsC2.length} posts, ${commentsC2.length} comentarios ===`);

        const postsC5 = await SocialMediaPost.findAll({ where: { campana_id: 5 } });
        const commentsC5 = await SocialPostComment.findAll({ where: { campana_id: 5 } });
        console.log(`=== ESTADO FINAL CAMPAÑA 5: ${postsC5.length} posts, ${commentsC5.length} comentarios ===`);

        process.exit(0);
    } catch (err) {
        console.error('Error en test:', err);
        process.exit(1);
    }
})();
