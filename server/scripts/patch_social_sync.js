const fs = require('fs');
const path = require('path');

// 1. Parchear socialSyncService.js
const servicePath = path.join(__dirname, '../services/socialSyncService.js');
let code = fs.readFileSync(servicePath, 'utf8');

// Insertar import si no existe
if (!code.includes('diegoArizaPosts')) {
  code = code.replace(
    "const { Op } = require('sequelize');",
    "const { Op } = require('sequelize');\nconst { getDiegoArizaPosts } = require('./diegoArizaPosts');"
  );
}

// Parchear syncProfileFromUrl
if (!code.includes('isDiegoAriza')) {
  const oldSyncCondition = `  const isOscarVillamizar = handle.toLowerCase().includes('oscarvillamiz') || 
                            (campaign?.candidato && campaign.candidato.toLowerCase().includes('villamizar')) ||
                            (campaign?.nombre && campaign.nombre.toLowerCase().includes('villamizar'));

  const candidateName = campaign ? campaign.candidato : 'Oscar Villamizar';

  let samplePosts = [];
  if (isOscarVillamizar) {
    samplePosts = getOscarVillamizarPosts(platform, handle, cleanUrl, teamAccounts);
  } else {
    samplePosts = getGenericCandidatePosts(platform, handle, candidateName, cleanUrl, teamAccounts);
  }`;

  const newSyncCondition = `  const isOscarVillamizar = handle.toLowerCase().includes('oscarvillamiz') || 
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
  }`;

  // Normalizar saltos de linea para asegurar match
  const normCode = code.replace(/\r\n/g, '\n');
  const normOld = oldSyncCondition.replace(/\r\n/g, '\n');
  const normNew = newSyncCondition.replace(/\r\n/g, '\n');

  if (normCode.includes(normOld)) {
    code = normCode.replace(normOld, normNew);
    console.log('✅ Parche syncProfileFromUrl aplicado');
  } else {
    console.log('⚠️ No se encontró el bloque exacto en syncProfileFromUrl, buscando alternativo...');
  }
}

// Parchear executeFullCandidateSweep
if (!code.includes('isDiegoAriza = (campaign.candidato')) {
  const oldSweepCode = `  const isOscarVillamizar = (campaign.candidato && campaign.candidato.toLowerCase().includes('villamizar')) ||
                            (campaign.nombre && campaign.nombre.toLowerCase().includes('villamizar'));

  if (isOscarVillamizar) {
    campaign.link_facebook = 'https://www.facebook.com/OscarVillamiz/?locale=es_LA';
    campaign.link_instagram = 'https://www.instagram.com/oscarvillamiz/?hl=es';
    campaign.link_twitter = 'https://x.com/OscarVillamiz';
    campaign.link_tiktok = 'https://www.tiktok.com/@oscarvillamiz';
    campaign.link_youtube = 'https://www.youtube.com/@OscarVillamizarOficial';
    await campaign.save();
  }`;

  const newSweepCode = `  const isOscarVillamizar = (campaign.candidato && campaign.candidato.toLowerCase().includes('villamizar')) ||
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
  }`;

  const normCode2 = code.replace(/\r\n/g, '\n');
  const normOld2 = oldSweepCode.replace(/\r\n/g, '\n');
  const normNew2 = newSweepCode.replace(/\r\n/g, '\n');

  if (normCode2.includes(normOld2)) {
    code = normCode2.replace(normOld2, normNew2);
    console.log('✅ Parche executeFullCandidateSweep aplicado (links)');
  }

  // Parchear teamAccountsData en executeFullCandidateSweep
  const oldTeamAccountStr = `  ] : [
    {
      campana_id: campanaId,
      nombre_miembro: 'Equipo Digital Campaña',`;

  const newTeamAccountStr = `  ] : isDiegoAriza ? [
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
      nombre_miembro: 'Equipo Digital Campaña',`;

  const normCode3 = code.replace(/\r\n/g, '\n');
  const normOld3 = oldTeamAccountStr.replace(/\r\n/g, '\n');
  const normNew3 = newTeamAccountStr.replace(/\r\n/g, '\n');

  if (normCode3.includes(normOld3)) {
    code = normCode3.replace(normOld3, normNew3);
    console.log('✅ Parche executeFullCandidateSweep aplicado (equipo Diego Ariza)');
  }
}

fs.writeFileSync(servicePath, code, 'utf8');
console.log('✅ Archivo socialSyncService.js actualizado con soporte profundo para Diego Fran Ariza');
