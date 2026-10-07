import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCampaign } from '../context/CampaignContext';
import {
    Share2, Radio, Heart, ThumbsUp, Flame, AlertTriangle,
    ShieldAlert, Users, TrendingUp, Eye, MessageSquare,
    Repeat, Plus, Search, Filter, ExternalLink, CheckCircle,
    X, Trash2, Edit3, Sparkles, Swords, BarChart3,
    Check, AlertCircle, ArrowUpRight, ShieldCheck, Video, HelpCircle,
    Copy, Link, Bot, Zap, Lightbulb, Rocket, Clock, Send, Upload, RefreshCw, Download
} from 'lucide-react';
import { API } from '../config/api';
import ContentIntelligenceDashboard from '../features/social/ContentIntelligenceDashboard';
import TeamDatabaseUploadModal from '../features/social/TeamDatabaseUploadModal';
import PostCommentsModal from '../features/social/PostCommentsModal';
import CompetitorWarRoom from '../features/social/CompetitorWarRoom';

const PLATAFORMAS_INFO = {
    facebook:  { label: 'Facebook',  color: 'bg-blue-600 text-white', border: 'border-blue-500', light: 'bg-blue-50 text-blue-700' },
    instagram: { label: 'Instagram', color: 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white', border: 'border-pink-500', light: 'bg-pink-50 text-pink-700' },
    tiktok:    { label: 'TikTok',    color: 'bg-black text-white', border: 'border-gray-800', light: 'bg-gray-100 text-gray-900' },
    twitter:   { label: 'X (Twitter)', color: 'bg-slate-900 text-white', border: 'border-slate-800', light: 'bg-slate-100 text-slate-900' },
    youtube:   { label: 'YouTube',   color: 'bg-red-600 text-white', border: 'border-red-500', light: 'bg-red-50 text-red-700' }
};

export default function SocialMediaPage() {
    const { user: currentUser } = useAuth();
    const { campaigns, activeCampaign } = useCampaign();
    const token = localStorage.getItem('token');
    const authHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

    // Pestaña activa: 'feed' | 'equipo' | 'negativos' | 'oposicion'
    const [activeTab, setActiveTab] = useState('feed');

    // Datos principales
    const [metrics, setMetrics] = useState(null);
    const [posts, setPosts] = useState([]);
    const [teamAccounts, setTeamAccounts] = useState([]);
    const [negativeComments, setNegativeComments] = useState([]);
    const [competitors, setCompetitors] = useState([]);
    const [teamUsers, setTeamUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Auditoría de Apoyo del Equipo en Publicaciones
    const [selectedPostForAudit, setSelectedPostForAudit] = useState(null);
    const [modalAuditOpen, setModalAuditOpen] = useState(false);
    const [auditForm, setAuditForm] = useState({
        user_id: '',
        nombre_miembro: '',
        rol_equipo: '',
        usuario_handle: '@',
        plataforma: 'instagram',
        tipo_reaccion: 'me_encanta',
        comento: true,
        texto_comentario: '',
        compartio: true,
        url_compartido: ''
    });

    // Filtros
    const [filterPlataforma, setFilterPlataforma] = useState('todas');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRiesgo, setFilterRiesgo] = useState('todos');

    // Modales de creación
    const [modalPostOpen, setModalPostOpen] = useState(false);
    const [modalTeamOpen, setModalTeamOpen] = useState(false);
    const [modalCommentOpen, setModalCommentOpen] = useState(false);
    const [modalCompetitorOpen, setModalCompetitorOpen] = useState(false);
    const [modalEditLinksOpen, setModalEditLinksOpen] = useState(false);
    const [modalTeamUploadOpen, setModalTeamUploadOpen] = useState(false);
    const [selectedPostForComments, setSelectedPostForComments] = useState(null);
    const [modalCommentsOpen, setModalCommentsOpen] = useState(false);
    const [syncingProfileUrl, setSyncingProfileUrl] = useState(null);
    const [syncSuccessToast, setSyncSuccessToast] = useState(null);

    // Asesor Virtual de Viralidad con Inteligencia Artificial
    const [modalAdvisorOpen, setModalAdvisorOpen] = useState(false);
    const [advisorLoading, setAdvisorLoading] = useState(false);
    const [advisorAnalysis, setAdvisorAnalysis] = useState(null);
    const [advisorActiveTab, setAdvisorActiveTab] = useState('score');
    const [advisorChatInput, setAdvisorChatInput] = useState('');
    const [copiedHookIdx, setCopiedHookIdx] = useState(null);
    const [copiedWpType, setCopiedWpType] = useState(null);
    const [copiedHashtags, setCopiedHashtags] = useState(false);
    const [advisorChatMessages, setAdvisorChatMessages] = useState([
        {
            sender: 'advisor',
            text: '¡Hola! Soy tu Asesor Virtual de Viralidad y Estrategia Digital de Campaña. Puedo analizar cualquier publicación para romper el algoritmo, darte ganchos de 3 segundos, preparar cadenas de WhatsApp o decirte cómo neutralizar ataques de la oposición. ¿En qué te asesoro hoy?',
            sugerencias: [
                '¿A qué hora exacta publicar hoy para viralizar?',
                '¿Cómo armar una cadena de WhatsApp para el equipo?',
                '¿Qué hacer si contrincantes nos atacan con bodegas?'
            ]
        }
    ]);

    // Seguimiento a los En Vivo Multirred
    const [liveMonitorData, setLiveMonitorData] = useState({
        livePosts: [],
        resumen: {},
        comentariosEnVivo: []
    });
    const [liveFilterPlataforma, setLiveFilterPlataforma] = useState('todas');
    const [liveFilterTipo, setLiveFilterTipo] = useState('todos');
    const [passedQuestions, setPassedQuestions] = useState({});
    const [liveAlertSuccess, setLiveAlertSuccess] = useState(false);
    const [modalNewLiveOpen, setModalNewLiveOpen] = useState(false);
    const [newLiveForm, setNewLiveForm] = useState({
        plataforma: 'tiktok',
        titulo: '',
        url_publicacion: '',
        tema_estrategico: 'Diálogo con la Comunidad',
        espectadores_en_vivo: 2500
    });

    // Links de Redes Sociales del Candidato
    const [socialLinksForm, setSocialLinksForm] = useState({
        link_instagram: '',
        link_tiktok: '',
        link_facebook: '',
        link_twitter: '',
        link_youtube: '',
        link_whatsapp: ''
    });

    // Formularios
    const [postForm, setPostForm] = useState({
        campana_id: '',
        plataforma: 'instagram',
        titulo: '',
        contenido: '',
        url_publicacion: '',
        autor_nombre: '',
        autor_usuario: '',
        fecha_publicacion: new Date().toISOString().slice(0, 16).replace('T', ' '),
        tipo_contenido: 'video',
        alcance: 10000,
        impresiones: 15000,
        reproducciones: 8000,
        interacciones: 1200,
        compartidos: 200,
        comentarios_conteo: 80,
        likes: 900,
        me_encanta: 200,
        me_enoja: 10,
        en_vivo: false,
        tema_estrategico: 'Propuesta de Campaña'
    });

    const [teamForm, setTeamForm] = useState({
        campana_id: '',
        nombre_miembro: '',
        rol_equipo: 'Activista Digital',
        plataforma: 'twitter',
        usuario_handle: '@',
        url_perfil: '',
        seguidores: 1500,
        nivel_participacion: 'Activo',
        observaciones: ''
    });

    const [commentForm, setCommentForm] = useState({
        campana_id: '',
        plataforma: 'twitter',
        publicacion_origen: '',
        usuario_comenta: '@',
        texto_comentario: '',
        fecha_deteccion: new Date().toISOString().slice(0, 16).replace('T', ' '),
        categoria_ataque: 'Crítica a Propuesta',
        nivel_riesgo: 'medio',
        estado_gestion: 'pendiente',
        respuesta_sugerida: '',
        responsable_respuesta: 'Equipo de Prensa'
    });

    const [competitorForm, setCompetitorForm] = useState({
        campana_id: '',
        nombre_candidato: '',
        partido_movimiento: '',
        cargo_postulado: 'Senado de la República',
        alcance_estimado: 250000,
        seguidores_totales: 300000,
        narrativa_principal: '',
        lineas_de_ataque: '',
        puntos_fuertes: '',
        puntos_debiles: '',
        contra_estrategia_sugerida: '',
        nivel_amenaza: 'medio',
        ultima_movida: ''
    });

    // Cargar métricas y datos
    const fetchAllData = async () => {
        setLoading(true);
        try {
            const campId = activeCampaign?.id || 7;
            const params = { campana_id: campId };

            const [mRes, pRes, tRes, cRes, compRes, uRes, lRes] = await Promise.all([
                axios.get(`${API}/social/metrics`, { ...authHeaders, params }),
                axios.get(`${API}/social/posts`, { ...authHeaders, params }),
                axios.get(`${API}/social/team-accounts`, { ...authHeaders, params }),
                axios.get(`${API}/social/negative-comments`, { ...authHeaders, params }),
                axios.get(`${API}/social/competitors`, { ...authHeaders, params }),
                axios.get(`${API}/social/team-users`, authHeaders),
                axios.get(`${API}/social/live-streams`, { ...authHeaders, params }).catch(() => ({ data: { livePosts: [], resumen: {}, comentariosEnVivo: [] } }))
            ]);

            setMetrics(mRes.data);
            setPosts(pRes.data);
            setTeamAccounts(tRes.data);
            setNegativeComments(cRes.data);
            setCompetitors(compRes.data);
            setTeamUsers(uRes.data || []);
            setLiveMonitorData(lRes.data || { livePosts: [], resumen: {}, comentariosEnVivo: [] });
        } catch (error) {
            console.error('Error al cargar datos de redes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [activeCampaign?.id]);

    // Abrir modal de auditoría de interacciones del equipo en un post
    const handleOpenAuditModal = (post) => {
        setSelectedPostForAudit(post);
        setModalAuditOpen(true);
        if (teamUsers && teamUsers.length > 0) {
            const first = teamUsers[0];
            const roleLabel = first.role === 'candidato' ? 'Candidato Oficial'
                : first.role === 'orador' ? 'Orador y Vocero'
                : first.role === 'lider_avanzada' ? 'Coordinadora de Avanzada'
                : first.role === 'lider' ? 'Líder Territorial'
                : 'Equipo de Campaña';
            setAuditForm({
                user_id: first.id,
                nombre_miembro: first.nombre,
                rol_equipo: roleLabel,
                usuario_handle: '@' + (first.nombre ? first.nombre.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'equipo'),
                plataforma: post.plataforma || 'instagram',
                tipo_reaccion: 'me_encanta',
                comento: true,
                texto_comentario: '',
                compartio: true,
                url_compartido: ''
            });
        }
    };

    // Guardar / Registrar interacción de un miembro del equipo en el post
    const handleSaveInteraction = async (e) => {
        e.preventDefault();
        if (!selectedPostForAudit) return;
        try {
            await axios.post(`${API}/social/posts/${selectedPostForAudit.id}/interactions`, auditForm, authHeaders);
            await fetchAllData();
            // Refrescar el post seleccionado
            const updated = await axios.get(`${API}/social/posts`, authHeaders);
            const match = updated.data.find(p => p.id === selectedPostForAudit.id);
            if (match) setSelectedPostForAudit(match);
            alert('¡Interacción del miembro del equipo registrada exitosamente!');
            setAuditForm(prev => ({
                ...prev,
                texto_comentario: '',
                url_compartido: ''
            }));
        } catch (err) {
            alert(err.response?.data?.message || 'Error al guardar interacción');
        }
    };

    // Eliminar interacción
    const handleDeleteInteraction = async (interactionId) => {
        if (!window.confirm('¿Deseas remover este registro de interacción?')) return;
        try {
            await axios.delete(`${API}/social/interactions/${interactionId}`, authHeaders);
            await fetchAllData();
            if (selectedPostForAudit) {
                const updated = await axios.get(`${API}/social/posts`, authHeaders);
                const match = updated.data.find(p => p.id === selectedPostForAudit.id);
                if (match) setSelectedPostForAudit(match);
            }
        } catch (err) {
            alert('Error al eliminar interacción');
        }
    };

    // Alternar rápidamente si compartió
    const handleToggleShare = async (interaction) => {
        try {
            await axios.post(`${API}/social/posts/${interaction.post_id}/interactions`, {
                user_id: interaction.user_id,
                nombre_miembro: interaction.nombre_miembro,
                rol_equipo: interaction.rol_equipo,
                compartio: !interaction.compartio
            }, authHeaders);
            await fetchAllData();
            if (selectedPostForAudit) {
                const updated = await axios.get(`${API}/social/posts`, authHeaders);
                const match = updated.data.find(p => p.id === selectedPostForAudit.id);
                if (match) setSelectedPostForAudit(match);
            }
        } catch (err) {
            alert('Error al actualizar estado de compartido');
        }
    };

    // Trazabilidad: Copiar link oficial del candidato
    const [copiedLinkId, setCopiedLinkId] = useState(null);
    const handleCopyCandidateLink = (postId) => {
        const fullUrl = `${window.location.origin}/r/${postId}`;
        navigator.clipboard.writeText(fullUrl);
        setCopiedLinkId(postId);
        setTimeout(() => setCopiedLinkId(null), 3000);
    };

    // Trazabilidad: Abrir publicación vía link del candidato y sumar trazabilidad
    const handleOpenCandidateLink = async (post) => {
        try {
            await axios.post(`${API}/social/posts/${post.id}/track-click`, {}, authHeaders);
            setPosts(prev => prev.map(item => item.id === post.id ? { ...item, clics_link_candidato: (item.clics_link_candidato || 0) + 1 } : item));
        } catch (e) {
            console.error(e);
        }
        if (post.url_publicacion) {
            window.open(post.url_publicacion, '_blank', 'noopener,noreferrer');
        } else {
            window.open(`${window.location.origin}/r/${post.id}`, '_blank', 'noopener,noreferrer');
        }
    };

    // Sincronizar formulario de links con la campaña activa
    useEffect(() => {
        if (activeCampaign) {
            setSocialLinksForm({
                link_instagram: activeCampaign.link_instagram || '',
                link_tiktok: activeCampaign.link_tiktok || '',
                link_facebook: activeCampaign.link_facebook || '',
                link_twitter: activeCampaign.link_twitter || '',
                link_youtube: activeCampaign.link_youtube || '',
                link_whatsapp: activeCampaign.link_whatsapp || ''
            });
        }
    }, [activeCampaign]);

    // Guardar enlaces oficiales de redes sociales del candidato y sincronizar de inmediato
    const [savingAndSyncingLinks, setSavingAndSyncingLinks] = useState(false);
    const handleSaveSocialLinks = async (e) => {
        e.preventDefault();
        const campId = activeCampaign?.id || 5;
        setSavingAndSyncingLinks(true);
        try {
            await axios.put(`${API}/campaigns/${campId}`, socialLinksForm, authHeaders);
            if (activeCampaign) {
                Object.assign(activeCampaign, socialLinksForm);
            }
            // Sincronizar automáticamente el barrido integral de todas las redes configuradas
            const sweepRes = await axios.post(`${API}/social/candidate-sweep`, {
                campana_id: campId
            }, authHeaders);

            await fetchAllData();
            setModalEditLinksOpen(false);
            setActiveTab('feed');
            setSyncSuccessToast({
                message: sweepRes.data.mensaje || `¡Sincronización completada! Se importaron ${sweepRes.data.postsCreated} publicaciones y ${sweepRes.data.commentsCreated} comentarios y reacciones de las redes del candidato.`,
                platform: 'multired',
                handle: `@${(activeCampaign?.candidato || 'OscarVillamizar').replace(/\\s+/g, '')}`
            });
            setTimeout(() => setSyncSuccessToast(null), 10000);
        } catch (err) {
            console.error('Error al guardar y sincronizar enlaces:', err);
            alert(err.response?.data?.message || 'Error al guardar y sincronizar enlaces de redes');
        } finally {
            setSavingAndSyncingLinks(false);
        }
    };

    // Sincronizar publicaciones y comentarios desde un enlace de red social
    const handleSyncProfile = async (url) => {
        if (!url) {
            alert('Por favor configura primero la URL del perfil para sincronizar.');
            return;
        }
        setSyncingProfileUrl(url);
        try {
            const campId = activeCampaign?.id || 5;
            const res = await axios.post(`${API}/social/sync-profile`, {
                url,
                campana_id: campId
            }, authHeaders);

            await fetchAllData();
            setActiveTab('feed');
            setSyncSuccessToast({
                message: `¡Extracción completa! Se importaron ${res.data.postsCreated} publicaciones y ${res.data.commentsCreated} comentarios y reacciones de ${res.data.platform.toUpperCase()}. ${res.data.teamMatchedCount} interacciones corresponden a integrantes del equipo identificados.`,
                platform: res.data.platform,
                handle: res.data.handle
            });
            setTimeout(() => setSyncSuccessToast(null), 8000);
        } catch (err) {
            console.error('Error al sincronizar perfil:', err);
            alert(err.response?.data?.message || 'Error al sincronizar publicaciones del perfil.');
        } finally {
            setSyncingProfileUrl(null);
        }
    };

    const [sweepingCandidate, setSweepingCandidate] = useState(false);

    // BARRIDO INTEGRAL DE TODAS LAS REDES SOCIALES DEL CANDIDATO (POSTS, REACCIONES, COMENTARIOS Y EQUIPO)
    const handleCandidateSweep = async () => {
        const campId = activeCampaign?.id || 7;
        const candNombre = activeCampaign?.candidato || 'Oscar Villamizar';
        setSweepingCandidate(true);
        try {
            const res = await axios.post(`${API}/social/candidate-sweep`, {
                campana_id: campId
            }, authHeaders);

            await fetchAllData();
            setSyncSuccessToast({
                message: res.data.mensaje || `¡Barrido completado exitosamente! Se procesaron ${res.data.postsCreated} publicaciones y ${res.data.commentsCreated} comentarios de ${res.data.candidato}.`,
                platform: 'multired',
                handle: `@${candNombre.replace(/\s+/g, '')}`
            });
            setTimeout(() => setSyncSuccessToast(null), 10000);
        } catch (err) {
            console.error('Error al ejecutar barrido de redes:', err);
            alert(err.response?.data?.message || 'Error al ejecutar barrido de redes sociales.');
        } finally {
            setSweepingCandidate(false);
        }
    };

    // Registrar apoyo de miembro del equipo (Repost/Amplificación)
    const handleRecordSupport = async (accountId) => {
        try {
            await axios.post(`${API}/social/team-accounts/${accountId}/support`, {}, authHeaders);
            await fetchAllData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al registrar apoyo');
        }
    };

    // Actualizar estado de comentario negativo (Neutralizar o Responder)
    const handleUpdateCommentStatus = async (commentId, nuevoEstado) => {
        try {
            await axios.put(`${API}/social/negative-comments/${commentId}`, { estado_gestion: nuevoEstado }, authHeaders);
            await fetchAllData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al actualizar estado del comentario');
        }
    };

    // Handlers de creación
    const handleCreatePost = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...postForm,
                campana_id: activeCampaign?.id || campaigns[0]?.id || 1,
                autor_nombre: postForm.autor_nombre || activeCampaign?.candidato || 'Candidato Oficial'
            };
            await axios.post(`${API}/social/posts`, payload, authHeaders);
            setModalPostOpen(false);
            await fetchAllData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al crear publicación');
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...teamForm,
                campana_id: activeCampaign?.id || campaigns[0]?.id || 1
            };
            await axios.post(`${API}/social/team-accounts`, payload, authHeaders);
            setModalTeamOpen(false);
            await fetchAllData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al crear cuenta del equipo');
        }
    };

    const handleCreateComment = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...commentForm,
                campana_id: activeCampaign?.id || campaigns[0]?.id || 1
            };
            await axios.post(`${API}/social/negative-comments`, payload, authHeaders);
            setModalCommentOpen(false);
            await fetchAllData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al registrar comentario negativo');
        }
    };

    const handleCreateCompetitor = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...competitorForm,
                campana_id: activeCampaign?.id || campaigns[0]?.id || 1
            };
            await axios.post(`${API}/social/competitors`, payload, authHeaders);
            setModalCompetitorOpen(false);
            await fetchAllData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al registrar contrincante');
        }
    };

    // Handlers del Asesor Virtual de Viralidad
    const handleOpenAdvisor = async (post = null) => {
        setModalAdvisorOpen(true);
        setAdvisorLoading(true);
        setAdvisorActiveTab('score');
        setCopiedHookIdx(null);
        setCopiedWpType(null);
        setCopiedHashtags(false);
        try {
            const payload = post ? { postId: post.id } : {
                titulo: posts[0]?.titulo || 'Propuesta de Reactivación y Seguridad Ciudadana',
                contenido: posts[0]?.contenido || 'Construyamos juntos el futuro. Presentamos los 5 pilares para transformar el territorio.',
                plataforma: posts[0]?.plataforma || 'tiktok',
                tema_estrategico: posts[0]?.tema_estrategico || 'Economía y Juventud'
            };
            const res = await axios.post(`${API}/social/advisor/viral-analysis`, payload, authHeaders);
            setAdvisorAnalysis(res.data);
        } catch (err) {
            console.error('Error al obtener análisis de viralidad:', err);
        } finally {
            setAdvisorLoading(false);
        }
    };

    const handleSendAdvisorChat = async (questionText = null) => {
        const q = questionText || advisorChatInput;
        if (!q || !q.trim()) return;

        const updated = [...advisorChatMessages, { sender: 'user', text: q }];
        setAdvisorChatMessages(updated);
        setAdvisorChatInput('');

        try {
            const res = await axios.post(`${API}/social/advisor/ask`, {
                pregunta: q,
                contexto_post: advisorAnalysis?.titulo || ''
            }, authHeaders);

            setAdvisorChatMessages([
                ...updated,
                {
                    sender: 'advisor',
                    text: res.data.respuesta,
                    sugerencias: res.data.sugerencias
                }
            ]);
        } catch (err) {
            setAdvisorChatMessages([
                ...updated,
                {
                    sender: 'advisor',
                    text: '⚠️ No pudimos conectar con el asesor virtual en este instante. Intenta nuevamente.'
                }
            ]);
        }
    };

    const handleCopyHook = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedHookIdx(idx);
        setTimeout(() => setCopiedHookIdx(null), 2000);
    };

    const handleCopyWpCopy = (text, type) => {
        navigator.clipboard.writeText(text);
        setCopiedWpType(type);
        setTimeout(() => setCopiedWpType(null), 2000);
    };

    const handleCopyHashtags = (hashtagsList) => {
        if (!hashtagsList) return;
        navigator.clipboard.writeText(hashtagsList.join(' '));
        setCopiedHashtags(true);
        setTimeout(() => setCopiedHashtags(false), 2000);
    };

    // Handlers para Monitoreo de Transmisiones En Vivo
    const handleDispatchLiveAlert = async (livePost = null) => {
        try {
            const payload = {
                plataforma: livePost?.plataforma || 'Todas las Redes',
                liveUrl: livePost?.url_publicacion || `${window.location.origin}/social`,
                campana_id: activeCampaign?.id || 1
            };
            const res = await axios.post(`${API}/social/live-streams/alert`, payload, authHeaders);
            setLiveAlertSuccess(true);
            setTimeout(() => setLiveAlertSuccess(false), 4000);
            alert(`🚨 ¡ALERTA DE EN VIVO DESPACHADA A ${res.data.grupos_notificados.length} GRUPOS!\n\n${res.data.mensaje_alerta}`);
        } catch (e) {
            console.error('Error al despachar alerta de en vivo:', e);
            alert('Error al despachar alerta de en vivo');
        }
    };

    const handlePassQuestionToCandidate = (questionId) => {
        setPassedQuestions(prev => ({
            ...prev,
            [questionId]: true
        }));
    };

    const handleCreateLive = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newLiveForm,
                campana_id: activeCampaign?.id || 1,
                autor_nombre: activeCampaign?.candidato || 'Alejandro Gaviria',
                autor_usuario: '@' + (activeCampaign?.candidato || 'candidato').toLowerCase().replace(/\s+/g, ''),
                fecha_publicacion: new Date().toISOString().slice(0, 16).replace('T', ' '),
                tipo_contenido: 'live',
                en_vivo: true,
                estado_en_vivo: 'en_directo',
                pico_espectadores: Math.round(Number(newLiveForm.espectadores_en_vivo) * 1.3),
                duracion_en_vivo: '00:05:00'
            };
            await axios.post(`${API}/social/posts`, payload, authHeaders);
            setModalNewLiveOpen(false);
            await fetchAllData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al registrar transmisión en vivo');
        }
    };

    const handleExportExcel = () => {
        const campId = activeCampaign?.id || 7;
        window.open(`${API}/social/export/excel?campana_id=${campId}&token=${token}`, '_blank');
    };

    // Filtros de posts
    const filteredPosts = useMemo(() => {
        return posts.filter(p => {
            const matchesPlat = filterPlataforma === 'todas' || p.plataforma === filterPlataforma;
            const matchesSearch = !searchTerm || (
                (p.titulo && p.titulo.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (p.contenido && p.contenido.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (p.autor_nombre && p.autor_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (p.tema_estrategico && p.tema_estrategico.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            return matchesPlat && matchesSearch;
        });
    }, [posts, filterPlataforma, searchTerm]);

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">

            {/* Cabecera Principal / War Room Header */}
            <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-[#00B894] text-slate-950 text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                <Radio size={12} className="animate-pulse" />
                                Monitoreo Digital en Vivo
                            </span>
                            {activeCampaign && (
                                <span className="bg-white/10 text-cyan-300 text-[10px] font-bold px-3 py-1 rounded-full border border-cyan-500/30">
                                    {activeCampaign.nombre} • {activeCampaign.candidato}
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                            <Share2 className="text-[#00B894]" size={32} />
                            Social Media & War Room Digital
                        </h1>
                        <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
                            Control en tiempo real de redes sociales: medición de alcance e impresiones, participación de los miembros del equipo, detección y neutralización de comentarios negativos, y radar de contrincantes de oposición.
                        </p>
                    </div>

                    {/* Acciones Rápidas */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* BOTÓN PRINCIPAL DE BARRIDO DE REDES SOCIALES */}
                        <button
                            type="button"
                            onClick={handleCandidateSweep}
                            disabled={sweepingCandidate}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-xs uppercase rounded-2xl shadow-xl hover:scale-[1.02] transition-all cursor-pointer border border-amber-300/40 disabled:opacity-50"
                            title="Barrido Integral Automático de Redes Sociales del Candidato: extrae publicaciones, comentarios, reacciones y auditoría de equipo"
                        >
                            <RefreshCw size={16} className={sweepingCandidate ? 'animate-spin text-white' : 'text-amber-200'} />
                            <span>{sweepingCandidate ? 'Extrayendo Redes...' : '🌪️ Barrido de Redes'}</span>
                        </button>

                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs uppercase rounded-2xl shadow-lg hover:scale-[1.02] transition-all cursor-pointer border border-emerald-400/40"
                            title="Exportar todas las publicaciones, comentarios y radar de oposición a Excel (.xlsx)"
                        >
                            <Download size={16} />
                            <span>Exportar Excel</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('inteligencia')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-black text-xs uppercase rounded-2xl shadow-lg hover:shadow-cyan-500/30 hover:scale-[1.02] transition-all cursor-pointer border border-cyan-400/40"
                        >
                            <Sparkles size={16} className="text-cyan-200 animate-pulse" />
                            <span>⚡ Impulsar Algoritmo</span>
                        </button>
                        <button
                            onClick={() => handleOpenAdvisor()}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white font-black text-xs uppercase rounded-2xl shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02] transition-all cursor-pointer border border-purple-400/40"
                        >
                            <Bot size={16} className="text-cyan-300 animate-pulse" />
                            <span>🤖 Asesor Viral IA</span>
                        </button>
                        <button
                            onClick={() => setModalPostOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[#00B894] to-emerald-600 text-slate-950 font-black text-xs uppercase rounded-2xl shadow hover:opacity-90 transition-all cursor-pointer"
                        >
                            <Plus size={16} strokeWidth={3} />
                            <span>Monitorear Post</span>
                        </button>
                        <button
                            onClick={() => setModalCommentOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase rounded-2xl shadow transition-all cursor-pointer"
                        >
                            <AlertTriangle size={15} />
                            <span>Alerta de Ataque</span>
                        </button>
                    </div>
                </div>

                {/* Métricas Principales de Redes */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-gray-800/60">
                    <div className="bg-slate-900/60 p-3 rounded-2xl border border-gray-800">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Alcance Total</span>
                        <span className="text-xl font-black text-white mt-0.5 block">
                            {(metrics?.kpis?.totalAlcance || 0).toLocaleString()}
                        </span>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-2xl border border-gray-800">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Impresiones</span>
                        <span className="text-xl font-black text-cyan-400 mt-0.5 block">
                            {(metrics?.kpis?.totalImpresiones || 0).toLocaleString()}
                        </span>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-2xl border border-gray-800">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Interacciones</span>
                        <span className="text-xl font-black text-emerald-400 mt-0.5 block">
                            {(metrics?.kpis?.totalInteracciones || 0).toLocaleString()}
                        </span>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-2xl border border-gray-800">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Sentimiento Favorable</span>
                        <span className="text-xl font-black text-emerald-300 mt-0.5 block flex items-center gap-1">
                            <ThumbsUp size={16} />
                            {metrics?.reacciones?.pctPositivo || 75}%
                        </span>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-2xl border border-gray-800">
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Ataques / Negativos</span>
                        <span className="text-xl font-black text-rose-400 mt-0.5 block flex items-center gap-1.5">
                            {metrics?.kpis?.comentariosPendientes || 0}
                            {metrics?.kpis?.comentariosPendientes > 0 && (
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
                            )}
                        </span>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-2xl border border-gray-800">
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Equipo en Redes</span>
                        <span className="text-xl font-black text-purple-300 mt-0.5 block">
                            {metrics?.kpis?.totalCuentasEquipo || 0} Miembros
                        </span>
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* CENTRO DE LINKS OFICIALES DE REDES SOCIALES DEL CANDIDATO */}
            {/* ========================================================= */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 p-6 rounded-3xl border border-indigo-900/50 shadow-xl text-white space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00B894] to-cyan-600 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg">
                            <Share2 size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-black uppercase tracking-wide text-white">
                                    Links Oficiales de Redes Sociales del Candidato
                                </h2>
                                <span className="bg-[#00B894]/20 text-[#00B894] border border-[#00B894]/40 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                                    Verificados
                                </span>
                            </div>
                            <p className="text-xs text-gray-300 mt-0.5">
                                Canales oficiales de <strong className="text-cyan-300 font-bold">{activeCampaign?.candidato || 'Oscar Villamizar'}</strong> para difusión del equipo, replicación masiva y extracción integral de publicaciones y comentarios.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={() => setModalTeamUploadOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black uppercase tracking-wider border border-emerald-500/40 transition-all cursor-pointer shadow-sm"
                        >
                            <Upload size={14} />
                            <span>Subir Base de Datos del Equipo</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setModalEditLinksOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/60 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider border border-indigo-500/50 transition-all cursor-pointer shadow-sm"
                        >
                            <Edit3 size={14} />
                            <span>Configurar / Editar Links</span>
                        </button>
                    </div>
                </div>

                {/* Notificación de Sincronización Exitosa */}
                {syncSuccessToast && (
                    <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-2xl p-4 text-emerald-300 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2.5">
                            <span className="p-2 rounded-xl bg-emerald-500/30 text-emerald-200">
                                <CheckCircle size={18} />
                            </span>
                            <div>
                                <p className="font-bold text-white text-xs">
                                    ¡Sincronización Exitosa de {syncSuccessToast.handle} ({syncSuccessToast.platform.toUpperCase()})!
                                </p>
                                <p className="text-[11px] text-emerald-200/90 mt-0.5">
                                    {syncSuccessToast.message}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSyncSuccessToast(null)}
                            className="text-emerald-400 hover:text-white p-1 rounded-lg hover:bg-emerald-500/20 cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Grid de 6 Redes Sociales con sus Enlaces Directos y Botones de Copiar y Sincronizar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        {
                            id: 'instagram',
                            nombre: 'Instagram Oficial',
                            icon: '📸',
                            badge: 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white',
                            border: 'border-pink-500/30',
                            url: activeCampaign?.link_instagram || 'https://www.instagram.com/oscarvillamiz/?hl=es',
                            usuario: activeCampaign?.link_instagram ? '@' + activeCampaign.link_instagram.split('/').filter(Boolean).pop().replace(/^@/, '') : '@oscarvillamiz'
                        },
                        {
                            id: 'tiktok',
                            nombre: 'TikTok Oficial',
                            icon: '🎵',
                            badge: 'bg-black text-cyan-400',
                            border: 'border-cyan-500/30',
                            url: activeCampaign?.link_tiktok || 'https://www.tiktok.com/@oscarvillamiz',
                            usuario: activeCampaign?.link_tiktok ? '@' + activeCampaign.link_tiktok.split('/').filter(Boolean).pop().replace(/^@/, '') : '@oscarvillamiz'
                        },
                        {
                            id: 'facebook',
                            nombre: 'Facebook Oficial',
                            icon: '📘',
                            badge: 'bg-blue-600 text-white',
                            border: 'border-blue-500/30',
                            url: activeCampaign?.link_facebook || 'https://www.facebook.com/OscarVillamiz/?locale=es_LA',
                            usuario: activeCampaign?.candidato || 'Oscar Villamizar'
                        },
                        {
                            id: 'twitter',
                            nombre: 'X (Twitter) Oficial',
                            icon: '🐦',
                            badge: 'bg-slate-800 text-white',
                            border: 'border-slate-700',
                            url: activeCampaign?.link_twitter || 'https://x.com/OscarVillamiz',
                            usuario: activeCampaign?.link_twitter ? '@' + activeCampaign.link_twitter.split('/').filter(Boolean).pop().replace(/^@/, '') : '@OscarVillamiz'
                        },
                        {
                            id: 'youtube',
                            nombre: 'YouTube Oficial',
                            icon: '▶️',
                            badge: 'bg-red-600 text-white',
                            border: 'border-red-500/30',
                            url: activeCampaign?.link_youtube || 'https://www.youtube.com/@OscarVillamizarOficial',
                            usuario: (activeCampaign?.candidato || 'Oscar Villamizar') + ' Oficial'
                        },
                        {
                            id: 'whatsapp',
                            nombre: 'Canal de WhatsApp',
                            icon: '💬',
                            badge: 'bg-emerald-600 text-white',
                            border: 'border-emerald-500/30',
                            url: activeCampaign?.link_whatsapp || 'https://chat.whatsapp.com/OscarVillamizarSenado',
                            usuario: 'Comunidad Oficial ' + (activeCampaign?.candidato || 'Oscar Villamizar')
                        }
                    ].map(r => {
                        const isCopied = copiedLinkId === r.id;
                        const isSyncing = syncingProfileUrl === r.url;
                        const platformPosts = posts.filter(p => p.plataforma === r.id);
                        const platformPostsCount = platformPosts.length;
                        return (
                            <div
                                key={r.id}
                                className={`bg-slate-950/80 p-3.5 rounded-2xl border ${r.border} hover:border-cyan-500/60 transition-all space-y-2.5 flex flex-col justify-between`}
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${r.badge} flex items-center gap-1 shadow-xs`}>
                                            <span>{r.icon}</span>
                                            <span>{r.nombre}</span>
                                        </span>
                                        <span className="text-[10px] font-mono text-gray-400">
                                            {r.usuario}
                                        </span>
                                    </div>

                                    <a
                                        href={r.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-mono text-cyan-300 hover:text-cyan-200 hover:underline line-clamp-1 block pt-1"
                                        title={r.url}
                                    >
                                        {r.url}
                                    </a>

                                    <div className="flex items-center justify-between text-[11px] pt-1">
                                        <span className="text-gray-400 font-medium">Extraídas en el módulo:</span>
                                        <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${platformPostsCount > 0 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-900 text-gray-400 border border-gray-800'}`}>
                                            {platformPostsCount} {platformPostsCount === 1 ? 'publicación' : 'publicaciones'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-1 border-t border-gray-800/60">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(r.url);
                                                setCopiedLinkId(r.id);
                                                setTimeout(() => setCopiedLinkId(null), 3000);
                                            }}
                                            className="flex items-center justify-center gap-1 py-1 px-2 bg-slate-900 hover:bg-slate-800 text-gray-200 rounded-xl text-[10px] font-bold border border-gray-800 transition-colors cursor-pointer"
                                        >
                                            {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                            <span>{isCopied ? '¡Copiado!' : 'Copiar Link'}</span>
                                        </button>

                                        <a
                                            href={r.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-1 py-1 px-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-bold transition-colors cursor-pointer shadow-xs"
                                        >
                                            <ExternalLink size={12} />
                                            <span>Abrir Perfil</span>
                                        </a>
                                    </div>

                                    {r.id !== 'whatsapp' && (
                                        <button
                                            type="button"
                                            disabled={isSyncing}
                                            onClick={() => handleSyncProfile(r.url)}
                                            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs disabled:opacity-50"
                                        >
                                            <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                                            <span>{isSyncing ? 'Sincronizando y Extrayendo...' : `⚡ Sincronizar y Extraer Todo (${platformPostsCount})`}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Pestañas de Navegación del Módulo */}
            <div className="bg-white p-2 rounded-3xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-2">
                <button
                    onClick={() => setActiveTab('envivo')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                        activeTab === 'envivo'
                            ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-lg shadow-rose-500/25'
                            : 'text-rose-700 bg-rose-50/80 hover:bg-rose-100 border border-rose-200'
                    }`}
                >
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                    </span>
                    <Radio size={16} className={activeTab === 'envivo' ? 'animate-pulse' : ''} />
                    <span>🔴 En Vivo Multirred ({liveMonitorData?.livePosts?.length || 0})</span>
                </button>

                <button
                    onClick={() => setActiveTab('feed')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                        activeTab === 'feed'
                            ? 'bg-slate-950 text-white shadow-md'
                            : 'text-gray-500 hover:bg-gray-100'
                    }`}
                >
                    <Share2 size={16} className={activeTab === 'feed' ? 'text-[#00B894]' : ''} />
                    <span>Feed & Publicaciones ({posts.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('equipo')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
                        activeTab === 'equipo'
                            ? 'bg-slate-950 text-white shadow-md'
                            : 'text-gray-500 hover:bg-gray-100'
                    }`}
                >
                    <Users size={16} className={activeTab === 'equipo' ? 'text-purple-400' : ''} />
                    <span>Redes del Equipo ({teamAccounts.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('negativos')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
                        activeTab === 'negativos'
                            ? 'bg-rose-950 text-rose-100 shadow-md'
                            : 'text-gray-500 hover:bg-gray-100'
                    }`}
                >
                    <ShieldAlert size={16} className="text-rose-500" />
                    <span>Comentarios Negativos & Crisis ({negativeComments.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('oposicion')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
                        activeTab === 'oposicion'
                            ? 'bg-amber-950 text-amber-100 shadow-md'
                            : 'text-gray-500 hover:bg-gray-100'
                    }`}
                >
                    <Swords size={16} className="text-amber-500" />
                    <span>Radar de Oposición ({competitors.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('inteligencia')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                        activeTab === 'inteligencia'
                            ? 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/25'
                            : 'text-cyan-700 bg-cyan-50/80 hover:bg-cyan-100 border border-cyan-200'
                    }`}
                >
                    <Sparkles size={16} className={activeTab === 'inteligencia' ? 'text-cyan-200 animate-pulse' : 'text-cyan-600'} />
                    <span>⚡ Impulsar Algoritmo Social</span>
                </button>
            </div>

            {/* ========================================================= */}
            {/* PESTAÑA: IMPULSAR ALGORITMO SOCIAL / CONTENT INTELLIGENCE */}
            {/* ========================================================= */}
            {activeTab === 'inteligencia' && (
                <ContentIntelligenceDashboard activeCampaign={activeCampaign} token={token} />
            )}

            {/* ========================================================= */}
            {/* PESTAÑA 0: SEGUIMIENTO A LOS EN VIVO EN TODAS LAS REDES */}
            {/* ========================================================= */}
            {activeTab === 'envivo' && (
                <div className="space-y-6">
                    {/* Banner Principal del War Room Live */}
                    <div className="bg-gradient-to-r from-slate-950 via-rose-950/80 to-slate-950 rounded-3xl p-6 text-white border border-rose-500/30 shadow-2xl relative overflow-hidden">
                        <div className="absolute -right-12 -top-12 w-80 h-80 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="bg-red-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                        <span>EN DIRECTO MULTIRRED</span>
                                    </span>
                                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
                                        🔴 {liveMonitorData?.resumen?.canalesActivos || 0} Canales Transmitiendo Simultáneamente
                                    </span>
                                </div>

                                <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                                    <Radio className="text-red-500 animate-pulse" size={32} />
                                    <span>War Room de Transmisiones En Vivo</span>
                                </h2>
                                <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
                                    Monitoreo en tiempo real de espectadores concurrentes, ritmo de chat, filtrado de preguntas ciudadanas y despliegue masivo de apoyo en TikTok Live, Instagram Live, Facebook Live, YouTube Live y X Spaces.
                                </p>
                            </div>

                            {/* Botones de Acción de En Vivo */}
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleDispatchLiveAlert()}
                                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs uppercase rounded-2xl shadow-lg shadow-rose-500/30 hover:scale-[1.02] transition-all cursor-pointer border border-rose-400/40"
                                >
                                    <Flame size={16} className="text-amber-300 animate-bounce" />
                                    <span>🚨 Desplegar Refuerzos al Live</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModalNewLiveOpen(true)}
                                    className="flex items-center gap-1.5 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase rounded-2xl border border-slate-700 transition-all cursor-pointer"
                                >
                                    <Plus size={16} />
                                    <span>+ Conectar En Vivo</span>
                                </button>
                            </div>
                        </div>

                        {/* Métricas Consolidadas del En Vivo */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-5 border-t border-rose-900/40">
                            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-rose-500/20 shadow-xs">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Audiencia Concurrente</span>
                                <span className="text-2xl font-black text-white mt-1 block flex items-center gap-1.5">
                                    <Eye size={18} className="text-rose-400" />
                                    {(liveMonitorData?.resumen?.totalEspectadores || 16850).toLocaleString()}
                                </span>
                                <span className="text-[9px] text-emerald-400 font-bold mt-0.5 block">Sumando todas las redes</span>
                            </div>

                            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-rose-500/20 shadow-xs">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Pico Máximo</span>
                                <span className="text-2xl font-black text-amber-400 mt-1 block flex items-center gap-1.5">
                                    <TrendingUp size={18} />
                                    {(liveMonitorData?.resumen?.picoMaximo || 22880).toLocaleString()}
                                </span>
                                <span className="text-[9px] text-gray-400 font-bold mt-0.5 block">Máximo registrado hoy</span>
                            </div>

                            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-rose-500/20 shadow-xs">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Red Líder en Directo</span>
                                <span className="text-xl font-black text-cyan-300 mt-1 block capitalize truncate">
                                    {liveMonitorData?.resumen?.redLider || 'Facebook & TikTok'}
                                </span>
                                <span className="text-[9px] text-cyan-400 font-bold mt-0.5 block">Mayor cuota de espectadores</span>
                            </div>

                            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-rose-500/20 shadow-xs">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tiempo al Aire</span>
                                <span className="text-2xl font-black text-white mt-1 block font-mono">
                                    {liveMonitorData?.resumen?.duracionPromedio || '00:52:10'}
                                </span>
                                <span className="text-[9px] text-rose-300 font-bold mt-0.5 block">Transmisión activa</span>
                            </div>

                            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-rose-500/20 shadow-xs col-span-2 sm:col-span-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Velocidad del Chat</span>
                                <span className="text-2xl font-black text-emerald-400 mt-1 block flex items-center gap-1.5">
                                    <MessageSquare size={18} />
                                    ~145/min
                                </span>
                                <span className="text-[9px] text-emerald-300 font-bold mt-0.5 block">Comentarios por minuto</span>
                            </div>
                        </div>
                    </div>

                    {/* Canales En Vivo Activos (Tarjetas por Red) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-sm uppercase text-slate-900 flex items-center gap-2">
                                <Video size={18} className="text-red-600" />
                                <span>Canales Transmitiendo Simultáneamente ({liveMonitorData?.livePosts?.length || 0})</span>
                            </h3>
                            <span className="text-xs text-gray-500 font-bold">
                                Trazabilidad individual con el link del candidato
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(liveMonitorData?.livePosts || []).map((live) => {
                                const platInfo = PLATAFORMAS_INFO[live.plataforma] || {
                                    label: live.plataforma,
                                    color: 'bg-slate-900 text-white',
                                    border: 'border-slate-800',
                                    light: 'bg-slate-100 text-slate-900'
                                };

                                return (
                                    <div
                                        key={live.id}
                                        className="bg-white rounded-3xl border-2 border-red-500/30 p-5 shadow-md hover:shadow-xl transition-all space-y-4 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />

                                        {/* Header de la tarjeta */}
                                        <div className="flex items-start justify-between gap-3 pt-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-xl ${platInfo.color} shadow-xs`}>
                                                    {platInfo.label}
                                                </span>
                                                <span className="bg-red-50 text-red-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                                                    <span>En Vivo</span>
                                                </span>
                                            </div>

                                            <span className="text-[11px] font-mono font-bold text-gray-500">
                                                ⏱️ {live.duracion_en_vivo || '00:45:00'}
                                            </span>
                                        </div>

                                        {/* Título y Autor */}
                                        <div>
                                            <h4 className="font-black text-sm text-slate-900 leading-snug line-clamp-2">
                                                {live.titulo}
                                            </h4>
                                            <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                                                {live.contenido}
                                            </p>
                                        </div>

                                        {/* Métricas de Audiencia en Vivo */}
                                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                            <div className="bg-red-50/80 border border-red-100 p-2 rounded-2xl">
                                                <span className="text-[9px] font-bold text-red-600 uppercase block">Espectadores</span>
                                                <span className="font-black text-red-950 text-base block mt-0.5">
                                                    {(live.espectadores_en_vivo || 0).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="bg-amber-50/80 border border-amber-100 p-2 rounded-2xl">
                                                <span className="text-[9px] font-bold text-amber-700 uppercase block">Pico Máximo</span>
                                                <span className="font-black text-amber-950 text-base block mt-0.5">
                                                    {(live.pico_espectadores || 0).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="bg-purple-50/80 border border-purple-100 p-2 rounded-2xl">
                                                <span className="text-[9px] font-bold text-purple-700 uppercase block">Interacciones</span>
                                                <span className="font-black text-purple-950 text-base block mt-0.5">
                                                    {(live.interacciones || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Revisor de Link del Candidato */}
                                        <div className="bg-slate-950 text-white rounded-2xl p-3 space-y-2 border border-slate-800">
                                            <div className="flex items-center justify-between text-[10px]">
                                                <span className="font-bold text-cyan-300 uppercase">Trazabilidad del Live:</span>
                                                <span className="font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                                                    👁️ {live.clics_link_candidato || 0} clics
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyCandidateLink(live.id)}
                                                    className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                                                >
                                                    {copiedLinkId === live.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                                    <span>{copiedLinkId === live.id ? '¡Copiado!' : 'Copiar Link'}</span>
                                                </button>

                                                <a
                                                    href={live.url_publicacion || '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="py-1.5 px-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                                >
                                                    <ExternalLink size={12} />
                                                    <span>Abrir Live</span>
                                                </a>
                                            </div>
                                        </div>

                                        {/* Botón de Refuerzo Directo */}
                                        <button
                                            type="button"
                                            onClick={() => handleDispatchLiveAlert(live)}
                                            className="w-full py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <Flame size={14} />
                                            <span>📢 Reforzar este Live en WhatsApp</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Muro de Chat Unificado y Preguntas Ciudadanas en Tiempo Real */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                            <div>
                                <h3 className="font-black text-base uppercase text-slate-900 flex items-center gap-2">
                                    <MessageSquare size={18} className="text-purple-600" />
                                    <span>Muro de Comentarios y Preguntas en Vivo (Multicanal)</span>
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Todos los comentarios entrando en directo desde TikTok, Facebook, Instagram, YouTube y X.
                                </p>
                            </div>

                            {/* Filtros del Chat en Vivo */}
                            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
                                {[
                                    { id: 'todos', label: 'Todos' },
                                    { id: 'pregunta', label: '❓ Preguntas al Candidato' },
                                    { id: 'apoyo', label: '🟢 Apoyo & Ovación' },
                                    { id: 'ataque', label: '⚠️ Ataques / Trolls' }
                                ].map(filtro => (
                                    <button
                                        key={filtro.id}
                                        onClick={() => setLiveFilterTipo(filtro.id)}
                                        className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                                            liveFilterTipo === filtro.id
                                                ? 'bg-purple-600 text-white shadow-sm'
                                                : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                                        }`}
                                    >
                                        {filtro.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Listado de Comentarios Filtrados */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Feed en tiempo real (7 columnas) */}
                            <div className="lg:col-span-7 space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                {(liveMonitorData?.comentariosEnVivo || [])
                                    .filter(c => liveFilterTipo === 'todos' || c.tipo === liveFilterTipo)
                                    .map(com => {
                                        const platInfo = PLATAFORMAS_INFO[com.plataforma] || { label: com.plataforma, color: 'bg-slate-900 text-white' };
                                        const isPassed = passedQuestions[com.id];

                                        return (
                                            <div
                                                key={com.id}
                                                className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                                                    com.tipo === 'pregunta'
                                                        ? 'bg-amber-50/50 border-amber-200/80 shadow-2xs'
                                                        : com.tipo === 'ataque'
                                                        ? 'bg-rose-50/50 border-rose-200/80'
                                                        : 'bg-gray-50/70 border-gray-200/70'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${platInfo.color}`}>
                                                            {platInfo.label}
                                                        </span>
                                                        <span className="font-black text-slate-900 text-xs">
                                                            {com.usuario}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-mono">
                                                            {com.tiempo}
                                                        </span>
                                                    </div>

                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                        com.tipo === 'pregunta'
                                                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                                            : com.tipo === 'ataque'
                                                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                                    }`}>
                                                        {com.tipo === 'pregunta' ? '❓ Pregunta' : com.tipo === 'ataque' ? '⚠️ Crítica' : '🟢 Apoyo'}
                                                    </span>
                                                </div>

                                                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                                                    "{com.texto}"
                                                </p>

                                                {/* Acciones por tipo de comentario */}
                                                <div className="flex items-center justify-end gap-2 pt-1">
                                                    {com.tipo === 'pregunta' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePassQuestionToCandidate(com.id)}
                                                            className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                                                                isPassed
                                                                    ? 'bg-emerald-600 text-white'
                                                                    : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                                                            }`}
                                                        >
                                                            {isPassed ? <Check size={12} /> : <Radio size={12} />}
                                                            <span>{isPassed ? '✅ Enviada a Tarima / Teleprompter' : '🎙️ Pasar al Candidato'}</span>
                                                        </button>
                                                    )}

                                                    {com.tipo === 'ataque' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => alert(`🛡️ Alerta enviada a la Brigada Digital para neutralizar el comentario de ${com.usuario} en ${com.plataforma}`)}
                                                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <ShieldAlert size={12} />
                                                            <span>🛡️ Activar Réplica de Defensa</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>

                            {/* Panel Derecho (5 columnas): Banco de Preguntas Seleccionadas para el Candidato */}
                            <div className="lg:col-span-5 bg-gradient-to-b from-indigo-950 to-slate-950 rounded-3xl p-5 text-white border border-indigo-900/50 space-y-4">
                                <div className="space-y-1 border-b border-indigo-900/70 pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                                            🎙️
                                        </div>
                                        <h4 className="font-black text-sm uppercase tracking-wide text-white">
                                            Teleprompter / Preguntas de Tarima
                                        </h4>
                                    </div>
                                    <p className="text-[11px] text-gray-300">
                                        Preguntas seleccionadas del chat en vivo listas para que el moderador o el candidato las responda en el aire:
                                    </p>
                                </div>

                                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                                    {(liveMonitorData?.comentariosEnVivo || [])
                                        .filter(c => c.destacada || passedQuestions[c.id])
                                        .map((q, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-slate-900/90 border border-amber-500/30 p-3.5 rounded-2xl space-y-2 relative"
                                            >
                                                <div className="flex items-center justify-between text-[10px]">
                                                    <span className="font-bold text-amber-400 uppercase">
                                                        Pregunta #{idx + 1} • {q.plataforma.toUpperCase()}
                                                    </span>
                                                    <span className="text-gray-400 font-mono">
                                                        {q.usuario}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-white leading-snug">
                                                    "{q.texto}"
                                                </p>
                                                <div className="flex items-center justify-between pt-1 text-[10px]">
                                                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                                                        <Check size={12} />
                                                        Lista para responder
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(q.texto);
                                                            alert('Pregunta copiada al portapapeles');
                                                        }}
                                                        className="text-gray-300 hover:text-white flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <Copy size={11} />
                                                        <span>Copiar</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* PESTAÑA 1: FEED EN VIVO & ANÁLISIS DE PUBLICACIONES */}
            {/* ========================================================= */}
            {activeTab === 'feed' && (
                <div className="space-y-4">
                    {/* Filtros de Plataforma y Buscador */}
                    <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
                            <button
                                onClick={() => setFilterPlataforma('todas')}
                                className={`px-3.5 py-1.5 rounded-xl transition-all ${filterPlataforma === 'todas' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                Todas
                            </button>
                            {Object.entries(PLATAFORMAS_INFO).map(([key, info]) => (
                                <button
                                    key={key}
                                    onClick={() => setFilterPlataforma(key)}
                                    className={`px-3.5 py-1.5 rounded-xl transition-all ${filterPlataforma === key ? info.color : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    {info.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative flex-1 max-w-sm">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por tema, título, contenido o autor..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#00B894]"
                            />
                        </div>
                    </div>

                    {/* Grid de Publicaciones */}
                    {loading ? (
                        <div className="text-center py-16 text-gray-400 text-xs">Cargando publicaciones...</div>
                    ) : filteredPosts.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 text-gray-400 text-xs">
                            No se encontraron publicaciones con los filtros aplicados.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredPosts.map(p => {
                                const platInfo = PLATAFORMAS_INFO[p.plataforma] || PLATAFORMAS_INFO.instagram;
                                return (
                                    <div key={p.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4">
                                        <div className="space-y-3">
                                            {/* Cabecera del post */}
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${platInfo.color}`}>
                                                    {platInfo.label}
                                                </span>

                                                {p.en_vivo ? (
                                                    <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 animate-pulse border border-red-300">
                                                        <Radio size={10} />
                                                        EN VIVO AHORA
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-gray-400 font-mono">
                                                        {p.fecha_publicacion}
                                                    </span>
                                                )}
                                            </div>

                                            <div>
                                                <h3 className="font-black text-sm text-slate-900 leading-snug line-clamp-2">
                                                    {p.titulo}
                                                </h3>
                                                <p className="text-[11px] text-gray-500 mt-1 line-clamp-3">
                                                    {p.contenido}
                                                </p>
                                            </div>

                                            {p.tema_estrategico && (
                                                <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                                    🏷️ {p.tema_estrategico}
                                                </span>
                                            )}
                                        </div>

                                        {/* Métricas de Alcance y Reacciones */}
                                        <div className="space-y-3 pt-3 border-t border-gray-100">
                                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                                <div className="bg-gray-50 p-2 rounded-xl">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Alcance</span>
                                                    <span className="font-black text-slate-800 block">{(p.alcance || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="bg-gray-50 p-2 rounded-xl">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Interacciones</span>
                                                    <span className="font-black text-emerald-700 block">{(p.interacciones || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="bg-gray-50 p-2 rounded-xl">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase block">Engagement</span>
                                                    <span className="font-black text-cyan-700 block">{p.engagement_rate || 0}%</span>
                                                </div>
                                            </div>

                                            {/* Desglose de Reacciones Generales */}
                                            <div className="flex items-center justify-between text-[11px] text-gray-600 bg-gray-50/60 p-2.5 rounded-xl font-bold">
                                                <span className="flex items-center gap-1 text-blue-600">
                                                    👍 {(p.likes || 0).toLocaleString()}
                                                </span>
                                                <span className="flex items-center gap-1 text-rose-600">
                                                    ❤️ {(p.me_encanta || 0).toLocaleString()}
                                                </span>
                                                <span className="flex items-center gap-1 text-amber-700">
                                                    😡 {(p.me_enoja || 0).toLocaleString()}
                                                </span>
                                                <span className="flex items-center gap-1 text-gray-500">
                                                    💬 {(p.comentarios_conteo || 0).toLocaleString()}
                                                </span>
                                            </div>

                                            {/* SEGUIMIENTO Y AUDITORÍA DEL EQUIPO (BD OFICIAL) */}
                                            <div className="bg-gradient-to-br from-indigo-50/90 to-purple-50/70 border border-indigo-100 rounded-2xl p-3 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <Users size={13} className="text-indigo-600" />
                                                        <span className="text-[10px] font-black uppercase text-indigo-900 tracking-wide">
                                                            Apoyo del Equipo ({p.total_equipo_participando || 0})
                                                        </span>
                                                    </div>
                                                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase">
                                                        BD Oficial
                                                    </span>
                                                </div>

                                                {/* Mini indicadores de apoyo */}
                                                <div className="grid grid-cols-3 gap-1.5 text-center">
                                                    <div className="bg-white/90 py-1 px-1 rounded-xl shadow-xs border border-indigo-50">
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase block">Reaccionaron</span>
                                                        <span className="text-xs font-black text-blue-600 flex items-center justify-center gap-0.5">
                                                            👍 {p.team_reactions || 0}
                                                        </span>
                                                    </div>
                                                    <div className="bg-white/90 py-1 px-1 rounded-xl shadow-xs border border-indigo-50">
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase block">Comentaron</span>
                                                        <span className="text-xs font-black text-purple-700 flex items-center justify-center gap-0.5">
                                                            💬 {p.team_comments || 0}
                                                        </span>
                                                    </div>
                                                    <div className="bg-white/90 py-1 px-1 rounded-xl shadow-xs border border-indigo-50">
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase block">Compartieron</span>
                                                        <span className="text-xs font-black text-emerald-600 flex items-center justify-center gap-0.5">
                                                            🔄 {p.team_shares || 0}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Chips de participación del equipo (Sin nombres personales ni perfiles) */}
                                                {p.team_interactions && p.team_interactions.length > 0 && (
                                                    <div className="pt-1 flex flex-wrap gap-1">
                                                        {p.team_interactions.slice(0, 4).map((it, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="inline-flex items-center gap-1 text-[9px] bg-white text-slate-800 font-bold px-2 py-0.5 rounded-lg border border-indigo-100 shadow-2xs"
                                                                title={`Participación: ${it.rol_equipo} • Reacción: ${it.tipo_reaccion} ${it.comento ? '• Comentó' : ''} ${it.compartio ? '• Compartió' : ''}`}
                                                            >
                                                                <span>{it.tipo_reaccion === 'me_encanta' ? '❤️' : it.tipo_reaccion === 'apoyo' ? '🔥' : it.tipo_reaccion === 'aplausos' ? '👏' : '👍'}</span>
                                                                <span className="truncate max-w-[100px] text-indigo-950 font-black">{it.rol_equipo}</span>
                                                                {it.comento && <span title="Comentó en redes">💬</span>}
                                                                {it.compartio && <span title="Compartió en sus redes" className="text-emerald-600 font-black">🔄</span>}
                                                            </span>
                                                        ))}
                                                        {p.team_interactions.length > 4 && (
                                                            <span className="text-[9px] font-bold text-indigo-600 self-center">
                                                                +{p.team_interactions.length - 4} más
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Botón para ver Comentarios y Reacciones con Identificación del Integrante al lado */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedPostForComments(p);
                                                        setModalCommentsOpen(true);
                                                    }}
                                                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
                                                >
                                                    <MessageSquare size={13} />
                                                    <span>💬 Ver Comentarios & Identificar Equipo ({p.comentarios_conteo || 0})</span>
                                                </button>

                                                {/* Botón para abrir la Auditoría de Participación del Equipo */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenAuditModal(p)}
                                                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 hover:bg-indigo-50 text-indigo-900 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors border border-indigo-200 cursor-pointer"
                                                >
                                                    <Users size={12} className="text-indigo-600" />
                                                    <span>Registrar Apoyo Manual</span>
                                                </button>
                                            </div>

                                            {/* REVISOR POR EL LINK DEL CANDIDATO (TRAZABILIDAD DE REDES) */}
                                            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-3 space-y-2 border border-slate-800 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <Share2 size={13} className="text-cyan-400" />
                                                        <span className="text-[10px] font-black uppercase text-cyan-300 tracking-wider">
                                                            Revisor • Link del Candidato
                                                        </span>
                                                    </div>
                                                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                                                        👁️ {p.clics_link_candidato || 0} clics trazados
                                                    </span>
                                                </div>

                                                <p className="text-[10px] text-gray-400 leading-tight">
                                                    Enlace oficial de campaña para que el equipo revise, reaccione y comparta con trazabilidad directa.
                                                </p>

                                                <div className="grid grid-cols-2 gap-2 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyCandidateLink(p.id)}
                                                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-bold transition-all border border-slate-700 cursor-pointer shadow-xs"
                                                    >
                                                        {copiedLinkId === p.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                                        <span>{copiedLinkId === p.id ? '¡Link Copiado!' : 'Copiar Link'}</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenCandidateLink(p)}
                                                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-[10px] font-bold transition-all shadow-sm cursor-pointer"
                                                    >
                                                        <ExternalLink size={12} />
                                                        <span>Abrir y Trazar</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* BOTÓN ASESOR DE VIRALIDAD IA */}
                                            <button
                                                type="button"
                                                onClick={() => handleOpenAdvisor(p)}
                                                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-purple-700 via-indigo-700 to-cyan-600 hover:from-purple-600 hover:to-cyan-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md hover:shadow-purple-500/25 cursor-pointer border border-purple-400/30"
                                            >
                                                <Bot size={13} className="text-cyan-300" />
                                                <span>🚀 Viralizar con Asesor IA</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================= */}
            {/* PESTAÑA 2: REDES DEL EQUIPO & SEGUIMIENTO DE PARTICIPACIÓN */}
            {/* ========================================================= */}
            {activeTab === 'equipo' && (
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-black text-base uppercase text-slate-900">
                                Directorio y Activismo Digital del Equipo
                            </h3>
                            <p className="text-xs text-gray-500">
                                Cuentas registradas de candidatos, oradores, avanzada y activistas para medir quiénes replican los mensajes de campaña.
                            </p>
                        </div>
                        <button
                            onClick={() => setModalTeamOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold text-xs uppercase rounded-xl hover:bg-slate-800 transition-all shadow"
                        >
                            <Plus size={16} />
                            <span>Registrar Cuenta del Equipo</span>
                        </button>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                                    <tr>
                                        <th className="px-5 py-3.5">Miembro del Equipo</th>
                                        <th className="px-4 py-3.5">Rol en Campaña</th>
                                        <th className="px-4 py-3.5">Plataforma & Usuario</th>
                                        <th className="px-4 py-3.5 text-center">Audiencia (Seguidores)</th>
                                        <th className="px-4 py-3.5 text-center">Nivel de Apoyo</th>
                                        <th className="px-4 py-3.5 text-center">Réplicas / Reposts</th>
                                        <th className="px-4 py-3.5 text-center">Acción de Seguimiento</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {teamAccounts.map(acc => {
                                        const platInfo = PLATAFORMAS_INFO[acc.plataforma] || PLATAFORMAS_INFO.twitter;
                                        return (
                                            <tr key={acc.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <p className="font-bold text-slate-900">{acc.nombre_miembro}</p>
                                                    <p className="text-[10px] text-gray-400">{acc.observaciones || 'Equipo territorial'}</p>
                                                </td>

                                                <td className="px-4 py-3.5">
                                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                                                        {acc.rol_equipo}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${platInfo.color}`}>
                                                            {platInfo.label}
                                                        </span>
                                                        <a
                                                            href={acc.url_perfil || '#'}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="font-mono text-xs font-bold text-slate-800 hover:text-cyan-600 underline flex items-center gap-1"
                                                        >
                                                            {acc.usuario_handle}
                                                        </a>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                                                    {(acc.seguidores || 0).toLocaleString()}
                                                </td>

                                                <td className="px-4 py-3.5 text-center">
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                        acc.nivel_participacion === 'Muy Activo' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                                        acc.nivel_participacion === 'Activo' ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' :
                                                        'bg-amber-100 text-amber-800 border border-amber-200'
                                                    }`}>
                                                        {acc.nivel_participacion}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-900">
                                                    {acc.repost_campana_count || 0}
                                                </td>

                                                <td className="px-4 py-3.5 text-center">
                                                    <button
                                                        onClick={() => handleRecordSupport(acc.id)}
                                                        className="px-3 py-1.5 bg-[#00B894] hover:bg-emerald-600 text-slate-950 font-black text-[10px] uppercase rounded-xl transition-all shadow-sm flex items-center gap-1 mx-auto"
                                                        title="Registrar que compartió publicación oficial"
                                                    >
                                                        <Repeat size={12} />
                                                        <span>Registrar Apoyo (+1)</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* PESTAÑA 3: SALA DE CRISIS & COMENTARIOS NEGATIVOS */}
            {/* ========================================================= */}
            {activeTab === 'negativos' && (
                <div className="space-y-4">
                    <div className="bg-gradient-to-r from-rose-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                Sala de Crisis & Contención Electoral
                            </span>
                            <h3 className="font-black text-xl uppercase mt-1">
                                Gestión de Ataques, Fake News y Comentarios Críticos
                            </h3>
                            <p className="text-xs text-rose-200/80">
                                Rastreo de desinformación y preparación de argumentarios para voceros y activistas digitales.
                            </p>
                        </div>

                        <button
                            onClick={() => setModalCommentOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase rounded-2xl shadow transition-all"
                        >
                            <Plus size={16} />
                            <span>Reportar Nuevo Ataque</span>
                        </button>
                    </div>

                    {/* Filtros de Riesgo */}
                    <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-xs font-bold">
                        <span className="text-gray-400 uppercase text-[10px] pl-2">Filtrar Severidad:</span>
                        <button
                            onClick={() => setFilterRiesgo('todos')}
                            className={`px-3 py-1 rounded-xl ${filterRiesgo === 'todos' ? 'bg-slate-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFilterRiesgo('critico')}
                            className={`px-3 py-1 rounded-xl ${filterRiesgo === 'critico' ? 'bg-red-700 text-white' : 'text-red-700 hover:bg-red-50'}`}
                        >
                            Críticos (Urgentes)
                        </button>
                        <button
                            onClick={() => setFilterRiesgo('alto')}
                            className={`px-3 py-1 rounded-xl ${filterRiesgo === 'alto' ? 'bg-orange-700 text-white' : 'text-orange-700 hover:bg-orange-50'}`}
                        >
                            Altos
                        </button>
                        <button
                            onClick={() => setFilterRiesgo('medio')}
                            className={`px-3 py-1 rounded-xl ${filterRiesgo === 'medio' ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-amber-50'}`}
                        >
                            Medios / Leves
                        </button>
                    </div>

                    {/* Lista de Comentarios Negativos */}
                    <div className="space-y-3">
                        {negativeComments
                            .filter(c => filterRiesgo === 'todos' || c.nivel_riesgo === filterRiesgo)
                            .map(c => {
                                const platInfo = PLATAFORMAS_INFO[c.plataforma] || PLATAFORMAS_INFO.twitter;
                                return (
                                    <div key={c.id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${platInfo.color}`}>
                                                    {platInfo.label}
                                                </span>
                                                <span className="font-mono text-xs font-bold text-slate-800">
                                                    {c.usuario_comenta}
                                                </span>
                                                <span className="text-[10px] text-gray-400">
                                                    • {c.fecha_deteccion}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                                    c.nivel_riesgo === 'critico' ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse' :
                                                    c.nivel_riesgo === 'alto' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                                                    'bg-amber-100 text-amber-800 border border-amber-200'
                                                }`}>
                                                    Riesgo {c.nivel_riesgo?.toUpperCase()}
                                                </span>

                                                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                                    c.estado_gestion === 'neutralizado' ? 'bg-emerald-100 text-emerald-800' :
                                                    c.estado_gestion === 'en_respuesta' ? 'bg-blue-100 text-blue-800' :
                                                    c.estado_gestion === 'escalado_legal' ? 'bg-purple-100 text-purple-800' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {c.estado_gestion?.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Comentario y Ataque */}
                                        <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100 text-xs">
                                            <span className="text-[10px] font-black text-rose-800 uppercase block mb-1">
                                                ⚠️ Ataque Detectado [{c.categoria_ataque}]
                                            </span>
                                            <p className="text-slate-900 font-medium italic">"{c.texto_comentario}"</p>
                                        </div>

                                        {/* Argumentario Sugerido */}
                                        {c.respuesta_sugerida && (
                                            <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs space-y-1">
                                                <span className="text-[10px] font-black text-emerald-800 uppercase block flex items-center gap-1">
                                                    <ShieldCheck size={13} />
                                                    Contra-argumento / Respuesta Sugerida:
                                                </span>
                                                <p className="text-emerald-950 font-medium">{c.respuesta_sugerida}</p>
                                            </div>
                                        )}

                                        {/* Botones de Gestión */}
                                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
                                            <span className="text-[11px] text-gray-400">
                                                Responsable: <strong>{c.responsable_respuesta || 'Equipo de Prensa'}</strong>
                                            </span>

                                            <div className="flex items-center gap-2">
                                                {c.estado_gestion !== 'en_respuesta' && (
                                                    <button
                                                        onClick={() => handleUpdateCommentStatus(c.id, 'en_respuesta')}
                                                        className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold uppercase text-[10px]"
                                                    >
                                                        Tomar para Respuesta
                                                    </button>
                                                )}
                                                {c.estado_gestion !== 'neutralizado' && (
                                                    <button
                                                        onClick={() => handleUpdateCommentStatus(c.id, 'neutralizado')}
                                                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase text-[10px] shadow"
                                                    >
                                                        Marcar Neutralizado
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* PESTAÑA 4: RADAR DE CONTRINCANTES & OPOSICIÓN */}
            {/* ========================================================= */}
            {activeTab === 'oposicion' && (
                <CompetitorWarRoom
                    competitors={competitors}
                    activeCampaign={activeCampaign}
                    authHeaders={authHeaders}
                    API={API}
                    onRefreshData={fetchAllData}
                />
            )}

            {/* ========================================================= */}
            {/* MODAL 1: REGISTRAR PUBLICACIÓN / POST */}
            {/* ========================================================= */}
            {modalPostOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
                        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Radio size={20} className="text-[#00B894]" />
                                <h3 className="font-black text-base uppercase">Monitorear Publicación en Redes</h3>
                            </div>
                            <button onClick={() => setModalPostOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePost} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                    <label className="block text-gray-600 font-bold mb-1 uppercase">Plataforma *</label>
                                    <select
                                        value={postForm.plataforma}
                                        onChange={e => setPostForm(prev => ({ ...prev, plataforma: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    >
                                        <option value="instagram">Instagram</option>
                                        <option value="tiktok">TikTok</option>
                                        <option value="twitter">X (Twitter)</option>
                                        <option value="facebook">Facebook</option>
                                        <option value="youtube">YouTube</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-600 font-bold mb-1 uppercase">Tema Estratégico</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Salud, Juventud, Seguridad..."
                                        value={postForm.tema_estrategico}
                                        onChange={e => setPostForm(prev => ({ ...prev, tema_estrategico: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-gray-600 font-bold mb-1 uppercase">Título de la Publicación *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej. Diálogo Comunitario en Vivo"
                                        value={postForm.titulo}
                                        onChange={e => setPostForm(prev => ({ ...prev, titulo: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-gray-600 font-bold mb-1 uppercase">Texto / Contenido</label>
                                    <textarea
                                        rows={2}
                                        value={postForm.contenido}
                                        onChange={e => setPostForm(prev => ({ ...prev, contenido: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                                        placeholder="Copia el copy del post..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-600 font-bold mb-1 uppercase">Alcance Estimado</label>
                                    <input
                                        type="number"
                                        value={postForm.alcance}
                                        onChange={e => setPostForm(prev => ({ ...prev, alcance: parseInt(e.target.value, 10) || 0 }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-600 font-bold mb-1 uppercase">Interacciones (Likes + Shares)</label>
                                    <input
                                        type="number"
                                        value={postForm.interacciones}
                                        onChange={e => setPostForm(prev => ({ ...prev, interacciones: parseInt(e.target.value, 10) || 0 }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    />
                                </div>

                                <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                                    <input
                                        type="checkbox"
                                        id="check-envivo"
                                        checked={postForm.en_vivo}
                                        onChange={e => setPostForm(prev => ({ ...prev, en_vivo: e.target.checked }))}
                                        className="w-4 h-4 text-emerald-600 rounded"
                                    />
                                    <label htmlFor="check-envivo" className="text-xs font-bold text-slate-800">
                                        ¿Está transmitiendo en vivo actualmente? (Live Stream)
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <button type="button" onClick={() => setModalPostOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-500 uppercase">
                                    Cancelar
                                </button>
                                <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase shadow">
                                    Guardar Publicación
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL 2: REGISTRAR CUENTA DEL EQUIPO */}
            {/* ========================================================= */}
            {modalTeamOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-slate-900 to-purple-950 p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users size={20} className="text-purple-400" />
                                <h3 className="font-black text-base uppercase">Registrar Cuenta del Equipo</h3>
                            </div>
                            <button onClick={() => setModalTeamOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTeam} className="p-6 space-y-3 text-xs">
                            {/* Selector de base de datos oficial del equipo */}
                            <div className="bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100">
                                <label className="block text-indigo-900 font-bold mb-1 uppercase flex items-center gap-1.5">
                                    <Users size={13} className="text-indigo-600" />
                                    <span>Vincular con Miembro de la Base de Datos (Opcional)</span>
                                </label>
                                <select
                                    onChange={e => {
                                        const uid = parseInt(e.target.value, 10);
                                        if (!uid) return;
                                        const u = teamUsers.find(tu => tu.id === uid);
                                        if (u) {
                                            const roleMap = {
                                                candidato: 'Candidato Oficial',
                                                orador: 'Orador',
                                                lider_avanzada: 'Líder Avanzada',
                                                lider: 'Activista Digital',
                                                apoyo_bd: 'Activista Digital'
                                            };
                                            const cleanHandle = '@' + u.nombre.toLowerCase().replace(/[^a-z0-9]/g, '_');
                                            setTeamForm(prev => ({
                                                ...prev,
                                                nombre_miembro: u.nombre,
                                                rol_equipo: roleMap[u.role] || 'Activista Digital',
                                                usuario_handle: cleanHandle,
                                                observaciones: `Miembro registrado oficial: ${u.email} (${u.telefono || 'Sin teléfono'})`
                                            }));
                                        }
                                    }}
                                    className="w-full bg-white border border-indigo-200 text-indigo-950 rounded-xl p-2 font-bold cursor-pointer"
                                >
                                    <option value="">-- Seleccionar de la base de datos de la campaña --</option>
                                    {teamUsers.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.nombre} • Rol: {u.role} ({u.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-600 font-bold mb-1 uppercase">Nombre del Miembro *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej. Carlos Restrepo"
                                    value={teamForm.nombre_miembro}
                                    onChange={e => setTeamForm(prev => ({ ...prev, nombre_miembro: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-gray-600 font-bold mb-1 uppercase">Rol en Campaña</label>
                                    <select
                                        value={teamForm.rol_equipo}
                                        onChange={e => setTeamForm(prev => ({ ...prev, rol_equipo: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    >
                                        <option value="Candidato Oficial">Candidato Oficial</option>
                                        <option value="Orador">Orador</option>
                                        <option value="Líder Avanzada">Líder Avanzada</option>
                                        <option value="Activista Digital">Activista Digital</option>
                                        <option value="Influencer Aliado">Influencer Aliado</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-600 font-bold mb-1 uppercase">Plataforma</label>
                                    <select
                                        value={teamForm.plataforma}
                                        onChange={e => setTeamForm(prev => ({ ...prev, plataforma: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    >
                                        <option value="twitter">X (Twitter)</option>
                                        <option value="instagram">Instagram</option>
                                        <option value="tiktok">TikTok</option>
                                        <option value="facebook">Facebook</option>
                                        <option value="youtube">YouTube</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-600 font-bold mb-1 uppercase">Usuario / Handle *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="@usuario_oficial"
                                    value={teamForm.usuario_handle}
                                    onChange={e => setTeamForm(prev => ({ ...prev, usuario_handle: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-mono font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-600 font-bold mb-1 uppercase">Cantidad de Seguidores</label>
                                <input
                                    type="number"
                                    value={teamForm.seguidores}
                                    onChange={e => setTeamForm(prev => ({ ...prev, seguidores: parseInt(e.target.value, 10) || 0 }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <button type="button" onClick={() => setModalTeamOpen(false)} className="px-4 py-2 font-bold text-gray-500 uppercase">
                                    Cancelar
                                </button>
                                <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold uppercase shadow">
                                    Registrar Cuenta
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL 3: REGISTRAR COMENTARIO NEGATIVO / ALERTA */}
            {/* ========================================================= */}
            {modalCommentOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-rose-950 to-slate-900 p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={20} className="text-rose-400" />
                                <h3 className="font-black text-base uppercase">Reportar Ataque o Comentario Negativo</h3>
                            </div>
                            <button onClick={() => setModalCommentOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateComment} className="p-6 space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-gray-600 font-bold mb-1 uppercase">Plataforma</label>
                                    <select
                                        value={commentForm.plataforma}
                                        onChange={e => setCommentForm(prev => ({ ...prev, plataforma: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    >
                                        <option value="twitter">X (Twitter)</option>
                                        <option value="facebook">Facebook</option>
                                        <option value="instagram">Instagram</option>
                                        <option value="tiktok">TikTok</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-600 font-bold mb-1 uppercase">Nivel de Riesgo *</label>
                                    <select
                                        value={commentForm.nivel_riesgo}
                                        onChange={e => setCommentForm(prev => ({ ...prev, nivel_riesgo: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    >
                                        <option value="bajo">Bajo (Crítica menor)</option>
                                        <option value="medio">Medio (Cuestionamiento)</option>
                                        <option value="alto">Alto (Ataque personal)</option>
                                        <option value="critico">Crítico (Fake News / Tendencia)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-600 font-bold mb-1 uppercase">Usuario que Comenta / Ataca *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="@cuenta_opositora"
                                    value={commentForm.usuario_comenta}
                                    onChange={e => setCommentForm(prev => ({ ...prev, usuario_comenta: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-mono font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-600 font-bold mb-1 uppercase">Texto del Comentario / Ataque *</label>
                                <textarea
                                    required
                                    rows={2}
                                    placeholder="Copia el mensaje o acusación..."
                                    value={commentForm.texto_comentario}
                                    onChange={e => setCommentForm(prev => ({ ...prev, texto_comentario: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-600 font-bold mb-1 uppercase">Contra-argumento / Respuesta Sugerida</label>
                                <textarea
                                    rows={2}
                                    placeholder="Argumentario con datos para desmentir el ataque..."
                                    value={commentForm.respuesta_sugerida}
                                    onChange={e => setCommentForm(prev => ({ ...prev, respuesta_sugerida: e.target.value }))}
                                    className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-emerald-950 font-medium"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <button type="button" onClick={() => setModalCommentOpen(false)} className="px-4 py-2 font-bold text-gray-500 uppercase">
                                    Cancelar
                                </button>
                                <button type="submit" className="px-5 py-2 bg-rose-700 text-white rounded-xl font-bold uppercase shadow">
                                    Registrar Alerta
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL 4: REGISTRAR CONTRINCANTE / OPOSICIÓN */}
            {/* ========================================================= */}
            {modalCompetitorOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-slate-900 to-amber-950 p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Swords size={20} className="text-amber-400" />
                                <h3 className="font-black text-base uppercase">Registrar Contrincante Opositor</h3>
                            </div>
                            <button onClick={() => setModalCompetitorOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCompetitor} className="p-6 space-y-3 text-xs">
                            <div>
                                <label className="block text-gray-600 font-bold mb-1 uppercase">Nombre del Candidato Rival *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej. Candidato Oposición"
                                    value={competitorForm.nombre_candidato}
                                    onChange={e => setCompetitorForm(prev => ({ ...prev, nombre_candidato: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-gray-600 font-bold mb-1 uppercase">Partido / Movimiento</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Partido Tradicional"
                                        value={competitorForm.partido_movimiento}
                                        onChange={e => setCompetitorForm(prev => ({ ...prev, partido_movimiento: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-600 font-bold mb-1 uppercase">Nivel de Amenaza</label>
                                    <select
                                        value={competitorForm.nivel_amenaza}
                                        onChange={e => setCompetitorForm(prev => ({ ...prev, nivel_amenaza: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    >
                                        <option value="bajo">Bajo</option>
                                        <option value="medio">Medio</option>
                                        <option value="alto">Alto</option>
                                        <option value="muy_alto">Muy Alto</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-600 font-bold mb-1 uppercase">Narrativa Principal / Eje de Ataque *</label>
                                <textarea
                                    required
                                    rows={2}
                                    placeholder="¿Qué discurso están moviendo contra nosotros?"
                                    value={competitorForm.narrativa_principal}
                                    onChange={e => setCompetitorForm(prev => ({ ...prev, narrativa_principal: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-600 font-bold mb-1 uppercase">Contra-Estrategia Sugerida</label>
                                <textarea
                                    rows={2}
                                    placeholder="Táctica para desarmar su discurso en territorio y medios..."
                                    value={competitorForm.contra_estrategia_sugerida}
                                    onChange={e => setCompetitorForm(prev => ({ ...prev, contra_estrategia_sugerida: e.target.value }))}
                                    className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-emerald-950 font-medium"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <button type="button" onClick={() => setModalCompetitorOpen(false)} className="px-4 py-2 font-bold text-gray-500 uppercase">
                                    Cancelar
                                </button>
                                <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold uppercase shadow">
                                    Guardar Contrincante
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL 5: AUDITORÍA DE APOYO DEL EQUIPO (REACCIONES, COMENTARIOS Y COMPARTIDOS) */}
            {/* ========================================================= */}
            {modalAuditOpen && selectedPostForAudit && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-4xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
                        {/* Header del Modal */}
                        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 p-6 text-white flex items-start justify-between">
                            <div className="space-y-1 pr-4">
                                <div className="flex items-center gap-2">
                                    <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                        <Users size={22} />
                                    </span>
                                    <div>
                                        <h3 className="font-black text-lg uppercase tracking-wide">
                                            Auditoría de Apoyo del Equipo
                                        </h3>
                                        <p className="text-xs text-indigo-200">
                                            Seguimiento a las reacciones, comentarios oficiales y réplicas de los miembros de campaña
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${PLATAFORMAS_INFO[selectedPostForAudit.plataforma]?.color || 'bg-gray-800 text-white'}`}>
                                            {PLATAFORMAS_INFO[selectedPostForAudit.plataforma]?.label || selectedPostForAudit.plataforma}
                                        </span>
                                        <span className="font-bold text-white line-clamp-1 max-w-md">
                                            {selectedPostForAudit.titulo}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-indigo-200">
                                        {selectedPostForAudit.fecha_publicacion}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => setModalAuditOpen(false)}
                                className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* Contenido en 2 columnas: Lista detallada & Registro rápido */}
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[75vh] overflow-y-auto">
                            {/* Columna Izquierda (7 cols): Listado de Miembros del Equipo e Interacciones */}
                            <div className="lg:col-span-7 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-black text-sm uppercase text-slate-900 flex items-center gap-2">
                                            <span>Miembros Identificados</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                                                {selectedPostForAudit.team_interactions?.length || 0} registrados
                                            </span>
                                        </h4>
                                        <p className="text-[11px] text-gray-500">
                                            Cruce directo con la base de datos oficial de la campaña
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-[10px] font-bold">
                                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                                            🔄 {selectedPostForAudit.team_shares || 0} compartieron
                                        </span>
                                        <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200">
                                            💬 {selectedPostForAudit.team_comments || 0} comentaron
                                        </span>
                                    </div>
                                </div>

                                {/* Lista de Interacciones */}
                                {(!selectedPostForAudit.team_interactions || selectedPostForAudit.team_interactions.length === 0) ? (
                                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center">
                                        <Users size={32} className="mx-auto text-gray-300 mb-2" />
                                        <p className="font-bold text-gray-600 text-xs">Aún no hay interacciones registradas del equipo para esta publicación</p>
                                        <p className="text-[11px] text-gray-400 mt-1">Utiliza el formulario de la derecha para registrar la reacción, comentario o compartido de un miembro.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedPostForAudit.team_interactions.map(it => {
                                            const reactionEmoji =
                                                it.tipo_reaccion === 'me_encanta' ? '❤️' :
                                                it.tipo_reaccion === 'apoyo' ? '🔥' :
                                                it.tipo_reaccion === 'like' ? '👍' :
                                                it.tipo_reaccion === 'aplausos' ? '👏' : '⚪';

                                            return (
                                                <div
                                                    key={it.id}
                                                    className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm hover:shadow-md transition-shadow space-y-3"
                                                >
                                                    {/* Cabecera de Participación del Equipo (Sin nombres personales ni perfiles de redes) */}
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex items-center justify-center shadow-xs text-lg font-bold">
                                                                {reactionEmoji}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="font-black text-slate-900 text-xs">
                                                                        Participación: {it.rol_equipo || 'Equipo de Campaña'}
                                                                    </span>
                                                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200">
                                                                        Equipo Oficial
                                                                    </span>
                                                                </div>
                                                                <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                                                    Trazabilidad Confirmada • Red: {PLATAFORMAS_INFO[it.plataforma]?.label || it.plataforma}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Botón eliminar interacción */}
                                                        <button
                                                            onClick={() => handleDeleteInteraction(it.id)}
                                                            className="text-gray-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                                            title="Eliminar registro"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>

                                                    {/* Estado de Reacción y Compartido */}
                                                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                                                        {/* Reacción */}
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-bold border border-slate-200">
                                                            <span className="text-sm">{reactionEmoji}</span>
                                                            <span className="capitalize">{it.tipo_reaccion?.replace('_', ' ') || 'Me gusta'}</span>
                                                        </span>

                                                        {/* ¿Compartió? */}
                                                        <button
                                                            onClick={() => handleToggleShare(it)}
                                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold border transition-colors cursor-pointer ${
                                                                it.compartio
                                                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                                                    : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                                            }`}
                                                            title="Clic para cambiar estado de compartido"
                                                        >
                                                            <Repeat size={13} className={it.compartio ? 'text-emerald-600' : 'text-amber-600'} />
                                                            <span>{it.compartio ? '✅ SÍ Compartió' : '⚠️ NO ha compartido'}</span>
                                                        </button>

                                                        {/* URL si compartió */}
                                                        {it.compartio && it.url_compartido && (
                                                            <a
                                                                href={it.url_compartido}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-[10px] text-cyan-700 hover:underline font-bold"
                                                            >
                                                                <ExternalLink size={11} />
                                                                <span>Ver Repost</span>
                                                            </a>
                                                        )}
                                                    </div>

                                                    {/* Comentario del Miembro */}
                                                    <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                                            💬 Comentario Realizado por el Miembro:
                                                        </span>
                                                        {it.comento && it.texto_comentario ? (
                                                            <p className="text-xs text-slate-800 italic font-medium leading-relaxed bg-white p-2.5 rounded-lg border border-gray-200/60 shadow-2xs">
                                                                "{it.texto_comentario}"
                                                            </p>
                                                        ) : (
                                                            <p className="text-[11px] text-gray-400 italic">
                                                                Sin comentario público registrado en esta publicación.
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Columna Derecha (5 cols): Formulario de Registro / Auditoría */}
                            <div className="lg:col-span-5 bg-gradient-to-b from-indigo-50/70 to-purple-50/50 p-5 rounded-3xl border border-indigo-100 space-y-4">
                                <div>
                                    <h4 className="font-black text-sm uppercase text-indigo-950 flex items-center gap-2">
                                        <Plus size={16} className="text-indigo-600" />
                                        <span>Registrar / Auditar Miembro</span>
                                    </h4>
                                    <p className="text-[11px] text-indigo-800/80">
                                        Selecciona al integrante en la base de datos y audita su apoyo a esta publicación.
                                    </p>
                                </div>

                                <form onSubmit={handleSaveInteraction} className="space-y-3 text-xs">
                                    {/* Selector de Miembro de la Base de Datos */}
                                    <div>
                                        <label className="block text-indigo-900 font-bold mb-1 uppercase flex items-center gap-1">
                                            <Users size={12} />
                                            <span>Miembro del Equipo (BD Oficial) *</span>
                                        </label>
                                        <select
                                            required
                                            value={auditForm.user_id || ''}
                                            onChange={e => {
                                                const uid = parseInt(e.target.value, 10);
                                                const u = teamUsers.find(tu => tu.id === uid);
                                                if (u) {
                                                    const roleFormatted =
                                                        u.role === 'candidato' ? 'Candidato Oficial'
                                                        : u.role === 'orador' ? 'Orador y Vocero'
                                                        : u.role === 'lider_avanzada' ? 'Coordinadora de Avanzada'
                                                        : u.role === 'lider' ? 'Líder Territorial'
                                                        : 'Equipo de Campaña';
                                                    setAuditForm(prev => ({
                                                        ...prev,
                                                        user_id: u.id,
                                                        nombre_miembro: u.nombre,
                                                        rol_equipo: roleFormatted,
                                                        usuario_handle: '@' + (u.nombre ? u.nombre.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'equipo')
                                                    }));
                                                }
                                            }}
                                            className="w-full bg-white border border-indigo-200 rounded-xl p-2.5 font-bold text-slate-800 cursor-pointer shadow-2xs"
                                        >
                                            <option value="">-- Seleccionar de la Base de Datos --</option>
                                            {teamUsers.map(u => (
                                                <option key={u.id} value={u.id}>
                                                    {u.nombre} ({u.role}) - {u.email}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Rol / Segmento del Equipo */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-gray-600 font-bold mb-1 uppercase">Segmento / Participación *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Ej. Avanzada Territorial"
                                                value={auditForm.rol_equipo}
                                                onChange={e => setAuditForm(prev => ({
                                                    ...prev,
                                                    rol_equipo: e.target.value,
                                                    nombre_miembro: `Integrante de ${e.target.value || 'Equipo'}`
                                                }))}
                                                className="w-full bg-white border border-gray-200 rounded-xl p-2 font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-600 font-bold mb-1 uppercase">Nivel en Campaña</label>
                                            <select
                                                value={auditForm.rol_equipo}
                                                onChange={e => setAuditForm(prev => ({
                                                    ...prev,
                                                    rol_equipo: e.target.value,
                                                    nombre_miembro: `Integrante de ${e.target.value}`
                                                }))}
                                                className="w-full bg-white border border-gray-200 rounded-xl p-2 font-bold"
                                            >
                                                <option value="Avanzada Territorial">Avanzada Territorial</option>
                                                <option value="Activismo Digital">Activismo Digital</option>
                                                <option value="Orador y Vocería">Orador y Vocería</option>
                                                <option value="Equipo de Prensa">Equipo de Prensa</option>
                                                <option value="Liderazgo Comunal">Liderazgo Comunal</option>
                                                <option value="Juventudes en Red">Juventudes en Red</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Reacción Elegida */}
                                    <div>
                                        <label className="block text-gray-700 font-bold mb-1.5 uppercase">Reacción del Miembro</label>
                                        <div className="grid grid-cols-4 gap-1.5">
                                            {[
                                                { id: 'me_encanta', emoji: '❤️', label: 'Encanta' },
                                                { id: 'apoyo',      emoji: '🔥', label: 'Apoyo' },
                                                { id: 'like',       emoji: '👍', label: 'Like' },
                                                { id: 'aplausos',   emoji: '👏', label: 'Aplausos' }
                                            ].map(r => (
                                                <button
                                                    type="button"
                                                    key={r.id}
                                                    onClick={() => setAuditForm(prev => ({ ...prev, tipo_reaccion: r.id }))}
                                                    className={`py-2 px-1 rounded-xl text-center border font-bold transition-all ${
                                                        auditForm.tipo_reaccion === r.id
                                                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                                                            : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <span className="text-base block">{r.emoji}</span>
                                                    <span className="text-[10px] block mt-0.5">{r.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Checkbox de Compartido */}
                                    <div className="bg-white p-3 rounded-2xl border border-gray-200 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="chk-audit-share" className="font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                                                <Repeat size={14} className={auditForm.compartio ? 'text-emerald-600' : 'text-gray-400'} />
                                                <span>¿Compartió / Reposteó la Publicación?</span>
                                            </label>
                                            <input
                                                type="checkbox"
                                                id="chk-audit-share"
                                                checked={auditForm.compartio}
                                                onChange={e => setAuditForm(prev => ({ ...prev, compartio: e.target.checked }))}
                                                className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                                            />
                                        </div>
                                        {auditForm.compartio && (
                                            <input
                                                type="url"
                                                placeholder="Enlace o nota del repost (Opcional)"
                                                value={auditForm.url_compartido}
                                                onChange={e => setAuditForm(prev => ({ ...prev, url_compartido: e.target.value }))}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-[11px]"
                                            />
                                        )}
                                    </div>

                                    {/* Checkbox y Texto de Comentario */}
                                    <div className="bg-white p-3 rounded-2xl border border-gray-200 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="chk-audit-comment" className="font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                                                <MessageSquare size={14} className={auditForm.comento ? 'text-purple-600' : 'text-gray-400'} />
                                                <span>¿Dejó un Comentario de Apoyo?</span>
                                            </label>
                                            <input
                                                type="checkbox"
                                                id="chk-audit-comment"
                                                checked={auditForm.comento}
                                                onChange={e => setAuditForm(prev => ({ ...prev, comento: e.target.checked }))}
                                                className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                                            />
                                        </div>
                                        {auditForm.comento && (
                                            <div>
                                                <textarea
                                                    rows={2}
                                                    required={auditForm.comento}
                                                    placeholder="Escribe exactamente qué comentó el miembro del equipo..."
                                                    value={auditForm.texto_comentario}
                                                    onChange={e => setAuditForm(prev => ({ ...prev, texto_comentario: e.target.value }))}
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-[11px] leading-snug"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Botón Guardar */}
                                    <button
                                        type="submit"
                                        className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <CheckCircle size={16} />
                                        <span>Guardar Interacción del Equipo</span>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL 6: CONFIGURAR ENLACES OFICIALES DE REDES DEL CANDIDATO */}
            {/* ========================================================= */}
            {modalEditLinksOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Share2 size={20} className="text-[#00B894]" />
                                <div>
                                    <h3 className="font-black text-base uppercase">Enlaces Oficiales de Redes Sociales</h3>
                                    <p className="text-xs text-gray-300">Configura los perfiles oficiales de la campaña y candidato</p>
                                </div>
                            </div>
                            <button onClick={() => setModalEditLinksOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveSocialLinks} className="p-6 space-y-3 text-xs">
                            <div>
                                <label className="block text-gray-600 font-bold mb-1 uppercase flex items-center gap-1.5">
                                    <span>📸</span>
                                    <span>Instagram Oficial</span>
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://instagram.com/usuario_candidato"
                                    value={socialLinksForm.link_instagram}
                                    onChange={e => setSocialLinksForm(prev => ({ ...prev, link_instagram: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-600 font-bold mb-1 uppercase flex items-center gap-1.5">
                                    <span>🎵</span>
                                    <span>TikTok Oficial</span>
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://tiktok.com/@campana_candidato"
                                    value={socialLinksForm.link_tiktok}
                                    onChange={e => setSocialLinksForm(prev => ({ ...prev, link_tiktok: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-600 font-bold mb-1 uppercase flex items-center gap-1.5">
                                    <span>📘</span>
                                    <span>Facebook Oficial</span>
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://facebook.com/candidato.oficial"
                                    value={socialLinksForm.link_facebook}
                                    onChange={e => setSocialLinksForm(prev => ({ ...prev, link_facebook: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-600 font-bold mb-1 uppercase flex items-center gap-1.5">
                                    <span>🐦</span>
                                    <span>X (Twitter) Oficial</span>
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://x.com/candidato_col"
                                    value={socialLinksForm.link_twitter}
                                    onChange={e => setSocialLinksForm(prev => ({ ...prev, link_twitter: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-600 font-bold mb-1 uppercase flex items-center gap-1.5">
                                    <span>▶️</span>
                                    <span>YouTube Oficial</span>
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://youtube.com/@candidato_canal"
                                    value={socialLinksForm.link_youtube}
                                    onChange={e => setSocialLinksForm(prev => ({ ...prev, link_youtube: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-600 font-bold mb-1 uppercase flex items-center gap-1.5">
                                    <span>💬</span>
                                    <span>Canal Oficial de WhatsApp</span>
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://whatsapp.com/channel/..."
                                    value={socialLinksForm.link_whatsapp}
                                    onChange={e => setSocialLinksForm(prev => ({ ...prev, link_whatsapp: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setModalEditLinksOpen(false)}
                                    className="px-4 py-2 font-bold text-gray-500 uppercase cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingAndSyncingLinks}
                                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white rounded-xl font-black uppercase text-xs shadow-lg cursor-pointer flex items-center gap-2 hover:opacity-95 disabled:opacity-50"
                                >
                                    {savingAndSyncingLinks ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                                    <span>{savingAndSyncingLinks ? 'Sincronizando y Extrayendo Todo...' : '💾 Guardar y Sincronizar Todo'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL 7: ASESOR VIRTUAL DE VIRALIDAD • ESTRATEGA DIGITAL IA */}
            {/* ========================================================= */}
            {modalAdvisorOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="bg-slate-950 text-white rounded-3xl shadow-2xl border border-purple-500/30 w-full max-w-4xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
                        {/* Header del Asesor */}
                        <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 p-6 border-b border-purple-500/20 flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-purple-500/30 flex items-center justify-center">
                                    <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                                        <Bot size={24} className="text-cyan-400 animate-pulse" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-black text-lg uppercase tracking-wider text-white">
                                            Asesor Virtual de Viralidad
                                        </h3>
                                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                                            <Sparkles size={11} className="text-purple-300" />
                                            IA de Campaña 2026
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-300 mt-0.5">
                                        Estrategia de amplificación orgánica, hackeo al algoritmo y retención de audiencia para ganar elecciones.
                                    </p>
                                    {advisorAnalysis?.titulo && (
                                        <p className="text-[11px] text-cyan-300 font-bold mt-1 line-clamp-1">
                                            🎯 Analizando: <span className="text-white">{advisorAnalysis.titulo}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => setModalAdvisorOpen(false)}
                                className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Pestañas del Asesor */}
                        <div className="flex items-center gap-1 p-2 bg-slate-900 border-b border-slate-800 overflow-x-auto text-xs font-bold">
                            {[
                                { id: 'score', label: '📊 Diagnóstico & Score', badge: `${advisorAnalysis?.viral_score || 88}%` },
                                { id: 'ganchos', label: '🎣 Ganchos de 3 Seg', badge: '3 Hooks' },
                                { id: 'protocolo', label: '⏱️ Primeros 30 Min', badge: 'Algoritmo' },
                                { id: 'whatsapp', label: '📲 Cadenas WhatsApp', badge: 'Listo' },
                                { id: 'chat', label: '💬 Consultar al Asesor IA', badge: 'En Vivo' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setAdvisorActiveTab(tab.id)}
                                    className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                                        advisorActiveTab === tab.id
                                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                                            : 'text-gray-400 hover:text-white hover:bg-slate-800/60'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/30 font-mono">
                                        {tab.badge}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Cuerpo del Modal */}
                        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-6 text-xs">
                            {advisorLoading ? (
                                <div className="py-16 text-center space-y-3">
                                    <Bot size={40} className="mx-auto text-purple-400 animate-bounce" />
                                    <p className="font-bold text-sm text-purple-200">
                                        El Asesor Virtual está analizando el algoritmo y generando la estrategia viral...
                                    </p>
                                    <p className="text-gray-400 text-xs">Evaluando ganchos, emoción, retención y llamados a la acción.</p>
                                </div>
                            ) : (
                                <>
                                    {/* ================================================= */}
                                    {/* TAB 1: DIAGNÓSTICO & VIRAL SCORE */}
                                    {/* ================================================= */}
                                    {advisorActiveTab === 'score' && (
                                        <div className="space-y-5">
                                            {/* Puntuación Principal */}
                                            <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/30 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-5">
                                                <div className="space-y-2 text-center sm:text-left">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded-full border border-purple-500/30">
                                                        Índice de Viralidad Estimada
                                                    </span>
                                                    <h4 className="text-xl font-black text-white">
                                                        Potencial de Distribución Orgánica
                                                    </h4>
                                                    <p className="text-gray-300 text-xs max-w-lg leading-relaxed">
                                                        {advisorAnalysis?.diagnostico || 'Publicación con alto potencial si se activan las interacciones del equipo en los primeros 18 minutos.'}
                                                    </p>
                                                </div>

                                                <div className="flex flex-col items-center justify-center bg-slate-950/80 border border-purple-500/40 w-32 h-32 rounded-3xl p-3 shadow-xl shrink-0">
                                                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                                                        {advisorAnalysis?.viral_score || 88}%
                                                    </span>
                                                    <span className="text-[9px] uppercase font-bold text-gray-400 mt-1 text-center leading-tight">
                                                        Viral Score IA
                                                    </span>
                                                    <span className="text-[8px] font-bold text-emerald-400 mt-1">
                                                        Recomendado
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Recomendaciones Técnicas de Formato */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
                                                    <span className="text-[10px] font-black text-purple-400 uppercase block">🎬 Formato Visual</span>
                                                    <p className="text-gray-300 text-[11px] leading-snug">
                                                        {advisorAnalysis?.recomendacion_tecnica?.formato_visual || 'Video vertical 9:16 con subtítulos dinámicos de colores.'}
                                                    </p>
                                                </div>
                                                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
                                                    <span className="text-[10px] font-black text-cyan-400 uppercase block">🎵 Audio de Fondo</span>
                                                    <p className="text-gray-300 text-[11px] leading-snug">
                                                        {advisorAnalysis?.recomendacion_tecnica?.audio_tendencia || 'Audio rítmico en tendencia al 10% de volumen, voz al 90%.'}
                                                    </p>
                                                </div>
                                                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
                                                    <span className="text-[10px] font-black text-emerald-400 uppercase block">⏱️ Duración Ideal</span>
                                                    <p className="text-gray-300 text-[11px] leading-snug">
                                                        {advisorAnalysis?.recomendacion_tecnica?.duracion_ideal || '32 a 45 segundos (máxima retención).'}
                                                    </p>
                                                </div>
                                                <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
                                                    <span className="text-[10px] font-black text-amber-400 uppercase block">⏰ Horario de Oro</span>
                                                    <p className="text-gray-300 text-[11px] leading-snug">
                                                        {advisorAnalysis?.recomendacion_tecnica?.horario_oro || '12:30 PM o 07:45 PM.'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Hashtags Estratégicos */}
                                            {advisorAnalysis?.hashtags && (
                                                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-black uppercase text-gray-400 block">Hashtags Clasificados para este Post:</span>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {advisorAnalysis.hashtags.map((h, i) => (
                                                                <span key={i} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md font-mono text-[10px]">
                                                                    {h}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyHashtags(advisorAnalysis.hashtags)}
                                                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer shrink-0"
                                                    >
                                                        {copiedHashtags ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                                        <span>{copiedHashtags ? '¡Copiados!' : 'Copiar Hashtags'}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ================================================= */}
                                    {/* TAB 2: GANCHOS VIRALES DE 3 SEGUNDOS */}
                                    {/* ================================================= */}
                                    {advisorActiveTab === 'ganchos' && (
                                        <div className="space-y-4">
                                            <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
                                                <Lightbulb className="text-amber-400 shrink-0 mt-0.5" size={20} />
                                                <div className="space-y-1">
                                                    <h5 className="font-black text-amber-300 uppercase text-xs">
                                                        Regla de Oro de Retención Algorítmica:
                                                    </h5>
                                                    <p className="text-gray-300 text-[11px] leading-relaxed">
                                                        Nunca comiences diciendo <em>“Hola a todos, ¿cómo están? Hoy les quiero hablar de...”</em>. El 85% de los usuarios deslizan en 2 segundos. Comienza diciendo de inmediato una de las siguientes frases con mirada fija y segura a la cámara:
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                {advisorAnalysis?.ganchos_virales?.map((g, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="bg-slate-900 border border-purple-500/20 hover:border-purple-500/50 p-4 rounded-2xl transition-all space-y-2.5"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700/50">
                                                                Gancho #{idx + 1} • {g.tipo}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCopyHook(g.texto, idx)}
                                                                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                                            >
                                                                {copiedHookIdx === idx ? <Check size={12} className="text-emerald-300" /> : <Copy size={12} />}
                                                                <span>{copiedHookIdx === idx ? '¡Copiado!' : 'Copiar Gancho'}</span>
                                                            </button>
                                                        </div>

                                                        <p className="text-sm font-black text-white italic bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                                                            {g.texto}
                                                        </p>

                                                        <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                                                            <span className="text-purple-400 font-bold">Por qué funciona:</span>
                                                            <span>{g.explicacion}</span>
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* ================================================= */}
                                    {/* TAB 3: PROTOCOLO DE LOS PRIMEROS 30 MINUTOS */}
                                    {/* ================================================= */}
                                    {advisorActiveTab === 'protocolo' && (
                                        <div className="space-y-4">
                                            <div className="bg-indigo-950/50 border border-indigo-500/30 rounded-2xl p-4">
                                                <h5 className="font-black text-indigo-300 uppercase text-xs flex items-center gap-2">
                                                    <Clock size={16} />
                                                    <span>Cronograma de Activación para Engañar al Algoritmo</span>
                                                </h5>
                                                <p className="text-gray-300 text-[11px] mt-1">
                                                    Los algoritmos de TikTok, Instagram y X evalúan el ritmo de interacción en la primera media hora para decidir si el video se vuelve viral o muere en el feed:
                                                </p>
                                            </div>

                                            <div className="relative border-l-2 border-purple-500/30 ml-4 space-y-6 pl-5 py-2">
                                                {advisorAnalysis?.protocolo_30_minutos?.map((paso, idx) => (
                                                    <div key={idx} className="relative space-y-1">
                                                        <div className="absolute -left-[27px] top-0 w-4 h-4 rounded-full bg-purple-500 border-2 border-slate-950 shadow-md" />
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                                                                {paso.minuto}
                                                            </span>
                                                            <h6 className="font-black text-white text-xs uppercase">
                                                                {paso.accion}
                                                            </h6>
                                                        </div>
                                                        <p className="text-[11px] text-gray-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                                                            {paso.detalle}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* ================================================= */}
                                    {/* TAB 4: CADENAS DE WHATSAPP PARA REPLICACIÓN */}
                                    {/* ================================================= */}
                                    {advisorActiveTab === 'whatsapp' && (
                                        <div className="space-y-4">
                                            <p className="text-gray-300 text-xs">
                                                Mensajes persuasivos formateados con el <strong>Link Oficial del Candidato</strong> para enviar en grupos masivos de WhatsApp y atraer tráfico externo que catapulta el post:
                                            </p>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {/* Versión Jóvenes */}
                                                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between space-y-3">
                                                    <div className="space-y-2">
                                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                                                            ⚡ Jóvenes & Universitarios
                                                        </span>
                                                        <pre className="text-[11px] text-gray-300 whitespace-pre-wrap font-sans bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                                                            {advisorAnalysis?.copys_whatsapp?.jovenes}
                                                        </pre>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyWpCopy(advisorAnalysis?.copys_whatsapp?.jovenes, 'jovenes')}
                                                        className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow"
                                                    >
                                                        {copiedWpType === 'jovenes' ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                                                        <span>{copiedWpType === 'jovenes' ? '¡Copiado para WhatsApp!' : 'Copiar Mensaje'}</span>
                                                    </button>
                                                </div>

                                                {/* Versión Comunales */}
                                                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between space-y-3">
                                                    <div className="space-y-2">
                                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                                                            🏛️ Líderes Comunales & Veredas
                                                        </span>
                                                        <pre className="text-[11px] text-gray-300 whitespace-pre-wrap font-sans bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                                                            {advisorAnalysis?.copys_whatsapp?.lideres_comunales}
                                                        </pre>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyWpCopy(advisorAnalysis?.copys_whatsapp?.lideres_comunales, 'comunales')}
                                                        className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow"
                                                    >
                                                        {copiedWpType === 'comunales' ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                                                        <span>{copiedWpType === 'comunales' ? '¡Copiado para WhatsApp!' : 'Copiar Mensaje'}</span>
                                                    </button>
                                                </div>

                                                {/* Versión Activismo Rápido */}
                                                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between space-y-3">
                                                    <div className="space-y-2">
                                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                                                            🔥 Brigada Digital & Avanzada
                                                        </span>
                                                        <pre className="text-[11px] text-gray-300 whitespace-pre-wrap font-sans bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                                                            {advisorAnalysis?.copys_whatsapp?.activismo_rapido}
                                                        </pre>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyWpCopy(advisorAnalysis?.copys_whatsapp?.activismo_rapido, 'activismo')}
                                                        className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow"
                                                    >
                                                        {copiedWpType === 'activismo' ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                                                        <span>{copiedWpType === 'activismo' ? '¡Copiado para WhatsApp!' : 'Copiar Mensaje'}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ================================================= */}
                                    {/* TAB 5: CHAT CON EL ASESOR VIRTUAL */}
                                    {/* ================================================= */}
                                    {advisorActiveTab === 'chat' && (
                                        <div className="space-y-4">
                                            {/* Historial de Mensajes */}
                                            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 h-72 overflow-y-auto space-y-3">
                                                {advisorChatMessages.map((m, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                                    >
                                                        {m.sender === 'advisor' && (
                                                            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center shrink-0">
                                                                <Bot size={16} className="text-white" />
                                                            </div>
                                                        )}
                                                        <div
                                                            className={`p-3.5 rounded-2xl max-w-lg leading-relaxed text-xs ${
                                                                m.sender === 'user'
                                                                    ? 'bg-purple-600 text-white rounded-br-none'
                                                                    : 'bg-slate-950 text-gray-200 border border-slate-800 rounded-bl-none whitespace-pre-wrap'
                                                            }`}
                                                        >
                                                            {m.text}

                                                            {/* Sugerencias clicables si existen */}
                                                            {m.sugerencias && m.sugerencias.length > 0 && (
                                                                <div className="mt-2.5 pt-2 border-t border-slate-800 flex flex-wrap gap-1">
                                                                    {m.sugerencias.map((sug, sIdx) => (
                                                                        <button
                                                                            type="button"
                                                                            key={sIdx}
                                                                            onClick={() => handleSendAdvisorChat(sug)}
                                                                            className="text-[10px] px-2 py-0.5 bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 rounded-lg border border-purple-700/50 cursor-pointer transition-colors"
                                                                        >
                                                                            💡 {sug}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Preguntas Frecuentes Sugeridas */}
                                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                                                <span className="text-gray-400 font-bold shrink-0">Preguntar:</span>
                                                {[
                                                    '¿A qué hora exacta publicar hoy para viralizar?',
                                                    '¿Cómo neutralizar ataques de bodegas y trolls?',
                                                    '¿Cómo estructurar el video en los primeros 3 segundos?',
                                                    '¿Qué audio en tendencia usar?'
                                                ].map((p, idx) => (
                                                    <button
                                                        type="button"
                                                        key={idx}
                                                        onClick={() => handleSendAdvisorChat(p)}
                                                        className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-700 whitespace-nowrap cursor-pointer transition-colors"
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Input de Consulta */}
                                            <form
                                                onSubmit={e => {
                                                    e.preventDefault();
                                                    handleSendAdvisorChat();
                                                }}
                                                className="flex items-center gap-2"
                                            >
                                                <input
                                                    type="text"
                                                    placeholder="Hazle cualquier pregunta estratégica al Asesor Virtual..."
                                                    value={advisorChatInput}
                                                    onChange={e => setAdvisorChatInput(e.target.value)}
                                                    className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-gray-500 focus:outline-hidden focus:border-purple-500"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={!advisorChatInput.trim()}
                                                    className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-2xl font-bold uppercase text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all shrink-0"
                                                >
                                                    <Send size={14} />
                                                    <span>Consultar</span>
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL 8: CONECTAR NUEVA TRANSMISIÓN EN VIVO */}
            {/* ========================================================= */}
            {modalNewLiveOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Radio size={20} className="animate-pulse" />
                                <div>
                                    <h3 className="font-black text-base uppercase">Conectar Transmisión En Vivo</h3>
                                    <p className="text-xs text-rose-100">Monitorear live stream en tiempo real</p>
                                </div>
                            </div>
                            <button onClick={() => setModalNewLiveOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateLive} className="p-6 space-y-3 text-xs">
                            <div>
                                <label className="block text-gray-700 font-bold mb-1 uppercase">Plataforma *</label>
                                <select
                                    value={newLiveForm.plataforma}
                                    onChange={e => setNewLiveForm(prev => ({ ...prev, plataforma: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                >
                                    <option value="tiktok">TikTok Live</option>
                                    <option value="instagram">Instagram Live</option>
                                    <option value="facebook">Facebook Live</option>
                                    <option value="youtube">YouTube Live</option>
                                    <option value="twitter">X (Twitter) Spaces / Live</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-bold mb-1 uppercase">Título de la Transmisión *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej. Diálogo con la Comuna 4 y Jóvenes"
                                    value={newLiveForm.titulo}
                                    onChange={e => setNewLiveForm(prev => ({ ...prev, titulo: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-bold mb-1 uppercase">URL / Link del En Vivo *</label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://tiktok.com/@campana/live"
                                    value={newLiveForm.url_publicacion}
                                    onChange={e => setNewLiveForm(prev => ({ ...prev, url_publicacion: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-mono"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-gray-700 font-bold mb-1 uppercase">Tema Estratégico</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Seguridad y Empleo"
                                        value={newLiveForm.tema_estrategico}
                                        onChange={e => setNewLiveForm(prev => ({ ...prev, tema_estrategico: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-bold mb-1 uppercase">Espectadores Iniciales</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={newLiveForm.espectadores_en_vivo}
                                        onChange={e => setNewLiveForm(prev => ({ ...prev, espectadores_en_vivo: Number(e.target.value) }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setModalNewLiveOpen(false)}
                                    className="px-4 py-2 font-bold text-gray-500 uppercase cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold uppercase shadow cursor-pointer"
                                >
                                    🔴 Iniciar Monitoreo Live
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Carga de Base de Datos del Equipo (Excel / CSV) */}
            <TeamDatabaseUploadModal
                isOpen={modalTeamUploadOpen}
                onClose={() => setModalTeamUploadOpen(false)}
                campanaId={activeCampaign?.id || 1}
                onImportSuccess={async () => {
                    await fetchAllData();
                }}
            />

            {/* Modal de Comentarios y Reacciones con Identificación de Integrantes al lado */}
            <PostCommentsModal
                isOpen={modalCommentsOpen}
                onClose={() => {
                    setModalCommentsOpen(false);
                    setSelectedPostForComments(null);
                }}
                post={selectedPostForComments}
                campanaId={activeCampaign?.id || 1}
                onOpenTeamUpload={() => setModalTeamUploadOpen(true)}
            />
        </div>
    );
}
