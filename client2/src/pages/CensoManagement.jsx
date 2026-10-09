import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Database, UploadCloud, Download, Search, CheckCircle,
    XCircle, AlertCircle, RefreshCw, ExternalLink, Copy, Check,
    FileSpreadsheet, Zap, Trash2, MapPin, Building, Hash,
    Skull, ShieldCheck, ShieldAlert, Users, AlertTriangle,
    Layers, TrendingUp, Award, FileText
} from 'lucide-react';
import { API } from '../config/api';

export default function CensoManagement() {
    const token = localStorage.getItem('token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // Pestaña activa: 'censo' | 'difuntos'
    const [activeTab, setActiveTab] = useState('censo');

    // Estados de estadísticas de censo general
    const [stats, setStats] = useState({
        totalCenso: 0,
        totalVoters: 0,
        withPuesto: 0,
        withoutPuesto: 0,
        coveragePercent: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);

    // Estados de defunciones y votos reales
    const [defuncionesCount, setDefuncionesCount] = useState(0);
    const [resumenVotosReales, setResumenVotosReales] = useState({
        total_auditados: 0,
        votos_brutos: 0,
        difuntos_detectados: 0,
        duplicados_detectados: 0,
        no_en_censo: 0,
        trashumancia_municipio: 0,
        trashumancia_departamento: 0,
        votos_reales_computables: 0,
        voto_duro_seguro: 0,
        porcentaje_efectividad_real: 0
    });
    const [auditData, setAuditData] = useState(null);
    const [auditingRealVotes, setAuditingRealVotes] = useState(false);

    // Estados de Directorio Oficial Divipole
    const [puestosList, setPuestosList] = useState([]);
    const [puestosTotal, setPuestosTotal] = useState(12922);
    const [searchPuesto, setSearchPuesto] = useState('');
    const [filterDepto, setFilterDepto] = useState('');
    const [filterMuni, setFilterMuni] = useState('');
    const [pagePuesto, setPagePuesto] = useState(1);
    const [totalPagesPuesto, setTotalPagesPuesto] = useState(1);
    const [loadingPuestos, setLoadingPuestos] = useState(false);

    // Estados de carga de archivo de censo
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // Estados de carga de archivo de defunciones
    const [fileDefuncion, setFileDefuncion] = useState(null);
    const [uploadingDefuncion, setUploadingDefuncion] = useState(false);
    const [uploadDefuncionResult, setUploadDefuncionResult] = useState(null);
    const [dragOverDefuncion, setDragOverDefuncion] = useState(false);
    const fileDefuncionInputRef = useRef(null);

    // Estados de autodiligenciamiento
    const [autoAssigning, setAutoAssigning] = useState(false);
    const [assignResult, setAssignResult] = useState(null);

    // Estados de búsqueda individual
    const [searchCedula, setSearchCedula] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchResult, setSearchResult] = useState(null);
    const [copied, setCopied] = useState(false);

    // Cargar estadísticas
    const fetchAllStats = async () => {
        setLoadingStats(true);
        try {
            const [resCenso, resDefunciones, resVotos] = await Promise.all([
                axios.get(`${API}/censo/stats`, authHeaders).catch(() => ({ data: {} })),
                axios.get(`${API}/censo/defunciones/stats`, authHeaders).catch(() => ({ data: { totalDefunciones: 0 } })),
                axios.get(`${API}/voters/resumen-votos-reales`, authHeaders).catch(() => ({ data: {} }))
            ]);
            setStats(resCenso.data);
            setDefuncionesCount(resDefunciones.data.totalDefunciones || 0);
            if (resVotos.data && resVotos.data.total_auditados !== undefined) {
                setResumenVotosReales(resVotos.data);
            }

            try {
                const resPuestos = await axios.get(`${API}/censo/puestos/stats`, authHeaders);
                if (resPuestos.data?.totalPuestos) {
                    setPuestosTotal(resPuestos.data.totalPuestos);
                }
            } catch (e) {}
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        fetchAllStats();
    }, []);

    // ─── DIRECTORIO OFICIAL DIVIPOLE ─────────────────────────────────────────
    const fetchPuestos = async (page = 1, customSearch = null) => {
        setLoadingPuestos(true);
        try {
            const queryVal = customSearch !== null ? customSearch : searchPuesto;
            const params = new URLSearchParams({
                page: String(page),
                limit: '25',
                ...(queryVal ? { search: queryVal.trim() } : {}),
                ...(filterDepto ? { departamento: filterDepto.trim() } : {}),
                ...(filterMuni ? { municipio: filterMuni.trim() } : {})
            });
            const res = await axios.get(`${API}/censo/puestos?${params.toString()}`, authHeaders);
            setPuestosList(res.data.puestos || []);
            setTotalPagesPuesto(res.data.totalPages || 1);
            setPagePuesto(page);
            if (res.data.total !== undefined) {
                setPuestosTotal(res.data.total);
            }
        } catch (e) {
            console.error('Error fetching puestos:', e);
        } finally {
            setLoadingPuestos(false);
        }
    };

    // ─── CARGA MASIVA DE CENSO ────────────────────────────────────────────────
    const handleDownloadTemplate = async () => {
        try {
            const res = await axios.get(`${API}/censo/template`, {
                ...authHeaders,
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'plantilla_censo_electoral.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert('Error al descargar la plantilla: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleFileSelect = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setUploadResult(null);
        }
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) {
            setFile(dropped);
            setUploadResult(null);
        }
    };

    const handleUploadCenso = async () => {
        if (!file) return;
        setUploading(true);
        setUploadResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await axios.post(`${API}/censo/import`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setUploadResult({ type: 'success', message: res.data.message, total: res.data.totalProcessed });
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            fetchAllStats();
        } catch (error) {
            setUploadResult({
                type: 'error',
                message: error.response?.data?.message || 'Error al procesar el archivo'
            });
        } finally {
            setUploading(false);
        }
    };

    // ─── CARGA MASIVA DE DEFUNCIONES / DIFUNTOS (RNEC) ────────────────────────
    const handleDownloadDefuncionesTemplate = async () => {
        try {
            const res = await axios.get(`${API}/censo/defunciones/template`, {
                ...authHeaders,
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'plantilla_bajas_defuncion_rnec.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert('Error al descargar plantilla de defunciones: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleUploadDefunciones = async () => {
        if (!fileDefuncion) return;
        setUploadingDefuncion(true);
        setUploadDefuncionResult(null);

        try {
            const formData = new FormData();
            formData.append('file', fileDefuncion);

            const res = await axios.post(`${API}/censo/defunciones/import`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setUploadDefuncionResult({ type: 'success', message: res.data.message });
            setFileDefuncion(null);
            if (fileDefuncionInputRef.current) fileDefuncionInputRef.current.value = '';
            fetchAllStats();
        } catch (error) {
            setUploadDefuncionResult({
                type: 'error',
                message: error.response?.data?.message || 'Error al procesar archivo de defunciones'
            });
        } finally {
            setUploadingDefuncion(false);
        }
    };

    // ─── AUDITORÍA INTEGRAL DE VOTOS REALES Y DIFUNTOS ───────────────────────
    const handleRunAuditoriaVotosReales = async () => {
        setAuditingRealVotes(true);
        try {
            const res = await axios.post(`${API}/voters/auditar-votos-reales`, {}, authHeaders);
            setAuditData(res.data.data);
            setResumenVotosReales(res.data.data.stats);
            fetchAllStats();
        } catch (error) {
            alert('Error al ejecutar auditoría de votos reales: ' + (error.response?.data?.message || error.message));
        } finally {
            setAuditingRealVotes(false);
        }
    };

    // ─── AUTODILIGENCIAMIENTO ────────────────────────────────────────────────
    const handleAutoAssign = async (overwrite = false) => {
        setAutoAssigning(true);
        setAssignResult(null);
        try {
            const res = await axios.post(`${API}/censo/auto-assign`, { overwrite }, authHeaders);
            setAssignResult({ type: 'success', ...res.data });
            fetchStats();
        } catch (error) {
            setAssignResult({
                type: 'error',
                message: error.response?.data?.message || 'Error durante el autodiligenciamiento'
            });
        } finally {
            setAutoAssigning(false);
        }
    };

    // ─── CONSULTA INDIVIDUAL DE CÉDULA ────────────────────────────────────────
    const handleSearch = async (e) => {
        e.preventDefault();
        const ced = searchCedula.replace(/\D/g, '').trim();
        if (!ced) return;

        setSearching(true);
        setSearchResult(null);
        try {
            const res = await axios.get(`${API}/censo/lookup/${ced}`, authHeaders);
            setSearchResult(res.data);
        } catch (error) {
            setSearchResult({ found: false, message: 'Error al consultar censo' });
        } finally {
            setSearching(false);
        }
    };

    const handleOpenRegistraduria = (cedula) => {
        const cleanCed = (cedula || searchCedula || '').replace(/\D/g, '').trim();
        if (cleanCed) {
            navigator.clipboard.writeText(cleanCed);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
        window.open('https://wsp.registraduria.gov.co/censo/consultar/', '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">

            {/* Encabezado */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-[#00B894]/20 border border-[#00B894]/40 rounded-xl text-[#00B894]">
                            <Database size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-wide uppercase">Censo Electoral & Asignación de Puestos</h1>
                            <p className="text-gray-300 text-sm mt-0.5">
                                Base de datos local de votación y asistente directo con la Registraduría Nacional de Colombia.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchStats()}
                        disabled={loadingStats}
                        className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-gray-200 transition-colors"
                        title="Actualizar estadísticas"
                    >
                        <RefreshCw size={18} className={loadingStats ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => handleOpenRegistraduria()}
                        className="flex items-center gap-2 bg-[#00B894] hover:bg-[#00a884] text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-all transform hover:-translate-y-0.5"
                    >
                        <ExternalLink size={16} />
                        <span>Portal Registraduría</span>
                    </button>
                </div>
            </div>

            {/* Pestañas de Navegación */}
            <div className="flex border-b border-gray-200 gap-2">
                <button
                    onClick={() => setActiveTab('censo')}
                    className={`flex items-center gap-2 px-6 py-3 font-black text-xs md:text-sm uppercase tracking-wider rounded-t-xl transition-all border-b-2 ${
                        activeTab === 'censo'
                            ? 'border-[#00B894] text-[#00B894] bg-white shadow-sm'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <Database size={18} />
                    <span>Censo Electoral & Puestos</span>
                </button>

                <button
                    onClick={() => setActiveTab('difuntos')}
                    className={`flex items-center gap-2 px-6 py-3 font-black text-xs md:text-sm uppercase tracking-wider rounded-t-xl transition-all border-b-2 ${
                        activeTab === 'difuntos'
                            ? 'border-rose-600 text-rose-600 bg-white shadow-sm'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <Skull size={18} className="text-rose-500" />
                    <span>Auditoría de Difuntos & Votos Reales</span>
                    {resumenVotosReales.difuntos_detectados > 0 ? (
                        <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                            {resumenVotosReales.difuntos_detectados} Difuntos
                        </span>
                    ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            Depuración Activa
                        </span>
                    )}
                </button>

                <button
                    onClick={() => { setActiveTab('divipole'); fetchPuestos(1); }}
                    className={`flex items-center gap-2 px-6 py-3 font-black text-xs md:text-sm uppercase tracking-wider rounded-t-xl transition-all border-b-2 ${
                        activeTab === 'divipole'
                            ? 'border-indigo-600 text-indigo-600 bg-white shadow-sm'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <Building size={18} className="text-indigo-500" />
                    <span>Directorio DIVIPOLE</span>
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {puestosTotal > 0 ? puestosTotal.toLocaleString() : '12.922'} Puestos
                    </span>
                </button>
            </div>

            {/* CONTENIDO PESTAÑA 1: CENSO ELECTORAL */}
            {activeTab === 'censo' && (
                <div className="space-y-6">
                    {/* Métricas KPI */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Registros en Censo</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.totalCenso.toLocaleString()}</h3>
                        <p className="text-[11px] text-gray-400 mt-1">Puestos y mesas cargados</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                        <Database size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Votantes</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.totalVoters.toLocaleString()}</h3>
                        <p className="text-[11px] text-gray-400 mt-1">Registrados en el sistema</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                        <Building size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Con Puesto Asignado</p>
                        <h3 className="text-2xl font-black text-[#00B894] mt-1">{stats.withPuesto.toLocaleString()}</h3>
                        <p className="text-[11px] text-[#00B894] font-semibold mt-1">{stats.coveragePercent}% cobertura</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                        <CheckCircle size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Sin Puesto (Pendientes)</p>
                        <h3 className="text-2xl font-black text-amber-500 mt-1">{stats.withoutPuesto.toLocaleString()}</h3>
                        <p className="text-[11px] text-amber-500 font-semibold mt-1">Listos para autodiligenciar</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center font-bold">
                        <AlertCircle size={24} />
                    </div>
                </div>
            </div>

            {/* Botón de Autodiligenciamiento Destacado */}
            <div className="bg-gradient-to-r from-emerald-600 to-[#00B894] p-6 rounded-2xl text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                        <Zap size={14} /> Automatizador de Puestos
                    </div>
                    <h2 className="text-xl font-black">Cruzar Censo y Autodiligenciar Votantes Pendientes</h2>
                    <p className="text-emerald-50 text-sm max-w-2xl">
                        Asigna automáticamente el lugar de votación, mesa, departamento y municipio a todos los votantes registrados que aún no tienen puesto, buscando sus cédulas en la base del censo.
                    </p>
                </div>

                <button
                    onClick={() => handleAutoAssign(false)}
                    disabled={autoAssigning || stats.totalCenso === 0}
                    className="flex-shrink-0 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-gray-400 text-white font-black text-sm uppercase tracking-wider px-6 py-4 rounded-xl shadow-xl transition-all transform hover:-translate-y-0.5"
                >
                    <Zap size={18} className={autoAssigning ? 'animate-bounce text-yellow-400' : 'text-yellow-400'} />
                    <span>{autoAssigning ? 'Autodiligenciando...' : '⚡ Ejecutar Autodiligenciamiento'}</span>
                </button>
            </div>

            {/* Resultado de Autodiligenciamiento */}
            {assignResult && (
                <div className={`p-5 rounded-xl border flex items-start gap-4 ${assignResult.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                    {assignResult.type === 'success' ? <CheckCircle size={24} className="text-emerald-600 flex-shrink-0" /> : <XCircle size={24} className="text-rose-600 flex-shrink-0" />}
                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wide">{assignResult.message}</h4>
                        {assignResult.updatedCount !== undefined && (
                            <div className="flex gap-4 mt-2 text-xs">
                                <span className="font-bold bg-white/70 px-2.5 py-1 rounded-md text-emerald-700">✓ {assignResult.updatedCount} actualizados</span>
                                <span className="font-bold bg-white/70 px-2.5 py-1 rounded-md text-amber-700">ℹ {assignResult.notFoundCount} no encontrados en censo</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Dos Columnas: Carga de Censo y Consulta Rápida */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Columna Izquierda: Cargar Censo Masivo */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                    <div className="flex items-center justify-between border-b pb-4">
                        <div className="flex items-center gap-2">
                            <UploadCloud size={20} className="text-blue-600" />
                            <h3 className="font-black text-slate-800 uppercase tracking-wide text-sm">Cargar Censo / DIVIPOLE Oficial</h3>
                        </div>
                        <button
                            onClick={handleDownloadTemplate}
                            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-xs uppercase tracking-wide transition-colors"
                        >
                            <Download size={14} />
                            <span>Plantilla Excel</span>
                        </button>
                    </div>

                    <p className="text-gray-500 text-xs leading-relaxed">
                        Sube el archivo Excel (<span className="font-mono font-semibold">.xlsx</span>) o <span className="font-mono font-semibold">.csv</span> provisto por la Registraduría o tu campaña. El sistema detecta automáticamente columnas de cédula, departamento, municipio, puesto, dirección y mesa.
                    </p>

                    {/* Zona Drag & Drop */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleFileDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50/50'}`}
                    >
                        <UploadCloud size={40} className={`mx-auto mb-2 ${dragOver ? 'text-blue-600' : 'text-gray-400'}`} />
                        <p className="font-bold text-sm text-gray-700">
                            {file ? file.name : 'Arrastra el archivo de censo aquí'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'o haz clic para explorar en tu equipo (.xlsx, .csv)'}
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                    </div>

                    {/* Botón Subir */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleUploadCenso}
                            disabled={!file || uploading}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md"
                        >
                            <UploadCloud size={16} />
                            <span>{uploading ? 'Importando a alta velocidad...' : 'Importar a Censo Local'}</span>
                        </button>
                        {file && (
                            <button
                                onClick={() => { setFile(null); setUploadResult(null); }}
                                className="px-3 py-3 border border-gray-200 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <XCircle size={18} />
                            </button>
                        )}
                    </div>

                    {uploadResult && (
                        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs ${uploadResult.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                            {uploadResult.type === 'success' ? <CheckCircle size={18} className="text-emerald-600" /> : <XCircle size={18} className="text-rose-600" />}
                            <span>{uploadResult.message}</span>
                        </div>
                    )}
                </div>

                {/* Columna Derecha: Buscador y Asistente Registraduría */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 border-b pb-4">
                            <Search size={20} className="text-[#00B894]" />
                            <h3 className="font-black text-slate-800 uppercase tracking-wide text-sm">Consultar Cédula Individual</h3>
                        </div>

                        <p className="text-gray-500 text-xs mt-3 leading-relaxed">
                            Verifica de inmediato el puesto y mesa de votación de un ciudadano ingresando su cédula.
                        </p>

                        <form onSubmit={handleSearch} className="flex gap-2 mt-4">
                            <input
                                type="text"
                                placeholder="Número de cédula..."
                                value={searchCedula}
                                onChange={(e) => setSearchCedula(e.target.value)}
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#00B894] transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={searching || !searchCedula.trim()}
                                className="bg-slate-900 hover:bg-slate-800 disabled:bg-gray-300 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm"
                            >
                                {searching ? 'Buscando...' : 'Consultar'}
                            </button>
                        </form>

                        {/* Resultado de Búsqueda */}
                        {searchResult && (
                            <div className="mt-4">
                                {searchResult.found ? (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center justify-between text-emerald-800 font-bold text-xs">
                                            <span className="flex items-center gap-1.5"><CheckCircle size={16} className="text-emerald-600" /> CÉDULA ENCONTRADA EN CENSO</span>
                                            <span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-700">{searchResult.data.cedula}</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                                            <div>
                                                <span className="text-gray-400 block font-bold uppercase text-[10px]">Departamento</span>
                                                <span className="font-bold text-gray-800">{searchResult.data.departamento || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 block font-bold uppercase text-[10px]">Municipio</span>
                                                <span className="font-bold text-gray-800">{searchResult.data.municipio || 'N/A'}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-gray-400 block font-bold uppercase text-[10px]">Puesto de Votación</span>
                                                <span className="font-black text-[#00B894] text-sm">{searchResult.data.puesto_votacion || searchResult.data.lugar_votacion}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 block font-bold uppercase text-[10px]">Mesa</span>
                                                <span className="font-black text-slate-800">{searchResult.data.mesa ? `Mesa #${searchResult.data.mesa}` : 'No especificada'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 block font-bold uppercase text-[10px]">Dirección</span>
                                                <span className="text-gray-700">{searchResult.data.direccion || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 text-xs">
                                        <div className="flex items-center gap-2 text-amber-800 font-bold">
                                            <AlertCircle size={16} className="text-amber-600" />
                                            <span>No figura en el censo electoral local</span>
                                        </div>
                                        <p className="text-gray-600 leading-relaxed">
                                            Puedes verificar directamente en el portal oficial de la Registraduría con un solo clic. Copiaremos la cédula automáticamente.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenRegistraduria(searchCedula)}
                                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg uppercase tracking-wider text-xs shadow-sm transition-all"
                                        >
                                            <ExternalLink size={14} />
                                            <span>{copied ? '✓ Cédula Copiada — Abriendo Registraduría...' : 'Copiar Cédula y Abrir Registraduría'}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Tarjeta de Asistente Registraduría */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2 mt-4">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                                <ExternalLink size={14} className="text-blue-600" /> Portal Oficial Registraduría
                            </span>
                            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded">Enlace Seguro</span>
                        </div>
                        <p className="text-gray-500 leading-relaxed">
                            Al hacer clic, el sistema copia el número de cédula en el portapapeles y te dirige a la página oficial para que solo debas pegarla y completar el captcha de seguridad.
                        </p>
                    </div>
                </div>
            </div>
            </div>
            )}

            {/* CONTENIDO PESTAÑA 2: AUDITORÍA DE DIFUNTOS Y VOTOS REALES */}
            {activeTab === 'difuntos' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Banner de Auditoría Forense */}
                    <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-6 md:p-8 rounded-2xl text-white shadow-2xl border border-rose-900/40 relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-2 max-w-2xl">
                                <div className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                                    <Skull size={14} /> Auditoría Anti-Fraude & Depuración Electoral
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black tracking-wide">
                                    Detección de Difuntos y Cálculo de Votos Reales
                                </h2>
                                <p className="text-rose-100/80 text-sm leading-relaxed">
                                    Depura automáticamente la base de datos de simpatizantes reportada por comités y líderes. Detecta cédulas canceladas por fallecimiento (bajas RNEC), suprime duplicidades y descarta trashumancia para obtener su <b>verdadero piso electoral computable</b>.
                                </p>
                            </div>

                            <button
                                onClick={handleRunAuditoriaVotosReales}
                                disabled={auditingRealVotes}
                                className="flex-shrink-0 flex items-center justify-center gap-3 bg-rose-600 hover:bg-rose-500 disabled:bg-gray-700 text-white font-black text-sm uppercase tracking-wider px-8 py-5 rounded-2xl shadow-2xl transition-all transform hover:-translate-y-1 hover:shadow-rose-600/30"
                            >
                                <Zap size={20} className={auditingRealVotes ? 'animate-spin text-yellow-300' : 'text-yellow-300'} />
                                <span>{auditingRealVotes ? 'Auditando Cédulas...' : '⚡ Ejecutar Auditoría de Votos Reales'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Malla de Indicadores del Embudo de Purga */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {/* 1. Padrón Bruto */}
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">1. Padrón Bruto</span>
                            <div className="text-xl md:text-2xl font-black text-slate-800 mt-1">
                                {resumenVotosReales.votos_brutos?.toLocaleString() || 0}
                            </div>
                            <span className="text-[10px] text-gray-500">Reportados por líderes</span>
                        </div>

                        {/* 2. Difuntos Detectados */}
                        <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 shadow-sm relative overflow-hidden">
                            <span className="text-[10px] font-black uppercase text-rose-700 block tracking-wider flex items-center gap-1">
                                <Skull size={12} /> 2. Difuntos
                            </span>
                            <div className="text-xl md:text-2xl font-black text-rose-600 mt-1">
                                -{resumenVotosReales.difuntos_detectados?.toLocaleString() || 0}
                            </div>
                            <span className="text-[10px] text-rose-700 font-bold">Cédulas canceladas RNEC</span>
                        </div>

                        {/* 3. No en Censo */}
                        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-sm">
                            <span className="text-[10px] font-black uppercase text-amber-700 block tracking-wider">3. No en Censo</span>
                            <div className="text-xl md:text-2xl font-black text-amber-600 mt-1">
                                -{resumenVotosReales.no_en_censo?.toLocaleString() || 0}
                            </div>
                            <span className="text-[10px] text-amber-700">Sin inscripción vigente</span>
                        </div>

                        {/* 4. Trashumantes */}
                        <div className="bg-orange-50/70 p-4 rounded-xl border border-orange-200 shadow-sm">
                            <span className="text-[10px] font-black uppercase text-orange-700 block tracking-wider">4. Trashumancia</span>
                            <div className="text-xl md:text-2xl font-black text-orange-600 mt-1">
                                -{((resumenVotosReales.trashumancia_municipio || 0) + (resumenVotosReales.trashumancia_departamento || 0)).toLocaleString()}
                            </div>
                            <span className="text-[10px] text-orange-700">Votan en otro territorio</span>
                        </div>

                        {/* 5. Duplicados */}
                        <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200 shadow-sm">
                            <span className="text-[10px] font-black uppercase text-purple-700 block tracking-wider">5. Duplicados</span>
                            <div className="text-xl md:text-2xl font-black text-purple-600 mt-1">
                                -{resumenVotosReales.duplicados_detectados?.toLocaleString() || 0}
                            </div>
                            <span className="text-[10px] text-purple-700">Cruces entre líderes</span>
                        </div>

                        {/* 6. VOTOS REALES COMPUTABLES */}
                        <div className="bg-emerald-600 p-4 rounded-xl text-white shadow-md relative overflow-hidden">
                            <span className="text-[10px] font-black uppercase text-emerald-100 block tracking-wider flex items-center gap-1">
                                <ShieldCheck size={12} /> 🎯 Votos Reales
                            </span>
                            <div className="text-xl md:text-2xl font-black mt-1">
                                {resumenVotosReales.votos_reales_computables?.toLocaleString() || 0}
                            </div>
                            <span className="text-[10px] text-emerald-100 font-bold block">
                                {resumenVotosReales.porcentaje_efectividad_real || 0}% efectividad neta
                            </span>
                        </div>
                    </div>

                    {/* Dos Bloques: Cargar Archivo de Difuntos & Embudo Visual */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Bloque Izquierdo: Cargar Base de Difuntos (RNEC) */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div>
                                    <h3 className="font-black text-slate-800 uppercase tracking-wide text-sm flex items-center gap-2">
                                        <Skull size={18} className="text-rose-600" /> Cargar Bajas por Defunción (RNEC / Notarías)
                                    </h3>
                                    <p className="text-gray-400 text-xs mt-0.5">
                                        Base de datos negra de personas fallecidas para depurar listas electorales.
                                    </p>
                                </div>
                                <button
                                    onClick={handleDownloadDefuncionesTemplate}
                                    className="flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors"
                                >
                                    <Download size={14} /> Plantilla Bajas
                                </button>
                            </div>

                            {/* Dropzone Defunciones */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOverDefuncion(true); }}
                                onDragLeave={() => setDragOverDefuncion(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setDragOverDefuncion(false);
                                    if (e.dataTransfer.files[0]) setFileDefuncion(e.dataTransfer.files[0]);
                                }}
                                onClick={() => fileDefuncionInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                                    dragOverDefuncion ? 'border-rose-500 bg-rose-50/50' : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                                }`}
                            >
                                <input
                                    ref={fileDefuncionInputRef}
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={(e) => { if (e.target.files[0]) setFileDefuncion(e.target.files[0]); }}
                                    className="hidden"
                                />
                                <div className="w-12 h-12 mx-auto bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-rose-500 mb-3">
                                    <Skull size={24} className={uploadingDefuncion ? 'animate-bounce' : ''} />
                                </div>
                                {fileDefuncion ? (
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{fileDefuncion.name}</p>
                                        <p className="text-gray-400 text-xs mt-1">{(fileDefuncion.size / (1024 * 1024)).toFixed(2)} MB</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="font-bold text-gray-700 text-sm">Arrastra aquí el archivo de difuntos o haz clic</p>
                                        <p className="text-gray-400 text-xs mt-1">Columna de cédula requerida. Soporta nombres, apellidos y fecha de defunción.</p>
                                    </div>
                                )}
                            </div>

                            {/* Botón de Carga */}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleUploadDefunciones}
                                    disabled={!fileDefuncion || uploadingDefuncion}
                                    className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <UploadCloud size={16} />
                                    <span>{uploadingDefuncion ? 'Cargando difuntos...' : 'Cargar Cédulas a Base de Bajas'}</span>
                                </button>
                                {fileDefuncion && (
                                    <button
                                        onClick={() => { setFileDefuncion(null); setUploadDefuncionResult(null); }}
                                        className="px-3 py-3 border border-gray-200 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <XCircle size={18} />
                                    </button>
                                )}
                            </div>

                            {uploadDefuncionResult && (
                                <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs ${uploadDefuncionResult.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                                    {uploadDefuncionResult.type === 'success' ? <CheckCircle size={18} className="text-emerald-600" /> : <XCircle size={18} className="text-rose-600" />}
                                    <span>{uploadDefuncionResult.message}</span>
                                </div>
                            )}

                            {/* Estado de Bajas */}
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                                <span className="text-slate-600 font-bold flex items-center gap-2">
                                    <Database size={14} className="text-slate-500" /> Cédulas de difuntos registradas en lista negra:
                                </span>
                                <span className="font-black text-rose-600 bg-rose-100 px-2.5 py-0.5 rounded-full">
                                    {defuncionesCount.toLocaleString()} cédulas
                                </span>
                            </div>
                        </div>

                        {/* Bloque Derecho: Visualizador del Embudo Electoral */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
                            <div className="border-b pb-4">
                                <h3 className="font-black text-slate-800 uppercase tracking-wide text-sm flex items-center gap-2">
                                    <Layers size={18} className="text-emerald-600" /> Embudo de Depuración de Votos
                                </h3>
                                <p className="text-gray-400 text-xs mt-0.5">
                                    Fórmula matemática de depuración aplicada sobre la lista de votantes.
                                </p>
                            </div>

                            <div className="space-y-4 pt-2">
                                {/* Barra 1: Padrón Bruto */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                        <span>Padrón Bruto Registrado</span>
                                        <span>100% ({resumenVotosReales.votos_brutos?.toLocaleString() || 0})</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                                        <div className="bg-slate-700 h-full rounded-full" style={{ width: '100%' }} />
                                    </div>
                                </div>

                                {/* Barra 2: Difuntos & Bajas */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-rose-700 mb-1">
                                        <span className="flex items-center gap-1"><Skull size={12} /> Bajas por Difuntos</span>
                                        <span>
                                            -{resumenVotosReales.votos_brutos > 0 ? ((resumenVotosReales.difuntos_detectados / resumenVotosReales.votos_brutos) * 100).toFixed(1) : 0}% ({resumenVotosReales.difuntos_detectados})
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-rose-500 h-full rounded-full"
                                            style={{
                                                width: `${resumenVotosReales.votos_brutos > 0 ? Math.min(100, (resumenVotosReales.difuntos_detectados / resumenVotosReales.votos_brutos) * 100) : 0}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Barra 3: Trashumancia & No Censo */}
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-amber-700 mb-1">
                                        <span>No en Censo o Fuera de Territorio</span>
                                        <span>
                                            -{resumenVotosReales.votos_brutos > 0 ? (((resumenVotosReales.no_en_censo + resumenVotosReales.trashumancia_municipio + resumenVotosReales.trashumancia_departamento) / resumenVotosReales.votos_brutos) * 100).toFixed(1) : 0}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-amber-500 h-full rounded-full"
                                            style={{
                                                width: `${resumenVotosReales.votos_brutos > 0 ? Math.min(100, ((resumenVotosReales.no_en_censo + resumenVotosReales.trashumancia_municipio + resumenVotosReales.trashumancia_departamento) / resumenVotosReales.votos_brutos) * 100) : 0}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Barra 4: VOTO REAL FINAL */}
                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 mt-4">
                                    <div className="flex justify-between text-xs font-black text-emerald-900">
                                        <span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-emerald-600" /> PISO ELECTORAL REAL COMPUTABLE</span>
                                        <span className="text-base text-emerald-700">{resumenVotosReales.votos_reales_computables?.toLocaleString() || 0} Votos</span>
                                    </div>
                                    <div className="w-full bg-emerald-200 h-4 rounded-full overflow-hidden">
                                        <div
                                            className="bg-emerald-600 h-full rounded-full transition-all duration-700"
                                            style={{ width: `${Math.min(100, resumenVotosReales.porcentaje_efectividad_real || 0)}%` }}
                                        />
                                    </div>
                                    <p className="text-[11px] text-emerald-800 leading-relaxed pt-1">
                                        Este es el número exacto de votantes habilitados legalmente para votar por su campaña en los puestos de votación de su circunscripción.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Ranking de Líderes por Calidad de Votos */}
                    {auditData?.rankingLideres && auditData.rankingLideres.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div>
                                    <h3 className="font-black text-slate-800 uppercase tracking-wide text-sm flex items-center gap-2">
                                        <Award size={18} className="text-yellow-500" /> Auditoría de Listas por Líder Territorial
                                    </h3>
                                    <p className="text-gray-400 text-xs mt-0.5">
                                        Efectividad real de cada líder: identifica quién trajo votos reales y quién aportó difuntos o trashumantes.
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 text-slate-600 font-black uppercase text-[10px] tracking-wider border-b">
                                        <tr>
                                            <th className="py-3 px-4">Líder Responsable</th>
                                            <th className="py-3 px-3 text-center">Total Aportados</th>
                                            <th className="py-3 px-3 text-center text-emerald-700 font-bold">Votos Reales</th>
                                            <th className="py-3 px-3 text-center text-rose-600 font-bold">Difuntos 💀</th>
                                            <th className="py-3 px-3 text-center text-orange-600 font-bold">Trashumantes</th>
                                            <th className="py-3 px-3 text-center text-amber-600 font-bold">No Censo</th>
                                            <th className="py-3 px-4 text-right">Efectividad</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 font-semibold text-slate-700">
                                        {auditData.rankingLideres.map((lider, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] flex items-center justify-center font-black">
                                                        {idx + 1}
                                                    </span>
                                                    {lider.lider_nombre}
                                                </td>
                                                <td className="py-3 px-3 text-center font-bold">{lider.total_aportados}</td>
                                                <td className="py-3 px-3 text-center font-black text-emerald-600 bg-emerald-50/40">
                                                    {lider.votos_reales}
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    {lider.difuntos > 0 ? (
                                                        <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-black text-[10px]">
                                                            💀 {lider.difuntos}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">0</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    {lider.trashumantes > 0 ? (
                                                        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                                            {lider.trashumantes}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">0</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3 text-center">
                                                    {lider.no_censo > 0 ? (
                                                        <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                                            {lider.no_censo}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">0</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className={`px-2.5 py-1 rounded-lg font-black text-xs ${
                                                        lider.tasa_limpieza >= 80
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : lider.tasa_limpieza >= 50
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-rose-100 text-rose-800'
                                                    }`}>
                                                        {lider.tasa_limpieza}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            )}

            {/* CONTENIDO PESTAÑA 3: DIRECTORIO OFICIAL DIVIPOLE (12.922 PUESTOS) */}
            {activeTab === 'divipole' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Banner DIVIPOLE */}
                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-2xl text-white shadow-2xl border border-indigo-900/40 relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-2 max-w-2xl">
                                <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                                    <Building size={14} /> Directorio Nacional Oficial DIVIPOLE
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black tracking-wide">
                                    Puestos de Votación Georreferenciados (Colombia)
                                </h2>
                                <p className="text-indigo-100/80 text-sm leading-relaxed">
                                    Base oficial de la <b>Registraduría Nacional del Estado Civil</b> con <b>{puestosTotal.toLocaleString()} puestos de votación</b> en los 33 departamentos y 1.121 municipios del país, con dirección oficial, comuna y coordenadas satelitales GPS.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl text-center">
                                    <div className="text-xs text-indigo-300 uppercase font-bold">Puestos Cargados</div>
                                    <div className="text-2xl font-black text-white">{puestosTotal.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Barra de Filtro y Búsqueda */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar puesto por nombre, colegio, dirección, barrio o comuna..."
                                    value={searchPuesto}
                                    onChange={(e) => setSearchPuesto(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') fetchPuestos(1); }}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-gray-800 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            <input
                                type="text"
                                placeholder="Filtrar Municipio (ej: Medellín, Bucaramanga...)"
                                value={filterMuni}
                                onChange={(e) => setFilterMuni(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') fetchPuestos(1); }}
                                className="w-full md:w-56 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 focus:outline-none focus:border-indigo-500 transition-colors"
                            />

                            <button
                                onClick={() => fetchPuestos(1)}
                                disabled={loadingPuestos}
                                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-400 text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                            >
                                <Search size={16} />
                                <span>{loadingPuestos ? 'Buscando...' : 'Buscar'}</span>
                            </button>

                            {(searchPuesto || filterMuni || filterDepto) && (
                                <button
                                    onClick={() => {
                                        setSearchPuesto('');
                                        setFilterMuni('');
                                        setFilterDepto('');
                                        fetchPuestos(1, '');
                                    }}
                                    className="px-4 py-2.5 border border-gray-200 text-gray-500 hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabla de Puestos DIVIPOLE */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                            <span className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
                                <Building size={16} className="text-indigo-600" />
                                <span>Puestos de Votación Oficiales Encontrados ({puestosTotal.toLocaleString()})</span>
                            </span>
                            <span className="text-xs text-gray-500 font-medium">
                                Página {pagePuesto} de {totalPagesPuesto}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-black uppercase text-gray-500 tracking-wider">
                                        <th className="py-3 px-4">Puesto / Escuela</th>
                                        <th className="py-3 px-4">Municipio / Depto</th>
                                        <th className="py-3 px-4">Comuna / Zona</th>
                                        <th className="py-3 px-4">Dirección Oficial</th>
                                        <th className="py-3 px-4 text-center">GPS</th>
                                        <th className="py-3 px-4 text-center">Cargos Habilitados</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                                    {loadingPuestos ? (
                                        <tr>
                                            <td colSpan="6" className="py-12 text-center text-gray-400 font-medium">
                                                Cargando directorio de puestos de votación...
                                            </td>
                                        </tr>
                                    ) : puestosList.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="py-12 text-center text-gray-400 font-medium">
                                                No se encontraron puestos con los filtros seleccionados.
                                            </td>
                                        </tr>
                                    ) : (
                                        puestosList.map((puesto) => (
                                            <tr key={puesto.id} className="hover:bg-indigo-50/30 transition-colors">
                                                <td className="py-3 px-4 font-bold text-slate-900">
                                                    {puesto.puesto}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="font-semibold text-slate-800">{puesto.municipio}</span>
                                                    <span className="block text-[11px] text-gray-400">{puesto.departamento}</span>
                                                </td>
                                                <td className="py-3 px-4 text-gray-500">
                                                    {puesto.comuna || 'Cabecera Municipal'}
                                                </td>
                                                <td className="py-3 px-4 text-gray-600 font-mono text-[11px]">
                                                    {puesto.direccion || 'Sin dirección registrada'}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {puesto.latitud && puesto.longitud ? (
                                                        <a
                                                            href={`https://www.google.com/maps?q=${puesto.latitud},${puesto.longitud}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-1 rounded-md font-bold transition-colors"
                                                            title="Ver ubicación en Google Maps"
                                                        >
                                                            <MapPin size={12} />
                                                            <span>Ver GPS</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-400">Sin GPS</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1 flex-wrap">
                                                        {puesto.alcalde && (
                                                            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold">ALC</span>
                                                        )}
                                                        {puesto.concejo && (
                                                            <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[9px] font-bold">CON</span>
                                                        )}
                                                        {puesto.gobernacion && (
                                                            <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-bold">GOB</span>
                                                        )}
                                                        {puesto.asamblea && (
                                                            <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold">ASA</span>
                                                        )}
                                                        {puesto.jal && (
                                                            <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[9px] font-bold">JAL</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-slate-50/50">
                            <button
                                onClick={() => fetchPuestos(Math.max(1, pagePuesto - 1))}
                                disabled={pagePuesto <= 1 || loadingPuestos}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors shadow-sm"
                            >
                                ← Anterior
                            </button>
                            <span className="text-xs font-semibold text-gray-600">
                                Página {pagePuesto} de {totalPagesPuesto}
                            </span>
                            <button
                                onClick={() => fetchPuestos(Math.min(totalPagesPuesto, pagePuesto + 1))}
                                disabled={pagePuesto >= totalPagesPuesto || loadingPuestos}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors shadow-sm"
                            >
                                Siguiente →
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
