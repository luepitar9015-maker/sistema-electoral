const Campaign = require('../models/Campaign');
const Voter = require('../models/Voter');
const Apoyo = require('../models/Apoyo');
const CompromisoGestion = require('../models/CompromisoGestion');
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

// Cálculo de estadísticas del Reloj de Campaña
const calculateClockStats = (camp, totalVoters) => {
    const inicioStr = camp.fecha_inicio;
    const finStr = camp.fecha_elecciones;
    if (!finStr) return null;

    const now = new Date();
    const electionDate = new Date(finStr);
    const startDate = inicioStr ? new Date(inicioStr) : new Date(camp.createdAt);

    const totalDurationMs = electionDate.getTime() - startDate.getTime();
    const elapsedMs = Math.max(0, now.getTime() - startDate.getTime());
    const remainingMs = electionDate.getTime() - now.getTime();

    const dias_totales = Math.max(1, Math.round(totalDurationMs / (1000 * 60 * 60 * 24)));
    const dias_transcurridos = Math.max(0, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)));
    const dias_restantes = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

    let estado = 'en_curso';
    if (remainingMs < 0) {
        estado = 'finalizada';
    } else if (now < startDate) {
        estado = 'no_iniciada';
    }

    const porcentaje_tiempo = totalDurationMs > 0 
        ? Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100))) 
        : 0;

    const meta = camp.meta_votos || 0;
    const votosFaltantes = Math.max(0, meta - (totalVoters || 0));
    const ritmo_diario_requerido = (dias_restantes > 0 && votosFaltantes > 0)
        ? Math.ceil(votosFaltantes / dias_restantes)
        : 0;

    return {
        fecha_inicio: inicioStr,
        fecha_elecciones: finStr,
        dias_totales,
        dias_transcurridos,
        dias_restantes,
        porcentaje_tiempo,
        ritmo_diario_requerido,
        votos_faltantes: votosFaltantes,
        estado
    };
};

