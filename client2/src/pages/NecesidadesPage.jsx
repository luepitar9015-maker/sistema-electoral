import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCampaign } from '../context/CampaignContext';
import { colombiaData } from '../data/colombiaData';
import {
    Sparkles, Plus, Search, Filter, MapPin, Users, DollarSign,
    AlertTriangle, CheckCircle2, Clock, FileText, Copy, Check,
    X, ChevronRight, BarChart3, Building2, Flame, RefreshCw, Send
} from 'lucide-react';
import { API } from '../config/api';

const CATEGORIAS = [
    { id: 'vias_infraestructura', label: 'Vías e Infraestructura', color: 'from-amber-500 to-orange-600' },
    { id: 'salud', label: 'Salud y Hospitales', color: 'from-rose-500 to-red-600' },
    { id: 'seguridad', label: 'Seguridad y Convivencia', color: 'from-blue-600 to-indigo-700' },
    { id: 'educacion', label: 'Educación y Colegios', color: 'from-emerald-500 to-teal-600' },
    { id: 'servicios_publicos_agua', label: 'Agua Potable y Servicios', color: 'from-cyan-500 to-blue-600' },
    { id: 'empleo_desarrollo', label: 'Empleo y Oportunidades', color: 'from-purple-500 to-violet-700' },
    { id: 'medio_ambiente', label: 'Medio Ambiente y Campo', color: 'from-green-600 to-emerald-800' },
    { id: 'vivienda', label: 'Vivienda y Hábitat', color: 'from-amber-600 to-yellow-700' },
    { id: 'otra', label: 'Otras Necesidades', color: 'from-gray-500 to-slate-700' }
];

