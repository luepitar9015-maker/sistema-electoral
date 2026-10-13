import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    Radio, ShieldCheck, CheckCircle2, AlertTriangle, AlertCircle,
    RefreshCw, Key, Globe, Plus, Trash2, ExternalLink, Activity,
    Sliders, Check, X, Info, Clock, ChevronRight
} from 'lucide-react';
import { API } from '../../config/api';

const PLATFORMS_META = {
    youtube: {
        name: 'YouTube Data API v3',
        icon: '▶️',
        color: 'bg-red-600 text-white',
        border: 'border-red-500',
        badge: 'bg-red-50 text-red-700 border-red-200',
        authHint: 'API Key de Google Cloud o credencial OAuth2'
    },
    facebook: {
        name: 'Meta Graph API (Facebook)',
        icon: '📘',
        color: 'bg-blue-600 text-white',
        border: 'border-blue-500',
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        authHint: 'Page Access Token o User Token con pages_read_engagement'
    },
    instagram: {
        name: 'Meta Graph API (Instagram)',
        icon: '📸',
        color: 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white',
        border: 'border-pink-500',
        badge: 'bg-pink-50 text-pink-700 border-pink-200',
        authHint: 'Instagram Professional Account vinculado a Facebook Page'
    },
    twitter: {
        name: 'X (Twitter) API v2',
        icon: '🐦',
        color: 'bg-slate-900 text-white',
        border: 'border-slate-700',
        badge: 'bg-slate-100 text-slate-800 border-slate-300',
        authHint: 'App Bearer Token de X Developer Portal'
    },
    tiktok: {
        name: 'TikTok API v2',
        icon: '🎵',
        color: 'bg-black text-white',
        border: 'border-gray-800',
        badge: 'bg-gray-100 text-gray-900 border-gray-300',
        authHint: 'User Access Token con permisos video.list'
    }
};

