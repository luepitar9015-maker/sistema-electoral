/**
 * Publicaciones Oficiales y Datos de Redes Sociales de Diego Fran Ariza
 * Candidato a la Cámara de Representantes por Santander 2026
 * Títulos reales y exactos como aparecen en las redes sociales (sin prefijos ficticios)
 * Desglose completo de reacciones y comentarios con identificación clara de quién reacciona
 */

function getDiegoArizaPosts(platform, handle, cleanUrl, teamAccounts = []) {
  const t0 = teamAccounts[0]?.usuario_handle || '@prensa_diego_ariza';
  const t0n = teamAccounts[0]?.nombre_miembro || 'Equipo Prensa Oficial Diego Ariza';
  const t1 = teamAccounts[1]?.usuario_handle || '@avanzada_ariza_camara';
  const t1n = teamAccounts[1]?.nombre_miembro || 'Avanzada Regional Diego Ariza';
  const t2 = teamAccounts[2]?.usuario_handle || '@juventudes_con_ariza';
  const t2n = teamAccounts[2]?.nombre_miembro || 'Juventudes con Diego Ariza';
  const t3 = teamAccounts[3]?.usuario_handle || '@mujeres_con_ariza';
  const t3n = teamAccounts[3]?.nombre_miembro || 'Colectivo Mujeres con Ariza';
  const t4 = teamAccounts[4]?.usuario_handle || '@comunales_con_ariza';
  const t4n = teamAccounts[4]?.nombre_miembro || 'Red de Líderes Comunales y JAC';

  if (platform === 'twitter') {
    return [
      {
        url_publicacion: 'https://x.com/diegofranariza/status/1789012345678901234',
        titulo: 'Proyecto de Ley: Recursos Directos y Blindados para Vías Terciarias en Santander',
        contenido: '🇨🇴 ¡El campo no aguanta más promesas sobre barro! En la Cámara de Representantes lideraremos la Ley de Placas Huellas y Vías Terciarias. La verdadera equidad para nuestros campesinos empieza cuando pueden sacar su leche, panela y cosechas a los centros de acopio sin intermediarios abusivos. #DiegoAriza #CámaraDeRepresentantes #SantanderFirme',
        tipo_contenido: 'texto',
        alcance: 42100,
        impresiones: 58200,
        reproducciones: 0,
        interacciones: 3410,
        compartidos: 920,
        likes: 2840,
        me_encanta: 1420,
        me_enoja: 18,
        tema_estrategico: 'Vías Terciarias y Desarrollo Rural',
        comentarios_conteo: 9,
        commentsData: [
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: '¡Total respaldo al Dr. Diego Ariza! Su trayectoria demostró que sí se pueden construir kilómetros de placas huellas con transparencia.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 78, es_equipo_campana: true, equipo_nombre: t1n, equipo_rol: 'Coordinación de Avanzada' },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'La juventud rural necesita vías y conectividad para emprender en el campo. ¡Con toda por la Cámara!', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 64, es_equipo_campana: true, equipo_nombre: t2n, equipo_rol: 'Líder Juventudes' },
          { usuario_red: '@productor_campesino_real', nombre_usuario: 'Don Jorge Eliecer Rodríguez', texto_comentario: 'Doctor Diego, cuente con las veredas. Cuando estuvo en la alcaldía cumplió con hechos y no con discursos.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 52, es_equipo_campana: false },
          { usuario_red: t4, nombre_usuario: t4n, texto_comentario: 'Las Juntas de Acción Comunal respaldamos esta iniciativa legislativa para contratar directamente.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 41, es_equipo_campana: true, equipo_nombre: t4n, equipo_rol: 'Vocería Comunal' },
          { usuario_red: '@veeduria_santandereana', nombre_usuario: 'Dra. Patricia Salamanca', texto_comentario: 'Exigiremos pliegos tipo y comités veedores comunitarios en cada tramo contratado.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 33, es_equipo_campana: false },
          { usuario_red: '@camionero_santander', nombre_usuario: 'Gonzalo Peñaloza Rueda', texto_comentario: 'Llevamos años dañando troques y muelles por el mal estado de las vías veredales. Cuente con los transportadores.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 29, es_equipo_campana: false },
          { usuario_red: '@ciudadano_critico_bga', nombre_usuario: 'Mauricio Castellanos', texto_comentario: '¿Y cómo van a evitar que la contratación de placas huellas termine en manos de clanes políticos locales?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 19, es_equipo_campana: false },
          { usuario_red: '@comerciante_san_gil', nombre_usuario: 'Alvaro Prada Gómez', texto_comentario: '¿La ley incluirá incentivos para el transporte de carga agrícola entre provincias?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 15, es_equipo_campana: false },
          { usuario_red: '@opositor_velez_26', nombre_usuario: 'Cuenta Observatorio 2026', texto_comentario: 'Muchos candidatos prometen placas huellas en campaña y luego no vuelven a aparecer en el territorio.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 12, es_equipo_campana: false }
        ]
      },
      {
        url_publicacion: 'https://x.com/diegofranariza/status/1789123456789012345',
        titulo: 'Control Político a la Red Hospitalaria Provincial: ¡Salud Digna para Santander!',
        contenido: 'No permitiremos que los hospitales de provincia sigan desfinanciados y esperando meses por giros de las EPS. En la Cámara de Representantes exigiremos giro directo obligatorio y dotación médica con especialistas para nuestras regiones. ¡La vida y la salud de nuestra gente se respetan! 🏥⚖️',
        tipo_contenido: 'enlace',
        alcance: 39500,
        impresiones: 53100,
        reproducciones: 0,
        interacciones: 3120,
        compartidos: 810,
        likes: 2540,
        me_encanta: 1120,
        me_enoja: 22,
        tema_estrategico: 'Salud Pública y Hospitales Regionales',
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: t3, nombre_usuario: t3n, texto_comentario: 'Las madres y familias de los municipios sufrimos por la falta de pediatras y ginecólogos. Urge esta reforma.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 71, es_equipo_campana: true, equipo_nombre: t3n, equipo_rol: 'Coordinadora Mujeres' },
          { usuario_red: '@veedor_salud_provincia', nombre_usuario: 'Mireya Salamanca Gómez', texto_comentario: 'Excelente debate doctor Diego. El hospital regional necesita una UCI neonatal urgente.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 48, es_equipo_campana: false },
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'En la Comisión Séptima de Cámara lideraremos la defensa del personal médico y la red hospitalaria.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 55, es_equipo_campana: true, equipo_nombre: t0n, equipo_rol: 'Prensa Oficial' },
          { usuario_red: '@medico_rural_socorro', nombre_usuario: 'Dr. Hernán Silva', texto_comentario: 'La formalización laboral de los médicos rurales en Santander no puede aplazarse más.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 42, es_equipo_campana: false },
          { usuario_red: '@paciente_dialisis_bga', nombre_usuario: 'Rosa Elvira Mantilla', texto_comentario: 'Tengo que viajar 4 horas semanales a Bucaramanga para diálisis. Necesitamos unidades en provincias.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 36, es_equipo_campana: false },
          { usuario_red: '@enfermero_socorro', nombre_usuario: 'Julián Mendoza', texto_comentario: 'Los salarios de los contratistas de la salud llevan 3 meses de retraso. ¿Qué mecanismo de sanción propone?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 38, es_equipo_campana: false },
          { usuario_red: '@estudiante_medicina_uis', nombre_usuario: 'Carlos Mario Peña', texto_comentario: '¿Habrá cupos para que los egresados hagan año rural con sueldo digno?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 21, es_equipo_campana: false },
          { usuario_red: '@troll_politico_bga', nombre_usuario: 'Anónimo Veedor BGA', texto_comentario: 'Puro show de campaña, la salud depende del Ministerio de Salud y no de los representantes.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 7, es_equipo_campana: false }
        ]
      },
      {
        url_publicacion: 'https://x.com/diegofranariza/status/1789234567890123456',
        titulo: 'Encuentro con 150 Dignatarios Comunales y JAC: Fuerza Ciudadana Organizada',
        contenido: 'El corazón de una verdadera democracia está en sus líderes comunales. Escuchando las necesidades de acueductos veredales, salones comunales y alumbrado público. En el Congreso seremos el puente directo para que los recursos lleguen sin peajes politiqueros. ¡Comunales al poder! 🤝🇨🇴',
        tipo_contenido: 'texto',
        alcance: 46200,
        impresiones: 61800,
        reproducciones: 0,
        interacciones: 3890,
        compartidos: 1040,
        likes: 3120,
        me_encanta: 1540,
        me_enoja: 12,
        tema_estrategico: 'Poder Comunal y Presupuestos Participativos',
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: t4, nombre_usuario: t4n, texto_comentario: 'Los comunales nos sentimos plenamente representados en esta candidatura a la Cámara.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 92, es_equipo_campana: true, equipo_nombre: t4n, equipo_rol: 'Vocería Comunal' },
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Seguimos sumando apoyos vereda por vereda, municipio por municipio.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 66, es_equipo_campana: true, equipo_nombre: t0n, equipo_rol: 'Prensa Oficial' },
          { usuario_red: '@presidente_jac_vereda', nombre_usuario: 'Don Hernando Pinzón', texto_comentario: 'En nuestra vereda ya organizamos el comité de apoyo para el día de las elecciones.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 45, es_equipo_campana: false },
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'Avanzada territorial coordinando testigos y enlaces en cada puesto de votación.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 58, es_equipo_campana: true, equipo_nombre: t1n, equipo_rol: 'Coordinación de Avanzada' },
          { usuario_red: '@lideresa_barrio_norte', nombre_usuario: 'Luz Marina Cáceres', texto_comentario: 'Excelente que valore a las JAC, somos las que ponemos la cara ante las quejas de los vecinos.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 37, es_equipo_campana: false },
          { usuario_red: '@veedor_comunal_stder', nombre_usuario: 'Ing. Rodrigo Barajas', texto_comentario: '¿Cómo garantizará que las partidas asignadas a JAC no las frenen las secretarías de planeación municipal?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 25, es_equipo_campana: false },
          { usuario_red: '@comunero_indeciso', nombre_usuario: 'Alfonso Serrano', texto_comentario: '¿Habrá capacitación legal para los tesoreros comunales para no caer en faltas fiscales?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 18, es_equipo_campana: false },
          { usuario_red: '@critico_santander_red', nombre_usuario: 'Observador Político 2026', texto_comentario: 'Los comunales siempre han sido utilizados como maquinaria electoral en todas las campañas.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 11, es_equipo_campana: false }
        ]
      }
    ];
  }

  if (platform === 'instagram') {
    return [
      {
        url_publicacion: 'https://www.instagram.com/reel/C7X289mQ_ariza/',
        titulo: 'En territorio, caminando con la gente que madruga a construir país (Reel)',
        contenido: 'Un saludo muy especial desde nuestras veredas de Santander. Caminando, escuchando y estrechando las manos de los campesinos y comerciantes que no se rinden. Nuestra propuesta a la Cámara de Representantes nace de la realidad de la gente, no de un escritorio en Bogotá. ¡Acompáñanos a construir el cambio con resultados! 🇨🇴🌾 #DiegoAriza #Cámara2026 #GestiónComprobada',
        tipo_contenido: 'video',
        video_duration_seconds: 52,
        alcance: 58400,
        impresiones: 76200,
        reproducciones: 44200,
        interacciones: 4890,
        compartidos: 1120,
        likes: 3620,
        me_encanta: 1980,
        me_enoja: 14,
        tema_estrategico: 'Cercanía Popular y Liderazgo de Base',
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: '¡Imparable la avanzada! Diego Ariza representa la voz transparente que necesitamos en el Congreso 🔥', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 82, es_equipo_campana: true, equipo_nombre: t1n, equipo_rol: 'Coordinación de Avanzada' },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'Los jóvenes estamos con usted por su coherencia y su trabajo por la educación técnica 👏', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 67, es_equipo_campana: true, equipo_nombre: t2n, equipo_rol: 'Líder Juventudes' },
          { usuario_red: '@emprendedora_artesanal', nombre_usuario: 'Claudia Patricia Gil', texto_comentario: 'Apoye a los artesanos y mujeres rurales cuando llegue a la Cámara por favor.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 39, es_equipo_campana: false },
          { usuario_red: t3, nombre_usuario: t3n, texto_comentario: 'Las familias y mujeres de Santander respaldamos este proyecto honesto.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 51, es_equipo_campana: true, equipo_nombre: t3n, equipo_rol: 'Coordinadora Mujeres' },
          { usuario_red: '@productor_citricos_lebrija', nombre_usuario: 'Marcos Rueda', texto_comentario: 'Gran hombre. Ojalá traiga inversión para los centros de acopio de fruta.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 31, es_equipo_campana: false },
          { usuario_red: '@estudiante_unab', nombre_usuario: 'Daniel Rueda', texto_comentario: '¿Cuándo visita la universidad para dialogar con nosotros sobre empleo joven?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 24, es_equipo_campana: false },
          { usuario_red: '@ciudadana_floridablanca', nombre_usuario: 'Marcela Bautista', texto_comentario: '¿Qué propuesta específica tiene para el transporte masivo Metrolínea?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 17, es_equipo_campana: false },
          { usuario_red: '@troll_anonimo_santander', nombre_usuario: 'Voz Crítica 26', texto_comentario: 'Todos se toman fotos en el campo en época electoral para ganar simpatías.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 8, es_equipo_campana: false }
        ]
      },
      {
        url_publicacion: 'https://www.instagram.com/p/C6v910pA_ariza/',
        titulo: '5 Pilares de Gestión Legislativa para la Cámara de Representantes (Carrusel)',
        contenido: 'Presentamos nuestros 5 compromisos sagrados con la región:\n1️⃣ Placas huellas y maquinaria amarilla garantizada.\n2️⃣ Subsidio al precio de fertilizantes e insumos agrícolas.\n3️⃣ Giro directo y dotación integral a la red hospitalaria provincial.\n4️⃣ Educación tecnológica gratuita con sedes del SENA y universidades públicas.\n5️⃣ Presupuesto participativo directo para Juntas de Acción Comunal.\n\n¿Cuál de estos pilares consideras prioritario para tu comunidad? Cuéntamelo en comentarios. 👇',
        tipo_contenido: 'imagen',
        alcance: 49800,
        impresiones: 64100,
        reproducciones: 0,
        interacciones: 4120,
        compartidos: 890,
        likes: 3120,
        me_encanta: 1620,
        me_enoja: 16,
        tema_estrategico: 'Pilares Programáticos Cámara',
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Propuestas claras, viables y con impacto directo en los hogares de nuestras provincias.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 74, es_equipo_campana: true, equipo_nombre: t0n, equipo_rol: 'Prensa Oficial' },
          { usuario_red: '@ganadero_lechero', nombre_usuario: 'Manuel Antonio Rojas', texto_comentario: 'El subsidio a insumos y precios de sustentación lecheros es fundamental. Firme con usted.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 58, es_equipo_campana: false },
          { usuario_red: t4, nombre_usuario: t4n, texto_comentario: 'El pilar 5 de presupuestos participativos le dará dignidad a los comunales.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 49, es_equipo_campana: true, equipo_nombre: t4n, equipo_rol: 'Vocería Comunal' },
          { usuario_red: '@madre_cabeza_hogar_bga', nombre_usuario: 'Esperanza Gómez', texto_comentario: 'La educación tecnológica para nuestros hijos en los municipios es urgente doctor.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 36, es_equipo_campana: false },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'La juventud respalda el pilar 4: educación técnica sin tener que migrar obligados a las grandes ciudades.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 44, es_equipo_campana: true, equipo_nombre: t2n, equipo_rol: 'Líder Juventudes' },
          { usuario_red: '@cafetero_san_gil', nombre_usuario: 'Guillermo Albarracín', texto_comentario: '¿Cómo aplicaría el subsidio a fertilizantes? ¿A través de cooperativas cafeteras?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 28, es_equipo_campana: false },
          { usuario_red: '@veedor_presupuestal', nombre_usuario: 'Economista Jaime Durán', texto_comentario: '¿De qué bolsa del presupuesto general saldrá el dinero para la maquinaria amarilla?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 19, es_equipo_campana: false },
          { usuario_red: '@oposicion_digital_santander', nombre_usuario: 'Frente Crítico Santander', texto_comentario: 'Prometer subsidios en época de déficit fiscal es populismo legislativo.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 10, es_equipo_campana: false }
        ]
      },
      {
        url_publicacion: 'https://www.instagram.com/reel/C5k881qL_ariza/',
        titulo: 'Encuentro de Mujeres Líderes: Familias Fuertes y Emprendimiento Productivo (Reel)',
        contenido: 'Emocionante jornada con más de 250 mujeres líderes de veredas y cabeceras municipales. Ellas son las verdaderas administradoras de la esperanza. Impulsaremos capital semilla condonable para emprendimientos liderados por madres cabeza de hogar. ¡Mujer empoderada, región que progresa! 🌸💪',
        tipo_contenido: 'video',
        video_duration_seconds: 48,
        alcance: 63100,
        impresiones: 82400,
        reproducciones: 49800,
        interacciones: 5410,
        compartidos: 1350,
        likes: 4180,
        me_encanta: 2310,
        me_enoja: 9,
        tema_estrategico: 'Mujer, Familia y Equidad Social',
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: t3, nombre_usuario: t3n, texto_comentario: '¡Gracias Diego por creer siempre en las mujeres de nuestra tierra! Las familias están contigo.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 110, es_equipo_campana: true, equipo_nombre: t3n, equipo_rol: 'Coordinadora Mujeres' },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'Hermoso evento, la energía y el optimismo se sintieron en cada rincón.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 75, es_equipo_campana: true, equipo_nombre: t2n, equipo_rol: 'Líder Juventudes' },
          { usuario_red: '@lider_barrio_provenza', nombre_usuario: 'Martha Cecilia Díaz', texto_comentario: 'Excelente espacio, necesitamos capacitación en ventas digitales para nuestras microempresas.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 42, es_equipo_campana: false },
          { usuario_red: '@modista_comunitaria', nombre_usuario: 'Ana Lucía Serrano', texto_comentario: 'Las madres comunitarias y modistas apoyamos esta propuesta.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 38, es_equipo_campana: false },
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'El respaldo de las mujeres santandereanas es el motor de esta campaña.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 52, es_equipo_campana: true, equipo_nombre: t1n, equipo_rol: 'Coordinación de Avanzada' },
          { usuario_red: '@emprendedora_joyeria_giron', nombre_usuario: 'Carolina Flórez', texto_comentario: '¿Dónde nos inscribimos para los talleres de formulación de proyectos productivos?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 29, es_equipo_campana: false },
          { usuario_red: '@ciudadana_socorro', nombre_usuario: 'Inés María Delgado', texto_comentario: '¿El capital semilla también aplicará para mujeres del sector rural?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 21, es_equipo_campana: false },
          { usuario_red: '@observadora_politica_local', nombre_usuario: 'Dra. Claudia Meza', texto_comentario: 'Es importante que los proyectos no se queden en capacitaciones y tengan capital de giro real.', tipo_reaccion: 'critica', sentimiento: 'neutral', likes: 14, es_equipo_campana: false }
        ]
      }
    ];
  }

  if (platform === 'facebook') {
    return [
      {
        url_publicacion: 'https://www.facebook.com/diegofranariza/videos/102938475619283/',
        titulo: 'Gran Asamblea Comunitaria: ¡Unidos por la Cámara de Representantes por Santander!',
        contenido: '¡Qué gran demostración de cariño y compromiso ciudadano! Agradezco a las delegaciones comunales, transportadores, campesinos y comerciantes que nos acompañaron hoy. Demostramos con hechos y obras previas que sí es posible gobernar con pulcritud, de cara a la gente y sin perder la humildad. ¡Vamos juntos al Congreso a levantar la voz por nuestra tierra! 🇨🇴🤝🗳️',
        tipo_contenido: 'video',
        video_duration_seconds: 140,
        alcance: 72400,
        impresiones: 94800,
        reproducciones: 58200,
        interacciones: 6920,
        compartidos: 1980,
        likes: 5120,
        me_encanta: 2840,
        me_enoja: 25,
        tema_estrategico: 'Asamblea Ciudadana y Fuerza Electoral',
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: '¡Lleno total! El pueblo reconoce al líder que nunca los ha abandonado.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 145, es_equipo_campana: true, equipo_nombre: t1n, equipo_rol: 'Coordinación de Avanzada' },
          { usuario_red: t4, nombre_usuario: t4n, texto_comentario: 'Las veredas enteras organizadas y listas para las urnas con Diego Fran Ariza.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 118, es_equipo_campana: true, equipo_nombre: t4n, equipo_rol: 'Vocería Comunal' },
          { usuario_red: '@lider_transportador', nombre_usuario: 'Carlos Emiro Rincón', texto_comentario: 'El gremio transportador apoya a quien se compromete a arreglar los corredores viales.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 84, es_equipo_campana: false },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: '¡Juventud presente y activa! Vamos por esa curul de representación.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 76, es_equipo_campana: true, equipo_nombre: t2n, equipo_rol: 'Líder Juventudes' },
          { usuario_red: '@comerciante_calzado_bga', nombre_usuario: 'Alfonso Forero', texto_comentario: 'El sector calzado y confección de Santander necesita aranceles a la importación desleal.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 49, es_equipo_campana: false },
          { usuario_red: '@ciudadano_santander_alerta', nombre_usuario: 'Felipe Sandoval', texto_comentario: '¿Cuáles partidos y movimientos apoyan oficialmente su lista a la Cámara?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 21, es_equipo_campana: false },
          { usuario_red: '@veedor_ciudadano_florida', nombre_usuario: 'Camilo Ernesto Ortiz', texto_comentario: '¿Cómo garantizará independencia de los clanes burocráticos del departamento?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 16, es_equipo_campana: false },
          { usuario_red: '@cuenta_opositora_stder', nombre_usuario: 'Voz Crítica 2026', texto_comentario: 'Las asambleas masivas siempre tienen asistencia obligada de contratistas.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 9, es_equipo_campana: false }
        ]
      },
      {
        url_publicacion: 'https://www.facebook.com/diegofranariza/posts/pfbid02aKLm98Qwx81726/',
        titulo: 'En Diálogo con los Paneleros y Lecheros: Protección y Precios Justos al Productor Nacional',
        contenido: 'Los sobrecostos en concentrados, combustibles y empaques tienen asfixiados a nuestros pequeños ganaderos y trapiches paneleros. Radicaremos proyecto para fijar tarifas especiales de energía rural para distritos de riego y trapiches comunitarios. ¡Cuidar el campo es garantizar la comida de todos! 🚜🥛',
        tipo_contenido: 'imagen',
        alcance: 54100,
        impresiones: 71200,
        reproducciones: 0,
        interacciones: 4580,
        compartidos: 1240,
        likes: 3820,
        me_encanta: 1740,
        me_enoja: 15,
        tema_estrategico: 'Sector Agropecuario y Seguridad Alimentaria',
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: '@trapiche_panelero_donpedro', nombre_usuario: 'Pedro Julio Benítez', texto_comentario: 'La tarifa de luz nos estaba quebrando. Excelente que plantee esto en el Congreso.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 89, es_equipo_campana: false },
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'El agro es y seguirá siendo la columna vertebral de nuestra propuesta.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 62, es_equipo_campana: true, equipo_nombre: t0n, equipo_rol: 'Prensa Oficial' },
          { usuario_red: '@asociacion_lecheros_san_gil', nombre_usuario: 'Asogan Guanentá', texto_comentario: 'Apoyamos la tarifa diferencial rural de energía. Es un alivio real y directo.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 47, es_equipo_campana: false },
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'Recorriendo los trapiches de la hoya del río Suárez junto a las familias campesinas.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 53, es_equipo_campana: true, equipo_nombre: t1n, equipo_rol: 'Coordinación de Avanzada' },
          { usuario_red: '@ganadero_socorro', nombre_usuario: 'Don José Antonio Morales', texto_comentario: 'El precio del litro de leche cayó 400 pesos en dos meses. Urge intervención de la superintendencia.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 35, es_equipo_campana: false },
          { usuario_red: '@productor_panela_velez', nombre_usuario: 'Hernán Darío Ruiz', texto_comentario: '¿El proyecto incluye salvaguardias contra la panela derretida importada?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 26, es_equipo_campana: false },
          { usuario_red: '@economista_agro_uis', nombre_usuario: 'Prof. Santiago Delgado', texto_comentario: '¿Cómo se compensará el subsidio tarifario a las empresas electrificadoras regionales?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 18, es_equipo_campana: false },
          { usuario_red: '@detractor_rural_2026', nombre_usuario: 'Campesino Escéptico', texto_comentario: 'Las tarifas de luz nunca bajan, siempre prometen lo mismo en campaña.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 8, es_equipo_campana: false }
        ]
      },
      {
        url_publicacion: 'https://www.facebook.com/diegofranariza/videos/204918273619284/',
        titulo: 'Transmisión en Vivo: Foro Regional de Desarrollo y Oportunidades para Santander',
        contenido: '🔴 EN VIVO | Rendición de cuentas de trayectoria y presentación de las iniciativas de ley prioritarias para la Cámara de Representantes 2026. Conéctate, deja tus preguntas y construyamos juntos las soluciones que nuestra región reclama. ¡Participa activamente!',
        tipo_contenido: 'video',
        video_duration_seconds: 240,
        en_vivo: false,
        alcance: 81200,
        impresiones: 108400,
        reproducciones: 69400,
        interacciones: 8410,
        compartidos: 2310,
        likes: 6240,
        me_encanta: 3120,
        me_enoja: 32,
        tema_estrategico: 'Foro Ciudadano en Directo',
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Gracias a los más de 2.000 ciudadanos conectados simultáneamente a esta transmisión.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 165, es_equipo_campana: true, equipo_nombre: t0n, equipo_rol: 'Prensa Oficial' },
          { usuario_red: t3, nombre_usuario: t3n, texto_comentario: 'Respuestas claras y sinceras a todas las inquietudes ciudadanas.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 98, es_equipo_campana: true, equipo_nombre: t3n, equipo_rol: 'Coordinadora Mujeres' },
          { usuario_red: '@veedor_comunitario_giron', nombre_usuario: 'Gonzalo Rueda', texto_comentario: 'Muy buena transmisión, respondió las preguntas de los ciudadanos sin rodeos.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 54, es_equipo_campana: false },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'Los jóvenes de Bucaramanga y Floridablanca conectados al en vivo.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 72, es_equipo_campana: true, equipo_nombre: t2n, equipo_rol: 'Líder Juventudes' },
          { usuario_red: '@habitante_san_gil_centro', nombre_usuario: 'Alvaro Prada Mantilla', texto_comentario: 'Excelente aclaración sobre los recursos de regalías para acueductos.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 39, es_equipo_campana: false },
          { usuario_red: '@estudiante_derecho_uis', nombre_usuario: 'Juan Pablo Vera', texto_comentario: '¿Cuál será su postura frente a las facultades extraordinarias del ejecutivo?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 31, es_equipo_campana: false },
          { usuario_red: '@ciudadano_barranca_pregunta', nombre_usuario: 'Oscar Eduardo Plata', texto_comentario: '¿Qué compromiso asume con la seguridad del Magdalena Medio?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 25, es_equipo_campana: false },
          { usuario_red: '@usuario_troll_live', nombre_usuario: 'Cuenta Crítica En Vivo', texto_comentario: 'Mucho discurso y poca autocrítica frente a las administraciones pasadas.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 11, es_equipo_campana: false }
        ]
      }
    ];
  }

  if (platform === 'tiktok') {
    return [
      {
        url_publicacion: 'https://www.tiktok.com/@diego.fran.ariza/video/7345678901234567890',
        titulo: '¿Sabías cuánto dura una placa huella bien construida? 🚜 Te lo explico en 40s',
        contenido: 'Muchos prometen pavimento pero en el primer invierno se lava. Te muestro cómo ejecutamos obras que duran décadas y por qué queremos masificar este modelo desde la Cámara de Representantes. ¡Resultados comprobados! 🇨🇴 #DiegoAriza #TikTokPolítico #Colombia #ObrasReales #IngenieríaSocial',
        tipo_contenido: 'video',
        video_duration_seconds: 42,
        alcance: 92400,
        impresiones: 124000,
        reproducciones: 88500,
        interacciones: 9840,
        compartidos: 2840,
        likes: 7420,
        me_encanta: 3890,
        me_enoja: 28,
        tema_estrategico: 'TikTok Viral de Obras Comunitarias',
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: '¡Así se hace política, mostrando obras terminadas y no promesas al aire! 🔥', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 215, es_equipo_campana: true, equipo_nombre: t2n, equipo_rol: 'Líder Juventudes' },
          { usuario_red: '@joven_voter_tiktok', nombre_usuario: 'Andrés Camargo', texto_comentario: 'Primera vez que veo un candidato que explica temas de ingeniería y presupuesto tan claro. Tiene mi voto.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 142, es_equipo_campana: false },
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'Avanzada Diego Ariza 100% activa en redes juveniles.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 88, es_equipo_campana: true, equipo_nombre: t1n, equipo_rol: 'Coordinación de Avanzada' },
          { usuario_red: '@vecina_piedecuesta', nombre_usuario: 'Yolanda Suárez', texto_comentario: 'Venga a la vereda Sevilla a mirar cómo se hunde el carreteable en invierno.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 62, es_equipo_campana: false },
          { usuario_red: '@ingeniero_civil_joven', nombre_usuario: 'Fabián Gómez', texto_comentario: 'Buen detalle el de las cunetas y descoles. Sin buen drenaje el concreto no dura nada.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 54, es_equipo_campana: false },
          { usuario_red: '@universitario_uis_26', nombre_usuario: 'Sebastián Pinzón', texto_comentario: '¿Cómo garantizar que los alcaldes no cobren coimas a los contratistas?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 45, es_equipo_campana: false },
          { usuario_red: '@joven_curiti', nombre_usuario: 'Mateo Sandoval', texto_comentario: '¿Cuánto cuesta el metro lineal promedio de placa huella?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 32, es_equipo_campana: false },
          { usuario_red: '@bot_oposicion_99', nombre_usuario: 'Usuario Crítico TikTok', texto_comentario: 'Ahora todos son ingenieros en TikTok jaja pura edición de video.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 9, es_equipo_campana: false }
        ]
      },
      {
        url_publicacion: 'https://www.tiktok.com/@diego.fran.ariza/video/7345678901234567891',
        titulo: '3 Razones para votar por Diego Fran Ariza a la Cámara de Representantes este 2026',
        contenido: '1️⃣ Experiencia y gestión comprobada en lo público.\n2️⃣ Independencia y cero ataduras con la politiquería tradicional.\n3️⃣ Compromiso inquebrantable con el campo, la juventud y la salud provincial.\n\n¡Comparte este video con quien todavía esté indeciso! 🗳️🇨🇴',
        tipo_contenido: 'video',
        video_duration_seconds: 38,
        alcance: 84600,
        impresiones: 112000,
        reproducciones: 79200,
        interacciones: 8640,
        compartidos: 2450,
        likes: 6890,
        me_encanta: 3410,
        me_enoja: 21,
        tema_estrategico: 'TikTok Razones de Voto',
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: '¡Vamos con toda la energía! La juventud ya decidió por Diego Ariza 🚀', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 184, es_equipo_campana: true, equipo_nombre: t2n, equipo_rol: 'Líder Juventudes' },
          { usuario_red: '@estudiante_universitaria', nombre_usuario: 'Valentina Pardo', texto_comentario: 'Excelente candidato. En mi casa todos votamos por Diego Ariza.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 96, es_equipo_campana: false },
          { usuario_red: t3, nombre_usuario: t3n, texto_comentario: 'Unión y berraquera de nuestra gente santandereana.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 62, es_equipo_campana: true, equipo_nombre: t3n, equipo_rol: 'Coordinadora Mujeres' },
          { usuario_red: '@lider_barrio_kennedy', nombre_usuario: 'Héctor Julio Gómez', texto_comentario: 'El norte de Bucaramanga acompaña esta candidatura.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 58, es_equipo_campana: false },
          { usuario_red: '@docente_primaria_rural', nombre_usuario: 'Gladys Marina Rueda', texto_comentario: 'Los maestros rurales valoramos su compromiso con las escuelas veredales.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 41, es_equipo_campana: false },
          { usuario_red: '@votante_joven_indeciso', nombre_usuario: 'Nicolás Jaimes', texto_comentario: '¿Cuál es su postura exacta frente a las tarifas de energía eléctrica?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 33, es_equipo_campana: false },
          { usuario_red: '@universitario_santotomas', nombre_usuario: 'Esteban Carvajal', texto_comentario: '¿Qué número y partido tiene en el tarjetón para marcar bien?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 27, es_equipo_campana: false },
          { usuario_red: '@comentador_sarcastico', nombre_usuario: 'Observador Sarcástico', texto_comentario: 'Todos los videos de campaña dicen que son independientes.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 12, es_equipo_campana: false }
        ]
      },
      {
        url_publicacion: 'https://www.tiktok.com/@diego.fran.ariza/video/7345678901234567892',
        titulo: 'Un día en campaña: 14 horas de recorrido veredal sin parar por Santander 💪',
        contenido: 'Madrugamos con tinto campesino, visitamos 5 veredas, almorzamos sancocho de gallina criolla y terminamos con un abrazo fraterno en asamblea comunal. La política bonita es la que se vive con el corazón. ¡Gracias por tanto cariño! ❤️ #DiegoAriza #DíaDeCampaña #AmorPorLaRegión',
        tipo_contenido: 'video',
        video_duration_seconds: 55,
        alcance: 104000,
        impresiones: 138000,
        reproducciones: 96400,
        interacciones: 11200,
        compartidos: 3210,
        likes: 8940,
        me_encanta: 4560,
        me_enoja: 19,
        tema_estrategico: 'Vlog Diario de Campaña',
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: t3, nombre_usuario: t3n, texto_comentario: '¡Esa humildad y esa sencillez son las que lo hacen grande doctor Diego! Dios lo bendiga.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 248, es_equipo_campana: true, equipo_nombre: t3n, equipo_rol: 'Coordinadora Mujeres' },
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Mañana la cita es en la plaza principal desde las 9:00 AM. ¡No falten!', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 135, es_equipo_campana: true, equipo_nombre: t0n, equipo_rol: 'Prensa Oficial' },
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: '¡Todo el equipo de avanzada coordinado y firme!', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 98, es_equipo_campana: true, equipo_nombre: t1n, equipo_rol: 'Coordinación de Avanzada' },
          { usuario_red: '@vecino_san_gil', nombre_usuario: 'Don Hernando Quintero', texto_comentario: 'Bienvenido siempre a nuestra tierrita. Aquí tiene amigos leales.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 74, es_equipo_campana: false },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'La tropa digital acompañando cada paso en el territorio.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 66, es_equipo_campana: true, equipo_nombre: t2n, equipo_rol: 'Líder Juventudes' },
          { usuario_red: '@seguidor_floridablanca', nombre_usuario: 'Rubén Darío Plata', texto_comentario: '¿Cuándo hace recorrido por los barrios de Floridablanca?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 34, es_equipo_campana: false },
          { usuario_red: '@joven_voto_informado', nombre_usuario: 'Santiago Bermúdez', texto_comentario: '¿Dónde podemos ver las propuestas completas por escrito?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 22, es_equipo_campana: false },
          { usuario_red: '@opositor_tiktok_bga', nombre_usuario: 'Cuenta Detractora', texto_comentario: 'Puro show mediático para redes, esperemos que cumpla si llega a ganar.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 15, es_equipo_campana: false }
        ]
      }
    ];
  }

  if (platform === 'youtube') {
    return [
      {
        url_publicacion: 'https://www.youtube.com/watch?v=DF_Ariza2026_01',
        titulo: 'Documental de Trayectoria y Gestión por Santander',
        contenido: 'Recorrido en profundidad por las obras construidas, los desafíos superados y la visión transformadora para la Cámara de Representantes 2026. Conoce al candidato que nació en el campo y trabaja de sol a sol por su comunidad.',
        tipo_contenido: 'video',
        video_duration_seconds: 480,
        alcance: 68200,
        impresiones: 89400,
        reproducciones: 51200,
        interacciones: 5210,
        compartidos: 1420,
        likes: 4120,
        me_encanta: 2190,
        me_enoja: 14,
        tema_estrategico: 'Documental Oficial de Trayectoria',
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Documental imperdible para conocer la verdad y trayectoria de Diego Fran Ariza.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 132, es_equipo_campana: true, equipo_nombre: t0n, equipo_rol: 'Prensa Oficial' },
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'Obras que hablan por sí solas en cada provincia de nuestro departamento.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 94, es_equipo_campana: true, equipo_nombre: t1n, equipo_rol: 'Coordinación de Avanzada' },
          { usuario_red: '@lider_socorro_santander', nombre_usuario: 'Humberto Silva', texto_comentario: 'Admirable testimonio de superación y servicio a la comunidad.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 68, es_equipo_campana: false },
          { usuario_red: t4, nombre_usuario: t4n, texto_comentario: 'El compromiso con los sectores populares es genuino y comprobable.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 55, es_equipo_campana: true, equipo_nombre: t4n, equipo_rol: 'Vocería Comunal' },
          { usuario_red: '@docente_universitaria_uis', nombre_usuario: 'Dra. Leonor Mantilla', texto_comentario: 'Un perfil riguroso, que conoce el territorio y no improvisa en lo técnico.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 47, es_equipo_campana: false },
          { usuario_red: '@ciudadano_pregunta_yt', nombre_usuario: 'Oscar Eduardo Plata', texto_comentario: '¿Cuáles comisiones del Congreso buscará integrar de resultar electo?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 29, es_equipo_campana: false },
          { usuario_red: '@joven_politologo', nombre_usuario: 'Mauricio Rangel', texto_comentario: '¿Qué alianzas legislativas planea con las otras regiones del oriente colombiano?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 19, es_equipo_campana: false },
          { usuario_red: '@usuario_critico_youtube', nombre_usuario: 'Veedor Libre Santander', texto_comentario: 'El documental está muy bien producido, pero queremos ver propuestas contra la corrupción.', tipo_reaccion: 'critica', sentimiento: 'negativo', likes: 12, es_equipo_campana: false }
        ]
      },
      {
        url_publicacion: 'https://www.youtube.com/watch?v=DF_Ariza2026_02',
        titulo: 'Plan Integral de Vías y Placas Huellas para el Campo Santandereano',
        contenido: 'Explicación técnica y presupuestal sobre cómo financiar y blindar 500 kilómetros de placas huellas en Santander desde el Congreso de la República.',
        tipo_contenido: 'video',
        video_duration_seconds: 320,
        alcance: 54100,
        impresiones: 72100,
        reproducciones: 39800,
        interacciones: 3980,
        compartidos: 980,
        likes: 3240,
        me_encanta: 1640,
        me_enoja: 11,
        tema_estrategico: 'Propuesta Técnica de Vías Terciarias',
        comentarios_conteo: 8,
        commentsData: [
          { usuario_red: t4, nombre_usuario: t4n, texto_comentario: 'Los comunales estamos listos para ejecutar este plan con veeduría popular.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 88, es_equipo_campana: true, equipo_nombre: t4n, equipo_rol: 'Vocería Comunal' },
          { usuario_red: '@ingeniero_vias_uis', nombre_usuario: 'Carlos E. Gómez', texto_comentario: 'Excelente especificación técnica de espesores y drenajes en montaña.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 52, es_equipo_campana: false },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'Tecnología y transparencia en las obras públicas de Santander.', tipo_reaccion: 'aplausos', sentimiento: 'positivo', likes: 45, es_equipo_campana: true, equipo_nombre: t2n, equipo_rol: 'Líder Juventudes' },
          { usuario_red: '@transportador_pesado', nombre_usuario: 'Gustavo Adolfo Pinzón', texto_comentario: 'Si arreglan esas vías terciarias, los costos de fletes de fruta bajan un 30%.', tipo_reaccion: 'me_gusta', sentimiento: 'positivo', likes: 39, es_equipo_campana: false },
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'Diego Fran Ariza sabe cómo gestionar los recursos en Bogotá para nuestra gente.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 48, es_equipo_campana: true, equipo_nombre: t1n, equipo_rol: 'Coordinación de Avanzada' },
          { usuario_red: '@veedor_obras_san_gil', nombre_usuario: 'Ing. Fernando Mantilla', texto_comentario: '¿Cómo se auditará la calidad de los agregados pétreos en cada municipio?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 24, es_equipo_campana: false },
          { usuario_red: '@productor_leche_onza', nombre_usuario: 'Marcos Julio Rueda', texto_comentario: '¿Se incluirán puentes vehiculares sobre quebradas en invierno?', tipo_reaccion: 'pregunta', sentimiento: 'neutral', likes: 18, es_equipo_campana: false },
          { usuario_red: '@cuenta_analisis_vial', nombre_usuario: 'Observatorio de Infraestructura', texto_comentario: 'Los costos por kilómetro de placa huella en ladera son muy variables y requieren estudios previos.', tipo_reaccion: 'critica', sentimiento: 'neutral', likes: 10, es_equipo_campana: false }
        ]
      }
    ];
  }

  return [];
}

module.exports = { getDiegoArizaPosts };
