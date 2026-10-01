import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCampaign } from '../context/CampaignContext';
import { colombiaData } from '../data/colombiaData';
import {
    Search, UserPlus, Users, UploadCloud, Download, CheckCircle,
    XCircle, AlertCircle, FileSpreadsheet, X, Zap, ExternalLink, Copy, Check,
    Flag, Globe, Building2, MapPin, Handshake, Quote, Award, Sparkles
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
    const [copiedReg, setCopiedReg] = useState(false);

    // Import state
    const [importFile, setImportFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (activeTab === 'friend') fetchLeaders();
        else if (activeTab !== 'import') {
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
            const res = await axios.get(`${API}/censo/lookup/${cleanCed}`, authHeaders);
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
                    <UploadCloud size={16} /><span>CARGA MASIVA EXCEL</span>
                </button>
            </div>

            {/* ─── VISTA CARGA MASIVA ───────────────────────────────────── */}
            {activeTab === 'import' && (
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                        <h2 className="text-xl font-bold uppercase tracking-widest flex items-center gap-3">
                            <UploadCloud size={24} />
                            Carga Masiva de Votantes
                        </h2>
                        <p className="text-blue-100 text-xs mt-1">
                            {activeCampaign
                                ? `Los votantes importados quedarán vinculados a la campaña: ${activeCampaign.nombre}`
                                : 'Sube un archivo Excel con los datos de los votantes para registrarlos en lote.'}
                        </p>
                    </div>

                    <div className="p-8 space-y-6">

                        {/* Paso 1: Descargar plantilla */}
                        <div className="flex items-start gap-4 p-5 bg-blue-50/70 rounded-2xl border border-blue-100">
                            <div className="flex-shrink-0 w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-sm">1</div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wide mb-1">Descarga la Plantilla Oficial</h3>
                                <p className="text-gray-500 text-xs mb-3">
                                    Usa nuestra plantilla oficial en Excel (.xlsx) con columnas para nombres, apellidos, cédula, dirección, lugar de votación y líder.
                                </p>
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="flex items-center gap-2 bg-white border border-blue-300 text-blue-700 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                                >
                                    <Download size={14} />
                                    <span>Descargar Plantilla Excel (.xlsx)</span>
                                </button>
                            </div>
                        </div>

                        {/* Paso 2: Apoyo Político (Opcional) */}
                        {campaignApoyos.length > 0 && (
                            <div className="flex items-start gap-4 p-5 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                                <div className="flex-shrink-0 w-9 h-9 bg-emerald-600 rounded-full flex items-center justify-center text-white font-black text-sm">2</div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wide mb-1 flex items-center gap-1.5">
                                        <Handshake size={14} className="text-emerald-600" />
                                        <span>Asignar a un Apoyo Político / Aliado (Opcional)</span>
                                    </h3>
                                    <p className="text-gray-500 text-xs mb-2">
                                        Si este archivo proviene del trabajo de un candidato aliado (ej. un candidato al concejo), selecciónalo aquí para acreditarle los votos.
                                    </p>
                                    <select
                                        value={selectedImportApoyo}
                                        onChange={e => setSelectedImportApoyo(e.target.value)}
                                        className="w-full bg-white border border-emerald-300 rounded-xl p-2.5 text-xs font-bold text-emerald-950 focus:outline-none"
                                    >
                                        <option value="">-- Sin Apoyo Político Específico (Campaña General) --</option>
                                        {campaignApoyos.map(a => (
                                            <option key={a.id} value={a.id}>
                                                {a.nombre} [{a.cargo_o_rol || a.tipo_apoyo}] - Meta: {a.compromiso_votos} votos
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Paso 3: Subir archivo */}
                        <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-200">
                            <div className="flex-shrink-0 w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-white font-black text-sm">
                                {campaignApoyos.length > 0 ? '3' : '2'}
                            </div>
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
                                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all flex items-center gap-2"
                                        >
                                            {importing ? (
                                                <><span>Procesando...</span></>
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

                        {/* Resultado de la importación */}
                        {importResult && (
                            <div className={`p-5 rounded-2xl border ${importResult.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                                <h4 className="font-bold text-xs uppercase tracking-wide flex items-center gap-2 mb-2">
                                    {importResult.type === 'success' ? <CheckCircle size={16} className="text-emerald-600" /> : <XCircle size={16} className="text-rose-600" />}
                                    <span>{importResult.message}</span>
                                </h4>

                                {importResult.type === 'success' && (
                                    <div className="grid grid-cols-3 gap-3 text-center mt-3">
                                        <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase block">Guardados</span>
                                            <span className="text-lg font-black text-emerald-600">{importResult.success}</span>
                                        </div>
                                        <div className="bg-white p-2.5 rounded-xl border border-yellow-100">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase block">Duplicados</span>
                                            <span className="text-lg font-black text-yellow-600">{importResult.duplicates}</span>
                                        </div>
                                        <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Filas</span>
                                            <span className="text-lg font-black text-slate-800">{importResult.total}</span>
                                        </div>
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

                            {/* Mensaje de éxito al encontrar en censo */}
                            {censoInfo && (
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
