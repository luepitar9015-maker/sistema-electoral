require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Campaign = require('../models/Campaign');
const SocialMediaPost = require('../models/SocialMediaPost');
const SocialPostComment = require('../models/SocialPostComment');
const { Op } = require('sequelize');

(async () => {
    try {
        console.log('--- ALINEANDO CAMPAÑAS DE OSCAR VILLAMIZAR ---');
        // Limpiar cualquier post que mencione 'alejandrogaviria' o 'campanacolombia' en campaña 2
        await SocialMediaPost.destroy({
            where: {
                campana_id: 2,
                [Op.or]: [
                    { autor_nombre: { [Op.like]: '%alejandro%' } },
                    { autor_usuario: { [Op.like]: '%alejandro%' } },
                    { autor_nombre: { [Op.like]: '%campanacolombia%' } },
                    { autor_usuario: { [Op.like]: '%campanacolombia%' } }
                ]
            }
        });

        // Asegurar nombre oficial en campaña 2
        const camp2 = await Campaign.findByPk(2);
        if (camp2) {
            camp2.nombre = 'Senado 2026 - Oscar Villamizar';
            camp2.candidato = 'Oscar Villamizar';
            camp2.link_facebook = 'https://www.facebook.com/OscarVillamiz/?locale=es_LA';
            camp2.link_instagram = 'https://www.instagram.com/oscarvillamiz/?hl=es';
            camp2.link_twitter = 'https://x.com/OscarVillamiz';
            await camp2.save();
        }

        // Ejecutar barrido para campaña 2 también para que ambas tengan las 15 publicaciones idénticas
        const socialSyncService = require('../services/socialSyncService');
        await socialSyncService.executeFullCandidateSweep({ campanaId: 2 });
        await socialSyncService.executeFullCandidateSweep({ campanaId: 5 });

        console.log('✅ Ambas campañas (ID 2 y ID 5) alineadas y con barrido completo.');
        process.exit(0);
    } catch (err) {
        console.error('Error alineando:', err);
        process.exit(1);
    }
})();
