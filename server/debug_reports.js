const sequelize = require('./database/db');
const Voter = require('./models/Voter');

async function debugQueries() {
    try {
        await sequelize.authenticate();
        console.log('DB Conectada.');

        console.log('--- Probando Count Total ---');
        const total = await Voter.count();
        console.log('Total Votantes en BD:', total);

        console.log('--- Probando Group By Departamento ---');
        const stats = await Voter.findAll({
            attributes: [
                'departamento',
                'municipio',
                [sequelize.fn('COUNT', sequelize.col('cedula')), 'total']
            ],
            group: ['departamento', 'municipio'],
            order: [['departamento', 'ASC'], ['municipio', 'ASC']],
            raw: true
        });

        console.log('Resultados GeoStats (primeros 1):', JSON.stringify(stats[0], null, 2));
        console.log('Tipo de total:', typeof stats[0].total);
        console.log('Total filas GeoStats:', stats.length);

        console.log('--- Probando Leader Stats ---');
        const leaders = await Voter.findAll({
            attributes: [
                'lider_nombre',
                'lider_cedula',
                'departamento',
                'municipio',
                [sequelize.fn('COUNT', sequelize.col('id')), 'total_votos']
            ],
            where: {
                isLeader: false
            },
            group: ['lider_cedula', 'lider_nombre'],
            order: [[sequelize.col('total_votos'), 'DESC']],
            limit: 5
        });
        console.log('Resultados LeaderStats (primeros 5):', JSON.stringify(leaders, null, 2));

    } catch (error) {
        console.error('Error en Query:', error);
    } finally {
        process.exit();
    }
}

debugQueries();
