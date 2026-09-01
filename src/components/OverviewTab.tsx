import React, { useState } from 'react';
import { 
  Cpu, 
  HardDrive, 
  Layers, 
  Activity, 
  Server, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Terminal, 
  Trash2,
  Eye,
  TrendingUp,
  Database,
  ShieldAlert,
  BarChart2
} from 'lucide-react';
import { FullMetricsPayload, SessionData } from '../types';
import { HealthAlerts } from './HealthAlerts';
import { SqlViewerModal } from './SqlViewerModal';

interface OverviewTabProps {
  metrics: FullMetricsPayload;
  onKillSession: (spid: number) => Promise<void>;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  metrics,
  onKillSession,
}) => {
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [filterText, setFilterText] = useState('');

  // Active / running sessions filter
  const activeSessions = metrics.sessions.filter((s) => {
    if (filterText) {
      const q = filterText.toLowerCase();
      return (
        s.spid.toString().includes(q) ||
        s.loginName.toLowerCase().includes(q) ||
        s.hostName.toLowerCase().includes(q) ||
        s.dbName.toLowerCase().includes(q) ||
        s.command.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const runningCount = metrics.sessions.filter((s) => s.status === 'running').length;
  const suspendedCount = metrics.sessions.filter((s) => s.status === 'suspended').length;
  const blockedCount = metrics.blocking.totalBlocked;

  // PLE Health calculation
  const pleStatus = metrics.memory.pageLifeExpectancySec > 1000 
    ? { label: 'Excelente', color: 'text-emerald-600', bg: 'bg-emerald-50' }
    : metrics.memory.pageLifeExpectancySec > 300
    ? { label: 'Adequado', color: 'text-blue-600', bg: 'bg-blue-50' }
    : { label: 'Crítico (Pressão)', color: 'text-rose-600', bg: 'bg-rose-50' };

  return (
    <div className="space-y-6">
      {/* Top Diagnostics & Health Alerts Banner */}
      <HealthAlerts alerts={metrics.alerts} />

      {/* 4 Core Enterprise KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: CPU Total & Process */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">CPU Total & Utilização</span>
              <div className={`p-2 rounded-lg ${metrics.cpu.totalUsagePct > 80 ? 'bg-rose-100 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">{metrics.cpu.totalUsagePct}%</span>
              <span className="text-xs text-slate-500 font-medium">
                (SQL: <strong className="text-slate-700">{metrics.cpu.sqlProcessUsagePct}%</strong>)
              </span>
            </div>
            {/* Visual Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden flex">
              <div 
                className="bg-blue-600 h-full transition-all duration-500" 
                style={{ width: `${metrics.cpu.sqlProcessUsagePct}%` }}
                title={`SQL Server: ${metrics.cpu.sqlProcessUsagePct}%`}
              />
              <div 
                className="bg-slate-400 h-full transition-all duration-500" 
                style={{ width: `${metrics.cpu.otherProcessesUsagePct}%` }}
                title={`Outros Processos: ${metrics.cpu.otherProcessesUsagePct}%`}
              />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Tasks em Execução: <strong className="text-slate-700">{metrics.cpu.runnableTasksCount}</strong></span>
            <span>Threads: <strong className="text-slate-700">{metrics.cpu.workerThreadsCount}</strong></span>
          </div>
        </div>

        {/* KPI 2: Total Memory & Usage */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Memória & PLE</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {Math.round(metrics.memory.sqlTotalMemoryMB / 1024)} <span className="text-sm font-normal text-slate-500">/ {Math.round(metrics.memory.totalPhysicalMemoryMB / 1024)} GB</span>
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-emerald-600 h-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (metrics.memory.sqlTotalMemoryMB / metrics.memory.totalPhysicalMemoryMB) * 100)}%` }}
              />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Buffer Hit: <strong className="text-emerald-700">{metrics.memory.bufferCacheHitRatioPct}%</strong></span>
            <span className={`font-semibold px-1.5 py-0.2 rounded text-[11px] ${pleStatus.bg} ${pleStatus.color}`}>
              PLE: {metrics.memory.pageLifeExpectancySec}s
            </span>
          </div>
        </div>

        {/* KPI 3: Disk Space & Consumption */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Armazenamento & Discos</span>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <HardDrive className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {metrics.disk.drives.reduce((acc, d) => acc + d.usedGB, 0).toLocaleString()} <span className="text-sm font-normal text-slate-500">GB Usados</span>
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Data: <strong className="text-slate-700">{metrics.disk.dataFilesTotalGB.toLocaleString()} GB</strong> • Logs: <strong className="text-slate-700">{metrics.disk.logFilesTotalGB.toLocaleString()} GB</strong>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>TempDB: <strong className="text-slate-700">{Math.round(metrics.disk.tempdb.totalMB / 1024)} GB</strong></span>
            <span>Volumes: <strong className="text-slate-700">{metrics.disk.drives.length} LUNs</strong></span>
          </div>
        </div>

        {/* KPI 4: Active & Blocked Sessions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sessões & Concorrência</span>
              <div className={`p-2 rounded-lg ${blockedCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-purple-50 text-purple-600'}`}>
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">{metrics.sessions.length}</span>
              <span className="text-xs text-slate-500 font-medium">Sessões Conectadas</span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {runningCount} Running
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                {suspendedCount} Suspended
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Bloqueios Ativos:</span>
            {blockedCount > 0 ? (
              <span className="font-bold text-rose-600 flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded">
                <Flame className="w-3.5 h-3.5" />
                {blockedCount} Bloqueada(s)
              </span>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Nenhum Bloqueio
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Middle Grid: Disk Volumes & TempDB Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Disk Volumes Status */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-blue-600" />
                <span>Espaço em Disco & Consumo dos Volumes (LUNs)</span>
              </h3>
              <p className="text-xs text-slate-500">Capacidade de armazenamento dos pontos de montagem do SQL Server</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              {metrics.disk.drives.length} Discos Monitorados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {metrics.disk.drives.map((d) => {
              const isHigh = d.usedPct >= 85;
              const isWarning = d.usedPct >= 75 && d.usedPct < 85;
              return (
                <div 
                  key={d.drive} 
                  className={`p-3.5 rounded-xl border transition-all ${
                    isHigh ? 'bg-rose-50/50 border-rose-200' : isWarning ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">{d.drive}</span>
                      <span className="text-xs text-slate-500 truncate max-w-[140px]">({d.label})</span>
                    </div>
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                      isHigh ? 'bg-rose-200 text-rose-900' : isWarning ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {d.usedPct}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHigh ? 'bg-rose-600' : isWarning ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${d.usedPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-mono">
                    <span>Livre: <strong className={isHigh ? 'text-rose-700' : 'text-slate-700'}>{d.freeGB.toLocaleString()} GB</strong></span>
                    <span>Total: {d.totalGB.toLocaleString()} GB</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TempDB Space Allocation Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-600" />
                <span>Alocação do TempDB</span>
              </h3>
              <span className="text-xs font-mono font-semibold text-slate-600">
                {Math.round(metrics.disk.tempdb.totalMB / 1024)} GB Total
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">Divisão de espaço interno de objetos temporários e version store</p>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">User Objects (#temp, @table):</span>
                  <span className="font-bold font-mono text-slate-800">{Math.round(metrics.disk.tempdb.userObjectsMB / 1024)} GB</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full"
                    style={{ width: `${(metrics.disk.tempdb.userObjectsMB / metrics.disk.tempdb.totalMB) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Internal Objects (Spills, Sorts, Hashes):</span>
                  <span className="font-bold font-mono text-slate-800">{Math.round(metrics.disk.internalObjectsMB / 1024)} GB</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full"
                    style={{ width: `${(metrics.disk.internalObjectsMB / metrics.disk.tempdb.totalMB) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">Version Store (RCSI / Snapshot):</span>
                  <span className="font-bold font-mono text-slate-800">{Math.round(metrics.disk.versionStoreMB / 1024)} GB</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-500 h-full"
                    style={{ width: `${(metrics.disk.versionStoreMB / metrics.disk.tempdb.totalMB) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-emerald-700 font-semibold">Espaço Livre Disponível:</span>
                  <span className="font-bold font-mono text-emerald-700">{Math.round(metrics.disk.tempdb.freeSpaceMB / 1024)} GB</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full"
                    style={{ width: `${(metrics.disk.tempdb.freeSpaceMB / metrics.disk.tempdb.totalMB) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Contenção em TempDB: <strong className="text-emerald-700 font-semibold">Baixa (PAGELATCH_UP 0ms)</strong>
          </div>
        </div>

      </div>

      {/* Main Table: Running & Suspended Sessions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Sessões Ativas & Requisições em Execução (sys.dm_exec_requests)</span>
            </h3>
            <p className="text-xs text-slate-500">Monitoramento detalhado com Hostname, Duração e Percentual de Execução</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Filtrar por SPID, Login, Host..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-3 px-4">SPID</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3">Hostname</th>
                <th className="py-3 px-3">Login / DB</th>
                <th className="py-3 px-3">Duração</th>
                <th className="py-3 px-4 min-w-[140px]">Execução (%)</th>
                <th className="py-3 px-3">CPU / Reads</th>
                <th className="py-3 px-3">Wait Type</th>
                <th className="py-3 px-3">Bloqueado Por</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {activeSessions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    Nenhuma sessão encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                activeSessions.map((session) => {
                  const isBlocked = session.blockedBySpid !== null;
                  const isSuspended = session.status === 'suspended';
                  const isRunning = session.status === 'running';

                  return (
                    <tr 
                      key={session.spid}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isBlocked ? 'bg-rose-50/40' : isSuspended ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* SPID */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        #{session.spid}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          isRunning
                            ? 'bg-emerald-100 text-emerald-800'
                            : isSuspended
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {session.status}
                        </span>
                      </td>

                      {/* Hostname */}
                      <td className="py-3 px-3 font-mono text-slate-700 font-medium">
                        {session.hostName || 'Localhost'}
                      </td>

                      {/* Login / DB */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{session.loginName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{session.dbName}</div>
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                        {(session.durationMs / 1000).toFixed(1)}s
                      </td>

                      {/* Execution Progress Bar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                session.executionPercent >= 100 
                                  ? 'bg-emerald-600' 
                                  : isBlocked 
                                  ? 'bg-rose-500' 
                                  : 'bg-blue-600'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, session.executionPercent))}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-[11px] text-slate-700 w-8 text-right">
                            {session.executionPercent}%
                          </span>
                        </div>
                      </td>

                      {/* CPU / Reads */}
                      <td className="py-3 px-3 text-[11px] font-mono text-slate-600">
                        <div>CPU: {session.cpuTimeMs}ms</div>
                        <div>Reads: {session.logicalReads.toLocaleString()}</div>
                      </td>

                      {/* Wait Type */}
                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] text-slate-700 block truncate max-w-[130px]" title={session.waitType}>
                          {session.waitType || 'None'}
                        </span>
                        {session.waitTimeMs > 0 && (
                          <span className="text-[10px] text-slate-500 font-mono">({session.waitTimeMs}ms)</span>
                        )}
                      </td>

                      {/* Blocked by */}
                      <td className="py-3 px-3">
                        {session.blockedBySpid ? (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-[11px]">
                            <Flame className="w-3 h-3 text-rose-600" />
                            SPID #{session.blockedBySpid}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedSession(session)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors"
                            title="Ver SQL Text da Sessão"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedSession(session)}
                            className="p-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition-colors"
                            title="Terminar Sessão (KILL)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Mostrando {activeSessions.length} sessões ativas</span>
          <span>Atualizado às {metrics.lastUpdated}</span>
        </div>

      </div>

      {/* SQL Viewer Modal */}
      {selectedSession && (
        <SqlViewerModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onKillSession={onKillSession}
        />
      )}
    </div>
  );
};
