const BaseConnector = require('./BaseConnector');
const SocialConnection = require('../../models/SocialConnection');

/**
 * MetaConnector - Conector oficial para Meta Graph API v20.0
 * Compatible con Páginas de Facebook y Cuentas Profesionales de Instagram
 */
class MetaConnector extends BaseConnector {
    constructor() {
        super('meta');
        this.graphVersion = 'v20.0';
        this.graphBaseUrl = `https://graph.facebook.com/${this.graphVersion}`;
    }

    async getCredentials(campanaId, accountId = null, platform = 'facebook') {
        let connection = null;
        if (accountId) {
            connection = await SocialConnection.findOne({
                where: { account_id: accountId, is_valid: true }
            });
        }
        if (!connection && campanaId) {
            connection = await SocialConnection.findOne({
                where: { campana_id: campanaId, plataforma: platform, is_valid: true }
            });
            if (!connection && platform === 'instagram') {
                // Comparten comúnmente la misma conexión de Meta
                connection = await SocialConnection.findOne({
                    where: { campana_id: campanaId, plataforma: 'facebook', is_valid: true }
                });
            }
        }

        const accessToken = connection?.token_seguro || process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_PAGE_TOKEN;

        if (!accessToken) {
            return {
                available: false,
                reason: `No disponible por restricciones de la plataforma (Falta configurar META_ACCESS_TOKEN o vincular la cuenta mediante OAuth en el sistema para ${platform})`
            };
        }

        return {
            available: true,
            accessToken,
            appId: connection?.app_id || process.env.META_APP_ID,
            scopes: connection?.permisos_otorgados ? JSON.parse(connection.permisos_otorgados) : []
        };
    }

    async testConnection(credentials) {
        if (!credentials?.available) {
            return { ok: false, message: credentials?.reason || 'Sin credenciales' };
        }
        try {
            const url = `${this.graphBaseUrl}/me?fields=id,name&access_token=${encodeURIComponent(credentials.accessToken)}`;
            const res = await this.makeRequest(url);
            return { ok: true, message: `Conexión exitosa con Meta Graph API. ID: ${res.data.id}` };
        } catch (err) {
            return { ok: false, message: err.message, details: err.details };
        }
    }

    /**
     * Resuelve una página de Facebook o cuenta de Instagram
     */
    async resolveAccount(urlOrHandle, credentials, platform = 'facebook') {
        if (!credentials?.available) {
            throw new Error(credentials.reason);
        }

        let cleanIdentifier = urlOrHandle.trim();
        if (cleanIdentifier.includes('facebook.com') || cleanIdentifier.includes('instagram.com')) {
            const parts = cleanIdentifier.replace(/\?.*$/, '').replace(/\/$/, '').split('/');
            cleanIdentifier = parts[parts.length - 1];
        }
        cleanIdentifier = cleanIdentifier.replace(/^@/, '');

        try {
            if (platform === 'facebook') {
                // Consultar información de la Página
                const url = `${this.graphBaseUrl}/${encodeURIComponent(cleanIdentifier)}?fields=id,name,username,about,link,picture,fan_count&access_token=${encodeURIComponent(credentials.accessToken)}`;
                const res = await this.makeRequest(url);
                const d = res.data;
                return {
                    platform: 'facebook',
                    external_account_id: d.id,
                    handle: d.username ? `@${d.username}` : `@${cleanIdentifier}`,
                    nombre_mostrado: d.name,
                    descripcion: d.about || '',
                    avatar_url: d.picture?.data?.url || null,
                    url_perfil: d.link || `https://www.facebook.com/${d.id}`,
                    total_seguidores: d.fan_count || 0,
                    raw_data: d
                };
            } else {
                // Para Instagram: Si es cuenta profesional conectada
                const meUrl = `${this.graphBaseUrl}/me/accounts?fields=instagram_business_account{id,username,name,profile_picture_url,biography,followers_count}&access_token=${encodeURIComponent(credentials.accessToken)}`;
                const res = await this.makeRequest(meUrl);
                const accounts = res.data?.data || [];
                let igAccount = null;

                for (const acc of accounts) {
                    if (acc.instagram_business_account) {
                        const ig = acc.instagram_business_account;
                        if (ig.username?.toLowerCase() === cleanIdentifier.toLowerCase() || ig.id === cleanIdentifier) {
                            igAccount = ig;
                            break;
                        }
                    }
                }

                if (!igAccount && accounts.length > 0 && accounts[0].instagram_business_account) {
                    igAccount = accounts[0].instagram_business_account;
                }

                if (!igAccount) {
                    throw new Error(`No se encontró cuenta profesional de Instagram para @${cleanIdentifier} asociada al token proporcionado.`);
                }

                return {
                    platform: 'instagram',
                    external_account_id: igAccount.id,
                    handle: `@${igAccount.username}`,
                    nombre_mostrado: igAccount.name || igAccount.username,
                    descripcion: igAccount.biography || '',
                    avatar_url: igAccount.profile_picture_url || null,
                    url_perfil: `https://www.instagram.com/${igAccount.username}`,
                    total_seguidores: igAccount.followers_count || 0,
                    raw_data: igAccount
                };
            }
        } catch (err) {
            throw err;
        }
    }

