const SocialMediaPost = require('../models/SocialMediaPost');
const SocialTeamAccount = require('../models/SocialTeamAccount');
const SocialNegativeComment = require('../models/SocialNegativeComment');
const SocialCompetitor = require('../models/SocialCompetitor');
const SocialCompetitorAttack = require('../models/SocialCompetitorAttack');
const SocialTeamInteraction = require('../models/SocialTeamInteraction');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const { calculateProgrammaticMetrics } = require('../services/contentIntelligenceService');
const socialSyncService = require('../services/socialSyncService');
const politicalStrategyAiService = require('../services/politicalStrategyAiService');
const SocialPostComment = require('../models/SocialPostComment');

/**
 * Métricas generales y KPIs de redes sociales
 */
exports.getDashboardMetrics = async (req, res) => {
    try {
        const { campana_id } = req.query;
        const where = {};
        if (campana_id) where.campana_id = parseInt(campana_id, 10);

        const posts = await SocialMediaPost.findAll({ where });
        const teamAccounts = await SocialTeamAccount.findAll({ where });
        const negativeComments = await SocialNegativeComment.findAll({ where });
        const competitors = await SocialCompetitor.findAll({ where });
        const allCommentsInDb = await SocialPostComment.findAll({ where });

        // Sumas de métricas y reacciones calculadas a partir de los comentarios auditados
        let totalAlcance = 0;
        let totalImpresiones = 0;
        let totalInteracciones = 0;
        let totalReproducciones = 0;

        posts.forEach(p => {
            totalAlcance += p.alcance || 0;
            totalImpresiones += p.impresiones || 0;
            totalInteracciones += p.interacciones || 0;
            totalReproducciones += p.reproducciones || 0;
        });

        const totalMeEncanta = allCommentsInDb.filter(c => c.tipo_reaccion === 'me_encanta').length;
        const totalApoyo = allCommentsInDb.filter(c => c.tipo_reaccion === 'apoyo').length;
        const totalMeGusta = allCommentsInDb.filter(c => c.tipo_reaccion === 'me_gusta').length;
        const totalAplausos = allCommentsInDb.filter(c => c.tipo_reaccion === 'aplausos').length;
        const totalPreguntas = allCommentsInDb.filter(c => c.tipo_reaccion === 'pregunta').length;
        const totalMeEnoja = allCommentsInDb.filter(c => c.tipo_reaccion === 'critica' || c.tipo_reaccion === 'ataque' || c.sentimiento === 'negativo').length;
        const totalComentarios = allCommentsInDb.length;

        const totalReaccionesPositivas = totalMeEncanta + totalApoyo + totalMeGusta + totalAplausos;
        const totalReaccionesAuditadas = totalComentarios;
        const pctPositivo = totalReaccionesAuditadas > 0 ? Math.round((totalReaccionesPositivas / totalReaccionesAuditadas) * 100) : 75;
        const pctNegativo = totalReaccionesAuditadas > 0 ? Math.round((totalMeEnoja / totalReaccionesAuditadas) * 100) : 10;
        const pctNeutral = Math.max(0, 100 - pctPositivo - pctNegativo);

        // Distribución por plataforma
        const porPlataforma = {
            facebook: posts.filter(p => p.plataforma === 'facebook').length,
            instagram: posts.filter(p => p.plataforma === 'instagram').length,
            tiktok: posts.filter(p => p.plataforma === 'tiktok').length,
            twitter: posts.filter(p => p.plataforma === 'twitter').length,
            youtube: posts.filter(p => p.plataforma === 'youtube').length
        };

        // Comentarios negativos pendientes
        const comentariosPendientes = negativeComments.filter(c => c.estado_gestion === 'pendiente').length;
        const comentariosCriticos = negativeComments.filter(c => c.nivel_riesgo === 'critico' || c.nivel_riesgo === 'alto').length;

        // Miembros del equipo activos vs inactivos
        const equipoMuyActivo = teamAccounts.filter(t => t.nivel_participacion === 'Muy Activo').length;
        const equipoInactivo = teamAccounts.filter(t => t.nivel_participacion === 'Inactivo' || t.nivel_participacion === 'Baja Participación').length;

        res.json({
            kpis: {
                totalAlcance,
                totalImpresiones,
                totalInteracciones,
                totalReproducciones,
                totalPosts: posts.length,
                totalComentarios,
                comentariosPendientes,
                comentariosCriticos,
                totalCuentasEquipo: teamAccounts.length,
                equipoMuyActivo,
                equipoInactivo,
                totalOpositores: competitors.length
            },
            reacciones: {
                total: totalComentarios,
                meEncanta: totalMeEncanta,
                apoyo: totalApoyo,
                meGusta: totalMeGusta,
                aplausos: totalAplausos,
                preguntas: totalPreguntas,
                criticas: totalMeEnoja,
                likes: totalMeGusta,
                meEnoja: totalMeEnoja,
                pctPositivo,
                pctNeutral,
                pctNegativo
            },
            porPlataforma
        });
    } catch (error) {
        console.error('Error al obtener métricas de redes:', error);
        res.status(500).json({ message: 'Error al obtener métricas de redes sociales', error: error.message });
    }
};

/**
 * Publicaciones y monitoreo en vivo
 */
exports.getPosts = async (req, res) => {
    try {
        const { campana_id, plataforma, en_vivo, search } = req.query;
        const where = {};
        if (campana_id) where.campana_id = parseInt(campana_id, 10);
        if (plataforma && plataforma !== 'todas') where.plataforma = plataforma;
        if (en_vivo === 'true') where.en_vivo = true;

        const posts = await SocialMediaPost.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });

        // Cargar todos los comentarios de estos posts para coincidencia 100% matemática
        const postIds = posts.map(p => p.id);
        const allComments = postIds.length > 0 ? await SocialPostComment.findAll({
            where: { post_id: postIds }
        }) : [];

        const commentsByPost = {};
        allComments.forEach(c => {
            if (!commentsByPost[c.post_id]) commentsByPost[c.post_id] = [];
            commentsByPost[c.post_id].push(c);
        });

        // Cargar interacciones del equipo para cada post
        const allInteractions = await SocialTeamInteraction.findAll();
        const interactionsByPost = {};
        allInteractions.forEach(it => {
            if (!interactionsByPost[it.post_id]) interactionsByPost[it.post_id] = [];
            interactionsByPost[it.post_id].push(it.toJSON());
        });

        let results = posts.map(p => {
            const data = p.toJSON();
            const pComments = commentsByPost[p.id] || [];
            const realCommentCount = pComments.length;

            const reacMeEncanta = pComments.filter(c => c.tipo_reaccion === 'me_encanta').length;
            const reacApoyo = pComments.filter(c => c.tipo_reaccion === 'apoyo').length;
            const reacMeGusta = pComments.filter(c => c.tipo_reaccion === 'me_gusta').length;
            const reacAplausos = pComments.filter(c => c.tipo_reaccion === 'aplausos').length;
            const reacPreguntas = pComments.filter(c => c.tipo_reaccion === 'pregunta').length;
            const reacCriticas = pComments.filter(c => c.tipo_reaccion === 'critica' || c.tipo_reaccion === 'ataque' || c.sentimiento === 'negativo').length;

            const postTeam = interactionsByPost[p.id] || [];
            const teamShares = postTeam.filter(it => it.compartio).length;
            const teamComments = postTeam.filter(it => it.comento).length;
            const teamReactions = postTeam.filter(it => it.tipo_reaccion && it.tipo_reaccion !== 'ninguna').length;

            return {
                ...data,
                titulo: (data.titulo || '').replace(/^(@[a-zA-Z0-9_]+|Oscar Villamizar|Diego Fran Ariza|Alejandro Gaviria):\s*/i, ''),
                comentarios_conteo: realCommentCount,
                likes: reacMeGusta,
                me_encanta: reacMeEncanta,
                me_enoja: reacCriticas,
                reacciones_desglose: {
                    me_encanta: reacMeEncanta,
                    apoyo: reacApoyo,
                    me_gusta: reacMeGusta,
                    aplausos: reacAplausos,
                    pregunta: reacPreguntas,
                    critica: reacCriticas,
                    total: realCommentCount
                },
                team_interactions: postTeam,
                team_shares: teamShares,
                team_comments: teamComments,
                team_reactions: teamReactions,
                total_equipo_participando: postTeam.length
            };
        });

        if (search) {
            const s = search.toLowerCase();
            results = results.filter(p =>
                (p.titulo && p.titulo.toLowerCase().includes(s)) ||
                (p.contenido && p.contenido.toLowerCase().includes(s)) ||
                (p.autor_nombre && p.autor_nombre.toLowerCase().includes(s)) ||
                (p.tema_estrategico && p.tema_estrategico.toLowerCase().includes(s))
            );
        }

        res.json(results);
    } catch (error) {
        console.error('Error al listar posts:', error);
        res.status(500).json({ message: 'Error al listar publicaciones', error: error.message });
    }
};

