const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Campaign = require('../models/Campaign');
const SocialTeamAccount = require('../models/SocialTeamAccount');
const SocialCompetitor = require('../models/SocialCompetitor');
const SocialCompetitorAttack = require('../models/SocialCompetitorAttack');
const socialSyncService = require('../services/socialSyncService');
const politicalStrategyAiService = require('../services/politicalStrategyAiService');

async function testSocialOscarVillamizar() {
    console.log('================================================================');
    console.log('🏛️ INICIANDO SINCRONIZACIÓN Y PRUEBA DE REDES: OSCAR VILLAMIZAR');
    console.log('================================================================\n');

    try {
        // 1. Localizar campaña de Oscar Villamizar
        let campaign = await Campaign.findOne({
            where: { candidato: 'OSCAR VILLAMIZAR' }
        });

        if (!campaign) {
            campaign = await Campaign.findByPk(2);
        }

        if (!campaign) {
            console.error('❌ No se encontró la campaña de Oscar Villamizar.');
            process.exit(1);
        }

        console.log(`📌 Campaña Encontrada: [ID ${campaign.id}] "${campaign.nombre}" - Candidato: "${campaign.candidato}"`);

        // 2. Vincular los 3 enlaces oficiales a la campaña
        const urls = {
            facebook: 'https://www.facebook.com/OscarVillamiz/?locale=es_LA',
            instagram: 'https://www.instagram.com/oscarvillamiz/?hl=es',
            twitter: 'https://x.com/OscarVillamiz'
        };

        campaign.link_facebook = urls.facebook;
        campaign.link_instagram = urls.instagram;
        campaign.link_twitter = urls.twitter;
        await campaign.save();
        console.log('✅ Enlaces oficiales configurados en la ficha de la campaña.');

        // 3. Crear o asegurar cuentas del equipo territorial para la auditoría de apoyo
        console.log('\n👥 Verificando integrantes del equipo en redes para auditoría de apoyo...');
        const teamAccountsData = [
            {
                campana_id: campaign.id,
                nombre_miembro: 'Carlos Gómez (Coordinador Avanzada)',
                usuario_handle: '@avanzada_villamizar_stder',
                red_social: 'twitter',
                rol_equipo: 'Líder Territorial Avanzada',
                telefono: '3157894512',
                nivel_participacion: 'Muy Activo',
                activo: true
            },
            {
                campana_id: campaign.id,
                nombre_miembro: 'María Paula Rueda (Comité Juvenil)',
                usuario_handle: '@juventudes_cd_bucaramanga',
                red_social: 'instagram',
                rol_equipo: 'Juventudes Departamentales',
                telefono: '3189965412',
                nivel_participacion: 'Muy Activo',
                activo: true
            },
            {
                campana_id: campaign.id,
                nombre_miembro: 'Andrés Flórez (Equipo Digital)',
                usuario_handle: '@comunicaciones_villamizar',
                red_social: 'twitter',
                rol_equipo: 'Comunicaciones y Prensa',
                telefono: '3201458796',
                nivel_participacion: 'Activo',
                activo: true
            }
        ];

        for (const tData of teamAccountsData) {
            const exists = await SocialTeamAccount.findOne({
                where: {
                    campana_id: campaign.id,
                    usuario_handle: tData.usuario_handle
                }
            });
            if (!exists) {
                await SocialTeamAccount.create(tData);
                console.log(`  ✓ Creada cuenta de equipo: ${tData.usuario_handle} (${tData.nombre_miembro})`);
            }
        }

        // 4. Sincronizar perfiles de las 3 plataformas
        console.log('\n🔄 Sincronizando publicaciones y comentarios desde los perfiles oficiales...');

        const syncResults = [];
        for (const [net, url] of Object.entries(urls)) {
            console.log(`  ⏳ Sincronizando ${net.toUpperCase()}: ${url} ...`);
            const res = await socialSyncService.syncProfileFromUrl({
                url,
                campanaId: campaign.id
            });
            syncResults.push(res);
            console.log(`  ✅ ${net.toUpperCase()}: ${res.postsCreated} posts creados/actualizados, ${res.commentsCreated} comentarios procesados (${res.teamMatchedCount} apoyos identificados del equipo).`);
        }

        // 5. Simular y registrar un ataque en el Radar de Oposición & War Room
        console.log('\n🎯 Simulando detección en el Radar de Oposición (War Room)...');
        let competitor = await SocialCompetitor.findOne({
            where: { campana_id: campaign.id, red_social: 'twitter' }
        });

        if (!competitor) {
            competitor = await SocialCompetitor.create({
                campana_id: campaign.id,
                nombre: 'Oposición Radical Santander',
                partido: 'Pacto Histórico / Oposición Regional',
                red_social: 'twitter',
                handle: '@oposicion_santander_26',
                url_perfil: 'https://x.com/oposicion_stder',
                alcance_estimado: 45000,
                nivel_amenaza: 'alto',
                narrativa_principal: 'Ataques a la gestión legislativa sobre orden público y reformas sociales',
                activo: true
            });
            console.log('  ✓ Creado perfil opositor en Radar: @oposicion_santander_26');
        }

        // Generar análisis con el motor de IA de Estrategia
        console.log('  🤖 Generando 4 Guiones Tácticos de IA (Candidato, Prensa, Tropa Digital, Debate)...');
        const aiStrategy = await politicalStrategyAiService.analyzeAttackAndGenerateScripts({
            candidatoNombre: campaign.candidato,
            cargo: campaign.tipo_cargo,
            partido: campaign.partido_politico || 'Centro Democrático',
            targetEntidad: 'senador',
            autorAtaque: competitor.handle,
            redSocial: 'twitter',
            contenidoAtaque: 'El senador Oscar Villamizar sigue votando en contra de las reformas del pueblo y defendiendo a los mismos de siempre en el Congreso. ¿Por qué le da la espalda a los campesinos y a los trabajadores de Santander?',
            metricas: { retweets: 480, likes: 1350, comentarios: 320 }
        });

        const attack = await SocialCompetitorAttack.create({
            competitor_id: competitor.id,
            campana_id: campaign.id,
            target_entidad: 'senador',
            red_social: 'twitter',
            url_publicacion: 'https://x.com/oposicion_stder/status/178945612389',
            autor_handle: competitor.handle,
            contenido_ataque: 'El senador Oscar Villamizar sigue votando en contra de las reformas del pueblo y defendiendo a los mismos de siempre en el Congreso. ¿Por qué le da la espalda a los campesinos y a los trabajadores de Santander?',
            impacto_viral: 'alto',
            falso_o_desinformacion: true,
            sospecha_red_bots: true,
            estado: 'en_analisis',
            severidad: 82,
            recomendacion_estrategica: aiStrategy.estrategia_sugerida,
            guion_candidato: aiStrategy.guion_candidato,
            guion_voceros_prensa: aiStrategy.guion_voceros_prensa,
            guion_tropa_digital: aiStrategy.guion_tropa_digital,
            guion_debate_en_vivo: aiStrategy.guion_debate_en_vivo,
            fecha_ataque: new Date().toISOString()
        });

        console.log(`  ✅ Ataque registrado en War Room [ID ${attack.id}] con respuesta IA multicanal.`);

        console.log('\n================================================================');
        console.log('🎉 PRUEBA DE REDES SOCIALES COMPLETADA CON ÉXITO');
        console.log('================================================================');
        console.log('1. Campaña #2 "OSCAR VILLAMIZAR" cuenta con sus 3 redes oficiales vinculadas.');
        console.log('2. Publicaciones creadas para Facebook, Instagram y X (Twitter).');
        console.log('3. Comentarios cruzados con el equipo de avanzada e indicadores de sentimiento.');
        console.log('4. Radar de Oposición activo con contrincante y guiones estratégicos listos.');

        process.exit(0);

    } catch (error) {
        console.error('💥 Error durante la prueba de redes:', error);
        process.exit(1);
    }
}

testSocialOscarVillamizar();
