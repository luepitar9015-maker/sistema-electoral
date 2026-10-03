const User = require('../models/User');
const Campaign = require('../models/Campaign');
const bcrypt = require('bcrypt');

/**
 * Obtener todos los usuarios con su campaña asignada.
 */
exports.getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password', 'reset_token'] },
            order: [['id', 'ASC']]
        });

        // Adjuntar datos de campaña manualmente si existe
        const campaigns = await Campaign.findAll({ attributes: ['id', 'nombre', 'candidato', 'color', 'tipo_cargo'] });
        const campMap = {};
        campaigns.forEach(c => { campMap[c.id] = c; });

        const formatted = users.map(u => ({
            ...u.toJSON(),
            campana: u.campana_id ? campMap[u.campana_id] || null : null
        }));

        res.json(formatted);
    } catch (error) {
        console.error('Error al listar usuarios:', error);
        res.status(500).json({ message: 'Error al listar usuarios', error: error.message });
    }
};

/**
 * Crear un nuevo usuario con rol específico y campaña.
 */
exports.createUser = async (req, res) => {
    try {
        const { nombre, email, password, telefono, role, campana_id } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'El correo y la contraseña son obligatorios' });
        }

        // Solo superadmin puede asignar el rol de superadmin
        if (role === 'superadmin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Solo un superadmin puede crear otros usuarios superadmin' });
        }

        // Si no es superadmin, la campaña debe coincidir con la del usuario logueado
        let targetCampanaId = campana_id ? parseInt(campana_id, 10) : null;
        if (req.user.role !== 'superadmin' && req.user.campana_id) {
            targetCampanaId = req.user.campana_id;
        }

        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(400).json({ message: 'Ya existe un usuario con este correo electrónico' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            nombre: nombre || email.split('@')[0],
            email,
            telefono: telefono || '',
            password: hashedPassword,
            role: role || 'apoyo_bd',
            campana_id: targetCampanaId,
            activo: true
        });

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            user: {
                id: newUser.id,
                nombre: newUser.nombre,
                email: newUser.email,
                telefono: newUser.telefono,
                role: newUser.role,
                campana_id: newUser.campana_id,
                activo: newUser.activo
            }
        });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ message: 'Error al crear usuario', error: error.message });
    }
};

/**
 * Actualizar usuario (rol, nombre, teléfono, campaña, contraseña, estado).
 */
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, password, telefono, role, campana_id, activo } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Proteger privilegios de superadmin
        if ((role === 'superadmin' || user.role === 'superadmin') && req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'No tiene permisos para modificar un superadmin' });
        }

        // Si no es superadmin, no puede editar usuarios de otra campaña
        if (req.user.role !== 'superadmin' && req.user.campana_id && user.campana_id && user.campana_id !== req.user.campana_id) {
            return res.status(403).json({ message: 'No tiene permisos para modificar usuarios de otra campaña' });
        }

        if (email && email !== user.email) {
            const emailExists = await User.findOne({ where: { email } });
            if (emailExists) {
                return res.status(400).json({ message: 'El correo electrónico ya está en uso' });
            }
            user.email = email;
        }

        if (nombre !== undefined) user.nombre = nombre;
        if (telefono !== undefined) user.telefono = telefono;
        if (role !== undefined) user.role = role;
        if (campana_id !== undefined && req.user.role === 'superadmin') {
            user.campana_id = campana_id ? parseInt(campana_id, 10) : null;
        }
        if (activo !== undefined) user.activo = activo;

        if (password && password.trim().length >= 6) {
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        res.json({
            message: 'Usuario actualizado exitosamente',
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                telefono: user.telefono,
                role: user.role,
                campana_id: user.campana_id,
                activo: user.activo
            }
        });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
    }
};

/**
 * Eliminar usuario.
 */
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const targetId = parseInt(id, 10);

        if (targetId === req.user.id) {
            return res.status(400).json({ message: 'No puede eliminar su propia cuenta activa' });
        }

        const user = await User.findByPk(targetId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Solo un superadmin puede eliminar a otro superadmin' });
        }

        if (user.role === 'superadmin' || user.role === 'admin') {
            const adminCount = await User.count({ where: { role: ['superadmin', 'admin'] } });
            if (adminCount <= 1) {
                return res.status(400).json({ message: 'No se puede eliminar el único superusuario del sistema' });
            }
        }

        await user.destroy();
        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
    }
};
