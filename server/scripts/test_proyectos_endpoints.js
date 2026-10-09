const projectBankService = require('../services/projectBankService');
const ProyectoInversion = require('../models/ProyectoInversion');

async function testProyectosLogic() {
    try {
        console.log('--- Probando Lógica del Banco de Proyectos & Auditoría Anti-Devolución ---');
        
        // 1. Probar auditoría de viabilidad en el proyecto 1
        console.log('1. Ejecutando auditoría anti-devolución sobre Proyecto ID 1...');
        const audit = await projectBankService.auditarViabilidadAntiDevolucion(1);
        console.log(`   ✓ Score de Viabilidad: ${audit.score}% | Nivel de Riesgo: ${audit.riesgo}`);
        console.log(`   ✓ Causales de Devolución Detectadas: ${audit.causalesDevolucion.length}`);
        
        // 2. Probar formulación MGA con IA
        console.log('2. Ejecutando formulación metodológica MGA...');
        const mga = await projectBankService.formularProyectoMGA_IA(1);
        console.log(`   ✓ Problema Central MGA: ${mga.mga.arbol_problemas.problema_central}`);
        console.log(`   ✓ Objetivo General MGA: ${mga.mga.arbol_objetivos.objetivo_general}`);
        console.log(`   ✓ Código Producto DNP: ${mga.mga.cadena_valor_mga.codigo_producto_dnp}`);

        // 3. Probar generador de cartas oficiales
        console.log('3. Generando cartas oficiales de radicación...');
        const p1 = await ProyectoInversion.findByPk(1);
        const cartas = projectBankService.generarCartasRadicacion(p1, { nombre_alcalde: 'JAIME ANDRÉS BELTRÁN' });
        console.log(`   ✓ Carta de Radicación generada (${cartas.cartaPresentacion.length} caracteres).`);
        console.log(`   ✓ Certificado PDM generado (${cartas.certificadoPlanDesarrollo.length} caracteres).`);

        console.log('--- Todas las pruebas del módulo de proyectos pasaron exitosamente ---');
        process.exit(0);
    } catch (e) {
        console.error('Error en pruebas de proyectos:', e);
        process.exit(1);
    }
}

testProyectosLogic();
