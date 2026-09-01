import React, { useState } from 'react';
import { 
  Database, 
  TrendingUp, 
  Table as TableIcon, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  HardDrive,
  BarChart2,
  PieChart
} from 'lucide-react';
import { FullMetricsPayload, DatabaseOverview } from '../types';

interface DatabasesTabProps {
  metrics: FullMetricsPayload;
}

export const DatabasesTab: React.FC<DatabasesTabProps> = ({ metrics }) => {
  const [selectedDb, setSelectedDb] = useState<DatabaseOverview | null>(metrics.databases[0] || null);

  const totalInstanceSizeMB = metrics.databases.reduce((acc, db) => acc + db.totalSizeMB, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Total de Bases de Dados</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{metrics.databases.length}</div>
          <div className="text-xs text-slate-500 mt-1">
            Online: <strong className="text-emerald-600">{metrics.databases.filter(d => d.state === 'ONLINE').length}</strong> • Restoring: <strong>0</strong>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Armazenamento Total das Bases</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
            {(totalInstanceSizeMB / 1024 / 1024).toFixed(2)} <span className="text-sm font-normal text-slate-500">TB</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Dados: <strong>{(metrics.disk.dataFilesTotalGB / 1024).toFixed(2)} TB</strong> • Logs: <strong>{(metrics.disk.logFilesTotalGB / 1024).toFixed(2)} TB</strong>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Alertas de Autogrowth (%)</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1 font-mono">
            {metrics.databases.filter(d => d.autogrowthRisk !== 'Safe').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Bases com risco de fragmentação ou timeout
          </div>
        </div>
      </div>

      {/* Databases Master Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <span>Bases de Dados & Configuração de Armazenamento (sys.databases)</span>
            </h3>
            <p className="text-xs text-slate-500">Recovery Model, Log Reuse Wait, Tamanho dos Ficheiros MDF/LDF e Autogrowth</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-3 px-4">Nome da Base</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3">Recovery Model</th>
                <th className="py-3 px-3">Log Reuse Wait</th>
                <th className="py-3 px-3">Tamanho Total</th>
                <th className="py-3 px-3">Dados (MDF)</th>
                <th className="py-3 px-3">Log (LDF)</th>
                <th className="py-3 px-4 min-w-[130px]">Uso do Log (%)</th>
                <th className="py-3 px-3">Autogrowth</th>
                <th className="py-3 px-4 text-right">Tabelas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {metrics.databases.map((db) => {
                const isSelected = selectedDb?.name === db.name;
                const isLogCritical = db.logSpaceUsedPct >= 85;

                return (
                  <tr 
                    key={db.name} 
                    onClick={() => setSelectedDb(db)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/80 font-medium' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <Database className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span>{db.name}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                        {db.state}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${
                        db.recoveryModel === 'FULL' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {db.recoveryModel}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      {db.logReuseWaitDesc}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {(db.totalSizeMB / 1024).toFixed(1)} GB
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {(db.dataSizeMB / 1024).toFixed(1)} GB
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {(db.logSizeMB / 1024).toFixed(1)} GB
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              isLogCritical ? 'bg-rose-600' : 'bg-blue-600'
                            }`}
                            style={{ width: `${db.logSpaceUsedPct}%` }}
                          />
                        </div>
                        <span className={`font-mono font-bold text-[11px] ${isLogCritical ? 'text-rose-700' : 'text-slate-700'}`}>
                          {db.logSpaceUsedPct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        db.autogrowthRisk === 'Safe' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : db.autogrowthRisk === 'Warning' 
                          ? 'bg-amber-50 text-amber-800' 
                          : 'bg-rose-50 text-rose-800'
                      }`}>
                        {db.growthSetting}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 font-semibold">
                      {db.tableCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Database Growth & Historical Footprint */}
      {selectedDb && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Historical Growth Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Histórico de Crescimento (Growth Trend) - [{selectedDb.name}]</span>
                </h4>
                <p className="text-xs text-slate-500">Evolução do volume total de dados e logs nos últimos 30 dias</p>
              </div>
            </div>

            <div className="space-y-3">
              {selectedDb.growthHistory.map((point) => (
                <div key={point.date} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 w-16">{point.date}:</span>
                  <div className="flex-1 mx-3 bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(point.sizeMB / selectedDb.totalSizeMB) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono font-bold text-slate-900 w-24 text-right">
                    {(point.sizeMB / 1024).toFixed(1)} GB
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
              <span>Taxa de Crescimento Médio: <strong className="text-slate-800">~15.4 GB / semana</strong></span>
              <span>Projeção 90 dias: <strong className="text-slate-800">{((selectedDb.totalSizeMB * 1.15) / 1024).toFixed(1)} GB</strong></span>
            </div>
          </div>

          {/* Autogrowth Best Practices Recommendation */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Auditoria de Autocrescimento (Autogrowth Settings)</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Configurações baseadas em percentagem (como 10%) causam ficheiros desproporcionais e contenção de I/O em discos grandes. É altamente recomendado definir o crescimento em <strong>Megabytes fixos</strong> (ex: 512MB ou 1024MB para dados e 256MB para log).
              </p>
            </div>

            <div className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono">
              <pre className="whitespace-pre-wrap">
{`-- Script T-SQL para corrigir Autogrowth da Base [${selectedDb.name}]:
ALTER DATABASE [${selectedDb.name}] 
MODIFY FILE (NAME = N'${selectedDb.name}', FILEGROWTH = 1024MB);

ALTER DATABASE [${selectedDb.name}] 
MODIFY FILE (NAME = N'${selectedDb.name}_log', FILEGROWTH = 512MB);`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Top Tables Storage Footprint */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-blue-600" />
            <span>Top Tabelas por Consumo de Espaço e Linhas (sys.allocation_units)</span>
          </h3>
          <p className="text-xs text-slate-500">Distribuição entre espaço de dados (Heap/Clustered) e índices secundários</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-3 px-4">Tabela</th>
                <th className="py-3 px-3">Base de Dados</th>
                <th className="py-3 px-3">Número de Linhas</th>
                <th className="py-3 px-3">Espaço Total</th>
                <th className="py-3 px-3">Espaço Dados (MDF)</th>
                <th className="py-3 px-3">Espaço Índices</th>
                <th className="py-3 px-4 text-right">Espaço Não Utilizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {metrics.topTables.map((tbl) => (
                <tr key={`${tbl.dbName}_${tbl.tableName}`} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {tbl.schemaName}.{tbl.tableName}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">{tbl.dbName}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">
                    {tbl.rowCount.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-blue-600">
                    {(tbl.totalSpaceMB / 1024).toFixed(1)} GB
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {(tbl.dataSpaceMB / 1024).toFixed(1)} GB
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {(tbl.indexSpaceMB / 1024).toFixed(1)} GB
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500">
                    {tbl.unusedSpaceMB.toLocaleString()} MB
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
