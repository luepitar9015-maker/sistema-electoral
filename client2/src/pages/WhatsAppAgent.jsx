import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useCampaign } from '../context/CampaignContext';
import {
    MessageSquare, Send, Bot, User, CheckCheck, Sparkles,
    Database, Users, ShieldAlert, CheckCircle2, AlertCircle,
    Copy, ExternalLink, Zap, Phone, RefreshCw, Flag, Terminal,
    FileSpreadsheet, HelpCircle, Paperclip, Image, FileText,
    UploadCloud, X, FileCheck, Layers
} from 'lucide-react';

const API = 'http://localhost:3000/api';

const QUICK_EXAMPLES = [
    {
        title: 'Líder con lista de 3 votantes',
        text: `¡Hola! Soy el líder Carlos Mario Gómez con cédula 71234567 de Medellín.\nTe envío los primeros votantes de mi sector:\n1. Juan Camilo Pérez - CC 10203040 - Tel: 3001234567\n2. María Elena Rodríguez - CC 43567890\n3. Pedro Nel Hurtado - CC 98765432`
    },
    {
        title: 'Envío rápido de cédulas',
        text: `Buenas tardes, envío mis votantes para registrar en la campaña:\n10203040\n43567890\n98765432`
    },
    {
        title: 'Líder comunal reportando acuerdo',
        text: `Hola, soy la líder Sandra Milena Morales con cédula 52345678 de la JAC Comuna 4.\nRegistra a mis simpatizantes:\n- Andrés Felipe Castro CC 71987654\n- Claudia Patricia Ruiz CC 32109876`
    }
];

