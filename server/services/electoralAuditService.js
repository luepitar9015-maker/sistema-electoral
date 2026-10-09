const Voter = require('../models/Voter');
const CensoElectoral = require('../models/CensoElectoral');
const CensoDefuncion = require('../models/CensoDefuncion');
const Campaign = require('../models/Campaign');
const { Op } = require('sequelize');

// Normalizador de texto
const norm = (str) =>
    String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();

/**
 * Ejecuta una auditoría integral sobre la base de datos de votantes de una campaña o general.
 * Detecta:
 * 1. Cédulas de personas fallecidas / dadas de baja por defunción.
 * 2. Cédulas duplicadas entre líderes.
 * 3. Cédulas no encontradas en el Censo Electoral Oficial.
 * 4. Trashumancia electoral (votantes fuera de la circunscripción municipal o departamental).
 * 5. Cálculo exacto del embudo de VOTOS REALES y VOTO DURO por fidelidad.
 */
async function ejecutarAuditoriaVotosReales(campanaId = null) {
    const whereClause = {};
    if (campanaId) {
        whereClause.campana_id = campanaId;
    }

    const voters = await Voter.findAll({
        where: whereClause,
        order: [['id', 'ASC']]
    });

    let campana = null;
    if (campanaId) {
        campana = await Campaign.findByPk(campanaId);
    }

    // 1. Cargar todas las cédulas de defunción registradas
    const defuncionesRecords = await CensoDefuncion.findAll({
        attributes: ['cedula', 'fecha_defuncion', 'fuente_registro', 'municipio_defuncion', 'departamento_defuncion']
    });
    const defuncionesMap = new Map();
    defuncionesRecords.forEach(d => {
        const c = String(d.cedula || '').replace(/\D/g, '').trim();
        if (c) defuncionesMap.set(c, d);
    });

    // 2. Extraer cédulas de los votantes para consultar censo en lote
    const cedulasList = voters.map(v => String(v.cedula || '').replace(/\D/g, '').trim()).filter(Boolean);
    const censoRecords = await CensoElectoral.findAll({
        where: {
            cedula: { [Op.in]: cedulasList }
        }
    });
    const censoMap = new Map();
    censoRecords.forEach(c => {
        const clean = String(c.cedula || '').replace(/\D/g, '').trim();
        if (clean) censoMap.set(clean, c);
    });

    // 3. Mapear duplicados en la base de votantes (misma cédula registrada múltiples veces)
    const cedulaCountMap = new Map();
    voters.forEach(v => {
        const clean = String(v.cedula || '').replace(/\D/g, '').trim();
        if (!clean) return;
        if (!cedulaCountMap.has(clean)) {
            cedulaCountMap.set(clean, []);
        }
        cedulaCountMap.get(clean).push(v);
    });

    // Estadísticas del informe
    const stats = {
        total_auditados: voters.length,
        votos_brutos: voters.length,
        difuntos_detectados: 0,
        duplicados_detectados: 0,
        no_en_censo: 0,
        trashumancia_municipio: 0,
        trashumancia_departamento: 0,
        sospecha_concentracion: 0,
        votos_reales_computables: 0,
        votos_invalidos_total: 0,
        porcentaje_efectividad_real: 0,
        proyeccion_ponderada_fidelidad: 0
    };

    const lideresStats = {};
    const processedCedulasForRealVote = new Set();

    for (const v of voters) {
        const cleanCedula = String(v.cedula || '').replace(/\D/g, '').trim();
        const liderKey = v.lider_nombre ? v.lider_nombre.trim() : 'Directo / Sin Líder';
        if (!lideresStats[liderKey]) {
            lideresStats[liderKey] = {
                lider_nombre: liderKey,
                lider_cedula: v.lider_cedula || '',
                total_aportados: 0,
                votos_reales: 0,
                difuntos: 0,
                trashumantes: 0,
                no_censo: 0,
                duplicados: 0
            };
        }
        lideresStats[liderKey].total_aportados++;

        let esFallecido = false;
        let fechaDefuncion = null;
        let esDuplicado = false;
        let lideresDuplicados = null;
        let esVotoReal = true;
        let motivoInvalidez = null;
        let estadoTrashumancia = 'valido';
        let detalleTrashumancia = '';

        // A) VERIFICACIÓN DE DIFUNTO / FALLECIDO
        const defuncionData = defuncionesMap.get(cleanCedula);
        const censoData = censoMap.get(cleanCedula);

        if (defuncionData || (censoData && ['fallecido', 'cancelada', 'baja'].includes(String(censoData.estado_cedula || '').toLowerCase()))) {
            esFallecido = true;
            fechaDefuncion = defuncionData?.fecha_defuncion || 'Registrado en Bajas RNEC';
            esVotoReal = false;
            estadoTrashumancia = 'fallecido';
            motivoInvalidez = `💀 CÉDULA DE DIFUNTO: Registrada como baja por defunción (${defuncionData?.fuente_registro || 'RNEC / Censo Inactivo'}). No computable legalmente.`;
            detalleTrashumancia = motivoInvalidez;
            stats.difuntos_detectados++;
            lideresStats[liderKey].difuntos++;
        }

        // B) VERIFICACIÓN DE DUPLICADOS ENTRE LÍDERES
        if (!esFallecido && cedulaCountMap.has(cleanCedula) && cedulaCountMap.get(cleanCedula).length > 1) {
            esDuplicado = true;
            const duplicateEntries = cedulaCountMap.get(cleanCedula);
            const otherLeaders = duplicateEntries
                .filter(other => other.id !== v.id)
                .map(other => other.lider_nombre || 'Sin líder')
                .join(', ');
            lideresDuplicados = `Registrado también por: ${otherLeaders}`;

            // Solo computamos el voto real a la primera ocurrencia encontrada
            if (processedCedulasForRealVote.has(cleanCedula)) {
                esVotoReal = false;
                motivoInvalidez = `👥 DUPLICADO: Cédula ya registrada en la base. ${lideresDuplicados}.`;
                stats.duplicados_detectados++;
                lideresStats[liderKey].duplicados++;
            }
        }

        // C) VERIFICACIÓN EN CENSO OFICIAL
        if (!esFallecido && esVotoReal) {
            if (censoMap.size > 0 && !censoData) {
                esVotoReal = false;
                estadoTrashumancia = 'no_en_censo';
                motivoInvalidez = '❌ NO EN CENSO: La cédula no figura en la base oficial del censo electoral. No está habilitada para votar localmente.';
                detalleTrashumancia = motivoInvalidez;
                stats.no_en_censo++;
                lideresStats[liderKey].no_censo++;
            } else if (censoData) {
                // Asignar datos del censo
                v.municipio_censo_real = censoData.municipio || '';
                v.departamento_censo_real = censoData.departamento || '';
                v.puesto_censo_real = censoData.puesto_votacion || '';
                v.mesa_censo_real = censoData.mesa || '';

                // D) VERIFICACIÓN TERRITORIAL (TRASHUMANCIA SEGÚN EL NIVEL DE LA CAMPAÑA)
                if (campana) {
                    const nivel = campana.nivel_territorial || 'municipal';
                    const campMuni = campana.municipio || '';
                    const campDept = campana.departamento || '';
                    const censoMuni = censoData.municipio || '';
                    const censoDept = censoData.departamento || '';

                    if (nivel === 'municipal' || ['alcaldia', 'concejo'].includes(campana.tipo_cargo)) {
                        if (norm(censoMuni) !== norm(campMuni)) {
                            esVotoReal = false;
                            if (norm(censoDept) === norm(campDept)) {
                                estadoTrashumancia = 'alerta_municipio';
                                motivoInvalidez = `⚠️ TRASHUMANCIA MUNICIPAL: Vota en ${censoMuni}, NO en ${campMuni}. No suma para ${campana.tipo_cargo.toUpperCase()}.`;
                                stats.trashumancia_municipio++;
                            } else {
                                estadoTrashumancia = 'alerta_departamento';
                                motivoInvalidez = `🔴 TRASHUMANCIA CRÍTICA: Vota en ${censoMuni} (${censoDept}), fuera de ${campMuni} (${campDept}).`;
                                stats.trashumancia_departamento++;
                            }
                            detalleTrashumancia = motivoInvalidez;
                            lideresStats[liderKey].trashumantes++;
                        }
                    } else if (nivel === 'departamental' || ['gobernacion', 'asamblea'].includes(campana.tipo_cargo)) {
                        if (norm(censoDept) !== norm(campDept)) {
                            esVotoReal = false;
                            estadoTrashumancia = 'alerta_departamento';
                            motivoInvalidez = `🔴 FUERA DE DEPARTAMENTO: Vota en ${censoDept}, fuera de ${campDept}.`;
                            detalleTrashumancia = motivoInvalidez;
                            stats.trashumancia_departamento++;
                            lideresStats[liderKey].trashumantes++;
                        }
                    }
                }
            }
        }

        // Si pasó todos los filtros, es VOTO REAL COMPUTABLE
        if (esVotoReal) {
            estadoTrashumancia = 'valido';
            motivoInvalidez = null;
            detalleTrashumancia = '🟢 VOTO REAL VERIFICADO: Cédula activa en censo, sin alertas de defunción ni trashumancia.';
            stats.votos_reales_computables++;
            lideresStats[liderKey].votos_reales++;
            processedCedulasForRealVote.add(cleanCedula);

            // Ponderación por scoring de fidelidad
            const score = v.fidelidad_score || 3;
            const factorProbabilidad = score === 5 ? 1.0 : (score === 4 ? 0.85 : (score === 3 ? 0.60 : (score === 2 ? 0.35 : 0.10)));
            stats.proyeccion_ponderada_fidelidad += factorProbabilidad;
        }

        // Actualizar en base de datos
        v.es_fallecido = esFallecido;
        v.fecha_defuncion = fechaDefuncion;
        v.es_duplicado = esDuplicado;
        v.lideres_duplicados = lideresDuplicados;
        v.es_voto_real = esVotoReal;
        v.motivo_invalidez = motivoInvalidez;
        v.estado_trashumancia = estadoTrashumancia;
        v.detalle_trashumancia = detalleTrashumancia;

        await v.save();
    }

    stats.votos_invalidos_total = stats.total_auditados - stats.votos_reales_computables;
    stats.porcentaje_efectividad_real = stats.total_auditados > 0
        ? Math.round((stats.votos_reales_computables / stats.total_auditados) * 100)
        : 0;
    stats.proyeccion_ponderada_fidelidad = Math.round(stats.proyeccion_ponderada_fidelidad);

    // Calcular tasa de limpieza por líder
    const rankingLideres = Object.values(lideresStats).map(l => ({
        ...l,
        tasa_limpieza: l.total_aportados > 0 ? Math.round((l.votos_reales / l.total_aportados) * 100) : 0
    })).sort((a, b) => b.votos_reales - a.votos_reales);

    return {
        stats,
        rankingLideres,
        campana: campana ? { id: campana.id, nombre: campana.nombre, municipio: campana.municipio, departamento: campana.departamento, tipo_cargo: campana.tipo_cargo } : null
    };
}

module.exports = {
    ejecutarAuditoriaVotosReales,
    norm
};
