import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useCampaign } from '../context/CampaignContext';
import { colombiaData } from '../data/colombiaData';
import { Search, Save, CheckCircle, Loader, Zap, ExternalLink, RefreshCw, Flag, Star, ShieldAlert, Skull, ShieldCheck } from 'lucide-react';
import VoterScoringModal from '../components/VoterScoringModal';
import { API } from '../config/api';

const PAGE_SIZE = 100;

export default function VotersList() {
    const { campaigns, activeCampaign } = useCampaign();
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const [voters, setVoters] = useState([]);
    const [rows, setRows] = useState([]);       // copia editable
    const [allApoyos, setAllApoyos] = useState([]);
    const [modified, setModified] = useState({}); // id => true
    const [saving, setSaving] = useState({});     // id => true
    const [saved, setSaved] = useState({});       // id => true
    const [loading, setLoading] = useState(true);
    const [autoAssigning, setAutoAssigning] = useState(false);
    const [auditingTrashumancia, setAuditingTrashumancia] = useState(false);
    const [auditingRealVotes, setAuditingRealVotes] = useState(false);
    const [search, setSearch] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterCamp, setFilterCamp] = useState(activeCampaign?.id || '');
    const [filterApoyo, setFilterApoyo] = useState('');
    const [filterTrashumancia, setFilterTrashumancia] = useState('');
    const [page, setPage] = useState(1);
    const [scoringVoter, setScoringVoter] = useState(null);

    useEffect(() => {
        if (activeCampaign) {
            setFilterCamp(activeCampaign.id);
        }
    }, [activeCampaign]);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const [resVoters, resApoyos] = await Promise.all([
                axios.get(`${API}/voters`, { headers }),
                axios.get(`${API}/apoyos`, { headers }).catch(() => ({ data: [] }))
            ]);
            setVoters(resVoters.data);
            setRows(resVoters.data.map(v => ({ ...v })));
            setAllApoyos(resApoyos.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    // Filtrado
    const filtered = rows.filter(v => {
        const q = search.toLowerCase();
        const ok = !q || [v.nombres, v.apellidos, v.cedula, v.municipio, v.lugar_votacion, v.lider_nombre]
            .some(f => f && f.toLowerCase().includes(q));
        const dept = !filterDept || v.departamento === filterDept;
        const campOk = !filterCamp || v.campana_id === parseInt(filterCamp, 10);
        const apoyoOk = !filterApoyo || v.apoyo_id === parseInt(filterApoyo, 10);
        
        let trashumanciaOk = true;
        if (filterTrashumancia === 'voto_real') {
            trashumanciaOk = !!v.es_voto_real;
        } else if (filterTrashumancia === 'fallecido') {
            trashumanciaOk = !!v.es_fallecido || v.estado_trashumancia === 'fallecido';
        } else if (filterTrashumancia === 'duplicado') {
            trashumanciaOk = !!v.es_duplicado;
        } else if (filterTrashumancia) {
            trashumanciaOk = v.estado_trashumancia === filterTrashumancia;
        }

        return ok && dept && campOk && apoyoOk && trashumanciaOk;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleCell = (id, field, value) => {
        setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
        if (field === 'departamento') {
            setRows(prev => prev.map(r => r.id === id ? { ...r, departamento: value, municipio: '' } : r));
        }
        setModified(prev => ({ ...prev, [id]: true }));
        setSaved(prev => ({ ...prev, [id]: false }));
    };

    const handleSave = async (row) => {
        setSaving(prev => ({ ...prev, [row.id]: true }));
        try {
            await axios.put(`${API}/voters/${row.id}`, row, { headers: { Authorization: `Bearer ${token}` } });
            setModified(prev => ({ ...prev, [row.id]: false }));
            setSaved(prev => ({ ...prev, [row.id]: true }));
            setTimeout(() => setSaved(prev => ({ ...prev, [row.id]: false })), 2500);
        } catch (e) {
            alert(e.response?.data?.message || 'Error al guardar');
        } finally {
            setSaving(prev => ({ ...prev, [row.id]: false }));
        }
    };

    const handleAutoAssign = async () => {
        setAutoAssigning(true);
        try {
            const res = await axios.post(`${API}/censo/auto-assign`, {}, { headers });
            alert(res.data.message);
            fetch();
        } catch (e) {
            alert(e.response?.data?.message || 'Error en autodiligenciamiento');
        } finally {
            setAutoAssigning(false);
        }
    };

    const handleAuditarTrashumancia = async () => {
        setAuditingTrashumancia(true);
        try {
            const campQuery = filterCamp ? `?campana_id=${filterCamp}` : '';
            const res = await axios.post(`${API}/voters/auditar-trashumancia${campQuery}`, {}, { headers });
            const s = res.data.stats;
            alert(`🛡️ Auditoría de Trashumancia Completada:\n\n` +
                `• Total Votantes Auditados: ${s.total_auditados}\n` +
                `• 🟢 Votos Válidos: ${s.validos}\n` +
                `• 🟡 Votan en otro Municipio: ${s.alerta_municipio}\n` +
                `• 🔴 Votan en otro Departamento: ${s.alerta_departamento}\n` +
                `• ⚪ No encontrados en Censo: ${s.no_en_censo}\n` +
                `• 🟠 Sospecha Concentración de Direcciones: ${s.sospecha_concentracion}`);
            fetch();
        } catch (e) {
            alert(e.response?.data?.message || 'Error al ejecutar auditoría de trashumancia');
        } finally {
            setAuditingTrashumancia(false);
        }
    };

    const handleAuditarVotosReales = async () => {
        setAuditingRealVotes(true);
        try {
            const campQuery = filterCamp ? `?campana_id=${filterCamp}` : '';
            const res = await axios.post(`${API}/voters/auditar-votos-reales${campQuery}`, {}, { headers });
            const s = res.data.data.stats;
            alert(`🛡️ AUDITORÍA DE DIFUNTOS Y VOTOS REALES COMPLETADA:\n\n` +
                `• Total Padrón Bruto: ${s.total_auditados}\n` +
                `• 💀 Cédulas de Difuntos Detectadas: ${s.difuntos_detectados}\n` +
                `• ❌ No Habilitados en Censo: ${s.no_en_censo}\n` +
                `• 🚚 Trashumancia (Fuera de Territorio): ${s.trashumancia_municipio + s.trashumancia_departamento}\n` +
                `• 👥 Duplicados entre Líderes: ${s.duplicados_detectados}\n\n` +
                `🎯 VOTOS REALES COMPUTABLES: ${s.votos_reales_computables} (${s.porcentaje_efectividad_real}% efectividad)\n` +
                `🛡️ Voto Duro Seguro (Ponderado): ${s.proyeccion_ponderada_fidelidad}`);
            fetch();
        } catch (e) {
            alert(e.response?.data?.message || 'Error al ejecutar auditoría de votos reales');
        } finally {
            setAuditingRealVotes(false);
        }
    };

    const handleOpenRegistraduria = (cedula) => {
        const cleanCed = String(cedula || '').replace(/\D/g, '').trim();
        if (cleanCed) {
            navigator.clipboard.writeText(cleanCed);
        }
        window.open('https://wsp.registraduria.gov.co/censo/consultar/', '_blank', 'noopener,noreferrer');
    };

    const inputCls = "w-full bg-transparent border-0 focus:outline-none focus:bg-white focus:border focus:border-blue-400 focus:rounded px-1 py-0.5 text-xs text-gray-700 h-7";
    const selectCls = "w-full bg-transparent border-0 focus:outline-none focus:bg-white focus:border focus:border-blue-400 focus:rounded px-1 py-0.5 text-xs text-gray-700 h-7";

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-black text-gray-800 uppercase tracking-wide">Votantes</h1>
                    <p className="text-gray-400 text-xs">{filtered.length.toLocaleString()} registros · mostrando hasta 100 por página</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <button
                        onClick={handleAuditarVotosReales}
                        disabled={auditingRealVotes}
                        className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-gray-400 text-white font-black px-3.5 py-2 rounded-lg uppercase tracking-wider text-xs shadow-sm transition-all"
                        title="Audita bajas por defunción RNEC, elimina votos fantasmas y calcula votos reales"
                    >
                        <Skull size={14} className={auditingRealVotes ? 'animate-bounce text-yellow-300' : 'text-yellow-300'} />
                        <span>{auditingRealVotes ? 'Auditando...' : '💀 Auditar Difuntos & Votos Reales'}</span>
                    </button>

                    <button
                        onClick={handleAutoAssign}
                        disabled={autoAssigning}
                        className="flex items-center gap-1.5 bg-[#00B894] hover:bg-[#00a884] disabled:bg-gray-300 text-white font-black px-3.5 py-2 rounded-lg uppercase tracking-wider text-xs shadow-sm transition-all"
                        title="Autodiligencia los puestos y mesas de los votantes buscando en el censo electoral local"
                    >
                        <Zap size={14} className={autoAssigning ? 'animate-bounce text-yellow-300' : 'text-yellow-300'} />
                        <span>{autoAssigning ? 'Autodiligenciando...' : '⚡ Autodiligenciar Censo'}</span>
                    </button>

                    <button
                        onClick={handleAuditarTrashumancia}
                        disabled={auditingTrashumancia}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 disabled:bg-gray-400 text-white font-black px-3.5 py-2 rounded-lg uppercase tracking-wider text-xs shadow-sm transition-all border border-slate-600"
                        title="Audita automáticamente si los votantes están habilitados en el municipio/departamento de la campaña activa"
                    >
                        <ShieldAlert size={14} className={auditingTrashumancia ? 'animate-spin text-rose-400' : 'text-rose-400'} />
                        <span>{auditingTrashumancia ? 'Auditando...' : '🛡️ Auditar Trashumancia'}</span>
                    </button>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-center shadow-sm">
                        <span className="text-emerald-700 block font-bold uppercase text-[10px]">Votos Reales</span>
                        <span className="text-base font-black text-emerald-600">{voters.filter(v => v.es_voto_real).length}</span>
                    </div>

                    {voters.filter(v => v.es_fallecido).length > 0 && (
                        <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5 text-center shadow-sm">
                            <span className="text-rose-700 block font-bold uppercase text-[10px]">💀 Difuntos</span>
                            <span className="text-base font-black text-rose-600">{voters.filter(v => v.es_fallecido).length}</span>
                        </div>
                    )}

                    <div className="bg-white border rounded-lg px-3 py-1.5 text-center shadow-sm">
                        <span className="text-gray-400 block font-bold uppercase text-[10px]">Con Puesto</span>
                        <span className="text-base font-black text-[#00B894]">{voters.filter(v => v.lugar_votacion).length}</span>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-64">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text" placeholder="Buscar por nombre, cédula, municipio o puesto..."
                        value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#00B894]"
                    />
                </div>

                {/* Filtro de Campaña */}
                <select
                    value={filterCamp}
                    onChange={e => { setFilterCamp(e.target.value); setFilterApoyo(''); setPage(1); }}
                    className="px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none font-bold text-gray-700 bg-white min-w-44"
                >
                    <option value="">Todas las Campañas</option>
                    {campaigns.map(c => (
                        <option key={c.id} value={c.id}>
                            {c.nombre} ({c.tipo_cargo.toUpperCase()})
                        </option>
                    ))}
                </select>

                {/* Filtro de Apoyo Político */}
                <select
                    value={filterApoyo}
                    onChange={e => { setFilterApoyo(e.target.value); setPage(1); }}
                    className="px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none font-bold text-emerald-800 bg-white min-w-48"
                >
                    <option value="">Todos los Apoyos Políticos</option>
                    {allApoyos
                        .filter(a => !filterCamp || a.campana_id === parseInt(filterCamp, 10))
                        .map(a => (
                            <option key={a.id} value={a.id}>
                                🤝 {a.nombre} ({a.cargo_o_rol || a.tipo_apoyo})
                            </option>
                        ))}
                </select>

                {/* Filtro de Trashumancia / Censo / Difuntos */}
                <select
                    value={filterTrashumancia}
                    onChange={e => { setFilterTrashumancia(e.target.value); setPage(1); }}
                    className="px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none font-bold text-rose-700 bg-white min-w-48"
                >
                    <option value="">🛡️ Auditoría Electoral / Todos</option>
                    <option value="voto_real">🟢 Votos Reales Computables</option>
                    <option value="fallecido">💀 DIFUNTOS (Bajas por Muerte)</option>
                    <option value="duplicado">👥 Duplicados entre Líderes</option>
                    <option value="valido">🟢 Voto Válido en Territorio</option>
                    <option value="alerta_municipio">🟡 Alerta: Vota en otro Municipio</option>
                    <option value="alerta_departamento">🔴 Alerta: Vota en otro Departamento</option>
                    <option value="no_en_censo">⚪ Sin Censo Local</option>
                    <option value="sospecha_concentracion">🟠 Concentración de Direcciones</option>
                </select>

                <select value={filterDept} onChange={e => { setFilterDept(e.target.value); setPage(1); }}
                    className="px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none min-w-40 bg-white">
                    <option value="">Todos los departamentos</option>
                    {Object.keys(colombiaData).sort().map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>

            {/* Tabla Estilo Excel */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader className="animate-spin text-[#00B894]" size={30} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-xs" style={{ minWidth: '1450px' }}>
                            <thead>
                                <tr className="bg-[#2D3436] text-white text-[11px] uppercase tracking-wider">
                                    <th className="px-2 py-2.5 text-center w-8 border-r border-gray-600">#</th>
                                    <th className="px-2 py-2.5 text-left border-r border-gray-600" style={{width:'150px'}}>Nombres</th>
                                    <th className="px-2 py-2.5 text-left border-r border-gray-600" style={{width:'130px'}}>Apellidos</th>
                                    <th className="px-2 py-2.5 text-left border-r border-gray-600" style={{width:'100px'}}>Cédula</th>
                                    <th className="px-2 py-2.5 text-left border-r border-gray-600" style={{width:'140px'}}>Campaña</th>
                                    <th className="px-2 py-2.5 text-left border-r border-gray-600" style={{width:'150px'}}>🤝 Apoyo / Aliado</th>
                                    <th className="px-2 py-2.5 text-left border-r border-gray-600" style={{width:'130px'}}>Departamento</th>
                                    <th className="px-2 py-2.5 text-left border-r border-gray-600" style={{width:'130px'}}>Municipio</th>
                                    <th className="px-2 py-2.5 text-left border-r border-gray-600 bg-[#00B894]" style={{width:'180px'}}>📍 Lugar de Votación</th>
                                    <th className="px-2 py-2.5 text-left border-r border-gray-600" style={{width:'70px'}}>Mesa</th>
                                    <th className="px-2 py-2.5 text-center border-r border-gray-600" style={{width:'130px'}}>🛡️ Trashumancia</th>
                                    <th className="px-2 py-2.5 text-left border-r border-gray-600" style={{width:'130px'}}>Líder</th>
                                    <th className="px-2 py-2.5 text-center border-r border-gray-600" style={{width:'90px'}}>⭐ Fidelidad</th>
                                    <th className="px-2 py-2.5 text-center w-20">Guardar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((row, idx) => {
                                    const isModified = modified[row.id];
                                    const isSaving  = saving[row.id];
                                    const isSaved   = saved[row.id];
                                    const munis = colombiaData[row.departamento]?.sort() || [];
                                    const rowBg = isSaved ? 'bg-emerald-50' : isModified ? 'bg-yellow-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60';
                                    return (
                                        <tr key={row.id} className={`${rowBg} border-b border-gray-100 hover:bg-blue-50/30 transition-colors`}>
                                            {/* # */}
                                            <td className="px-1 py-0.5 text-center text-gray-400 font-mono border-r border-gray-100 text-[10px]">
                                                {(page - 1) * PAGE_SIZE + idx + 1}
                                            </td>
                                            {/* Nombres */}
                                            <td className="border-r border-gray-100 px-1">
                                                <input value={row.nombres || ''} onChange={e => handleCell(row.id, 'nombres', e.target.value)} className={inputCls} />
                                            </td>
                                            {/* Apellidos */}
                                            <td className="border-r border-gray-100 px-1">
                                                <input value={row.apellidos || ''} onChange={e => handleCell(row.id, 'apellidos', e.target.value)} className={inputCls} />
                                            </td>
                                            {/* Cédula */}
                                            <td className="border-r border-gray-100 px-1">
                                                <div className="flex items-center justify-between">
                                                    <input value={row.cedula || ''} onChange={e => handleCell(row.id, 'cedula', e.target.value)} className={`${inputCls} font-mono`} />
                                                </div>
                                            </td>
                                            {/* Campaña */}
                                            <td className="border-r border-gray-100 px-1">
                                                <select
                                                    value={row.campana_id || ''}
                                                    onChange={e => handleCell(row.id, 'campana_id', e.target.value ? parseInt(e.target.value, 10) : null)}
                                                    className={`${selectCls} font-bold text-[10px] text-slate-800`}
                                                >
                                                    <option value="">-- Sin Campaña --</option>
                                                    {campaigns.map(c => (
                                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            {/* Apoyo Político */}
                                            <td className="border-r border-gray-100 px-1">
                                                <select
                                                    value={row.apoyo_id || ''}
                                                    onChange={e => handleCell(row.id, 'apoyo_id', e.target.value ? parseInt(e.target.value, 10) : null)}
                                                    className={`${selectCls} text-[10px] font-semibold text-emerald-800`}
                                                >
                                                    <option value="">-- Sin Apoyo --</option>
                                                    {allApoyos
                                                        .filter(a => !row.campana_id || a.campana_id === row.campana_id)
                                                        .map(a => (
                                                            <option key={a.id} value={a.id}>{a.nombre}</option>
                                                        ))}
                                                </select>
                                            </td>
                                            {/* Departamento */}
                                            <td className="border-r border-gray-100 px-1">
                                                <select value={row.departamento || ''} onChange={e => handleCell(row.id, 'departamento', e.target.value)} className={selectCls}>
                                                    <option value="">-- Seleccionar --</option>
                                                    {Object.keys(colombiaData).sort().map(d => <option key={d} value={d}>{d}</option>)}
                                                </select>
                                            </td>
                                            {/* Municipio */}
                                            <td className="border-r border-gray-100 px-1">
                                                <select value={row.municipio || ''} onChange={e => handleCell(row.id, 'municipio', e.target.value)} className={selectCls} disabled={!row.departamento}>
                                                    <option value="">-- Seleccionar --</option>
                                                    {munis.map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            </td>
                                            {/* Lugar Votación */}
                                            <td className="border-r border-gray-100 px-1 bg-emerald-50/40">
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        value={row.lugar_votacion || ''}
                                                        onChange={e => handleCell(row.id, 'lugar_votacion', e.target.value)}
                                                        placeholder="Puesto de votación..."
                                                        className={`${inputCls} placeholder-emerald-300 flex-1`}
                                                    />
                                                    {!row.lugar_votacion && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenRegistraduria(row.cedula)}
                                                            title="Copiar cédula y abrir Registraduría"
                                                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                                                        >
                                                            <ExternalLink size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            {/* Mesa */}
                                            <td className="border-r border-gray-100 px-1">
                                                <input
                                                    value={row.mesa || ''}
                                                    onChange={e => handleCell(row.id, 'mesa', e.target.value)}
                                                    placeholder="Mesa"
                                                    className={`${inputCls} text-center`}
                                                />
                                            </td>
                                            {/* Trashumancia / Censo Real */}
                                            <td className="border-r border-gray-100 px-1 text-center" title={row.motivo_invalidez || row.detalle_trashumancia || 'Sin análisis de censo'}>
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider cursor-help ${
                                                    row.es_fallecido || row.estado_trashumancia === 'fallecido'
                                                        ? 'bg-rose-600 text-white font-black shadow-sm'
                                                        : row.es_duplicado
                                                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                                            : row.es_voto_real
                                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                        : row.estado_trashumancia === 'alerta_municipio'
                                                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                                            : row.estado_trashumancia === 'alerta_departamento'
                                                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                                                : row.estado_trashumancia === 'sospecha_concentracion'
                                                                    ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                                                    : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {row.es_fallecido || row.estado_trashumancia === 'fallecido' ? '💀 Difunto' :
                                                     row.es_duplicado ? '👥 Duplicado' :
                                                     row.es_voto_real ? '🟢 Voto Real' :
                                                     row.estado_trashumancia === 'alerta_municipio' ? '🟡 Otro Mpio' :
                                                     row.estado_trashumancia === 'alerta_departamento' ? '🔴 Dif. Dpto' :
                                                     row.estado_trashumancia === 'sospecha_concentracion' ? '🟠 Concentrado' :
                                                     '⚪ Sin Censo'}
                                                </span>
                                            </td>
                                            {/* Líder */}
                                            <td className="border-r border-gray-100 px-1">
                                                <input value={row.lider_nombre || ''} onChange={e => handleCell(row.id, 'lider_nombre', e.target.value)} className={inputCls} />
                                            </td>
                                            {/* Fidelidad / Scoring */}
                                            <td className="border-r border-gray-100 px-1 text-center">
                                                <button
                                                    onClick={() => setScoringVoter(row)}
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition ${
                                                        (row.fidelidad_score || 3) >= 4 ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' :
                                                        (row.fidelidad_score || 3) === 3 ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100' :
                                                        'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                                                    }`}
                                                    title="Abrir ficha de fidelidad y seguimiento"
                                                >
                                                    <Star className="w-3 h-3 fill-current" />
                                                    <span>{row.fidelidad_score || 3}/5</span>
                                                </button>
                                            </td>
                                            {/* Botón Guardar */}
                                            <td className="px-1 text-center">
                                                <button
                                                    onClick={() => handleSave(row)}
                                                    disabled={!isModified || isSaving}
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded font-bold transition-all text-[11px]
                                                        ${isSaved ? 'bg-emerald-100 text-emerald-600' :
                                                          isModified ? 'bg-[#00B894] text-white hover:bg-[#00a884] shadow-sm' :
                                                          'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                                                >
                                                    {isSaving ? <div className="w-3 h-3 border-b-2 border-white rounded-full animate-spin" /> :
                                                     isSaved  ? <><CheckCircle size={11} /> OK</> :
                                                                <><Save size={11} /> Guardar</>}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {paginated.length === 0 && (
                                    <tr><td colSpan={11} className="py-12 text-center text-gray-400">No se encontraron registros</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Paginación */}
                {!loading && totalPages > 1 && (
                    <div className="border-t px-4 py-2.5 flex items-center justify-between bg-gray-50 text-xs">
                        <span className="text-gray-500">Página {page} de {totalPages} · {filtered.length} registros</span>
                        <div className="flex gap-1 items-center">
                            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                                className="px-2.5 py-1 border rounded disabled:opacity-40 hover:bg-gray-100 font-bold">← Anterior</button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let p = totalPages <= 5 ? i+1 : page <= 3 ? i+1 : page >= totalPages-2 ? totalPages-4+i : page-2+i;
                                return <button key={p} onClick={() => setPage(p)}
                                    className={`w-7 h-7 rounded font-bold ${page===p?'bg-[#00B894] text-white':'border hover:bg-gray-100'}`}>{p}</button>;
                            })}
                            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
                                className="px-2.5 py-1 border rounded disabled:opacity-40 hover:bg-gray-100 font-bold">Siguiente →</button>
                        </div>
                    </div>
                )}
            </div>

            {scoringVoter && (
                <VoterScoringModal
                    voter={scoringVoter}
                    onClose={() => setScoringVoter(null)}
                    onUpdated={(updated) => {
                        setRows(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
                    }}
                />
            )}
        </div>
    );
}
