const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const sequelize = require('../database/db');
const Campaign = require('../models/Campaign');

(async () => {
    console.log('=== VERIFICANDO DEPENDENCIAS DE CAMPAÑAS 2, 5, 6, 7 ===');
    for (const cid of [2, 5, 6, 7]) {
        const [posts] = await sequelize.query(`SELECT count(*) as c FROM "SocialMediaPosts" WHERE campana_id = ${cid}`);
        const [voters] = await sequelize.query(`SELECT count(*) as c FROM "Voters" WHERE campana_id = ${cid}`);
        const [users] = await sequelize.query(`SELECT count(*) as c FROM "Users" WHERE campana_id = ${cid}`);
        console.log(`Campaña #${cid}: ${posts[0].c} posts, ${voters[0].c} votantes, ${users[0].c} usuarios`);
    }

    const c6 = await Campaign.findByPk(6);
    console.log('\nCampaign #6:', { id: c6?.id, nombre: c6?.nombre, candidato: c6?.candidato, partido: c6?.partido_politico, links: { fb: c6?.link_facebook, ig: c6?.link_instagram, yt: c6?.link_youtube } });
    const c7 = await Campaign.findByPk(7);
    console.log('Campaign #7:', { id: c7?.id, nombre: c7?.nombre, candidato: c7?.candidato, partido: c7?.partido_politico, links: { fb: c7?.link_facebook, ig: c7?.link_instagram, yt: c7?.link_youtube } });
    const Voter = require('../models/Voter');
    const voters7 = await Voter.findAll({ where: { campana_id: 7 }, limit: 5 });
    console.log('\nVotantes en Campaña 7:');
    voters7.forEach(v => console.log(`${v.id} | ${v.nombre} | ${v.municipio} | Lider: ${v.lider_asignado}`));
    
    const voters6 = await Voter.findAll({ where: { campana_id: 6 }, limit: 5 });
    console.log(`Votantes en Campaña 6: ${voters6.length}`);
    process.exit(0);
})();
