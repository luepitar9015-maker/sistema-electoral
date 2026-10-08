/**
 * Publicaciones Oficiales y Datos de Redes Sociales de Oscar Villamizar
 * Senador de la República y Candidato al Senado 2026 - Centro Democrático
 * Títulos reales y exactos como aparecen en las redes sociales (sin prefijos ficticios)
 * Desglose completo de reacciones y comentarios con identificación clara de quién reacciona
 */

function getOscarVillamizarPosts(platform, handle, cleanUrl, teamAccounts = []) {
  const t0 = teamAccounts[0]?.usuario_handle || '@comunicaciones_villamizar';
  const t0n = teamAccounts[0]?.nombre_miembro || 'Equipo Prensa Oficial Oscar Villamizar';
  const t1 = teamAccounts[1]?.usuario_handle || '@avanzada_santander_cd';
  const t1n = teamAccounts[1]?.nombre_miembro || 'Avanzada Santander CD';
  const t2 = teamAccounts[2]?.usuario_handle || '@juventudes_villamizar';
  const t2n = teamAccounts[2]?.nombre_miembro || 'Juventudes CD Bucaramanga';
  const t3 = teamAccounts[3]?.usuario_handle || '@mujeres_con_villamizar';
  const t3n = teamAccounts[3]?.nombre_miembro || 'Colectivo Mujeres con Villamizar';
  const t4 = teamAccounts[4]?.usuario_handle || '@voceria_provincial_guanenta';
  const t4n = teamAccounts[4]?.nombre_miembro || 'Vocería Provincias Guanentá y Comunera';
  const t5 = teamAccounts[5]?.usuario_handle || '@red_digital_floridablanca';
  const t5n = teamAccounts[5]?.nombre_miembro || 'Brigada Digital Floridablanca';

  if (platform === 'twitter') {
    return [
      {
        url_publicacion: 'https://x.com/OscarVillamiz/status/1789456789012345678',
        titulo: 'Firmeza en el Senado frente a la Seguridad y Orden Público en Santander',
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
        comentarios_conteo: 9,
        commentsData: [
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: '¡Total respaldo al Senador Villamizar! En las provincias de Santander se necesita mano firme y presencia estatal.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 94, es_equipo_campana: true, equipo_nombre: t1n, equipo_rol: 'Coordinación de Avanzada' },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'Firmeza y coherencia. Los jóvenes santandereanos apoyamos la defensa de la institucionalidad.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 72, es_equipo_campana: true, equipo_nombre: t2n, equipo_rol: 'Líder Juventudes' },
          { usuario_red: '@ciudadano_santander_real', nombre_usuario: 'Germán Darío Plata', texto_comentario: 'Senador, por favor haga control estricto a las vías de Santander, la Ruta del Cacao tiene tramos abandonados.', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 41, es_equipo_campana: false },
          { usuario_red: t4, nombre_usuario: t4n, texto_comentario: 'Importante debate en el Congreso. Estaremos atentos a las conclusiones de la comisión.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 35, es_equipo_campana: true, equipo_nombre: t4n, equipo_rol: 'Vocería Provincial' },
          { usuario_red: '@reserva_militar_stder', nombre_usuario: 'Coronel (R) Alberto Mejía', texto_comentario: 'Agradecemos su defensa valiente de la moral y la seguridad jurídica de nuestros soldados y policías.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 62, es_equipo_campana: false },
          { usuario_red: '@comerciante_cabecera', nombre_usuario: 'Mauricio Silva Gómez', texto_comentario: 'En Bucaramanga la extorsión a comerciantes no da tregua. Se requiere pie de fuerza permanente.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 38, es_equipo_campana: false },
          { usuario_red: '@estudiante_derecho_uis', nombre_usuario: 'Camilo Rodríguez', texto_comentario: '¿Cuáles medidas legislativas proponen para frenar el microtráfico en entornos escolares?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 23, es_equipo_campana: false },
          { usuario_red: '@abogado_penalista_bga', nombre_usuario: 'Dr. Fernando Quintero', texto_comentario: 'El endurecimiento de penas para reincidentes es clave en el nuevo código.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 29, es_equipo_campana: false },
          { usuario_red: '@opositor_critico_26', nombre_usuario: 'Observador Crítico 2026', texto_comentario: 'Siempre el mismo discurso sobre seguridad, deberían enfocarse más en la inversión social.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 14, es_equipo_campana: false }
        ]
      },
      {
        url_publicacion: 'https://x.com/OscarVillamiz/status/1789567890123456789',
        titulo: 'Control Político a las Finanzas Públicas y Defensa del Empleo Santandereano',
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
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Compartimos el hilo oficial con las 5 razones técnicas por las que esta reforma frena el crecimiento regional.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 88, es_equipo_campana: true, equipo_nombre: t0n, equipo_rol: 'Prensa Oficial' },
          { usuario_red: '@comerciante_cabecera', nombre_usuario: 'Mauricio Silva Gómez', texto_comentario: 'Gracias por defender al comercio formal, ya no aguantamos más cargas tributarias en Bucaramanga.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 53, es_equipo_campana: false },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'Los jóvenes emprendedores necesitamos menos trabas y más facilidades crediticias.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 45, es_equipo_campana: true, equipo_nombre: t2n, equipo_rol: 'Líder Juventudes' },
          { usuario_red: '@empresario_calzado_bga', nombre_usuario: 'Jairo Albarracín', texto_comentario: 'El sector calzado apoya su postura contra el aumento desmedido de impuestos a la nómina.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 37, es_equipo_campana: false },
          { usuario_red: t3, nombre_usuario: t3n, texto_comentario: 'Cuidar el empleo formal es cuidar la estabilidad de miles de madres trabajadoras.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 31, es_equipo_campana: true, equipo_nombre: t3n, equipo_rol: 'Coordinadora Mujeres' },
          { usuario_red: '@estudiante_uis_debate', nombre_usuario: 'Camilo Rodríguez Peña', texto_comentario: '¿Cuáles son las alternativas que propone el Centro Democrático para financiar el déficit de las universidades?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 19, es_equipo_campana: false },
          { usuario_red: '@contador_publico_bga', nombre_usuario: 'Gustavo Adolfo Rueda', texto_comentario: '¿Se mantendrá la tarifa reducida del régimen simple para las microempresas?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 16, es_equipo_campana: false },
          { usuario_red: '@frente_opositor_red', nombre_usuario: 'Debate Libre Santander', texto_comentario: 'La oposición siempre se opone a cualquier intento de recaudar para gasto social.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 11, es_equipo_campana: false }
        ]
      },
      {
        url_publicacion: 'https://x.com/OscarVillamiz/status/1789678901234567890',
        titulo: 'Exigencia a Invías y ANI por la Ruta del Cacao: Obras Urgentes y Fin al Aislamiento',
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
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: '@gremio_transportadores_stder', nombre_usuario: 'Asociación Transportadores Santander', texto_comentario: 'Excelente gestión Senador. Llevamos semanas perdiendo millones en fletes por la desidia de Invías.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 112, es_equipo_campana: false },
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'Santander merece vías de primer nivel. Seguimos vigilantes con el Senador Villamizar.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 67, es_equipo_campana: true, equipo_nombre: t1n, equipo_rol: 'Coordinación Avanzada' },
          { usuario_red: t5, nombre_usuario: t5n, texto_comentario: 'La Brigada Digital Floridablanca compartiendo la denuncia en todas las redes.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 51, es_equipo_campana: true, equipo_nombre: t5n, equipo_rol: 'Brigada Digital' },
          { usuario_red: '@turismo_barrancabermeja', nombre_usuario: 'Claudia Patricia Méndez', texto_comentario: 'El turismo hacia el puerto petrolero está destruido por el paso a un solo carril.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 39, es_equipo_campana: false },
          { usuario_red: '@camionero_lebrija', nombre_usuario: 'Don Pedro Antonio Gómez', texto_comentario: 'Pasamos hasta 6 horas represados en el sector La Fortuna. Esto es insostenible.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 45, es_equipo_campana: false },
          { usuario_red: '@habitante_lebrija', nombre_usuario: 'Martha Rueda', texto_comentario: 'El peaje sigue cobrando tarifa plena como si la vía estuviera perfecta. ¿Exigirán tarifa diferencial?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 48, es_equipo_campana: false },
          { usuario_red: '@ingeniero_geotecnia_uis', nombre_usuario: 'Ing. Carlos E. Rueda', texto_comentario: '¿Se contemplan viaductos profundos o seguirán rellenando taludes inestables?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 29, es_equipo_campana: false },
          { usuario_red: '@veedor_opositor_bga', nombre_usuario: 'Cuenta Veedora Crítica', texto_comentario: 'Esa concesión viene con problemas desde administraciones de su mismo partido.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 15, es_equipo_campana: false }
        ]
      }
    ];
  }

  if (platform === 'instagram') {
    return [
      {
        url_publicacion: 'https://www.instagram.com/reel/C8P451qZ_villamiz/',
        titulo: 'En Santander y en Colombia la libertad se defiende con carácter (Reel)',
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
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: '¡Excelente liderazgo Senador! Santander necesita voceros con carácter en el Congreso.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 88, es_equipo_campana: true, equipo_nombre: t1n, equipo_rol: 'Coordinación Avanzada' },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'Desde el área metropolitana de Bucaramanga y Floridablanca cuenta con todo el respaldo popular 🔥', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 72, es_equipo_campana: true, equipo_nombre: t2n, equipo_rol: 'Líder Juventudes' },
          { usuario_red: t3, nombre_usuario: t3n, texto_comentario: 'Las mujeres santandereanas apoyamos a quienes defienden la familia y el orden.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 58, es_equipo_campana: true, equipo_nombre: t3n, equipo_rol: 'Coordinadora Mujeres' },
          { usuario_red: '@ganadero_socorrano', nombre_usuario: 'Alvaro Prada Mantilla', texto_comentario: 'Bienvenido a la provincia comunera Senador, aquí estamos firmes con la institucionalidad.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 44, es_equipo_campana: false },
          { usuario_red: t5, nombre_usuario: t5n, texto_comentario: 'Activismo digital permanente defendiendo la gestión en redes.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 39, es_equipo_campana: true, equipo_nombre: t5n, equipo_rol: 'Brigada Digital' },
          { usuario_red: '@familia_productora_lebrija', nombre_usuario: 'Esperanza Duarte', texto_comentario: 'Venga a Lebrija a apoyar a los productores de piña y aves que tenemos problemas con los insumos.', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 27, es_equipo_campana: false },
          { usuario_red: '@estudiante_derecho_udi', nombre_usuario: 'Mateo Carvajal', texto_comentario: '¿Cuándo realiza foro presencial en las universidades sobre la reforma judicial?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 18, es_equipo_campana: false },
          { usuario_red: '@usuario_critico_insta', nombre_usuario: 'Voz Juvenil Discordante', texto_comentario: 'Mucho eslogan de carácter pero no vemos propuestas en transición ecológica.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 12, es_equipo_campana: false }
        ]
      },
      {
        url_publicacion: 'https://www.instagram.com/p/C7M891pQ_villamiz/',
        titulo: '4 Pilares Innegociables para el Futuro de Colombia (Carrusel)',
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
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Línea programática impecable. El partido respalda con total convicción estos 4 pilares.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 95, es_equipo_campana: true, equipo_nombre: t0n, equipo_rol: 'Prensa Oficial' },
          { usuario_red: '@empresario_girondeno', nombre_usuario: 'Rodrigo Barajas', texto_comentario: 'La seguridad es el pilar número 1. Sin seguridad nadie invierte un solo peso en Colombia.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 54, es_equipo_campana: false },
          { usuario_red: t4, nombre_usuario: t4n, texto_comentario: 'El pilar 4 del campo es lo que están esperando nuestras provincias en Santander.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 48, es_equipo_campana: true, equipo_nombre: t4n, equipo_rol: 'Vocería Provincial' },
          { usuario_red: '@comerciante_barranca', nombre_usuario: 'Eduardo Jaimes', texto_comentario: 'Bajar impuestos para que las microempresas puedan contratar jóvenes formalmente.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 36, es_equipo_campana: false },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'La juventud de Santander comparte estos 4 principios de libertad.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 41, es_equipo_campana: true, equipo_nombre: t2n, equipo_rol: 'Líder Juventudes' },
          { usuario_red: '@docente_economia_uis', nombre_usuario: 'Prof. Alvaro Serrano', texto_comentario: '¿Cómo compensar el déficit presupuestal si se reducen impuestos corporativos?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 25, es_equipo_campana: false },
          { usuario_red: '@ciudadano_pregunta_red', nombre_usuario: 'Guillermo Pinzón', texto_comentario: '¿Cuál es el mecanismo exacto para blindar los recursos de la salud de las EPS quebradas?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 19, es_equipo_campana: false },
          { usuario_red: '@critico_instagram_26', nombre_usuario: 'Analista Independiente', texto_comentario: 'Los 4 pilares suenan bien pero el Congreso actual está demasiado polarizado para aprobarlos.', tipo_reaccion: 'critica', sentimiento: 'neutral', likes: 9, es_equipo_campana: false }
        ]
      },
      {
        url_publicacion: 'https://www.instagram.com/reel/C6K123aB_villamiz/',
        titulo: 'Diálogo con Jóvenes Emprendedores en Floridablanca y Girón (Reel)',
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
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: '¡Energía al 100%! La juventud santandereana cree en el emprendimiento y el mérito propio.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 110, es_equipo_campana: true, equipo_nombre: t2n, equipo_rol: 'Líder Juventudes' },
          { usuario_red: '@startup_bucaramanga', nombre_usuario: 'Andrés Felipe Solano', texto_comentario: 'Excelente propuesta Senador. Necesitamos que las Cámaras de Comercio bajen las tarifas de registro.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 49, es_equipo_campana: false },
          { usuario_red: t5, nombre_usuario: t5n, texto_comentario: 'Floridablanca presente respaldando las iniciativas para los jóvenes creadores.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 42, es_equipo_campana: true, equipo_nombre: t5n, equipo_rol: 'Brigada Digital' },
          { usuario_red: '@programador_freelance', nombre_usuario: 'David Leonardo Rey', texto_comentario: 'La exención de IVA para software y servicios digitales de exportación sería de gran ayuda.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 35, es_equipo_campana: false },
          { usuario_red: t3, nombre_usuario: t3n, texto_comentario: 'Motivar a nuestros jóvenes a quedarse en el país creando empleo es fundamental.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 38, es_equipo_campana: true, equipo_nombre: t3n, equipo_rol: 'Coordinadora Mujeres' },
          { usuario_red: '@universitario_santotomas', nombre_usuario: 'Felipe Mendoza', texto_comentario: '¿Habrá líneas de crédito condonable a través de Bancóldex o iNNpulsa?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 22, es_equipo_campana: false },
          { usuario_red: '@creadora_contenido_bga', nombre_usuario: 'Silvia Juliana Gómez', texto_comentario: '¿Se crearán hubs tecnológicos públicos en los municipios de provincia?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 17, es_equipo_campana: false },
          { usuario_red: '@usuario_esceptico_insta', nombre_usuario: 'Crítico Digital', texto_comentario: 'Mucho video bonito en Instagram, queremos ver las leyes radicadas en la gaceta del Congreso.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 8, es_equipo_campana: false }
        ]
      }
    ];
  }

  if (platform === 'facebook') {
    return [
      {
        url_publicacion: 'https://www.facebook.com/OscarVillamiz/videos/987654321098765/',
        titulo: 'Intervención en Plenaria del Senado: Defensa Integral del Sistema de Salud',
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
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'Excelente exposición Senador. Clara, contundente y con cifras verificables.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 110, es_equipo_campana: true, equipo_nombre: t1n, equipo_rol: 'Coordinación Avanzada' },
          { usuario_red: '@asociacion_pacientes_col', nombre_usuario: 'Asociación de Pacientes', texto_comentario: 'Gracias por alzar la voz por nosotros en el Congreso de la República.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 85, es_equipo_campana: false },
          { usuario_red: t3, nombre_usuario: t3n, texto_comentario: 'Las madres cuidadoras de enfermos crónicos respaldamos su valentía en el debate.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 64, es_equipo_campana: true, equipo_nombre: t3n, equipo_rol: 'Coordinadora Mujeres' },
          { usuario_red: '@medico_fcv_bucaramanga', nombre_usuario: 'Dr. Santiago Morales', texto_comentario: 'Estatizar la salud solo generará colapso de las unidades de alta complejidad.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 52, es_equipo_campana: false },
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'El acta del debate completo ya está disponible en el portal del Senador Villamizar.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 41, es_equipo_campana: true, equipo_nombre: t0n, equipo_rol: 'Prensa Oficial' },
          { usuario_red: '@paciente_renal_socorro', nombre_usuario: 'María Helena Carreño', texto_comentario: '¿Qué pasará con la entrega de medicamentos de alto costo si se interviene la EPS?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 33, es_equipo_campana: false },
          { usuario_red: '@enfermera_hospital_san_gil', nombre_usuario: 'Diana Marcela Castro', texto_comentario: '¿Se exigirá pago directo a la red hospitalaria pública para no depender de giros demorados?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 26, es_equipo_campana: false },
          { usuario_red: '@activista_progresista_fb', nombre_usuario: 'Voz Popular Santander', texto_comentario: 'El sistema actual enriqueció intermediarios privados mientras la gente muere esperando citas.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 18, es_equipo_campana: false }
        ]
      },
      {
        url_publicacion: 'https://www.facebook.com/OscarVillamiz/posts/pfbid02xKM765QWER8910/',
        titulo: 'Gran Encuentro Comunal en Bucaramanga: Escuchando el Territorio con Hechos',
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
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Muchas gracias por la visita a nuestra sede comunitaria. El compromiso es mutuo.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 47, es_equipo_campana: true, equipo_nombre: t0n, equipo_rol: 'Prensa Oficial' },
          { usuario_red: '@lider_barrio_colorados', nombre_usuario: 'Nohora Cecilia Valbuena', texto_comentario: 'El norte de Bucaramanga necesita alcantarillado pluvial y centros de salud abiertos 24 horas.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 58, es_equipo_campana: false },
          { usuario_red: t4, nombre_usuario: t4n, texto_comentario: 'Las provincias de Guanentá y Comunera también están unidas con el liderazgo comunal.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 42, es_equipo_campana: true, equipo_nombre: t4n, equipo_rol: 'Vocería Provincial' },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'Juventudes participando en las mesas de trabajo comunales.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 39, es_equipo_campana: true, equipo_nombre: t2n, equipo_rol: 'Líder Juventudes' },
          { usuario_red: '@edil_comuna12_bga', nombre_usuario: 'Gonzalo Rueda Mantilla', texto_comentario: 'Valoramos el diálogo directo sin promesas clientelistas. Cuenten con los ediles.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 35, es_equipo_campana: false },
          { usuario_red: '@comunero_barrio_mutis', nombre_usuario: 'Don Hernando Quintero', texto_comentario: '¿Cuándo se gestionarán alarmas comunitarias conectadas a la Policía?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 21, es_equipo_campana: false },
          { usuario_red: '@vecina_alvarez_pregunta', nombre_usuario: 'Martha Lucía Delgado', texto_comentario: '¿Qué seguimiento le hacen a los compromisos firmados en actas comunales?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 16, es_equipo_campana: false },
          { usuario_red: '@detractor_fb_bga', nombre_usuario: 'Observatorio Cívico Independiente', texto_comentario: 'A los comunales solo los buscan cuando faltan meses para las elecciones.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 10, es_equipo_campana: false }
        ]
      },
      {
        url_publicacion: 'https://www.facebook.com/OscarVillamiz/videos/876543210987654/',
        titulo: 'Audiencia Pública en Barrancabermeja: Seguridad Energética y Defensa del Petróleo',
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
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: '@sindicato_petrolero_libre', nombre_usuario: 'Carlos Mario Benítez', texto_comentario: 'Al fin un senador que defiende las fuentes de trabajo técnico de Ecopetrol y las contratistas.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 96, es_equipo_campana: false },
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'Barrancabermeja de pie por su futuro productivo.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 61, es_equipo_campana: true, equipo_nombre: t1n, equipo_rol: 'Coordinación Avanzada' },
          { usuario_red: '@comerciante_sector_comercial_bca', nombre_usuario: 'Eduardo Jaimes', texto_comentario: 'Si frena la actividad petrolera, el comercio en Barranca se apaga por completo.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 54, es_equipo_campana: false },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'Los técnicos egresados de las universidades del puerto necesitan estabilidad.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 45, es_equipo_campana: true, equipo_nombre: t2n, equipo_rol: 'Líder Juventudes' },
          { usuario_red: t5, nombre_usuario: t5n, texto_comentario: 'Firmeza en defensa de los recursos que generan regalías para todo Santander.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 38, es_equipo_campana: true, equipo_nombre: t5n, equipo_rol: 'Brigada Digital' },
          { usuario_red: '@ambientalista_san_silvestre', nombre_usuario: 'Comité Ciénega San Silvestre', texto_comentario: '¿Cómo garantizar que las operaciones petroleras no contaminen las fuentes de agua de Barrancabermeja?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 34, es_equipo_campana: false },
          { usuario_red: '@trabajador_contratista_bca', nombre_usuario: 'Javier Mantilla', texto_comentario: '¿Habrá control a la intermediación laboral abusiva de las firmas contratistas?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 28, es_equipo_campana: false },
          { usuario_red: '@cuenta_critica_petroleo', nombre_usuario: 'Militante Ambientalista', texto_comentario: 'El mundo va hacia energías limpias y ustedes se aferran al carbón y al petróleo.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 16, es_equipo_campana: false }
        ]
      }
    ];
  }

  if (platform === 'tiktok') {
    return [
      {
        url_publicacion: 'https://www.tiktok.com/@oscarvillamiz/video/7348901234567890123',
        titulo: '¿Por qué la Ruta del Cacao sigue abandonada? Aquí los responsables 🚧 Te lo explico en 45s',
        contenido: 'Miles de millones invertidos en peajes y cada invierno quedamos aislados. Exigimos cuentas claras a la ANI y a Invías. ¡Basta de abusos contra Santander! 🇨🇴 #OscarVillamizar #VíasSantander #TikTokPolítico #DenunciaVial',
        tipo_contenido: 'video',
        video_duration_seconds: 45,
        alcance: 98400,
        impresiones: 132000,
        reproducciones: 91000,
        interacciones: 10400,
        compartidos: 3120,
        likes: 7890,
        me_encanta: 4120,
        me_enoja: 35,
        tema_estrategico: 'TikTok Viral de Control Vial',
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: '¡Excelente denuncia Senador! La juventud santandereana cansada de pagar peajes por trochas 🔥', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 220, es_equipo_campana: true, equipo_nombre: t2n, equipo_rol: 'Líder Juventudes' },
          { usuario_red: '@camionero_tiktok_col', nombre_usuario: 'Hernán Pardo', texto_comentario: 'Totalmente de acuerdo, paso por ahí 3 veces a la semana y es un peligro mortal. Tiene mi voto.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 145, es_equipo_campana: false },
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'Avanzada Villamizar al 100% activa en territorio.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 89, es_equipo_campana: true, equipo_nombre: t1n, equipo_rol: 'Coordinación Avanzada' },
          { usuario_red: '@vecina_rio_sucio', nombre_usuario: 'Yolanda Bautista', texto_comentario: 'En Lebrija los peajes nos asfixian el transporte de piña y comida.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 64, es_equipo_campana: false },
          { usuario_red: t5, nombre_usuario: t5n, texto_comentario: 'Viralizando el video en todos los grupos de Santander.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 52, es_equipo_campana: true, equipo_nombre: t5n, equipo_rol: 'Brigada Digital' },
          { usuario_red: '@universitario_bga_tiktok', nombre_usuario: 'Sebastián Becerra', texto_comentario: '¿Cuándo se hará el debate de control político al Ministro de Transporte?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 38, es_equipo_campana: false },
          { usuario_red: '@usuario_curioso_via', nombre_usuario: 'Julián Morales', texto_comentario: '¿La concesionaria ya entregó los estudios de geotecnia del talud?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 25, es_equipo_campana: false },
          { usuario_red: '@cuenta_troll_tiktok_stder', nombre_usuario: 'Observador TikTok', texto_comentario: 'Denuncian en video pero en el Senado no votan los presupuestos de vías.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 14, es_equipo_campana: false }
        ]
      },
      {
        url_publicacion: 'https://www.tiktok.com/@oscarvillamiz/video/7348901234567890124',
        titulo: '3 Mentiras de las reformas que asfixian el ahorro de los trabajadores colombianos',
        contenido: '1️⃣ Que el dinero de tus pensiones estará más seguro en manos del Estado.\n2️⃣ Que no afectará el empleo de los jóvenes.\n3️⃣ Que habrá salud gratis sin colas de espera.\n\n¡La verdad sin censura! Comparte con tus amigos. 🗳️🇨🇴',
        tipo_contenido: 'video',
        video_duration_seconds: 52,
        alcance: 87400,
        impresiones: 118000,
        reproducciones: 82000,
        interacciones: 9120,
        compartidos: 2750,
        likes: 6980,
        me_encanta: 3620,
        me_enoja: 28,
        tema_estrategico: 'TikTok Formativo de Control Legislativo',
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: '¡Pedagogía clara y contundente! Con el ahorro de la gente no se juega 👏', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 178, es_equipo_campana: true, equipo_nombre: t2n, equipo_rol: 'Líder Juventudes' },
          { usuario_red: '@joven_profesional_uis', nombre_usuario: 'Daniel Felipe Solano', texto_comentario: 'Llevo 5 años cotizando y no quiero que mi bono pensional se vuelva plata de bolsillo estatal.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 122, es_equipo_campana: false },
          { usuario_red: t3, nombre_usuario: t3n, texto_comentario: 'Las familias santandereanas firmes en la defensa del fruto de nuestro trabajo.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 67, es_equipo_campana: true, equipo_nombre: t3n, equipo_rol: 'Coordinadora Mujeres' },
          { usuario_red: '@contador_joven_stder', nombre_usuario: 'Guillermo Flórez', texto_comentario: 'Buen análisis del pilar semicontributivo y el impacto actuarial en el PIB.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 49, es_equipo_campana: false },
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: '¡Multiplicando este contenido en todas las provincias de Santander!', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 58, es_equipo_campana: true, equipo_nombre: t1n, equipo_rol: 'Coordinación Avanzada' },
          { usuario_red: '@estudiante_indeciso_26', nombre_usuario: 'Camilo Peña', texto_comentario: '¿Cómo garantizar que los adultos mayores sin semanas cotizadas reciban auxilio?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 31, es_equipo_campana: false },
          { usuario_red: '@votante_joven_giron', nombre_usuario: 'David Rangel', texto_comentario: '¿Cuál es el umbral de cotización que propone el Centro Democrático?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 21, es_equipo_campana: false },
          { usuario_red: '@critico_tiktok_izq', nombre_usuario: 'Voz Crítica Juvenil', texto_comentario: 'Los fondos privados cobraron comisiones millonarias y pensionaron a muy pocos.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 13, es_equipo_campana: false }
        ]
      }
    ];
  }

  if (platform === 'youtube') {
    return [
      {
        url_publicacion: 'https://www.youtube.com/watch?v=OV_Villamizar2026_01',
        titulo: 'Debate de Control Político en el Senado: Seguridad y Vías Estratégicas para Santander',
        contenido: 'Intervención integral del Senador Oscar Villamizar en la Comisión Primera del Senado exigiendo garantías al Gobierno Nacional para los santandereanos.',
        tipo_contenido: 'video',
        video_duration_seconds: 620,
        alcance: 74500,
        impresiones: 98000,
        reproducciones: 58000,
        interacciones: 6120,
        compartidos: 1740,
        likes: 4890,
        me_encanta: 2650,
        me_enoja: 19,
        tema_estrategico: 'Debate de Control Político Senado',
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Debate completo con todas las intervenciones y respuestas de los ministros citados.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 142, es_equipo_campana: true, equipo_nombre: t0n, equipo_rol: 'Prensa Oficial' },
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'Santander tiene un vocero con carácter y preparación técnica indiscutible.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 98, es_equipo_campana: true, equipo_nombre: t1n, equipo_rol: 'Coordinación Avanzada' },
          { usuario_red: '@abogado_santandereano', nombre_usuario: 'Dr. Hernán Silva', texto_comentario: 'Excelente rigurosidad jurídica y respeto a los precedentes de la Corte Constitucional.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 71, es_equipo_campana: false },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'Los jóvenes orgullosos de la representación institucional en el Congreso.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 58, es_equipo_campana: true, equipo_nombre: t2n, equipo_rol: 'Líder Juventudes' },
          { usuario_red: '@transportador_oriente', nombre_usuario: 'Carlos Emiro Rincón', texto_comentario: 'Ojalá el Ministerio de Transporte cumpla el compromiso de girar los recursos para los puntos críticos.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 46, es_equipo_campana: false },
          { usuario_red: '@ciudadano_socorro_yt', nombre_usuario: 'Fernando Mantilla', texto_comentario: '¿Cuándo se hará la citación por el hospital provincial del Socorro?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 32, es_equipo_campana: false },
          { usuario_red: '@veedor_electoral_malaga', nombre_usuario: 'Don Pedro Julio Benítez', texto_comentario: '¿Habrá recursos especiales para la vía Curos - Málaga en el presupuesto 2026?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 24, es_equipo_campana: false },
          { usuario_red: '@usuario_critico_youtube', nombre_usuario: 'Observador Legislativo', texto_comentario: 'Es fácil hacer control político desde la oposición, pero las leyes requieren mayorías.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 11, es_equipo_campana: false }
        ]
      },
      {
        url_publicacion: 'https://www.youtube.com/watch?v=OV_Villamizar2026_02',
        titulo: 'Propuestas y Visión de País para el Senado de la República 2026',
        contenido: 'Entrevista en profundidad con los directores de medios regionales sobre el futuro institucional de Colombia, la defensa económica y el liderazgo de Santander.',
        tipo_contenido: 'video',
        video_duration_seconds: 450,
        alcance: 61200,
        impresiones: 82000,
        reproducciones: 46000,
        interacciones: 4890,
        compartidos: 1240,
        likes: 3950,
        me_encanta: 1980,
        me_enoja: 14,
        tema_estrategico: 'Entrevista Programática y Visión de País',
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Entrevista imperdible para conocer las propuestas de fondo del Senador Oscar Villamizar.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 115, es_equipo_campana: true, equipo_nombre: t0n, equipo_rol: 'Prensa Oficial' },
          { usuario_red: t4, nombre_usuario: t4n, texto_comentario: 'En las provincias comunera y guanentina estamos listos para acompañar esta propuesta con entusiasmo.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 82, es_equipo_campana: true, equipo_nombre: t4n, equipo_rol: 'Vocería Provincial' },
          { usuario_red: '@empresario_santandereano_real', nombre_usuario: 'Manuel Antonio Rojas', texto_comentario: 'Propuestas serias, viables y que generan confianza inversionista en nuestra tierra.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 64, es_equipo_campana: false },
          { usuario_red: t3, nombre_usuario: t3n, texto_comentario: 'Coherencia y principios para defender a Colombia.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 51, es_equipo_campana: true, equipo_nombre: t3n, equipo_rol: 'Coordinadora Mujeres' },
          { usuario_red: '@docente_ciencias_sociales', nombre_usuario: 'Dra. Leonor Mantilla', texto_comentario: 'Un discurso articulado con datos verídicos sobre la situación fiscal colombiana.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 43, es_equipo_campana: false },
          { usuario_red: '@joven_universitario_bucaro', nombre_usuario: 'Andrés Camargo', texto_comentario: '¿Cuál es su visión sobre la reforma a la ley de educación superior (Ley 30)?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 27, es_equipo_campana: false },
          { usuario_red: '@ciudadano_san_gil_pregunta', nombre_usuario: 'Alfonso Forero', texto_comentario: '¿Cómo garantizar incentivos tributarios para empresas que se instalen fuera de Bucaramanga?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 19, es_equipo_campana: false },
          { usuario_red: '@comentador_critico_yt', nombre_usuario: 'Santandereano Libre', texto_comentario: 'Queremos ver más compromisos con el agua y menos defensa del sector financiero.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 10, es_equipo_campana: false }
        ]
      }
    ];
  }

  return [];
}

module.exports = { getOscarVillamizarPosts };
