import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCampaign } from '../context/CampaignContext';
import { colombiaData } from '../data/colombiaData';
import {
    CalendarDays, Clock, MapPin, Users, Mic, UserCheck,
    Camera, Upload, Download, FileSpreadsheet, Play,
    CheckCircle2, XCircle, Plus, Search, Filter, Trash2,
    Edit3, Eye, Sparkles, ChevronLeft, ChevronRight,
    AlertCircle, X, Check, Layers, Image as ImageIcon,
    Building2, Flag, Phone, FileText, ArrowRight
} from 'lucide-react';
import { API } from '../config/api';

const ESTADOS_INFO = {
    programada: { label: 'Programada', color: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500' },
    en_curso:   { label: 'En Curso (Iniciada)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse', dot: 'bg-emerald-500' },
    finalizada: { label: 'Finalizada', color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
    cancelada:  { label: 'Cancelada', color: 'bg-rose-100 text-rose-800 border-rose-200', dot: 'bg-rose-500' }
};

export default function MeetingsPage() {
    const { user: currentUser } = useAuth();
    const { campaigns, activeCampaign } = useCampaign();
    const token = localStorage.getItem('token');
    const authHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

    // Estados principales
    const [reuniones, setReuniones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [equipos, setEquipos] = useState({ oradores: [], lideresAvanzada: [] });

    // Vista: 'calendario' | 'lista'
    const [viewMode, setViewMode] = useState('calendario');

    // Filtros
    const [filterCampana, setFilterCampana] = useState('activa'); // 'activa' | 'todas' | ID
    const [filterPreside, setFilterPreside] = useState('todos'); // 'todos' | 'candidato' | 'orador'
    const [filterOradorId, setFilterOradorId] = useState('todos');
    const [filterEstado, setFilterEstado] = useState('todos');
    const [filterGrupo, setFilterGrupo] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');

    // Estado del Calendario
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedCalendarDate, setSelectedCalendarDate] = useState(
        new Date().toISOString().split('T')[0]
    );

    // Modales
    const [modalCrearOpen, setModalCrearOpen] = useState(false);
    const [editingReunion, setEditingReunion] = useState(null);

    const [modalEstadoOpen, setModalEstadoOpen] = useState(false);
    const [selectedReunionForStatus, setSelectedReunionForStatus] = useState(null);
    const [statusAccion, setStatusAccion] = useState('iniciar'); // 'iniciar' | 'finalizar' | 'cancelar'
    const [statusObservaciones, setStatusObservaciones] = useState('');
    const [statusAsistentesReales, setStatusAsistentesReales] = useState('');

    const [modalEvidenciasOpen, setModalEvidenciasOpen] = useState(false);
    const [selectedReunionForEvidencias, setSelectedReunionForEvidencias] = useState(null);
    const [selectedPhotoPreview, setSelectedPhotoPreview] = useState(null);
    const [uploadingEvidencia, setUploadingEvidencia] = useState(false);
    const fileInputRef = useRef(null);

    const [modalAsistentesOpen, setModalAsistentesOpen] = useState(false);
    const [selectedReunionForAsistentes, setSelectedReunionForAsistentes] = useState(null);
    const [asistentesList, setAsistentesList] = useState([]);
    const [loadingAsistentes, setLoadingAsistentes] = useState(false);
    const [tabAsistentes, setTabAsistentes] = useState('lista'); // 'lista' | 'nuevo' | 'importar'
    const [asistenteSearch, setAsistenteSearch] = useState('');
    const [nuevoAsistenteForm, setNuevoAsistenteForm] = useState({
        nombre_completo: '',
        cedula: '',
        telefono: '',
        barrio: '',
        municipio: '',
        departamento: '',
        lider_referido: '',
        grupo_avanzada: '',
        observaciones: ''
    });
    const [importExcelFile, setImportExcelFile] = useState(null);
    const [importingExcel, setImportingExcel] = useState(false);

    // Formulario de Reunión (Crear / Editar)
    const [formData, setFormData] = useState({
        campana_id: '',
        titulo: '',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0],
        hora_inicio: '18:00',
        hora_fin: '20:00',
        presidida_por: 'candidato', // 'candidato' | 'orador'
        orador_id: '',
        orador_nombre: '',
        lider_avanzada_id: '',
        lider_avanzada_nombre: '',
        grupo_avanzada: 'Avanzada General',
        aforo_estimado: 50,
        departamento: '',
        municipio: '',
        direccion: '',
        barrio_vereda: '',
        lugar_nombre: '',
        observaciones: ''
    });
    const [municipiosOptions, setMunicipiosOptions] = useState([]);
    const [submittingForm, setSubmittingForm] = useState(false);
    const [formError, setFormError] = useState('');

    // Cargar equipos (oradores y líderes de avanzada)
    const fetchEquipos = async () => {
        try {
            const res = await axios.get(`${API}/reuniones/equipos`, authHeaders);
            setEquipos(res.data);
        } catch (err) {
            console.error('Error al cargar equipos:', err);
        }
    };

    // Cargar reuniones
    const fetchReuniones = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterCampana === 'activa' && activeCampaign?.id) {
                params.campana_id = activeCampaign.id;
            } else if (filterCampana !== 'todas' && filterCampana !== 'activa') {
                params.campana_id = filterCampana;
            }

            if (filterPreside !== 'todos') params.presidida_por = filterPreside;
            if (filterOradorId !== 'todos') params.orador_id = filterOradorId;
            if (filterEstado !== 'todos') params.estado = filterEstado;
            if (filterGrupo !== 'todos') params.grupo_avanzada = filterGrupo;
            if (searchTerm) params.search = searchTerm;

            const res = await axios.get(`${API}/reuniones`, { ...authHeaders, params });
            setReuniones(res.data);
        } catch (err) {
            console.error('Error al cargar reuniones:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEquipos();
    }, []);

    useEffect(() => {
        fetchReuniones();
    }, [filterCampana, activeCampaign?.id, filterPreside, filterOradorId, filterEstado, filterGrupo, searchTerm]);

    // Actualizar municipios cuando cambia departamento en el formulario
    useEffect(() => {
        if (formData.departamento && colombiaData[formData.departamento]) {
            setMunicipiosOptions(colombiaData[formData.departamento]);
        } else {
            setMunicipiosOptions([]);
        }
    }, [formData.departamento]);

    // Abrir modal de creación
    const openCreateModal = () => {
        setEditingReunion(null);
        const defaultCampId = activeCampaign?.id || (campaigns.length > 0 ? campaigns[0].id : '');
        const defaultDept = activeCampaign?.departamento || 'Antioquia';
        const defaultMuni = activeCampaign?.municipio || (colombiaData[defaultDept] ? colombiaData[defaultDept][0] : '');

        setFormData({
            campana_id: defaultCampId,
            titulo: '',
            descripcion: '',
            fecha: selectedCalendarDate || new Date().toISOString().split('T')[0],
            hora_inicio: '18:00',
            hora_fin: '20:00',
            presidida_por: 'candidato',
            orador_id: '',
            orador_nombre: '',
            lider_avanzada_id: currentUser?.role === 'lider_avanzada' ? currentUser.id : '',
            lider_avanzada_nombre: currentUser?.role === 'lider_avanzada' ? currentUser.nombre : '',
            grupo_avanzada: 'Avanzada Central',
            aforo_estimado: 50,
            departamento: defaultDept,
            municipio: defaultMuni,
            direccion: '',
            barrio_vereda: '',
            lugar_nombre: '',
            observaciones: ''
        });
        setFormError('');
        setModalCrearOpen(true);
    };

    // Abrir modal de edición
    const openEditModal = (r) => {
        setEditingReunion(r);
        setFormData({
            campana_id: r.campana_id,
            titulo: r.titulo,
            descripcion: r.descripcion || '',
            fecha: r.fecha,
            hora_inicio: r.hora_inicio,
            hora_fin: r.hora_fin || '',
            presidida_por: r.presidida_por || 'candidato',
            orador_id: r.orador_id || '',
            orador_nombre: r.orador_nombre || '',
            lider_avanzada_id: r.lider_avanzada_id || '',
            lider_avanzada_nombre: r.lider_avanzada_nombre || '',
            grupo_avanzada: r.grupo_avanzada || 'Avanzada Central',
            aforo_estimado: r.aforo_estimado || 0,
            departamento: r.departamento || '',
            municipio: r.municipio || '',
            direccion: r.direccion || '',
            barrio_vereda: r.barrio_vereda || '',
            lugar_nombre: r.lugar_nombre || '',
            observaciones: r.observaciones || ''
        });
        setFormError('');
        setModalCrearOpen(true);
    };

    // Enviar creación o edición
    const handleSubmitForm = async (e) => {
        e.preventDefault();
        setSubmittingForm(true);
        setFormError('');

        try {
            // Resolver nombre del orador si se seleccionó ID
            let finalOradorNombre = formData.orador_nombre;
            if (formData.orador_id) {
                const found = equipos.oradores.find(u => String(u.id) === String(formData.orador_id));
                if (found) finalOradorNombre = found.nombre || found.email;
            }

            // Resolver nombre de líder de avanzada
            let finalLiderNombre = formData.lider_avanzada_nombre;
            if (formData.lider_avanzada_id) {
                const found = equipos.lideresAvanzada.find(u => String(u.id) === String(formData.lider_avanzada_id));
                if (found) finalLiderNombre = found.nombre || found.email;
            }

            const payload = {
                ...formData,
                orador_nombre: finalOradorNombre,
                lider_avanzada_nombre: finalLiderNombre
            };

            if (editingReunion) {
                await axios.put(`${API}/reuniones/${editingReunion.id}`, payload, authHeaders);
            } else {
                await axios.post(`${API}/reuniones`, payload, authHeaders);
            }

            await fetchReuniones();
            setModalCrearOpen(false);
        } catch (err) {
            console.error('Error al guardar reunión:', err);
            setFormError(err.response?.data?.message || 'Error al guardar la reunión');
        } finally {
            setSubmittingForm(false);
        }
    };

    // Eliminar reunión
    const handleDeleteReunion = async (id, titulo) => {
        if (!window.confirm(`¿Estás seguro de eliminar la reunión "${titulo}"? Se eliminarán también los registros de asistentes y fotos.`)) {
            return;
        }
        try {
            await axios.delete(`${API}/reuniones/${id}`, authHeaders);
            await fetchReuniones();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al eliminar la reunión');
        }
    };

    // Manejar cambio de estado (Iniciar / Finalizar)
    const openStatusModal = (reunion, accion) => {
        setSelectedReunionForStatus(reunion);
        setStatusAccion(accion);
        setStatusObservaciones('');
        setStatusAsistentesReales(reunion.asistentes_reales || reunion.aforo_estimado || '');
        setModalEstadoOpen(true);
    };

    const handleConfirmStatus = async () => {
        if (!selectedReunionForStatus) return;
        try {
            await axios.patch(`${API}/reuniones/${selectedReunionForStatus.id}/estado`, {
                accion: statusAccion,
                observaciones: statusObservaciones,
                asistentes_reales: statusAsistentesReales ? parseInt(statusAsistentesReales, 10) : undefined
            }, authHeaders);

            await fetchReuniones();
            setModalEstadoOpen(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Error al cambiar el estado de la reunión');
        }
    };

    // Modal de Evidencias
    const openEvidenciasModal = (reunion) => {
        setSelectedReunionForEvidencias(reunion);
        setSelectedPhotoPreview(null);
        setModalEvidenciasOpen(true);
    };

    const handleUploadPhoto = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !selectedReunionForEvidencias) return;

        setUploadingEvidencia(true);
        try {
            const data = new FormData();
            data.append('foto', file);
            data.append('nombre', file.name);

            const res = await axios.post(`${API}/reuniones/${selectedReunionForEvidencias.id}/evidencias`, data, {
                headers: {
                    ...authHeaders.headers,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setSelectedReunionForEvidencias(prev => ({
                ...prev,
                evidencias: res.data.evidencias
            }));

            await fetchReuniones();
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            alert(err.response?.data?.message || 'Error al subir la fotografía de evidencia');
        } finally {
            setUploadingEvidencia(false);
        }
    };

    const handleDeleteEvidencia = async (evidenciaId) => {
        if (!window.confirm('¿Eliminar esta evidencia fotográfica?')) return;
        try {
            const res = await axios.delete(
                `${API}/reuniones/${selectedReunionForEvidencias.id}/evidencias/${evidenciaId}`,
                authHeaders
            );
            setSelectedReunionForEvidencias(prev => ({
                ...prev,
                evidencias: res.data.evidencias
            }));
            await fetchReuniones();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al eliminar evidencia');
        }
    };

    // Modal de Asistentes / Base de Datos
    const openAsistentesModal = async (reunion) => {
        setSelectedReunionForAsistentes(reunion);
        setTabAsistentes('lista');
        setAsistenteSearch('');
        setNuevoAsistenteForm({
            nombre_completo: '',
            cedula: '',
            telefono: '',
            barrio: reunion.barrio_vereda || '',
            municipio: reunion.municipio || '',
            departamento: reunion.departamento || '',
            lider_referido: '',
            grupo_avanzada: reunion.grupo_avanzada || '',
            observaciones: ''
        });
        setModalAsistentesOpen(true);
        fetchAsistentes(reunion.id);
    };

    const fetchAsistentes = async (reunionId) => {
        setLoadingAsistentes(true);
        try {
            const res = await axios.get(`${API}/reuniones/${reunionId}/asistentes`, authHeaders);
            setAsistentesList(res.data);
        } catch (err) {
            console.error('Error al cargar asistentes:', err);
        } finally {
            setLoadingAsistentes(false);
        }
    };

    const handleCreateAsistente = async (e) => {
        e.preventDefault();
        if (!selectedReunionForAsistentes) return;
        try {
            await axios.post(`${API}/reuniones/${selectedReunionForAsistentes.id}/asistentes`, nuevoAsistenteForm, authHeaders);
            setNuevoAsistenteForm(prev => ({
                ...prev,
                nombre_completo: '',
                cedula: '',
                telefono: '',
                observaciones: ''
            }));
            setTabAsistentes('lista');
            await fetchAsistentes(selectedReunionForAsistentes.id);
            await fetchReuniones();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al registrar el asistente');
        }
    };

    const handleDeleteAsistente = async (asistenteId) => {
        if (!window.confirm('¿Eliminar asistente de la lista?')) return;
        try {
            await axios.delete(`${API}/reuniones/${selectedReunionForAsistentes.id}/asistentes/${asistenteId}`, authHeaders);
            await fetchAsistentes(selectedReunionForAsistentes.id);
            await fetchReuniones();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al eliminar asistente');
        }
    };

    const handleImportExcel = async (e) => {
        e.preventDefault();
        if (!importExcelFile || !selectedReunionForAsistentes) return;

        setImportingExcel(true);
        try {
            const data = new FormData();
            data.append('archivo', importExcelFile);

            const res = await axios.post(`${API}/reuniones/${selectedReunionForAsistentes.id}/asistentes/import`, data, {
                headers: {
                    ...authHeaders.headers,
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert(res.data.message || 'Base de datos importada exitosamente');
            setImportExcelFile(null);
            setTabAsistentes('lista');
            await fetchAsistentes(selectedReunionForAsistentes.id);
            await fetchReuniones();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al importar archivo Excel');
        } finally {
            setImportingExcel(false);
        }
    };

    const handleExportExcel = () => {
        if (!selectedReunionForAsistentes) return;
        window.open(`${API}/reuniones/${selectedReunionForAsistentes.id}/asistentes/exportar?token=${token}`, '_blank');
    };

    // Cálculos para el Calendario
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        // Convertir domingo (0) a 6, y lunes a 0 para semana comenzando en lunes
        let startingDay = firstDayOfMonth.getDay() - 1;
        if (startingDay === -1) startingDay = 6;

        const totalDays = lastDayOfMonth.getDate();
        const days = [];

        // Días del mes anterior
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDay - 1; i >= 0; i--) {
            const dayNum = prevMonthLastDay - i;
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            days.push({ dayNumber: dayNum, dateStr, isCurrentMonth: false });
        }

        // Días del mes actual
        for (let i = 1; i <= totalDays; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({ dayNumber: i, dateStr, isCurrentMonth: true });
        }

        // Completar días del siguiente mes para cuadrícula de 35 o 42 celdas
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            const dateStr = `${year}-${String(month + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({ dayNumber: i, dateStr, isCurrentMonth: false });
        }

        return days;
    }, [currentDate]);

    // Mapear reuniones por fecha para el calendario
    const reunionesByDate = useMemo(() => {
        const map = {};
        reuniones.forEach(r => {
            if (!map[r.fecha]) map[r.fecha] = [];
            map[r.fecha].push(r);
        });
        return map;
    }, [reuniones]);

    // Métricas del Módulo
    const stats = useMemo(() => {
        const total = reuniones.length;
        const candidatoCount = reuniones.filter(r => r.presidida_por === 'candidato').length;
        const oradorCount = reuniones.filter(r => r.presidida_por === 'orador').length;
        const enCursoCount = reuniones.filter(r => r.estado === 'en_curso').length;
        const totalAforo = reuniones.reduce((acc, r) => acc + (r.aforo_estimado || 0), 0);
        const totalAsistentes = reuniones.reduce((acc, r) => acc + (r.asistentes_reales || r.total_asistentes_registrados || 0), 0);
        return { total, candidatoCount, oradorCount, enCursoCount, totalAforo, totalAsistentes };
    }, [reuniones]);

    // Filtrar reuniones del día seleccionado en el calendario
    const reunionesDelDia = useMemo(() => {
        return reuniones.filter(r => r.fecha === selectedCalendarDate);
    }, [reuniones, selectedCalendarDate]);

    // Lista de grupos de avanzada únicos para filtro
    const availableGrupos = useMemo(() => {
        const set = new Set();
        reuniones.forEach(r => {
            if (r.grupo_avanzada) set.add(r.grupo_avanzada);
        });
        return Array.from(set);
    }, [reuniones]);

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">

            {/* Banner Header Principal */}
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-[#00B894] text-slate-950 text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                <Sparkles size={12} />
                                Módulo de Eventos & Territorio
                            </span>

                            {activeCampaign && (
                                <span className="bg-white/10 text-emerald-300 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                                    <Flag size={12} />
                                    {activeCampaign.nombre} • {activeCampaign.candidato}
                                </span>
                            )}

                            {currentUser?.role === 'orador' && (
                                <span className="bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-rose-500/40">
                                    Vista de Orador Delegado
                                </span>
                            )}
                            {currentUser?.role === 'lider_avanzada' && (
                                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-cyan-500/40">
                                    Vista Líder de Avanzada & Logística
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                            <CalendarDays className="text-[#00B894]" size={32} />
                            Agenda de Reuniones y Avanzada
                        </h1>
                        <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
                            Programación territorial de eventos electorales. Control de reuniones presididas por el Candidato o sus Oradores Delegados, registro de asistencia, activación en tiempo real y evidencias fotográficas.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Selector de Vista: Calendario vs Lista */}
                        <div className="bg-slate-800/80 p-1 rounded-2xl border border-gray-700/60 flex items-center shadow-inner">
                            <button
                                onClick={() => setViewMode('calendario')}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                    viewMode === 'calendario'
                                        ? 'bg-[#00B894] text-slate-950 shadow-md'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <CalendarDays size={15} />
                                <span>Calendario</span>
                            </button>
                            <button
                                onClick={() => setViewMode('lista')}
                                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                    viewMode === 'lista'
                                        ? 'bg-[#00B894] text-slate-950 shadow-md'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <Layers size={15} />
                                <span>Lista y Tarjetas</span>
                            </button>
                        </div>

                        {/* Botón de Agendar */}
                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 bg-gradient-to-r from-[#00B894] to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition-all transform hover:-translate-y-0.5"
                        >
                            <Plus size={18} strokeWidth={3} />
                            <span>Agendar Nueva Reunión</span>
                        </button>
                    </div>
                </div>

                {/* Métricas / Stats Rápidos */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-gray-800/60">
                    <div className="bg-slate-800/40 p-3 rounded-2xl border border-gray-700/40">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Reuniones</span>
                        <span className="text-xl font-black text-white mt-0.5 block">{stats.total}</span>
                    </div>

                    <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-800/30">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Preside Candidato</span>
                        <span className="text-xl font-black text-emerald-300 mt-0.5 block">{stats.candidatoCount}</span>
                    </div>

                    <div className="bg-rose-950/40 p-3 rounded-2xl border border-rose-800/30">
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Preside Orador</span>
                        <span className="text-xl font-black text-rose-300 mt-0.5 block">{stats.oradorCount}</span>
                    </div>

                    <div className="bg-amber-950/40 p-3 rounded-2xl border border-amber-800/30">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">En Curso (En Vivo)</span>
                        <span className="text-xl font-black text-amber-300 mt-0.5 block flex items-center gap-1.5">
                            {stats.enCursoCount}
                            {stats.enCursoCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />}
                        </span>
                    </div>

                    <div className="bg-slate-800/40 p-3 rounded-2xl border border-gray-700/40">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Aforo Estimado</span>
                        <span className="text-xl font-black text-white mt-0.5 block">{stats.totalAforo.toLocaleString()}</span>
                    </div>

                    <div className="bg-cyan-950/40 p-3 rounded-2xl border border-cyan-800/30">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Asistencia / BD</span>
                        <span className="text-xl font-black text-cyan-300 mt-0.5 block">{stats.totalAsistentes.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Buscador de texto */}
                    <div className="relative flex-1 min-w-[240px]">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por lugar, dirección, municipio, orador o grupo..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#00B894] transition-all"
                        />
                    </div>

                    {/* Filtro Campaña */}
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] font-black uppercase text-gray-400">Campaña:</label>
                        <select
                            value={filterCampana}
                            onChange={e => setFilterCampana(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00B894]"
                        >
                            <option value="activa">Campaña Activa en Selector</option>
                            <option value="todas">Todas las Campañas</option>
                            {campaigns.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre} ({c.candidato})</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro Quién Preside */}
                    <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-2xl border border-gray-200 text-xs font-bold">
                        <button
                            onClick={() => setFilterPreside('todos')}
                            className={`px-3 py-1.5 rounded-xl transition-all ${filterPreside === 'todos' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setFilterPreside('candidato')}
                            className={`px-3 py-1.5 rounded-xl transition-all ${filterPreside === 'candidato' ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                            Candidato
                        </button>
                        <button
                            onClick={() => setFilterPreside('orador')}
                            className={`px-3 py-1.5 rounded-xl transition-all ${filterPreside === 'orador' ? 'bg-rose-700 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                            Orador
                        </button>
                    </div>

                    {/* Filtro Estado */}
                    <div className="flex items-center gap-2">
                        <label className="text-[10px] font-black uppercase text-gray-400">Estado:</label>
                        <select
                            value={filterEstado}
                            onChange={e => setFilterEstado(e.target.value)}
                            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00B894]"
                        >
                            <option value="todos">Todos los Estados</option>
                            <option value="programada">Programadas</option>
                            <option value="en_curso">En Curso (Iniciadas)</option>
                            <option value="finalizada">Finalizadas</option>
                            <option value="cancelada">Canceladas</option>
                        </select>
                    </div>

                    {/* Filtro por Grupo de Avanzada */}
                    {availableGrupos.length > 0 && (
                        <div className="flex items-center gap-2">
                            <label className="text-[10px] font-black uppercase text-gray-400">Grupo Avanzada:</label>
                            <select
                                value={filterGrupo}
                                onChange={e => setFilterGrupo(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00B894]"
                            >
                                <option value="todos">Todos los Grupos</option>
                                {availableGrupos.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* =============================================================== */}
            {/* VISTA 1: CALENDARIO DE EVENTOS */}
            {/* =============================================================== */}
            {viewMode === 'calendario' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Matriz del Calendario Mensual (8 Columnas en desktop) */}
                    <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                        {/* Cabecera del Mes */}
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                                    {currentDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
                                </h2>
                                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-200">
                                    {reuniones.length} Eventos Agendados
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                                    className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors"
                                    title="Mes Anterior"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={() => setCurrentDate(new Date())}
                                    className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-gray-100 rounded-xl border border-gray-200"
                                >
                                    Hoy
                                </button>
                                <button
                                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                                    className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors"
                                    title="Mes Siguiente"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Días de la Semana */}
                        <div className="grid grid-cols-7 gap-1 text-center font-black text-[10px] uppercase tracking-wider text-gray-400 py-1">
                            <div>Lun</div>
                            <div>Mar</div>
                            <div>Mié</div>
                            <div>Jue</div>
                            <div>Vie</div>
                            <div>Sáb</div>
                            <div className="text-rose-500">Dom</div>
                        </div>

                        {/* Celdas del Calendario */}
                        <div className="grid grid-cols-7 gap-1.5">
                            {calendarDays.map((cell, idx) => {
                                const eventosDelDia = reunionesByDate[cell.dateStr] || [];
                                const isSelected = selectedCalendarDate === cell.dateStr;
                                const isToday = cell.dateStr === new Date().toISOString().split('T')[0];

                                const hasCandidato = eventosDelDia.some(e => e.presidida_por === 'candidato');
                                const hasOrador = eventosDelDia.some(e => e.presidida_por === 'orador');
                                const hasEnCurso = eventosDelDia.some(e => e.estado === 'en_curso');

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedCalendarDate(cell.dateStr)}
                                        className={`
                                            min-h-[78px] p-1.5 rounded-2xl flex flex-col justify-between text-left transition-all border
                                            ${!cell.isCurrentMonth ? 'opacity-30 bg-gray-50/50 border-transparent' : 'bg-white'}
                                            ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-300 shadow-md bg-emerald-50/30' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50/70'}
                                            ${isToday ? 'bg-amber-50/40' : ''}
                                        `}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className={`
                                                text-xs font-black rounded-lg w-6 h-6 flex items-center justify-center
                                                ${isToday ? 'bg-slate-900 text-white' : isSelected ? 'bg-emerald-600 text-white' : 'text-slate-800'}
                                            `}>
                                                {cell.dayNumber}
                                            </span>

                                            {eventosDelDia.length > 0 && (
                                                <span className="text-[9px] font-black bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded-md">
                                                    {eventosDelDia.length}
                                                </span>
                                            )}
                                        </div>

                                        {/* Indicadores visuales de reuniones en este día */}
                                        <div className="w-full space-y-1 mt-1">
                                            {eventosDelDia.slice(0, 2).map((ev, evIdx) => (
                                                <div
                                                    key={evIdx}
                                                    className={`
                                                        text-[9px] font-bold px-1.5 py-0.5 rounded truncate flex items-center gap-1
                                                        ${ev.estado === 'en_curso' ? 'bg-emerald-500 text-white animate-pulse' :
                                                          ev.presidida_por === 'candidato' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}
                                                    `}
                                                    title={`${ev.hora_inicio} - ${ev.titulo}`}
                                                >
                                                    <span className="font-mono text-[8px]">{ev.hora_inicio}</span>
                                                    <span className="truncate">{ev.titulo}</span>
                                                </div>
                                            ))}

                                            {eventosDelDia.length > 2 && (
                                                <div className="text-[8px] font-extrabold text-gray-500 pl-1">
                                                    +{eventosDelDia.length - 2} más...
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Leyenda de Colores */}
                        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100 text-[11px] font-bold text-gray-500">
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                                Presidida por Candidato
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                                Presidida por Orador
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse inline-block ring-2 ring-emerald-300" />
                                En Curso (En Vivo)
                            </span>
                        </div>
                    </div>

                    {/* Panel Lateral: Detalle de la Agenda del Día Seleccionado (4 Columnas) */}
                    <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <div>
                                    <span className="text-[10px] font-black uppercase text-[#00B894] tracking-wider block">
                                        Agenda Diaria
                                    </span>
                                    <h3 className="text-base font-black text-slate-900 capitalize">
                                        {new Date(selectedCalendarDate + 'T00:00:00').toLocaleDateString('es-CO', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long'
                                        })}
                                    </h3>
                                </div>

                                <button
                                    onClick={openCreateModal}
                                    className="p-2 bg-[#00B894] hover:bg-emerald-600 text-slate-950 rounded-xl transition-all shadow-sm"
                                    title="Agendar en este día"
                                >
                                    <Plus size={16} strokeWidth={3} />
                                </button>
                            </div>

                            {/* Lista de eventos del día */}
                            {reunionesDelDia.length === 0 ? (
                                <div className="text-center py-12 space-y-3">
                                    <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto">
                                        <CalendarDays size={26} />
                                    </div>
                                    <p className="text-xs font-bold text-gray-500">No hay reuniones agendadas para esta fecha.</p>
                                    <button
                                        onClick={openCreateModal}
                                        className="text-xs font-bold text-[#00B894] hover:underline uppercase tracking-wide"
                                    >
                                        + Agendar Evento Aquí
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                                    {reunionesDelDia.map(r => (
                                        <MeetingCard
                                            key={r.id}
                                            reunion={r}
                                            currentUser={currentUser}
                                            onEdit={() => openEditModal(r)}
                                            onDelete={() => handleDeleteReunion(r.id, r.titulo)}
                                            onStatusChange={(accion) => openStatusModal(r, accion)}
                                            onOpenEvidencias={() => openEvidenciasModal(r)}
                                            onOpenAsistentes={() => openAsistentesModal(r)}
                                            compact={true}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* =============================================================== */}
            {/* VISTA 2: LISTA GENERAL DE REUNIONES */}
            {/* =============================================================== */}
            {viewMode === 'lista' && (
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-20 text-gray-400 text-xs">Cargando reuniones...</div>
                    ) : reuniones.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-3">
                            <CalendarDays size={40} className="mx-auto text-gray-300" />
                            <h3 className="text-base font-bold text-gray-700">No se encontraron reuniones</h3>
                            <p className="text-xs text-gray-400 max-w-sm mx-auto">
                                No hay eventos que coincidan con los filtros seleccionados o aún no has programado ninguna reunión.
                            </p>
                            <button
                                onClick={openCreateModal}
                                className="px-5 py-2.5 bg-[#00B894] text-slate-950 font-bold text-xs uppercase rounded-xl tracking-wider shadow"
                            >
                                Agendar Primera Reunión
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {reuniones.map(r => (
                                <MeetingCard
                                    key={r.id}
                                    reunion={r}
                                    currentUser={currentUser}
                                    onEdit={() => openEditModal(r)}
                                    onDelete={() => handleDeleteReunion(r.id, r.titulo)}
                                    onStatusChange={(accion) => openStatusModal(r, accion)}
                                    onOpenEvidencias={() => openEvidenciasModal(r)}
                                    onOpenAsistentes={() => openAsistentesModal(r)}
                                    compact={false}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* =============================================================== */}
            {/* MODAL 1: AGENDAR / EDITAR REUNIÓN */}
            {/* =============================================================== */}
            {modalCrearOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-3xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
                        {/* Cabecera */}
                        <div className="bg-gradient-to-r from-slate-900 to-emerald-950 p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl text-emerald-400">
                                    <CalendarDays size={22} />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg uppercase tracking-wide">
                                        {editingReunion ? 'Editar Reunión Electoral' : 'Agendar Nueva Reunión'}
                                    </h3>
                                    <p className="text-gray-300 text-xs">
                                        Ingresa los detalles logísticos, orador asignado y aforo estimado.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setModalCrearOpen(false)}
                                className="text-gray-400 hover:text-white p-1 rounded-xl"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {formError && (
                            <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                                <AlertCircle size={15} />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmitForm} className="p-6 space-y-5">
                            {/* 1. SELECCIÓN DE CAMPAÑA Y TÍTULO */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                        Campaña Electoral *
                                    </label>
                                    <select
                                        required
                                        value={formData.campana_id}
                                        onChange={e => setFormData(prev => ({ ...prev, campana_id: e.target.value }))}
                                        className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-emerald-600"
                                    >
                                        <option value="">-- SELECCIONA LA CAMPAÑA --</option>
                                        {campaigns.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.nombre} [{c.tipo_cargo.toUpperCase()}] - Candidato: {c.candidato}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                        Título / Motivo de la Reunión *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej. Encuentro Comunitario con Líderes de la Comuna 7"
                                        value={formData.titulo}
                                        onChange={e => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-emerald-600"
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                        Descripción / Puntos Clave de la Agenda
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="Temas a tratar: propuestas de seguridad, presentación de orador, levantamiento de necesidades..."
                                        value={formData.descripcion}
                                        onChange={e => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:border-emerald-600"
                                    />
                                </div>
                            </div>

                            {/* 2. FECHA Y HORARIO */}
                            <div className="p-4 bg-slate-50 rounded-2xl border border-gray-200/80 space-y-3">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                                    <Clock size={13} className="text-[#00B894]" />
                                    Fecha y Programación de Horario
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">Fecha *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.fecha}
                                            onChange={e => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                                            className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-emerald-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">Hora Inicio *</label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.hora_inicio}
                                            onChange={e => setFormData(prev => ({ ...prev, hora_inicio: e.target.value }))}
                                            className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-emerald-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">Hora Fin (Estimada)</label>
                                        <input
                                            type="time"
                                            value={formData.hora_fin}
                                            onChange={e => setFormData(prev => ({ ...prev, hora_fin: e.target.value }))}
                                            className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-emerald-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 3. QUIÉN PRESIDE: CANDIDATO O EN SU DEFECTO UN ORADOR */}
                            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
                                <label className="block text-slate-800 font-black text-xs uppercase tracking-wide">
                                    ¿Quién Preside la Reunión? *
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, presidida_por: 'candidato', orador_id: '', orador_nombre: '' }))}
                                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                                            formData.presidida_por === 'candidato'
                                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className={`p-2 rounded-xl ${formData.presidida_por === 'candidato' ? 'bg-white/20' : 'bg-emerald-100 text-emerald-700'}`}>
                                                <Flag size={18} />
                                            </div>
                                            <div>
                                                <p className="font-black text-xs uppercase leading-tight">El Candidato</p>
                                                <p className="text-[10px] opacity-80">Presencia directa del candidato</p>
                                            </div>
                                        </div>
                                        {formData.presidida_por === 'candidato' && <Check size={16} />}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, presidida_por: 'orador' }))}
                                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                                            formData.presidida_por === 'orador'
                                                ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-rose-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className={`p-2 rounded-xl ${formData.presidida_por === 'orador' ? 'bg-white/20' : 'bg-rose-100 text-rose-700'}`}>
                                                <Mic size={18} />
                                            </div>
                                            <div>
                                                <p className="font-black text-xs uppercase leading-tight">Un Orador Delegado</p>
                                                <p className="text-[10px] opacity-80">En representación de la campaña</p>
                                            </div>
                                        </div>
                                        {formData.presidida_por === 'orador' && <Check size={16} />}
                                    </button>
                                </div>

                                {/* Selección o nombre del Orador si es por orador */}
                                {formData.presidida_por === 'orador' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                        <div>
                                            <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                                Seleccionar Usuario Orador Registrado
                                            </label>
                                            <select
                                                value={formData.orador_id}
                                                onChange={e => {
                                                    const oId = e.target.value;
                                                    const found = equipos.oradores.find(u => String(u.id) === String(oId));
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        orador_id: oId,
                                                        orador_nombre: found ? found.nombre || found.email : prev.orador_nombre
                                                    }));
                                                }}
                                                className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-rose-600"
                                            >
                                                <option value="">-- SELECCIONAR USUARIO ORADOR --</option>
                                                {equipos.oradores.map(o => (
                                                    <option key={o.id} value={o.id}>
                                                        {o.nombre} ({o.role?.toUpperCase()})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                                Nombre Visible del Orador *
                                            </label>
                                            <input
                                                type="text"
                                                required={formData.presidida_por === 'orador'}
                                                placeholder="Ej. Dr. Mauricio Gómez / Portavoz"
                                                value={formData.orador_nombre}
                                                onChange={e => setFormData(prev => ({ ...prev, orador_nombre: e.target.value }))}
                                                className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-rose-600"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 4. AVANZADA, LOGÍSTICA Y AFORO ("SEA POR GRUPO") */}
                            <div className="p-4 bg-cyan-50/40 rounded-2xl border border-cyan-100 space-y-3">
                                <span className="text-[10px] font-black uppercase text-cyan-800 tracking-wider flex items-center gap-1.5">
                                    <UserCheck size={13} className="text-cyan-600" />
                                    Logística de Avanzada y Grupo de Apoyo
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                            Líder de Avanzada
                                        </label>
                                        <select
                                            value={formData.lider_avanzada_id}
                                            onChange={e => {
                                                const lId = e.target.value;
                                                const found = equipos.lideresAvanzada.find(u => String(u.id) === String(lId));
                                                setFormData(prev => ({
                                                    ...prev,
                                                    lider_avanzada_id: lId,
                                                    lider_avanzada_nombre: found ? found.nombre || found.email : prev.lider_avanzada_nombre
                                                }));
                                            }}
                                            className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-cyan-600"
                                        >
                                            <option value="">-- SELECCIONAR LÍDER --</option>
                                            {equipos.lideresAvanzada.map(l => (
                                                <option key={l.id} value={l.id}>{l.nombre} ({l.role})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                            Grupo de Avanzada *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ej. Avanzada Juventud, Grupo Sector Norte..."
                                            value={formData.grupo_avanzada}
                                            onChange={e => setFormData(prev => ({ ...prev, grupo_avanzada: e.target.value }))}
                                            className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-cyan-600"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">
                                            Aforo / Cantidad Estimada *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min={1}
                                            placeholder="Ej. 100 personas"
                                            value={formData.aforo_estimado}
                                            onChange={e => setFormData(prev => ({ ...prev, aforo_estimado: e.target.value }))}
                                            className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-cyan-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 5. UBICACIÓN TERRITORIAL: DEPARTAMENTO, MUNICIPIO, DIRECCIÓN */}
                            <div className="p-4 bg-slate-50 rounded-2xl border border-gray-200/80 space-y-3">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                                    <MapPin size={13} className="text-[#00B894]" />
                                    Ubicación Territorial y Dirección del Evento
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">Departamento *</label>
                                        <select
                                            required
                                            value={formData.departamento}
                                            onChange={e => setFormData(prev => ({ ...prev, departamento: e.target.value, municipio: '' }))}
                                            className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-emerald-600"
                                        >
                                            <option value="">-- SELECCIONAR DEPARTAMENTO --</option>
                                            {Object.keys(colombiaData).map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">Municipio *</label>
                                        <select
                                            required
                                            disabled={!formData.departamento}
                                            value={formData.municipio}
                                            onChange={e => setFormData(prev => ({ ...prev, municipio: e.target.value }))}
                                            className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-emerald-600 disabled:bg-gray-100"
                                        >
                                            <option value="">-- SELECCIONAR MUNICIPIO --</option>
                                            {municipiosOptions.map(m => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">Barrio / Vereda</label>
                                        <input
                                            type="text"
                                            placeholder="Ej. Barrio Robledo, Vereda El Salado..."
                                            value={formData.barrio_vereda}
                                            onChange={e => setFormData(prev => ({ ...prev, barrio_vereda: e.target.value }))}
                                            className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-emerald-600"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">Nombre del Lugar / Recinto</label>
                                        <input
                                            type="text"
                                            placeholder="Ej. Salón Comunal, Polideportivo, Cancha Sintética..."
                                            value={formData.lugar_nombre}
                                            onChange={e => setFormData(prev => ({ ...prev, lugar_nombre: e.target.value }))}
                                            className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-emerald-600"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">Dirección Exacta o Punto de Encuentro *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Ej. Carrera 45 # 67 - 89, frente al parque principal"
                                            value={formData.direccion}
                                            onChange={e => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                                            className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-emerald-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Botones de acción */}
                            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalCrearOpen(false)}
                                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingForm}
                                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all"
                                >
                                    {submittingForm ? 'Guardando...' : editingReunion ? 'Actualizar Evento' : 'Agendar Reunión'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =============================================================== */}
            {/* MODAL 2: INICIAR / FINALIZAR / CAMBIAR ESTADO DE LA REUNIÓN */}
            {/* =============================================================== */}
            {modalEstadoOpen && selectedReunionForStatus && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className={`p-6 text-white ${
                            statusAccion === 'iniciar' ? 'bg-gradient-to-r from-emerald-800 to-emerald-950' :
                            statusAccion === 'finalizar' ? 'bg-gradient-to-r from-slate-900 to-indigo-950' :
                            'bg-gradient-to-r from-rose-800 to-rose-950'
                        }`}>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                                    Control Operativo en Territorio
                                </span>
                                <button onClick={() => setModalEstadoOpen(false)} className="text-white/80 hover:text-white">
                                    <X size={18} />
                                </button>
                            </div>
                            <h3 className="font-black text-xl uppercase mt-2">
                                {statusAccion === 'iniciar' && 'Dar Inicio a la Reunión'}
                                {statusAccion === 'finalizar' && 'Finalizar y Cerrar Reunión'}
                                {statusAccion === 'cancelar' && 'Cancelar Reunión'}
                            </h3>
                            <p className="text-xs text-white/80 mt-0.5">
                                {selectedReunionForStatus.titulo}
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-xs space-y-1">
                                <p className="font-bold text-slate-800">
                                    Presidida por: <span className="text-emerald-700">{selectedReunionForStatus.presidida_por === 'candidato' ? 'Candidato' : `Orador: ${selectedReunionForStatus.orador_nombre}`}</span>
                                </p>
                                <p className="text-gray-500 font-mono">
                                    Lugar: {selectedReunionForStatus.lugar_nombre || selectedReunionForStatus.direccion}, {selectedReunionForStatus.municipio}
                                </p>
                            </div>

                            {statusAccion === 'iniciar' && (
                                <p className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-2xl border border-emerald-200 font-medium">
                                    Al marcar inicio, el sistema cambiará el estado a <strong>EN CURSO</strong> y registrará la hora exacta de apertura. Los oradores y líderes podrán subir evidencias en tiempo real.
                                </p>
                            )}

                            {statusAccion === 'finalizar' && (
                                <div>
                                    <label className="block text-gray-700 font-bold mb-1 text-xs uppercase">
                                        Asistentes Reales Contados / Aforo Logrado
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={statusAsistentesReales}
                                        onChange={e => setStatusAsistentesReales(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                                        placeholder="Ej. 75"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-gray-700 font-bold mb-1 text-xs uppercase">
                                    Observaciones o Balance del Evento
                                </label>
                                <textarea
                                    rows={3}
                                    value={statusObservaciones}
                                    onChange={e => setStatusObservaciones(e.target.value)}
                                    placeholder="Nivel de entusiasmo, compromisos asumidos, solicitudes ciudadanas..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:border-slate-800"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    onClick={() => setModalEstadoOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase text-gray-600 hover:bg-gray-100"
                                >
                                    Volver
                                </button>
                                <button
                                    onClick={handleConfirmStatus}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase text-white shadow-lg transition-all ${
                                        statusAccion === 'iniciar' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                        statusAccion === 'finalizar' ? 'bg-slate-900 hover:bg-slate-800' :
                                        'bg-rose-600 hover:bg-rose-700'
                                    }`}
                                >
                                    Confirmar {statusAccion}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =============================================================== */}
            {/* MODAL 3: EVIDENCIAS FOTOGRÁFICAS */}
            {/* =============================================================== */}
            {modalEvidenciasOpen && selectedReunionForEvidencias && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-4xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
                        {/* Cabecera */}
                        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-indigo-400">
                                    <Camera size={22} />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg uppercase tracking-wide">
                                        Evidencias Fotográficas de la Reunión
                                    </h3>
                                    <p className="text-gray-300 text-xs">
                                        {selectedReunionForEvidencias.titulo} • {selectedReunionForEvidencias.fecha} ({selectedReunionForEvidencias.municipio})
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setModalEvidenciasOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-xl">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Barra de Subida */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                                <div>
                                    <h4 className="text-xs font-black uppercase text-slate-900">Cargar Nueva Fotografía</h4>
                                    <p className="text-[11px] text-gray-500">Toma fotos del público, oradores o firmas de apoyo en el evento.</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        onChange={handleUploadPhoto}
                                        className="hidden"
                                        id="input-foto-evidencia"
                                    />
                                    <label
                                        htmlFor="input-foto-evidencia"
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase cursor-pointer transition-all shadow-md ${
                                            uploadingEvidencia
                                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                                : 'bg-[#00B894] hover:bg-emerald-600 text-slate-950'
                                        }`}
                                    >
                                        <Camera size={16} />
                                        <span>{uploadingEvidencia ? 'Subiendo Foto...' : 'Tomar / Subir Foto'}</span>
                                    </label>
                                </div>
                            </div>

                            {/* Galería de Fotos */}
                            {(!selectedReunionForEvidencias.evidencias || selectedReunionForEvidencias.evidencias.length === 0) ? (
                                <div className="text-center py-16 text-gray-400 space-y-2">
                                    <ImageIcon size={40} className="mx-auto text-gray-300" />
                                    <p className="text-xs font-bold">Aún no se han cargado fotografías de evidencia.</p>
                                    <p className="text-[11px] text-gray-400">Los oradores o el equipo de avanzada pueden subirlas desde su móvil o computador.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-1">
                                    {selectedReunionForEvidencias.evidencias.map((foto, idx) => (
                                        <div
                                            key={foto.id || idx}
                                            className="group relative bg-slate-900 rounded-2xl overflow-hidden aspect-video border border-gray-200 shadow-sm"
                                        >
                                            <img
                                                src={foto.url}
                                                alt={foto.nombre || 'Evidencia'}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                                                onClick={() => setSelectedPhotoPreview(foto)}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between pointer-events-none">
                                                <div className="flex justify-end pointer-events-auto">
                                                    <button
                                                        onClick={() => handleDeleteEvidencia(foto.id)}
                                                        className="p-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow"
                                                        title="Eliminar foto"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                                <div className="text-white text-[9px] pointer-events-auto">
                                                    <p className="font-bold truncate">{foto.nombre || 'Foto'}</p>
                                                    <p className="text-gray-300 text-[8px]">{foto.subido_por}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Visor Grande si se selecciona una foto */}
                            {selectedPhotoPreview && (
                                <div className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4">
                                    <button
                                        onClick={() => setSelectedPhotoPreview(null)}
                                        className="absolute top-6 right-6 p-2 bg-white/20 text-white rounded-full hover:bg-white/30"
                                    >
                                        <X size={24} />
                                    </button>
                                    <img
                                        src={selectedPhotoPreview.url}
                                        alt="Preview"
                                        className="max-h-[80vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
                                    />
                                    <div className="mt-3 text-center text-white text-xs font-bold">
                                        <p>{selectedPhotoPreview.nombre}</p>
                                        <p className="text-[10px] text-gray-400">Subida por: {selectedPhotoPreview.subido_por} • {new Date(selectedPhotoPreview.fecha).toLocaleString('es-CO')}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* =============================================================== */}
            {/* MODAL 4: BASE DE DATOS DE LA REUNIÓN (LÍDER AVANZADA) */}
            {/* =============================================================== */}
            {modalAsistentesOpen && selectedReunionForAsistentes && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-4xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
                        {/* Cabecera */}
                        <div className="bg-gradient-to-r from-slate-900 to-cyan-950 p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-cyan-500/20 border border-cyan-400/30 rounded-2xl text-cyan-300">
                                    <FileSpreadsheet size={22} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 bg-white/10 px-2 py-0.5 rounded-full">
                                        Gestión de Avanzada & Convocatoria
                                    </span>
                                    <h3 className="font-black text-lg uppercase tracking-wide mt-1">
                                        Base de Datos de Asistentes de la Reunión
                                    </h3>
                                    <p className="text-gray-300 text-xs">
                                        {selectedReunionForAsistentes.titulo} • Grupo: {selectedReunionForAsistentes.grupo_avanzada || 'Avanzada'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setModalAsistentesOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-xl">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Pestañas & Métricas */}
                        <div className="p-6 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setTabAsistentes('lista')}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                                            tabAsistentes === 'lista'
                                                ? 'bg-slate-900 text-white shadow-sm'
                                                : 'text-gray-500 hover:bg-gray-100'
                                        }`}
                                    >
                                        Lista de Asistentes ({asistentesList.length})
                                    </button>
                                    <button
                                        onClick={() => setTabAsistentes('nuevo')}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                                            tabAsistentes === 'nuevo'
                                                ? 'bg-slate-900 text-white shadow-sm'
                                                : 'text-gray-500 hover:bg-gray-100'
                                        }`}
                                    >
                                        + Agregar Asistente
                                    </button>
                                    <button
                                        onClick={() => setTabAsistentes('importar')}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                                            tabAsistentes === 'importar'
                                                ? 'bg-cyan-700 text-white shadow-sm'
                                                : 'text-cyan-700 hover:bg-cyan-50'
                                        }`}
                                    >
                                        <Upload size={14} className="inline mr-1" />
                                        Cargar Excel Masivo
                                    </button>
                                </div>

                                <button
                                    onClick={handleExportExcel}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow"
                                >
                                    <Download size={14} />
                                    <span>Descargar Excel</span>
                                </button>
                            </div>

                            {/* TAB 1: LISTA */}
                            {tabAsistentes === 'lista' && (
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Buscar asistente por nombre, cédula, teléfono o barrio..."
                                            value={asistenteSearch}
                                            onChange={e => setAsistenteSearch(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-cyan-600"
                                        />
                                    </div>

                                    {loadingAsistentes ? (
                                        <div className="text-center py-12 text-gray-400 text-xs">Cargando base de datos...</div>
                                    ) : asistentesList.length === 0 ? (
                                        <div className="text-center py-12 space-y-2 text-gray-400">
                                            <Users size={32} className="mx-auto text-gray-300" />
                                            <p className="text-xs font-bold text-gray-600">No hay asistentes registrados para esta reunión.</p>
                                            <p className="text-[11px]">Puedes ingresar registros manualmente o importar un archivo Excel.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto max-h-[420px] rounded-2xl border border-gray-100">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-wider sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-3">#</th>
                                                        <th className="px-4 py-3">Nombre Completo</th>
                                                        <th className="px-4 py-3">Cédula</th>
                                                        <th className="px-4 py-3">Contacto</th>
                                                        <th className="px-4 py-3">Barrio / Municipio</th>
                                                        <th className="px-4 py-3">Referido Por</th>
                                                        <th className="px-4 py-3 text-center">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {asistentesList
                                                        .filter(a => {
                                                            if (!asistenteSearch) return true;
                                                            const s = asistenteSearch.toLowerCase();
                                                            return (
                                                                (a.nombre_completo && a.nombre_completo.toLowerCase().includes(s)) ||
                                                                (a.cedula && a.cedula.includes(s)) ||
                                                                (a.telefono && a.telefono.includes(s)) ||
                                                                (a.barrio && a.barrio.toLowerCase().includes(s))
                                                            );
                                                        })
                                                        .map((a, i) => (
                                                            <tr key={a.id} className="hover:bg-gray-50">
                                                                <td className="px-4 py-2.5 font-mono text-gray-400">{i + 1}</td>
                                                                <td className="px-4 py-2.5 font-bold text-slate-900">{a.nombre_completo}</td>
                                                                <td className="px-4 py-2.5 font-mono text-gray-600">{a.cedula || '-'}</td>
                                                                <td className="px-4 py-2.5 font-mono text-gray-600">{a.telefono || '-'}</td>
                                                                <td className="px-4 py-2.5 text-gray-600">
                                                                    {a.barrio ? `${a.barrio}, ` : ''}{a.municipio || '-'}
                                                                </td>
                                                                <td className="px-4 py-2.5 text-gray-500">{a.lider_referido || '-'}</td>
                                                                <td className="px-4 py-2.5 text-center">
                                                                    <button
                                                                        onClick={() => handleDeleteAsistente(a.id)}
                                                                        className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                                                                        title="Eliminar asistente"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: AGREGAR INDIVIDUAL */}
                            {tabAsistentes === 'nuevo' && (
                                <form onSubmit={handleCreateAsistente} className="space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">Nombre Completo *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Ej. Juan Carlos Pérez"
                                                value={nuevoAsistenteForm.nombre_completo}
                                                onChange={e => setNuevoAsistenteForm(prev => ({ ...prev, nombre_completo: e.target.value }))}
                                                className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs font-bold text-slate-800"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">Cédula</label>
                                            <input
                                                type="text"
                                                placeholder="Ej. 1020304050"
                                                value={nuevoAsistenteForm.cedula}
                                                onChange={e => setNuevoAsistenteForm(prev => ({ ...prev, cedula: e.target.value }))}
                                                className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs font-bold text-slate-800"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">Teléfono / WhatsApp</label>
                                            <input
                                                type="text"
                                                placeholder="Ej. 3001234567"
                                                value={nuevoAsistenteForm.telefono}
                                                onChange={e => setNuevoAsistenteForm(prev => ({ ...prev, telefono: e.target.value }))}
                                                className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs font-bold text-slate-800"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">Barrio / Sector</label>
                                            <input
                                                type="text"
                                                placeholder="Ej. San Javier"
                                                value={nuevoAsistenteForm.barrio}
                                                onChange={e => setNuevoAsistenteForm(prev => ({ ...prev, barrio: e.target.value }))}
                                                className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs font-bold text-slate-800"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">Líder que Convocó / Referido</label>
                                            <input
                                                type="text"
                                                placeholder="Ej. Líder Carlos Gómez"
                                                value={nuevoAsistenteForm.lider_referido}
                                                onChange={e => setNuevoAsistenteForm(prev => ({ ...prev, lider_referido: e.target.value }))}
                                                className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs font-bold text-slate-800"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-600 font-bold mb-1 text-xs uppercase">Observaciones</label>
                                            <input
                                                type="text"
                                                placeholder="Compromiso, voto seguro, etc."
                                                value={nuevoAsistenteForm.observaciones}
                                                onChange={e => setNuevoAsistenteForm(prev => ({ ...prev, observaciones: e.target.value }))}
                                                className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs font-bold text-slate-800"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setTabAsistentes('lista')}
                                            className="px-4 py-2 text-xs font-bold text-gray-500 uppercase"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase shadow"
                                        >
                                            Guardar Asistente
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* TAB 3: IMPORTAR EXCEL */}
                            {tabAsistentes === 'importar' && (
                                <form onSubmit={handleImportExcel} className="p-6 bg-cyan-50/50 rounded-2xl border border-cyan-100 space-y-4 text-center">
                                    <FileSpreadsheet size={40} className="mx-auto text-cyan-600" />
                                    <div>
                                        <h4 className="text-sm font-black uppercase text-slate-900">
                                            Importación Masiva de Asistentes desde Excel
                                        </h4>
                                        <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                                            Sube un archivo <strong>.xlsx</strong> o <strong>.csv</strong> con las columnas: Nombre Completo, Cédula, Teléfono, Municipio, Departamento, Barrio, Líder Referido.
                                        </p>
                                    </div>

                                    <input
                                        type="file"
                                        required
                                        accept=".xlsx,.xls,.csv"
                                        onChange={e => setImportExcelFile(e.target.files?.[0] || null)}
                                        className="mx-auto block text-xs font-mono text-gray-600"
                                    />

                                    <button
                                        type="submit"
                                        disabled={!importExcelFile || importingExcel}
                                        className="px-6 py-2.5 bg-cyan-700 hover:bg-cyan-800 disabled:bg-gray-300 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow"
                                    >
                                        {importingExcel ? 'Procesando Archivo...' : 'Importar a la Base de Datos'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Componente individual de Tarjeta de Reunión (Reusable en Calendario y Lista)
 */
function MeetingCard({
    reunion,
    currentUser,
    onEdit,
    onDelete,
    onStatusChange,
    onOpenEvidencias,
    onOpenAsistentes,
    compact = false
}) {
    const estadoObj = ESTADOS_INFO[reunion.estado] || ESTADOS_INFO.programada;
    const isOrador = reunion.presidida_por === 'orador';
    const isCandidato = reunion.presidida_por === 'candidato';
    const fotosCount = reunion.evidencias?.length || 0;

    // Verificar si el usuario actual es el orador asignado o admin/lider
    const canManageStatus =
        currentUser?.role === 'superadmin' ||
        currentUser?.role === 'admin' ||
        currentUser?.role === 'candidato' ||
        currentUser?.role === 'gerente' ||
        currentUser?.role === 'orador' ||
        currentUser?.role === 'lider_avanzada';

    return (
        <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 ${
            reunion.estado === 'en_curso' ? 'ring-2 ring-emerald-400 bg-emerald-50/20' : ''
        }`}>
            {/* Header de la Tarjeta */}
            <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${estadoObj.color} flex items-center gap-1.5`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${estadoObj.dot}`} />
                        {estadoObj.label}
                    </span>

                    <span className="text-[11px] font-mono font-bold text-gray-500 flex items-center gap-1">
                        <Clock size={12} className="text-[#00B894]" />
                        {reunion.hora_inicio} {reunion.hora_fin ? `- ${reunion.hora_fin}` : ''}
                    </span>
                </div>

                <h4 className="font-black text-sm text-slate-900 leading-snug line-clamp-2">
                    {reunion.titulo}
                </h4>

                {/* Badge de quién preside */}
                <div className="flex items-center gap-2">
                    {isCandidato ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                            <Flag size={13} className="text-emerald-600" />
                            <span>Preside el Candidato</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                            <Mic size={13} className="text-rose-600" />
                            <span>Orador: {reunion.orador_nombre || 'Por Asignar'}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Datos Territoriales y Aforo */}
            <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50/80 p-3 rounded-2xl border border-gray-100 font-medium">
                <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-[#00B894] flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-slate-800 leading-tight">
                            {reunion.lugar_nombre ? `${reunion.lugar_nombre} • ` : ''}{reunion.direccion}
                        </p>
                        <p className="text-[11px] text-gray-500">
                            {reunion.barrio_vereda ? `${reunion.barrio_vereda}, ` : ''}{reunion.municipio}, {reunion.departamento}
                        </p>
                    </div>
                </div>

                {reunion.grupo_avanzada && (
                    <div className="flex items-center gap-2 text-[11px] pt-1 text-cyan-800">
                        <Users size={12} className="text-cyan-600" />
                        <span>Avanzada: <strong>{reunion.grupo_avanzada}</strong></span>
                    </div>
                )}

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-200/60 font-bold">
                    <span className="text-gray-500">
                        Aforo Est: <strong className="text-slate-800">{reunion.aforo_estimado || 0}</strong>
                    </span>
                    <span className="text-cyan-700">
                        BD Asistentes: <strong>{reunion.total_asistentes_registrados || reunion.asistentes_reales || 0}</strong>
                    </span>
                </div>
            </div>

            {/* Botones de Acción */}
            <div className="space-y-2 pt-1">
                {/* Botón Iniciar / Finalizar Evento */}
                {canManageStatus && (
                    <div className="grid grid-cols-2 gap-2">
                        {reunion.estado === 'programada' && (
                            <button
                                onClick={() => onStatusChange('iniciar')}
                                className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all"
                            >
                                <Play size={13} fill="currentColor" />
                                <span>Dar Inicio a Reunión</span>
                            </button>
                        )}

                        {reunion.estado === 'en_curso' && (
                            <button
                                onClick={() => onStatusChange('finalizar')}
                                className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all animate-bounce"
                            >
                                <CheckCircle2 size={14} />
                                <span>Finalizar Reunión</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Botones de Evidencias y Base de Datos */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={onOpenEvidencias}
                        className="flex items-center justify-center gap-1.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors"
                        title="Ver o subir evidencias fotográficas"
                    >
                        <Camera size={14} />
                        <span>Fotos ({fotosCount})</span>
                    </button>

                    <button
                        onClick={onOpenAsistentes}
                        className="flex items-center justify-center gap-1.5 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-xl text-xs font-bold transition-colors"
                        title="Cargar y ver base de datos de la reunión"
                    >
                        <FileSpreadsheet size={14} />
                        <span>Base de Datos</span>
                    </button>
                </div>

                {/* Acciones de Edición / Borrado */}
                <div className="flex items-center justify-end gap-1 pt-1 text-gray-400">
                    <button
                        onClick={onEdit}
                        className="p-1.5 hover:text-slate-800 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar detalles de la reunión"
                    >
                        <Edit3 size={14} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar reunión"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
