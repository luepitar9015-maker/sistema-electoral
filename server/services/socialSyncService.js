const { Op } = require('sequelize');
const SocialMediaPost = require('../models/SocialMediaPost');
const SocialTeamAccount = require('../models/SocialTeamAccount');
const SocialPostComment = require('../models/SocialPostComment');
const SocialAccount = require('../models/SocialAccount');
const SocialConnection = require('../models/SocialConnection');
const SocialTeamInteraction = require('../models/SocialTeamInteraction');
const SocialSyncJob = require('../models/SocialSyncJob');
const SocialSyncError = require('../models/SocialSyncError');
const SocialAuditLog = require('../models/SocialAuditLog');
const Campaign = require('../models/Campaign');
const { getConnector } = require('./socialConnectors');
const { classifyComment, checkAndCreateContentAlert } = require('./commentClassifierService');

function normalizeHandle(handle) {
    if (!handle) return '';
    let clean = String(handle).trim().toLowerCase();
    if (!clean.startsWith('@')) clean = '@' + clean;
    return clean;
}

function parseProfileUrl(url) {
    if (!url) return { platform: 'instagram', handle: '@campana', cleanUrl: '' };

    const rawUrl = url.trim();
    let cleanUrl = rawUrl.replace(/\/$/, '');
    let platform = 'instagram';
    let handle = '';

    if (/youtube\.com|youtu\.be/i.test(rawUrl)) {
        platform = 'youtube';
        const videoMatch = rawUrl.match(/(?:[?&]v=|\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
        if (videoMatch) {
            handle = `video_${videoMatch[1]}`;
            cleanUrl = `https://www.youtube.com/watch?v=${videoMatch[1]}`;
        } else {
            const match = cleanUrl.replace(/\?.*$/, '').match(/youtube\.com\/(?:@|channel\/|user\/)?([^/?#]+)/i);
            handle = match ? match[1] : '';
            cleanUrl = cleanUrl.replace(/\?.*$/, '');
        }
    } else if (/facebook\.com/i.test(cleanUrl)) {
        platform = 'facebook';
        cleanUrl = cleanUrl.replace(/\?.*$/, '');
        const match = cleanUrl.match(/facebook\.com\/([^/?#]+)/i);
        handle = match ? match[1] : '';
    } else if (/instagram\.com/i.test(cleanUrl)) {
        platform = 'instagram';
        cleanUrl = cleanUrl.replace(/\?.*$/, '');
        const match = cleanUrl.match(/instagram\.com\/([^/?#]+)/i);
        handle = match ? match[1] : '';
    } else if (/twitter\.com|x\.com/i.test(cleanUrl)) {
        platform = 'twitter';
        cleanUrl = cleanUrl.replace(/\?.*$/, '');
        const match = cleanUrl.match(/(?:twitter|x)\.com\/([^/?#]+)/i);
        handle = match ? match[1] : '';
    } else if (/tiktok\.com/i.test(cleanUrl)) {
        platform = 'tiktok';
        const videoMatch = rawUrl.match(/\/video\/(\d+)/i);
        if (videoMatch) {
            handle = `video_${videoMatch[1]}`;
            cleanUrl = rawUrl.replace(/\?.*$/, '');
        } else {
            cleanUrl = cleanUrl.replace(/\?.*$/, '');
            const match = cleanUrl.match(/tiktok\.com\/@?([^/?#]+)/i);
            handle = match ? match[1] : '';
        }
    }

    return {
        platform,
        handle: normalizeHandle(handle),
        cleanUrl
    };
}

/**
 * Coincidencia estricta de integrante del equipo.
 * REGLA ESTRICTA DE LA ORDEN MAESTRA:
 * "Evitar registros duplicados y atribuciones basadas únicamente en nombres similares.
 * El sistema no atribuye comentarios a un integrante por coincidencias parciales de nombre."
 * Solo coincide por handle exacto o identificador externo del miembro con consentimiento voluntario.
 */
async function matchTeamMember(campanaId, authorHandle, authorExternalId = null) {
    if (!authorHandle && !authorExternalId) {
        return { isTeam: false, teamMember: null };
    }

    const normHandle = normalizeHandle(authorHandle);
    const bareHandle = normHandle.replace(/^@/, '');

    const whereConditions = [
        { usuario_handle: normHandle },
        { usuario_handle: bareHandle },
        { usuario_handle: '@' + bareHandle }
    ];

    if (authorExternalId) {
        whereConditions.push({ id_externo_usuario: String(authorExternalId) });
    }

    const teamMember = await SocialTeamAccount.findOne({
        where: {
            campana_id: campanaId,
            consentimiento_vinculacion: true,
            [Op.or]: whereConditions
        }
    });

    if (teamMember) {
        return {
            isTeam: true,
            teamMemberId: teamMember.id,
            teamMemberName: teamMember.nombre_miembro,
            teamMemberRole: teamMember.rol_equipo,
            teamMemberHandle: teamMember.usuario_handle
        };
    }

    return { isTeam: false, teamMemberId: null, teamMemberName: null, teamMemberRole: null, teamMemberHandle: null };
}

/**
 * Registra o actualiza una cuenta monitoreada (propia o de terceros)
 */
async function registerMonitoredAccount({ campanaId, url, platform, tipoCuenta = 'public_third_party', handle = null, nombreMostrado = null }) {
    const parsed = parseProfileUrl(url);
    const effPlatform = platform || parsed.platform;
    const effHandle = normalizeHandle(handle || parsed.handle);
    const connector = getConnector(effPlatform);
    const credentials = await connector.getCredentials(campanaId);

    let resolvedData = {
        external_account_id: null,
        nombre_mostrado: nombreMostrado || effHandle.replace('@', ''),
        avatar_url: null,
        url_perfil: parsed.cleanUrl || url,
        total_seguidores: 0,
        total_publicaciones: 0,
        raw_data: null
    };

    let syncStatus = 'pending';
    let syncStatusDetail = null;

    if (credentials.available) {
        try {
            const apiAccount = await connector.resolveAccount(url || effHandle, credentials);
            resolvedData = {
                external_account_id: apiAccount.external_account_id,
                nombre_mostrado: apiAccount.nombre_mostrado || resolvedData.nombre_mostrado,
                avatar_url: apiAccount.avatar_url,
                url_perfil: apiAccount.url_perfil || resolvedData.url_perfil,
                total_seguidores: apiAccount.total_seguidores || 0,
                total_publicaciones: apiAccount.total_publicaciones || 0,
                raw_data: apiAccount.raw_data
            };
            syncStatus = 'active';
            syncStatusDetail = 'Cuenta verificada y conectada con la API oficial';
        } catch (err) {
            syncStatus = 'restricted';
            syncStatusDetail = err.message;
        }
    } else {
        syncStatus = 'restricted';
        syncStatusDetail = credentials.reason;
    }

    const [account, created] = await SocialAccount.findOrCreate({
        where: {
            campana_id: campanaId,
            plataforma: effPlatform,
            handle: effHandle
        },
        defaults: {
            campana_id: campanaId,
            plataforma: effPlatform,
            tipo_cuenta: tipoCuenta,
            handle: effHandle,
            nombre_mostrado: resolvedData.nombre_mostrado,
            external_account_id: resolvedData.external_account_id,
            url_perfil: resolvedData.url_perfil,
            avatar_url: resolvedData.avatar_url,
            total_seguidores: resolvedData.total_seguidores,
            total_publicaciones: resolvedData.total_publicaciones,
            sync_status: syncStatus,
            sync_status_detail: syncStatusDetail,
            is_active: true
        }
    });

    if (!created) {
        account.tipo_cuenta = tipoCuenta || account.tipo_cuenta;
        if (resolvedData.external_account_id) account.external_account_id = resolvedData.external_account_id;
        if (resolvedData.nombre_mostrado) account.nombre_mostrado = resolvedData.nombre_mostrado;
        if (resolvedData.avatar_url) account.avatar_url = resolvedData.avatar_url;
        if (resolvedData.url_perfil) account.url_perfil = resolvedData.url_perfil;
        account.sync_status = syncStatus;
        account.sync_status_detail = syncStatusDetail;
        await account.save();
    }

    return account;
}

/**
 * Sincronización oficial de publicaciones y comentarios reales de una cuenta
 */
async function syncAccountPostsAndComments({ accountId, campanaId, limit = 20, syncOrigin = 'manual_usuario' }) {
    const account = await SocialAccount.findByPk(accountId);
    if (!account) {
        throw new Error(`Cuenta social con ID ${accountId} no encontrada`);
    }

    const effectiveCampanaId = campanaId || account.campana_id;
    const connector = getConnector(account.plataforma);
    const credentials = await connector.getCredentials(effectiveCampanaId, account.id);

    // Iniciar trabajo de sincronización en BD
    const job = await SocialSyncJob.create({
        campana_id: effectiveCampanaId,
        account_id: account.id,
        plataforma: account.plataforma,
        tipo_origen: syncOrigin,
        estado: 'running',
        iniciado_en: new Date()
    });

    const targetUrl = account.url_perfil || account.url || '';
    const isPublicVideoUrl = !!(
        (account.plataforma === 'youtube' && targetUrl.match(/(?:[?&]v=|\/shorts\/|youtu\.be\/)[a-zA-Z0-9_-]{11}/i)) ||
        (account.plataforma === 'tiktok' && (targetUrl.includes('/video/') || targetUrl.includes('tiktok.com')))
    );

    if (!credentials.available && !isPublicVideoUrl) {
        account.sync_status = 'restricted';
        account.sync_status_detail = credentials.reason;
        await account.save();

        job.estado = 'failed';
        job.finalizado_en = new Date();
        job.mensaje_error = credentials.reason;
        await job.save();

        await SocialSyncError.create({
            sync_job_id: job.id,
            campana_id: effectiveCampanaId,
            plataforma: account.plataforma,
            tipo_error: 'missing_credentials_or_unauthorized',
            mensaje_tecnico: credentials.reason,
            explicacion_usuario: credentials.reason,
            es_recuperable: false
        });

        return {
            success: false,
            platform: account.plataforma,
            postsCreated: 0,
            commentsCreated: 0,
            status: 'restricted',
            technicalNotice: credentials.reason
        };
    }

    try {
        // 1. Obtener publicaciones reales desde la API oficial
        const postResult = await connector.fetchPosts({ account, credentials, limit });
        const fetchedPosts = postResult.posts || [];
        let postsCreatedCount = 0;
        let postsUpdatedCount = 0;
        let totalCommentsFetched = 0;
        let verifiedTeamInteractionsCount = 0;

        for (const p of fetchedPosts) {
            // Deduplicación estricta por [plataforma, external_id]
            let post = await SocialMediaPost.findOne({
                where: {
                    plataforma: p.plataforma,
                    external_id: p.external_id
                }
            });

            if (!post) {
                post = await SocialMediaPost.create({
                    campana_id: effectiveCampanaId,
                    account_id: account.id,
                    external_id: p.external_id,
                    source_type: account.tipo_cuenta,
                    plataforma: p.plataforma,
                    titulo: p.titulo,
                    contenido: p.contenido,
                    url_publicacion: p.url_publicacion,
                    autor_nombre: p.autor_nombre,
                    autor_usuario: p.autor_usuario,
                    fecha_publicacion: p.fecha_publicacion || new Date().toISOString(),
                    tipo_contenido: p.tipo_contenido || 'imagen',
                    alcance: p.alcance || 0,
                    impresiones: p.impresiones || 0,
                    reproducciones: p.reproducciones || 0,
                    interacciones: p.interacciones || 0,
                    compartidos: p.compartidos || 0,
                    comentarios_conteo: p.comentarios_conteo || 0,
                    likes: p.likes || 0,
                    me_encanta: p.me_encanta || 0,
                    me_enoja: p.me_enoja || 0,
                    video_url: p.video_url || null,
                    is_simulation: false,
                    raw_data: p.raw_data ? JSON.stringify(p.raw_data) : null,
                    sync_status: 'synced'
                });
                postsCreatedCount++;
            } else {
                await post.update({
                    titulo: p.titulo || post.titulo,
                    contenido: p.contenido || post.contenido,
                    url_publicacion: p.url_publicacion || post.url_publicacion,
                    alcance: p.alcance || post.alcance,
                    impresiones: p.impresiones || post.impresiones,
                    reproducciones: p.reproducciones || post.reproducciones,
                    interacciones: p.interacciones || post.interacciones,
                    compartidos: p.compartidos || post.compartidos,
                    comentarios_conteo: p.comentarios_conteo || post.comentarios_conteo,
                    likes: p.likes !== undefined ? p.likes : post.likes,
                    raw_data: p.raw_data ? JSON.stringify(p.raw_data) : post.raw_data,
                    sync_status: 'synced'
                });
                postsUpdatedCount++;
            }

            // 2. Obtener comentarios reales de la publicación
            try {
                const commentResult = await connector.fetchComments({ post, credentials, limit: 50 });
                const fetchedComments = commentResult.comments || [];

                for (const c of fetchedComments) {
                    if (!c.external_id) continue;

                    // Deduplicación de comentarios por [plataforma, external_id]
                    let comment = await SocialPostComment.findOne({
                        where: {
                            plataforma: c.plataforma,
                            external_id: c.external_id
                        }
                    });

                    // Clasificación NLP
                    const classification = classifyComment(c.texto_comentario);

                    // Verificación estricta de pertenencia al equipo (match exacto de handle o ID externo)
                    const teamMatch = await matchTeamMember(effectiveCampanaId, c.usuario_red, c.autor_id_externo);

                    if (!comment) {
                        comment = await SocialPostComment.create({
                            post_id: post.id,
                            campana_id: effectiveCampanaId,
                            account_id: account.id,
                            external_id: c.external_id,
                            parent_comment_id: c.parent_comment_id || null,
                            plataforma: c.plataforma,
                            usuario_red: normalizeHandle(c.usuario_red),
                            nombre_usuario: c.nombre_usuario,
                            autor_id_externo: c.autor_id_externo || null,
                            url_comentario: c.url_comentario || post.url_publicacion,
                            texto_comentario: c.texto_comentario,
                            likes_comentario: c.likes_comentario || 0,
                            fecha_comentario: c.fecha_comentario || new Date().toISOString(),
                            sentimiento: classification.sentimiento,
                            tipo_reaccion: classification.tipo_reaccion,
                            categoria_contenido: classification.categoria,
                            nivel_confianza_ia: classification.nivel_confianza,
                            es_critica_legitima: classification.es_critica_legitima,
                            es_amenaza: classification.es_amenaza,
                            requiere_revision_humana: classification.requiere_revision_humana,
                            estado_revision: classification.requiere_revision_humana ? 'pendiente' : 'aprobado',
                            es_equipo_campana: teamMatch.isTeam,
                            equipo_miembro_id: teamMatch.teamMemberId,
                            equipo_nombre: teamMatch.teamMemberName,
                            equipo_rol: teamMatch.teamMemberRole,
                            raw_data: c.raw_data ? JSON.stringify(c.raw_data) : null
                        });
                        totalCommentsFetched++;
                    } else {
                        await comment.update({
                            likes_comentario: c.likes_comentario !== undefined ? c.likes_comentario : comment.likes_comentario,
                            es_equipo_campana: teamMatch.isTeam || comment.es_equipo_campana,
                            equipo_miembro_id: teamMatch.teamMemberId || comment.equipo_miembro_id,
                            equipo_nombre: teamMatch.teamMemberName || comment.equipo_nombre,
                            equipo_rol: teamMatch.teamMemberRole || comment.equipo_rol
                        });
                    }

                    // Verificar alertas de contenido
                    await checkAndCreateContentAlert({ comment, campanaId: effectiveCampanaId, post });

                    // Registrar interacción verificada del equipo si aplica
                    if (teamMatch.isTeam) {
                        const [interaction, intCreated] = await SocialTeamInteraction.findOrCreate({
                            where: {
                                campana_id: effectiveCampanaId,
                                post_id: post.id,
                                external_interaction_id: c.external_id
                            },
                            defaults: {
                                campana_id: effectiveCampanaId,
                                post_id: post.id,
                                team_account_id: teamMatch.teamMemberId,
                                nombre_miembro: teamMatch.teamMemberName,
                                rol_equipo: teamMatch.teamMemberRole,
                                usuario_handle: teamMatch.teamMemberHandle,
                                plataforma: c.plataforma,
                                tipo_verificacion: 'verificada', // Verificada por la API oficial
                                tipo_reaccion: 'apoyo',
                                comento: true,
                                texto_comentario: c.texto_comentario,
                                compartio: false,
                                evidencia_url: c.url_comentario || post.url_publicacion,
                                external_interaction_id: c.external_id,
                                api_verified_at: new Date(),
                                fecha_interaccion: c.fecha_comentario || new Date().toISOString()
                            }
                        });
                        if (intCreated) verifiedTeamInteractionsCount++;
                    }
                }
            } catch (commentErr) {
                console.warn(`Aviso al consultar comentarios del post ${post.id}:`, commentErr.message);
            }
        }

        // Actualizar estado de la cuenta
        account.sync_status = 'active';
        account.sync_status_detail = `Sincronización completada exitosamente. ${postsCreatedCount + postsUpdatedCount} publicaciones y ${totalCommentsFetched} comentarios analizados.`;
        account.ultimo_sync_exitoso = new Date();
        account.total_publicaciones = await SocialMediaPost.count({ where: { account_id: account.id } });
        await account.save();

        // Finalizar trabajo
        job.estado = 'completed';
        job.finalizado_en = new Date();
        job.publicaciones_obtenidas = postsCreatedCount;
        job.comentarios_obtenidos = totalCommentsFetched;
        job.registros_actualizados = postsUpdatedCount;
        job.detalles_tecnicos = JSON.stringify({
            verifiedTeamInteractions: verifiedTeamInteractionsCount,
            technicalNotice: postResult.technicalNotice || null
        });
        await job.save();

        await SocialAuditLog.create({
            campana_id: effectiveCampanaId,
            tipo_evento: 'sync_executed',
            plataforma: account.plataforma,
            entidad_afectada: 'SocialAccount',
            entidad_id: account.id,
            descripcion: `Sincronización oficial ejecutada para ${account.handle}. Publicaciones: ${postsCreatedCount}, Comentarios: ${totalCommentsFetched}`
        });

        return {
            success: true,
            platform: account.plataforma,
            handle: account.handle,
            postsCreated: postsCreatedCount,
            postsUpdated: postsUpdatedCount,
            commentsFetched: totalCommentsFetched,
            verifiedTeamInteractions: verifiedTeamInteractionsCount,
            technicalNotice: postResult.technicalNotice || null
        };
    } catch (error) {
        account.sync_status = 'error';
        account.sync_status_detail = error.message;
        await account.save();

        job.estado = 'failed';
        job.finalizado_en = new Date();
        job.mensaje_error = error.message;
        await job.save();

        await SocialSyncError.create({
            sync_job_id: job.id,
            campana_id: effectiveCampanaId,
            plataforma: account.plataforma,
            tipo_error: error.details?.errorType || 'unknown_error',
            mensaje_tecnico: error.message,
            explicacion_usuario: error.details?.userExplanation || error.message,
            es_recuperable: error.status === 429
        });

        throw error;
    }
}

/**
 * Importación voluntaria del equipo con consentimiento
 */
async function importTeamMembers({ members = [], campanaId }) {
    let createdCount = 0;
    let updatedCount = 0;

    for (const m of members) {
        if (!m.nombre_miembro || !m.usuario_handle) continue;

        const normHandle = normalizeHandle(m.usuario_handle);
        const platform = m.plataforma ? m.plataforma.toLowerCase() : 'instagram';

        const [record, created] = await SocialTeamAccount.findOrCreate({
            where: {
                campana_id: campanaId,
                usuario_handle: normHandle,
                plataforma: platform
            },
            defaults: {
                campana_id: campanaId,
                nombre_miembro: m.nombre_miembro,
                rol_equipo: m.rol_equipo || 'Activista Digital',
                plataforma: platform,
                usuario_handle: normHandle,
                url_perfil: m.url_perfil || `https://${platform}.com/${normHandle.replace('@', '')}`,
                nivel_participacion: 'Activo',
                verificado: true,
                consentimiento_vinculacion: true,
                fecha_consentimiento: new Date()
            }
        });

        if (created) {
            createdCount++;
        } else {
            record.nombre_miembro = m.nombre_miembro || record.nombre_miembro;
            record.rol_equipo = m.rol_equipo || record.rol_equipo;
            record.verificado = true;
            record.consentimiento_vinculacion = true;
            await record.save();
            updatedCount++;
        }

        // Cruzar comentarios existentes mediante coincidencia exacta de handle normalizado
        const matchingComments = await SocialPostComment.findAll({
            where: {
                campana_id: campanaId,
                plataforma: platform,
                usuario_red: {
                    [Op.in]: [normHandle, normHandle.replace(/^@/, '')]
                }
            }
        });

        for (const comment of matchingComments) {
            comment.es_equipo_campana = true;
            comment.equipo_miembro_id = record.id;
            comment.equipo_nombre = record.nombre_miembro;
            comment.equipo_rol = record.rol_equipo;
            await comment.save();

            // Registrar interacción verificada
            await SocialTeamInteraction.findOrCreate({
                where: {
                    campana_id: campanaId,
                    post_id: comment.post_id,
                    external_interaction_id: comment.external_id || `comment_${comment.id}`
                },
                defaults: {
                    campana_id: campanaId,
                    post_id: comment.post_id,
                    team_account_id: record.id,
                    nombre_miembro: record.nombre_miembro,
                    rol_equipo: record.rol_equipo,
                    usuario_handle: normHandle,
                    plataforma: platform,
                    tipo_verificacion: comment.external_id ? 'verificada' : 'declarada',
                    comento: true,
                    texto_comentario: comment.texto_comentario,
                    evidencia_url: comment.url_comentario,
                    external_interaction_id: comment.external_id || `comment_${comment.id}`,
                    api_verified_at: new Date(),
                    fecha_interaccion: comment.fecha_comentario || new Date().toISOString()
                }
            });
        }
    }

    return {
        success: true,
        createdCount,
        updatedCount,
        totalProcessed: members.length
    };
}

/**
 * Consulta de comentarios auditados para una publicación
 */
async function getPostCommentsWithAudit(postId, campanaId) {
    const post = await SocialMediaPost.findByPk(postId);
    const effectiveCampanaId = campanaId || post?.campana_id || 1;

    const comments = await SocialPostComment.findAll({
        where: { post_id: postId },
        order: [['likes_comentario', 'DESC'], ['createdAt', 'DESC']]
    });

    const teamAccounts = await SocialTeamAccount.findAll({
        where: { campana_id: effectiveCampanaId }
    });

    const teamMemberIdsWhoCommented = new Set(
        comments.filter(c => c.es_equipo_campana && c.equipo_miembro_id).map(c => c.equipo_miembro_id)
    );

    const teamCoveragePercentage = teamAccounts.length > 0
        ? Math.round((teamMemberIdsWhoCommented.size / teamAccounts.length) * 100)
        : 0;

    const pendingTeamMembers = teamAccounts.filter(
        t => !teamMemberIdsWhoCommented.has(t.id)
    ).map(t => ({
        id: t.id,
        nombre_miembro: t.nombre_miembro,
        rol_equipo: t.rol_equipo,
        usuario_handle: t.usuario_handle,
        plataforma: t.plataforma
    }));

    return {
        comments,
        audit: {
            totalComments: comments.length,
            teamCommentsCount: comments.filter(c => c.es_equipo_campana).length,
            externalCommentsCount: comments.filter(c => !c.es_equipo_campana).length,
            teamMembersParticipating: teamMemberIdsWhoCommented.size,
            totalTeamMembers: teamAccounts.length,
            coveragePercentage: teamCoveragePercentage,
            pendingTeamMembers
        }
    };
}

/**
 * Punto de entrada compatible para sincronizar desde URL
 */
async function syncProfileFromUrl({ url, campanaId, tipoCuenta = 'public_third_party' }) {
    const parsed = parseProfileUrl(url);
    const account = await registerMonitoredAccount({
        campanaId,
        url: parsed.cleanUrl || url,
        platform: parsed.platform,
        tipoCuenta,
        handle: parsed.handle
    });

    return await syncAccountPostsAndComments({
        accountId: account.id,
        campanaId,
        limit: 15,
        syncOrigin: 'manual_usuario'
    });
}

module.exports = {
    normalizeHandle,
    parseProfileUrl,
    matchTeamMember,
    registerMonitoredAccount,
    syncAccountPostsAndComments,
    syncProfileFromUrl,
    importTeamMembers,
    getPostCommentsWithAudit
};
