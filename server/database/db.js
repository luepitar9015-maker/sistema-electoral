const { Sequelize } = require('sequelize');
const path = require('path');

// En Fly.io usa el volumen persistente /data, localmente usa la carpeta database/
const dbPath = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
});

module.exports = sequelize;