exports.createPost = async (req, res) => {
    try {
        const campana_id = req.campana_id || req.body.campana_id || req.user.campana_id;
        if (!campana_id) {
            return res.status(400).json({ message: 'Se requiere una campaña para registrar la publicación' });
        }
        const nuevo = await SocialMediaPost.create({ ...req.body, campana_id });
        res.status(201).json({ message: 'Publicación registrada con éxito', post: nuevo });
    } catch (error) {
        console.error('Error al crear post:', error);
        res.status(500).json({ message: 'Error al crear publicación', error: error.message });
    }
};

exports.updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await SocialMediaPost.findByPk(id);
        if (!post) return res.status(404).json({ message: 'Publicación no encontrada' });

        if (req.user.role !== 'superadmin' && req.campana_id && post.campana_id && post.campana_id !== req.campana_id) {
            return res.status(403).json({ message: 'Acceso denegado: esta publicación pertenece a otra campaña' });
        }

        const dataToUpdate = { ...req.body };
        if (req.user.role !== 'superadmin') {
            delete dataToUpdate.campana_id; // No puede transferirse a otra campaña
        }

        await post.update(dataToUpdate);
        res.json({ message: 'Publicación actualizada', post });
    } catch (error) {
        console.error('Error al actualizar post:', error);
        res.status(500).json({ message: 'Error al actualizar publicación', error: error.message });
    }
};

exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await SocialMediaPost.findByPk(id);
        if (!post) return res.status(404).json({ message: 'Publicación no encontrada' });

        if (req.user.role !== 'superadmin' && req.campana_id && post.campana_id && post.campana_id !== req.campana_id) {
            return res.status(403).json({ message: 'Acceso denegado: esta publicación pertenece a otra campaña' });
        }

        await post.destroy();
        res.json({ message: 'Publicación eliminada' });
    } catch (error) {
        console.error('Error al eliminar post:', error);
        res.status(500).json({ message: 'Error al eliminar publicación', error: error.message });
    }
};


/**
 * Trazabilidad: Registrar clic / apertura del link del candidato
 */
exports.trackPostClick = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await SocialMediaPost.findByPk(id);
        if (!post) return res.status(404).json({ message: 'Publicación no encontrada' });
        post.clics_link_candidato = (post.clics_link_candidato || 0) + 1;
        await post.save();
        res.json({ message: 'Clic trazado correctamente', clics: post.clics_link_candidato });
    } catch (error) {
        console.error('Error al trazar clic:', error);
        res.status(500).json({ message: 'Error al trazar clic', error: error.message });
    }
};

/**
 * Cuentas del equipo y seguimiento de participación
 */
exports.getTeamAccounts = async (req, res) => {
    try {
        const { campana_id, plataforma, nivel_participacion, search } = req.query;
        const where = {};
        if (campana_id) where.campana_id = parseInt(campana_id, 10);
        if (plataforma && plataforma !== 'todas') where.plataforma = plataforma;
        if (nivel_participacion && nivel_participacion !== 'todos') where.nivel_participacion = nivel_participacion;

        const accounts = await SocialTeamAccount.findAll({
            where,
            order: [['seguidores', 'DESC'], ['repost_campana_count', 'DESC']]
        });

        let results = accounts.map(a => a.toJSON());
        if (search) {
            const s = search.toLowerCase();
            results = results.filter(a =>
                (a.nombre_miembro && a.nombre_miembro.toLowerCase().includes(s)) ||
                (a.usuario_handle && a.usuario_handle.toLowerCase().includes(s)) ||
                (a.rol_equipo && a.rol_equipo.toLowerCase().includes(s))
            );
        }

        res.json(results);
    } catch (error) {
        console.error('Error al listar cuentas del equipo:', error);
        res.status(500).json({ message: 'Error al listar cuentas del equipo', error: error.message });
    }
};

exports.createTeamAccount = async (req, res) => {
    try {
        const nueva = await SocialTeamAccount.create(req.body);
        res.status(201).json({ message: 'Cuenta del equipo agregada exitosamente', account: nueva });
    } catch (error) {
        console.error('Error al registrar cuenta del equipo:', error);
        res.status(500).json({ message: 'Error al registrar cuenta del equipo', error: error.message });
    }
};

exports.updateTeamAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const account = await SocialTeamAccount.findByPk(id);
        if (!account) return res.status(404).json({ message: 'Cuenta no encontrada' });
        await account.update(req.body);
        res.json({ message: 'Cuenta del equipo actualizada', account });
    } catch (error) {
        console.error('Error al actualizar cuenta:', error);
        res.status(500).json({ message: 'Error al actualizar cuenta', error: error.message });
    }
};

exports.recordTeamSupport = async (req, res) => {
    try {
        const { id } = req.params;
        const account = await SocialTeamAccount.findByPk(id);
        if (!account) return res.status(404).json({ message: 'Cuenta no encontrada' });

        account.repost_campana_count = (account.repost_campana_count || 0) + 1;
        account.ultimo_apoyo_fecha = new Date().toISOString().split('T')[0];
        account.nivel_participacion = account.repost_campana_count >= 10 ? 'Muy Activo' : 'Activo';
        await account.save();

        res.json({ message: 'Interacción registrada al miembro del equipo', account });
    } catch (error) {
        console.error('Error al registrar apoyo del equipo:', error);
        res.status(500).json({ message: 'Error al registrar interacción', error: error.message });
    }
};

exports.deleteTeamAccount = async (req, res) => {
    try {
        const { id } = req.params;
        await SocialTeamAccount.destroy({ where: { id } });
        res.json({ message: 'Cuenta eliminada del equipo' });
    } catch (error) {
        console.error('Error al eliminar cuenta:', error);
        res.status(500).json({ message: 'Error al eliminar cuenta', error: error.message });
    }
};

/**
 * Comentarios negativos y alertas de crisis
 */
exports.getNegativeComments = async (req, res) => {
    try {
        const { campana_id, nivel_riesgo, estado_gestion, plataforma, search } = req.query;
        const where = {};
        if (campana_id) where.campana_id = parseInt(campana_id, 10);
        if (nivel_riesgo && nivel_riesgo !== 'todos') where.nivel_riesgo = nivel_riesgo;
        if (estado_gestion && estado_gestion !== 'todos') where.estado_gestion = estado_gestion;
        if (plataforma && plataforma !== 'todas') where.plataforma = plataforma;

        const comments = await SocialNegativeComment.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });

        let results = comments.map(c => c.toJSON());
        if (search) {
            const s = search.toLowerCase();
            results = results.filter(c =>
                (c.texto_comentario && c.texto_comentario.toLowerCase().includes(s)) ||
                (c.usuario_comenta && c.usuario_comenta.toLowerCase().includes(s)) ||
                (c.categoria_ataque && c.categoria_ataque.toLowerCase().includes(s))
            );
        }

        res.json(results);
    } catch (error) {
        console.error('Error al listar comentarios negativos:', error);
        res.status(500).json({ message: 'Error al listar comentarios', error: error.message });
    }
};

exports.createNegativeComment = async (req, res) => {
    try {
        const nuevo = await SocialNegativeComment.create(req.body);
        res.status(201).json({ message: 'Comentario negativo / ataque registrado', comment: nuevo });
    } catch (error) {
        console.error('Error al registrar comentario negativo:', error);
        res.status(500).json({ message: 'Error al registrar comentario negativo', error: error.message });
    }
};

exports.updateNegativeComment = async (req, res) => {
    try {
        const { id } = req.params;
        const comment = await SocialNegativeComment.findByPk(id);
        if (!comment) return res.status(404).json({ message: 'Comentario no encontrado' });
        await comment.update(req.body);
        res.json({ message: 'Comentario actualizado', comment });
    } catch (error) {
        console.error('Error al actualizar comentario:', error);
        res.status(500).json({ message: 'Error al actualizar comentario', error: error.message });
    }
};

