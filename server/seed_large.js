const sequelize = require('./database/db');
const Voter = require('./models/Voter');
const User = require('./models/User');

// Copia de colombiaData para uso en servidor
const colombiaData = {
    "Amazonas": ["Leticia", "Puerto Nariño"],
    "Antioquia": ["Medellín", "Abejorral", "Abriaquí", "Alejandría", "Amagá", "Amalfi", "Andes", "Angelópolis", "Angostura", "Anorí", "Santa Fe de Antioquia", "Anzá", "Apartadó", "Arboletes", "Argelia", "Armenia", "Barbosa", "Belmira", "Bello", "Betania", "Betulia", "Ciudad Bolívar", "Briceño", "Buriticá", "Cáceres", "Caicedo", "Caldas", "Campamento", "Cañasgordas", "Caracolí", "Caramanta", "Carepa", "El Carmen de Viboral", "Carolina del Príncipe", "Caucasia", "Chigorodó", "Cisneros", "Cocorná", "Concepción", "Concordia", "Copacabana", "Dabeiba", "Donmatías", "Ebéjico", "El Bagre", "Entrerríos", "Envigado", "Fredonia", "Frontino", "Giraldo", "Girardota", "Gómez Plata", "Granada", "Guadalupe", "Guarne", "Guatapé", "Heliconia", "Hispania", "Itagüí", "Ituango", "Jardín", "Jericó", "La Ceja", "La Estrella", "La Pintada", "La Unión", "Liborina", "Maceo", "Marinilla", "Montebello", "Murindó", "Mutatá", "Nariño", "Necoclí", "Nechí", "Olaya", "Peñol", "Peque", "Pueblorrico", "Puerto Berrío", "Puerto Nare", "Puerto Triunfo", "Remedios", "Retiro", "Rionegro", "Sabanalarga", "Sabaneta", "Salgar", "San Andrés de Cuerquia", "San Carlos", "San Francisco", "San Jerónimo", "San José de la Montaña", "San Juan de Urabá", "San Luis", "San Pedro de los Milagros", "San Pedro de Urabá", "San Rafael", "San Roque", "San Vicente", "Santa Bárbara", "Santa Rosa de Osos", "Santo Domingo", "El Santuario", "Segovia", "Sonsón", "Sopetrán", "Támesis", "Tarazá", "Tarso", "Titiribí", "Toledo", "Turbo", "Uramita", "Urrao", "Valdivia", "Valparaíso", "Vegachí", "Venecia", "Vigía del Fuerte", "Yalí", "Yarumal", "Yolombó", "Yondó", "Zaragoza"],
    "Arauca": ["Arauca", "Arauquita", "Cravo Norte", "Fortul", "Puerto Rondón", "Saravena", "Tame"],
    "Atlántico": ["Barranquilla", "Baranoa", "Campo de la Cruz", "Candelaria", "Galapa", "Juan de Acosta", "Luruaco", "Malambo", "Manatí", "Palmar de Varela", "Piojó", "Polonuevo", "Ponedera", "Puerto Colombia", "Repelón", "Sabanagrande", "Sabanalarga", "Santa Lucía", "Santo Tomás", "Soledad", "Suan", "Tubará", "Usiacurí"],
    "Bolívar": ["Cartagena de Indias", "Achí", "Altos del Rosario", "Arenal", "Arjona", "Arroyohondo", "Barranco de Loba", "Calamar", "Cantagallo", "Cicuco", "Córdoba", "Clemencia", "El Carmen de Bolívar", "El Guamo", "El Peñón", "Hatillo de Loba", "Magangué", "Mahates", "Margarita", "María la Baja", "Montecristo", "Mompós", "Morales", "Norosí", "Pinillos", "Regidor", "Río Viejo", "San Cristóbal", "San Estanislao", "San Fernando", "San Jacinto", "San Jacinto del Cauca", "San Juan Nepomuceno", "San Martín de Loba", "San Pablo", "Santa Catalina", "Santa Rosa", "Santa Rosa del Sur", "Simití", "Soplaviento", "Talaigua Nuevo", "Tiquisio", "Turbaco", "Turbaná", "Villanueva", "Zambrano"],
    "Boyacá": ["Tunja", "Chiquinquirá", "Duitama", "Paipa", "Sogamoso", "Villa de Leyva"], // Acortado para brevedad del script, pero funcional
    "Caldas": ["Manizales", "La Dorada", "Riosucio", "Villamaría"],
    "Caquetá": ["Florencia", "San Vicente del Caguán"],
    "Casanare": ["Yopal", "Aguazul", "Paz de Ariporo"],
    "Cauca": ["Popayán", "Santander de Quilichao", "Puerto Tejada"],
    "Cesar": ["Valledupar", "Aguachica"],
    "Chocó": ["Quibdó", "Istmina"],
    "Córdoba": ["Montería", "Lorica", "Sahagún"],
    "Cundinamarca": ["Bogotá D.C.", "Soacha", "Zipaquirá", "Fusagasugá", "Facatativá", "Chía", "Mosquera", "Madrid", "Funza", "Cajicá"],
    "Huila": ["Neiva", "Pitalito"],
    "La Guajira": ["Riohacha", "Maicao"],
    "Magdalena": ["Santa Marta", "Ciénaga"],
    "Meta": ["Villavicencio", "Acacías"],
    "Nariño": ["Pasto", "Ipiales", "San Andrés de Tumaco"],
    "Norte de Santander": ["Cúcuta", "Ocaña", "Pamplona", "Villa del Rosario"],
    "Quindío": ["Armenia", "Calarcá"],
    "Risaralda": ["Pereira", "Dosquebradas"],
    "Santander": ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja", "San Gil"],
    "Sucre": ["Sincelejo", "Corozal"],
    "Tolima": ["Ibagué", "Espinal", "Melgar"],
    "Valle del Cauca": ["Cali", "Buenaventura", "Palmira", "Tuluá", "Buga", "Cartago", "Jamundí", "Yumbo"],
};

