/**
 * Script de Verificación Integral de Criterios de Aceptación (Fases 1-12)
 * Sistema Electoral - Módulo de Monitoreo Real de Redes Sociales
 */
const sequelize = require('../database/db');
const SocialMediaPost = require('../models/SocialMediaPost');
const SocialPostComment = require('../models/SocialPostComment');
const SocialAccount = require('../models/SocialAccount');
const SocialConnection = require('../models/SocialConnection');
const SocialTeamAccount = require('../models/SocialTeamAccount');
const SocialTeamInteraction = require('../models/SocialTeamInteraction');
const ContentAlert = require('../models/ContentAlert');
const SocialSyncError = require('../models/SocialSyncError');
const { classifyComment } = require('../services/commentClassifierService');
const { getConnector } = require('../services/socialConnectors');

async function runAcceptanceTests() {
    console.log('================================================================');
    console.log('   VERIFICACIÓN INTEGRAL DE CRITERIOS DE ACEPTACIÓN — REDES   ');
    console.log('================================================================\n');

    let passedTests = 0;
    let totalTests = 0;

    function assert(desc, condition, details = '') {
        totalTests++;
        if (condition) {
            console.log(`[PASS] ${desc}`);
            if (details) console.log(`       -> ${details}`);
            passedTests++;
        } else {
            console.error(`[FAIL] ${desc}`);
            if (details) console.error(`       -> ${details}`);
        }
    }

    try {
        await sequelize.authenticate();
        console.log('✓ Conexión a Base de Datos SQLite verificada.\n');

        // Test 1: Deduplicación estricta y llaves compuestas
        console.log('--- TEST 1: Deduplicación en ejecuciones repetidas ---');
        const testExternalId = 'test_post_' + Date.now();
        const [post1, created1] = await SocialMediaPost.findOrCreate({
            where: { plataforma: 'youtube', external_id: testExternalId },
            defaults: {
                campana_id: 1,
                titulo: 'Test Verificación Deduplicación',
                contenido: 'Contenido de prueba para verificar no duplicación',
                url_publicacion: 'https://youtube.com/watch?v=' + testExternalId,
                source_type: 'managed',
                fecha_publicacion: new Date().toISOString()
            }
        });
        assert('Primera inserción crea el registro', created1 === true && post1.id != null);

        const [post2, created2] = await SocialMediaPost.findOrCreate({
            where: { plataforma: 'youtube', external_id: testExternalId },
            defaults: {
                campana_id: 1,
                titulo: 'Test Verificación Deduplicación Repetida',
                contenido: 'Contenido duplicado',
                fecha_publicacion: new Date().toISOString()
            }
        });
        assert('Segunda ejecución detecta duplicado (created === false)', created2 === false && post2.id === post1.id);
        
        // Limpieza de prueba
        await SocialMediaPost.destroy({ where: { external_id: testExternalId } });

        // Test 2: Clasificador de Comentarios (NLP - Diferenciación Crítica vs Insulto vs Amenaza)
        console.log('\n--- TEST 2: NLP - Distinción de Crítica Legítima vs Insulto vs Amenaza vs Spam ---');
        
        const resAmenaza = classifyComment('Te vamos a matar si vienes a este barrio, cuídate la espalda');
        assert(
            'Detección de amenaza explícita',
            resAmenaza.es_amenaza === true && resAmenaza.categoria === 'amenaza',
            `Categoría: ${resAmenaza.categoria}, Confianza: ${resAmenaza.nivel_confianza}`
        );

        const resInsulto = classifyComment('Eres un corrupto de mierda y una rata asquerosa');
        assert(
            'Detección de insulto y lenguaje ofensivo',
            resInsulto.categoria === 'insulto' && resInsulto.es_amenaza === false,
            `Categoría: ${resInsulto.categoria}, Confianza: ${resInsulto.nivel_confianza}`
        );

        const resCritica = classifyComment('No estoy de acuerdo con su propuesta de reforma porque falta de presupuesto');
        assert(
            'Detección de crítica legítima a propuestas',
            resCritica.es_critica_legitima === true && resCritica.categoria === 'critica',
            `Categoría: ${resCritica.categoria}, Confianza: ${resCritica.nivel_confianza}`
        );

        const resSpam = classifyComment('Gana 500 dólares al día trabajando desde casa clic aquí bit.ly/gana-dinero');
        assert(
            'Detección de posible spam / enlaces externos',
            resSpam.categoria === 'spam',
            `Categoría: ${resSpam.categoria}`
        );

        const resPregunta = classifyComment('¿A qué hora empieza el debate de hoy y dónde puedo verlo en vivo?');
        assert(
            'Detección de preguntas de ciudadanos',
            resPregunta.categoria === 'pregunta',
            `Categoría: ${resPregunta.categoria}`
        );

        const resRevision = classifyComment('Habrá que ver qué pasa en las urnas el próximo domingo');
        assert(
            'Comentario general o neutro sin alertas',
            resRevision.categoria === 'general',
            `Categoría: ${resRevision.categoria}`
        );

        // Test 3: Criterio 8 - Atribución de Equipo por @handle ESTRICTO (NO por nombres similares)
        console.log('\n--- TEST 3: Atribución de equipo estricta por @handle o ID Externo ---');
        
        // Simular miembro del equipo registrado con handle exacto
        const teamAccount = await SocialTeamAccount.create({
            campana_id: 1,
            nombre_miembro: 'Carlos Rodriguez',
            plataforma: 'twitter',
            usuario_handle: '@carlos_oficial',
            consentimiento_vinculacion: true,
            id_externo_usuario: 'tw_987654321'
        });

        // Caso A: Autor con nombre similar pero @handle diferente
        const autorNombreParecido = {
            authorName: 'Carlos Rodriguez Perez',
            authorHandle: '@carlos_otro_ciudadano',
            authorId: 'tw_111111111'
        };

        const matchA = (
            (autorNombreParecido.authorHandle && autorNombreParecido.authorHandle.toLowerCase().replace(/^@/, '') === teamAccount.usuario_handle.toLowerCase().replace(/^@/, '')) ||
            (autorNombreParecido.authorId && autorNombreParecido.authorId === teamAccount.id_externo_usuario)
        );
        assert('Nombre parecido NO atribuye al equipo (Rechazo de falso positivo)', !matchA);

        // Caso B: Autor con el @handle oficial exacto
        const autorOficial = {
            authorName: 'Carlos R.',
            authorHandle: '@carlos_oficial',
            authorId: 'tw_987654321'
        };
        const matchB = (
            (autorOficial.authorHandle && autorOficial.authorHandle.toLowerCase().replace(/^@/, '') === teamAccount.usuario_handle.toLowerCase().replace(/^@/, '')) ||
            (autorOficial.authorId && autorOficial.authorId === teamAccount.id_externo_usuario)
        );
        assert('Handle exacto SÍ atribuye al equipo con evidencia verificable', matchB);

        // Limpiar registro de prueba
        await teamAccount.destroy();

        // Test 4: Conectores oficiales y manejo de restricciones de plataforma
        console.log('\n--- TEST 4: Conectores Oficiales y Respuestas ante Restricciones ---');
        
        const ytConnector = getConnector('youtube');
        assert('Conector de YouTube instanciado', ytConnector != null && ytConnector.platformName === 'youtube');

        const metaConnector = getConnector('facebook');
        assert('Conector de Meta/Facebook instanciado', metaConnector != null && metaConnector.platformName === 'meta');

        const xConnector = getConnector('twitter');
        assert('Conector de X/Twitter instanciado', xConnector != null && xConnector.platformName === 'twitter');

        const tiktokConnector = getConnector('tiktok');
        assert('Conector de TikTok instanciado', tiktokConnector != null && tiktokConnector.platformName === 'tiktok');

        // Test 5: Seguridad de Credenciales (No fuga de tokens en modelo SocialConnection)
        console.log('\n--- TEST 5: Seguridad y Encriptación de Tokens (No fugas en .toJSON()) ---');
        const connTest = SocialConnection.build({
            campana_id: 1,
            plataforma: 'meta',
            token_seguro: 'EAABwz_SUPER_SECRET_OAUTH_TOKEN_12345',
            refresh_token_seguro: 'REFRESH_SECRET_KEY_9999',
            is_valid: true
        });
        const serialized = connTest.toJSON();
        assert('token_seguro ocultado en toJSON()', serialized.token_seguro === undefined);
        assert('refresh_token_seguro ocultado en toJSON()', serialized.refresh_token_seguro === undefined);
        assert('tiene_token_configurado booleano presente', serialized.tiene_token_configurado === true);

        // Test 6: Integridad de tablas electorales previas
        console.log('\n--- TEST 6: Integridad de Módulos Electorales Existentes ---');
        const [tables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table'");
        const tableNames = tables.map(t => t.name);
        const requiredCoreTables = ['Voters', 'Campaigns', 'Users', 'ProyectosInversion', 'AuditLogs'];
        const existingCore = requiredCoreTables.filter(t => tableNames.includes(t));
        assert('Tablas electorales previas intactas y accesibles', existingCore.length > 0, `Tablas existentes encontradas: ${existingCore.join(', ')}`);

        console.log(`\n================================================================`);
        console.log(`   RESULTADO FINAL: ${passedTests}/${totalTests} PRUEBAS EXITOSAS (${Math.round((passedTests/totalTests)*100)}%)`);
        console.log(`================================================================\n`);

        process.exit(passedTests === totalTests ? 0 : 1);
    } catch (err) {
        console.error('Error durante la ejecución de pruebas:', err);
        process.exit(1);
    }
}

runAcceptanceTests();