    /**
     * Consulta publicaciones de Facebook o Instagram
     */
    async fetchPosts({ account, credentials, limit = 20, cursor = null }) {
        const platform = account.plataforma || 'facebook';
        if (!credentials?.available) {
            return { posts: [], hasMore: false, technicalNotice: credentials.reason };
        }

        const externalId = account.external_account_id;
        if (!externalId) {
            return { posts: [], hasMore: false, technicalNotice: 'Cuenta sin identificador oficial de Meta' };
        }

        let endpointUrl;
        if (platform === 'facebook') {
            endpointUrl = `${this.graphBaseUrl}/${externalId}/posts?fields=id,message,created_time,permalink_url,shares,reactions.summary(true),comments.summary(true)&limit=${limit}&access_token=${encodeURIComponent(credentials.accessToken)}`;
        } else {
            endpointUrl = `${this.graphBaseUrl}/${externalId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=${limit}&access_token=${encodeURIComponent(credentials.accessToken)}`;
        }

        if (cursor) {
            endpointUrl += `&after=${cursor}`;
        }

        const res = await this.makeRequest(endpointUrl);
        const dataItems = res.data?.data || [];
        const nextCursor = res.data?.paging?.cursors?.after || null;

        const posts = dataItems.map(item => {
            if (platform === 'facebook') {
                const reactionsCount = item.reactions?.summary?.total_count || 0;
                const commentsCount = item.comments?.summary?.total_count || 0;
                const sharesCount = item.shares?.count || 0;

                return {
                    external_id: item.id,
                    plataforma: 'facebook',
                    titulo: (item.message ? item.message.slice(0, 100) : 'Publicación de Facebook'),
                    contenido: item.message || '',
                    url_publicacion: item.permalink_url || `https://www.facebook.com/${item.id}`,
                    autor_nombre: account.nombre_mostrado,
                    autor_usuario: account.handle,
                    fecha_publicacion: item.created_time,
                    tipo_contenido: 'texto',
                    alcance: 0, // Métricas de alcance requieren Facebook Insights API permissions
                    impresiones: 0,
                    reproducciones: 0,
                    interacciones: reactionsCount + commentsCount + sharesCount,
                    compartidos: sharesCount,
                    comentarios_conteo: commentsCount,
                    likes: reactionsCount,
                    me_encanta: 0,
                    me_enoja: 0,
                    is_simulation: false,
                    raw_data: item
                };
            } else {
                // Instagram
                const likesCount = item.like_count || 0;
                const commentsCount = item.comments_count || 0;

                return {
                    external_id: item.id,
                    plataforma: 'instagram',
                    titulo: (item.caption ? item.caption.slice(0, 100) : 'Publicación de Instagram'),
                    contenido: item.caption || '',
                    url_publicacion: item.permalink || `https://www.instagram.com/p/${item.id}`,
                    autor_nombre: account.nombre_mostrado,
                    autor_usuario: account.handle,
                    fecha_publicacion: item.timestamp,
                    tipo_contenido: item.media_type ? item.media_type.toLowerCase() : 'imagen',
                    alcance: 0,
                    impresiones: 0,
                    reproducciones: 0,
                    interacciones: likesCount + commentsCount,
                    compartidos: 0, // No expuesto individualmente por API pública de Instagram
                    comentarios_conteo: commentsCount,
                    likes: likesCount,
                    me_encanta: 0,
                    me_enoja: 0,
                    is_simulation: false,
                    raw_data: item
                };
            }
        });

        return {
            posts,
            nextCursor,
            hasMore: !!nextCursor
        };
    }

