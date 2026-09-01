import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Info, ChevronDown, ChevronUp, Copy, Check, Terminal } from 'lucide-react';
import { HealthAlert } from '../types';

interface HealthAlertsProps {
  alerts: HealthAlert[];
}

export const HealthAlerts: React.FC<HealthAlertsProps> = ({ alerts }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!alerts || alerts.length === 0) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-2 mb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-slate-500" />
          <span>Diagnósticos & Alertas de Saúde do SQL Server ({alerts.length})</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {alerts.map((alert) => {
          const isExpanded = expandedId === alert.id;
          const isCritical = alert.level === 'critical';
          const isWarning = alert.level === 'warning';

          return (
            <div
              key={alert.id}
              className={`rounded-xl border transition-all overflow-hidden ${
                isCritical 
                  ? 'bg-rose-50/70 border-rose-200' 
                  : isWarning 
                  ? 'bg-amber-50/70 border-amber-200' 
                  : 'bg-blue-50/70 border-blue-200'
              }`}
            >
              <div 
                onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                className="px-4 py-3 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  {isCritical ? (
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                  ) : isWarning ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  ) : (
                    <Info className="w-5 h-5 text-blue-600 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">{alert.title}</span>
                      <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded uppercase ${
                        isCritical ? 'bg-rose-200 text-rose-800' : isWarning ? 'bg-amber-200 text-amber-900' : 'bg-blue-200 text-blue-800'
                      }`}>
                        {alert.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{alert.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                    {isExpanded ? 'Recolher' : 'Detalhes & Script'}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-200/60 bg-white/80 space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-700 block mb-0.5">Impacto no Desempenho:</span>
                    <p className="text-slate-600">{alert.impact}</p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 block mb-0.5">Ação Recomendada pelo DBA:</span>
                    <p className="text-slate-600">{alert.recommendation}</p>
                  </div>

                  {alert.fixScript && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <Terminal className="w-3.5 h-3.5 text-blue-600" />
                          <span>Script T-SQL de Resolução:</span>
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(alert.id, alert.fixScript!);
                          }}
                          className="px-2 py-0.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-medium flex items-center gap-1"
                        >
                          {copiedId === alert.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === alert.id ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      </div>
                      <div className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto">
                        <pre>{alert.fixScript}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
