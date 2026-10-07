require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Campaign = require('../models/Campaign');
const SocialMediaPost = require('../models/SocialMediaPost');
const SocialPostComment = require('../models/SocialPostComment');

(async () => {
    try {
        const campaigns = await Campaign.findAll();
        console.log('=== CAMPAÑAS ENCONTRADAS ===');
        campaigns.forEach(c => {
            console.log(`[ID ${c.id}] ${c.nombre} | Candidato: ${c.candidato} | FB: ${c.link_facebook} | IG: ${c.link_instagram} | X: ${c.link_twitter}`);
        });

        const posts = await SocialMediaPost.findAll();
        console.log(`\n=== TOTAL POSTS: ${posts.length} ===`);
        posts.forEach(p => {
            console.log(`[Post ${p.id}] Campaña: ${p.campana_id} | ${p.plataforma} | ${p.autor_nombre} | ${p.titulo.substring(0, 50)}...`);
        });

        const comments = await SocialPostComment.findAll();
        console.log(`\n=== TOTAL COMENTARIOS: ${comments.length} ===`);
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
})();
