import { useState, useEffect, useMemo } from 'react';
import {
    X, MessageSquare, Users, CheckCircle2, ShieldCheck,
    Send, AlertCircle, RefreshCw, ThumbsUp, Heart, Flame,
    HelpCircle, MessageCircle, UserCheck, UserX, ExternalLink,
    Upload, Search, Filter
} from 'lucide-react';
import axios from 'axios';
import { API } from '../../config/api';

const REACCION_CONFIG = {
    me_encanta: { label: 'Me Encanta', icon: '❤️', color: 'text-rose-600 bg-rose-50 border-rose-200' },
    apoyo:      { label: 'Apoyo Total', icon: '🔥', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    me_gusta:   { label: 'Me Gusta',    icon: '👍', color: 'text-blue-600 bg-blue-50 border-blue-200' },
    aplausos:   { label: 'Aplausos',    icon: '👏', color: 'text-purple-600 bg-purple-50 border-purple-200' },
    pregunta:   { label: 'Pregunta',    icon: '❓', color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
    critica:    { label: 'Crítica',     icon: '⚠️', color: 'text-red-600 bg-red-50 border-red-200' }
};

export default function PostCommentsModal({
    isOpen,
    onClose,
    post,
    campanaId,
    onOpenTeamUpload
}) {
    const [comments, setComments] = useState([]);
    const [audit, setAudit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('todos'); // 'todos' | 'equipo' | 'ciudadanos' | 'preguntas' | 'criticas'
    const [searchTerm, setSearchTerm] = useState('');
    const [replyingCommentId, setReplyingCommentId] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);

    const token = localStorage.getItem('token');
    const authHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

    const fetchComments = async () => {
        if (!post?.id) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API}/social/posts/${post.id}/comments?campana_id=${campanaId || 1}`, authHeaders);
            if (res.data.success) {
                setComments(res.data.comments || []);
                setAudit(res.data.audit || null);
            }
        } catch (error) {
            console.error('Error al cargar comentarios:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && post?.id) {
            setFilterType(post.defaultFilter || 'todos');
            fetchComments();
        }
    }, [isOpen, post?.id, post?.defaultFilter]);

    const handleSendReply = async (commentId) => {
        if (!replyText.trim()) return;
        setSubmittingReply(true);
        try {
            await axios.post(`${API}/social/comments/${commentId}/reply`, {
                respuesta_texto: replyText
            }, authHeaders);
            setComments(prev => prev.map(c => c.id === commentId ? { ...c, respondido: true, respuesta_texto: replyText } : c));
            setReplyingCommentId(null);
            setReplyText('');
        } catch (error) {
            console.error('Error al responder comentario:', error);
            alert('Error al guardar la respuesta.');
        } finally {
            setSubmittingReply(false);
        }
    };

    const reactionCounts = useMemo(() => {
        return {
            total: comments.length,
            me_encanta: comments.filter(c => c.tipo_reaccion === 'me_encanta').length,
            apoyo: comments.filter(c => c.tipo_reaccion === 'apoyo').length,
            me_gusta: comments.filter(c => c.tipo_reaccion === 'me_gusta').length,
            aplausos: comments.filter(c => c.tipo_reaccion === 'aplausos').length,
            pregunta: comments.filter(c => c.tipo_reaccion === 'pregunta').length,
            critica: comments.filter(c => c.tipo_reaccion === 'critica' || c.tipo_reaccion === 'ataque' || c.sentimiento === 'negativo').length,
            equipo: comments.filter(c => c.es_equipo_campana).length,
            ciudadanos: comments.filter(c => !c.es_equipo_campana).length
        };
    }, [comments]);

    const filteredComments = useMemo(() => {
        return comments.filter(c => {
            let matchesFilter = true;
            if (filterType === 'equipo') matchesFilter = c.es_equipo_campana;
            else if (filterType === 'ciudadanos') matchesFilter = !c.es_equipo_campana;
            else if (filterType === 'preguntas' || filterType === 'pregunta') matchesFilter = c.tipo_reaccion === 'pregunta';
            else if (filterType === 'criticas' || filterType === 'critica') matchesFilter = c.tipo_reaccion === 'critica' || c.tipo_reaccion === 'ataque' || c.sentimiento === 'negativo';
            else if (filterType === 'me_encanta') matchesFilter = c.tipo_reaccion === 'me_encanta';
            else if (filterType === 'apoyo') matchesFilter = c.tipo_reaccion === 'apoyo';
            else if (filterType === 'me_gusta') matchesFilter = c.tipo_reaccion === 'me_gusta';
            else if (filterType === 'aplausos') matchesFilter = c.tipo_reaccion === 'aplausos';

            const textMatch =
                (c.texto_comentario || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.usuario_red || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.equipo_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.nombre_usuario || '').toLowerCase().includes(searchTerm.toLowerCase());

            return matchesFilter && textMatch;
        });
    }, [comments, filterType, searchTerm]);

    if (!isOpen || !post) return null;

    const cleanTitle = (post.titulo || '').replace(/^@[a-zA-Z0-9_]+:\s*/, '');

    return (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-5xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 p-5 text-white flex items-start justify-between">
                    <div className="space-y-2 pr-4 max-w-3xl">
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                <MessageSquare size={20} />
                            </span>
                            <div>
                                <h3 className="font-black text-base uppercase tracking-wide">
                                    Reacciones, Comentarios & Auditoría del Equipo
                                </h3>
                                <p className="text-xs text-indigo-200">
                                    Visualización de interacciones con clasificación de reacciones e identificación precisa de quién reacciona
                                </p>
                            </div>
                        </div>

                        {/* Vista rápida del post */}
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/15 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                            <div className="space-y-1 max-w-xl">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/40 text-cyan-300 font-mono font-bold text-[10px] uppercase">
                                        ID #{post.id} • {post.plataforma ? post.plataforma.toUpperCase() : 'POST'}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-white/10 font-mono text-[10px] text-gray-300">
                                        {post.autor_usuario || '@campana'}
                                    </span>
                                </div>
                                <h4 className="font-black text-white text-sm line-clamp-1">
                                    {cleanTitle}
                                </h4>
                                <p className="text-[11px] text-gray-300 line-clamp-2">
                                    {post.contenido}
                                </p>
                            </div>

                            {post.url_publicacion && (
                                <a
                                    href={post.url_publicacion}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-transform hover:scale-105 shrink-0 cursor-pointer"
                                    title="Abrir publicación original directamente en la red social"
                                >
                                    <span>🌐 Abrir en {(post.plataforma || 'Red Social').toUpperCase()}</span>
                                    <ExternalLink size={14} />
                                </a>
                            )}
                        </div>

                        {/* Barra de Reacciones Clasificadas con filtro directo */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                            <span className="text-[10px] font-bold text-gray-300 uppercase mr-1">Filtrar por Reacción:</span>
                            <button
                                type="button"
                                onClick={() => setFilterType(filterType === 'me_encanta' ? 'todos' : 'me_encanta')}
                                className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer border ${
                                    filterType === 'me_encanta'
                                        ? 'bg-rose-500 text-white border-rose-400 shadow-md ring-2 ring-rose-400/50'
                                        : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border-rose-500/30'
                                }`}
                                title="Ver quiénes reaccionaron con ❤️ Me Encanta"
                            >
                                ❤️ Me Encanta ({reactionCounts.me_encanta})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterType(filterType === 'apoyo' ? 'todos' : 'apoyo')}
                                className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer border ${
                                    filterType === 'apoyo'
                                        ? 'bg-amber-500 text-white border-amber-400 shadow-md ring-2 ring-amber-400/50'
                                        : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border-amber-500/30'
                                }`}
                                title="Ver quiénes reaccionaron con 🔥 Apoyo Total"
                            >
                                🔥 Apoyo ({reactionCounts.apoyo})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterType(filterType === 'me_gusta' ? 'todos' : 'me_gusta')}
                                className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer border ${
                                    filterType === 'me_gusta'
                                        ? 'bg-blue-500 text-white border-blue-400 shadow-md ring-2 ring-blue-400/50'
                                        : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border-blue-500/30'
                                }`}
                                title="Ver quiénes reaccionaron con 👍 Me Gusta"
                            >
                                👍 Me Gusta ({reactionCounts.me_gusta})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterType(filterType === 'aplausos' ? 'todos' : 'aplausos')}
                                className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer border ${
                                    filterType === 'aplausos'
                                        ? 'bg-purple-500 text-white border-purple-400 shadow-md ring-2 ring-purple-400/50'
                                        : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border-purple-500/30'
                                }`}
                                title="Ver quiénes reaccionaron con 👏 Aplausos"
                            >
                                👏 Aplausos ({reactionCounts.aplausos})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterType(filterType === 'preguntas' ? 'todos' : 'preguntas')}
                                className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer border ${
                                    filterType === 'preguntas'
                                        ? 'bg-cyan-500 text-white border-cyan-400 shadow-md ring-2 ring-cyan-400/50'
                                        : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border-cyan-500/30'
                                }`}
                                title="Ver quiénes formularon preguntas ciudadanas"
                            >
                                ❓ Preguntas ({reactionCounts.pregunta})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterType(filterType === 'criticas' ? 'todos' : 'criticas')}
                                className={`px-2 py-0.5 rounded-lg font-black transition-all cursor-pointer border ${
                                    filterType === 'criticas'
                                        ? 'bg-red-500 text-white border-red-400 shadow-md ring-2 ring-red-400/50'
                                        : 'bg-red-500/30 text-red-200 hover:bg-red-500/40 border-red-500/50'
                                }`}
                                title="Ver quiénes hicieron críticas o alertas"
                            >
                                ⚠️ Críticas / Alertas ({reactionCounts.critica})
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {onOpenTeamUpload && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onOpenTeamUpload();
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                            >
                                <Upload size={14} />
                                <span className="hidden sm:inline">Subir BD Equipo</span>
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Resumen de Auditoría y KPIs de Cobertura */}
                {audit && (
                    <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-pink-50/50 p-4 border-b border-indigo-100">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-white p-2.5 rounded-2xl border border-indigo-100 shadow-2xs">
                                <span className="text-[9px] font-bold text-gray-400 uppercase block">Total Comentarios</span>
                                <span className="text-base font-black text-slate-900 block">{audit.totalComments}</span>
                            </div>

                            <div className="bg-white p-2.5 rounded-2xl border border-emerald-100 shadow-2xs">
                                <span className="text-[9px] font-bold text-emerald-600 uppercase block flex items-center gap-1">
                                    <ShieldCheck size={11} />
                                    Apoyo del Equipo
                                </span>
                                <span className="text-base font-black text-emerald-700 block">
                                    {audit.teamCommentsCount} interacciones ({audit.teamMembersParticipating}/{audit.totalTeamMembers} integrantes)
                                </span>
                            </div>

                            <div className="bg-white p-2.5 rounded-2xl border border-blue-100 shadow-2xs">
                                <span className="text-[9px] font-bold text-blue-600 uppercase block flex items-center gap-1">
                                    <Users size={11} />
                                    Ciudadanos Externos
                                </span>
                                <span className="text-base font-black text-blue-700 block">{audit.externalCommentsCount}</span>
                            </div>

                            <div className="bg-white p-2.5 rounded-2xl border border-purple-100 shadow-2xs">
                                <span className="text-[9px] font-bold text-purple-600 uppercase block">Cobertura del Equipo</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${audit.coveragePercentage}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-black text-indigo-900">{audit.coveragePercentage}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Integrantes pendientes por apoyar */}
                        {audit.pendingTeamMembers && audit.pendingTeamMembers.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-indigo-100/70 flex flex-wrap items-center gap-1.5 text-xs">
                                <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <AlertCircle size={11} />
                                    Faltan por Interactuar ({audit.pendingTeamMembers.length}):
                                </span>
                                {audit.pendingTeamMembers.map(pending => (
                                    <span
                                        key={pending.id}
                                        className="text-[10px] bg-white border border-amber-200 text-slate-800 font-bold px-2 py-0.5 rounded-lg shadow-2xs flex items-center gap-1"
                                        title={`${pending.nombre_miembro} - ${pending.rol_equipo}`}
                                    >
                                        <span className="text-gray-400 font-mono">{pending.usuario_handle}</span>
                                        <span className="text-slate-900">({pending.nombre_miembro})</span>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Barra de Filtros y Búsqueda */}
                <div className="p-3 bg-gray-50/80 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs w-full sm:w-auto flex-wrap">
                        <button
                            type="button"
                            onClick={() => setFilterType('todos')}
                            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                filterType === 'todos' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:text-indigo-600'
                            }`}
                        >
                            Todos ({comments.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType('equipo')}
                            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                filterType === 'equipo' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:text-emerald-700'
                            }`}
                        >
                            <ShieldCheck size={12} />
                            <span>Equipo Oficial ({reactionCounts.equipo})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType('ciudadanos')}
                            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                filterType === 'ciudadanos' ? 'bg-blue-600 text-white shadow-xs' : 'text-gray-600 hover:text-blue-700'
                            }`}
                        >
                            <Users size={12} />
                            <span>Ciudadanos ({reactionCounts.ciudadanos})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType('preguntas')}
                            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                filterType === 'preguntas' ? 'bg-cyan-600 text-white shadow-xs' : 'text-gray-600 hover:text-cyan-700'
                            }`}
                        >
                            <HelpCircle size={12} />
                            <span>Preguntas ({reactionCounts.pregunta})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterType('criticas')}
                            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                filterType === 'criticas' ? 'bg-rose-600 text-white shadow-xs' : 'text-gray-600 hover:text-rose-700'
                            }`}
                        >
                            <AlertCircle size={12} />
                            <span>Alertas / Críticas ({reactionCounts.critica})</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Buscar por comentario o autor..."
                                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={fetchComments}
                            className="p-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-600 transition-colors cursor-pointer"
                            title="Actualizar comentarios"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Lista de Comentarios y Reacciones */}
                <div className="p-4 space-y-3 overflow-y-auto flex-1 bg-slate-50/50">
                    {loading ? (
                        <div className="py-12 text-center text-gray-400 space-y-2">
                            <RefreshCw size={24} className="animate-spin mx-auto text-indigo-500" />
                            <p className="text-xs font-bold">Cargando comentarios y verificando integrantes del equipo...</p>
                        </div>
                    ) : filteredComments.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 space-y-2 bg-white rounded-3xl border border-dashed border-gray-200 p-8">
                            <MessageSquare size={32} className="mx-auto text-gray-300" />
                            <p className="text-xs font-bold text-gray-600">No se encontraron comentarios para este filtro</p>
                            <p className="text-[11px] text-gray-400">Intenta cambiar el criterio de búsqueda o sincronizar el perfil nuevamente.</p>
                        </div>
                    ) : (
                        filteredComments.map(comment => {
                            const reac = REACCION_CONFIG[comment.tipo_reaccion] || REACCION_CONFIG.apoyo;
                            const isTeam = Boolean(comment.es_equipo_campana);

                            return (
                                <div
                                    key={comment.id}
                                    className={`rounded-2xl border transition-all p-4 shadow-xs ${
                                        isTeam
                                            ? 'bg-gradient-to-r from-emerald-50/60 via-white to-white border-emerald-300 hover:border-emerald-400 shadow-emerald-500/5'
                                            : 'bg-white border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                        {/* COLUMNA 1 (IZQUIERDA - 7 COLS): EL COMENTARIO Y REACCIÓN */}
                                        <div className="md:col-span-7 space-y-2.5">
                                            {/* Cabecera del comentario */}
                                            <div className="flex items-center flex-wrap gap-2">
                                                {/* Reacción */}
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${reac.color}`}>
                                                    <span>{reac.icon}</span>
                                                    <span>{reac.label}</span>
                                                </span>

                                                {/* Sentimiento */}
                                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                                    comment.sentimiento === 'positivo' ? 'bg-emerald-100 text-emerald-800' :
                                                    comment.sentimiento === 'negativo' ? 'bg-rose-100 text-rose-800' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {comment.sentimiento}
                                                </span>

                                                {/* Likes del comentario */}
                                                {comment.likes_comentario > 0 && (
                                                    <span className="text-[10px] font-mono text-gray-500 flex items-center gap-0.5">
                                                        ❤️ {comment.likes_comentario}
                                                    </span>
                                                )}

                                                <span className="text-[10px] text-gray-400 ml-auto font-mono">
                                                    {comment.fecha_comentario ? new Date(comment.fecha_comentario).toLocaleDateString('es-CO') : 'Reciente'}
                                                </span>
                                            </div>

                                            {/* Texto del Comentario */}
                                            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                                                    “{comment.texto_comentario}”
                                                </p>
                                            </div>

                                            {/* Respuesta del Candidato/Equipo si ya fue respondido */}
                                            {comment.respondido && comment.respuesta_texto && (
                                                <div className="bg-indigo-50/90 border border-indigo-200 rounded-xl p-2.5 text-xs text-indigo-950 space-y-1">
                                                    <div className="flex items-center gap-1.5 font-black text-[10px] uppercase text-indigo-700">
                                                        <CheckCircle2 size={12} />
                                                        <span>Respuesta de Campaña Registrada:</span>
                                                    </div>
                                                    <p className="italic">"{comment.respuesta_texto}"</p>
                                                </div>
                                            )}

                                            {/* Formulario de respuesta */}
                                            {replyingCommentId === comment.id ? (
                                                <div className="space-y-2 pt-1">
                                                    <textarea
                                                        value={replyText}
                                                        onChange={e => setReplyText(e.target.value)}
                                                        placeholder="Escribe la respuesta oficial para este comentario..."
                                                        className="w-full p-2.5 bg-white border border-indigo-300 rounded-xl text-xs focus:outline-hidden focus:border-indigo-600"
                                                        rows={2}
                                                    />
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setReplyingCommentId(null);
                                                                setReplyText('');
                                                            }}
                                                            className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={submittingReply || !replyText.trim()}
                                                            onClick={() => handleSendReply(comment.id)}
                                                            className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                                                        >
                                                            <Send size={11} />
                                                            <span>Guardar Respuesta</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : !comment.respondido ? (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setReplyingCommentId(comment.id);
                                                        setReplyText('');
                                                    }}
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 pt-0.5 cursor-pointer"
                                                >
                                                    <MessageCircle size={12} />
                                                    <span>Responder desde plataforma</span>
                                                </button>
                                            ) : null}
                                        </div>

                                        {/* COLUMNA 2 (DERECHA - 5 COLS): IDENTIFICACIÓN EXACTA DEL INTEGRANTE AL LADO DEL COMENTARIO */}
                                        <div className="md:col-span-5 md:border-l md:border-gray-200 md:pl-4 space-y-2">
                                            {isTeam ? (
                                                <div className="bg-emerald-500/10 border border-emerald-300/80 rounded-2xl p-3.5 space-y-2 shadow-2xs">
                                                    <div className="flex items-center justify-between">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                                                            <ShieldCheck size={11} />
                                                            Integrante del Equipo
                                                        </span>
                                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                                            BD Oficial
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <h4 className="font-black text-sm text-slate-900 leading-tight">
                                                            {comment.equipo_nombre || comment.nombre_usuario}
                                                        </h4>
                                                        <p className="text-[11px] font-bold text-emerald-800 mt-0.5">
                                                            🎖️ {comment.equipo_rol || 'Activista Digital de Campaña'}
                                                        </p>
                                                        <p className="text-[10px] font-mono text-gray-500 mt-0.5">
                                                            Usuario: <strong className="text-indigo-600">{comment.usuario_red}</strong>
                                                        </p>
                                                    </div>

                                                    <div className="pt-1 border-t border-emerald-200/60 flex items-center justify-between text-[10px]">
                                                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                                                            <CheckCircle2 size={11} />
                                                            Apoyo Verificado
                                                        </span>
                                                        <span className="text-gray-400 font-mono capitalize">
                                                            {comment.plataforma}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={`border rounded-2xl p-3.5 space-y-2 ${
                                                    comment.sentimiento === 'negativo' || ['critica', 'ataque'].includes(comment.tipo_reaccion)
                                                        ? 'bg-rose-50/70 border-rose-200'
                                                        : 'bg-slate-50 border-slate-200'
                                                }`}>
                                                    <div className="flex items-center justify-between">
                                                        {comment.sentimiento === 'negativo' || ['critica', 'ataque'].includes(comment.tipo_reaccion) ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-800 text-[9px] font-black uppercase tracking-wider">
                                                                <AlertCircle size={11} />
                                                                Alerta de Vigilancia
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[9px] font-black uppercase tracking-wider">
                                                                <Users size={11} />
                                                                Ciudadano / Simpatizante
                                                            </span>
                                                        )}
                                                        <span className={`text-[10px] font-bold ${
                                                            comment.sentimiento === 'negativo' ? 'text-rose-600' : 'text-gray-400'
                                                        }`}>
                                                            {comment.sentimiento === 'negativo' ? 'Requiere Atención' : 'Externo'}
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <h4 className="font-black text-xs text-slate-800 leading-tight">
                                                            {comment.nombre_usuario || 'Ciudadano en Redes'}
                                                        </h4>
                                                        <p className="text-[11px] font-mono text-gray-600 mt-0.5">
                                                            {comment.usuario_red}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 mt-1">
                                                            {comment.sentimiento === 'negativo'
                                                                ? 'Mensaje crítico o señalamiento detectado en monitoreo de redes.'
                                                                : 'Votante o usuario de la comunidad general. No registrado como integrante oficial.'}
                                                        </p>
                                                    </div>

                                                    {onOpenTeamUpload && (
                                                        <div className="pt-1.5 border-t border-gray-200 flex items-center justify-between">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    onClose();
                                                                    onOpenTeamUpload();
                                                                }}
                                                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                                                            >
                                                                + ¿Es del equipo? Subir a la BD
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">
                        Mostrando {filteredComments.length} de {comments.length} comentarios totales
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                        Cerrar Visor
                    </button>
                </div>
            </div>
        </div>
    );
}
