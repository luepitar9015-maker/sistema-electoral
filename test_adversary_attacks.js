const jwt = require('./server/node_modules/jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro';
const BASE_URL = 'http://localhost:3000/api';

async function postJson(url, data, token) {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });
    return res.json();
}

async function getJson(url, token) {
    const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
}

async function run() {
    console.log('--- INICIANDO TEST: ADVERSARIOS, REDES Y DETECCIÓN DE ATAQUES ---');
    const token = jwt.sign(
        { id: 1, email: 'admin@sistema.com', rol: 'superadmin', campana_id: 1 },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    // 1. Probar análisis con IA de un ataque
    console.log('\n[Paso 1] Probando análisis con IA de un ataque a la gestión como Alcalde...');
    const aiAnalysis = await postJson(`${BASE_URL}/social/competitors/attacks/analyze-ai`, {
        contenido_ataque: 'El actual alcalde no ha tapado ni un solo hueco en la avenida principal y el contrato de pavimentación está embolatado. Una vergüenza de gestión.',
        adversario_nombre: 'Senador Rodrigo Méndez',
        partido_adversario: 'Frente Opositor',
        plataforma: 'twitter',
        likes: 450,
        reposts: 120,
        comentarios: 85,
        campana_id: 1
    }, token);

    console.log('Resultado del análisis estratégico:', JSON.stringify(aiAnalysis, null, 2));

    // 2. Registrar el ataque en la base de datos
    console.log('\n[Paso 2] Registrando ataque en la bitácora...');
    const createRes = await postJson(`${BASE_URL}/social/competitors/attacks`, {
        campana_id: 1,
        adversario_nombre: 'Senador Rodrigo Méndez',
        plataforma: 'twitter',
        url_publicacion: 'https://x.com/rodrigo_mendez/status/189283719283',
        contenido_ataque: 'El actual alcalde no ha tapado ni un solo hueco en la avenida principal y el contrato de pavimentación está embolatado. Una vergüenza de gestión.',
        likes: 450,
        reposts: 120,
        comentarios: 85
    }, token);

    console.log('Ataque guardado:', createRes);

    // 3. Probar ataque al partido
    console.log('\n[Paso 3] Registrando ataque al partido político...');
    const createPartyAttack = await postJson(`${BASE_URL}/social/competitors/attacks`, {
        campana_id: 1,
        adversario_nombre: 'Dra. Patricia Silva',
        plataforma: 'instagram',
        url_publicacion: 'https://instagram.com/p/C8921823912',
        contenido_ataque: 'El partido de nuestro contrincante lleva 20 años gobernando con las mismas maquinarias y clanes políticos tradicionales. ¡No más engaños!',
        likes: 1200,
        reposts: 340,
        comentarios: 210
    }, token);
    console.log('Ataque al partido guardado:', createPartyAttack);

    // 4. Listar ataques registrados
    console.log('\n[Paso 4] Consultando bitácora de ataques...');
    const attacks = await getJson(`${BASE_URL}/social/competitors/attacks?campana_id=1`, token);
    console.log(`Total ataques recuperados: ${attacks.length}`);
    attacks.forEach(a => {
        console.log(`- [ID: ${a.id}] Blanco: ${a.blanco_ataque.toUpperCase()} | Adversario: ${a.adversario_nombre} | Táctica: ${a.tactica_recomendada.toUpperCase()} | Fake News: ${a.es_fake_news}`);
    });

    console.log('\n✅ TEST COMPLETADO CON ÉXITO.');
}

run().catch(console.error);
