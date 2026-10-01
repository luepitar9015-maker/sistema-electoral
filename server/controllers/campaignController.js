const Campaign = require('../models/Campaign');
const Voter = require('../models/Voter');
const Apoyo = require('../models/Apoyo');
const sequelize = require('../database/db');
const { Op } = require('sequelize');

// Determina el nivel territorial según la legislación electoral de Colombia
const determineNivelTerritorial = (tipo_cargo) => {
    switch (tipo_cargo) {
        case 'senado':
        case 'presidencia':
            return 'nacional';
        case 'camara':
        case 'gobernacion':
        case 'asamblea':
            return 'departamental';
        case 'alcaldia':
        case 'concejo':
        default:
            return 'municipal';
    }
};

// ─── LISTAR TODAS LAS CAMPAÑAS CON MÉTRICAS ────────────────────────────────
exports.getCampaigns = async (req, res) => {
    try {
        const campaigns = await Campaign.findAll({
            order: [['activa', 'DESC'], ['createdAt', 'DESC']]
        });

        // Obtener conteo de votantes y líderes por campaña
        const voterCounts = await Voter.findAll({
            attributes: [
                'campana_id',
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalVoters'],
                [sequelize.literal("SUM(CASE WHEN isLeader = 1 THEN 1 ELSE 0 END)"), 'totalLeaders'],
                [sequelize.literal("SUM(CASE WHEN lugar_votacion IS NOT NULL AND lugar_votacion != '' THEN 1 ELSE 0 END)"), 'withPuesto']
            ],
            group: ['campana_id'],
            raw: true
        });

        // Obtener conteo de apoyos por campaña
        const apoyoCounts = await Apoyo.findAll({
            attributes: [
                'campana_id',
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalApoyos']
            ],
            group: ['campana_id'],
            raw: true
        });

        const countMap = {};
        voterCounts.forEach(c => {
            if (c.campana_id) {
                countMap[c.campana_id] = {
                    totalVoters: parseInt(c.totalVoters || 0, 10),
                    totalLeaders: parseInt(c.totalLeaders || 0, 10),
                    withPuesto: parseInt(c.withPuesto || 0, 10),
                    totalApoyos: 0
                };
            }
        });

        apoyoCounts.forEach(a => {
            if (a.campana_id) {
                if (!countMap[a.campana_id]) {
                    countMap[a.campana_id] = { totalVoters: 0, totalLeaders: 0, withPuesto: 0, totalApoyos: 0 };
                }
                countMap[a.campana_id].totalApoyos = parseInt(a.totalApoyos || 0, 10);
            }
        });

        const results = campaigns.map(camp => {
            const counts = countMap[camp.id] || { totalVoters: 0, totalLeaders: 0, withPuesto: 0, totalApoyos: 0 };
            const meta = camp.meta_votos || 0;
            const progress = meta > 0 ? Math.min(100, Math.round((counts.totalVoters / meta) * 100)) : 0;
            return {
                ...camp.toJSON(),
                totalVoters: counts.totalVoters,
                totalLeaders: counts.totalLeaders,
                withPuesto: counts.withPuesto,
                totalApoyos: counts.totalApoyos,
                progressPercent: progress
            };
        });

        res.json(results);
    } catch (error) {
        console.error('Error al obtener campañas:', error);
        res.status(500).json({ message: 'Error al obtener campañas', error: error.message });
    }
};

// ─── OBTENER DETALLE DE UNA CAMPAÑA ────────────────────────────────────────
exports.getCampaignById = async (req, res) => {
    try {
        const campaign = await Campaign.findByPk(req.params.id);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaña no encontrada' });
        }

        const totalVoters = await Voter.count({ where: { campana_id: campaign.id } });
        const totalLeaders = await Voter.count({ where: { campana_id: campaign.id, isLeader: true } });
        const withPuesto = await Voter.count({
            where: {
                campana_id: campaign.id,
                lugar_votacion: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] }
            }
        });

        const meta = campaign.meta_votos || 0;
        const progressPercent = meta > 0 ? Math.min(100, Math.round((totalVoters / meta) * 100)) : 0;

        res.json({
            ...campaign.toJSON(),
            totalVoters,
            totalLeaders,
            withPuesto,
            progressPercent
        });
    } catch (error) {
        console.error('Error al obtener detalle de campaña:', error);
        res.status(500).json({ message: 'Error al obtener campaña', error: error.message });
    }
};