exports.deleteNegativeComment = async (req, res) => {
    try {
        const { id } = req.params;
        await SocialNegativeComment.destroy({ where: { id } });
        res.json({ message: 'Registro de comentario eliminado' });
    } catch (error) {
        console.error('Error al eliminar comentario:', error);
        res.status(500).json({ message: 'Error al eliminar comentario', error: error.message });
    }
};

/**
 * Análisis de contrincantes y radar de la oposición
 */
exports.getCompetitors = async (req, res) => {
    try {
        const { campana_id, nivel_amenaza, search } = req.query;
        const where = {};
        if (campana_id) where.campana_id = parseInt(campana_id, 10);
        if (nivel_amenaza && nivel_amenaza !== 'todos') where.nivel_amenaza = nivel_amenaza;

        const competitors = await SocialCompetitor.findAll({
            where,
            include: [
                {
                    model: SocialCompetitorAttack,
                    as: 'ataques',
                    required: false
                }
            ],
            order: [['alcance_estimado', 'DESC']]
        });

        let results = competitors.map(c => {
            const data = c.toJSON();
            let parsedRedes = {};
            try {
                parsedRedes = typeof data.redes_principales === 'string' ? JSON.parse(data.redes_principales || '{}') : (data.redes_principales || {});
            } catch (e) {
                parsedRedes = {};
            }

            const ataques = data.ataques || [];
            const ataquesCandidato = ataques.filter(a => a.blanco_ataque === 'candidato').length;
            const ataquesPartido = ataques.filter(a => a.blanco_ataque === 'partido').length;
            const ataquesGestion = ataques.filter(a => ['alcalde', 'gobernador', 'concejal', 'senador', 'congresista', 'gestion_institucional'].includes(a.blanco_ataque)).length;

            return {
                ...data,
                redes_principales: parsedRedes,
                totalAtaques: ataques.length,
                ataquesCandidato,
                ataquesPartido,
                ataquesGestion,
                ataquesRecientes: ataques.slice(0, 3)
            };
        });

        if (search) {
            const s = search.toLowerCase();
            results = results.filter(c =>
                (c.nombre_candidato && c.nombre_candidato.toLowerCase().includes(s)) ||
                (c.partido_movimiento && c.partido_movimiento.toLowerCase().includes(s)) ||
                (c.narrativa_principal && c.narrativa_principal.toLowerCase().includes(s)) ||
                (c.lineas_de_ataque && c.lineas_de_ataque.toLowerCase().includes(s))
            );
        }

        res.json(results);
    } catch (error) {
        console.error('Error al listar contrincantes:', error);
        res.status(500).json({ message: 'Error al listar contrincantes', error: error.message });
    }
};

exports.createCompetitor = async (req, res) => {
    try {
        const payload = { ...req.body };
        if (typeof payload.redes_principales === 'object') {
            payload.redes_principales = JSON.stringify(payload.redes_principales);
        }
        const nuevo = await SocialCompetitor.create(payload);
        res.status(201).json({ message: 'Contrincante registrado en el radar opositor', competitor: nuevo });
    } catch (error) {
        console.error('Error al crear contrincante:', error);
        res.status(500).json({ message: 'Error al registrar contrincante', error: error.message });
    }
};

exports.updateCompetitor = async (req, res) => {
    try {
        const { id } = req.params;
        const competitor = await SocialCompetitor.findByPk(id);
        if (!competitor) return res.status(404).json({ message: 'Contrincante no encontrado' });

        const payload = { ...req.body };
        if (typeof payload.redes_principales === 'object') {
            payload.redes_principales = JSON.stringify(payload.redes_principales);
        }
        await competitor.update(payload);
        res.json({ message: 'Ficha del contrincante actualizada', competitor });
    } catch (error) {
        console.error('Error al actualizar contrincante:', error);
        res.status(500).json({ message: 'Error al actualizar contrincante', error: error.message });
    }
};

exports.deleteCompetitor = async (req, res) => {
    try {
        const { id } = req.params;
        await SocialCompetitor.destroy({ where: { id } });
        res.json({ message: 'Contrincante eliminado del radar' });
    } catch (error) {
        console.error('Error al eliminar contrincante:', error);
        res.status(500).json({ message: 'Error al eliminar contrincante', error: error.message });
    }
};

/**
 * ============================================================
 * BITÁCORA Y DETECTOR DE ATAQUES DE LA OPOSICIÓN / ADVERSARIOS
 * ============================================================
 */

exports.getCompetitorAttacks = async (req, res) => {
    try {
        const { campana_id, competitor_id, blanco_ataque, nivel_amenaza, estado, search } = req.query;
        const where = {};
        if (campana_id) where.campana_id = parseInt(campana_id, 10);
        if (competitor_id && competitor_id !== 'todos') where.competitor_id = parseInt(competitor_id, 10);
        if (blanco_ataque && blanco_ataque !== 'todos') where.blanco_ataque = blanco_ataque;
        if (nivel_amenaza && nivel_amenaza !== 'todos') where.nivel_amenaza = nivel_amenaza;
        if (estado && estado !== 'todos') where.estado = estado;

        const attacks = await SocialCompetitorAttack.findAll({
            where,
            include: [
                {
                    model: SocialCompetitor,
                    as: 'adversario',
                    attributes: ['id', 'nombre_candidato', 'partido_movimiento', 'cargo_postulado', 'redes_principales'],
                    required: false
                }
            ],
            order: [['fecha_ataque', 'DESC']]
        });

        let results = attacks.map(a => a.toJSON());
        if (search) {
            const s = search.toLowerCase();
            results = results.filter(a =>
                (a.adversario_nombre && a.adversario_nombre.toLowerCase().includes(s)) ||
                (a.contenido_ataque && a.contenido_ataque.toLowerCase().includes(s)) ||
                (a.tema_ataque && a.tema_ataque.toLowerCase().includes(s)) ||
                (a.descripcion_blanco && a.descripcion_blanco.toLowerCase().includes(s))
            );
        }

        res.json(results);
    } catch (error) {
        console.error('Error al listar ataques de contrincantes:', error);
        res.status(500).json({ message: 'Error al listar ataques', error: error.message });
    }
};

exports.createCompetitorAttack = async (req, res) => {
    try {
        const payload = { ...req.body };
        const campana_id = payload.campana_id || req.user?.campana_id || 1;
        payload.campana_id = campana_id;

        // Si viene competitor_id y no viene adversario_nombre, completarlo
        if (payload.competitor_id && !payload.adversario_nombre) {
            const comp = await SocialCompetitor.findByPk(payload.competitor_id);
            if (comp) {
                payload.adversario_nombre = comp.nombre_candidato;
            }
        }

        // Si no vienen guiones ni análisis, invocar análisis de IA
        if (!payload.guion_candidato && payload.contenido_ataque) {
            const campaign = await Campaign.findByPk(campana_id);
            const aiData = await politicalStrategyAiService.analyzeAttack({
                contenido_ataque: payload.contenido_ataque,
                adversario_nombre: payload.adversario_nombre || 'Adversario',
                cargo_postulado_o_actual: campaign ? (campaign.tipo_eleccion || campaign.nombre) : 'Alcalde / Candidato',
                partido_nuestro: campaign ? (campaign.partido_politico || 'Nuestra Coalición') : 'Nuestra Campaña',
                candidato_nuestro: campaign ? (campaign.candidato || 'Nuestro Candidato') : 'Nuestro Candidato',
                plataforma: payload.plataforma || 'twitter',
                likes: payload.likes || 0,
                reposts: payload.reposts || 0,
                comentarios: payload.comentarios || 0
            });

            // Combinar sugerencias si no se enviaron explícitamente
            if (!payload.blanco_ataque) payload.blanco_ataque = aiData.blanco_ataque;
            if (!payload.descripcion_blanco) payload.descripcion_blanco = aiData.descripcion_blanco;
            if (!payload.tema_ataque) payload.tema_ataque = aiData.tema_ataque;
            if (!payload.nivel_amenaza) payload.nivel_amenaza = aiData.nivel_amenaza;
            if (payload.es_fake_news === undefined) payload.es_fake_news = aiData.es_fake_news;
            if (payload.posible_red_bots === undefined) payload.posible_red_bots = aiData.posible_red_bots;
            if (!payload.tactica_recomendada) payload.tactica_recomendada = aiData.tactica_recomendada;
            if (!payload.analisis_estrategico) payload.analisis_estrategico = aiData.analisis_estrategico;
            if (!payload.guion_candidato) payload.guion_candidato = aiData.guion_candidato;
            if (!payload.guion_voceros) payload.guion_voceros = aiData.guion_voceros;
            if (!payload.guion_tropa_digital) payload.guion_tropa_digital = aiData.guion_tropa_digital;
            if (!payload.guion_debates) payload.guion_debates = aiData.guion_debates;
        }

        const nuevoAtaque = await SocialCompetitorAttack.create(payload);
        res.status(201).json({ message: 'Ataque registrado y evaluado en el Cuarto de Guerra', attack: nuevoAtaque });
    } catch (error) {
        console.error('Error al registrar ataque de contrincante:', error);
        res.status(500).json({ message: 'Error al registrar ataque', error: error.message });
    }
};

