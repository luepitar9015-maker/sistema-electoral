const { getActiveProvider } = require('./ai');

/**
 * Servicio de Inteligencia Estratégica Política y Cuarto de Guerra (War Room)
 * Analiza ataques de adversarios dirigidos a:
 * - Candidato
 * - Partido Político
 * - Cargo o Gestión Institucional (Alcalde, Gobernador, Concejal, Senador, Congresista, etc.)
 */
class PoliticalStrategyAiService {

    /**
     * Analiza el contenido de un ataque de un adversario político
     */
    async analyzeAttack({
        contenido_ataque,
        adversario_nombre = 'Adversario Político',
        partido_adversario = '',
        cargo_postulado_o_actual = 'Alcalde / Candidato',
        partido_nuestro = 'Nuestra Campaña',
        candidato_nuestro = 'Nuestro Candidato',
        plataforma = 'twitter',
        likes = 0,
        reposts = 0,
        comentarios = 0
    }) {
        const provider = getActiveProvider();
        const texto = String(contenido_ataque || '').trim();

        // 1. Detección heurística de blanco del ataque
        const textoLower = texto.toLowerCase();
        let blanco = 'candidato';
        let descripcion_blanco = 'Ataque directo a la figura del candidato';

        if (textoLower.includes('partido') || textoLower.includes('coalición') || textoLower.includes('movimiento') || textoLower.includes('bancada')) {
            blanco = 'partido';
            descripcion_blanco = `Ataque al partido ${partido_nuestro}`;
        } else if (textoLower.includes('alcalde') || textoLower.includes('alcaldía') || textoLower.includes('municipio') || textoLower.includes('secretaría') || textoLower.includes('vías') || textoLower.includes('obras')) {
            blanco = 'alcalde';
            descripcion_blanco = 'Ataque a la gestión institucional como Alcalde';
        } else if (textoLower.includes('gobernador') || textoLower.includes('gobernación') || textoLower.includes('departamento')) {
            blanco = 'gobernador';
            descripcion_blanco = 'Ataque a la gestión institucional como Gobernador';
        } else if (textoLower.includes('concejal') || textoLower.includes('concejo')) {
            blanco = 'concejal';
            descripcion_blanco = 'Ataque al desempeño como Concejal';
        } else if (textoLower.includes('senador') || textoLower.includes('senado') || textoLower.includes('plenaria')) {
            blanco = 'senador';
            descripcion_blanco = 'Ataque a la votación o gestión como Senador';
        } else if (textoLower.includes('congresista') || textoLower.includes('cámara') || textoLower.includes('congreso') || textoLower.includes('ley')) {
            blanco = 'congresista';
            descripcion_blanco = 'Ataque a la gestión legislativa en el Congreso';
        } else if (textoLower.includes('familia') || textoLower.includes('esposa') || textoLower.includes('hijo') || textoLower.includes('casa') || textoLower.includes('finca')) {
            blanco = 'familia_personal';
            descripcion_blanco = 'Ataque a la esfera privada / familiar';
        } else if (textoLower.includes('gestión') || textoLower.includes('contrato') || textoLower.includes('presupuesto')) {
            blanco = 'gestion_institucional';
            descripcion_blanco = 'Ataque a la gestión institucional y administrativa';
        }

        // 2. Detección de tema
        let tema = 'Guerra Sucia / Desprestigio';
        if (/robo|corrupt|coima|plata|desfalco|contrat/i.test(textoLower)) tema = 'Corrupción / Transparencia';
        else if (/seguridad|crimen|ladron|atraco|polic|homicid/i.test(textoLower)) tema = 'Seguridad y Convivencia';
        else if (/hueco|calle|v[ií]a|obra|puente|hospital|colegio/i.test(textoLower)) tema = 'Obras e Infraestructura';
        else if (/impuesto|tarifa|gasto|derroche|deuda/i.test(textoLower)) tema = 'Economía y Finanzas Públicas';
        else if (/mentir|fals|promet|engaño|traici/i.test(textoLower)) tema = 'Incoherencia Política / Promesas';

        // 3. Estimación de viralidad y nivel de amenaza
        const interaccionesTotales = (parseInt(likes, 10) || 0) + (parseInt(reposts, 10) || 0) * 2 + (parseInt(comentarios, 10) || 0) * 1.5;
        let nivel_amenaza = 'medio';
        if (interaccionesTotales > 5000 || /urgente|esc[aá]ndalo|denuncia|grave|investiga/i.test(textoLower)) {
            nivel_amenaza = 'muy_alto';
        } else if (interaccionesTotales > 1000 || /cuestiona|se destapa|mentiroso/i.test(textoLower)) {
            nivel_amenaza = 'alto';
        } else if (interaccionesTotales < 100) {
            nivel_amenaza = 'bajo';
        }

        // 4. Fake news y posible red de bots
        const es_fake_news = /inventan|montaje|supuesto|dicen que|fuente dudosa|rumor/i.test(textoLower) || tema === 'Incoherencia Política / Promesas';
        const posible_red_bots = (parseInt(reposts, 10) > (parseInt(likes, 10) * 1.8) && parseInt(reposts, 10) > 200);

        // 5. Táctica recomendada según doctrina de campaña
        let tactica = 'redireccionar';
        if (nivel_amenaza === 'bajo' && !es_fake_news) {
            tactica = 'ignorar'; // Silencio Estratégico para no darle pauta al rival
        } else if (es_fake_news) {
            tactica = 'desmentir'; // Fact-checking obligatorio con datos
        } else if (tema === 'Corrupción / Transparencia' && nivel_amenaza === 'muy_alto') {
            tactica = 'contraatacar'; // Exponer pasado del rival
        } else if (tema === 'Obras e Infraestructura' || tema === 'Seguridad y Convivencia') {
            tactica = 'redireccionar'; // Judo político: responder con obras y propuestas
        } else {
            tactica = 'tropa_digital'; // Contener en comentarios sin desgastar al candidato
        }

        // Si tenemos Gemini configurado, podemos enriquecer con análisis semántico profundo
        if (provider && provider.name === 'gemini') {
            try {
                const systemPrompt = `Eres el Director General de Estrategia Política y Jefe del War Room (Cuarto de Guerra) de una campaña electoral de alto nivel.
Analiza este ataque de un rival de la oposición y devuelve un JSON estricto con las siguientes claves:
{
  "blanco_ataque": "candidato" | "partido" | "alcalde" | "gobernador" | "concejal" | "senador" | "congresista" | "gestion_institucional" | "familia_personal" | "equipo_campana",
  "descripcion_blanco": string corto,
  "tema_ataque": string,
  "nivel_amenaza": "bajo" | "medio" | "alto" | "muy_alto",
  "tactica_recomendada": "ignorar" | "desmentir" | "redireccionar" | "contraatacar" | "tropa_digital",
  "analisis_estrategico": string con el análisis de la intención del rival,
  "guion_candidato": string con el discurso sereno de estadista para tarima/medios,
  "guion_voceros": string con datos duros y argumentos para voceros oficiales de prensa,
  "guion_tropa_digital": string con 2-3 comentarios para activistas en redes contrarrestando el post,
  "guion_debates": string con réplica fulminante (Judo Político) si lo sacan en debate
}`;

                const userPrompt = `
ADVERSARIO ATACANTE: ${adversario_nombre} (${partido_adversario})
NUESTRO CANDIDATO / MANDATARIO: ${candidato_nuestro}
PARTIDO / COALICIÓN NUESTRA: ${partido_nuestro}
CARGO ACTUAL / AL QUE ASPIRA: ${cargo_postulado_o_actual}
RED SOCIAL: ${plataforma}
INTERACCIONES: ${likes} likes, ${reposts} reposts, ${comentarios} comentarios.
CONTENIDO DEL ATAQUE:
"${texto}"
`;

                const aiResponse = await provider._callGeminiApi(systemPrompt, userPrompt);
                if (aiResponse) {
                    const parsed = JSON.parse(aiResponse);
                    return {
                        ...parsed,
                        es_fake_news: parsed.es_fake_news !== undefined ? parsed.es_fake_news : es_fake_news,
                        posible_red_bots: parsed.posible_red_bots !== undefined ? parsed.posible_red_bots : posible_red_bots
                    };
                }
            } catch (geminiError) {
                console.warn('⚠️ [PoliticalStrategyAiService] Gemini API no respondió o falló JSON. Usando motor experto de respaldo:', geminiError.message);
            }
        }

        // Motor de respaldo experto en Estrategia Electoral y Comunicación Política:
        const analisis_estrategico = this.generateStrategicAnalysis({
            adversario_nombre,
            blanco,
            tema,
            tactica,
            cargo: cargo_postulado_o_actual
        });

        const guiones = this.generateStrategicScripts({
            adversario_nombre,
            candidato_nuestro,
            partido_nuestro,
            blanco,
            tema,
            tactica,
            cargo: cargo_postulado_o_actual
        });

        return {
            blanco_ataque: blanco,
            descripcion_blanco,
            tema_ataque: tema,
            nivel_amenaza,
            es_fake_news,
            posible_red_bots,
            tactica_recomendada: tactica,
            analisis_estrategico,
            ...guiones
        };
    }