export default function OfficialConnectionsManager({ campanaId, onAccountSynced }) {
    const token = localStorage.getItem('token');
    const authHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

    const [activeSubTab, setActiveSubTab] = useState('cuentas'); // 'cuentas' | 'credenciales' | 'historial'
    const [accounts, setAccounts] = useState([]);
    const [connections, setConnections] = useState([]);
    const [envStatus, setEnvStatus] = useState({});
    const [syncJobs, setSyncJobs] = useState([]);
    const [syncErrors, setSyncErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncingAccountId, setSyncingAccountId] = useState(null);

    // Modal Crear Cuenta
    const [modalAddAccount, setModalAddAccount] = useState(false);
    const [newAccountForm, setNewAccountForm] = useState({
        url: '',
        plataforma: 'youtube',
        tipo_cuenta: 'public_third_party',
        handle: '',
        nombre_mostrado: ''
    });
    const [submittingAccount, setSubmittingAccount] = useState(false);

    // Modal Guardar Credencial
    const [modalCreds, setModalCreds] = useState(false);
    const [selectedPlatformForCreds, setSelectedPlatformForCreds] = useState('youtube');
    const [credsTokenInput, setCredsTokenInput] = useState('');
    const [testingConnection, setTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [savingCreds, setSavingCreds] = useState(false);

    const loadAll = async () => {
        if (!campanaId) return;
        setLoading(true);
        try {
            const [accRes, connRes, jobsRes] = await Promise.all([
                axios.get(`${API}/social/accounts?campana_id=${campanaId}`, authHeaders).catch(() => ({ data: { accounts: [] } })),
                axios.get(`${API}/social/connections?campana_id=${campanaId}`, authHeaders).catch(() => ({ data: { connections: [], envStatus: {} } })),
                axios.get(`${API}/social/sync-jobs?campana_id=${campanaId}&limit=15`, authHeaders).catch(() => ({ data: { jobs: [], errors: [] } }))
            ]);

            setAccounts(accRes.data?.accounts || []);
            setConnections(connRes.data?.connections || []);
            setEnvStatus(connRes.data?.envStatus || {});
            setSyncJobs(jobsRes.data?.jobs || []);
            setSyncErrors(jobsRes.data?.errors || []);
        } catch (err) {
            console.error('Error cargando conexiones sociales:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, [campanaId]);

    const handleCreateAccount = async (e) => {
        e.preventDefault();
        setSubmittingAccount(true);
        try {
            await axios.post(`${API}/social/accounts`, {
                campana_id: campanaId,
                ...newAccountForm
            }, authHeaders);
            setModalAddAccount(false);
            setNewAccountForm({ url: '', plataforma: 'youtube', tipo_cuenta: 'public_third_party', handle: '', nombre_mostrado: '' });
            await loadAll();
            if (onAccountSynced) onAccountSynced();
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        } finally {
            setSubmittingAccount(false);
        }
    };

    const handleDeleteAccount = async (id) => {
        if (!window.confirm('¿Está seguro de desvincular esta cuenta del monitoreo?')) return;
        try {
            await axios.delete(`${API}/social/accounts/${id}`, authHeaders);
            await loadAll();
            if (onAccountSynced) onAccountSynced();
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    const handleSyncAccount = async (id) => {
        setSyncingAccountId(id);
        try {
            const res = await axios.post(`${API}/social/accounts/${id}/sync`, {}, authHeaders);
            alert(`Sincronización completada: ${res.data.result?.postsCreated || 0} publicaciones nuevas.`);
            await loadAll();
            if (onAccountSynced) onAccountSynced();
        } catch (err) {
            alert(`Aviso de plataforma: ${err.response?.data?.message || err.message}`);
            await loadAll();
        } finally {
            setSyncingAccountId(null);
        }
    };

    const handleTestConnection = async () => {
        setTestingConnection(true);
        setTestResult(null);
        try {
            const res = await axios.post(`${API}/social/connections/test`, {
                plataforma: selectedPlatformForCreds,
                token: credsTokenInput || undefined,
                campana_id: campanaId
            }, authHeaders);
            setTestResult(res.data);
        } catch (err) {
            setTestResult({ ok: false, message: err.response?.data?.message || err.message });
        } finally {
            setTestingConnection(false);
        }
    };

    const handleSaveConnection = async (e) => {
        e.preventDefault();
        if (!credsTokenInput.trim()) return;
        setSavingCreds(true);
        try {
            await axios.post(`${API}/social/connections`, {
                campana_id: campanaId,
                plataforma: selectedPlatformForCreds,
                token: credsTokenInput.trim()
            }, authHeaders);
            setModalCreds(false);
            setCredsTokenInput('');
            setTestResult(null);
            await loadAll();
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        } finally {
            setSavingCreds(false);
        }
    };

    const getConnectionStatusBadge = (platKey) => {
        const conn = connections.find(c => c.plataforma === platKey);
        const hasEnv = !!envStatus[platKey];
        if (conn?.is_valid || hasEnv) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    Conectada ({conn ? 'BD' : 'ENV'})
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
                <AlertTriangle size={12} className="text-amber-500" />
                Requiere Token / API Key
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header / Subtabs */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Radio size={20} />
                        </span>
                        <h2 className="text-xl font-bold text-gray-900">Centro de Conexiones Oficiales y Auditoría</h2>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Monitoreo estricto mediante Meta Graph API, YouTube Data API v3, X API v2 y TikTok. Sin datos simulados.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setModalAddAccount(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                    >
                        <Plus size={15} />
                        <span>Agregar Perfil / Cuenta</span>
                    </button>
                    <button
                        onClick={() => {
                            setSelectedPlatformForCreds('youtube');
                            setCredsTokenInput('');
                            setTestResult(null);
                            setModalCreds(true);
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                    >
                        <Key size={15} />
                        <span>Configurar Credenciales</span>
                    </button>
                    <button
                        onClick={loadAll}
                        className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition"
                        title="Actualizar estado"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Selector de Subpestañas */}
            <div className="flex gap-2 border-b border-gray-200 pb-2">
                <button
                    onClick={() => setActiveSubTab('cuentas')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                        activeSubTab === 'cuentas' ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <Globe size={14} />
                    <span>Cuentas Monitoreadas ({accounts.length})</span>
                </button>
                <button
                    onClick={() => setActiveSubTab('credenciales')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                        activeSubTab === 'credenciales' ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <ShieldCheck size={14} />
                    <span>APIs Oficiales y Estado ({Object.keys(PLATFORMS_META).length})</span>
                </button>
                <button
                    onClick={() => setActiveSubTab('historial')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                        activeSubTab === 'historial' ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    <Activity size={14} />
                    <span>Historial de Sincronización ({syncJobs.length})</span>
                </button>
            </div>

            {/* Subtab 1: Cuentas Monitoreadas */}
            {activeSubTab === 'cuentas' && (
                <div className="space-y-4">
                    {accounts.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center">
                            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Globe size={28} />
                            </div>
                            <h3 className="text-base font-bold text-gray-800">No hay cuentas registradas en el monitor</h3>
                            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-6">
                                Registre la página de Facebook, canal de YouTube o perfil de Instagram del candidato o de terceros públicos para iniciar el monitoreo oficial.
                            </p>
                            <button
                                onClick={() => setModalAddAccount(true)}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-bold inline-flex items-center gap-2 shadow-md hover:bg-indigo-700 transition"
                            >
                                <Plus size={16} />
                                <span>Vincular Primera Cuenta</span>
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {accounts.map(acc => {
                                const platInfo = PLATFORMS_META[acc.plataforma] || PLATFORMS_META.youtube;
                                const isManaged = acc.tipo_cuenta === 'managed';
                                const isSyncing = syncingAccountId === acc.id;

                                return (
                                    <div key={acc.id} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-3">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${platInfo.badge}`}>
                                                    {platInfo.icon} {acc.plataforma}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                    isManaged ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {isManaged ? 'Cuenta Administrada' : 'Monitoreo Público'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 mb-3">
                                                {acc.avatar_url ? (
                                                    <img src={acc.avatar_url} alt={acc.handle} className="w-12 h-12 rounded-2xl object-cover border border-gray-200" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-700">
                                                        {acc.handle?.slice(1, 3).toUpperCase() || 'RED'}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-gray-900 text-sm truncate">{acc.nombre_mostrado || acc.handle}</h4>
                                                    <p className="text-xs text-indigo-600 font-medium truncate">{acc.handle}</p>
                                                </div>
                                            </div>

                                            {/* Métricas Reales */}
                                            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-2xl mb-3 text-center">
                                                <div>
                                                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Seguidores</p>
                                                    <p className="text-xs font-bold text-gray-800">
                                                        {acc.total_seguidores ? acc.total_seguidores.toLocaleString('es-CO') : '0'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Posts en BD</p>
                                                    <p className="text-xs font-bold text-indigo-700">
                                                        {acc.total_publicaciones_reales || 0}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Estado de sincronización */}
                                            <div className="mb-4">
                                                <p className="text-[10px] text-gray-400 font-semibold mb-1">Estado de Sincronización:</p>
                                                {acc.sync_status === 'active' ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                                        <CheckCircle2 size={12} className="text-emerald-500" /> Sincronización Activa
                                                    </span>
                                                ) : acc.sync_status === 'restricted' ? (
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200" title={acc.sync_status_detail}>
                                                        <AlertTriangle size={12} className="text-amber-500" /> Restringida por API
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-600 font-medium bg-gray-50 px-2 py-0.5 rounded-lg">
                                                        <Clock size={12} /> Pendiente de primer barrido
                                                    </span>
                                                )}
                                                {acc.sync_status_detail && (
                                                    <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 italic">
                                                        {acc.sync_status_detail}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
                                            <button
                                                onClick={() => handleSyncAccount(acc.id)}
                                                disabled={isSyncing}
                                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                                            >
                                                <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                                                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
                                            </button>

                                            <div className="flex items-center gap-1">
                                                {acc.url_perfil && (
                                                    <a
                                                        href={acc.url_perfil}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                                                        title="Ver perfil oficial"
                                                    >
                                                        <ExternalLink size={14} />
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteAccount(acc.id)}
                                                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                    title="Eliminar cuenta"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Subtab 2: APIs Oficiales y Credenciales */}
            {activeSubTab === 'credenciales' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(PLATFORMS_META).map(([key, info]) => {
                        return (
                            <div key={key} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-2xl">{info.icon}</span>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm">{info.name}</h4>
                                            <p className="text-[11px] text-gray-500">{info.authHint}</p>
                                        </div>
                                    </div>
                                    {getConnectionStatusBadge(key)}
                                </div>

                                <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-1 text-slate-700">
                                    <p className="font-semibold text-slate-900">Capacidades Oficiales:</p>
                                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                                        {key === 'youtube' && (
                                            <>
                                                <li>Videos públicos y transmisiones en vivo</li>
                                                <li>Comentarios y respuestas completas de la comunidad</li>
                                                <li>Contadores oficiales de vistas, me gusta y comentarios</li>
                                            </>
                                        )}
                                        {key === 'facebook' && (
                                            <>
                                                <li>Páginas oficiales administradas y verificadas</li>
                                                <li>Comentarios públicos y respuestas directas desde moderación</li>
                                                <li>Reacciones agregadas por publicación</li>
                                            </>
                                        )}
                                        {key === 'instagram' && (
                                            <>
                                                <li>Cuentas profesionales (Business / Creator)</li>
                                                <li>Lectura de comentarios en publicaciones y reels</li>
                                                <li>Respuestas a comentarios mediante Graph API</li>
                                            </>
                                        )}
                                        {key === 'twitter' && (
                                            <>
                                                <li>Búsqueda de tweets públicos y métricas agregadas</li>
                                                <li>Respuestas de conversación según el plan de X API</li>
                                            </>
                                        )}
                                        {key === 'tiktok' && (
                                            <>
                                                <li>Listado de videos de la cuenta vinculada</li>
                                                <li>Estadísticas de visualizaciones, compartidos y me gusta</li>
                                            </>
                                        )}
                                    </ul>
                                </div>

                                <button
                                    onClick={() => {
                                        setSelectedPlatformForCreds(key);
                                        setCredsTokenInput('');
                                        setTestResult(null);
                                        setModalCreds(true);
                                    }}
                                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                                >
                                    <Key size={13} />
                                    <span>Configurar Token / Probar</span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Subtab 3: Historial de Sincronización */}
            {activeSubTab === 'historial' && (
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900">Bitácora de Trabajos de Sincronización</h3>
                    {syncJobs.length === 0 ? (
                        <p className="text-xs text-gray-500 py-4 text-center">No se registran ejecuciones de sincronización todavía.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase text-[10px]">
                                        <th className="py-2.5">Plataforma</th>
                                        <th className="py-2.5">Origen</th>
                                        <th className="py-2.5">Estado</th>
                                        <th className="py-2.5">Posts</th>
                                        <th className="py-2.5">Comentarios</th>
                                        <th className="py-2.5">Fecha</th>
                                        <th className="py-2.5">Detalles</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {syncJobs.map(job => (
                                        <tr key={job.id} className="hover:bg-slate-50 transition">
                                            <td className="py-2.5 font-bold uppercase text-slate-800">{job.plataforma}</td>
                                            <td className="py-2.5 text-slate-500">{job.tipo_origen}</td>
                                            <td className="py-2.5">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    job.estado === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                                                    job.estado === 'running' ? 'bg-blue-50 text-blue-700 animate-pulse' :
                                                    'bg-rose-50 text-rose-700'
                                                }`}>
                                                    {job.estado}
                                                </span>
                                            </td>
                                            <td className="py-2.5 text-slate-700 font-semibold">{job.publicaciones_obtenidas || 0}</td>
                                            <td className="py-2.5 text-slate-700 font-semibold">{job.comentarios_obtenidos || 0}</td>
                                            <td className="py-2.5 text-slate-500">{new Date(job.iniciado_en).toLocaleString('es-CO')}</td>
                                            <td className="py-2.5 text-slate-400 max-w-xs truncate" title={job.mensaje_error || job.detalles_tecnicos}>
                                                {job.mensaje_error || job.detalles_tecnicos || 'Completado sin anomalías'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modal: Vincular Cuenta */}
            {modalAddAccount && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="font-bold text-gray-900 text-base">Registrar Cuenta para Monitoreo</h3>
                            <button onClick={() => setModalAddAccount(false)} className="text-gray-400 hover:text-gray-700">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateAccount} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Plataforma</label>
                                <select
                                    value={newAccountForm.plataforma}
                                    onChange={e => setNewAccountForm({ ...newAccountForm, plataforma: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                                >
                                    <option value="youtube">YouTube (Canal Oficial o Público)</option>
                                    <option value="facebook">Facebook (Página Oficial)</option>
                                    <option value="instagram">Instagram (Cuenta Profesional)</option>
                                    <option value="twitter">X (Twitter)</option>
                                    <option value="tiktok">TikTok</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">Tipo de Modalidad</label>
                                <select
                                    value={newAccountForm.tipo_cuenta}
                                    onChange={e => setNewAccountForm({ ...newAccountForm, tipo_cuenta: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                                >
                                    <option value="public_third_party">Cuenta Pública de Terceros (Monitoreo)</option>
                                    <option value="managed">Cuenta Administrada Oficial (Propia con Token)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">URL Oficial o Handle</label>
                                <input
                                    type="text"
                                    placeholder="https://www.youtube.com/@CanalOficial o @nombre_usuario"
                                    value={newAccountForm.url}
                                    onChange={e => setNewAccountForm({ ...newAccountForm, url: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                                    required
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModalAddAccount(false)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingAccount}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition disabled:opacity-50"
                                >
                                    {submittingAccount ? 'Registrando...' : 'Registrar Cuenta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Configurar Credenciales */}
            {modalCreds && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="font-bold text-gray-900 text-base">Credencial para {PLATFORMS_META[selectedPlatformForCreds]?.name}</h3>
                            <button onClick={() => setModalCreds(false)} className="text-gray-400 hover:text-gray-700">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveConnection} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-1">
                                    Token / Clave de Acceso (Se almacena cifrado y protegido)
                                </label>
                                <input
                                    type="password"
                                    placeholder="Ingresa la API Key o Bearer Token oficial"
                                    value={credsTokenInput}
                                    onChange={e => setCredsTokenInput(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs"
                                    required
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleTestConnection}
                                disabled={testingConnection}
                                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center justify-center gap-1.5 transition"
                            >
                                <RefreshCw size={13} className={testingConnection ? 'animate-spin' : ''} />
                                <span>{testingConnection ? 'Verificando con API...' : 'Probar Conectividad con la API Oficial'}</span>
                            </button>

                            {testResult && (
                                <div className={`p-3 rounded-2xl text-xs ${testResult.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                                    <p className="font-bold">{testResult.ok ? '✓ Conexión Confirmada' : '❌ Error de Conexión'}</p>
                                    <p className="text-[11px] mt-0.5">{testResult.message}</p>
                                </div>
                            )}

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModalCreds(false)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold"
                                >
                                    Cerrar
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingCreds || !credsTokenInput.trim()}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition disabled:opacity-50"
                                >
                                    {savingCreds ? 'Guardando...' : 'Guardar Credencial'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
