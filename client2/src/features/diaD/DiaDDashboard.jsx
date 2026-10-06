import React, { useState, useEffect } from 'react';
import { 
    Vote, Users, Award, FileText, CheckCircle2, Clock, 
    AlertCircle, Search, Filter, Phone, MessageSquare, 
    Camera, RefreshCw, Wifi, WifiOff, Upload, Plus, Eye, ChevronRight, Scale
} from 'lucide-react';
import { API } from '../../config/api';
import { offlineSync } from '../../utils/offlineSync';
import AuditorE14Comparador from './AuditorE14Comparador';

export default function DiaDDashboard() {
    const [activeTab, setActiveTab] = useState('gotv'); // 'gotv', 'escrutinio', 'testigos'
    const [summary, setSummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(true);

    // GOTV State
    const [voters, setVoters] = useState([]);
    const [gotvLoading, setGotvLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterEstado, setFilterEstado] = useState('todos'); // 'todos', 'votaron', 'pendientes'
    const [filterPuesto, setFilterPuesto] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Escrutinio State
    const [mesasReportes, setMesasReportes] = useState([]);
    const [showModalActa, setShowModalActa] = useState(false);
    const [actaForm, setActaForm] = useState({
        puesto_votacion: '',
        mesa: '',
        total_sufragantes: '',
        votos_lista_propia: '',
        votos_candidato_principal: '',
        votos_en_blanco: '',
        votos_nulos: '',
        observaciones: ''
    });
    const [actaFile, setActaFile] = useState(null);
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    // Testigos State
    const [testigos, setTestigos] = useState([]);
    const [showModalTestigo, setShowModalTestigo] = useState(false);
    const [testigoForm, setTestigoForm] = useState({
        nombre: '',
        cedula: '',
        telefono: '',
        puesto_votacion: '',
        mesa: 'TODAS',
        rol: 'testigo_mesa',
        credencial_numero: ''
    });

    // Offline state
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingOffline, setPendingOffline] = useState(offlineSync.getQueue().length);
    const [syncingOffline, setSyncingOffline] = useState(false);

    const token = localStorage.getItem('token');

    // Cargar resumen general
    const fetchSummary = async () => {
        try {
            setLoadingSummary(true);
            const res = await fetch(`${API}/dia-d/summary`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSummary(data);
            }
        } catch (e) {
            console.error('Error fetching summary:', e);
        } finally {
            setLoadingSummary(false);
        }
    };

    // Cargar votantes GOTV
    const fetchVotersGOTV = async (pageNum = 1) => {
        try {
            setGotvLoading(true);
            const queryParams = new URLSearchParams({
                page: pageNum,
                limit: 40,
                estado: filterEstado,
                search: searchQuery,
                puesto: filterPuesto
            });
            const res = await fetch(`${API}/dia-d/voters-gotv?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setVoters(data.votantes || []);
                setTotalPages(data.totalPages || 1);
                setPage(data.currentPage || 1);
            }
        } catch (e) {
            console.error('Error fetching GOTV voters:', e);
        } finally {
            setGotvLoading(false);
        }
    };

    // Cargar actas y reportes de mesa
    const fetchMesasReportes = async () => {
        try {
            const res = await fetch(`${API}/dia-d/mesas-reportes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMesasReportes(data || []);
            }
        } catch (e) {
            console.error('Error fetching mesas reportes:', e);
        }
    };

    // Cargar testigos
    const fetchTestigos = async () => {
        try {
            const res = await fetch(`${API}/dia-d/testigos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTestigos(data || []);
            }
        } catch (e) {
            console.error('Error fetching testigos:', e);
        }
    };

    useEffect(() => {
        fetchSummary();
        fetchVotersGOTV(1);
        fetchMesasReportes();
        fetchTestigos();

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        const handleSynced = (e) => {
            setPendingOffline(0);
            fetchSummary();
            fetchVotersGOTV(page);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('electoral-offline-synced', handleSynced);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('electoral-offline-synced', handleSynced);
        };
    }, []);

    useEffect(() => {
        fetchVotersGOTV(1);
    }, [filterEstado, searchQuery, filterPuesto]);

    // Check-in de voto efectivo (online con fallback offline)
    const handleToggleVote = async (voter) => {
        const nuevoEstado = !voter.ha_votado;

        // Actualizar UI inmediatamente de forma optimista
        setVoters(prev => prev.map(v => v.id === voter.id ? { ...v, ha_votado: nuevoEstado, hora_voto: nuevoEstado ? new Date().toISOString() : null } : v));
        if (summary) {
            setSummary(prev => ({
                ...prev,
                votos_efectivos: nuevoEstado ? prev.votos_efectivos + 1 : Math.max(0, prev.votos_efectivos - 1),
                votos_pendientes: nuevoEstado ? Math.max(0, prev.votos_pendientes - 1) : prev.votos_pendientes + 1
            }));
        }

        if (!navigator.onLine) {
            // Modo Offline: almacenar en cola local
            const qCount = offlineSync.queueCheckIn(voter);
            setPendingOffline(qCount);
            return;
        }

        try {
            const res = await fetch(`${API}/dia-d/voters/${voter.id}/checkin`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ha_votado: nuevoEstado })
            });

            if (!res.ok) {
                // Si falló por red inesperada, encolar offline
                offlineSync.queueCheckIn(voter);
                setPendingOffline(offlineSync.getQueue().length);
            }
        } catch (e) {
            offlineSync.queueCheckIn(voter);
            setPendingOffline(offlineSync.getQueue().length);
        }
    };

    // Sincronizar cola offline manual
    const handleManualSync = async () => {
        setSyncingOffline(true);
        const result = await offlineSync.syncNow(token);
        setSyncingOffline(false);
        if (result.success) {
            setPendingOffline(0);
            fetchSummary();
            fetchVotersGOTV(page);
        }
    };

    // Guardar Acta E-14
    const handleSaveActa = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            Object.keys(actaForm).forEach(key => formData.append(key, actaForm[key]));
            if (actaFile) formData.append('acta_e14', actaFile);

            const res = await fetch(`${API}/dia-d/mesas-reportes`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (res.ok) {
                setShowModalActa(false);
                setActaForm({
                    puesto_votacion: '',
                    mesa: '',
                    total_sufragantes: '',
                    votos_lista_propia: '',
                    votos_candidato_principal: '',
                    votos_en_blanco: '',
                    votos_nulos: '',
                    observaciones: ''
                });
                setActaFile(null);
                fetchMesasReportes();
                fetchSummary();
            } else {
                alert('Error al guardar el acta de escrutinio');
            }
        } catch (e) {
            alert('Error de conexión al enviar el acta');
        }
    };

    // Guardar Testigo
    const handleSaveTestigo = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API}/dia-d/testigos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(testigoForm)
            });

            if (res.ok) {
                setShowModalTestigo(false);
                setTestigoForm({
                    nombre: '',
                    cedula: '',
                    telefono: '',
                    puesto_votacion: '',
                    mesa: 'TODAS',
                    rol: 'testigo_mesa',
                    credencial_numero: ''
                });
                fetchTestigos();
                fetchSummary();
            } else {
                alert('Error al registrar el testigo electoral');
            }
        } catch (e) {
            alert('Error de conexión');
        }
    };

    // Cambiar estado de testigo (en mesa, etc.)
    const handleToggleTestigoEstado = async (id, currentEstado) => {
        const nuevoEstado = currentEstado === 'en_mesa' ? 'confirmado' : 'en_mesa';
        try {
            await fetch(`${API}/dia-d/testigos/${id}/estado`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            fetchTestigos();
            fetchSummary();
        } catch (e) {}
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
            {/* Header Estratégico Día D */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-red-600 rounded-xl shadow-lg shadow-red-500/20">
                            <Vote className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-slate-100 to-amber-400 bg-clip-text text-transparent">
                                Sala de Control Operación Día D
                            </h1>
                            <p className="text-xs md:text-sm text-slate-400">
                                Monitoreo electoral en tiempo real, movilización GOTV, testigos y escrutinio rápido E-14
                            </p>
                        </div>
                    </div>
                </div>

                {/* Banner de Conectividad & Sync Offline */}
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                        isOnline ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' : 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                    }`}>
                        {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                        <span>{isOnline ? 'En Línea (Contabo)' : 'Modo Offline (Campo)'}</span>
                    </div>

                    {pendingOffline > 0 && (
                        <button
                            onClick={handleManualSync}
                            disabled={syncingOffline || !isOnline}
                            className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs shadow-md transition disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${syncingOffline ? 'animate-spin' : ''}`} />
                            <span>Sincronizar ({pendingOffline})</span>
                        </button>
                    )}

                    <button
                        onClick={() => { fetchSummary(); fetchVotersGOTV(page); }}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                        title="Refrescar datos"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Tarjetas Métricas Clave */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
                <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl shadow-lg backdrop-blur">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                        <span>Meta Votantes</span>
                        <Users className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-2xl font-black text-white">
                        {summary?.meta_votantes?.toLocaleString() || 0}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Total censo comprometido</div>
                </div>

                <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-xl shadow-lg backdrop-blur">
                    <div className="flex items-center justify-between text-emerald-400 text-xs font-medium mb-1">
                        <span>Votos Efectivos (GOTV)</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-emerald-300">
                        {summary?.votos_efectivos?.toLocaleString() || 0}
                    </div>
                    <div className="text-[11px] text-emerald-400/80 mt-1 font-semibold">
                        {summary?.porcentaje_participacion || 0}% de participación
                    </div>
                </div>

                <div className="bg-amber-950/40 border border-amber-500/40 p-4 rounded-xl shadow-lg backdrop-blur">
                    <div className="flex items-center justify-between text-amber-400 text-xs font-medium mb-1">
                        <span>Votos Pendientes</span>
                        <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-black text-amber-300">
                        {summary?.votos_pendientes?.toLocaleString() || 0}
                    </div>
                    <div className="text-[11px] text-amber-400/80 mt-1">Por sufragar en las mesas</div>
                </div>

                <div className="bg-purple-950/40 border border-purple-500/40 p-4 rounded-xl shadow-lg backdrop-blur">
                    <div className="flex items-center justify-between text-purple-400 text-xs font-medium mb-1">
                        <span>Escrutinio E-14 Propio</span>
                        <Award className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-black text-purple-300">
                        {summary?.escrutinio?.votos_propios_total?.toLocaleString() || 0}
                    </div>
                    <div className="text-[11px] text-purple-400/80 mt-1">
                        {summary?.escrutinio?.mesas_escrutadas || 0} mesas verificadas
                    </div>
                </div>
            </div>

            {/* Pestañas de Navegación Operativa */}
            <div className="flex border-b border-slate-800 mb-6 gap-2">
                <button
                    onClick={() => setActiveTab('gotv')}
                    className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold border-b-2 transition ${
                        activeTab === 'gotv'
                            ? 'border-amber-500 text-amber-400 bg-slate-800/40 rounded-t-lg'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>1. Monitor GOTV (Voto Efectivo)</span>
                </button>

                <button
                    onClick={() => setActiveTab('escrutinio')}
                    className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold border-b-2 transition ${
                        activeTab === 'escrutinio'
                            ? 'border-amber-500 text-amber-400 bg-slate-800/40 rounded-t-lg'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    <span>2. Escrutinio Rápido y Actas E-14</span>
                </button>

                <button
                    onClick={() => setActiveTab('testigos')}
                    className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold border-b-2 transition ${
                        activeTab === 'testigos'
                            ? 'border-amber-500 text-amber-400 bg-slate-800/40 rounded-t-lg'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    <span>3. Red de Testigos</span>
                </button>

                <button
                    onClick={() => setActiveTab('auditoria')}
                    className={`flex items-center gap-2 py-3 px-5 text-sm font-semibold border-b-2 transition ${
                        activeTab === 'auditoria'
                            ? 'border-rose-500 text-rose-400 bg-slate-800/40 rounded-t-lg'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <Scale className="w-4 h-4 text-rose-400" />
                    <span>4. Auditor E-14 vs. Registraduría</span>
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        Escrutinio
                    </span>
                </button>
            </div>

            {/* TAB 1: MONITOR GOTV */}
            {activeTab === 'gotv' && (
                <div className="space-y-4">
                    {/* Filtros */}
                    <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 flex flex-wrap gap-3 items-center justify-between">
                        <div className="flex flex-wrap gap-3 items-center flex-1">
                            <div className="relative min-w-[240px] flex-1">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                <input
                                    type="text"
                                    placeholder="Buscar por cédula o nombre..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <select
                                value={filterEstado}
                                onChange={(e) => setFilterEstado(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                            >
                                <option value="todos">Todos los Estados</option>
                                <option value="pendientes">⏳ Faltan por Votar</option>
                                <option value="votaron">✅ Ya Votaron</option>
                            </select>

                            <input
                                type="text"
                                placeholder="Filtrar por puesto..."
                                value={filterPuesto}
                                onChange={(e) => setFilterPuesto(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                            />
                        </div>

                        <div className="text-xs text-slate-400">
                            Mostrando {voters.length} registros
                        </div>
                    </div>

                    {/* Tabla de Votantes GOTV */}
                    <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 border-b border-slate-700">
                                    <tr>
                                        <th className="py-3 px-4">Estado Día D</th>
                                        <th className="py-3 px-4">Votante</th>
                                        <th className="py-3 px-4">Cédula</th>
                                        <th className="py-3 px-4">Puesto y Mesa</th>
                                        <th className="py-3 px-4">Líder Asignado</th>
                                        <th className="py-3 px-4 text-center">Acciones Movilización</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {voters.map((v) => (
                                        <tr key={v.id} className="hover:bg-slate-700/30 transition">
                                            <td className="py-3 px-4">
                                                <button
                                                    onClick={() => handleToggleVote(v)}
                                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition shadow-sm ${
                                                        v.ha_votado
                                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'
                                                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                                                    }`}
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>{v.ha_votado ? 'SUFRAGÓ' : 'PENDIENTE'}</span>
                                                </button>
                                                {v.hora_voto && (
                                                    <div className="text-[10px] text-slate-400 mt-1">
                                                        {new Date(v.hora_voto).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 font-semibold text-white">
                                                {v.nombres} {v.apellidos}
                                            </td>
                                            <td className="py-3 px-4 text-slate-300 font-mono">
                                                {v.cedula}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="text-white font-medium">{v.lugar_votacion || 'Sin puesto'}</div>
                                                <div className="text-xs text-amber-400">Mesa: {v.mesa || '1'}</div>
                                            </td>
                                            <td className="py-3 px-4 text-slate-300">
                                                {v.lider_nombre || 'Directo'}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {!v.ha_votado && (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <a
                                                            href={`https://wa.me/?text=Hola%20${encodeURIComponent(v.nombres)},%20te%20recordamos%20que%20tu%20mesa%20de%20votaci%C3%B3n%20es%20la%20${encodeURIComponent(v.mesa || '1')}%20en%20el%20puesto%20${encodeURIComponent(v.lugar_votacion || 'asignado')}.%20%C2%A1Te%20esperamos!`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded-lg border border-emerald-500/40 text-xs flex items-center gap-1 transition"
                                                            title="Enviar recordatorio WhatsApp"
                                                        >
                                                            <MessageSquare className="w-3.5 h-3.5" />
                                                            <span>Avisar</span>
                                                        </a>
                                                    </div>
                                                )}
                                                {v.ha_votado && (
                                                    <span className="text-xs text-emerald-400 font-medium">Voto Verificado</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {voters.length === 0 && !gotvLoading && (
                                        <tr>
                                            <td colSpan="6" className="py-8 text-center text-slate-400">
                                                No se encontraron votantes con los filtros seleccionados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        <div className="p-4 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
                            <span>Página {page} de {totalPages}</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1 bg-slate-900 border border-slate-700 rounded hover:bg-slate-700 disabled:opacity-40"
                                >
                                    Anterior
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-1 bg-slate-900 border border-slate-700 rounded hover:bg-slate-700 disabled:opacity-40"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: ESCRUTINIO RÁPIDO Y ACTAS E-14 */}
            {activeTab === 'escrutinio' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-800/60 p-4 rounded-xl border border-slate-700">
                        <div>
                            <h2 className="text-lg font-bold text-white">Preconteo Inmediato de Mesas (Actas E-14)</h2>
                            <p className="text-xs text-slate-400">Digitalización y validación fotográfica antes del reporte oficial</p>
                        </div>
                        <button
                            onClick={() => setShowModalActa(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-sm shadow-lg transition"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Reportar Mesa E-14</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {mesasReportes.map(r => (
                            <div key={r.id} className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 shadow-lg space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-white text-base">{r.puesto_votacion}</h3>
                                        <div className="text-xs font-semibold text-amber-400">Mesa: {r.mesa}</div>
                                    </div>
                                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded text-[11px] font-bold">
                                        Escrutada
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
                                    <div>
                                        <span className="text-slate-400 block">Votos Lista Propia:</span>
                                        <span className="text-base font-black text-amber-400">{r.votos_lista_propia}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">Candidato Principal:</span>
                                        <span className="text-base font-black text-white">{r.votos_candidato_principal}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">En Blanco:</span>
                                        <span className="font-semibold text-slate-200">{r.votos_en_blanco}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block">Votos Nulos:</span>
                                        <span className="font-semibold text-slate-200">{r.votos_nulos}</span>
                                    </div>
                                </div>

                                {r.acta_e14_url && (
                                    <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                                        <button
                                            onClick={() => setSelectedPhoto(`${API.replace('/api', '')}${r.acta_e14_url}`)}
                                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>Ver Foto Acta E-14</span>
                                        </button>
                                        <span className="text-[10px] text-slate-400">Adjunta</span>
                                    </div>
                                )}
                            </div>
                        ))}
                        {mesasReportes.length === 0 && (
                            <div className="col-span-3 py-12 text-center text-slate-400 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                                No se han reportado mesas aún. Haz clic en "Reportar Mesa E-14" para iniciar el preconteo.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: TESTIGOS ELECTORALES */}
            {activeTab === 'testigos' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-800/60 p-4 rounded-xl border border-slate-700">
                        <div>
                            <h2 className="text-lg font-bold text-white">Despliegue y Cobertura de Testigos</h2>
                            <p className="text-xs text-slate-400">Asegura la presencia y control de mesa para la defensa del voto</p>
                        </div>
                        <button
                            onClick={() => setShowModalTestigo(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-sm shadow-lg transition"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Registrar Testigo</span>
                        </button>
                    </div>

                    <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 border-b border-slate-700">
                                    <tr>
                                        <th className="py-3 px-4">Testigo</th>
                                        <th className="py-3 px-4">Cédula</th>
                                        <th className="py-3 px-4">Teléfono</th>
                                        <th className="py-3 px-4">Puesto Asignado</th>
                                        <th className="py-3 px-4">Mesa</th>
                                        <th className="py-3 px-4">Credencial</th>
                                        <th className="py-3 px-4">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {testigos.map(t => (
                                        <tr key={t.id} className="hover:bg-slate-700/30 transition">
                                            <td className="py-3 px-4 font-semibold text-white">{t.nombre}</td>
                                            <td className="py-3 px-4 font-mono">{t.cedula}</td>
                                            <td className="py-3 px-4 text-slate-300">{t.telefono || 'Sin tel'}</td>
                                            <td className="py-3 px-4 text-white font-medium">{t.puesto_votacion}</td>
                                            <td className="py-3 px-4 text-amber-400 font-bold">{t.mesa}</td>
                                            <td className="py-3 px-4 font-mono text-xs">{t.credencial_numero || 'Sin asignar'}</td>
                                            <td className="py-3 px-4">
                                                <button
                                                    onClick={() => handleToggleTestigoEstado(t.id, t.estado)}
                                                    className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                                                        t.estado === 'en_mesa'
                                                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                                                            : 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                                                    }`}
                                                >
                                                    {t.estado === 'en_mesa' ? '🟢 EN MESA' : '🟡 ASIGNADO'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {testigos.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="py-8 text-center text-slate-400">
                                                No hay testigos registrados. Asigna testigos para cubrir todos los puestos.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: COMPARADOR AUDITOR E-14 VS REGISTRADURÍA */}
            {activeTab === 'auditoria' && (
                <AuditorE14Comparador campaignId={summary?.campana_id} />
            )}

            {/* MODAL REPORTAR ACTA E-14 */}
            {showModalActa && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-amber-400" />
                                <span>Reporte de Mesa y Acta E-14</span>
                            </h3>
                            <button onClick={() => setShowModalActa(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleSaveActa} className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Puesto de Votación *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: Colegio Central"
                                        value={actaForm.puesto_votacion}
                                        onChange={e => setActaForm({ ...actaForm, puesto_votacion: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Mesa *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej: 14"
                                        value={actaForm.mesa}
                                        onChange={e => setActaForm({ ...actaForm, mesa: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Votos Lista Propia *</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="0"
                                        value={actaForm.votos_lista_propia}
                                        onChange={e => setActaForm({ ...actaForm, votos_lista_propia: e.target.value })}
                                        className="w-full bg-slate-900 border border-amber-500/50 rounded-lg p-2 text-amber-400 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Candidato Principal</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={actaForm.votos_candidato_principal}
                                        onChange={e => setActaForm({ ...actaForm, votos_candidato_principal: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">En Blanco</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={actaForm.votos_en_blanco}
                                        onChange={e => setActaForm({ ...actaForm, votos_en_blanco: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Nulos</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={actaForm.votos_nulos}
                                        onChange={e => setActaForm({ ...actaForm, votos_nulos: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Sufragantes</label>
                                    <input
                                        type="number"
                                        placeholder="Total"
                                        value={actaForm.total_sufragantes}
                                        onChange={e => setActaForm({ ...actaForm, total_sufragantes: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Foto del Acta E-14 (Evidencia)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setActaFile(e.target.files[0])}
                                    className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-slate-200 hover:file:bg-slate-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Observaciones</label>
                                <textarea
                                    rows="2"
                                    placeholder="Novedades o reclamaciones en mesa..."
                                    value={actaForm.observaciones}
                                    onChange={e => setActaForm({ ...actaForm, observaciones: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModalActa(false)}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-lg"
                                >
                                    Guardar Acta
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL REGISTRAR TESTIGO */}
            {showModalTestigo && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-amber-400" />
                                <span>Registrar Testigo Electoral</span>
                            </h3>
                            <button onClick={() => setShowModalTestigo(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleSaveTestigo} className="space-y-3 text-sm">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Nombre Completo *</label>
                                <input
                                    type="text"
                                    required
                                    value={testigoForm.nombre}
                                    onChange={e => setTestigoForm({ ...testigoForm, nombre: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Cédula *</label>
                                    <input
                                        type="text"
                                        required
                                        value={testigoForm.cedula}
                                        onChange={e => setTestigoForm({ ...testigoForm, cedula: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Teléfono</label>
                                    <input
                                        type="text"
                                        value={testigoForm.telefono}
                                        onChange={e => setTestigoForm({ ...testigoForm, telefono: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Puesto de Votación *</label>
                                    <input
                                        type="text"
                                        required
                                        value={testigoForm.puesto_votacion}
                                        onChange={e => setTestigoForm({ ...testigoForm, puesto_votacion: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Mesa</label>
                                    <input
                                        type="text"
                                        value={testigoForm.mesa}
                                        onChange={e => setTestigoForm({ ...testigoForm, mesa: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">N° de Credencial Electoral</label>
                                <input
                                    type="text"
                                    value={testigoForm.credencial_numero}
                                    onChange={e => setTestigoForm({ ...testigoForm, credencial_numero: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModalTestigo(false)}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-lg"
                                >
                                    Asignar Testigo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VISOR DE FOTO ACTA */}
            {selectedPhoto && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
                    <div className="relative max-w-3xl max-h-[90vh]">
                        <img src={selectedPhoto} alt="Acta E-14" className="rounded-xl max-h-[85vh] object-contain shadow-2xl border border-slate-700" />
                        <button
                            onClick={() => setSelectedPhoto(null)}
                            className="absolute top-2 right-2 bg-black/70 text-white p-2 rounded-full hover:bg-black"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
