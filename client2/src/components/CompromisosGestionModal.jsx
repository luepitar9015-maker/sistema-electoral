import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../config/api';
import { 
    X, Landmark, Plus, CheckCircle2, Clock, AlertTriangle, 
    DollarSign, Users, ExternalLink, Edit3, Trash2, MapPin, 
    FileText, Award, BarChart3, Filter, Building
} from 'lucide-react';

const SECTORES = [
    'Infraestructura & Vías',
    'Educación & Ciencia',
    'Salud & Bienestar',
    'Seguridad & Convivencia',
    'Empleo & Desarrollo Económico',
    'Medio Ambiente & Agua',
    'Juventud & Deporte',
    'Control Político & Transparencia',
    'Cultura & Comunidad',
    'Otro'
];

const TIPOS_COMPROMISO = [
    { id: 'obra_infraestructura', label: 'Obra de Infraestructura' },
    { id: 'proyecto_ley', label: 'Proyecto de Ley / Ordenanza' },
    { id: 'debate_control_politico', label: 'Debate de Control Político' },
    { id: 'acuerdo_municipal', label: 'Acuerdo Municipal' },
    { id: 'gestion_social', label: 'Gestión Social / Comunitaria' },
    { id: 'otra', label: 'Otro Compromiso' }
];

export default function CompromisosGestionModal({ campaign, isOpen, onClose }) {
    const [loading, setLoading] = useState(true);
    const [compromisos, setCompromisos] = useState([]);
    const [error, setError] = useState(null);
    const [filterEstado, setFilterEstado] = useState('todos');
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const token = localStorage.getItem('token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    const initialFormData = {
        titulo: '',
        sector: 'Infraestructura & Vías',
        tipo_compromiso: 'obra_infraestructura',
        descripcion: '',
        meta_cuantitativa: '',
        avance_porcentaje: 0,
        presupuesto_estimado_cop: 0,
        presupuesto_ejecutado_cop: 0,
        municipio: campaign?.municipio || '',
        comuna_localidad: '',
        fecha_meta: '',
        estado: 'propuesta',
        beneficiarios_estimados: 0,
        evidencia_url: ''
    };

    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        if (!isOpen || !campaign) return;
        fetchCompromisos();
    }, [isOpen, campaign]);

    const fetchCompromisos = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API}/campaigns/${campaign.id}/compromisos`, authHeaders);
            setCompromisos(res.data || []);
        } catch (err) {
            console.error('Error fetching compromisos:', err);
            setError(err.response?.data?.message || 'Error al cargar compromisos de gestión');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingItem(null);
        setFormData({
            ...initialFormData,
            municipio: campaign?.municipio || ''
        });
        setShowForm(true);
    };

    const handleOpenEdit = (item) => {
        setEditingItem(item);
        setFormData({
            titulo: item.titulo,
            sector: item.sector || 'Infraestructura & Vías',
            tipo_compromiso: item.tipo_compromiso || 'obra_infraestructura',
            descripcion: item.descripcion || '',
            meta_cuantitativa: item.meta_cuantitativa || '',
            avance_porcentaje: item.avance_porcentaje || 0,
            presupuesto_estimado_cop: item.presupuesto_estimado_cop || 0,
            presupuesto_ejecutado_cop: item.presupuesto_ejecutado_cop || 0,
            municipio: item.municipio || '',
            comuna_localidad: item.comuna_localidad || '',
            fecha_meta: item.fecha_meta ? item.fecha_meta.split('T')[0] : '',
            estado: item.estado || 'propuesta',
            beneficiarios_estimados: item.beneficiarios_estimados || 0,
            evidencia_url: item.evidencia_url || ''
        });
        setShowForm(true);
    };

    const handleSubmitForm = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingItem) {
                await axios.put(`${API}/campaigns/${campaign.id}/compromisos/${editingItem.id}`, formData, authHeaders);
            } else {
                await axios.post(`${API}/campaigns/${campaign.id}/compromisos`, formData, authHeaders);
            }
            await fetchCompromisos();
            setShowForm(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Error al guardar compromiso');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, titulo) => {
        if (!window.confirm(`¿Estás seguro de eliminar el compromiso "${titulo}"?`)) return;
        try {
            await axios.delete(`${API}/campaigns/${campaign.id}/compromisos/${id}`, authHeaders);
            await fetchCompromisos();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al eliminar compromiso');
        }
    };

    if (!isOpen) return null;

    // Métricas globales
    const totalCompromisos = compromisos.length;
    const cumplidos = compromisos.filter(c => c.estado === 'cumplido').length;
    const enEjecucion = compromisos.filter(c => c.estado === 'en_ejecucion').length;
    const rezagados = compromisos.filter(c => c.estado === 'rezagado').length;
    const pctCumplimientoGlobal = totalCompromisos > 0 
        ? Math.round(compromisos.reduce((acc, c) => acc + (c.avance_porcentaje || 0), 0) / totalCompromisos)
        : 0;
    const totalPresupuestoEjecutado = compromisos.reduce((acc, c) => acc + (parseFloat(c.presupuesto_ejecutado_cop) || 0), 0);
    const totalBeneficiarios = compromisos.reduce((acc, c) => acc + (parseInt(c.beneficiarios_estimados, 10) || 0), 0);

    const filtered = compromisos.filter(c => {
        if (filterEstado === 'todos') return true;
        return c.estado === filterEstado;
    });

    const formatCOP = (num) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-5xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400">
                            <Landmark size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/40">
                                    Modo Mandatario en Cargo (4 Años)
                                </span>
                                <span className="text-xs text-slate-400 font-mono">
                                    {campaign?.periodo_gobierno || '2024-2027'}
                                </span>
                            </div>
                            <h3 className="font-black text-xl uppercase tracking-wide text-white mt-0.5">
                                Rendición de Cuentas, Obras & Compromisos
                            </h3>
                            <p className="text-slate-300 text-xs">
                                Gestión de obras, proyectos de ley, debates y presupuesto ejecutado de {campaign?.candidato} ({campaign?.tipo_cargo}).
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
                    {loading && (
                        <div className="py-16 text-center space-y-3">
                            <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-sm font-bold text-gray-500">Cargando compromisos de gestión pública...</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-3">
                            <AlertTriangle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {!loading && (
                        <>
                            {/* Panel KPI de Mandato */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Compromisos Totales
                                    </span>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <h4 className="text-2xl font-black text-white">{totalCompromisos}</h4>
                                        <span className="text-[11px] text-emerald-400 font-bold">{cumplidos} cumplidos</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                        {enEjecucion} en ejecución · {rezagados} rezagados
                                    </span>
                                </div>

                                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                                        Cumplimiento Global
                                    </span>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <h4 className="text-2xl font-black text-emerald-900">{pctCumplimientoGlobal}%</h4>
                                        <span className="text-xs text-emerald-700 font-bold">del plan</span>
                                    </div>
                                    <div className="w-full bg-emerald-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${pctCumplimientoGlobal}%` }} />
                                    </div>
                                </div>

                                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl">
                                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                                        Presupuesto Ejecutado
                                    </span>
                                    <h4 className="text-lg font-black text-indigo-950 mt-1 truncate" title={formatCOP(totalPresupuestoEjecutado)}>
                                        {formatCOP(totalPresupuestoEjecutado)}
                                    </h4>
                                    <span className="text-[10px] text-indigo-600 block mt-0.5">
                                        Inversión pública gestionada
                                    </span>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
                                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                                        Beneficiarios Impactados
                                    </span>
                                    <h4 className="text-2xl font-black text-amber-950 mt-1">
                                        {totalBeneficiarios.toLocaleString()}
                                    </h4>
                                    <span className="text-[10px] text-amber-700 block mt-0.5">
                                        Ciudadanos y familias
                                    </span>
                                </div>
                            </div>

                            {/* Barra de Filtros y Botón Nuevo Compromiso */}
                            <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-2.5 rounded-2xl border border-gray-200">
                                <div className="flex items-center gap-1.5 text-xs font-bold overflow-x-auto">
                                    <button
                                        type="button"
                                        onClick={() => setFilterEstado('todos')}
                                        className={`px-3 py-1.5 rounded-xl transition-all ${filterEstado === 'todos' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        Todos ({totalCompromisos})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterEstado('cumplido')}
                                        className={`px-3 py-1.5 rounded-xl transition-all ${filterEstado === 'cumplido' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        Cumplidos ({cumplidos})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterEstado('en_ejecucion')}
                                        className={`px-3 py-1.5 rounded-xl transition-all ${filterEstado === 'en_ejecucion' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        En Ejecución ({enEjecucion})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFilterEstado('rezagado')}
                                        className={`px-3 py-1.5 rounded-xl transition-all ${filterEstado === 'rezagado' ? 'bg-rose-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        Rezagados ({rezagados})
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleOpenCreate}
                                    className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
                                >
                                    <Plus size={16} />
                                    <span>Registrar Compromiso u Obra</span>
                                </button>
                            </div>

                            {/* Formulario Crear / Editar (Drawer / Tarjeta) */}
                            {showForm && (
                                <div className="bg-slate-50 border-2 border-amber-300/80 rounded-3xl p-5 shadow-lg space-y-4 animate-in fade-in duration-200">
                                    <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                                        <h4 className="font-black text-sm uppercase tracking-wide text-slate-800 flex items-center gap-2">
                                            <FileText size={16} className="text-amber-600" />
                                            {editingItem ? 'Editar Compromiso de Gestión' : 'Nuevo Compromiso / Obra de Mandato'}
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => setShowForm(false)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="sm:col-span-2">
                                                <label className="block text-gray-700 font-bold mb-1 uppercase text-[10px]">
                                                    Título del Compromiso / Obra
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej. Construcción del Centro de Salud San Javier"
                                                    value={formData.titulo}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                                                    className="w-full bg-white border border-gray-300 rounded-xl p-2.5 font-bold text-gray-800 focus:outline-none focus:border-amber-500"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-gray-700 font-bold mb-1 uppercase text-[10px]">
                                                    Sector de Gestión
                                                </label>
                                                <select
                                                    value={formData.sector}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                                                    className="w-full bg-white border border-gray-300 rounded-xl p-2.5 font-bold text-gray-800 focus:outline-none focus:border-amber-500"
                                                >
                                                    {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-gray-700 font-bold mb-1 uppercase text-[10px]">
                                                    Tipo de Compromiso
                                                </label>
                                                <select
                                                    value={formData.tipo_compromiso}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, tipo_compromiso: e.target.value }))}
                                                    className="w-full bg-white border border-gray-300 rounded-xl p-2.5 font-bold text-gray-800 focus:outline-none focus:border-amber-500"
                                                >
                                                    {TIPOS_COMPROMISO.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-gray-700 font-bold mb-1 uppercase text-[10px]">
                                                    Estado de Ejecución
                                                </label>
                                                <select
                                                    value={formData.estado}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                                                    className="w-full bg-white border border-gray-300 rounded-xl p-2.5 font-bold text-gray-800 focus:outline-none focus:border-amber-500"
                                                >
                                                    <option value="propuesta">Propuesta / Radicado</option>
                                                    <option value="en_ejecucion">En Ejecución / Debate</option>
                                                    <option value="cumplido">Cumplido / Inaugurado</option>
                                                    <option value="rezagado">Rezagado</option>
                                                    <option value="archivado">Archivado</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-gray-700 font-bold mb-1 uppercase text-[10px]">
                                                    Avance Cuantitativo (%): {formData.avance_porcentaje}%
                                                </label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={formData.avance_porcentaje}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, avance_porcentaje: parseInt(e.target.value, 10) }))}
                                                    className="w-full accent-amber-600 mt-2 cursor-pointer"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-gray-700 font-bold mb-1 uppercase text-[10px]">
                                                    Meta Cuantitativa / Entregable
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej. 12 km de placa huella / 1 sala UCI"
                                                    value={formData.meta_cuantitativa}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, meta_cuantitativa: e.target.value }))}
                                                    className="w-full bg-white border border-gray-300 rounded-xl p-2 font-bold text-gray-800 focus:outline-none focus:border-amber-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-gray-700 font-bold mb-1 uppercase text-[10px]">
                                                    Presupuesto Estimado ($ COP)
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="Ej. 150000000"
                                                    value={formData.presupuesto_estimado_cop}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, presupuesto_estimado_cop: e.target.value }))}
                                                    className="w-full bg-white border border-gray-300 rounded-xl p-2 font-bold text-gray-800 focus:outline-none focus:border-amber-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-gray-700 font-bold mb-1 uppercase text-[10px]">
                                                    Presupuesto Ejecutado ($ COP)
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="Ej. 120000000"
                                                    value={formData.presupuesto_ejecutado_cop}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, presupuesto_ejecutado_cop: e.target.value }))}
                                                    className="w-full bg-white border border-gray-300 rounded-xl p-2 font-bold text-gray-800 focus:outline-none focus:border-amber-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-gray-700 font-bold mb-1 uppercase text-[10px]">
                                                    Municipio / Territorio
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej. Medellín"
                                                    value={formData.municipio}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, municipio: e.target.value }))}
                                                    className="w-full bg-white border border-gray-300 rounded-xl p-2 font-bold text-gray-800 focus:outline-none focus:border-amber-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-gray-700 font-bold mb-1 uppercase text-[10px]">
                                                    Comuna / Localidad / Vereda
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Ej. Comuna 13 - San Javier"
                                                    value={formData.comuna_localidad}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, comuna_localidad: e.target.value }))}
                                                    className="w-full bg-white border border-gray-300 rounded-xl p-2 font-bold text-gray-800 focus:outline-none focus:border-amber-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-gray-700 font-bold mb-1 uppercase text-[10px]">
                                                    Beneficiarios Estimados
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="Ej. 15000"
                                                    value={formData.beneficiarios_estimados}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, beneficiarios_estimados: e.target.value }))}
                                                    className="w-full bg-white border border-gray-300 rounded-xl p-2 font-bold text-gray-800 focus:outline-none focus:border-amber-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-gray-700 font-bold mb-1 uppercase text-[10px]">
                                                    Descripción Detallada
                                                </label>
                                                <textarea
                                                    rows="2"
                                                    placeholder="Detalles del proyecto, beneficiarios, justificación y alcance..."
                                                    value={formData.descripcion}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                                                    className="w-full bg-white border border-gray-300 rounded-xl p-2 font-medium text-gray-800 focus:outline-none focus:border-amber-500"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <div>
                                                    <label className="block text-gray-700 font-bold mb-1 uppercase text-[10px]">
                                                        Enlace a Evidencia / Gaceta / Fotos
                                                    </label>
                                                    <input
                                                        type="url"
                                                        placeholder="https://gaceta.congreso.gov.co/... o link drive"
                                                        value={formData.evidencia_url}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, evidencia_url: e.target.value }))}
                                                        className="w-full bg-white border border-gray-300 rounded-xl p-2 font-bold text-gray-800 focus:outline-none focus:border-amber-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-700 font-bold mb-1 uppercase text-[10px]">
                                                        Fecha Meta de Entrega
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={formData.fecha_meta}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, fecha_meta: e.target.value }))}
                                                        className="w-full bg-white border border-gray-300 rounded-xl p-2 font-bold text-gray-800 focus:outline-none focus:border-amber-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                                            <button
                                                type="button"
                                                onClick={() => setShowForm(false)}
                                                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 font-bold"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold uppercase tracking-wider transition-all shadow-sm"
                                            >
                                                {submitting ? 'Guardando...' : editingItem ? 'Actualizar Compromiso' : 'Registrar Compromiso'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Lista de Compromisos */}
                            <div className="space-y-3">
                                {filtered.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filtered.map(comp => {
                                            const isDone = comp.estado === 'cumplido';
                                            const isPending = comp.estado === 'en_ejecucion';
                                            const isLate = comp.estado === 'rezagado';

                                            return (
                                                <div
                                                    key={comp.id}
                                                    className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 relative overflow-hidden"
                                                >
                                                    <div className={`h-1.5 absolute top-0 left-0 right-0 ${
                                                        isDone ? 'bg-emerald-500' : isPending ? 'bg-blue-500' : isLate ? 'bg-rose-500' : 'bg-amber-500'
                                                    }`} />

                                                    <div className="space-y-2">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                                                    {comp.sector}
                                                                </span>
                                                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                                                    isDone ? 'bg-emerald-100 text-emerald-800' : isPending ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                    {comp.estado}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenEdit(comp)}
                                                                    className="p-1.5 text-gray-400 hover:text-slate-800 rounded-lg hover:bg-gray-100"
                                                                    title="Editar"
                                                                >
                                                                    <Edit3 size={14} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDelete(comp.id, comp.titulo)}
                                                                    className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                                                    title="Eliminar"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <h5 className="font-black text-slate-800 text-sm leading-snug">
                                                            {comp.titulo}
                                                        </h5>

                                                        {comp.descripcion && (
                                                            <p className="text-xs text-gray-500 line-clamp-2">
                                                                {comp.descripcion}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Avance */}
                                                    <div className="space-y-1 pt-1">
                                                        <div className="flex justify-between text-[11px]">
                                                            <span className="text-gray-500 font-bold">Avance de ejecución:</span>
                                                            <strong className="text-slate-800">{comp.avance_porcentaje || 0}%</strong>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${
                                                                    isDone ? 'bg-emerald-500' : isPending ? 'bg-blue-500' : 'bg-amber-500'
                                                                }`}
                                                                style={{ width: `${comp.avance_porcentaje || 0}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Datos Adicionales */}
                                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] grid grid-cols-2 gap-2 text-gray-600">
                                                        <div>
                                                            <span className="text-[10px] text-gray-400 uppercase block">Inversión Ejecutada</span>
                                                            <strong className="text-slate-800">{formatCOP(comp.presupuesto_ejecutado_cop || 0)}</strong>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-gray-400 uppercase block">Impacto Ciudadano</span>
                                                            <strong className="text-slate-800">{(comp.beneficiarios_estimados || 0).toLocaleString()} hab.</strong>
                                                        </div>
                                                    </div>

                                                    {/* Footer de Tarjeta */}
                                                    <div className="flex items-center justify-between text-[11px] pt-1">
                                                        <span className="text-gray-400 flex items-center gap-1">
                                                            <MapPin size={12} />
                                                            {comp.comuna_localidad || comp.municipio || 'Territorio municipal'}
                                                        </span>

                                                        {comp.evidencia_url && (
                                                            <a
                                                                href={comp.evidencia_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1"
                                                            >
                                                                <span>Ver Evidencia</span>
                                                                <ExternalLink size={11} />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-12 border-2 border-dashed border-gray-200 rounded-2xl text-center space-y-2">
                                        <Landmark className="mx-auto text-gray-300" size={36} />
                                        <p className="text-xs font-bold text-gray-500">
                                            No hay compromisos u obras registradas bajo este filtro.
                                        </p>
                                        <p className="text-[11px] text-gray-400">
                                            Usa el botón "Registrar Compromiso u Obra" para alimentar el plan cuatrienal y rendición de cuentas.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 font-medium">
                        Módulo de Gobernanza y Rendición de Cuentas durante el periodo de mandato 4 años
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
                    >
                        Cerrar Módulo
                    </button>
                </div>
            </div>
        </div>
    );
}
