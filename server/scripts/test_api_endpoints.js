const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_SECRET || 'secreto_para_firmar_tokens_jwt_seguro_2026';
const token = jwt.sign({ id: 1, role: 'superadmin', username: 'admin' }, secretKey, { expiresIn: '1h' });

async function testEndpoints() {
    console.log('🧪 Iniciando verificación de Endpoints del Sistema...');
    const baseUrl = 'http://localhost:5000/api';
    const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    const tests = [
        { name: 'Campañas (GET /api/campaigns)', url: `${baseUrl}/campaigns` },
        { name: 'Alertas y Notificaciones (GET /api/notifications)', url: `${baseUrl}/notifications` },
        { name: 'Reuniones (GET /api/reuniones)', url: `${baseUrl}/reuniones` },
        { name: 'Votantes (GET /api/voters?limit=5)', url: `${baseUrl}/voters?limit=5` },
        { name: 'Contrincantes (GET /api/social/competitors)', url: `${baseUrl}/social/competitors` },
        { name: 'Ataques Contrincantes (GET /api/social/competitors/attacks)', url: `${baseUrl}/social/competitors/attacks` },
        { name: 'Vehículos Logística (GET /api/logistica/vehiculos)', url: `${baseUrl}/logistica/vehiculos` },
        { name: 'Despachos Logística (GET /api/logistica/despachos)', url: `${baseUrl}/logistica/despachos` },
        { name: 'Necesidades Ciudadanas (GET /api/necesidades)', url: `${baseUrl}/necesidades` },
        { name: 'Día D Resumen (GET /api/dia-d/summary)', url: `${baseUrl}/dia-d/summary` },
        { name: 'Gobernanza Compromisos (GET /api/campaigns/1/compromisos)', url: `${baseUrl}/campaigns/1/compromisos` }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            const res = await fetch(test.url, { headers });
            const data = await res.json();
            const dataLen = Array.isArray(data) ? `[${data.length} items]` : typeof data === 'object' ? `[OK objeto]` : '';
            if (res.ok) {
                console.log(`  ✅ ${test.name}: HTTP ${res.status} ${dataLen}`);
                passed++;
            } else {
                console.error(`  ❌ ${test.name}: HTTP ${res.status} -> ${data.message || JSON.stringify(data)}`);
                failed++;
            }
        } catch (err) {
            console.error(`  ❌ ${test.name}: ERROR -> ${err.message}`);
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
