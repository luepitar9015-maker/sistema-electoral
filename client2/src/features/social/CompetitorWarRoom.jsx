import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Swords, ShieldAlert, AlertTriangle, Eye, MessageSquare, Repeat,
    Heart, ExternalLink, Plus, Sparkles, Filter, Search, CheckCircle,
    Bot, RefreshCw, Trash2, ArrowRight, ShieldCheck, FileText,
    TrendingDown, Zap, Globe, Share2, Layers, Check, ChevronDown, ChevronUp, Copy
} from 'lucide-react';

const BLANCOS_INFO = {
    candidato: { label: 'Al Candidato (Personal)', icon: '👤', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    partido: { label: 'Al Partido Político', icon: '🏛️', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    alcalde: { label: 'Gestión como Alcalde', icon: '🏢', bg: 'bg-amber-50 text-amber-800 border-amber-300' },
    gobernador: { label: 'Gestión como Gobernador', icon: '🏛️', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
    concejal: { label: 'Desempeño Concejal', icon: '🏙️', bg: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
    senador: { label: 'Gestión como Senador', icon: '⚖️', bg: 'bg-purple-50 text-purple-800 border-purple-200' },
    congresista: { label: 'Gestión Congresista', icon: '📜', bg: 'bg-blue-50 text-blue-800 border-blue-200' },
    gestion_institucional: { label: 'Gestión Institucional / Obras', icon: '🏗️', bg: 'bg-orange-50 text-orange-800 border-orange-200' },
    familia_personal: { label: 'Esfera Privada / Familia', icon: '🛡️', bg: 'bg-red-50 text-red-800 border-red-300' },
    equipo_campana: { label: 'Equipo de Campaña', icon: '👥', bg: 'bg-slate-50 text-slate-700 border-slate-200' }
};

const TACTICAS_INFO = {
    ignorar: { label: 'Silencio Estratégico (Ignorar)', desc: 'No darle aire ni audiencia al rival. Ataque menor sin impacto.', bg: 'bg-gray-100 text-gray-800 border-gray-300' },
    desmentir: { label: 'Desmentir con Datos (Fact-Checking)', desc: 'Publicar boletín o infografía con cifras oficiales verificables.', bg: 'bg-blue-100 text-blue-900 border-blue-300' },
    redireccionar: { label: 'Redirección (Judo Político)', desc: 'Aprovechar la fuerza del ataque para mostrar obras y propuestas.', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    contraatacar: { label: 'Contraataque Estratégico', desc: 'Exponer la contradicción, pasado o hipocresía del atacante.', bg: 'bg-red-100 text-red-900 border-red-300' },
    tropa_digital: { label: 'Activación Tropa Digital', desc: 'Contener y desvirtuar en comentarios sin desgastar la vocería del candidato.', bg: 'bg-purple-100 text-purple-900 border-purple-300' }
};

export default function CompetitorWarRoom({ competitors = [], activeCampaign, authHeaders, API, onRefreshData }) {
    const [subTab, setSubTab] = useState('ataques'); // 'ataques' | 'adversarios' | 'doctrina'
    const [attacks, setAttacks] = useState([]);
    const [loadingAttacks, setLoadingAttacks] = useState(false);

    // Filtros
    const [filterBlanco, setFilterBlanco] = useState('todos');
    const [filterAmenaza, setFilterAmenaza] = useState('todos');
    const [filterTactica, setFilterTactica] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');

    // Modales
    const [modalAttackOpen, setModalAttackOpen] = useState(false);
    const [modalScanOpen, setModalScanOpen] = useState(false);
    const [modalCompetitorOpen, setModalCompetitorOpen] = useState(false);
    const [analyzingWithAi, setAnalyzingWithAi] = useState(false);
    const [scanningUrl, setScanningUrl] = useState(false);
    const [expandedGuiones, setExpandedGuiones] = useState({});
    const [copiedScript, setCopiedScript] = useState('');

    // Formulario de Ataque
    const [attackForm, setAttackForm] = useState({
        competitor_id: '',
        adversario_nombre: '',
        plataforma: 'twitter',
        url_publicacion: '',
        blanco_ataque: 'candidato',
        descripcion_blanco: '',
        contenido_ataque: '',
        tema_ataque: 'Guerra Sucia / Desprestigio',
        nivel_amenaza: 'medio',
        alcance_estimado: 0,
        likes: 0,
        reposts: 0,
        comentarios: 0,
        es_fake_news: false,
        posible_red_bots: false,
        tactica_recomendada: 'redireccionar',
        analisis_estrategico: '',
        guion_candidato: '',
        guion_voceros: '',
        guion_tropa_digital: '',
        guion_debates: '',
        estado: 'en_monitoreo',
        notas_director: ''
    });

    // Formulario de Escaneo de URL
    const [scanUrl, setScanUrl] = useState('');

    // Formulario de Contrincante
    const [competitorForm, setCompetitorForm] = useState({
        nombre_candidato: '',
        partido_movimiento: '',
        cargo_postulado: 'Alcalde / Candidato',
        nivel_amenaza: 'medio',
        narrativa_principal: '',
        lineas_de_ataque: '',
        contra_estrategia_sugerida: '',
        redes_principales: {
            twitter: '',
            instagram: '',
            tiktok: '',
            facebook: '',
            youtube: ''
        }
    });

    // Cargar ataques de la campaña
    const fetchAttacks = async () => {
        setLoadingAttacks(true);
        try {
            const campId = activeCampaign?.id || 1;
            const res = await axios.get(`${API}/social/competitors/attacks`, {
                ...authHeaders,
                params: { campana_id: campId }
            });
            setAttacks(res.data);
        } catch (err) {
            console.error('Error al cargar ataques:', err);
        } finally {
            setLoadingAttacks(false);
        }
    };

    useEffect(() => {
        fetchAttacks();
    }, [activeCampaign?.id]);

    // Analizar con IA en el modal
    const handleAnalyzeAi = async () => {
        if (!attackForm.contenido_ataque) {
            alert('Por favor ingrese el contenido o resumen del ataque para que la IA lo analice.');
            return;
        }
        setAnalyzingWithAi(true);
        try {
            const res = await axios.post(`${API}/social/competitors/attacks/analyze-ai`, {
                contenido_ataque: attackForm.contenido_ataque,
                adversario_nombre: attackForm.adversario_nombre,
                plataforma: attackForm.plataforma,
                likes: attackForm.likes,
                reposts: attackForm.reposts,
                comentarios: attackForm.comentarios,
                campana_id: activeCampaign?.id || 1
            }, authHeaders);

            if (res.data.success && res.data.analysis) {
                const a = res.data.analysis;
                setAttackForm(prev => ({
                    ...prev,
                    blanco_ataque: a.blanco_ataque || prev.blanco_ataque,
                    descripcion_blanco: a.descripcion_blanco || prev.descripcion_blanco,
                    tema_ataque: a.tema_ataque || prev.tema_ataque,
                    nivel_amenaza: a.nivel_amenaza || prev.nivel_amenaza,
                    es_fake_news: a.es_fake_news !== undefined ? a.es_fake_news : prev.es_fake_news,
                    posible_red_bots: a.posible_red_bots !== undefined ? a.posible_red_bots : prev.posible_red_bots,
                    tactica_recomendada: a.tactica_recomendada || prev.tactica_recomendada,
                    analisis_estrategico: a.analisis_estrategico || prev.analisis_estrategico,
                    guion_candidato: a.guion_candidato || prev.guion_candidato,
                    guion_voceros: a.guion_voceros || prev.guion_voceros,
                    guion_tropa_digital: a.guion_tropa_digital || prev.guion_tropa_digital,
                    guion_debates: a.guion_debates || prev.guion_debates
                }));
            }
        } catch (err) {
            console.error('Error al analizar con IA:', err);
            alert('No se pudo completar el análisis con IA. Verifique la conexión.');
        } finally {
            setAnalyzingWithAi(false);
        }
    };

    // Guardar nuevo ataque
    const handleSaveAttack = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API}/social/competitors/attacks`, {
                ...attackForm,
                campana_id: activeCampaign?.id || 1
            }, authHeaders);

            setModalAttackOpen(false);
            await fetchAttacks();
            if (onRefreshData) onRefreshData();
            alert('✅ Ataque registrado exitosamente en el Cuarto de Guerra');
        } catch (err) {
            console.error('Error al guardar ataque:', err);
            alert(err.response?.data?.message || 'Error al guardar ataque');
        }
    };

    // Escanear URL
    const handleScanUrl = async (e) => {
        e.preventDefault();
        if (!scanUrl) return;
        setScanningUrl(true);
        try {
            const res = await axios.post(`${API}/social/competitors/attacks/scan-url`, {
                url: scanUrl,
                campana_id: activeCampaign?.id || 1
            }, authHeaders);

            if (res.data.success && res.data.extracted) {
                const ext = res.data.extracted;
                setAttackForm({
                    competitor_id: ext.competitor_id || '',
                    adversario_nombre: ext.adversario_nombre || 'Oposición',
                    plataforma: ext.plataforma || 'twitter',
                    url_publicacion: ext.url_publicacion || scanUrl,
                    blanco_ataque: ext.blanco_ataque || 'candidato',
                    descripcion_blanco: ext.descripcion_blanco || '',
                    contenido_ataque: ext.contenido_ataque || '',
                    tema_ataque: ext.tema_ataque || 'Guerra Sucia / Desprestigio',
                    nivel_amenaza: ext.nivel_amenaza || 'medio',
                    alcance_estimado: 0,
                    likes: ext.likes || 0,
                    reposts: ext.reposts || 0,
                    comentarios: ext.comentarios || 0,
                    es_fake_news: ext.es_fake_news || false,
                    posible_red_bots: ext.posible_red_bots || false,
                    tactica_recomendada: ext.tactica_recomendada || 'redireccionar',
                    analisis_estrategico: ext.analisis_estrategico || '',
                    guion_candidato: ext.guion_candidato || '',
                    guion_voceros: ext.guion_voceros || '',
                    guion_tropa_digital: ext.guion_tropa_digital || '',
                    guion_debates: ext.guion_debates || '',
                    estado: 'en_monitoreo',
                    notas_director: ''
                });
                setModalScanOpen(false);
                setModalAttackOpen(true);
            }
        } catch (err) {
            console.error('Error al escanear URL:', err);
            alert('Error al escanear la URL. Ingrésela manualmente si lo desea.');
        } finally {
            setScanningUrl(false);
        }
    };

    // Guardar nuevo contrincante
    const handleSaveCompetitor = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API}/social/competitors`, {
                ...competitorForm,
                campana_id: activeCampaign?.id || 1
            }, authHeaders);
            setModalCompetitorOpen(false);
            if (onRefreshData) onRefreshData();
            alert('✅ Contrincante registrado en el radar con sus redes');
        } catch (err) {
            console.error('Error al guardar contrincante:', err);
            alert('Error al guardar contrincante');
        }
    };

    // Cambiar estado de un ataque
    const handleUpdateAttackStatus = async (attackId, newStatus) => {
        try {
            await axios.put(`${API}/social/competitors/attacks/${attackId}`, {
                estado: newStatus
            }, authHeaders);
            setAttacks(prev => prev.map(a => a.id === attackId ? { ...a, estado: newStatus } : a));
        } catch (err) {
            console.error('Error al actualizar estado:', err);
        }
    };

    // Eliminar ataque
    const handleDeleteAttack = async (attackId) => {
        if (!confirm('¿Confirma que desea eliminar este registro de ataque?')) return;
        try {
            await axios.delete(`${API}/social/competitors/attacks/${attackId}`, authHeaders);
            setAttacks(prev => prev.filter(a => a.id !== attackId));
        } catch (err) {
            console.error('Error al eliminar:', err);
        }
    };

    // Copiar texto al portapapeles
    const copyToClipboard = (text, key) => {
        navigator.clipboard.writeText(text);
        setCopiedScript(key);
        setTimeout(() => setCopiedScript(''), 2500);
    };

    // Filtrado de ataques
    const filteredAttacks = attacks.filter(a => {
        if (filterBlanco !== 'todos' && a.blanco_ataque !== filterBlanco) return false;
        if (filterAmenaza !== 'todos' && a.nivel_amenaza !== filterAmenaza) return false;
        if (filterTactica !== 'todos' && a.tactica_recomendada !== filterTactica) return false;
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            return (
                (a.adversario_nombre && a.adversario_nombre.toLowerCase().includes(s)) ||
                (a.contenido_ataque && a.contenido_ataque.toLowerCase().includes(s)) ||
                (a.tema_ataque && a.tema_ataque.toLowerCase().includes(s)) ||
                (a.descripcion_blanco && a.descripcion_blanco.toLowerCase().includes(s))
            );
        }
        return true;
    });

    // Cálculos estadísticos
    const totalAtaques = attacks.length;
    const ataquesCandidato = attacks.filter(a => a.blanco_ataque === 'candidato').length;
    const ataquesPartido = attacks.filter(a => a.blanco_ataque === 'partido').length;
    const ataquesGestion = attacks.filter(a => ['alcalde', 'gobernador', 'concejal', 'senador', 'congresista', 'gestion_institucional'].includes(a.blanco_ataque)).length;
    const ataquesCriticos = attacks.filter(a => a.nivel_amenaza === 'muy_alto' || a.nivel_amenaza === 'alto').length;

    return (
        <div className="space-y-6">
            {/* ========================================================= */}
            {/* HERO / ENCABEZADO ESTRATÉGICO DEL WAR ROOM */}
            {/* ========================================================= */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-400/40 rounded-full text-amber-300 text-xs font-black uppercase tracking-wider">
                            <Swords size={14} />
                            <span>Cuarto de Guerra & Inteligencia Opositora</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                            Radar de Adversarios & Detección de Ataques
                        </h2>
                        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                            Monitoreo en tiempo real de ofensivas digitales contra el <strong>Candidato</strong>, el <strong>Partido</strong> o su <strong>Gestión Institucional</strong> (Alcaldía, Gobernación, Concejo, Senado o Congreso), con asesoría táctica del Director de Campaña.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => {
                                setAttackForm({
                                    competitor_id: '',
                                    adversario_nombre: '',
                                    plataforma: 'twitter',
                                    url_publicacion: '',
                                    blanco_ataque: 'candidato',
                                    descripcion_blanco: '',
                                    contenido_ataque: '',
                                    tema_ataque: 'Guerra Sucia / Desprestigio',
                                    nivel_amenaza: 'medio',
                                    alcance_estimado: 0,
                                    likes: 0,
                                    reposts: 0,
                                    comentarios: 0,
                                    es_fake_news: false,
                                    posible_red_bots: false,
                                    tactica_recomendada: 'redireccionar',
                                    analisis_estrategico: '',
                                    guion_candidato: '',
                                    guion_voceros: '',
                                    guion_tropa_digital: '',
                                    guion_debates: '',
                                    estado: 'en_monitoreo',
                                    notas_director: ''
                                });
                                setModalAttackOpen(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl transition-all shadow-lg shadow-amber-500/20"
                        >
                            <Plus size={16} />
                            <span>Registrar Ataque</span>
                        </button>

                        <button
                            onClick={() => setModalScanOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase rounded-xl border border-slate-700 transition-all shadow"
                        >
                            <Zap size={16} className="text-amber-400" />
                            <span>Escanear URL con IA</span>
                        </button>

                        <button
                            onClick={() => setModalCompetitorOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase rounded-xl border border-slate-700 transition-all shadow"
                        >
                            <Plus size={16} />
                            <span>Registrar Contrincante</span>
                        </button>
                    </div>
                </div>

                {/* Métricas / Tablero de Comando */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
                    <div className="bg-slate-900/60 backdrop-blur p-3.5 rounded-2xl border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Ataques</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl font-black text-white">{totalAtaques}</span>
                            <span className="text-[10px] text-amber-400 font-bold">Registrados</span>
                        </div>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur p-3.5 rounded-2xl border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Al Candidato (Personal)</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl font-black text-rose-400">{ataquesCandidato}</span>
                            <span className="text-[10px] text-slate-400">Ofensivas</span>
                        </div>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur p-3.5 rounded-2xl border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Al Partido Político</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl font-black text-indigo-400">{ataquesPartido}</span>
                            <span className="text-[10px] text-slate-400">Desgaste</span>
                        </div>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur p-3.5 rounded-2xl border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">A la Gestión / Cargo</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl font-black text-amber-400">{ataquesGestion}</span>
                            <span className="text-[10px] text-slate-400">Obras/Gobierno</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* PESTAÑAS INTERNAS DE NAVEGACIÓN */}
            {/* ========================================================= */}
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2">
                <button
                    onClick={() => setSubTab('ataques')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs uppercase transition-all ${
                        subTab === 'ataques'
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    <ShieldAlert size={16} />
                    <span>Bitácora de Ataques ({attacks.length})</span>
                </button>

                <button
                    onClick={() => setSubTab('adversarios')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs uppercase transition-all ${
                        subTab === 'adversarios'
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    <Swords size={16} />
                    <span>Radar de Adversarios & Redes ({competitors.length})</span>
                </button>

                <button
                    onClick={() => setSubTab('doctrina')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs uppercase transition-all ${
                        subTab === 'doctrina'
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    <Bot size={16} />
                    <span>Matriz del Estratega (Doctrina)</span>
                </button>

                <button
                    onClick={() => {
                        fetchAttacks();
                        if (onRefreshData) onRefreshData();
                    }}
                    className="ml-auto flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-500 hover:text-slate-900 bg-gray-50 hover:bg-gray-100 rounded-xl transition"
                    title="Actualizar datos"
                >
                    <RefreshCw size={14} className={loadingAttacks ? 'animate-spin' : ''} />
                    <span>Sincronizar</span>
                </button>
            </div>

            {/* ========================================================= */}
            {/* SUBTAB 1: BITÁCORA DE ATAQUES & GUIONES ESTRATÉGICOS */}
            {/* ========================================================= */}
            {subTab === 'ataques' && (
                <div className="space-y-4">
                    {/* Barra de Filtros */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex-1 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por adversario, palabra clave o tema de ataque..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <select
                                value={filterBlanco}
                                onChange={e => setFilterBlanco(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-700"
                            >
                                <option value="todos">🎯 Todos los Blancos</option>
                                <option value="candidato">👤 Al Candidato</option>
                                <option value="partido">🏛️ Al Partido Político</option>
                                <option value="alcalde">🏢 Gestión Alcalde</option>
                                <option value="gobernador">🏛️ Gestión Gobernador</option>
                                <option value="concejal">🏙️ Desempeño Concejal</option>
                                <option value="senador">⚖️ Gestión Senador</option>
                                <option value="congresista">📜 Gestión Congresista</option>
                                <option value="gestion_institucional">🏗️ Gestión Institucional</option>
                            </select>

                            <select
                                value={filterAmenaza}
                                onChange={e => setFilterAmenaza(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-700"
                            >
                                <option value="todos">⚠️ Toda Amenaza</option>
                                <option value="muy_alto">🔴 Muy Alto (Crítico)</option>
                                <option value="alto">🟠 Alto</option>
                                <option value="medio">🟡 Medio</option>
                                <option value="bajo">🟢 Bajo</option>
                            </select>

                            <select
                                value={filterTactica}
                                onChange={e => setFilterTactica(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-700"
                            >
                                <option value="todos">🛡️ Todas las Tácticas</option>
                                <option value="ignorar">Silencio Estratégico</option>
                                <option value="desmentir">Desmentir (Fact-Check)</option>
                                <option value="redireccionar">Redirección (Judo)</option>
                                <option value="contraatacar">Contraataque</option>
                                <option value="tropa_digital">Tropa Digital</option>
                            </select>
                        </div>
                    </div>

                    {/* Listado de Ataques */}
                    {loadingAttacks ? (
                        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 shadow-sm space-y-3">
                            <RefreshCw size={28} className="animate-spin text-slate-800 mx-auto" />
                            <p className="text-xs font-bold text-gray-500 uppercase">Cargando bitácora del Cuarto de Guerra...</p>
                        </div>
                    ) : filteredAttacks.length === 0 ? (
                        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 shadow-sm space-y-3">
                            <ShieldCheck size={36} className="text-emerald-500 mx-auto" />
                            <h4 className="font-black text-slate-800 text-sm uppercase">Sin ataques registrados bajo este criterio</h4>
                            <p className="text-xs text-gray-400 max-w-md mx-auto">
                                Registre nuevos señalamientos o escanee un enlace de la oposición para generar automáticamente el análisis y guiones de respuesta.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredAttacks.map(attack => {
                                const blancoConfig = BLANCOS_INFO[attack.blanco_ataque] || BLANCOS_INFO.candidato;
                                const tacticaConfig = TACTICAS_INFO[attack.tactica_recomendada] || TACTICAS_INFO.redireccionar;
                                const isExpanded = expandedGuiones[attack.id];

                                return (
                                    <div
                                        key={attack.id}
                                        className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-sm hover:shadow-md transition-all space-y-4"
                                    >
                                        {/* Barra superior de la tarjeta */}
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {/* Blanco del ataque */}
                                                <span className={`text-[11px] font-black uppercase px-3 py-1 rounded-full border flex items-center gap-1.5 ${blancoConfig.bg}`}>
                                                    <span>{blancoConfig.icon}</span>
                                                    <span>{blancoConfig.label}</span>
                                                </span>

                                                {/* Plataforma */}
                                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                                                    {attack.plataforma}
                                                </span>

                                                {/* Amenaza */}
                                                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                                    attack.nivel_amenaza === 'muy_alto' ? 'bg-red-100 text-red-800 border border-red-300' :
                                                    attack.nivel_amenaza === 'alto' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                                                    attack.nivel_amenaza === 'medio' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                                    'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                }`}>
                                                    Riesgo {attack.nivel_amenaza?.replace('_', ' ')?.toUpperCase()}
                                                </span>

                                                {attack.es_fake_news && (
                                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-600 text-white flex items-center gap-1">
                                                        <AlertTriangle size={11} />
                                                        <span>Fake News</span>
                                                    </span>
                                                )}

                                                {attack.posible_red_bots && (
                                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-600 text-white flex items-center gap-1">
                                                        <Bot size={11} />
                                                        <span>Posible Red de Bots</span>
                                                    </span>
                                                )}
                                            </div>

                                            {/* Selector de Estado */}
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={attack.estado}
                                                    onChange={e => handleUpdateAttackStatus(attack.id, e.target.value)}
                                                    className="text-[11px] font-bold bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1 text-slate-800"
                                                >
                                                    <option value="en_monitoreo">🟡 En Monitoreo</option>
                                                    <option value="estrategia_desplegada">🟢 Respuesta Desplegada</option>
                                                    <option value="neutralizado">🛡️ Neutralizado</option>
                                                    <option value="descartado">⚪ Descartado</option>
                                                </select>

                                                <button
                                                    onClick={() => handleDeleteAttack(attack.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Eliminar registro"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Información del adversario y el contenido */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-slate-900 uppercase">
                                                        {attack.adversario_nombre}
                                                    </span>
                                                    {attack.adversario?.partido_movimiento && (
                                                        <span className="text-[11px] text-gray-500 font-medium">
                                                            ({attack.adversario.partido_movimiento})
                                                        </span>
                                                    )}
                                                </div>

                                                {attack.url_publicacion && (
                                                    <a
                                                        href={attack.url_publicacion}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-bold"
                                                    >
                                                        <span>Ver Publicación</span>
                                                        <ExternalLink size={12} />
                                                    </a>
                                                )}
                                            </div>

                                            {/* Texto del ataque */}
                                            <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl text-slate-800 text-xs sm:text-sm font-medium leading-relaxed">
                                                "{attack.contenido_ataque}"
                                            </div>

                                            {/* Métricas del ataque */}
                                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                                                <span className="flex items-center gap-1 font-bold text-slate-700">
                                                    <Heart size={14} className="text-red-500" />
                                                    {(attack.likes || 0).toLocaleString()} Likes
                                                </span>
                                                <span className="flex items-center gap-1 font-bold text-slate-700">
                                                    <Repeat size={14} className="text-emerald-500" />
                                                    {(attack.reposts || 0).toLocaleString()} Reposts
                                                </span>
                                                <span className="flex items-center gap-1 font-bold text-slate-700">
                                                    <MessageSquare size={14} className="text-blue-500" />
                                                    {(attack.comentarios || 0).toLocaleString()} Comentarios
                                                </span>
                                                <span className="text-gray-400">
                                                    Tema: <strong>{attack.tema_ataque}</strong>
                                                </span>
                                                <span className="text-gray-400 ml-auto text-[11px]">
                                                    {new Date(attack.fecha_ataque || attack.createdAt).toLocaleString('es-CO')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* ================================================= */}
                                        {/* ANÁLISIS DEL DIRECTOR DE CAMPAÑA & TÁCTICA */}
                                        {/* ================================================= */}
                                        <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 p-4 rounded-2xl border border-amber-200/80 space-y-2">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md">
                                                        🎯 Táctica Recomendada por el Estratega:
                                                    </span>
                                                    <span className="text-xs font-black text-amber-950 uppercase">
                                                        {tacticaConfig.label}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-xs text-amber-950/90 leading-relaxed font-medium">
                                                {attack.analisis_estrategico || tacticaConfig.desc}
                                            </p>
                                        </div>

                                        {/* ================================================= */}
                                        {/* DESPLEGABLE: 4 GUIONES DE RESPUESTA INTELIGENTE */}
                                        {/* ================================================= */}
                                        <div className="pt-1">
                                            <button
                                                onClick={() => setExpandedGuiones(prev => ({ ...prev, [attack.id]: !prev[attack.id] }))}
                                                className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase hover:bg-slate-800 transition"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Sparkles size={15} className="text-amber-400" />
                                                    <span>Guiones y Respuestas de Cuarto de Guerra (IA)</span>
                                                </div>
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>

                                            {isExpanded && (
                                                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in duration-200">
                                                    {/* Guion 1: Candidato */}
                                                    <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-2xl space-y-2 flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-black uppercase text-rose-900 flex items-center gap-1.5">
                                                                    <span>🎙️</span>
                                                                    <span>Para el Candidato / Mandatario</span>
                                                                </span>
                                                                <button
                                                                    onClick={() => copyToClipboard(attack.guion_candidato, `cand-${attack.id}`)}
                                                                    className="text-rose-700 hover:text-rose-950 text-[10px] font-bold flex items-center gap-1"
                                                                >
                                                                    {copiedScript === `cand-${attack.id}` ? <Check size={12} /> : <Copy size={12} />}
                                                                    <span>{copiedScript === `cand-${attack.id}` ? 'Copiado' : 'Copiar'}</span>
                                                                </button>
                                                            </div>
                                                            <p className="text-xs text-rose-950 font-medium italic mt-1 leading-relaxed">
                                                                {attack.guion_candidato || 'No generado'}
                                                            </p>
                                                        </div>
                                                        <span className="text-[9px] text-rose-700/80 font-bold uppercase mt-2">
                                                            Tono de Estadista • Propuestas y Serenidad
                                                        </span>
                                                    </div>

                                                    {/* Guion 2: Voceros de Prensa */}
                                                    <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl space-y-2 flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-black uppercase text-blue-900 flex items-center gap-1.5">
                                                                    <span>📰</span>
                                                                    <span>Para Voceros & Rueda de Prensa</span>
                                                                </span>
                                                                <button
                                                                    onClick={() => copyToClipboard(attack.guion_voceros, `voc-${attack.id}`)}
                                                                    className="text-blue-700 hover:text-blue-950 text-[10px] font-bold flex items-center gap-1"
                                                                >
                                                                    {copiedScript === `voc-${attack.id}` ? <Check size={12} /> : <Copy size={12} />}
                                                                    <span>{copiedScript === `voc-${attack.id}` ? 'Copiado' : 'Copiar'}</span>
                                                                </button>
                                                            </div>
                                                            <p className="text-xs text-blue-950 font-medium italic mt-1 leading-relaxed">
                                                                {attack.guion_voceros || 'No generado'}
                                                            </p>
                                                        </div>
                                                        <span className="text-[9px] text-blue-700/80 font-bold uppercase mt-2">
                                                            Datos Duros • Desmentido Institucional
                                                        </span>
                                                    </div>

                                                    {/* Guion 3: Tropa Digital */}
                                                    <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-2xl space-y-2 flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-black uppercase text-purple-900 flex items-center gap-1.5">
                                                                    <span>💬</span>
                                                                    <span>Tropa Digital (Comentarios)</span>
                                                                </span>
                                                                <button
                                                                    onClick={() => copyToClipboard(attack.guion_tropa_digital, `tropa-${attack.id}`)}
                                                                    className="text-purple-700 hover:text-purple-950 text-[10px] font-bold flex items-center gap-1"
                                                                >
                                                                    {copiedScript === `tropa-${attack.id}` ? <Check size={12} /> : <Copy size={12} />}
                                                                    <span>{copiedScript === `tropa-${attack.id}` ? 'Copiado' : 'Copiar'}</span>
                                                                </button>
                                                            </div>
                                                            <p className="text-xs text-purple-950 font-medium whitespace-pre-line mt-1 leading-relaxed">
                                                                {attack.guion_tropa_digital || 'No generado'}
                                                            </p>
                                                        </div>
                                                        <span className="text-[9px] text-purple-700/80 font-bold uppercase mt-2">
                                                            Ganar el Algoritmo • Desarmar la Narrativa
                                                        </span>
                                                    </div>

                                                    {/* Guion 4: Debates */}
                                                    <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl space-y-2 flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] font-black uppercase text-emerald-900 flex items-center gap-1.5">
                                                                    <span>🛡️</span>
                                                                    <span>Blindaje en Debates en Vivo</span>
                                                                </span>
                                                                <button
                                                                    onClick={() => copyToClipboard(attack.guion_debates, `deb-${attack.id}`)}
                                                                    className="text-emerald-700 hover:text-emerald-950 text-[10px] font-bold flex items-center gap-1"
                                                                >
                                                                    {copiedScript === `deb-${attack.id}` ? <Check size={12} /> : <Copy size={12} />}
                                                                    <span>{copiedScript === `deb-${attack.id}` ? 'Copiado' : 'Copiar'}</span>
                                                                </button>
                                                            </div>
                                                            <p className="text-xs text-emerald-950 font-medium italic mt-1 leading-relaxed">
                                                                {attack.guion_debates || 'No generado'}
                                                            </p>
                                                        </div>
                                                        <span className="text-[9px] text-emerald-700/80 font-bold uppercase mt-2">
                                                            Judo Político • Giro Inmediato a Propuesta
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================= */}
            {/* SUBTAB 2: RADAR DE ADVERSARIOS & REDES SOCIALES */}
            {/* ========================================================= */}
            {subTab === 'adversarios' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {competitors.map(comp => {
                            const redes = comp.redes_principales || {};
                            return (
                                <div key={comp.id} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4 flex flex-col justify-between">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                                comp.nivel_amenaza === 'muy_alto' ? 'bg-red-100 text-red-800 border border-red-300' :
                                                comp.nivel_amenaza === 'alto' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                                                'bg-amber-100 text-amber-800 border border-amber-200'
                                            }`}>
                                                Amenaza {comp.nivel_amenaza?.replace('_', ' ')?.toUpperCase()}
                                            </span>

                                            <span className="text-[11px] font-bold text-gray-500">
                                                {comp.partido_movimiento || 'Sin Partido'}
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="font-black text-lg text-slate-900 leading-snug">
                                                {comp.nombre_candidato}
                                            </h3>
                                            <p className="text-xs text-gray-500 font-bold">
                                                Cargo: {comp.cargo_postulado}
                                            </p>
                                        </div>

                                        {/* Enlaces a Redes Sociales del Adversario */}
                                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                                                Redes Sociales Registradas:
                                            </span>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {redes.twitter && (
                                                    <a
                                                        href={redes.twitter.startsWith('http') ? redes.twitter : `https://x.com/${redes.twitter.replace('@', '')}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="px-2.5 py-1 bg-slate-900 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 hover:bg-slate-800 transition"
                                                    >
                                                        <span>X (Twitter)</span>
                                                        <ExternalLink size={10} />
                                                    </a>
                                                )}
                                                {redes.instagram && (
                                                    <a
                                                        href={redes.instagram.startsWith('http') ? redes.instagram : `https://instagram.com/${redes.instagram.replace('@', '')}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 hover:opacity-90 transition"
                                                    >
                                                        <span>Instagram</span>
                                                        <ExternalLink size={10} />
                                                    </a>
                                                )}
                                                {redes.tiktok && (
                                                    <a
                                                        href={redes.tiktok.startsWith('http') ? redes.tiktok : `https://tiktok.com/@${redes.tiktok.replace('@', '')}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="px-2.5 py-1 bg-black text-white rounded-xl text-[11px] font-bold flex items-center gap-1 hover:opacity-90 transition"
                                                    >
                                                        <span>TikTok</span>
                                                        <ExternalLink size={10} />
                                                    </a>
                                                )}
                                                {redes.facebook && (
                                                    <a
                                                        href={redes.facebook.startsWith('http') ? redes.facebook : `https://facebook.com/${redes.facebook}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="px-2.5 py-1 bg-blue-600 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 hover:bg-blue-700 transition"
                                                    >
                                                        <span>Facebook</span>
                                                        <ExternalLink size={10} />
                                                    </a>
                                                )}
                                                {redes.youtube && (
                                                    <a
                                                        href={redes.youtube.startsWith('http') ? redes.youtube : `https://youtube.com/${redes.youtube}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="px-2.5 py-1 bg-red-600 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 hover:bg-red-700 transition"
                                                    >
                                                        <span>YouTube</span>
                                                        <ExternalLink size={10} />
                                                    </a>
                                                )}
                                                {!redes.twitter && !redes.instagram && !redes.tiktok && !redes.facebook && !redes.youtube && (
                                                    <span className="text-[11px] text-gray-400 italic">No ha registrado enlaces directos aún.</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Métricas de Ataques del Adversario */}
                                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                            <div className="bg-rose-50 p-2 rounded-xl border border-rose-100">
                                                <span className="text-[9px] font-bold text-rose-700 uppercase block">Al Candidato</span>
                                                <span className="font-black text-rose-900 text-sm">{comp.ataquesCandidato || 0}</span>
                                            </div>
                                            <div className="bg-indigo-50 p-2 rounded-xl border border-indigo-100">
                                                <span className="text-[9px] font-bold text-indigo-700 uppercase block">Al Partido</span>
                                                <span className="font-black text-indigo-900 text-sm">{comp.ataquesPartido || 0}</span>
                                            </div>
                                            <div className="bg-amber-50 p-2 rounded-xl border border-amber-100">
                                                <span className="text-[9px] font-bold text-amber-700 uppercase block">A la Gestión</span>
                                                <span className="font-black text-amber-900 text-sm">{comp.ataquesGestion || 0}</span>
                                            </div>
                                        </div>

                                        {/* Narrativa & Líneas de ataque */}
                                        <div className="space-y-2 text-xs">
                                            <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200">
                                                <span className="text-[10px] font-black uppercase text-amber-800 block">
                                                    🎯 Su Narrativa Principal:
                                                </span>
                                                <p className="text-amber-950 font-bold mt-0.5">{comp.narrativa_principal}</p>
                                                {comp.lineas_de_ataque && (
                                                    <p className="text-gray-600 text-[11px] mt-1">{comp.lineas_de_ataque}</p>
                                                )}
                                            </div>

                                            {comp.contra_estrategia_sugerida && (
                                                <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200">
                                                    <span className="text-[10px] font-black uppercase text-emerald-800 block">
                                                        🛡️ Contra-Estrategia Recomendada:
                                                    </span>
                                                    <p className="text-emerald-950 font-bold mt-0.5">{comp.contra_estrategia_sugerida}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Botón de acción rápida */}
                                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                        <button
                                            onClick={() => {
                                                setAttackForm(prev => ({
                                                    ...prev,
                                                    competitor_id: comp.id,
                                                    adversario_nombre: comp.nombre_candidato
                                                }));
                                                setModalAttackOpen(true);
                                            }}
                                            className="w-full flex items-center justify-center gap-2 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase transition"
                                        >
                                            <Plus size={14} />
                                            <span>Registrar Ataque de este Rival</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* SUBTAB 3: DOCTRINA DEL ESTRATEGA & WAR ROOM */}
            {/* ========================================================= */}
            {subTab === 'doctrina' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
                    <div>
                        <h3 className="font-black text-xl text-slate-900 uppercase">
                            Doctrina del Director Estratega: Protocolo de Guerra Sucia
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Reglas tácticas aplicadas por consultores electorales internacionales para neutralizar campañas de desprestigio y blindar la candidatura.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                            <span className="text-xs font-black uppercase text-slate-900 block">
                                1. Regla de Oro: El Silencio Estratégico
                            </span>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                No todo ataque merece respuesta. Responder a señalamientos menores o de cuentas con baja audiencia solo sirve para darles oxígeno, viralidad y validar la narrativa del rival. El candidato solo entra al debate cuando la crisis cruza al votante indeciso.
                            </p>
                        </div>

                        <div className="p-5 bg-blue-50 rounded-2xl border border-blue-200 space-y-2">
                            <span className="text-xs font-black uppercase text-blue-900 block">
                                2. Desmentido con Datos Duros (Fact-Checking)
                            </span>
                            <p className="text-xs text-blue-950 leading-relaxed">
                                Las acusaciones falsas o Fake News no se discuten con adjetivos ni insultos. Se desarticulan en menos de 2 horas publicando infografías o documentos con sellos oficiales. Quien tiene el dato manda el mensaje.
                            </p>
                        </div>

                        <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                            <span className="text-xs font-black uppercase text-emerald-900 block">
                                3. Redirección Narrativa (Judo Político)
                            </span>
                            <p className="text-xs text-emerald-950 leading-relaxed">
                                Usar la inercia del golpe opositor a nuestro favor. Si el adversario ataca diciendo que la seguridad falló, el candidato responde presentando el nuevo Centro de Monitoreo o anunciando la llegada de refuerzos policiales.
                            </p>
                        </div>

                        <div className="p-5 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
                            <span className="text-xs font-black uppercase text-purple-900 block">
                                4. Activación de Tropa Digital (Blindaje Orgánico)
                            </span>
                            <p className="text-xs text-purple-950 leading-relaxed">
                                La batalla por los comentarios no la da la cuenta oficial del candidato. Se despachan instrucciones a la militancia digital para sembrar preguntas incómodas al rival y ganar los primeros lugares del algoritmo en sus propias publicaciones.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: REGISTRAR ATAQUE CON IA */}
            {/* ========================================================= */}
            {modalAttackOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="bg-gradient-to-r from-slate-950 to-amber-950 p-6 text-white flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <Swords size={20} className="text-amber-400" />
                                <h3 className="font-black text-base uppercase">Registrar Ataque en el Cuarto de Guerra</h3>
                            </div>
                            <button onClick={() => setModalAttackOpen(false)} className="text-gray-400 hover:text-white">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveAttack} className="p-6 space-y-4 text-xs overflow-y-auto">
                            {/* Adversario y Blanco */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-700 font-bold mb-1 uppercase">Adversario Atacante *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej. Senador Opositor / Candidato X"
                                        value={attackForm.adversario_nombre}
                                        onChange={e => setAttackForm(prev => ({ ...prev, adversario_nombre: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-bold mb-1 uppercase">¿A quién o qué ataca? *</label>
                                    <select
                                        value={attackForm.blanco_ataque}
                                        onChange={e => setAttackForm(prev => ({ ...prev, blanco_ataque: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    >
                                        <option value="candidato">👤 Al Candidato Directamente</option>
                                        <option value="partido">🏛️ Al Partido / Movimiento Político</option>
                                        <option value="alcalde">🏢 A la Gestión como Alcalde</option>
                                        <option value="gobernador">🏛️ A la Gestión como Gobernador</option>
                                        <option value="concejal">🏙️ A la Gestión como Concejal</option>
                                        <option value="senador">⚖️ A la Gestión como Senador</option>
                                        <option value="congresista">📜 A la Gestión como Congresista</option>
                                        <option value="gestion_institucional">🏗️ A Obras / Presupuesto / Gestión</option>
                                        <option value="familia_personal">🛡️ A la Vida Personal / Familiar</option>
                                    </select>
                                </div>
                            </div>

                            {/* Red social y URL */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-700 font-bold mb-1 uppercase">Red Social / Canal</label>
                                    <select
                                        value={attackForm.plataforma}
                                        onChange={e => setAttackForm(prev => ({ ...prev, plataforma: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    >
                                        <option value="twitter">X (Twitter)</option>
                                        <option value="instagram">Instagram</option>
                                        <option value="tiktok">TikTok</option>
                                        <option value="facebook">Facebook</option>
                                        <option value="youtube">YouTube</option>
                                        <option value="whatsapp">Cadenas de WhatsApp</option>
                                        <option value="medios">Medios de Comunicación / Radio</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-bold mb-1 uppercase">Enlace / URL de la Publicación</label>
                                    <input
                                        type="url"
                                        placeholder="https://..."
                                        value={attackForm.url_publicacion}
                                        onChange={e => setAttackForm(prev => ({ ...prev, url_publicacion: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                                    />
                                </div>
                            </div>

                            {/* Contenido del Ataque */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-gray-700 font-bold uppercase">
                                        Texto o Síntesis del Ataque *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleAnalyzeAi}
                                        disabled={analyzingWithAi}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-[10px] uppercase shadow transition"
                                    >
                                        <Sparkles size={12} />
                                        <span>{analyzingWithAi ? 'Analizando con IA...' : '✨ Autodiagnóstico con IA'}</span>
                                    </button>
                                </div>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Copie el texto del tweet, mensaje, video o reclamo del adversario..."
                                    value={attackForm.contenido_ataque}
                                    onChange={e => setAttackForm(prev => ({ ...prev, contenido_ataque: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                                />
                            </div>

                            {/* Métricas e indicadores */}
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-gray-500 font-bold uppercase text-[10px]">Likes</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={attackForm.likes}
                                        onChange={e => setAttackForm(prev => ({ ...prev, likes: parseInt(e.target.value, 10) || 0 }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-500 font-bold uppercase text-[10px]">Reposts / Compartidos</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={attackForm.reposts}
                                        onChange={e => setAttackForm(prev => ({ ...prev, reposts: parseInt(e.target.value, 10) || 0 }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-500 font-bold uppercase text-[10px]">Comentarios</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={attackForm.comentarios}
                                        onChange={e => setAttackForm(prev => ({ ...prev, comentarios: parseInt(e.target.value, 10) || 0 }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 font-bold"
                                    />
                                </div>
                            </div>

                            {/* Amenaza, Táctica y Flags */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-gray-700 font-bold mb-1 uppercase">Nivel de Riesgo / Amenaza</label>
                                    <select
                                        value={attackForm.nivel_amenaza}
                                        onChange={e => setAttackForm(prev => ({ ...prev, nivel_amenaza: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    >
                                        <option value="bajo">🟢 Bajo (Monitoreo pasivo)</option>
                                        <option value="medio">🟡 Medio (Riesgo moderado)</option>
                                        <option value="alto">🟠 Alto (Viralización activa)</option>
                                        <option value="muy_alto">🔴 Muy Alto (Crisis inminente)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-bold mb-1 uppercase">Táctica Recomendada</label>
                                    <select
                                        value={attackForm.tactica_recomendada}
                                        onChange={e => setAttackForm(prev => ({ ...prev, tactica_recomendada: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    >
                                        <option value="ignorar">Silencio Estratégico (Ignorar)</option>
                                        <option value="desmentir">Desmentir con Datos Duros</option>
                                        <option value="redireccionar">Redirección Narrativa (Judo Político)</option>
                                        <option value="contraatacar">Contraataque Estratégico</option>
                                        <option value="tropa_digital">Activación de Tropa Digital</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 py-1">
                                <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={attackForm.es_fake_news}
                                        onChange={e => setAttackForm(prev => ({ ...prev, es_fake_news: e.target.checked }))}
                                        className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                                    />
                                    <span>Es Noticia Falsa (Fake News / Montaje)</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={attackForm.posible_red_bots}
                                        onChange={e => setAttackForm(prev => ({ ...prev, posible_red_bots: e.target.checked }))}
                                        className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                                    />
                                    <span>Impulsado por Red de Bots / Bodegas</span>
                                </label>
                            </div>

                            {/* Análisis del Director */}
                            <div>
                                <label className="block text-gray-700 font-bold mb-1 uppercase">Diagnóstico Estratégico</label>
                                <textarea
                                    rows={2}
                                    placeholder="Explicación de la intención del rival y por qué atacan..."
                                    value={attackForm.analisis_estrategico}
                                    onChange={e => setAttackForm(prev => ({ ...prev, analisis_estrategico: e.target.value }))}
                                    className="w-full bg-amber-50/70 border border-amber-200 rounded-xl p-2.5 font-medium text-amber-950"
                                />
                            </div>

                            {/* Guiones generados */}
                            <div className="space-y-3 pt-2 border-t">
                                <h4 className="font-black text-slate-900 uppercase flex items-center gap-1.5 text-xs">
                                    <Sparkles size={14} className="text-amber-500" />
                                    <span>Guiones de Respuesta Táctica</span>
                                </h4>

                                <div>
                                    <label className="block text-rose-800 font-bold mb-1 uppercase text-[11px]">
                                        🎙️ Guion para el Candidato / Mandatario
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="Declaración pública o en tarima..."
                                        value={attackForm.guion_candidato}
                                        onChange={e => setAttackForm(prev => ({ ...prev, guion_candidato: e.target.value }))}
                                        className="w-full bg-rose-50/50 border border-rose-200 rounded-xl p-2 text-rose-950"
                                    />
                                </div>

                                <div>
                                    <label className="block text-blue-800 font-bold mb-1 uppercase text-[11px]">
                                        📰 Guion para Voceros Oficiales y Rueda de Prensa
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="Argumentario con datos duros..."
                                        value={attackForm.guion_voceros}
                                        onChange={e => setAttackForm(prev => ({ ...prev, guion_voceros: e.target.value }))}
                                        className="w-full bg-blue-50/50 border border-blue-200 rounded-xl p-2 text-blue-950"
                                    />
                                </div>

                                <div>
                                    <label className="block text-purple-800 font-bold mb-1 uppercase text-[11px]">
                                        💬 Guion para Tropa Digital (Comentarios)
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="Respuestas cortas para militantes en comentarios..."
                                        value={attackForm.guion_tropa_digital}
                                        onChange={e => setAttackForm(prev => ({ ...prev, guion_tropa_digital: e.target.value }))}
                                        className="w-full bg-purple-50/50 border border-purple-200 rounded-xl p-2 text-purple-950"
                                    />
                                </div>

                                <div>
                                    <label className="block text-emerald-800 font-bold mb-1 uppercase text-[11px]">
                                        🛡️ Blindaje en Debates en Vivo
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="Giro de Judo Político para debatir en televisión..."
                                        value={attackForm.guion_debates}
                                        onChange={e => setAttackForm(prev => ({ ...prev, guion_debates: e.target.value }))}
                                        className="w-full bg-emerald-50/50 border border-emerald-200 rounded-xl p-2 text-emerald-950"
                                    />
                                </div>
                            </div>

                            {/* Botones */}
                            <div className="flex justify-end gap-2 pt-4 border-t shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setModalAttackOpen(false)}
                                    className="px-4 py-2 font-bold text-gray-500 uppercase"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase shadow"
                                >
                                    Guardar en War Room
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: ESCANEAR ENLACE DE ADVERSARIO */}
            {/* ========================================================= */}
            {modalScanOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-slate-950 to-indigo-950 p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Zap size={20} className="text-amber-400" />
                                <h3 className="font-black text-base uppercase">Escanear Post Opositor con IA</h3>
                            </div>
                            <button onClick={() => setModalScanOpen(false)} className="text-gray-400 hover:text-white">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleScanUrl} className="p-6 space-y-4 text-xs">
                            <p className="text-gray-500">
                                Ingrese el enlace de la publicación en <strong>X (Twitter), Instagram, TikTok o Facebook</strong> del adversario. La Inteligencia Artificial analizará el blanco del ataque y generará los guiones automáticamente.
                            </p>

                            <div>
                                <label className="block text-gray-700 font-bold mb-1 uppercase">URL de la Publicación *</label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://x.com/opositor/status/..."
                                    value={scanUrl}
                                    onChange={e => setScanUrl(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-medium text-xs focus:ring-2 focus:ring-slate-900"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setModalScanOpen(false)}
                                    className="px-4 py-2 font-bold text-gray-500 uppercase"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={scanningUrl}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold uppercase shadow hover:bg-slate-800 disabled:opacity-50"
                                >
                                    <Sparkles size={14} className="text-amber-400" />
                                    <span>{scanningUrl ? 'Extrayendo y Analizando...' : 'Escanear Ahora'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: REGISTRAR CONTRINCANTE & REDES */}
            {/* ========================================================= */}
            {modalCompetitorOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
                        <div className="bg-gradient-to-r from-slate-950 to-amber-950 p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Swords size={20} className="text-amber-400" />
                                <h3 className="font-black text-base uppercase">Registrar Contrincante & Redes</h3>
                            </div>
                            <button onClick={() => setModalCompetitorOpen(false)} className="text-gray-400 hover:text-white">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveCompetitor} className="p-6 space-y-3 text-xs max-h-[80vh] overflow-y-auto">
                            <div>
                                <label className="block text-gray-700 font-bold mb-1 uppercase">Nombre del Candidato Rival *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej. Rodrigo Méndez"
                                    value={competitorForm.nombre_candidato}
                                    onChange={e => setCompetitorForm(prev => ({ ...prev, nombre_candidato: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-gray-700 font-bold mb-1 uppercase">Partido / Movimiento</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Frente Opositor"
                                        value={competitorForm.partido_movimiento}
                                        onChange={e => setCompetitorForm(prev => ({ ...prev, partido_movimiento: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-bold mb-1 uppercase">Cargo al que aspira o actual</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Alcaldía / Senado"
                                        value={competitorForm.cargo_postulado}
                                        onChange={e => setCompetitorForm(prev => ({ ...prev, cargo_postulado: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold"
                                    />
                                </div>
                            </div>

                            {/* Redes Sociales del Rival */}
                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                                <span className="text-[10px] font-black uppercase text-slate-700 block tracking-wider">
                                    Redes Sociales Oficiales del Adversario:
                                </span>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 uppercase">X (Twitter) Handle / URL</label>
                                    <input
                                        type="text"
                                        placeholder="@usuario_x o link"
                                        value={competitorForm.redes_principales.twitter}
                                        onChange={e => setCompetitorForm(prev => ({
                                            ...prev,
                                            redes_principales: { ...prev.redes_principales, twitter: e.target.value }
                                        }))}
                                        className="w-full bg-white border border-gray-200 rounded-lg p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 uppercase">Instagram Handle / URL</label>
                                    <input
                                        type="text"
                                        placeholder="@usuario_ig o link"
                                        value={competitorForm.redes_principales.instagram}
                                        onChange={e => setCompetitorForm(prev => ({
                                            ...prev,
                                            redes_principales: { ...prev.redes_principales, instagram: e.target.value }
                                        }))}
                                        className="w-full bg-white border border-gray-200 rounded-lg p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 uppercase">TikTok Handle / URL</label>
                                    <input
                                        type="text"
                                        placeholder="@usuario_tiktok o link"
                                        value={competitorForm.redes_principales.tiktok}
                                        onChange={e => setCompetitorForm(prev => ({
                                            ...prev,
                                            redes_principales: { ...prev.redes_principales, tiktok: e.target.value }
                                        }))}
                                        className="w-full bg-white border border-gray-200 rounded-lg p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 uppercase">Facebook Página / URL</label>
                                    <input
                                        type="text"
                                        placeholder="facebook.com/..."
                                        value={competitorForm.redes_principales.facebook}
                                        onChange={e => setCompetitorForm(prev => ({
                                            ...prev,
                                            redes_principales: { ...prev.redes_principales, facebook: e.target.value }
                                        }))}
                                        className="w-full bg-white border border-gray-200 rounded-lg p-2"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-bold mb-1 uppercase">Narrativa Principal del Rival *</label>
                                <textarea
                                    required
                                    rows={2}
                                    placeholder="¿Cuál es su discurso constante contra nosotros?"
                                    value={competitorForm.narrativa_principal}
                                    onChange={e => setCompetitorForm(prev => ({ ...prev, narrativa_principal: e.target.value }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-bold mb-1 uppercase">Contra-Estrategia Recomendada</label>
                                <textarea
                                    rows={2}
                                    placeholder="Cómo neutralizarlo en medios y debates..."
                                    value={competitorForm.contra_estrategia_sugerida}
                                    onChange={e => setCompetitorForm(prev => ({ ...prev, contra_estrategia_sugerida: e.target.value }))}
                                    className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-emerald-950 font-medium"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setModalCompetitorOpen(false)}
                                    className="px-4 py-2 font-bold text-gray-500 uppercase"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold uppercase shadow hover:bg-slate-800"
                                >
                                    Guardar Contrincante
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
