const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const SocialTeamInteraction = sequelize.define('SocialTeamInteraction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    campana_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    post_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    team_account_id: {
        type: DataTypes.INTEGER,
        allowNull: true
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
        type: DataTypes.STRING,
        allowNull: false
    },
    usuario_handle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    plataforma: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // Reacción: 'like', 'me_encanta', 'apoyo', 'ninguna'
    tipo_reaccion: {
        type: DataTypes.STRING,
        defaultValue: 'like'
    },
    // Comentarios
    comento: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    texto_comentario: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Compartido / Repost
    compartio: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    url_compartido: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fecha_interaccion: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'SocialTeamInteractions',
    timestamps: true
});

module.exports = SocialTeamInteraction;
