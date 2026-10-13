const ContentAlert = require('../models/ContentAlert');

/**
 * commentClassifierService
 * Clasificador NLP de comentarios conforme a la Orden Maestra.
 * Categorías:
 * 1. general
 * 2. pregunta
 * 3. critica (crítica legítima a propuestas, gestión o posturas)
 * 4. insulto (lenguaje ofensivo o descalificación personal sin argumento)
 * 5. amenaza (amenaza explícita a la integridad física o seguridad)
 * 6. acoso_repetitivo (contenido repetitivo o coordinado)
 * 7. spam (promociones no deseadas, enlaces sospechosos o bots)
 * 8. requiere_revision (ambigüedad, ironía o incertidumbre del clasificador)
 */

// Diccionarios léxicos de alta precisión
const THREAT_PATTERNS = [
    /\b(te|los|lo|la|se)\s+(vamos|van|voy)\s+a\s+(matar|quebrar|levantar|picar|desaparecer|linchar|dar plomo|pelar)\b/i,
    /\b(muerte\s+a|plomo\s+es\s+lo\s+que\s+hay|le\s+vamos\s+a\s+dar\s+piso|se\s+va\s+a\s+morir)\b/i,
    /\b(atentado|tiros|sicarios?|te\s+va\s+a\s+pesar|vamos\s+por\s+(ti|usted)|sabemos\s+d[oó]nde\s+vives)\b/i,
    /\b(le\s+van\s+a\s+dar\s+de\s+baja|no\s+sales\s+vivo|bala\s+es\s+lo\s+que|bomba)\b/i
];

const INSULT_PATTERNS = [
    /\b(hp|hijueputa|malparid[oa]s?|hpta|gonorrea|pirobo|carechimba|est[uú]pid[oa]|idiota|maldit[oa]s?)\b/i,
    /\b(imb[eé]cil|basura|porquer[ií]a|lacra|rata\s+asquerosa|payaso|charlat[aá]n|corrupto\s+de\s+mierda)\b/i,
    /\b(ladronzuelo|sinverg[uü]enza|miserable|arrodillad[oa]|vendepatrias?|petriste|uribestia|paraco|guerrillo)\b/i
];

const LEGITIMATE_CRITICISM_PATTERNS = [
    /\b(no\s+estoy\s+de\s+acuerdo|no\s+comparto|propuesta\s+inviable|demagogia|falta\s+de\s+presupuesto)\b/i,
    /\b(de\s+d[oó]nde\s+saldr[aá]n\s+los\s+recursos|c[oó]mo\s+va\s+a\s+financiar|rendici[oó]n\s+de\s+cuentas)\b/i,
    /\b(no\s+cumpli[oó]|en\s+su\s+gesti[oó]n\s+anterior|promesas\s+falsas|veedur[ií]a|exigimos\s+claridad)\b/i,
    /\b(por\s+qu[eé]\s+vot[oó]\s+a\s+favor|su\s+postura\s+frente\s+al\s+proyecto|indicadores\s+negativos)\b/i,
    /\b(debe\s+explicar|cuestionamos|hacemos\s+un\s+llamado|no\s+vemos\s+resultados|preocupante)\b/i
];

const QUESTION_PATTERNS = [
    /\?/,
    /\b(cu[aá]ndo|d[oó]nde|c[oó]mo|qui[eé]n|por\s+qu[eé]|cu[aá]les|a\s+qu[eé]\s+hora|qu[eé]\s+propone)\b/i,
    /\b(quisiera\s+saber|me\s+gustar[ií]a\s+conocer|tengo\s+una\s+duda|podr[ií]an\s+aclarar|informaci[oó]n\s+sobre)\b/i
];

const SPAM_PATTERNS = [
    /\b(t\.me\/|wa\.me\/|bit\.ly\/|tinyurl\.com|cripto|bitcoin|gana\s+dinero\s+desde\s+casa|forex|telegram)\b/i,
    /\b(inversi[oó]n\s+garantizada|casino\s+online|gana\s+en\s+d[oó]lares|haz\s+clic\s+aqu[ií]|seguidores\s+gratis)\b/i
];

