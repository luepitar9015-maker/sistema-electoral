const LogisticaVehiculo = require('../models/LogisticaVehiculo');
const LogisticaDespacho = require('../models/LogisticaDespacho');
const Voter = require('../models/Voter');

exports.getVehiculos = async (req, res) => {
    try {
        const campana_id = req.campaignId || req.campana_id || req.query.campana_id;
        const where = campana_id ? { campana_id } : {};
        const vehiculos = await LogisticaVehiculo.findAll({
            where,
            order: [['estado', 'ASC'], ['conductor_nombre', 'ASC']]
        });
        return res.json(vehiculos);
    } catch (e) {
        return res.status(500).json({ message: 'Error al listar vehículos' });
    }
};

exports.createVehiculo = async (req, res) => {
    try {
        const campana_id = req.campaignId || req.campana_id || req.body.campana_id;
        const { conductor_nombre, conductor_telefono, placa, tipo_vehiculo, capacidad_pasajeros, zona_asignada, observaciones } = req.body;

        if (!conductor_nombre || !conductor_telefono || !placa) {
            return res.status(400).json({ message: 'Conductor, teléfono y placa son obligatorios' });
        }

        const vehiculo = await LogisticaVehiculo.create({
            campana_id,
            conductor_nombre,
            conductor_telefono,
            placa: placa.toUpperCase().trim(),
            tipo_vehiculo: tipo_vehiculo || 'automovil',
            capacidad_pasajeros: parseInt(capacidad_pasajeros, 10) || 4,
            zona_asignada,
            observaciones
        });

        return res.status(201).json({ message: 'Vehículo registrado', vehiculo });
    } catch (e) {
        return res.status(500).json({ message: 'Error al registrar vehículo' });
    }
};

exports.updateVehiculoEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        const vehiculo = await LogisticaVehiculo.findByPk(id);
        if (!vehiculo) return res.status(404).json({ message: 'Vehículo no encontrado' });

        vehiculo.estado = estado;
        await vehiculo.save();
        return res.json({ message: 'Estado actualizado', vehiculo });
    } catch (e) {
        return res.status(500).json({ message: 'Error al actualizar vehículo' });
    }
};

exports.deleteVehiculo = async (req, res) => {
    try {
        const { id } = req.params;
        await LogisticaVehiculo.destroy({ where: { id } });
        return res.json({ message: 'Vehículo eliminado' });
    } catch (e) {
        return res.status(500).json({ message: 'Error al eliminar vehículo' });
    }
};

exports.getDespachos = async (req, res) => {
    try {
        const campana_id = req.campaignId || req.campana_id || req.query.campana_id;
        const { estado } = req.query;
        const where = campana_id ? { campana_id } : {};
        if (estado && estado !== 'todos') where.estado = estado;

        const despachos = await LogisticaDespacho.findAll({
            where,
            include: [
                { model: LogisticaVehiculo, as: 'vehiculo' },
                { model: Voter, attributes: ['id', 'nombres', 'apellidos', 'cedula', 'lugar_votacion', 'mesa'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        return res.json(despachos);
    } catch (e) {
        return res.status(500).json({ message: 'Error al listar despachos' });
    }
};

exports.createDespacho = async (req, res) => {
    try {
        const campana_id = req.campaignId || req.body.campana_id;
        const { solicitante_nombre, solicitante_telefono, origen_direccion, destino_puesto, cantidad_pasajeros, voter_id, vehiculo_id, notas } = req.body;

        if (!solicitante_nombre || !origen_direccion || !destino_puesto) {
            return res.status(400).json({ message: 'Nombre, dirección de origen y puesto de destino son obligatorios' });
        }

        const estadoInicial = vehiculo_id ? 'asignado' : 'solicitado';

        const despacho = await LogisticaDespacho.create({
            campana_id,
            voter_id: voter_id ? parseInt(voter_id, 10) : null,
            vehiculo_id: vehiculo_id ? parseInt(vehiculo_id, 10) : null,
            usuario_despachador_id: req.user.id,
            solicitante_nombre,
            solicitante_telefono,
            origen_direccion,
            destino_puesto,
            cantidad_pasajeros: parseInt(cantidad_pasajeros, 10) || 1,
            estado: estadoInicial,
            notas
        });

        if (vehiculo_id) {
            const v = await LogisticaVehiculo.findByPk(vehiculo_id);
            if (v) {
                v.estado = 'en_ruta';
                await v.save();
            }
        }

        return res.status(201).json({ message: 'Solicitud de transporte creada', despacho });
    } catch (e) {
        return res.status(500).json({ message: 'Error al crear despacho' });
    }
};

exports.asignarVehiculo = async (req, res) => {
    try {
        const { id } = req.params;
        const { vehiculo_id } = req.body;

        const despacho = await LogisticaDespacho.findByPk(id);
        if (!despacho) return res.status(404).json({ message: 'Despacho no encontrado' });

        const vehiculo = await LogisticaVehiculo.findByPk(vehiculo_id);
        if (!vehiculo) return res.status(404).json({ message: 'Vehículo no encontrado' });

        despacho.vehiculo_id = vehiculo_id;
        despacho.estado = 'asignado';
        await despacho.save();

        vehiculo.estado = 'en_ruta';
        await vehiculo.save();

        return res.json({ message: 'Vehículo asignado a la ruta', despacho });
    } catch (e) {
        return res.status(500).json({ message: 'Error al asignar vehículo' });
    }
};

exports.completarDespacho = async (req, res) => {
    try {
        const { id } = req.params;
        const despacho = await LogisticaDespacho.findByPk(id);
        if (!despacho) return res.status(404).json({ message: 'Despacho no encontrado' });

        despacho.estado = 'completado';
        despacho.hora_completado = new Date();
        await despacho.save();

        if (despacho.vehiculo_id) {
            const v = await LogisticaVehiculo.findByPk(despacho.vehiculo_id);
            if (v) {
                v.viajes_realizados = (v.viajes_realizados || 0) + 1;
                v.pasajeros_movilizados = (v.pasajeros_movilizados || 0) + (despacho.cantidad_pasajeros || 1);
                v.estado = 'disponible';
                await v.save();
            }
        }

        return res.json({ message: 'Servicio de transporte completado', despacho });
    } catch (e) {
        return res.status(500).json({ message: 'Error al completar despacho' });
    }
};

exports.getLogisticaSummary = async (req, res) => {
    try {
        const campana_id = req.campaignId || req.campana_id || req.query.campana_id;
        const where = campana_id ? { where: { campana_id } } : {};
        const vehiculos = await LogisticaVehiculo.findAll(where);
        const despachos = await LogisticaDespacho.findAll(where);

        const totalVehiculos = vehiculos.length;
        const disponibles = vehiculos.filter(v => v.estado === 'disponible').length;
        const enRuta = vehiculos.filter(v => v.estado === 'en_ruta').length;
        const totalViajes = despachos.filter(d => d.estado === 'completado').length;
        const totalPasajeros = vehiculos.reduce((acc, curr) => acc + (curr.pasajeros_movilizados || 0), 0);
        const pendientes = despachos.filter(d => d.estado === 'solicitado' || d.estado === 'asignado').length;

        return res.json({
            flota: {
                total: totalVehiculos,
                disponibles,
                en_ruta: enRuta
            },
            servicios: {
                completados: totalViajes,
                pendientes,
                pasajeros_movilizados: totalPasajeros
            }
        });
    } catch (e) {
        return res.status(500).json({ message: 'Error en resumen de logística' });
    }
};
