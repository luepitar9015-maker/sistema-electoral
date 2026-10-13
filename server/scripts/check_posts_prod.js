const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Campaign = require('../models/Campaign');
const SocialMediaPost = require('../models/SocialMediaPost');

(async () => {
    const campaigns = await Campaign.findAll();
    console.log('=== CAMPAÑAS EN PRODUCCION ===');
    campaigns.forEach(c => console.log(`ID: ${c.id} | Candidato: ${c.candidato} | Nombre: ${c.nombre}`));

    const posts = await SocialMediaPost.findAll({ attributes: ['id', 'campana_id', 'autor_nombre', 'titulo'] });
    console.log('\nTotal posts:', posts.length);
    const byCamp = {};
    posts.forEach(p => byCamp[p.campana_id] = (byCamp[p.campana_id] || 0) + 1);
    console.log('Posts por campana_id:', byCamp);

    console.log('\nMuestra de posts con autor Oscar Villamizar:');
    posts.filter(p => (p.autor_nombre && p.autor_nombre.toLowerCase().includes('villamizar')) || (p.titulo && p.titulo.toLowerCase().includes('villamizar'))).slice(0, 10).forEach(p => {
        console.log(`ID: ${p.id} | Campaña: ${p.campana_id} | Autor: ${p.autor_nombre} | Titulo: ${p.titulo?.substring(0, 40)}`);
    });

    console.log('\nMuestra de posts con autor Diego:');
    posts.filter(p => (p.autor_nombre && p.autor_nombre.toLowerCase().includes('ariza')) || (p.titulo && p.titulo.toLowerCase().includes('ariza'))).slice(0, 10).forEach(p => {
        console.log(`ID: ${p.id} | Campaña: ${p.campana_id} | Autor: ${p.autor_nombre} | Titulo: ${p.titulo?.substring(0, 40)}`);
    });
    process.exit(0);
})();
