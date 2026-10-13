import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    AlertTriangle, ShieldAlert, CheckCircle2, XCircle, Search,
    Filter, RefreshCw, ExternalLink, Edit3, Check, X, ShieldCheck,
    MessageSquare, AlertCircle, HelpCircle, ThumbsUp
} from 'lucide-react';
import { API } from '../../config/api';

const CATEGORIA_CONFIG = {
    general:            { label: 'General / Opinión', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    pregunta:           { label: 'Pregunta / Información', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    critica:            { label: 'Crítica Legítima', color: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold' },
    insulto:            { label: 'Insulto / Ofensivo', color: 'bg-orange-50 text-orange-700 border-orange-300' },
    amenaza:            { label: '⚠️ Amenaza Explícita', color: 'bg-rose-100 text-rose-800 border-rose-400 font-bold' },
    acoso_repetitivo:   { label: 'Acoso Repetitivo / Brigada', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    spam:               { label: 'Spam / Enlaces', color: 'bg-gray-100 text-gray-500 border-gray-300' },
    requiere_revision:  { label: '🔍 Requiere Revisión', color: 'bg-yellow-100 text-yellow-800 border-yellow-300 animate-pulse' }
};

export default function ContentAlertsModerationTray({ campanaId, onModerationComplete }) {
    const token = localStorage.getItem('token');
    const authHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

    const [alerts, setAlerts] = useState([]);
    const [commentsForReview, setCommentsForReview] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('alertas'); // 'alertas' | 'revision_humana'
    const [filterSeveridad, setFilterSeveridad] = useState('todos');
    const [filterEstado, setFilterEstado] = useState('pendiente');

    // Modal de corrección de moderación
    const [moderatingComment, setModeratingComment] = useState(null);
    const [moderationForm, setModerationForm] = useState({
        categoria_nueva: 'critica',
        es_critica_legitima: true,
        es_amenaza: false,
        estado_revision: 'corregido',
        notas_moderacion: ''
    });
    const [submittingReview, setSubmittingReview] = useState(false);

    const loadData = async () => {
        if (!campanaId) return;
        setLoading(true);
        try {
            const [alertsRes, commentsRes] = await Promise.all([
                axios.get(`${API}/social/content-alerts?campana_id=${campanaId}&estado=${filterEstado}&nivel_severidad=${filterSeveridad}`, authHeaders).catch(() => ({ data: { alerts: [] } })),
                axios.get(`${API}/social/comments?campana_id=${campanaId}&estado_revision=pendiente`, authHeaders).catch(() => ({ data: { comments: [] } }))
            ]);

            setAlerts(alertsRes.data?.alerts || []);
            setCommentsForReview(commentsRes.data?.comments || []);
        } catch (err) {
            console.error('Error cargando alertas de moderación:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [campanaId, filterSeveridad, filterEstado]);

    const handleResolveAlert = async (alertId, nuevoEstado) => {
        try {
            await axios.put(`${API}/social/content-alerts/${alertId}/resolve`, {
                estado: nuevoEstado,
                resolucion_notas: `Gestionado desde la bandeja de moderación (${nuevoEstado})`
            }, authHeaders);
            setAlerts(prev => prev.filter(a => a.id !== alertId));
            if (onModerationComplete) onModerationComplete();
        } catch (err) {
            alert('Error al resolver la alerta: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleOpenModerationModal = (comment) => {
        setModeratingComment(comment);
        setModerationForm({
            categoria_nueva: comment.categoria_contenido || 'critica',
            es_critica_legitima: comment.es_critica_legitima || false,
            es_amenaza: comment.es_amenaza || false,
            estado_revision: 'aprobado',
            notas_moderacion: ''
        });
    };

    const handleSubmitModeration = async (e) => {
        e.preventDefault();
        if (!moderatingComment) return;
        setSubmittingReview(true);
        try {
            await axios.put(`${API}/social/comments/${moderatingComment.id}/review`, moderationForm, authHeaders);
            setCommentsForReview(prev => prev.filter(c => c.id !== moderatingComment.id));
            setModeratingComment(null);
            if (onModerationComplete) onModerationComplete();
        } catch (err) {
            alert('Error al guardar la revisión: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmittingReview(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                            <ShieldAlert size={20} />
                        </span>
                        <h2 className="text-xl font-bold text-gray-900">Bandeja de Moderación y Alertas de Contenido</h2>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Diferenciación estricta entre crítica legítima vs insulto vs amenaza. Requiere revisión humana para casos ambiguos.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveView('alertas')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            activeView === 'alertas' ? 'bg-rose-950 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <ShieldAlert size={14} />
                        <span>Alertas Críticas ({alerts.length})</span>
                    </button>
                    <button
                        onClick={() => setActiveView('revision_humana')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            activeView === 'revision_humana' ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <Edit3 size={14} />
                        <span>Revisión Humana Pendiente ({commentsForReview.length})</span>
                    </button>
                    <button
                        onClick={loadData}
                        className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition"
                        title="Refrescar"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Vista 1: Alertas Críticas */}
            {activeView === 'alertas' && (
                <div className="space-y-4">
                    {/* Filtros de severidad */}
                    <div className="flex flex-wrap gap-2 items-center bg-white p-3 rounded-2xl border border-gray-100 text-xs">
                        <span className="text-gray-500 font-semibold flex items-center gap-1">
                            <Filter size={13} /> Severidad:
                        </span>
                        {['todos', 'critico', 'alto', 'medio'].map(sev => (
                            <button
                                key={sev}
                                onClick={() => setFilterSeveridad(sev)}
                                className={`px-3 py-1 rounded-xl font-bold uppercase text-[10px] transition ${
                                    filterSeveridad === sev ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {sev}
                            </button>
                        ))}
                    </div>

                    {alerts.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck size={28} />
                            </div>
                            <h3 className="text-base font-bold text-gray-800">No hay alertas críticas pendientes</h3>
                            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                                Las amenazas explícitas o ataques masivos detectados por el clasificador se presentarán aquí para decisión del equipo.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {alerts.map(a => (
                                <div key={a.id} className="bg-white rounded-3xl border border-rose-100 p-5 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                a.nivel_severidad === 'critico' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                                                a.nivel_severidad === 'alto' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                                                'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                            }`}>
                                                {a.nivel_severidad}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                                                {a.plataforma}
                                            </span>
                                            <h4 className="font-bold text-gray-900 text-sm">{a.titulo}</h4>
                                        </div>

                                        <blockquote className="border-l-4 border-rose-500 pl-3 py-1 bg-rose-50/50 rounded-r-xl text-xs text-gray-800 font-mono italic">
                                            "{a.texto_original}"
                                        </blockquote>

                                        <div className="flex items-center gap-3 text-[11px] text-gray-400">
                                            <span>Autor: <b className="text-gray-700">{a.autor_comentario}</b></span>
                                            <span>•</span>
                                            <span>Detectado: {new Date(a.createdAt).toLocaleString('es-CO')}</span>
                                            {a.url_evidencia && (
                                                <a href={a.url_evidencia} target="_blank" rel="noreferrer" className="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-1">
                                                    Ver publicación <ExternalLink size={11} />
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
                                        <button
                                            onClick={() => handleResolveAlert(a.id, 'confirmado')}
                                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                        >
                                            <AlertCircle size={13} />
                                            <span>Confirmar Riesgo</span>
                                        </button>
                                        <button
                                            onClick={() => handleResolveAlert(a.id, 'descartado_falso_positivo')}
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                                        >
                                            <X size={13} />
                                            <span>Falso Positivo</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Vista 2: Revisión Humana de Comentarios Ambiguos */}
            {activeView === 'revision_humana' && (
                <div className="space-y-4">
                    {commentsForReview.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={28} />
                            </div>
                            <h3 className="text-base font-bold text-gray-800">Todos los comentarios están clasificados</h3>
                            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                                No hay comentarios marcados con ambigüedad o pendientes de revisión manual.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {commentsForReview.map(c => {
                                const catConfig = CATEGORIA_CONFIG[c.categoria_contenido] || CATEGORIA_CONFIG.general;
                                return (
                                    <div key={c.id} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-3 flex flex-col justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catConfig.color}`}>
                                                    Sugerida: {catConfig.label}
                                                </span>
                                                <span className="text-[10px] text-gray-400">
                                                    Confianza: {Math.round((c.nivel_confianza_ia || 0.8) * 100)}%
                                                </span>
                                            </div>

                                            <p className="text-xs text-gray-800 font-medium bg-slate-50 p-3 rounded-2xl">
                                                "{c.texto_comentario}"
                                            </p>

                                            <div className="flex items-center justify-between text-[11px] text-gray-500">
                                                <span>Por: <b className="text-gray-700">{c.usuario_red}</b></span>
                                                <span className="capitalize">{c.plataforma}</span>
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModerationModal(c)}
                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                            >
                                                <Edit3 size={13} />
                                                <span>Revisar / Corregir</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Modal de Corrección Humana */}
            {moderatingComment && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="font-bold text-gray-900 text-base">Revisión Humana de Comentario</h3>
                            <button onClick={() => setModeratingComment(null)} className="text-gray-400 hover:text-gray-700">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-1">
                            <p className="font-semibold text-gray-700">Texto Original:</p>
                            <p className="italic text-gray-900 font-mono">"{moderatingComment.texto_comentario}"</p>
                            <p className="text-[10px] text-gray-400 mt-1">Autor: {moderatingComment.usuario_red}</p>
                        </div>

                        <form onSubmit={handleSubmitModeration} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Categoría Final Validada</label>
                                <select
                                    value={moderationForm.categoria_nueva}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setModerationForm({
                                            ...moderationForm,
                                            categoria_nueva: val,
                                            es_critica_legitima: val === 'critica',
                                            es_amenaza: val === 'amenaza'
                                        });
                                    }}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                                >
                                    <option value="general">Comentario General / Cotidiano</option>
                                    <option value="pregunta">Pregunta o Solicitud de Información</option>
                                    <option value="critica">Crítica y Desacuerdo Legítimo (Propuesta / Gestión)</option>
                                    <option value="insulto">Insulto / Lenguaje Ofensivo</option>
                                    <option value="amenaza">Amenaza Explícita a la Integridad</option>
                                    <option value="acoso_repetitivo">Posible Acoso o Contenido Repetitivo</option>
                                    <option value="spam">Spam / Bots / Enlaces</option>
                                </select>
                            </div>

                            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={moderationForm.es_critica_legitima}
                                        onChange={e => setModerationForm({ ...moderationForm, es_critica_legitima: e.target.checked })}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="font-semibold text-gray-800">Es una crítica legítima constructiva / debate ciudadano</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={moderationForm.es_amenaza}
                                        onChange={e => setModerationForm({ ...moderationForm, es_amenaza: e.target.checked })}
                                        className="rounded text-rose-600 focus:ring-rose-500"
                                    />
                                    <span className="font-semibold text-rose-700">Constituye una amenaza explícita</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Notas de Moderación / Justificación</label>
                                <textarea
                                    rows={2}
                                    placeholder="Explique el motivo del cambio o confirmación..."
                                    value={moderationForm.notas_moderacion}
                                    onChange={e => setModerationForm({ ...moderationForm, notas_moderacion: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModeratingComment(null)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition disabled:opacity-50"
                                >
                                    {submittingReview ? 'Guardando...' : 'Confirmar Moderación'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
