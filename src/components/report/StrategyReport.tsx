import type { StrategyReport } from '../../types/film';
import { Download, Trophy, Globe, Tv, CheckSquare, BarChart2, Calendar, TrendingUp, AlertTriangle, ChevronRight, Star } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  report: StrategyReport;
  onBack: () => void;
  onExport: () => void;
}

interface CardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function ReportCard({ title, icon, children, className = '' }: CardProps) {
  return (
    <div className={`bg-cinema-card border border-cinema-border rounded-xl overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-5 py-4 border-b border-cinema-border bg-cinema-dark/40">
        <span className="text-cinema-gold">{icon}</span>
        <h3 className="font-semibold text-cinema-text">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    listo: 'bg-green-900/40 text-green-400 border-green-800',
    en_proceso: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
    no_disponible: 'bg-red-900/40 text-red-400 border-red-800',
  };
  const labels: Record<string, string> = {
    listo: '✓ Listo',
    en_proceso: '⏳ En proceso',
    no_disponible: '✗ No disponible',
  };
  return (
    <span className={clsx('text-xs px-2 py-0.5 rounded-full border font-medium', map[status] ?? 'bg-cinema-border text-cinema-muted border-cinema-border')}>
      {labels[status] ?? status}
    </span>
  );
}

export function StrategyReportView({ report, onBack, onExport }: Props) {
  return (
    <div className="space-y-6" id="strategy-report">
      {/* Header del informe */}
      <div className="bg-gradient-to-r from-cinema-dark via-cinema-card to-cinema-dark border border-cinema-border rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="text-cinema-gold text-xs font-semibold uppercase tracking-widest mb-2">Informe de Estrategia de Distribución</div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-cinema-text mb-1">"{report.filmTitle}"</h1>
            <p className="text-cinema-text-dim text-sm">Generado el {report.generatedAt}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-center bg-cinema-dark border border-cinema-gold/30 rounded-xl p-4">
              <div className="text-3xl font-bold text-cinema-gold">{report.overallScore}</div>
              <div className="text-xs text-cinema-text-dim mt-0.5">/ 100</div>
              <div className="text-xs text-cinema-gold font-medium mt-1">Índice de distribución</div>
            </div>
          </div>
        </div>

        {/* Resumen ejecutivo */}
        <div className="mt-5 bg-cinema-black/40 rounded-xl p-4 border border-cinema-border/50">
          <p className="text-sm text-cinema-text leading-relaxed">{report.executiveSummary}</p>
        </div>
      </div>

      {/* DAFO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-green-900/20 border border-green-800/40 rounded-xl p-4">
          <h4 className="text-green-400 font-semibold text-sm mb-3 flex items-center gap-2"><Star size={14} /> Fortalezas</h4>
          <ul className="space-y-1.5">
            {report.strengths.map((s, i) => <li key={i} className="text-xs text-cinema-text-dim flex gap-2"><span className="text-green-400 mt-0.5">✓</span>{s}</li>)}
          </ul>
        </div>
        <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-4">
          <h4 className="text-red-400 font-semibold text-sm mb-3 flex items-center gap-2"><AlertTriangle size={14} /> Debilidades</h4>
          <ul className="space-y-1.5">
            {report.weaknesses.length > 0
              ? report.weaknesses.map((w, i) => <li key={i} className="text-xs text-cinema-text-dim flex gap-2"><span className="text-red-400 mt-0.5">!</span>{w}</li>)
              : <li className="text-xs text-green-400">No se detectaron debilidades críticas</li>}
          </ul>
        </div>
        <div className="bg-blue-900/20 border border-blue-800/40 rounded-xl p-4">
          <h4 className="text-blue-400 font-semibold text-sm mb-3 flex items-center gap-2"><TrendingUp size={14} /> Oportunidades</h4>
          <ul className="space-y-1.5">
            {report.opportunities.map((o, i) => <li key={i} className="text-xs text-cinema-text-dim flex gap-2"><span className="text-blue-400 mt-0.5">→</span>{o}</li>)}
          </ul>
        </div>
        <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-xl p-4">
          <h4 className="text-yellow-400 font-semibold text-sm mb-3 flex items-center gap-2"><AlertTriangle size={14} /> Riesgos</h4>
          <ul className="space-y-1.5">
            {report.risks.map((r, i) => <li key={i} className="text-xs text-cinema-text-dim flex gap-2"><span className="text-yellow-400 mt-0.5">⚠</span>{r}</li>)}
          </ul>
        </div>
      </div>

      {/* Festivales recomendados */}
      <ReportCard title={`Festivales recomendados (${report.recommendedFestivals.length})`} icon={<Trophy size={18} />}>
        <div className="space-y-3">
          {report.recommendedFestivals.map((f, i) => (
            <div key={i} className="border border-cinema-border rounded-lg p-3 hover:border-cinema-gold/40 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <span className="font-semibold text-sm text-cinema-text">{f.name}</span>
                  <span className="text-cinema-text-dim text-xs ml-2">{f.city}, {f.country}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium border', {
                    'bg-cinema-gold/20 text-cinema-gold border-cinema-gold/40': f.tier === 'tier_a',
                    'bg-blue-900/30 text-blue-400 border-blue-800/50': f.tier === 'tier_b',
                    'bg-cinema-border/50 text-cinema-text-dim border-cinema-border': f.tier === 'tier_c',
                    'bg-red-900/30 text-red-400 border-red-800/50': f.tier === 'nacional',
                    'bg-green-900/30 text-green-400 border-green-800/50': f.tier === 'regional',
                  })}>
                    {f.tier === 'tier_a' ? '⭐ Tier A' : f.tier === 'tier_b' ? '🥈 Tier B' : f.tier === 'tier_c' ? '🥉 Tier C' : f.tier === 'nacional' ? '🇪🇸 Nacional' : '📍 Regional'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                <div className="text-xs"><span className="text-cinema-text-dim">Mes: </span><span className="text-cinema-text">{f.month}</span></div>
                <div className="text-xs"><span className="text-cinema-text-dim">Deadline: </span><span className="text-cinema-text">{f.deadline}</span></div>
                <div className="text-xs"><span className="text-cinema-text-dim">Tasa: </span><span className="text-cinema-text">{f.submissionFee}</span></div>
                <div className="text-xs"><span className="text-cinema-text-dim">Plataforma: </span><span className="text-cinema-text">{f.platform}</span></div>
              </div>
              <p className="text-xs text-cinema-text-dim mt-2 italic">{f.reason}</p>
            </div>
          ))}
        </div>
      </ReportCard>

      {/* Hoja de ruta de festivales */}
      {report.festivalRoadmap.length > 0 && (
        <ReportCard title="Hoja de ruta anual de festivales" icon={<Calendar size={18} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {report.festivalRoadmap.map((month, i) => (
              <div key={i} className="bg-cinema-dark rounded-lg p-3">
                <div className="text-cinema-gold font-semibold text-sm mb-2">{month.month}</div>
                <ul className="space-y-1">
                  {month.festivals.map((f, j) => (
                    <li key={j} className="text-xs text-cinema-text-dim flex items-center gap-1.5">
                      <ChevronRight size={10} className="text-cinema-gold flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ReportCard>
      )}

      {/* Plan de marketing */}
      <ReportCard title="Plan de marketing por fases" icon={<TrendingUp size={18} />}>
        <div className="space-y-4">
          {report.marketingPhases.map((phase, i) => (
            <div key={i} className="border border-cinema-border rounded-xl overflow-hidden">
              <div className="bg-cinema-dark px-4 py-3 flex items-center justify-between">
                <h4 className="font-semibold text-cinema-gold text-sm">{phase.phase}</h4>
                <span className="text-xs text-cinema-text-dim bg-cinema-card px-2 py-1 rounded-full border border-cinema-border">{phase.budget}</span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-cinema-text mb-2">Acciones:</p>
                  <ul className="space-y-1">
                    {phase.actions.map((a, j) => (
                      <li key={j} className="text-xs text-cinema-text-dim flex gap-2">
                        <span className="text-cinema-gold mt-0.5 flex-shrink-0">•</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-cinema-text mb-2">KPIs de éxito:</p>
                  <ul className="space-y-1">
                    {phase.kpis.map((k, j) => (
                      <li key={j} className="text-xs text-cinema-text-dim flex gap-2">
                        <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>{k}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ReportCard>

      {/* Ventanas de distribución */}
      <ReportCard title="Ventanas de distribución" icon={<Tv size={18} />}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-cinema-border">
                <th className="text-left text-cinema-text-dim font-medium pb-2 pr-3">Ventana</th>
                <th className="text-left text-cinema-text-dim font-medium pb-2 pr-3">Plataforma</th>
                <th className="text-left text-cinema-text-dim font-medium pb-2 pr-3">Timing</th>
                <th className="text-left text-cinema-text-dim font-medium pb-2">Ingresos estimados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-border/50">
              {report.distributionWindows.map((w, i) => (
                <tr key={i} className="hover:bg-cinema-dark/30 transition-colors">
                  <td className="py-2.5 pr-3 font-medium text-cinema-text">{w.window}</td>
                  <td className="py-2.5 pr-3 text-cinema-text-dim">{w.platform}</td>
                  <td className="py-2.5 pr-3 text-cinema-text-dim">{w.timing}</td>
                  <td className="py-2.5 text-cinema-gold">{w.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportCard>

      {/* Plataformas recomendadas */}
      <ReportCard title="Plataformas digitales recomendadas" icon={<Globe size={18} />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {report.recommendedPlatforms.map((p, i) => (
            <div key={i} className="border border-cinema-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-cinema-text">{p.name}</span>
                <span className="text-xs bg-cinema-dark border border-cinema-border px-2 py-0.5 rounded-full text-cinema-gold">{p.probability}</span>
              </div>
              <div className="text-xs text-cinema-text-dim mb-1">{p.territory}</div>
              <p className="text-xs text-cinema-text-dim italic">{p.notes}</p>
            </div>
          ))}
        </div>
      </ReportCard>

      {/* Checklist de entregables */}
      <ReportCard title="Checklist de entregables" icon={<CheckSquare size={18} />}>
        <div className="space-y-0">
          {report.deliverableChecklist.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-cinema-border/50 last:border-0 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', {
                  'bg-red-500': item.priority === 'alta',
                  'bg-yellow-500': item.priority === 'media',
                  'bg-green-500': item.priority === 'baja',
                })} />
                <span className="text-xs text-cinema-text truncate">{item.item}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-cinema-text-dim hidden sm:block">{item.deadline}</span>
                <StatusBadge status={item.status} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-cinema-border">
          <span className="flex items-center gap-1.5 text-xs text-cinema-text-dim"><span className="w-2 h-2 rounded-full bg-red-500" /> Alta prioridad</span>
          <span className="flex items-center gap-1.5 text-xs text-cinema-text-dim"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Media prioridad</span>
          <span className="flex items-center gap-1.5 text-xs text-cinema-text-dim"><span className="w-2 h-2 rounded-full bg-green-500" /> Baja prioridad</span>
        </div>
      </ReportCard>

      {/* Presupuesto */}
      {report.totalBudgetEstimate > 0 && (
        <ReportCard title="Desglose presupuestario recomendado" icon={<BarChart2 size={18} />}>
          <div className="space-y-3">
            {report.budgetBreakdown.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-cinema-text-dim w-48 flex-shrink-0">{item.category}</span>
                <div className="flex-1 bg-cinema-border rounded-full h-2">
                  <div className="bg-cinema-gold rounded-full h-2 transition-all" style={{ width: `${item.percentage}%` }} />
                </div>
                <span className="text-xs text-cinema-gold font-medium w-28 text-right flex-shrink-0">
                  {item.recommended.toLocaleString('es-ES')}€ ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-cinema-border flex justify-between">
            <span className="text-sm font-semibold text-cinema-text">Total estimado</span>
            <span className="text-sm font-bold text-cinema-gold">{report.totalBudgetEstimate.toLocaleString('es-ES')} €</span>
          </div>
        </ReportCard>
      )}

      {/* Próximos pasos */}
      <ReportCard title="Próximos pasos inmediatos" icon={<ChevronRight size={18} />}>
        <ol className="space-y-3">
          {report.nextSteps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cinema-gold/20 border border-cinema-gold/40 flex items-center justify-center text-cinema-gold text-xs font-bold">
                {i + 1}
              </span>
              <span className="text-sm text-cinema-text-dim pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </ReportCard>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-3 pb-8">
        <button
          onClick={onExport}
          className="flex items-center justify-center gap-2 bg-gradient-gold text-cinema-black font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-cinema-gold/20"
        >
          <Download size={18} />
          Exportar informe (PDF)
        </button>
        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 bg-cinema-card border border-cinema-border text-cinema-text px-6 py-3 rounded-xl hover:border-cinema-gold/50 transition-all"
        >
          Editar datos
        </button>
      </div>
    </div>
  );
}
