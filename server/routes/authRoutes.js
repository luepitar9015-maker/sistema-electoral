const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const jwt = require('jsonwebtoken');
const { getSecretKey } = require('../middleware/authMiddleware');

// Middleware opcional para poblar req.user si viene un token administrativo
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            req.user = jwt.verify(token, getSecretKey());
        } catch (e) {
            // Ignorar error si es registro inicial sin token
        }
    }
    next();
};

router.post('/login', authController.login);
router.post('/register', optionalAuth, authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;

