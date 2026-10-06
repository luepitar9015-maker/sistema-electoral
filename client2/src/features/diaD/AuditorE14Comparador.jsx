import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../../config/api';
import { 
    AlertTriangle, CheckCircle2, Scale, FileText, Search, 
    Filter, Upload, Eye, Edit3, Copy, Check, X, Printer, 
    ExternalLink, ShieldAlert, Sparkles, RefreshCw, ChevronRight,
    ArrowUpRight, FileCheck, HelpCircle
} from 'lucide-react';

export default function AuditorE14Comparador({ campaignId }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ kpis: {}, puestos: [], reportes: [] });
    const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos', 'alerta_roja', 'conciliado', 'pendiente_boletin'
    const [filtroPuesto, setFiltroPuesto] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [modalFoto, setModalFoto] = useState(null); // url de foto E-14
    const [modalReclamacion, setModalReclamacion] = useState(null); // data de reclamacion
    const [modalEditBoletin, setModalEditBoletin] = useState(null); // item mesa a editar
    const [modalBulkImport, setModalBulkImport] = useState(false);

    // Formulario de edición rápida de boletín
    const [formBoletin, setFormBoletin] = useState({
        boletin_numero: '',
        boletin_registraduria_votos: '',
        observaciones: ''
    });

    // Formulario de importación masiva
    const [bulkText, setBulkText] = useState('');
    const [bulkBoletinNumero, setBulkBoletinNumero] = useState('Boletín 20');
    const [bulkLoading, setBulkLoading] = useState(false);

    // Estado de copiado
    const [copiadoTexto, setCopiadoTexto] = useState(false);
    const [folioRadicadoInput, setFolioRadicadoInput] = useState('');
    const [submittingAction, setSubmittingAction] = useState(false);

    const token = localStorage.getItem('token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    const fetchAuditoria = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (campaignId) params.append('campana_id', campaignId);
            if (filtroEstado !== 'todos') params.append('estado', filtroEstado);
            if (filtroPuesto !== 'todos') params.append('puesto', filtroPuesto);
            if (searchTerm.trim()) params.append('search', searchTerm.trim());

            const res = await axios.get(`${API}/dia-d/comparador-e14?${params.toString()}`, authHeaders);
            setData(res.data);
        } catch (err) {
            console.error('Error al cargar auditoría E-14:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditoria();
    }, [campaignId, filtroEstado, filtroPuesto]);

    const handleOpenEditBoletin = (reporte) => {
        setModalEditBoletin(reporte);
        setFormBoletin({
            boletin_numero: reporte.boletin_numero || 'Boletín 15',
            boletin_registraduria_votos: reporte.boletin_registraduria_votos !== null ? reporte.boletin_registraduria_votos : '',
            observaciones: reporte.observaciones || ''
        });
    };

    const handleSaveBoletin = async (e) => {
        e.preventDefault();
        if (!modalEditBoletin) return;
        setSubmittingAction(true);
        try {
            await axios.put(`${API}/dia-d/comparador-e14/${modalEditBoletin.id}/boletin`, formBoletin, authHeaders);
            setModalEditBoletin(null);
            fetchAuditoria();
        } catch (err) {
            alert('Error al guardar datos del boletín: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmittingAction(false);
        }
    };

    const handleOpenReclamacion = async (reporte) => {
        try {
            const res = await axios.get(`${API}/dia-d/comparador-e14/${reporte.id}/reclamacion`, authHeaders);
            setModalReclamacion(res.data);
            setFolioRadicadoInput(reporte.reclamacion_folio || '');
        } catch (err) {
            alert('Error al generar texto de reclamación: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleMarcarReclamado = async () => {
        if (!modalReclamacion) return;
        setSubmittingAction(true);
        try {
            await axios.put(`${API}/dia-d/comparador-e14/${modalReclamacion.id}/marcar-reclamacion`, {
                reclamacion_folio: folioRadicadoInput || `REC-${Date.now()}`
            }, authHeaders);
            setModalReclamacion(null);
            fetchAuditoria();
        } catch (err) {
            alert('Error al marcar radicado: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmittingAction(false);
        }
    };

    const handleCopiarReclamacion = () => {
        if (!modalReclamacion?.texto_reclamacion) return;
        navigator.clipboard.writeText(modalReclamacion.texto_reclamacion);
        setCopiadoTexto(true);
        setTimeout(() => setCopiadoTexto(false), 2500);
    };

    const handleBulkImport = async (e) => {
        e.preventDefault();
        if (!bulkText.trim()) return;

        // Parsear texto copiado de tabla o CSV: "PUESTO \t MESA \t VOTOS"
        const lineas = bulkText.trim().split('\n');
        const registros = [];

        for (const linea of lineas) {
            const partes = linea.includes('\t') ? linea.split('\t') : linea.split(',');
            if (partes.length >= 3) {
                registros.push({
                    puesto: partes[0].trim(),
                    mesa: partes[1].trim(),
                    votos_registraduria: partes[2].trim()
                });
            }
        }

        if (registros.length === 0) {
            alert('No se detectaron registros válidos. Usa formato: Puesto [TAB o coma] Mesa [TAB o coma] Votos');
            return;
        }

        setBulkLoading(true);
        try {
            const res = await axios.post(`${API}/dia-d/comparador-e14/importar-boletines`, {
                campana_id: campaignId,
                boletin_global_numero: bulkBoletinNumero,
                registros
            }, authHeaders);
            alert(res.data.message);
            setModalBulkImport(false);
            setBulkText('');
            fetchAuditoria();
        } catch (err) {
            alert('Error en importación masiva: ' + (err.response?.data?.message || err.message));
        } finally {
            setBulkLoading(false);
        }
    };

    const kpis = data.kpis || {};

    return (
        <div className="space-y-6">

            {/* Banner Superior & KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* 1. Alerta Roja: Votos en Disputa */}
                <div className="bg-gradient-to-br from-rose-950/80 to-slate-900 border-2 border-rose-500/60 rounded-3xl p-5 shadow-xl text-white relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-300">
                            Votos Faltantes en Disputa
                        </span>
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-black text-rose-400">
                            +{kpis.votos_disputa_recuperables || 0}
                        </span>
                        <span className="text-xs text-rose-200 font-bold">votos omitidos</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                        Diferencia a favor en actas E-14
                    </span>
                </div>

                {/* 2. Mesas en Alerta Roja */}
                <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-5 shadow-xl text-white">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Mesas con Alerta Roja
                    </span>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-black text-rose-500">
                            {kpis.mesas_alerta_roja || 0}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">de {kpis.total_mesas || 0} mesas</span>
                    </div>
                    <span className="text-[10px] text-rose-400 block mt-1 font-bold">
                        Requieren recuento inmediato
                    </span>
                </div>

                {/* 3. Mesas Conciliadas */}
                <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-5 shadow-xl text-white">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Mesas 100% Conciliadas
                    </span>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-black text-emerald-400">
                            {kpis.mesas_conciliadas || 0}
                        </span>
                        <span className="text-xs text-emerald-300 font-medium">sin diferencias</span>
                    </div>
                    <span className="text-[10px] text-emerald-500 block mt-1 font-bold">
                        Coincidencia plena E-14 = Boletín
                    </span>
                </div>

                {/* 4. Pendientes de Boletín */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl text-white">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Pendientes de Boletín
                    </span>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-black text-amber-400">
                            {kpis.mesas_pendientes || 0}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">mesas</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                        E-14 listo en espera de Registraduría
                    </span>
                </div>

                {/* 5. Reclamaciones Radicadas */}
                <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-5 shadow-xl text-white">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Reclamaciones Radicadas
                    </span>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-black text-indigo-400">
                            {kpis.reclamaciones_radicadas || 0}
                        </span>
                        <span className="text-xs text-indigo-300 font-medium">en comisión</span>
                    </div>
                    <span className="text-[10px] text-indigo-400 block mt-1 font-bold">
                        Defensa jurídica en marcha
                    </span>
                </div>
            </div>

            {/* Barra de Filtros y Acciones */}
            <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                
                {/* Filtro por Estado */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setFiltroEstado('todos')}
                        className={`px-3.5 py-2 rounded-xl font-bold uppercase transition-all ${
                            filtroEstado === 'todos' ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:bg-slate-800'
                        }`}
                    >
                        Todas ({kpis.total_mesas || 0})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFiltroEstado('alerta_roja')}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold uppercase transition-all ${
                            filtroEstado === 'alerta_roja' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'text-rose-400 hover:bg-rose-500/10'
                        }`}
                    >
                        <AlertTriangle size={14} />
                        <span>Alertas Rojas ({kpis.mesas_alerta_roja || 0})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setFiltroEstado('conciliado')}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold uppercase transition-all ${
                            filtroEstado === 'conciliado' ? 'bg-emerald-600 text-white shadow' : 'text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                    >
                        <CheckCircle2 size={14} />
                        <span>Conciliadas ({kpis.mesas_conciliadas || 0})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setFiltroEstado('pendiente_boletin')}
                        className={`px-3.5 py-2 rounded-xl font-bold uppercase transition-all ${
                            filtroEstado === 'pendiente_boletin' ? 'bg-amber-600 text-white shadow' : 'text-amber-400 hover:bg-amber-500/10'
                        }`}
                    >
                        Pendientes ({kpis.mesas_pendientes || 0})
                    </button>
                </div>

                {/* Buscador y Puestos */}
                <div className="flex items-center gap-2 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-64">
                        <input
                            type="text"
                            placeholder="Buscar puesto, mesa, boletín..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchAuditoria()}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-400"
                        />
                        <Search size={14} className="absolute left-2.5 top-2.5 text-slate-500" />
                    </div>

                    {/* Botón Importar Masivo */}
                    <button
                        type="button"
                        onClick={() => setModalBulkImport(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow flex items-center gap-1.5 whitespace-nowrap"
                        title="Importar preconteo de la Registraduría en bloque"
                    >
                        <Upload size={14} />
                        <span>Importar Boletín</span>
                    </button>

                    <button
                        type="button"
                        onClick={fetchAuditoria}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                        title="Refrescar auditoría"
                    >
                        <RefreshCw size={15} />
                    </button>
                </div>
            </div>

            {/* Tabla Comparativa de Auditoría */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-300">
                        <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                            <tr>
                                <th className="py-4 px-4">Puesto & Mesa</th>
                                <th className="py-4 px-4 text-center">Testigo E-14 (Votos)</th>
                                <th className="py-4 px-4 text-center">Boletín Registraduría</th>
                                <th className="py-4 px-4 text-center">Discrepancia / Diferencia</th>
                                <th className="py-4 px-4 text-center">Estado Auditoría</th>
                                <th className="py-4 px-4 text-center">Defensa Jurídica</th>
                                <th className="py-4 px-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-medium">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-slate-500">
                                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                        <span>Consultando actas y comparando boletines oficiales...</span>
                                    </td>
                                </tr>
                            ) : data.reportes && data.reportes.length > 0 ? (
                                data.reportes.map((item) => {
                                    const esAlertaRoja = item.estado_auditoria === 'alerta_roja';
                                    const esConciliado = item.estado_auditoria === 'conciliado';
                                    const esPendiente = item.estado_auditoria === 'pendiente_boletin' || item.boletin_registraduria_votos === null;

                                    return (
                                        <tr key={item.id} className={`hover:bg-slate-800/40 transition-colors ${
                                            esAlertaRoja ? 'bg-rose-950/20' : ''
                                        }`}>
                                            {/* Puesto y Mesa */}
                                            <td className="py-3.5 px-4 font-bold text-white">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                                        esAlertaRoja ? 'bg-rose-500 animate-pulse' : esConciliado ? 'bg-emerald-500' : 'bg-amber-500'
                                                    }`} />
                                                    <div>
                                                        <span className="text-white text-sm block leading-tight">{item.puesto_votacion}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            Mesa #{item.mesa} · {item.municipio || 'Medellín'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Votos Testigo E-14 */}
                                            <td className="py-3.5 px-4 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className="text-base font-black text-white font-mono bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-700">
                                                        {item.votos_candidato_principal || 0}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 mt-0.5">firmados en acta</span>
                                                </div>
                                            </td>

                                            {/* Boletín Registraduría */}
                                            <td className="py-3.5 px-4 text-center">
                                                {item.boletin_registraduria_votos !== null ? (
                                                    <div className="inline-flex flex-col items-center">
                                                        <span className={`text-base font-black font-mono px-2.5 py-0.5 rounded-lg border ${
                                                            esAlertaRoja 
                                                                ? 'bg-rose-900/40 text-rose-300 border-rose-500/50' 
                                                                : 'bg-slate-950 text-slate-200 border-slate-700'
                                                        }`}>
                                                            {item.boletin_registraduria_votos}
                                                        </span>
                                                        <span className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                                                            {item.boletin_numero || 'Boletín Oficial'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEditBoletin(item)}
                                                        className="text-[10px] font-bold uppercase text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-colors"
                                                    >
                                                        + Digitar Boletín
                                                    </button>
                                                )}
                                            </td>

                                            {/* Discrepancia */}
                                            <td className="py-3.5 px-4 text-center">
                                                {esPendiente ? (
                                                    <span className="text-[10px] text-slate-500 font-mono">--</span>
                                                ) : item.diferencia_votos > 0 ? (
                                                    <div className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2.5 py-1 rounded-xl font-mono font-black text-xs">
                                                        <AlertTriangle size={13} />
                                                        <span>+{item.diferencia_votos} VOTOS FALTANTES</span>
                                                    </div>
                                                ) : item.diferencia_votos === 0 ? (
                                                    <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded-xl font-bold text-[10px]">
                                                        <Check size={12} /> Conciliado (0)
                                                    </span>
                                                ) : (
                                                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-xl font-mono font-bold text-[10px]">
                                                        {item.diferencia_votos} Superávit
                                                    </span>
                                                )}
                                            </td>

                                            {/* Estado Auditoría */}
                                            <td className="py-3.5 px-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                                                    esAlertaRoja 
                                                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                                                        : esConciliado 
                                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                                                            : 'bg-slate-800 text-slate-400 border-slate-700'
                                                }`}>
                                                    {esAlertaRoja ? 'Alerta Roja' : esConciliado ? 'Conciliada' : 'Pendiente'}
                                                </span>
                                            </td>

                                            {/* Reclamación Jurídica */}
                                            <td className="py-3.5 px-4 text-center">
                                                {item.reclamacion_radicada ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-lg">
                                                        <FileCheck size={12} /> {item.reclamacion_folio || 'Radicada'}
                                                    </span>
                                                ) : esAlertaRoja ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenReclamacion(item)}
                                                        className="text-[10px] font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1 rounded-lg shadow-sm transition-all flex items-center gap-1 mx-auto"
                                                    >
                                                        <Scale size={11} />
                                                        <span>Exigir Recuento</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-600 text-[10px]">No requerida</span>
                                                )}
                                            </td>

                                            {/* Acciones */}
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Ver Foto E-14 */}
                                                    {item.acta_e14_url ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setModalFoto(item)}
                                                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition-colors"
                                                            title="Ver Fotografía del Acta E-14"
                                                        >
                                                            <Eye size={15} />
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-600 p-1.5" title="Sin foto de E-14">-</span>
                                                    )}

                                                    {/* Editar Boletín */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEditBoletin(item)}
                                                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                                                        title="Ingresar / Editar número de boletín"
                                                    >
                                                        <Edit3 size={15} />
                                                    </button>

                                                    {/* Reclamación Modal */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenReclamacion(item)}
                                                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-colors"
                                                        title="Ver / Imprimir texto de reclamación jurídica"
                                                    >
                                                        <FileText size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-slate-500">
                                        No se encontraron actas escrutadas bajo este filtro.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL 1: Inspector Visual del Acta E-14 (Side-by-side) */}
            {modalFoto && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                            <div>
                                <h4 className="font-black text-sm uppercase text-white">
                                    Acta E-14 Original: {modalFoto.puesto_votacion} — Mesa #{modalFoto.mesa}
                                </h4>
                                <span className="text-[11px] text-slate-400">
                                    Votos Testigo en Acta: <strong className="text-emerald-400">{modalFoto.votos_candidato_principal}</strong> | Votos Boletín: <strong className="text-rose-400">{modalFoto.boletin_registraduria_votos !== null ? modalFoto.boletin_registraduria_votos : 'N/A'}</strong>
                                </span>
                            </div>
                            <button onClick={() => setModalFoto(null)} className="p-1 text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 max-h-[70vh] overflow-y-auto flex items-center justify-center bg-slate-950 rounded-2xl mx-4">
                            <img
                                src={modalFoto.acta_e14_url}
                                alt="Acta E-14"
                                className="max-w-full h-auto rounded-xl shadow-lg border border-slate-800"
                            />
                        </div>

                        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                            <a
                                href={modalFoto.acta_e14_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-bold"
                            >
                                <span>Abrir imagen en tamaño completo</span>
                                <ExternalLink size={12} />
                            </a>
                            <button
                                onClick={() => setModalFoto(null)}
                                className="px-5 py-2 bg-slate-800 text-white font-bold text-xs uppercase rounded-xl hover:bg-slate-700"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: Reclamación Jurídica Formal (Código Electoral) */}
            {modalReclamacion && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="p-5 bg-gradient-to-r from-rose-950 to-slate-950 border-b border-rose-500/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl">
                                    <Scale size={22} />
                                </div>
                                <div>
                                    <h4 className="font-black text-base uppercase text-white">
                                        Reclamación Formal de Escrutinio y Recuento
                                    </h4>
                                    <span className="text-xs text-rose-300 font-mono">
                                        {modalReclamacion.puesto} — Mesa #{modalReclamacion.mesa} (Diferencia: +{modalReclamacion.diferencia} votos)
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setModalReclamacion(null)} className="p-1 text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                                {modalReclamacion.texto_reclamacion}
                            </div>

                            {/* Radicado */}
                            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div className="space-y-1 w-full sm:w-auto">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                                        Número de Radicado / Acta de Entrega en Comisión
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Ej. REC-2026-MED-048"
                                        value={folioRadicadoInput}
                                        onChange={(e) => setFolioRadicadoInput(e.target.value)}
                                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleMarcarReclamado}
                                    disabled={submittingAction}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow"
                                >
                                    {submittingAction ? 'Guardando...' : 'Marcar como Radicada'}
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={handleCopiarReclamacion}
                                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase rounded-xl transition-colors"
                            >
                                {copiadoTexto ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                <span>{copiadoTexto ? '¡Texto Copiado!' : 'Copiar Texto Completo'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setModalReclamacion(null)}
                                className="px-5 py-2 bg-slate-800 text-white font-bold text-xs uppercase rounded-xl hover:bg-slate-700"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: Editar Boletín de Mesa */}
            {modalEditBoletin && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                            <h4 className="font-black text-sm uppercase text-white">
                                Ingresar Boletín Oficial Registraduría
                            </h4>
                            <button onClick={() => setModalEditBoletin(null)} className="p-1 text-slate-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveBoletin} className="p-5 space-y-4 text-xs">
                            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-slate-300">
                                <span className="font-bold text-white block">{modalEditBoletin.puesto_votacion}</span>
                                <span className="text-slate-400">Mesa #{modalEditBoletin.mesa}</span>
                                <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between">
                                    <span className="text-slate-400">Votos en Acta E-14 Testigo:</span>
                                    <strong className="text-emerald-400 text-sm font-mono">{modalEditBoletin.votos_candidato_principal}</strong>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                                    Número o Nombre del Boletín
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej. Boletín 14 (17:45)"
                                    value={formBoletin.boletin_numero}
                                    onChange={(e) => setFormBoletin({ ...formBoletin, boletin_numero: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 font-bold text-white focus:outline-none focus:border-indigo-400"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                                    Votos Reportados por Registraduría para la Candidatura
                                </label>
                                <input
                                    type="number"
                                    placeholder="Ej. 15"
                                    value={formBoletin.boletin_registraduria_votos}
                                    onChange={(e) => setFormBoletin({ ...formBoletin, boletin_registraduria_votos: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 font-mono font-black text-white focus:outline-none focus:border-indigo-400 text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                                    Observaciones
                                </label>
                                <textarea
                                    rows="2"
                                    value={formBoletin.observaciones}
                                    onChange={(e) => setFormBoletin({ ...formBoletin, observaciones: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-indigo-400"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setModalEditBoletin(null)}
                                    className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingAction}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow"
                                >
                                    {submittingAction ? 'Guardando...' : 'Calcular Discrepancia'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: Importación Masiva de Preconteo / Boletines */}
            {modalBulkImport && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Upload size={18} className="text-indigo-400" />
                                <h4 className="font-black text-sm uppercase text-white">
                                    Importar Preconteo Oficial en Bloque
                                </h4>
                            </div>
                            <button onClick={() => setModalBulkImport(false)} className="p-1 text-slate-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleBulkImport} className="p-5 space-y-4 text-xs">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                                    Identificador del Boletín Oficial
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej. Boletín 22 (Preconteo 98%)"
                                    value={bulkBoletinNumero}
                                    onChange={(e) => setBulkBoletinNumero(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 font-bold text-white focus:outline-none focus:border-indigo-400"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                                    Pega aquí los datos tabulares (Copiar y Pegar desde Excel o CSV)
                                </label>
                                <p className="text-[10px] text-slate-500 mb-1.5">
                                    Formato por fila: <code>Nombre Puesto [TAB o Coma] Mesa [TAB o Coma] Votos Registraduría</code>
                                </p>
                                <textarea
                                    rows="6"
                                    placeholder="I.E. San Javier	01	15
Colegio Mayor	02	62
Escuela Israel	05	44"
                                    value={bulkText}
                                    onChange={(e) => setBulkText(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-[11px] text-emerald-400 focus:outline-none focus:border-indigo-400"
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setModalBulkImport(false)}
                                    className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={bulkLoading}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow"
                                >
                                    {bulkLoading ? 'Cruzando Datos...' : 'Auditar Mesas'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
