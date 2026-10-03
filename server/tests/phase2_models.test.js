const test = require('node:test');
const assert = require('node:assert/strict');
const sequelize = require('../database/db');
const SocialMetricSnapshot = require('../models/SocialMetricSnapshot');
const SocialContentAnalysis = require('../models/SocialContentAnalysis');
const SocialExperiment = require('../models/SocialExperiment');
const AuditLog = require('../models/AuditLog');
const AIUsageLog = require('../models/AIUsageLog');
const SocialMediaPost = require('../models/SocialMediaPost');

test('Fase 2 Modelos: Sequelize sincroniza tablas no destructivamente', async () => {
    // Sincronizar sin force ni alter destructivo
    await sequelize.sync();
    assert.ok(true, 'La sincronización de base de datos debe completarse sin errores');
});

test('Fase 2 Modelos: SocialMetricSnapshot admite valores NULL y no los fuerza a cero', async () => {
    const snapshot = await SocialMetricSnapshot.create({
        campana_id: 1,
        post_id: 9999,
        source: 'real',
        views: 1500,
        reach: null, // Red social no proveyó esta métrica
        likes: 120,
        comments: null
    });

    assert.ok(snapshot.id, 'Debe crearse el snapshot');
    assert.strictEqual(snapshot.views, 1500);
    assert.strictEqual(snapshot.reach, null, 'NULL debe ser preservado y no convertirse en 0');
    assert.strictEqual(snapshot.comments, null, 'Métrica no provista debe ser null');

    await snapshot.destroy();
});

test('Fase 2 Modelos: SocialContentAnalysis separa observaciones, métricas e hipótesis', async () => {
    const analysis = await SocialContentAnalysis.create({
        campana_id: 1,
        post_id: 9999,
        analysis_type: 'video',
        provider: 'mock',
        model: 'mock-engine-v1',
        summary: 'Video corto de propuesta de salud',
        observations_json: JSON.stringify([
            { t: '00:00-00:03', tipo: 'gancho', detalle: 'Aparición del candidato hablando en primer plano' }
        ]),
        calculated_metrics_json: JSON.stringify({
            completion_rate: 68.4,
            engagement_rate: 7.2
        }),
        hypotheses_json: JSON.stringify([
            { hipotesis: 'Añadir subtítulos dinámicos podría aumentar el tiempo de reproducción promedio' }
        ]),
        review_status: 'pendiente'
    });

    assert.ok(analysis.id);
    const parsedObs = typeof analysis.observations_json === 'string' ? JSON.parse(analysis.observations_json) : analysis.observations_json;
    const parsedMet = typeof analysis.calculated_metrics_json === 'string' ? JSON.parse(analysis.calculated_metrics_json) : analysis.calculated_metrics_json;
    const parsedHyp = typeof analysis.hypotheses_json === 'string' ? JSON.parse(analysis.hypotheses_json) : analysis.hypotheses_json;

    assert.strictEqual(parsedObs[0].tipo, 'gancho');
    assert.strictEqual(parsedMet.completion_rate, 68.4);
    assert.ok(parsedHyp[0].hipotesis.includes('subtítulos'));
    assert.strictEqual(analysis.review_status, 'pendiente');

    await analysis.destroy();
});

test('Fase 2 Modelos: SocialExperiment modela pruebas A/B editoriales', async () => {
    const exp = await SocialExperiment.create({
        campana_id: 1,
        titulo: 'Video Corto (30s) vs Largo (90s) sobre Educación',
        hipotesis: 'El formato de 30s logrará mayor tasa de compartidos',
        tipo_experimento: 'duracion',
        modo: 'simulado',
        post_a_id: 101,
        post_b_id: 102,
        estado: 'en_curso'
    });

    assert.ok(exp.id);
    assert.strictEqual(exp.tipo_experimento, 'duracion');
    assert.strictEqual(exp.modo, 'simulado');

    await exp.destroy();
});

test('Fase 2 Modelos: AuditLog y AIUsageLog registran trazabilidad', async () => {
    const audit = await AuditLog.create({
        user_id: 1,
        campana_id: 1,
        action: 'SIMULATION_RUN',
        entity_type: 'SocialExperiment',
        entity_id: '42',
        metadata_json: JSON.stringify({ seed: 12345, duracion_h: 24 })
    });
    assert.ok(audit.id);
    await audit.destroy();

    const aiLog = await AIUsageLog.create({
        provider: 'mock',
        model: 'mock-engine-v1',
        operation: 'video_analysis',
        input_units: 450,
        output_units: 120,
        estimated_cost_usd: 0.0,
        campana_id: 1
    });
    assert.ok(aiLog.id);
    await aiLog.destroy();
});