// ─── CREAR NUEVA CAMPAÑA ───────────────────────────────────────────────────
exports.createCampaign = async (req, res) => {
    try {
        const {
            nombre,
            tipo_cargo,
            departamento,
            municipio,
            candidato,
            partido_politico,
            numero_tarjeton,
            meta_votos,
            color,
            descripcion
        } = req.body;

        if (!nombre || !tipo_cargo || !candidato) {
            return res.status(400).json({ message: 'Nombre de campaña, tipo de cargo y candidato son requeridos' });
        }

        const nivel_territorial = determineNivelTerritorial(tipo_cargo);

        // Validaciones estrictas por ámbito territorial de Colombia
        let finalDepto = departamento || null;
        let finalMuni = municipio || null;

        if (nivel_territorial === 'nacional') {
            // En Senado / Presidencia el ámbito es todo el país
            finalDepto = 'COLOMBIA (NACIONAL)';
            finalMuni = 'TODOS LOS MUNICIPIOS';
        } else if (nivel_territorial === 'departamental') {
            // En Cámara, Gobernación, Asamblea se exige departamento
            if (!departamento || departamento === 'COLOMBIA (NACIONAL)') {
                return res.status(400).json({
                    message: `Para cargos departamentales (${tipo_cargo.toUpperCase()}) debes seleccionar el departamento correspondiente.`
                });
            }
            finalDepto = departamento;
            finalMuni = 'DEPARTAMENTO COMPLETO';
        } else if (nivel_territorial === 'municipal') {
            // En Alcaldía y Concejo se exige departamento y municipio
            if (!departamento || !municipio || municipio.includes('TODOS') || municipio.includes('COMPLETO')) {
                return res.status(400).json({
                    message: `Para cargos municipales (${tipo_cargo.toUpperCase()}) debes seleccionar el departamento y municipio específico.`
                });
            }
            finalDepto = departamento;
            finalMuni = municipio;
        }

        const newCampaign = await Campaign.create({
            nombre,
            tipo_cargo,
            nivel_territorial,
            departamento: finalDepto,
            municipio: finalMuni,
            candidato,
            partido_politico: partido_politico || '',
            numero_tarjeton: numero_tarjeton || '',
            meta_votos: parseInt(meta_votos || 0, 10),
            color: color || '#00B894',
            descripcion: descripcion || '',
            link_instagram: req.body.link_instagram || '',
            link_tiktok: req.body.link_tiktok || '',
            link_facebook: req.body.link_facebook || '',
            link_twitter: req.body.link_twitter || '',
            link_youtube: req.body.link_youtube || '',
            link_whatsapp: req.body.link_whatsapp || '',
            activa: true
        });

        res.status(201).json({
            message: 'Campaña creada exitosamente',
            campaign: newCampaign
        });
    } catch (error) {
        console.error('Error al crear campaña:', error);
        res.status(500).json({ message: 'Error al crear la campaña', error: error.message });
    }
};

// ─── ACTUALIZAR CAMPAÑA ────────────────────────────────────────────────────
exports.updateCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findByPk(req.params.id);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaña no encontrada' });
        }

        const {
            nombre,
            tipo_cargo,
            departamento,
            municipio,
            candidato,
            partido_politico,
            numero_tarjeton,
            meta_votos,
            color,
            activa,
            descripcion,
            link_instagram,
            link_tiktok,
            link_facebook,
            link_twitter,
            link_youtube,
            link_whatsapp
        } = req.body;

        const finalTipoCargo = tipo_cargo || campaign.tipo_cargo;
        const nivel_territorial = determineNivelTerritorial(finalTipoCargo);

        let finalDepto = departamento !== undefined ? departamento : campaign.departamento;
        let finalMuni = municipio !== undefined ? municipio : campaign.municipio;

        if (nivel_territorial === 'nacional') {
            finalDepto = 'COLOMBIA (NACIONAL)';
            finalMuni = 'TODOS LOS MUNICIPIOS';
        } else if (nivel_territorial === 'departamental') {
            finalMuni = 'DEPARTAMENTO COMPLETO';
        }

        await campaign.update({
            nombre: nombre ?? campaign.nombre,
            tipo_cargo: finalTipoCargo,
            nivel_territorial,
            departamento: finalDepto,
            municipio: finalMuni,
            candidato: candidato ?? campaign.candidato,
            partido_politico: partido_politico ?? campaign.partido_politico,
            numero_tarjeton: numero_tarjeton ?? campaign.numero_tarjeton,
            meta_votos: meta_votos !== undefined ? parseInt(meta_votos, 10) : campaign.meta_votos,
            color: color ?? campaign.color,
            activa: activa !== undefined ? activa : campaign.activa,
            descripcion: descripcion ?? campaign.descripcion,
            link_instagram: link_instagram !== undefined ? link_instagram : campaign.link_instagram,
            link_tiktok: link_tiktok !== undefined ? link_tiktok : campaign.link_tiktok,
            link_facebook: link_facebook !== undefined ? link_facebook : campaign.link_facebook,
            link_twitter: link_twitter !== undefined ? link_twitter : campaign.link_twitter,
            link_youtube: link_youtube !== undefined ? link_youtube : campaign.link_youtube,
            link_whatsapp: link_whatsapp !== undefined ? link_whatsapp : campaign.link_whatsapp
        });

        res.json({ message: 'Campaña actualizada exitosamente', campaign });
    } catch (error) {
        console.error('Error al actualizar campaña:', error);
        res.status(500).json({ message: 'Error al actualizar la campaña', error: error.message });
    }
};

// ─── ELIMINAR CAMPAÑA ──────────────────────────────────────────────────────
exports.deleteCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findByPk(req.params.id);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaña no encontrada' });
        }

        // Desvincular votantes antes de eliminar
        await Voter.update({ campana_id: null }, { where: { campana_id: campaign.id } });
        await campaign.destroy();

        res.json({ message: 'Campaña eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar campaña:', error);
        res.status(500).json({ message: 'Error al eliminar campaña', error: error.message });
    }
};
