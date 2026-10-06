import React, { useState, useEffect } from 'react';
import { 
    Headphones, Phone, PhoneCall, PhoneForwarded, PhoneOff, 
    CheckCircle2, Truck, AlertCircle, MessageSquare, ChevronRight, 
    RotateCcw, Sparkles, User, MapPin, Award, Calendar, Users, 
    Plus, Search, Filter, Printer, Copy, Check, X, ShieldAlert,
    Clock, CheckSquare, FileText, ArrowRight, UserPlus, HeartHandshake,
    Building2, Compass
} from 'lucide-react';
import { API } from '../../config/api';

export default function CallCenterOperator() {
    // Modo general: 'gotv' (Día D), 'evento' (Convocatoria Comunitaria), 'auditoria' (Control y Puerta)
    const [activeMode, setActiveMode] = useState('evento');

    // -------------------------------------------------------------
    // ESTADO MODO 1: GOTV DÍA D
    // -------------------------------------------------------------
    const [currentVoterGotv, setCurrentVoterGotv] = useState(null);
    const [loadingGotv, setLoadingGotv] = useState(false);
    const [statsGotv, setStatsGotv] = useState(null);
    const [soloPendientesGotv, setSoloPendientesGotv] = useState(true);
    const [filterPuestoGotv, setFilterPuestoGotv] = useState('');
    const [minFidelidadGotv, setMinFidelidadGotv] = useState(1);
    const [notasGotv, setNotasGotv] = useState('');
    const [showTransporteModal, setShowTransporteModal] = useState(false);
    const [direccionRecogida, setDireccionRecogida] = useState('');

    // -------------------------------------------------------------
    // ESTADO MODO 2: CONVOCATORIA A EVENTOS / ENCUENTROS
    // -------------------------------------------------------------
    const [eventos, setEventos] = useState([]);
    const [selectedEventoId, setSelectedEventoId] = useState('');
    const [currentVoterEvento, setCurrentVoterEvento] = useState(null);
    const [loadingEventoVoter, setLoadingEventoVoter] = useState(false);
    const [geoSegments, setGeoSegments] = useState({ municipios: [], puestos: [], barrios: [] });

    // Filtros de nicho geográfico
    const [filtroMunicipio, setFiltroMunicipio] = useState('todos');
    const [filtroBarrio, setFiltroBarrio] = useState('');
    const [filtroPuestoEvento, setFiltroPuestoEvento] = useState('todos');

    // Formulario de llamada de evento
    const [notasEvento, setNotasEvento] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showPeticionModal, setShowPeticionModal] = useState(false);
    const [cantidadAcompanantes, setCantidadAcompanantes] = useState(0);
    const [textoPeticion, setTextoPeticion] = useState('');
    const [submittingAction, setSubmittingAction] = useState(false);

    // Modal Crear Nuevo Evento
    const [showCreateEventoModal, setShowCreateEventoModal] = useState(false);
    const [nuevoEventoForm, setNuevoEventoForm] = useState({
        titulo: '',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0],
        hora_inicio: '18:00',
        hora_fin: '20:00',
        lugar_nombre: '',
        direccion: '',
        municipio: '',
        barrio_vereda: '',
        aforo_estimado: 100,
        presidida_por: 'candidato'
    });

    // -------------------------------------------------------------
    // ESTADO MODO 3: AUDITORÍA Y CONTROL DE ACCESO (PUERTA)
    // -------------------------------------------------------------
    const [auditoriaData, setAuditoriaData] = useState(null);
    const [loadingAuditoria, setLoadingAuditoria] = useState(false);
    const [subTabAuditoria, setSubTabAuditoria] = useState('bitacora'); // 'bitacora' o 'puerta'
    const [filtroBitacora, setFiltroBitacora] = useState('todos');
    const [searchBitacora, setSearchBitacora] = useState('');

    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // =============================================================
    // CARGAS DE DATOS INICIALES
    // =============================================================
    const fetchEventosActivos = async () => {
        try {
            const res = await fetch(`${API}/callcenter/eventos-activos`, { headers });
            if (res.ok) {
                const data = await res.json();
                setEventos(data.eventos || []);
                if (data.eventos?.length > 0 && !selectedEventoId) {
                    setSelectedEventoId(String(data.eventos[0].id));
                }
            }
        } catch (e) {
            console.error('Error fetching eventos:', e);
        }
    };

    const fetchGeoSegments = async () => {
        try {
            const res = await fetch(`${API}/callcenter/segmentos-geograficos`, { headers });
            if (res.ok) {
                const data = await res.json();
                setGeoSegments(data);
            }
        } catch (e) {}
    };

    const fetchStatsGotv = async () => {
        try {
            const res = await fetch(`${API}/callcenter/stats`, { headers });
            if (res.ok) {
                const data = await res.json();
                setStatsGotv(data);
            }
        } catch (e) {}
    };

    const fetchNextVoterGotv = async () => {
        setLoadingGotv(true);
        try {
            const q = new URLSearchParams({
                soloPendientesDiaD: soloPendientesGotv,
                puesto: filterPuestoGotv,
                minFidelidad: minFidelidadGotv
            });
            const res = await fetch(`${API}/callcenter/next?${q.toString()}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setCurrentVoterGotv(data.voter || null);
                setNotasGotv('');
                if (data.voter?.direccion) {
                    setDireccionRecogida(data.voter.direccion.replace(/Tel:.*$/, '').trim());
                }
            }
        } catch (e) {
            console.error('Error fetching next voter gotv:', e);
        } finally {
            setLoadingGotv(false);
        }
    };

    const fetchNextVoterEvento = async () => {
        if (!selectedEventoId) return;
        setLoadingEventoVoter(true);
        try {
            const q = new URLSearchParams({
                reunion_id: selectedEventoId,
                municipio: filtroMunicipio,
                barrio: filtroBarrio,
                puesto: filtroPuestoEvento
            });
            const res = await fetch(`${API}/callcenter/next-evento?${q.toString()}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setCurrentVoterEvento(data.voter || null);
                setNotasEvento('');
                setTextoPeticion('');
                setCantidadAcompanantes(0);
            }
        } catch (e) {
            console.error('Error fetching next voter evento:', e);
        } finally {
            setLoadingEventoVoter(false);
        }
    };

    const fetchAuditoriaEvento = async () => {
        if (!selectedEventoId) return;
        setLoadingAuditoria(true);
        try {
            const res = await fetch(`${API}/callcenter/evento/${selectedEventoId}/auditoria`, { headers });
            if (res.ok) {
                const data = await res.json();
                setAuditoriaData(data);
            }
        } catch (e) {
            console.error('Error fetching auditoria evento:', e);
        } finally {
            setLoadingAuditoria(false);
        }
    };

    useEffect(() => {
        fetchEventosActivos();
        fetchGeoSegments();
        fetchStatsGotv();
    }, []);

    useEffect(() => {
        if (activeMode === 'gotv') {
            fetchNextVoterGotv();
        } else if (activeMode === 'evento') {
            fetchNextVoterEvento();
        } else if (activeMode === 'auditoria') {
            fetchAuditoriaEvento();
        }
    }, [activeMode, selectedEventoId, filtroMunicipio, filtroBarrio, filtroPuestoEvento, soloPendientesGotv, filterPuestoGotv]);

    // Obtener el objeto del evento seleccionado actualmente
    const eventoActual = eventos.find(e => String(e.id) === String(selectedEventoId)) || eventos[0];

    // =============================================================
    // TIPIFICACIONES MODO 1: GOTV
    // =============================================================
    const handleTipificarGotv = async (resultado) => {
        if (!currentVoterGotv) return;
        if (resultado === 'requiere_transporte') {
            setShowTransporteModal(true);
            return;
        }

        try {
            setSubmittingAction(true);
            await fetch(`${API}/callcenter/record`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    voter_id: currentVoterGotv.id,
                    resultado,
                    notas: notasGotv
                })
            });
            fetchStatsGotv();
            fetchNextVoterGotv();
        } catch (e) {
            alert('Error al registrar llamada');
        } finally {
            setSubmittingAction(false);
        }
    };

    const handleConfirmarTransporteGotv = async () => {
        try {
            setSubmittingAction(true);
            await fetch(`${API}/callcenter/record`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    voter_id: currentVoterGotv.id,
                    resultado: 'requiere_transporte',
                    notas: notasGotv,
                    origen_direccion: direccionRecogida || currentVoterGotv.direccion || 'Domicilio votante',
                    destino_puesto: currentVoterGotv.lugar_votacion || 'Puesto asignado'
                })
            });
            setShowTransporteModal(false);
            fetchStatsGotv();
            fetchNextVoterGotv();
        } catch (e) {
            alert('Error al programar transporte');
        } finally {
            setSubmittingAction(false);
        }
    };

    // =============================================================
    // TIPIFICACIONES MODO 2: CONVOCATORIA A EVENTOS
    // =============================================================
    const handleTipificarEvento = async (resultado, opciones = {}) => {
        if (!currentVoterEvento || !selectedEventoId) return;

        try {
            setSubmittingAction(true);
            await fetch(`${API}/callcenter/record-evento`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    voter_id: currentVoterEvento.id,
                    reunion_id: selectedEventoId,
                    resultado,
                    cantidad_acompanantes: opciones.acompanantes !== undefined ? opciones.acompanantes : cantidadAcompanantes,
                    notas: opciones.notas || notasEvento,
                    necesidad_peticion: opciones.peticion || textoPeticion
                })
            });
            setShowConfirmModal(false);
            setShowPeticionModal(false);
            fetchEventosActivos();
            fetchNextVoterEvento();
        } catch (e) {
            alert('Error al guardar registro de convocatoria');
        } finally {
            setSubmittingAction(false);
        }
    };

    // Crear nuevo evento
    const handleCrearNuevoEvento = async (e) => {
        e.preventDefault();
        try {
            setSubmittingAction(true);
            const res = await fetch(`${API}/callcenter/crear-evento`, {
                method: 'POST',
                headers,
                body: JSON.stringify(nuevoEventoForm)
            });
            if (res.ok) {
                const data = await res.json();
                setShowCreateEventoModal(false);
                await fetchEventosActivos();
                if (data.evento) {
                    setSelectedEventoId(String(data.evento.id));
                }
            }
        } catch (err) {
            alert('Error al crear evento');
        } finally {
            setSubmittingAction(false);
        }
    };

    const getTelefono = (voter) => {
        if (!voter) return '';
        if (voter.direccion && voter.direccion.includes('Tel:')) {
            return voter.direccion.replace(/.*Tel:\s*/, '').trim();
        }
        return voter.cedula;
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-3 md:p-6 space-y-6">
            {/* Header Principal */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-5 border-b border-slate-800 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl shadow-indigo-500/20 text-white">
                        <Headphones className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                                Central de Telemarketing Electoral & Convocatoria
                            </h1>
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                Omnicanal 365
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Convocatoria comunitaria por nicho residencial, movilización territorial y bitácora auditable de aforo
                        </p>
                    </div>
                </div>

                {/* Selector de Modos de Operación */}
                <div className="flex p-1 bg-slate-800/90 rounded-xl border border-slate-700 text-xs font-bold gap-1 self-stretch sm:self-auto">
                    <button
                        onClick={() => setActiveMode('evento')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg transition ${
                            activeMode === 'evento'
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>1. Convocatoria a Eventos</span>
                        {eventos.length > 0 && (
                            <span className="px-1.5 py-0.2 bg-white/20 text-[10px] rounded-full">
                                {eventos.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveMode('auditoria')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg transition ${
                            activeMode === 'auditoria'
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Award className="w-3.5 h-3.5" />
                        <span>2. Auditoría y Puerta</span>
                    </button>

                    <button
                        onClick={() => setActiveMode('gotv')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg transition ${
                            activeMode === 'gotv'
                                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>3. GOTV Día D</span>
                    </button>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* MODO 2: CONVOCATORIA A EVENTOS Y ENCUENTROS COMUNITARIOS (NUEVO)           */}
            {/* ========================================================================= */}
            {activeMode === 'evento' && (
                <div className="space-y-6">
                    {/* Barra Superior de Control de Campaña / Evento y Segmentación Geográfica */}
                    <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl shadow-xl backdrop-blur space-y-4">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 pb-3 border-b border-slate-700/60">
                            {/* Selector de Evento Activo */}
                            <div className="flex items-center gap-3 w-full lg:w-auto">
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                                    <Building2 className="w-4 h-4 text-indigo-400" />
                                    <span>Evento a Convocar:</span>
                                </span>
                                <select
                                    value={selectedEventoId}
                                    onChange={e => setSelectedEventoId(e.target.value)}
                                    className="bg-slate-900 border border-indigo-500/50 text-indigo-200 font-bold text-xs rounded-xl px-3 py-2 flex-1 lg:w-80 focus:outline-none focus:border-indigo-400"
                                >
                                    {eventos.map(ev => (
                                        <option key={ev.id} value={ev.id}>
                                            📅 {ev.fecha} | {ev.titulo} ({ev.lugar_nombre || ev.municipio})
                                        </option>
                                    ))}
                                </select>

                                <button
                                    onClick={() => setShowCreateEventoModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow"
                                    title="Crear un nuevo encuentro comunitario para llamar"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Nuevo Encuentro</span>
                                </button>
                            </div>

                            {/* Resumen del Aforo Proyectado del Evento */}
                            {eventoActual && (
                                <div className="flex items-center gap-4 text-xs bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700 w-full lg:w-auto justify-between lg:justify-end">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400">Capacidad Salón:</span>
                                        <span className="font-bold text-white">{eventoActual.aforo_estimado || 100}</span>
                                    </div>
                                    <div className="h-3 w-px bg-slate-700" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-emerald-400 font-medium">Asistencia Asegurada:</span>
                                        <span className="font-black text-emerald-300 text-sm">
                                            {eventoActual.aforo_proyectado || 0} pers.
                                        </span>
                                        <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded font-bold">
                                            {eventoActual.porcentaje_aforo_cubierto || 0}%
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Barra de Segmentación Geográfica de Nicho */}
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                            <span className="text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1">
                                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Nicho de Residencia:</span>
                            </span>

                            {/* Selector Municipio */}
                            <select
                                value={filtroMunicipio}
                                onChange={e => setFiltroMunicipio(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                            >
                                <option value="todos">Todos los Municipios</option>
                                {geoSegments.municipios?.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>

                            {/* Selector / Input Barrio o Sector */}
                            <input
                                type="text"
                                placeholder="Filtrar por Barrio o Sector..."
                                value={filtroBarrio}
                                onChange={e => setFiltroBarrio(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder-slate-500 w-44"
                            />

                            {/* Selector Puesto Cercano */}
                            <select
                                value={filtroPuestoEvento}
                                onChange={e => setFiltroPuestoEvento(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 max-w-xs truncate"
                            >
                                <option value="todos">Todos los Puestos Cercanos</option>
                                {geoSegments.puestos?.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>

                            <button
                                onClick={fetchNextVoterEvento}
                                className="ml-auto px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition flex items-center gap-1.5"
                            >
                                <ArrowRight className="w-3.5 h-3.5" />
                                <span>Siguiente Vecino</span>
                            </button>
                        </div>
                    </div>

                    {/* Espacio Operativo de Llamada al Vecino */}
                    {currentVoterEvento ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Ficha del Ciudadano en Nicho (Col 5) */}
                            <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span>Vecino en el Nicho Geográfico</span>
                                        </span>
                                        <h2 className="text-xl font-bold text-white mt-1">
                                            {currentVoterEvento.nombres} {currentVoterEvento.apellidos}
                                        </h2>
                                        <span className="text-xs font-mono text-slate-400">CC: {currentVoterEvento.cedula}</span>
                                    </div>

                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-indigo-500/20 text-indigo-300 border-indigo-500/40">
                                        Nivel Simpatía: {currentVoterEvento.fidelidad_score || 3}/5 ⭐
                                    </span>
                                </div>

                                {/* Datos Residenciales y Electorales */}
                                <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-700/60 space-y-2.5 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Lugar de Residencia:</span>
                                        <span className="font-bold text-amber-300 text-right">
                                            {currentVoterEvento.direccion || 'Dirección registrada'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Municipio:</span>
                                        <span className="text-slate-200">
                                            {currentVoterEvento.municipio || 'Municipal'} ({currentVoterEvento.departamento || 'Dpto'})
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Puesto de Votación Cercano:</span>
                                        <span className="text-slate-200 font-medium">{currentVoterEvento.lugar_votacion || 'Principal'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Líder o Referente:</span>
                                        <span className="text-indigo-300 font-semibold">{currentVoterEvento.lider_nombre || 'Directo'}</span>
                                    </div>
                                </div>

                                {/* Botones de Marcación y WhatsApp */}
                                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                                    <a
                                        href={`tel:${getTelefono(currentVoterEvento)}`}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/20 transition"
                                    >
                                        <PhoneCall className="w-4 h-4" />
                                        <span>Llamar ({getTelefono(currentVoterEvento)})</span>
                                    </a>

                                    <a
                                        href={`https://wa.me/?text=Hola%20${encodeURIComponent(currentVoterEvento.nombres)},%20te%20saluda%20el%20equipo%20de%20apoyo.%20Te%20invitamos%20especialmente%20a%20nuestro%20encuentro%20comunitario%20"${encodeURIComponent(eventoActual?.titulo || 'Reunión Ciudadana')}"%20este%20${encodeURIComponent(eventoActual?.fecha || '')}%20a%20las%20${encodeURIComponent(eventoActual?.hora_inicio || '')}%20en%20${encodeURIComponent(eventoActual?.lugar_nombre || '')}.%20%C2%A1Contamos%20con%20tu%20presencia!`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-700/40 hover:bg-emerald-700/60 text-emerald-300 border border-emerald-500/40 font-bold rounded-xl text-xs transition"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        <span>WhatsApp</span>
                                    </a>
                                </div>
                            </div>

                            {/* Guión Dinámico y Tipificación en 1 Clic (Col 7) */}
                            <div className="lg:col-span-7 space-y-4">
                                {/* Guión Dinámico Adaptado al Evento */}
                                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                                            <Sparkles className="w-4 h-4" />
                                            <span>Guión Inteligente de Convocatoria Comunitaria</span>
                                        </div>
                                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/40 font-semibold">
                                            Evento: {eventoActual?.titulo}
                                        </span>
                                    </div>

                                    <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-700/60 text-xs text-slate-200 leading-relaxed space-y-2.5">
                                        <p>
                                            🗣️ <strong>1. Saludo Personalizado:</strong> <em>"Hola buenas tardes, ¿tengo el gusto de hablar con {currentVoterEvento.nombres}? Le saluda el equipo de trabajo de la campaña / despacho..."</em>
                                        </p>
                                        <p>
                                            📍 <strong>2. Razon de Llamada (Nicho Territorial):</strong> <em>"Le llamamos especialmente porque sabemos que usted reside en este sector de {currentVoterEvento.direccion || currentVoterEvento.municipio}, y queremos hacerle una invitación directa y personal..."</em>
                                        </p>
                                        <p>
                                            📅 <strong>3. Invitación al Encuentro:</strong> <em>"Este <strong>{eventoActual?.fecha}</strong> a las <strong>{eventoActual?.hora_inicio}</strong> realizaremos nuestro <strong>{eventoActual?.titulo}</strong> en <strong>{eventoActual?.lugar_nombre || 'el salón comunal'}</strong> ({eventoActual?.direccion || ''}). Hablaremos sobre propuestas y soluciones directas para la comunidad."</em>
                                        </p>
                                        <p>
                                            🎟️ <strong>4. Pregunta Clave de Confirmación:</strong> <em>"¿Podemos confirmar su valiosa asistencia? ¿Vendrá acompañado de familiares o vecinos para reservarle sus asientos?"</em>
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">
                                            Notas u Observación del Operador
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Dijo que va con su esposa y llevará una solicitud para la junta comunal..."
                                            value={notasEvento}
                                            onChange={e => setNotasEvento(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                {/* Botones de Tipificación en 1 Clic */}
                                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-3">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                                        Tipificación Rápida del Vecino (1 Clic)
                                    </span>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                        <button
                                            onClick={() => setShowConfirmModal(true)}
                                            disabled={submittingAction}
                                            className="p-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95 shadow-lg"
                                        >
                                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                            <span>Asistencia Confirmada</span>
                                            <span className="text-[10px] text-emerald-400/80 font-normal">+ Acompañantes</span>
                                        </button>

                                        <button
                                            onClick={() => handleTipificarEvento('apoya_no_asiste')}
                                            disabled={submittingAction}
                                            className="p-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/50 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95"
                                        >
                                            <HeartHandshake className="w-5 h-5 text-blue-400" />
                                            <span>Apoya pero No Asiste</span>
                                            <span className="text-[10px] text-blue-400/80 font-normal">Enviar compromisos</span>
                                        </button>

                                        <button
                                            onClick={() => setShowPeticionModal(true)}
                                            disabled={submittingAction}
                                            className="p-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/50 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95"
                                        >
                                            <FileText className="w-5 h-5 text-purple-400" />
                                            <span>Deja Petición para Evento</span>
                                            <span className="text-[10px] text-purple-400/80 font-normal">Registrar necesidad</span>
                                        </button>

                                        <button
                                            onClick={() => handleTipificarEvento('reagendar')}
                                            disabled={submittingAction}
                                            className="p-3 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/50 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95"
                                        >
                                            <Clock className="w-5 h-5 text-amber-400" />
                                            <span>Reagendar Llamada</span>
                                            <span className="text-[10px] text-amber-400/80 font-normal">Ocupado ahora</span>
                                        </button>

                                        <button
                                            onClick={() => handleTipificarEvento('no_contesta')}
                                            disabled={submittingAction}
                                            className="p-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95"
                                        >
                                            <PhoneOff className="w-5 h-5 text-slate-400" />
                                            <span>No Contesta / Buzón</span>
                                            <span className="text-[10px] text-slate-400 font-normal">Volver a intentar</span>
                                        </button>

                                        <button
                                            onClick={() => handleTipificarEvento('no_le_interesa')}
                                            disabled={submittingAction}
                                            className="p-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/50 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95"
                                        >
                                            <X className="w-5 h-5 text-rose-400" />
                                            <span>No le Interesa</span>
                                            <span className="text-[10px] text-rose-400/80 font-normal">Descartar</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-12 text-center space-y-3">
                            <CheckCircle2 className="w-12 h-12 text-indigo-400 mx-auto" />
                            <h3 className="text-lg font-bold text-white">¡No hay más vecinos pendientes en este nicho!</h3>
                            <p className="text-xs text-slate-400 max-w-md mx-auto">
                                Has completado la lista de contactos para los filtros geográficos seleccionados. Puedes ampliar el barrio, municipio o verificar la auditoría del ejercicio.
                            </p>
                            <div className="flex justify-center gap-3 pt-2">
                                <button
                                    onClick={fetchNextVoterEvento}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
                                >
                                    Volver a Verificar Nicho
                                </button>
                                <button
                                    onClick={() => setActiveMode('auditoria')}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl text-xs"
                                >
                                    Ver Auditoría y Lista de Puerta
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODO 3: AUDITORÍA DEL EJERCICIO Y CONTROL DE ACCESO (PUERTA / CHECK-IN)   */}
            {/* ========================================================================= */}
            {activeMode === 'auditoria' && (
                <div className="space-y-6">
                    {/* Barra de Selección de Evento a Auditar */}
                    <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-300">Auditar Ejercicio de Convocatoria:</span>
                            <select
                                value={selectedEventoId}
                                onChange={e => setSelectedEventoId(e.target.value)}
                                className="bg-slate-900 border border-indigo-500/50 text-indigo-200 font-bold text-xs rounded-xl px-3 py-2"
                            >
                                {eventos.map(ev => (
                                    <option key={ev.id} value={ev.id}>
                                        📅 {ev.fecha} | {ev.titulo}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={fetchAuditoriaEvento}
                                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-xl"
                            >
                                Refrescar Datos
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Imprimir Reporte</span>
                            </button>
                        </div>
                    </div>

                    {auditoriaData && (
                        <>
                            {/* Métricas Clave de Aforo y Efectividad */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
                                    <span className="text-xs text-slate-400 block mb-1">Llamadas Realizadas</span>
                                    <div className="text-2xl font-black text-indigo-400">{auditoriaData.kpis?.total_llamadas || 0}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">Vecinos contactados</div>
                                </div>

                                <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-xl">
                                    <span className="text-xs text-emerald-400 block mb-1">Confirmados Directos</span>
                                    <div className="text-2xl font-black text-emerald-300">{auditoriaData.kpis?.confirmados_directos || 0}</div>
                                    <div className="text-[10px] text-emerald-400/80 mt-0.5">Asistencia personal</div>
                                </div>

                                <div className="bg-amber-950/40 border border-amber-500/40 p-4 rounded-xl">
                                    <span className="text-xs text-amber-400 block mb-1">Acompañantes Previstos</span>
                                    <div className="text-2xl font-black text-amber-300">{auditoriaData.kpis?.acompanantes_estimados || 0}</div>
                                    <div className="text-[10px] text-amber-400/80 mt-0.5">Familiares / amigos</div>
                                </div>

                                <div className="bg-purple-950/40 border border-purple-500/40 p-4 rounded-xl">
                                    <span className="text-xs text-purple-400 block mb-1">Aforo Total Proyectado</span>
                                    <div className="text-2xl font-black text-purple-300">
                                        {auditoriaData.kpis?.aforo_proyectado || 0}
                                        <span className="text-xs text-slate-400 font-normal"> / {auditoriaData.kpis?.capacidad_salon || 100}</span>
                                    </div>
                                    <div className="text-[10px] text-purple-400/80 mt-0.5 font-bold">
                                        {auditoriaData.kpis?.porcentaje_aforo_cubierto || 0}% de capacidad del salón
                                    </div>
                                </div>

                                <div className="bg-blue-950/40 border border-blue-500/40 p-4 rounded-xl">
                                    <span className="text-xs text-blue-400 block mb-1">Tasa de Aceptación</span>
                                    <div className="text-2xl font-black text-blue-300">{auditoriaData.kpis?.tasa_aceptacion_pct || 0}%</div>
                                    <div className="text-[10px] text-blue-400/80 mt-0.5">Confirmaron o respaldan</div>
                                </div>
                            </div>

                            {/* Barra Visual de Ocupación del Salón */}
                            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-white flex items-center gap-1.5">
                                        <Building2 className="w-4 h-4 text-indigo-400" />
                                        <span>Proyección de Llenado del Salón ({auditoriaData.evento?.lugar_nombre || 'Recinto'})</span>
                                    </span>
                                    <span className="font-black text-indigo-400">
                                        {auditoriaData.kpis?.aforo_proyectado} de {auditoriaData.kpis?.capacidad_salon} sillas ({auditoriaData.kpis?.porcentaje_aforo_cubierto}%)
                                    </span>
                                </div>
                                <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-700">
                                    <div 
                                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(100, auditoriaData.kpis?.porcentaje_aforo_cubierto || 0)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Pestañas de la Auditoría */}
                            <div className="flex border-b border-slate-800 gap-2">
                                <button
                                    onClick={() => setSubTabAuditoria('bitacora')}
                                    className={`py-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                                        subTabAuditoria === 'bitacora'
                                            ? 'border-indigo-500 text-indigo-400 bg-slate-800/40 rounded-t-lg'
                                            : 'border-transparent text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    <FileText className="w-4 h-4" />
                                    <span>Bitácora de Acciones ({auditoriaData.bitacora?.length || 0})</span>
                                </button>

                                <button
                                    onClick={() => setSubTabAuditoria('puerta')}
                                    className={`py-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                                        subTabAuditoria === 'puerta'
                                            ? 'border-emerald-500 text-emerald-400 bg-slate-800/40 rounded-t-lg'
                                            : 'border-transparent text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    <CheckSquare className="w-4 h-4" />
                                    <span>Lista de Puerta y Control de Acceso ({auditoriaData.lista_puerta?.length || 0})</span>
                                </button>
                            </div>

                            {/* SUBTAB 1: BITÁCORA DE LLAMADAS */}
                            {subTabAuditoria === 'bitacora' && (
                                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden shadow-xl space-y-3 p-4">
                                    <div className="flex flex-wrap justify-between items-center gap-3">
                                        <div className="relative min-w-[240px]">
                                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                            <input
                                                type="text"
                                                placeholder="Buscar por votante o cédula..."
                                                value={searchBitacora}
                                                onChange={e => setSearchBitacora(e.target.value)}
                                                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="text-slate-400">Filtrar Resultado:</span>
                                            <select
                                                value={filtroBitacora}
                                                onChange={e => setFiltroBitacora(e.target.value)}
                                                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                                            >
                                                <option value="todos">Todos los resultados</option>
                                                <option value="asiste_confirmado">Confirmados</option>
                                                <option value="apoya_no_asiste">Apoya pero no va</option>
                                                <option value="deja_peticion">Dejó Petición</option>
                                                <option value="no_contesta">No Contesta</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                                                <tr>
                                                    <th className="py-3 px-3">Fecha / Hora</th>
                                                    <th className="py-3 px-3">Operador</th>
                                                    <th className="py-3 px-3">Ciudadano Convocado</th>
                                                    <th className="py-3 px-3">Teléfono</th>
                                                    <th className="py-3 px-3">Barrio / Sector</th>
                                                    <th className="py-3 px-3">Resultado</th>
                                                    <th className="py-3 px-3 text-center">Acompañantes</th>
                                                    <th className="py-3 px-3">Observaciones / Petición</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700/60">
                                                {auditoriaData.bitacora
                                                    ?.filter(b => filtroBitacora === 'todos' || b.resultado === filtroBitacora)
                                                    ?.filter(b => !searchBitacora || b.votante.toLowerCase().includes(searchBitacora.toLowerCase()) || b.cedula.includes(searchBitacora))
                                                    ?.map(b => (
                                                        <tr key={b.id} className="hover:bg-slate-700/30 transition">
                                                            <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                                                                {new Date(b.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.fecha).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                            </td>
                                                            <td className="py-2.5 px-3 font-semibold text-indigo-300">
                                                                {b.operador}
                                                            </td>
                                                            <td className="py-2.5 px-3">
                                                                <div className="font-bold text-white">{b.votante}</div>
                                                                <div className="text-[10px] text-slate-400 font-mono">CC: {b.cedula}</div>
                                                            </td>
                                                            <td className="py-2.5 px-3 font-mono text-slate-300">
                                                                {b.telefono}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-slate-300">
                                                                {b.barrio_sector}
                                                            </td>
                                                            <td className="py-2.5 px-3">
                                                                {b.resultado === 'asiste_confirmado' && (
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                                                        Confirmado
                                                                    </span>
                                                                )}
                                                                {b.resultado === 'apoya_no_asiste' && (
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40">
                                                                        Apoya (No va)
                                                                    </span>
                                                                )}
                                                                {b.resultado === 'deja_peticion' && (
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/40">
                                                                        Petición
                                                                    </span>
                                                                )}
                                                                {b.resultado === 'no_contesta' && (
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-400">
                                                                        No Contesta
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-center font-bold text-amber-400">
                                                                {b.acompanantes > 0 ? `+${b.acompanantes}` : '-'}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">
                                                                {b.peticion ? (
                                                                    <span className="text-purple-300 italic">Petición: {b.peticion}</span>
                                                                ) : (
                                                                    b.notas || 'Sin notas'
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* SUBTAB 2: LISTA DE PUERTA Y CHECK-IN */}
                            {subTabAuditoria === 'puerta' && (
                                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                                <CheckSquare className="w-5 h-5 text-emerald-400" />
                                                <span>Lista de Puerta y Control de Acceso (Entrada al Evento)</span>
                                            </h3>
                                            <p className="text-xs text-slate-400">
                                                Utiliza esta lista en una tableta o impresa en la entrada del salón para verificar a los asistentes que confirmaron por Call Center.
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => window.print()}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5"
                                        >
                                            <Printer className="w-4 h-4" />
                                            <span>Imprimir Lista de Acceso</span>
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                                                <tr>
                                                    <th className="py-3 px-3">#</th>
                                                    <th className="py-3 px-3">Nombre del Asistente</th>
                                                    <th className="py-3 px-3">Cédula</th>
                                                    <th className="py-3 px-3">Teléfono</th>
                                                    <th className="py-3 px-3">Barrio / Vereda</th>
                                                    <th className="py-3 px-3">Detalle / Acompañantes</th>
                                                    <th className="py-3 px-3 text-center">Firma / Check-In</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700/60">
                                                {auditoriaData.lista_puerta?.map((a, idx) => (
                                                    <tr key={a.id || idx} className="hover:bg-slate-700/30 transition">
                                                        <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                                                        <td className="py-3 px-3 font-bold text-white">{a.nombre_completo}</td>
                                                        <td className="py-3 px-3 font-mono text-slate-300">{a.cedula}</td>
                                                        <td className="py-3 px-3 font-mono text-slate-300">{a.telefono}</td>
                                                        <td className="py-3 px-3 text-slate-300">{a.barrio || a.municipio}</td>
                                                        <td className="py-3 px-3 text-emerald-300 font-semibold">{a.observaciones}</td>
                                                        <td className="py-3 px-3 text-center">
                                                            <div className="w-6 h-6 border-2 border-slate-600 rounded mx-auto cursor-pointer hover:border-emerald-400 flex items-center justify-center">
                                                                {a.asistio && <Check className="w-4 h-4 text-emerald-400" />}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(!auditoriaData.lista_puerta || auditoriaData.lista_puerta.length === 0) && (
                                                    <tr>
                                                        <td colSpan="7" className="py-8 text-center text-slate-400">
                                                            Aún no hay asistentes confirmados registrados en puerta para este evento.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODO 1: GOTV DÍA D (PRESERVADO Y REFORZADO)                                */}
            {/* ========================================================================= */}
            {activeMode === 'gotv' && (
                <div className="space-y-6">
                    {/* Filtros rápidos de cola GOTV */}
                    <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 font-medium">
                                <input
                                    type="checkbox"
                                    checked={soloPendientesGotv}
                                    onChange={e => setSoloPendientesGotv(e.target.checked)}
                                    className="rounded accent-amber-500"
                                />
                                <span>Solo Pendientes Día D (Falta por votar)</span>
                            </label>

                            <input
                                type="text"
                                placeholder="Filtrar por puesto..."
                                value={filterPuestoGotv}
                                onChange={e => setFilterPuestoGotv(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 w-36"
                            />
                        </div>

                        <button
                            onClick={fetchNextVoterGotv}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition"
                        >
                            Siguiente Votante
                        </button>
                    </div>

                    {/* Métricas de Operador GOTV */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                        <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 rounded-xl">
                            <span className="text-xs text-slate-400 block mb-1">Mis Llamadas Hoy</span>
                            <div className="text-2xl font-black text-indigo-400">{statsGotv?.mis_llamadas || 0}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">Total campaña: {statsGotv?.total_llamadas || 0}</div>
                        </div>

                        <div className="bg-emerald-950/40 border border-emerald-500/40 p-3.5 rounded-xl">
                            <span className="text-xs text-emerald-400 block mb-1">Votos Confirmados</span>
                            <div className="text-2xl font-black text-emerald-300">{statsGotv?.confirmados || 0}</div>
                            <div className="text-[10px] text-emerald-400/80 mt-0.5">Compromiso firme</div>
                        </div>

                        <div className="bg-amber-950/40 border border-amber-500/40 p-3.5 rounded-xl">
                            <span className="text-xs text-amber-400 block mb-1">Transportes Generados</span>
                            <div className="text-2xl font-black text-amber-300">{statsGotv?.transporte_solicitado || 0}</div>
                            <div className="text-[10px] text-amber-400/80 mt-0.5">Enviados a flota</div>
                        </div>

                        <div className="bg-blue-950/40 border border-blue-500/40 p-3.5 rounded-xl">
                            <span className="text-xs text-blue-400 block mb-1">Tasa de Efectividad</span>
                            <div className="text-2xl font-black text-blue-300">{statsGotv?.tasa_efectividad_pct || 0}%</div>
                            <div className="text-[10px] text-blue-400/80 mt-0.5">Contactos positivos</div>
                        </div>

                        <div className="bg-purple-950/40 border border-purple-500/40 p-3.5 rounded-xl col-span-2 md:col-span-1">
                            <span className="text-xs text-purple-400 block mb-1">No Contestaron</span>
                            <div className="text-2xl font-black text-purple-300">{statsGotv?.no_contesta || 0}</div>
                            <div className="text-[10px] text-purple-400/80 mt-0.5">Reagendados para tarde</div>
                        </div>
                    </div>

                    {/* Espacio de Llamada Activa GOTV */}
                    {currentVoterGotv ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                                            Votante en Línea (Día D)
                                        </span>
                                        <h2 className="text-xl font-bold text-white mt-1">
                                            {currentVoterGotv.nombres} {currentVoterGotv.apellidos}
                                        </h2>
                                        <span className="text-xs font-mono text-slate-400">CC: {currentVoterGotv.cedula}</span>
                                    </div>

                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                        currentVoterGotv.ha_votado
                                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                            : 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                                    }`}>
                                        {currentVoterGotv.ha_votado ? 'SUFRAGÓ' : 'FALTA POR VOTAR'}
                                    </span>
                                </div>

                                <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-700/60 space-y-2.5 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Puesto de Votación:</span>
                                        <span className="font-bold text-white text-right">{currentVoterGotv.lugar_votacion || 'Principal'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Mesa Asignada:</span>
                                        <span className="font-bold text-amber-400">Mesa {currentVoterGotv.mesa || '1'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Municipio:</span>
                                        <span className="text-slate-200">{currentVoterGotv.municipio} ({currentVoterGotv.departamento})</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Líder Asignado:</span>
                                        <span className="text-indigo-300 font-semibold">{currentVoterGotv.lider_nombre || 'Directo'}</span>
                                    </div>
                                </div>

                                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                                    <a
                                        href={`tel:${getTelefono(currentVoterGotv)}`}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-lg transition"
                                    >
                                        <PhoneCall className="w-4 h-4" />
                                        <span>Llamar ({getTelefono(currentVoterGotv)})</span>
                                    </a>
                                </div>
                            </div>

                            <div className="lg:col-span-7 space-y-4">
                                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                                            <Sparkles className="w-4 h-4" />
                                            <span>Guión Recomendado de Movilización GOTV</span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/60 text-xs text-slate-200 leading-relaxed space-y-2">
                                        <p>
                                            🗣️ <strong>Saludo:</strong> <em>"Hola buenos días/tardes, ¿hablo con {currentVoterGotv.nombres}? Te saluda el equipo de apoyo de la campaña..."</em>
                                        </p>
                                        <p>
                                            🗳️ <strong>Recordatorio de Mesa:</strong> <em>"Te llamamos para recordarte que tu mesa asignada es la <strong>Mesa {currentVoterGotv.mesa || '1'}</strong> en <strong>{currentVoterGotv.lugar_votacion || 'tu puesto habitual'}</strong>."</em>
                                        </p>
                                        <p>
                                            🚖 <strong>Pregunta Clave GOTV:</strong> <em>"¿Ya lograste votar o necesitas que te enviemos un vehículo de apoyo para acercarte al colegio?"</em>
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">Notas u Observación</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Dijo que va a las 2:00 PM con su hermano..."
                                            value={notasGotv}
                                            onChange={e => setNotasGotv(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                                        />
                                    </div>
                                </div>

                                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-3">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                                        Tipificación del Resultado (1 Clic)
                                    </span>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                        <button
                                            onClick={() => handleTipificarGotv('confirmo_voto')}
                                            disabled={submittingAction}
                                            className="p-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95"
                                        >
                                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                            <span>Confirmó Voto Seguro</span>
                                        </button>

                                        <button
                                            onClick={() => handleTipificarGotv('requiere_transporte')}
                                            disabled={submittingAction}
                                            className="p-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95"
                                        >
                                            <Truck className="w-5 h-5 text-amber-400" />
                                            <span>Requiere Transporte</span>
                                        </button>

                                        <button
                                            onClick={() => handleTipificarGotv('indeciso')}
                                            disabled={submittingAction}
                                            className="p-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/50 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95"
                                        >
                                            <AlertCircle className="w-5 h-5 text-blue-400" />
                                            <span>Indeciso / Por Visitar</span>
                                        </button>

                                        <button
                                            onClick={() => handleTipificarGotv('no_contesta')}
                                            disabled={submittingAction}
                                            className="p-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95"
                                        >
                                            <PhoneOff className="w-5 h-5 text-slate-400" />
                                            <span>No Contesta / Buzón</span>
                                        </button>

                                        <button
                                            onClick={() => handleTipificarGotv('numero_equivocado')}
                                            disabled={submittingAction}
                                            className="p-3 bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/50 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95"
                                        >
                                            <RotateCcw className="w-5 h-5 text-orange-400" />
                                            <span>Número Equivocado</span>
                                        </button>

                                        <button
                                            onClick={() => handleTipificarGotv('en_contra')}
                                            disabled={submittingAction}
                                            className="p-3 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/50 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 transition active:scale-95"
                                        >
                                            <PhoneOff className="w-5 h-5 text-red-400" />
                                            <span>En Contra / Oposición</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-12 text-center space-y-3">
                            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                            <h3 className="text-lg font-bold text-white">¡No hay más votantes en cola de llamadas Día D!</h3>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 1: CONFIRMAR ASISTENCIA (+ SELECTOR DE ACOMPAÑANTES)                */}
            {/* ========================================================================= */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                            <h3 className="font-bold text-white text-base flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                <span>Confirmar Asistencia a Encuentro</span>
                            </h3>
                            <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <div className="text-xs text-slate-300 space-y-3">
                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 space-y-1">
                                <div><strong>Ciudadano:</strong> {currentVoterEvento?.nombres} {currentVoterEvento?.apellidos}</div>
                                <div><strong>Evento:</strong> {eventoActual?.titulo}</div>
                                <div><strong>Lugar:</strong> {eventoActual?.lugar_nombre || eventoActual?.direccion}</div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-white mb-2">
                                    ¿Llevará acompañantes? (Familiares o vecinos)
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[0, 1, 2, 3].map(num => (
                                        <button
                                            key={num}
                                            type="button"
                                            onClick={() => setCantidadAcompanantes(num)}
                                            className={`py-2.5 rounded-xl border text-xs font-bold transition ${
                                                cantidadAcompanantes === num
                                                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg'
                                                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-700'
                                            }`}
                                        >
                                            {num === 0 ? 'Solo' : `+${num} pers.`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">
                                    Observaciones / Compromiso especial
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: Llegará a las 6:45 PM..."
                                    value={notasEvento}
                                    onChange={e => setNotasEvento(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-xs"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleTipificarEvento('asiste_confirmado', { acompanantes: cantidadAcompanantes })}
                                disabled={submittingAction}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-lg"
                            >
                                Registrar y Añadir a Puerta
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 2: DEJA PETICIÓN / NECESIDAD COMUNITARIA PARA EL EVENTO              */}
            {/* ========================================================================= */}
            {showPeticionModal && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                            <h3 className="font-bold text-white text-base flex items-center gap-2">
                                <FileText className="w-5 h-5 text-purple-400" />
                                <span>Registrar Petición Comunitaria</span>
                            </h3>
                            <button onClick={() => setShowPeticionModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <div className="text-xs text-slate-300 space-y-3">
                            <p>
                                Si el ciudadano no puede asistir o desea que el candidato/mandatario trate un problema específico de su barrio en la reunión, anótalo aquí:
                            </p>

                            <div>
                                <label className="block text-xs font-semibold text-white mb-1">
                                    Descripción de la Necesidad / Petición *
                                </label>
                                <textarea
                                    rows="3"
                                    required
                                    placeholder="Ej: Faltan luminarias en la carrera 92 y solicitamos poda de árboles..."
                                    value={textoPeticion}
                                    onChange={e => setTextoPeticion(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                            <button
                                onClick={() => setShowPeticionModal(false)}
                                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-xs"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleTipificarEvento('deja_peticion', { peticion: textoPeticion })}
                                disabled={submittingAction || !textoPeticion.trim()}
                                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs shadow-lg"
                            >
                                Guardar Petición y Tipificar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 3: CREAR NUEVO ENCUENTRO COMUNITARIO                                */}
            {/* ========================================================================= */}
            {showCreateEventoModal && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                            <h3 className="font-bold text-white text-base flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-400" />
                                <span>Crear Nuevo Encuentro Comunitario</span>
                            </h3>
                            <button onClick={() => setShowCreateEventoModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleCrearNuevoEvento} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-semibold text-white mb-1">Título del Evento *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Diálogo Ciudadano y Seguridad - Barrio El Prado"
                                    value={nuevoEventoForm.titulo}
                                    onChange={e => setNuevoEventoForm({ ...nuevoEventoForm, titulo: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 mb-1">Fecha *</label>
                                    <input
                                        type="date"
                                        required
                                        value={nuevoEventoForm.fecha}
                                        onChange={e => setNuevoEventoForm({ ...nuevoEventoForm, fecha: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1">Hora de Inicio *</label>
                                    <input
                                        type="time"
                                        required
                                        value={nuevoEventoForm.hora_inicio}
                                        onChange={e => setNuevoEventoForm({ ...nuevoEventoForm, hora_inicio: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 mb-1">Municipio *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: Medellín"
                                        value={nuevoEventoForm.municipio}
                                        onChange={e => setNuevoEventoForm({ ...nuevoEventoForm, municipio: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1">Barrio / Comuna *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: San Javier / Comuna 13"
                                        value={nuevoEventoForm.barrio_vereda}
                                        onChange={e => setNuevoEventoForm({ ...nuevoEventoForm, barrio_vereda: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-400 mb-1">Lugar / Salón *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: Salón Comunal La Esperanza"
                                        value={nuevoEventoForm.lugar_nombre}
                                        onChange={e => setNuevoEventoForm({ ...nuevoEventoForm, lugar_nombre: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 mb-1">Capacidad / Aforo Estimado</label>
                                    <input
                                        type="number"
                                        placeholder="100"
                                        value={nuevoEventoForm.aforo_estimado}
                                        onChange={e => setNuevoEventoForm({ ...nuevoEventoForm, aforo_estimado: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1">Dirección Exacta</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Calle 45 # 12-30"
                                    value={nuevoEventoForm.direccion}
                                    onChange={e => setNuevoEventoForm({ ...nuevoEventoForm, direccion: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateEventoModal(false)}
                                    className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingAction}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg"
                                >
                                    Crear Evento y Comenzar Convocatoria
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 4: PROGRAMAR TRANSPORTE GOTV (DÍA D)                                */}
            {/* ========================================================================= */}
            {showTransporteModal && currentVoterGotv && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                            <h3 className="font-bold text-white text-base flex items-center gap-2">
                                <Truck className="w-5 h-5 text-amber-400" />
                                <span>Confirmar Transporte para Votante</span>
                            </h3>
                            <button onClick={() => setShowTransporteModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <div className="text-xs text-slate-300 space-y-2">
                            <p>Se creará automáticamente una orden de recogida en la central de flota:</p>
                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 space-y-1">
                                <div><strong>Pasajero:</strong> {currentVoterGotv.nombres} {currentVoterGotv.apellidos}</div>
                                <div><strong>Destino:</strong> {currentVoterGotv.lugar_votacion || 'Puesto asignado'}</div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Dirección Exacta de Recogida *</label>
                                <input
                                    type="text"
                                    required
                                    value={direccionRecogida}
                                    onChange={e => setDireccionRecogida(e.target.value)}
                                    placeholder="Calle, número, barrio o punto de referencia..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                            <button
                                onClick={() => setShowTransporteModal(false)}
                                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-xs"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmarTransporteGotv}
                                disabled={submittingAction || !direccionRecogida.trim()}
                                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs shadow-lg"
                            >
                                Confirmar y Despachar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