    generateStrategicAnalysis({ adversario_nombre, blanco, tema, tactica, cargo }) {
        if (blanco === 'alcalde' || blanco === 'gobernador' || blanco === 'gestion_institucional') {
            return `El adversario ${adversario_nombre} busca explotar el desgaste natural del ejercicio de gobierno en ${cargo}, focalizándose en el eje de "${tema}". Su objetivo es desviar la discusión del futuro y amarrar al candidato al descontento coyuntural. Táctica recomendada: ${tactica.toUpperCase()} (evitar defenderse en su marco narrativo y mostrar ejecuciones concluidas con cifras de contraste).`;
        }
        if (blanco === 'partido') {
            return `Ataque diseñado para polarizar y activar el antivoto partidario. El adversario intenta contaminar la imagen fresca del candidato asociándolo a maquinarias o cuestionamientos históricos de su bancada. Táctica recomendada: ${tactica.toUpperCase()} (ratificar la independencia y el liderazgo ciudadano por encima de siglas partidistas).`;
        }
        return `Ataque personal focalizado en golpear la confianza y reputación del candidato en el tema de "${tema}". Busca sacarlo de foco y obligarlo a gastar tiempo de campaña en desmentir agravios. Táctica: ${tactica.toUpperCase()}.`;
    }

    generateStrategicScripts({ adversario_nombre, candidato_nuestro, partido_nuestro, blanco, tema, tactica, cargo }) {
        if (blanco === 'alcalde' || blanco === 'gobernador' || blanco === 'gestion_institucional') {
            return {
                guion_candidato: `"A los ataques respondemos con hechos y obras. Mientras la oposición se dedica a sembrar pesimismo y calumnias desde un escritorio, nosotros entregamos resultados tangibles para la gente. Nuestra prioridad es gobernar y construir, no pelear en el lodo político."`,
                guion_voceros: `"Es lamentable que el señor ${adversario_nombre} recurra a cifras descontextualizadas para ganar notoriedad en redes. La realidad es verificable: las obras están en marcha, el presupuesto se ejecuta con auditoría abierta y la ciudadanía reconoce el avance que antes no existía."`,
                guion_tropa_digital: `Comentario 1: "Mientras unos solo critican por campaña, esta administración trabaja todos los días por la gente. ¡Los resultados se ven en la calle! 👏🏗️"
Comentario 2: "Curioso que hablen de esto ahora que están en campaña y cuando tuvieron oportunidad de servir no hicieron nada. Datos, no mentiras."`,
                guion_debates: `"Candidato ${adversario_nombre}, entiendo su necesidad de atacar porque no tiene propuestas para presentarle a los ciudadanos. Pero a la gente no se le convence con calumnias, se le convence con hechos demostrables. Aquí están las cifras oficiales que desmienten su acusación en 30 segundos."`
            };
        }

        if (blanco === 'partido') {
            return {
                guion_candidato: `"Esta candidatura no le pertenece a los intereses de ningún partido en particular; le pertenece a la ciudadanía, a las familias trabajadoras y a quienes soñamos con un cambio real. Gobernaremos con los mejores, sin distingo de colores políticos."`,
                guion_voceros: `"El adversario quiere discutir de maquinarias y siglas del pasado porque le teme al programa de gobierno y a la aceptación popular de ${candidato_nuestro}. Nuestro único compromiso es con la transparencia y el servicio a la comunidad."`,
                guion_tropa_digital: `Comentario 1: "Aquí no votamos por partidos, votamos por ${candidato_nuestro} y por una visión de futuro decente y transparente. ¡Adelante!"
Comentario 2: "Se quedaron sin argumentos y ahora quieren estigmatizar. La gente ya despertó y sabe quién es quién."`,
                guion_debates: `"Si el adversario quiere debatir de la historia de los partidos, que escriba un libro. Nosotros estamos aquí para resolver los problemas reales de la gente de hoy y de mañana."`
            };
        }

        // Ataque directo al candidato
        return {
            guion_candidato: `"La política decente no insulta, propone. La guerra sucia es el recurso de quienes se sienten derrotados en las encuestas y en la calle. No nos van a distraer de nuestro objetivo: devolverle la esperanza y el progreso a nuestra tierra."`,
            guion_voceros: `"Rechazamos categóricamente las declaraciones injuriosas de ${adversario_nombre}. Exigimos respeto por el debate democrático y hacemos un llamado a elevar el nivel de la contienda con ideas y no con falsedades infundadas."`,
            guion_tropa_digital: `Comentario 1: "El desespero del adversario se nota a leguas. Cuando no hay propuestas, sobran los ataques personales. ¡Fuerza ${candidato_nuestro}! 💪"
Comentario 2: "Cada ataque de ellos demuestra que vamos ganando. Seguimos con propuestas claras y de frente a la gente."`,
            guion_debates: `"Le agradezco al adversario su comentario, porque le permite a la ciudadanía ver con absoluta claridad los dos caminos: el camino del rencor y el ataque personal que él representa, o el camino de las soluciones y el trabajo honesto que nosotros lideramos."`
        };
    }
}

module.exports = new PoliticalStrategyAiService();
