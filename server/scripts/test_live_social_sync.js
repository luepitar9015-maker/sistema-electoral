const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const BASE_URL = process.env.API_TEST_URL || 'http://127.0.0.1:5000/api';

async function runTests() {
    console.log('===============================================================');
    console.log(' PRUEBAS EN VIVO: SISTEMA DE MONITOREO REAL DE REDES SOCIALES');
    console.log('===============================================================');

    const token = jwt.sign({ id: 1, role: 'admin', campana_id: 1 }, JWT_SECRET, { expiresIn: '1h' });
    const headers = { Authorization: 'Bearer ' + token };

    // TEST 1: Enlace público de YouTube (oEmbed oficial sin API Key)
    console.log('\n[PRUEBA 1] Extracción por Enlace Público de YouTube (oEmbed Oficial sin credenciales):');
    try {
        const res1 = await axios.post(`${BASE_URL}/social/sync-profile`, {
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            campana_id: 1
        }, { headers });

        console.log(' Estado HTTP:', res1.status);
        console.log(' Respuesta:', JSON.stringify(res1.data, null, 2));
    } catch (err) {
        console.error(' Error en Prueba 1:', err.response?.data || err.message);
    }

    // TEST 2: Enlace público de perfil sin credenciales (debe informar restricción técnica, NUNCA datos falsos)
    console.log('\n[PRUEBA 2] Extracción de Perfil de Instagram sin Credenciales Oficiales:');
    try {
        const res2 = await axios.post(`${BASE_URL}/social/sync-profile`, {
            url: 'https://instagram.com/candidato_demo',
            campana_id: 1
        }, { headers });

        console.log(' Estado HTTP:', res2.status);
        console.log(' Respuesta:', JSON.stringify(res2.data, null, 2));
    } catch (err) {
        console.error(' Error en Prueba 2:', err.response?.data || err.message);
    }

    // TEST 3: Consultar publicaciones registradas en el feed real
    console.log('\n[PRUEBA 3] Consulta del Feed de Publicaciones Reales Registradas:');
    try {
        const res3 = await axios.get(`${BASE_URL}/social/posts?campana_id=1`, { headers });
        const posts = res3.data?.posts || [];
        console.log(` Total publicaciones reales en BD: ${posts.length}`);
        if (posts.length > 0) {
            const last = posts[0];
            console.log(' Última publicación registrada:', {
                id: last.id,
                plataforma: last.plataforma,
                titulo: last.titulo,
                autor: last.autor_nombre,
                url: last.url_publicacion,
                is_simulation: last.is_simulation
            });
        }
    } catch (err) {
        console.error(' Error en Prueba 3:', err.response?.data || err.message);
    }

    console.log('\n===============================================================');
    console.log(' PRUEBAS FINALIZADAS');
    console.log('===============================================================');
}

runTests();
