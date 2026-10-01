import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Database, UploadCloud, Download, Search, CheckCircle,
    XCircle, AlertCircle, RefreshCw, ExternalLink, Copy, Check,
    FileSpreadsheet, Zap, Trash2, MapPin, Building, Hash
} from 'lucide-react';

const API = 'http://localhost:3000/api';

export default function CensoManagement() {
    const token = localStorage.getItem('token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // Estados de estadísticas
    const [stats, setStats] = useState({
        totalCenso: 0,
        totalVoters: 0,
        withPuesto: 0,
        withoutPuesto: 0,
        coveragePercent: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);

    // Estados de carga de archivo
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // Estados de autodiligenciamiento
    const [autoAssigning, setAutoAssigning] = useState(false);
    const [assignResult, setAssignResult] = useState(null);

    // Estados de búsqueda individual
    const [searchCedula, setSearchCedula] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchResult, setSearchResult] = useState(null);
    const [copied, setCopied] = useState(false);

    // Cargar estadísticas al inicio
    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const res = await axios.get(`${API}/censo/stats`, authHeaders);
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching censo stats:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    // ─── CARGA MASIVA ────────────────────────────────────────────────────────
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
            fetchStats();
        } catch (error) {
            setUploadResult({
                type: 'error',
                message: error.response?.data?.message || 'Error al procesar el archivo'
            });
        } finally {
            setUploading(false);
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
    );
}
