require('dotenv').config();
const Campaign = require('../models/Campaign');
const SocialMediaPost = require('../models/SocialMediaPost');

async function test() {
  const camps = await Campaign.findAll();
  console.log("=== CAMPAIGNS ===");
  console.log(JSON.stringify(camps.map(c => ({
    id: c.id,
    nombre: c.nombre,
    candidato: c.candidato,
    tipo_cargo: c.tipo_cargo,
    fb: c.link_facebook,
    ig: c.link_instagram,
    tw: c.link_twitter,
    tk: c.link_tiktok
  })), null, 2));

  const posts = await SocialMediaPost.findAll({ limit: 20 });
  console.log("=== POSTS (first 20) ===");
  console.log(JSON.stringify(posts.map(p => ({
    id: p.id,
    campana_id: p.campana_id,
    plataforma: p.plataforma,
    autor: p.autor_nombre,
    titulo: p.titulo
  })), null, 2));

  process.exit(0);
}

test().catch(e => { console.error(e); process.exit(1); });
