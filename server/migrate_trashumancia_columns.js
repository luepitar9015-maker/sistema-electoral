const sequelize = require('./database/db');

async function migrate() {
    try {
        const qi = sequelize.getQueryInterface();
        const voterTable = await qi.describeTable('Voters');

        const columnsToAdd = [
            { name: 'estado_trashumancia', type: "VARCHAR(255) DEFAULT 'pendiente'" },
            { name: 'detalle_trashumancia', type: "TEXT" },
            { name: 'municipio_censo_real', type: "VARCHAR(255)" },
            { name: 'departamento_censo_real', type: "VARCHAR(255)" },
            { name: 'puesto_censo_real', type: "VARCHAR(255)" },
            { name: 'mesa_censo_real', type: "VARCHAR(255)" }
        ];

        const tableName = sequelize.getDialect() === 'postgres' ? '"Voters"' : 'Voters';

        for (const col of columnsToAdd) {
            if (!voterTable[col.name]) {
                await sequelize.query(`ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${col.type};`);
                console.log(`Added column ${col.name} to Voters`);
            } else {
                console.log(`Column ${col.name} already exists in Voters`);
            }
        }

        console.log('MIGRATION TRASHUMANCIA COMPLETED SUCCESSFULLY!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
