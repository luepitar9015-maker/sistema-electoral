const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

let sequelize;

if (process.env.DB_DIALECT === 'postgres' || process.env.DATABASE_URL) {
    if (process.env.DATABASE_URL) {
        sequelize = new Sequelize(process.env.DATABASE_URL, {
            dialect: 'postgres',
            logging: false,
            dialectOptions: process.env.DB_SSL === 'true' ? {
                ssl: { require: true, rejectUnauthorized: false }
            } : {}
        });
    } else {
        sequelize = new Sequelize(
            process.env.DB_NAME || 'sistema_electoral_db',
            process.env.DB_USER || 'electoral_user',
            process.env.DB_PASS || 'ElecContabo2026!#',
            {
                host: process.env.DB_HOST || '127.0.0.1',
                port: parseInt(process.env.DB_PORT || '5432', 10),
                dialect: 'postgres',
                logging: false,
                pool: {
                    max: 10,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                }
            }
        );
    }
} else {
    // Modo local / desarrollo con SQLite
    const dbPath = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: dbPath,
        logging: false
    });
}

module.exports = sequelize;
