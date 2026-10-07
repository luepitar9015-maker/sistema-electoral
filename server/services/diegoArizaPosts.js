function getDiegoArizaPosts(platform, handle, cleanUrl, teamAccounts = []) {
  const t0 = teamAccounts[0] ? teamAccounts[0].usuario_handle : '@prensa_diego_ariza';
  const t0n = teamAccounts[0] ? teamAccounts[0].nombre_miembro : 'Equipo Prensa Oficial Diego Ariza';
  const t1 = teamAccounts[1] ? teamAccounts[1].usuario_handle : '@avanzada_ariza_camara';
  const t1n = teamAccounts[1] ? teamAccounts[1].nombre_miembro : 'Avanzada Regional Diego Ariza';
  const t2 = teamAccounts[2] ? teamAccounts[2].usuario_handle : '@juventudes_con_ariza';
  const t2n = teamAccounts[2] ? teamAccounts[2].nombre_miembro : 'Juventudes con Diego Ariza';
  const t3 = teamAccounts[3] ? teamAccounts[3].usuario_handle : '@mujeres_con_ariza';
  const t3n = teamAccounts[3] ? teamAccounts[3].nombre_miembro : 'Colectivo Mujeres con Ariza';
  const t4 = teamAccounts[4] ? teamAccounts[4].usuario_handle : '@comunales_con_ariza';
  const t4n = teamAccounts[4] ? teamAccounts[4].nombre_miembro : 'Red de Líderes Comunales y JAC';

  if (platform === 'twitter') {
    return [
      {
        titulo: `${handle}: Proyecto de Ley: Recursos Directos y Blindados para Vías Terciarias`,
        contenido: '🇨🇴 ¡El campo no aguanta más promesas sobre barro! En la Cámara de Representantes lideraremos la Ley de Placas Huellas y Vías Terciarias. La verdadera equidad para nuestros campesinos empieza cuando pueden sacar su leche, panela y cosechas a los centros de acopio sin intermediarios abusivos. #DiegoAriza #CámaraDeRepresentantes #ResultadosReales',
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
        commentsData: [
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: '¡Total respaldo al Dr. Diego Ariza! Su trayectoria demostró que sí se pueden construir kilómetros de placas huellas con transparencia.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 78, es_equipo_campana: true, equipo_nombre: t1n, equipo_rol: 'Coordinación de Avanzada' },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'La juventud rural necesita vías y conectividad para emprender en el campo. ¡Con toda por la Cámara!', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 64, es_equipo_campana: true, equipo_nombre: t2n, equipo_rol: 'Líder Juventudes' },
          { usuario_red: '@productor_campesino_real', nombre_usuario: 'Jorge Eliecer Rodríguez', texto_comentario: 'Doctor Diego, cuente con las veredas. Cuando estuvo en la alcaldía cumplió con hechos y no con discursos.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 52 },
          { usuario_red: t4, nombre_usuario: t4n, texto_comentario: 'Las Juntas de Acción Comunal respaldamos esta iniciativa legislativa para contratar directamente.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 41, es_equipo_campana: true, equipo_nombre: t4n, equipo_rol: 'Vocería Comunal' }
        ]
      },
      {
        titulo: `${handle}: Control Político a la Red Hospitalaria Provincial: ¡Salud Digna ya!`,
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
        commentsData: [
          { usuario_red: t3, nombre_usuario: t3n, texto_comentario: 'Las madres y familias de los municipios sufrimos por la falta de pediatras y ginecólogos. Urge esta reforma.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 71, es_equipo_campana: true, equipo_nombre: t3n, equipo_rol: 'Coordinadora Mujeres' },
          { usuario_red: '@veedor_salud_provincia', nombre_usuario: 'Mireya Salamanca', texto_comentario: 'Excelente debate doctor Diego. El hospital regional necesita una UCI neonatal urgente.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 48 }
        ]
      },
      {
        titulo: `${handle}: Encuentro con 150 Dignatarios Comunales y JAC: Fuerza Ciudadana`,
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
        commentsData: [
          { usuario_red: t4, nombre_usuario: t4n, texto_comentario: 'Los comunales nos sentimos plenamente representados en esta candidatura a la Cámara.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 92, es_equipo_campana: true },
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Seguimos sumando apoyos vereda por vereda, municipio por municipio.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 66, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: Alianzas Productivas para los Paneleros y Cacaoteros`,
        contenido: 'Fijar precios justos y proteger la producción nacional frente al contrabando es una urgencia de soberanía económica. En la Comisión Quinta de la Cámara daremos el debate por subsidios al transporte de carga campesina. #CampoColombiano',
        tipo_contenido: 'texto',
        alcance: 41200,
        impresiones: 54100,
        reproducciones: 0,
        interacciones: 3210,
        compartidos: 840,
        likes: 2710,
        me_encanta: 1310,
        me_enoja: 14,
        tema_estrategico: 'Soberanía Agropecuaria y Precios Justos',
        commentsData: [
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'Defensa férrea de nuestros productores tradicionales.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 58, es_equipo_campana: true }
        ]
      }
    ];
  } else if (platform === 'instagram') {
    return [
      {
        titulo: `${handle}: En territorio, caminando con la gente que madruga a construir país (Reel)`,
        contenido: 'Un saludo muy especial desde nuestras veredas. Caminando, escuchando y estrechando las manos de los campesinos y comerciantes que no se rinden. Nuestra propuesta a la Cámara de Representantes nace de la realidad de la gente, no de un escritorio en Bogotá. ¡Acompáñanos a construir el cambio con resultados! 🇨🇴🌾 #DiegoAriza #Cámara2026 #GestiónComprobada',
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
        commentsData: [
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: '¡Imparable la avanzada! Diego Ariza representa la voz transparente que necesitamos en el Congreso 🔥', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 82, es_equipo_campana: true },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'Los jóvenes estamos con usted por su coherencia y su trabajo por la educación técnica 👏', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 67, es_equipo_campana: true },
          { usuario_red: '@emprendedora_artesanal', nombre_usuario: 'Claudia Patricia Gil', texto_comentario: 'Apoye a los artesanos y mujeres rurales cuando llegue a la Cámara por favor.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 39 }
        ]
      },
      {
        titulo: `${handle}: 5 Pilares de Gestión Legislativa para la Cámara de Representantes (Carrusel)`,
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
        commentsData: [
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Propuestas claras, viables y con impacto directo en los hogares de nuestras provincias.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 74, es_equipo_campana: true },
          { usuario_red: '@ganadero_lechero', nombre_usuario: 'Manuel Antonio Rojas', texto_comentario: 'El subsidio a insumos y precios de sustentación lecheros es fundamental. Firme con usted.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 58 }
        ]
      },
      {
        titulo: `${handle}: Encuentro de Mujeres Líderes: Familias Fuertes y Emprendimiento (Reel)`,
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
        commentsData: [
          { usuario_red: t3, nombre_usuario: t3n, texto_comentario: '¡Gracias Diego por creer siempre en las mujeres de nuestra tierra! Las familias están contigo.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 110, es_equipo_campana: true },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: 'Hermoso evento, la energía y el optimismo se sintieron en cada rincón.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 75, es_equipo_campana: true }
        ]
      }
    ];
  } else if (platform === 'facebook') {
    return [
      {
        titulo: `${handle}: Gran Asamblea Comunitaria: ¡Unidos por la Cámara de Representantes!`,
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
        commentsData: [
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: '¡Lleno total! El pueblo reconoce al líder que nunca los ha abandonado.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 145, es_equipo_campana: true },
          { usuario_red: t4, nombre_usuario: t4n, texto_comentario: 'Las veredas enteras organizadas y listas para las urnas con Diego Fran Ariza.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 118, es_equipo_campana: true },
          { usuario_red: '@lider_transportador', nombre_usuario: 'Carlos Emiro Rincón', texto_comentario: 'El gremio transportador apoya a quien se compromete a arreglar los corredores viales.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 84 },
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: '¡Juventud presente y activa! Vamos por esa curul de representación.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 76, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: En Diálogo con los Paneleros y Lecheros: Protección al Productor Nacional`,
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
        commentsData: [
          { usuario_red: '@trapiche_panelero_donpedro', nombre_usuario: 'Pedro Julio Benítez', texto_comentario: 'La tarifa de luz nos estaba quebrando. Excelente que plantee esto en el Congreso.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 89 },
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'El agro es y seguirá siendo la columna vertebral de nuestra propuesta.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 62, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: Transmisión en Vivo: Foro Regional de Desarrollo y Oportunidades`,
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
        commentsData: [
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Gracias a los más de 2.000 ciudadanos conectados simultáneamente.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 165, es_equipo_campana: true },
          { usuario_red: t3, nombre_usuario: t3n, texto_comentario: 'Respuestas claras y sinceras a todas las inquietudes ciudadanas.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 98, es_equipo_campana: true }
        ]
      }
    ];
  } else if (platform === 'tiktok') {
    return [
      {
        titulo: `${handle}: ¿Sabías cuánto dura una placa huella bien construida? 🚜 Te lo explico en 40s`,
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
        commentsData: [
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: '¡Así se hace política, mostrando obras terminadas y no promesas al aire! 🔥', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 215, es_equipo_campana: true },
          { usuario_red: '@joven_voter_tiktok', nombre_usuario: 'Andrés Camargo', texto_comentario: 'Primera vez que veo un candidato que explica temas de ingeniería y presupuesto tan claro. Tiene mi voto.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 142 },
          { usuario_red: t1, nombre_usuario: t1n, texto_comentario: 'Avanzada Diego Ariza 100% activa en redes juveniles.', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 88, es_equipo_campana: true }
        ]
      },
      {
        titulo: `${handle}: 3 Razones para votar por Diego Fran Ariza a la Cámara de Representantes este 2026`,
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
        commentsData: [
          { usuario_red: t2, nombre_usuario: t2n, texto_comentario: '¡Vamos con toda la energía! La juventud ya decidió por Diego Ariza 🚀', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 184, es_equipo_campana: true },
          { usuario_red: '@estudiante_universitaria', nombre_usuario: 'Valentina Pardo', texto_comentario: 'Excelente candidato. En mi casa todos votamos por Diego Ariza.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 96 }
        ]
      },
      {
        titulo: `${handle}: Un día en campaña: 14 horas de recorrido veredal sin parar 💪`,
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
        commentsData: [
          { usuario_red: t3, nombre_usuario: t3n, texto_comentario: '¡Esa humildad y esa sencillez son las que lo hacen grande doctor Diego! Dios lo bendiga.', tipo_reaccion: 'me_encanta', sentimiento: 'positivo', likes: 248, es_equipo_campana: true },
          { usuario_red: t0, nombre_usuario: t0n, texto_comentario: 'Mañana la cita es en la plaza principal desde las 9:00 AM. ¡No falten!', tipo_reaccion: 'apoyo', sentimiento: 'positivo', likes: 135, es_equipo_campana: true }
        ]
      }
    ];
  }

  return [];
}

module.exports = { getDiegoArizaPosts };
