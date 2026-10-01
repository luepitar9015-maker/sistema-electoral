const express = require('express');
const router = express.Router();
const apoyoController = require('../controllers/apoyoController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', apoyoController.getApoyos);
router.get('/campaign/:campanaId', apoyoController.getApoyos);
router.post('/', apoyoController.createApoyo);
router.put('/:id', apoyoController.updateApoyo);
router.delete('/:id', apoyoController.deleteApoyo);

module.exports = router;
