const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const Campaign = sequelize.define('Campaign', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tipo_cargo: {
        type: DataTypes.ENUM(
            'senado',
            'camara',
            'gobernacion',
            'asamblea',
            'alcaldia',
            'concejo',
            'presidencia'
        ),
        allowNull: false
    },
    nivel_territorial: {
        type: DataTypes.ENUM('nacional', 'departamental', 'municipal'),
        allowNull: false
    },
    departamento: {
        type: DataTypes.STRING,
        allowNull: true
    },
    municipio: {
        type: DataTypes.STRING,
        allowNull: true
    },
    candidato: {
        type: DataTypes.STRING,
        allowNull: false
    },
    partido_politico: {
        type: DataTypes.STRING,
        allowNull: true
    },
    numero_tarjeton: {
        type: DataTypes.STRING,
        allowNull: true
    },
    meta_votos: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    color: {
        type: DataTypes.STRING,
        defaultValue: '#00B894'
    },
    eslogan: {
        type: DataTypes.STRING,
        allowNull: true
    },
    foto_candidato: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    logo_campana: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    activa: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Links oficiales de redes sociales del candidato / campaña
    link_instagram: {
        type: DataTypes.STRING,
        allowNull: true
    },
    link_tiktok: {
        type: DataTypes.STRING,
        allowNull: true
    },
    link_facebook: {
        type: DataTypes.STRING,
        allowNull: true
    },
    link_twitter: {
        type: DataTypes.STRING,
        allowNull: true
    },
    link_youtube: {
        type: DataTypes.STRING,
        allowNull: true
    },
    link_whatsapp: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'Campaigns',
    timestamps: true
});

module.exports = Campaign;
