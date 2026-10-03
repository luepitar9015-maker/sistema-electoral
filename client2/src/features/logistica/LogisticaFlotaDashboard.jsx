import React, { useState, useEffect } from 'react';
import { Truck, Users, MapPin, Navigation, Phone, CheckCircle2, Clock, Plus, Car, AlertCircle, RefreshCw } from 'lucide-react';
import { API } from '../../config/api';

export default function LogisticaFlotaDashboard() {
    const [summary, setSummary] = useState(null);
    const [vehiculos, setVehiculos] = useState([]);
    const [despachos, setDespachos] = useState([]);
    const [activeTab, setActiveTab] = useState('despachos'); // 'despachos', 'flota'
    const [loading, setLoading] = useState(false);

    // Modal nuevo vehículo
    const [showModalVehiculo, setShowModalVehiculo] = useState(false);
    const [vehiculoForm, setVehiculoForm] = useState({
        conductor_nombre: '',
        conductor_telefono: '',
        placa: '',
        tipo_vehiculo: 'automovil',
        capacidad_pasajeros: 4,
        zona_asignada: '',
        observaciones: ''
    });

    // Modal nueva solicitud de recogida
    const [showModalDespacho, setShowModalDespacho] = useState(false);
    const [despachoForm, setDespachoForm] = useState({
        solicitante_nombre: '',
        solicitante_telefono: '',
        origen_direccion: '',
        destino_puesto: '',
        cantidad_pasajeros: 1,
        vehiculo_id: '',
        notas: ''
    });

    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resSum, resVeh, resDes] = await Promise.all([
                fetch(`${API}/logistica/summary`, { headers }).then(r => r.json()),
                fetch(`${API}/logistica/vehiculos`, { headers }).then(r => r.json()),
                fetch(`${API}/logistica/despachos`, { headers }).then(r => r.json())
            ]);
            setSummary(resSum);
            setVehiculos(resVeh || []);
            setDespachos(resDes || []);
        } catch (e) {
            console.error('Error fetching logistica:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000); // Polling cada 15s en el Día D
        return () => clearInterval(interval);
    }, []);

    const handleCreateVehiculo = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API}/logistica/vehiculos`, {
                method: 'POST',
                headers,
                body: JSON.stringify(vehiculoForm)
            });
            if (res.ok) {
                setShowModalVehiculo(false);
                setVehiculoForm({
                    conductor_nombre: '',
                    conductor_telefono: '',
                    placa: '',
                    tipo_vehiculo: 'automovil',
                    capacidad_pasajeros: 4,
                    zona_asignada: '',
                    observaciones: ''
                });
                fetchData();
            }
        } catch (e) {
            alert('Error al registrar vehículo');
        }
    };

    const handleCreateDespacho = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API}/logistica/despachos`, {
                method: 'POST',
                headers,
                body: JSON.stringify(despachoForm)
            });
            if (res.ok) {
                setShowModalDespacho(false);
                setDespachoForm({
                    solicitante_nombre: '',
                    solicitante_telefono: '',
                    origen_direccion: '',
                    destino_puesto: '',
                    cantidad_pasajeros: 1,
                    vehiculo_id: '',
                    notas: ''
                });
                fetchData();
            }
        } catch (e) {
            alert('Error al solicitar transporte');
        }
    };

    const handleAsignarVehiculo = async (despachoId, vehiculoId) => {
        try {
            await fetch(`${API}/logistica/despachos/${despachoId}/asignar`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ vehiculo_id: vehiculoId })
            });
            fetchData();
        } catch (e) {}
    };

    const handleCompletarDespacho = async (despachoId) => {
        try {
            await fetch(`${API}/logistica/despachos/${despachoId}/completar`, {
                method: 'PUT',
                headers
            });
            fetchData();
        } catch (e) {}
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 space-y-6">
            {/* Header de Flota y Logística */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-5 border-b border-slate-800 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-orange-500/20 text-white">
                        <Truck className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-amber-400 bg-clip-text text-transparent">
                            Centro de Despacho y Flota Día D
                        </h1>
                        <p className="text-xs text-slate-400">
                            Gestión de transporte de votantes, control de vehículos y asignación de rutas en tiempo real
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowModalDespacho(true)}
                        className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl text-xs shadow-lg transition"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Solicitar Recogida</span>
                    </button>
                    <button
                        onClick={() => setShowModalVehiculo(true)}
                        className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 font-bold rounded-xl text-xs shadow-lg transition"
                    >
                        <Car className="w-4 h-4" />
                        <span>Agregar Vehículo</span>
                    </button>
                    <button
                        onClick={fetchData}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-slate-300"
                        title="Actualizar datos"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Tarjetas Métricas */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 rounded-xl">
                    <span className="text-xs text-slate-400 block mb-1">Total Flota</span>
                    <div className="text-2xl font-black text-white">{summary?.flota?.total || 0}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Vehículos activos</div>
                </div>

                <div className="bg-emerald-950/40 border border-emerald-500/40 p-3.5 rounded-xl">
                    <span className="text-xs text-emerald-400 block mb-1">Disponibles en Base</span>
                    <div className="text-2xl font-black text-emerald-300">{summary?.flota?.disponibles || 0}</div>
                    <div className="text-[10px] text-emerald-400/80 mt-0.5">Listos para despachar</div>
                </div>

                <div className="bg-amber-950/40 border border-amber-500/40 p-3.5 rounded-xl">
                    <span className="text-xs text-amber-400 block mb-1">En Ruta de Recogida</span>
                    <div className="text-2xl font-black text-amber-300">{summary?.flota?.en_ruta || 0}</div>
                    <div className="text-[10px] text-amber-400/80 mt-0.5">En trayecto</div>
                </div>

                <div className="bg-blue-950/40 border border-blue-500/40 p-3.5 rounded-xl">
                    <span className="text-xs text-blue-400 block mb-1">Viajes Completados</span>
                    <div className="text-2xl font-black text-blue-300">{summary?.servicios?.completados || 0}</div>
                    <div className="text-[10px] text-blue-400/80 mt-0.5">Recogidas efectivas</div>
                </div>

                <div className="bg-purple-950/40 border border-purple-500/40 p-3.5 rounded-xl col-span-2 md:col-span-1">
                    <span className="text-xs text-purple-400 block mb-1">Pasajeros Movilizados</span>
                    <div className="text-2xl font-black text-purple-300">{summary?.servicios?.pasajeros_movilizados || 0}</div>
                    <div className="text-[10px] text-purple-400/80 mt-0.5">Votantes en urna</div>
                </div>
            </div>

            {/* Pestañas de Navegación */}
            <div className="flex border-b border-slate-800 gap-2">
                <button
                    onClick={() => setActiveTab('despachos')}
                    className={`py-2.5 px-4 text-xs font-bold border-b-2 transition ${
                        activeTab === 'despachos'
                            ? 'border-amber-500 text-amber-400 bg-slate-800/40 rounded-t-lg'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                    Despachos y Recogidas en Curso ({despachos.length})
                </button>
                <button
                    onClick={() => setActiveTab('flota')}
                    className={`py-2.5 px-4 text-xs font-bold border-b-2 transition ${
                        activeTab === 'flota'
                            ? 'border-amber-500 text-amber-400 bg-slate-800/40 rounded-t-lg'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                    Vehículos Registrados ({vehiculos.length})
                </button>
            </div>

            {/* TAB 1: DESPACHOS Y RECOGIDAS */}
            {activeTab === 'despachos' && (
                <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {despachos.map(d => (
                            <div key={d.id} className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 shadow-lg space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-white text-sm">{d.solicitante_nombre}</h3>
                                        <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                            <Phone className="w-3 h-3 text-emerald-400" />
                                            <span>{d.solicitante_telefono || 'Sin tel'}</span>
                                        </span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        d.estado === 'completado' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                                        d.estado === 'en_camino' || d.estado === 'asignado' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse' :
                                        'bg-red-500/20 text-red-400 border border-red-500/40'
                                    }`}>
                                        {d.estado}
                                    </span>
                                </div>

                                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-xs space-y-1.5">
                                    <div>
                                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Origen:</span>
                                        <span className="text-slate-200 font-medium">{d.origen_direccion}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Puesto de Votación:</span>
                                        <span className="text-amber-400 font-bold">{d.destino_puesto}</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-800/80">
                                        <span>Pasajeros: {d.cantidad_pasajeros}</span>
                                        <span>Hora: {new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>

                                {/* Asignación de Chofer o Estado */}
                                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2">
                                    {d.vehiculo ? (
                                        <div className="text-xs flex-1">
                                            <span className="text-slate-400 text-[10px] block">Conductor asignado:</span>
                                            <span className="font-bold text-white text-xs">{d.vehiculo.conductor_nombre} ({d.vehiculo.placa})</span>
                                        </div>
                                    ) : (
                                        <div className="flex-1">
                                            <select
                                                onChange={e => handleAsignarVehiculo(d.id, e.target.value)}
                                                className="w-full bg-slate-950 border border-amber-500/40 rounded-lg p-1.5 text-xs text-amber-300 font-semibold"
                                            >
                                                <option value="">-- Asignar Vehículo --</option>
                                                {vehiculos.filter(v => v.estado === 'disponible').map(v => (
                                                    <option key={v.id} value={v.id}>
                                                        {v.conductor_nombre} ({v.placa} - {v.capacidad_pasajeros} cupos)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {d.estado !== 'completado' && d.vehiculo && (
                                        <button
                                            onClick={() => handleCompletarDespacho(d.id)}
                                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition"
                                        >
                                            Listo
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {despachos.length === 0 && (
                        <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-700 text-slate-400">
                            No hay servicios de transporte solicitados en este momento.
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: FLOTA DE VEHÍCULOS */}
            {activeTab === 'flota' && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {vehiculos.map(v => (
                        <div key={v.id} className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 shadow-lg space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <Car className="w-4 h-4 text-amber-400" />
                                        <h3 className="font-black text-white text-base tracking-wider font-mono">{v.placa}</h3>
                                    </div>
                                    <div className="text-xs text-slate-300 font-semibold mt-1">{v.conductor_nombre}</div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    v.estado === 'disponible' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                                    v.estado === 'en_ruta' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                                    'bg-slate-700 text-slate-300'
                                }`}>
                                    {v.estado}
                                </span>
                            </div>

                            <div className="bg-slate-900/60 p-2.5 rounded-lg text-xs space-y-1 text-slate-300">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Teléfono:</span>
                                    <a href={`tel:${v.conductor_telefono}`} className="text-emerald-400 font-semibold">{v.conductor_telefono}</a>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Tipo:</span>
                                    <span className="capitalize">{v.tipo_vehiculo} ({v.capacidad_pasajeros} puestos)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Zona Asignada:</span>
                                    <span className="text-amber-300 font-medium">{v.zona_asignada || 'General'}</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-700/60 text-slate-400">
                                <span>{v.viajes_realizados || 0} viajes</span>
                                <span className="text-emerald-400 font-bold">{v.pasajeros_movilizados || 0} movilizados</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL NUEVA SOLICITUD DE RECOGIDA */}
            {showModalDespacho && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                            <h3 className="font-bold text-white text-base flex items-center gap-2">
                                <Truck className="w-5 h-5 text-amber-400" />
                                <span>Solicitar Transporte de Votante</span>
                            </h3>
                            <button onClick={() => setShowModalDespacho(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleCreateDespacho} className="space-y-3 text-sm">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Nombre del Votante o Grupo *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Familia Gómez"
                                    value={despachoForm.solicitante_nombre}
                                    onChange={e => setDespachoForm({ ...despachoForm, solicitante_nombre: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Teléfono Contacto</label>
                                    <input
                                        type="text"
                                        placeholder="300xxxxxxx"
                                        value={despachoForm.solicitante_telefono}
                                        onChange={e => setDespachoForm({ ...despachoForm, solicitante_telefono: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Cantidad Pasajeros</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={despachoForm.cantidad_pasajeros}
                                        onChange={e => setDespachoForm({ ...despachoForm, cantidad_pasajeros: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Dirección de Recogida (Origen) *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Barrio, calle, casa..."
                                    value={despachoForm.origen_direccion}
                                    onChange={e => setDespachoForm({ ...despachoForm, origen_direccion: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Puesto de Votación (Destino) *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Colegio San José"
                                    value={despachoForm.destino_puesto}
                                    onChange={e => setDespachoForm({ ...despachoForm, destino_puesto: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Asignar Vehículo Ahora (Opcional)</label>
                                <select
                                    value={despachoForm.vehiculo_id}
                                    onChange={e => setDespachoForm({ ...despachoForm, vehiculo_id: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                                >
                                    <option value="">-- Dejar en Cola de Despacho --</option>
                                    {vehiculos.filter(v => v.estado === 'disponible').map(v => (
                                        <option key={v.id} value={v.id}>
                                            {v.conductor_nombre} ({v.placa} - {v.capacidad_pasajeros} cupos)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setShowModalDespacho(false)}
                                    className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-xs"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-lg"
                                >
                                    Despachar Recogida
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL REGISTRAR VEHÍCULO */}
            {showModalVehiculo && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                            <h3 className="font-bold text-white text-base flex items-center gap-2">
                                <Car className="w-5 h-5 text-amber-400" />
                                <span>Registrar Vehículo a la Flota</span>
                            </h3>
                            <button onClick={() => setShowModalVehiculo(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleCreateVehiculo} className="space-y-3 text-sm">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Nombre del Conductor *</label>
                                <input
                                    type="text"
                                    required
                                    value={vehiculoForm.conductor_nombre}
                                    onChange={e => setVehiculoForm({ ...vehiculoForm, conductor_nombre: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Teléfono Conductor *</label>
                                    <input
                                        type="text"
                                        required
                                        value={vehiculoForm.conductor_telefono}
                                        onChange={e => setVehiculoForm({ ...vehiculoForm, conductor_telefono: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Placa Vehículo *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="ABC-123"
                                        value={vehiculoForm.placa}
                                        onChange={e => setVehiculoForm({ ...vehiculoForm, placa: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-mono uppercase text-amber-400 font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de Vehículo</label>
                                    <select
                                        value={vehiculoForm.tipo_vehiculo}
                                        onChange={e => setVehiculoForm({ ...vehiculoForm, tipo_vehiculo: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                                    >
                                        <option value="automovil">Automóvil (Taxi / Particular)</option>
                                        <option value="van">Van / Minibús</option>
                                        <option value="bus">Bus / Microbús</option>
                                        <option value="moto">Motocicleta</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Capacidad Pasajeros</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={vehiculoForm.capacidad_pasajeros}
                                        onChange={e => setVehiculoForm({ ...vehiculoForm, capacidad_pasajeros: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Zona o Comuna Asignada</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Comuna 5 / Puestos Zona Sur"
                                    value={vehiculoForm.zona_asignada}
                                    onChange={e => setVehiculoForm({ ...vehiculoForm, zona_asignada: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setShowModalVehiculo(false)}
                                    className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-xs"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs shadow-lg"
                                >
                                    Guardar Vehículo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
