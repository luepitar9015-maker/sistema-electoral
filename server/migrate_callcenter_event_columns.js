const sequelize = require('./database/db');

async function migrateCallCenterEventColumns() {
    console.log('--- INICIANDO MIGRACIÓN CALL CENTER EVENTOS Y ENCUENTROS COMUNITARIOS ---');
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tableName = 'CallCenterLogs';

        const columnsToAdd = [
            { name: 'tipo_campana', query: `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "tipo_campana" VARCHAR(255) DEFAULT 'gotv_dia_d';`, sqliteQuery: `ALTER TABLE \`${tableName}\` ADD COLUMN \`tipo_campana\` VARCHAR(255) DEFAULT 'gotv_dia_d';` },
            { name: 'reunion_id', query: `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "reunion_id" INTEGER;`, sqliteQuery: `ALTER TABLE \`${tableName}\` ADD COLUMN \`reunion_id\` INTEGER;` },
            { name: 'evento_nombre', query: `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "evento_nombre" VARCHAR(255);`, sqliteQuery: `ALTER TABLE \`${tableName}\` ADD COLUMN \`evento_nombre\` VARCHAR(255);` },
            { name: 'evento_lugar', query: `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "evento_lugar" VARCHAR(255);`, sqliteQuery: `ALTER TABLE \`${tableName}\` ADD COLUMN \`evento_lugar\` VARCHAR(255);` },
            { name: 'evento_fecha_hora', query: `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "evento_fecha_hora" VARCHAR(255);`, sqliteQuery: `ALTER TABLE \`${tableName}\` ADD COLUMN \`evento_fecha_hora\` VARCHAR(255);` },
            { name: 'asistencia_confirmada', query: `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "asistencia_confirmada" BOOLEAN;`, sqliteQuery: `ALTER TABLE \`${tableName}\` ADD COLUMN \`asistencia_confirmada\` BOOLEAN;` },
            { name: 'cantidad_acompanantes', query: `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "cantidad_acompanantes" INTEGER DEFAULT 0;`, sqliteQuery: `ALTER TABLE \`${tableName}\` ADD COLUMN \`cantidad_acompanantes\` INTEGER DEFAULT 0;` },
            { name: 'necesidad_peticion', query: `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "necesidad_peticion" TEXT;`, sqliteQuery: `ALTER TABLE \`${tableName}\` ADD COLUMN \`necesidad_peticion\` TEXT;` }
        ];

        const isPostgres = sequelize.getDialect() === 'postgres';

        for (const col of columnsToAdd) {
            try {
                if (isPostgres) {
                    await sequelize.query(col.query);
                } else {
                    // SQLite / MySQL
                    await sequelize.query(col.sqliteQuery);
                }
                console.log(`Columna ${col.name} agregada exitosamente.`);
            } catch (err) {
                if (err.message.includes('duplicate column') || err.message.includes('already exists')) {
                    console.log(`Columna ${col.name} ya existía.`);
                } else {
                    console.log(`Aviso en columna ${col.name}: ${err.message}`);
                }
            }
        }

        console.log('--- MIGRACIÓN CALL CENTER EVENTOS COMPLETADA EXITOSAMENTE ---');
    } catch (error) {
        console.error('Error durante la migración:', error);
    }
}

if (require.main === module) {
    migrateCallCenterEventColumns().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}

module.exports = migrateCallCenterEventColumns;
