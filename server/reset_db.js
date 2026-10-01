/**
 * reset_db.js
 * Limpia toda la base de datos y crea solo el usuario admin.
 * Uso: node reset_db.js
 */

const sequelize = require('./database/db');
const User = require('./models/User');
const Voter = require('./models/Voter');
const bcrypt = require('bcrypt');

async function resetDatabase() {
    try {
        console.log('🔄 Conectando a la base de datos...');
        await sequelize.authenticate();

        console.log('🗑️  Eliminando todos los votantes...');
        await Voter.destroy({ where: {}, truncate: true });

        console.log('🗑️  Eliminando todos los usuarios...');
        await User.destroy({ where: {}, truncate: true });

        console.log('✅ Base de datos limpia.');

        // Recrear usuario admin
        console.log('👤 Creando usuario administrador...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({
            email: 'admin@sistema.com',
            password: hashedPassword,
            role: 'admin'
        });

        console.log('');
        console.log('🎉 ¡Listo! Base de datos reiniciada.');
        console.log('   Email:    admin@sistema.com');
        console.log('   Password: admin123');
        console.log('');
        console.log('   Ahora puedes reiniciar el servidor con: node index.js');

    } catch (error) {
        console.error('❌ Error al reiniciar la base de datos:', error.message);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

resetDatabase();
