const BaseConnector = require('./BaseConnector');
const SocialConnection = require('../../models/SocialConnection');

/**
 * TikTokConnector - Conector oficial para TikTok API v2 (TikTok for Developers)
 */
class TikTokConnector extends BaseConnector {
    constructor() {
        super('tiktok');
        this.apiBaseUrl = 'https://open.tiktokapis.com/v2';
    }

    async getCredentials(campanaId, accountId = null) {
        let connection = null;
        if (accountId) {
            connection = await SocialConnection.findOne({
                where: { account_id: accountId, plataforma: 'tiktok', is_valid: true }
            });
        }
        if (!connection && campanaId) {
            connection = await SocialConnection.findOne({
                where: { campana_id: campanaId, plataforma: 'tiktok', is_valid: true }
            });
        }

        const accessToken = connection?.token_seguro || process.env.TIKTOK_ACCESS_TOKEN;

        if (!accessToken) {
            return {
                available: false,
                reason: 'No disponible por restricciones de la plataforma (Falta configurar TIKTOK_ACCESS_TOKEN oficial de TikTok for Developers)'
            };
        }

        return {
            available: true,
            accessToken
        };
    }

    async testConnection(credentials) {
        if (!credentials?.available) {
            return { ok: false, message: credentials?.reason || 'Sin credenciales' };
        }
        try {
            const url = `${this.apiBaseUrl}/user/info/?fields=open_id,union_id,avatar_url,display_name`;
            const res = await this.makeRequest(url, {
                headers: { 'Authorization': `Bearer ${credentials.accessToken}` }
            });
            return { ok: true, message: 'Conexión exitosa con TikTok API v2' };
        } catch (err) {
            return { ok: false, message: err.message, details: err.details };
        }
    }

    async resolveAccount(urlOrHandle, credentials) {
        if (!credentials?.available) {
            throw new Error(credentials.reason);
        }

        let handle = urlOrHandle.trim();
        if (handle.includes('tiktok.com')) {
            const match = handle.match(/tiktok\.com\/@?([^/?#]+)/i);
            if (match) handle = match[1];
        }
        handle = handle.replace(/^@/, '');

        // En la API oficial de TikTok, la información del usuario se consulta mediante el access token del usuario autenticado
        const url = `${this.apiBaseUrl}/user/info/?fields=open_id,union_id,avatar_url,display_name,bio_description,follower_count,likes_count`;
        const res = await this.makeRequest(url, {
            headers: { 'Authorization': `Bearer ${credentials.accessToken}` }
        });

        const user = res.data?.data?.user;
        if (!user) {
            throw new Error(`No se pudo obtener información del usuario en TikTok API`);
        }

        return {
            platform: 'tiktok',
            external_account_id: user.open_id,
            handle: `@${handle}`,
            nombre_mostrado: user.display_name || handle,
            descripcion: user.bio_description || '',
            avatar_url: user.avatar_url || null,
            url_perfil: `https://www.tiktok.com/@${handle}`,
            total_seguidores: user.follower_count || 0,
            raw_data: user
        };
    }

    async fetchPosts({ account, credentials, limit = 20, cursor = null }) {
        if (!credentials?.available) {
            const targetUrl = account.url_perfil || account.url || '';
            const isVideoUrl = targetUrl.includes('/video/') || targetUrl.includes('tiktok.com');
            if (isVideoUrl) {
                try {
                    const oembedRes = await this.makeRequest(`https://www.tiktok.com/oembed?url=${encodeURIComponent(targetUrl)}`);
                    const data = oembedRes.data;
                    const videoIdMatch = targetUrl.match(/\/video\/(\d+)/);
                    const extId = videoIdMatch ? videoIdMatch[1] : `tt_${Date.now()}`;
                    return {
                        posts: [{
                            plataforma: 'tiktok',
                            external_id: extId,
                            titulo: data.title || 'Video de TikTok',
                            contenido: data.title || 'Video de TikTok',
                            url_publicacion: targetUrl,
                            autor_nombre: data.author_name || 'TikTok Creator',
                            autor_usuario: data.author_unique_id ? `@${data.author_unique_id}` : (data.author_name ? `@${data.author_name}` : '@tiktok'),
                            tipo_contenido: 'video',
                            imagen_url: data.thumbnail_url || null,
                            video_url: targetUrl,
                            alcance: 0,
                            impresiones: 0,
                            reproducciones: 0,
                            interacciones: 0,
                            likes: 0,
                            me_encanta: 0,
                            me_enoja: 0,
                            comentarios_conteo: 0,
                            fecha_publicacion: new Date().toISOString(),
                            raw_data: data
                        }],
                        hasMore: false,
                        technicalNotice: 'Video extraído vía protocolo oEmbed oficial de TikTok. Para métricas avanzadas y cuentas administradas, vincule la cuenta en Conexiones Oficiales.'
                    };
                } catch (oeErr) {
                    console.warn('Aviso oEmbed TikTok:', oeErr.message);
                }
            }

            return { posts: [], hasMore: false, technicalNotice: credentials.reason };
        }

        const url = `${this.apiBaseUrl}/video/list/?fields=id,title,create_time,share_url,like_count,comment_count,share_count,view_count`;
        const bodyPayload = {
            max_count: Math.min(limit, 20)
        };
        if (cursor) {
            bodyPayload.cursor = parseInt(cursor, 10);
        }

        try {
            const res = await this.makeRequest(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${credentials.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyPayload)
            });

            const videos = res.data?.data?.videos || [];
            const nextCursor = res.data?.data?.cursor || null;
            const hasMore = res.data?.data?.has_more || false;

            const posts = videos.map(v => {
                const likes = v.like_count || 0;
                const comments = v.comment_count || 0;
                const shares = v.share_count || 0;
                const views = v.view_count || 0;

                return {
                    external_id: v.id,
                    plataforma: 'tiktok',
                    titulo: (v.title ? v.title.slice(0, 100) : 'Video de TikTok'),
                    contenido: v.title || '',
                    url_publicacion: v.share_url || `https://www.tiktok.com/@${account.handle.replace('@', '')}/video/${v.id}`,
                    autor_nombre: account.nombre_mostrado,
                    autor_usuario: account.handle,
                    fecha_publicacion: new Date(v.create_time * 1000).toISOString(),
                    tipo_contenido: 'video',
                    alcance: views,
                    impresiones: views,
                    reproducciones: views,
                    interacciones: likes + comments + shares,
                    compartidos: shares,
                    comentarios_conteo: comments,
                    likes: likes,
                    me_encanta: 0,
                    me_enoja: 0,
                    video_url: v.share_url,
                    is_simulation: false,
                    raw_data: v
                };
            });

            return {
                posts,
                nextCursor: nextCursor ? String(nextCursor) : null,
                hasMore
            };
        } catch (err) {
            return {
                posts: [],
                hasMore: false,
                technicalNotice: err.message
            };
        }
    }

    async fetchComments({ post, credentials, limit = 50, cursor = null }) {
        // La API comercial estándar de TikTok requiere aprobación especial del producto "TikTok Comments API"
        return {
            comments: [],
            hasMore: false,
            technicalNotice: 'No disponible por restricciones de la plataforma (La consulta de comentarios de TikTok requiere aprobación del producto Comments API en TikTok for Developers)'
        };
    }
}

module.exports = TikTokConnector;
