const sequelize = require('../database/db');
require('../models/SocialAccount');
require('../models/SocialConnection');
require('../models/ContentAlert');
require('../models/ModerationReview');
require('../models/SocialSyncJob');
require('../models/SocialSyncError');
require('../models/SocialAuditLog');
require('../models/SocialMediaPost');
require('../models/SocialPostComment');
require('../models/SocialTeamAccount');
require('../models/SocialTeamInteraction');

async function migrateSocialRealMonitoring() {
    console.log('--- Iniciando Migración Segura de Monitoreo Real de Redes Sociales ---');
    const isPostgres = process.env.DB_DIALECT === 'postgres' || !!process.env.DATABASE_URL;

    try {
        // 1. Sincronizar modelos nuevos para crearlos si no existen
        await sequelize.sync();
        console.log('✓ Tablas base y nuevos modelos sincronizados con éxito.');

        // 2. Comprobar y agregar columnas faltantes en tablas existentes
        async function getColumns(tableName) {
            if (isPostgres) {
                const [results] = await sequelize.query(`
                    SELECT column_name as name 
                    FROM information_schema.columns 
                    WHERE table_name = '${tableName}'
                `);
                return results.map(r => r.name.toLowerCase());
            } else {
                const [results] = await sequelize.query(`PRAGMA table_info("${tableName}")`);
                return results.map(r => r.name.toLowerCase());
            }
        }

        async function addColumnIfNotExists(tableName, columnName, columnDefinition) {
            const cols = await getColumns(tableName);
            if (!cols.includes(columnName.toLowerCase())) {
                console.log(`+ Agregando columna ${columnName} a ${tableName}...`);
                await sequelize.query(`ALTER TABLE "${tableName}" ADD COLUMN ${columnName} ${columnDefinition};`);
            } else {
                console.log(`  Columna ${columnName} ya existe en ${tableName}.`);
            }
        }

        const boolFalse = isPostgres ? 'BOOLEAN DEFAULT FALSE' : 'BOOLEAN DEFAULT 0';
        const boolTrue = isPostgres ? 'BOOLEAN DEFAULT TRUE' : 'BOOLEAN DEFAULT 1';
        const dateType = isPostgres ? 'TIMESTAMP' : 'DATETIME';

        // Columnas en SocialMediaPosts
        await addColumnIfNotExists('SocialMediaPosts', 'account_id', 'INTEGER');
        await addColumnIfNotExists('SocialMediaPosts', 'external_id', 'VARCHAR(255)');
        await addColumnIfNotExists('SocialMediaPosts', 'source_type', "VARCHAR(50) DEFAULT 'public_third_party'");
        await addColumnIfNotExists('SocialMediaPosts', 'raw_data', 'TEXT');
        await addColumnIfNotExists('SocialMediaPosts', 'sync_status', "VARCHAR(50) DEFAULT 'synced'");

        // Columnas en SocialPostComments
        await addColumnIfNotExists('SocialPostComments', 'account_id', 'INTEGER');
        await addColumnIfNotExists('SocialPostComments', 'external_id', 'VARCHAR(255)');
        await addColumnIfNotExists('SocialPostComments', 'parent_comment_id', 'VARCHAR(255)');
        await addColumnIfNotExists('SocialPostComments', 'autor_id_externo', 'VARCHAR(255)');
        await addColumnIfNotExists('SocialPostComments', 'url_comentario', 'TEXT');
        await addColumnIfNotExists('SocialPostComments', 'categoria_contenido', "VARCHAR(50) DEFAULT 'general'");
        await addColumnIfNotExists('SocialPostComments', 'nivel_confianza_ia', 'FLOAT DEFAULT 1.0');
        await addColumnIfNotExists('SocialPostComments', 'es_critica_legitima', boolFalse);
        await addColumnIfNotExists('SocialPostComments', 'es_amenaza', boolFalse);
        await addColumnIfNotExists('SocialPostComments', 'requiere_revision_humana', boolFalse);
        await addColumnIfNotExists('SocialPostComments', 'estado_revision', "VARCHAR(50) DEFAULT 'pendiente'");
        await addColumnIfNotExists('SocialPostComments', 'revisado_por_user_id', 'INTEGER');
        await addColumnIfNotExists('SocialPostComments', 'notas_moderacion', 'TEXT');
        await addColumnIfNotExists('SocialPostComments', 'raw_data', 'TEXT');

        // Columnas en SocialTeamInteractions
        await addColumnIfNotExists('SocialTeamInteractions', 'tipo_verificacion', "VARCHAR(50) DEFAULT 'declarada'");
        await addColumnIfNotExists('SocialTeamInteractions', 'evidencia_url', 'TEXT');
        await addColumnIfNotExists('SocialTeamInteractions', 'external_interaction_id', 'VARCHAR(255)');
        await addColumnIfNotExists('SocialTeamInteractions', 'api_verified_at', dateType);
        await addColumnIfNotExists('SocialTeamInteractions', 'notas_verificacion', 'TEXT');

        // Columnas en SocialTeamAccounts
        await addColumnIfNotExists('SocialTeamAccounts', 'consentimiento_vinculacion', boolTrue);
        await addColumnIfNotExists('SocialTeamAccounts', 'fecha_consentimiento', dateType);
        await addColumnIfNotExists('SocialTeamAccounts', 'id_externo_usuario', 'VARCHAR(255)');

        // 3. Crear índices únicos para evitar duplicados en inserción concurrente
        try {
            await sequelize.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS idx_post_plataforma_external 
                ON "SocialMediaPosts" (plataforma, external_id) 
                WHERE external_id IS NOT NULL;
            `);
        } catch (e) {
            // Algunos motores no soportan indices parciales; omitir si falla
        }

        try {
            await sequelize.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS idx_comment_plataforma_external 
                ON "SocialPostComments" (plataforma, external_id) 
                WHERE external_id IS NOT NULL;
            `);
        } catch (e) {
            // Omitir si no soporta
        }

        console.log('✓ Migración completada exitosamente.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en la migración:', error);
        process.exit(1);
    }
}

migrateSocialRealMonitoring();
