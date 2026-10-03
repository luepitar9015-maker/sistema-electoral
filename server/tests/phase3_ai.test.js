const assert = require('assert');
const { sanitizeText, sanitizePayload } = require('../services/ai/aiPrivacyService');
const { validateAndFormatAnalysis } = require('../services/ai/outputValidator');
const MockProvider = require('../services/ai/mockProvider');
const aiService = require('../services/ai/index');

async function runTests() {
  console.log('🧪 Starting Phase 3 AI Abstraction & Privacy Tests...');

  // Test 1: Privacy PII Stripping
  console.log('Test 1: PII Sanitization...');
  const sampleWithPii = 'Candidato Juan, llamar al 3154567890 o al correo prueba@campana.com con CC 1020304050 para revisar el guion.';
  const sanitized = sanitizeText(sampleWithPii);
  assert.ok(!sanitized.sanitizedText.includes('3154567890'), 'Should redact phone number');
  assert.ok(!sanitized.sanitizedText.includes('prueba@campana.com'), 'Should redact email');
  assert.ok(!sanitized.sanitizedText.includes('1020304050'), 'Should redact national ID');
  assert.ok(sanitized.redactedCount >= 3, 'Should count at least 3 redactions');

  const deepObj = {
    title: 'Discurso',
    cedula: '123456789',
    voter_id: 42,
    details: {
      phone: '3001234567',
      text: 'Contactar a 3209876543'
    }
  };
  const deepCleaned = sanitizePayload(deepObj);
  assert.strictEqual(deepCleaned.cedula, '[REDACTADO_POR_SEGURIDAD]');
  assert.strictEqual(deepCleaned.voter_id, '[REDACTADO_POR_SEGURIDAD]');
  assert.ok(!deepCleaned.details.text.includes('3209876543'));
  console.log('✅ Test 1 Passed: PII successfully redacted.');

  // Test 2: Output Validator
  console.log('Test 2: Output Validator schema enforcement...');
  const rawData = {
    observations: ['El video inicia con un corte dinámico.'],
    metrics: { retention: 78.555, pace: 140 },
    hypotheses: ['El abandono en el segundo 10 es por falta de dinamismo visual.'],
    audiovisualTimeline: [
      { start: 0, end: 3, segment: 'Gancho', observation: 'Bueno' }
    ]
  };
  const validated = validateAndFormatAnalysis(rawData, { isMock: true, provider: 'mock' });
  assert.strictEqual(validated.is_mock, true);
  assert.ok(Array.isArray(validated.observations));
  assert.strictEqual(validated.metrics.retention, 78.56);
  assert.ok(validated.hypotheses[0].startsWith('HIPÓTESIS:'), 'Hypotheses must start with HIPÓTESIS:');
  assert.strictEqual(validated.audiovisualTimeline[0].startTime, 0);
  assert.strictEqual(validated.audiovisualTimeline[0].endTime, 3);
  console.log('✅ Test 2 Passed: Schema validation and 3-section separation enforced.');

  // Test 3: Mock Provider
  console.log('Test 3: Mock Provider generation...');
  const mockProvider = new MockProvider();
  const analysis = await mockProvider.analyzeContent({
    text: '¿Sabías que podemos transformar nuestra comunidad? Escucha esta propuesta.',
    durationSeconds: 25,
    platform: 'tiktok',
    topic: 'educacion',
    objective: 'propuesta'
  });
  assert.strictEqual(analysis.is_mock, true);
  assert.ok(analysis.observations.length >= 2, 'Should provide at least 2 observations');
  assert.ok(analysis.hypotheses.length >= 1, 'Should provide at least 1 hypothesis');
  assert.ok(analysis.audiovisualTimeline.length >= 3, 'Should divide into timeline segments');
  assert.ok(typeof analysis.metrics.retention_potential === 'number');

  const suggestions = await mockProvider.generateScriptSuggestions({
    originalScript: 'Queremos mejorar los parques del municipio.',
    variationCount: 2
  });
  assert.strictEqual(suggestions.length, 2);
  assert.ok(suggestions[0].hook.length > 0);
  console.log('✅ Test 3 Passed: Mock provider generates rich structured audiovisual analysis.');

  // Test 4: AI Service Manager & Status
  console.log('Test 4: AI Service Manager...');
  const status = aiService.getStatus();
  assert.ok(status.provider, 'Should report active provider');
  console.log('Active provider reported:', status);

  const serviceAnalysis = await aiService.analyzeContent({
    text: 'Propuesta de movilidad para todos los ciudadanos.',
    durationSeconds: 40
  }, { userId: 1, campanaId: 1 });
  assert.ok(serviceAnalysis.observations.length > 0);
  console.log('✅ Test 4 Passed: AI Service Manager executes with logging context.');

  console.log('\n🎉 ALL 4 PHASE 3 TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch(err => {
  console.error('❌ Phase 3 Test Failed:', err);
  process.exit(1);
});
