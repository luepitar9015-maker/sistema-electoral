const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', campaignController.getCampaigns);
router.get('/:id', campaignController.getCampaignById);

// Creación, edición y borrado restringidos por rol
router.post('/', verifyRole(['superadmin', 'admin']), campaignController.createCampaign);
router.put('/:id', verifyRole(['superadmin', 'admin', 'gerente']), campaignController.updateCampaign);
router.delete('/:id', verifyRole(['superadmin', 'admin']), campaignController.deleteCampaign);

module.exports = router;

