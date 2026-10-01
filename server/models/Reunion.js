const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const Reunion = sequelize.define('Reunion', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    campana_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    titulo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fecha: {
        type: DataTypes.STRING, // Formato YYYY-MM-DD
        allowNull: false
    },
    hora_inicio: {
        type: DataTypes.STRING, // Formato HH:mm
        allowNull: false
    },
    hora_fin: {
        type: DataTypes.STRING, // Formato HH:mm
        allowNull: true
    },
    hora_inicio_real: {
        type: DataTypes.STRING,
        allowNull: true
    },
    hora_fin_real: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Quién preside: 'candidato' o 'orador' o 'mixto'
    presidida_por: {
        type: DataTypes.STRING,
        defaultValue: 'candidato'
    },
    // Usuario orador asignado (si aplica)
    orador_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    orador_nombre: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Usuario líder de avanzada y grupo
    lider_avanzada_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    lider_avanzada_nombre: {
        type: DataTypes.STRING,
        allowNull: true
    },
    grupo_avanzada: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Logística y aforo
    aforo_estimado: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    asistentes_reales: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    departamento: {
        type: DataTypes.STRING,
        allowNull: true
    },
    municipio: {
        type: DataTypes.STRING,
        allowNull: true
    },
    direccion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    barrio_vereda: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lugar_nombre: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Estados: 'programada', 'en_curso', 'finalizada', 'cancelada'
    estado: {
        type: DataTypes.STRING,
        defaultValue: 'programada'
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Evidencias fotográficas [{ id, url, nombre, fecha, subido_por }]
    evidencias: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '[]'
    },
    creado_por: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'Reuniones',
    timestamps: true
});

module.exports = Reunion;
