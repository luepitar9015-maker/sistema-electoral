import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCampaign } from '../context/CampaignContext';
import { colombiaData } from '../data/colombiaData';
import {
    Search, UserPlus, Users, UploadCloud, Download, CheckCircle,
    XCircle, AlertCircle, FileSpreadsheet, X, Zap, ExternalLink, Copy, Check,
    Flag, Globe, Building2, MapPin, Handshake, Quote, Award, Sparkles,
    ClipboardCheck, ClipboardPaste, Skull, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp, Trash2
} from 'lucide-react';
import { API } from '../config/api';

export default function RegisterVoter() {
    const { user } = useAuth();
    const { campaigns, activeCampaign, setActiveCampaign } = useCampaign();
    const token = localStorage.getItem('token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    const [activeTab, setActiveTab] = useState('friend'); // 'leader' | 'friend' | 'import'
    const [leaders, setLeaders] = useState([]);
    const [selectedLeader, setSelectedLeader] = useState(null);

    // Apoyos de la campaña activa
    const [campaignApoyos, setCampaignApoyos] = useState([]);
    const [selectedImportApoyo, setSelectedImportApoyo] = useState('');

    // Form data
    const [formData, setFormData] = useState({
        nombres: '', apellidos: '', cedula: '', direccion: '',
        lugar_votacion: '', mesa: '', departamento: '', municipio: '',
        lider_nombre: '', lider_cedula: '',
        campana_id: activeCampaign?.id || '',
        apoyo_id: ''
    });
    const [message, setMessage] = useState({ text: '', type: '' });
    const [municipios, setMunicipios] = useState([]);

    // Censo Lookup & Registraduría states
    const [censoLoading, setCensoLoading] = useState(false);
    const [censoInfo, setCensoInfo] = useState(null);
    const [censoNotFound, setCensoNotFound] = useState(false);
    const [trashumanciaInfo, setTrashumanciaInfo] = useState(null);
    const [copiedReg, setCopiedReg] = useState(false);

    // Carga Masiva states (Pegado Rápido + Archivo Excel)
    const [importMode, setImportMode] = useState('paste'); // 'paste' | 'file'
    const [pastedText, setPastedText] = useState('');
    const [pastedRowsCount, setPastedRowsCount] = useState(0);
    const [selectedImportLeader, setSelectedImportLeader] = useState('');
    const [autoAuditarImport, setAutoAuditarImport] = useState(true);
    const [quickImporting, setQuickImporting] = useState(false);
    const [quickImportResult, setQuickImportResult] = useState(null);
    const [showErrorDetails, setShowErrorDetails] = useState(false);

    // Import file state
    const [importFile, setImportFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (activeTab === 'friend' || activeTab === 'import') fetchLeaders();
        else {
            setFormData(prev => ({ ...prev, lider_nombre: '', lider_cedula: '' }));
            setSelectedLeader(null);
        }
    }, [activeTab, activeCampaign?.id]);

    // Cargar apoyos cuando cambie la campaña seleccionada
    const fetchCampaignApoyos = async (campId) => {
        if (!campId) {
            setCampaignApoyos([]);
            return;
        }
        try {
            const res = await axios.get(`${API}/apoyos/campaign/${campId}`, authHeaders);
            setCampaignApoyos(res.data);
        } catch (err) {
            console.error('Error cargando apoyos de la campaña:', err);
            setCampaignApoyos([]);
        }
    };

    // Sincronizar con la campaña activa y ajustar territorio según nivel
    useEffect(() => {
        if (activeCampaign) {
            setFormData(prev => {
                const nextDept = activeCampaign.nivel_territorial !== 'nacional' ? activeCampaign.departamento : prev.departamento;
                const nextMuni = activeCampaign.nivel_territorial === 'municipal' ? activeCampaign.municipio : prev.municipio;
                return {
                    ...prev,
                    campana_id: activeCampaign.id,
                    departamento: nextDept || prev.departamento,
                    municipio: nextMuni || prev.municipio
                };
            });
            if (activeCampaign.departamento && colombiaData[activeCampaign.departamento]) {
                setMunicipios(colombiaData[activeCampaign.departamento]?.sort() || []);
            }
            fetchCampaignApoyos(activeCampaign.id);
        } else {
            setCampaignApoyos([]);
        }
    }, [activeCampaign]);

    const fetchLeaders = async () => {
        try {
            const campQuery = activeCampaign?.id ? `?campana_id=${activeCampaign.id}` : '';
            const res = await axios.get(`${API}/voters/leaders${campQuery}`, authHeaders);
            setLeaders(res.data);
        } catch (error) { console.error('Error fetching leaders', error); }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'departamento') {
            setMunicipios(colombiaData[value]?.sort() || []);
            setFormData(prev => ({ ...prev, departamento: value, municipio: '' }));
        }
        if (name === 'campana_id') {
            fetchCampaignApoyos(value);
        }
    };

    const handleLeaderSelect = (e) => {
        const leaderId = e.target.value;
        if (!leaderId) {
            setSelectedLeader(null);
            setFormData(prev => ({ ...prev, lider_nombre: '', lider_cedula: '' }));
            return;
        }
        const leader = leaders.find(l => l.id === parseInt(leaderId));
        setSelectedLeader(leader);
        setFormData(prev => ({
            ...prev,
            lider_nombre: `${leader.nombres} ${leader.apellidos}`,
            lider_cedula: leader.cedula,
            departamento: leader.departamento,
            municipio: leader.municipio,
            lugar_votacion: leader.lugar_votacion,
            direccion: ''
        }));
        setMunicipios(colombiaData[leader.departamento]?.sort() || []);
    };

    // Autodiligenciamiento desde Censo Local
    const handleLookupCenso = async (cedulaToSearch) => {
        const cleanCed = String(cedulaToSearch || formData.cedula || '').replace(/\D/g, '').trim();
        if (!cleanCed || cleanCed.length < 4) return;

        setCensoLoading(true);
        setCensoNotFound(false);
        setCensoInfo(null);

        try {
            const campQuery = activeCampaign?.id ? `?campana_id=${activeCampaign.id}` : '';
            const res = await axios.get(`${API}/censo/lookup/${cleanCed}${campQuery}`, authHeaders);
            if (res.data.trashumancia) {
                setTrashumanciaInfo(res.data.trashumancia);
            } else {
                setTrashumanciaInfo(null);
            }

            if (res.data.found) {
                const data = res.data.data;
                setCensoInfo(data);
                setCensoNotFound(false);

                // Autodiligenciar campos
                setFormData(prev => ({
                    ...prev,
                    departamento: data.departamento || prev.departamento,
                    municipio: data.municipio || prev.municipio,
                    lugar_votacion: data.puesto_votacion || data.lugar_votacion || prev.lugar_votacion,
                    mesa: data.mesa || prev.mesa,
                    direccion: prev.direccion || data.direccion || '',
                    nombres: prev.nombres || data.nombres || '',
                    apellidos: prev.apellidos || data.apellidos || ''
                }));

                if (data.departamento && colombiaData[data.departamento]) {
                    setMunicipios(colombiaData[data.departamento]?.sort() || []);
                }
            } else {
                setCensoNotFound(true);
                setCensoInfo(null);
            }
        } catch (error) {
            console.error('Error buscando en censo:', error);
            setCensoNotFound(true);
            setTrashumanciaInfo(null);
        } finally {
            setCensoLoading(false);
        }
    };

    // Asistente Semi-Automático Registraduría
    const handleOpenRegistraduria = () => {
        const cleanCed = String(formData.cedula || '').replace(/\D/g, '').trim();
        if (cleanCed) {
            navigator.clipboard.writeText(cleanCed);
            setCopiedReg(true);
            setTimeout(() => setCopiedReg(false), 4000);
        }
        window.open('https://wsp.registraduria.gov.co/censo/consultar/', '_blank', 'noopener,noreferrer');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        try {
            await axios.post(`${API}/voters`, {
                ...formData,
                isLeader: activeTab === 'leader',
                campana_id: activeCampaign?.id || formData.campana_id || null,
                apoyo_id: formData.apoyo_id || null
            }, authHeaders);

            setMessage({ text: `Registro de ${activeTab === 'leader' ? 'Líder' : 'Votante'} guardado exitosamente en la campaña`, type: 'success' });
            setFormData(prev => ({
                ...prev,
                nombres: '', apellidos: '', cedula: '', direccion: '', lugar_votacion: '', mesa: '',
                lider_nombre: '', lider_cedula: ''
            }));
            setSelectedLeader(null);
            setCensoInfo(null);
            setCensoNotFound(false);
            if (activeTab === 'leader') fetchLeaders();
        } catch (error) {
            setMessage({ text: error.response?.data?.message || 'Error al crear registro', type: 'error' });
        }
    };

    // ─── IMPORTACIÓN ────────────────────────────────────────────────────────────
    const handleDownloadTemplate = async () => {
        try {
            const res = await axios.get(`${API}/voters/template`, {
                ...authHeaders,
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'plantilla_votantes.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert('Error al descargar la plantilla: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
            setImportFile(file);
            setImportResult(null);
        } else {
            alert('Por favor selecciona un archivo Excel (.xlsx o .xls)');
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImportFile(file);
            setImportResult(null);
        }
    };

    const handlePastedTextChange = (text) => {
        setPastedText(text);
        if (!text || !text.trim()) {
            setPastedRowsCount(0);
            return;
        }
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        let count = 0;
        lines.forEach((l, idx) => {
            const lower = l.toLowerCase();
            if (idx === 0 && (lower.includes('ced') || lower.includes('nom') || lower.includes('ape'))) return;
            if (/\d{4,}/.test(l) || l.includes('\t') || l.includes(';')) count++;
        });
        setPastedRowsCount(count || lines.length);
    };

    const handleQuickImport = async () => {
        if (!pastedText.trim()) return;
        setQuickImporting(true);
        setQuickImportResult(null);

        try {
            let leaderObj = null;
            if (selectedImportLeader) {
                leaderObj = leaders.find(l => String(l.id) === String(selectedImportLeader));
            }

            const payload = {
                text: pastedText,
                campana_id: activeCampaign?.id || null,
                apoyo_id: selectedImportApoyo ? parseInt(selectedImportApoyo, 10) : null,
                lider_nombre: leaderObj ? `${leaderObj.nombres} ${leaderObj.apellidos}`.trim() : null,
                lider_cedula: leaderObj ? leaderObj.cedula : null,
                auto_auditar: autoAuditarImport
            };

            const res = await axios.post(`${API}/voters/quick-import`, payload, authHeaders);
            setQuickImportResult({ type: 'success', ...res.data });
        } catch (error) {
            setQuickImportResult({
                type: 'error',
                message: error.response?.data?.message || 'Error al procesar el pegado rápido',
                errors: error.response?.data?.errors || []
            });
        } finally {
            setQuickImporting(false);
        }
    };

    const handleImport = async () => {
        if (!importFile) return;
        setImporting(true);
        setImportResult(null);

        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', importFile);
            if (activeCampaign?.id) {
                formDataUpload.append('campana_id', activeCampaign.id);
            }
            if (selectedImportApoyo) {
                formDataUpload.append('apoyo_id', selectedImportApoyo);
            }
            if (selectedImportLeader) {
                const leaderObj = leaders.find(l => String(l.id) === String(selectedImportLeader));
                if (leaderObj) {
                    formDataUpload.append('lider_nombre', `${leaderObj.nombres} ${leaderObj.apellidos}`.trim());
                    formDataUpload.append('lider_cedula', leaderObj.cedula);
                }
            }
            formDataUpload.append('auto_auditar', autoAuditarImport);

            const res = await axios.post(`${API}/voters/import`, formDataUpload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setImportResult({ type: 'success', ...res.data });
        } catch (error) {
            setImportResult({
                type: 'error',
                message: error.response?.data?.message || 'Error al importar el archivo',
                errors: error.response?.data?.errors || []
            });
        } finally {
            setImporting(false);
        }
    };

    const clearImport = () => {
        setImportFile(null);
        setImportResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const clearPasted = () => {
        setPastedText('');
        setPastedRowsCount(0);
        setQuickImportResult(null);
    };

    // ─── RENDER ─────────────────────────────────────────────────────────────────
    const tabStyle = (tab, color) =>
        `flex-1 py-3 px-4 rounded-xl flex items-center justify-center space-x-2 font-bold transition-all text-xs uppercase tracking-wider
        ${activeTab === tab ? `${color} text-white shadow-md` : 'text-gray-500 hover:bg-gray-100'}`;

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            {/* BANNER DE CAMPAÑA ACTIVA */}
            {activeCampaign ? (
                <div
                    className="p-5 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border"
                    style={{
                        background: `linear-gradient(135deg, #1E232A 0%, ${activeCampaign.color || '#00B894'}22 100%)`,
                        borderColor: `${activeCampaign.color || '#00B894'}44`
                    }}
                >
                    <div className="flex items-center gap-4">
                        {activeCampaign.foto_candidato ? (
                            <img
                                src={activeCampaign.foto_candidato}
                                alt={activeCampaign.candidato}
                                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shadow-lg flex-shrink-0"
                            />
                        ) : (
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg flex-shrink-0"
                                style={{ backgroundColor: activeCampaign.color || '#00B894' }}
                            >
                                {activeCampaign.candidato?.charAt(0) || 'C'}
                            </div>
                        )}

                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-md backdrop-blur-sm">
                                    {activeCampaign.tipo_cargo.toUpperCase()}
                                </span>
                                <span className="text-gray-300 text-xs font-semibold">
                                    · {activeCampaign.candidato}
                                </span>
                            </div>

                            <h2 className="text-lg font-black uppercase tracking-wide text-white mt-0.5">
                                {activeCampaign.nombre}
                            </h2>

                            {activeCampaign.eslogan && (
                                <p className="text-xs text-emerald-300 italic font-medium mt-0.5 flex items-center gap-1.5">
                                    <Quote size={12} className="flex-shrink-0" />
                                    <span>"{activeCampaign.eslogan}"</span>
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/15 text-center">
                            <span className="text-[10px] text-gray-300 uppercase block font-bold">Territorio</span>
                            <span className="text-xs font-black text-white">
                                {activeCampaign.nivel_territorial === 'nacional'
                                    ? 'Nacional'
                                    : activeCampaign.nivel_territorial === 'departamental'
                                        ? activeCampaign.departamento
                                        : `${activeCampaign.municipio}, ${activeCampaign.departamento}`}
                            </span>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/15 text-center">
                            <span className="text-[10px] text-gray-300 uppercase block font-bold">Apoyos Activos</span>
                            <span className="text-xs font-black text-emerald-400">
                                {campaignApoyos.length} Aliados
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
                        <span>
                            <strong>No hay campaña seleccionada.</strong> Los registros quedarán en el censo general sin asociar a una campaña específica.
                        </span>
                    </div>
                    <a
                        href="/campaigns"
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl uppercase text-[10px] tracking-wider transition-all flex-shrink-0"
                    >
                        Seleccionar Campaña
                    </a>
                </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 flex gap-1.5">
                <button onClick={() => setActiveTab('friend')} className={tabStyle('friend', 'bg-[#2D3436]')}>
                    <Users size={16} /><span>REGISTRAR VOTANTE</span>
                </button>
                <button onClick={() => setActiveTab('leader')} className={tabStyle('leader', 'bg-[#00B894]')}>
                    <UserPlus size={16} /><span>REGISTRAR LÍDER</span>
                </button>
                <button onClick={() => setActiveTab('import')} className={tabStyle('import', 'bg-blue-600')}>
                    <UploadCloud size={16} /><span>CARGA MASIVA & AUDITORÍA</span>
                </button>
            </div>

            {/* ─── VISTA CARGA MASIVA & AUDITORÍA INTELIGENTE ─────────────── */}
            {activeTab === 'import' && (
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-6 text-white relative overflow-hidden">
                        <div className="absolute right-0 top-0 translate-x-8 -translate-y-4 opacity-10 pointer-events-none">
                            <UploadCloud size={180} />
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                            <div>
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                        <Zap size={11} className="text-amber-400" />
                                        <span>Procesamiento Masivo Ultrarrápido</span>
                                    </span>
                                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                        <MapPin size={11} />
                                        <span>12.922 Puestos DIVIPOLE</span>
                                    </span>
                                    <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                        <ShieldAlert size={11} />
                                        <span>Filtro de Difuntos RNEC</span>
                                    </span>
                                </div>
                                <h2 className="text-xl font-black uppercase tracking-wide flex items-center gap-2.5">
                                    <UploadCloud size={24} className="text-blue-400" />
                                    <span>Carga Masiva & Auditoría de Votantes</span>
                                </h2>
                                <p className="text-blue-200 text-xs mt-1 max-w-2xl">
                                    {activeCampaign
                                        ? `Votantes vinculados a la campaña: ${activeCampaign.nombre}. Registra masivamente cientos de personas en segundos sin guardar archivos.`
                                        : 'Registra masivamente cientos de simpatizantes en segundos con georreferenciación y auditoría forense inmediata.'}
                                </p>
                            </div>
                        </div>

                        {/* Selector de Modalidad */}
                        <div className="flex gap-2 mt-6 border-b border-white/10 pb-0">
                            <button
                                type="button"
                                onClick={() => { setImportMode('paste'); setImportResult(null); }}
                                className={`flex items-center gap-2 px-5 py-3 font-bold text-xs uppercase tracking-wider rounded-t-2xl transition-all ${
                                    importMode === 'paste'
                                        ? 'bg-white text-slate-900 shadow-md border-t-2 border-blue-500'
                                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                                }`}
                            >
                                <ClipboardPaste size={15} className={importMode === 'paste' ? 'text-blue-600' : ''} />
                                <span>Pegado Rápido (Ctrl + V)</span>
                                <span className="bg-amber-400 text-slate-900 text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase">
                                    ⭐ Más Rápido
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setImportMode('file'); setQuickImportResult(null); }}
                                className={`flex items-center gap-2 px-5 py-3 font-bold text-xs uppercase tracking-wider rounded-t-2xl transition-all ${
                                    importMode === 'file'
                                        ? 'bg-white text-slate-900 shadow-md border-t-2 border-blue-500'
                                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                                }`}
                            >
                                <FileSpreadsheet size={15} className={importMode === 'file' ? 'text-emerald-600' : ''} />
                                <span>Subir Archivo Excel (.xlsx)</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">

                        {/* PANEL DE CONFIGURACIÓN GLOBAL DEL LOTE */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                                        <Sparkles size={15} className="text-amber-500" />
                                        <span>Configuración de Inteligencia y Auditoría Automática</span>
                                    </h3>
                                    <p className="text-slate-500 text-[11px] mt-0.5">
                                        Parámetros aplicados al procesar el lote completo de votantes.
                                    </p>
                                </div>
                                <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={autoAuditarImport}
                                        onChange={e => setAutoAuditarImport(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                    />
                                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                        <Zap size={13} className="text-amber-500" />
                                        <span>Auditar con DIVIPOLE & Censo</span>
                                    </span>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Selector de Líder Común para el Lote */}
                                <div>
                                    <label className="block text-slate-700 font-bold mb-1.5 text-xs uppercase flex items-center gap-1.5">
                                        <Users size={14} className="text-blue-600" />
                                        <span>Asignar a un Líder General (Opcional)</span>
                                    </label>
                                    <select
                                        value={selectedImportLeader}
                                        onChange={e => setSelectedImportLeader(e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="">-- Sin Líder Fijo (o tomar de la columna de cada fila) --</option>
                                        {leaders.map(l => (
                                            <option key={l.id} value={l.id}>
                                                {l.nombres} {l.apellidos} - {l.municipio} ({l.departamento}) [CC: {l.cedula}]
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-slate-400 text-[10px] mt-1">
                                        Si seleccionas un líder, las personas sin líder asignado se le acreditarán a él.
                                    </p>
                                </div>

                                {/* Selector de Apoyo Político (Opcional) */}
                                {campaignApoyos.length > 0 && (
                                    <div>
                                        <label className="block text-emerald-950 font-bold mb-1.5 text-xs uppercase flex items-center gap-1.5">
                                            <Handshake size={14} className="text-emerald-600" />
                                            <span>Asignar a Apoyo Político / Aliado (Opcional)</span>
                                        </label>
                                        <select
                                            value={selectedImportApoyo}
                                            onChange={e => setSelectedImportApoyo(e.target.value)}
                                            className="w-full bg-white border border-emerald-300 rounded-xl p-2.5 text-xs font-bold text-emerald-950 focus:outline-none focus:border-emerald-600"
                                        >
                                            <option value="">-- Sin Apoyo Específico (Campaña General) --</option>
                                            {campaignApoyos.map(a => (
                                                <option key={a.id} value={a.id}>
                                                    {a.nombre} [{a.cargo_o_rol || a.tipo_apoyo}] - Meta: {a.compromiso_votos} votos
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-emerald-700 text-[10px] mt-1">
                                            Acredita el cumplimiento de la meta pactada para este aliado.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {autoAuditarImport && (
                                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
                                    <CheckCircle2 size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div className="leading-snug text-[11px]">
                                        <strong>Auditoría Forense Activa:</strong> Si el listado sólo tiene Cédula y Nombres, el sistema cruzará con los <strong>12.922 puestos DIVIPOLE</strong> y el Censo Oficial para asignar puesto, mesa y coordenadas. Además, <strong>neutralizará automáticamente cédulas de personas fallecidas en RNEC</strong> y alertará duplicados territoriales.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ────────── MODO 1: PEGADO RÁPIDO (CTRL + V) ────────── */}
                        {importMode === 'paste' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ClipboardPaste size={18} className="text-blue-600" />
                                        <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">
                                            Área de Pegado Directo (Copia en Excel y Pega Aquí con Ctrl + V)
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {pastedRowsCount > 0 && (
                                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wide flex items-center gap-1.5 animate-pulse">
                                                <Zap size={13} className="text-emerald-600" />
                                                <span>⚡ {pastedRowsCount} Votantes Detectados</span>
                                            </span>
                                        )}
                                        {pastedText && (
                                            <button
                                                type="button"
                                                onClick={clearPasted}
                                                className="text-slate-400 hover:text-rose-500 text-xs font-bold flex items-center gap-1 p-1 transition-colors"
                                                title="Limpiar texto"
                                            >
                                                <Trash2 size={14} />
                                                <span>Limpiar</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="relative">
                                    <textarea
                                        value={pastedText}
                                        onChange={e => handlePastedTextChange(e.target.value)}
                                        rows={9}
                                        placeholder={`Copia filas directamente desde Excel, Google Sheets, un PDF o WhatsApp y pégalas aquí (Ctrl + V)...

Ejemplo de columnas reconocidas automáticamente:
1098765432	Carlos	Pérez	Calle 10 # 5-20	Colegio San José
78945612	María	Gómez	Carrera 15 # 40-10	Escuela Central
52123456	Pedro	Rodríguez

* Puedes incluir encabezados o simplemente pegar los datos. El motor inteligente detecta la cédula y autodiligencia los puestos si tienes activa la auditoría DIVIPOLE.`}
                                        className="w-full font-mono text-xs p-4 rounded-2xl bg-slate-900 text-slate-100 placeholder:text-slate-500 border border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-inner resize-y leading-relaxed"
                                    />
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                                    <div className="text-[11px] text-slate-500">
                                        💡 <strong>Tip Pro:</strong> Puedes pegar listas de 10, 50 o 500 votantes de un solo golpe. El sistema los procesa en milisegundos en bloque.
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleQuickImport}
                                        disabled={quickImporting || pastedRowsCount === 0}
                                        className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 disabled:from-slate-300 disabled:to-slate-300 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-95"
                                    >
                                        {quickImporting ? (
                                            <>
                                                <Zap size={16} className="animate-spin text-amber-300" />
                                                <span>Procesando y Auditando {pastedRowsCount} Votantes...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Zap size={16} className="text-amber-300" />
                                                <span>⚡ Procesar e Importar {pastedRowsCount > 0 ? `(${pastedRowsCount})` : ''} Ahora</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* RESULTADOS DEL PEGADO RÁPIDO */}
                                {quickImportResult && (
                                    <div className={`p-6 rounded-3xl border transition-all ${
                                        quickImportResult.type === 'success'
                                            ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
                                            : 'bg-rose-50 border-rose-200'
                                    }`}>
                                        <div className="flex items-center justify-between gap-3 mb-4">
                                            <h4 className="font-black text-sm uppercase tracking-wide flex items-center gap-2">
                                                {quickImportResult.type === 'success' ? (
                                                    <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
                                                ) : (
                                                    <XCircle size={20} className="text-rose-600 flex-shrink-0" />
                                                )}
                                                <span className={quickImportResult.type === 'success' ? 'text-emerald-950' : 'text-rose-950'}>
                                                    {quickImportResult.message}
                                                </span>
                                            </h4>
                                            {quickImportResult.type === 'success' && (
                                                <button
                                                    type="button"
                                                    onClick={clearPasted}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase px-3 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 flex-shrink-0"
                                                >
                                                    <ClipboardPaste size={13} />
                                                    <span>Pegar Siguiente Lote</span>
                                                </button>
                                            )}
                                        </div>

                                        {quickImportResult.type === 'success' && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                                                <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-sm">
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Guardados con Éxito</span>
                                                    <span className="text-2xl font-black text-emerald-600">{quickImportResult.success || 0}</span>
                                                    <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">Votos computables</span>
                                                </div>
                                                <div className="bg-white p-3.5 rounded-2xl border border-blue-200 shadow-sm">
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Puestos Autodiligenciados</span>
                                                    <span className="text-2xl font-black text-blue-600">{quickImportResult.puestosAsignados || 0}</span>
                                                    <span className="text-[10px] text-blue-700 font-semibold block mt-0.5">Vía DIVIPOLE / Censo</span>
                                                </div>
                                                <div className="bg-white p-3.5 rounded-2xl border border-rose-200 shadow-sm">
                                                    <span className="text-[10px] text-rose-500 font-bold uppercase block flex items-center justify-center gap-1">
                                                        <Skull size={12} className="text-rose-600" />
                                                        <span>Difuntos Neutralizados</span>
                                                    </span>
                                                    <span className="text-2xl font-black text-rose-600">{quickImportResult.defunciones || 0}</span>
                                                    <span className="text-[10px] text-rose-700 font-semibold block mt-0.5">Bajas por RNEC</span>
                                                </div>
                                                <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-sm">
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Duplicados Prevenidos</span>
                                                    <span className="text-2xl font-black text-amber-600">{quickImportResult.duplicates || 0}</span>
                                                    <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">Ya existentes</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Acordeón de Errores o Advertencias */}
                                        {quickImportResult.errors && quickImportResult.errors.length > 0 && (
                                            <div className="mt-4 pt-3 border-t border-slate-200/80">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowErrorDetails(prev => !prev)}
                                                    className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
                                                >
                                                    <span className="flex items-center gap-1.5">
                                                        <AlertCircle size={14} className="text-amber-600" />
                                                        <span>Ver detalle de {quickImportResult.errors.length} observaciones y advertencias</span>
                                                    </span>
                                                    {showErrorDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </button>

                                                {showErrorDetails && (
                                                    <div className="mt-3 max-h-48 overflow-y-auto space-y-1.5 pr-1">
                                                        {quickImportResult.errors.map((err, idx) => (
                                                            <div key={idx} className="p-2 bg-white rounded-xl border border-slate-200 text-[11px] flex items-center justify-between gap-2">
                                                                <span className="font-mono font-bold text-slate-800">
                                                                    Fila {err.fila} · CC: {err.cedula}
                                                                </span>
                                                                <span className="text-slate-600 text-right">
                                                                    {err.mensaje}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ────────── MODO 2: SUBIR ARCHIVO EXCEL ────────── */}
                        {importMode === 'file' && (
                            <div className="space-y-6">
                                {/* Paso 1: Descargar plantilla */}
                                <div className="flex items-start gap-4 p-5 bg-blue-50/70 rounded-2xl border border-blue-100">
                                    <div className="flex-shrink-0 w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-sm">1</div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wide mb-1">Descarga la Plantilla Oficial</h3>
                                        <p className="text-gray-500 text-xs mb-3">
                                            Usa nuestra plantilla oficial en Excel (.xlsx) con columnas para nombres, apellidos, cédula, dirección, lugar de votación y líder.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleDownloadTemplate}
                                            className="flex items-center gap-2 bg-white border border-blue-300 text-blue-700 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                                        >
                                            <Download size={14} />
                                            <span>Descargar Plantilla Excel (.xlsx)</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Paso 2: Subir archivo */}
                                <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-200">
                                    <div className="flex-shrink-0 w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-white font-black text-sm">2</div>
                                    <div className="flex-1 space-y-3">
                                        <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wide">Sube el Archivo Diligenciado</h3>

                                        <div
                                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                            onDragLeave={() => setDragOver(false)}
                                            onDrop={handleFileDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-blue-500 bg-blue-50' : importFile ? 'border-emerald-400 bg-emerald-50/40' : 'border-gray-300 hover:border-blue-400 bg-white'}`}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".xlsx,.xls"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />
                                            {importFile ? (
                                                <div className="flex items-center justify-center gap-3">
                                                    <FileSpreadsheet size={28} className="text-emerald-600" />
                                                    <div className="text-left">
                                                        <p className="font-bold text-xs text-gray-800">{importFile.name}</p>
                                                        <p className="text-[10px] text-gray-400">{(importFile.size / 1024).toFixed(1)} KB</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); clearImport(); }}
                                                        className="ml-4 p-1 text-gray-400 hover:text-rose-500"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <UploadCloud size={36} className="mx-auto text-gray-400" />
                                                    <p className="text-xs font-bold text-gray-700">Arrastra tu archivo Excel aquí o haz clic para examinar</p>
                                                    <p className="text-[11px] text-gray-400">Formatos soportados: .xlsx, .xls (máximo 10 MB)</p>
                                                </div>
                                            )}
                                        </div>

                                        {importFile && (
                                            <div className="flex justify-end gap-3 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={clearImport}
                                                    className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 uppercase"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleImport}
                                                    disabled={importing}
                                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all flex items-center gap-2"
                                                >
                                                    {importing ? (
                                                        <>
                                                            <Zap size={14} className="animate-spin text-amber-300" />
                                                            <span>Procesando y Auditando...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UploadCloud size={14} />
                                                            <span>Importar Votantes</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Resultado de la importación archivo */}
                                {importResult && (
                                    <div className={`p-6 rounded-3xl border ${importResult.type === 'success' ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                                        <h4 className="font-black text-sm uppercase tracking-wide flex items-center gap-2 mb-3">
                                            {importResult.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600" /> : <XCircle size={18} className="text-rose-600" />}
                                            <span className={importResult.type === 'success' ? 'text-emerald-950' : 'text-rose-950'}>{importResult.message}</span>
                                        </h4>

                                        {importResult.type === 'success' && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center mt-3">
                                                <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-sm">
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Guardados</span>
                                                    <span className="text-2xl font-black text-emerald-600">{importResult.success || 0}</span>
                                                </div>
                                                <div className="bg-white p-3 rounded-2xl border border-blue-100 shadow-sm">
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Puestos Asignados</span>
                                                    <span className="text-2xl font-black text-blue-600">{importResult.puestosAsignados || 0}</span>
                                                </div>
                                                <div className="bg-white p-3 rounded-2xl border border-rose-100 shadow-sm">
                                                    <span className="text-[10px] text-rose-500 font-bold uppercase block flex items-center justify-center gap-1">
                                                        <Skull size={11} className="text-rose-600" />
                                                        <span>Difuntos</span>
                                                    </span>
                                                    <span className="text-2xl font-black text-rose-600">{importResult.defunciones || 0}</span>
                                                </div>
                                                <div className="bg-white p-3 rounded-2xl border border-amber-100 shadow-sm">
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Duplicados</span>
                                                    <span className="text-2xl font-black text-amber-600">{importResult.duplicates || 0}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            )}

            {/* ─── FORMULARIO INDIVIDUAL ────────────────────────────────── */}
            {activeTab !== 'import' && (
                <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-2.5 h-full ${activeTab === 'leader' ? 'bg-[#00B894]' : 'bg-[#2D3436]'}`}></div>

                    <h2 className={`text-base font-black mb-6 border-b pb-3 uppercase tracking-wider flex items-center gap-2 ${activeTab === 'leader' ? 'text-[#00B894]' : 'text-[#2D3436]'}`}>
                        {activeTab === 'leader' ? <UserPlus size={18} /> : <Users size={18} />}
                        <span>{activeTab === 'leader' ? 'Registrar Nuevo Líder de Campaña' : 'Registrar Votante / Simpatizante'}</span>
                    </h2>

                    {message.text && (
                        <div className={`p-4 mb-6 rounded-2xl font-bold text-xs flex items-center ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                            {message.type === 'success' ? <CheckCircle size={16} className="mr-2 text-emerald-600 flex-shrink-0" /> : <XCircle size={16} className="mr-2 text-rose-600 flex-shrink-0" />}
                            <span>{message.text}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Selector de Líder Referente */}
                        {activeTab === 'friend' && (
                            <div className="col-span-2 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                <label className="block text-gray-700 font-bold mb-2 text-xs uppercase flex items-center">
                                    <Search size={14} className="mr-1.5 text-gray-500" /> Seleccionar Líder Referente (Opcional)
                                </label>
                                <select
                                    onChange={handleLeaderSelect}
                                    value={selectedLeader?.id || ''}
                                    className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#2D3436]"
                                >
                                    <option value="">-- SIN LÍDER REFERENTE O SELECCIONE DE LA LISTA --</option>
                                    {leaders.map(l => (
                                        <option key={l.id} value={l.id}>
                                            {l.nombres} {l.apellidos} - {l.municipio} ({l.departamento})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-gray-400 text-[11px] mt-1 italic">
                                    * Al seleccionar un líder, se copiarán automáticamente su municipio y puesto de votación.
                                </p>
                            </div>
                        )}

                        {/* Selector de Apoyo Político / Aliado */}
                        {campaignApoyos.length > 0 && (
                            <div className="col-span-2 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200">
                                <label className="block text-emerald-950 font-bold mb-1.5 text-xs uppercase flex items-center gap-1.5">
                                    <Handshake size={14} className="text-emerald-600" />
                                    <span>Apoyo Político / Aliado que refiere al Votante (Opcional)</span>
                                </label>
                                <select
                                    name="apoyo_id"
                                    value={formData.apoyo_id || ''}
                                    onChange={handleChange}
                                    className="w-full bg-white border border-emerald-300 rounded-xl p-2.5 text-xs font-bold text-emerald-950 focus:outline-none"
                                >
                                    <option value="">-- Sin Apoyo Específico (Campaña General) --</option>
                                    {campaignApoyos.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.nombre} [{a.cargo_o_rol || a.tipo_apoyo}] - Meta: {a.compromiso_votos} votos
                                        </option>
                                    ))}
                                </select>
                                <p className="text-emerald-700 text-[11px] mt-1">
                                    Vincular a este aliado político contabilizará este votante en el cumplimiento de su meta pactada.
                                </p>
                            </div>
                        )}

                        <div className="col-span-2">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1">
                                Datos Personales del Votante
                            </h3>
                        </div>

                        <div>
                            <label className="block text-gray-600 font-bold mb-1.5 text-xs uppercase">Nombres *</label>
                            <input
                                type="text"
                                name="nombres"
                                value={formData.nombres}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#00B894]"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-600 font-bold mb-1.5 text-xs uppercase">Apellidos *</label>
                            <input
                                type="text"
                                name="apellidos"
                                value={formData.apellidos}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#00B894]"
                                required
                            />
                        </div>

                        {/* Cédula con Autodiligenciamiento */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-gray-600 font-bold text-xs uppercase">Cédula de Ciudadanía *</label>
                                {formData.cedula && (
                                    <button
                                        type="button"
                                        onClick={() => handleLookupCenso(formData.cedula)}
                                        disabled={censoLoading}
                                        className="text-[#00B894] hover:text-[#009275] font-black text-xs uppercase flex items-center gap-1 transition-colors"
                                    >
                                        <Zap size={13} className={censoLoading ? 'animate-spin' : ''} />
                                        <span>{censoLoading ? 'Buscando...' : 'Autodiligenciar'}</span>
                                    </button>
                                )}
                            </div>
                            <input
                                type="text"
                                name="cedula"
                                value={formData.cedula}
                                onChange={(e) => {
                                    handleChange(e);
                                    setCensoInfo(null);
                                    setCensoNotFound(false);
                                }}
                                onBlur={(e) => {
                                    if (e.target.value && e.target.value.length >= 5 && !censoInfo) {
                                        handleLookupCenso(e.target.value);
                                    }
                                }}
                                placeholder="Ej. 1012345678"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono font-bold text-gray-800 focus:outline-none focus:border-[#00B894]"
                                required
                            />

                            {/* Semáforo de Trashumancia y Consistencia Territorial */}
                            {trashumanciaInfo && (
                                <div className={`mt-2 p-3 rounded-2xl border text-xs flex flex-col gap-1 transition-all ${
                                    trashumanciaInfo.estado_trashumancia === 'valido'
                                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900'
                                        : trashumanciaInfo.estado_trashumancia === 'alerta_municipio'
                                            ? 'bg-amber-500/15 border-amber-500/50 text-amber-950 font-medium'
                                            : trashumanciaInfo.estado_trashumancia === 'alerta_departamento'
                                                ? 'bg-rose-500/15 border-rose-500/50 text-rose-950 font-medium'
                                                : 'bg-slate-100 border-slate-300 text-slate-800'
                                }`}>
                                    <div className="flex items-center gap-1.5 font-black uppercase text-[11px] tracking-wide">
                                        {trashumanciaInfo.estado_trashumancia === 'valido' && <span>🟢 Voto Territorial Válido</span>}
                                        {trashumanciaInfo.estado_trashumancia === 'alerta_municipio' && <span>🟡 Alerta: Vota en otro Municipio</span>}
                                        {trashumanciaInfo.estado_trashumancia === 'alerta_departamento' && <span>🔴 Alerta de Trashumancia: Vota en otro Dpto</span>}
                                        {trashumanciaInfo.estado_trashumancia === 'no_en_censo' && <span>⚪ Cédula no registrada en Censo Local</span>}
                                        {trashumanciaInfo.estado_trashumancia === 'sospecha_concentracion' && <span>🟠 Alerta de Concentración de Direcciones</span>}
                                    </div>
                                    <p className="text-[11px] leading-snug">
                                        {trashumanciaInfo.detalle_trashumancia}
                                    </p>
                                    {trashumanciaInfo.municipio_censo_real && (
                                        <div className="text-[10px] text-gray-600 font-mono mt-0.5 pt-1 border-t border-gray-200/60">
                                            Censo: {trashumanciaInfo.municipio_censo_real} ({trashumanciaInfo.departamento_censo_real}) - Puesto: {trashumanciaInfo.puesto_censo_real || 'S/P'}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Mensaje de éxito al encontrar en censo */}
                            {censoInfo && !trashumanciaInfo && (
                                <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] flex items-center gap-2">
                                    <CheckCircle size={14} className="text-emerald-600 flex-shrink-0" />
                                    <span><strong>✓ Asignado:</strong> {censoInfo.puesto_votacion} {censoInfo.mesa ? `(Mesa ${censoInfo.mesa})` : ''}</span>
                                </div>
                            )}

                            {/* Asistente Registraduría si no está en censo local */}
                            {censoNotFound && (
                                <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1.5">
                                    <div className="flex items-center gap-1.5 font-bold text-[11px]">
                                        <AlertCircle size={14} className="text-amber-600 flex-shrink-0" />
                                        <span>No encontrada en censo local</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleOpenRegistraduria}
                                        className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-[10px] uppercase tracking-wider transition-all shadow-sm"
                                    >
                                        <ExternalLink size={12} />
                                        <span>{copiedReg ? '✓ Cédula Copiada — Registraduría...' : 'Consultar en Registraduría'}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-gray-600 font-bold mb-1.5 text-xs uppercase">Dirección de Residencia</label>
                            <input
                                type="text"
                                name="direccion"
                                value={formData.direccion}
                                onChange={handleChange}
                                placeholder="Ej. Calle 45 # 12-30"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#00B894]"
                            />
                        </div>

                        <div className="col-span-2 mt-2">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1">
                                Puesto y Lugar de Votación
                            </h3>
                        </div>

                        <div>
                            <label className="block text-gray-600 font-bold mb-1.5 text-xs uppercase">Departamento *</label>
                            <select
                                name="departamento"
                                value={formData.departamento}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#00B894]"
                                required
                            >
                                <option value="">-- SELECCIONE DEPARTAMENTO --</option>
                                {Object.keys(colombiaData).sort().map(dep => (
                                    <option key={dep} value={dep}>{dep}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-gray-600 font-bold mb-1.5 text-xs uppercase">Municipio *</label>
                            <select
                                name="municipio"
                                value={formData.municipio}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#00B894]"
                                required
                                disabled={!formData.departamento}
                            >
                                <option value="">-- SELECCIONE MUNICIPIO --</option>
                                {municipios.map(mun => (
                                    <option key={mun} value={mun}>{mun}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-gray-600 font-bold mb-1.5 text-xs uppercase">Lugar de Votación (Puesto)</label>
                                <input
                                    type="text"
                                    name="lugar_votacion"
                                    placeholder="Ej. Colegio San José"
                                    value={formData.lugar_votacion}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#00B894]"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-600 font-bold mb-1.5 text-xs uppercase">Mesa</label>
                                <input
                                    type="text"
                                    name="mesa"
                                    placeholder="Ej. 12"
                                    value={formData.mesa || ''}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono font-bold text-gray-800 focus:outline-none focus:border-[#00B894]"
                                />
                            </div>
                        </div>

                        <div className="col-span-2 mt-4">
                            <button
                                type="submit"
                                className={`w-full font-bold py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 uppercase text-xs tracking-wider text-white ${activeTab === 'leader' ? 'bg-[#00B894] hover:bg-[#00a884]' : 'bg-[#2D3436] hover:bg-gray-800'}`}
                            >
                                {activeTab === 'leader' ? 'Guardar Líder en la Campaña' : 'Guardar Votante en la Campaña'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
