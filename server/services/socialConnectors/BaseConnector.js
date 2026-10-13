/**
 * BaseConnector - Clase base para todos los conectores oficiales de redes sociales
 * Garantiza manejo estandarizado de llamadas, cuotas, errores de plataforma y trazabilidad.
 */
class BaseConnector {
    constructor(platformName) {
        this.platformName = platformName;
    }

    getPlatformName() {
        return this.platformName;
    }

    /**
     * Resuelve credenciales activas priorizando la conexión en base de datos sobre variables de entorno
     */
    async getCredentials(campanaId, accountId = null) {
        throw new Error('Método getCredentials debe ser implementado por el conector hijo');
    }

    /**
     * Prueba técnica de conectividad con la API oficial
     */
    async testConnection(credentials) {
        throw new Error('Método testConnection debe ser implementado por el conector hijo');
    }

    /**
     * Resuelve identificadores y metadatos de un perfil o página pública
     */
    async resolveAccount(urlOrHandle, credentials) {
        throw new Error('Método resolveAccount debe ser implementado por el conector hijo');
    }

    /**
     * Consulta publicaciones reales
     */
    async fetchPosts({ account, credentials, limit = 20, cursor = null }) {
        throw new Error('Método fetchPosts debe ser implementado por el conector hijo');
    }

    /**
     * Consulta comentarios públicos reales de una publicación
     */
    async fetchComments({ post, credentials, limit = 50, cursor = null }) {
        throw new Error('Método fetchComments debe ser implementado por el conector hijo');
    }

    /**
     * Publica una respuesta oficial a un comentario (solo cuentas administradas autorizadas)
     */
    async replyToComment({ post, comment, replyText, credentials }) {
        throw new Error('Método replyToComment debe ser implementado por el conector hijo');
    }

    /**
     * Ejecuta una petición HTTP con timeout y control de errores
     */
    async makeRequest(url, options = {}, timeoutMs = 12000) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeout);

            const isJson = (response.headers.get('content-type') || '').includes('application/json');
            const data = isJson ? await response.json() : await response.text();

            if (!response.ok) {
                const errorPayload = typeof data === 'object' ? data : { raw: data };
                const formattedError = this.formatPlatformError(response.status, errorPayload, url);
                const error = new Error(formattedError.userExplanation);
                error.status = response.status;
                error.details = formattedError;
                throw error;
            }

            return {
                ok: true,
                status: response.status,
                data
            };
        } catch (err) {
            clearTimeout(timeout);
            if (err.name === 'AbortError') {
                const timeoutError = {
                    errorType: 'network_timeout',
                    userExplanation: `No disponible por restricciones de la plataforma (Tiempo de espera agotado al conectar con ${this.platformName})`,
                    technicalDetails: `Timeout tras ${timeoutMs}ms al llamar ${url}`
                };
                const e = new Error(timeoutError.userExplanation);
                e.details = timeoutError;
                throw e;
            }
            throw err;
        }
    }

    /**
     * Estandariza los códigos de error oficiales de cada plataforma
     */
    formatPlatformError(status, payload, endpoint) {
        let errorType = 'unknown';
        let userExplanation = `No disponible por restricciones de la plataforma (${this.platformName} HTTP ${status})`;
        let technicalDetails = JSON.stringify(payload);

        if (status === 401 || status === 403) {
            errorType = 'auth_expired_or_forbidden';
            userExplanation = `No disponible por restricciones de la plataforma (${status}: Credenciales no autorizadas, permisos insuficientes o token expirado en ${this.platformName})`;
        } else if (status === 429) {
            errorType = 'rate_limit';
            userExplanation = `No disponible por restricciones de la plataforma (Límite de cuota o tasa de peticiones alcanzado en ${this.platformName})`;
        } else if (status === 404) {
            errorType = 'resource_not_found';
            userExplanation = `No disponible por restricciones de la plataforma (Recurso, canal o publicación no encontrado en ${this.platformName})`;
        }

        return {
            platform: this.platformName,
            httpStatus: status,
            errorType,
            endpoint,
            userExplanation,
            technicalDetails
        };
    }
}

module.exports = BaseConnector;
