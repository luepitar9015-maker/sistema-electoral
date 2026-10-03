const SocialContentAnalysis = require('../models/SocialContentAnalysis');
const SocialMetricSnapshot = require('../models/SocialMetricSnapshot');
const SocialMediaPost = require('../models/SocialMediaPost');
const Campaign = require('../models/Campaign');
const aiService = require('./ai/index');

/**
 * Calculates programmatic metrics from raw social interaction counts
 * Safe against NULL and zero values.
 */
function calculateProgrammaticMetrics({ views = null, reach = null, likes = 0, comments = 0, shares = 0, saves = 0, watchTimeSeconds = null, durationSeconds = null }) {
  const safeReach = Number(reach) > 0 ? Number(reach) : (Number(views) > 0 ? Number(views) : 1);
  const safeLikes = Math.max(0, Number(likes) || 0);
  const safeComments = Math.max(0, Number(comments) || 0);
  const safeShares = Math.max(0, Number(shares) || 0);
  const safeSaves = Math.max(0, Number(saves) || 0);

  // Weighted engagement index (Shares and Saves reflect higher intent than passive likes)
  const weightedInteractions = (safeLikes * 1) + (safeComments * 2) + (safeShares * 3) + (safeSaves * 4);
  const engagementRate = Math.min(100, Math.round(((weightedInteractions / safeReach) * 100) * 100) / 100);

  // Calculated virality score (shares to reach ratio + comment velocity)
  // Replaces the hardcoded 72!
  const shareRatio = safeShares / safeReach;
  const viralityIndex = Math.min(100, Math.round(
    (shareRatio * 350) + 
    ((safeComments / safeReach) * 200) + 
    (engagementRate * 0.4)
  ));

  // Completion rate calculation if duration and watch time are available
  let completionRate = null;
  if (Number(durationSeconds) > 0 && Number(watchTimeSeconds) >= 0) {
    completionRate = Math.min(100, Math.round((Number(watchTimeSeconds) / Number(durationSeconds)) * 100));
  }

  return {
    engagement_rate: engagementRate,
    virality_score: Math.max(10, Math.min(99, viralityIndex || 45)),
    completion_rate: completionRate,
    share_to_like_ratio: safeLikes > 0 ? Math.round((safeShares / safeLikes) * 100) / 100 : 0,
    weighted_interactions: weightedInteractions
  };
}

/**
 * Calculates audience fatigue factor based on post frequency and metric trajectory
 */
async function calculateAudienceFatigue(campanaId, platform = null) {
  if (!campanaId) return { fatigueScore: 0, level: 'bajo', recommendation: 'Frecuencia adecuada' };

  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const whereClause = {
      campana_id: campanaId,
      createdAt: { [require('sequelize').Op.gte]: oneWeekAgo }
    };
    if (platform) whereClause.plataforma = platform;

    const recentPostsCount = await SocialMediaPost.count({ where: whereClause });

    // Fatigue threshold: > 14 posts/week in one platform starts saturating organic reach
    let fatigueScore = Math.min(100, Math.round((recentPostsCount / 20) * 100));
    let level = 'bajo';
    let recommendation = 'Ritmo de publicación saludable.';

    if (fatigueScore >= 70) {
      level = 'alto';
      recommendation = 'Alta saturación detectada. Riesgo de penalización algorítmica por fatiga de audiencia. Espaciar publicaciones.';
    } else if (fatigueScore >= 40) {
      level = 'medio';
      recommendation = 'Frecuencia moderada. Variar formatos para evitar desinterés.';
    }

    return {
      fatigueScore,
      level,
      recentPostsCount,
      recommendation
    };
  } catch (err) {
    console.warn('⚠️ [calculateAudienceFatigue] Error:', err.message);
    return { fatigueScore: 20, level: 'bajo', recommendation: 'Frecuencia normal' };
  }
}

/**
 * Analyzes post content, computes programmatic metrics and calls AI abstraction layer
 */
async function analyzePostContent({ postId, campanaId, userId, text, durationSeconds, platform, topic, objective, metrics = {} }) {
  // 1. Programmatic calculations
  const progMetrics = calculateProgrammaticMetrics(metrics);
  const fatigue = await calculateAudienceFatigue(campanaId, platform);

  // 2. AI Structured Analysis
  const aiInput = {
    text: text || '',
    durationSeconds: Number(durationSeconds) || 30,
    platform: platform || 'tiktok',
    topic: topic || 'general',
    objective: objective || 'movilizacion',
    calculatedMetrics: progMetrics
  };

  const aiAnalysis = await aiService.analyzeContent(aiInput, { userId, campanaId });

  // 3. Combine programmatic metrics into the output
  const mergedMetrics = {
    ...aiAnalysis.metrics,
    ...progMetrics,
    fatigue_index: fatigue.fatigueScore,
    fatigue_level: fatigue.level
  };

  // 4. Persist analysis to database
  let savedRecord = null;
  try {
    let safeCampanaId = campanaId;
    if (!safeCampanaId) {
      const defaultCamp = await Campaign.findOne();
      safeCampanaId = defaultCamp ? defaultCamp.id : 1;
    }

    savedRecord = await SocialContentAnalysis.create({
      post_id: postId || null,
      campana_id: safeCampanaId,
      source_type: postId ? 'post' : 'draft',
      observations_json: aiAnalysis.observations,
      calculated_metrics_json: mergedMetrics,
      hypotheses_json: aiAnalysis.hypotheses,
      audiovisual_timeline_json: aiAnalysis.audiovisualTimeline,
      recommendations_json: aiAnalysis.recommendations,
      audience_retention_score: mergedMetrics.retention_potential || mergedMetrics.virality_score,
      hook_retention_score: mergedMetrics.hook_strength || 50,
      fatigue_score: fatigue.fatigueScore,
      ai_provider_used: aiAnalysis.provider,
      review_status: 'generado',
      is_simulation: Boolean(aiAnalysis.is_mock)
    });
  } catch (dbErr) {
    console.error('⚠️ [SocialContentAnalysis.create] Database save error:', dbErr.message);
  }

  return {
    analysisId: savedRecord ? savedRecord.id : null,
    postId,
    campanaId,
    disclaimer: aiAnalysis.disclaimer,
    isMock: aiAnalysis.is_mock,
    provider: aiAnalysis.provider,
    observations: aiAnalysis.observations,
    metrics: mergedMetrics,
    hypotheses: aiAnalysis.hypotheses,
    audiovisualTimeline: aiAnalysis.audiovisualTimeline,
    recommendations: aiAnalysis.recommendations,
    fatigueAnalysis: fatigue,
    summary: aiAnalysis.summary,
    createdAt: new Date().toISOString()
  };
}

module.exports = {
  calculateProgrammaticMetrics,
  calculateAudienceFatigue,
  analyzePostContent
};
