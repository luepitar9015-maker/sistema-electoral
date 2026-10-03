const assert = require('assert');
const { calculateProgrammaticMetrics, calculateAudienceFatigue, analyzePostContent } = require('../services/contentIntelligenceService');
const { simulatePostPerformance } = require('../services/viralSimulationEngine');
const sequelize = require('../database/db');
const Campaign = require('../models/Campaign');
const SocialMediaPost = require('../models/SocialMediaPost');
const SocialContentAnalysis = require('../models/SocialContentAnalysis');

async function runTests() {
  console.log('🧪 Starting Phase 4 Content Intelligence & Simulation Engine Tests...');

  // Ensure DB connection
  await sequelize.authenticate();

  // Test 1: Programmatic Metric Calculations
  console.log('Test 1: Programmatic metric calculations...');
  const metrics1 = calculateProgrammaticMetrics({
    views: 10000,
    reach: 8000,
    likes: 400,
    comments: 80,
    shares: 120,
    saves: 50,
    watchTimeSeconds: 18,
    durationSeconds: 30
  });

  assert.ok(metrics1.engagement_rate > 0, 'Engagement rate should be > 0');
  assert.ok(metrics1.virality_score >= 10 && metrics1.virality_score <= 99, 'Virality score should be between 10 and 99');
  assert.strictEqual(metrics1.completion_rate, 60, 'Completion rate should be 18/30 = 60%');

  // Test with nulls and 0s (no division by zero)
  const metricsNull = calculateProgrammaticMetrics({ views: null, reach: 0, likes: 0 });
  assert.strictEqual(metricsNull.engagement_rate, 0);
  assert.strictEqual(metricsNull.completion_rate, null);
  console.log('✅ Test 1 Passed: Programmatic metric math handles nulls safely and computes realistic scores.');

  // Test 2: Mode A Viral Simulation Engine
  console.log('Test 2: Mode A Viral Simulation Engine...');
  const sim = simulatePostPerformance({
    durationSeconds: 30,
    hookStrength: 85,
    pacingScore: 80,
    fatigueScore: 15,
    platform: 'tiktok',
    seed: 12345
  });

  assert.strictEqual(sim.is_simulation, true);
  assert.strictEqual(sim.mode, 'MODO_A_SIMULACION_FICTICIA');
  assert.ok(sim.disclaimer.includes('SIMULACIÓN MATEMÁTICA FICTICIA'));
  assert.strictEqual(sim.results.retentionCurve.length, 31, 'Should have 31 points (0 to 30s)');
  assert.strictEqual(sim.results.retentionCurve[0].retentionPercentage, 100);
  assert.ok(sim.results.finalCompletionRate < 100, 'Completion should decline over time');
  assert.ok(sim.results.scenarios.moderado.projectedViews > sim.results.scenarios.conservador.projectedViews);

  // Determinism check with seed
  const sim2 = simulatePostPerformance({
    durationSeconds: 30,
    hookStrength: 85,
    pacingScore: 80,
    fatigueScore: 15,
    platform: 'tiktok',
    seed: 12345
  });
  assert.strictEqual(sim.results.finalCompletionRate, sim2.results.finalCompletionRate, 'Identical seed must yield identical results');
  console.log('✅ Test 2 Passed: Mode A simulation is mathematically consistent, reproducible, and watermarked.');

  // Test 3: Audience Fatigue Calculation
  console.log('Test 3: Audience fatigue calculation...');
  const fatigue = await calculateAudienceFatigue(1, 'tiktok');
  assert.ok(typeof fatigue.fatigueScore === 'number');
  assert.ok(['bajo', 'medio', 'alto'].includes(fatigue.level));
  console.log('✅ Test 3 Passed: Audience fatigue calculated.');

  // Test 4: Content Analysis & Persistence
  console.log('Test 4: Content Analysis persistence to database...');
  let testCampaign = await Campaign.findOne();
  if (!testCampaign) {
    testCampaign = await Campaign.create({
      nombre: 'Campaña Test Phase 4',
      candidato: 'Candidato Test',
      tipo: 'Alcaldía',
      presupuesto: 1000000
    });
  }

  const analysisResult = await analyzePostContent({
    campanaId: testCampaign.id,
    userId: 1,
    text: '¿Por qué las vías del norte siguen sin pavimentar? Tenemos el plan para resolverlo en 100 días.',
    durationSeconds: 35,
    platform: 'reels',
    topic: 'infraestructura',
    objective: 'propuesta',
    metrics: { views: 5000, reach: 4200, likes: 250, comments: 45, shares: 70 }
  });

  assert.ok(analysisResult.analysisId, 'Should return saved analysisId from database');
  assert.ok(Array.isArray(analysisResult.observations), 'Observations should be array');
  assert.ok(Array.isArray(analysisResult.hypotheses), 'Hypotheses should be array');
  assert.ok(Array.isArray(analysisResult.audiovisualTimeline), 'Timeline should be array');
  assert.ok(analysisResult.metrics.virality_score > 0);

  // Verify record in database
  const savedDbRecord = await SocialContentAnalysis.findByPk(analysisResult.analysisId);
  assert.ok(savedDbRecord, 'Record must exist in DB');
  assert.strictEqual(savedDbRecord.campana_id, testCampaign.id);
  console.log('✅ Test 4 Passed: Content analysis saved and retrieved from DB.');

  console.log('\n🎉 ALL 4 PHASE 4 TESTS PASSED SUCCESSFULLY!\n');
}

runTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Phase 4 Test Failed:', err);
    process.exit(1);
  });
