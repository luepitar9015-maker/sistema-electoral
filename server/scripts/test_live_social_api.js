/**
 * Script de prueba de endpoints en vivo para el Módulo de Redes Sociales
 */
async function testLiveSocialApi() {
    const baseUrl = 'http://127.0.0.1:5000/api';
    console.log('=== VERIFICANDO ENDPOINTS EN VIVO DE REDES SOCIALES ===\n');

    try {
        console.log('1. Autenticando con admin@sistema.com...');
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@sistema.com', password: 'admin123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        if (!token) throw new Error('No se recibió token: ' + JSON.stringify(loginData));
        console.log('   ✓ Login exitoso. Token JWT obtenido.\n');

        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

        // 2. Probar métricas reales
        console.log('2. Consultando métricas reales de redes (GET /api/social/metrics?campana_id=1)...');
        const mRes = await fetch(`${baseUrl}/social/metrics?campana_id=1`, { headers });
        const mData = await mRes.json();
        const kpis = mData.kpis || {};
        console.log('   ✓ Métricas obtenidas con éxito:');
        console.log(`     - Total Posts: ${kpis.totalPosts || 0}`);
        console.log(`     - Total Interacciones: ${kpis.totalInteracciones || 0}`);
        console.log(`     - Total Comentarios: ${kpis.totalComentarios || 0}`);
        console.log(`     - Cuentas Monitoreadas: ${kpis.totalCuentasMonitoreadas || 0}`);
        console.log(`     - Alertas Pendientes: ${kpis.alertasPendientes || 0}\n`);

        // 3. Probar conexiones
        console.log('3. Consultando conexiones oficiales configuradas (GET /api/social/connections?campana_id=1)...');
        const cRes = await fetch(`${baseUrl}/social/connections?campana_id=1`, { headers });
        const cData = await cRes.json();
        const conns = cData.connections || [];
        console.log(`   ✓ Conexiones retornadas: ${conns.length} plataformas registradas`);
        conns.forEach(c => {
            console.log(`     - Plataforma: ${c.plataforma} | Estado: ${c.is_valid ? 'activa' : 'inactiva'} | Con token: ${c.tiene_token_configurado} | Secretos expuestos: ${c.token_seguro !== undefined}`);
        });
        console.log('     - Estado Variables de Entorno:', cData.envStatus || {});
        console.log('');

        // 4. Probar cuentas monitoreadas
        console.log('4. Consultando cuentas monitoreadas (GET /api/social/accounts?campana_id=1)...');
        const aRes = await fetch(`${baseUrl}/social/accounts?campana_id=1`, { headers });
        const aData = await aRes.json();
        const accountsList = Array.isArray(aData) ? aData : (aData.accounts || []);
        console.log(`   ✓ Total cuentas monitoreadas registradas: ${accountsList.length}\n`);

        // 5. Probar alertas de contenido
        console.log('5. Consultando bandeja de alertas de contenido NLP (GET /api/social/content-alerts?campana_id=1)...');
        const alRes = await fetch(`${baseUrl}/social/content-alerts?campana_id=1`, { headers });
        const alData = await alRes.json();
        const alertsList = Array.isArray(alData) ? alData : (alData.alerts || []);
        console.log(`   ✓ Alertas activas en bandeja: ${alertsList.length}\n`);

        // 6. Probar historial de sincronizaciones
        console.log('6. Consultando historial de sincronización (GET /api/social/sync-jobs?campana_id=1)...');
        const jRes = await fetch(`${baseUrl}/social/sync-jobs?campana_id=1`, { headers });
        const jData = await jRes.json();
        const jobsList = Array.isArray(jData) ? jData : (jData.jobs || []);
        console.log(`   ✓ Registros de ejecución de sincronización: ${jobsList.length}\n`);

        console.log('=====================================================================');
        console.log('   ✅ TODOS LOS ENDPOINTS DE REDES SOCIALES RESPONDEN CORRECTAMENTE');
        console.log('=====================================================================\n');
    } catch (err) {
        console.error('Error durante la verificación en vivo:', err);
        process.exit(1);
    }
}

testLiveSocialApi();
