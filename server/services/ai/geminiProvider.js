const AIProvider = require('./aiProvider');
const MockProvider = require('./mockProvider');
const { validateAndFormatAnalysis } = require('./outputValidator');
const { sanitizePayload } = require('./aiPrivacyService');

/**
 * Gemini AI Provider
 * Integrates with Google Generative AI (Gemini 1.5 Flash / Pro) using native fetch.
 * Sanitizes input through aiPrivacyService and enforces schema validation.
 */
class GeminiProvider extends AIProvider {
  constructor(apiKey = process.env.GEMINI_API_KEY, model = process.env.GEMINI_MODEL || 'gemini-flash-latest') {
    super('gemini');
    this.apiKey = apiKey;
    this.model = model;
    this.mockFallback = new MockProvider();
  }

  async _callGeminiApi(systemPrompt, userPrompt) {
    if (!this.apiKey) {
      console.warn('⚠️ [GeminiProvider] No GEMINI_API_KEY configured. Falling back to MockProvider.');
      return null;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemPrompt}\n\nENTRADA A ANALIZAR:\n${userPrompt}` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: 'application/json'
      }
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[GeminiProvider] HTTP Error ${response.status}: ${errorText}`);
        return null;
      }

      const data = await response.json();
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText) return null;

      try {
        return JSON.parse(candidateText);
      } catch (err) {
        console.error('[GeminiProvider] Failed to parse JSON response:', candidateText);
        return null;
      }
    } catch (err) {
      clearTimeout(timeout);
      console.error('[GeminiProvider] Call failed:', err.message);
      return null;
    }
  }

  async analyzeContent(params) {
    // 1. Sanitize input to strip any PII
    const cleanParams = sanitizePayload(params);

    if (!this.apiKey) {
      return this.mockFallback.analyzeContent(cleanParams);
    }

    const systemPrompt = `Eres un auditor técnico senior de contenido audiovisual y redes sociales para campañas democráticas transparentes.
Tu función es evaluar la estructura audiovisual, ritmo y retención de publicaciones.
REGLAS ESTRICTAS DE RESPONSABILIDAD:
1. No realizas perfilamiento psicológico de votantes ni microsegmentación de población.
2. Debes separar rigurosamente:
   - "observations": Hechos técnicos comprobables (duración, ritmo, presencia de gancho en primeros 3s, CTA, etc.).
   - "metrics": Indicadores numéricos estimados (retention_potential: 0-100, clarity_index: 0-100, hook_strength: 0-100, pacing_wpm: número).
   - "hypotheses": Conjeturas o hipótesis de IA sobre posibles causas de retención o abandono. Cada una DEBE iniciar con "HIPÓTESIS: ".
   - "audiovisualTimeline": Arreglo de bloques temporales ({ startTime, endTime, segmentName, observation, impact: "bajo"|"medio"|"alto"|"critico", recommendation }).
   - "recommendations": Acciones sugeridas de edición o comunicación.
   - "summary": Breve resumen de 2 frases.
RESPONDE EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO CON ESAS CLAVES.`;

    const userPrompt = JSON.stringify(cleanParams, null, 2);
    const rawResult = await this._callGeminiApi(systemPrompt, userPrompt);

    if (!rawResult) {
      // Fallback
      return this.mockFallback.analyzeContent(cleanParams);
    }

    return validateAndFormatAnalysis(rawResult, { provider: 'gemini', isMock: false });
  }

  async generateScriptSuggestions(params) {
    const cleanParams = sanitizePayload(params);
    if (!this.apiKey) {
      return this.mockFallback.generateScriptSuggestions(cleanParams);
    }

    const systemPrompt = `Eres un asesor de narrativa y guiones audiovisuales para comunicación pública y política.
Genera 3 propuestas de variaciones de gancho y estructura para pruebas A/B.
Las variaciones deben ser éticas, transparentes, sin desinformación.
RESPONDE EXCLUSIVAMENTE CON UN ARREGLO JSON DE OBJETOS con las siguientes propiedades:
[
  {
    "variantId": "variant_1",
    "variantLabel": "Etiqueta descriptiva",
    "hook": "Texto del gancho en los primeros 3 segundos",
    "proposedScript": "Guion completo propuesto",
    "platform": "${cleanParams.platform || 'tiktok'}",
    "targetObjective": "${cleanParams.targetObjective || 'movilizacion'}",
    "disclaimer": "PROPUESTA GENERADA POR GEMINI AI"
  }
]`;

    const rawResult = await this._callGeminiApi(systemPrompt, JSON.stringify(cleanParams));
    if (!Array.isArray(rawResult)) {
      return this.mockFallback.generateScriptSuggestions(cleanParams);
    }
    return rawResult;
  }

  async generateHypotheses(params) {
    const cleanParams = sanitizePayload(params);
    if (!this.apiKey) {
      return this.mockFallback.generateHypotheses(cleanParams);
    }

    const systemPrompt = `Analiza las siguientes métricas de retención e interacción y genera 2 a 3 hipótesis fundamentadas sobre qué factores del video causaron subidas o caídas en la atención.
RESPONDE EXCLUSIVAMENTE CON UN ARREGLO JSON con el formato:
[
  {
    "hypothesisId": "hyp_1",
    "factor": "Área de impacto (ej: Ritmo vocal, Gancho visual)",
    "text": "HIPÓTESIS: Explicación detallada del fenómeno",
    "confidence": 0.85,
    "actionableSuggestion": "Qué hacer para verificar o solucionar"
  }
]`;

    const rawResult = await this._callGeminiApi(systemPrompt, JSON.stringify(cleanParams));
    if (!Array.isArray(rawResult)) {
      return this.mockFallback.generateHypotheses(cleanParams);
    }
    return rawResult;
  }
}

module.exports = GeminiProvider;
