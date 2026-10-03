/**
 * Output Validator for Content Intelligence
 * Guarantees strict structure and separates:
 * 1. OBSERVACIONES (Verifiable facts)
 * 2. MÉTRICAS (Numeric estimates / calculated indicators)
 * 3. HIPÓTESIS (Explicitly labeled AI hypotheses)
 * 4. CRONOLOGÍA AUDIOVISUAL (Timeline breakdowns)
 */

function validateAndFormatAnalysis(raw, options = {}) {
  const result = {
    provider: options.provider || 'unknown',
    is_mock: Boolean(options.isMock),
    disclaimer: options.isMock
      ? 'DATOS SIMULADOS / GENERADOR MOCK: Utilizado para pruebas sin costo de API.'
      : 'ANÁLISIS ASISTIDO POR IA: Las observaciones son hechos verificables; las hipótesis son conjeturas probabilísticas que requieren juicio del equipo de campaña.',
    observations: [],
    metrics: {},
    hypotheses: [],
    audiovisualTimeline: [],
    recommendations: [],
    summary: ''
  };

  if (!raw || typeof raw !== 'object') {
    result.observations.push('No se recibieron datos estructurados del proveedor.');
    result.hypotheses.push('El análisis requiere mayor detalle en el contenido original.');
    return result;
  }

  // 1. Observations
  if (Array.isArray(raw.observations)) {
    result.observations = raw.observations
      .filter(item => typeof item === 'string' && item.trim().length > 0)
      .map(item => item.trim());
  } else if (typeof raw.observations === 'string') {
    result.observations = [raw.observations.trim()];
  }

  // 2. Metrics
  if (raw.metrics && typeof raw.metrics === 'object' && !Array.isArray(raw.metrics)) {
    for (const [k, v] of Object.entries(raw.metrics)) {
      if (typeof v === 'number' && !isNaN(v)) {
        result.metrics[k] = Math.round(v * 100) / 100;
      } else if (typeof v === 'string') {
        result.metrics[k] = v;
      }
    }
  }

  // 3. Hypotheses (Must always start with "HIPÓTESIS:" if not already present)
  if (Array.isArray(raw.hypotheses)) {
    result.hypotheses = raw.hypotheses
      .filter(item => typeof item === 'string' && item.trim().length > 0)
      .map(item => {
        const clean = item.trim();
        return clean.toUpperCase().startsWith('HIPÓTESIS') || clean.toUpperCase().startsWith('HIPOTESIS')
          ? clean
          : `HIPÓTESIS: ${clean}`;
      });
  }

  // 4. Audiovisual Timeline
  if (Array.isArray(raw.audiovisualTimeline)) {
    result.audiovisualTimeline = raw.audiovisualTimeline.map((block, idx) => ({
      index: idx + 1,
      startTime: Number(block.startTime || block.start || 0),
      endTime: Number(block.endTime || block.end || (block.startTime || 0) + 3),
      segmentName: String(block.segmentName || block.segment || `Segmento ${idx + 1}`),
      observation: String(block.observation || ''),
      impact: String(block.impact || 'medio'), // bajo, medio, alto, critico
      recommendation: String(block.recommendation || '')
    }));
  }

  // 5. Recommendations
  if (Array.isArray(raw.recommendations)) {
    result.recommendations = raw.recommendations
      .filter(r => typeof r === 'string' && r.trim().length > 0)
      .map(r => r.trim());
  }

  // Summary
  result.summary = typeof raw.summary === 'string' ? raw.summary.trim() : '';

  return result;
}

module.exports = {
  validateAndFormatAnalysis
};
