const SocialMediaPost = require('../models/SocialMediaPost');
const SocialPostComment = require('../models/SocialPostComment');
const Campaign = require('../models/Campaign');

async function check() {
  const c8 = await Campaign.findByPk(8);
  console.log('Campaign 8:', c8 ? c8.nombre : 'Not found');
  const posts = await SocialMediaPost.findAll({ where: { campana_id: 8 } });
  console.log('Campaign 8 posts count:', posts.length);
  posts.forEach(p => {
    console.log('Post ID:', p.id, '| Platform:', p.plataforma, '| Autor:', p.autor_nombre, '| Titulo:', p.titulo?.slice(0, 70));
  });

  const comments = await SocialPostComment.findAll({ where: { campana_id: 8 } });
  console.log('\nCampaign 8 comments count:', comments.length);
  comments.slice(0, 5).forEach(c => {
    console.log('Comment ID:', c.id, '| User:', c.usuario_red, '| Text:', c.texto_comentario?.slice(0, 60));
  });
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
