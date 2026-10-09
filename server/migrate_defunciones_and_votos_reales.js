const sequelize = require('./database/db');
const CensoDefuncion = require('./models/CensoDefuncion');

async function migrate() {
    try {
        console.log('--- Iniciando migración de Difuntos y Votos Reales ---');
        
        // 1. Crear tabla CensoDefuncion si no existe
        await CensoDefuncion.sync({ alter: true });
        console.log('✅ Tabla CensoDefuncion sincronizada correctamente.');

        // 2. Agregar columnas a Voters si no existen
        const qi = sequelize.getQueryInterface();
        const voterTable = await qi.describeTable('Voters');

        const columnsToAdd = [
            { name: 'es_fallecido', type: "BOOLEAN DEFAULT FALSE" },
            { name: 'fecha_defuncion', type: "VARCHAR(255)" },
            { name: 'es_voto_real', type: "BOOLEAN DEFAULT TRUE" },
            { name: 'motivo_invalidez', type: "TEXT" },
            { name: 'es_duplicado', type: "BOOLEAN DEFAULT FALSE" },
            { name: 'lideres_duplicados', type: "TEXT" }
        ];

        const tableName = sequelize.getDialect() === 'postgres' ? '"Voters"' : 'Voters';

        for (const col of columnsToAdd) {
            if (!voterTable[col.name]) {
                await sequelize.query(`ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${col.type};`);
                console.log(`✅ Columna ${col.name} agregada a Voters.`);
            } else {
                console.log(`ℹ️ Columna ${col.name} ya existe en Voters.`);
            }
        }

        // 3. Revisar si CensoElectoral tiene estado_cedula
        const censoTable = await qi.describeTable('CensoElectoral');
        const censoTableName = sequelize.getDialect() === 'postgres' ? '"CensoElectoral"' : 'CensoElectoral';
        
        if (!censoTable['estado_cedula']) {
            await sequelize.query(`ALTER TABLE ${censoTableName} ADD COLUMN estado_cedula VARCHAR(50) DEFAULT 'activa';`);
            console.log(`✅ Columna estado_cedula agregada a CensoElectoral.`);
        }

        console.log('🎉 Migración completada con éxito.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error en migración:', err);
        process.exit(1);
    }
}

migrate();
