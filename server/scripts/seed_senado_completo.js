require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const sequelize = require('../database/db');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Voter = require('../models/Voter');
const Reunion = require('../models/Reunion');
const ReunionAsistente = require('../models/ReunionAsistente');
const TestigoElectoral = require('../models/TestigoElectoral');
const DiaDMesaReporte = require('../models/DiaDMesaReporte');
const LogisticaVehiculo = require('../models/LogisticaVehiculo');
const LogisticaDespacho = require('../models/LogisticaDespacho');
const CallCenterLog = require('../models/CallCenterLog');
const NecesidadCiudadana = require('../models/NecesidadCiudadana');
const CompromisoGestion = require('../models/CompromisoGestion');
const SocialCompetitor = require('../models/SocialCompetitor');
const SocialCompetitorAttack = require('../models/SocialCompetitorAttack');
const SocialMediaPost = require('../models/SocialMediaPost');

async function seedSenadoCompleto() {
    console.log('========================================================================');
    console.log('🏛️  INICIANDO CARGA Y SIMULACIÓN COMPLETA PARA SENADO DE LA REPÚBLICA');
    console.log('========================================================================');

    try {
        await sequelize.authenticate();

        // 1. OBTENER O AJUSTAR CAMPAÑA 7 (SENADO OSCAR VILLAMIZAR) Y CAMPAÑA 1
        let campanaSenado = await Campaign.findByPk(7);
        if (!campanaSenado) {
            campanaSenado = await Campaign.findOne({ where: { tipo_cargo: 'senado' } });
        }
        if (!campanaSenado) {
            console.error('No se encontró campaña de senado.');
            process.exit(1);
        }

        campanaSenado.nombre = 'Senado 2026 - Oscar Villamizar';
        campanaSenado.tipo_cargo = 'senado';
        campanaSenado.nivel_territorial = 'nacional';
        campanaSenado.departamento = 'Santander';
        campanaSenado.municipio = 'Bucaramanga';
        campanaSenado.candidato = 'Oscar Villamizar';
        campanaSenado.partido_politico = 'Centro Democrático';
        campanaSenado.numero_tarjeton = 'CD 7';
        campanaSenado.meta_votos = 135000;
        campanaSenado.color = '#003366';
        campanaSenado.eslogan = 'Firmeza, Seguridad y Libertad por Santander y Colombia';
        campanaSenado.descripcion = 'Campaña Oficial de Oscar Villamizar al Senado de la República 2026 (Circunscripción Nacional).';
        campanaSenado.fecha_inicio = '2025-11-01';
        campanaSenado.fecha_elecciones = '2026-03-08';
        campanaSenado.modo_operacion = 'electoral';
        campanaSenado.activa = true;
        await campanaSenado.save();

        const campId = campanaSenado.id;
        console.log(`✅ Campaña de Senado configurada: ID ${campId} - "${campanaSenado.nombre}"`);

        const adminUser = await User.findOne({ where: { role: 'admin' } }) || await User.findOne();
        const adminId = adminUser ? adminUser.id : 1;

        // 2. PADRÓN NACIONAL DE VOTANTES Y LÍDERES REGIONALES
        console.log('\n👥 Generando Padrón Electoral para Senado (Santander, Bogotá, Norte de Santander, Antioquia, Boyacá)...');
        
        // Limpiar votantes previos de esta campaña para tener dataset consistente
        await Voter.destroy({ where: { campana_id: campId } });

        const territorios = [
            {
                departamento: 'Santander',
                municipios: [
                    { nombre: 'Bucaramanga', puestos: ['UIS - Campus Central', 'Coliseo Bicentenario', 'Colegio Santander', 'I.E. Dámaso Zapata', 'Colegio La Salle'] },
                    { nombre: 'Floridablanca', puestos: ['Colegio José Elías Puyana', 'Coliseo La Cumbre', 'Colegio Pan de Azúcar'] },
                    { nombre: 'Piedecuesta', puestos: ['Colegio Balbino García', 'Polideportivo Villabel'] },
                    { nombre: 'Girón', puestos: ['Colegio San Juan de Girón', 'Coliseo Santa Cruz'] },
                    { nombre: 'Barrancabermeja', puestos: ['Colegio Diego Hernández de Gallegos', 'Club Infantas', 'Colegio Camilo Torres'] },
                    { nombre: 'San Gil', puestos: ['Colegio San José Guanentá', 'Coliseo Lorenzo Alcantuz'] },
                    { nombre: 'Socorro', puestos: ['Colegio Universitario', 'Parque de la Chiquinquirá'] },
                    { nombre: 'Vélez', puestos: ['Colegio Nacional Universitario'] }
                ],
                peso: 220
            },
            {
                departamento: 'Bogotá D.C.',
                municipios: [
                    { nombre: 'Bogotá D.C.', puestos: ['Corferias (Pabellón 4)', 'Unicentro (Entrada 5)', 'Plaza de las Américas', 'Coliseo El Campín', 'Colegio Cafam La Floresta'] }
                ],
                peso: 110
            },
            {
                departamento: 'Norte de Santander',
                municipios: [
                    { nombre: 'Cúcuta', puestos: ['Estadio General Santander', 'Colegio Calasanz', 'Colegio Municipal'] },
                    { nombre: 'Ocaña', puestos: ['Colegio José Eusebio Caro'] },
                    { nombre: 'Pamplona', puestos: ['Colegio Provincial San José'] },
                    { nombre: 'Villa del Rosario', puestos: ['Colegio General Santander'] }
                ],
                peso: 60
            },
            {
                departamento: 'Antioquia',
                municipios: [
                    { nombre: 'Medellín', puestos: ['Plaza Mayor', 'Colegio San Ignacio', 'I.E. San Javier'] },
                    { nombre: 'Envigado', puestos: ['Colegio Manuel Uribe Ángel'] },
                    { nombre: 'Rionegro', puestos: ['Colegio San José de las Cuchillas'] }
                ],
                peso: 35
            },
            {
                departamento: 'Boyacá',
                municipios: [
                    { nombre: 'Tunja', puestos: ['Colegio de Boyacá', 'Coliseo San Antonio'] },
                    { nombre: 'Duitama', puestos: ['Colegio Guillermo León Valencia'] }
                ],
                peso: 25
            }
        ];

        const nombresMasculinos = ['Carlos', 'Juan', 'Andrés', 'Javier', 'Hernán', 'Mauricio', 'Diego', 'Fernando', 'Álvaro', 'Germán', 'Gustavo', 'Ricardo', 'Fabio', 'Santiago', 'Gabriel', 'Camilo', 'Óscar', 'Héctor', 'Jorge', 'Luis'];
        const nombresFemeninos = ['María', 'Claudia', 'Sandra', 'Esperanza', 'Patricia', 'Adriana', 'Liliana', 'Gloria', 'Marcela', 'Diana', 'Paola', 'Carolina', 'Juliana', 'Margarita', 'Luz Marina', 'Consuelo', 'Yolanda', 'Mónica', 'Tatiana', 'Beatriz'];
        const apellidosList = ['Villamizar', 'Hernández', 'Rodríguez', 'Gómez', 'Moreno', 'Pico', 'Serrano', 'Flórez', 'Jaimes', 'Rueda', 'Ardila', 'Mantilla', 'Cáceres', 'Pinzón', 'Ordóñez', 'Albarracín', 'Bohórquez', 'Carreño', 'Suárez', 'Castellanos'];

        let votersToInsert = [];
        let leaderRecords = [];
        let cedulaBase = 1098650000;

        // A) Crear Líderes Territoriales Estratégicos (15 Líderes)
        const lideresData = [
            { nombre: 'Dr. Jaime Mantilla Serrano', dept: 'Santander', mun: 'Bucaramanga', puesto: 'UIS - Campus Central', cargo: 'Coordinador Departamental Santander' },
            { nombre: 'Dra. Claudia Patricia Rueda', dept: 'Santander', mun: 'Floridablanca', puesto: 'Colegio José Elías Puyana', cargo: 'Coordinadora Mujeres Floridablanca' },
            { nombre: 'Ing. Fernando Flórez Gómez', dept: 'Santander', mun: 'Barrancabermeja', puesto: 'Club Infantas', cargo: 'Líder Sector Petrolero y Comunal' },
            { nombre: 'Dra. Liliana Cáceres Pinzón', dept: 'Santander', mun: 'Piedecuesta', puesto: 'Colegio Balbino García', cargo: 'Coordinadora Juventud y Emprendimiento' },
            { nombre: 'Dr. Hernán Ordóñez Jaimes', dept: 'Santander', mun: 'San Gil', puesto: 'Colegio San José Guanentá', cargo: 'Líder Gremio Hotelero y Turístico Guanentá' },
            { nombre: 'Dr. Álvaro Enrique Carvajal', dept: 'Bogotá D.C.', mun: 'Bogotá D.C.', puesto: 'Corferias (Pabellón 4)', cargo: 'Coordinador Bogotá Norte y Chapinero' },
            { nombre: 'Dra. Sandra Milena Castellanos', dept: 'Bogotá D.C.', mun: 'Bogotá D.C.', puesto: 'Unicentro (Entrada 5)', cargo: 'Líder Profesionales y Empresarios Bogotá' },
            { nombre: 'Dr. Mauricio Albarracín Peña', dept: 'Bogotá D.C.', mun: 'Bogotá D.C.', puesto: 'Plaza de las Américas', cargo: 'Coordinador Kennedy y Bosa' },
            { nombre: 'Dr. Germán Pico Carreño', dept: 'Norte de Santander', mun: 'Cúcuta', puesto: 'Estadio General Santander', cargo: 'Coordinador Cúcuta y Frontera' },
            { nombre: 'Dra. Esperanza Bohórquez', dept: 'Norte de Santander', mun: 'Ocaña', puesto: 'Colegio José Eusebio Caro', cargo: 'Coordinadora Provincia de Ocaña' },
            { nombre: 'Dr. Diego Alejandro Suárez', dept: 'Antioquia', mun: 'Medellín', puesto: 'Plaza Mayor', cargo: 'Coordinador Antioquia / Red Santanderes' },
            { nombre: 'Dra. Carolina Mantilla', dept: 'Boyacá', mun: 'Tunja', puesto: 'Colegio de Boyacá', cargo: 'Coordinadora Boyacá y Ventaquemada' }
        ];

        for (let i = 0; i < lideresData.length; i++) {
            const ld = lideresData[i];
            const partes = ld.nombre.split(' ');
            cedulaBase++;
            const leaderVoter = await Voter.create({
                nombres: partes[1] || 'Líder',
                apellidos: (partes[2] || '') + ' ' + (partes[3] || ''),
                cedula: cedulaBase.toString(),
                direccion: `Carrera ${15 + i} # ${30 + i * 2} - ${10 + i}`,
                lugar_votacion: ld.puesto,
                departamento: ld.dept,
                municipio: ld.mun,
                mesa: (1 + (i % 8)).toString(),
                isLeader: true,
                fidelidad_score: 5,
                intencion_voto: 'seguro',
                campana_id: campId,
                usuario_registro_id: adminId,
                observaciones_seguimiento: `${ld.cargo}. Alta capacidad de movilización electoral.`
            });
            leaderRecords.push(leaderVoter);
        }
        console.log(`   ✓ ${leaderRecords.length} Líderes Territoriales creados.`);

        // B) Crear Votantes Asignados por Territorio
        for (const ter of territorios) {
            for (let count = 0; count < ter.peso; count++) {
                cedulaBase++;
                const munObj = ter.municipios[count % ter.municipios.length];
                const puesto = munObj.puestos[count % munObj.puestos.length];
                const esFemenino = count % 2 === 0;
                const nombre = esFemenino 
                    ? nombresFemeninos[count % nombresFemeninos.length] 
                    : nombresMasculinos[count % nombresMasculinos.length];
                const apellido = apellidosList[count % apellidosList.length] + ' ' + apellidosList[(count + 3) % apellidosList.length];

                // Buscar líder afín
                const liderAfin = leaderRecords.find(l => l.departamento === ter.departamento) || leaderRecords[0];

                const fidelidad = 3 + (count % 3); // 3, 4 o 5
                const intencion = fidelidad >= 4 ? 'seguro' : 'probable';
                const mesaNum = (1 + (count % 20)).toString();

                votersToInsert.push({
                    nombres: nombre,
                    apellidos: apellido,
                    cedula: cedulaBase.toString(),
                    direccion: `Calle ${10 + (count % 80)} # ${5 + (count % 40)} - ${12 + (count % 30)}`,
                    lugar_votacion: puesto,
                    departamento: ter.departamento,
                    municipio: munObj.nombre,
                    mesa: mesaNum,
                    isLeader: false,
                    lider_nombre: liderAfin ? `${liderAfin.nombres} ${liderAfin.apellidos}`.trim() : 'Coordinación Central',
                    lider_cedula: liderAfin ? liderAfin.cedula : null,
                    fidelidad_score: fidelidad,
                    intencion_voto: intencion,
                    ha_votado: count < (ter.peso * 0.42), // 42% de simulación de votación en Día D
                    hora_voto: count < (ter.peso * 0.42) ? new Date(Date.now() - 3600000 * (count % 6)) : null,
                    campana_id: campId,
                    usuario_registro_id: adminId,
                    estado_trashumancia: count % 15 === 0 ? 'alerta_municipio' : 'valido',
                    detalle_trashumancia: count % 15 === 0 ? 'Inscripción reciente en municipio no habitual. Votante verificado con certificado de residencia.' : 'Censo validado con Registraduría Nacional.'
                });
            }
        }

        await Voter.bulkCreate(votersToInsert);
        const totalVotantesCampana = await Voter.count({ where: { campana_id: campId } });
        console.log(`   ✓ ${votersToInsert.length} Votantes sembrados. Total Padrón Senado: ${totalVotantesCampana}`);

        // 3. REUNIONES Y PLAZAS PÚBLICAS DE CAMPAÑA AL SENADO
        console.log('\n🎤 Creando Foros y Plazas Públicas de Campaña al Senado...');
        await Reunion.destroy({ where: { campana_id: campId } });

        const reunionesData = [
            {
                campana_id: campId,
                titulo: 'Gran Foro de Seguridad, Democracia y Reactivación Económica',
                descripcion: 'Presentación del programa legislativo para el Senado ante gremios económicos, agricultores y líderes de las 7 provincias de Santander.',
                fecha: '2026-02-15',
                hora_inicio: '18:00',
                hora_fin: '21:30',
                lugar_nombre: 'Centro de Ferias y Convenciones CENFER',
                direccion: 'Km 6 Vía Girón',
                departamento: 'Santander',
                municipio: 'Bucaramanga',
                barrio_vereda: 'Zona Industrial Girón-Bucaramanga',
                aforo_estimado: 1800,
                presidida_por: 'candidato',
                estado: 'realizada',
                creado_por: adminId
            },
            {
                campana_id: campId,
                titulo: 'Encuentro con Empresarios, Universitarios y Profesionales Jóvenes',
                descripcion: 'Socialización del Proyecto de Ley de Cero Impuestos para Startups y Emprendimientos Juveniles en los primeros 3 años.',
                fecha: '2026-02-22',
                hora_inicio: '17:30',
                hora_fin: '20:00',
                lugar_nombre: 'Centro de Convenciones Ágora Bogotá',
                direccion: 'Calle 24 # 38-47',
                departamento: 'Bogotá D.C.',
                municipio: 'Bogotá D.C.',
                barrio_vereda: 'Quinta Paredes / Teusaquillo',
                aforo_estimado: 850,
                presidida_por: 'candidato',
                estado: 'realizada',
                creado_por: adminId
            },
            {
                campana_id: campId,
                titulo: 'Cumbre Campesina y Cafetera del Sur de Santander',
                descripcion: 'Diálogo con asociaciones de cacaoteros, paneleros y cafeteros sobre subsidios directos a fertilizantes y mantenimiento de vías terciarias.',
                fecha: '2026-02-28',
                hora_inicio: '10:00',
                hora_fin: '13:30',
                lugar_nombre: 'Coliseo Lorenzo Alcantuz',
                direccion: 'Carrera 12 con Calle 10',
                departamento: 'Santander',
                municipio: 'San Gil',
                barrio_vereda: 'Centro Histórico',
                aforo_estimado: 600,
                presidida_por: 'candidato',
                estado: 'realizada',
                creado_por: adminId
            },
            {
                campana_id: campId,
                titulo: 'Encuentro de la Fuerza Ciudadana y Seguridad de la Frontera',
                descripcion: 'Reunión con comerciantes, transportadores y líderes cívicos sobre reactivación comercial de la frontera y garantías de seguridad militar.',
                fecha: '2026-03-02',
                hora_inicio: '16:00',
                hora_fin: '19:00',
                lugar_nombre: 'Hotel Casino Internacional Cúcuta',
                direccion: 'Calle 11 # 2E-75',
                departamento: 'Norte de Santander',
                municipio: 'Cúcuta',
                barrio_vereda: 'Caobos',
                aforo_estimado: 500,
                presidida_por: 'candidato',
                estado: 'programada',
                creado_por: adminId
            },
            {
                campana_id: campId,
                titulo: 'Gran Cierre de Campaña al Senado: Firmeza por Colombia',
                descripcion: 'Concentración masiva de cierre de campaña con la bancada nacional, delegaciones provinciales y líderes barriales.',
                fecha: '2026-03-05',
                hora_inicio: '17:00',
                hora_fin: '21:00',
                lugar_nombre: 'Parque de las Mejoras Públicas',
                direccion: 'Carrera 32 # 36-25',
                departamento: 'Santander',
                municipio: 'Bucaramanga',
                barrio_vereda: 'Mejoras Públicas',
                aforo_estimado: 3500,
                presidida_por: 'candidato',
                estado: 'programada',
                creado_por: adminId
            }
        ];

        const createdReuniones = await Reunion.bulkCreate(reunionesData);
        console.log(`   ✓ ${createdReuniones.length} Foros y Plazas Públicas registradas.`);

        // Sembrar asistentes para la reunión principal
        const muestraVotantes = await Voter.findAll({ where: { campana_id: campId }, limit: 25 });
        const asistentesBatch = muestraVotantes.map(v => ({
            reunion_id: createdReuniones[0].id,
            cedula: v.cedula,
            nombre_completo: `${v.nombres} ${v.apellidos}`.trim(),
            telefono: '31' + v.cedula.slice(-8),
            departamento: v.departamento,
            municipio: v.municipio,
            barrio: v.direccion,
            lider_referido: v.lider_nombre,
            asistio: true,
            observaciones: 'Ingresó puntualmente al salón principal. Recibió kit informativo del Senado CD 7.'
        }));
        await ReunionAsistente.bulkCreate(asistentesBatch);
        console.log(`   ✓ ${asistentesBatch.length} Asistentes confirmados en puerta registrados.`);

        // 4. DÍA D: TESTIGOS ELECTORALES Y AUDITORÍA DE ACTAS E-14
        console.log('\n🗳️  Configurando Operación Día D y Auditoría E-14 (Senado de la República)...');
        await TestigoElectoral.destroy({ where: { campana_id: campId } });
        await DiaDMesaReporte.destroy({ where: { campana_id: campId } });

        const sampleMesasAuditoria = [
            {
                campana_id: campId,
                departamento: 'Santander',
                municipio: 'Bucaramanga',
                puesto_votacion: 'UIS - Campus Central',
                mesa: '03',
                total_sufragantes: 285,
                votos_lista_propia: 142,
                votos_candidato_principal: 118,
                votos_en_blanco: 10,
                votos_nulos: 4,
                votos_no_marcados: 2,
                acta_e14_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
                boletin_numero: 'Boletín Oficial 12 (17:35)',
                boletin_registraduria_votos: 118,
                diferencia_votos: 0,
                estado_auditoria: 'conciliado',
                reclamacion_radicada: false,
                observaciones: 'Mesa 100% conciliada. Coincidencia exacta entre Acta E-14 física de claveros y boletín de preconteo.'
            },
            {
                campana_id: campId,
                departamento: 'Santander',
                municipio: 'Bucaramanga',
                puesto_votacion: 'Coliseo Bicentenario',
                mesa: '07',
                total_sufragantes: 310,
                votos_lista_propia: 158,
                votos_candidato_principal: 125,
                votos_en_blanco: 14,
                votos_nulos: 6,
                votos_no_marcados: 3,
                acta_e14_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
                boletin_numero: 'Boletín Oficial 15 (18:15)',
                boletin_registraduria_votos: 45, // ¡Faltan 80 votos en el preconteo!
                diferencia_votos: 80,
                estado_auditoria: 'alerta_roja',
                reclamacion_radicada: true,
                reclamacion_folio: 'REC-2026-SEN-BGA-084',
                observaciones: 'DISCREPANCIA CRÍTICA DETECTADA: Acta E-14 transmitida por nuestro testigo acredita 125 votos para CD 7. El boletín de Registraduría solo computó 45 votos. Reclamación formal radicada ante la Comisión Escrutadora Municipal.'
            },
            {
                campana_id: campId,
                departamento: 'Bogotá D.C.',
                municipio: 'Bogotá D.C.',
                puesto_votacion: 'Corferias (Pabellón 4)',
                mesa: '15',
                total_sufragantes: 295,
                votos_lista_propia: 130,
                votos_candidato_principal: 96,
                votos_en_blanco: 18,
                votos_nulos: 5,
                votos_no_marcados: 1,
                acta_e14_url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
                boletin_numero: 'Boletín Oficial 18 (18:50)',
                boletin_registraduria_votos: 96,
                diferencia_votos: 0,
                estado_auditoria: 'conciliado',
                reclamacion_radicada: false,
                observaciones: 'Mesa de Corferias plenamente conciliada sin tachaduras ni enmendaduras.'
            },
            {
                campana_id: campId,
                departamento: 'Santander',
                municipio: 'Barrancabermeja',
                puesto_votacion: 'Club Infantas',
                mesa: '02',
                total_sufragantes: 260,
                votos_lista_propia: 95,
                votos_candidato_principal: 78,
                votos_en_blanco: 12,
                votos_nulos: 8,
                votos_no_marcados: 4,
                acta_e14_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
                boletin_numero: 'Boletín Oficial 14 (17:55)',
                boletin_registraduria_votos: 28, // Faltan 50 votos!
                diferencia_votos: 50,
                estado_auditoria: 'alerta_roja',
                reclamacion_radicada: true,
                reclamacion_folio: 'REC-2026-SEN-BCA-029',
                observaciones: 'Presunta omisión en digitación en el centro de cómputo municipal. Testigo radicó constancia en acta de escrutinio.'
            },
            {
                campana_id: campId,
                departamento: 'Norte de Santander',
                municipio: 'Cúcuta',
                puesto_votacion: 'Estadio General Santander',
                mesa: '08',
                total_sufragantes: 220,
                votos_lista_propia: 88,
                votos_candidato_principal: 65,
                votos_en_blanco: 9,
                votos_nulos: 3,
                votos_no_marcados: 2,
                acta_e14_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
                boletin_numero: null,
                boletin_registraduria_votos: null,
                diferencia_votos: 0,
                estado_auditoria: 'pendiente_boletin',
                reclamacion_radicada: false,
                observaciones: 'Acta E-14 transmitida por testigo a las 16:40. En espera de transmisión de boletín de Registraduría.'
            }
        ];

        for (const m of sampleMesasAuditoria) {
            await DiaDMesaReporte.create(m);
        }
        console.log(`   ✓ ${sampleMesasAuditoria.length} Mesas con Auditoría E-14 y Alertas de Reclamación sembradas.`);

        // 5. CALL CENTER DE CAMPAÑA NACIONAL
        console.log('\n📞 Configurando Operación de Call Center de Senado...');
        await CallCenterLog.destroy({ where: { campana_id: campId } });

        const llamadasMuestra = muestraVotantes.slice(0, 8);
        const callCenterLogs = [
            {
                campana_id: campId,
                voter_id: llamadasMuestra[0]?.id,
                usuario_id: adminId,
                tipo_campana: 'convocatoria_evento',
                reunion_id: createdReuniones[0].id,
                evento_nombre: createdReuniones[0].titulo,
                evento_lugar: `${createdReuniones[0].lugar_nombre} - ${createdReuniones[0].direccion}`,
                evento_fecha_hora: `${createdReuniones[0].fecha} ${createdReuniones[0].hora_inicio}`,
                asistencia_confirmada: true,
                cantidad_acompanantes: 3,
                resultado: 'asiste_confirmado',
                notas: 'Confirmó asistencia con su familia. Pregunta si habrá transporte desde Provenza.',
                duracion_segundos: 95
            },
            {
                campana_id: campId,
                voter_id: llamadasMuestra[1]?.id,
                usuario_id: adminId,
                tipo_campana: 'verificacion_puesto',
                evento_nombre: 'Verificación de Tarjetón Senado',
                evento_lugar: 'Puesto Asignado Registraduría',
                asistencia_confirmada: true,
                cantidad_acompanantes: 0,
                resultado: 'apoya_confirmado',
                notas: 'Tiene claro cómo marcar en el tarjetón de Senado: Logo del Centro Democrático + Casilla número 7.',
                duracion_segundos: 60
            },
            {
                campana_id: campId,
                voter_id: llamadasMuestra[2]?.id,
                usuario_id: adminId,
                tipo_campana: 'persuasion',
                resultado: 'deja_peticion',
                necesidad_peticion: 'Pide que el senador gestione recursos para la vía de la vereda El Retiro.',
                notas: 'Estaba indeciso. Se le expusieron las propuestas de vías terciarias y mostró simpatía.',
                duracion_segundos: 140
            },
            {
                campana_id: campId,
                voter_id: llamadasMuestra[3]?.id,
                usuario_id: adminId,
                tipo_campana: 'dia_d_movilizacion',
                resultado: 'asiste_confirmado',
                asistencia_confirmada: true,
                cantidad_acompanantes: 2,
                notas: 'Saldrá a votar a las 9:00 AM en el Colegio Balbino García de Piedecuesta.',
                duracion_segundos: 45
            },
            {
                campana_id: campId,
                voter_id: llamadasMuestra[4]?.id,
                usuario_id: adminId,
                tipo_campana: 'convocatoria_evento',
                reunion_id: createdReuniones[1].id,
                evento_nombre: createdReuniones[1].titulo,
                resultado: 'apoya_no_asiste',
                notas: 'Vive en Bogotá pero estará de viaje laboral ese día. Sin embargo, ratificó su voto y el de 5 compañeros de oficina.',
                duracion_segundos: 80
            }
        ];

        for (const cl of callCenterLogs) {
            await CallCenterLog.create(cl);
        }
        console.log(`   ✓ ${callCenterLogs.length} Registros de Call Center sembrados.`);

        // 6. LOGÍSTICA Y FLOTA MÓVIL
        console.log('\n🚐 Configurando Flota de Movilización y Despachos...');
        await LogisticaDespacho.destroy({ where: { campana_id: campId } });
        await LogisticaVehiculo.destroy({ where: { campana_id: campId } });

        const flotaData = [
            {
                campana_id: campId,
                conductor_nombre: 'Hernando Ruiz Gómez',
                conductor_telefono: '3158901234',
                placa: 'WZM-482',
                tipo_vehiculo: 'van',
                capacidad_pasajeros: 14,
                zona_asignada: 'Circuito Bucaramanga Norte y UIS',
                estado: 'disponible',
                viajes_realizados: 8,
                pasajeros_movilizados: 95,
                observaciones: 'Vehículo principal de movilización de testigos electorales acreditados.'
            },
            {
                campana_id: campId,
                conductor_nombre: 'Jairo Antonio Prada',
                conductor_telefono: '3127894561',
                placa: 'TKR-915',
                tipo_vehiculo: 'automovil',
                capacidad_pasajeros: 4,
                zona_asignada: 'Floridablanca - Cañaveral y Casco Antiguo',
                estado: 'en_ruta',
                viajes_realizados: 6,
                pasajeros_movilizados: 22,
                observaciones: 'Ruta activa de traslado de coordinadores zonales.'
            },
            {
                campana_id: campId,
                conductor_nombre: 'Édgar Mauricio Vargas',
                conductor_telefono: '3204561238',
                placa: 'STR-204',
                tipo_vehiculo: 'van',
                capacidad_pasajeros: 12,
                zona_asignada: 'Piedecuesta y Girón',
                estado: 'disponible',
                viajes_realizados: 11,
                pasajeros_movilizados: 118,
                observaciones: 'Excelente disponibilidad. Apoyo logístico para el foro de CENFER.'
            },
            {
                campana_id: campId,
                conductor_nombre: 'Luis Fernando Meza',
                conductor_telefono: '3189012345',
                placa: 'BVC-891',
                tipo_vehiculo: 'automovil',
                capacidad_pasajeros: 4,
                zona_asignada: 'Barrancabermeja - Corredor Comuna 1 a 4',
                estado: 'disponible',
                viajes_realizados: 4,
                pasajeros_movilizados: 16,
                observaciones: 'Vehículo asignado a la avanzada del Magdalena Medio.'
            }
        ];

        const createdVehiculos = await LogisticaVehiculo.bulkCreate(flotaData);
        console.log(`   ✓ ${createdVehiculos.length} Vehículos de Flota registrados.`);

        // Despachos
        await LogisticaDespacho.create({
            campana_id: campId,
            vehiculo_id: createdVehiculos[0].id,
            solicitante_nombre: 'Dra. Claudia Rueda (Coordinadora)',
            solicitante_telefono: '3124567890',
            origen_direccion: 'Sede Central de Campaña - Carrera 27 # 45-10',
            destino_puesto: 'UIS - Campus Central',
            cantidad_pasajeros: 10,
            estado: 'en_camino',
            notas: 'Traslado de 10 testigos electorales capacitados con credenciales y formularios E-14 listos.'
        });

        await LogisticaDespacho.create({
            campana_id: campId,
            vehiculo_id: createdVehiculos[1].id,
            solicitante_nombre: 'Hernán Silva (Líder Comunal)',
            solicitante_telefono: '3157896541',
            origen_direccion: 'Barrio La Cumbre Calle 30',
            destino_puesto: 'Colegio José Elías Puyana',
            cantidad_pasajeros: 4,
            estado: 'completado',
            notas: 'Traslado de adultos mayores para votación matutina.'
        });
        console.log('   ✓ Despachos de movilización registrados.');

        // 7. NECESIDADES CIUDADANAS (AGENDA LEGISLATIVA AL SENADO)
        console.log('\n📋 Registrando Demandas y Necesidades Ciudadanas para el Senado...');
        await NecesidadCiudadana.destroy({ where: { campana_id: campId } });

        const necesidadesData = [
            {
                campana_id: campId,
                titulo: 'Urgente culminación y mantenimiento de la Doble Calzada Bucaramanga - Bogotá',
                descripcion: 'Los constantes derrumbes y la falta de inversión nacional en el corredor vial Bogotá-Chiquinquirá-Barbosa-Bucaramanga incrementan en un 35% los fletes de carga de Santander.',
                categoria: 'vias_infraestructura',
                nivel_territorial: 'nacional',
                departamento: 'Santander',
                municipio: 'Bucaramanga',
                comuna_corregimiento: 'Corredor Nacional Sur',
                barrio_vereda: 'Vía Nacional',
                prioridad: 'critica_urgente',
                estado: 'en_plan_desarrollo',
                impacto_familias_estimado: 250000,
                costo_estimado: 450000000000,
                competencia: 'nacion_congreso',
                solucion_propuesta: 'Debate de control político a la ANI y MinTransporte para destinar vigencias futuras a la doble calzada y túneles del tramo Zipaquirá-Barbosa.',
                reportado_por_nombre: 'Gremio de Transportadores de Carga de Santander',
                reportado_por_telefono: '3159871234',
                origen_reporte: 'lider'
            },
            {
                campana_id: campId,
                titulo: 'Protección al sector agropecuario y subsidios a insumos para paneleros y cafeteros',
                descripcion: 'El incremento en el costo de fertilizantes y el contrabando de panela afectan la subsistencia de más de 40,000 familias campesinas en las provincias de Guanentá, Comunera y Vélez.',
                categoria: 'empleo_desarrollo',
                nivel_territorial: 'nacional',
                departamento: 'Santander',
                municipio: 'San Gil',
                comuna_corregimiento: 'Provincia Guanentá',
                barrio_vereda: 'Sector Rural',
                prioridad: 'alta',
                estado: 'en_gestion',
                impacto_familias_estimado: 42000,
                costo_estimado: 85000000000,
                competencia: 'nacion_congreso',
                solucion_propuesta: 'Radicación de Proyecto de Ley en el Senado de alivio al costo de fertilizantes con arancel cero y salvaguardia arancelaria contra contrabando.',
                reportado_por_nombre: 'Asociación de Productores Agropecuarios de Guanentá',
                reportado_por_telefono: '3123456789',
                origen_reporte: 'brigada_territorial'
            },
            {
                campana_id: campId,
                titulo: 'Crisis de infraestructura y desabastecimiento de medicamentos en Hospital Universitario de Santander (HUS)',
                descripcion: 'El HUS atiende a pacientes de Santander, Arauca, Norte de Santander y sur del Cesar, pero presenta déficit acumulado de más de 180 mil millones por deudas de EPS liquidadas.',
                categoria: 'salud',
                nivel_territorial: 'departamental',
                departamento: 'Santander',
                municipio: 'Bucaramanga',
                comuna_corregimiento: 'Comuna 3',
                barrio_vereda: 'San Francisco',
                prioridad: 'critica_urgente',
                estado: 'reportada',
                impacto_familias_estimado: 180000,
                costo_estimado: 120000000000,
                competencia: 'nacion_congreso',
                solucion_propuesta: 'Giro directo del 100% de la ADRES al Hospital Universitario y condonación de pasivos pensionales en el Presupuesto General de la Nación.',
                reportado_por_nombre: 'Sindicato de Profesionales de la Salud HUS',
                reportado_por_telefono: '3109876543',
                origen_reporte: 'ciudadano_web'
            },
            {
                campana_id: campId,
                titulo: 'Reforma al Sistema Penal y castigo severo a bandas dedicadas a la extorsión y microtráfico',
                descripcion: 'Comerciantes y tenderos de Barrancabermeja, Bucaramanga y Bogotá denuncian extorsiones telefónicas coordinadas desde cárceles nacionales sin que el INPEC bloquee la señal celular.',
                categoria: 'seguridad',
                nivel_territorial: 'nacional',
                departamento: 'Santander',
                municipio: 'Barrancabermeja',
                comuna_corregimiento: 'Comuna 1 y 2',
                barrio_vereda: 'Zona Comercial',
                prioridad: 'critica_urgente',
                estado: 'en_analisis',
                impacto_familias_estimado: 65000,
                costo_estimado: 15000000000,
                competencia: 'nacion_congreso',
                solucion_propuesta: 'Iniciativa legislativa para exigir a operadores celulares la inhibición total de señal en el perímetro penitenciario y endurecimiento de penas para el delito de extorsión agravada.',
                reportado_por_nombre: 'Comerciantes Unidos del Magdalena Medio',
                reportado_por_telefono: '3187654321',
                origen_reporte: 'lider'
            }
        ];

        await NecesidadCiudadana.bulkCreate(necesidadesData);
        console.log(`   ✓ ${necesidadesData.length} Necesidades Ciudadanas territoriales registradas.`);

        // 8. COMPROMISOS DE GESTIÓN LEGISLATIVA
        console.log('\n📜 Registrando Compromisos Legislativos y Proyectos de Ley...');
        await CompromisoGestion.destroy({ where: { campana_id: campId } });

        const compromisosData = [
            {
                campana_id: campId,
                titulo: 'Proyecto de Ley de Alivio Tributario e Impulso al Primer Empleo Joven',
                descripcion: 'Iniciativa legal para exonerar del impuesto de renta y parafiscales durante 3 años a empresas que contraten jóvenes egresados de universidades y el SENA.',
                tipo: 'proyecto_normativo',
                departamento: 'Santander',
                municipio: 'Bucaramanga',
                barrio_comuna: 'Cobertura Nacional',
                estado: 'en_ejecucion',
                inversion_presupuesto: 0,
                fecha_inicio: '2026-07-20',
                fecha_cumplimiento: '2026-12-16',
                beneficiarios_estimados: 150000
            },
            {
                campana_id: campId,
                titulo: 'Debate de Control Político sobre Seguridad en Corredores Viales Nacionales',
                descripcion: 'Citación en Comisión Primera y Segunda del Senado al Ministro de Defensa y Director de la Policía Nacional para exigir presencia permanente en la Ruta del Sol y eje cafetero.',
                tipo: 'debate_control',
                departamento: 'Santander',
                municipio: 'Bucaramanga',
                barrio_comuna: 'Nivel Nacional',
                estado: 'en_ejecucion',
                inversion_presupuesto: 0,
                fecha_inicio: '2026-08-05',
                fecha_cumplimiento: '2026-09-10',
                beneficiarios_estimados: 500000
            },
            {
                campana_id: campId,
                titulo: 'Gestión Presupuestal para Vías Terciarias en Provincias de Vélez y Guanentá',
                descripcion: 'Asignación de recursos en la Ley de Presupuesto General de la Nación para placas huellas y maquinaria amarilla en los municipios más apartados de Santander.',
                tipo: 'obra_infraestructura',
                departamento: 'Santander',
                municipio: 'San Gil',
                barrio_comuna: 'Zona Rural Provincias',
                estado: 'en_ejecucion',
                inversion_presupuesto: 45000000000,
                fecha_inicio: '2026-09-01',
                fecha_cumplimiento: '2027-06-30',
                beneficiarios_estimados: 75000
            }
        ];

        await CompromisoGestion.bulkCreate(compromisosData);
        console.log(`   ✓ ${compromisosData.length} Compromisos de Gestión Legislativa registrados.`);

        // 9. ATAQUES DE ADVERSARIOS Y GUIONES ESTRATÉGICOS DE SALA DE GUERRA
        console.log('\n🛡️  Configurando Sala de Guerra Digital y Bitácora de Ataques...');
        let comp1 = await SocialCompetitor.findOne({ where: { campana_id: campId } });
        if (!comp1) {
            comp1 = await SocialCompetitor.create({
                campana_id: campId,
                nombre_candidato: 'Candidatura Oposición Radical al Senado',
                partido: 'Pacto Opositor',
                plataforma_principal: 'twitter',
                usuario_handle: '@oposicion_senado26',
                seguidores: 68000,
                nivel_amenaza: 'alto'
            });
        }

        await SocialCompetitorAttack.destroy({ where: { campana_id: campId } });

        const ataquesData = [
            {
                campana_id: campId,
                competitor_id: comp1.id,
                adversario_nombre: comp1.nombre_candidato,
                plataforma: 'twitter',
                url_publicacion: 'https://x.com/oposicion_senado26/status/189201928192',
                fecha_ataque: new Date(),
                blanco_ataque: 'candidato',
                descripcion_blanco: 'Cuestionamiento a posturas de seguridad y votación legislativa previa',
                contenido_ataque: 'El candidato Oscar Villamizar habla de defender las regiones pero en el Congreso vota en bloque con los partidos tradicionales. No tiene independencia para defender a Santander.',
                tema_ataque: 'Independencia Política / Trayectoria',
                nivel_amenaza: 'alto',
                alcance_estimado: 85000,
                likes: 850,
                reposts: 210,
                comentarios: 140,
                es_fake_news: false,
                posible_red_bots: false,
                tactica_recomendada: 'contraatacar',
                analisis_estrategico: 'Ataque enfocado en disputar el voto de opinión indeciso. La respuesta debe resaltar con cifras exactas la labor legislativa: autoría de leyes aprobadas, debates de control político y presencia permanente en territorio.',
                guion_candidato: '"Nuestra independencia no se demuestra con discursos incendiarios en redes sociales, sino con resultados que beneficien a los colombianos. He defendido el presupuesto de las regiones, la seguridad de las familias y el libre emprendimiento sin arrodillarme jamás."',
                guion_voceros: '"Quienes atacan desde la comodidad de una bodega digital no le han conseguido un solo peso de inversión a las regiones. La gestión del Senador Oscar Villamizar está respaldada por leyes sancionadas y veedurías ciudadanas transparentes."',
                guion_tropa_digital: 'Comentario 1: "Los resultados no se borran con tweets: autor de la ley de fomento al empleo y defensor del agro santandereano. ¡Firme con el CD 7! 🇨🇴"\nComentario 2: "Hablan de independencia los que llevan 4 años aplaudiendo el despilfarro. Menos show y más propuestas."',
                guion_debates: '"Candidato, mientras usted se dedica a difamar en redes para conseguir un titular de prensa, nosotros estamos en las plazas públicas con la gente real proponiendo soluciones para frenar la extorsión y reactivar la economía."',
                estado: 'estrategia_desplegada',
                notas_director: 'Publicar infografía comparativa con las leyes de autoría propia y testimonios de gremios productivos.'
            },
            {
                campana_id: campId,
                competitor_id: comp1.id,
                adversario_nombre: 'Bodega de Oposición TikTok',
                plataforma: 'tiktok',
                url_publicacion: 'https://tiktok.com/@politica_viral_col/video/7892182910',
                fecha_ataque: new Date(Date.now() - 3600000 * 20),
                blanco_ataque: 'partido',
                descripcion_blanco: 'Video manipulado de TikTok sobre supuestas maquinarias electorales',
                contenido_ataque: '¡Miren cómo compran votos en Santander para el Senado! Compartan antes de que lo borren.',
                tema_ataque: 'Desprestigio Electoral / Fake News',
                nivel_amenaza: 'muy_alto',
                alcance_estimado: 210000,
                likes: 5400,
                reposts: 1800,
                comentarios: 890,
                es_fake_news: true,
                posible_red_bots: true,
                tactica_recomendada: 'desmentir_legal',
                analisis_estrategico: 'Video tipo fake news reciclado con imágenes de elecciones del 2018 en otra región del país. Táctica de guerra sucia preelectoral. Debe denunciarse ante el CNE y publicar desmentido con peritaje audiovisual.',
                guion_candidato: '"La desesperación de nuestros adversarios llegó al extremo de difundir montajes burdos con imágenes de hace 8 años. Radicamos denuncia penal ante la Fiscalía y queja ante el CNE por calumnia electoral. No nos van a intimidar."',
                guion_voceros: '"El video difundido corresponde a un caso ocurrido en el Caribe en el año 2018 que no tiene absolutamente nada que ver con nuestra campaña ni con Santander. Es una falsedad deliberada que viola el estatuto de la oposición."',
                guion_tropa_digital: 'Comentario: "Falso montaje desmentido por verificadores de noticias. Ese video es de 2018 en la costa. No caigan en juego sucio de bodegas 🚩"',
                guion_debates: '"El juego limpio en democracia se respeta. Traer montajes prefabricados a esta contienda solo demuestra que no tienen argumentos ni votos legítimos."',
                estado: 'estrategia_desplegada',
                notas_director: 'Remitir enlace al equipo jurídico para radicar solicitud formal de baja del contenido a TikTok Latinoamérica.'
            }
        ];

        for (const at of ataquesData) {
            await SocialCompetitorAttack.create(at);
        }
        console.log(`   ✓ ${ataquesData.length} Ataques estratégicos con guiones y contranarrativas registrados.`);

        console.log('\n========================================================================');
        console.log('🎉 SIMULACIÓN Y POBLACIÓN DE DATOS PARA SENADO COMPLETADA CON ÉXITO');
        console.log(`🏛️  Campaña ID: ${campId}`);
        console.log(`👥 Votantes en padrón: ${await Voter.count({ where: { campana_id: campId } })}`);
        console.log(`🎤 Foros y Plazas Públicas: ${await Reunion.count({ where: { campana_id: campId } })}`);
        console.log(`🗳️  Mesas Día D auditadas: ${await DiaDMesaReporte.count({ where: { campana_id: campId } })}`);
        console.log(`📞 Llamadas Call Center: ${await CallCenterLog.count({ where: { campana_id: campId } })}`);
        console.log(`🚐 Flota Logística: ${await LogisticaVehiculo.count({ where: { campana_id: campId } })}`);
        console.log(`📋 Necesidades Ciudadanas: ${await NecesidadCiudadana.count({ where: { campana_id: campId } })}`);
        console.log(`📜 Compromisos Legislativos: ${await CompromisoGestion.count({ where: { campana_id: campId } })}`);
        console.log(`📱 Publicaciones en Redes: ${await SocialMediaPost.count({ where: { campana_id: campId } })}`);
        console.log(`🛡️  Ataques y Guiones de Guerra: ${await SocialCompetitorAttack.count({ where: { campana_id: campId } })}`);
        console.log('========================================================================');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error en seedSenadoCompleto:', err);
        process.exit(1);
    }
}

seedSenadoCompleto();