const PRIORIDADES = {
    critica_urgente: { label: 'Crítica / Urgente', color: 'bg-red-500/20 text-red-400 border-red-500/40' },
    alta: { label: 'Prioridad Alta', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
    media: { label: 'Prioridad Media', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
    baja: { label: 'Prioridad Baja', color: 'bg-gray-500/20 text-gray-400 border-gray-500/40' }
};

const ESTADOS = {
    reportada: { label: 'Reportada', bg: 'bg-gray-700 text-gray-300' },
    en_analisis: { label: 'En Análisis', bg: 'bg-yellow-900/60 text-yellow-300' },
    en_plan_desarrollo: { label: 'En Plan Desarrollo', bg: 'bg-indigo-900/60 text-indigo-300' },
    en_gestion: { label: 'En Gestión', bg: 'bg-blue-900/60 text-blue-300' },
    solucionada: { label: 'Solucionada', bg: 'bg-emerald-900/60 text-emerald-300' }
};

export default function NecesidadesPage() {
    const { user } = useAuth();
    const { activeCampaign } = useCampaign();
    const token = localStorage.getItem('token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    const [necesidades, setNecesidades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    // Filtros territoriales y temáticos
    const [filtroDepto, setFiltroDepto] = useState(activeCampaign?.departamento || 'TODOS');
    const [filtroMpio, setFiltroMpio] = useState(activeCampaign?.municipio || 'TODOS');
    const [filtroCategoria, setFiltroCategoria] = useState('TODAS');
    const [filtroPrioridad, setFiltroPrioridad] = useState('TODAS');
    const [filtroEstado, setFiltroEstado] = useState('TODOS');
    const [busqueda, setBusqueda] = useState('');
    const [municipiosDisponibles, setMunicipiosDisponibles] = useState([]);

    // Modal Crear
    const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [formCrear, setFormCrear] = useState({
        titulo: '',
        descripcion: '',
        categoria: 'vias_infraestructura',
        nivel_territorial: activeCampaign?.nivel_territorial || 'municipal',
        departamento: activeCampaign?.departamento || 'ANTIOQUIA',
        municipio: activeCampaign?.municipio || 'Medellín',
        comuna_corregimiento: '',
        barrio_vereda: '',
        direccion_referencia: '',
        prioridad: 'alta',
        impacto_familias_estimado: 50,
        costo_estimado: '',
        competencia: 'alcaldia',
        solucion_propuesta: '',
        reportado_por_nombre: '',
        reportado_por_telefono: '',
        origen_reporte: 'lider'
    });

    // Modal Resumen Ejecutivo con IA
    const [modalIAAbierto, setModalIAAbierto] = useState(false);
    const [cargandoIA, setCargandoIA] = useState(false);
    const [resumenIA, setResumenIA] = useState(null);
    const [copiadoIA, setCopiadoIA] = useState(false);

    useEffect(() => {
        if (filtroDepto && filtroDepto !== 'TODOS' && colombiaData[filtroDepto]) {
            setMunicipiosDisponibles(colombiaData[filtroDepto]?.sort() || []);
        } else {
            setMunicipiosDisponibles([]);
            setFiltroMpio('TODOS');
        }
    }, [filtroDepto]);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filtroDepto !== 'TODOS') params.append('departamento', filtroDepto);
            if (filtroMpio !== 'TODOS') params.append('municipio', filtroMpio);
            if (filtroCategoria !== 'TODAS') params.append('categoria', filtroCategoria);
            if (filtroPrioridad !== 'TODAS') params.append('prioridad', filtroPrioridad);
            if (filtroEstado !== 'TODOS') params.append('estado', filtroEstado);
            if (busqueda.trim()) params.append('search', busqueda.trim());
            if (activeCampaign?.id) params.append('campana_id', activeCampaign.id);

            const [resLista, resStats] = await Promise.all([
                axios.get(`${API}/necesidades?${params.toString()}`, authHeaders),
                axios.get(`${API}/necesidades/stats/resumen?${params.toString()}`, authHeaders)
            ]);

            setNecesidades(resLista.data);
            setStats(resStats.data);
        } catch (error) {
            console.error('Error al cargar banco de necesidades:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [filtroDepto, filtroMpio, filtroCategoria, filtroPrioridad, filtroEstado, activeCampaign?.id]);

    const handleCrearSubmit = async (e) => {
        e.preventDefault();
        setGuardando(true);
        try {
            await axios.post(`${API}/necesidades`, {
                ...formCrear,
                campana_id: activeCampaign?.id || null
            }, authHeaders);

            setModalCrearAbierto(false);
            setFormCrear({
                titulo: '',
                descripcion: '',
                categoria: 'vias_infraestructura',
                nivel_territorial: activeCampaign?.nivel_territorial || 'municipal',
                departamento: activeCampaign?.departamento || 'ANTIOQUIA',
                municipio: activeCampaign?.municipio || 'Medellín',
                comuna_corregimiento: '',
                barrio_vereda: '',
                direccion_referencia: '',
                prioridad: 'alta',
                impacto_familias_estimado: 50,
                costo_estimado: '',
                competencia: 'alcaldia',
                solucion_propuesta: '',
                reportado_por_nombre: '',
                reportado_por_telefono: '',
                origen_reporte: 'lider'
            });
            cargarDatos();
        } catch (error) {
            alert('Error al registrar la necesidad comunitaria: ' + (error.response?.data?.message || error.message));
        } finally {
            setGuardando(false);
        }
    };

    const handleGenerarResumenIA = async () => {
        setModalIAAbierto(true);
        setCargandoIA(true);
        setResumenIA(null);
        try {
            const res = await axios.post(`${API}/necesidades/ai/resumen-ejecutivo`, {
                departamento: filtroDepto,
                municipio: filtroMpio,
                campana_id: activeCampaign?.id || null
            }, authHeaders);
            setResumenIA(res.data);
        } catch (error) {
            console.error('Error al generar resumen IA:', error);
            alert('No se pudo generar el resumen con IA: ' + (error.response?.data?.message || error.message));
        } finally {
            setCargandoIA(false);
        }
    };

    const handleCambiarEstado = async (id, nuevoEstado) => {
        try {
            await axios.put(`${API}/necesidades/${id}`, { estado: nuevoEstado }, authHeaders);
            setNecesidades(prev => prev.map(n => n.id === id ? { ...n, estado: nuevoEstado } : n));
        } catch (error) {
            console.error('Error al actualizar estado:', error);
        }
    };

    const copiarTextoIA = () => {
        if (!resumenIA) return;
        const texto = `DIAGNÓSTICO TERRITORIAL: ${resumenIA.titulo_informe || ''}\n\n` +
            `SITUACIÓN:\n${resumenIA.diagnostico_situacion || ''}\n\n` +
            `TOP DOLORES:\n${(resumenIA.top_dolores || []).map(d => `- ${d.categoria}: ${d.problema} (Zonas: ${d.zonas_afectadas})`).join('\n')}\n\n` +
            `SOLUCIONES:\n${(resumenIA.matriz_soluciones || []).map(s => `[${s.plazo}] ${s.accion_concreta} (Resp: ${s.entidad_responsable})`).join('\n')}\n\n` +
            `DISCURSO RECOMENDADO:\n${resumenIA.discurso_candidato || ''}`;
        navigator.clipboard.writeText(texto);
        setCopiadoIA(true);
        setTimeout(() => setCopiadoIA(false), 3000);
    };

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto text-gray-100">
            {/* Header Principal con Llamado a la Acción de IA */}
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                                <Building2 size={13} /> Gobernanza & Dolores Territoriales
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/40">
                                4 Años de Gestión
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
                            Banco Territorial de Necesidades Ciudadanas
                        </h1>
                        <p className="text-gray-300 text-sm md:text-base mt-1 max-w-3xl">
                            Consolida, georreferencia y prioriza con Inteligencia Artificial los dolores de la comunidad en municipios, departamentos y el país para construir el Plan de Desarrollo, discursos y rendición de cuentas.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={handleGenerarResumenIA}
                            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <Sparkles size={18} className="animate-spin-slow" />
                            <span>Resumen Ejecutivo con IA</span>
                        </button>
                        <button
                            onClick={() => setModalCrearAbierto(true)}
                            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold transition-all"
                        >
                            <Plus size={18} />
                            <span>Reportar Necesidad</span>
                        </button>
                    </div>
                </div>

                {/* Métricas Rápidas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/60">
                    <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Reportes</span>
                        <div className="text-2xl md:text-3xl font-black text-white mt-1">
                            {stats?.total_reportes || necesidades.length}
                        </div>
                        <span className="text-[11px] text-emerald-400">Casos levantados en territorio</span>
                    </div>
                    <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Familias Afectadas</span>
                        <div className="text-2xl md:text-3xl font-black text-amber-400 mt-1">
                            {stats?.total_familias_afectadas?.toLocaleString() || 0}
                        </div>
                        <span className="text-[11px] text-gray-400">Población directa con impacto</span>
                    </div>
                    <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Casos Críticos / Urgentes</span>
                        <div className="text-2xl md:text-3xl font-black text-rose-400 mt-1">
                            {stats?.por_prioridad?.critica_urgente || 0}
                        </div>
                        <span className="text-[11px] text-rose-300">Requieren atención inmediata</span>
                    </div>
                    <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Presupuesto Estimado</span>
                        <div className="text-xl md:text-2xl font-black text-cyan-400 mt-1 truncate">
                            ${((stats?.presupuesto_total_estimado || 0) / 1000000).toFixed(1)}M
                        </div>
                        <span className="text-[11px] text-gray-400">Costo total proyectado</span>
                    </div>
                </div>
            </div>

            {/* Barra de Filtros Inteligentes */}
            <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl p-4 shadow-lg flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mr-2">
                    <Filter size={15} /> Filtros:
                </div>

                {/* Filtro Departamento */}
                <select
                    value={filtroDepto}
                    onChange={(e) => setFiltroDepto(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                    <option value="TODOS">🇨🇴 Todo el País (Nacional)</option>
                    {Object.keys(colombiaData).sort().map(d => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>

                {/* Filtro Municipio */}
                <select
                    value={filtroMpio}
                    onChange={(e) => setFiltroMpio(e.target.value)}
                    disabled={municipiosDisponibles.length === 0}
                    className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 disabled:opacity-40"
                >
                    <option value="TODOS">Todos los Municipios</option>
                    {municipiosDisponibles.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>

                {/* Filtro Categoría */}
                <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                    <option value="TODAS">Todas las Categorías</option>
                    {CATEGORIAS.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                </select>

                {/* Filtro Prioridad */}
                <select
                    value={filtroPrioridad}
                    onChange={(e) => setFiltroPrioridad(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                    <option value="TODAS">Cualquier Prioridad</option>
                    <option value="critica_urgente">Crítica / Urgente</option>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                </select>

                {/* Filtro Estado */}
                <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                >
                    <option value="TODOS">Todos los Estados</option>
                    <option value="reportada">Reportada</option>
                    <option value="en_analisis">En Análisis</option>
                    <option value="en_plan_desarrollo">En Plan de Desarrollo</option>
                    <option value="en_gestion">En Gestión</option>
                    <option value="solucionada">Solucionada</option>
                </select>

                {/* Buscador de texto */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por barrio, palabra clave o líder..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && cargarDatos()}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                </div>

                <button
                    onClick={cargarDatos}
                    className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white transition-colors"
                    title="Refrescar lista"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Listado de Tarjetas de Necesidades */}
            {loading ? (
                <div className="py-20 text-center">
                    <RefreshCw size={36} className="animate-spin text-emerald-400 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Cargando banco de necesidades del territorio...</p>
                </div>
            ) : necesidades.length === 0 ? (
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-12 text-center">
                    <Building2 size={48} className="text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white">No se encontraron reportes para estos filtros</h3>
                    <p className="text-gray-400 text-sm mt-1 max-w-md mx-auto">
                        Sé el primero en levantar una necesidad en esta zona o ajusta los filtros territoriales.
                    </p>
                    <button
                        onClick={() => setModalCrearAbierto(true)}
                        className="mt-5 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-sm"
                    >
                        Reportar Primera Necesidad
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {necesidades.map((n) => {
                        const catObj = CATEGORIAS.find(c => c.id === n.categoria) || CATEGORIAS[CATEGORIAS.length - 1];
                        const prioObj = PRIORIDADES[n.prioridad] || PRIORIDADES.media;
                        const estadoObj = ESTADOS[n.estado] || ESTADOS.reportada;

                        return (
                            <div
                                key={n.id}
                                className="bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${prioObj.color}`}>
                                            {prioObj.label}
                                        </span>
                                        <select
                                            value={n.estado}
                                            onChange={(e) => handleCambiarEstado(n.id, e.target.value)}
                                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border-0 cursor-pointer ${estadoObj.bg}`}
                                        >
                                            <option value="reportada">Reportada</option>
                                            <option value="en_analisis">En Análisis</option>
                                            <option value="en_plan_desarrollo">En Plan Des.</option>
                                            <option value="en_gestion">En Gestión</option>
                                            <option value="solucionada">Solucionada</option>
                                        </select>
                                    </div>

                                    <h3 className="font-extrabold text-base text-white group-hover:text-emerald-400 transition-colors leading-snug">
                                        {n.titulo}
                                    </h3>

                                    <p className="text-gray-300 text-xs mt-2 line-clamp-3 leading-relaxed">
                                        {n.descripcion}
                                    </p>

                                    <div className="mt-4 pt-3 border-t border-slate-700/60 space-y-1.5 text-xs text-gray-400">
                                        <div className="flex items-center gap-1.5 text-gray-300 font-semibold truncate">
                                            <MapPin size={13} className="text-emerald-400 shrink-0" />
                                            <span>{n.municipio}, {n.departamento}</span>
                                            {n.barrio_vereda && (
                                                <span className="text-emerald-400 font-normal truncate">({n.barrio_vereda})</span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="flex items-center gap-1">
                                                <Users size={12} className="text-amber-400" />
                                                <strong className="text-white">{n.impacto_familias_estimado || 0}</strong> familias
                                            </span>
                                            <span className="font-mono text-cyan-400 font-bold">
                                                {n.costo_estimado > 0 ? `$${Number(n.costo_estimado).toLocaleString()} COP` : 'Por costear'}
                                            </span>
                                        </div>

                                        {n.solucion_propuesta && (
                                            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-300 mt-2">
                                                <strong>Propuesta:</strong> {n.solucion_propuesta}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between text-[10px] text-gray-500">
                                    <span>Por: {n.reportado_por_nombre || 'Líder Barrial'}</span>
                                    <span className="uppercase font-bold tracking-wider text-slate-400">{catObj.label}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal: Resumen Ejecutivo con IA (Gemini) */}
            {modalIAAbierto && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header del Modal */}
                        <div className="p-6 bg-gradient-to-r from-emerald-950 to-slate-900 border-b border-emerald-500/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                                    <Sparkles size={20} className="animate-spin-slow" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white">
                                        Diagnóstico & Soluciones con Inteligencia Artificial
                                    </h2>
                                    <p className="text-xs text-emerald-400">
                                        Análisis estratégico territorial para el mandatario / candidato
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setModalIAAbierto(false)}
                                className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-slate-800"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Contenido del Modal */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-200 text-sm">
                            {cargandoIA ? (
                                <div className="py-24 text-center space-y-4">
                                    <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mx-auto"></div>
                                    <h4 className="text-base font-bold text-white">Analizando base de necesidades con IA...</h4>
                                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                                        Procesando patrones comunitarios, priorización de partidas y estructurando el discurso para el territorio seleccionado.
                                    </p>
                                </div>
                            ) : resumenIA ? (
                                <>
                                    {/* Titular del Informe */}
                                    <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                            Diagnóstico Territorial Oficial
                                        </span>
                                        <h3 className="text-xl font-extrabold text-white mt-1">
                                            {resumenIA.titulo_informe}
                                        </h3>
                                        <p className="text-gray-300 text-sm mt-3 leading-relaxed">
                                            {resumenIA.diagnostico_situacion}
                                        </p>
                                    </div>

                                    {/* Top Dolores Comunitarios */}
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-1.5">
                                            <Flame size={14} /> Principales Dolores Ciudadanos Identificados
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {(resumenIA.top_dolores || []).map((dolor, idx) => (
                                                <div key={idx} className="bg-slate-800/50 border border-amber-500/30 rounded-xl p-4">
                                                    <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                                                        {dolor.categoria}
                                                    </span>
                                                    <h5 className="font-bold text-white text-sm mt-2">{dolor.problema}</h5>
                                                    <p className="text-xs text-gray-400 mt-1"><strong>Sectores:</strong> {dolor.zonas_afectadas}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5"><strong>Impacto:</strong> {dolor.impacto_social}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Matriz de Soluciones Escalonadas */}
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-1.5">
                                            <CheckCircle2 size={14} /> Matriz de Soluciones Recomendadas por Plazos
                                        </h4>
                                        <div className="space-y-3">
                                            {(resumenIA.matriz_soluciones || []).map((sol, idx) => (
                                                <div key={idx} className="bg-slate-800/60 border border-emerald-500/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                                    <div>
                                                        <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                                                            {sol.plazo}
                                                        </span>
                                                        <p className="font-medium text-white text-sm mt-1">{sol.accion_concreta}</p>
                                                        <span className="text-[11px] text-gray-400">Responsable: <strong>{sol.entidad_responsable}</strong></span>
                                                    </div>
                                                    <span className="self-start md:self-center px-3 py-1 rounded-full text-xs font-bold bg-slate-700 text-gray-300">
                                                        Viabilidad: {sol.viabilidad}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Discurso Político & Proposición */}
                                    <div className="bg-gradient-to-br from-slate-800 to-emerald-950/60 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                            Discurso Sugerido para Plaza Pública / Plenaria
                                        </span>
                                        <p className="text-sm italic text-gray-200 leading-relaxed font-serif">
                                            "{resumenIA.discurso_candidato}"
                                        </p>

                                        {resumenIA.proposicion_legislativa_o_acuerdo && (
                                            <div className="mt-4 pt-3 border-t border-slate-700">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                                                    Proposición de Control Político / Acuerdo Radicable:
                                                </span>
                                                <p className="text-xs text-gray-300 font-mono mt-1 bg-slate-900/80 p-3 rounded-lg border border-slate-700">
                                                    {resumenIA.proposicion_legislativa_o_acuerdo}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : null}
                        </div>

                        {/* Footer con Copiar y Cerrar */}
                        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                                Generado por Motor de IA Gubernamental y Territorial
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={copiarTextoIA}
                                    disabled={!resumenIA}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all disabled:opacity-40"
                                >
                                    {copiadoIA ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                    <span>{copiadoIA ? '¡Copiado!' : 'Copiar Informe Completo'}</span>
                                </button>
                                <button
                                    onClick={() => setModalIAAbierto(false)}
                                    className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Crear Nueva Necesidad */}
            {modalCrearAbierto && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-6 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Building2 size={20} className="text-emerald-400" />
                                <h3 className="font-extrabold text-white text-lg">Reportar Necesidad Comunitaria</h3>
                            </div>
                            <button onClick={() => setModalCrearAbierto(false)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCrearSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
                            <div>
                                <label className="text-xs font-bold text-gray-300 block mb-1">Título de la Necesidad *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej: Falla en puente peatonal que conecta la escuela"
                                    value={formCrear.titulo}
                                    onChange={(e) => setFormCrear({ ...formCrear, titulo: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-300 block mb-1">Categoría Temática</label>
                                    <select
                                        value={formCrear.categoria}
                                        onChange={(e) => setFormCrear({ ...formCrear, categoria: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        {CATEGORIAS.map(c => (
                                            <option key={c.id} value={c.id}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-300 block mb-1">Prioridad / Urgencia</label>
                                    <select
                                        value={formCrear.prioridad}
                                        onChange={(e) => setFormCrear({ ...formCrear, prioridad: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="critica_urgente">Crítica / Urgente</option>
                                        <option value="alta">Alta</option>
                                        <option value="media">Media</option>
                                        <option value="baja">Baja</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-300 block mb-1">Departamento *</label>
                                    <select
                                        required
                                        value={formCrear.departamento}
                                        onChange={(e) => setFormCrear({ ...formCrear, departamento: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        {Object.keys(colombiaData).sort().map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-300 block mb-1">Municipio *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Nombre del municipio"
                                        value={formCrear.municipio}
                                        onChange={(e) => setFormCrear({ ...formCrear, municipio: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-300 block mb-1">Barrio o Vereda</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Barrio Santa Mónica / Vereda El Hato"
                                        value={formCrear.barrio_vereda}
                                        onChange={(e) => setFormCrear({ ...formCrear, barrio_vereda: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-300 block mb-1">Comuna o Corregimiento</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Comuna 5 / Corregimiento San Antonio"
                                        value={formCrear.comuna_corregimiento}
                                        onChange={(e) => setFormCrear({ ...formCrear, comuna_corregimiento: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-300 block mb-1">Descripción del Problema *</label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Detalla qué está sucediendo, desde cuándo ocurre y cómo afecta la vida de los vecinos..."
                                    value={formCrear.descripcion}
                                    onChange={(e) => setFormCrear({ ...formCrear, descripcion: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-300 block mb-1">Familias Afectadas</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formCrear.impacto_familias_estimado}
                                        onChange={(e) => setFormCrear({ ...formCrear, impacto_familias_estimado: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-300 block mb-1">Costo Estimado (COP)</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={formCrear.costo_estimado}
                                        onChange={(e) => setFormCrear({ ...formCrear, costo_estimado: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-300 block mb-1">Competencia Principal</label>
                                    <select
                                        value={formCrear.competencia}
                                        onChange={(e) => setFormCrear({ ...formCrear, competencia: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="alcaldia">Alcaldía Municipal</option>
                                        <option value="gobernacion">Gobernación / Dptal</option>
                                        <option value="nacion_congreso">Nación / Congreso</option>
                                        <option value="mixta">Mixta / Articulada</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-300 block mb-1">Solución Planteada por la Comunidad</label>
                                <input
                                    type="text"
                                    placeholder="¿Qué propone la JAC o los vecinos para solucionarlo?"
                                    value={formCrear.solucion_propuesta}
                                    onChange={(e) => setFormCrear({ ...formCrear, solucion_propuesta: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-700/60">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 block mb-1">Nombre del Reportante o Líder</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Doña Carmen (Líder JAC)"
                                        value={formCrear.reportado_por_nombre}
                                        onChange={(e) => setFormCrear({ ...formCrear, reportado_por_nombre: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 block mb-1">Teléfono / WhatsApp</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: 3101234567"
                                        value={formCrear.reportado_por_telefono}
                                        onChange={(e) => setFormCrear({ ...formCrear, reportado_por_telefono: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModalCrearAbierto(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-bold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardando}
                                    className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-colors"
                                >
                                    {guardando ? 'Guardando...' : 'Guardar Necesidad'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
