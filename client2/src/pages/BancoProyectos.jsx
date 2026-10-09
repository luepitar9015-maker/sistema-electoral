import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Briefcase, ShieldCheck, AlertTriangle, FileText, CheckCircle2,
    XCircle, Upload, Sparkles, Building2, Landmark, RefreshCw,
    Download, Copy, ExternalLink, ChevronRight, Filter, Search,
    Layers, Plus, Trash2, ArrowUpRight, FileCheck, Check, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCampaign } from '../context/CampaignContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const SECTORES_INFO = {
    transporte_vias: { label: 'Vías y Transporte', icon: '🛣️', color: 'from-amber-500 to-orange-600', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    agua_saneamiento: { label: 'Agua Potable y Saneamiento', icon: '💧', color: 'from-blue-500 to-cyan-600', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    agricultura_rural: { label: 'Agro y Riego Rural', icon: '🌾', color: 'from-emerald-500 to-green-600', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    seguridad_convivencia: { label: 'Seguridad FONSECON', icon: '🛡️', color: 'from-purple-500 to-indigo-600', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    deporte_recreacion: { label: 'Deporte y Parques', icon: '⚽', color: 'from-rose-500 to-pink-600', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    salud: { label: 'Salud y Dotación', icon: '🏥', color: 'from-red-500 to-rose-600', badge: 'bg-red-500/20 text-red-300 border-red-500/30' },
    educacion: { label: 'Educación e Infraestructura', icon: '🎓', color: 'from-sky-500 to-blue-600', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
    tic_conectividad: { label: 'Conectividad TIC', icon: '📡', color: 'from-teal-500 to-emerald-600', badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30' }
};

const RIESGO_BADGES = {
    bajo: { label: 'Riesgo Bajo (Alta Viabilidad)', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', dot: 'bg-emerald-400' },
    medio: { label: 'Riesgo Medio (Subsanable)', bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', dot: 'bg-yellow-400' },
    alto: { label: 'Riesgo Alto (Incompleto)', bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40', dot: 'bg-orange-400' },
    critico: { label: 'Riesgo Crítico (Devolución Segura)', bg: 'bg-red-500/20 text-red-300 border-red-500/40', dot: 'bg-red-500' }
};

export default function BancoProyectos() {
    const { user } = useAuth();
    const { activeCampaign } = useCampaign();
    const token = localStorage.getItem('token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    const [proyectos, setProyectos] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Filtros
    const [filtroSector, setFiltroSector] = useState('TODOS');
    const [filtroEstado, setFiltroEstado] = useState('TODOS');
    const [busqueda, setBusqueda] = useState('');

    // Modales de Trabajo
    const [modalAuditoria, setModalAuditoria] = useState(null); // Proyecto en auditoría
    const [modalMGA, setModalMGA] = useState(null); // Proyecto en formulación MGA
    const [modalCartas, setModalCartas] = useState(null); // Proyecto para cartas
    const [cartasGeneradas, setCartasGeneradas] = useState(null);
    const [cartaActivaTab, setCartaActivaTab] = useState('presentacion'); // 'presentacion', 'pdm', 'sostenibilidad'
    const [copiado, setCopiado] = useState(false);

    // Modal Crear Proyecto Directo
    const [modalCrear, setModalCrear] = useState(false);
    const [nuevoForm, setNuevoForm] = useState({
        titulo: '',
        sector: 'transporte_vias',
        ministerio_objetivo: 'MinTransporte / Invías',
        linea_convocatoria: 'Caminos Comunitarios de la Paz Total',
        entidad_postulante_tipo: 'alcaldia',
        departamento: activeCampaign?.departamento || 'SANTANDER',
        municipio: activeCampaign?.municipio || 'BUCARAMANGA',
        zona_localidad: '',
        poblacion_beneficiada: 250,
        costo_estimado_total: 800000000
    });

    // Modal Agrupar desde Necesidades
    const [modalAgrupar, setModalAgrupar] = useState(false);
    const [necesidadesDisponibles, setNecesidadesDisponibles] = useState([]);
    const [necesidadesSeleccionadas, setNecesidadesSeleccionadas] = useState([]);
    const [agruparTitulo, setAgruparTitulo] = useState('');
    const [agruparSector, setAgruparSector] = useState('transporte_vias');
    const [guardandoAgrupacion, setGuardandoAgrupacion] = useState(false);

    // Estado de subida de archivo en auditoría
    const [archivoSubir, setArchivoSubir] = useState(null);
    const [tipoDocSubir, setTipoDocSubir] = useState('');
    const [subiendoDoc, setSubiendoDoc] = useState(false);
    const [auditoriaLoading, setAuditoriaLoading] = useState(false);
    const [mgaLoading, setMgaLoading] = useState(false);

    // Cargar Proyectos y Estadísticas
    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeCampaign?.id) params.append('campana_id', activeCampaign.id);
            if (filtroSector !== 'TODOS') params.append('sector', filtroSector);
            if (filtroEstado !== 'TODOS') params.append('estado', filtroEstado);
            if (busqueda.trim()) params.append('search', busqueda.trim());

            const [resProy, resStats] = await Promise.all([
                axios.get(`${API}/proyectos?${params.toString()}`, authHeaders),
                axios.get(`${API}/proyectos/stats/resumen?campana_id=${activeCampaign?.id || ''}`, authHeaders)
            ]);

            setProyectos(resProy.data);
            setStats(resStats.data);
        } catch (error) {
            console.error('Error al cargar banco de proyectos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeCampaign?.id, filtroSector, filtroEstado]);

    // Abrir Modal de Necesidades Comunitarias
    const handleAbrirAgrupar = async () => {
        try {
            const res = await axios.get(`${API}/necesidades?estado=reportada`, authHeaders);
            setNecesidadesDisponibles(res.data || []);
            setNecesidadesSeleccionadas([]);
            setAgruparTitulo('');
            setModalAgrupar(true);
        } catch (e) {
            console.error('Error al cargar necesidades:', e);
        }
    };

    const toggleSeleccionNecesidad = (id) => {
        setNecesidadesSeleccionadas(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleConfirmarAgrupacion = async () => {
        if (necesidadesSeleccionadas.length === 0) {
            alert('Debes seleccionar al menos una necesidad comunitaria.');
            return;
        }
        setGuardandoAgrupacion(true);
        try {
            const res = await axios.post(`${API}/proyectos/agrupar-necesidades`, {
                necesidadIds: necesidadesSeleccionadas,
                titulo: agruparTitulo.trim() || undefined,
                sector: agruparSector,
                campana_id: activeCampaign?.id
            }, authHeaders);

            alert('¡Proyecto estructurado exitosamente desde las necesidades de la comunidad!');
            setModalAgrupar(false);
            fetchData();
            // Abrir auditoría de inmediato para orientar al usuario
            if (res.data?.proyecto) {
                abrirAuditoria(res.data.proyecto.id);
            }
        } catch (e) {
            alert(e.response?.data?.message || 'Error al estructurar proyecto');
        } finally {
            setGuardandoAgrupacion(false);
        }
    };

    // Crear Proyecto Manual
    const handleCrearProyecto = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API}/proyectos`, {
                ...nuevoForm,
                campana_id: activeCampaign?.id
            }, authHeaders);
            alert('Proyecto registrado en el banco de proyectos.');
            setModalCrear(false);
            fetchData();
        } catch (error) {
            alert('Error al crear proyecto: ' + (error.response?.data?.message || error.message));
        }
    };

    // Abrir Auditoría Anti-Devolución
    const abrirAuditoria = async (proyectoId) => {
        setAuditoriaLoading(true);
        try {
            const res = await axios.get(`${API}/proyectos/${proyectoId}`, authHeaders);
            setModalAuditoria(res.data);
        } catch (e) {
            alert('Error al cargar proyecto: ' + e.message);
        } finally {
            setAuditoriaLoading(false);
        }
    };

    // Re-ejecutar auditoría en vivo
    const reevaluarAuditoria = async () => {
        if (!modalAuditoria) return;
        setAuditoriaLoading(true);
        try {
            const res = await axios.post(`${API}/proyectos/${modalAuditoria.id}/auditar-viabilidad`, {}, authHeaders);
            setModalAuditoria(prev => ({
                ...prev,
                score_antidevolucion: res.data.score,
                riesgo_devolucion: res.data.riesgo,
                estado: res.data.estado,
                dictamen_auditoria: res.data.dictamen,
                checklist_requisitos_json: JSON.stringify(res.data.checklist)
            }));
            fetchData();
        } catch (e) {
            alert('Error al reevaluar auditoría');
        } finally {
            setAuditoriaLoading(false);
        }
    };

    // Cambiar estado de un ítem de checklist
    const toggleChecklistItem = async (itemId) => {
        if (!modalAuditoria) return;
        let checklist = [];
        try {
            checklist = JSON.parse(modalAuditoria.checklist_requisitos_json || '[]');
        } catch (e) {
            checklist = [];
        }

        const updated = checklist.map(item => {
            if (item.id === itemId) {
                return { ...item, cumplido: !item.cumplido, observacion: !item.cumplido ? 'Marcado como verificado por el estructurador.' : 'Pendiente por subsanar.' };
            }
            return item;
        });

        try {
            const res = await axios.put(`${API}/proyectos/${modalAuditoria.id}/checklist`, { checklist: updated }, authHeaders);
            setModalAuditoria(prev => ({
                ...prev,
                score_antidevolucion: res.data.score,
                riesgo_devolucion: res.data.riesgo,
                estado: res.data.estado,
                dictamen_auditoria: res.data.dictamen,
                checklist_requisitos_json: JSON.stringify(res.data.checklist)
            }));
            fetchData();
        } catch (e) {
            alert('Error al actualizar checklist');
        }
    };

    // Subir documento de soporte técnico
    const handleSubirDoc = async (e) => {
        e.preventDefault();
        if (!archivoSubir || !modalAuditoria) return;
        setSubiendoDoc(true);
        try {
            const formData = new FormData();
            formData.append('archivo', archivoSubir);
            formData.append('tipo_documento', tipoDocSubir || 'otro');

            await axios.post(`${API}/proyectos/${modalAuditoria.id}/documentos`, formData, {
                headers: {
                    ...authHeaders.headers,
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert('¡Documento técnico adjuntado y validado exitosamente!');
            setArchivoSubir(null);
            setTipoDocSubir('');
            abrirAuditoria(modalAuditoria.id);
            fetchData();
        } catch (err) {
            alert('Error al subir documento: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubiendoDoc(false);
        }
    };

    // Eliminar documento
    const handleEliminarDoc = async (docId) => {
        if (!window.confirm('¿Seguro que deseas retirar este documento del expediente?')) return;
        try {
            await axios.delete(`${API}/proyectos/documentos/${docId}`, authHeaders);
            abrirAuditoria(modalAuditoria.id);
            fetchData();
        } catch (e) {
            alert('Error al eliminar documento');
        }
    };

    // Formulación MGA con IA
    const abrirMGA = async (proyectoId) => {
        try {
            const res = await axios.get(`${API}/proyectos/${proyectoId}`, authHeaders);
            setModalMGA(res.data);
        } catch (e) {
            alert('Error al cargar proyecto para MGA');
        }
    };

    const generarMGA_IA = async () => {
        if (!modalMGA) return;
        setMgaLoading(true);
        try {
            const res = await axios.post(`${API}/proyectos/${modalMGA.id}/formular-mga`, {}, authHeaders);
            setModalMGA(res.data.proyecto);
            alert('¡Formulación metodológica MGA generada con éxito con IA!');
            fetchData();
        } catch (e) {
            alert('Error formulando MGA con IA: ' + e.message);
        } finally {
            setMgaLoading(false);
        }
    };

    // Generar Cartas Oficiales
    const abrirCartas = async (proyecto) => {
        setModalCartas(proyecto);
        try {
            const res = await axios.post(`${API}/proyectos/${proyecto.id}/cartas-radicacion`, {
                nombre_alcalde: activeCampaign?.candidato || 'ALCALDE / MANDATARIO MUNICIPAL'
            }, authHeaders);
            setCartasGeneradas(res.data);
        } catch (e) {
            alert('Error al generar cartas oficiales');
        }
    };

    const copiarTextoCarta = (texto) => {
        navigator.clipboard.writeText(texto);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Encabezado y Métricas Principales */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl border border-slate-700/80 shadow-2xl">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-2">
                            <Landmark className="w-3.5 h-3.5" />
                            Gestión Territorial & Consecución de Recursos Nacionales
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                            <Briefcase className="w-8 h-8 text-emerald-400" />
                            Banco de Proyectos de Inversión Pública
                        </h1>
                        <p className="text-slate-300 text-sm mt-1 max-w-3xl">
                            Transforma las necesidades comunitarias en <strong>proyectos bancables con Metodología MGA (DNP)</strong>.
                            Audita y blinda tus expedientes técnicos para <strong>evitar devoluciones en los Ministerios y el Sistema General de Regalías</strong>.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={handleAbrirAgrupar}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/40 transition-all cursor-pointer"
                        >
                            <Sparkles className="w-4 h-4 text-emerald-200" />
                            Estructurar desde Necesidades
                        </button>

                        <button
                            onClick={() => setModalCrear(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-xl text-sm font-medium transition-all cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            Nuevo Proyecto
                        </button>
                    </div>
                </div>

                {/* Tarjetas KPI */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 flex items-center justify-between">
                        <div>
                            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Cartera de Proyectos</span>
                            <div className="text-2xl font-black text-white mt-1">{stats?.totalProyectos || 0}</div>
                            <span className="text-[11px] text-slate-400">Iniciativas en estructuración</span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between p-3 text-blue-400">
                            <Layers className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 flex items-center justify-between">
                        <div>
                            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Monto Solicitado a Nación</span>
                            <div className="text-xl font-black text-emerald-400 mt-1">
                                ${((stats?.montoNacionSolicitado || 0) / 1000000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} M
                            </div>
                            <span className="text-[11px] text-slate-400">Cofinanciación Ministerios / SGR</span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between p-3 text-emerald-400">
                            <Landmark className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 flex items-center justify-between">
                        <div>
                            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Score Anti-Devolución</span>
                            <div className="text-2xl font-black text-amber-400 mt-1 flex items-baseline gap-1">
                                {stats?.promedioScore || 0}%
                                <span className="text-xs font-normal text-slate-400">madurez</span>
                            </div>
                            <div className="w-28 bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full" style={{ width: `${stats?.promedioScore || 0}%` }}></div>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between p-3 text-amber-400">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 flex items-center justify-between">
                        <div>
                            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Listos para Radicar</span>
                            <div className="text-2xl font-black text-indigo-400 mt-1">{stats?.listosRadicar || 0}</div>
                            <span className="text-[11px] text-emerald-400 font-medium">Con alta viabilidad previa</span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between p-3 text-indigo-400">
                            <FileCheck className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[240px]">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                            type="text"
                            placeholder="Buscar proyecto, municipio, BPIN..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                            className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    <select
                        value={filtroSector}
                        onChange={(e) => setFiltroSector(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="TODOS">Todos los Sectores</option>
                        {Object.entries(SECTORES_INFO).map(([key, info]) => (
                            <option key={key} value={key}>{info.icon} {info.label}</option>
                        ))}
                    </select>

                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
                    >
                        <option value="TODOS">Todos los Estados</option>
                        <option value="idea_perfil">Idea / Perfil Preliminar</option>
                        <option value="formulacion_mga">Formulación MGA (DNP)</option>
                        <option value="revision_antidevolucion">Revisión Anti-Devolución</option>
                        <option value="listo_radicar">Listo para Radicar</option>
                        <option value="radicado_ventanilla">Radicado en Ministerio</option>
                    </select>
                </div>

                <button
                    onClick={fetchData}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-700/60 hover:bg-slate-700 rounded-lg border border-slate-600 transition-all cursor-pointer"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Actualizar
                </button>
            </div>

            {/* Listado de Proyectos */}
            {loading ? (
                <div className="text-center py-16">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Cargando Banco de Proyectos de Inversión...</p>
                </div>
            ) : proyectos.length === 0 ? (
                <div className="bg-slate-800/40 border border-dashed border-slate-700 rounded-2xl p-12 text-center">
                    <Briefcase className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-white">No hay proyectos registrados con los filtros aplicados</h3>
                    <p className="text-slate-400 text-sm max-w-md mx-auto mt-1 mb-6">
                        Comienza consolidando las demandas ciudadanas que tienes en el Banco de Necesidades para convertirlas en proyectos para ministerios.
                    </p>
                    <button
                        onClick={handleAbrirAgrupar}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/40 transition-all cursor-pointer"
                    >
                        <Sparkles className="w-4 h-4" />
                        Estructurar Proyecto desde Necesidades
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {proyectos.map((proyecto) => {
                        const secInfo = SECTORES_INFO[proyecto.sector] || SECTORES_INFO.transporte_vias;
                        const riesgoInfo = RIESGO_BADGES[proyecto.riesgo_devolucion] || RIESGO_BADGES.alto;
                        const score = proyecto.score_antidevolucion || 0;

                        return (
                            <div
                                key={proyecto.id}
                                className="bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between"
                            >
                                <div>
                                    {/* Cabecera de la tarjeta */}
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${secInfo.badge}`}>
                                                {secInfo.icon} {secInfo.label}
                                            </span>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${riesgoInfo.bg}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${riesgoInfo.dot}`} />
                                                {riesgoInfo.label}
                                            </span>
                                        </div>

                                        <span className="text-xs font-mono bg-slate-900 text-slate-400 px-2 py-1 rounded border border-slate-700">
                                            {proyecto.codigo_bpin || `ID #${proyecto.id}`}
                                        </span>
                                    </div>

                                    {/* Título y Territorio */}
                                    <h3 className="text-base font-bold text-white leading-snug hover:text-emerald-400 transition-colors">
                                        {proyecto.titulo}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                        <span>📍 {proyecto.municipio} ({proyecto.departamento})</span>
                                        {proyecto.zona_localidad && <span>• {proyecto.zona_localidad}</span>}
                                        <span>• 👥 {Number(proyecto.poblacion_beneficiada).toLocaleString('es-CO')} beneficiarios</span>
                                    </p>

                                    {/* Ministerio y Convocatoria */}
                                    <div className="mt-3 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Entidad Destino:</span>
                                            <span className="font-semibold text-emerald-400">{proyecto.ministerio_objetivo}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Convocatoria:</span>
                                            <span className="font-medium text-slate-200">{proyecto.linea_convocatoria || 'Ventanilla Ordinaria'}</span>
                                        </div>
                                    </div>

                                    {/* Presupuesto y Score Anti-Devolución */}
                                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-700/60">
                                        <div>
                                            <span className="text-[11px] text-slate-400">Cofinanciación Nación:</span>
                                            <div className="text-sm font-black text-white">
                                                ${Number(proyecto.monto_solicitado_nacion || 0).toLocaleString('es-CO')}
                                            </div>
                                            <span className="text-[10px] text-slate-400">Contrapartida: ${Number(proyecto.contrapartida_local || 0).toLocaleString('es-CO')}</span>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center text-[11px]">
                                                <span className="text-slate-400">Blindaje Anti-Devolución:</span>
                                                <span className="font-bold text-amber-400">{score}%</span>
                                            </div>
                                            <div className="w-full bg-slate-700 h-2 rounded-full mt-1.5 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${
                                                        score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                                    }`}
                                                    style={{ width: `${score}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-slate-400 mt-1 block">
                                                {proyecto.documentos?.length || 0} anexos técnicos aportados
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Botonera de Acción */}
                                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-700/80">
                                    <button
                                        onClick={() => abrirAuditoria(proyecto.id)}
                                        className="flex items-center justify-center gap-1.5 py-2 px-2 bg-gradient-to-r from-amber-600/20 to-orange-600/20 hover:from-amber-600/30 hover:to-orange-600/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                        title="Auditar requisitos obligatorios para evitar devolución en ministerio"
                                    >
                                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                                        Auditoría ({score}%)
                                    </button>

                                    <button
                                        onClick={() => abrirMGA(proyecto.id)}
                                        className="flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-700/60 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                        title="Ver formulación metodológica MGA del DNP con IA"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                        MGA (DNP)
                                    </button>

                                    <button
                                        onClick={() => abrirCartas(proyecto)}
                                        className="flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-700/60 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                        title="Generar carta formal de radicación y certificados"
                                    >
                                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                                        Cartas Oficiales
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ============================================================== */}
            {/* MODAL 1: AUDITORÍA ANTI-DEVOLUCIÓN Y CHECKLIST TÉCNICO         */}
            {/* ============================================================== */}
            {modalAuditoria && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        {/* Cabecera Modal */}
                        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-800 flex items-start justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-1">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Auditoría Forense Preventiva Anti-Devolución
                                </div>
                                <h2 className="text-xl font-bold text-white">{modalAuditoria.titulo}</h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Entidad Destino: <strong className="text-emerald-400">{modalAuditoria.ministerio_objetivo}</strong> • {modalAuditoria.municipio} ({modalAuditoria.departamento})
                                </p>
                            </div>

                            <button
                                onClick={() => setModalAuditoria(null)}
                                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Contenido Modal Scrollable */}
                        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-200">
                            {/* Panel Resumen de Madurez y Riesgo */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-center">
                                    <span className="text-xs text-slate-400 font-semibold uppercase">Índice de Madurez Documental</span>
                                    <div className="text-3xl font-black text-amber-400 mt-1">
                                        {modalAuditoria.score_antidevolucion || 0}%
                                    </div>
                                    <div className="w-full bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${
                                                modalAuditoria.score_antidevolucion >= 80 ? 'bg-emerald-500' : modalAuditoria.score_antidevolucion >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                            }`}
                                            style={{ width: `${modalAuditoria.score_antidevolucion || 0}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-center">
                                    <span className="text-xs text-slate-400 font-semibold uppercase">Nivel de Riesgo de Rechazo</span>
                                    <div className="text-xl font-bold text-white mt-2 capitalize">
                                        {modalAuditoria.riesgo_devolucion || 'Alto'}
                                    </div>
                                    <span className="text-[11px] text-slate-400">Evaluación en Ventanilla Única</span>
                                </div>

                                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex flex-col justify-center">
                                    <button
                                        onClick={reevaluarAuditoria}
                                        disabled={auditoriaLoading}
                                        className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-3.5 h-3.5 ${auditoriaLoading ? 'animate-spin' : ''}`} />
                                        Re-evaluar Viabilidad Ahora
                                    </button>
                                </div>
                            </div>

                            {/* Dictamen Técnico Preventivo */}
                            {modalAuditoria.dictamen_auditoria && (
                                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                                    {modalAuditoria.dictamen_auditoria}
                                </div>
                            )}

                            {/* Checklist Sectorial de Requisitos Obligatorios */}
                            <div>
                                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                    <FileCheck className="w-4 h-4 text-emerald-400" />
                                    Lista de Chequeo Anti-Devolución del Sector ({modalAuditoria.sector})
                                </h4>

                                <div className="space-y-3">
                                    {(() => {
                                        let checklist = [];
                                        try {
                                            checklist = JSON.parse(modalAuditoria.checklist_requisitos_json || '[]');
                                        } catch (e) {
                                            checklist = [];
                                        }

                                        return checklist.map((item) => (
                                            <div
                                                key={item.id}
                                                className={`p-3.5 rounded-xl border transition-all ${
                                                    item.cumplido
                                                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                                                        : item.bloqueante
                                                        ? 'bg-red-950/20 border-red-500/40 text-red-200'
                                                        : 'bg-slate-800/60 border-slate-700 text-slate-300'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!item.cumplido}
                                                            onChange={() => toggleChecklistItem(item.id)}
                                                            className="mt-1 w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-600 focus:ring-emerald-500 cursor-pointer"
                                                        />
                                                        <div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-bold text-xs text-white">
                                                                    {item.nombre}
                                                                </span>
                                                                {item.bloqueante && (
                                                                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-500/20 text-red-300 border border-red-500/40">
                                                                        BLOQUEANTE DE DEVOLUCIÓN
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-400 mt-0.5">{item.descripcion}</p>
                                                            {!item.cumplido && item.motivo_devolucion_comun && (
                                                                <p className="text-[11px] text-amber-300 mt-1 flex items-center gap-1.5 font-medium">
                                                                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                                                                    <strong>Causal común de rechazo en ministerio:</strong> {item.motivo_devolucion_comun}
                                                                </p>
                                                            )}
                                                            {item.observacion && (
                                                                <p className="text-[11px] text-slate-400 mt-1 italic">
                                                                    Estado: {item.observacion}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => {
                                                            setTipoDocSubir(item.id);
                                                            document.getElementById('inputSubirAnexo')?.click();
                                                        }}
                                                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300 flex items-center gap-1 flex-shrink-0 cursor-pointer"
                                                    >
                                                        <Upload className="w-3 h-3" />
                                                        Adjuntar
                                                    </button>
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>

                            {/* Expediente de Documentos Técnicos Subidos */}
                            <div className="pt-4 border-t border-slate-800">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-indigo-400" />
                                        Expediente de Documentos y Anexos Aportados ({modalAuditoria.documentos?.length || 0})
                                    </h4>

                                    <form onSubmit={handleSubirDoc} className="flex items-center gap-2">
                                        <input
                                            id="inputSubirAnexo"
                                            type="file"
                                            onChange={(e) => setArchivoSubir(e.target.files[0])}
                                            className="hidden"
                                        />
                                        {archivoSubir && (
                                            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 text-xs">
                                                <span className="text-emerald-400 truncate max-w-[150px]">{archivoSubir.name}</span>
                                                <button
                                                    type="submit"
                                                    disabled={subiendoDoc}
                                                    className="px-2 py-0.5 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-500 cursor-pointer disabled:opacity-50"
                                                >
                                                    {subiendoDoc ? 'Subiendo...' : 'Confirmar Carga'}
                                                </button>
                                            </div>
                                        )}
                                    </form>
                                </div>

                                {modalAuditoria.documentos?.length === 0 ? (
                                    <div className="p-4 bg-slate-800/40 rounded-xl border border-dashed border-slate-700 text-center text-xs text-slate-400">
                                        No has adjuntado archivos todavía. Haz clic en "Adjuntar" en los requisitos para subir certificados, planos y APUs.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {modalAuditoria.documentos.map((doc) => (
                                            <div
                                                key={doc.id}
                                                className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex items-center justify-between gap-2"
                                            >
                                                <div className="truncate">
                                                    <span className="text-xs font-bold text-white block truncate">{doc.nombre_archivo}</span>
                                                    <span className="text-[10px] text-slate-400 block capitalize">Tipo: {doc.tipo_documento.replace(/_/g, ' ')}</span>
                                                </div>

                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    <a
                                                        href={`${API.replace('/api', '')}${doc.url_archivo}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-1.5 text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer"
                                                        title="Ver documento"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                    <button
                                                        onClick={() => handleEliminarDoc(doc.id)}
                                                        className="p-1.5 text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-900/60 rounded-lg cursor-pointer"
                                                        title="Eliminar documento"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pie Modal */}
                        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end gap-3">
                            <button
                                onClick={() => setModalAuditoria(null)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                            >
                                Cerrar Auditoría
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* MODAL 2: FORMULACIÓN METODOLÓGICA MGA (DNP) CON IA            */}
            {/* ============================================================== */}
            {modalMGA && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 border-b border-slate-800 flex items-start justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 mb-1">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Metodología General Ajustada - MGA Web (DNP)
                                </div>
                                <h2 className="text-xl font-bold text-white">{modalMGA.titulo}</h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Estructuración de Árboles de Problemas, Objetivos y Cadena de Valor Oficial DNP
                                </p>
                            </div>

                            <button
                                onClick={() => setModalMGA(null)}
                                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-200">
                            {/* Botón de Formulación con IA */}
                            <div className="bg-gradient-to-r from-indigo-950/60 to-purple-950/60 p-4 rounded-xl border border-indigo-700/50 flex items-center justify-between gap-4">
                                <div>
                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-indigo-400" />
                                        Asistente Inteligente de Formulación MGA
                                    </h4>
                                    <p className="text-xs text-indigo-200 mt-0.5">
                                        Genera o afina con inteligencia artificial los árboles de problemas, objetivos y la matriz de marco lógico para la MGA Web.
                                    </p>
                                </div>

                                <button
                                    onClick={generarMGA_IA}
                                    disabled={mgaLoading}
                                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/50 flex items-center gap-2 cursor-pointer disabled:opacity-50 flex-shrink-0"
                                >
                                    <Sparkles className={`w-3.5 h-3.5 ${mgaLoading ? 'animate-spin' : ''}`} />
                                    {mgaLoading ? 'Formulando con IA...' : 'Formular con IA'}
                                </button>
                            </div>

                            {/* Árbol de Problemas y Árbol de Objetivos */}
                            {modalMGA.arbol_problemas_json ? (
                                <div className="space-y-6">
                                    {/* Árbol del Problema */}
                                    {(() => {
                                        let ap = {};
                                        try { ap = JSON.parse(modalMGA.arbol_problemas_json); } catch (e) {}
                                        return (
                                            <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700">
                                                <h4 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    Árbol de Problemas (Diagnóstico)
                                                </h4>

                                                {/* Efectos */}
                                                <div className="bg-red-950/20 p-3 rounded-lg border border-red-500/20 mb-3">
                                                    <span className="text-[11px] font-bold text-red-300 block mb-1">EFECTOS DIRECTOS E INDIRECTOS:</span>
                                                    <ul className="text-xs text-slate-300 list-disc list-inside space-y-1">
                                                        {(ap.efectos_directos || []).map((e, idx) => <li key={idx}>{e}</li>)}
                                                        {(ap.efectos_indirectos || []).map((e, idx) => <li key={idx} className="text-slate-400">{e}</li>)}
                                                    </ul>
                                                </div>

                                                {/* Problema Central */}
                                                <div className="bg-slate-900 p-4 rounded-xl border-2 border-red-500/40 text-center my-3 shadow-lg">
                                                    <span className="text-[10px] uppercase font-black text-red-400 tracking-wider">Problema Central MGA:</span>
                                                    <p className="text-sm font-bold text-white mt-1">{ap.problema_central || modalMGA.resumen_problema}</p>
                                                </div>

                                                {/* Causas */}
                                                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700">
                                                    <span className="text-[11px] font-bold text-amber-300 block mb-1">CAUSAS DIRECTAS E INDIRECTAS:</span>
                                                    <ul className="text-xs text-slate-300 list-disc list-inside space-y-1">
                                                        {(ap.causas_directas || []).map((c, idx) => <li key={idx}>{c}</li>)}
                                                        {(ap.causas_indirectas || []).map((c, idx) => <li key={idx} className="text-slate-400">{c}</li>)}
                                                    </ul>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Árbol de Objetivos */}
                                    {(() => {
                                        let ao = {};
                                        try { ao = JSON.parse(modalMGA.arbol_objetivos_json); } catch (e) {}
                                        return (
                                            <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700">
                                                <h4 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Árbol de Objetivos (Propósito)
                                                </h4>

                                                {/* Fines */}
                                                <div className="bg-emerald-950/20 p-3 rounded-lg border border-emerald-500/20 mb-3">
                                                    <span className="text-[11px] font-bold text-emerald-300 block mb-1">FINES ESPERADOS:</span>
                                                    <ul className="text-xs text-slate-300 list-disc list-inside space-y-1">
                                                        {(ao.fines_directos || []).map((f, idx) => <li key={idx}>{f}</li>)}
                                                        {(ao.fines_indirectos || []).map((f, idx) => <li key={idx} className="text-slate-400">{f}</li>)}
                                                    </ul>
                                                </div>

                                                {/* Objetivo General */}
                                                <div className="bg-slate-900 p-4 rounded-xl border-2 border-emerald-500/40 text-center my-3 shadow-lg">
                                                    <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">Objetivo General MGA:</span>
                                                    <p className="text-sm font-bold text-white mt-1">{ao.objetivo_general || modalMGA.objetivo_general}</p>
                                                </div>

                                                {/* Medios */}
                                                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700">
                                                    <span className="text-[11px] font-bold text-teal-300 block mb-1">MEDIOS DE INTERVENCIÓN:</span>
                                                    <ul className="text-xs text-slate-300 list-disc list-inside space-y-1">
                                                        {(ao.medios_directos || []).map((m, idx) => <li key={idx}>{m}</li>)}
                                                    </ul>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Cadena de Valor Oficial DNP */}
                                    {(() => {
                                        let cv = {};
                                        try { cv = JSON.parse(modalMGA.cadena_valor_json); } catch (e) {}
                                        return (
                                            <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700">
                                                <h4 className="text-sm font-bold text-indigo-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                                                    <Layers className="w-4 h-4" />
                                                    Cadena de Valor DNP (Catálogo de Productos)
                                                </h4>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
                                                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                                                        <span className="text-slate-400 block">Código Oficial Producto DNP:</span>
                                                        <strong className="text-emerald-400 text-sm">{cv.codigo_producto_dnp || '2101004'}</strong>
                                                    </div>
                                                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                                                        <span className="text-slate-400 block">Nombre del Producto:</span>
                                                        <strong className="text-white">{cv.nombre_producto_dnp || 'Vías terciarias mejoradas'}</strong>
                                                    </div>
                                                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 sm:col-span-2">
                                                        <span className="text-slate-400 block">Indicador de Producto:</span>
                                                        <strong className="text-slate-200">{cv.indicador_producto || 'Kilómetros intervenidos'}</strong>
                                                    </div>
                                                </div>

                                                <span className="text-xs font-bold text-slate-300 block mb-2">Actividades Principales de Ejecución:</span>
                                                <div className="space-y-2">
                                                    {(cv.actividades_principales || []).map((act, idx) => (
                                                        <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-900 rounded-lg text-xs border border-slate-800">
                                                            <span className="text-slate-200 font-medium">{act.nombre}</span>
                                                            <span className="text-indigo-400 font-mono font-bold">{act.costo_porcentaje}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Justificación Técnica Socioeconómica */}
                                    {modalMGA.justificacion_tecnica && (
                                        <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700">
                                            <h4 className="text-sm font-bold text-white mb-2">Justificación Técnica para la MGA Web:</h4>
                                            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900 p-4 rounded-xl border border-slate-800">
                                                {modalMGA.justificacion_tecnica}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-slate-800/40 rounded-xl border border-dashed border-slate-700">
                                    <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
                                    <h4 className="text-sm font-bold text-white">Proyecto pendiente de formulación MGA</h4>
                                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                                        Haz clic en "Formular con IA" para estructurar los árboles de problemas, objetivos y la cadena de valor oficial del DNP.
                                    </p>
                                    <button
                                        onClick={generarMGA_IA}
                                        disabled={mgaLoading}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/50 cursor-pointer disabled:opacity-50"
                                    >
                                        {mgaLoading ? 'Formulando...' : 'Generar Formulación MGA con IA'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
                            <button
                                onClick={() => setModalMGA(null)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                            >
                                Cerrar MGA
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* MODAL 3: GENERADOR DE CARTAS Y CERTIFICADOS OFICIALES          */}
            {/* ============================================================== */}
            {modalCartas && cartasGeneradas && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-5 bg-gradient-to-r from-slate-900 to-emerald-950 border-b border-slate-800 flex items-start justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-1">
                                    <FileText className="w-3.5 h-3.5" />
                                    Generador de Formatos Oficiales de Radicación
                                </div>
                                <h2 className="text-xl font-bold text-white">{modalCartas.titulo}</h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Documentos formales listos con membrete y protocolo de la administración pública colombiana
                                </p>
                            </div>

                            <button
                                onClick={() => { setModalCartas(null); setCartasGeneradas(null); }}
                                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Pestañas de Cartas */}
                        <div className="flex border-b border-slate-800 bg-slate-950 px-6 pt-2">
                            <button
                                onClick={() => setCartaActivaTab('presentacion')}
                                className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                                    cartaActivaTab === 'presentacion'
                                        ? 'border-emerald-400 text-emerald-400'
                                        : 'border-transparent text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                1. Oficio Formal al Ministro(a)
                            </button>
                            <button
                                onClick={() => setCartaActivaTab('pdm')}
                                className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                                    cartaActivaTab === 'pdm'
                                        ? 'border-emerald-400 text-emerald-400'
                                        : 'border-transparent text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                2. Certificado Plan de Desarrollo (PDM)
                            </button>
                            <button
                                onClick={() => setCartaActivaTab('sostenibilidad')}
                                className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                                    cartaActivaTab === 'sostenibilidad'
                                        ? 'border-emerald-400 text-emerald-400'
                                        : 'border-transparent text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                3. Certificado Sostenibilidad (10 Años)
                            </button>
                        </div>

                        {/* Visor de Documento */}
                        <div className="p-6 overflow-y-auto flex-1 text-slate-200">
                            {(() => {
                                const texto = cartaActivaTab === 'presentacion'
                                    ? cartasGeneradas.cartaPresentacion
                                    : cartaActivaTab === 'pdm'
                                    ? cartasGeneradas.certificadoPlanDesarrollo
                                    : cartasGeneradas.certificadoSostenibilidad;

                                return (
                                    <div className="relative">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs text-slate-400 font-mono">Texto oficial listo para membrete municipal / departamental:</span>
                                            <button
                                                onClick={() => copiarTextoCarta(texto)}
                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
                                            >
                                                {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                {copiado ? '¡Copiado al portapapeles!' : 'Copiar Texto Completo'}
                                            </button>
                                        </div>

                                        <pre className="p-6 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto shadow-inner">
                                            {texto}
                                        </pre>
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
                            <button
                                onClick={() => { setModalCartas(null); setCartasGeneradas(null); }}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* MODAL 4: ESTRUCTURAR DESDE NECESIDADES COMUNITARIAS            */}
            {/* ============================================================== */}
            {modalAgrupar && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-5 bg-gradient-to-r from-slate-900 to-emerald-950 border-b border-slate-800 flex items-start justify-between">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-1">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Clustering de Necesidades & Formulación Macro
                                </div>
                                <h2 className="text-xl font-bold text-white">Estructurar Proyecto desde Demandas Ciudadanas</h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Selecciona las solicitudes comunitarias registradas para consolidarlas en un proyecto con justificación y beneficiarios sumados.
                                </p>
                            </div>

                            <button
                                onClick={() => setModalAgrupar(false)}
                                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-200">
                            {/* Parámetros de la Agrupación */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                                <div>
                                    <label className="text-xs font-bold text-slate-300 block mb-1">Sector de Inversión:</label>
                                    <select
                                        value={agruparSector}
                                        onChange={(e) => setAgruparSector(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                                    >
                                        {Object.entries(SECTORES_INFO).map(([key, info]) => (
                                            <option key={key} value={key}>{info.icon} {info.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-300 block mb-1">Título Tentativo del Proyecto (Opcional):</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Construcción de Placa Huellas en Corredores Veredales..."
                                        value={agruparTitulo}
                                        onChange={(e) => setAgruparTitulo(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* Resumen de Selección */}
                            <div className="flex items-center justify-between text-xs bg-slate-800/40 p-3 rounded-lg border border-slate-700">
                                <span>
                                    Seleccionadas: <strong className="text-emerald-400 font-bold">{necesidadesSeleccionadas.length}</strong> de {necesidadesDisponibles.length} necesidades
                                </span>
                                <span className="text-slate-400">
                                    Familias estimadas a beneficiar:{' '}
                                    <strong className="text-white">
                                        {necesidadesDisponibles
                                            .filter(n => necesidadesSeleccionadas.includes(n.id))
                                            .reduce((sum, n) => sum + (n.impacto_familias_estimado || 15), 0)}
                                    </strong>
                                </span>
                            </div>

                            {/* Lista de Necesidades para Marcar */}
                            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                                {necesidadesDisponibles.length === 0 ? (
                                    <div className="text-center py-8 text-xs text-slate-400">
                                        No hay necesidades pendientes de gestión en este momento.
                                    </div>
                                ) : (
                                    necesidadesDisponibles.map((nec) => {
                                        const isChecked = necesidadesSeleccionadas.includes(nec.id);
                                        return (
                                            <div
                                                key={nec.id}
                                                onClick={() => toggleSeleccionNecesidad(nec.id)}
                                                className={`p-3 rounded-xl border flex items-start gap-3 transition-all cursor-pointer ${
                                                    isChecked
                                                        ? 'bg-emerald-950/30 border-emerald-500 text-white'
                                                        : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:border-slate-600'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => {}}
                                                    className="mt-1 w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-600 focus:ring-emerald-500 pointer-events-none"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h5 className="font-bold text-xs text-white">{nec.titulo}</h5>
                                                        <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 flex-shrink-0">
                                                            {nec.barrio_vereda || nec.municipio}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{nec.descripcion}</p>
                                                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                                                        <span>👥 {nec.impacto_familias_estimado || 10} familias</span>
                                                        <span>• Categoría: {nec.categoria?.replace(/_/g, ' ')}</span>
                                                        {nec.costo_estimado > 0 && <span>• Costo preliminar: ${Number(nec.costo_estimado).toLocaleString('es-CO')}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end gap-3">
                            <button
                                onClick={() => setModalAgrupar(false)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={handleConfirmarAgrupacion}
                                disabled={guardandoAgrupacion || necesidadesSeleccionadas.length === 0}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/40 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                {guardandoAgrupacion ? 'Estructurando Proyecto...' : 'Consolidar en Proyecto de Inversión'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* MODAL 5: CREAR PROYECTO DIRECTO                               */}
            {/* ============================================================== */}
            {modalCrear && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-800 flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">Nuevo Proyecto de Inversión Pública</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Diligencia la información inicial para estructurar el proyecto</p>
                            </div>
                            <button
                                onClick={() => setModalCrear(false)}
                                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCrearProyecto} className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-200">
                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1">Título Oficial del Proyecto *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Construcción de Placa Huella en la Red Terciaria Veredal..."
                                    value={nuevoForm.titulo}
                                    onChange={(e) => setNuevoForm({ ...nuevoForm, titulo: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-300 block mb-1">Sector DNP / MGA</label>
                                    <select
                                        value={nuevoForm.sector}
                                        onChange={(e) => setNuevoForm({ ...nuevoForm, sector: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                                    >
                                        {Object.entries(SECTORES_INFO).map(([key, info]) => (
                                            <option key={key} value={key}>{info.icon} {info.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-300 block mb-1">Ministerio / Entidad Destino</label>
                                    <input
                                        type="text"
                                        value={nuevoForm.ministerio_objetivo}
                                        onChange={(e) => setNuevoForm({ ...nuevoForm, ministerio_objetivo: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-300 block mb-1">Departamento</label>
                                    <input
                                        type="text"
                                        required
                                        value={nuevoForm.departamento}
                                        onChange={(e) => setNuevoForm({ ...nuevoForm, departamento: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-300 block mb-1">Municipio</label>
                                    <input
                                        type="text"
                                        required
                                        value={nuevoForm.municipio}
                                        onChange={(e) => setNuevoForm({ ...nuevoForm, municipio: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-300 block mb-1">Localidad / Barrio / Vereda</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Vereda La Esperanza"
                                        value={nuevoForm.zona_localidad}
                                        onChange={(e) => setNuevoForm({ ...nuevoForm, zona_localidad: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-300 block mb-1">Población Beneficiaria (Habitantes)</label>
                                    <input
                                        type="number"
                                        value={nuevoForm.poblacion_beneficiada}
                                        onChange={(e) => setNuevoForm({ ...nuevoForm, poblacion_beneficiada: parseInt(e.target.value, 10) || 0 })}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-300 block mb-1">Presupuesto Estimado Total ($ COP)</label>
                                <input
                                    type="number"
                                    value={nuevoForm.costo_estimado_total}
                                    onChange={(e) => setNuevoForm({ ...nuevoForm, costo_estimado_total: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalCrear(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/40 cursor-pointer"
                                >
                                    Guardar Proyecto
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
