const sequelize = require('./database/db');

async function migrate() {
    try {
        const qi = sequelize.getQueryInterface();
        const campTable = await qi.describeTable('Campaigns');
        console.log('Campaign columns count:', Object.keys(campTable).length);

        if (!campTable.fecha_inicio) {
            await sequelize.query('ALTER TABLE Campaigns ADD COLUMN fecha_inicio TEXT;');
            console.log('Added fecha_inicio to Campaigns');
        } else {
            console.log('fecha_inicio already exists');
        }

        if (!campTable.fecha_elecciones) {
            await sequelize.query('ALTER TABLE Campaigns ADD COLUMN fecha_elecciones TEXT;');
            console.log('Added fecha_elecciones to Campaigns');
        } else {
            console.log('fecha_elecciones already exists');
        }

        // Set realistic campaign dates for existing campaigns
        // In Colombia, regional/legislative elections typically have a 3-month official campaign period
        await sequelize.query(`
            UPDATE Campaigns 
            SET fecha_inicio = COALESCE(fecha_inicio, '2026-07-01'),
                fecha_elecciones = COALESCE(fecha_elecciones, '2026-10-25 08:00')
            WHERE fecha_inicio IS NULL OR fecha_elecciones IS NULL;
        `);
        console.log('Updated existing campaigns with default dates');

        console.log('MIGRATION COMPLETED SUCCESSFULLY!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
