const SocialMediaPost = require('../models/SocialMediaPost');
const SocialPostComment = require('../models/SocialPostComment');
const Campaign = require('../models/Campaign');

(async () => {
    try {
        const campaigns = await Campaign.findAll();
        console.log('=== CAMPAIGNS ===');
        for (const c of campaigns) {
            const posts = await SocialMediaPost.findAll({ where: { campana_id: c.id } });
            console.log(`Campaign ${c.id}: ${c.candidato} (${c.nombre}) -> Posts: ${posts.length}`);
            for (const p of posts) {
                const comments = await SocialPostComment.findAll({ where: { post_id: p.id } });
                console.log(`   Post ID ${p.id} [${p.plataforma}]: '${p.titulo}'`);
                console.log(`      URL: ${p.url_publicacion}`);
                console.log(`      Comentarios conteo: ${p.comentarios_conteo} | Comments in DB: ${comments.length}`);
                if (comments.length > 0) {
                    console.log(`      Sample comment: [${comments[0].usuario_red}] '${comments[0].texto_comentario}' (reaccion: ${comments[0].tipo_reaccion}, es_equipo: ${comments[0].es_equipo_campana})`);
                }
            }
        }
        const totalComments = await SocialPostComment.count();
        console.log('Total comments in DB:', totalComments);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
})();
