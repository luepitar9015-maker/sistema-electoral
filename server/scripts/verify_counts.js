const SocialMediaPost = require('../models/SocialMediaPost');
const SocialPostComment = require('../models/SocialPostComment');
const Campaign = require('../models/Campaign');

async function main() {
  try {
    const campaigns = await Campaign.findAll();
    for (const c of campaigns) {
      const posts = await SocialMediaPost.findAll({ where: { campana_id: c.id } });
      if (posts.length > 0) {
        const sum = {};
        for (const p of posts) {
          sum[p.plataforma] = (sum[p.plataforma] || 0) + 1;
        }
        const commentCount = await SocialPostComment.count({
          where: { post_id: posts.map(p => p.id) }
        });
        console.log(`Campaña ID ${c.id} (${c.candidato || c.nombre}): Total Posts = ${posts.length}, Comentarios = ${commentCount}`);
        console.log('   Por red:', JSON.stringify(sum));
      }
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
