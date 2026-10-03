const Campaign = require('../models/Campaign');
const SocialMediaPost = require('../models/SocialMediaPost');
const { analyzePostContent } = require('../services/contentIntelligenceService');

async function simulateEstrategia180() {
  console.log('🚀 Iniciando simulación con cuenta real de Instagram: @estrategia180...');

  // 1. Vincular Instagram Oficial en la Campaña 1
  const campaign = await Campaign.findByPk(1);
  if (campaign) {
    campaign.link_instagram = 'https://www.instagram.com/estrategia180';
    await campaign.save();
    console.log('✅ Link oficial de Instagram de la campaña actualizado a: https://www.instagram.com/estrategia180');
  }

  // 2. Crear publicación real de Instagram Reel de @estrategia180
  const post = await SocialMediaPost.create({
    campana_id: 1,
    plataforma: 'instagram',
    autor_nombre: 'Estrategia 180',
    autor_usuario: '@estrategia180',
    url_publicacion: 'https://www.instagram.com/estrategia180',
    titulo: 'Estrategia 180: El error que destruye el alcance de las campañas en Reels',
    contenido: 'El error número uno en comunicación política no es el presupuesto: es hablarle al algoritmo como si fuera un boletín de prensa tradicional. Un reel efectivo necesita un gancho en los primeros 2.5 segundos, tensión narrativa y un llamado a la acción que invite a debatir en los comentarios. ¿Tu equipo sigue cometiendo este error? Comenta "AUDITORÍA" y te mostramos cómo revertirlo en 24 horas.',
    tipo_contenido: 'video',
    video_url: 'https://www.instagram.com/estrategia180',
    video_duration_seconds: 42,
    alcance: 18500,
    impresiones: 24200,
    reproducciones: 14800,
    likes: 1120,
    comentarios_conteo: 184,
    compartidos: 345,
    tema_estrategico: 'Comunicación y Estrategia Digital',
    fecha_publicacion: new Date().toISOString()
  });

  console.log(`✅ Post creado en DB con ID: ${post.id}`);

  // 3. Ejecutar análisis completo de Inteligencia de Contenido
  console.log('⚡ Ejecutando motor de Content Intelligence...');
  const analysis = await analyzePostContent({
    postId: post.id,
    campanaId: 1,
    userId: 1,
    text: post.contenido,
    durationSeconds: post.video_duration_seconds,
    platform: 'reels',
    topic: 'Comunicación y Estrategia Digital',
    objective: 'propuesta',
    metrics: {
      views: post.reproducciones,
      reach: post.alcance,
      likes: post.likes,
      comments: post.comentarios_conteo,
      shares: post.compartidos,
      saves: 142
    }
  });

  console.log('\n=============================================================');
  console.log('📊 RESULTADOS DEL ANÁLISIS DE INTELIGENCIA PARA @estrategia180:');
  console.log('=============================================================');
  console.log('🔹 Proveedor:', analysis.provider);
  console.log('🔹 Engagement Rate Calculado:', analysis.metrics?.engagement_rate + '%');
  console.log('🔹 Score Algorítmico / Viralidad:', analysis.metrics?.virality_score + ' / 100');
  console.log('🔹 Fuerza de Gancho Inicial (0-3s):', analysis.metrics?.hook_strength + '%');
  console.log('🔹 Segmentos de Línea de Tiempo:', analysis.audiovisualTimeline?.length);
  console.log('🔹 Observaciones Detectadas:');
  analysis.observations?.forEach((obs, i) => console.log(`   ${i + 1}. ${obs}`));
  console.log('🔹 Hipótesis Formuladas:');
  analysis.hypotheses?.forEach((hyp, i) => console.log(`   ${i + 1}. ${hyp}`));
  console.log('🔹 Recomendaciones:');
  analysis.recommendations?.forEach((rec, i) => console.log(`   ${i + 1}. ${rec}`));
  console.log('=============================================================\n');

  console.log('🎉 Simulación completada con éxito. Ya puedes verla en http://localhost:3000/social');
  process.exit(0);
}

simulateEstrategia180().catch(err => {
  console.error('❌ Error en simulación:', err);
  process.exit(1);
});
