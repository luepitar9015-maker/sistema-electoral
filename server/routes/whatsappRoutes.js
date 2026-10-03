const express = require('express');
const router = express.Router();
const multer = require('multer');
const whatsappController = require('../controllers/whatsappController');
const { verifyToken, authorizeCampaignAccess, verifyRole } = require('../middleware/authMiddleware');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 } // 25 MB
});

// Webhook oficial (público para Meta con verificación de firma)
router.get('/webhook', whatsappController.webhookGet);
router.post('/webhook', whatsappController.webhookPost);

// Endpoints internos autenticados con aislamiento de campaña
router.post('/simulate', verifyToken, authorizeCampaignAccess, verifyRole(['superadmin', 'admin', 'candidato', 'gerente']), whatsappController.simulate);
router.post('/simulate-file', verifyToken, authorizeCampaignAccess, verifyRole(['superadmin', 'admin', 'candidato', 'gerente']), upload.single('file'), whatsappController.simulateFile);
router.get('/messages', verifyToken, authorizeCampaignAccess, whatsappController.getMessages);
router.get('/stats', verifyToken, authorizeCampaignAccess, whatsappController.getStats);

module.exports = router;

