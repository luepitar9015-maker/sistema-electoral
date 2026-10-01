const sequelize = require('./database/db');
const User = require('./models/User');
const bcrypt = require('bcrypt');

async function seed() {
    try {
        await sequelize.sync();

        const existingAdmin = await User.findOne({ where: { email: 'admin@sistema.com' } });
        if (existingAdmin) {
            console.log('El usuario admin ya existe.');
            return;
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({
            email: 'admin@sistema.com',
            password: hashedPassword,
            role: 'admin'
        });

        console.log('Usuario administrador creado exitosamente.');
        console.log('Email: admin@sistema.com');
        console.log('Password: admin123');
    } catch (error) {
        console.error('Error al crear usuario inicial:', error);
    } finally {
        await sequelize.close();
    }
}

seed();
