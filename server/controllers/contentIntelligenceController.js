const SocialContentAnalysis = require('../models/SocialContentAnalysis');
const SocialMetricSnapshot = require('../models/SocialMetricSnapshot');
const SocialMediaPost = require('../models/SocialMediaPost');
const SocialExperiment = require('../models/SocialExperiment');
const { analyzePostContent, calculateAudienceFatigue } = require('../services/contentIntelligenceService');
const { simulatePostPerformance } = require('../services/viralSimulationEngine');
const aiService = require('../services/ai/index');

/**
 * Helper to safely resolve campaign ID from any authenticated request format
 */
function getCampanaId(req) {
  return req.campana_id || req.campaignId || (req.query && req.query.campana_id) || (req.body && req.body.campana_id) || null;
}

// POST /api/social/intelligence/analyze
exports.analyzePost = async (req, res) => {
  try {
    const { postId, text, durationSeconds, platform, topic, objective, metrics } = req.body;
    const campanaId = getCampanaId(req);
    const userId = req.user?.id;

    let postText = text;
    let postDuration = durationSeconds;
    let postPlatform = platform;
    let postMetrics = metrics || {};

    if (postId) {
      const existingPost = await SocialMediaPost.findOne({
        where: { id: postId, campana_id: campanaId }
      });
      if (!existingPost) {
        return res.status(404).json({ error: 'Publicación no encontrada en la campaña autorizada.' });
      }
      postText = postText || existingPost.contenido;
      postPlatform = postPlatform || existingPost.plataforma;
      postDuration = postDuration || existingPost.video_duration_seconds || 30;
      postMetrics = {
        likes: existingPost.likes,
        comments: existingPost.comentarios,
        shares: existingPost.compartidos,
        views: existingPost.reproducciones,
        reach: existingPost.alcance,
        ...postMetrics
      };
    }

    const result = await analyzePostContent({
      postId,
      campanaId,
      userId,
      text: postText,
      durationSeconds: postDuration,
      platform: postPlatform,
      topic,
      objective,
      metrics: postMetrics
    });

    return res.json({
      success: true,
      analysis: result
    });
  } catch (err) {
    console.error('[contentIntelligenceController.analyzePost] Error:', err);
    return res.status(500).json({ error: 'Error al procesar el análisis de contenido: ' + err.message });
  }
};

