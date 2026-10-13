const BaseConnector = require('./BaseConnector');
const SocialConnection = require('../../models/SocialConnection');

/**
 * XConnector - Conector oficial para Twitter / X API v2
 * Conforme con los niveles de acceso y cuotas oficiales de la plataforma
 */
class XConnector extends BaseConnector {
    constructor() {
        super('twitter');
        this.apiBaseUrl = 'https://api.twitter.com/2';
    }

    async getCredentials(campanaId, accountId = null) {
        let connection = null;
        if (accountId) {
            connection = await SocialConnection.findOne({
                where: { account_id: accountId, plataforma: 'twitter', is_valid: true }
            });
        }
        if (!connection && campanaId) {
            connection = await SocialConnection.findOne({
                where: { campana_id: campanaId, plataforma: 'twitter', is_valid: true }
            });
        }

        const bearerToken = connection?.token_seguro || process.env.TWITTER_BEARER_TOKEN || process.env.X_BEARER_TOKEN;

        if (!bearerToken) {
            return {
                available: false,
                reason: 'No disponible por restricciones de la plataforma (Falta configurar TWITTER_BEARER_TOKEN oficial o registrar la conexión en el sistema)'
            };
        }

        return {
            available: true,
            bearerToken
        };
    }

    async testConnection(credentials) {
        if (!credentials?.available) {
            return { ok: false, message: credentials?.reason || 'Sin credenciales' };
        }
        try {
            const url = `${this.apiBaseUrl}/users/by/username/Twitter?user.fields=id,name`;
            const res = await this.makeRequest(url, {
                headers: { 'Authorization': `Bearer ${credentials.bearerToken}` }
            });
            return { ok: true, message: 'Conexión exitosa con X (Twitter) API v2' };
        } catch (err) {
            return { ok: false, message: err.message, details: err.details };
        }
    }

    /**
     * Resuelve usuario de X
     */
    async resolveAccount(urlOrHandle, credentials) {
        if (!credentials?.available) {
            throw new Error(credentials.reason);
        }

        let handle = urlOrHandle.trim();
        if (handle.includes('twitter.com') || handle.includes('x.com')) {
            const parts = handle.replace(/\?.*$/, '').replace(/\/$/, '').split('/');
            handle = parts[parts.length - 1];
        }
        handle = handle.replace(/^@/, '');

        const url = `${this.apiBaseUrl}/users/by/username/${encodeURIComponent(handle)}?user.fields=id,name,username,description,profile_image_url,public_metrics`;
        const res = await this.makeRequest(url, {
            headers: { 'Authorization': `Bearer ${credentials.bearerToken}` }
        });

        const userData = res.data?.data;
        if (!userData) {
            throw new Error(`Usuario @${handle} no encontrado en X`);
        }

        const metrics = userData.public_metrics || {};
        return {
            platform: 'twitter',
            external_account_id: userData.id,
            handle: `@${userData.username}`,
            nombre_mostrado: userData.name,
            descripcion: userData.description || '',
            avatar_url: userData.profile_image_url || null,
            url_perfil: `https://x.com/${userData.username}`,
            total_seguidores: metrics.followers_count || 0,
            total_publicaciones: metrics.tweet_count || 0,
            raw_data: userData
        };
    }