function classifyComment(text, existingComments = []) {
    if (!text || typeof text !== 'string') {
        return {
            categoria: 'general',
            nivel_confianza: 1.0,
            es_critica_legitima: false,
            es_amenaza: false,
            requiere_revision_humana: false,
            sentimiento: 'neutral',
            tipo_reaccion: 'apoyo',
            justificacion: 'Texto vacío o no estructurado'
        };
    }

    const clean = text.trim();

    // 1. Detección prioritaria de amenazas explícitas
    for (const pattern of THREAT_PATTERNS) {
        if (pattern.test(clean)) {
            return {
                categoria: 'amenaza',
                nivel_confianza: 0.96,
                es_critica_legitima: false,
                es_amenaza: true,
                requiere_revision_humana: true, // Siempre requiere validación humana
                sentimiento: 'negativo',
                tipo_reaccion: 'ataque',
                justificacion: 'Contiene patrones explícitos de amenaza física o agresión violenta.'
            };
        }
    }

    // 2. Detección de insultos y lenguaje ofensivo
    for (const pattern of INSULT_PATTERNS) {
        if (pattern.test(clean)) {
            // Si además tiene crítica pero contiene groserías, se clasifica como insulto
            return {
                categoria: 'insulto',
                nivel_confianza: 0.92,
                es_critica_legitima: false,
                es_amenaza: false,
                requiere_revision_humana: false,
                sentimiento: 'negativo',
                tipo_reaccion: 'ataque',
                justificacion: 'Lenguaje ofensivo o descalificación personal sin debate constructivo.'
            };
        }
    }

    // 3. Detección de Spam
    for (const pattern of SPAM_PATTERNS) {
        if (pattern.test(clean)) {
            return {
                categoria: 'spam',
                nivel_confianza: 0.95,
                es_critica_legitima: false,
                es_amenaza: false,
                requiere_revision_humana: false,
                sentimiento: 'neutral',
                tipo_reaccion: 'critica',
                justificacion: 'Enlaces comerciales, canales externos no solicitados o bots.'
            };
        }
    }

    // 4. Detección de acoso repetitivo / copia coordinada
    if (existingComments && existingComments.length > 0) {
        const exactMatches = existingComments.filter(c => (c.texto_comentario || '').trim().toLowerCase() === clean.toLowerCase());
        if (exactMatches.length >= 3) {
            return {
                categoria: 'acoso_repetitivo',
                nivel_confianza: 0.88,
                es_critica_legitima: false,
                es_amenaza: false,
                requiere_revision_humana: true,
                sentimiento: 'negativo',
                tipo_reaccion: 'critica',
                justificacion: 'Texto idéntico detectado de forma reiterada (posible brigada o copia coordinada).'
            };
        }
    }

    // 5. Detección de crítica legítima (Discusión ciudadana y desacuerdos fundamentados)
    for (const pattern of LEGITIMATE_CRITICISM_PATTERNS) {
        if (pattern.test(clean)) {
            return {
                categoria: 'critica',
                nivel_confianza: 0.89,
                es_critica_legitima: true,
                es_amenaza: false,
                requiere_revision_humana: false,
                sentimiento: 'negativo',
                tipo_reaccion: 'critica',
                justificacion: 'Cuestionamiento o desacuerdo con propuestas, presupuestos o gestión institucional.'
            };
        }
    }

    // 6. Detección de preguntas y solicitudes de información
    for (const pattern of QUESTION_PATTERNS) {
        if (pattern.test(clean)) {
            return {
                categoria: 'pregunta',
                nivel_confianza: 0.90,
                es_critica_legitima: false,
                es_amenaza: false,
                requiere_revision_humana: false,
                sentimiento: 'neutral',
                tipo_reaccion: 'pregunta',
                justificacion: 'Solicitud ciudadana de información, fechas, aclaración o eventos.'
            };
        }
    }

    // 7. Expresiones de apoyo o felicitación
    if (/\b(excelente|felicitaciones|vamos\s+con\s+toda|apoyo|cuenta\s+con\s+mi\s+voto|gran\s+l[ií]der|firme|adelante|bendiciones)\b/i.test(clean)) {
        return {
            categoria: 'general',
            nivel_confianza: 0.94,
            es_critica_legitima: false,
            es_amenaza: false,
            requiere_revision_humana: false,
            sentimiento: 'positivo',
            tipo_reaccion: 'apoyo',
            justificacion: 'Comentario de respaldo o simpatía ciudadana.'
        };
    }

    // 8. Ambigüedad o ironía (por defecto requiere revisión si es corto o ambiguo)
    if (clean.length < 15 && /\b(aj[aá]|s[ií]\s+claro|vea\s+pues|hum)\b/i.test(clean)) {
        return {
            categoria: 'requiere_revision',
            nivel_confianza: 0.65,
            es_critica_legitima: false,
            es_amenaza: false,
            requiere_revision_humana: true,
            sentimiento: 'neutral',
            tipo_reaccion: 'critica',
            justificacion: 'Comentario con posible tono irónico o alta ambigüedad semántica.'
        };
    }

    // General ordinario
    return {
        categoria: 'general',
        nivel_confianza: 0.85,
        es_critica_legitima: false,
        es_amenaza: false,
        requiere_revision_humana: false,
        sentimiento: 'neutral',
        tipo_reaccion: 'me_gusta',
        justificacion: 'Comentario general sin patrones de riesgo ni confrontación.'
    };
}

