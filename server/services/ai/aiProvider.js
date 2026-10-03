/**
 * Base AI Provider Abstract Interface
 * All AI providers (Mock, Gemini, OpenAI, Claude, etc.) must implement this interface.
 */
class AIProvider {
  constructor(name = 'base') {
    this.name = name;
  }

  /**
   * Analyzes social content (text, script, audiovisual metadata)
   * @param {Object} params
   * @param {string} params.text - The post copy, script or transcript
   * @param {number} [params.durationSeconds] - Video duration
   * @param {string} [params.platform] - tiktok, instagram, youtube, facebook, x
   * @param {string} [params.topic] - Topic or theme
   * @param {string} [params.objective] - Awareness, mobilization, proposal, response
   * @param {Object} [params.metadata] - Additional technical metadata
   * @returns {Promise<Object>} Formatted analysis { observations, metrics, hypotheses, audiovisualTimeline, recommendations }
   */
  async analyzeContent(params) {
    throw new Error(`analyzeContent() not implemented in provider ${this.name}`);
  }

  /**
   * Generates alternative hooks and script variations for A/B testing
   * @param {Object} params
   * @param {string} params.originalScript
   * @param {string} params.targetObjective
   * @param {string} params.platform
   * @param {number} [params.variationCount=3]
   * @returns {Promise<Array<Object>>} Variations list
   */
  async generateScriptSuggestions(params) {
    throw new Error(`generateScriptSuggestions() not implemented in provider ${this.name}`);
  }

  /**
   * Generates hypotheses explaining metric variations (e.g. drop in retention)
   * @param {Object} params
   * @param {Object} params.metrics - Programmatically computed metrics
   * @param {Object} params.timeline - Timeline retention points
   * @returns {Promise<Array<Object>>} Hypotheses list
   */
  async generateHypotheses(params) {
    throw new Error(`generateHypotheses() not implemented in provider ${this.name}`);
  }
}

module.exports = AIProvider;
