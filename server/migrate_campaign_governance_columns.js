const sequelize = require('./database/db');

async function migrate() {
    try {
        const qi = sequelize.getQueryInterface();
        const campTable = await qi.describeTable('Campaigns');

        const isPostgres = sequelize.getDialect() === 'postgres';
        const tableName = isPostgres ? '"Campaigns"' : 'Campaigns';

        const columnsToAdd = [
            { name: 'modo_operacion', type: "VARCHAR(50) DEFAULT 'electoral'" },
            { name: 'parent_campaign_id', type: "INTEGER" },
            { name: 'periodo_gobierno', type: "VARCHAR(50) DEFAULT '2024-2027'" },
            { name: 'meta_comunas_json', type: "TEXT" }
        ];

        for (const col of columnsToAdd) {
            if (!campTable[col.name]) {
                await sequelize.query(`ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${col.type};`);
                console.log(`Added column ${col.name} to Campaigns`);
            } else {
                console.log(`Column ${col.name} already exists in Campaigns`);
            }
        }

        console.log('MIGRATION CAMPAIGN GOVERNANCE COMPLETED SUCCESSFULLY!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
