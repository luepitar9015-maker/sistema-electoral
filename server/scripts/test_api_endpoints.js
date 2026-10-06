const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const axios = require('axios');
const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_SECRET || 'secreto_para_firmar_tokens_jwt_seguro_2026';
const token = jwt.sign({ id: 1, role: 'superadmin', username: 'admin' }, secretKey, { expiresIn: '1h' });

async function testEndpoints() {
    console.log('🧪 Iniciando verificación de Endpoints del Sistema...');
    const baseUrl = 'http://localhost:5000/api';
    const headers = { Authorization: `Bearer ${token}` };

    const tests = [
        { name: 'Campañas (GET /api/campaigns)', url: `${baseUrl}/campaigns` },
        { name: 'Alertas y Notificaciones (GET /api/notifications/alerts)', url: `${baseUrl}/notifications/alerts` },
        { name: 'Reuniones (GET /api/reuniones)', url: `${baseUrl}/reuniones` },
        { name: 'Votantes (GET /api/voters?limit=5)', url: `${baseUrl}/voters?limit=5` },
        { name: 'Contrincantes (GET /api/social/competitors)', url: `${baseUrl}/social/competitors` },
        { name: 'Ataques Contrincantes (GET /api/social/competitor-attacks)', url: `${baseUrl}/social/competitor-attacks` },
        { name: 'Vehículos Logística (GET /api/logistica/vehiculos)', url: `${baseUrl}/logistica/vehiculos` },
        { name: 'Despachos Logística (GET /api/logistica/despachos)', url: `${baseUrl}/logistica/despachos` },
        { name: 'Necesidades Ciudadanas (GET /api/necesidades)', url: `${baseUrl}/necesidades` },
        { name: 'Día D Mesas (GET /api/dia-d/reportes-mesa)', url: `${baseUrl}/dia-d/reportes-mesa` }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            const res = await axios.get(test.url, { headers });
            const dataLen = Array.isArray(res.data) ? `[${res.data.length} items]` : typeof res.data === 'object' ? `[OK objeto]` : '';
            console.log(`  ✅ ${test.name}: HTTP ${res.status} ${dataLen}`);
            passed++;
        } catch (err) {
            const status = err.response ? err.response.status : 'ERR';
            const msg = err.response?.data?.message || err.message;
            console.error(`  ❌ ${test.name}: HTTP ${status} -> ${msg}`);
            failed++;
        }
    }

    console.log('----------------------------------------------------');
    console.log(`🎯 TOTAL ENDPOINTS TESTEADOS: ${passed + failed} | Aprobados: ${passed} | Fallidos: ${failed}`);
    console.log('----------------------------------------------------');

    if (failed > 0) {
        process.exit(1);
    } else {
        console.log('🎉 TODOS LOS ENDPOINTS CLAVE DEL SISTEMA RESPONDEN CON ÉXITO (HTTP 200)');
        process.exit(0);
    }
}

testEndpoints();