exports.updateCompetitorAttack = async (req, res) => {
    try {
        const { id } = req.params;
        const attack = await SocialCompetitorAttack.findByPk(id);
        if (!attack) return res.status(404).json({ message: 'Registro de ataque no encontrado' });

        await attack.update(req.body);
        res.json({ message: 'Registro de ataque actualizado', attack });
    } catch (error) {
        console.error('Error al actualizar ataque de contrincante:', error);
        res.status(500).json({ message: 'Error al actualizar ataque', error: error.message });
    }
};

exports.deleteCompetitorAttack = async (req, res) => {
    try {
        const { id } = req.params;
        await SocialCompetitorAttack.destroy({ where: { id } });
        res.json({ message: 'Registro de ataque eliminado' });
    } catch (error) {
        console.error('Error al eliminar ataque:', error);
        res.status(500).json({ message: 'Error al eliminar ataque', error: error.message });
    }
};

/**
 * ASESOR Y MATRIZ CON IA PARA EL DIRECTOR DE CAMPAÑA
 */
exports.analyzeAttackWithAi = async (req, res) => {
    try {
        const {
            contenido_ataque,
            adversario_nombre,
            partido_adversario,
            plataforma,
            likes,
            reposts,
            comentarios,
            campana_id
        } = req.body;

        if (!contenido_ataque) {
            return res.status(400).json({ message: 'El contenido del ataque es requerido para el análisis' });
        }

        const activeCampanaId = campana_id || req.user?.campana_id || 1;
        const campaign = await Campaign.findByPk(activeCampanaId);

        const analysis = await politicalStrategyAiService.analyzeAttack({
            contenido_ataque,
            adversario_nombre: adversario_nombre || 'Adversario Político',
            partido_adversario: partido_adversario || '',
            cargo_postulado_o_actual: campaign ? (campaign.tipo_eleccion || campaign.nombre) : 'Alcalde / Candidato',
            partido_nuestro: campaign ? (campaign.partido_politico || 'Nuestra Coalición') : 'Nuestra Campaña',
            candidato_nuestro: campaign ? (campaign.candidato || 'Nuestro Candidato') : 'Nuestro Candidato',
            plataforma: plataforma || 'twitter',
            likes: likes || 0,
            reposts: reposts || 0,
            comentarios: comentarios || 0
        });

        res.json({ success: true, analysis });
    } catch (error) {
        console.error('Error en análisis estratégico con IA:', error);
        res.status(500).json({ message: 'Error al generar análisis con IA', error: error.message });
    }
};

/**
 * ESCANEAR POST / URL DE ADVERSARIO Y EXTRAER EL ATAQUE
 */
exports.scanCompetitorAttackFromUrl = async (req, res) => {
    try {
        const { url, campana_id, competitor_id } = req.body;
        if (!url) {
            return res.status(400).json({ message: 'La URL de la publicación es requerida' });
        }

        const activeCampanaId = campana_id || req.user?.campana_id || 1;
        const campaign = await Campaign.findByPk(activeCampanaId);

        let adversario = null;
        if (competitor_id) {
            adversario = await SocialCompetitor.findByPk(competitor_id);
        }

        // Extraer plataforma y username de la URL
        let plataforma = 'twitter';
        const urlLower = url.toLowerCase();
        if (urlLower.includes('instagram.com')) plataforma = 'instagram';
        else if (urlLower.includes('tiktok.com')) plataforma = 'tiktok';
        else if (urlLower.includes('facebook.com')) plataforma = 'facebook';
        else if (urlLower.includes('youtube.com')) plataforma = 'youtube';

        // Simular o extraer contenido del post
        const adversarioNombre = adversario ? adversario.nombre_candidato : 'Oposición Digital';
        const contenidoSimulado = `Ataque detectado en ${plataforma} desde ${url}: Señalamientos y críticas directas hacia la administración y el partido respecto a promesas de campaña, ejecución presupuestal y liderazgo en el territorio.`;

        const analysis = await politicalStrategyAiService.analyzeAttack({
            contenido_ataque: contenidoSimulado,
            adversario_nombre: adversarioNombre,
            partido_adversario: adversario ? adversario.partido_movimiento : '',
            cargo_postulado_o_actual: campaign ? (campaign.tipo_eleccion || campaign.nombre) : 'Alcalde / Candidato',
            partido_nuestro: campaign ? (campaign.partido_politico || 'Nuestra Coalición') : 'Nuestra Campaña',
            candidato_nuestro: campaign ? (campaign.candidato || 'Nuestro Candidato') : 'Nuestro Candidato',
            plataforma,
            likes: 120,
            reposts: 45,
            comentarios: 30
        });

        res.json({
            success: true,
            extracted: {
                plataforma,
                url_publicacion: url,
                adversario_nombre: adversarioNombre,
                competitor_id: adversario ? adversario.id : null,
                contenido_ataque: contenidoSimulado,
                ...analysis
            }
        });
    } catch (error) {
        console.error('Error al escanear publicación de adversario:', error);
        res.status(500).json({ message: 'Error al escanear publicación', error: error.message });
    }
};

/**
 * Obtener usuarios de la base de datos oficial del equipo (User model)
 */
exports.getTeamDatabaseUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            where: { activo: true },
            attributes: ['id', 'nombre', 'email', 'telefono', 'role', 'campana_id'],
            order: [['nombre', 'ASC']]
        });
        res.json(users);
    } catch (error) {
        console.error('Error al obtener usuarios del equipo:', error);
        res.status(500).json({ message: 'Error al listar usuarios de la base de datos del equipo', error: error.message });
    }
};

/**
 * Obtener interacciones del equipo en una publicación específica
 */
exports.getPostInteractions = async (req, res) => {
    try {
        const { postId } = req.params;
        const interactions = await SocialTeamInteraction.findAll({
            where: { post_id: parseInt(postId, 10) },
            order: [['createdAt', 'DESC']]
        });
        res.json(interactions);
    } catch (error) {
        console.error('Error al obtener interacciones de la publicación:', error);
        res.status(500).json({ message: 'Error al obtener interacciones del equipo', error: error.message });
    }
};

/**
 * Registrar o actualizar interacción de un miembro del equipo en una publicación
 * (reacción, comentario y si compartió)
 */
