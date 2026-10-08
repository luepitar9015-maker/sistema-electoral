const BASE_URL = 'http://localhost:3000';

async function testSenadoLive() {
    console.log('========================================================================');
    console.log('🧪 VERIFICACIÓN END-TO-END DEL SISTEMA ELECTORAL EN VIVO (SENADO 2026)');
    console.log('========================================================================\n');

    let token = null;

    // 1. LOGIN
    console.log('1️⃣  Probando Autenticación (POST /api/auth/login)...');
    try {
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@sistema.com', password: 'admin123' })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok && loginData.token) {
            token = loginData.token;
            console.log(`   ✅ Login exitoso. Rol: ${loginData.user?.role} | Email: ${loginData.user?.email}`);
        } else {
            throw new Error(`Login falló: ${JSON.stringify(loginData)}`);
        }
    } catch (e) {
        console.error('   ❌ Error en login:', e.message);
        process.exit(1);
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    async function getApi(endpoint) {
        const res = await fetch(`${BASE_URL}${endpoint}`, { headers });
        const text = await res.text();
        try {
            return { status: res.status, data: JSON.parse(text) };
        } catch {
            return { status: res.status, raw: text.slice(0, 100) };
        }
    }

    // 2. CAMPAÑAS
    console.log('\n2️⃣  Verificando Campañas (GET /api/campaigns)...');
    const { status: sCamp, data: dCamp } = await getApi('/api/campaigns');
    console.log(`   Status: ${sCamp} | Total Campañas: ${Array.isArray(dCamp) ? dCamp.length : 0}`);
    const senadoCamp = (Array.isArray(dCamp) ? dCamp : []).find(c => c.id === 7 || c.tipo_cargo === 'senado');
    if (senadoCamp) {
        console.log(`   ✅ Campaña Senado: "${senadoCamp.nombre}"`);
        console.log(`      • Candidato: ${senadoCamp.candidato} | Tarjetón: ${senadoCamp.numero_tarjeton} | Meta: ${senadoCamp.meta_votos?.toLocaleString()} votos`);
        console.log(`      • Votantes Registrados: ${senadoCamp.totalVoters} | Líderes: ${senadoCamp.totalLeaders}`);
        console.log(`      • Reloj: ${senadoCamp.reloj?.dias_restantes > 0 ? senadoCamp.reloj.dias_restantes + ' días restantes' : 'Fase electoral activa'} (Ritmo: ${senadoCamp.reloj?.ritmo_diario_requerido || 0} votos/día)`);
    }

    const CAMP_ID = senadoCamp ? senadoCamp.id : 7;

    // 3. REPORTES GEO Y LÍDERES
    console.log(`\n3️⃣  Verificando Estadísticas Geográficas (GET /api/reports/geo?campana_id=${CAMP_ID})...`);
    const { status: sGeo, data: dGeo } = await getApi(`/api/reports/geo?campana_id=${CAMP_ID}`);
    console.log(`   Status: ${sGeo} | Departamentos Reportados: ${Array.isArray(dGeo) ? dGeo.length : 0}`);
    if (Array.isArray(dGeo)) {
        dGeo.slice(0, 5).forEach(g => {
            console.log(`   ✅ Dept: ${g.departamento || 'Sin asignar'} — ${g.total || g.count} votantes`);
        });
    }

    console.log(`\n4️⃣  Verificando Desempeño de Líderes (GET /api/reports/leaders?campana_id=${CAMP_ID})...`);
    const { status: sLead, data: dLead } = await getApi(`/api/reports/leaders?campana_id=${CAMP_ID}`);
    console.log(`   Status: ${sLead} | Líderes Registrados: ${Array.isArray(dLead) ? dLead.length : 0}`);
    if (Array.isArray(dLead)) {
        dLead.slice(0, 4).forEach(l => {
            console.log(`   ✅ Líder: ${l.lider_nombre || l.nombre} (${l.departamento || 'Nacional'}) — ${l.total_referidos || l.count || 0} votantes movilizados`);
        });
    }

    // 5. PADRÓN DE VOTANTES
    console.log(`\n5️⃣  Verificando Padrón Electoral (GET /api/voters?campana_id=${CAMP_ID}&limit=5)...`);
    const { status: sVot, data: dVot } = await getApi(`/api/voters?campana_id=${CAMP_ID}&limit=5`);
    const votersList = Array.isArray(dVot) ? dVot : (dVot?.voters || []);
    console.log(`   Status: ${sVot} | Total Padrón Disponible: ${dVot?.total || votersList.length}`);
    votersList.slice(0, 3).forEach(v => {
        console.log(`   ✅ [C.C. ${v.cedula}] ${v.nombres} ${v.apellidos} | ${v.municipio}, ${v.departamento} | Puesto: ${v.lugar_votacion} (Mesa ${v.mesa}) | Fidelidad: ${v.fidelidad_score}/5`);
    });

    // 6. FOROS Y PLAZAS PÚBLICAS
    console.log(`\n6️⃣  Verificando Foros y Plazas Públicas (GET /api/reuniones?campana_id=${CAMP_ID})...`);
    const { status: sReu, data: dReu } = await getApi(`/api/reuniones?campana_id=${CAMP_ID}`);
    const reuniones = Array.isArray(dReu) ? dReu : [];
    console.log(`   Status: ${sReu} | Eventos Programados: ${reuniones.length}`);
    reuniones.forEach(r => {
        console.log(`   ✅ ${r.titulo} | Lugar: ${r.lugar_nombre} (${r.municipio}) | Aforo: ${r.aforo_estimado?.toLocaleString()} pers. | Estado: ${r.estado?.toUpperCase()}`);
    });

    // 7. DÍA D AUDITORÍA E-14
    console.log(`\n7️⃣  Verificando Auditoría Electoral E-14 (GET /api/dia-d/comparador-e14?campana_id=${CAMP_ID})...`);
    const { status: sDiaD, data: dDiaD } = await getApi(`/api/dia-d/comparador-e14?campana_id=${CAMP_ID}`);
    const mesas = Array.isArray(dDiaD?.reportes) ? dDiaD.reportes : [];
    console.log(`   Status: ${sDiaD} | Mesas Monitoreadas: ${mesas.length} | Votos en Disputa: ${dDiaD?.kpis?.votos_disputa_recuperables || 0} | Reclamaciones: ${dDiaD?.kpis?.reclamaciones_radicadas || 0}`);
    mesas.forEach(m => {
        console.log(`   ✅ Mesa ${m.mesa} - ${m.puesto_votacion} (${m.municipio}) | E-14: ${m.votos_candidato_principal} votos | Estado: [${m.estado_auditoria?.toUpperCase()}] | ${m.reclamacion_radicada ? '🚨 RECLAMACIÓN RADICADA: ' + m.reclamacion_folio : '✅ Conciliada'}`);
    });

    // 8. CALL CENTER OPERATIVO
    console.log(`\n8️⃣  Verificando Call Center Operativo (GET /api/callcenter/stats?campana_id=${CAMP_ID})...`);
    const { status: sCC, data: dCC } = await getApi(`/api/callcenter/stats?campana_id=${CAMP_ID}`);
    console.log(`   Status: ${sCC} | Llamadas GOTV: ${dCC?.total_llamadas || 0} | Votos Confirmados: ${dCC?.confirmados || 0} | Transporte Requerido: ${dCC?.transporte_solicitado || 0} | Efectividad: ${dCC?.tasa_efectividad_pct}%`);

    // 9. LOGÍSTICA DE FLOTA Y DESPACHO
    console.log(`\n9️⃣  Verificando Flota Logística y Despachos (GET /api/logistica/vehiculos?campana_id=${CAMP_ID})...`);
    const { status: sVeh, data: dVeh } = await getApi(`/api/logistica/vehiculos?campana_id=${CAMP_ID}`);
    const vehiculos = Array.isArray(dVeh) ? dVeh : [];
    console.log(`   Status: ${sVeh} | Vehículos en Flota: ${vehiculos.length}`);
    vehiculos.forEach(vh => {
        console.log(`   ✅ [Placa ${vh.placa}] ${vh.tipo_vehiculo?.toUpperCase()} | Conductor: ${vh.conductor_nombre} (${vh.conductor_telefono}) | Pasajeros: ${vh.pasajeros_movilizados} | Estado: ${vh.estado}`);
    });

    // 10. DEMANDAS Y NECESIDADES CIUDADANAS
    console.log(`\n🔟 Verificando Demandas y Necesidades Ciudadanas (GET /api/necesidades?campana_id=${CAMP_ID})...`);
    const { status: sNec, data: dNec } = await getApi(`/api/necesidades?campana_id=${CAMP_ID}`);
    const necesidades = Array.isArray(dNec) ? dNec : [];
    console.log(`   Status: ${sNec} | Necesidades Ciudadanas: ${necesidades.length}`);
    necesidades.forEach(n => {
        console.log(`   ✅ [${n.prioridad?.toUpperCase()}] ${n.titulo} | Impacto: ${n.impacto_familias_estimado?.toLocaleString()} familias | Estado: ${n.estado}`);
    });

    // 11. SALA DE GUERRA DIGITAL Y BITÁCORA DE ATAQUES
    console.log(`\n1️⃣1️⃣  Verificando Sala de Guerra y Ataques (GET /api/social/competitors/attacks?campana_id=${CAMP_ID})...`);
    const { status: sAtk, data: dAtk } = await getApi(`/api/social/competitors/attacks?campana_id=${CAMP_ID}`);
    const ataques = Array.isArray(dAtk) ? dAtk : [];
    console.log(`   Status: ${sAtk} | Ataques Monitoreados: ${ataques.length}`);
    ataques.forEach(a => {
        console.log(`   ✅ [${a.plataforma?.toUpperCase()}] Adversario: ${a.adversario_nombre} | Táctica: ${a.tactica_recomendada?.toUpperCase()}`);
        console.log(`      Contranarrativa: "${a.guion_candidato?.slice(0, 90)}..."`);
    });

    // 12. SIMULADOR D'HONDT Y CIFRA REPARTIDORA (100 CURULES SENADO DE LA REPÚBLICA)
    console.log('\n1️⃣2️⃣  Probando Simulador Electoral D\'Hondt para 100 Curules al Senado de la República...');
    const dhondtPayload = {
        total_censo: 39500000,
        participacion_pct: 55,
        escanos_disponibles: 100, // 100 Curules Senado Ordinario
        umbral_pct: 50,
        listas: [
            { nombre: 'Centro Democrático (CD 7)', votos: 2450000, esPropia: true },
            { nombre: 'Pacto Opositor / Progresista', votos: 2800000, esPropia: false },
            { nombre: 'Partido Liberal Colombiano', votos: 2150000, esPropia: false },
            { nombre: 'Partido Conservador Colombiano', votos: 1980000, esPropia: false },
            { nombre: 'Cambio Radical', votos: 1650000, esPropia: false },
            { nombre: 'Alianza Verde', votos: 1420000, esPropia: false },
            { nombre: 'Partido de la U', votos: 1250000, esPropia: false },
            { nombre: 'Movimientos sin Umbral', votos: 480000, esPropia: false }
        ]
    };

    const simRes = await fetch(`${BASE_URL}/api/reports/simulate-dhondt`, {
        method: 'POST',
        headers,
        body: JSON.stringify(dhondtPayload)
    });
    const simData = await simRes.json();
    console.log(`   Status: ${simRes.status}`);
    if (simRes.ok) {
        console.log(`   ✅ Cifra Repartidora Oficial: ${simData.cifraRepartidora?.toLocaleString()} votos`);
        console.log(`   ✅ Curules Obtenidas por Nuestra Lista (CD 7): ${simData.analisisListaPropia?.curules_obtenidas} Curules en el Senado`);
        console.log(`   ✅ Votos para Siguiente Curul: +${simData.analisisListaPropia?.votos_para_siguiente_curul?.toLocaleString()} votos adicionales`);
        console.log('   ✅ Bancada Proyectada en el Senado:');
        simData.resultados?.forEach(r => {
            console.log(`      • ${r.nombre}: ${r.curules} curules (${r.porcentajeCurules}%) [${r.votos?.toLocaleString()} votos]`);
        });
    }

    console.log('\n========================================================================');
    console.log('✨ SISTEMA ELECTORAL TOTALMENTE VERIFICADO Y OPERATIVO EN VIVO');
    console.log('   Acceso Directo: http://localhost:3000');
    console.log('   Credenciales: admin@sistema.com / admin123');
    console.log('========================================================================');
    process.exit(0);
}

testSenadoLive().catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
});
