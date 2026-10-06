const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', campaignController.getCampaigns);
router.get('/:id', campaignController.getCampaignById);

// Termómetro de Victoria y Déficit Territorial
router.get('/:id/termometro', campaignController.getTermometroVictoria);

// Red de Coequiperos (Campañas Hijas)
router.get('/:id/coequiperos', campaignController.getCoequiperos);
router.post('/:id/coequiperos', verifyRole(['superadmin', 'admin', 'gerente']), campaignController.linkCoequipero);
router.delete('/:id/coequiperos/:childId', verifyRole(['superadmin', 'admin', 'gerente']), campaignController.unlinkCoequipero);

// Rendición de Cuentas y Compromisos de Gobierno (4 Años de Mandato)
router.get('/:id/compromisos', campaignController.getCompromisosGestion);
router.post('/:id/compromisos', verifyRole(['superadmin', 'admin', 'gerente', 'director_estrategico']), campaignController.createCompromisoGestion);
router.put('/:id/compromisos/:compromisoId', verifyRole(['superadmin', 'admin', 'gerente', 'director_estrategico']), campaignController.updateCompromisoGestion);
router.delete('/:id/compromisos/:compromisoId', verifyRole(['superadmin', 'admin', 'director_estrategico']), campaignController.deleteCompromisoGestion);

// Creación, edición y borrado restringidos por rol
router.post('/', verifyRole(['superadmin', 'admin', 'director_estrategico']), campaignController.createCampaign);
router.put('/:id', verifyRole(['superadmin', 'admin', 'gerente', 'director_estrategico']), campaignController.updateCampaign);
router.delete('/:id', verifyRole(['superadmin', 'admin']), campaignController.deleteCampaign);

module.exports = router;