/**
 * Procesa y almacena una alerta si el comentario presenta niveles de riesgo
 */
async function checkAndCreateContentAlert({ comment, campanaId, post = null }) {
    if (!comment) return null;

    if (comment.categoria_contenido === 'amenaza' || comment.es_amenaza) {
        return await ContentAlert.create({
            campana_id: campanaId,
            plataforma: comment.plataforma,
            post_id: comment.post_id,
            comment_id: comment.id,
            tipo_alerta: 'amenaza',
            nivel_severidad: 'critico',
            titulo: `⚠️ Amenaza detectada en ${comment.plataforma.toUpperCase()}`,
            descripcion: `Comentario publicado por ${comment.usuario_red} con indicios de agresión o violencia.`,
            texto_original: comment.texto_comentario,
            autor_comentario: comment.usuario_red,
            url_evidencia: comment.url_comentario || post?.url_publicacion || null,
            estado: 'pendiente'
        });
    }

    if (comment.categoria_contenido === 'insulto' && comment.likes_comentario > 10) {
        return await ContentAlert.create({
            campana_id: campanaId,
            plataforma: comment.plataforma,
            post_id: comment.post_id,
            comment_id: comment.id,
            tipo_alerta: 'insulto_grave',
            nivel_severidad: 'alto',
            titulo: `Insulto viralizado (${comment.likes_comentario} apoyos) en ${comment.plataforma.toUpperCase()}`,
            descripcion: `Lenguaje ofensivo con alta visibilidad en la publicación.`,
            texto_original: comment.texto_comentario,
            autor_comentario: comment.usuario_red,
            url_evidencia: comment.url_comentario || post?.url_publicacion || null,
            estado: 'pendiente'
        });
    }

    if (comment.categoria_contenido === 'acoso_repetitivo') {
        return await ContentAlert.create({
            campana_id: campanaId,
            plataforma: comment.plataforma,
            post_id: comment.post_id,
            comment_id: comment.id,
            tipo_alerta: 'acoso_coordinado',
            nivel_severidad: 'medio',
            titulo: `Ataque coordinado o spam reiterado en ${comment.plataforma.toUpperCase()}`,
            descripcion: `Texto repetido múltiples veces por cuentas en el post.`,
            texto_original: comment.texto_comentario,
            autor_comentario: comment.usuario_red,
            url_evidencia: comment.url_comentario || post?.url_publicacion || null,
            estado: 'pendiente'
        });
    }

    return null;
}

module.exports = {
    classifyComment,
    checkAndCreateContentAlert
};
