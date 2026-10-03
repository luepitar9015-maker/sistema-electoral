const express = require('express');
const router = express.Router();
const callCenterController = require('../controllers/callCenterController');
const { verifyToken, authorizeCampaignAccess } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(authorizeCampaignAccess);

router.get('/next', callCenterController.getNextVoter);
router.post('/record', callCenterController.recordCall);
router.post('/log', callCenterController.recordCall);
router.get('/stats', callCenterController.getCallCenterStats);

module.exports = router;
