const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// Solo usuarios autenticados
router.use(verifyToken);

// Lectura permitida a directivos de campaña y administradores
router.get('/', verifyRole(['superadmin', 'admin', 'candidato', 'gerente']), userController.getUsers);

// Modificaciones estrictamente restringidas a administradores
router.post('/', verifyRole(['superadmin', 'admin']), userController.createUser);
router.put('/:id', verifyRole(['superadmin', 'admin']), userController.updateUser);
router.delete('/:id', verifyRole(['superadmin', 'admin']), userController.deleteUser);

module.exports = router;

