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

async function runTest() {
    console.log('--- INICIANDO TEST: SINCRONIZACIÓN DE REDES, IMPORTACIÓN BD EQUIPO Y AUDITORÍA DE COMENTARIOS ---');

    // 1. Generar token de prueba
    const token = jwt.sign(
        { id: 1, email: 'admin@sistema.com', rol: 'superadmin', campana_id: 1 },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    // 2. Sincronizar perfil con URL real de Instagram (estrategia180)
    console.log('\n[Paso 1] Sincronizando perfil de Instagram: https://www.instagram.com/estrategia180?stkn=ZWVrbHNpN3JiZmlo');
    const syncData = await postJson(`${BASE_URL}/social/sync-profile`, {
        url: 'https://www.instagram.com/estrategia180?stkn=ZWVrbHNpN3JiZmlo',
        campana_id: 1
    }, token);

    console.log('Resultado de sincronización:', syncData);
    if (!syncData.success) {
        throw new Error('Fallo la sincronización del perfil: ' + JSON.stringify(syncData));
    }

    // 3. Subir / Importar base de datos del equipo de campaña
    console.log('\n[Paso 2] Subiendo base de datos del equipo de campaña (Excel / CSV simulado)...');
    const teamMembersToImport = [
        {
            nombre_miembro: 'Carlos Gómez',
            usuario_handle: '@carlos_avanzada',
            rol_equipo: 'Coordinador de Avanzada Territorial',
            plataforma: 'instagram'
        },
        {
            nombre_miembro: 'María Fernanda Restrepo',
            usuario_handle: '@maria_juventud',
            rol_equipo: 'Líder de Juventudes Digitales',
            plataforma: 'instagram'
        },
        {
            nombre_miembro: 'Vocería Medellín',
            usuario_handle: '@voceria_oficial_medellin',
            rol_equipo: 'Comité de Comunicaciones',
            plataforma: 'instagram'
        },
        {
            nombre_miembro: 'Don José Alirio',
            usuario_handle: '@lider_vereda_sur',
            rol_equipo: 'Líder Comunal y Veredal',
            plataforma: 'instagram'
        }
    ];

    const importData = await postJson(`${BASE_URL}/social/team/import`, {
        members: teamMembersToImport,
        campana_id: 1
    }, token);

    console.log('Resultado de importación de equipo:', importData);
    if (!importData.success) {
        throw new Error('Fallo la importación del equipo');
    }

    // 4. Obtener las publicaciones para tomar una
    console.log('\n[Paso 3] Obteniendo publicaciones sincronizadas...');
    const posts = await getJson(`${BASE_URL}/social/posts?campana_id=1`, token);
    console.log(`Se encontraron ${posts.length} publicaciones en la campaña.`);

    const targetPost = posts.find(p => p.titulo.includes('estrategia180') || p.titulo.includes('Reels'));
    if (!targetPost) {
        throw new Error('No se encontró el post sincronizado de @estrategia180');
    }
    console.log(`Post seleccionado: [ID: ${targetPost.id}] "${targetPost.titulo}"`);

    // 5. Consultar los comentarios y auditoría del post
    console.log('\n[Paso 4] Consultando comentarios y auditoría del equipo para el post...');
    const commentsData = await getJson(`${BASE_URL}/social/posts/${targetPost.id}/comments?campana_id=1`, token);
    const { comments, audit } = commentsData;

    console.log(`Total comentarios: ${comments.length}`);
    console.log('Auditoría del equipo:', audit);

    // 6. Verificar que cada comentario tiene identificado al integrante a su lado
    console.log('\n[Paso 5] Verificando detalle de comentarios y la identificación de integrante al lado:');
    let teamVerifiedCount = 0;
    let citizenVerifiedCount = 0;

    comments.forEach((c, idx) => {
        console.log(`\n--- Comentario #${idx + 1} ---`);
        console.log(`Texto: "${c.texto_comentario}"`);
        console.log(`Reacción: [${c.tipo_reaccion}] | Sentimiento: [${c.sentimiento}] | Likes: ${c.likes_comentario}`);
        if (c.es_equipo_campana) {
            teamVerifiedCount++;
            console.log(`-> AL LADO: [⭐ INTEGRANTE DE CAMPAÑA IDENTIFICADO]`);
            console.log(`   Nombre: ${c.equipo_nombre}`);
            console.log(`   Rol: ${c.equipo_rol}`);
            console.log(`   Usuario: ${c.usuario_red}`);
        } else {
            citizenVerifiedCount++;
            console.log(`-> AL LADO: [👤 CIUDADANO / SIMPATIZANTE EXTERNO]`);
            console.log(`   Usuario: ${c.usuario_red} (${c.nombre_usuario || 'Ciudadano'})`);
        }
    });

    console.log('\n--- RESUMEN FINAL DE LA AUDITORÍA ---');
    console.log(`Comentarios del equipo verificados: ${teamVerifiedCount}`);
    console.log(`Comentarios de ciudadanos externos: ${citizenVerifiedCount}`);
    console.log(`Porcentaje de cobertura del equipo: ${audit.coveragePercentage}%`);
    console.log('\n>>> TEST COMPLETADO CON TOTAL ÉXITO <<<');
}

runTest().catch(err => {
    console.error('Error durante el test:', err);
    process.exit(1);
});
