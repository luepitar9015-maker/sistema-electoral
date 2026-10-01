const sequelize = require('./database/db');
const User = require('./models/User');
const Campaign = require('./models/Campaign');
const Reunion = require('./models/Reunion');
const ReunionAsistente = require('./models/ReunionAsistente');
const bcrypt = require('bcrypt');

async function seedReuniones() {
    try {
        await sequelize.sync();

        // 1. Obtener una campaña
        let campaign = await Campaign.findOne();
        if (!campaign) {
            campaign = await Campaign.create({
                nombre: 'Senado 2026 - Colombia Unida',
                tipo_cargo: 'senado',
                nivel_territorial: 'nacional',
                departamento: 'Antioquia',
                municipio: 'Medellín',
                candidato: 'Alejandro Gaviria',
                partido_politico: 'Coalición Esperanza',
                numero_tarjeton: '10',
                meta_votos: 120000,
                color: '#00B894'
            });
        }

        const campId = campaign.id;

        // 2. Crear usuario Orador si no existe
        let oradorUser = await User.findOne({ where: { email: 'orador@campana.com' } });
        if (!oradorUser) {
            const passwordHash = await bcrypt.hash('orador123', 10);
            oradorUser = await User.create({
                nombre: 'Dr. Carlos Mario Restrepo',
                email: 'orador@campana.com',
                telefono: '3114567890',
                password: passwordHash,
                role: 'orador',
                campana_id: campId,
                activo: true
            });
            console.log('Usuario Orador creado: orador@campana.com / orador123');
        }

        // 3. Crear usuario Líder de Avanzada si no existe
        let avanzadaUser = await User.findOne({ where: { email: 'avanzada@campana.com' } });
        if (!avanzadaUser) {
            const passwordHash = await bcrypt.hash('avanzada123', 10);
            avanzadaUser = await User.create({
                nombre: 'Mariana Gómez - Coordinadora Avanzada',
                email: 'avanzada@campana.com',
                telefono: '3109876543',
                password: passwordHash,
                role: 'lider_avanzada',
                campana_id: campId,
                activo: true
            });
            console.log('Usuario Líder de Avanzada creado: avanzada@campana.com / avanzada123');
        }

        // 4. Crear reuniones de ejemplo si no hay reuniones
        const countReuniones = await Reunion.count();
        if (countReuniones === 0) {
            const today = new Date();
            const formatDate = (offsetDays) => {
                const d = new Date(today);
                d.setDate(d.getDate() + offsetDays);
                return d.toISOString().split('T')[0];
            };

            // Reunión 1: Presidida por Candidato (Programada)
            const r1 = await Reunion.create({
                campana_id: campId,
                titulo: 'Gran Encuentro Comunitario Comuna 4 Aranjuez',
                descripcion: 'Socialización de propuestas de educación y empleo joven con líderes barriales.',
                fecha: formatDate(0), // Hoy
                hora_inicio: '18:30',
                hora_fin: '20:30',
                presidida_por: 'candidato',
                orador_id: null,
                orador_nombre: null,
                lider_avanzada_id: avanzadaUser.id,
                lider_avanzada_nombre: avanzadaUser.nombre,
                grupo_avanzada: 'Avanzada Norte - Juventudes',
                aforo_estimado: 120,
                asistentes_reales: 0,
                departamento: 'Antioquia',
                municipio: 'Medellín',
                direccion: 'Calle 92 # 49 - 30',
                barrio_vereda: 'Aranjuez',
                lugar_nombre: 'Salón Social Parque de Aranjuez',
                estado: 'programada',
                observaciones: 'Logística de sonido y carpas confirmada por equipo de avanzada.',
                evidencias: '[]'
            });

            // Reunión 2: Presidida por Orador Delegado (En Curso)
            const r2 = await Reunion.create({
                campana_id: campId,
                titulo: 'Reunión con Comerciantes y Emprendedores de Envigado',
                descripcion: 'Mesa de diálogo sobre incentivos a pequeñas empresas y exenciones tributarias.',
                fecha: formatDate(0), // Hoy
                hora_inicio: '16:00',
                hora_fin: '18:00',
                hora_inicio_real: '16:15',
                presidida_por: 'orador',
                orador_id: oradorUser.id,
                orador_nombre: oradorUser.nombre,
                lider_avanzada_id: avanzadaUser.id,
                lider_avanzada_nombre: avanzadaUser.nombre,
                grupo_avanzada: 'Equipo Logística Sur',
                aforo_estimado: 75,
                asistentes_reales: 68,
                departamento: 'Antioquia',
                municipio: 'Envigado',
                direccion: 'Carrera 42 # 35 Sur - 15',
                barrio_vereda: 'El Dorado',
                lugar_nombre: 'Centro Cultural y Empresarial Débora Arango',
                estado: 'en_curso',
                observaciones: 'El orador inició la sesión puntualmente a las 16:15. Asistencia masiva de comerciantes.',
                evidencias: JSON.stringify([
                    {
                        id: '1',
                        url: 'https://images.unsplash.com/photo-1544531585-9847b68c8c86?w=800',
                        nombre: 'Inicio de la intervención del orador',
                        fecha: new Date().toISOString(),
                        subido_por: oradorUser.nombre
                    },
                    {
                        id: '2',
                        url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
                        nombre: 'Público asistente en salón',
                        fecha: new Date().toISOString(),
                        subido_por: avanzadaUser.nombre
                    }
                ])
            });

            // Asistentes para la reunión 2
            await ReunionAsistente.bulkCreate([
                {
                    reunion_id: r2.id,
                    cedula: '1020304050',
                    nombre_completo: 'Guillermo León Vélez',
                    telefono: '3001234567',
                    departamento: 'Antioquia',
                    municipio: 'Envigado',
                    barrio: 'El Dorado',
                    lider_referido: 'Mariana Gómez',
                    grupo_avanzada: 'Equipo Logística Sur',
                    asistio: true,
                    observaciones: 'Comerciante local, apoya con 10 votos.'
                },
                {
                    reunion_id: r2.id,
                    cedula: '1035678901',
                    nombre_completo: 'Claudia Patricia Henao',
                    telefono: '3157894561',
                    departamento: 'Antioquia',
                    municipio: 'Envigado',
                    barrio: 'La Magnolia',
                    lider_referido: 'Mariana Gómez',
                    grupo_avanzada: 'Equipo Logística Sur',
                    asistio: true,
                    observaciones: 'Líder comunitaria y empresaria textil.'
                },
                {
                    reunion_id: r2.id,
                    cedula: '71234567',
                    nombre_completo: 'Javier Alonso Correa',
                    telefono: '3206549870',
                    departamento: 'Antioquia',
                    municipio: 'Envigado',
                    barrio: 'San Marcos',
                    lider_referido: 'Carlos Mario Orador',
                    grupo_avanzada: 'Equipo Logística Sur',
                    asistio: true,
                    observaciones: 'Compromiso de multiplicación de votos.'
                }
            ]);

            // Reunión 3: Presidida por Orador Delegado en Rionegro (Finalizada)
            const r3 = await Reunion.create({
                campana_id: campId,
                titulo: 'Asamblea de Productores Agrícolas del Oriente',
                descripcion: 'Presentación de propuesta agraria, créditos campesinos y vías terciarias.',
                fecha: formatDate(-2), // Hace 2 días
                hora_inicio: '10:00',
                hora_fin: '12:30',
                hora_inicio_real: '10:10',
                hora_fin_real: '12:45',
                presidida_por: 'orador',
                orador_id: oradorUser.id,
                orador_nombre: oradorUser.nombre,
                lider_avanzada_id: avanzadaUser.id,
                lider_avanzada_nombre: avanzadaUser.nombre,
                grupo_avanzada: 'Avanzada Oriente',
                aforo_estimado: 90,
                asistentes_reales: 95,
                departamento: 'Antioquia',
                municipio: 'Rionegro',
                direccion: 'Vereda Las Cuchillas, km 4',
                barrio_vereda: 'Las Cuchillas',
                lugar_nombre: 'Sede Comunal Las Cuchillas',
                estado: 'finalizada',
                observaciones: 'Reunión exitosa con firma de acta de compromiso campesino con la campaña.',
                evidencias: JSON.stringify([
                    {
                        id: '3',
                        url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800',
                        nombre: 'Cierre de la asamblea con productores',
                        fecha: new Date().toISOString(),
                        subido_por: oradorUser.nombre
                    }
                ])
            });

            // Reunión 4: Presidida por Candidato en Bello (Programada a futuro)
            await Reunion.create({
                campana_id: campId,
                titulo: 'Encuentro Ciudadano por la Movilidad en Bello',
                descripcion: 'Debate de propuestas sobre transporte masivo y tarifas justas con veedurías.',
                fecha: formatDate(3), // En 3 días
                hora_inicio: '17:00',
                hora_fin: '19:00',
                presidida_por: 'candidato',
                orador_id: null,
                orador_nombre: null,
                lider_avanzada_id: avanzadaUser.id,
                lider_avanzada_nombre: avanzadaUser.nombre,
                grupo_avanzada: 'Avanzada Norte - Bello',
                aforo_estimado: 150,
                asistentes_reales: 0,
                departamento: 'Antioquia',
                municipio: 'Bello',
                direccion: 'Diagonal 55 # 37 - 20',
                barrio_vereda: 'Niquía',
                lugar_nombre: 'Polideportivo Tulio Ospina',
                estado: 'programada',
                observaciones: 'Convocatoria abierta por perifoneo y redes sociales.',
                evidencias: '[]'
            });

            console.log('Reuniones y asistentes de ejemplo sembrados con éxito.');
        }

        console.log('Proceso de seed de reuniones finalizado.');
    } catch (err) {
        console.error('Error en seedReuniones:', err);
    } finally {
        await sequelize.close();
    }
}

seedReuniones();
