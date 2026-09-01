import React, { useState } from 'react';
import { X, Copy, Check, ShieldAlert, GitCommit, FileCode, Users, Lock } from 'lucide-react';
import { DeadlockEvent } from '../types';

interface DeadlockViewerModalProps {
  deadlock: DeadlockEvent | null;
  onClose: () => void;
}

export const DeadlockViewerModal: React.FC<DeadlockViewerModalProps> = ({
  deadlock,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [showXml, setShowXml] = useState(false);

  if (!deadlock) return null;

  const handleCopyXml = () => {
    navigator.clipboard.writeText(deadlock.xmlReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-600 text-white">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-rose-950">
                  Relatório de Deadlock - {deadlock.id}
                </h3>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-200 text-rose-900">
                  Vítima: SPID #{deadlock.victimSpid}
                </span>
              </div>
              <p className="text-xs text-rose-700 mt-0.5">
                Ocorrência: <span className="font-semibold">{deadlock.timestamp}</span> • Conflito de Bloqueio Recíproco
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation / Toggle */}
        <div className="px-6 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowXml(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                !showXml ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-blue-600" />
              <span>Processos & Recursos em Conflito</span>
            </button>
            <button
              onClick={() => setShowXml(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showXml ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-4 h-4 text-emerald-600" />
              <span>XML do Deadlock Graph (XEvents)</span>
            </button>
          </div>

          <button
            onClick={handleCopyXml}
            className="px-3 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar XML'}</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!showXml ? (
            <>
              {/* Conflict Resource Callout */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>Recurso Bloqueado em Disputa:</span>
                </div>
                <div className="font-mono text-xs bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800 break-all">
                  {deadlock.resourceName}
                </div>
              </div>

              {/* Side by side processes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deadlock.processes.map((proc) => (
                  <div
                    key={proc.spid}
                    className={`rounded-xl border p-4 flex flex-col justify-between ${
                      proc.isVictim 
                        ? 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-300' 
                        : 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            SPID #{proc.spid}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">({proc.hostname})</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          proc.isVictim 
                            ? 'bg-rose-600 text-white' 
                            : 'bg-emerald-600 text-white'
                        }`}>
                          {proc.isVictim ? 'VÍTIMA (CANCELADO)' : 'VENCEDOR (COMMIT)'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1 mb-3">
                        <div>Login: <span className="font-semibold text-slate-800">{proc.login}</span></div>
                        <div>Base de Dados: <span className="font-semibold text-slate-800">{proc.database}</span></div>
                        <div>Lock Mode: <span className="font-semibold text-slate-800">{proc.lockMode}</span></div>
                      </div>

                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                        Instrução Executada no Momento:
                      </label>
                      <div className="p-2.5 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono whitespace-pre-wrap break-words">
                        {proc.executionText}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resolution Guide */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                <p className="font-bold">Recomendação de Mitigação de Deadlock:</p>
                <p className="text-blue-800 leading-relaxed">
                  Para prevenir este deadlock, padronize a ordem de acesso às tabelas e chaves primárias em todas as transações, mantenha as transações o mais curtas possível e adicione índices de suporte para evitar escalonamento de bloqueios.
                </p>
              </div>
            </>
          ) : (
            <div className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed">
              <pre>{deadlock.xmlReport}</pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
