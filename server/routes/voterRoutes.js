const express = require('express');
const router = express.Router();
const multer = require('multer');
const voterController = require('../controllers/voterController');
const { verifyToken, authorizeCampaignAccess } = require('../middleware/authMiddleware');

// multer en memoria (no guarda en disco)
const upload = multer({ storage: multer.memoryStorage() });

router.use(verifyToken);
router.use(authorizeCampaignAccess);

router.post('/',               voterController.createVoter);
router.get('/',                voterController.getVoters);
router.get('/leaders',         voterController.getLeaders);

// Importación masiva y plantilla
router.get('/template',        voterController.downloadTemplate);
router.post('/import',         upload.single('file'), voterController.importVoters);

// CRUD individual
router.get('/:id',             voterController.getVoterById);
router.put('/:id',             voterController.updateVoter);

module.exports = router;

