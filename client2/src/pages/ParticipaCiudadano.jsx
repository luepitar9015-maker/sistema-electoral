import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, Link } from 'react-router-dom';
import { colombiaData } from '../data/colombiaData';
import { API } from '../config/api';
import { 
    Send, CheckCircle2, AlertTriangle, MapPin, Building2, 
    Share2, Copy, Sparkles, HeartHandshake, Phone, User, 
    FileText, Lightbulb, Users, Check, ArrowLeft, ShieldCheck
} from 'lucide-react';

const CATEGORIAS = [
    { id: 'vias_infraestructura', label: 'Vías, Calles y Puentes', icon: '🛣️' },
    { id: 'salud', label: 'Salud y Puestos de Atención', icon: '🏥' },
    { id: 'educacion', label: 'Escuelas, Colegios y Becas', icon: '🎓' },
    { id: 'seguridad', label: 'Seguridad y Convivencia', icon: '🛡️' },
    { id: 'empleo_desarrollo', label: 'Empleo y Apoyo a Emprendedores', icon: '💼' },
    { id: 'servicios_publicos', label: 'Agua, Luz y Alcantarillado', icon: '🚰' },
    { id: 'medio_ambiente', label: 'Medio Ambiente y Parques', icon: '🌳' },
    { id: 'cultura_deporte', label: 'Deporte, Juventud y Cultura', icon: '⚽' },
    { id: 'otra', label: 'Otra Necesidad Comunitaria', icon: '📌' },
];