    /**
     * Consulta publicaciones (tweets) recientes del usuario
     */
    async fetchPosts({ account, credentials, limit = 20, cursor = null }) {
        if (!credentials?.available) {
            return { posts: [], hasMore: false, technicalNotice: credentials.reason };
        }

        const userId = account.external_account_id;
        if (!userId) {
            return { posts: [], hasMore: false, technicalNotice: 'Cuenta de X sin external_account_id' };
        }

        let url = `${this.apiBaseUrl}/users/${userId}/tweets?tweet.fields=created_at,public_metrics,entities,attachments&max_results=${Math.min(limit, 100)}`;
        if (cursor) {
            url += `&pagination_token=${cursor}`;
        }

        try {
            const res = await this.makeRequest(url, {
                headers: { 'Authorization': `Bearer ${credentials.bearerToken}` }
            });

            const tweets = res.data?.data || [];
            const nextCursor = res.data?.meta?.next_token || null;

            const posts = tweets.map(t => {
                const metrics = t.public_metrics || {};
                const likes = metrics.like_count || 0;
                const retweets = metrics.retweet_count || 0;
                const replies = metrics.reply_count || 0;
                const impressions = metrics.impression_count || 0;

                return {
                    external_id: t.id,
                    plataforma: 'twitter',
                    titulo: (t.text ? t.text.slice(0, 100) : 'Post en X'),
                    contenido: t.text || '',
                    url_publicacion: `https://x.com/${account.handle.replace('@', '')}/status/${t.id}`,
                    autor_nombre: account.nombre_mostrado,
                    autor_usuario: account.handle,
                    fecha_publicacion: t.created_at,
                    tipo_contenido: 'texto',
                    alcance: impressions,
                    impresiones: impressions,
                    reproducciones: 0,
                    interacciones: likes + retweets + replies,
                    compartidos: retweets,
                    comentarios_conteo: replies,
                    likes: likes,
                    me_encanta: 0,
                    me_enoja: 0,
                    is_simulation: false,
                    raw_data: t
                };
            });

            return {
                posts,
                nextCursor,
                hasMore: !!nextCursor
            };
        } catch (err) {
            return {
                posts: [],
                hasMore: false,
                technicalNotice: err.message
            };
        }
    }

    /**
     * Consulta respuestas públicas a un tweet
     */
    async fetchComments({ post, credentials, limit = 50, cursor = null }) {
        if (!credentials?.available) {
            return { comments: [], hasMore: false, technicalNotice: credentials.reason };
        }

        const tweetId = post.external_id;
        if (!tweetId) {
            return { comments: [], hasMore: false, technicalNotice: 'Publicación sin ID oficial de tweet' };
        }

        // Búsqueda de respuestas en la conversación de X API v2
        let url = `${this.apiBaseUrl}/tweets/search/recent?query=conversation_id:${tweetId}&tweet.fields=in_reply_to_user_id,author_id,created_at,public_metrics&expansions=author_id&user.fields=username,name&max_results=${Math.min(limit, 100)}`;
        if (cursor) {
            url += `&next_token=${cursor}`;
        }

        try {
            const res = await this.makeRequest(url, {
                headers: { 'Authorization': `Bearer ${credentials.bearerToken}` }
            });

            const items = res.data?.data || [];
            const users = res.data?.includes?.users || [];
            const usersMap = {};
            users.forEach(u => { usersMap[u.id] = u; });

            const nextCursor = res.data?.meta?.next_token || null;

            const comments = items.map(t => {
                const author = usersMap[t.author_id] || {};
                const handle = author.username ? `@${author.username}` : `@usuario_${t.author_id}`;
                const metrics = t.public_metrics || {};

                return {
                    external_id: t.id,
                    parent_comment_id: t.in_reply_to_user_id ? String(t.in_reply_to_user_id) : null,
                    plataforma: 'twitter',
                    usuario_red: handle,
                    nombre_usuario: author.name || 'Usuario de X',
                    autor_id_externo: t.author_id || null,
                    url_comentario: `https://x.com/${handle.replace('@', '')}/status/${t.id}`,
                    texto_comentario: t.text || '',
                    likes_comentario: metrics.like_count || 0,
                    fecha_comentario: t.created_at,
                    raw_data: t
                };
            });

            return {
                comments,
                nextCursor,
                hasMore: !!nextCursor
            };
        } catch (err) {
            // En planes gratuitos/básicos de X API el endpoint search/recent puede requerir Plan Pro ($100/mes o $5000/mes)
            return {
                comments: [],
                hasMore: false,
                technicalNotice: `No disponible por restricciones de la plataforma (${err.message.includes('403') ? 'El plan de acceso oficial a X API no incluye búsqueda reciente de respuestas en esta cuota' : err.message})`
            };
        }
    }
}

module.exports = XConnector;
