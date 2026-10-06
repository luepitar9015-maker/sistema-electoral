const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const sequelize = require('../database/db');

// Importar todos los 28 modelos del sistema
const User = require('../models/User');
const Voter = require('../models/Voter');
const CensoElectoral = require('../models/CensoElectoral');
const Campaign = require('../models/Campaign');
const Apoyo = require('../models/Apoyo');
const WhatsAppMessage = require('../models/WhatsAppMessage');
const Reunion = require('../models/Reunion');
const ReunionAsistente = require('../models/ReunionAsistente');
const SocialMediaPost = require('../models/SocialMediaPost');
const SocialTeamAccount = require('../models/SocialTeamAccount');
const SocialNegativeComment = require('../models/SocialNegativeComment');
const SocialCompetitor = require('../models/SocialCompetitor');
const SocialCompetitorAttack = require('../models/SocialCompetitorAttack');
const SocialTeamInteraction = require('../models/SocialTeamInteraction');
const SocialMetricSnapshot = require('../models/SocialMetricSnapshot');
const SocialContentAnalysis = require('../models/SocialContentAnalysis');
const SocialExperiment = require('../models/SocialExperiment');
const AuditLog = require('../models/AuditLog');
const AIUsageLog = require('../models/AIUsageLog');
const SocialPostComment = require('../models/SocialPostComment');
const VoterInteraction = require('../models/VoterInteraction');
const TestigoElectoral = require('../models/TestigoElectoral');
const DiaDMesaReporte = require('../models/DiaDMesaReporte');
const LogisticaVehiculo = require('../models/LogisticaVehiculo');
const LogisticaDespacho = require('../models/LogisticaDespacho');
const CallCenterLog = require('../models/CallCenterLog');
const NecesidadCiudadana = require('../models/NecesidadCiudadana');
const CompromisoGestion = require('../models/CompromisoGestion');

