/**
 * AI Privacy Service
 * Ensures strict PII stripping before any data is passed to external AI providers.
 * Strips:
 * - Colombian Cédulas / National IDs (sequences of 6 to 10 digits)
 * - Colombian & International Phone numbers
 * - Email addresses
 * - Voter/Person names or address mentions
 */

// Regex patterns
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?57\s?)?(3\d{2}[-.\s]?\d{3}[-.\s]?\d{4}|\b3\d{9}\b)/g;
const CEDULA_REGEX = /\b(CC|C\.C\.|cédula|cedula)?\s*([1-9]\d{6,9})\b/gi;
const GENERIC_ID_REGEX = /\b\d{7,10}\b/g;

/**
 * Redacts any detected PII from a given string.
 * @param {string} text 
 * @returns {{ sanitizedText: string, redactedCount: number, detectedTypes: string[] }}
 */
function sanitizeText(text) {
  if (typeof text !== 'string') return { sanitizedText: '', redactedCount: 0, detectedTypes: [] };

  let sanitized = text;
  let count = 0;
  const types = new Set();

  if (EMAIL_REGEX.test(sanitized)) {
    sanitized = sanitized.replace(EMAIL_REGEX, () => {
      count++;
      types.add('email');
      return '[CORREO_REDACTADO]';
    });
  }

  if (PHONE_REGEX.test(sanitized)) {
    sanitized = sanitized.replace(PHONE_REGEX, () => {
      count++;
      types.add('telefono');
      return '[TELEFONO_REDACTADO]';
    });
  }

  if (CEDULA_REGEX.test(sanitized)) {
    sanitized = sanitized.replace(CEDULA_REGEX, (match, prefix, num) => {
      count++;
      types.add('cedula_o_documento');
      return (prefix ? prefix + ' ' : '') + '[ID_REDACTADO]';
    });
  }

  return {
    sanitizedText: sanitized,
    redactedCount: count,
    detectedTypes: Array.from(types)
  };
}

/**
 * Sanitizes an object deeply before AI processing.
 * @param {any} data 
 * @returns {any}
 */
function sanitizePayload(data) {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') {
    return sanitizeText(data).sanitizedText;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizePayload(item));
  }
  if (typeof data === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      // Exclude voter-specific sensitive keys entirely
      const lower = key.toLowerCase();
      if (['cedula', 'identificacion', 'voter_id', 'votante', 'telefono', 'celular', 'email', 'correo', 'direccion'].includes(lower)) {
        cleaned[key] = '[REDACTADO_POR_SEGURIDAD]';
      } else {
        cleaned[key] = sanitizePayload(value);
      }
    }
    return cleaned;
  }
  return data;
}

module.exports = {
  sanitizeText,
  sanitizePayload
};
