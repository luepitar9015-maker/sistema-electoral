const sequelize = require('./database/db');
const SocialCompetitor = require('./models/SocialCompetitor');
const SocialCompetitorAttack = require('./models/SocialCompetitorAttack');

async function migrate() {
    try {
        console.log('Conectando a base de datos...');
        await sequelize.authenticate();
        console.log('Sincronizando modelo SocialCompetitor...');
        await SocialCompetitor.sync({ alter: true });
        console.log('Sincronizando modelo SocialCompetitorAttack...');
        await SocialCompetitorAttack.sync({ alter: true });
        console.log('✅ Migración de SocialCompetitorAttack completada con éxito.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error en migración:', err);
        process.exit(1);
    }
}

migrate();
