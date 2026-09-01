import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Play, AlertOctagon } from 'lucide-react';
import { SessionData } from '../types';

interface SqlViewerModalProps {
  session: SessionData | null;
  onClose: () => void;
  onKillSession: (spid: number) => Promise<void>;
}

export const SqlViewerModal: React.FC<SqlViewerModalProps> = ({
  session,
  onClose,
  onKillSession,
}) => {
  const [copied, setCopied] = useState(false);
  const [isKilling, setIsKilling] = useState(false);
  const [confirmKill, setConfirmKill] = useState(false);

  if (!session) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(session.sqlText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKill = async () => {
    setIsKilling(true);
    try {
      await onKillSession(session.spid);
      onClose();
    } finally {
      setIsKilling(false);
      setConfirmKill(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-800 text-white">
              <Terminal className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Instrução SQL - SPID #{session.spid}
                </h3>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                  session.status === 'running' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : session.status === 'suspended'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {session.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Login: <span className="font-semibold text-slate-700">{session.loginName}</span> • Host: <span className="font-semibold text-slate-700">{session.hostName}</span> • DB: <span className="font-semibold text-slate-700">{session.dbName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-6 py-3 bg-slate-100/70 border-b border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block">Duração Total:</span>
            <span className="font-bold text-slate-900 font-mono">{(session.durationMs / 1000).toFixed(1)}s</span>
          </div>
          <div>
            <span className="text-slate-500 block">CPU Utilizado:</span>
            <span className="font-bold text-slate-900 font-mono">{session.cpuTimeMs} ms</span>
          </div>
          <div>
            <span className="text-slate-500 block">Logical Reads:</span>
            <span className="font-bold text-slate-900 font-mono">{session.logicalReads.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Wait Type / Time:</span>
            <span className="font-bold text-slate-900 font-mono">{session.waitType || 'None'} ({session.waitTimeMs}ms)</span>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed select-text">
          <pre className="whitespace-pre-wrap break-words">{session.sqlText || '-- Nenhuma instrução SQL ativa retornada pelo buffer do SQL Server.'}</pre>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar SQL'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {confirmKill ? (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg">
                <span className="text-xs font-bold text-rose-800">Confirmar KILL {session.spid}?</span>
                <button
                  onClick={handleKill}
                  disabled={isKilling}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded transition-colors disabled:opacity-50"
                >
                  {isKilling ? 'Executando...' : 'Sim, Terminar'}
                </button>
                <button
                  onClick={() => setConfirmKill(false)}
                  className="px-2 py-1 text-slate-600 hover:text-slate-900 text-xs font-semibold"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmKill(true)}
                className="px-3 py-1.5 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>KILL SPID #{session.spid}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
