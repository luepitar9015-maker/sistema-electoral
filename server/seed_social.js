const sequelize = require('./database/db');
const Campaign = require('./models/Campaign');
const SocialMediaPost = require('./models/SocialMediaPost');
const SocialTeamAccount = require('./models/SocialTeamAccount');
const SocialNegativeComment = require('./models/SocialNegativeComment');
const SocialCompetitor = require('./models/SocialCompetitor');

async function seedSocial() {
    try {
        await sequelize.sync();

        let campaign = await Campaign.findOne();
        if (!campaign) {
            campaign = await Campaign.create({
                nombre: 'Senado 2026 - Colombia Unida',
                tipo_cargo: 'senado',
                nivel_territorial: 'nacional',
                candidato: 'Alejandro Gaviria',
                color: '#00B894'
            });
        }
        const campId = campaign.id;

        // 1. Posts en redes sociales
        const countPosts = await SocialMediaPost.count();
        if (countPosts === 0) {
            await SocialMediaPost.bulkCreate([
                {
                    campana_id: campId,
                    plataforma: 'instagram',
                    titulo: 'Propuesta de Reactivación Económica para Jóvenes y Emprendedores',
                    contenido: '¡Construyamos juntos el futuro de Colombia! Hoy presentamos los 5 pilares para apoyar a los pequeños comerciantes y jóvenes que quieren emprender sin tantas trabas del Estado. 🇨🇴📈 #ColombiaUnida #Juventud2026',
                    url_publicacion: 'https://instagram.com/p/C39xyz123',
                    autor_nombre: 'Alejandro Gaviria',
                    autor_usuario: '@agaviriau',
                    fecha_publicacion: '2026-09-30 14:30',
                    tipo_contenido: 'video',
                    alcance: 48500,
                    impresiones: 62300,
                    reproducciones: 39400,
                    interacciones: 5210,
                    compartidos: 840,
                    comentarios_conteo: 312,
                    engagement_rate: 8.36,
                    likes: 4100,
                    me_encanta: 890,
                    me_enoja: 45,
                    sentimiento_positivo: 84.0,
                    sentimiento_neutral: 11.0,
                    sentimiento_negativo: 5.0,
                    en_vivo: false,
                    tema_estrategico: 'Empleo & Emprendimiento'
                },
                {
                    campana_id: campId,
                    plataforma: 'tiktok',
                    titulo: 'TRANSMISIÓN EN VIVO: Diálogo Abierto con la Comuna 4',
                    contenido: 'Estamos en vivo desde Aranjuez escuchando a las familias y líderes comunales sobre seguridad y transporte. ¡Comenta tu propuesta!',
                    url_publicacion: 'https://tiktok.com/@campanacolombia/live',
                    autor_nombre: 'Avanzada Juventudes',
                    autor_usuario: '@juventudes_colombia',
                    fecha_publicacion: '2026-09-30 17:00',
                    tipo_contenido: 'live',
                    alcance: 76000,
                    impresiones: 98000,
                    reproducciones: 58000,
                    interacciones: 11400,
                    compartidos: 2150,
                    comentarios_conteo: 1840,
                    engagement_rate: 11.63,
                    likes: 9500,
                    me_encanta: 1600,
                    me_enoja: 110,
                    sentimiento_positivo: 88.0,
                    sentimiento_neutral: 8.0,
                    sentimiento_negativo: 4.0,
                    en_vivo: true,
                    tema_estrategico: 'Territorio en Vivo'
                },
                {
                    campana_id: campId,
                    plataforma: 'twitter',
                    titulo: 'Respuesta con Datos al Debate de Salud y EPS',
                    contenido: 'La salud no se improvisa ni se destruye con discursos ideológicos. Necesitamos reformas con evidencia técnica, garantizando giro directo a hospitales y pagos oportunos a médicos. Hilo con datos oficiales 🧵👇',
                    url_publicacion: 'https://x.com/agaviriau/status/17654321',
                    autor_nombre: 'Alejandro Gaviria',
                    autor_usuario: '@agaviriau',
                    fecha_publicacion: '2026-09-29 09:15',
                    tipo_contenido: 'texto',
                    alcance: 125000,
                    impresiones: 180000,
                    reproducciones: 0,
                    interacciones: 14200,
                    compartidos: 3890,
                    comentarios_conteo: 940,
                    engagement_rate: 7.88,
                    likes: 8900,
                    me_encanta: 2100,
                    me_enoja: 350,
                    sentimiento_positivo: 76.0,
                    sentimiento_neutral: 14.0,
                    sentimiento_negativo: 10.0,
                    en_vivo: false,
                    tema_estrategico: 'Reforma a la Salud'
                },
                {
                    campana_id: campId,
                    plataforma: 'facebook',
                    titulo: 'Gran Recorrido en Plaza de Mercado El Guarnerito',
                    contenido: 'El corazón de nuestra tierra late en el campo y en las plazas de mercado. Con los campesinos y comerciantes acordamos apoyar los centros de acopio y crédito sin usura.',
                    url_publicacion: 'https://facebook.com/watch/?v=987654321',
                    autor_nombre: 'Equipo de Campaña Oficial',
                    autor_usuario: 'CampanaSenado2026',
                    fecha_publicacion: '2026-09-28 11:45',
                    tipo_contenido: 'carrusel',
                    alcance: 34200,
                    impresiones: 45100,
                    reproducciones: 0,
                    interacciones: 3400,
                    compartidos: 620,
                    comentarios_conteo: 180,
                    engagement_rate: 7.53,
                    likes: 2700,
                    me_encanta: 650,
                    me_enoja: 22,
                    sentimiento_positivo: 92.0,
                    sentimiento_neutral: 6.0,
                    sentimiento_negativo: 2.0,
                    en_vivo: false,
                    tema_estrategico: 'Sector Agropecuario'
                },
                {
                    campana_id: campId,
                    plataforma: 'youtube',
                    titulo: 'Documental: 100 Días Escuchando a las Regiones de Colombia',
                    contenido: 'Un resumen en video de las propuestas nacidas en los barrios, corregimientos y veredas de Colombia. Nuestro compromiso por un Senado transparente.',
                    url_publicacion: 'https://youtube.com/watch?v=AbCdEfGh123',
                    autor_nombre: 'Canal Oficial de Campaña',
                    autor_usuario: '@SenadoColombia2026',
                    fecha_publicacion: '2026-09-27 19:00',
                    tipo_contenido: 'video',
                    alcance: 52000,
                    impresiones: 78000,
                    reproducciones: 31500,
                    interacciones: 4800,
                    compartidos: 910,
                    comentarios_conteo: 430,
                    engagement_rate: 6.15,
                    likes: 3800,
                    me_encanta: 820,
                    me_enoja: 40,
                    sentimiento_positivo: 85.0,
                    sentimiento_neutral: 10.0,
                    sentimiento_negativo: 5.0,
                    en_vivo: false,
                    tema_estrategico: 'Rendición de Cuentas'
                }
            ]);
            console.log('Posts de redes sociales sembrados.');
        }

        // 2. Redes sociales del equipo de campaña
        const countTeam = await SocialTeamAccount.count();
        if (countTeam === 0) {
            await SocialTeamAccount.bulkCreate([
                {
                    campana_id: campId,
                    nombre_miembro: 'Alejandro Gaviria',
                    rol_equipo: 'Candidato Oficial',
                    plataforma: 'twitter',
                    usuario_handle: '@agaviriau',
                    url_perfil: 'https://x.com/agaviriau',
                    seguidores: 685000,
                    publicaciones_mes: 45,
                    nivel_participacion: 'Muy Activo',
                    repost_campana_count: 52,
                    ultimo_apoyo_fecha: '2026-09-30',
                    verificado: true,
                    observaciones: 'Cuenta principal de posicionamiento y doctrina de campaña.'
                },
                {
                    campana_id: campId,
                    nombre_miembro: 'Alejandro Gaviria',
                    rol_equipo: 'Candidato Oficial',
                    plataforma: 'instagram',
                    usuario_handle: '@agaviriau',
                    url_perfil: 'https://instagram.com/agaviriau',
                    seguidores: 215000,
                    publicaciones_mes: 32,
                    nivel_participacion: 'Muy Activo',
                    repost_campana_count: 38,
                    ultimo_apoyo_fecha: '2026-09-30',
                    verificado: true,
                    observaciones: 'Historias diarias de agenda y reels pedagógicos.'
                },
                {
                    campana_id: campId,
                    nombre_miembro: 'Dr. Carlos Mario Restrepo',
                    rol_equipo: 'Orador Delegado',
                    plataforma: 'facebook',
                    usuario_handle: '@carlosmario_orador',
                    url_perfil: 'https://facebook.com/carlosmario.orador',
                    seguidores: 18500,
                    publicaciones_mes: 18,
                    nivel_participacion: 'Activo',
                    repost_campana_count: 14,
                    ultimo_apoyo_fecha: '2026-09-30',
                    verificado: false,
                    observaciones: 'Comparte resúmenes y fotos de las reuniones en municipios.'
                },
                {
                    campana_id: campId,
                    nombre_miembro: 'Mariana Gómez',
                    rol_equipo: 'Líder Avanzada',
                    plataforma: 'tiktok',
                    usuario_handle: '@marianagomez_avanzada',
                    url_perfil: 'https://tiktok.com/@marianagomez_avanzada',
                    seguidores: 42000,
                    publicaciones_mes: 24,
                    nivel_participacion: 'Muy Activo',
                    repost_campana_count: 28,
                    ultimo_apoyo_fecha: '2026-09-30',
                    verificado: false,
                    observaciones: 'Videos detrás de cámaras de logística, eventos en vivo y montajes.'
                },
                {
                    campana_id: campId,
                    nombre_miembro: 'Andrés Felipe Muñoz',
                    rol_equipo: 'Activista Digital',
                    plataforma: 'twitter',
                    usuario_handle: '@andresf_digital',
                    url_perfil: 'https://x.com/andresf_digital',
                    seguidores: 6400,
                    publicaciones_mes: 8,
                    nivel_participacion: 'Baja Participación',
                    repost_campana_count: 3,
                    ultimo_apoyo_fecha: '2026-09-22',
                    verificado: false,
                    observaciones: 'Se requiere incentivar mayor réplica de hashtags en debates clave.'
                },
                {
                    campana_id: campId,
                    nombre_miembro: 'Sofía Valderrama',
                    rol_equipo: 'Influencer Aliada',
                    plataforma: 'instagram',
                    usuario_handle: '@sofi_valderrama_col',
                    url_perfil: 'https://instagram.com/sofi_valderrama_col',
                    seguidores: 110000,
                    publicaciones_mes: 12,
                    nivel_participacion: 'Activo',
                    repost_campana_count: 11,
                    ultimo_apoyo_fecha: '2026-09-29',
                    verificado: true,
                    observaciones: 'Genera contenido sobre juventud, medio ambiente y cultura ciudadana.'
                }
            ]);
            console.log('Cuentas del equipo sembradas.');
        }

        // 3. Comentarios negativos y alertas de crisis
        const countComments = await SocialNegativeComment.count();
        if (countComments === 0) {
            await SocialNegativeComment.bulkCreate([
                {
                    campana_id: campId,
                    plataforma: 'twitter',
                    publicacion_origen: 'Respuesta con Datos al Debate de Salud',
                    usuario_comenta: '@OposicionFuerte22',
                    texto_comentario: 'Gaviria solo defiende a las EPS tradicionales y a los conglomerados económicos, no le interesa la salud de los más pobres.',
                    fecha_deteccion: '2026-09-29 10:30',
                    categoria_ataque: 'Ataque Personal / Desinformación',
                    nivel_riesgo: 'alto',
                    estado_gestion: 'en_respuesta',
                    respuesta_sugerida: 'Nuestra propuesta garantiza giro directo a los hospitales públicos y elimina la intermediación corrupta, defendiendo tanto a los pacientes como al personal médico con datos y no con ideología.',
                    respuesta_publicada: 'Hola @OposicionFuerte22, nuestra postura técnica exige pago directo a hospitales públicos y transparencia total. Te invitamos a leer la propuesta completa aquí: https://campana.com/salud',
                    responsable_respuesta: 'Equipo de Prensa Digital'
                },
                {
                    campana_id: campId,
                    plataforma: 'facebook',
                    publicacion_origen: 'Gran Recorrido en Plaza de Mercado',
                    usuario_comenta: 'Bot_CuentaFalsa_302',
                    texto_comentario: 'Solo van a las plazas a tomarse la foto para elecciones y luego se olvidan de nosotros como todos los políticos.',
                    fecha_deteccion: '2026-09-28 13:20',
                    categoria_ataque: 'Troll / Bot',
                    nivel_riesgo: 'medio',
                    estado_gestion: 'neutralizado',
                    respuesta_sugerida: 'Publicar testimonios en video de líderes campesinos con los que se han firmado acuerdos vinculantes.',
                    respuesta_publicada: 'En nuestra campaña no venimos solo de visita: dejamos firmada el acta comunitaria con 15 asociaciones campesinas para auditar cada compromiso.',
                    responsable_respuesta: 'Mariana Gómez'
                },
                {
                    campana_id: campId,
                    plataforma: 'tiktok',
                    publicacion_origen: 'Video Propuesta Emprendimiento Joven',
                    usuario_comenta: '@alvaro_critico',
                    texto_comentario: '¿De dónde van a sacar el presupuesto para los créditos sin subir más impuestos?',
                    fecha_deteccion: '2026-09-30 15:10',
                    categoria_ataque: 'Crítica a Propuesta',
                    nivel_riesgo: 'bajo',
                    estado_gestion: 'pendiente',
                    respuesta_sugerida: 'Explicar la reasignación de subsidios ineficientes y reducción del gasto burocrático para fondear Bancóldex y el Fondo Emprender.',
                    respuesta_publicada: null,
                    responsable_respuesta: 'Portavoces Económicos'
                },
                {
                    campana_id: campId,
                    plataforma: 'twitter',
                    publicacion_origen: 'Debate Nacional en Radio',
                    usuario_comenta: '@CampañaRivalActiva',
                    texto_comentario: 'Circula video editado fuera de contexto asegurando que el candidato votará contra las pensiones comunitarias.',
                    fecha_deteccion: '2026-09-30 16:40',
                    categoria_ataque: 'Fake News / Desinformación',
                    nivel_riesgo: 'critico',
                    estado_gestion: 'escalado_legal',
                    respuesta_sugerida: 'Difundir comunicado oficial con el minuto exacto del video original, desmentido gráfico de Fake News y reporte formal a la plataforma por manipulación electoral.',
                    respuesta_publicada: 'COMUNICADO URGENTE: Circula video adulterado digitalmente. Compartimos el fragmento íntegro donde se defiende la pensión universal garantizada.',
                    responsable_respuesta: 'Gerencia y Jurídica'
                }
            ]);
            console.log('Comentarios negativos sembrados.');
        }

        // 4. Radar de contrincantes y oposición
        const countComp = await SocialCompetitor.count();
        if (countComp === 0) {
            await SocialCompetitor.bulkCreate([
                {
                    campana_id: campId,
                    nombre_candidato: 'Senador Jorge Enrique Robledo',
                    partido_movimiento: 'Dignidad & Compromiso',
                    cargo_postulado: 'Senado de la República',
                    redes_principales: JSON.stringify({
                        twitter: '@JERobledo',
                        instagram: '@jerobledo',
                        facebook: 'JorgeEnriqueRobledo'
                    }),
                    alcance_estimado: 450000,
                    seguidores_totales: 920000,
                    narrativa_principal: 'Oposición frontal a reformas gubernamentales y defensa de la producción nacional.',
                    lineas_de_ataque: 'Crítica a la moderación de candidatos de centro, acusándolos de tibieza o de pactar con sectores tradicionales.',
                    puntos_fuertes: 'Gran credibilidad en debates de control político, retórica sólida en Twitter y televisión.',
                    puntos_debiles: 'Menor impacto en audiencias jóvenes y formatos rápidos de TikTok/Reels.',
                    contra_estrategia_sugerida: 'Reconocer el valor del control político pero contrastar demostrando capacidad ejecutiva y propuestas de construcción de acuerdos, no solo oposición.',
                    nivel_amenaza: 'alto',
                    ultima_movida: 'Lanzó video viral cuestionando la política arancelaria del gobierno actual.'
                },
                {
                    campana_id: campId,
                    nombre_candidato: 'Candidato Oposición Radical',
                    partido_movimiento: 'Movimiento Orden y Firmeza',
                    cargo_postulado: 'Senado de la República',
                    redes_principales: JSON.stringify({
                        twitter: '@orden_y_firmeza',
                        tiktok: '@seguridad_total',
                        facebook: 'OrdenYFirmezaCol'
                    }),
                    alcance_estimado: 680000,
                    seguidores_totales: 530000,
                    narrativa_principal: 'Mano dura inmediata, discurso de seguridad punitiva y acusaciones de complicidad al resto de partidos.',
                    lineas_de_ataque: 'Publican fragmentos de debates acusándonos de blandos frente a la delincuencia y vandalismo.',
                    puntos_fuertes: 'Videos altamente emocionales con música dramática y alto alcance orgánico en TikTok y WhatsApp.',
                    puntos_debiles: 'Propuestas inviables constitucionalmente y falta de rigor presupuestal.',
                    contra_estrategia_sugerida: 'Desmontar sus bulos con pedagogía de seguridad inteligente: tecnología de vigilancia, cámaras con IA, apoyo a la policía y justicia rápida con condenas reales.',
                    nivel_amenaza: 'muy_alto',
                    ultima_movida: 'Campaña pagada en Meta con titulares sensacionalistas sobre inseguridad urbana.'
                }
            ]);
            console.log('Contrincantes de oposición sembrados.');
        }

        console.log('Seed de redes sociales finalizado exitosamente.');
    } catch (err) {
        console.error('Error en seedSocial:', err);
    } finally {
        await sequelize.close();
    }
}

seedSocial();
