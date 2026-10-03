const express = require('express');
const router = express.Router();
const contentIntelligenceController = require('../controllers/contentIntelligenceController');
const { verifyToken, authorizeCampaignAccess } = require('../middleware/authMiddleware');

// All intelligence endpoints require authentication and campaign access authorization
router.use(verifyToken);
router.use(authorizeCampaignAccess);

// 1. Content Analysis & Audiovisual Timeline
router.post('/analyze', contentIntelligenceController.analyzePost);
router.get('/post/:postId', contentIntelligenceController.getPostAnalysis);

// 2. Simulation Engine (MODO A - Simulación Ficticia)
router.post('/simulate', contentIntelligenceController.simulatePerformance);
router.post('/compare-variants', contentIntelligenceController.compareVariants);

// 3. AI Suggestions & Experimentation
router.post('/suggestions', contentIntelligenceController.generateSuggestions);
router.post('/experiments', contentIntelligenceController.createExperiment);
router.get('/experiments', contentIntelligenceController.getExperiments);

// 4. Aggregated Insights & AI Status
router.get('/insights', contentIntelligenceController.getCampaignInsights);

module.exports = router;