// GET /api/social/intelligence/post/:postId
exports.getPostAnalysis = async (req, res) => {
  try {
    const { postId } = req.params;
    const campanaId = getCampanaId(req);

    const post = await SocialMediaPost.findOne({
      where: { id: postId, campana_id: campanaId }
    });
    if (!post) {
      return res.status(404).json({ error: 'Publicación no encontrada en la campaña.' });
    }

    const analyses = await SocialContentAnalysis.findAll({
      where: { post_id: postId, campana_id: campanaId },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    const snapshots = await SocialMetricSnapshot.findAll({
      where: { post_id: postId },
      order: [['snapshot_time', 'ASC']],
      limit: 30
    });

    return res.json({
      success: true,
      post,
      latestAnalysis: analyses[0] || null,
      history: analyses,
      metricSnapshots: snapshots
    });
  } catch (err) {
    console.error('[contentIntelligenceController.getPostAnalysis] Error:', err);
    return res.status(500).json({ error: 'Error al obtener análisis de la publicación.' });
  }
};

// POST /api/social/intelligence/simulate (MODO A - Simulación Ficticia)
exports.simulatePerformance = async (req, res) => {
  try {
    const { durationSeconds, hookStrength, pacingScore, fatigueScore, platform, seed } = req.body;
    const campanaId = getCampanaId(req);

    // Use campaign's actual fatigue if not explicitly overridden
    let actualFatigue = fatigueScore;
    if (actualFatigue === undefined && campanaId) {
      const fatigueData = await calculateAudienceFatigue(campanaId, platform);
      actualFatigue = fatigueData.fatigueScore;
    }

    const simulation = simulatePostPerformance({
      durationSeconds,
      hookStrength,
      pacingScore,
      fatigueScore: actualFatigue,
      platform,
      seed
    });

    return res.json({
      success: true,
      simulation
    });
  } catch (err) {
    console.error('[contentIntelligenceController.simulatePerformance] Error:', err);
    return res.status(500).json({ error: 'Error en el motor de simulación: ' + err.message });
  }
};

// POST /api/social/intelligence/compare-variants
exports.compareVariants = async (req, res) => {
  try {
    const { variants = [], platform = 'tiktok', durationSeconds = 30 } = req.body;

    if (!Array.isArray(variants) || variants.length < 2) {
      return res.status(400).json({ error: 'Se requieren al menos 2 variantes para comparar.' });
    }

    const compared = variants.map((v, idx) => {
      const sim = simulatePostPerformance({
        durationSeconds: v.durationSeconds || durationSeconds,
        hookStrength: v.hookStrength || 70,
        pacingScore: v.pacingScore || 75,
        platform,
        seed: 1000 + idx
      });

      return {
        variantId: v.id || `variant_${idx + 1}`,
        label: v.label || `Variante ${String.fromCharCode(65 + idx)}`,
        hook: v.hook || '',
        script: v.script || '',
        algorithmPotentialScore: sim.results.algorithmPotentialScore,
        averageRetentionPercentage: sim.results.averageRetentionPercentage,
        finalCompletionRate: sim.results.finalCompletionRate,
        projectedViews: sim.results.scenarios.moderado.projectedViews,
        retentionCurve: sim.results.retentionCurve,
        is_simulation: true
      };
    });

    const winner = [...compared].sort((a, b) => b.algorithmPotentialScore - a.algorithmPotentialScore)[0];

    return res.json({
      success: true,
      mode: 'MODO_A_SIMULACION_A_B',
      disclaimer: 'COMPARACIÓN DE VARIANTES SIMULADA — Herramienta predictiva para optimización de contenido antes de rodaje o publicación.',
      variants: compared,
      winningVariant: winner
    });
  } catch (err) {
    console.error('[contentIntelligenceController.compareVariants] Error:', err);
    return res.status(500).json({ error: 'Error al comparar variantes.' });
  }
};

// POST /api/social/intelligence/suggestions
exports.generateSuggestions = async (req, res) => {
  try {
    const { originalScript, targetObjective, platform, count = 3 } = req.body;
    const userId = req.user?.id;
    const campanaId = getCampanaId(req);

    const suggestions = await aiService.generateScriptSuggestions({
      originalScript,
      targetObjective,
      platform,
      variationCount: count
    }, { userId, campanaId });

    return res.json({
      success: true,
      suggestions
    });
  } catch (err) {
    console.error('[contentIntelligenceController.generateSuggestions] Error:', err);
    return res.status(500).json({ error: 'Error al generar sugerencias: ' + err.message });
  }
};

// POST /api/social/intelligence/experiments
exports.createExperiment = async (req, res) => {
  try {
    const { titulo, descripcion, tipo_experimento, post_a_id, post_b_id, hipotesis, modo } = req.body;
    const campanaId = getCampanaId(req);

    const experiment = await SocialExperiment.create({
      campana_id: campanaId,
      titulo,
      descripcion,
      tipo_experimento: tipo_experimento || 'gancho_hook',
      post_a_id: post_a_id || null,
      post_b_id: post_b_id || null,
      hipotesis,
      modo: modo === 'real' ? 'real' : 'simulado',
      estado: 'en_curso',
      fecha_inicio: new Date()
    });

    return res.status(201).json({
      success: true,
      experiment
    });
  } catch (err) {
    console.error('[contentIntelligenceController.createExperiment] Error:', err);
    return res.status(500).json({ error: 'Error al crear experimento: ' + err.message });
  }
};

// GET /api/social/intelligence/experiments
exports.getExperiments = async (req, res) => {
  try {
    const campanaId = getCampanaId(req);
    const experiments = await SocialExperiment.findAll({
      where: { campana_id: campanaId },
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      success: true,
      experiments
    });
  } catch (err) {
    console.error('[contentIntelligenceController.getExperiments] Error:', err);
    return res.status(500).json({ error: 'Error al listar experimentos.' });
  }
};

// GET /api/social/intelligence/insights
exports.getCampaignInsights = async (req, res) => {
  try {
    const campanaId = getCampanaId(req);
    const fatigue = await calculateAudienceFatigue(campanaId);

    const analyses = await SocialContentAnalysis.findAll({
      where: { campana_id: campanaId },
      limit: 50,
      order: [['createdAt', 'DESC']]
    });

    let avgRetention = 0;
    let avgHook = 0;
    if (analyses.length > 0) {
      avgRetention = Math.round(
        analyses.reduce((sum, a) => sum + (Number(a.audience_retention_score) || 0), 0) / analyses.length
      );
      avgHook = Math.round(
        analyses.reduce((sum, a) => sum + (Number(a.hook_retention_score) || 0), 0) / analyses.length
      );
    }

    const aiStatus = aiService.getStatus();

    return res.json({
      success: true,
      campanaId,
      fatigue,
      aggregatedStats: {
        totalAnalyses: analyses.length,
        averageRetentionScore: avgRetention || 72,
        averageHookScore: avgHook || 68
      },
      aiProviderStatus: aiStatus,
      recentAnalyses: analyses.slice(0, 5)
    });
  } catch (err) {
    console.error('[contentIntelligenceController.getCampaignInsights] Error:', err);
    return res.status(500).json({ error: 'Error al obtener insights de la campaña.' });
  }
};