const names = ["Juan", "María", "Carlos", "Ana", "Luis", "Carmen", "José", "Laura", "Pedro", "Marta", "Jorge", "Lucía", "Diego", "Elena", "Fernando", "Sofía", "Andrés", "Paula", "Ricardo", "Isabel"]; // 20
const lastNames = ["García", "Rodríguez", "Martínez", "Hernández", "López", "González", "Pérez", "Sánchez", "Ramírez", "Torres", "Flores", "Rivera", "Gómez", "Díaz", "Reyes", "Morales", "Ortiz", "Castillo", "Moreno", "Jiménez"]; // 20

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedVoters() {
    try {
        await sequelize.authenticate();
        console.log('Conexión establecida.');

        // Sincronizar modelos (asegura que existan tablas, alter: true actualiza columnas)
        await sequelize.sync({ alter: true });

        const adminUser = await User.findOne({ where: { email: 'admin@sistema.com' } });
        if (!adminUser) {
            console.error("ADMIN USER NO EXISTE. Ejecuta 'node seed.js' primero.");
            return;
        }

        console.log("Iniciando generación masiva de 10,000 registros...");
        const TOTAL_RECORDS = 10000;
        const BATCH_SIZE = 100;
        let generatedCount = 0;

        const depts = Object.keys(colombiaData);
        let votersBatch = [];
        let leaders = []; // Almacenará IDs de líderes creados para asignar amigos

        // 1. Crear LÍDERES (aprox 5% = 500 líderes)
        console.log("Generando Líderes...");
        for (let i = 0; i < 500; i++) {
            const dept = getRandomItem(depts);
            const mun = getRandomItem(colombiaData[dept]);

            votersBatch.push({
                nombres: getRandomItem(names) + ' ' + getRandomItem(names),
                apellidos: getRandomItem(lastNames) + ' ' + getRandomItem(lastNames),
                cedula: getRandomInt(10000000, 99999999).toString(),
                direccion: `Calle ${getRandomInt(1, 100)} # ${getRandomInt(1, 100)} - ${getRandomInt(1, 100)}`,
                departamento: dept,
                municipio: mun,
                lugar_votacion: `Puesto ${getRandomInt(1, 20)}`,
                isLeader: true,
                usuario_registro_id: adminUser.id
            });
        }

        // Insertar líderes
        const createdLeaders = await Voter.bulkCreate(votersBatch);
        leaders = createdLeaders.map(l => ({
            id: l.id,
            nombre: l.nombres + ' ' + l.apellidos,
            cedula: l.cedula,
            // Guardamos ubicación para heredar
            departamento: l.departamento,
            municipio: l.municipio,
            lugar_votacion: l.lugar_votacion
        }));
        generatedCount += votersBatch.length;
        console.log(`${generatedCount} Líderes insertados.`);
        votersBatch = [];

        // 2. Crear VOTANTES (Amigos) asignados a líderes
        // El resto hasta 10,000
        const remaining = TOTAL_RECORDS - generatedCount;

        for (let i = 0; i < remaining; i++) {
            const leader = getRandomItem(leaders);

            votersBatch.push({
                nombres: getRandomItem(names),
                apellidos: getRandomItem(lastNames) + ' ' + getRandomItem(lastNames),
                cedula: getRandomInt(10000000, 99999999).toString() + i, // Ensure unique slightly
                direccion: `Carrera ${getRandomInt(1, 100)} # ${getRandomInt(1, 100)}`,
                // Heredan ubicación del líder
                departamento: leader.departamento,
                municipio: leader.municipio,
                lugar_votacion: leader.lugar_votacion,
                // Asignación de líder
                lider_nombre: leader.nombre,
                lider_cedula: leader.cedula,
                isLeader: false,
                usuario_registro_id: adminUser.id
            });

            if (votersBatch.length >= BATCH_SIZE) {
                await Voter.bulkCreate(votersBatch);
                generatedCount += votersBatch.length;
                console.log(`Progreso: ${generatedCount} / ${TOTAL_RECORDS}`);
                votersBatch = [];
            }
        }

        // Insertar remanente
        if (votersBatch.length > 0) {
            await Voter.bulkCreate(votersBatch);
            generatedCount += votersBatch.length;
        }

        console.log(`¡EXITO! Se han insertado ${generatedCount} registros.`);
        process.exit(0);

    } catch (error) {
        console.error("Error sembrando datos:");
        console.error(error.message);
        if (error.original) {
            console.error("SQL Error:", error.original.message); // Log concise SQL error
        }
        process.exit(1);
    }
}

seedVoters();
