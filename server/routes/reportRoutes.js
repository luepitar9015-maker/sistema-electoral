const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, authorizeCampaignAccess } = require('../middleware/authMiddleware');

router.use(verifyToken);
router.use(authorizeCampaignAccess);

router.get('/excel', reportController.exportExcel);
router.get('/pdf', reportController.exportPDF);
router.get('/geo', reportController.getGeoStats);
router.get('/leaders', reportController.getLeaderStats);
router.post('/simulate-dhondt', reportController.simulateDHondt);

module.exports = router;

