require('dotenv').config();
const Campaign = require('../models/Campaign');
const socialSyncService = require('../services/socialSyncService');
const SocialMediaPost = require('../models/SocialMediaPost');
const SocialPostComment = require('../models/SocialPostComment');
const SocialTeamAccount = require('../models/SocialTeamAccount');
const { Op } = require('sequelize');

async function run() {
  console.log('🚀 Iniciando alineación y sincronización de redes para DIEGO ARIZA (Cámara de Representantes)...');

  // 1. Buscar o crear campaña de Diego Ariza
  let campaign = await Campaign.findOne({
    where: {
      [Op.or]: [
        { candidato: { [Op.like]: '%Ariza%' } },
        { nombre: { [Op.like]: '%Ariza%' } }
      ]
    }
  });

  const campaignData = {
    nombre: 'Cámara de Representantes 2026 - Diego Ariza',
    candidato: 'Diego Fran Ariza',
    tipo_cargo: 'camara',
    nivel_territorial: 'departamental',
    departamento: 'Boyacá',
    municipio: '',
    partido_politico: 'Coalición Regional por la Gente',
    numero_tarjeton: '101',
    meta_votos: 48000,
    color: '#00B894',
    eslogan: '¡Resultados que se sienten, compromiso con la gente!',
    link_facebook: 'https://www.facebook.com/diegofranariza/?locale=es_LA',
    link_instagram: 'https://www.instagram.com/diegofranariza/?hl=es',
    link_twitter: 'https://x.com/diegofranariza?lang=es',
    link_tiktok: 'https://www.tiktok.com/@diego.fran.ariza',
    fecha_inicio: '2026-01-10',
    fecha_elecciones: '2026-03-08',
    modo_operacion: 'electoral',
    periodo_gobierno: '2026-2030'
  };

  if (!campaign) {
    campaign = await Campaign.create(campaignData);
    console.log(`✅ Campaña creada con ID ${campaign.id}: ${campaign.nombre}`);
  } else {
    await campaign.update(campaignData);
    console.log(`✅ Campaña actualizada con ID ${campaign.id}: ${campaign.nombre}`);
  }

  // 2. Ejecutar barrido profundo y sincronización en todas las 4 plataformas
  console.log('📡 Ejecutando barrido profundo y extracción en Facebook, Instagram, Twitter y TikTok...');
  const sweepResult = await socialSyncService.executeFullCandidateSweep({ campanaId: campaign.id });
  console.log('📊 Resultado del barrido:', sweepResult);

  // 3. Resumen de datos en BD
  const postsCount = await SocialMediaPost.count({ where: { campana_id: campaign.id } });
  const commentsCount = await SocialPostComment.count({ where: { campana_id: campaign.id } });
  const teamCount = await SocialTeamAccount.count({ where: { campana_id: campaign.id } });

  console.log('\n======================================================');
  console.log(`🎉 SINCRONIZACIÓN EXITOSA PARA DIEGO FRAN ARIZA`);
  console.log(`📌 ID Campaña: ${campaign.id}`);
  console.log(`👤 Candidato: ${campaign.candidato} (${campaign.tipo_cargo.toUpperCase()})`);
  console.log(`📱 Redes alineadas:`);
  console.log(`   - Facebook:  ${campaign.link_facebook}`);
  console.log(`   - Instagram: ${campaign.link_instagram}`);
  console.log(`   - Twitter:   ${campaign.link_twitter}`);
  console.log(`   - TikTok:    ${campaign.link_tiktok}`);
  console.log(`📊 Métricas generadas para pruebas:`);
  console.log(`   - Publicaciones activas: ${postsCount}`);
  console.log(`   - Comentarios y reacciones: ${commentsCount}`);
  console.log(`   - Cuentas de equipo auditadas: ${teamCount}`);
  console.log('======================================================\n');

  process.exit(0);
}

run().catch(err => {
  console.error('❌ Error en el proceso:', err);
  process.exit(1);
});
