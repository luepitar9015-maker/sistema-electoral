const CensoElectoral = require('../models/CensoElectoral');
const Campaign = require('../models/Campaign');
const { Op } = require('sequelize');

// Normalizador de texto para comparar municipios/departamentos sin líos de tildes o mayúsculas
const norm = (str) =>
    String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();

/**
 * Evalúa el riesgo de trashumancia o inconsistencia territorial de un votante
 * frente al Censo Oficial de la Registraduría y la Campaña activa.
 */
async function evaluarTrashumancia({
    cedula,
    direccion = '',
    departamentoReportado = '',
    municipioReportado = '',
    campanaId = null,
    voterModel = null
}) {
    const cleanCedula = String(cedula || '').replace(/\D/g, '').trim();
    if (!cleanCedula) {
        return {
            estado_trashumancia: 'no_en_censo',
            detalle_trashumancia: 'Cédula no proporcionada para validación de censo',
            es_computable: false,
            nivel_riesgo: 'alto',
            municipio_censo_real: null,
            departamento_censo_real: null,
            puesto_censo_real: null,
            mesa_censo_real: null
        };
    }

    // 0. Comprobar si la cédula figura como fallecida / cancelada por defunción
    const CensoDefuncion = require('../models/CensoDefuncion');
    const defuncionRecord = await CensoDefuncion.findOne({ where: { cedula: cleanCedula } });

    // 1. Buscar en el Censo Electoral oficial registrado
    const censoRecord = await CensoElectoral.findOne({
        where: { cedula: cleanCedula }
    });

    if (defuncionRecord || (censoRecord && ['fallecido', 'cancelada', 'baja'].includes(String(censoRecord.estado_cedula || '').toLowerCase()))) {
        return {
            estado_trashumancia: 'fallecido',
            detalle_trashumancia: `💀 CÉDULA DE DIFUNTO: Registrada como baja por defunción (${defuncionRecord?.fuente_registro || 'RNEC / Censo Inactivo'}). No computable legalmente.`,
            es_computable: false,
            es_fallecido: true,
            es_voto_real: false,
            nivel_riesgo: 'critico',
            municipio_censo_real: censoRecord?.municipio || defuncionRecord?.municipio_defuncion || null,
            departamento_censo_real: censoRecord?.departamento || defuncionRecord?.departamento_defuncion || null,
            puesto_censo_real: null,
            mesa_censo_real: null
        };
    }

    // 2. Obtener datos de la campaña si está asociada
    let campana = null;
    if (campanaId) {
        campana = await Campaign.findByPk(campanaId);
    }

    // Si NO figura en el censo electoral local
    if (!censoRecord) {
        return {
            estado_trashumancia: 'no_en_censo',
            detalle_trashumancia: 'La cédula no figura en la base de datos de censo electoral cargada. Debe verificarse en el portal de la Registraduría.',
            es_computable: false,
            nivel_riesgo: 'medio',
            municipio_censo_real: null,
            departamento_censo_real: null,
            puesto_censo_real: null,
            mesa_censo_real: null
        };
    }

    const censoMuni = censoRecord.municipio || '';
    const censoDept = censoRecord.departamento || '';
    const censoPuesto = censoRecord.puesto_votacion || '';
    const censoMesa = censoRecord.mesa || '';

    // 3. Revisar concentración sospechosa de direcciones si se pasó el voterModel
    let sospechaConcentracion = false;
    let cantidadMismaDireccion = 0;
    if (voterModel && direccion && direccion.trim().length > 6) {
        const cleanDir = direccion.trim().toLowerCase();
        try {
            cantidadMismaDireccion = await voterModel.count({
                where: {
                    direccion: { [Op.like]: `%${cleanDir}%` },
                    cedula: { [Op.ne]: cleanCedula }
                }
            });
            if (cantidadMismaDireccion >= 7) {
                sospechaConcentracion = true;
            }
        } catch (e) {
            // Ignorar error de conteo
        }
    }

    // 4. Si no hay campaña activa asociada, evaluar coherencia con lo reportado
    if (!campana) {
        const mismoMpio = norm(censoMuni) === norm(municipioReportado);
        const mismoDept = norm(censoDept) === norm(departamentoReportado);

        if (!mismoMpio && municipioReportado) {
            return {
                estado_trashumancia: 'alerta_municipio',
                detalle_trashumancia: `Inconsistencia: Vota en ${censoMuni} (${censoDept}) pero se reportó domicilio en ${municipioReportado}.`,
                es_computable: false,
                nivel_riesgo: 'medio',
                municipio_censo_real: censoMuni,
                departamento_censo_real: censoDept,
                puesto_censo_real: censoPuesto,
                mesa_censo_real: censoMesa
            };
        }

        return {
            estado_trashumancia: sospechaConcentracion ? 'sospecha_concentracion' : 'valido',
            detalle_trashumancia: sospechaConcentracion
                ? `Alerta: Existen ${cantidadMismaDireccion + 1} personas registradas con la misma dirección.`
                : `Censo verificado en ${censoMuni} (${censoDept}) - Puesto: ${censoPuesto}, Mesa: ${censoMesa}.`,
            es_computable: true,
            nivel_riesgo: sospechaConcentracion ? 'medio' : 'bajo',
            municipio_censo_real: censoMuni,
            departamento_censo_real: censoDept,
            puesto_censo_real: censoPuesto,
            mesa_censo_real: censoMesa
        };
    }

    // 5. Validación con la Campaña Activa según su nivel territorial
    const nivel = campana.nivel_territorial; // 'municipal', 'departamental', 'nacional'
    const campMuni = campana.municipio || '';
    const campDept = campana.departamento || '';

    // A) Nivel MUNICIPAL (Alcaldía, Concejo, JAL)
    if (nivel === 'municipal' || ['alcaldia', 'concejo'].includes(campana.tipo_cargo)) {
        if (norm(censoMuni) === norm(campMuni)) {
            return {
                estado_trashumancia: sospechaConcentracion ? 'sospecha_concentracion' : 'valido',
                detalle_trashumancia: sospechaConcentracion
                    ? `Voto municipal válido pero con alerta: ${cantidadMismaDireccion + 1} votantes con la misma dirección.`
                    : `🟢 Voto Efectivo: Cédula habilitada para votar en ${censoMuni} por la campaña ${campana.nombre}.`,
                es_computable: true,
                nivel_riesgo: sospechaConcentracion ? 'medio' : 'bajo',
                municipio_censo_real: censoMuni,
                departamento_censo_real: censoDept,
                puesto_censo_real: censoPuesto,
                mesa_censo_real: censoMesa
            };
        }

        // Si vota en el mismo departamento pero en otro municipio
        if (norm(censoDept) === norm(campDept)) {
            return {
                estado_trashumancia: 'alerta_municipio',
                detalle_trashumancia: `⚠️ Voto No Computable / Riesgo de Trashumancia: La cédula vota en ${censoMuni}, NO en ${campMuni}. No podrá votar para ${campana.tipo_cargo.toUpperCase()}.`,
                es_computable: false,
                nivel_riesgo: 'alto',
                municipio_censo_real: censoMuni,
                departamento_censo_real: censoDept,
                puesto_censo_real: censoPuesto,
                mesa_censo_real: censoMesa
            };
        }

        // Si vota en otro departamento
        return {
            estado_trashumancia: 'alerta_departamento',
            detalle_trashumancia: `🔴 Trashumancia Crítica: La cédula está zonificada en ${censoMuni} (${censoDept}). Está fuera del territorio electoral de ${campMuni} (${campDept}).`,
            es_computable: false,
            nivel_riesgo: 'critico',
            municipio_censo_real: censoMuni,
            departamento_censo_real: censoDept,
            puesto_censo_real: censoPuesto,
            mesa_censo_real: censoMesa
        };
    }

    // B) Nivel DEPARTAMENTAL (Gobernación, Asamblea)
    if (nivel === 'departamental' || ['gobernacion', 'asamblea'].includes(campana.tipo_cargo)) {
        if (norm(censoDept) === norm(campDept)) {
            return {
                estado_trashumancia: 'valido',
                detalle_trashumancia: `🟢 Voto Departamental Válido: Vota en ${censoMuni} (${censoDept}) dentro de la circunscripción departamental.`,
                es_computable: true,
                nivel_riesgo: 'bajo',
                municipio_censo_real: censoMuni,
                departamento_censo_real: censoDept,
                puesto_censo_real: censoPuesto,
                mesa_censo_real: censoMesa
            };
        }

        return {
            estado_trashumancia: 'alerta_departamento',
            detalle_trashumancia: `🔴 Voto Fuera de Circunscripción: La cédula vota en ${censoDept}, fuera de ${campDept}.`,
            es_computable: false,
            nivel_riesgo: 'critico',
            municipio_censo_real: censoMuni,
            departamento_censo_real: censoDept,
            puesto_censo_real: censoPuesto,
            mesa_censo_real: censoMesa
        };
    }

    // C) Nivel NACIONAL (Senado, Presidencia)
    return {
        estado_trashumancia: 'valido',
        detalle_trashumancia: `🟢 Circunscripción Nacional: Vota en ${censoMuni} (${censoDept}). Puesto: ${censoPuesto}, Mesa: ${censoMesa}.`,
        es_computable: true,
        nivel_riesgo: 'bajo',
        municipio_censo_real: censoMuni,
        departamento_censo_real: censoDept,
        puesto_censo_real: censoPuesto,
        mesa_censo_real: censoMesa
    };
}

module.exports = {
    evaluarTrashumancia,
    norm
};
