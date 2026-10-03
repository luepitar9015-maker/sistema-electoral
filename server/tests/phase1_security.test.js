const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { getSecretKey, verifyRole, authorizeCampaignAccess } = require('../middleware/authMiddleware');

test('Fase 1 Seguridad: Clave secreta JWT segura', () => {
    const key = getSecretKey();
    assert.ok(key, 'La clave JWT debe existir');
    assert.notStrictEqual(key, 'secreto_super_seguro', 'La clave JWT no debe ser el valor inseguro por defecto');
    assert.ok(key.length >= 32, 'La clave secreta debe tener al menos 32 caracteres');
});

test('Fase 1 Seguridad: Middleware verifyRole bloquea roles no autorizados', () => {
    const middleware = verifyRole(['admin', 'superadmin']);

    let statusCalled = null;
    let jsonCalled = null;
    const mockRes = {
        status: (code) => {
            statusCalled = code;
            return {
                json: (data) => { jsonCalled = data; }
            };
        }
    };

    // Caso 1: Usuario con rol insuficiente (apoyo_bd)
    let nextCalled = false;
    middleware({ user: { role: 'apoyo_bd' } }, mockRes, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false, 'No debe permitir acceso a apoyo_bd');
    assert.strictEqual(statusCalled, 403, 'Debe devolver código 403');

    // Caso 2: Usuario con rol admin autorizado
    nextCalled = false;
    statusCalled = null;
    middleware({ user: { role: 'admin' } }, mockRes, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true, 'Debe permitir acceso a admin');
    assert.strictEqual(statusCalled, null);
});

test('Fase 1 Seguridad: authorizeCampaignAccess previene fuga entre campañas', () => {
    let statusCalled = null;
    let jsonCalled = null;
    const mockRes = {
        status: (code) => {
            statusCalled = code;
            return {
                json: (data) => { jsonCalled = data; }
            };
        }
    };

    // Caso 1: Usuario de campaña 1 intenta consultar campaña 2
    let nextCalled = false;
    const reqFraud = {
        user: { id: 10, role: 'candidato', campana_id: 1 },
        query: { campana_id: 2 }
    };
    authorizeCampaignAccess(reqFraud, mockRes, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false, 'No debe permitir consultar otra campaña');
    assert.strictEqual(statusCalled, 403, 'Debe devolver 403');

    // Caso 2: Usuario de campaña 1 consulta sin especificar campaña (forzado automático)
    nextCalled = false;
    statusCalled = null;
    const reqLegit = {
        user: { id: 10, role: 'candidato', campana_id: 1 },
        query: {}
    };
    authorizeCampaignAccess(reqLegit, mockRes, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true, 'Debe permitir acceso');
    assert.strictEqual(reqLegit.campana_id, 1, 'Debe forzar req.campana_id a la del usuario');
    assert.strictEqual(reqLegit.query.campana_id, 1, 'Debe inyectar la campaña en query');

    // Caso 3: Superadmin puede consultar cualquier campaña o todas
    nextCalled = false;
    statusCalled = null;
    const reqSuper = {
        user: { id: 1, role: 'superadmin', campana_id: null },
        query: { campana_id: 5 }
    };
    authorizeCampaignAccess(reqSuper, mockRes, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true, 'Superadmin debe tener acceso');
    assert.strictEqual(reqSuper.campana_id, 5, 'Superadmin puede consultar campaña 5');
});

test('Fase 1 Seguridad: Generación y verificación consistente de token JWT', () => {
    const payload = { id: 42, email: 'test@campana.com', role: 'admin', campana_id: 3 };
    const token = jwt.sign(payload, getSecretKey(), { expiresIn: '1h' });

    const decoded = jwt.verify(token, getSecretKey());
    assert.strictEqual(decoded.id, 42);
    assert.strictEqual(decoded.role, 'admin');
    assert.strictEqual(decoded.campana_id, 3);
});
