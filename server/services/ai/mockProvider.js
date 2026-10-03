const AIProvider = require('./aiProvider');
const { validateAndFormatAnalysis } = require('./outputValidator');

/**
 * Mock AI Provider
 * Provides deterministic, offline-capable analysis with zero external API calls or costs.
 * Strictly formats observations, computed metrics, hypotheses, and timeline.
 */
class MockProvider extends AIProvider {
  constructor() {
    super('mock');
  }

  /**
   * Generates deterministic, content-sensitive mock analysis
   */
  async analyzeContent({ text = '', durationSeconds = 30, platform = 'tiktok', topic = 'campaña', objective = 'movilizacion' }) {
    const wordCount = text ? text.trim().split(/\s+/).length : 0;
    const duration = Number(durationSeconds) > 0 ? Number(durationSeconds) : 30;
    const wordsPerMinute = duration > 0 ? Math.round((wordCount / duration) * 60) : 0;

    // First 3 seconds analysis (hook)
    const firstSentence = text ? text.split(/[.?!]/)[0] || text.slice(0, 60) : 'Sin texto';
    const hasQuestion = /[?¿]/.test(firstSentence);
    const hasNumbers = /\d+/.test(firstSentence);
    const hasCallToAction = /(comparte|comenta|sigueme|vota|unete|dale like|guarda)/i.test(text);

    // Timeline blocks
    const timeline = [
      {
        startTime: 0,
        endTime: Math.min(3, duration),
        segmentName: 'Gancho Inicial (0-3s)',
        observation: hasQuestion
          ? `Apertura con pregunta retórica: "${firstSentence.slice(0, 45)}..."`
          : `Apertura enunciativa estándar (${Math.round((firstSentence.split(' ').length / 3) * 60)} wpm)`,
        impact: hasQuestion || hasNumbers ? 'alto' : 'medio',
        recommendation: hasQuestion
          ? 'Buen gancho de curiosidad. Asegurar que el corte visual acompañe la pregunta antes de 1.5s.'
          : 'Recomendado: Añadir un elemento disruptivo en los primeros 1.5s (texto en pantalla de alto contraste o corte de cámara).'
      },
      {
        startTime: Math.min(3, duration),
        endTime: Math.min(12, Math.max(3, duration * 0.4)),
        segmentName: 'Desarrollo del Problema / Planteamiento',
        observation: `Ritmo de locución estimado en ${wordsPerMinute} palabras por minuto.`,
        impact: wordsPerMinute > 170 ? 'critico' : 'medio',
        recommendation: wordsPerMinute > 170
          ? 'Ritmo excesivamente acelerado para comprensión profunda. Espaciar con micro-pausas dramáticas.'
          : 'Mantener dinamismo rítmico con b-roll o cambios de plano cada 2.5 - 3.5 segundos.'
      },
      {
        startTime: Math.min(12, Math.max(3, duration * 0.4)),
        endTime: Math.max(12, duration - 5),
        segmentName: 'Propuesta de Valor / Núcleo Político',
        observation: `Tema central identificado: "${topic}". Enfoque de discurso hacia "${objective}".`,
        impact: 'alto',
        recommendation: 'Reforzar el beneficio para la comunidad en lugar de centrar la atención en la figura del candidato.'
      },
      {
        startTime: Math.max(12, duration - 5),
        endTime: duration,
        segmentName: 'Cierre y Llamado a la Acción (CTA)',
        observation: hasCallToAction
          ? 'Presencia de llamado a la acción explícito en el texto.'
          : 'No se detecta llamado a la acción directo en el guion.',
        impact: hasCallToAction ? 'alto' : 'medio',
        recommendation: hasCallToAction
          ? 'Asegurar que el llamado a la acción no corte abruptamente y aparezca en pantalla gráficamente.'
          : 'Añadir CTA específico: Ej. "¿Estás de acuerdo? Déjamelo en los comentarios para leerte".'
      }
    ];

    // Estimated metrics
    const retentionScore = Math.min(95, Math.max(35, 70 + (hasQuestion ? 8 : -5) + (hasCallToAction ? 5 : -4) - (duration > 60 ? 12 : 0)));
    const clarityScore = wordsPerMinute > 110 && wordsPerMinute < 165 ? 88 : 68;

    const raw = {
      observations: [
        `Duración del contenido: ${duration} segundos en plataforma objetivo ${platform.toUpperCase()}.`,
        `Extensión del guion: ${wordCount} palabras (${wordsPerMinute} palabras por minuto estimadas).`,
        hasQuestion
          ? 'Estructura de gancho: Comienza con pregunta directa en los primeros segundos.'
          : 'Estructura de gancho: Comienza con afirmación declarativa sin detonante de intriga inmediata.',
        hasCallToAction
          ? 'Llamado a la acción: Identificado dentro del contenido.'
          : 'Llamado a la acción: Ausente o implícito en el guion analizado.'
      ],
      metrics: {
        retention_potential: retentionScore,
        pacing_wpm: wordsPerMinute,
        clarity_index: clarityScore,
        hook_strength: hasQuestion || hasNumbers ? 85 : 55,
        estimated_completion_rate: Math.max(25, Math.round(retentionScore * 0.65))
      },
      hypotheses: [
        `HIPÓTESIS: Si el gancho visual no introduce dinamismo antes de los 2.2 segundos, la tasa de abandono en ${platform} podría concentrarse en el primer 15% del video.`,
        `HIPÓTESIS: El objetivo de "${objective}" tendría mayor tracción si el conflicto inicial se personaliza con un caso real de la ciudadanía en lugar de cifras abstractas.`
      ],
      audiovisualTimeline: timeline,
      recommendations: [
        'Insertar subtítulos dinámicos de alto contraste en los primeros 5 segundos (el 65% del consumo inicial ocurre sin audio).',
        'Incluir una pregunta polarizante o reflexiva al cierre para motivar el debate en la sección de comentarios.',
        'Cortar tiempos muertos o silencios de más de 0.4s en la edición final.'
      ],
      summary: `Análisis para ${platform.toUpperCase()} (${duration}s). Estructura con potencial de retención del ${retentionScore}%. Requiere optimizar gancho de apertura y ritmo de llamado a la acción.`
    };

    return validateAndFormatAnalysis(raw, { provider: 'mock', isMock: true });
  }

