import React, { useState } from 'react';
import { 
  Layers, 
  Flame, 
  ShieldAlert, 
  Terminal, 
  Trash2, 
  Eye, 
  ArrowRight, 
  Clock, 
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileCode
} from 'lucide-react';
import { FullMetricsPayload, SessionData, DeadlockEvent } from '../types';
import { SqlViewerModal } from './SqlViewerModal';
import { DeadlockViewerModal } from './DeadlockViewerModal';

interface SessionsTabProps {
  metrics: FullMetricsPayload;
  onKillSession: (spid: number) => Promise<void>;
}

export const SessionsTab: React.FC<SessionsTabProps> = ({
  metrics,
  onKillSession,
}) => {
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [selectedDeadlock, setSelectedDeadlock] = useState<DeadlockEvent | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'running' | 'suspended' | 'sleeping'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered session list
  const filteredSessions = metrics.sessions.filter((s) => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.spid.toString().includes(q) ||
        s.loginName.toLowerCase().includes(q) ||
        s.hostName.toLowerCase().includes(q) ||
        s.dbName.toLowerCase().includes(q) ||
        s.command.toLowerCase().includes(q) ||
        s.sqlText.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Blocking Hierarchy & Chain Analysis Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-600" />
                <span>Árvore de Bloqueios em Tempo Real (Blocking Chain)</span>
              </h3>
              {metrics.blocking.totalBlocked > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 animate-pulse">
                  {metrics.blocking.totalBlocked} Sessão(ões) Bloqueada(s)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                  Nenhum Bloqueio Detectado
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Identificação do nó raiz (Lead Blocker) e sessões em fila de espera (sys.dm_exec_requests)
            </p>
          </div>
        </div>

        {metrics.blocking.trees.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800">Sem Contenção de Locks Ativa</p>
            <p className="text-xs text-slate-500 mt-1">Todas as transações do SQL Server estão fluindo sem bloqueios encadeados.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {metrics.blocking.trees.map((tree) => (
              <div key={tree.rootSpid} className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 space-y-3">
                {/* Root Blocker Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-white rounded-lg border border-rose-200 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-600 text-white rounded-lg font-mono font-bold text-xs shrink-0">
                      SPID #{tree.rootSpid}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">BLOQUEADOR RAIZ (LEAD BLOCKER)</span>
                        <span className="text-xs text-slate-500 font-mono">DB: {tree.rootDb}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Login: <strong className="text-slate-800">{tree.rootLogin}</strong> • Host: <strong className="text-slate-800">{tree.rootHost}</strong>
                      </div>
                      <div className="font-mono text-[11px] text-slate-700 bg-slate-100 p-1.5 rounded mt-2 max-w-xl truncate">
                        {tree.rootSql}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onKillSession(tree.rootSpid)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>KILL SPID #{tree.rootSpid}</span>
                    </button>
                  </div>
                </div>

                {/* Blocked Sessions Child List */}
                <div className="pl-6 border-l-2 border-rose-300 space-y-2">
                  <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                    Sessões Dependentes Bloqueadas ({tree.blockedSessions.length}):
                  </span>
                  {tree.blockedSessions.map((child) => (
                    <div 
                      key={child.spid}
                      className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-rose-500 shrink-0" />
                        <span className="font-mono font-bold text-slate-900">SPID #{child.spid}</span>
                        <span className="text-slate-500">({child.loginName} @ {child.hostName})</span>
                        <span className="px-2 py-0.2 rounded font-mono font-semibold bg-amber-100 text-amber-800 text-[11px]">
                          {child.waitType}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600 font-mono">
                        <span>Tempo de Espera: <strong className="text-rose-700">{(child.waitTimeMs / 1000).toFixed(1)}s</strong></span>
                        <button
                          onClick={() => {
                            const fullSess = metrics.sessions.find(s => s.spid === child.spid);
                            if (fullSess) setSelectedSession(fullSess);
                          }}
                          className="p-1 rounded hover:bg-slate-100 text-slate-700"
                          title="Ver Detalhes"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Deadlock Analysis Center */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Histórico de Deadlocks (Extended Events system_health)</span>
            </h3>
            <p className="text-xs text-slate-500">Eventos de impasse capturados com processo vítima e recursos em disputa</p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
            {metrics.deadlocks.length} Ocorrências Recentes
          </span>
        </div>

        {metrics.deadlocks.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
            Nenhum evento de deadlock registrado nas últimas 24 horas.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.deadlocks.map((dl) => (
              <div 
                key={dl.id} 
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-900 font-mono">{dl.id}</span>
                    <span className="text-[11px] text-slate-500">{dl.timestamp}</span>
                  </div>
                  <div className="text-xs space-y-1 mb-3">
                    <div>Tipo de Bloqueio: <strong className="text-slate-800">{dl.lockType}</strong></div>
                    <div>Vítima Eleita: <strong className="text-rose-700 font-mono">SPID #{dl.victimSpid}</strong></div>
                    <div className="text-slate-500 text-[11px] truncate">Recurso: {dl.resourceName}</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() => setSelectedDeadlock(dl)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <FileCode className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ver Grafo do Deadlock & XML</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Full Sessions Master Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Table Filters */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Filtrar Estado:</span>
            <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
              {(['ALL', 'running', 'suspended', 'sleeping'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setStatusFilter(mode)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    statusFilter === mode
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar por Login, Host, DB, SQL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-3 px-4">SPID</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3">Hostname</th>
                <th className="py-3 px-3">Login / DB</th>
                <th className="py-3 px-3">Duração</th>
                <th className="py-3 px-4 min-w-[120px]">Execução (%)</th>
                <th className="py-3 px-3">CPU (ms)</th>
                <th className="py-3 px-3">Logical Reads</th>
                <th className="py-3 px-3">Wait Type</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSessions.map((session) => (
                <tr key={session.spid} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    #{session.spid}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                      session.status === 'running'
                        ? 'bg-emerald-100 text-emerald-800'
                        : session.status === 'suspended'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700 font-medium">
                    {session.hostName || 'Localhost'}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{session.loginName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{session.dbName}</div>
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                    {(session.durationMs / 1000).toFixed(1)}s
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${session.executionPercent}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-[11px] text-slate-700">
                        {session.executionPercent}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {session.cpuTimeMs.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {session.logicalReads.toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-[11px] text-slate-700 block truncate max-w-[130px]" title={session.waitType}>
                      {session.waitType || 'None'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedSession(session)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors"
                        title="Ver SQL"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedSession(session)}
                        className="p-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition-colors"
                        title="KILL SPID"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modals */}
      {selectedSession && (
        <SqlViewerModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onKillSession={onKillSession}
        />
      )}

      {selectedDeadlock && (
        <DeadlockViewerModal
          deadlock={selectedDeadlock}
          onClose={() => setSelectedDeadlock(null)}
        />
      )}

    </div>
  );
};
