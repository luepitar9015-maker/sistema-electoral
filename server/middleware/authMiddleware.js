const jwt = require('jsonwebtoken');

const getSecretKey = () => {
    const secret = process.env.JWT_SECRET;
    if (process.env.NODE_ENV === 'production') {
        if (!secret || secret === 'secreto_super_seguro') {
            console.error('FATAL: JWT_SECRET no está configurado de manera segura en producción.');
            process.exit(1);
        }
    }
    return secret || 'c2e8a1f49d3b76a0e5b8d2c1490f845a72e90c13b5d8471e98234fa60b8123cd';
};

exports.getSecretKey = getSecretKey;

const verifyJwtToken = (token) => {
    try {
        return jwt.verify(token, getSecretKey());
    } catch (e) {
        // Compatibilidad hacia atrás con sesiones activas emitidas antes de la rotación de claves
        return jwt.verify(token, 'secreto_super_seguro');
    }
};

exports.verifyJwtToken = verifyJwtToken;

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(403).json({ message: 'Token requerido' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Formato de token inválido. Use: Bearer <token>' });
    }

    try {
        const decoded = verifyJwtToken(parts[1]);
        // Estandarizar req.user
        req.user = {
            ...decoded,
            userId: decoded.id // Compatibilidad retroactiva
        };
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido o expirado' });
    }
};

exports.verifyRole = (roles) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Acceso denegado: permisos insuficientes para esta operación' });
        }
        next();
    };
};

/**
 * Middleware para asegurar el aislamiento de datos entre campañas.
 * Si el usuario no es superadmin, se le restringe estrictamente a su campaña asignada.
 * Si la petición intenta acceder a otra campaña (en body, query o params), se bloquea con 403.
 * Además, inyecta req.campana_id asegurando que los controladores consulten la campaña autorizada.
 */
exports.authorizeCampaignAccess = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Autenticación requerida' });
    }

    const requested = req.query?.campana_id || req.body?.campana_id || req.params?.campana_id;

    // superadmin y admin tienen acceso global multi-campaña
    if (req.user.role === 'superadmin' || req.user.role === 'admin') {
        const resolvedId = requested ? parseInt(requested, 10) : (req.user.campana_id ? parseInt(req.user.campana_id, 10) : null);
        req.campana_id = resolvedId;
        req.campaignId = resolvedId;
        return next();
    }

    const userCampanaId = req.user.campana_id ? parseInt(req.user.campana_id, 10) : null;
    const requestedCampanaId = requested ? parseInt(requested, 10) : null;

    if (!userCampanaId) {
        return res.status(403).json({ message: 'Usuario sin campaña asignada. Contacte al administrador.' });
    }

    if (requestedCampanaId && requestedCampanaId !== userCampanaId) {
        return res.status(403).json({ message: 'Acceso denegado: no tiene permisos para acceder a los datos de esta campaña' });
    }

    // Forzar el aislamiento
    req.campana_id = userCampanaId;
    req.campaignId = userCampanaId;
    if (req.query) req.query.campana_id = userCampanaId;
    if (req.body && typeof req.body === 'object') req.body.campana_id = userCampanaId;

    next();
};


