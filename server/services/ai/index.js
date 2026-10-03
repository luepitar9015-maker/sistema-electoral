const MockProvider = require('./mockProvider');
const GeminiProvider = require('./geminiProvider');
const AIUsageLog = require('../../models/AIUsageLog');

let activeProvider = null;

function getActiveProvider() {
  if (activeProvider) return activeProvider;

  const providerType = (process.env.AI_PROVIDER || 'mock').toLowerCase();
  
  if (providerType === 'gemini') {
    activeProvider = new GeminiProvider(process.env.GEMINI_API_KEY, process.env.GEMINI_MODEL);
  } else {
    activeProvider = new MockProvider();
  }

  return activeProvider;
}

/**
 * Executes an AI operation with automatic logging to AIUsageLog
 */
async function executeWithLogging(operationName, fn, context = {}) {
  const startTime = Date.now();
  const provider = getActiveProvider();
  let status = 'success';
  let errorMessage = null;
  let result = null;

  try {
    result = await fn(provider);
    return result;
  } catch (err) {
    status = 'error';
    errorMessage = err.message;
    throw err;
  } finally {
    const durationMs = Date.now() - startTime;
    // Log asynchronously without blocking response
    try {
      if (AIUsageLog && AIUsageLog.create) {
        const estimatedTokens = Math.round((JSON.stringify(context.input || '').length) / 4) +
                                Math.round((JSON.stringify(result || '').length) / 4);
        
        await AIUsageLog.create({
          user_id: context.userId || null,
          campana_id: context.campanaId || null,
          provider: provider.name,
          model: provider.model || (provider.name === 'mock' ? 'mock-engine-v1' : 'unknown'),
          operation: operationName,
          prompt_tokens: Math.round((JSON.stringify(context.input || '').length) / 4),
          completion_tokens: Math.round((JSON.stringify(result || '').length) / 4),
          total_tokens: estimatedTokens,
          estimated_cost_usd: provider.name === 'mock' ? 0.00 : (estimatedTokens * 0.0000015),
          duration_ms: durationMs,
          status,
          error_message: errorMessage,
          is_simulation: provider.name === 'mock'
        }).catch(e => console.warn('⚠️ [AIUsageLog] Failed to log:', e.message));
      }
    } catch (logErr) {
      // Non-critical logging failure
    }
  }
}

async function analyzeContent(params, context = {}) {
  return executeWithLogging('analyzeContent', (p) => p.analyzeContent(params), {
    input: params,
    ...context
  });
}

async function generateScriptSuggestions(params, context = {}) {
  return executeWithLogging('generateScriptSuggestions', (p) => p.generateScriptSuggestions(params), {
    input: params,
    ...context
  });
}

async function generateHypotheses(params, context = {}) {
  return executeWithLogging('generateHypotheses', (p) => p.generateHypotheses(params), {
    input: params,
    ...context
  });
}

function getStatus() {
  const provider = getActiveProvider();
  return {
    provider: provider.name,
    isMock: provider.name === 'mock',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    model: provider.model || 'mock-deterministic'
  };
}

module.exports = {
  getActiveProvider,
  analyzeContent,
  generateScriptSuggestions,
  generateHypotheses,
  getStatus
};
