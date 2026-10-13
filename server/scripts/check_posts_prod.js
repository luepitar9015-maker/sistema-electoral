const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Campaign = require('../models/Campaign');
const SocialMediaPost = require('../models/SocialMediaPost');

(async () => {
    const User = require('../models/User');
    const users = await User.findAll({ attributes: ['id', 'nombre', 'email', 'role', 'campana_id'] });
    console.log('\n=== USUARIOS EN PRODUCCION ===');
    users.forEach(u => console.log(`ID: ${u.id} | Nombre: ${u.nombre} | Role: ${u.role} | Campaña: ${u.campana_id}`));

    const posts = await SocialMediaPost.findAll({ attributes: ['id', 'campana_id', 'autor_nombre', 'titulo'] });
    console.log('\nTotal posts:', posts.length);
    const byCamp = {};
    posts.forEach(p => byCamp[p.campana_id] = (byCamp[p.campana_id] || 0) + 1);
    console.log('Posts por campana_id:', byCamp);

    const SocialCompetitor = require('../models/SocialCompetitor');
    const SocialNegativeComment = require('../models/SocialNegativeComment');
    const comps = await SocialCompetitor.findAll();
    console.log('\n=== COMPETITORS ===');
    comps.forEach(c => console.log(`ID: ${c.id} | Campaña: ${c.campana_id} | Nombre: ${c.nombre_candidato}`));

    const negs = await SocialNegativeComment.findAll();
    console.log('\n=== NEGATIVE COMMENTS ===');
    console.log('Total negs:', negs.length);
    negs.slice(0, 5).forEach(n => console.log(`ID: ${n.id} | Campaña: ${n.campana_id} | Usuario: ${n.usuario_comenta} | Texto: ${n.texto_comentario?.substring(0, 40)}`));

    // Revisar qué posts tienen campana_id = 6 (Diego) pero autor o texto de Oscar Villamizar
    console.log('\n=== REVISANDO POSTS DE CAMPAÑA 6 (DIEGO) ===');
    const postsCamp6 = posts.filter(p => p.campana_id === 6);
    console.log('Total posts en campaña 6:', postsCamp6.length);
    const villamizarIn6 = postsCamp6.filter(p => (p.autor_nombre && p.autor_nombre.toLowerCase().includes('villamizar')) || (p.titulo && p.titulo.toLowerCase().includes('villamizar')));
    console.log('Posts en Campaña 6 que mencionan a Villamizar:', villamizarIn6.length);
    villamizarIn6.forEach(p => console.log(`ID: ${p.id} | Autor: ${p.autor_nombre} | Titulo: ${p.titulo}`));

    // Revisar qué posts tienen autor Diego pero otra campana_id
    console.log('\n=== REVISANDO POSTS DE DIEGO EN OTRAS CAMPAÑAS ===');
    const diegoInOthers = posts.filter(p => p.campana_id !== 6 && ((p.autor_nombre && p.autor_nombre.toLowerCase().includes('ariza')) || (p.titulo && p.titulo.toLowerCase().includes('ariza'))));
    console.log('Posts de Diego en otras campañas:', diegoInOthers.length);
    diegoInOthers.forEach(p => console.log(`ID: ${p.id} | Campaña: ${p.campana_id} | Autor: ${p.autor_nombre} | Titulo: ${p.titulo}`));
    process.exit(0);
})();
