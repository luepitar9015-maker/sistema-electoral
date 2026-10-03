const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

function jsonColumn(columnName) {
    return {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const raw = this.getDataValue(columnName);
            if (!raw) return null;
            try {
                return JSON.parse(raw);
            } catch (e) {
                return raw;
            }
        },
        set(value) {
            if (value === null || value === undefined) {
                this.setDataValue(columnName, null);
            } else if (typeof value === 'string') {
                this.setDataValue(columnName, value);
            } else {
                this.setDataValue(columnName, JSON.stringify(value));
            }
        }
    };
}

const SocialContentAnalysis = sequelize.define('SocialContentAnalysis', {
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
        allowNull: true // Permite análisis previo a la publicación
    },
    analysis_type: {
        type: DataTypes.ENUM('video', 'imagen', 'texto', 'comparativo'),
        defaultValue: 'texto'
    },
    provider: {
        type: DataTypes.STRING,
        defaultValue: 'mock' // 'gemini', 'mock', etc.
    },
    model: {
        type: DataTypes.STRING,
        allowNull: true
    },
    model_version: {
        type: DataTypes.STRING,
        allowNull: true
    },
    input_hash: {
        type: DataTypes.STRING,
        allowNull: true
    },
    summary: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    topics_json: jsonColumn('topics_json'),
    // OBSERVACIONES: Hechos objetivos verificables (ej. cortes, duración, texto en pantalla)
    observations_json: jsonColumn('observations_json'),
    // MÉTRICAS CALCULADAS: Tasas calculadas por código backend (no inventadas por IA)
    calculated_metrics_json: jsonColumn('calculated_metrics_json'),
    // HIPÓTESIS: Sugerencias e interpretaciones de la IA rotuladas explícitamente como tales
    hypotheses_json: jsonColumn('hypotheses_json'),
    // Desglose por intervalos de tiempo (00:00 - 00:03, etc.)
    audiovisual_timeline_json: jsonColumn('audiovisual_timeline_json'),
    // Afirmaciones o datos que requieren verificación humana
    claims_to_verify_json: jsonColumn('claims_to_verify_json'),
    // Recomendaciones editoriales y técnicas
    recommendations_json: jsonColumn('recommendations_json'),
    audience_retention_score: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    hook_retention_score: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    fatigue_score: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    is_simulation: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    review_status: {
        type: DataTypes.ENUM('pendiente', 'aprobado', 'descartado', 'generado'),
        defaultValue: 'pendiente'
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    reviewed_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'SocialContentAnalyses',
    timestamps: true,
    indexes: [
        { fields: ['campana_id'] },
        { fields: ['post_id'] },
        { fields: ['analysis_type'] }
    ]
});

module.exports = SocialContentAnalysis;