async function runAuditAndSync() {
    console.log('=====================================================');
    console.log('🚀 INICIANDO AUDITORÍA Y SINCRONIZACIÓN EXHAUSTIVA DB');
    console.log('=====================================================');

    try {
        await sequelize.authenticate();
        const dialect = sequelize.getDialect();
        console.log(`✅ Conexión establecida con la Base de Datos [Dialecto: ${dialect}]`);

        // 1. Ejecutar sincronización de Sequelize (crea tablas faltantes)
        console.log('\n📦 1. Sincronizando modelos con Sequelize (CREATE TABLE IF NOT EXISTS)...');
        await sequelize.sync();
        console.log('✅ Tablas base verificadas y sincronizadas.');

        // 2. Si es PostgreSQL, verificar y añadir columnas críticas que puedan faltar en tablas existentes
        if (dialect === 'postgres') {
            console.log('\n🔍 2. Verificando y creando columnas avanzadas en PostgreSQL...');

            const columnPatches = [
                // Campaigns
                { table: 'Campaigns', column: 'modo_operacion', type: "VARCHAR(255) DEFAULT 'electoral'" },
                { table: 'Campaigns', column: 'periodo_gobierno', type: "VARCHAR(255) DEFAULT '2024-2027'" },
                { table: 'Campaigns', column: 'parent_campaign_id', type: "INTEGER" },
                { table: 'Campaigns', column: 'meta_comunas_json', type: "TEXT" },
                { table: 'Campaigns', column: 'fecha_inicio', type: "VARCHAR(255)" },
                { table: 'Campaigns', column: 'fecha_elecciones', type: "VARCHAR(255)" },
                { table: 'Campaigns', column: 'link_instagram', type: "VARCHAR(255)" },
                { table: 'Campaigns', column: 'link_tiktok', type: "VARCHAR(255)" },
                { table: 'Campaigns', column: 'link_facebook', type: "VARCHAR(255)" },
                { table: 'Campaigns', column: 'link_twitter', type: "VARCHAR(255)" },
                { table: 'Campaigns', column: 'link_youtube', type: "VARCHAR(255)" },
                { table: 'Campaigns', column: 'link_whatsapp', type: "VARCHAR(255)" },
                
                // Users
                { table: 'Users', column: 'cargo_institucional', type: "VARCHAR(255)" },
                { table: 'Users', column: 'telefono', type: "VARCHAR(255)" },
                { table: 'Users', column: 'documento', type: "VARCHAR(255)" },
                { table: 'Users', column: 'campana_id', type: "INTEGER" },

                // CallCenterLogs
                { table: 'CallCenterLogs', column: 'evento_fecha_hora', type: "VARCHAR(255)" },
                { table: 'CallCenterLogs', column: 'evento_titulo', type: "VARCHAR(255)" },
                { table: 'CallCenterLogs', column: 'asistencia_confirmada', type: "BOOLEAN DEFAULT false" },
                { table: 'CallCenterLogs', column: 'reunion_id', type: "INTEGER" },

                // Voters
                { table: 'Voters', column: 'isLeader', type: "BOOLEAN DEFAULT false" },
                { table: 'Voters', column: 'lugar_votacion', type: "VARCHAR(255)" },
                { table: 'Voters', column: 'mesa_votacion', type: "VARCHAR(255)" },
                { table: 'Voters', column: 'barrio', type: "VARCHAR(255)" },
                { table: 'Voters', column: 'comuna', type: "VARCHAR(255)" },
                { table: 'Voters', column: 'municipio', type: "VARCHAR(255)" },
                { table: 'Voters', column: 'departamento', type: "VARCHAR(255)" },
                { table: 'Voters', column: 'prioridad', type: "VARCHAR(255) DEFAULT 'media'" },
                { table: 'Voters', column: 'apoyo_confirmado', type: "BOOLEAN DEFAULT false" },

                // CompromisosGestion
                { table: 'CompromisosGestion', column: 'cargo_responsable', type: "VARCHAR(255)" },
                { table: 'CompromisosGestion', column: 'secretaria_o_comision', type: "VARCHAR(255)" },
                { table: 'CompromisosGestion', column: 'lider_comunal_enlace', type: "VARCHAR(255)" },
                { table: 'CompromisosGestion', column: 'porcentaje_avance', type: "INTEGER DEFAULT 0" },
                { table: 'CompromisosGestion', column: 'impacto_electoral_futuro', type: "VARCHAR(255) DEFAULT 'alto'" },

                // SocialCompetitorAttacks
                { table: 'SocialCompetitorAttacks', column: 'target_entidad', type: "VARCHAR(255) DEFAULT 'candidato'" },
                { table: 'SocialCompetitorAttacks', column: 'falso_o_desinformacion', type: "BOOLEAN DEFAULT false" },
                { table: 'SocialCompetitorAttacks', column: 'sospecha_red_bots', type: "BOOLEAN DEFAULT false" },
                { table: 'SocialCompetitorAttacks', column: 'guion_candidato', type: "TEXT" },
                { table: 'SocialCompetitorAttacks', column: 'guion_voceros_prensa', type: "TEXT" },
                { table: 'SocialCompetitorAttacks', column: 'guion_tropa_digital', type: "TEXT" },
                { table: 'SocialCompetitorAttacks', column: 'guion_debate_en_vivo', type: "TEXT" }
            ];

            for (const patch of columnPatches) {
                try {
                    await sequelize.query(`ALTER TABLE "${patch.table}" ADD COLUMN IF NOT EXISTS "${patch.column}" ${patch.type};`);
                    console.log(`  ✓ Columna "${patch.table}"."${patch.column}" validada/creada.`);
                } catch (colErr) {
                    console.warn(`  ⚠️ Nota en "${patch.table}"."${patch.column}": ${colErr.message}`);
                }
            }
        }

        // 3. Probar conteo y consultas en los 28 modelos
        console.log('\n📊 3. Verificando integridad de consultas en TODOS los modelos...');
        const models = [
            { name: 'User', model: User },
            { name: 'Campaign', model: Campaign },
            { name: 'Voter', model: Voter },
            { name: 'CensoElectoral', model: CensoElectoral },
            { name: 'Apoyo', model: Apoyo },
            { name: 'WhatsAppMessage', model: WhatsAppMessage },
            { name: 'Reunion', model: Reunion },
            { name: 'ReunionAsistente', model: ReunionAsistente },
            { name: 'SocialMediaPost', model: SocialMediaPost },
            { name: 'SocialTeamAccount', model: SocialTeamAccount },
            { name: 'SocialNegativeComment', model: SocialNegativeComment },
            { name: 'SocialCompetitor', model: SocialCompetitor },
            { name: 'SocialCompetitorAttack', model: SocialCompetitorAttack },
            { name: 'SocialTeamInteraction', model: SocialTeamInteraction },
            { name: 'SocialMetricSnapshot', model: SocialMetricSnapshot },
            { name: 'SocialContentAnalysis', model: SocialContentAnalysis },
            { name: 'SocialExperiment', model: SocialExperiment },
            { name: 'AuditLog', model: AuditLog },
            { name: 'AIUsageLog', model: AIUsageLog },
            { name: 'SocialPostComment', model: SocialPostComment },
            { name: 'VoterInteraction', model: VoterInteraction },
            { name: 'TestigoElectoral', model: TestigoElectoral },
            { name: 'DiaDMesaReporte', model: DiaDMesaReporte },
            { name: 'LogisticaVehiculo', model: LogisticaVehiculo },
            { name: 'LogisticaDespacho', model: LogisticaDespacho },
            { name: 'CallCenterLog', model: CallCenterLog },
            { name: 'NecesidadCiudadana', model: NecesidadCiudadana },
            { name: 'CompromisoGestion', model: CompromisoGestion }
        ];

        let successCount = 0;
        let failCount = 0;

        for (const item of models) {
            try {
                const count = await item.model.count();
                console.log(`  ✅ [${item.name}] Operacional - Registros: ${count}`);
                successCount++;
            } catch (err) {
                console.error(`  ❌ [${item.name}] ERROR:`, err.message);
                failCount++;
            }
        }

        console.log('\n=====================================================');
        console.log(`🏁 RESULTADO AUDITORÍA: ${successCount}/28 Modelos 100% OPERACIONALES. Fallos: ${failCount}`);
        console.log('=====================================================');

        if (failCount > 0) {
            process.exit(1);
        } else {
            console.log('🎉 BASE DE DATOS Y MODELOS VERIFICADOS EXITOSAMENTE.');
            process.exit(0);
        }

    } catch (e) {
        console.error('💥 Error crítico en auditoría:', e);
        process.exit(1);
    }
}

runAuditAndSync();