export default function WhatsAppAgent() {
    const { campaigns, activeCampaign } = useCampaign();
    const token = localStorage.getItem('token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    const [activeTab, setActiveTab] = useState('simulator'); // 'simulator' | 'history' | 'webhook'
    const [messages, setMessages] = useState([]);
    const [stats, setStats] = useState({ totalMessages: 0, totalVotersIngested: 0, totalLeadersRegistered: 0 });

    // Chat Simulator State
    const [chatHistory, setChatHistory] = useState([
        {
            id: 1,
            sender: 'bot',
            text: `¡Hola! Soy tu *Agente Electoral de IA para WhatsApp* 🤖🗳️.\n\nEstoy listo para recibir:\n• 📸 *Imágenes / Fotografías de formularios físicos* (reconocimiento OCR)\n• 📄 *Formularios en formato PDF*\n• 📊 *Planillas de Excel diligenciadas* (.xlsx / .xls)\n• 💬 *Listados en texto o mensajes de WhatsApp*\n\nExtraigo automáticamente al líder y a los simpatizantes, cruzo las cédulas con el *Censo Electoral* en tiempo real para auto-asignar puesto y mesa, y alimento la base de datos de tu campaña inmediatamente.`,
            time: '10:00 AM'
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [senderPhone, setSenderPhone] = useState('+57 301 456 7890');
    const [senderName, setSenderName] = useState('Líder Comunal Carlos Gómez');
    const [simulating, setSimulating] = useState(false);
    const [lastProcessed, setLastProcessed] = useState(null);
    
    // Gestión de archivos adjuntos (Imágenes, PDF, Excel)
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [fileTypeCategory, setFileTypeCategory] = useState(null);
    const fileInputRef = useRef(null);
    const chatEndRef = useRef(null);

    // Cargar estadísticas e historial
    const fetchStatsAndHistory = async () => {
        try {
            const campQuery = activeCampaign?.id ? `?campana_id=${activeCampaign.id}` : '';
            const [resStats, resMsgs] = await Promise.all([
                axios.get(`${API}/whatsapp/stats${campQuery}`, authHeaders),
                axios.get(`${API}/whatsapp/messages${campQuery}`, authHeaders)
            ]);
            setStats(resStats.data);
            setMessages(resMsgs.data);
        } catch (err) {
            console.error('Error fetching WhatsApp data:', err);
        }
    };

    useEffect(() => {
        fetchStatsAndHistory();
    }, [activeCampaign?.id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    // Manejar selección de archivo
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const nameLower = file.name.toLowerCase();
        let cat = 'documento';
        if (nameLower.endsWith('.xlsx') || nameLower.endsWith('.xls') || file.type.includes('spreadsheet') || file.type.includes('excel')) {
            cat = 'excel';
        } else if (nameLower.endsWith('.pdf') || file.type.includes('pdf')) {
            cat = 'pdf';
        } else if (file.type.startsWith('image/')) {
            cat = 'imagen';
        }

        setSelectedFile(file);
        setFileTypeCategory(cat);

        if (cat === 'imagen') {
            setFilePreview(URL.createObjectURL(file));
        } else {
            setFilePreview(null);
        }
    };

    const handleClearFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        setFileTypeCategory(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Enviar mensaje o archivo al agente de WhatsApp
    const handleSendMessage = async (customText) => {
        if (simulating) return;

        // Caso 1: Se tiene un archivo seleccionado (Imagen, PDF o Excel)
        if (selectedFile) {
            await handleSendFile();
            return;
        }

        // Caso 2: Mensaje de texto estándar
        const textToSend = customText || inputText;
        if (!textToSend.trim()) return;

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const userMsg = {
            id: Date.now(),
            sender: 'user',
            text: textToSend,
            time: timeStr
        };

        setChatHistory(prev => [...prev, userMsg]);
        setInputText('');
        setSimulating(true);

        try {
            const res = await axios.post(`${API}/whatsapp/simulate`, {
                mensaje: textToSend,
                telefonoRemitente: senderPhone,
                nombreRemitente: senderName,
                campanaId: activeCampaign?.id || null
            }, authHeaders);

            const botReply = {
                id: Date.now() + 1,
                sender: 'bot',
                text: res.data.respuesta,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                data: res.data
            };

            setChatHistory(prev => [...prev, botReply]);
            setLastProcessed(res.data);
            fetchStatsAndHistory();
        } catch (err) {
            const errorReply = {
                id: Date.now() + 1,
                sender: 'bot',
                text: `❌ *Error al procesar el mensaje:* ${err.response?.data?.message || err.message}`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setChatHistory(prev => [...prev, errorReply]);
        } finally {
            setSimulating(false);
        }
    };

    // Enviar archivo a través del endpoint con Multer
    const handleSendFile = async () => {
        if (!selectedFile || simulating) return;

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const fileInfo = {
            name: selectedFile.name,
            size: (selectedFile.size / 1024).toFixed(1) + ' KB',
            category: fileTypeCategory,
            preview: filePreview
        };

        const captionToSend = inputText;

        // Registrar mensaje de usuario con el archivo en la vista de chat
        const userMsg = {
            id: Date.now(),
            sender: 'user',
            text: captionToSend || `📎 [Archivo adjunto: ${fileInfo.name}]`,
            file: fileInfo,
            time: timeStr
        };

        setChatHistory(prev => [...prev, userMsg]);
        setSimulating(true);
        const fileBackup = selectedFile;
        handleClearFile();
        setInputText('');

        try {
            const formData = new FormData();
            formData.append('file', fileBackup);
            formData.append('caption', captionToSend || '');
            formData.append('telefonoRemitente', senderPhone);
            formData.append('nombreRemitente', senderName);
            if (activeCampaign?.id) {
                formData.append('campanaId', activeCampaign.id);
            }

            const res = await axios.post(`${API}/whatsapp/simulate-file`, formData, {
                headers: {
                    ...authHeaders.headers,
                    'Content-Type': 'multipart/form-data'
                }
            });

            const botReply = {
                id: Date.now() + 1,
                sender: 'bot',
                text: res.data.respuesta,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                data: res.data
            };

            setChatHistory(prev => [...prev, botReply]);
            setLastProcessed(res.data);
            fetchStatsAndHistory();
        } catch (err) {
            const errorReply = {
                id: Date.now() + 1,
                sender: 'bot',
                text: `❌ *Error al procesar el archivo ${fileBackup.name}:* ${err.response?.data?.message || err.message}`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setChatHistory(prev => [...prev, errorReply]);
        } finally {
            setSimulating(false);
        }
    };

    // Crear formulario de prueba sintético (CSV / Excel simulado en vivo)
    const handleSendSampleExcel = () => {
        const sampleCsv = `LIDER: Carlos Mario Gómez, CEDULA: 71234567, TELEFONO: 3001234567
CEDULA,NOMBRES,APELLIDOS,TELEFONO,DIRECCION
10203040,Juan Camilo,Pérez Vélez,3001234567,Calle 50 # 40-20
43567890,María Elena,Rodríguez López,3104567890,Carrera 80 # 32-10
98765432,Pedro Nel,Hurtado Gómez,3123456789,Diagonal 45 # 12-08
71987654,Andrés Felipe,Castro Ruiz,3156789012,Circular 4 # 70-15`;

        const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
        const file = new File([blob], 'Planilla_Votantes_Formulario_Oficial.csv', { type: 'text/csv' });
        
        setSelectedFile(file);
        setFileTypeCategory('excel');
        setInputText('Envío la planilla diligenciada de votantes de la Comuna');
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">

            {/* Header del Agente WhatsApp */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl text-emerald-400">
                        <MessageSquare size={30} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Sparkles size={11} /> AGENTE IA MULTIMODAL
                            </span>
                            <span className="text-emerald-300 text-xs font-semibold">
                                {activeCampaign ? `Campaña: ${activeCampaign.nombre}` : 'Todas las Campañas'}
                            </span>
                        </div>
                        <h1 className="text-2xl font-black tracking-wide uppercase mt-1">
                            Recepción por WhatsApp: Formularios, PDF y Excel
                        </h1>
                        <p className="text-gray-300 text-xs mt-0.5 max-w-2xl">
                            El Agente de IA recibe fotos de formularios físicos (OCR), archivos PDF y planillas Excel, auto-registra líderes y cruza las cédulas con el censo electoral oficial.
                        </p>
                    </div>
                </div>

                {/* Métricas Rápidas */}
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-center">
                        <span className="text-[10px] uppercase text-gray-300 font-bold block">Votantes por WhatsApp</span>
                        <span className="text-2xl font-black text-emerald-400">{stats.totalVotersIngested}</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-center">
                        <span className="text-[10px] uppercase text-gray-300 font-bold block">Líderes Reportando</span>
                        <span className="text-2xl font-black text-white">{stats.totalLeadersRegistered}</span>
                    </div>
                </div>
            </div>

            {/* Pestañas de Navegación */}
            <div className="bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider">
                <button
                    onClick={() => setActiveTab('simulator')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${activeTab === 'simulator' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    <MessageSquare size={15} />
                    <span>Simulador WhatsApp (Texto, OCR, PDF y Excel)</span>
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${activeTab === 'history' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    <Database size={15} />
                    <span>Historial de Mensajes ({messages.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab('webhook')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${activeTab === 'webhook' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    <Terminal size={15} />
                    <span>Conexión Webhook Oficial Meta / Twilio</span>
                </button>
            </div>

            {/* ─── PESTAÑA 1: SIMULADOR INTERACTIVO ───────────────────────────── */}
            {activeTab === 'simulator' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Columna Izquierda: Cargas de Formularios, Remitente y Ejemplos */}
                    <div className="lg:col-span-4 space-y-4">

                        {/* Remitente Simulado */}
                        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                <User size={15} className="text-emerald-600" />
                                <span>Remitente de WhatsApp (Líder)</span>
                            </h3>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Nombre del Remitente</label>
                                <input
                                    type="text"
                                    value={senderName}
                                    onChange={e => setSenderName(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Número de WhatsApp</label>
                                <input
                                    type="text"
                                    value={senderPhone}
                                    onChange={e => setSenderPhone(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs font-mono font-bold text-gray-800 focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Modos de Recepción: Imagen OCR, PDF y Excel */}
                        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                    <UploadCloud size={16} className="text-emerald-600" />
                                    <span>Recepción de Formularios</span>
                                </h3>
                                <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                    Multimodal
                                </span>
                            </div>

                            <p className="text-[11px] text-gray-500">
                                Sube o envía un archivo para que el agente extraiga automáticamente las cédulas y las cruce con el censo electoral:
                            </p>

                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (fileInputRef.current) {
                                            fileInputRef.current.accept = 'image/*';
                                            fileInputRef.current.click();
                                        }
                                    }}
                                    className="p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl flex flex-col items-center gap-1.5 text-center transition-all group"
                                >
                                    <div className="p-2 bg-purple-500 text-white rounded-xl shadow-sm group-hover:scale-105 transition-transform">
                                        <Image size={18} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-purple-950">Foto Formulario</span>
                                    <span className="text-[9px] text-purple-600 font-bold">OCR IA</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (fileInputRef.current) {
                                            fileInputRef.current.accept = '.pdf,application/pdf';
                                            fileInputRef.current.click();
                                        }
                                    }}
                                    className="p-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-2xl flex flex-col items-center gap-1.5 text-center transition-all group"
                                >
                                    <div className="p-2 bg-rose-500 text-white rounded-xl shadow-sm group-hover:scale-105 transition-transform">
                                        <FileText size={18} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-rose-950">Formulario PDF</span>
                                    <span className="text-[9px] text-rose-600 font-bold">Lectura PDF</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (fileInputRef.current) {
                                            fileInputRef.current.accept = '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                                            fileInputRef.current.click();
                                        }
                                    }}
                                    className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl flex flex-col items-center gap-1.5 text-center transition-all group"
                                >
                                    <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm group-hover:scale-105 transition-transform">
                                        <FileSpreadsheet size={18} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-emerald-950">Excel Diligenciado</span>
                                    <span className="text-[9px] text-emerald-600 font-bold">Planillas</span>
                                </button>
                            </div>

                            {/* Botón de Prueba con Formulario Pre-cargado */}
                            <button
                                type="button"
                                onClick={handleSendSampleExcel}
                                className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                            >
                                <Sparkles size={14} className="text-emerald-600" />
                                <span>Cargar Planilla de Prueba con 1 Clic</span>
                            </button>
                        </div>

                        {/* Botones de Prueba Rápida de Texto */}
                        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                    <Zap size={15} className="text-amber-500" />
                                    <span>Pruebas de Texto en 1 Clic</span>
                                </h3>
                                <span className="text-[10px] text-gray-400">Clic para enviar</span>
                            </div>

                            <div className="space-y-2">
                                {QUICK_EXAMPLES.map((ex, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleSendMessage(ex.text)}
                                        disabled={simulating}
                                        className="w-full text-left p-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-100/60 transition-all group"
                                    >
                                        <div className="flex items-center justify-between text-xs font-bold text-emerald-950 mb-1">
                                            <span>{ex.title}</span>
                                            <Send size={12} className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <p className="text-[11px] text-gray-500 line-clamp-2 italic font-mono">
                                            {ex.text}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Impacto en Base de Datos en Tiempo Real */}
                        {lastProcessed && (
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-3xl border border-emerald-200 shadow-sm space-y-3 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                                        <Database size={15} className="text-emerald-600" />
                                        <span>Alimentación de Base de Datos</span>
                                    </h3>
                                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                                        +{lastProcessed.totalProcesados} ingresados
                                    </span>
                                </div>

                                {lastProcessed.lider && (
                                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200 text-xs">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase block">Líder Asignado</span>
                                        <strong className="text-slate-800">{lastProcessed.lider.nombres} {lastProcessed.lider.apellidos}</strong>
                                        {lastProcessed.lider.cedula && <span className="text-gray-500 ml-1">(CC {lastProcessed.lider.cedula})</span>}
                                    </div>
                                )}

                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                    {lastProcessed.votantesIngresados?.map((v, i) => (
                                        <div key={i} className="bg-white p-2 rounded-xl border border-emerald-100 text-[11px] flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-slate-800">{v.nombres}</p>
                                                <p className="text-gray-500 text-[10px]">CC {v.cedula} · {v.lugar_votacion} {v.mesa ? `· Mesa ${v.mesa}` : ''}</p>
                                            </div>
                                            <span className="text-emerald-600 text-xs font-black">✓ Guardado</span>
                                        </div>
                                    ))}
                                </div>

                                <a
                                    href="/voters"
                                    className="block text-center text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline pt-1"
                                >
                                    Ver todos en la tabla de votantes →
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Columna Derecha: Interfaz WhatsApp Web */}
                    <div className="lg:col-span-8 flex flex-col h-[700px] bg-[#EFEAE2] rounded-3xl overflow-hidden border border-gray-300 shadow-xl">

                        {/* Header de WhatsApp */}
                        <div className="bg-[#075E54] text-white px-5 py-3.5 flex items-center justify-between shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm">
                                        <Bot size={22} className="text-emerald-200" />
                                    </div>
                                    <span className="w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#075E54] absolute bottom-0 right-0" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm leading-tight flex items-center gap-2">
                                        <span>Bot IA Campaña Electoral</span>
                                        <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.2 rounded font-normal">Oficial</span>
                                    </h3>
                                    <p className="text-[11px] text-emerald-200">
                                        En línea · Recibe imágenes de formularios, PDFs, Excel y texto
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setChatHistory([chatHistory[0]])}
                                className="text-emerald-200 hover:text-white text-xs font-bold flex items-center gap-1 bg-white/10 px-3 py-1 rounded-xl transition-colors"
                            >
                                <RefreshCw size={13} />
                                <span>Limpiar Chat</span>
                            </button>
                        </div>

                        {/* Área de Mensajes */}
                        <div className="flex-1 p-5 overflow-y-auto space-y-3" style={{ backgroundImage: 'radial-gradient(#d1d7db 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
                            {chatHistory.map((msg) => {
                                const isUser = msg.sender === 'user';
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in duration-200`}
                                    >
                                        <div
                                            className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm text-xs relative ${isUser ? 'bg-[#D9FDD3] text-gray-900 rounded-tr-none' : 'bg-white text-gray-900 rounded-tl-none'}`}
                                        >
                                            {/* Tarjeta de Archivo Adjunto (si el mensaje incluye archivo) */}
                                            {msg.file && (
                                                <div className="mb-2 p-2.5 bg-white/80 rounded-xl border border-emerald-200 flex items-center gap-3">
                                                    {msg.file.category === 'imagen' && msg.file.preview ? (
                                                        <img
                                                            src={msg.file.preview}
                                                            alt="Formulario"
                                                            className="w-16 h-16 object-cover rounded-lg border border-gray-300"
                                                        />
                                                    ) : msg.file.category === 'excel' ? (
                                                        <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
                                                            <FileSpreadsheet size={24} />
                                                        </div>
                                                    ) : (
                                                        <div className="p-3 bg-rose-100 text-rose-800 rounded-xl">
                                                            <FileText size={24} />
                                                        </div>
                                                    )}
                                                    <div className="overflow-hidden">
                                                        <span className="text-[10px] font-black uppercase text-emerald-700 block">
                                                            {msg.file.category === 'imagen' ? '📸 Fotografía Formulario (OCR)' : msg.file.category === 'excel' ? '📊 Planilla Excel' : '📄 Formulario PDF'}
                                                        </span>
                                                        <p className="font-bold text-slate-800 truncate text-xs">{msg.file.name}</p>
                                                        <span className="text-[10px] text-gray-400">{msg.file.size}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Texto del mensaje */}
                                            <div className="whitespace-pre-wrap leading-relaxed">
                                                {msg.text.split('\n').map((line, idx) => {
                                                    const formatted = line.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
                                                    return (
                                                        <p key={idx} dangerouslySetInnerHTML={{ __html: formatted }} className={idx > 0 ? 'mt-1' : ''} />
                                                    );
                                                })}
                                            </div>

                                            {/* Hora y check */}
                                            <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-gray-400">
                                                <span>{msg.time}</span>
                                                {isUser && <CheckCheck size={14} className="text-blue-500" />}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {simulating && (
                                <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-2xl rounded-tl-none w-max shadow-sm text-xs text-gray-600 animate-pulse">
                                    <Bot size={16} className="text-emerald-600 animate-spin" />
                                    <span>Agente IA analizando documento, extrayendo cédulas y consultando Censo Electoral...</span>
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>

                        {/* Previsualización del Archivo antes de enviar */}
                        {selectedFile && (
                            <div className="bg-emerald-50 px-4 py-2.5 border-t border-emerald-200 flex items-center justify-between animate-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-3">
                                    {fileTypeCategory === 'imagen' && filePreview ? (
                                        <img src={filePreview} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-emerald-300" />
                                    ) : fileTypeCategory === 'excel' ? (
                                        <div className="p-2 bg-emerald-600 text-white rounded-lg">
                                            <FileSpreadsheet size={20} />
                                        </div>
                                    ) : (
                                        <div className="p-2 bg-rose-600 text-white rounded-lg">
                                            <FileText size={20} />
                                        </div>
                                    )}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-200 px-1.5 py-0.5 rounded">
                                                {fileTypeCategory === 'imagen' ? 'Foto / Formulario Físico' : fileTypeCategory === 'excel' ? 'Planilla Excel' : 'Documento PDF'}
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-mono">
                                                ({(selectedFile.size / 1024).toFixed(1)} KB)
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-800 truncate max-w-sm">{selectedFile.name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClearFile}
                                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-white transition-colors"
                                    title="Quitar archivo"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        {/* Input bar de WhatsApp */}
                        <div className="p-3 bg-[#F0F2F5] border-t border-gray-200 flex items-center gap-2">
                            {/* Input oculto para adjuntar archivos */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            {/* Botón de Adjuntar Archivo (Clip 📎) */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (fileInputRef.current) {
                                        fileInputRef.current.accept = '.jpg,.jpeg,.png,.webp,.pdf,.xlsx,.xls,.csv';
                                        fileInputRef.current.click();
                                    }
                                }}
                                className={`p-2.5 rounded-full transition-all ${selectedFile ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}
                                title="Adjuntar fotografía de formulario, PDF o planilla Excel"
                            >
                                <Paperclip size={20} />
                            </button>

                            <textarea
                                rows="1"
                                placeholder={selectedFile ? "Añade un comentario o pie de foto (opcional)..." : "Escribe un mensaje de líder, pega cédulas o adjunta un formulario..."}
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                className="flex-1 bg-white border border-gray-300 rounded-2xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-emerald-500 resize-none max-h-24 shadow-inner"
                            />

                            <button
                                type="button"
                                onClick={() => handleSendMessage()}
                                disabled={(!inputText.trim() && !selectedFile) || simulating}
                                className="p-3 bg-[#00A884] hover:bg-[#008f6f] disabled:bg-gray-300 text-white rounded-full shadow-md transition-all transform hover:scale-105"
                                title="Enviar al Agente de IA"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── PESTAÑA 2: HISTORIAL DE MENSAJES RECIBIDOS ────────────────── */}
            {activeTab === 'history' && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
                    <div className="flex items-center justify-between border-b pb-4">
                        <div>
                            <h3 className="text-base font-black uppercase text-slate-800">
                                Registro de Mensajes y Formularios Procesados por WhatsApp
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Todos los envíos recibidos por el bot (Texto, OCR de imágenes, PDFs y Excels) y su impacto en la base de datos electoral.
                            </p>
                        </div>
                        <button
                            onClick={fetchStatsAndHistory}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                        >
                            <RefreshCw size={13} />
                            <span>Actualizar</span>
                        </button>
                    </div>

                    {messages.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 text-xs">
                            No se han recibido mensajes o archivos de WhatsApp aún. Prueba el Simulador para ver los registros aquí.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase font-black tracking-wider text-[10px]">
                                    <tr>
                                        <th className="px-4 py-3">Fecha y Hora</th>
                                        <th className="px-4 py-3">Remitente / Líder</th>
                                        <th className="px-4 py-3">Teléfono</th>
                                        <th className="px-4 py-3">Campaña</th>
                                        <th className="px-4 py-3">Tipo de Recepción</th>
                                        <th className="px-4 py-3 text-center">Votantes Ingeridos</th>
                                        <th className="px-4 py-3">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {messages.map(msg => (
                                        <tr key={msg.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-4 py-3 font-mono text-gray-500 text-[11px]">
                                                {new Date(msg.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 font-bold text-slate-800">
                                                {msg.remitente_nombre || 'Líder WhatsApp'}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-gray-600">
                                                {msg.remitente_telefono}
                                            </td>
                                            <td className="px-4 py-3">
                                                {msg.campana ? (
                                                    <span className="font-bold text-slate-800 flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: msg.campana.color }} />
                                                        {msg.campana.nombre}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">General</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1 w-max ${
                                                    msg.tipo_mensaje?.includes('imagen') ? 'bg-purple-100 text-purple-800' :
                                                    msg.tipo_mensaje?.includes('pdf') ? 'bg-rose-100 text-rose-800' :
                                                    msg.tipo_mensaje?.includes('excel') ? 'bg-emerald-100 text-emerald-800' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {msg.tipo_mensaje?.includes('imagen') && '📸 Imagen OCR'}
                                                    {msg.tipo_mensaje?.includes('pdf') && '📄 PDF'}
                                                    {msg.tipo_mensaje?.includes('excel') && '📊 Excel'}
                                                    {!msg.tipo_mensaje?.includes('imagen') && !msg.tipo_mensaje?.includes('pdf') && !msg.tipo_mensaje?.includes('excel') && (msg.tipo_mensaje || 'Texto')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                                    +{msg.votantes_procesados}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                                    {msg.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ─── PESTAÑA 3: CONEXIÓN WEBHOOK OFICIAL ──────────────────────── */}
            {activeTab === 'webhook' && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
                    <div>
                        <h3 className="text-base font-black uppercase text-slate-800 flex items-center gap-2">
                            <Terminal size={18} className="text-blue-600" />
                            <span>Configuración de Webhook para WhatsApp Business API</span>
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Conecta tu número oficial de WhatsApp con Meta Cloud API o proveedores compatibles como Twilio.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">URL del Webhook (Callback URL)</span>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-white p-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold text-slate-800 truncate">
                                    http://localhost:3000/api/whatsapp/webhook
                                </code>
                                <button
                                    onClick={() => navigator.clipboard.writeText('http://localhost:3000/api/whatsapp/webhook')}
                                    className="p-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700"
                                    title="Copiar URL"
                                >
                                    <Copy size={14} />
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-500">
                                En producción, reemplaza localhost por tu dominio público con HTTPS (o usa ngrok para pruebas remotas).
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Token de Verificación (Verify Token)</span>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-white p-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold text-emerald-800 truncate">
                                    electoral_bot_verify_token_2026
                                </code>
                                <button
                                    onClick={() => navigator.clipboard.writeText('electoral_bot_verify_token_2026')}
                                    className="p-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700"
                                    title="Copiar Token"
                                >
                                    <Copy size={14} />
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-500">
                                Token configurado en el backend para validar el handshake inicial con Meta.
                            </p>
                        </div>
                    </div>

                    <div className="p-5 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-blue-600" />
                            <span>Paso a Paso de Conexión en Meta Developers</span>
                        </h4>
                        <ol className="list-decimal list-inside text-xs text-blue-950 space-y-1.5 leading-relaxed">
                            <li>Ingresa a tu cuenta de <strong>developers.facebook.com</strong> y ve a tu aplicación de WhatsApp.</li>
                            <li>En la sección <strong>WhatsApp &gt; Configuración</strong>, ubica el campo <strong>Webhook</strong>.</li>
                            <li>Pega la URL de devolución de llamada: <code>/api/whatsapp/webhook</code>.</li>
                            <li>Ingresa el Verify Token: <code>electoral_bot_verify_token_2026</code> y haz clic en <strong>Verificar y Guardar</strong>.</li>
                            <li>En los campos de suscripción del Webhook, suscríbete al evento <strong>messages</strong>.</li>
                            <li>¡Listo! Cada mensaje, imagen de formulario, PDF o Excel enviado por tus líderes al WhatsApp será procesado por el Agente de IA y alimentará la base de datos automáticamente.</li>
                        </ol>
                    </div>
                </div>
            )}
        </div>
    );
}