exports.recordPostInteraction = async (req, res) => {
    try {
        const { postId } = req.params;
        const {
            team_account_id,
            user_id,
            nombre_miembro,
            rol_equipo,
            usuario_handle,
            plataforma,
            tipo_reaccion,
            comento,
            texto_comentario,
            compartio,
            url_compartido
        } = req.body;

        if (!nombre_miembro) {
            return res.status(400).json({ message: 'El nombre del miembro del equipo es obligatorio' });
        }

        // Buscar si ya existe interacción de este miembro en este post
        let interaction = null;
        if (team_account_id) {
            interaction = await SocialTeamInteraction.findOne({
                where: { post_id: parseInt(postId, 10), team_account_id: parseInt(team_account_id, 10) }
            });
        } else if (user_id) {
            interaction = await SocialTeamInteraction.findOne({
                where: { post_id: parseInt(postId, 10), user_id: parseInt(user_id, 10) }
            });
        }

        const now = new Date().toISOString().slice(0, 16).replace('T', ' ');

        if (interaction) {
            if (tipo_reaccion !== undefined) interaction.tipo_reaccion = tipo_reaccion;
            if (comento !== undefined) interaction.comento = comento;
            if (texto_comentario !== undefined) interaction.texto_comentario = texto_comentario;
            if (compartio !== undefined) interaction.compartio = compartio;
            if (url_compartido !== undefined) interaction.url_compartido = url_compartido;
            interaction.fecha_interaccion = now;
            await interaction.save();
        } else {
            const post = await SocialMediaPost.findByPk(postId);
            interaction = await SocialTeamInteraction.create({
                campana_id: post ? post.campana_id : 1,
                post_id: parseInt(postId, 10),
                team_account_id: team_account_id ? parseInt(team_account_id, 10) : null,
                user_id: user_id ? parseInt(user_id, 10) : null,
                nombre_miembro,
                rol_equipo: rol_equipo || 'Activista Digital',
                usuario_handle: usuario_handle || '@equipo',
                plataforma: plataforma || (post ? post.plataforma : 'instagram'),
                tipo_reaccion: tipo_reaccion || 'like',
                comento: comento !== undefined ? comento : (texto_comentario ? true : false),
                texto_comentario: texto_comentario || null,
                compartio: compartio !== undefined ? compartio : false,
                url_compartido: url_compartido || null,
                fecha_interaccion: now
            });
        }

        // Si compartió, actualizar contador de reposts en la cuenta del equipo
        if (team_account_id && compartio) {
            const teamAcc = await SocialTeamAccount.findByPk(team_account_id);
            if (teamAcc) {
                teamAcc.repost_campana_count = (teamAcc.repost_campana_count || 0) + 1;
                teamAcc.ultimo_apoyo_fecha = now.split(' ')[0];
                teamAcc.nivel_participacion = teamAcc.repost_campana_count >= 10 ? 'Muy Activo' : 'Activo';
                await teamAcc.save();
            }
        }

        res.json({
            message: 'Interacción del equipo guardada con éxito',
            interaction
        });
    } catch (error) {
        console.error('Error al registrar interacción del equipo:', error);
        res.status(500).json({ message: 'Error al registrar interacción del equipo', error: error.message });
    }
};

/**
 * Eliminar interacción del equipo
 */
exports.deletePostInteraction = async (req, res) => {
    try {
        const { interactionId } = req.params;
        await SocialTeamInteraction.destroy({ where: { id: interactionId } });
        res.json({ message: 'Interacción eliminada' });
    } catch (error) {
        console.error('Error al eliminar interacción:', error);
        res.status(500).json({ message: 'Error al eliminar interacción', error: error.message });
    }
};

/**
 * ASESOR VIRTUAL DE VIRALIDAD (IA DE ESTRATEGIA DIGITAL ELECTORAL)
 * Analiza una publicación y genera diagnóstico, puntuación de viralidad,
 * ganchos de alta retención, protocolo de los primeros 30 minutos y copys para WhatsApp.
 */
exports.getViralAdvisorAnalysis = async (req, res) => {
    try {
        const { postId, titulo, contenido, plataforma, tema_estrategico } = req.body;

        let post = null;
        if (postId) {
            post = await SocialMediaPost.findByPk(postId);
        }

        const titleText = post ? post.titulo : (titulo || 'Propuesta de Campaña');
        const contentText = post ? post.contenido : (contenido || '');
        const platform = post ? post.plataforma : (plataforma || 'tiktok');
        const topic = post ? (post.tema_estrategico || 'General') : (tema_estrategico || 'General');
        const trackingLink = post ? `http://localhost:3000/r/${post.id}` : 'https://campana.co/link';

        // Cálculo dinámico de Viral Score mediante motor programático
        let score = 65;
        if (post && (post.alcance > 0 || post.reproducciones > 0)) {
            const calculated = calculateProgrammaticMetrics({
                views: post.reproducciones,
                reach: post.alcance,
                likes: post.likes,
                comments: post.comentarios,
                shares: post.compartidos,
                saves: post.guardados
            });
            score = calculated.virality_score;
        } else {
            // Estimación para borradores antes de publicación
            if (contentText.length > 50 && contentText.length < 280) score += 8;
            if (contentText.includes('#')) score += 5;
            if (contentText.includes('?')) score += 6;
            if (platform === 'tiktok' || platform === 'instagram') score += 5;
            score = Math.max(30, Math.min(score, 95));
        }

        // Diagnóstico algorítmico según plataforma
        let diagnostico = '';
        if (platform === 'tiktok') {
            diagnostico = 'El algoritmo de TikTok premia el tiempo de retención y comentarios extensos en los primeros 18 minutos. Si no generas una duda o controversia en los primeros 2.4 segundos, el 80% de los usuarios deslizarán antes de oír la propuesta central.';
        } else if (platform === 'instagram') {
            diagnostico = 'En Instagram Reels, el factor crítico es el guardado y el envío por DM (mensaje directo). Necesitamos que el usuario sienta que la información es tan valiosa que debe guardarla o reenviársela a su familia.';
        } else if (platform === 'twitter') {
            diagnostico = 'En X (Twitter) el algoritmo amplifica hilos con datos verificables y polarización de posturas claras. Las citas y respuestas largas activan el radar de tendencias nacionales.';
        } else if (platform === 'facebook') {
            diagnostico = 'Facebook es el canal de mayor impacto en audiencias mayores de 35 años y líderes comunitarios. Los videos testimoniales y llamados de indignación con esperanza son los más compartidos en grupos barriales.';
        } else {
            diagnostico = 'En YouTube Shorts / Video, el título debe plantear una incógnita irresistible y la miniatura debe tener una expresión humana fuerte con texto de máximo 4 palabras.';
        }

        // Generar 3 Ganchos Virales (Hooks de 3 segundos)
        const ganchos_virales = [
            {
                tipo: 'Controversia Constructiva / Curiosidad',
                texto: `“Lo que ningún político tradicional te va a decir sobre ${topic} (y por qué prefieren que no te enteres)...”`,
                explicacion: 'Despierta sospecha del statu quo y obliga a escuchar para saber la verdad.'
            },
            {
                tipo: 'Dolor Ciudadano Directo',
                texto: `“¿Hasta cuándo vamos a aguantar esto? Si vives en esta región y te duele ver lo que pasa con ${topic}, escucha 30 segundos:”`,
                explicacion: 'Genera empatía y sentido de urgencia en los primeros 3 segundos.'
            },
            {
                tipo: 'Dato Revelador / Sorpresa',
                texto: `“Revisamos las cifras oficiales y encontramos esto sobre ${topic}: te prometieron una cosa, pero la realidad es otra...”`,
                explicacion: 'Posiciona al candidato como un líder serio, preparado y con las pruebas en la mano.'
            }
        ];

        // Protocolo de los Primeros 30 Minutos (Engaño positivo al algoritmo)
        const protocolo_30_minutos = [
            {
                minuto: '00:00 - 05:00',
                accion: 'Fijar el Primer Comentario del Candidato',
                detalle: 'El candidato o la cuenta oficial debe ser el primero en comentar una pregunta abierta (ej. “¿Cuál ha sido tu experiencia con esto? Los leo a todos”). Esto duplica las respuestas de la comunidad.'
            },
            {
                minuto: '05:00 - 15:00',
                accion: 'Despliegue del Equipo Territorial y Digital',
                detalle: 'Los miembros de avanzada y líderes deben comentar con oraciones de más de 6 palabras (evitar poner solo emojis). El algoritmo califica las conversaciones reales como "contenido de alto interés".'
            },
            {
                minuto: '15:00 - 30:00',
                accion: 'Cadenas de WhatsApp con el Link Oficial',
                detalle: 'Enviar la publicación a los grupos de WhatsApp comunales y de jóvenes usando el link del candidato para monitorear clics y activar compartidos externos.'
            },
            {
                minuto: '30:00+',
                accion: 'Responder a Comentarios Críticos con Respeto y Datos',
                detalle: 'No borrar comentarios opuestos salvo que sean insultos graves. Responder con altura genera hilos de discusión que disparan el contenido al feed de "Para Ti".'
            }
        ];

        // Copys Listos para Difusión por WhatsApp
        const copys_whatsapp = {
            jovenes: `🚨 *¡MIRA ESTO ANTES DE QUE LO BORREN!* 🚨\n\nEl candidato acaba de soltar una verdad incómoda sobre *${topic}* que muchos no quieren que se sepa.\n\n👇 *Míralo aquí en 40 segundos:* \n${trackingLink}\n\n💬 *Deja tu comentario y compártelo con tus amigos.* ¡La juventud despierta! 🔥`,
            lideres_comunales: `🇨🇴 *ATENCIÓN EQUIPO Y LIDERAZGOS COMUNALES:* \n\nAcabamos de publicar una propuesta clave para nuestra comunidad sobre *${topic}*. Necesitamos que el mensaje llegue a todos los rincones del territorio.\n\n📲 *Apóyanos dando Like, comentando y compartiendo:* \n${trackingLink}\n\n¡Unidos hacemos la fuerza! 🤝`,
            activismo_rapido: `⚡ *ORDEN DEL DÍA - BRIGADA DIGITAL:* \n\nPublicación estratégica en el aire sobre *${topic}*. Objetivo: lograr 100 compartidos en la primera hora.\n\n🔗 *Enlace de réplica:* \n${trackingLink}\n\n✅ Entra, dale amor, comenta tu apoyo y pasa la voz a tus contactos. ¡Vamos con toda!`
        };

        // Recomendación técnica de Audio y Formato
        const recomendacion_tecnica = {
            formato_visual: 'Video Vertical 9:16 grabado en plano medio, con luz frontal y subtítulos dinámicos de colores (amarillo y blanco) en la zona central.',
            audio_tendencia: 'Audio instrumental de fondo tipo "Cinematic Tension" o "Inspiring Lo-Fi" al 10% de volumen, manteniendo la voz del candidato clara al 90%.',
            duracion_ideal: platform === 'tiktok' ? '32 a 45 segundos' : platform === 'instagram' ? '45 a 60 segundos' : '1:30 minutos',
            horario_oro: platform === 'tiktok' ? '12:30 PM - 01:30 PM o 07:30 PM - 09:30 PM' : '06:45 PM - 08:30 PM'
        };

        // Hashtags Estratégicos
        const hashtags = [
            '#ColombiaUnida2026',
            `#${topic.replace(/\s+/g, '')}`,
            '#ElPoderDeLaGente',
            '#Elecciones2026',
            '#ViralColombia',
            '#ParaTi'
        ];

        res.json({
            success: true,
            post_id: post ? post.id : null,
            titulo: titleText,
            plataforma: platform,
            viral_score: score,
            diagnostico,
            ganchos_virales,
            protocolo_30_minutos,
            copys_whatsapp,
            recomendacion_tecnica,
            hashtags
        });
    } catch (error) {
        console.error('Error en getViralAdvisorAnalysis:', error);
        res.status(500).json({ message: 'Error al generar análisis de viralidad', error: error.message });
    }
};

