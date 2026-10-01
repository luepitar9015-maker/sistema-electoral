const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const SocialTeamAccount = sequelize.define('SocialTeamAccount', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    campana_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    nombre_miembro: {
        type: DataTypes.STRING,
        allowNull: false
    },
    rol_equipo: {
        type: DataTypes.STRING, // 'Candidato Oficial', 'Orador', 'Líder Avanzada', 'Activista Digital', 'Influencer Aliado'
        defaultValue: 'Activista Digital'
    },
    plataforma: {
        type: DataTypes.ENUM('facebook', 'instagram', 'tiktok', 'twitter', 'youtube'),
        allowNull: false
    },
    usuario_handle: {
        type: DataTypes.STRING, // e.g. '@carlos_avanzada'
        allowNull: false
    },
    url_perfil: {
        type: DataTypes.STRING,
        allowNull: true
    },
    seguidores: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    publicaciones_mes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // Seguimiento de participación en la campaña
    nivel_participacion: {
        type: DataTypes.STRING, // 'Muy Activo', 'Activo', 'Baja Participación', 'Inactivo'
        defaultValue: 'Activo'
    },
    repost_campana_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0 // Cantidad de veces que ha compartido la campaña
    },
    ultimo_apoyo_fecha: {
        type: DataTypes.STRING,
        allowNull: true
    },
    verificado: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    observaciones: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'SocialTeamAccounts',
    timestamps: true
});

module.exports = SocialTeamAccount;
