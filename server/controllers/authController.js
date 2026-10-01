const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'secreto_super_seguro';

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, campana_id: user.campana_id }, SECRET_KEY, { expiresIn: '8h' });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                nombre: user.nombre || user.email.split('@')[0],
                role: user.role,
                campana_id: user.campana_id
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error });
    }
};

exports.register = async (req, res) => { // Para crear el primer admin o test users
    try {
        const { email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ email, password: hashedPassword, role });
        res.status(201).json({ message: 'Usuario creado', user });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear usuario', error });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
        // Por seguridad, no decimos si el email existe o no
        return res.json({ message: 'Si el correo existe, se ha enviado un enlace para restablecer la contraseña.' });
    }

    // Simulación de envío de correo
    const resetToken = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });
    user.reset_token = resetToken;
    await user.save();

    console.log(`[SIMULACIÓN CORREO] Para recuperar contraseña de ${email}, use el token: ${resetToken}`);

    // En un caso real, aquí se enviaría el correo con nodemailer
    res.json({ message: 'Si el correo existe, se ha enviado un enlace para restablecer la contraseña (Ver consola del servidor para simulación).' });
};

exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const user = await User.findByPk(decoded.id);

        if (!user || user.reset_token !== token) {
            return res.status(400).json({ message: 'Token inválido o expirado' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.reset_token = null;
        await user.save();

        res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        res.status(400).json({ message: 'Token inválido o expirado' });
    }
};