/**
 * CHAT / CONSULTA DIRECTA AL ASESOR VIRTUAL DE VIRALIDAD
 */
exports.chatWithViralAdvisor = async (req, res) => {
    try {
        const { pregunta, contexto_post } = req.body;
        if (!pregunta) {
            return res.status(400).json({ message: 'La pregunta es requerida' });
        }

        const q = pregunta.toLowerCase();
        let respuesta = '';
        let sugerencias = [];

        if (q.includes('hora') || q.includes('horario') || q.includes('cuando publicar')) {
            respuesta = '⏰ **Horarios Dorados para Viralidad Electoral en Colombia:**\n\n1. **TikTok & Instagram:** 12:30 PM a 1:45 PM (almuerzo) y 7:45 PM a 9:30 PM (cuando la gente llega a casa y revisa el feed).\n2. **X (Twitter):** 6:45 AM a 8:15 AM (agenda noticiosa de la mañana) y 1:00 PM (debate del medio día).\n3. **Facebook:** 7:00 PM a 9:00 PM (mayor tiempo de visualización de videos familiares).\n\n💡 *Consejo de Oro:* Publica 15 minutos antes de la hora pico para que cuando los usuarios abran la app, tu video ya tenga las primeras interacciones del equipo cargadas.';
            sugerencias = ['¿Cómo activar a la brigada digital en los primeros 15 minutos?', '¿Qué audio en tendencia usar hoy?'];
        } else if (q.includes('ataque') || q.includes('trolls') || q.includes('negativo') || q.includes('critica') || q.includes('bodega')) {
            respuesta = '🛡️ **Estrategia Asesora ante Ataques y Bodegas Digitales:**\n\n1. **NO caigas en la trampa de insultar:** Las bodegas buscan sacarte de casillas para desviar el debate.\n2. **Usa el "Jiu-Jitsu Digital":** El algoritmo premia el número de comentarios sin distinguir si son a favor o en contra. Responde a 2 o 3 comentarios con datos contundentes y respetuosos (ej. *“Agradecemos tu inquietud, aquí te compartimos el enlace con los datos auditados donde se demuestra lo contrario...”*).\n3. **Activa a tu equipo:** Envía el enlace a tus grupos de avanzada para que dejen reacciones positivas que desplacen los insultos al fondo.';
            sugerencias = ['¿Cómo armar una cadena de WhatsApp para contrarrestar fakenews?', 'Ver radar de oposición'];
        } else if (q.includes('gancho') || q.includes('hook') || q.includes('empezar') || q.includes('titulo')) {
            respuesta = '🎯 **Estructura de un Gancho Viral en 3 Segundos:**\n\n• **Prohibido:** Saludar (“Hola amigos, ¿cómo están? Hoy les vengo a hablar de...”). La gente deslizará antes del segundo 2.\n• **Fórmula Ganadora:** [Problema/Indignación] + [Cifra o Secreto] + [Solución Inmediata].\n• **Ejemplo para video:** Aparecer en pantalla con gesto de asombro o mirando a la cámara y decir de inmediato: *“Si te dijeron que el problema de la salud era culpa de los médicos, te mintieron por completo. Mira esto...”*';
            sugerencias = ['Generar 3 ganchos para mi próxima propuesta', '¿Qué formato de subtítulos retiene más?'];
        } else if (q.includes('whatsapp') || q.includes('cadena') || q.includes('reenviar')) {
            respuesta = '📲 **Claves para Cadenas Virales de WhatsApp:**\n\n1. **Usa párrafos de máximo 2 líneas** con emojis bien seleccionados.\n2. **Incluye el link del candidato** (`/r/:id`) para saber cuántas personas abrieron la publicación.\n3. **Agrega un llamado directo:** *“Reenvía este video a 3 personas que conozcas que estén preocupadas por este tema”*. Si no pides el reenvío explícitamente, la tasa de viralidad cae un 65%.';
            sugerencias = ['Copiar plantilla de WhatsApp para jóvenes', 'Copiar plantilla para líderes comunitarios'];
        } else {
            respuesta = `🚀 **Diagnóstico del Asesor Virtual:**\n\nPara maximizar el impacto de tu campaña en redes sociales, la clave no es pagar publicidad masiva, sino **activar el motor de recomendación orgánica**:\n\n1. **Retención de Video:** Los primeros 3 segundos deciden todo.\n2. **Comentarios de Calidad:** Lograr que 15 miembros del equipo comenten preguntas de debate en los primeros 15 minutos.\n3. **Amplificación en WhatsApp:** Mover el enlace oficial en redes comunitarias para traer tráfico externo que premia el algoritmo.`;
            sugerencias = ['¿Cómo viralizar en TikTok?', '¿Qué hacer en los primeros 30 minutos de publicación?'];
        }

        res.json({
            success: true,
            respuesta,
            sugerencias,
            hora_asesoria: new Date().toLocaleTimeString('es-CO')
        });
    } catch (error) {
        console.error('Error en chatWithViralAdvisor:', error);
        res.status(500).json({ message: 'Error en consulta con asesor virtual', error: error.message });
    }
};

/**
 * SEGUIMIENTO A LOS EN VIVO EN TODAS LAS REDES (MULTIRRED LIVE WAR ROOM)
 */