  /**
   * Generates mock script variations for A/B testing
   */
  async generateScriptSuggestions({ originalScript = '', targetObjective = 'movilizacion', platform = 'tiktok', variationCount = 3 }) {
    const baseHooks = [
      {
        type: 'Controversia Constructiva / Pregunta Retórica',
        hookText: '¿Por qué nadie en nuestra región se atreve a hablar de lo que pasó esta semana?',
        fullScript: `¿Por qué nadie en nuestra región se atreve a hablar de lo que pasó esta semana? ${originalScript.slice(0, 150)}... Si crees que esto debe cambiar, comparte este video con tu familia.`
      },
      {
        type: 'Dato de Impacto Inmediato',
        hookText: '3 de cada 5 familias viven esto todos los días, y la solución está a nuestro alcance.',
        fullScript: `3 de cada 5 familias viven esto todos los días. ${originalScript.slice(0, 150)}... Comenta qué harías tú en esta situación.`
      },
      {
        type: 'Historia Humana / Enfoque Cercano',
        hookText: 'Ayer hablé con una madre comunitaria y lo que me dijo me dejó pensando toda la noche.',
        fullScript: `Ayer hablé con una madre comunitaria y lo que me contó nos afecta a todos. ${originalScript.slice(0, 150)}... Únete a este movimiento.`
      }
    ];

    return baseHooks.slice(0, variationCount).map((v, i) => ({
      variantId: `variant_${i + 1}`,
      variantLabel: `Variante ${String.fromCharCode(65 + i)}: ${v.type}`,
      hook: v.hookText,
      proposedScript: v.fullScript,
      platform,
      targetObjective,
      disclaimer: 'VARIANTE GENERADA POR SIMULADOR MOCK'
    }));
  }

  /**
   * Generates hypotheses based on retention and drop-off points
   */
  async generateHypotheses({ metrics = {}, timeline = [] }) {
    return [
      {
        hypothesisId: 'hyp_1',
        factor: 'Gancho y primeros 3 segundos',
        text: 'HIPÓTESIS: La caída inicial en retención sugiere que el usuario no identificó el valor o conflicto del video antes del segundo 3.',
        confidence: 0.82,
        actionableSuggestion: 'Probar un gancho visual con texto grande centrado en el tercio superior de la pantalla.'
      },
      {
        hypothesisId: 'hyp_2',
        factor: 'Meseta central y densidad de información',
        text: 'HIPÓTESIS: La pérdida de retención a mitad de video coincide con un exceso de exposición sin cortes de cámara ni cambio de tono vocal.',
        confidence: 0.75,
        actionableSuggestion: 'Insertar un gráfico o apoyo visual cada 4 segundos durante la explicación de propuestas.'
      }
    ];
  }
}

module.exports = MockProvider;
