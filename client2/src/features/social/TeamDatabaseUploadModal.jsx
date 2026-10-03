import { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle, Users, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { API } from '../../config/api';

export default function TeamDatabaseUploadModal({ isOpen, onClose, campanaId, onImportSuccess }) {
    const [file, setFile] = useState(null);
    const [previewRows, setPreviewRows] = useState([]);
    const [isParsing, setIsParsing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successResult, setSuccessResult] = useState(null);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    // Normalizar encabezados para que admita nombres comunes en español e inglés
    const normalizeKey = (key) => {
        const k = String(key || '').toLowerCase().trim().replace(/[\s_-]+/g, '');
        if (k.includes('nombre') || k.includes('name') || k.includes('miembro')) return 'nombre_miembro';
        if (k.includes('handle') || k.includes('usuario') || k.includes('user') || k.includes('red') || k.includes('cuenta')) return 'usuario_handle';
        if (k.includes('rol') || k.includes('cargo') || k.includes('role') || k.includes('posicion')) return 'rol_equipo';
        if (k.includes('plataforma') || k.includes('redsocial') || k.includes('platform')) return 'plataforma';
        return k;
    };

    // Parsear archivo CSV o Excel usando XLSX
    const handleFileChange = async (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setErrorMsg(null);
        setSuccessResult(null);
        setFile(selectedFile);
        setIsParsing(true);

        try {
            const data = await selectedFile.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

            if (!rawJson || rawJson.length === 0) {
                throw new Error('El archivo no contiene filas de datos o está vacío.');
            }

            // Normalizar las columnas
            const parsed = rawJson.map((row, idx) => {
                const normRow = {};
                for (const [k, v] of Object.entries(row)) {
                    normRow[normalizeKey(k)] = String(v).trim();
                }

                // Asegurar formato @handle
                let handle = normRow.usuario_handle || '';
                if (handle && !handle.startsWith('@')) handle = '@' + handle;

                return {
                    id: idx + 1,
                    nombre_miembro: normRow.nombre_miembro || `Integrante #${idx + 1}`,
                    usuario_handle: handle,
                    rol_equipo: normRow.rol_equipo || 'Equipo de Campaña',
                    plataforma: (normRow.plataforma || 'instagram').toLowerCase()
                };
            }).filter(r => r.usuario_handle && r.usuario_handle.length > 1);

            if (parsed.length === 0) {
                throw new Error('No se encontraron columnas válidas de "Usuario / Handle" o "Nombre". Revisa la plantilla.');
            }

            setPreviewRows(parsed);
        } catch (err) {
            console.error('Error parseando archivo:', err);
            setErrorMsg(err.message || 'Error al procesar el archivo. Asegúrate de que sea Excel (.xlsx, .xls) o CSV.');
            setPreviewRows([]);
        } finally {
            setIsParsing(false);
        }
    };

    // Descargar plantilla CSV de muestra
    const handleDownloadTemplate = () => {
        const sampleCsv = `Nombre Completo,Usuario_Handle,Rol en Campana,Plataforma
Carlos Gomez (Avanzada),@carlos_avanzada,Coordinador de Avanzada Territorial,instagram
Maria Fernanda Restrepo,@maria_juventud,Lider Juventudes Digitales,instagram
Voceria Medellin,@voceria_oficial_medellin,Equipo de Comunicaciones,instagram
Julian Ramirez,@julian_voluntario_cali,Brigada de Apoyo Ciudadano,tiktok
Laura Veedora,@laura_veeduria_comunal,Enlace Comunitario,facebook`;

        const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'plantilla_equipo_redes_campana.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Subir miembros procesados al backend
    const handleUploadToBackend = async () => {
        if (!previewRows || previewRows.length === 0) {
            setErrorMsg('No hay datos para subir.');
            return;
        }

        setIsSubmitting(true);
        setErrorMsg(null);
        const token = localStorage.getItem('token');

        try {
            const res = await axios.post(
                `${API}/social/team/import`,
                {
                    members: previewRows,
                    campana_id: campanaId || 1
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setSuccessResult(res.data);
            if (onImportSuccess) {
                onImportSuccess(res.data);
            }
        } catch (err) {
            console.error('Error al subir equipo:', err);
            setErrorMsg(err.response?.data?.message || 'Error al registrar los integrantes en la base de datos.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-3xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 p-5 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            <FileSpreadsheet size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-base uppercase tracking-wide">
                                Subir Base de Datos del Equipo
                            </h3>
                            <p className="text-xs text-indigo-200">
                                Sube el archivo Excel o CSV para identificar automáticamente a los integrantes en cada comentario y reacción
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 overflow-y-auto">
                    {/* Explicación y Descarga de Plantilla */}
                    <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                            <span className="text-xs font-black uppercase text-indigo-950 flex items-center gap-1.5">
                                <Users size={14} className="text-indigo-600" />
                                Formato Requerido de Columnas
                            </span>
                            <p className="text-[11px] text-indigo-800">
                                Columnas reconocidas: <strong>Nombre Completo</strong>, <strong>Usuario / Handle (@usuario)</strong>, <strong>Rol en Campaña</strong> y <strong>Plataforma</strong>.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleDownloadTemplate}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
                        >
                            <Download size={14} />
                            <span>Descargar Plantilla (.csv)</span>
                        </button>
                    </div>

                    {/* Zona de Drop / Selección de Archivo */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 hover:bg-indigo-50/40 rounded-3xl p-6 text-center cursor-pointer transition-all space-y-2"
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
                            <Upload size={22} />
                        </div>
                        <div>
                            <p className="font-black text-sm text-slate-900">
                                {file ? file.name : 'Haz clic o arrastra aquí tu archivo Excel (.xlsx, .xls) o CSV'}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {file ? `${(file.size / 1024).toFixed(1)} KB listos para procesar` : 'La plataforma cruzará automáticamente los usuarios con todos los comentarios'}
                            </p>
                        </div>
                    </div>

                    {/* Mensajes de error o éxito */}
                    {errorMsg && (
                        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {successResult && (
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1">
                            <div className="flex items-center gap-2 font-black text-emerald-900">
                                <CheckCircle size={16} />
                                <span>¡Base de Datos del Equipo Actualizada con Éxito!</span>
                            </div>
                            <p>
                                Se procesaron <strong>{successResult.totalProcessed}</strong> integrantes ({successResult.createdCount} nuevos, {successResult.updatedCount} actualizados).
                            </p>
                            <p className="text-[11px] text-emerald-700">
                                Los comentarios en todas las publicaciones fueron reevaluados y ahora mostrarán la insignia del integrante a su lado.
                            </p>
                        </div>
                    )}

                    {/* Previsualización de Datos */}
                    {previewRows.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                                    <span>Vista Previa de Integrantes</span>
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px]">
                                        {previewRows.length} detectados
                                    </span>
                                </span>
                                <span className="text-[11px] text-gray-400">Verifica los datos antes de guardar</span>
                            </div>

                            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-xs max-h-48 overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                                        <tr>
                                            <th className="p-2.5 pl-3">Nombre</th>
                                            <th className="p-2.5">Handle / Red</th>
                                            <th className="p-2.5">Rol en Campaña</th>
                                            <th className="p-2.5">Plataforma</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {previewRows.map(row => (
                                            <tr key={row.id} className="hover:bg-indigo-50/30 transition-colors">
                                                <td className="p-2.5 pl-3 font-bold text-slate-900">{row.nombre_miembro}</td>
                                                <td className="p-2.5 font-mono text-indigo-600 font-bold">{row.usuario_handle}</td>
                                                <td className="p-2.5 text-gray-700">{row.rol_equipo}</td>
                                                <td className="p-2.5 uppercase font-mono text-[10px] text-gray-500">{row.plataforma}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        Cerrar
                    </button>

                    <button
                        type="button"
                        disabled={previewRows.length === 0 || isSubmitting}
                        onClick={handleUploadToBackend}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md transition-all cursor-pointer ${
                            previewRows.length === 0 || isSubmitting
                                ? 'bg-gray-300 cursor-not-allowed opacity-60'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/25'
                        }`}
                    >
                        {isSubmitting ? (
                            <>
                                <RefreshCw size={14} className="animate-spin" />
                                <span>Procesando y Cruzando...</span>
                            </>
                        ) : (
                            <>
                                <Upload size={14} />
                                <span>Guardar e Identificar en Comentarios ({previewRows.length})</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