// ─── LISTAR TODAS LAS CAMPAÑAS CON MÉTRICAS ────────────────────────────────
exports.getCampaigns = async (req, res) => {
    try {
        const whereClause = {};
        if (req.user && !['superadmin', 'admin'].includes(req.user.role) && req.user.campana_id) {
            whereClause.id = req.user.campana_id;
        }

        const campaigns = await Campaign.findAll({
            where: whereClause,
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
            const reloj = calculateClockStats(camp, counts.totalVoters);

            return {
                ...camp.toJSON(),
                totalVoters: counts.totalVoters,
                totalLeaders: counts.totalLeaders,
                withPuesto: counts.withPuesto,
                totalApoyos: counts.totalApoyos,
                progressPercent: progress,
                reloj
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
        const campaignId = parseInt(req.params.id, 10);
        if (req.user && !['superadmin', 'admin'].includes(req.user.role) && req.user.campana_id) {
            if (campaignId !== parseInt(req.user.campana_id, 10)) {
                return res.status(403).json({ message: 'Acceso denegado: no tiene permisos para ver esta campaña' });
            }
        }

        const campaign = await Campaign.findByPk(campaignId);
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
        const reloj = calculateClockStats(campaign, totalVoters);

        res.json({
            ...campaign.toJSON(),
            totalVoters,
            totalLeaders,
            withPuesto,
            progressPercent,
            reloj
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
            descripcion,
            eslogan,
            foto_candidato,
            logo_campana,
            fecha_inicio,
            fecha_elecciones
        } = req.body;

        if (!nombre || !tipo_cargo || !candidato) {
            return res.status(400).json({ message: 'Nombre de campaña, tipo de cargo y candidato son requeridos' });
        }

        const nivel_territorial = determineNivelTerritorial(tipo_cargo);

        // Validaciones estrictas por ámbito territorial de Colombia
        let finalDepto = departamento || null;
        let finalMuni = municipio || null;

        if (nivel_territorial === 'nacional') {
            finalDepto = 'COLOMBIA (NACIONAL)';
            finalMuni = 'TODOS LOS MUNICIPIOS';
        } else if (nivel_territorial === 'departamental') {
            if (!departamento || departamento === 'COLOMBIA (NACIONAL)') {
                return res.status(400).json({
                    message: `Para cargos departamentales (${tipo_cargo.toUpperCase()}) debes seleccionar el departamento correspondiente.`
                });
            }
            finalDepto = departamento;
            finalMuni = 'DEPARTAMENTO COMPLETO';
        } else if (nivel_territorial === 'municipal') {
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
            eslogan: eslogan || '',
            foto_candidato: foto_candidato || '',
            logo_campana: logo_campana || '',
            fecha_inicio: fecha_inicio || null,
            fecha_elecciones: fecha_elecciones || null,
            link_instagram: req.body.link_instagram || '',
            link_tiktok: req.body.link_tiktok || '',
            link_facebook: req.body.link_facebook || '',
            link_twitter: req.body.link_twitter || '',
            link_youtube: req.body.link_youtube || '',
            link_whatsapp: req.body.link_whatsapp || '',
            modo_operacion: req.body.modo_operacion || 'electoral',
            periodo_gobierno: req.body.periodo_gobierno || '2024-2027',
            parent_campaign_id: req.body.parent_campaign_id ? parseInt(req.body.parent_campaign_id, 10) : null,
            meta_comunas_json: req.body.meta_comunas_json || null,
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
            eslogan,
            foto_candidato,
            logo_campana,
            fecha_inicio,
            fecha_elecciones,
            link_instagram,
            link_tiktok,
            link_facebook,
            link_twitter,
            link_youtube,
            link_whatsapp,
            modo_operacion,
            periodo_gobierno,
            parent_campaign_id,
            meta_comunas_json
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
            eslogan: eslogan !== undefined ? eslogan : campaign.eslogan,
            foto_candidato: foto_candidato !== undefined ? foto_candidato : campaign.foto_candidato,
            logo_campana: logo_campana !== undefined ? logo_campana : campaign.logo_campana,
            fecha_inicio: fecha_inicio !== undefined ? fecha_inicio : campaign.fecha_inicio,
            fecha_elecciones: fecha_elecciones !== undefined ? fecha_elecciones : campaign.fecha_elecciones,
            link_instagram: link_instagram !== undefined ? link_instagram : campaign.link_instagram,
            link_tiktok: link_tiktok !== undefined ? link_tiktok : campaign.link_tiktok,
            link_facebook: link_facebook !== undefined ? link_facebook : campaign.link_facebook,
            link_twitter: link_twitter !== undefined ? link_twitter : campaign.link_twitter,
            link_youtube: link_youtube !== undefined ? link_youtube : campaign.link_youtube,
            link_whatsapp: link_whatsapp !== undefined ? link_whatsapp : campaign.link_whatsapp,
            modo_operacion: modo_operacion !== undefined ? modo_operacion : campaign.modo_operacion,
            periodo_gobierno: periodo_gobierno !== undefined ? periodo_gobierno : campaign.periodo_gobierno,
            parent_campaign_id: parent_campaign_id !== undefined ? (parent_campaign_id ? parseInt(parent_campaign_id, 10) : null) : campaign.parent_campaign_id,
            meta_comunas_json: meta_comunas_json !== undefined ? meta_comunas_json : campaign.meta_comunas_json
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

// ─── TERMÓMETRO DE VICTORIA Y DÉFICIT TERRITORIAL POR BARRIOS / COMUNAS ───
exports.getTermometroVictoria = async (req, res) => {
    try {
        const campaign = await Campaign.findByPk(req.params.id);
        if (!campaign) return res.status(404).json({ message: 'Campaña no encontrada' });

        const voters = await Voter.findAll({
            where: { campana_id: campaign.id },
            attributes: ['id', 'municipio', 'departamento', 'direccion', 'lugar_votacion', 'mesa']
        });

        const metaGlobal = campaign.meta_votos || 10000;
        const totalVotantes = voters.length;
        const votantesValidos = voters.length; // todos los registrados
        const conPuesto = voters.filter(v => v.lugar_votacion && v.lugar_votacion.trim().length > 0).length;
        const votosSeguros = voters.filter(v => v.lugar_votacion && v.lugar_votacion.trim().length > 0).length;
        const votosFaltantes = Math.max(0, metaGlobal - totalVotantes);
        const porcentajeVictoria = metaGlobal > 0 ? Math.min(100, Math.round((totalVotantes / metaGlobal) * 100)) : 0;

        // Desglose territorial (por municipio o por puesto/barrio)
        const zonasMap = {};
        voters.forEach(v => {
            const zonaKey = campaign.nivel_territorial === 'municipal'
                ? (v.lugar_votacion || 'Zona Sin Puesto Asignado')
                : (v.municipio || 'Municipio Sin Especificar');

            if (!zonasMap[zonaKey]) {
                zonasMap[zonaKey] = {
                    zona: zonaKey,
                    total_votantes: 0,
                    votos_seguros: 0,
                    con_puesto: 0,
                    validos_censo: 0
                };
            }
            zonasMap[zonaKey].total_votantes++;
            if ((v.fidelidad_score || 3) >= 4) zonasMap[zonaKey].votos_seguros++;
            if (v.lugar_votacion) zonasMap[zonaKey].con_puesto++;
            if (v.estado_trashumancia === 'valido' || !v.estado_trashumancia) zonasMap[zonaKey].validos_censo++;
        });

        // Calcular meta esperada por zona y déficit
        const totalZonas = Object.keys(zonasMap).length || 1;
        const metaSugeridaPorZona = Math.round(metaGlobal / totalZonas);

        const desgloses = Object.values(zonasMap).map(z => {
            const deficit = z.total_votantes - metaSugeridaPorZona;
            const pct = metaSugeridaPorZona > 0 ? Math.round((z.total_votantes / metaSugeridaPorZona) * 100) : 0;
            let semaforo = 'deficit_critico';
            if (pct >= 100) semaforo = 'superado';
            else if (pct >= 60) semaforo = 'en_camino';

            return {
                ...z,
                meta_sugerida: metaSugeridaPorZona,
                deficit, // Negativo significa que faltan votos
                porcentaje_cumplimiento: pct,
                semaforo
            };
        }).sort((a, b) => b.total_votantes - a.total_votantes);

        return res.json({
            campana_id: campaign.id,
            nombre_campana: campaign.nombre,
            candidato: campaign.candidato,
            tipo_cargo: campaign.tipo_cargo,
            meta_global: metaGlobal,
            total_votantes: totalVotantes,
            votantes_validos_censo: votantesValidos,
            votos_seguros: votosSeguros,
            con_puesto: conPuesto,
            votos_faltantes: votosFaltantes,
            porcentaje_victoria: porcentajeVictoria,
            estado_termometro: porcentajeVictoria >= 100 ? 'Victoria Asegurada' : porcentajeVictoria >= 70 ? 'Competitiva Fuerte' : porcentajeVictoria >= 40 ? 'En Crecimiento' : 'Alerta de Avance Lento',
            desglose_territorial: desgloses
        });
    } catch (error) {
        console.error('Error en getTermometroVictoria:', error);
        return res.status(500).json({ message: 'Error al calcular termómetro de victoria', error: error.message });
    }
};

// ─── RED DE COECLIPEROS / CAMPAÑAS HIJAS (PADRINAZGO POLÍTICO A 4 AÑOS) ───
exports.getCoequiperos = async (req, res) => {
    try {
        const parentCampaign = await Campaign.findByPk(req.params.id);
        if (!parentCampaign) return res.status(404).json({ message: 'Campaña no encontrada' });

        const coequiperos = await Campaign.findAll({
            where: { parent_campaign_id: parentCampaign.id },
            order: [['createdAt', 'DESC']]
        });

        // Contar votos de cada coequipero
        const results = await Promise.all(coequiperos.map(async (c) => {
            const totalVoters = await Voter.count({ where: { campana_id: c.id } });
            const meta = c.meta_votos || 0;
            const progress = meta > 0 ? Math.min(100, Math.round((totalVoters / meta) * 100)) : 0;
            return {
                ...c.toJSON(),
                totalVoters,
                progressPercent: progress
            };
        }));

        // Campañas disponibles para apadrinar (que no tengan ya padre y no sean la misma)
        const disponiblesParaVincular = await Campaign.findAll({
            where: {
                id: { [Op.ne]: parentCampaign.id },
                parent_campaign_id: null
            },
            attributes: ['id', 'nombre', 'candidato', 'tipo_cargo', 'municipio', 'departamento']
        });

        return res.json({
            campana_matriz: {
                id: parentCampaign.id,
                nombre: parentCampaign.nombre,
                candidato: parentCampaign.candidato,
                tipo_cargo: parentCampaign.tipo_cargo
            },
            total_coequiperos: results.length,
            votos_totales_red: results.reduce((acc, c) => acc + c.totalVoters, 0),
            coequiperos: results,
            disponibles_para_vincular: disponiblesParaVincular
        });
    } catch (error) {
        console.error('Error en getCoequiperos:', error);
        return res.status(500).json({ message: 'Error al obtener coequiperos', error: error.message });
    }
};

exports.linkCoequipero = async (req, res) => {
    try {
        const { childId } = req.body;
        const parentId = parseInt(req.params.id, 10);

        if (!childId) return res.status(400).json({ message: 'ID del coequipero requerido' });

        const child = await Campaign.findByPk(childId);
        if (!child) return res.status(404).json({ message: 'Campaña hija no encontrada' });

        child.parent_campaign_id = parentId;
        await child.save();

        return res.json({ message: 'Campaña vinculada como coequipero exitosamente', child });
    } catch (error) {
        return res.status(500).json({ message: 'Error al vincular coequipero', error: error.message });
    }
};

exports.unlinkCoequipero = async (req, res) => {
    try {
        const { childId } = req.params;
        const child = await Campaign.findByPk(childId);
        if (!child) return res.status(404).json({ message: 'Campaña no encontrada' });

        child.parent_campaign_id = null;
        await child.save();

        return res.json({ message: 'Coequipero desvinculado exitosamente' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al desvincular coequipero', error: error.message });
    }
};

// ─── RENDICIÓN DE CUENTAS & COMPROMISOS DE MANDATO (4 AÑOS DE GESTIÓN) ─────
exports.getCompromisosGestion = async (req, res) => {
    try {
        const campanaId = parseInt(req.params.id, 10);
        const compromisos = await CompromisoGestion.findAll({
            where: { campana_id: campanaId },
            order: [['createdAt', 'DESC']]
        });

        const total = compromisos.length;
        const cumplidos = compromisos.filter(c => c.estado === 'cumplido_entregado').length;
        const enEjecucion = compromisos.filter(c => c.estado === 'en_ejecucion').length;
        const inversionTotal = compromisos.reduce((acc, c) => acc + parseFloat(c.inversion_presupuesto || 0), 0);
        const beneficiariosTotales = compromisos.reduce((acc, c) => acc + (c.beneficiarios_estimados || 0), 0);
        const pctCumplimiento = total > 0 ? Math.round((cumplidos / total) * 100) : 0;

        return res.json({
            campana_id: campanaId,
            metricas: {
                total_compromisos: total,
                cumplidos,
                en_ejecucion: enEjecucion,
                porcentaje_cumplimiento: pctCumplimiento,
                inversion_total_ejecutada: inversionTotal,
                beneficiarios_totales: beneficiariosTotales
            },
            compromisos
        });
    } catch (error) {
        console.error('Error en getCompromisosGestion:', error);
        return res.status(500).json({ message: 'Error al obtener compromisos', error: error.message });
    }
};

exports.createCompromisoGestion = async (req, res) => {
    try {
        const campanaId = parseInt(req.params.id, 10);
        const {
            titulo,
            descripcion,
            tipo,
            departamento,
            municipio,
            barrio_comuna,
            estado,
            inversion_presupuesto,
            fecha_inicio,
            fecha_cumplimiento,
            beneficiarios_estimados,
            evidencia_url
        } = req.body;

        if (!titulo || !descripcion) {
            return res.status(400).json({ message: 'Título y descripción son requeridos' });
        }

        const nuevo = await CompromisoGestion.create({
            campana_id: campanaId,
            titulo,
            descripcion,
            tipo: tipo || 'obra_infraestructura',
            departamento: departamento || null,
            municipio: municipio || null,
            barrio_comuna: barrio_comuna || null,
            estado: estado || 'en_ejecucion',
            inversion_presupuesto: inversion_presupuesto ? parseFloat(inversion_presupuesto) : 0,
            fecha_inicio: fecha_inicio || null,
            fecha_cumplimiento: fecha_cumplimiento || null,
            beneficiarios_estimados: beneficiarios_estimados ? parseInt(beneficiarios_estimados, 10) : 0,
            evidencia_url: evidencia_url || null
        });

        return res.status(201).json({ message: 'Compromiso de gestión creado exitosamente', compromiso: nuevo });
    } catch (error) {
        console.error('Error al crear compromiso:', error);
        return res.status(500).json({ message: 'Error al crear compromiso de gestión', error: error.message });
    }
};

exports.updateCompromisoGestion = async (req, res) => {
    try {
        const compromiso = await CompromisoGestion.findByPk(req.params.compromisoId);
        if (!compromiso) return res.status(404).json({ message: 'Compromiso no encontrado' });

        await compromiso.update(req.body);
        return res.json({ message: 'Compromiso actualizado exitosamente', compromiso });
    } catch (error) {
        return res.status(500).json({ message: 'Error al actualizar compromiso', error: error.message });
    }
};

exports.deleteCompromisoGestion = async (req, res) => {
    try {
        const compromiso = await CompromisoGestion.findByPk(req.params.compromisoId);
        if (!compromiso) return res.status(404).json({ message: 'Compromiso no encontrado' });

        await compromiso.destroy();
        return res.json({ message: 'Compromiso eliminado correctamente' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar compromiso', error: error.message });
    }
};

