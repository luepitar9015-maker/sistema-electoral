const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const sequelize = require('../database/db');

(async () => {
    console.log('=== VERIFICANDO DEPENDENCIAS DE CAMPAÑAS 2, 5, 6, 7 ===');
    for (const cid of [2, 5, 6, 7]) {
        const [posts] = await sequelize.query(`SELECT count(*) as c FROM "SocialMediaPosts" WHERE campana_id = ${cid}`);
        const [voters] = await sequelize.query(`SELECT count(*) as c FROM "Voters" WHERE campana_id = ${cid}`);
        const [users] = await sequelize.query(`SELECT count(*) as c FROM "Users" WHERE campana_id = ${cid}`);
    const Campaign = require('../models/Campaign');
    const c6 = await Campaign.findByPk(6);
    console.log('\nCampaign #6:', { id: c6?.id, nombre: c6?.nombre, candidato: c6?.candidato, partido: c6?.partido_politico, links: { fb: c6?.link_facebook, ig: c6?.link_instagram, yt: c6?.link_youtube } });
    const c7 = await Campaign.findByPk(7);
    console.log('Campaign #7:', { id: c7?.id, nombre: c7?.nombre, candidato: c7?.candidato, partido: c7?.partido_politico, links: { fb: c7?.link_facebook, ig: c7?.link_instagram, yt: c7?.link_youtube } });
    const c5 = await Campaign.findByPk(5);
    console.log('Campaign #5:', { id: c5?.id, nombre: c5?.nombre, candidato: c5?.candidato, partido: c5?.partido_politico, links: { fb: c5?.link_facebook, ig: c5?.link_instagram, yt: c5?.link_youtube } });
    process.exit(0);
})();
