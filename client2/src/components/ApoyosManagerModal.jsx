import { useState, useEffect } from 'react';
import axios from 'axios';
import { colombiaData } from '../data/colombiaData';
import {
    Users, Plus, Trash2, Edit3, X, Check, Phone, Mail,
    MapPin, Award, Upload, Image, ChevronRight, AlertCircle,
    CheckCircle2, Target, BarChart2
} from 'lucide-react';
import { API } from '../config/api';

const TIPOS_APOYO = [
    { id: 'candidato_concejo',  label: 'Candidato(a) al Concejo Municipal' },
    { id: 'candidato_asamblea', label: 'Candidato(a) a la Asamblea Departamental' },
    { id: 'candidato_camara',   label: 'Candidato(a) a la Cámara de Representantes' },
    { id: 'lider_comunal',      label: 'Líder(esa) Comunal / JAC' },
    { id: 'gremio',             label: 'Gremio / Sector Económico' },
    { id: 'movimiento_social',  label: 'Movimiento Social / Ciudadano' },
    { id: 'otro',               label: 'Otro Aliado Político' },
];

export default function ApoyosManagerModal({ campaign, isOpen, onClose, onApoyosUpdated }) {
    const token = localStorage.getItem('token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    const [apoyos, setApoyos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingApoyo, setEditingApoyo] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [form, setForm] = useState({
        nombre: '',
        tipo_apoyo: 'candidato_concejo',
        cargo_o_rol: '',
        partido_politico: '',
        telefono: '',
        email: '',
        departamento: campaign?.departamento || '',
        municipio: campaign?.municipio || '',
        compromiso_votos: 500,
        foto: '',
        observaciones: ''
    });

    const [municipios, setMunicipios] = useState([]);

    const fetchApoyos = async () => {
        if (!campaign) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API}/apoyos/campaign/${campaign.id}`, authHeaders);
            setApoyos(res.data);
            if (onApoyosUpdated) onApoyosUpdated();
        } catch (err) {
            console.error('Error fetching apoyos:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && campaign) {
            fetchApoyos();
            resetForm();
            setShowForm(false);
        }
    }, [isOpen, campaign?.id]);

    const resetForm = () => {
        setEditingApoyo(null);
        setForm({
            nombre: '',
            tipo_apoyo: 'candidato_concejo',
            cargo_o_rol: '',
            partido_politico: '',
            telefono: '',
            email: '',
            departamento: campaign?.departamento || '',
            municipio: campaign?.municipio || '',
            compromiso_votos: 500,
            foto: '',
            observaciones: ''
        });
        if (campaign?.departamento && colombiaData[campaign.departamento]) {
            setMunicipios(colombiaData[campaign.departamento]?.sort() || []);
        } else {
            setMunicipios([]);
        }
        setErrorMsg('');
    };

    const handleDeptoChange = (depto) => {
        setForm(prev => ({ ...prev, departamento: depto, municipio: '' }));
        if (depto && colombiaData[depto]) {
            setMunicipios(colombiaData[depto]?.sort() || []);
        } else {
            setMunicipios([]);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen no puede exceder los 5MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = (uploadEvt) => {
            setForm(prev => ({ ...prev, foto: uploadEvt.target.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleOpenEdit = (apoyo) => {
        setEditingApoyo(apoyo);
        setForm({
            nombre: apoyo.nombre,
            tipo_apoyo: apoyo.tipo_apoyo || 'candidato_concejo',
            cargo_o_rol: apoyo.cargo_o_rol || '',
            partido_politico: apoyo.partido_politico || '',
            telefono: apoyo.telefono || '',
            email: apoyo.email || '',
            departamento: apoyo.departamento || '',
            municipio: apoyo.municipio || '',
            compromiso_votos: apoyo.compromiso_votos || 0,
            foto: apoyo.foto || '',
            observaciones: apoyo.observaciones || ''
        });
        if (apoyo.departamento && colombiaData[apoyo.departamento]) {
            setMunicipios(colombiaData[apoyo.departamento]?.sort() || []);
        }
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMsg('');

        try {
            if (editingApoyo) {
                await axios.put(`${API}/apoyos/${editingApoyo.id}`, form, authHeaders);
            } else {
                await axios.post(`${API}/apoyos`, { ...form, campana_id: campaign.id }, authHeaders);
            }
            await fetchApoyos();
            setShowForm(false);
            resetForm();
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Error al guardar el apoyo');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, nombre) => {
        if (!window.confirm(`¿Estás seguro de eliminar el apoyo político de "${nombre}"?`)) return;
        try {
            await axios.delete(`${API}/apoyos/${id}`, authHeaders);
            await fetchApoyos();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al eliminar apoyo');
        }
    };

    if (!isOpen || !campaign) return null;

    // Métricas totales
    const totalCompromiso = apoyos.reduce((acc, curr) => acc + (parseInt(curr.compromiso_votos, 10) || 0), 0);
    const totalLogrados = apoyos.reduce((acc, curr) => acc + (parseInt(curr.votosLogrados, 10) || 0), 0);
    const globalPercent = totalCompromiso > 0 ? Math.min(100, Math.round((totalLogrados / totalCompromiso) * 100)) : 0;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header del Modal */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white flex items-center justify-between border-b border-gray-800">
                    <div className="flex items-center gap-4">
                        {campaign.foto_candidato ? (
                            <img
                                src={campaign.foto_candidato}
                                alt={campaign.candidato}
                                className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-md"
                            />
                        ) : (
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00B894] to-emerald-700 flex items-center justify-center text-white font-black text-xl shadow-md">
                                {campaign.candidato?.charAt(0) || 'C'}
                            </div>
                        )}
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider bg-[#00B894] text-white px-2 py-0.5 rounded">
                                    {campaign.tipo_cargo.toUpperCase()}
                                </span>
                                <span className="text-gray-400 text-xs">· {campaign.candidato}</span>
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-wide text-white mt-0.5">
                                Apoyos Políticos y Alianzas
                            </h2>
                            {campaign.eslogan && (
                                <p className="text-xs text-emerald-300 italic font-medium">
                                    "{campaign.eslogan}"
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Dashboard Métricas de Apoyos */}
                <div className="p-4 bg-slate-50 border-b border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-3 rounded-2xl border border-gray-200/70 shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Total Aliados</span>
                        <span className="text-2xl font-black text-slate-800">{apoyos.length}</span>
                        <span className="text-[10px] text-gray-500 block mt-0.5">actores vinculados</span>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-gray-200/70 shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Votos Comprometidos</span>
                        <span className="text-2xl font-black text-[#00B894]">{totalCompromiso.toLocaleString()}</span>
                        <span className="text-[10px] text-gray-500 block mt-0.5">pactados con apoyos</span>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-gray-200/70 shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Votos Logrados</span>
                        <span className="text-2xl font-black text-blue-600">{totalLogrados.toLocaleString()}</span>
                        <span className="text-[10px] text-gray-500 block mt-0.5">registrados en sistema</span>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-gray-200/70 shadow-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Cumplimiento</span>
                            <span className="text-xs font-black text-slate-700">{globalPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 mt-2 overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${globalPercent}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-emerald-700 font-semibold block mt-1">Avance global</span>
                    </div>
                </div>

                {/* Contenido: Lista o Formulario */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Botón Barra de Control */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                            <span>Directorio de Apoyos y Acuerdos</span>
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                {apoyos.length}
                            </span>
                        </h3>

                        {!showForm ? (
                            <button
                                onClick={() => { resetForm(); setShowForm(true); }}
                                className="flex items-center gap-1.5 bg-[#00B894] hover:bg-[#00a884] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
                            >
                                <Plus size={16} />
                                <span>Registrar Nuevo Apoyo</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => { setShowForm(false); resetForm(); }}
                                className="flex items-center gap-1.5 text-gray-600 hover:text-slate-900 border border-gray-300 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-50 transition-all"
                            >
                                <X size={16} />
                                <span>Cerrar Formulario</span>
                            </button>
                        )}
                    </div>

                    {/* FORMULARIO CREAR / EDITAR APOYO */}
                    {showForm && (
                        <div className="bg-slate-50 border border-emerald-200 rounded-2xl p-6 shadow-md animate-in fade-in duration-200">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                                <h4 className="font-black text-sm uppercase text-slate-800 flex items-center gap-2">
                                    <Target size={18} className="text-[#00B894]" />
                                    <span>{editingApoyo ? 'Editar Apoyo Político' : 'Registrar Nuevo Apoyo / Alianza'}</span>
                                </h4>
                                <span className="text-xs text-gray-400">Pacta y rastrea compromisos de votación</span>
                            </div>

                            {errorMsg && (
                                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                    {/* Nombre */}
                                    <div>
                                        <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                            Nombre del Aliado / Candidato / Líder *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ej. Andrés Felipe Morales"
                                            value={form.nombre}
                                            onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                                            className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#00B894]"
                                        />
                                    </div>

                                    {/* Tipo de Apoyo */}
                                    <div>
                                        <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                            Tipo de Apoyo o Alianza *
                                        </label>
                                        <select
                                            value={form.tipo_apoyo}
                                            onChange={e => setForm(prev => ({ ...prev, tipo_apoyo: e.target.value }))}
                                            className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#00B894]"
                                        >
                                            {TIPOS_APOYO.map(t => (
                                                <option key={t.id} value={t.id}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Cargo o Rol Específico */}
                                    <div>
                                        <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                            Cargo, Candidatura o Rol
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej. Candidato Concejo #7, Presidente JAC Comuna 4"
                                            value={form.cargo_o_rol}
                                            onChange={e => setForm(prev => ({ ...prev, cargo_o_rol: e.target.value }))}
                                            className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#00B894]"
                                        />
                                    </div>

                                    {/* Partido Político */}
                                    <div>
                                        <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                            Partido o Movimiento Político
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej. Partido Liberal, Alianza Verde, etc."
                                            value={form.partido_politico}
                                            onChange={e => setForm(prev => ({ ...prev, partido_politico: e.target.value }))}
                                            className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#00B894]"
                                        />
                                    </div>

                                    {/* Compromiso de Votos */}
                                    <div>
                                        <label className="block text-gray-600 font-bold mb-1 text-xs uppercase text-[#00B894]">
                                            Compromiso de Votos (Meta Pactada) *
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            required
                                            placeholder="Ej. 1000"
                                            value={form.compromiso_votos}
                                            onChange={e => setForm(prev => ({ ...prev, compromiso_votos: e.target.value }))}
                                            className="w-full bg-white border-2 border-emerald-400 rounded-xl p-2.5 text-xs font-black text-emerald-800 focus:outline-none focus:border-emerald-600"
                                        />
                                    </div>

                                    {/* Teléfono */}
                                    <div>
                                        <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                            Teléfono / WhatsApp
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ej. 3001234567"
                                            value={form.telefono}
                                            onChange={e => setForm(prev => ({ ...prev, telefono: e.target.value }))}
                                            className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#00B894]"
                                        />
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                            Correo Electrónico
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="Ej. contacto@ejemplo.com"
                                            value={form.email}
                                            onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#00B894]"
                                        />
                                    </div>

                                    {/* Departamento */}
                                    <div>
                                        <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                            Departamento
                                        </label>
                                        <select
                                            value={form.departamento}
                                            onChange={e => handleDeptoChange(e.target.value)}
                                            className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#00B894]"
                                        >
                                            <option value="">-- Seleccionar --</option>
                                            {Object.keys(colombiaData).sort().map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Municipio */}
                                    <div>
                                        <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                            Municipio
                                        </label>
                                        <select
                                            value={form.municipio}
                                            onChange={e => setForm(prev => ({ ...prev, municipio: e.target.value }))}
                                            className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#00B894]"
                                            disabled={!form.departamento}
                                        >
                                            <option value="">-- Seleccionar Municipio --</option>
                                            {municipios.map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Foto del Apoyo */}
                                    <div>
                                        <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                            Foto del Aliado (Opcional)
                                        </label>
                                        <div className="flex items-center gap-3">
                                            {form.foto ? (
                                                <div className="relative">
                                                    <img
                                                        src={form.foto}
                                                        alt="Previa"
                                                        className="w-11 h-11 rounded-xl object-cover border border-emerald-300"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setForm(prev => ({ ...prev, foto: '' }))}
                                                        className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            ) : null}
                                            <label className="flex items-center gap-1.5 bg-white border border-gray-300 hover:border-[#00B894] px-3 py-2 rounded-xl text-xs font-bold text-gray-700 cursor-pointer shadow-sm transition-colors">
                                                <Upload size={14} />
                                                <span>Subir Foto</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleImageUpload}
                                                />
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="o URL de imagen"
                                                value={form.foto}
                                                onChange={e => setForm(prev => ({ ...prev, foto: e.target.value }))}
                                                className="flex-1 bg-white border border-gray-300 rounded-xl p-2 text-xs text-gray-700 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Observaciones */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                            Acuerdos Políticos / Observaciones
                                        </label>
                                        <textarea
                                            rows="2"
                                            placeholder="Detalles del acuerdo, comités a cargo, sectores de influencia..."
                                            value={form.observaciones}
                                            onChange={e => setForm(prev => ({ ...prev, observaciones: e.target.value }))}
                                            className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#00B894]"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 font-bold text-xs uppercase hover:bg-gray-100"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-6 py-2 rounded-xl bg-[#00B894] hover:bg-[#00a884] disabled:bg-gray-300 text-white font-bold text-xs uppercase shadow transition-all"
                                    >
                                        {submitting ? 'Guardando...' : editingApoyo ? 'Actualizar Apoyo' : 'Guardar Apoyo'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* LISTADO DE APOYOS */}
                    {loading ? (
                        <div className="py-12 text-center text-gray-400 text-xs">
                            Cargando apoyos políticos...
                        </div>
                    ) : apoyos.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-3">
                            <Target size={36} className="mx-auto text-gray-300" />
                            <p className="text-sm font-bold text-gray-700">No hay apoyos políticos registrados aún para esta campaña.</p>
                            <p className="text-xs text-gray-400 max-w-sm mx-auto">
                                Registra a los candidatos al concejo, asamblea, líderes comunales o gremios que apoyan a tu candidato y sigue el cumplimiento de sus votos.
                            </p>
                            <button
                                onClick={() => { resetForm(); setShowForm(true); }}
                                className="inline-flex items-center gap-2 bg-[#00B894] text-white px-4 py-2 rounded-xl font-bold text-xs uppercase shadow-sm"
                            >
                                <Plus size={16} /> Registrar Primer Apoyo
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {apoyos.map(apoyo => {
                                const tipoObj = TIPOS_APOYO.find(t => t.id === apoyo.tipo_apoyo);
                                const progress = apoyo.porcentajeCumplimiento || 0;
                                const isGoalMet = progress >= 100;

                                return (
                                    <div
                                        key={apoyo.id}
                                        className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 p-4 space-y-3 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                                    >
                                        <div>
                                            {/* Header Apoyo */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    {apoyo.foto ? (
                                                        <img
                                                            src={apoyo.foto}
                                                            alt={apoyo.nombre}
                                                            className="w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-sm"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-black text-sm">
                                                            {apoyo.nombre.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h4 className="font-black text-slate-900 text-sm leading-tight">
                                                            {apoyo.nombre}
                                                        </h4>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-0.5 inline-block">
                                                            {tipoObj?.label || apoyo.tipo_apoyo}
                                                        </span>
                                                        {apoyo.cargo_o_rol && (
                                                            <p className="text-xs text-gray-500 font-medium">
                                                                {apoyo.cargo_o_rol}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleOpenEdit(apoyo)}
                                                        className="p-1.5 text-gray-400 hover:text-slate-800 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Editar apoyo"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(apoyo.id, apoyo.nombre)}
                                                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Eliminar apoyo"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Datos Adicionales */}
                                            <div className="mt-3 bg-gray-50 p-2.5 rounded-xl text-[11px] space-y-1 text-gray-600">
                                                {apoyo.partido_politico && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400 uppercase text-[9px] font-bold">Partido:</span>
                                                        <span className="font-semibold text-slate-800">{apoyo.partido_politico}</span>
                                                    </div>
                                                )}
                                                {(apoyo.departamento || apoyo.municipio) && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-400 uppercase text-[9px] font-bold">Territorio:</span>
                                                        <span className="font-semibold text-slate-800">
                                                            {[apoyo.municipio, apoyo.departamento].filter(Boolean).join(', ')}
                                                        </span>
                                                    </div>
                                                )}
                                                {apoyo.observaciones && (
                                                    <p className="text-gray-500 italic text-[10px] pt-1 border-t border-gray-200">
                                                        "{apoyo.observaciones}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Barra de Votos Pactados vs Logrados */}
                                        <div className="space-y-1.5 pt-2 border-t border-gray-100">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-slate-700 flex items-center gap-1">
                                                    <Target size={12} className="text-[#00B894]" />
                                                    <span>{apoyo.votosLogrados || 0} / {apoyo.compromiso_votos} votos</span>
                                                </span>
                                                <span className={`text-[11px] font-black ${isGoalMet ? 'text-emerald-600' : 'text-slate-600'}`}>
                                                    {progress}%
                                                </span>
                                            </div>

                                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${isGoalMet ? 'bg-emerald-500' : 'bg-[#00B894]'}`}
                                                    style={{ width: `${Math.min(100, progress)}%` }}
                                                />
                                            </div>

                                            {/* Canales de Contacto */}
                                            <div className="flex items-center justify-between pt-1 text-[10px]">
                                                <div className="flex items-center gap-2">
                                                    {apoyo.telefono && (
                                                        <a
                                                            href={`https://wa.me/57${apoyo.telefono.replace(/\D/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-emerald-600 hover:underline flex items-center gap-1 font-bold"
                                                        >
                                                            <Phone size={10} /> {apoyo.telefono}
                                                        </a>
                                                    )}
                                                    {apoyo.email && (
                                                        <a
                                                            href={`mailto:${apoyo.email}`}
                                                            className="text-blue-600 hover:underline flex items-center gap-1 font-bold"
                                                        >
                                                            <Mail size={10} /> Contactar
                                                        </a>
                                                    )}
                                                </div>

                                                <span className="text-gray-400 font-medium">
                                                    {apoyo.votersCount || 0} votantes vinculados
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Modal */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors"
                    >
                        Cerrar Directorio
                    </button>
                </div>
            </div>
        </div>
    );
}
