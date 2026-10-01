const express = require('express');
const router = express.Router();
const multer = require('multer');
const whatsappController = require('../controllers/whatsappController');
const { verifyToken } = require('../middleware/authMiddleware');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 } // 25 MB
});

// Webhook oficial (público para Meta)
router.get('/webhook', whatsappController.webhookGet);
router.post('/webhook', whatsappController.webhookPost);

// Endpoints internos autenticados
router.post('/simulate', verifyToken, whatsappController.simulate);
router.post('/simulate-file', verifyToken, upload.single('file'), whatsappController.simulateFile);
router.get('/messages', verifyToken, whatsappController.getMessages);
router.get('/stats', verifyToken, whatsappController.getStats);

module.exports = router;
