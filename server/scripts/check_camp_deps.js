const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const sequelize = require('../database/db');

(async () => {
    console.log('=== VERIFICANDO DEPENDENCIAS DE CAMPAÑAS 2, 5, 6, 7 ===');
    for (const cid of [2, 5, 6, 7]) {
        const [posts] = await sequelize.query(`SELECT count(*) as c FROM "SocialMediaPosts" WHERE campana_id = ${cid}`);
        const [voters] = await sequelize.query(`SELECT count(*) as c FROM "Voters" WHERE campana_id = ${cid}`);
        const [users] = await sequelize.query(`SELECT count(*) as c FROM "Users" WHERE campana_id = ${cid}`);
        console.log(`Campaña #${cid}: ${posts[0].c} posts, ${voters[0].c} votantes, ${users[0].c} usuarios`);
    }
    process.exit(0);
})();
