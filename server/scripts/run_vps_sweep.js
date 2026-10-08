const { executeFullCandidateSweep } = require('../services/socialSyncService');
const Campaign = require('../models/Campaign');
const SocialMediaPost = require('../models/SocialMediaPost');

async function main() {
    console.log('=== RUNNING SWEEP ON VPS POSTGRES DB ===');
    const campaigns = await Campaign.findAll();
    for (const c of campaigns) {
        if (c.candidato && (c.candidato.toLowerCase().includes('ariza') || c.candidato.toLowerCase().includes('villamizar'))) {
            console.log('Ejecutando barrido para Campaña ID ' + c.id + ': ' + c.candidato + '...');
            const res = await executeFullCandidateSweep({ campanaId: c.id });
            console.log('Resultado: ' + res.mensaje + ' (Posts: ' + res.postsCreated + ', Comentarios: ' + res.commentsCreated + ')');
        }
    }

    // Clean any name prefixes from all posts in DB
    const posts = await SocialMediaPost.findAll();
    for (const p of posts) {
        const clean = (p.titulo || '').replace(/^(@[a-zA-Z0-9_]+|Oscar Villamizar|Diego Fran Ariza|Alejandro Gaviria):\s*/i, '');
        if (clean !== p.titulo) {
            p.titulo = clean;
            await p.save();
        }
    }
    console.log('=== BARRIDO EN VPS COMPLETADO EXITOSAMENTE ===');
}

main().then(() => process.exit(0)).catch(err => {
    console.error('Error en barrido VPS:', err);
    process.exit(1);
});
