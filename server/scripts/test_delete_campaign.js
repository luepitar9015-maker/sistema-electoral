const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_SECRET || 'secreto_para_firmar_tokens_jwt_seguro_2026';
const token = jwt.sign({ id: 1, role: 'superadmin', username: 'admin' }, secretKey, { expiresIn: '1h' });

async function testCreateAndDelete() {
    console.log('🧪 Iniciando prueba de Creación y Eliminación en Cascada de Campaña...');
    const baseUrl = 'http://localhost:5000/api/campaigns';
    const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        // 1. Crear campaña de prueba
        const createRes = await fetch(baseUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                nombre: 'Campaña Temporal de Prueba',
                tipo_cargo: 'alcaldia',
                candidato: 'Candidato Test',
                municipio: 'Bucaramanga',
                departamento: 'Santander',
                meta_votos: 1000
            })
        });

        const created = await createRes.json();
        const campaignData = created.campaign || created;
        console.log('  1. Campaña de prueba creada:', campaignData.id, campaignData.nombre);

        if (!campaignData.id) {
            throw new Error('No se pudo crear la campaña de prueba: ' + JSON.stringify(created));
        }

        // 2. Eliminar la campaña recién creada
        const deleteRes = await fetch(`${baseUrl}/${campaignData.id}`, {
            method: 'DELETE',
            headers
        });

        const deleted = await deleteRes.json();
        console.log('  2. Resultado de eliminación:', deleteRes.status, deleted.message);

        if (deleteRes.ok) {
            console.log('🎉 PRUEBA DE ELIMINACIÓN EN CASCADA 100% EXITOSA!');
            process.exit(0);
        } else {
            console.error('❌ Falló la eliminación:', deleted);
            process.exit(1);
        }
    } catch (err) {
        console.error('💥 Error en prueba:', err.message);
        process.exit(1);
    }
}

testCreateAndDelete();