    /**
     * Consulta comentarios de una publicación en Facebook o Instagram
     */
    async fetchComments({ post, credentials, limit = 50, cursor = null }) {
        if (!credentials?.available) {
            return { comments: [], hasMore: false, technicalNotice: credentials.reason };
        }

        const externalId = post.external_id;
        if (!externalId) {
            return { comments: [], hasMore: false, technicalNotice: 'Publicación sin external_id de Meta' };
        }

        let endpointUrl;
        if (post.plataforma === 'facebook') {
            endpointUrl = `${this.graphBaseUrl}/${externalId}/comments?fields=id,from,message,created_time,like_count,comment_count&limit=${limit}&access_token=${encodeURIComponent(credentials.accessToken)}`;
        } else {
            endpointUrl = `${this.graphBaseUrl}/${externalId}/comments?fields=id,text,timestamp,username,like_count,replies{id,text,timestamp,username,like_count}&limit=${limit}&access_token=${encodeURIComponent(credentials.accessToken)}`;
        }

        if (cursor) {
            endpointUrl += `&after=${cursor}`;
        }

        const res = await this.makeRequest(endpointUrl);
        const dataItems = res.data?.data || [];
        const nextCursor = res.data?.paging?.cursors?.after || null;

        const comments = [];
        for (const item of dataItems) {
            if (post.plataforma === 'facebook') {
                const author = item.from || {};
                const handle = author.name ? '@' + author.name.replace(/\s+/g, '').toLowerCase() : '@usuario_facebook';

                comments.push({
                    external_id: item.id,
                    parent_comment_id: null,
                    plataforma: 'facebook',
                    usuario_red: handle,
                    nombre_usuario: author.name || 'Usuario de Facebook',
                    autor_id_externo: author.id || null,
                    url_comentario: post.url_publicacion,
                    texto_comentario: item.message || '',
                    likes_comentario: item.like_count || 0,
                    fecha_comentario: item.created_time,
                    raw_data: item
                });
            } else {
                // Instagram
                const handle = item.username ? '@' + item.username : '@usuario_instagram';
                comments.push({
                    external_id: item.id,
                    parent_comment_id: null,
                    plataforma: 'instagram',
                    usuario_red: handle,
                    nombre_usuario: item.username || 'Usuario de Instagram',
                    autor_id_externo: null,
                    url_comentario: post.url_publicacion,
                    texto_comentario: item.text || '',
                    likes_comentario: item.like_count || 0,
                    fecha_comentario: item.timestamp,
                    raw_data: item
                });

                if (item.replies?.data && Array.isArray(item.replies.data)) {
                    for (const reply of item.replies.data) {
                        const rhandle = reply.username ? '@' + reply.username : '@usuario_instagram';
                        comments.push({
                            external_id: reply.id,
                            parent_comment_id: item.id,
                            plataforma: 'instagram',
                            usuario_red: rhandle,
                            nombre_usuario: reply.username || 'Usuario de Instagram',
                            autor_id_externo: null,
                            url_comentario: post.url_publicacion,
                            texto_comentario: reply.text || '',
                            likes_comentario: reply.like_count || 0,
                            fecha_comentario: reply.timestamp,
                            raw_data: reply
                        });
                    }
                }
            }
        }

        return {
            comments,
            nextCursor,
            hasMore: !!nextCursor
        };
    }

    /**
     * Responde a un comentario (si la cuenta es administrada y tiene permisos)
     */
    async replyToComment({ post, comment, replyText, credentials }) {
        if (!credentials?.available) {
            throw new Error(credentials.reason);
        }

        const commentExternalId = comment.external_id;
        if (!commentExternalId) {
            throw new Error('El comentario no cuenta con identificador oficial de la plataforma para enviar respuesta');
        }

        const endpointUrl = `${this.graphBaseUrl}/${commentExternalId}/${post.plataforma === 'facebook' ? 'comments' : 'replies'}`;
        const bodyPayload = post.plataforma === 'facebook' 
            ? { message: replyText, access_token: credentials.accessToken }
            : { message: replyText, access_token: credentials.accessToken };

        const res = await this.makeRequest(endpointUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload)
        });

        return {
            success: true,
            publishedReplyId: res.data?.id,
            platform: post.plataforma
        };
    }
}

module.exports = MetaConnector;