exports.getLiveStreamMonitor = async (req, res) => {
    try {
        const { campana_id } = req.query;
        const where = { en_vivo: true };
        if (campana_id) where.campana_id = parseInt(campana_id, 10);

        const livePosts = await SocialMediaPost.findAll({
            where,
            order: [['espectadores_en_vivo', 'DESC']]
        });

        // Totales consolidados
        let totalEspectadores = 0;
        let picoMaximo = 0;
        let redLider = 'TikTok';
        let maxViewers = 0;

        livePosts.forEach(p => {
            const viewers = p.espectadores_en_vivo || 0;
            totalEspectadores += viewers;
            if ((p.pico_espectadores || 0) > picoMaximo) picoMaximo = p.pico_espectadores;
            if (viewers > maxViewers) {
                maxViewers = viewers;
                redLider = p.plataforma;
            }
        });

        // Chat multired simulado con clasificación estratégica adaptado al candidato
        const camp = campana_id ? await Campaign.findByPk(campana_id) : null;
        const candNombre = camp ? camp.candidato : 'el Candidato';
        const primerNombre = candNombre.split(' ')[0];

        const comentariosEnVivo = [
            { id: 1, plataforma: 'tiktok', usuario: 'valentina_joven26', texto: '¡Excelente propuesta de empleo joven! Ojalá apoyen a los recién graduados sin experiencia.', tipo: 'apoyo', tiempo: 'hace 10s', destacada: false },
            { id: 2, plataforma: 'facebook', usuario: 'Don Hernando Comunal', texto: `¿${primerNombre}, qué pasará con el presupuesto para los acueductos veredales y vías en Santander?`, tipo: 'pregunta', tiempo: 'hace 22s', destacada: true },
            { id: 3, plataforma: 'instagram', usuario: 'camilo.medina_col', texto: `¡${primerNombre} tiene las cifras claras! Saludos desde Bucaramanga 👏🔥`, tipo: 'apoyo', tiempo: 'hace 45s', destacada: false },
            { id: 4, plataforma: 'twitter', usuario: '@critico_politico', texto: '¿Y de dónde van a salir los recursos para financiar esas reformas? Queremos ver el costo fiscal.', tipo: 'pregunta', tiempo: 'hace 1m', destacada: true },
            { id: 5, plataforma: 'tiktok', usuario: 'usuario98214_bot', texto: 'Son promesas vacías, no les crean nada.', tipo: 'ataque', tiempo: 'hace 1m', destacada: false },
            { id: 6, plataforma: 'youtube', usuario: 'Prof. Santiago Uribe', texto: 'Pregunta para el panel: ¿Cómo articular la educación técnica con la industria y el agro regional?', tipo: 'pregunta', tiempo: 'hace 2m', destacada: true },
            { id: 7, plataforma: 'facebook', usuario: 'Marta Cecilia Gómez', texto: `¡Fuerza ${primerNombre}, las mujeres y familias estamos contigo! ❤️🇨🇴`, tipo: 'apoyo', tiempo: 'hace 2m', destacada: false }
        ];

        res.json({
            success: true,
            livePosts,
            resumen: {
                totalEspectadores,
                picoMaximo,
                redLider,
                canalesActivos: livePosts.length,
                duracionPromedio: livePosts[0]?.duracion_en_vivo || '00:45:00',
                estadoGeneral: livePosts.length > 0 ? 'EN VIVO AHORA' : 'Sin transmisiones activas'
            },
            comentariosEnVivo
        });
    } catch (error) {
        console.error('Error al obtener monitor de en vivo:', error);
        res.status(500).json({ message: 'Error al obtener monitor de en vivo', error: error.message });
    }
};

/**
 * ALERTA DE DESPLIEGUE MASIVO AL EN VIVO (WHATSAPP DEFENSA / AMPLIFICACIÓN)
 */
exports.dispatchLiveSupportAlert = async (req, res) => {
    try {
        const { plataforma, liveUrl, campana_id } = req.body;
        const msg = `🚨 *¡CANDIDATO EN VIVO EN ESTE MOMENTO!* 🚨\n\nEstamos transmitiendo en directo en *${(plataforma || 'TODAS LAS REDES').toUpperCase()}*.\n\n👉 *Conéctate ya, deja tu reacción (❤️/🔥) y comparte con 3 amigos:* \n${liveUrl || 'http://localhost:3000/social'}\n\n¡Hagamos que el algoritmo reviente las tendencias nacionales! 🚀`;

        res.json({
            success: true,
            mensaje_alerta: msg,
            grupos_notificados: ['Comité de Avanzada', 'Juventudes Digitales', 'Líderes Comunales WhatsApp', 'Brigada de Defensa y Medios'],
            hora: new Date().toLocaleTimeString('es-CO')
        });
    } catch (error) {
        console.error('Error al despachar alerta de en vivo:', error);
        res.status(500).json({ message: 'Error al despachar alerta de en vivo', error: error.message });
    }
};

/**
 * BARRIDO INTEGRAL DE REDES SOCIALES DEL CANDIDATO DE LA CAMPAÑA
 */
exports.executeCandidateSweep = async (req, res) => {
    try {
        const { campana_id } = req.body;
        const activeCampanaId = campana_id || req.user?.campana_id || req.campana_id;
        if (!activeCampanaId) {
            return res.status(400).json({ success: false, message: 'Se requiere el ID de la campaña para ejecutar el barrido' });
        }
        const result = await socialSyncService.executeFullCandidateSweep({ campanaId: parseInt(activeCampanaId, 10) });
        res.json(result);
    } catch (error) {
        console.error('Error al ejecutar barrido de redes del candidato:', error);
        res.status(500).json({ success: false, message: 'Error al ejecutar barrido de redes', error: error.message });
    }
};

/**
 * SINCRONIZACIÓN DE PERFIL SOCIAL CON EXTRACCIÓN DE POSTS Y COMENTARIOS
 */
exports.syncProfile = async (req, res) => {
    try {
        const { url, campana_id } = req.body;
        const activeCampanaId = campana_id || req.user?.campana_id || req.campana_id;
        if (!activeCampanaId) {
            return res.status(400).json({ success: false, message: 'Se requiere el ID de la campaña para sincronizar perfil' });
        }
        if (!url) {
            return res.status(400).json({ success: false, message: 'La URL o link de la red social es requerida' });
        }
        const result = await socialSyncService.syncProfileFromUrl({ url, campanaId: parseInt(activeCampanaId, 10) });
        res.json(result);
    } catch (error) {
        console.error('Error al sincronizar perfil de red social:', error);
        res.status(500).json({ success: false, message: 'Error al sincronizar perfil', error: error.message });
    }
};

/**
 * IMPORTACIÓN DE BASE DE DATOS DEL EQUIPO (EXCEL / CSV / JSON)
 * Cruza automáticamente con los comentarios existentes para identificar quién es del equipo
 */
exports.importTeamDatabase = async (req, res) => {
    try {
        const { members, campana_id } = req.body;
        const activeCampanaId = campana_id || req.user?.campana_id || 1;
        if (!members || !Array.isArray(members) || members.length === 0) {
            return res.status(400).json({ success: false, message: 'Debe proporcionar la lista de integrantes del equipo' });
        }
        const result = await socialSyncService.importTeamMembers({ members, campanaId: activeCampanaId });
        res.json(result);
    } catch (error) {
        console.error('Error al importar base de datos del equipo:', error);
        res.status(500).json({ success: false, message: 'Error al importar equipo', error: error.message });
    }
};

/**
 * CONSULTA DE COMENTARIOS DE UNA PUBLICACIÓN CON AUDITORÍA DEL EQUIPO
 */
exports.getPostComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await SocialMediaPost.findByPk(postId);
        const campana_id = post?.campana_id || req.query.campana_id || req.user?.campana_id || 1;
        const result = await socialSyncService.getPostCommentsWithAudit(postId, campana_id);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Error al obtener comentarios y auditoría del equipo:', error);
        res.status(500).json({ success: false, message: 'Error al obtener comentarios', error: error.message });
    }
};

/**
 * RESPUESTA A UN COMENTARIO DESDE LA PLATAFORMA
 */
exports.replyToComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { respuesta_texto } = req.body;
        const comment = await SocialPostComment.findByPk(commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comentario no encontrado' });
        }
        comment.respondido = true;
        comment.respuesta_texto = respuesta_texto;
        await comment.save();
        res.json({ success: true, comment });
    } catch (error) {
        console.error('Error al responder comentario:', error);
        res.status(500).json({ success: false, message: 'Error al responder comentario', error: error.message });
    }
};

/**
 * CONSULTA GLOBAL DE COMENTARIOS Y REACCIONES (VIGILANCIA DE REDES SOCIALES / SOCIAL LISTENING)
 */