export default function ParticipaCiudadano() {
    const [searchParams] = useSearchParams();
    const queryCampanaId = searchParams.get('campana');

    const [campanas, setCampanas] = useState([]);
    const [selectedCampana, setSelectedCampana] = useState(null);
    const [municipios, setMunicipios] = useState([]);
    
    const [submitting, setSubmitting] = useState(false);
    const [submittedData, setSubmittedData] = useState(null);
    const [copied, setCopied] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [form, setForm] = useState({
        campana_id: queryCampanaId || '',
        departamento: '',
        municipio: '',
        comuna_corregimiento: '',
        barrio_vereda: '',
        direccion_referencia: '',
        categoria: 'vias_infraestructura',
        titulo: '',
        descripcion: '',
        prioridad: 'alta',
        impacto_familias_estimado: 20,
        solucion_propuesta: '',
        reportado_por_nombre: '',
        reportado_por_telefono: '',
        reportado_por_cedula: ''
    });

    useEffect(() => {
        // Cargar campañas activas
        axios.get(`${API}/necesidades/publica/campanas`)
            .then(res => {
                setCampanas(res.data || []);
                if (queryCampanaId) {
                    const match = res.data.find(c => String(c.id) === String(queryCampanaId));
                    if (match) {
                        setSelectedCampana(match);
                        setForm(prev => ({
                            ...prev,
                            campana_id: match.id,
                            departamento: match.departamento && match.departamento !== 'COLOMBIA (NACIONAL)' ? match.departamento : prev.departamento,
                            municipio: match.municipio || prev.municipio
                        }));
                        if (match.departamento && colombiaData[match.departamento]) {
                            setMunicipios(colombiaData[match.departamento].sort());
                        }
                    }
                }
            })
            .catch(err => console.error('Error al cargar campañas públicas:', err));
    }, [queryCampanaId]);

    const handleDeptoChange = (depto) => {
        setForm(prev => ({ ...prev, departamento: depto, municipio: '' }));
        if (depto && colombiaData[depto]) {
            setMunicipios(colombiaData[depto].sort());
        } else {
            setMunicipios([]);
        }
    };

    const handleCampanaChange = (e) => {
        const id = e.target.value;
        setForm(prev => ({ ...prev, campana_id: id }));
        const match = campanas.find(c => String(c.id) === String(id));
        setSelectedCampana(match || null);
        if (match && match.departamento && match.departamento !== 'COLOMBIA (NACIONAL)') {
            setForm(prev => ({
                ...prev,
                departamento: match.departamento,
                municipio: match.municipio || ''
            }));
            if (colombiaData[match.departamento]) {
                setMunicipios(colombiaData[match.departamento].sort());
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMsg('');

        try {
            const res = await axios.post(`${API}/necesidades/publica`, form);
            setSubmittedData(res.data);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Error al radicar necesidad:', err);
            setErrorMsg(err.response?.data?.message || 'Error al enviar tu solicitud. Verifica los campos requeridos.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCopyFolio = () => {
        if (!submittedData?.folio) return;
        navigator.clipboard.writeText(submittedData.folio);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleShareWhatsApp = () => {
        if (!submittedData) return;
        const texto = encodeURIComponent(
            `¡Hola! Acabo de registrar una necesidad comunitaria prioritaria (${form.titulo}) en ${form.municipio}, ${form.departamento} con el radicado *${submittedData.folio}*. Puedes radicar y apoyar peticiones ciudadanas aquí: ${window.location.href}`
        );
        window.open(`https://api.whatsapp.com/send?text=${texto}`, '_blank');
    };

    const handleReset = () => {
        setSubmittedData(null);
        setForm(prev => ({
            ...prev,
            titulo: '',
            descripcion: '',
            solucion_propuesta: '',
            barrio_vereda: '',
            direccion_referencia: ''
        }));
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased selection:bg-emerald-500 selection:text-white">
            
            {/* Contenedor Central */}
            <div className="max-w-3xl mx-auto space-y-6">

                {/* Encabezado Principal */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                        {selectedCampana?.foto_candidato ? (
                            <img
                                src={selectedCampana.foto_candidato}
                                alt={selectedCampana.candidato}
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-400 shadow-xl flex-shrink-0"
                            />
                        ) : (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-3xl shadow-xl flex-shrink-0">
                                🇨🇴
                            </div>
                        )}

                        <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                <Sparkles size={12} />
                                Portal de Participación Ciudadana
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                                {selectedCampana ? `Tu Voz con ${selectedCampana.candidato}` : 'Banco Territorial de Soluciones'}
                            </h1>
                            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
                                {selectedCampana?.eslogan
                                    ? `"${selectedCampana.eslogan}" — Registra las necesidades de tu barrio o municipio para integrarlas directamente al plan de gobierno y gestión.`
                                    : 'Cuéntanos qué necesita tu comunidad. Tu reporte será analizado y priorizado con Inteligencia Territorial.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Si ya fue enviada con éxito */}
                {submittedData ? (
                    <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 size={36} />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                                ¡Tu Necesidad Ciudadana ha sido Radicada!
                            </h2>
                            <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto">
                                Ha ingresado con éxito al Banco de Necesidades y Soluciones. Nuestro equipo de avanzada y el candidato ya tienen tu propuesta en el mapa de prioridades.
                            </p>
                        </div>

                        {/* Folio Box */}
                        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 max-w-sm mx-auto space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                                Código de Radicado Oficial
                            </span>
                            <div className="flex items-center justify-center gap-3">
                                <span className="font-mono text-2xl font-black text-emerald-400 tracking-wider">
                                    {submittedData.folio}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleCopyFolio}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all"
                                    title="Copiar folio"
                                >
                                    {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                                </button>
                            </div>
                            {copied && <span className="text-[10px] text-emerald-400 block font-bold">¡Copiado en portapapeles!</span>}
                        </div>

                        {/* Botones de Compartir */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleShareWhatsApp}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-black text-xs uppercase tracking-wider px-6 py-3 rounded-2xl shadow-lg transition-all"
                            >
                                <Share2 size={16} />
                                <span>Compartir en WhatsApp con tus Vecinos</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleReset}
                                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider transition-all"
                            >
                                Radicar Otra Necesidad
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Formulario de Radicación */
                    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">

                        {errorMsg && (
                            <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 text-xs font-bold flex items-center gap-3">
                                <AlertTriangle size={18} className="flex-shrink-0" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {/* 1. Destinatario de la Campaña / Elección */}
                        {!queryCampanaId && (
                            <div className="space-y-2">
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                                    1. ¿A qué Campaña o Candidato deseas dirigir tu solicitud?
                                </label>
                                <select
                                    value={form.campana_id}
                                    onChange={handleCampanaChange}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                                >
                                    <option value="">-- BANCO GENERAL DE NECESIDADES (TODAS LAS CAMPAÑAS) --</option>
                                    {campanas.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.candidato} — {c.nombre} ({c.tipo_cargo.toUpperCase()})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* 2. Ubicación Territorial */}
                        <div className="space-y-3 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                <MapPin size={15} className="text-emerald-400" />
                                2. ¿Dónde se encuentra la necesidad comunitaria?
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                                        Departamento *
                                    </label>
                                    <select
                                        value={form.departamento}
                                        onChange={(e) => handleDeptoChange(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                                        required
                                    >
                                        <option value="">-- SELECCIONE DEPARTAMENTO --</option>
                                        {Object.keys(colombiaData).sort().map(dep => (
                                            <option key={dep} value={dep}>{dep}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                                        Municipio o Distrito *
                                    </label>
                                    <select
                                        value={form.municipio}
                                        onChange={(e) => setForm(prev => ({ ...prev, municipio: e.target.value }))}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                                        required
                                        disabled={!form.departamento}
                                    >
                                        <option value="">-- SELECCIONE MUNICIPIO --</option>
                                        {municipios.map(mun => (
                                            <option key={mun} value={mun}>{mun}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                                        Barrio, Vereda o Sector
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Barrio La Floresta / Vereda El Salado"
                                        value={form.barrio_vereda}
                                        onChange={(e) => setForm(prev => ({ ...prev, barrio_vereda: e.target.value }))}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                                        Comuna o Corregimiento
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Comuna 13 / Corregimiento 2"
                                        value={form.comuna_corregimiento}
                                        onChange={(e) => setForm(prev => ({ ...prev, comuna_corregimiento: e.target.value }))}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. Selección de Categoría */}
                        <div className="space-y-2">
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                                3. Sector o Categoría de la Necesidad
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {CATEGORIAS.map(cat => {
                                    const isSel = form.categoria === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setForm(prev => ({ ...prev, categoria: cat.id }))}
                                            className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                                                isSel 
                                                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30' 
                                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                            }`}
                                        >
                                            <span className="text-xl">{cat.icon}</span>
                                            <span className="text-xs font-bold leading-tight">{cat.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 4. Descripción del Problema */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                                    Título Breve del Problema *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej. Alcantarillado colapsado y vía principal sin pavimentar"
                                    value={form.titulo}
                                    onChange={(e) => setForm(prev => ({ ...prev, titulo: e.target.value }))}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                                    ¿Qué ocurre exactamente en tu comunidad? *
                                </label>
                                <textarea
                                    rows="3"
                                    placeholder="Describe la situación, desde cuándo se presenta y cómo afecta el día a día de las familias..."
                                    value={form.descripcion}
                                    onChange={(e) => setForm(prev => ({ ...prev, descripcion: e.target.value }))}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-emerald-400"
                                    required
                                />
                            </div>

                            {/* Solución propuesta por el ciudadano */}
                            <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl space-y-1.5">
                                <label className="block text-[11px] font-bold text-indigo-300 uppercase flex items-center gap-1.5">
                                    <Lightbulb size={14} className="text-amber-400" />
                                    ¿Cuál es tu propuesta o idea de solución? (Opcional)
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="Ej. Construcción de placa huella de 500 metros con mano de obra comunitaria..."
                                    value={form.solucion_propuesta}
                                    onChange={(e) => setForm(prev => ({ ...prev, solucion_propuesta: e.target.value }))}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-400"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                                        Nivel de Urgencia
                                    </label>
                                    <select
                                        value={form.prioridad}
                                        onChange={(e) => setForm(prev => ({ ...prev, prioridad: e.target.value }))}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                                    >
                                        <option value="baja">Baja (Puede esperar mediano plazo)</option>
                                        <option value="media">Media (Afecta la rutina comunitaria)</option>
                                        <option value="alta">Alta (Prioridad urgente para el sector)</option>
                                        <option value="critica">Crítica (Riesgo inminente para la vida o salud)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                                        Familias Afectadas Aproximadas: {form.impacto_familias_estimado}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50000"
                                        value={form.impacto_familias_estimado}
                                        onChange={(e) => setForm(prev => ({ ...prev, impacto_familias_estimado: e.target.value }))}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 5. Datos de Contacto del Ciudadano */}
                        <div className="space-y-3 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                <User size={15} className="text-emerald-400" />
                                5. Tus Datos de Contacto (Para notificarte avances)
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                                        Tu Nombre Completo
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej. María Elena Pérez"
                                        value={form.reportado_por_nombre}
                                        onChange={(e) => setForm(prev => ({ ...prev, reportado_por_nombre: e.target.value }))}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                                        Teléfono Celular o WhatsApp *
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="Ej. 310 123 4567"
                                        value={form.reportado_por_telefono}
                                        onChange={(e) => setForm(prev => ({ ...prev, reportado_por_telefono: e.target.value }))}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Botón Enviar */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                            >
                                <Send size={18} />
                                <span>{submitting ? 'Radicando en el Banco Territorial...' : 'Radicar mi Solicitud Ciudadana'}</span>
                            </button>
                            <span className="text-[10px] text-slate-500 block text-center mt-2 flex items-center justify-center gap-1">
                                <ShieldCheck size={12} className="text-emerald-500" />
                                Información protegida conforme a la Ley de Protección de Datos Personales (Habeas Data).
                            </span>
                        </div>
                    </form>
                )}

                {/* Footer */}
                <div className="text-center text-xs text-slate-500 space-y-1">
                    <p>Sistema Electoral & Banco Territorial de Necesidades Ciudadanas</p>
                    <Link to="/login" className="text-emerald-400 hover:underline inline-block font-bold">
                        Ingreso al Panel Administrativo de Campaña →
                    </Link>
                </div>
            </div>
        </div>
    );
}
