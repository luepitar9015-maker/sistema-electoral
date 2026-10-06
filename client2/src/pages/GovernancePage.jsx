import { useState, useEffect } from 'react';
import axios from 'axios';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { API } from '../config/api';
import {
    Landmark, Building2, Award, FileText, CheckCircle2, Clock,
    AlertTriangle, Plus, Search, Filter, ExternalLink, MapPin,
    DollarSign, Users, ChevronRight, Sparkles, RefreshCw, Trash2,
    Edit3, ShieldAlert, ArrowUpRight, TrendingUp, Check, Copy, Share2,
    Calendar, Briefcase, Compass, Radio, MessageSquare, ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SECTORES = [
    'Infraestructura & Vías',
    'Educación & Colegios',
    'Salud & Hospitales',
    'Seguridad & Convivencia',
    'Economía & Empleo',
    'Agua & Medio Ambiente',
    'Deporte & Juventud',
    'Cultura & Comunidad',
    'Control Político & Transparencia',
    'Otro'
];

export default function GovernancePage() {
    const { activeCampaign, campaigns } = useCampaign();
    const { user } = useAuth();
    const token = localStorage.getItem('token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // Determinar cargo actual o selector de vista
    const [selectedCargo, setSelectedCargo] = useState('alcalde'); // 'alcalde' | 'concejal' | 'diputado' | 'senador'
    const [activeTab, setActiveTab] = useState('obras'); // dependiente del cargo
    const [compromisos, setCompromisos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('todos');
    const [filterSector, setFilterSector] = useState('todos');

    // Modales
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [copiedReport, setCopiedReport] = useState(false);

    // Formulario
    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        tipo: 'obra_infraestructura',
        cargo_responsable: 'alcalde',
        secretaria_o_comision: 'Secretaría de Infraestructura & Obras',
        departamento: activeCampaign?.departamento || '',
        municipio: activeCampaign?.municipio || '',
        barrio_comuna: '',
        lider_comunal_enlace: '',
        estado: 'en_ejecucion',
        porcentaje_avance: 0,
        inversion_presupuesto: 0,
        fecha_inicio: '',
        fecha_cumplimiento: '',
        beneficiarios_estimados: 0,
        impacto_electoral_futuro: 'vital_para_reeleccion',
        evidencia_url: ''
    });

    // Detectar cargo según campaña activa
    useEffect(() => {
        if (activeCampaign?.tipo_cargo) {
            const cargo = activeCampaign.tipo_cargo.toLowerCase();
            if (cargo.includes('alcald')) setSelectedCargo('alcalde');
            else if (cargo.includes('concej')) setSelectedCargo('concejal');
            else if (cargo.includes('asamble') || cargo.includes('diput')) setSelectedCargo('diputado');
            else if (cargo.includes('senad')) setSelectedCargo('senador');
            else if (cargo.includes('camar') || cargo.includes('congres')) setSelectedCargo('senador');
        }
    }, [activeCampaign?.id, activeCampaign?.tipo_cargo]);

    // Cargar compromisos de la campaña
    const fetchCompromisos = async () => {
        if (!activeCampaign?.id) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API}/campaigns/${activeCampaign.id}/compromisos`, authHeaders);
            setCompromisos(res.data?.compromisos || res.data || []);
        } catch (err) {
            console.error('Error al cargar compromisos:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompromisos();
    }, [activeCampaign?.id]);

    // Guardar / Actualizar compromiso
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await axios.put(`${API}/campaigns/${activeCampaign.id}/compromisos/${editingItem.id}`, formData, authHeaders);
            } else {
                await axios.post(`${API}/campaigns/${activeCampaign.id}/compromisos`, {
                    ...formData,
                    cargo_responsable: selectedCargo
                }, authHeaders);
            }
            setModalOpen(false);
            setEditingItem(null);
            await fetchCompromisos();
            alert('✅ Registro guardado exitosamente');
        } catch (err) {
            console.error('Error al guardar compromiso:', err);
            alert(err.response?.data?.message || 'Error al guardar');
        }
    };

    // Eliminar compromiso
    const handleDelete = async (id) => {
        if (!confirm('¿Confirma que desea eliminar este registro?')) return;
        try {
            await axios.delete(`${API}/campaigns/${activeCampaign.id}/compromisos/${id}`, authHeaders);
            await fetchCompromisos();
        } catch (err) {
            console.error('Error al eliminar:', err);
        }
    };

    // Copiar reporte para WhatsApp
    const handleCopyWhatsAppReport = () => {
        const cumplidos = compromisos.filter(c => c.estado === 'cumplido_entregado');
        const enEjecucion = compromisos.filter(c => c.estado === 'en_ejecucion');
        
        let report = `📢 *INFORME DE GESTIÓN Y RENDICIÓN DE CUENTAS - CASA POLÍTICA*\n`;
        report += `🏛️ *Mandatario:* ${activeCampaign?.candidato || 'Líder Político'}\n`;
        report += `📍 *Territorio:* ${activeCampaign?.municipio || activeCampaign?.departamento || 'Nivel Nacional'}\n`;
        report += `📅 *Periodo:* ${activeCampaign?.periodo_gobierno || '2024 - 2027'}\n\n`;
        report += `✅ *Logros y Obras Concluidas (${cumplidos.length}):*\n`;
        cumplidos.slice(0, 5).forEach((c, i) => {
            report += `${i + 1}. *${c.titulo}* (${c.barrio_comuna || c.municipio || 'General'}) - 100% Entregado.\n`;
        });
        report += `\n🚧 *En Ejecución Activa (${enEjecucion.length}):*\n`;
        enEjecucion.slice(0, 5).forEach((c, i) => {
            report += `• ${c.titulo} (${c.porcentaje_avance || 0}% de avance).\n`;
        });
        report += `\n¡Hechos, no palabras! Seguimos cumpliéndole a la gente. 👏🏗️`;

        navigator.clipboard.writeText(report);
        setCopiedReport(true);
        setTimeout(() => setCopiedReport(false), 3000);
    };

    // Métricas globales
    const totalCompromisos = compromisos.length;
    const cumplidos = compromisos.filter(c => c.estado === 'cumplido_entregado').length;
    const enEjecucion = compromisos.filter(c => c.estado === 'en_ejecucion').length;
    const inversionTotal = compromisos.reduce((acc, c) => acc + (parseFloat(c.inversion_presupuesto) || 0), 0);
    const beneficiariosTotales = compromisos.reduce((acc, c) => acc + (parseInt(c.beneficiarios_estimados, 10) || 0), 0);

    // Filtrado
    const filteredCompromisos = compromisos.filter(c => {
        if (filterEstado !== 'todos' && c.estado !== filterEstado) return false;
        if (filterSector !== 'todos' && c.secretaria_o_comision !== filterSector) return false;
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            return (
                c.titulo?.toLowerCase().includes(s) ||
                c.descripcion?.toLowerCase().includes(s) ||
                c.barrio_comuna?.toLowerCase().includes(s) ||
                c.lider_comunal_enlace?.toLowerCase().includes(s)
            );
        }
        return true;
    });

    return (
        <div className="space-y-6">
            {/* ========================================================= */}
            {/* HERO / ENCABEZADO DE GOBERNANZA & CASA POLÍTICA */}
            {/* ========================================================= */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-emerald-300 text-xs font-black uppercase tracking-wider">
                            <Landmark size={14} />
                            <span>Casa Política & Gestión del Mandato (4 Años de Gobierno)</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                            Comando de Gobernanza & Futuras Campañas
                        </h1>
                        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                            Seguimiento de obras, acuerdos, leyes y fidelización de bases para <strong>Alcaldes, Concejales, Diputados y Senadores</strong>. La campaña nunca termina: se gobierna con hechos para ganar la siguiente elección.
                        </p>
                    </div>

                    {/* Selector de Cargo para Adaptar el Tablero */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700 flex flex-wrap gap-1">
                            <button
                                onClick={() => setSelectedCargo('alcalde')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition ${
                                    selectedCargo === 'alcalde' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
                                }`}
                            >
                                🏢 Alcalde
                            </button>
                            <button
                                onClick={() => setSelectedCargo('concejal')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition ${
                                    selectedCargo === 'concejal' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
                                }`}
                            >
                                🏙️ Concejal
                            </button>
                            <button
                                onClick={() => setSelectedCargo('diputado')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition ${
                                    selectedCargo === 'diputado' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
                                }`}
                            >
                                🏛️ Diputado
                            </button>
                            <button
                                onClick={() => setSelectedCargo('senador')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition ${
                                    selectedCargo === 'senador' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
                                }`}
                            >
                                ⚖️ Senador/Congreso
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                setEditingItem(null);
                                setFormData({
                                    titulo: '',
                                    descripcion: '',
                                    tipo: selectedCargo === 'alcalde' ? 'obra_infraestructura' : selectedCargo === 'concejal' ? 'acuerdo_municipal' : selectedCargo === 'diputado' ? 'proyecto_normativo' : 'proyecto_ley',
                                    cargo_responsable: selectedCargo,
                                    secretaria_o_comision: 'Secretaría de Infraestructura & Obras',
                                    departamento: activeCampaign?.departamento || '',
                                    municipio: activeCampaign?.municipio || '',
                                    barrio_comuna: '',
                                    lider_comunal_enlace: '',
                                    estado: 'en_ejecucion',
                                    porcentaje_avance: 0,
                                    inversion_presupuesto: 0,
                                    fecha_inicio: '',
                                    fecha_cumplimiento: '',
                                    beneficiarios_estimados: 0,
                                    impacto_electoral_futuro: 'vital_para_reeleccion',
                                    evidencia_url: ''
                                });
                                setModalOpen(true);
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase rounded-xl transition shadow-lg shadow-emerald-500/20"
                        >
                            <Plus size={16} />
                            <span>Registrar Compromiso</span>
                        </button>
                    </div>
                </div>

                {/* Métricas de Gobernanza */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
                    <div className="bg-slate-900/60 backdrop-blur p-3.5 rounded-2xl border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Compromisos / Obras</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl font-black text-white">{totalCompromisos}</span>
                            <span className="text-[10px] text-emerald-400 font-bold">Fichas</span>
                        </div>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur p-3.5 rounded-2xl border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">100% Cumplidos & Entregados</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl font-black text-emerald-400">{cumplidos}</span>
                            <span className="text-[10px] text-slate-400 font-bold">
                                {totalCompromisos > 0 ? Math.round((cumplidos / totalCompromisos) * 100) : 0}% Éxito
                            </span>
                        </div>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur p-3.5 rounded-2xl border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inversión Gestionada (COP)</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-black text-amber-400">
                                ${inversionTotal.toLocaleString('es-CO')}
                            </span>
                        </div>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur p-3.5 rounded-2xl border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ciudadanos Beneficiados</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl font-black text-purple-400">
                                {beneficiariosTotales.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">Personas</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* GUÍA TÁCTICA DEL CARGO SELECCIONADO */}
            {/* ========================================================= */}
            <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Rol Activo: {selectedCargo.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500 font-bold">
                            Mandato {activeCampaign?.periodo_gobierno || '2024 - 2027'}
                        </span>
                    </div>
                    <p className="text-xs text-gray-600">
                        {selectedCargo === 'alcalde' && 'Supervise el Plan de Desarrollo, el avance de las Secretarías y blindajes con las JAC en cada comuna.'}
                        {selectedCargo === 'concejal' && 'Lleve la bitácora de Acuerdos Municipales, custodie los votos de sus barrios y canalice solicitudes vecinales.'}
                        {selectedCargo === 'diputado' && 'Controle la red de concejales por provincia, gestione regalías del OCAD y prepare la lista a la Cámara.'}
                        {selectedCargo === 'senador' && 'Monitoree proyectos de ley, padrinazgos de proyectos ante ministerios en Bogotá y cuide sus enlaces municipales.'}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopyWhatsAppReport}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase transition"
                    >
                        {copiedReport ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
                        <span>{copiedReport ? '¡Copiado!' : 'Boletín WhatsApp'}</span>
                    </button>

                    <Link
                        to="/social"
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase transition shadow"
                    >
                        <ShieldAlert size={14} />
                        <span>War Room Oposición</span>
                    </Link>
                </div>
            </div>

            {/* ========================================================= */}
            {/* FILTROS Y BÚSQUEDA */}
            {/* ========================================================= */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por obra, barrio, comuna, líder enlace o descripción..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <select
                        value={filterEstado}
                        onChange={e => setFilterEstado(e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-700"
                    >
                        <option value="todos">📊 Todos los Estados</option>
                        <option value="cumplido_entregado">✅ Cumplido & Entregado</option>
                        <option value="en_ejecucion">🚧 En Ejecución Activa</option>
                        <option value="en_estudio">📝 En Estudio / Viabilidad</option>
                        <option value="promesa_campana">🎯 Promesa de Campaña</option>
                    </select>

                    <button
                        onClick={fetchCompromisos}
                        className="p-2 text-gray-500 hover:text-slate-900 bg-gray-50 hover:bg-gray-100 rounded-xl transition"
                        title="Actualizar"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* ========================================================= */}
            {/* LISTADO DE COMPROMISOS / OBRAS / ACUERDOS */}
            {/* ========================================================= */}
            {loading ? (
                <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 shadow-sm space-y-3">
                    <RefreshCw size={28} className="animate-spin text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold text-gray-500 uppercase">Cargando tablero de gobernanza...</p>
                </div>
            ) : filteredCompromisos.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 shadow-sm space-y-3">
                    <Landmark size={36} className="text-gray-300 mx-auto" />
                    <h4 className="font-black text-slate-800 text-sm uppercase">No hay compromisos registrados en esta vista</h4>
                    <p className="text-xs text-gray-400 max-w-md mx-auto">
                        Registre las obras, proyectos de acuerdo o leyes que su equipo está ejecutando durante el mandato para rendir cuentas a los líderes comunales.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCompromisos.map(item => {
                        const isDone = item.estado === 'cumplido_entregado';
                        const inProgress = item.estado === 'en_ejecucion';

                        return (
                            <div
                                key={item.id}
                                className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                            isDone ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                            inProgress ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                            {isDone ? '✅ Cumplido & Entregado' : inProgress ? '🚧 En Ejecución' : '📝 En Estudio'}
                                        </span>

                                        <span className="text-[10px] font-bold text-gray-400 uppercase">
                                            {item.secretaria_o_comision || 'Gestión General'}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="font-black text-sm text-slate-900 leading-snug">
                                            {item.titulo}
                                        </h3>
                                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                                            {item.descripcion}
                                        </p>
                                    </div>

                                    {/* Barra de Avance */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[11px] font-bold">
                                            <span className="text-gray-500">Avance de Gestión:</span>
                                            <span className="text-emerald-700">{item.porcentaje_avance || (isDone ? 100 : 0)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${
                                                    isDone ? 'bg-emerald-500' : 'bg-amber-500'
                                                }`}
                                                style={{ width: `${item.porcentaje_avance || (isDone ? 100 : 25)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Localización y Líder Enlace */}
                                    <div className="bg-gray-50 p-2.5 rounded-xl text-xs space-y-1">
                                        {(item.barrio_comuna || item.municipio) && (
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <MapPin size={12} className="text-rose-500 shrink-0" />
                                                <span className="font-medium truncate">
                                                    {item.barrio_comuna ? `${item.barrio_comuna}, ` : ''}{item.municipio}
                                                </span>
                                            </div>
                                        )}

                                        {item.lider_comunal_enlace && (
                                            <div className="flex items-center gap-1.5 text-slate-700">
                                                <Users size={12} className="text-indigo-500 shrink-0" />
                                                <span className="font-bold truncate">
                                                    Líder Enlace: {item.lider_comunal_enlace}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Presupuesto y Beneficiarios */}
                                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                                        <div className="bg-slate-50 p-2 rounded-xl">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase block">Inversión</span>
                                            <span className="font-black text-slate-800 text-[11px]">
                                                ${parseFloat(item.inversion_presupuesto || 0).toLocaleString('es-CO')}
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded-xl">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase block">Beneficiarios</span>
                                            <span className="font-black text-purple-700 text-[11px]">
                                                {(item.beneficiarios_estimados || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                                    <button
                                        onClick={() => {
                                            setEditingItem(item);
                                            setFormData({ ...item });
                                            setModalOpen(true);
                                        }}
                                        className="text-gray-500 hover:text-slate-900 font-bold flex items-center gap-1"
                                    >
                                        <Edit3 size={13} />
                                        <span>Editar</span>
                                    </button>

                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="text-gray-400 hover:text-rose-600 font-bold flex items-center gap-1"
                                    >
                                        <Trash2 size={13} />
                                        <span>Eliminar</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: REGISTRAR / EDITAR COMPROMISO */}
            {/* ========================================================= */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="bg-gradient-to-r from-slate-950 to-emerald-950 p-6 text-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <Landmark size={20} className="text-emerald-400" />
                                <h3 className="font-black text-base uppercase">
                                    {editingItem ? 'Editar Compromiso de Mandato' : 'Registrar Obra / Compromiso de Gobierno'}
                                </h3>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-3 text-xs overflow-y-auto">
                            <div>
                                <label className="block text-gray-700 font-bold mb-1 uppercase">Título de la Obra / Proyecto *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej. Pavimentación Calle 45 o Proyecto de Acuerdo Transporte Gratuito"
                                    value={formData.titulo}
                                    onChange={e => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-700 font-bold mb-1 uppercase">Cargo Responsable</label>
                                    <select
                                        value={formData.cargo_responsable}
                                        onChange={e => setFormData(prev => ({ ...prev, cargo_responsable: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    >
                                        <option value="alcalde">🏢 Alcalde (Ejecutivo Municipal)</option>
                                        <option value="concejal">🏙️ Concejal (Acuerdo / Control Municipal)</option>
                                        <option value="diputado">🏛️ Diputado (Ordenanza / Depto)</option>
                                        <option value="senador">⚖️ Senador / Congresista (Leyes / Nación)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-bold mb-1 uppercase">Secretaría o Comisión Enlace</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Secretaría de Obras / MinVivienda"
                                        value={formData.secretaria_o_comision}
                                        onChange={e => setFormData(prev => ({ ...prev, secretaria_o_comision: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-bold mb-1 uppercase">Descripción y Alcance *</label>
                                <textarea
                                    required
                                    rows={2}
                                    placeholder="Detalles de la promesa, objetivos y beneficiarios..."
                                    value={formData.descripcion}
                                    onChange={e => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-700 font-bold mb-1 uppercase">Barrio / Comuna / Vereda</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Comuna 4 - Barrio La Esperanza"
                                        value={formData.barrio_comuna}
                                        onChange={e => setFormData(prev => ({ ...prev, barrio_comuna: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-bold mb-1 uppercase">Líder Comunal / JAC Enlace</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Don Carlos Restrepo (Pres. JAC)"
                                        value={formData.lider_comunal_enlace}
                                        onChange={e => setFormData(prev => ({ ...prev, lider_comunal_enlace: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-gray-700 font-bold mb-1 uppercase">Estado</label>
                                    <select
                                        value={formData.estado}
                                        onChange={e => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    >
                                        <option value="en_ejecucion">🚧 En Ejecución</option>
                                        <option value="cumplido_entregado">✅ Cumplido & Entregado</option>
                                        <option value="en_estudio">📝 En Estudio</option>
                                        <option value="promesa_campana">🎯 Promesa de Campaña</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-bold mb-1 uppercase">Avance (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.porcentaje_avance}
                                        onChange={e => setFormData(prev => ({ ...prev, porcentaje_avance: parseInt(e.target.value, 10) || 0 }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-bold mb-1 uppercase">Beneficiarios</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.beneficiarios_estimados}
                                        onChange={e => setFormData(prev => ({ ...prev, beneficiarios_estimados: parseInt(e.target.value, 10) || 0 }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-700 font-bold mb-1 uppercase">Presupuesto (COP)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.inversion_presupuesto}
                                        onChange={e => setFormData(prev => ({ ...prev, inversion_presupuesto: parseFloat(e.target.value) || 0 }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-bold mb-1 uppercase">Impacto Electoral Futuro</label>
                                    <select
                                        value={formData.impacto_electoral_futuro}
                                        onChange={e => setFormData(prev => ({ ...prev, impacto_electoral_futuro: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    >
                                        <option value="vital_para_reeleccion">🔥 Vital para la Reelección / Sucesor</option>
                                        <option value="alto">⭐ Alto Impacto Comunitario</option>
                                        <option value="medio">🟡 Impacto Moderado</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2 font-bold text-gray-500 uppercase"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase shadow"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
