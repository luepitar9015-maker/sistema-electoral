const Apoyo = require('../models/Apoyo');
const Voter = require('../models/Voter');
const Campaign = require('../models/Campaign');
const { Op } = require('sequelize');
const sequelize = require('../database/db');

// ─── OBTENER APOYOS DE UNA CAMPAÑA ─────────────────────────────────────────
exports.getApoyos = async (req, res) => {
    try {
        const campana_id = req.params.campanaId || req.query.campana_id;
        const whereClause = campana_id ? { campana_id } : {};

        const apoyos = await Apoyo.findAll({
            where: whereClause,
            include: [{ model: Campaign, attributes: ['id', 'nombre', 'candidato', 'tipo_cargo', 'color'] }],
            order: [['compromiso_votos', 'DESC'], ['createdAt', 'DESC']]
        });

        // Contar votantes vinculados a cada apoyo
        const voterCounts = await Voter.findAll({
            attributes: [
                'apoyo_id',
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalVoters']
            ],
            where: {
                apoyo_id: { [Op.ne]: null }
            },
            group: ['apoyo_id'],
            raw: true
        });

        const countMap = {};
        voterCounts.forEach(c => {
            if (c.apoyo_id) {
                countMap[c.apoyo_id] = parseInt(c.totalVoters || 0, 10);
            }
        });

        const results = apoyos.map(a => {
            const vCount = countMap[a.id] || 0;
            const compromiso = a.compromiso_votos || 0;
            const progress = compromiso > 0 ? Math.min(100, Math.round((vCount / compromiso) * 100)) : 0;
            return {
                ...a.toJSON(),
                totalVoters: vCount,
                progressPercent: progress
            };
        });

        res.json(results);
    } catch (error) {
        console.error('Error al obtener apoyos:', error);
        res.status(500).json({ message: 'Error al obtener apoyos', error: error.message });
    }
};

// ─── CREAR NUEVO APOYO ─────────────────────────────────────────────────────
exports.createApoyo = async (req, res) => {
    try {
        const {
            campana_id,
            nombre,
            tipo_apoyo,
            cargo_o_rol,
            partido_politico,
            telefono,
            email,
            departamento,
            municipio,
            compromiso_votos,
            foto,
            observaciones
        } = req.body;

        if (!campana_id || !nombre) {
            return res.status(400).json({ message: 'La campaña y el nombre del apoyo son obligatorios.' });
        }

        const campaign = await Campaign.findByPk(campana_id);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaña no encontrada.' });
        }

        const newApoyo = await Apoyo.create({
            campana_id,
            nombre,
            tipo_apoyo: tipo_apoyo || 'candidato_aliado',
            cargo_o_rol: cargo_o_rol || '',
            partido_politico: partido_politico || '',
            telefono: telefono || '',
            email: email || '',
            departamento: departamento || campaign.departamento,
            municipio: municipio || (campaign.nivel_territorial === 'municipal' ? campaign.municipio : ''),
            compromiso_votos: parseInt(compromiso_votos || 0, 10),
            foto: foto || '',
            observaciones: observaciones || ''
        });

        res.status(201).json({
            message: 'Apoyo político registrado exitosamente',
            apoyo: newApoyo
        });
    } catch (error) {
        console.error('Error al registrar apoyo:', error);
        res.status(500).json({ message: 'Error al registrar apoyo', error: error.message });
    }
};

// ─── ACTUALIZAR APOYO ──────────────────────────────────────────────────────
exports.updateApoyo = async (req, res) => {
    try {
        const apoyo = await Apoyo.findByPk(req.params.id);
        if (!apoyo) {
            return res.status(404).json({ message: 'Apoyo no encontrado.' });
        }

        const {
            nombre,
            tipo_apoyo,
            cargo_o_rol,
            partido_politico,
            telefono,
            email,
            departamento,
            municipio,
            compromiso_votos,
            foto,
            observaciones
        } = req.body;

        await apoyo.update({
            nombre:            nombre ?? apoyo.nombre,
            tipo_apoyo:        tipo_apoyo ?? apoyo.tipo_apoyo,
            cargo_o_rol:       cargo_o_rol ?? apoyo.cargo_o_rol,
            partido_politico:  partido_politico ?? apoyo.partido_politico,
            telefono:          telefono ?? apoyo.telefono,
            email:             email ?? apoyo.email,
            departamento:      departamento ?? apoyo.departamento,
            municipio:         municipio ?? apoyo.municipio,
            compromiso_votos:  compromiso_votos !== undefined ? parseInt(compromiso_votos, 10) : apoyo.compromiso_votos,
            foto:              foto !== undefined ? foto : apoyo.foto,
            observaciones:     observaciones ?? apoyo.observaciones
        });

        res.json({ message: 'Apoyo actualizado exitosamente', apoyo });
    } catch (error) {
        console.error('Error al actualizar apoyo:', error);
        res.status(500).json({ message: 'Error al actualizar apoyo', error: error.message });
    }
};

// ─── ELIMINAR APOYO ────────────────────────────────────────────────────────
exports.deleteApoyo = async (req, res) => {
    try {
        const apoyo = await Apoyo.findByPk(req.params.id);
        if (!apoyo) {
            return res.status(404).json({ message: 'Apoyo no encontrado.' });
        }

        // Desvincular votantes de este apoyo
        await Voter.update({ apoyo_id: null }, { where: { apoyo_id: apoyo.id } });
        await apoyo.destroy();

        res.json({ message: 'Apoyo eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar apoyo:', error);
        res.status(500).json({ message: 'Error al eliminar apoyo', error: error.message });
    }
};
