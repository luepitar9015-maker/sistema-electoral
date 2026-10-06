const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Campaign = require('../models/Campaign');

async function check() {
    try {
        const campaigns = await Campaign.findAll();
        console.log('=== CAMPAÑAS EN BASE DE DATOS ===');
        campaigns.forEach(c => {
            console.log(`ID: ${c.id} | Candidato: "${c.candidato}" | Cargo: "${c.tipo_cargo}" | Nombre: "${c.nombre}"`);
            console.log(`  FB: ${c.link_facebook || 'N/A'} | IG: ${c.link_instagram || 'N/A'} | X: ${c.link_twitter || 'N/A'}`);
        });
        process.exit(0);
    } catch(e) {
        console.error('Error:', e);
        process.exit(1);
    }
}
check();
