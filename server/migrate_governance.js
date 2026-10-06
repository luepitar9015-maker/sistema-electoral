const sequelize = require('./database/db');
const CompromisoGestion = require('./models/CompromisoGestion');

async function migrate() {
    try {
        console.log('Sincronizando CompromisoGestion en el servidor...');
        await CompromisoGestion.sync({ alter: true });
        console.log('✅ Migración de gobernanza exitosa.');
        process.exit(0);
    } catch (e) {
        console.error('❌ Error en migración:', e);
        process.exit(1);
    }
}

migrate();
