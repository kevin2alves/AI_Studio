import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Copy, 
  Check, 
  FileCode, 
  Sparkles, 
  Trash2,
  Play
} from 'lucide-react';
import { FullMetricsPayload, IndexFragmentationData } from '../types';

interface IndexesTabProps {
  metrics: FullMetricsPayload;
  onRebuildIndex: (script: string) => Promise<void>;
}

export const IndexesTab: React.FC<IndexesTabProps> = ({
  metrics,
  onRebuildIndex,
}) => {
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const [executingIndex, setExecutingIndex] = useState<string | null>(null);
  const [maintenanceSuccess, setMaintenanceSuccess] = useState<string | null>(null);

  const handleCopy = (key: string, script: string) => {
    navigator.clipboard.writeText(script);
    setCopiedScript(key);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  const handleExecuteMaintenance = async (indexItem: IndexFragmentationData) => {
    setExecutingIndex(indexItem.indexName);
    setMaintenanceSuccess(null);
    try {
      await onRebuildIndex(indexItem.actionScript);
      setMaintenanceSuccess(`Manutenção no índice [${indexItem.indexName}] executada com sucesso!`);
      setTimeout(() => setMaintenanceSuccess(null), 4000);
    } finally {
      setExecutingIndex(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Maintenance Notification */}
      {maintenanceSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{maintenanceSuccess}</span>
        </div>
      )}

      {/* 1. Index Fragmentation Master Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <span>Análise de Fragmentação de Índices (sys.dm_db_index_physical_stats)</span>
            </h3>
            <p className="text-xs text-slate-500">Recomendações automáticas de REBUILD (&gt;30%) ou REORGANIZE (10-30%)</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-3 px-4">Tabela / Objeto</th>
                <th className="py-3 px-3">Nome do Índice</th>
                <th className="py-3 px-3">Tipo</th>
                <th className="py-3 px-4 min-w-[140px]">Fragmentação (%)</th>
                <th className="py-3 px-3">Páginas / Tamanho</th>
                <th className="py-3 px-3">Recomendação</th>
                <th className="py-3 px-4 text-right">Ação T-SQL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {metrics.indexFragmentation.map((idx) => {
                const isRebuild = idx.actionRecommendation === 'REBUILD';
                const isReorganize = idx.actionRecommendation === 'REORGANIZE';
                const isHealthy = idx.actionRecommendation === 'HEALTHY';

                return (
                  <tr key={`${idx.dbName}_${idx.tableName}_${idx.indexName}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {idx.schemaName}.{idx.tableName}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {idx.indexName}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {idx.indexType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              isRebuild ? 'bg-rose-600' : isReorganize ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${Math.min(100, idx.avgFragmentationPct)}%` }}
                          />
                        </div>
                        <span className={`font-mono font-bold text-[11px] w-12 text-right ${
                          isRebuild ? 'text-rose-700' : isReorganize ? 'text-amber-800' : 'text-emerald-700'
                        }`}>
                          {idx.avgFragmentationPct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                      <div>{idx.pageCount.toLocaleString()} págs</div>
                      <div>{idx.sizeMB} MB</div>
                    </td>
                    <td className="py-3 px-3">
                      {isRebuild ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                          REBUILD ONLINE
                        </span>
                      ) : isReorganize ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                          REORGANIZE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          SAUDÁVEL
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleCopy(idx.indexName, idx.actionScript)}
                          className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                          title="Copiar Script T-SQL"
                        >
                          {copiedScript === idx.indexName ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        {!isHealthy && (
                          <button
                            onClick={() => handleExecuteMaintenance(idx)}
                            disabled={executingIndex === idx.indexName}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1 transition-colors disabled:opacity-50"
                          >
                            <Play className="w-3 h-3" />
                            <span>{executingIndex === idx.indexName ? 'Executando...' : 'Executar'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Missing Indexes Advisor (Query Optimizer Suggestions) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Sugestões de Índices Ausentes (sys.dm_db_missing_index_details)</span>
          </h3>
          <p className="text-xs text-slate-500">Índices recomendados pelo otimizador de consultas com alto impacto estimado no tempo de execução</p>
        </div>

        <div className="p-5 space-y-4">
          {metrics.missingIndexes.map((m) => (
            <div key={`${m.dbName}_${m.tableName}_${m.equalityCols}`} className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">[{m.dbName}].[dbo].[{m.tableName}]</span>
                    <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-emerald-100 text-emerald-800">
                      +{m.impactPct}% Ganho de Performance
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Seeks Estimados: <strong className="text-slate-800">{m.userSeeks.toLocaleString()}</strong> • Custo Médio: <strong className="text-slate-800">{m.avgTotalUserCost}</strong>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(m.tableName, m.createScript)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  {copiedScript === m.tableName ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript === m.tableName ? 'Copiado!' : 'Copiar CREATE INDEX'}</span>
                </button>
              </div>

              <div className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed">
                <pre>{m.createScript}</pre>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Index Usage & Unused Indexes Detector */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Detector de Índices Não Utilizados / Obsoletos (sys.dm_db_index_usage_stats)</span>
          </h3>
          <p className="text-xs text-slate-500">Identifica índices que acumulam escrita (updates/inserts) mas geram zero leituras (seeks/scans)</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-3 px-4">Tabela</th>
                <th className="py-3 px-3">Nome do Índice</th>
                <th className="py-3 px-3">Tipo</th>
                <th className="py-3 px-3">User Seeks</th>
                <th className="py-3 px-3">User Scans</th>
                <th className="py-3 px-3">User Updates</th>
                <th className="py-3 px-3">Read / Write Ratio</th>
                <th className="py-3 px-4 text-right">Status do Índice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {metrics.indexUsage.map((u) => (
                <tr key={`${u.dbName}_${u.tableName}_${u.indexName}`} className={`hover:bg-slate-50/80 transition-colors ${u.isUnused ? 'bg-rose-50/30' : ''}`}>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{u.tableName}</td>
                  <td className="py-3 px-3 font-mono text-slate-700">{u.indexName}</td>
                  <td className="py-3 px-3 text-slate-600 font-medium">{u.indexType}</td>
                  <td className="py-3 px-3 font-mono text-slate-700">{u.userSeeks.toLocaleString()}</td>
                  <td className="py-3 px-3 font-mono text-slate-700">{u.userScans.toLocaleString()}</td>
                  <td className="py-3 px-3 font-mono text-slate-700 font-semibold">{u.userUpdates.toLocaleString()}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{u.readToWriteRatio}</td>
                  <td className="py-3 px-4 text-right">
                    {u.isUnused ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                        NÃO UTILIZADO (DROP CANDIDATE)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                        ATIVO & EFICIENTE
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