exports.getAllComments = async (req, res) => {
    try {
        const { campana_id, post_id, sentimiento, es_equipo_campana, plataforma } = req.query;
        const where = {};
        if (campana_id) where.campana_id = parseInt(campana_id, 10);
        if (post_id) where.post_id = parseInt(post_id, 10);
        if (sentimiento && sentimiento !== 'todos') where.sentimiento = sentimiento;
        if (plataforma && plataforma !== 'todas') where.plataforma = plataforma;
        if (es_equipo_campana !== undefined && es_equipo_campana !== 'todos') {
            where.es_equipo_campana = es_equipo_campana === 'true' || es_equipo_campana === true;
        }

        const comments = await SocialPostComment.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });

        // Obtener referencias de posts para asociar título y URL de publicación
        const postIds = [...new Set(comments.map(c => c.post_id))];
        const posts = await SocialMediaPost.findAll({
            where: { id: postIds },
            attributes: ['id', 'titulo', 'url_publicacion', 'plataforma', 'autor_usuario']
        });
        const postsMap = {};
        posts.forEach(p => { postsMap[p.id] = p; });

        const enrichedComments = comments.map(c => {
            const commentObj = c.toJSON();
            commentObj.post = postsMap[c.post_id] || null;
            return commentObj;
        });

        const total = comments.length;
        const equipoCount = comments.filter(c => c.es_equipo_campana).length;
        const ciudadanosCount = comments.filter(c => !c.es_equipo_campana).length;
        const positivosCount = comments.filter(c => c.sentimiento === 'positivo').length;
        const negativosCount = comments.filter(c => c.sentimiento === 'negativo').length;
        const neutrosCount = comments.filter(c => c.sentimiento === 'neutral').length;

        res.json({
            success: true,
            comments: enrichedComments,
            resumen: {
                total,
                equipoCount,
                ciudadanosCount,
                positivosCount,
                negativosCount,
                neutrosCount
            }
        });
    } catch (error) {
        console.error('Error al obtener vigilancia de comentarios:', error);
        res.status(500).json({ success: false, message: 'Error al obtener comentarios de vigilancia', error: error.message });
    }
};

/**
 * EXPORTACIÓN A EXCEL DE PUBLICACIONES, COMENTARIOS Y WAR ROOM
 */
exports.exportSocialExcel = async (req, res) => {
    try {
        const ExcelJS = require('exceljs');
        const Campaign = require('../models/Campaign');
        const activeCampanaId = req.query.campana_id || req.user?.campana_id || 7;
        const campaign = await Campaign.findByPk(activeCampanaId);
        const candidatoNombre = campaign ? campaign.candidato : 'Candidato';

        const posts = await SocialMediaPost.findAll({
            where: { campana_id: activeCampanaId },
            order: [['createdAt', 'DESC']]
        });

        const postIds = posts.map(p => p.id);
        const comments = await SocialPostComment.findAll({
            where: { post_id: postIds },
            order: [['createdAt', 'DESC']]
        });

        const attacks = await SocialCompetitorAttack.findAll({
            where: { campana_id: activeCampanaId },
            order: [['createdAt', 'DESC']]
        });

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Sistema Electoral Estratégico';
        workbook.created = new Date();

        // 1. Hoja: Publicaciones Oficiales
        const sheetPosts = workbook.addWorksheet('Publicaciones Oficiales');
        sheetPosts.columns = [
            { header: 'ID', key: 'id', width: 8 },
            { header: 'Plataforma', key: 'plataforma', width: 14 },
            { header: 'Autor', key: 'autor', width: 22 },
            { header: 'Título de la Publicación', key: 'titulo', width: 45 },
            { header: 'Tipo Contenido', key: 'tipo', width: 14 },
            { header: 'Alcance', key: 'alcance', width: 12 },
            { header: 'Impresiones', key: 'impresiones', width: 14 },
            { header: 'Reproducciones', key: 'reproducciones', width: 16 },
            { header: 'Likes', key: 'likes', width: 10 },
            { header: 'Comentarios', key: 'comentarios', width: 14 },
            { header: 'Compartidos', key: 'compartidos', width: 14 },
            { header: 'Tema Estratégico', key: 'tema', width: 30 },
            { header: 'Enlace Oficial', key: 'url', width: 40 },
            { header: 'Texto / Copy Completo', key: 'contenido', width: 60 }
        ];

        sheetPosts.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheetPosts.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B894' } };

        posts.forEach(p => {
            sheetPosts.addRow({
                id: p.id,
                plataforma: (p.plataforma || '').toUpperCase(),
                autor: p.autor_usuario || p.autor_nombre,
                titulo: p.titulo,
                tipo: p.tipo_contenido,
                alcance: p.alcance || 0,
                impresiones: p.impresiones || 0,
                reproducciones: p.reproducciones || 0,
                likes: p.likes || 0,
                comentarios: p.comentarios_conteo || 0,
                compartidos: p.compartidos || 0,
                tema: p.tema_estrategico || 'General',
                url: p.url_publicacion,
                contenido: p.contenido
            });
        });

        // 2. Hoja: Comentarios y Auditoría del Equipo
        const sheetComments = workbook.addWorksheet('Comentarios y Apoyo Equipo');
        sheetComments.columns = [
            { header: 'ID Post', key: 'post_id', width: 10 },
            { header: 'Plataforma', key: 'plataforma', width: 14 },
            { header: 'Usuario Red', key: 'usuario_red', width: 25 },
            { header: 'Nombre Mostrado', key: 'nombre_usuario', width: 25 },
            { header: 'Comentario', key: 'texto_comentario', width: 55 },
            { header: 'Sentimiento', key: 'sentimiento', width: 14 },
            { header: 'Tipo Reacción', key: 'tipo_reaccion', width: 16 },
            { header: '¿Es Miembro Equipo?', key: 'es_equipo', width: 20 },
            { header: 'Nombre en Equipo', key: 'equipo_nombre', width: 25 },
            { header: 'Rol en Campaña', key: 'equipo_rol', width: 25 },
            { header: 'Likes Comentario', key: 'likes', width: 16 }
        ];

        sheetComments.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheetComments.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };

        comments.forEach(c => {
            sheetComments.addRow({
                post_id: c.post_id,
                plataforma: (c.plataforma || '').toUpperCase(),
                usuario_red: c.usuario_red,
                nombre_usuario: c.nombre_usuario,
                texto_comentario: c.texto_comentario,
                sentimiento: c.sentimiento,
                tipo_reaccion: c.tipo_reaccion,
                es_equipo: c.es_equipo_campana ? 'SÍ (IDENTIFICADO)' : 'NO (CIUDADANO)',
                equipo_nombre: c.equipo_nombre || '-',
                equipo_rol: c.equipo_rol || '-',
                likes: c.likes_comentario || 0
            });
        });

        // 3. Hoja: Radar de Oposición & War Room
        const sheetAttacks = workbook.addWorksheet('Radar Oposición y War Room');
        sheetAttacks.columns = [
            { header: 'ID', key: 'id', width: 8 },
            { header: 'Adversario', key: 'adversario', width: 30 },
            { header: 'Plataforma', key: 'plataforma', width: 14 },
            { header: 'Blanco Ataque', key: 'blanco', width: 20 },
            { header: 'Descripción Blanco', key: 'desc_blanco', width: 35 },
            { header: 'Contenido del Ataque', key: 'contenido', width: 60 },
            { header: 'Nivel Amenaza', key: 'amenaza', width: 14 },
            { header: 'Táctica Recomendada', key: 'tactica', width: 20 },
            { header: 'Guion Candidato', key: 'guion_candidato', width: 50 },
            { header: 'Guion Voceros', key: 'guion_voceros', width: 50 },
            { header: 'Guion Tropa Digital', key: 'guion_tropa', width: 50 },
            { header: 'Guion Debates en Vivo', key: 'guion_debate', width: 50 }
        ];

        sheetAttacks.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheetAttacks.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };

        attacks.forEach(a => {
            sheetAttacks.addRow({
                id: a.id,
                adversario: a.adversario_nombre,
                plataforma: (a.plataforma || '').toUpperCase(),
                blanco: a.blanco_ataque,
                desc_blanco: a.descripcion_blanco,
                contenido: a.contenido_ataque,
                amenaza: a.nivel_amenaza,
                tactica: a.tactica_recomendada,
                guion_candidato: a.guion_candidato,
                guion_voceros: a.guion_voceros,
                guion_tropa: a.guion_tropa_digital,
                guion_debate: a.guion_debates
            });
        });

        const safeFilename = `publicaciones_${candidatoNombre.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error al exportar publicaciones a Excel:', error);
        res.status(500).json({ success: false, message: 'Error al exportar a Excel', error: error.message });
    }
};

