const sequelize = require('./database/db');

async function migrateCampaignBrandingColumns() {
    console.log('--- VERIFICANDO COLUMNAS DE BRANDING Y PERSONALIZACIÓN DE CAMPAÑA ---');
    try {
        const tableName = 'Campaigns';
        const columns = [
            { name: 'color', query: `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "color" VARCHAR(255) DEFAULT '#00B894';`, sqlite: `ALTER TABLE \`${tableName}\` ADD COLUMN \`color\` VARCHAR(255) DEFAULT '#00B894';` },
            { name: 'eslogan', query: `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "eslogan" VARCHAR(255);`, sqlite: `ALTER TABLE \`${tableName}\` ADD COLUMN \`eslogan\` VARCHAR(255);` },
            { name: 'partido_politico', query: `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "partido_politico" VARCHAR(255);`, sqlite: `ALTER TABLE \`${tableName}\` ADD COLUMN \`partido_politico\` VARCHAR(255);` },
            { name: 'foto_candidato', query: `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "foto_candidato" TEXT;`, sqlite: `ALTER TABLE \`${tableName}\` ADD COLUMN \`foto_candidato\` TEXT;` },
            { name: 'logo_campana', query: `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "logo_campana" TEXT;`, sqlite: `ALTER TABLE \`${tableName}\` ADD COLUMN \`logo_campana\` TEXT;` }
        ];

        const isPostgres = sequelize.getDialect() === 'postgres';

        for (const col of columns) {
            try {
                if (isPostgres) {
                    await sequelize.query(col.query);
                } else {
                    await sequelize.query(col.sqlite);
                }
                console.log(`Columna ${col.name} verificada/agregada.`);
            } catch (e) {
                if (e.message.includes('already exists') || e.message.includes('duplicate column')) {
                    console.log(`Columna ${col.name} ya existe.`);
                } else {
                    console.log(`Aviso en columna ${col.name}:`, e.message);
                }
            }
        }
        console.log('--- COLUMNAS DE BRANDING LISTAS ---');
    } catch (err) {
        console.error('Error en migración:', err);
    }
}

if (require.main === module) {
    migrateCampaignBrandingColumns().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}

module.exports = migrateCampaignBrandingColumns;
