const Campaign = require('../models/Campaign');
const SocialMediaPost = require('../models/SocialMediaPost');
const User = require('../models/User');

async function check() {
  const users = await User.findAll({ raw: true });
  console.log('\n=== USERS ===');
  users.forEach(u => console.log(`User ID: ${u.id} | email: ${u.email} | nombre: ${u.nombre} | role: ${u.role} | campana_id: ${u.campana_id}`));

  const campaigns = await Campaign.findAll({ raw: true });
  console.log('\n=== CAMPAIGNS ===');
  campaigns.forEach(c => console.log(`ID: ${c.id} | Nombre: ${c.nombre} | Candidato: ${c.candidato} | link_fb: ${c.link_facebook} | link_ig: ${c.link_instagram}`));
}

check().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
