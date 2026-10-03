const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getSecretKey } = require('../middleware/authMiddleware');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña requeridos' });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        if (user.activo === false) {
            return res.status(403).json({ message: 'Cuenta desactivada. Contacte al administrador del sistema.' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, campana_id: user.campana_id },
            getSecretKey(),
            { expiresIn: '8h' }
        );

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
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};

exports.register = async (req, res) => {
    try {
        const { email, password, role, nombre, telefono, campana_id } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña requeridos' });
        }

        const totalUsers = await User.count();
        const isRequestFromAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
        const isPublicAllowed = process.env.ALLOW_PUBLIC_REGISTRATION === 'true';

        // Solo permitir registro público si es el primer usuario absoluto o si ALLOW_PUBLIC_REGISTRATION está en true
        if (totalUsers > 0 && !isRequestFromAdmin && !isPublicAllowed) {
            return res.status(403).json({
                message: 'El registro público está deshabilitado. La creación de usuarios requiere autorización administrativa.'
            });
        }

        // Si no es admin autenticado, el rol NUNCA puede ser admin ni superadmin (salvo inicialización absoluta de la app)
        let assignedRole = 'apoyo_bd';
        if (totalUsers === 0) {
            assignedRole = 'superadmin'; // Primer usuario del sistema es superadmin
        } else if (isRequestFromAdmin && role) {
            assignedRole = role;
        } else if (role && !['admin', 'superadmin'].includes(role)) {
            assignedRole = role;
        }

        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            email,
            password: hashedPassword,
            role: assignedRole,
            nombre: nombre || email.split('@')[0],
            telefono: telefono || '',
            campana_id: campana_id ? parseInt(campana_id, 10) : null,
            activo: true
        });

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            user: {
                id: user.id,
                email: user.email,
                nombre: user.nombre,
                role: user.role,
                campana_id: user.campana_id
            }
        });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ message: 'Error al crear usuario', error: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
        return res.json({ message: 'Si el correo existe, se ha enviado un enlace para restablecer la contraseña.' });
    }

    const resetToken = jwt.sign({ id: user.id }, getSecretKey(), { expiresIn: '1h' });
    user.reset_token = resetToken;
    await user.save();

    console.log(`[SIMULACIÓN CORREO] Para recuperar contraseña de ${email}, use el token: ${resetToken}`);
    res.json({ message: 'Si el correo existe, se ha enviado un enlace para restablecer la contraseña (Ver consola del servidor para simulación).' });
};

exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const decoded = jwt.verify(token, getSecretKey());
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

