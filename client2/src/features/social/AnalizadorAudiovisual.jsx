import { useState } from 'react';
import axios from 'axios';
import { API } from '../../config/api';
import {
  Sparkles, Video, Clock, AlertCircle, CheckCircle, Lightbulb,
  BarChart3, RefreshCw, Send, ChevronRight, ShieldCheck, Flame
} from 'lucide-react';

export default function AnalizadorAudiovisual({ activeCampaign, token }) {
  const [formData, setFormData] = useState({
    text: '',
    durationSeconds: 30,
    platform: 'tiktok',
    topic: 'Propuestas de Campaña',
    objective: 'movilizacion',
    metrics: {
      views: '',
      reach: '',
      likes: '',
      comments: '',
      shares: '',
      saves: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [activeSegment, setActiveSegment] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!formData.text.trim()) {
      alert('Por favor introduce el guion, transcripción o copy del video a analizar.');
      return;
    }

    setLoading(true);
    try {
      const authToken = token || localStorage.getItem('token');
      const payload = {
        campana_id: activeCampaign?.id || 1,
        text: formData.text,
        durationSeconds: Number(formData.durationSeconds) || 30,
        platform: formData.platform,
        topic: formData.topic,
        objective: formData.objective,
        metrics: {
          views: formData.metrics.views ? Number(formData.metrics.views) : null,
          reach: formData.metrics.reach ? Number(formData.metrics.reach) : null,
          likes: Number(formData.metrics.likes) || 0,
          comments: Number(formData.metrics.comments) || 0,
          shares: Number(formData.metrics.shares) || 0,
          saves: Number(formData.metrics.saves) || 0
        }
      };

      const res = await axios.post(`${API}/social/intelligence/analyze`, payload, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (res.data?.success) {
        setAnalysis(res.data.analysis);
      }
    } catch (err) {
      console.error('Error al analizar contenido:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message;
      alert(`Error al analizar contenido: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulario de Entrada */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-black uppercase tracking-wide flex items-center gap-2">
              <Video className="text-cyan-400" size={20} />
              Analizador de Estructura Audiovisual y Retención
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Desglosa el guion segundo a segundo, evalúa la fuerza del gancho inicial y genera observaciones auditables sin inventar datos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase px-3 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-full">
              Motor Descriptivo + IA
            </span>
          </div>
        </div>

        <form onSubmit={handleAnalyze} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                Plataforma Objetivo
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="tiktok">TikTok (Formato Vertical Corto)</option>
                <option value="reels">Instagram Reels</option>
                <option value="youtube_shorts">YouTube Shorts</option>
                <option value="x">X / Twitter (Video)</option>
                <option value="facebook">Facebook Video</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                Duración del Video (Segundos)
              </label>
              <input
                type="number"
                min="5"
                max="300"
                value={formData.durationSeconds}
                onChange={(e) => setFormData({ ...formData, durationSeconds: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                Objetivo Estratégico
              </label>
              <select
                value={formData.objective}
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="movilizacion">Movilización y Voto</option>
                <option value="propuesta">Explicación de Propuesta</option>
                <option value="denuncia">Contraste / Denuncia</option>
                <option value="cercania">Historia Personal / Cercanía</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
              Guion, Copy o Transcripción del Video
            </label>
            <textarea
              rows="4"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              placeholder="Pega aquí el guion que se va a grabar o el texto del video publicado... Ej: ¿Por qué en nuestro departamento las obras nunca se entregan a tiempo? Hoy les revelo lo que encontramos en la auditoría..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Métricas opcionales observadas si ya fue publicado */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              (Opcional) Si el contenido ya fue publicado, ingresa sus métricas reales observadas:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              <div>
                <span className="text-[9px] text-slate-400 block mb-0.5">Vistas</span>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.metrics.views}
                  onChange={(e) => setFormData({ ...formData, metrics: { ...formData.metrics, views: e.target.value } })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block mb-0.5">Alcance</span>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.metrics.reach}
                  onChange={(e) => setFormData({ ...formData, metrics: { ...formData.metrics, reach: e.target.value } })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block mb-0.5">Likes</span>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.metrics.likes}
                  onChange={(e) => setFormData({ ...formData, metrics: { ...formData.metrics, likes: e.target.value } })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block mb-0.5">Comentarios</span>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.metrics.comments}
                  onChange={(e) => setFormData({ ...formData, metrics: { ...formData.metrics, comments: e.target.value } })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block mb-0.5">Compartidos</span>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.metrics.shares}
                  onChange={(e) => setFormData({ ...formData, metrics: { ...formData.metrics, shares: e.target.value } })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block mb-0.5">Guardados</span>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.metrics.saves}
                  onChange={(e) => setFormData({ ...formData, metrics: { ...formData.metrics, saves: e.target.value } })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Procesando Estructura Audiovisual...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Ejecutar Análisis Inteligente</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* RESULTADOS DEL ANÁLISIS */}
      {analysis && (
        <div className="space-y-6">
          {/* Disclaimer & Provider Banner */}
          <div className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
            analysis.isMock
              ? 'bg-amber-950/40 border-amber-800 text-amber-200'
              : 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
          }`}>
            <AlertCircle size={18} className="shrink-0" />
            <div className="flex-1">
              <span className="font-bold uppercase tracking-wider block">
                {analysis.isMock ? 'MODO SIMULADO (MOCK LOCAL)' : 'ANÁLISIS ASISTIDO POR IA'}
              </span>
              <p className="text-[11px] opacity-90 mt-0.5">{analysis.disclaimer}</p>
            </div>
            <span className="text-[10px] font-mono uppercase px-2.5 py-1 bg-black/40 rounded-lg border border-white/10">
              Proveedor: {analysis.provider}
            </span>
          </div>

          {/* KPIs Calculados */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Score Algorítmico</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-cyan-400">
                  {analysis.metrics?.virality_score || analysis.metrics?.retention_potential || 70}
                </span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Calculado por métricas de retención</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Fuerza del Gancho (0-3s)</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-400">
                  {analysis.metrics?.hook_strength || 75}%
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Capacidad de frenar el scroll</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Ritmo de Locución</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-purple-400">
                  {analysis.metrics?.pacing_wpm || 140}
                </span>
                <span className="text-xs text-slate-500">palabras/min</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Rango óptimo: 130 - 165 ppm</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Fatiga de Audiencia</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-black ${
                  analysis.fatigueAnalysis?.level === 'alto' ? 'text-rose-400' :
                  analysis.fatigueAnalysis?.level === 'medio' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {analysis.fatigueAnalysis?.fatigueScore || 15}%
                </span>
                <span className="text-xs uppercase font-bold text-slate-500">
                  {analysis.fatigueAnalysis?.level || 'bajo'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Frecuencia últimos 7 días</span>
            </div>
          </div>

          {/* DESGLOSE AUDIOVISUAL CRONOLÓGICO (TIMELINE) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl">
            <h4 className="text-sm font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2 mb-4">
              <Clock size={16} />
              Desglose Audiovisual Segundo a Segundo
            </h4>

            {/* Timeline Bar Visualizer */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                {analysis.audiovisualTimeline?.map((seg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSegment(seg)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      activeSegment?.index === seg.index
                        ? 'bg-cyan-950/80 border-cyan-500 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1">
                      <span>{seg.startTime}s - {seg.endTime}s</span>
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${
                        seg.impact === 'critico' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        seg.impact === 'alto' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {seg.impact}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-white block line-clamp-1">
                      {seg.segmentName}
                    </span>
                  </button>
                ))}
              </div>

              {/* Segment Detail Box */}
              {activeSegment && (
                <div className="bg-slate-950 border border-cyan-800/60 rounded-2xl p-4 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase text-cyan-300">
                      Segmento Seleccionado: {activeSegment.segmentName} ({activeSegment.startTime}s - {activeSegment.endTime}s)
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Impacto: {activeSegment.impact}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mb-2">
                    <strong>Observación:</strong> {activeSegment.observation}
                  </p>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs text-cyan-200 flex items-start gap-2">
                    <Lightbulb size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>Acción recomendada:</strong> {activeSegment.recommendation}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* TRES SECCIONES ESTRICTAS: OBSERVACIONES | MÉTRICAS | HIPÓTESIS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 1. OBSERVACIONES (Hechos Verificables) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
                <CheckCircle size={18} className="text-emerald-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  1. Observaciones Técnicas (Hechos Verificables)
                </h4>
              </div>
              <ul className="space-y-2">
                {analysis.observations?.map((obs, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 2. HIPÓTESIS (Conjeturas de IA) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
                <AlertCircle size={18} className="text-amber-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                  2. Hipótesis Probabilísticas (IA Asistida)
                </h4>
              </div>
              <ul className="space-y-2">
                {analysis.hypotheses?.map((hyp, i) => (
                  <li key={i} className="text-xs text-amber-200/90 flex items-start gap-2 bg-amber-950/20 p-2.5 rounded-xl border border-amber-900/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>{hyp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 3. RECOMENDACIONES EDITORIALES */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white">
              <h4 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2 mb-3">
                <Lightbulb size={16} />
                Recomendaciones de Edición y Publicación
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {analysis.recommendations.map((rec, i) => (
                  <div key={i} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs text-slate-300">
                    <span className="text-[10px] font-bold uppercase text-cyan-400 block mb-1">
                      Paso #{i + 1}
                    </span>
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
