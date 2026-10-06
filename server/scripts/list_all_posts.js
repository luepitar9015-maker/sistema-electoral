const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const SocialMediaPost = require('../models/SocialMediaPost');
const SocialPostComment = require('../models/SocialPostComment');

async function list() {
    const posts = await SocialMediaPost.findAll({ order: [['id', 'DESC']] });
    console.log(`TOTAL PUBLICACIONES EN BD: ${posts.length}`);
    for (const p of posts) {
        const comments = await SocialPostComment.count({ where: { post_id: p.id } });
        console.log(`- [ID ${p.id}] [Campaña ${p.campana_id}] [${p.plataforma.toUpperCase()}] ${p.titulo} (${comments} comentarios)`);
        console.log(`  Enlace: ${p.url_publicacion || 'N/A'}`);
        console.log(`  Contenido: ${p.contenido?.substring(0, 100)}...`);
    }
    process.exit(0);
}
list();
