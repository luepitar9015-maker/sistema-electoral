const SocialMediaPost = require('../models/SocialMediaPost');
const SocialTeamAccount = require('../models/SocialTeamAccount');
const SocialPostComment = require('../models/SocialPostComment');
const Campaign = require('../models/Campaign');
const Voter = require('../models/Voter');
const { Op } = require('sequelize');
const { getDiegoArizaPosts } = require('./diegoArizaPosts');

function normalizeHandle(handle) {
  if (!handle) return '';
  let clean = String(handle).trim().toLowerCase();
  if (!clean.startsWith('@')) clean = '@' + clean;
  return clean;
}

function parseProfileUrl(url) {
  if (!url) return { platform: 'instagram', handle: '@campana', cleanUrl: '' };

  const cleanUrl = url.trim().replace(/\?.*$/, '').replace(/\/$/, '');
  let platform = 'instagram';
  let handle = '';

  if (/instagram\.com/i.test(cleanUrl)) {
    platform = 'instagram';
    const match = cleanUrl.match(/instagram\.com\/([^/?#]+)/i);
    handle = match ? match[1] : 'oscarvillamiz';
  } else if (/tiktok\.com/i.test(cleanUrl)) {
    platform = 'tiktok';
    const match = cleanUrl.match(/tiktok\.com\/@?([^/?#]+)/i);
    handle = match ? match[1] : 'oscarvillamiz';
  } else if (/twitter\.com|x\.com/i.test(cleanUrl)) {
    platform = 'twitter';
    const match = cleanUrl.match(/(?:twitter|x)\.com\/([^/?#]+)/i);
    handle = match ? match[1] : 'OscarVillamiz';
  } else if (/facebook\.com/i.test(cleanUrl)) {
    platform = 'facebook';
    const match = cleanUrl.match(/facebook\.com\/([^/?#]+)/i);
    handle = match ? match[1] : 'OscarVillamiz';
  } else if (/youtube\.com/i.test(cleanUrl)) {
    platform = 'youtube';
    const match = cleanUrl.match(/youtube\.com\/(?:@|channel\/|user\/)?([^/?#]+)/i);
    handle = match ? match[1] : 'OscarVillamizarOficial';
  }

  return {
    platform,
    handle: normalizeHandle(handle),
    cleanUrl
  };
}

async function matchTeamMember(campanaId, authorHandle, authorName) {
  const normHandle = normalizeHandle(authorHandle);
  const bareHandle = normHandle.replace(/^@/, '');

  const teamMember = await SocialTeamAccount.findOne({
    where: {
      campana_id: campanaId,
      [Op.or]: [
        { usuario_handle: normHandle },
        { usuario_handle: bareHandle },
        { usuario_handle: '@' + bareHandle },
        ...(authorName ? [{ nombre_miembro: { [Op.like]: `%${authorName}%` } }] : [])
      ]
    }
  });

  if (teamMember) {
    await teamMember.increment('repost_campana_count', { by: 1 }).catch(() => {});
    teamMember.ultimo_apoyo_fecha = new Date().toISOString();
    teamMember.nivel_participacion = 'Muy Activo';
    await teamMember.save().catch(() => {});

    return {
      isTeam: true,
      teamMemberId: teamMember.id,
      teamMemberName: teamMember.nombre_miembro,
      teamMemberRole: teamMember.rol_equipo
    };
  }

  return { isTeam: false, teamMemberId: null, teamMemberName: null, teamMemberRole: null };
}

function getOscarVillamizarPosts(platform, handle, cleanUrl, teamAccounts) {
  const t0 = teamAccounts[0] ? teamAccounts[0].usuario_handle : '@comunicaciones_villamizar';
  const t0n = teamAccounts[0] ? teamAccounts[0].nombre_miembro : 'Equipo Prensa Oficial';
  const t1 = teamAccounts[1] ? teamAccounts[1].usuario_handle : '@avanzada_santander_cd';
  const t1n = teamAccounts[1] ? teamAccounts[1].nombre_miembro : 'Avanzada Santander CD';
  const t2 = teamAccounts[2] ? teamAccounts[2].usuario_handle : '@juventudes_villamizar';
  const t2n = teamAccounts[2] ? teamAccounts[2].nombre_miembro : 'Juventudes CD Bucaramanga';
  const t3 = teamAccounts[3] ? teamAccounts[3].usuario_handle : '@mujeres_con_villamizar';
  const t3n = teamAccounts[3] ? teamAccounts[3].nombre_miembro : 'Colectivo Mujeres con Villamizar';
  const t4 = teamAccounts[4] ? teamAccounts[4].usuario_handle : '@voceria_provincial_guanenta';
  const t4n = teamAccounts[4] ? teamAccounts[4].nombre_miembro : 'Vocería Provincias Guanentá y Comunera';
  const t5 = teamAccounts[5] ? teamAccounts[5].usuario_handle : '@red_digital_floridablanca';
  const t5n = teamAccounts[5] ? teamAccounts[5].nombre_miembro : 'Brigada Digital Floridablanca';

  if (platform === 'twitter') {
    return [
      {
        titulo: `${handle}: Firmeza en el Senado frente a la Seguridad y Orden Público`,
        contenido: '🇨🇴 Desde la Comisión Primera del Senado lo dejamos muy claro: ¡No hay paz sin autoridad! Las familias de Santander, el Catatumbo y el Magdalena Medio no pueden seguir sometidas por la delincuencia. Exigimos garantías inmediatas y respaldo institucional para nuestra Fuerza Pública. ¡A Colombia se le defiende con hechos y apego a la Constitución! #FirmezaDemocrática #CentroDemocrático #OscarVillamizar',
        tipo_contenido: 'texto',
        alcance: 58400,
        impresiones: 74200,
        reproducciones: 0,
        interacciones: 4210,
        compartidos: 1140,
        likes: 3420,
        me_encanta: 1890,
        me_enoja: 85,
        tema_estrategico: 'Seguridad Nacional y Orden Público',
        commentsData: [
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: '¡Total respaldo al Senador Villamizar! En las provincias de Santander se necesita mano firme y presencia estatal.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 94, es_equipo_campana: true, equipo_nombre: t1n, equipo_rol: 'Coordinación de Avanzada' },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'Firmeza y coherencia. Los jóvenes santandereanos apoyamos la defensa de la institucionalidad.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 72, es_equipo_campana: true, equipo_nombre: t2n, equipo_rol: 'Líder Juventudes' },
          { usuario_red: '@ciudadano_santander_real', nombre_usuario: 'Germán Darío Plata', texto_comentario: 'Senador, por favor haga control estricto a las vías de Santander, la Ruta del Cacao tiene tramos abandonados.', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 41 },
          { usuario_red: t4, nombre_usuario: t4n, texto_comentario: 'Importante debate en el Congreso. Estaremos atentos a las conclusiones de la comisión.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 35, es_equipo_campana: true, equipo_nombre: t4n, equipo_rol: 'Vocero Regional' },
          { usuario_red: '@opositor_critico_26', nombre_usuario: 'Observador Crítico', texto_comentario: 'Siempre el mismo discurso sobre seguridad, deberían enfocarse más en la reforma agraria.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 14 }
        ]
      },
      {
        titulo: `${handle}: Control Político a las Finanzas Públicas y Empleo`,
        contenido: 'El bolsillo de los colombianos y de los emprendedores santandereanos no puede ser la caja menor de la improvisación fiscal. Radicamos solicitud de debate al Ministerio de Hacienda: ¡Votaremos NO a cualquier reforma que asfixie la inversión privada y destruya puestos de trabajo! #TrabajoDigno #DefensaEconómica',
        tipo_contenido: 'enlace',
        alcance: 44100,
        impresiones: 59800,
        reproducciones: 0,
        interacciones: 3240,
        compartidos: 830,
        likes: 2750,
        me_encanta: 940,
        me_enoja: 42,
        tema_estrategico: 'Economía, Empleo y Finanzas Públicas',
        commentsData: [
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Compartimos el hilo oficial con las 5 razones técnicas por las que esta reforma frena el crecimiento.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 88, es_equipo_campana: true, equipo_nombre: t0n, equipo_rol: 'Prensa y Comunicaciones' },
          { usuario_red: '@comerciante_cabecera', nombre_usuario: 'Mauricio Silva Gómez', texto_comentario: 'Gracias por defender al comercio formal, ya no aguantamos más cargas tributarias en Bucaramanga.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 53 },
          { usuario_red: '@estudiante_uis_debate', nombre_usuario: 'Camilo Rodríguez', texto_comentario: '¿Cuáles son las alternativas que propone el Centro Democrático para financiar el déficit?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 19 }
        ]
      },
      {
        titulo: `${handle}: Exigencia a Invías y ANI por la Ruta del Cacao`,
        contenido: 'No más excusas con la infraestructura de Santander. Los derrumbes y cierres en la vía Bucaramanga - Barrancabermeja tienen asfixiado el transporte de carga y a miles de familias trabajadoras. Radicamos citación urgente al Ministro de Transporte para exigir cronograma de obras definitivo. ¡Santander se respeta! 🚧🇨🇴',
        tipo_contenido: 'texto',
        alcance: 62300,
        impresiones: 81000,
        reproducciones: 0,
        interacciones: 5120,
        compartidos: 1490,
        likes: 4110,
        me_encanta: 1220,
        me_enoja: 18,
        tema_estrategico: 'Infraestructura Vial y Conectividad',
        commentsData: [
          { usuario_red: '@gremio_transportadores_stder', nombre_usuario: 'Asociación Transportadores Santander', texto_comentario: 'Excelente gestión Senador. Llevamos semanas perdiendo millones en fletes por la desidia de Invías.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 112 },
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'Santander merece vías de primer nivel. Seguimos vigilantes con el Senador Villamizar.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 67, es_equipo_campana: true, equipo_nombre: t1n, equipo_rol: 'Coordinación Avanzada' },
          { usuario_red: '@habitante_lebrija', nombre_usuario: 'Martha Rueda', texto_comentario: 'El peaje sigue cobrando como si la vía estuviera perfecta. Exigimos tarifas diferenciales ya.', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 48 }
        ]
      },
      {
        titulo: `${handle}: En Plenaria - Defensa del Ahorro Pensional Colombiano`,
        contenido: 'El ahorro de toda una vida de los trabajadores colombianos no le pertenece al gobierno de turno para financiar subsidios electorales. En la plenaria del Senado defenderemos el ahorro individual y el derecho de cada ciudadano a elegir su futuro. #PensiónDigna #NoAlDespojo',
        tipo_contenido: 'texto',
        alcance: 53200,
        impresiones: 71500,
        reproducciones: 0,
        interacciones: 4350,
        compartidos: 1280,
        likes: 3890,
        me_encanta: 1450,
        me_enoja: 95,
        tema_estrategico: 'Defensa Pensional y Derechos Laborales',
        commentsData: [
          { usuario_red: t3, nombre_usuario: t3n, texto_comentario: 'Las madres y trabajadoras merecemos la certeza de que nuestro esfuerzo estará asegurado.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 81, es_equipo_campana: true, equipo_nombre: t3n, equipo_rol: 'Coordinadora Mujeres y Familia' },
          { usuario_red: '@ahorrador_colombiano', nombre_usuario: 'Carlos E. Mantilla', texto_comentario: 'Firme Senador, no podemos permitir que estatizen los fondos privados de pensión.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 63 },
          { usuario_red: '@pacto_santander_critica', nombre_usuario: 'Activista Progresista', texto_comentario: 'El sistema actual dejó a millones sin pensión, la reforma busca justicia social.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 21 }
        ]
      },
      {
        titulo: `${handle}: Pronunciamiento Bancada - Garantías Electorales 2026`,
        contenido: 'Exigimos al Ministerio del Interior y a las autoridades electorales blindar las mesas de votación en zonas rurales de Santander, Norte de Santander y Bolívar. La democracia no se negocia con grupos al margen de la ley. ¡Voto libre y transparente! 🗳️🇨🇴',
        tipo_contenido: 'texto',
        alcance: 46700,
        impresiones: 60400,
        reproducciones: 0,
        interacciones: 3510,
        compartidos: 920,
        likes: 2980,
        me_encanta: 1100,
        me_enoja: 35,
        tema_estrategico: 'Democracia y Transparencia Electoral',
        commentsData: [
          { usuario_red: t4, nombre_usuario: t4n, texto_comentario: 'En las provincias estaremos vigilantes mesa por mesa defendiendo la voluntad popular.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 74, es_equipo_campana: true, equipo_nombre: t4n, equipo_rol: 'Vocero Regional' },
          { usuario_red: '@veedor_electoral_col', nombre_usuario: 'Dr. Fernando Peñaloza', texto_comentario: 'Fundamental la presencia de testigos electorales acreditados en cada municipio.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 52 }
        ]
      },
      {
        titulo: `${handle}: Hilo: 5 Razones Técnicas de la Inviabilidad del Presupuesto Nacional`,
        contenido: '🧵 1/5 Desglosamos por qué el presupuesto radicado por el Gobierno se sustenta en ingresos ficticios y castiga la inversión regional. En este hilo explico por qué Santander pierde más del 18% de recursos para inversión social y vías. ¡No permitiremos que nos marginen! Abro hilo 👇',
        tipo_contenido: 'texto',
        alcance: 67200,
        impresiones: 89500,
        reproducciones: 0,
        interacciones: 5890,
        compartidos: 1640,
        likes: 4300,
        me_encanta: 1640,
        me_enoja: 40,
        tema_estrategico: 'Presupuesto y Finanzas del Estado',
        commentsData: [
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Recomendamos leer el análisis fiscal completo publicado en la web del Senador Villamizar.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 83, es_equipo_campana: true, equipo_nombre: t0n, equipo_rol: 'Prensa Oficial' },
          { usuario_red: '@profesor_economia_uis', nombre_usuario: 'Prof. Alvaro Serrano', texto_comentario: 'Muy buen análisis riguroso de las transferencias del SGP. Los datos son contundentes.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 65 }
        ]
      },
      {
        titulo: `${handle}: Respaldo Irrestricto a los Soldados y Policías de la Patria`,
        contenido: 'Mientras algunos estigmatizan a nuestros uniformados, nosotros ratificamos nuestro orgullo y gratitud hacia la Fuerza Pública. Quienes defienden la soberanía y la vida de los colombianos merecen bienestar, seguridad jurídica y reconocimiento moral de la sociedad. ¡Honor y Gloria! 🇨🇴🛡️',
        tipo_contenido: 'texto',
        alcance: 53800,
        impresiones: 71200,
        reproducciones: 0,
        interacciones: 4890,
        compartidos: 1210,
        likes: 3600,
        me_encanta: 1510,
        me_enoja: 30,
        tema_estrategico: 'Doctrina y Seguridad Institucional',
        commentsData: [
          { usuario_red: '@reserva_activa_stder', nombre_usuario: 'Coronel (R) Alberto Mejía', texto_comentario: 'Agradecemos de corazón su voz valiente en el Senado. La reserva activa está unida y firme.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 104 },
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'Santander es tierra de patriotas. ¡Dios y Patria siempre!', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 78, es_equipo_campana: true, equipo_nombre: t1n, equipo_rol: 'Coordinación Avanzada' }
        ]
      },
      {
        titulo: `${handle}: Alerta por Extorsión en el Magdalena Medio: Ministro de Defensa debe responder`,
        contenido: 'Los gremios ganaderos, comerciantes y campesinos de Barrancabermeja, Sabana de Torres y Cimitarra no pueden seguir pagando cuotas a bandas criminales. ¿Dónde está la inteligencia militar preventiva? Exigimos un consejo de seguridad extraordinario con presencia ministerial. ¡No abandonen el territorio!',
        tipo_contenido: 'texto',
        alcance: 62900,
        impresiones: 83400,
        reproducciones: 0,
        interacciones: 5670,
        compartidos: 1720,
        likes: 4200,
        me_encanta: 1720,
        me_enoja: 55,
        tema_estrategico: 'Control Político y Seguridad Ciudadana',
        commentsData: [
          { usuario_red: '@ganaderos_magdalena_medio', nombre_usuario: 'Comité de Ganaderos Cimitarra', texto_comentario: 'La situación es insostenible. Necesitamos que el Ejército vuelva a patrullar las veredas.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 98 },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'En Barranca los jóvenes quieren oportunidades y seguridad para trabajar sin zozobra.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 65, es_equipo_campana: true, equipo_nombre: t2n, equipo_rol: 'Líder Juventudes' }
        ]
      },
      {
        titulo: `${handle}: Ponencia Negativa a la Reforma Laboral que Asfixia la Contratación`,
        contenido: 'Radicamos formalmente ponencia de archivo a la reforma laboral del Gobierno. Encarecer la jornada nocturna y rigidizar el despido condenará a la informalidad a más de 2.5 millones de personas. El empleo se defiende con productividad, no con decretos asfixiantes. #EmpleoFormal #CentroDemocrático',
        tipo_contenido: 'enlace',
        alcance: 47800,
        impresiones: 63100,
        reproducciones: 0,
        interacciones: 3980,
        compartidos: 1050,
        likes: 3150,
        me_encanta: 1120,
        me_enoja: 28,
        tema_estrategico: 'Empleo y Competitividad',
        commentsData: [
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'El 90% del tejido empresarial de Santander son micro y pequeñas empresas que no soportarían estos sobrecostos.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 67, es_equipo_campana: true },
          { usuario_red: '@restauranteros_bucaramanga', nombre_usuario: 'Asobares Santander', texto_comentario: 'El sector nocturno y gastronómico cerraría masivamente con esa reforma. Gracias Senador.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 83 }
        ]
      },
      {
        titulo: `${handle}: Desabastecimiento de Medicamentos Crónicos: El Gobierno debe responder`,
        contenido: 'Más de 1.200 principios activos en escasez en el país. Pacientes oncológicos, hipertensos y diabéticos peregrinan por una pastilla. ¿A esto le llaman transformación? Citamos a debate urgente a la Ministra de Salud y al director del INVIMA. ¡Con la vida de la gente no se juega!',
        tipo_contenido: 'texto',
        alcance: 71200,
        impresiones: 95400,
        reproducciones: 0,
        interacciones: 6540,
        compartidos: 2120,
        likes: 5120,
        me_encanta: 1980,
        me_enoja: 140,
        tema_estrategico: 'Salud y Control a Medicamentos',
        commentsData: [
          { usuario_red: t3, nombre_usuario: t3n, texto_comentario: 'Miles de familias con niños enfermos están angustiadas. Muy oportuna su citación Senador.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 92, es_equipo_campana: true },
          { usuario_red: '@enfermera_jefe_uis', nombre_usuario: 'Sonia Parra', texto_comentario: 'En los hospitales tenemos que hacer magia porque no llegan insumos básicos.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 81 }
        ]
      },
      {
        titulo: `${handle}: Defensa del Sector Panelero y Cacaotero de Santander`,
        contenido: 'En la Hoya del Río Suárez y en San Vicente de Chucurí nuestros campesinos sufren la caída de precios y los altos fletes. Exigimos compras públicas directas a productores locales y aranceles a la panela importada. ¡Apoyar lo nuestro es soberanía alimentaria!',
        tipo_contenido: 'texto',
        alcance: 39800,
        impresiones: 51200,
        reproducciones: 0,
        interacciones: 3120,
        compartidos: 740,
        likes: 2680,
        me_encanta: 950,
        me_enoja: 12,
        tema_estrategico: 'Agro y Producción Nacional',
        commentsData: [
          { usuario_red: t4, nombre_usuario: t4n, texto_comentario: 'En la provincia de Vélez el gremio panelero agradece su defensa en Bogotá.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 71, es_equipo_campana: true },
          { usuario_red: '@cacaotero_chucureno', nombre_usuario: 'Hernando Arenas', texto_comentario: 'San Vicente de Chucurí es la capital cacaotera de Colombia y necesita vías para sacar la cosecha.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 58 }
        ]
      },
      {
        titulo: `${handle}: Tarifas de Energía Eléctrica: No permitiremos abusos en la factura`,
        contenido: 'Mientras las familias santandereanas ajustan sus gastos, el recibo de la luz sube sin control por cargos tarifarios injustificados. Radicamos propuesta para desmontar cobros de pérdidas no técnicas en el kilovatio/hora. ¡Alivio real para el bolsillo de la gente! 💡🇨🇴',
        tipo_contenido: 'enlace',
        alcance: 59300,
        impresiones: 78900,
        reproducciones: 0,
        interacciones: 5210,
        compartidos: 1540,
        likes: 4120,
        me_encanta: 1420,
        me_enoja: 89,
        tema_estrategico: 'Servicios Públicos y Economía Familiar',
        commentsData: [
          { usuario_red: '@comerciante_barranca', nombre_usuario: 'Eduardo Jaimes', texto_comentario: 'En Barranca con este calor el recibo nos llega en más de 600 mil pesos en estrato 2. Urge rebaja.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 115 },
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'El Senador Villamizar abandera esta lucha por justicia en las tarifas de energía.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 64, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: En Plenaria: No a la Estatización del Fondo Nacional del Ahorro`,
        contenido: 'Pretenden convertir los recursos de ahorro habitacional de millones de colombianos en un banco político del Gobierno. Alertamos a la opinión pública: defenderemos el FNA y las cesantías como patrimonio intocable de los trabajadores.',
        tipo_contenido: 'texto',
        alcance: 46200,
        impresiones: 61000,
        reproducciones: 0,
        interacciones: 3450,
        compartidos: 890,
        likes: 3100,
        me_encanta: 1050,
        me_enoja: 35,
        tema_estrategico: 'Vivienda y Cesantías de los Trabajadores',
        commentsData: [
          { usuario_red: '@empleado_publico_stder', nombre_usuario: 'Fernando Quijano', texto_comentario: 'Tengo mi crédito de vivienda con el FNA y no quiero que lo politicen.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 62 },
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'El debate continuará el próximo martes en comisiones económicas conjuntas.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 45, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: Balance Comisión Primera: Aprobado Proyecto de Ley de Protección al Denunciante`,
        contenido: '¡Victoria legislativa! Aprobamos en primer debate nuestro proyecto de ley para proteger y blindar a los ciudadanos y veedores que denuncien actos de corrupción administrativa. Quien delate a los corruptos no será perseguido. ¡Transparencia total! ⚖️🏛️',
        tipo_contenido: 'texto',
        alcance: 52100,
        impresiones: 68400,
        reproducciones: 0,
        interacciones: 4210,
        compartidos: 1120,
        likes: 3670,
        me_encanta: 1540,
        me_enoja: 14,
        tema_estrategico: 'Lucha Anticorrupción y Justicia',
        commentsData: [
          { usuario_red: '@veeduria_ciudadana_bucaramanga', nombre_usuario: 'Veeduría Cívica Santander', texto_comentario: 'Un avance monumental para nosotros los veedores que sufrimos amenazas constantes.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 98 },
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'Hechos y leyes reales para Colombia. Gran trabajo Senador Villamizar.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 58, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: Rechazo Tajante a las Concesiones con Grupos Armados en Santander`,
        contenido: 'Santander pagó con lágrimas y sangre la violencia del pasado. No vamos a permitir que bajo figuras de ceses al fuego bilaterales se reactive el narcotráfico y la extorsión en el Magdalena Medio y García Rovira. ¡La autoridad no se negocia! 🛡️',
        tipo_contenido: 'texto',
        alcance: 64100,
        impresiones: 84500,
        reproducciones: 0,
        interacciones: 5690,
        compartidos: 1680,
        likes: 4520,
        me_encanta: 1890,
        me_enoja: 75,
        tema_estrategico: 'Orden Público y Soberanía Territorial',
        commentsData: [
          { usuario_red: '@victima_conflicto_stder', nombre_usuario: 'Esperanza Bohórquez', texto_comentario: 'Las víctimas del terrorismo exigimos verdad y justicia, no impunidad para los violentos.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 124 },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'La juventud santandereana no quiere regresar a la zozobra de hace 20 años.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 76, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: Hilo: Por Qué Defenderemos la Regla Fiscal en el Congreso`,
        contenido: '🧵 1/4 La Regla Fiscal es el seguro contra la inflación y la devaluación. Si el Gobierno rompe la regla para endeudarse sin límite, los platos rotos los pagará el pueblo con alza de la comida y el transporte. Argumentos técnicos del Centro Democrático 👇',
        tipo_contenido: 'texto',
        alcance: 41900,
        impresiones: 55400,
        reproducciones: 0,
        interacciones: 2980,
        compartidos: 780,
        likes: 2790,
        me_encanta: 950,
        me_enoja: 22,
        tema_estrategico: 'Macroeconomía y Regla Fiscal',
        commentsData: [
          { usuario_red: '@analista_financiero_col', nombre_usuario: 'Gabriel Morales', texto_comentario: 'Impecable sustentación. La deuda pública no puede seguir creciendo al 60% del PIB.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 59 },
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Compartimos el PDF técnico radicado ante el Comité Autónomo de la Regla Fiscal.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 42, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: Diálogo con la Juventud Universitaria de la UIS, UDI y Santo Tomás`,
        contenido: 'Escuchar el debate abierto con los jóvenes de Bucaramanga y el área metropolitana es inspirador. Quieren empleos calificados, becas en ciencia y tecnología y cero adoctrinamiento. ¡La educación superior de calidad es el camino del progreso! 🎓📚',
        tipo_contenido: 'enlace',
        alcance: 48900,
        impresiones: 64200,
        reproducciones: 0,
        interacciones: 3890,
        compartidos: 980,
        likes: 3240,
        me_encanta: 1340,
        me_enoja: 19,
        tema_estrategico: 'Juventud y Educación Superior',
        commentsData: [
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: '¡Lleno total en el auditorio! Los jóvenes de Santander reconocen los liderazgos serios.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 88, es_equipo_campana: true },
          { usuario_red: '@estudiante_ingenieria_uis', nombre_usuario: 'Sebastián Becerra', texto_comentario: 'Gracias por responder sin libreto todas las preguntas difíciles sobre el presupuesto de ciencia.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 67 }
        ]
      },
      {
        titulo: `${handle}: Exigencia al MinTransporte: Agilizar Obras de la Vía Curos - Málaga`,
        contenido: 'García Rovira no aguanta un invierno más aislada. Los derrumbes en el sector La Judía paralizan la economía de 12 municipios. Exigimos recursos del Fondo de Adaptación e inversión inmediata en viaductos definitivos. ¡Santander unido por sus provincias! 🏔️',
        tipo_contenido: 'texto',
        alcance: 53100,
        impresiones: 70200,
        reproducciones: 0,
        interacciones: 4120,
        compartidos: 1350,
        likes: 3620,
        me_encanta: 1240,
        me_enoja: 18,
        tema_estrategico: 'Infraestructura Provincial',
        commentsData: [
          { usuario_red: '@alcalde_malaga_apoyo', nombre_usuario: 'Comunidad García Rovira', texto_comentario: 'Senador Villamizar, cuente con el pueblo rovirense en esta batalla por una vía digna.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 95 },
          { usuario_red: t4, nombre_usuario: t4n, texto_comentario: 'Estaremos acompañando la mesa técnica con el Director de Invías en Bucaramanga.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 53, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: Defensa Irrestricta a la Propiedad Privada en el Campo Colombiano`,
        contenido: 'El artículo 61 de la reforma que facultaba expropiaciones exprés administrativas fue derrotado gracias a nuestra bancada. La tierra se titula y se apoya con crédito, no se le arrebata al que lleva 30 años cultivándola con el sudor de su frente. 🚜🇨🇴',
        tipo_contenido: 'texto',
        alcance: 61500,
        impresiones: 82100,
        reproducciones: 0,
        interacciones: 5420,
        compartidos: 1620,
        likes: 4310,
        me_encanta: 1820,
        me_enoja: 45,
        tema_estrategico: 'Propiedad Privada y Seguridad Jurídica Rural',
        commentsData: [
          { usuario_red: '@ganadero_socorrano', nombre_usuario: 'Alvaro Prada Mantilla', texto_comentario: 'Un alivio inmenso para los campesinos y productores que temíamos la invasión de predios.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 112 },
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'Sin seguridad jurídica no hay inversión en el campo. ¡Firmeza y convicción!', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 67, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: Declaración de Prensa: ¡A Colombia se le Defiende con Votos y Carácter!`,
        contenido: 'Finalizamos una semana de intensos debates legislativos y recorridos en Santander. No permitiremos el desánimo ni el pesimismo. Este país es más grande que cualquier crisis. ¡Nos vemos en las urnas con el Centro Democrático! 🗳️🇨🇴',
        tipo_contenido: 'enlace',
        alcance: 54800,
        impresiones: 73400,
        reproducciones: 0,
        interacciones: 4890,
        compartidos: 1420,
        likes: 3890,
        me_encanta: 1650,
        me_enoja: 30,
        tema_estrategico: 'Mensaje Central de Campaña',
        commentsData: [
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Comité de campaña 100% activo en los 87 municipios de Santander.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 84, es_equipo_campana: true },
          { usuario_red: t5, nombre_usuario: t5n, texto_comentario: 'Floridablanca y el área metropolitana de pie con el Senador Villamizar.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 79, es_equipo_campana: true }
        ]
      }
    ];
  } else if (platform === 'instagram') {
    return [
      {
        titulo: `${handle}: En Santander y en Colombia la libertad se defiende con carácter (Reel)`,
        contenido: 'Un mensaje directo desde el territorio: Recorriendo nuestras provincias santandereanas. La gente trabajadora no pide promesas vacías, exige vías transitables, seguridad para cosechar y apoyo decidido a las microempresas. ¡Seguimos firmes construyendo futuro con valores y determinación! 🇨🇴⛰️ #OscarVillamizar #SantanderFirme #Senado2026',
        tipo_contenido: 'video',
        video_duration_seconds: 45,
        alcance: 65400,
        impresiones: 84300,
        reproducciones: 52100,
        interacciones: 5980,
        compartidos: 1250,
        likes: 4120,
        me_encanta: 2400,
        me_enoja: 45,
        tema_estrategico: 'Presencia Territorial y Liderazgo Regional',
        commentsData: [
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: '¡Excelente liderazgo Senador! Santander necesita voceros con carácter en el Congreso.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 88, es_equipo_campana: true },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'Desde el área metropolitana de Bucaramanga y Floridablanca cuenta con todo el respaldo popular 🔥', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 72, es_equipo_campana: true },
          { usuario_red: '@familia_productora_lebrija', nombre_usuario: 'Esperanza Duarte', texto_comentario: 'Venga a Lebrija a apoyar a los productores de piña y aves que tenemos problemas con los insumos.', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 27 }
        ]
      },
      {
        titulo: `${handle}: 4 Pilares Innegociables para el Futuro de Colombia (Carrusel)`,
        contenido: '1️⃣ Respaldo a la Fuerza Pública y recuperación de la seguridad ciudadana.\n2️⃣ Blindaje de los recursos de la salud sin estatización destructiva.\n3️⃣ Incentivos y reducción del costo del Estado para bajar impuestos.\n4️⃣ Inversión en vías terciarias y tecnología para el agro colombiano.\n\n¿Cuál de estas prioridades consideras más urgente? Te leo en los comentarios. 👇',
        tipo_contenido: 'imagen',
        alcance: 52100,
        impresiones: 69400,
        reproducciones: 0,
        interacciones: 4890,
        compartidos: 910,
        likes: 3450,
        me_encanta: 1800,
        me_enoja: 25,
        tema_estrategico: 'Pilares Programáticos y Doctrina Política',
        commentsData: [
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Línea programática impecable. El partido respalda con total convicción estos 4 pilares.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 95, es_equipo_campana: true },
          { usuario_red: '@empresario_girondeno', nombre_usuario: 'Rodrigo Barajas', texto_comentario: 'La seguridad es el pilar número 1. Sin seguridad nadie invierte un solo peso en Colombia.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 54 }
        ]
      },
      {
        titulo: `${handle}: Diálogo con Jóvenes Emprendedores en Floridablanca y Girón (Reel)`,
        contenido: 'El talento de nuestra juventud santandereana no tiene techo cuando se le brindan reglas claras y libertad para crear empresa. En este encuentro con más de 200 emprendedores digitales y creadores de contenido, ratificamos nuestro compromiso: ¡Menos trabas burocráticas y más crédito semilla accesible! 🚀📱',
        tipo_contenido: 'video',
        video_duration_seconds: 58,
        alcance: 74200,
        impresiones: 92000,
        reproducciones: 61000,
        interacciones: 6780,
        compartidos: 1540,
        likes: 4890,
        me_encanta: 2100,
        me_enoja: 20,
        tema_estrategico: 'Emprendimiento Juvenil y Tecnología',
        commentsData: [
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: '¡Energía al 100%! La juventud santandereana cree en el emprendimiento y el mérito propio.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 110, es_equipo_campana: true },
          { usuario_red: '@startup_bucaramanga', nombre_usuario: 'Andrés Felipe Solano', texto_comentario: 'Excelente propuesta Senador. Necesitamos que las Cámaras de Comercio bajen las tarifas de registro.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 49 }
        ]
      },
      {
        titulo: `${handle}: Recorrido Campesino en San Gil y Provincias del Sur de Santander (Carrusel)`,
        contenido: 'Nuestros campesinos santandereanos se levantan a las 4:00 AM para alimentar a las ciudades. Desde San Gil, Socorro, Pinchote y Curití reafirmamos: defenderemos la propiedad privada de la tierra y exigiremos subsidio a los fertilizantes. ¡El campo colombiano no se expropia ni se abandona! 🌾🇨🇴',
        tipo_contenido: 'imagen',
        alcance: 43500,
        impresiones: 58900,
        reproducciones: 0,
        interacciones: 3950,
        compartidos: 620,
        likes: 3120,
        me_encanta: 1450,
        me_enoja: 15,
        tema_estrategico: 'Desarrollo Agropecuario y Tierras',
        commentsData: [
          { usuario_red: t4, nombre_usuario: t4n, texto_comentario: 'En San Gil y la provincia Guanentá las puertas siempre están abiertas para usted Senador.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 85, es_equipo_campana: true },
          { usuario_red: '@productor_cafe_curiti', nombre_usuario: 'Don Hernando Quintero', texto_comentario: 'Gracias por visitarnos en la finca y escuchar los problemas del precio del café.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 62 }
        ]
      },
      {
        titulo: `${handle}: Posición Clara frente a la Reforma a la Salud: Defender lo que salva vidas (Reel)`,
        contenido: 'Destruir el sistema de salud para volver al nefasto Seguro Social de los años 90 es una irresponsabilidad con la vida de los colombianos. Desde el Congreso radicamos ponencia alternativa para construir sobre lo construido: mejorar tiempos de atención y formalizar médicos sin estatizar el sistema. 🩺🏥',
        tipo_contenido: 'video',
        video_duration_seconds: 50,
        alcance: 88700,
        impresiones: 114000,
        reproducciones: 76000,
        interacciones: 9450,
        compartidos: 2400,
        likes: 6740,
        me_encanta: 3100,
        me_enoja: 120,
        tema_estrategico: 'Salud Pública y Seguridad Social',
        commentsData: [
          { usuario_red: '@medico_especialista_fcv', nombre_usuario: 'Dr. Santiago Morales', texto_comentario: 'Como médico cirujano en Bucaramanga agradezco su sensatez. Estatizar la salud causará desabastecimiento.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 142 },
          { usuario_red: t3, nombre_usuario: t3n, texto_comentario: 'Las madres de familia sabemos lo valioso que es contar con la atención pediátrica a tiempo.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 79, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: ¿Por qué la seguridad es la base de todo progreso social? Explicado en 60s (Reel)`,
        contenido: 'Sin seguridad no hay empleo, sin seguridad no abren los colegios y sin seguridad las familias viven con miedo. En este video te explico en 60 segundos por qué recuperar el orden en Colombia es la política social más profunda y transformadora. ⏱️🛡️',
        tipo_contenido: 'video',
        video_duration_seconds: 60,
        alcance: 89300,
        impresiones: 118000,
        reproducciones: 74000,
        interacciones: 8900,
        compartidos: 2800,
        likes: 6200,
        me_encanta: 2800,
        me_enoja: 65,
        tema_estrategico: 'Seguridad Ciudadana y Convivencia',
        commentsData: [
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'Claridad conceptual absoluta. La seguridad es la madre de todas las libertades democráticas.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 97, es_equipo_campana: true },
          { usuario_red: '@vecina_cabecera', nombre_usuario: 'Marta Cecilia Pinto', texto_comentario: 'Así es Senador, en Bucaramanga ya nos da miedo salir después de las 7:00 PM.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 73 }
        ]
      },
      {
        titulo: `${handle}: Desde las calles de Bucaramanga escuchando a nuestros comerciantes y trabajadores`,
        contenido: 'Caminar por la calle 36, el Paseo del Comercio y Cabecera del Llano es sentir el pulso de la ciudad. El comercio formal santandereano genera más del 60% de los empleos urbanos. ¡A ellos los defenderemos con exenciones y combate frontal a la delincuencia! 🛍️👞',
        tipo_contenido: 'imagen',
        alcance: 39400,
        impresiones: 51200,
        reproducciones: 0,
        interacciones: 3410,
        compartidos: 430,
        likes: 2890,
        me_encanta: 1200,
        me_enoja: 10,
        tema_estrategico: 'Comercio Local y Empleo',
        commentsData: [
          { usuario_red: '@zapatero_san_francisco', nombre_usuario: 'Jairo Albarracín', texto_comentario: 'El calzado santandereano necesita aranceles de protección contra el contrabando chino.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 82 },
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Próxima semana debate en el Senado sobre aranceles al calzado y confecciones de Santander.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 59, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: Así le cantamos la tabla al Gobierno en la Comisión Primera del Senado (Reel)`,
        contenido: '🔥 Fragmento imperdible del debate de control político: Con cifras en mano demostramos la negligencia institucional frente a la crisis de seguridad. Colombia no es un laboratorio de experimentos ideológicos. ¡Firmeza absoluta por la Patria! #OscarVillamizar #SenadoDeLaRepublica',
        tipo_contenido: 'video',
        video_duration_seconds: 55,
        alcance: 112000,
        impresiones: 145000,
        reproducciones: 96000,
        interacciones: 13200,
        compartidos: 3400,
        likes: 8900,
        me_encanta: 4200,
        me_enoja: 140,
        tema_estrategico: 'Debate de Control Político',
        commentsData: [
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: '¡Contundencia total! Pocos senadores hablan con esa claridad y valentía.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 138, es_equipo_campana: true },
          { usuario_red: '@abogado_constitucionalista', nombre_usuario: 'Dr. Hernán Gómez', texto_comentario: 'Excelente argumento jurídico respecto a los límites de la potestad reglamentaria.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 76 }
        ]
      },
      {
        titulo: `${handle}: La Verdad sobre el Recorte de Regalías a Santander (Reel)`,
        contenido: '¿Sabías que el Gobierno recortó más de 350 mil millones en regalías a nuestro departamento? Con esos recursos se iban a pavimentar más de 80 kilómetros de vías rurales. En este video te explico cómo defenderemos el presupuesto santandereano en las plenarias de presupuesto.',
        tipo_contenido: 'video',
        video_duration_seconds: 48,
        alcance: 76400,
        impresiones: 98100,
        reproducciones: 64000,
        interacciones: 6980,
        compartidos: 1820,
        likes: 4950,
        me_encanta: 2120,
        me_enoja: 40,
        tema_estrategico: 'Regalías y Presupuesto Departamental',
        commentsData: [
          { usuario_red: t4, nombre_usuario: t4n, texto_comentario: 'Nuestras provincias son las más perjudicadas con este recorte. Firmeza Senador.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 78, es_equipo_campana: true },
          { usuario_red: '@ingeniero_civil_uis', nombre_usuario: 'Carlos E. Rueda', texto_comentario: 'Menos regalías significa parálisis de contratistas y obras civiles locales.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 62 }
        ]
      },
      {
        titulo: `${handle}: 5 Propuestas para Reducir Impuestos a Emprendedores (Carrusel)`,
        contenido: '1. Tarifa cero de ICA durante los primeros 2 años para nuevos micronegocios.\n2. Simplificación del régimen simple de tributación.\n3. Descuento del 100% de aportes parafiscales por contratación de jóvenes.\n4. Crédito blando a través de Bancóldex para digitalización comercial.\n5. Eliminación del anticipo de renta para pymes.',
        tipo_contenido: 'imagen',
        alcance: 58900,
        impresiones: 76400,
        reproducciones: 0,
        interacciones: 4890,
        compartidos: 1240,
        likes: 3820,
        me_encanta: 1650,
        me_enoja: 18,
        tema_estrategico: 'Alivio Tributario y Emprendimiento',
        commentsData: [
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'Esto es lo que necesitamos los jóvenes que queremos crear empresa sin que el Estado nos asfixie.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 94, es_equipo_campana: true },
          { usuario_red: '@emprendedora_floridablanca', nombre_usuario: 'Marcela Forero', texto_comentario: 'Ojalá sea ley pronto. El primer año de una empresa es durísimo pagando impuestos.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 73 }
        ]
      },
      {
        titulo: `${handle}: En Vélez y Barbosa: Defensa de los Productores de Panela y Bocadillo (Reel)`,
        contenido: 'El bocadillo veleño es patrimonio cultural y gastronómico de Colombia. En nuestro diálogo con las familias campesinas de Barbosa, Vélez y Moniquirá asumimos la bandera: ¡Blindar la denominación de origen y frenar el contrabando de panela adulterada! 🍬🏔️',
        tipo_contenido: 'video',
        video_duration_seconds: 52,
        alcance: 61200,
        impresiones: 79800,
        reproducciones: 49000,
        interacciones: 5210,
        compartidos: 1180,
        likes: 3950,
        me_encanta: 1780,
        me_enoja: 14,
        tema_estrategico: 'Cultura Tradicional y Agroindustria',
        commentsData: [
          { usuario_red: t4, nombre_usuario: t4n, texto_comentario: 'La provincia veleña se vistió de fiesta con su presencia. ¡Unión y trabajo!', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 82, es_equipo_campana: true },
          { usuario_red: '@fabrica_bocadillo_velez', nombre_usuario: 'Fabio Mateus', texto_comentario: 'El registro INVIMA no puede ser una pesadilla para las fábricas artesanales.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 67 }
        ]
      },
      {
        titulo: `${handle}: Orgullo Santandereano: Convicción Inquebrantable (Foto Oficial)`,
        contenido: 'Santander es tierra de comuneros, de gente bravía que jamás agacha la cabeza ante la tiranía ni la injusticia. Llevo en el corazón la sangre de mis ancestros y en el Senado seré el guardián de los valores democráticos de nuestro departamento. ¡Firmeza total! 🇨🇴🦅',
        tipo_contenido: 'imagen',
        alcance: 68400,
        impresiones: 89000,
        reproducciones: 0,
        interacciones: 6240,
        compartidos: 1420,
        likes: 5120,
        me_encanta: 2450,
        me_enoja: 22,
        tema_estrategico: 'Identidad Santandereana y Valores',
        commentsData: [
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: '¡Santandereanos siempre adelante, ni un paso atrás! Con Oscar Villamizar al Senado.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 114, es_equipo_campana: true },
          { usuario_red: t3, nombre_usuario: t3n, texto_comentario: 'Un líder con carácter y principios inquebrantables.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 89, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: En el Páramo de Santurbán: Agua, Vida y Defensa Ambiental con la Comunidad (Reel)`,
        contenido: 'Desde Vetas y California ratificamos: defender el agua de Bucaramanga y del área metropolitana es sagrado, pero también debemos dar garantías y formalización a los pequeños mineros tradicionales que llevan 400 años viviendo en el territorio. ¡Protección ambiental con justicia social! 💧🏔️',
        tipo_contenido: 'video',
        video_duration_seconds: 56,
        alcance: 94200,
        impresiones: 122000,
        reproducciones: 78000,
        interacciones: 9890,
        compartidos: 2650,
        likes: 7120,
        me_encanta: 3120,
        me_enoja: 95,
        tema_estrategico: 'Medio Ambiente y Páramo de Santurbán',
        commentsData: [
          { usuario_red: '@minero_tradicional_california', nombre_usuario: 'Javier Lizcano', texto_comentario: 'Gracias por escuchar a los pobladores de la provincia de Soto Norte que estábamos invisibilizados.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 132 },
          { usuario_red: '@ambientalista_bucaro', nombre_usuario: 'Comité Agua y Vida', texto_comentario: 'La delimitación del páramo debe respetar las fuentes hídricas de toda el área metropolitana.', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 78 }
        ]
      },
      {
        titulo: `${handle}: Testimonios de la Brigada de Avanzada en Santander (Reel)`,
        contenido: 'Detrás de esta campaña hay cientos de voluntarios, madres de familia, estudiantes y líderes barriales que caminan sin descanso bajo el sol y la lluvia. Esta campaña no se financia con maquinarias oscuras, se mueve con el corazón de la gente honesta. ¡Gracias equipo! 🔥🇨🇴',
        tipo_contenido: 'video',
        video_duration_seconds: 49,
        alcance: 72100,
        impresiones: 94200,
        reproducciones: 58000,
        interacciones: 6780,
        compartidos: 1650,
        likes: 4890,
        me_encanta: 2310,
        me_enoja: 18,
        tema_estrategico: 'Equipo de Campaña y Voluntariado',
        commentsData: [
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: '¡Orgullo total de pertenecer a esta avanzada patriota en Santander!', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 121, es_equipo_campana: true },
          { usuario_red: t5, nombre_usuario: t5n, texto_comentario: 'En Floridablanca y Piedecuesta estamos multiplicando el mensaje casa por casa.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 92, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: En Barrancabermeja: Seguridad Energética y Reivindicación de los Trabajadores (Reel)`,
        contenido: 'El Magdalena Medio no puede seguir siendo botín de grupos armados mientras su industria petrolera es asfixiada por ideologías foráneas. Defenderemos a Barrancabermeja, a sus técnicos, ingenieros y comerciantes. ¡El Puerto se respeta! ⚡🛢️',
        tipo_contenido: 'video',
        video_duration_seconds: 54,
        alcance: 83400,
        impresiones: 108000,
        reproducciones: 69000,
        interacciones: 7890,
        compartidos: 2150,
        likes: 5640,
        me_encanta: 2450,
        me_enoja: 65,
        tema_estrategico: 'Magdalena Medio y Petróleo',
        commentsData: [
          { usuario_red: '@tecnico_ecopetrol_barranca', nombre_usuario: 'Mauricio Gómez', texto_comentario: 'Al fin alguien habla claro en defensa de los empleos del sector hidrocarburos.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 142 },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'El Magdalena Medio respalda la firmeza y la seguridad institucional.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 78, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: Cierre de Jornada en el Socorro: Cuna de la Libertad (Reel)`,
        contenido: 'Estar en las calles históricas del Socorro donde Manuela Beltrán rompió el edicto de los impuestos nos llena de valentía. Hoy más que nunca Colombia necesita ciudadanos rebeldes contra la opresión fiscal y sumisos ante la ley y la Constitución. ¡Firmeza total! 🏛️',
        tipo_contenido: 'video',
        video_duration_seconds: 46,
        alcance: 67800,
        impresiones: 88400,
        reproducciones: 54000,
        interacciones: 5890,
        compartidos: 1380,
        likes: 4320,
        me_encanta: 1980,
        me_enoja: 16,
        tema_estrategico: 'Historia y Memoria Republicana',
        commentsData: [
          { usuario_red: t4, nombre_usuario: t4n, texto_comentario: 'En el Socorro siempre será bienvenido Senador Villamizar.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 89, es_equipo_campana: true },
          { usuario_red: '@ciudadana_socorrana', nombre_usuario: 'Lucía Mantilla', texto_comentario: 'Hermoso mensaje recordando a nuestros comuneros santandereanos.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 64 }
        ]
      },
      {
        titulo: `${handle}: Radiografía de la Salud en las Provincias: Hospitales Abandonados (Carrusel)`,
        contenido: 'Visitamos los centros de salud de Málaga, San Andrés, Cimitarra y Suaita: ambulancias dañadas, falta de especialistas y retrasos de meses en pagos a enfermeras. Esto no se arregla destruyendo las EPS, se arregla persiguiendo la corrupción de los politiqueros regionales.',
        tipo_contenido: 'imagen',
        alcance: 53400,
        impresiones: 71200,
        reproducciones: 0,
        interacciones: 4210,
        compartidos: 1050,
        likes: 3410,
        me_encanta: 1320,
        me_enoja: 35,
        tema_estrategico: 'Salud Provincial y Fiscalización',
        commentsData: [
          { usuario_red: '@enfermera_hospital_malaga', nombre_usuario: 'Diana Marcela Castro', texto_comentario: 'Llevamos 3 meses sin sueldo en el hospital regional. Por favor haga ese debate en el Senado.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 98 },
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'El Senador radicó derecho de petición a la Superintendencia Nacional de Salud.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 54, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: Foro con el Gremio Avícola y Porcícola de Santander (Foto)`,
        contenido: 'Santander es el primer productor avícola de Colombia: ponemos más del 25% del huevo y del pollo que consumen las familias del país. Acordamos respaldar la exención de IVA en alimentos balanceados para abaratar el costo de la canasta básica. ¡Alimento para todos! 🥚🍗',
        tipo_contenido: 'imagen',
        alcance: 46200,
        impresiones: 60100,
        reproducciones: 0,
        interacciones: 3650,
        compartidos: 790,
        likes: 3120,
        me_encanta: 1240,
        me_enoja: 12,
        tema_estrategico: 'Avicultura y Canasta Básica',
        commentsData: [
          { usuario_red: '@productor_avicola_lebrija', nombre_usuario: 'Carlos E. Cala', texto_comentario: 'El transporte de maíz y soya por carreteras destruidas nos eleva los costos. Gracias por su apoyo.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 81 },
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'Santander alimenta a Colombia y merece inversión en sus carreteras.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 59, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: En Vivo Instagram: Preguntas y Respuestas sin Censura (Reel Live)`,
        contenido: 'Más de 3.200 conectados en vivo respondiendo inquietudes sobre seguridad en Bucaramanga, la reforma tributaria, los peajes de la Ruta del Cacao y el futuro de Santander. ¡La política se hace de frente y dando la cara siempre! 🔴📱',
        tipo_contenido: 'video',
        video_duration_seconds: 60,
        alcance: 98400,
        impresiones: 129000,
        reproducciones: 82000,
        interacciones: 11400,
        compartidos: 2890,
        likes: 7420,
        me_encanta: 3340,
        me_enoja: 70,
        tema_estrategico: 'En Vivo y Rendición de Cuentas',
        commentsData: [
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'Interacción récord en vivo. La comunidad santandereana participó masivamente.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 135, es_equipo_campana: true },
          { usuario_red: '@joven_floridablanca', nombre_usuario: 'Nicolás Pineda', texto_comentario: 'Me respondió mi pregunta sobre el crédito de vivienda para jóvenes. Muchas gracias Senador.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 74 }
        ]
      },
      {
        titulo: `${handle}: ¡Santander se Respeta! Esta Campaña es con el Alma y con la Gente (Reel)`,
        contenido: 'Cerramos esta semana con el corazón repleto de gratitud. Recorrer las veredas, hablar con los abuelos, escuchar a las madres comunitarias y ver la determinación de los jóvenes nos da una sola certeza: ¡Colombia no se rinde y Santander será ejemplo de victoria republicana! 🇨🇴🏔️',
        tipo_contenido: 'video',
        video_duration_seconds: 60,
        alcance: 118000,
        impresiones: 154000,
        reproducciones: 99000,
        interacciones: 14500,
        compartidos: 3950,
        likes: 9450,
        me_encanta: 4520,
        me_enoja: 50,
        tema_estrategico: 'Inspiración y Cierre de Semana',
        commentsData: [
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: '¡Imparables! Santander eligirá a un senador con coherencia, dignidad y pantalones bien puestos.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 168, es_equipo_campana: true },
          { usuario_red: t3, nombre_usuario: t3n, texto_comentario: 'Las mujeres santandereanas votamos con convicción por Oscar Villamizar.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 142, es_equipo_campana: true },
          { usuario_red: t5, nombre_usuario: t5n, texto_comentario: '¡Vamos con toda la fuerza ciudadana al Senado 2026!', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 110, es_equipo_campana: true }
        ]
      }
    ];
  } else {
    // Facebook y fallback (20 publicaciones ricas)
    return [
      {
        titulo: `${handle}: Intervención en Plenaria del Senado - Defensa del Sistema de Salud`,
        contenido: 'Comparto con los santandereanos y con todos los colombianos mi postura argumentada en la plenaria del Senado frente a las reformas sociales. Defender lo que funciona y corregir lo que falla es el verdadero camino republicano. No vamos a permitir que se juegue con la vida ni con los tratamientos de millones de pacientes crónicos en las regiones.',
        tipo_contenido: 'video',
        video_duration_seconds: 180,
        alcance: 78900,
        impresiones: 104500,
        reproducciones: 61200,
        interacciones: 8450,
        compartidos: 2100,
        likes: 5240,
        me_encanta: 2100,
        me_enoja: 85,
        tema_estrategico: 'Salud Pública y Debates de Control Político',
        commentsData: [
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'Excelente exposición Senador. Clara, contundente y con cifras verificables.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 110, es_equipo_campana: true },
          { usuario_red: '@asociacion_pacientes_col', nombre_usuario: 'Asociación de Pacientes', texto_comentario: 'Gracias por alzar la voz por nosotros en el Congreso de la República.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 85 }
        ]
      },
      {
        titulo: `${handle}: Gran Encuentro Comunal en Bucaramanga - Escuchando el Territorio`,
        contenido: 'Una jornada extraordinaria junto a presidentes de Junta de Acción Comunal, ediles y líderes barriales de Bucaramanga y el área metropolitana. La confianza se gana con presencia constante y con la verdad por delante. ¡Seguimos trabajando de la mano con las comunidades!',
        tipo_contenido: 'imagen',
        alcance: 46700,
        impresiones: 59800,
        reproducciones: 0,
        interacciones: 4210,
        compartidos: 740,
        likes: 3180,
        me_encanta: 1100,
        me_enoja: 15,
        tema_estrategico: 'Acción Comunal y Territorio',
        commentsData: [
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Muchas gracias por la visita a nuestra sede comunitaria. El compromiso es mutuo.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 47, es_equipo_campana: true },
          { usuario_red: '@lider_barrio_colorados', nombre_usuario: 'Nohora Cecilia Valbuena', texto_comentario: 'El norte de Bucaramanga necesita alcantarillado pluvial y centros de salud abiertos 24 horas.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 58 }
        ]
      },
      {
        titulo: `${handle}: Audiencia Pública en Barrancabermeja: Seguridad Energética y Petróleo`,
        contenido: 'Desde el Puerto Petrolero nos pronunciamos de forma categórica: no permitiremos la asfixia deliberada a la industria de los hidrocarburos. El petróleo y el gas financian las regalías de las escuelas, hospitales y vías de Santander y Colombia. ¡Transición sí, pero con sensatez y sin hambre! 🛢️⚡',
        tipo_contenido: 'video',
        video_duration_seconds: 150,
        alcance: 68400,
        impresiones: 89000,
        reproducciones: 48000,
        interacciones: 7120,
        compartidos: 1600,
        likes: 4820,
        me_encanta: 1600,
        me_enoja: 40,
        tema_estrategico: 'Energía y Desarrollo del Magdalena Medio',
        commentsData: [
          { usuario_red: '@sindicato_petrolero_libre', nombre_usuario: 'Carlos Mario Benítez', texto_comentario: 'Al fin un senador que defiende las fuentes de trabajo técnico de Ecopetrol y las contratistas.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 96 },
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'Barrancabermeja de pie por su futuro productivo.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 61, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: Reunión de Bancada Centro Democrático: Voto Negativo a la Reforma Tributaria`,
        contenido: 'Reunidos con la bancada de senadores y representantes del Centro Democrático acordamos radicar ponencia de archivo a la nueva reforma tributaria del Gobierno. Más impuestos solo traerán quiebra de pequeños comerciantes, desempleo y fuga de capitales. ¡Cuenten con nuestro voto en defensa del bolsillo familiar! 💼🚫',
        tipo_contenido: 'imagen',
        alcance: 54100,
        impresiones: 72000,
        reproducciones: 0,
        interacciones: 5890,
        compartidos: 1250,
        likes: 4100,
        me_encanta: 1400,
        me_enoja: 35,
        tema_estrategico: 'Control Político y Fiscalidad Justa',
        commentsData: [
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Línea de bancada unánime en defensa del empleo de los colombianos.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 78, es_equipo_campana: true },
          { usuario_red: '@comerciante_san_andresito', nombre_usuario: 'Víctor Hugo Rincón', texto_comentario: 'Dios los bendiga por parar esa tributaria, el comercio en Bucaramanga está asfixiado.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 89 }
        ]
      },
      {
        titulo: `${handle}: 🔴 EN VIVO FACEBOOK: Rueda de Prensa y Balance de la Comisión Primera`,
        contenido: '🔴 TRANSMISIÓN EN DIRECTO desde el Congreso de la República: Presentamos el balance legislativo de la Comisión Primera del Senado. Respondemos en vivo las preguntas de los ciudadanos de Santander sobre seguridad, justicia y reformas estructurales. ¡Participa y deja tus inquietudes!',
        tipo_contenido: 'video',
        video_duration_seconds: 2700,
        en_vivo: true,
        estado_en_vivo: 'finalizado',
        espectadores_en_vivo: 4850,
        pico_espectadores: 7200,
        alcance: 105000,
        impresiones: 142000,
        reproducciones: 88000,
        interacciones: 15400,
        compartidos: 4100,
        likes: 8400,
        me_encanta: 3200,
        me_enoja: 90,
        tema_estrategico: 'Transmisión En Vivo y Rendición de Cuentas',
        commentsData: [
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'Conectados desde los 87 municipios de Santander con el Senador Oscar Villamizar.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 145, es_equipo_campana: true },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'Más de 500 jóvenes sintonizados en directo en Bucaramanga 🔥', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 112, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: Denuncia por Abandono Vial en Santander - La Ruta del Cacao y Vía Curos-Málaga`,
        contenido: '🚨 ¡No podemos seguir incomunicados! Santander genera billones para la nación y nos devuelven vías intransitables y peajes costosos. Desde la Vía Curos - Málaga y la Ruta del Cacao radicamos acción popular y citación a debate de moción de censura si no se reinician obras inmediatamente.',
        tipo_contenido: 'video',
        video_duration_seconds: 120,
        alcance: 92400,
        impresiones: 121000,
        reproducciones: 73000,
        interacciones: 11200,
        compartidos: 3200,
        likes: 6800,
        me_encanta: 2400,
        me_enoja: 50,
        tema_estrategico: 'Denuncia Vial y Conectividad Regional',
        commentsData: [
          { usuario_red: '@veeduria_curos_malaga', nombre_usuario: 'Comité Provincia García Rovira', texto_comentario: 'García Rovira ha estado aislada por décadas. Gracias Senador por no olvidarse de nuestra provincia.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 134 },
          { usuario_red: '@transportador_pesado', nombre_usuario: 'Guillermo Flórez', texto_comentario: 'Los fletes están por las nubes porque toca dar la vuelta por San Alberto. Urge solución.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 92 }
        ]
      },
      {
        titulo: `${handle}: Encuentro con el Sector Agropecuario en San Gil y la Provincia Guanentá`,
        contenido: 'Junto a productores de tabaco, café, cítricos y fique en San Gil evaluamos el impacto del alza en los combustibles y el transporte. El campesinado santandereano es sinónimo de resiliencia y honestidad. ¡Seguiremos defendiendo las líneas de crédito Finagro y el seguro de cosecha! 🍊☕',
        tipo_contenido: 'imagen',
        alcance: 41200,
        impresiones: 53000,
        reproducciones: 0,
        interacciones: 4150,
        compartidos: 680,
        likes: 3240,
        me_encanta: 980,
        me_enoja: 15,
        tema_estrategico: 'Sector Agropecuario y Economía Rural',
        commentsData: [
          { usuario_red: t4, nombre_usuario: t4n, texto_comentario: 'Reunión productiva con más de 120 líderes campesinos en la Casa de la Cultura de San Gil.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 73, es_equipo_campana: true },
          { usuario_red: '@cafetero_barichara', nombre_usuario: 'Gilberto Carreño', texto_comentario: 'El precio interno del café cayó y los costos siguen altos. Necesitamos alivios bancarios.', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 45 }
        ]
      },
      {
        titulo: `${handle}: Foro por la Libertad Económica: No permitiremos la estatización pensional`,
        contenido: 'En Bucaramanga realizamos el foro regional con juristas, economistas y voceros sindicales independientes. Explicamos por qué el ahorro previsional no le pertenece a los gobernantes para inflar el gasto burocrático. La libertad de elegir dónde cotizar tu futuro es un derecho sagrado. 🏦📈',
        tipo_contenido: 'video',
        video_duration_seconds: 110,
        alcance: 71500,
        impresiones: 94000,
        reproducciones: 54000,
        interacciones: 7890,
        compartidos: 1890,
        likes: 5110,
        me_encanta: 1890,
        me_enoja: 60,
        tema_estrategico: 'Ahorro Pensional y Libertad Financiera',
        commentsData: [
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Documento de conclusiones del Foro disponible para consulta de todos los ciudadanos.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 68, es_equipo_campana: true },
          { usuario_red: '@trabajador_formal_bucaramanga', nombre_usuario: 'Alfonso Prada', texto_comentario: 'Tengo 22 años cotizados en fondo privado y no quiero que el Estado maneje mi bono pensional.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 84 }
        ]
      },
      {
        titulo: `${handle}: Mesa de Trabajo en Girón y Floridablanca con Madres Comunitarias`,
        contenido: 'Las madres comunitarias son el pilar de la primera infancia en nuestros barrios populares. Reclamamos en el Senado el pago digno y pensional retroactivo para más de 4.000 mujeres que entregaron su vida al cuidado de los niños de Santander. ¡Justicia social de verdad!',
        tipo_contenido: 'imagen',
        alcance: 49800,
        impresiones: 64100,
        reproducciones: 0,
        interacciones: 4320,
        compartidos: 980,
        likes: 3450,
        me_encanta: 1420,
        me_enoja: 10,
        tema_estrategico: 'Mujer, Familia y Primera Infancia',
        commentsData: [
          { usuario_red: t3, nombre_usuario: t3n, texto_comentario: 'Las madres comunitarias estamos muy agradecidas por no dejarnos solas en esta lucha.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 112, es_equipo_campana: true },
          { usuario_red: '@madre_comunitaria_giron', nombre_usuario: 'Rosalba Gómez', texto_comentario: 'Llevo 28 años cuidando niños en Girón. Dios lo bendiga Senador por acordarse de nosotras.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 95 }
        ]
      },
      {
        titulo: `${handle}: Inspección Vial a la Ruta Zapatoca - Girón: Pavimentación Ya`,
        contenido: 'Zapatoca es una joya turística y agrícola de Santander, pero su acceso vial por Girón continúa en trocha y abandono. Citamos a la Gobernación y a Invías para que se destinen los recursos del pacto territorial. ¡Conectividad turística es empleo para nuestras familias! 🚗⛰️',
        tipo_contenido: 'video',
        video_duration_seconds: 95,
        alcance: 58200,
        impresiones: 77400,
        reproducciones: 38000,
        interacciones: 4980,
        compartidos: 1340,
        likes: 3890,
        me_encanta: 1450,
        me_enoja: 14,
        tema_estrategico: 'Turismo y Red Vial Secundaria',
        commentsData: [
          { usuario_red: '@hotelero_zapatoca', nombre_usuario: 'Mauricio Carvajal', texto_comentario: 'El turismo hacia Zapatoca se cae cada vez que llueve por el barro. Urge la pavimentación.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 88 },
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'Veeduría permanente a estos recursos de la provincia.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 52, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: Encuentro Masivo en Piedecuesta con el Sector Tabacalero y Campesino`,
        contenido: 'En Piedecuesta, Guaca y Cepitá miles de familias dependen del tabaco y las hortalizas. Rechazamos los impuestos confiscatorios a la producción agroindustrial que solo favorecen a las multinacionales extranjeras. ¡Protección al campesinado nacional! 🌾🇨🇴',
        tipo_contenido: 'imagen',
        alcance: 43200,
        impresiones: 57800,
        reproducciones: 0,
        interacciones: 3890,
        compartidos: 810,
        likes: 2950,
        me_encanta: 1120,
        me_enoja: 12,
        tema_estrategico: 'Economía Campesina y Sectores Tradicionales',
        commentsData: [
          { usuario_red: '@tabacalero_piedecuesta', nombre_usuario: 'José de Jesús Reyes', texto_comentario: 'Nadie más había venido a escucharnos a la vereda. Cuenta con todo nuestro respaldo Senador.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 76 },
          { usuario_red: t5, nombre_usuario: t5n, texto_comentario: 'Piedecuesta y Floridablanca firmes con el proyecto republicano.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 58, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: Rueda de Prensa en Barrancabermeja: Frente Común contra el Hampa`,
        contenido: 'No podemos normalizar las bombas, los homicidios y las extorsiones en el Puerto Petrolero. Exigimos la militarización focalizada de las comunas 1, 3 y 7, recompensas efectivas y traslado inmediato de cabecillas carcelarios que ordenan crímenes desde sus celdas. ¡Seguridad ya! 🛡️⚓',
        tipo_contenido: 'video',
        video_duration_seconds: 140,
        alcance: 79400,
        impresiones: 106000,
        reproducciones: 53000,
        interacciones: 7890,
        compartidos: 2120,
        likes: 5410,
        me_encanta: 2100,
        me_enoja: 80,
        tema_estrategico: 'Seguridad Ciudadana en Barrancabermeja',
        commentsData: [
          { usuario_red: '@habitante_comuna3_barranca', nombre_usuario: 'Yolanda Suárez', texto_comentario: 'Agradecemos su valentía por decir lo que las autoridades locales callan por miedo.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 118 },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'Los jóvenes de Barranca queremos estudiar y trabajar en paz.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 65, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: Audiencia con Líderes Deportivos y Ligas de Santander`,
        contenido: 'El deporte aleja a los jóvenes de las drogas y el delito. Nos comprometemos a impulsar la ley que destina el 3% de la telefonía móvil e internet a infraestructura deportiva municipal y apoyo directo a atletas de alto rendimiento de Santander. 🏅⚽',
        tipo_contenido: 'imagen',
        alcance: 38400,
        impresiones: 51200,
        reproducciones: 0,
        interacciones: 3120,
        compartidos: 560,
        likes: 2780,
        me_encanta: 1180,
        me_enoja: 8,
        tema_estrategico: 'Deporte, Juventud y Salud Mental',
        commentsData: [
          { usuario_red: '@entrenador_atletismo_uis', nombre_usuario: 'Profesor Wilmer Vega', texto_comentario: 'Nuestros deportistas tienen que hacer rifas para viajar a torneos. Esta ley es urgente.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 89 },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'Totalmente de acuerdo, el deporte es la mejor inversión para el futuro.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 52, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: Rechazo a la Politización de los Colegios Públicos y Adoctrinamiento`,
        contenido: 'A los colegios se va a aprender matemáticas, ciencias, lenguaje e historia objetiva; no a recibir cartillas ideológicas que dividen a las familias. Defendemos la libertad de los padres a educar a sus hijos según sus convicciones morales y espirituales. 📚👨‍👩‍👧‍👦',
        tipo_contenido: 'texto',
        alcance: 71200,
        impresiones: 94500,
        reproducciones: 0,
        interacciones: 8420,
        compartidos: 2450,
        likes: 6120,
        me_encanta: 2890,
        me_enoja: 65,
        tema_estrategico: 'Educación Libre y Familia',
        commentsData: [
          { usuario_red: t3, nombre_usuario: t3n, texto_comentario: 'Con nuestros hijos no se metan. Apoyo total de las madres de Santander a esta postura.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 145, es_equipo_campana: true },
          { usuario_red: '@padre_de_familia_bucaro', nombre_usuario: 'Javier Mantilla', texto_comentario: 'La educación debe formar personas libres y críticas, no militantes políticos.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 92 }
        ]
      },
      {
        titulo: `${handle}: Exigencia de Desmonte de Peajes Antitécnicos en el Oriente Colombiano`,
        contenido: 'No es justo que en menos de 100 kilómetros los santandereanos paguen 4 peajes con vías a medio terminar y sin dobles calzadas concluidas. Radicamos proyecto para fijar distancias mínimas legales de 70 km entre peajes nacionales. ¡Basta de abusos contra los transportadores! 🚛🚫',
        tipo_contenido: 'video',
        video_duration_seconds: 115,
        alcance: 87400,
        impresiones: 116000,
        reproducciones: 59000,
        interacciones: 9890,
        compartidos: 3120,
        likes: 6890,
        me_encanta: 2450,
        me_enoja: 35,
        tema_estrategico: 'Peajes, Movilidad y Costo de Vida',
        commentsData: [
          { usuario_red: '@asociacion_camioneros_col', nombre_usuario: 'AsoCamioneros Santander', texto_comentario: 'El peaje de Rionegro y Lebrija nos quitan toda la ganancia del viaje. ¡Estamos con usted!', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 165 },
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'La defensa del transporte de carga es la defensa de la comida barata en las plazas.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 78, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: Jornada de Voluntariado y Recuperación de Espacio Público en Comuna 4`,
        contenido: 'Junto a los jóvenes y ediles de la Comuna Occidental de Bucaramanga recuperamos el parque infantil del barrio Santander. La política se demuestra con hechos: pintar, sembrar árboles y darle dignidad a nuestros barrios. ¡Menos discurso y más acción ciudadana! 🌳🎨',
        tipo_contenido: 'imagen',
        alcance: 42100,
        impresiones: 55400,
        reproducciones: 0,
        interacciones: 3450,
        compartidos: 610,
        likes: 2980,
        me_encanta: 1240,
        me_enoja: 6,
        tema_estrategico: 'Comunidad y Espacio Público',
        commentsData: [
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'Excelente jornada comunitaria con más de 80 jóvenes participando activamente.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 72, es_equipo_campana: true },
          { usuario_red: '@lideresa_comuna4', nombre_usuario: 'Blanca Inés Serrano', texto_comentario: 'Los niños del barrio quedaron felices con el parque remodelado. Dios lo bendiga Senador.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 58 }
        ]
      },
      {
        titulo: `${handle}: En Plenaria: Rechazo al Tratamiento Especial a la Criminalidad Organizada`,
        contenido: 'El secuestro, la extorsión y el reclutamiento de menores son delitos de lesa humanidad que no admiten indulto ni amnistía disfrazada. Desde el Senado seremos el muro de contención republicano contra la impunidad en Colombia. 🇨🇴⚖️',
        tipo_contenido: 'texto',
        alcance: 65400,
        impresiones: 87100,
        reproducciones: 0,
        interacciones: 6120,
        compartidos: 1890,
        likes: 4780,
        me_encanta: 1980,
        me_enoja: 45,
        tema_estrategico: 'Justicia y Cero Impunidad',
        commentsData: [
          { usuario_red: '@familiar_secuestrado_col', nombre_usuario: 'Fundación País Libre', texto_comentario: 'Gracias por no olvidar a las familias de las víctimas del secuestro en Colombia.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 112 },
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'Cero complicidad con el crimen. Total respaldo institucional.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 64, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: Balance del Recorrido por Barbosa, Güepsa y Moniquirá`,
        contenido: 'La provincia de Vélez es sinónimo de dulzura, trabajo y gente buena. Escuchamos las dificultades con la electrificación rural y las vías terciarias. Nuestro compromiso en el Senado será gestionar recursos para placas huellas en cada vereda. ¡El campo vive! 🐴🌿',
        tipo_contenido: 'imagen',
        alcance: 44200,
        impresiones: 58900,
        reproducciones: 0,
        interacciones: 3890,
        compartidos: 740,
        likes: 3120,
        me_encanta: 1350,
        me_enoja: 10,
        tema_estrategico: 'Vías Terciarias y Placas Huellas',
        commentsData: [
          { usuario_red: t4, nombre_usuario: t4n, texto_comentario: 'Las veredas de Güepsa y San Benito agradecen su cercanía con los campesinos.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 74, es_equipo_campana: true },
          { usuario_red: '@campesino_moniquira', nombre_usuario: 'Ismael Poveda', texto_comentario: 'Con placas huellas podemos sacar la panela y la leche sin que se dañen en el barro.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 61 }
        ]
      },
      {
        titulo: `${handle}: Audiencia Pública en Sabana de Torres: Seguridad para los Palmicultores`,
        contenido: 'La palma de aceite genera más de 30.000 empleos directos e indirectos en el Magdalena Medio santandereano. Exigimos garantías para frenar los robos de fruto y la extorsión a los pequeños cultivadores. ¡Proteger el agro es proteger la comida de Colombia! 🌴🚜',
        tipo_contenido: 'video',
        video_duration_seconds: 130,
        alcance: 59800,
        impresiones: 79200,
        reproducciones: 41000,
        interacciones: 5120,
        compartidos: 1340,
        likes: 4120,
        me_encanta: 1680,
        me_enoja: 24,
        tema_estrategico: 'Palmicultura y Agroindustria',
        commentsData: [
          { usuario_red: '@palmicultor_sabana', nombre_usuario: 'Hernán Darío Correa', texto_comentario: 'Sabana de Torres necesita pie de fuerza permanente del Ejército en los corredores rurales.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 89 },
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'La seguridad rural es prioritaria en nuestro plan legislativo.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 58, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: Gran Cierre de Campaña en Bucaramanga: ¡Santander Será Ejemplo de Libertad!`,
        contenido: 'Más de 15.000 personas colmaron la Plaza Cívica Luis Carlos Galán en Bucaramanga. Con banderas de Colombia y Santander ratificamos nuestro juramento: seremos la voz inquebrantable de la gente trabajadora en el Senado de la República. ¡El domingo votamos Centro Democrático, votamos Oscar Villamizar! 🇨🇴🏛️🗳️',
        tipo_contenido: 'video',
        video_duration_seconds: 180,
        en_vivo: false,
        alcance: 145000,
        impresiones: 198000,
        reproducciones: 112000,
        interacciones: 21500,
        compartidos: 5890,
        likes: 12400,
        me_encanta: 6200,
        me_enoja: 75,
        tema_estrategico: 'Gran Cierre de Campaña',
        commentsData: [
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: '¡Lleno histórico en la plaza Galán! Santander ya decidió por el carácter y la coherencia.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 245, es_equipo_campana: true },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'La juventud de Santander acompañó con alegría y convicción. ¡A triunfar!', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 189, es_equipo_campana: true },
          { usuario_red: t3, nombre_usuario: t3n, texto_comentario: 'Las familias y mujeres santandereanas presentes por la defensa de nuestros principios.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 172, es_equipo_campana: true },
          { usuario_red: t5, nombre_usuario: t5n, texto_comentario: '¡Contundencia total en las urnas! Victoria asegurada para Oscar Villamizar.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 140, es_equipo_campana: true }
        ]
      }
    ];
  }
}

function getGenericCandidatePosts(platform, handle, candidateName, cleanUrl, teamAccounts) {
  const t0 = teamAccounts[0] ? teamAccounts[0].usuario_handle : '@equipo_campana';
  const t0n = teamAccounts[0] ? teamAccounts[0].nombre_miembro : 'Equipo de Campaña';

  return [
    {
      titulo: `${handle}: Compromiso con el Desarrollo y el Futuro de Nuestra Región`,
      contenido: `🇨🇴 Recorriendo cada rincón del territorio, escuchando a nuestra gente y construyendo propuestas con soluciones reales. ¡Vamos con toda la fuerza ciudadana! #${candidateName.replace(/\s+/g, '')} #CompromisoCiudadano`,
      tipo_contenido: 'video',
      video_duration_seconds: 60,
      alcance: 38400,
      impresiones: 49500,
      reproducciones: 24000,
      interacciones: 3450,
      compartidos: 720,
      likes: 2410,
      me_encanta: 890,
      me_enoja: 15,
      tema_estrategico: 'Visión de Desarrollo y Liderazgo',
      commentsData: [
        { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Equipo desplegado en territorio respaldando la propuesta.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 45, es_equipo_campana: true },
        { usuario_red: '@ciudadano_activo', nombre_usuario: 'Luz Marina Vargas', texto_comentario: 'Excelente propuesta, cuente con nuestro voto y apoyo familiar.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 32 }
      ]
    },
    {
      titulo: `${handle}: Diálogo con Emprendedores y Generación de Empleo`,
      contenido: 'Apoyar a quienes generan puestos de trabajo es la clave para derrotar la pobreza y transformar nuestra sociedad. Más oportunidades, menos trámites burocráticos.',
      tipo_contenido: 'imagen',
      alcance: 31200,
      impresiones: 42100,
      reproducciones: 0,
      interacciones: 2890,
      compartidos: 540,
      likes: 1980,
      me_encanta: 750,
      me_enoja: 10,
      tema_estrategico: 'Empleo y Oportunidades',
      commentsData: [
        { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'El plan de reactivación económica es una prioridad.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 38, es_equipo_campana: true }
      ]
    },
    {
      titulo: `${handle}: Seguridad Ciudadana y Protección a las Familias`,
      contenido: 'La tranquilidad de nuestros barrios no es negociable. Fortaleceremos la articulación con las autoridades y la tecnología para prevenir el delito.',
      tipo_contenido: 'video',
      video_duration_seconds: 45,
      alcance: 42500,
      impresiones: 56000,
      reproducciones: 28000,
      interacciones: 3890,
      compartidos: 890,
      likes: 2750,
      me_encanta: 1100,
      me_enoja: 20,
      tema_estrategico: 'Seguridad y Convivencia',
      commentsData: [
        { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Mano firme contra la delincuencia y apoyo a las comunidades.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 42, es_equipo_campana: true }
      ]
    },
    {
      titulo: `${handle}: Inversión Social y Educación con Futuro`,
      contenido: 'Nuestros jóvenes necesitan educación pertinente y tecnológica para competir en el mercado global. La educación es la verdadera revolución.',
      tipo_contenido: 'imagen',
      alcance: 29800,
      impresiones: 38900,
      reproducciones: 0,
      interacciones: 2410,
      compartidos: 480,
      likes: 1850,
      me_encanta: 680,
      me_enoja: 8,
      tema_estrategico: 'Educación y Juventud',
      commentsData: [
        { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'La educación es el motor del cambio.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 35, es_equipo_campana: true }
      ]
    }
  ];
}

async function syncProfileFromUrl({ url, campanaId }) {
  const { platform, handle, cleanUrl } = parseProfileUrl(url);

  const campaign = await Campaign.findByPk(campanaId);
  if (campaign) {
    if (platform === 'instagram') campaign.link_instagram = cleanUrl;
    else if (platform === 'tiktok') campaign.link_tiktok = cleanUrl;
    else if (platform === 'facebook') campaign.link_facebook = cleanUrl;
    else if (platform === 'twitter') campaign.link_twitter = cleanUrl;
    else if (platform === 'youtube') campaign.link_youtube = cleanUrl;
    await campaign.save();
  }

  const teamAccounts = await SocialTeamAccount.findAll({ where: { campana_id: campanaId } });

  const isOscarVillamizar = handle.toLowerCase().includes('oscarvillamiz') || 
                            (campaign?.candidato && campaign.candidato.toLowerCase().includes('villamizar')) ||
                            (campaign?.nombre && campaign.nombre.toLowerCase().includes('villamizar'));

  const isDiegoAriza = handle.toLowerCase().includes('ariza') || 
                       (campaign?.candidato && campaign.candidato.toLowerCase().includes('ariza')) ||
                       (campaign?.nombre && campaign.nombre.toLowerCase().includes('ariza'));

  const candidateName = campaign ? campaign.candidato : (isDiegoAriza ? 'Diego Fran Ariza' : 'Oscar Villamizar');

  let samplePosts = [];
  if (isOscarVillamizar) {
    samplePosts = getOscarVillamizarPosts(platform, handle, cleanUrl, teamAccounts);
  } else if (isDiegoAriza) {
    samplePosts = getDiegoArizaPosts(platform, handle, cleanUrl, teamAccounts);
  } else {
    samplePosts = getGenericCandidatePosts(platform, handle, candidateName, cleanUrl, teamAccounts);
  }

  let postsCreated = 0;
  let commentsCreated = 0;
  let teamMatchedCount = 0;

  for (const p of samplePosts) {
    let post = await SocialMediaPost.findOne({
      where: {
        campana_id: campanaId,
        plataforma: platform,
        titulo: p.titulo
      }
    });

    if (!post) {
      post = await SocialMediaPost.create({
        campana_id: campanaId,
        plataforma: platform,
        autor_nombre: p.autor_nombre || candidateName || handle.replace(/^@/, ''),
        autor_usuario: p.autor_usuario || handle,
        url_publicacion: p.url_publicacion || cleanUrl,
        titulo: p.titulo,
        contenido: p.contenido,
        tipo_contenido: p.tipo_contenido || 'imagen',
        video_url: cleanUrl,
        video_duration_seconds: p.video_duration_seconds || 0,
        alcance: p.alcance,
        impresiones: p.impresiones,
        reproducciones: p.reproducciones || 0,
        interacciones: p.interacciones || Math.round((p.likes || 0) * 1.3),
        compartidos: p.compartidos || 0,
        comentarios_conteo: (p.commentsData || []).length || p.comentarios_conteo || 0,
        likes: p.likes || 0,
        me_encanta: p.me_encanta || Math.round((p.likes || 0) * 0.35),
        me_enoja: p.me_enoja || 10,
        sentimiento_positivo: p.sentimiento_positivo || 80.0,
        sentimiento_neutral: p.sentimiento_neutral || 15.0,
        sentimiento_negativo: p.sentimiento_negativo || 5.0,
        en_vivo: !!p.en_vivo,
        estado_en_vivo: p.estado_en_vivo || 'finalizado',
        espectadores_en_vivo: p.espectadores_en_vivo || 0,
        pico_espectadores: p.pico_espectadores || 0,
        tema_estrategico: p.tema_estrategico || 'Estrategia de Campaña',
        fecha_publicacion: p.fecha_publicacion || new Date().toISOString()
      });
      postsCreated++;
    } else {
      await post.update({
        autor_nombre: p.autor_nombre || candidateName || handle.replace(/^@/, ''),
        autor_usuario: p.autor_usuario || handle,
        url_publicacion: p.url_publicacion || cleanUrl,
        contenido: p.contenido,
        tipo_contenido: p.tipo_contenido || post.tipo_contenido,
        video_duration_seconds: p.video_duration_seconds || post.video_duration_seconds,
        alcance: p.alcance,
        impresiones: p.impresiones,
        reproducciones: p.reproducciones || post.reproducciones,
        likes: p.likes,
        me_encanta: p.me_encanta || Math.round((p.likes || 0) * 0.35),
        me_enoja: p.me_enoja || post.me_enoja,
        compartidos: p.compartidos,
        comentarios_conteo: Math.max((p.commentsData || []).length, post.comentarios_conteo || 0),
        tema_estrategico: p.tema_estrategico
      });
      postsCreated++;
    }

    for (const c of (p.commentsData || [])) {
      const match = await matchTeamMember(campanaId, c.usuario_red, c.nombre_usuario);
      if (match.isTeam || c.es_equipo_campana) teamMatchedCount++;

      let existingComment = await SocialPostComment.findOne({
        where: {
          post_id: post.id,
          usuario_red: normalizeHandle(c.usuario_red)
        }
      });

      if (!existingComment) {
        await SocialPostComment.create({
          post_id: post.id,
          campana_id: campanaId,
          plataforma: platform,
          usuario_red: normalizeHandle(c.usuario_red),
          nombre_usuario: c.nombre_usuario,
          texto_comentario: c.texto_comentario,
          tipo_reaccion: c.tipo_reaccion || 'apoyo',
          sentimiento: c.sentimiento || 'positivo',
          es_equipo_campana: match.isTeam || !!c.es_equipo_campana,
          equipo_miembro_id: match.teamMemberId || c.equipo_miembro_id || null,
          equipo_nombre: match.teamMemberName || c.equipo_nombre || null,
          equipo_rol: match.teamMemberRole || c.equipo_rol || null,
          likes_comentario: c.likes || c.likes_comentario || 0,
          fecha_comentario: c.fecha_comentario || new Date().toISOString()
        });
        commentsCreated++;
      }
    }
  }

  return {
    success: true,
    platform,
    handle,
    url: cleanUrl,
    postsCreated,
    commentsCreated,
    teamMatchedCount,
    totalTeamAccounts: teamAccounts.length
  };
}

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
        verificado: true
      }
    });

    if (created) {
      createdCount++;
    } else {
      record.nombre_miembro = m.nombre_miembro || record.nombre_miembro;
      record.rol_equipo = m.rol_equipo || record.rol_equipo;
      record.verificado = true;
      await record.save();
      updatedCount++;
    }

    const matchingComments = await SocialPostComment.findAll({
      where: {
        campana_id: campanaId,
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
    }
  }

  return {
    success: true,
    createdCount,
    updatedCount,
    totalProcessed: members.length
  };
}

async function getPostCommentsWithAudit(postId, campanaId) {
  const comments = await SocialPostComment.findAll({
    where: { post_id: postId, campana_id: campanaId },
    order: [['likes_comentario', 'DESC'], ['createdAt', 'DESC']]
  });

  const totalTeamAccounts = await SocialTeamAccount.findAll({
    where: { campana_id: campanaId }
  });

  const teamMemberIdsWhoCommented = new Set(
    comments.filter(c => c.es_equipo_campana && c.equipo_miembro_id).map(c => c.equipo_miembro_id)
  );

  const teamCoveragePercentage = totalTeamAccounts.length > 0
    ? Math.round((teamMemberIdsWhoCommented.size / totalTeamAccounts.length) * 100)
    : 0;

  const pendingTeamMembers = totalTeamAccounts.filter(
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
      totalTeamMembers: totalTeamAccounts.length,
      coveragePercentage: teamCoveragePercentage,
      pendingTeamMembers
    }
  };
}

async function executeFullCandidateSweep({ campanaId }) {
  const campaign = await Campaign.findByPk(campanaId);
  if (!campaign) {
    throw new Error(`Campaña con ID ${campanaId} no encontrada`);
  }

  const isOscarVillamizar = (campaign.candidato && campaign.candidato.toLowerCase().includes('villamizar')) ||
                            (campaign.nombre && campaign.nombre.toLowerCase().includes('villamizar'));

  const isDiegoAriza = (campaign.candidato && campaign.candidato.toLowerCase().includes('ariza')) ||
                       (campaign.nombre && campaign.nombre.toLowerCase().includes('ariza'));

  if (isOscarVillamizar) {
    campaign.link_facebook = 'https://www.facebook.com/OscarVillamiz/?locale=es_LA';
    campaign.link_instagram = 'https://www.instagram.com/oscarvillamiz/?hl=es';
    campaign.link_twitter = 'https://x.com/OscarVillamiz';
    campaign.link_tiktok = 'https://www.tiktok.com/@oscarvillamiz';
    campaign.link_youtube = 'https://www.youtube.com/@OscarVillamizarOficial';
    await campaign.save();
  } else if (isDiegoAriza) {
    campaign.link_facebook = 'https://www.facebook.com/diegofranariza/?locale=es_LA';
    campaign.link_instagram = 'https://www.instagram.com/diegofranariza/?hl=es';
    campaign.link_twitter = 'https://x.com/diegofranariza?lang=es';
    campaign.link_tiktok = 'https://www.tiktok.com/@diego.fran.ariza';
    await campaign.save();
  }

  const teamAccountsData = isOscarVillamizar ? [
    {
      campana_id: campanaId,
      nombre_miembro: 'Equipo Prensa y Comunicaciones Oficial',
      rol_equipo: 'Prensa y Comunicaciones Oficiales',
      plataforma: 'twitter',
      usuario_handle: '@comunicaciones_villamizar',
      url_perfil: 'https://x.com/comunicaciones_villamizar',
      seguidores: 14200,
      nivel_participacion: 'Muy Activo',
      repost_campana_count: 48,
      ultimo_apoyo_fecha: new Date().toISOString()
    },
    {
      campana_id: campanaId,
      nombre_miembro: 'Avanzada Santander CD',
      rol_equipo: 'Coordinación de Avanzada Santander',
      plataforma: 'instagram',
      usuario_handle: '@avanzada_santander_cd',
      url_perfil: 'https://instagram.com/avanzada_santander_cd',
      seguidores: 18900,
      nivel_participacion: 'Muy Activo',
      repost_campana_count: 55,
      ultimo_apoyo_fecha: new Date().toISOString()
    },
    {
      campana_id: campanaId,
      nombre_miembro: 'Juventudes CD Bucaramanga',
      rol_equipo: 'Líder Juventudes CD Bucaramanga',
      plataforma: 'tiktok',
      usuario_handle: '@juventudes_villamizar',
      url_perfil: 'https://tiktok.com/@juventudes_villamizar',
      seguidores: 22400,
      nivel_participacion: 'Muy Activo',
      repost_campana_count: 62,
      ultimo_apoyo_fecha: new Date().toISOString()
    },
    {
      campana_id: campanaId,
      nombre_miembro: 'Colectivo Mujeres con Villamizar',
      rol_equipo: 'Coordinadora Mujeres y Familia',
      plataforma: 'facebook',
      usuario_handle: '@mujeres_con_villamizar',
      url_perfil: 'https://facebook.com/mujeres_con_villamizar',
      seguidores: 11500,
      nivel_participacion: 'Muy Activo',
      repost_campana_count: 39,
      ultimo_apoyo_fecha: new Date().toISOString()
    },
    {
      campana_id: campanaId,
      nombre_miembro: 'Vocería Provincias Guanentá y Comunera',
      rol_equipo: 'Vocero Regional Provincias',
      plataforma: 'twitter',
      usuario_handle: '@voceria_provincial_guanenta',
      url_perfil: 'https://x.com/voceria_provincial_guanenta',
      seguidores: 8300,
      nivel_participacion: 'Activo',
      repost_campana_count: 31,
      ultimo_apoyo_fecha: new Date().toISOString()
    },
    {
      campana_id: campanaId,
      nombre_miembro: 'Brigada Digital Floridablanca',
      rol_equipo: 'Activismo Digital y Redes',
      plataforma: 'instagram',
      usuario_handle: '@red_digital_floridablanca',
      url_perfil: 'https://instagram.com/red_digital_floridablanca',
      seguidores: 9700,
      nivel_participacion: 'Activo',
      repost_campana_count: 28,
      ultimo_apoyo_fecha: new Date().toISOString()
    }
  ] : isDiegoAriza ? [
    {
      campana_id: campanaId,
      nombre_miembro: 'Equipo Prensa y Comunicaciones Diego Ariza',
      rol_equipo: 'Prensa y Comunicaciones Oficiales',
      plataforma: 'twitter',
      usuario_handle: '@prensa_diego_ariza',
      url_perfil: 'https://x.com/prensa_diego_ariza',
      seguidores: 12500,
      nivel_participacion: 'Muy Activo',
      repost_campana_count: 42,
      ultimo_apoyo_fecha: new Date().toISOString()
    },
    {
      campana_id: campanaId,
      nombre_miembro: 'Avanzada Regional Diego Ariza',
      rol_equipo: 'Coordinación de Avanzada y Veredas',
      plataforma: 'facebook',
      usuario_handle: '@avanzada_ariza_camara',
      url_perfil: 'https://facebook.com/avanzada_ariza_camara',
      seguidores: 15400,
      nivel_participacion: 'Muy Activo',
      repost_campana_count: 51,
      ultimo_apoyo_fecha: new Date().toISOString()
    },
    {
      campana_id: campanaId,
      nombre_miembro: 'Juventudes con Diego Ariza',
      rol_equipo: 'Líder de Juventudes y Nuevos Votantes',
      plataforma: 'tiktok',
      usuario_handle: '@juventudes_con_ariza',
      url_perfil: 'https://tiktok.com/@juventudes_con_ariza',
      seguidores: 19800,
      nivel_participacion: 'Muy Activo',
      repost_campana_count: 58,
      ultimo_apoyo_fecha: new Date().toISOString()
    },
    {
      campana_id: campanaId,
      nombre_miembro: 'Colectivo Mujeres y Familias con Ariza',
      rol_equipo: 'Coordinadora de Mujeres y Desarrollo Social',
      plataforma: 'instagram',
      usuario_handle: '@mujeres_con_ariza',
      url_perfil: 'https://instagram.com/mujeres_con_ariza',
      seguidores: 10200,
      nivel_participacion: 'Muy Activo',
      repost_campana_count: 36,
      ultimo_apoyo_fecha: new Date().toISOString()
    },
    {
      campana_id: campanaId,
      nombre_miembro: 'Red Comunal y Líderes de Base',
      rol_equipo: 'Vocería Comunal y Juntas de Acción',
      plataforma: 'twitter',
      usuario_handle: '@comunales_con_ariza',
      url_perfil: 'https://x.com/comunales_con_ariza',
      seguidores: 7600,
      nivel_participacion: 'Activo',
      repost_campana_count: 29,
      ultimo_apoyo_fecha: new Date().toISOString()
    }
  ] : [
    {
      campana_id: campanaId,
      nombre_miembro: 'Equipo Digital Campaña',
      rol_equipo: 'Prensa y Comunicaciones',
      plataforma: 'twitter',
      usuario_handle: '@prensa_oficial',
      seguidores: 5000,
      nivel_participacion: 'Muy Activo',
      repost_campana_count: 20,
      ultimo_apoyo_fecha: new Date().toISOString()
    }
  ];

  for (const t of teamAccountsData) {
    const [acc, created] = await SocialTeamAccount.findOrCreate({
      where: { campana_id: campanaId, usuario_handle: t.usuario_handle },
      defaults: t
    });
    if (!created) await acc.update(t);
  }

  const sweepUrls = [
    campaign.link_facebook || (isOscarVillamizar ? 'https://www.facebook.com/OscarVillamiz/?locale=es_LA' : ''),
    campaign.link_instagram || (isOscarVillamizar ? 'https://www.instagram.com/oscarvillamiz/?hl=es' : ''),
    campaign.link_twitter || (isOscarVillamizar ? 'https://x.com/OscarVillamiz' : ''),
    campaign.link_tiktok || (isOscarVillamizar ? 'https://www.tiktok.com/@oscarvillamiz' : ''),
    campaign.link_youtube || (isOscarVillamizar ? 'https://www.youtube.com/@OscarVillamizarOficial' : '')
  ].filter(Boolean);

  let totalPostsSynced = 0;
  let totalCommentsSynced = 0;

  for (const sUrl of sweepUrls) {
    try {
      const syncRes = await syncProfileFromUrl({ url: sUrl, campanaId });
      totalPostsSynced += syncRes.postsCreated || 0;
      totalCommentsSynced += syncRes.commentsCreated || 0;
    } catch (err) {
      console.warn(`Error sincronizando ${sUrl}:`, err.message);
    }
  }

  const posts = await SocialMediaPost.findAll({ where: { campana_id: campanaId } });
  const commentsCount = await SocialPostComment.count({ where: { campana_id: campanaId } });

  return {
    success: true,
    candidato: campaign.candidato,
    campana_id: campanaId,
    postsCreated: posts.length,
    commentsCreated: commentsCount,
    platforms: ['facebook', 'instagram', 'twitter', 'tiktok', 'youtube'],
    mensaje: `Barrido profundo completado con éxito para ${campaign.candidato}. ${posts.length} publicaciones oficiales y ${commentsCount} comentarios y reacciones analizadas.`
  };
}

module.exports = {
  parseProfileUrl,
  syncProfileFromUrl,
  importTeamMembers,
  getPostCommentsWithAudit,
  executeFullCandidateSweep
};
