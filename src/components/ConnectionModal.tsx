import React, { useState } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Terminal, 
  HelpCircle,
  Play,
  ShieldCheck,
  Server
} from 'lucide-react';
import { ConnectionConfig } from '../types';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (config: ConnectionConfig, isDemo: boolean) => Promise<void>;
  currentConfig?: ConnectionConfig | null;
  isDemo: boolean;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  currentConfig,
  isDemo,
}) => {
  const [activeMode, setActiveMode] = useState<'form' | 'connectionString' | 'demo'>('form');
  const [server, setServer] = useState(currentConfig?.server || 'localhost');
  const [port, setPort] = useState(currentConfig?.port?.toString() || '1433');
  const [database, setDatabase] = useState(currentConfig?.database || 'master');
  const [user, setUser] = useState(currentConfig?.user || 'sa');
  const [password, setPassword] = useState(currentConfig?.password || '');
  const [trustCert, setTrustCert] = useState(currentConfig?.trustServerCertificate ?? true);
  const [encrypt, setEncrypt] = useState(currentConfig?.encrypt ?? false);
  const [rawConnString, setRawConnString] = useState(
    currentConfig?.rawConnectionString || 'Server=localhost,1433;Database=master;User Id=sa;Password=yourStrongPassword123#;TrustServerCertificate=True;'
  );

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const config: ConnectionConfig = activeMode === 'connectionString'
        ? {
            server: '',
            port: 1433,
            database: '',
            user: '',
            trustServerCertificate: true,
            encrypt: false,
            connectionTimeout: 15000,
            requestTimeout: 30000,
            rawConnectionString: rawConnString,
          }
        : {
            server,
            port: Number(port) || 1433,
            database,
            user,
            password,
            trustServerCertificate: trustCert,
            encrypt,
            connectionTimeout: 15000,
            requestTimeout: 30000,
          };

      const res = await fetch('/api/sql/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: `Conexão efetuada com sucesso! ${data.instance?.edition} (${data.instance?.logicalCpus} vCPUs)`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || 'Falha ao estabelecer conexão com SQL Server.',
          details: data.details,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Erro ao comunicar com o servidor backend.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleApply = async () => {
    if (activeMode === 'demo') {
      await onConnect(
        {
          server: 'PROD-SQL-NODE01',
          port: 1433,
          database: 'ERP_Production',
          user: 'sa',
          trustServerCertificate: true,
          encrypt: false,
          connectionTimeout: 15000,
          requestTimeout: 30000,
        },
        true
      );
      onClose();
      return;
    }

    const config: ConnectionConfig = activeMode === 'connectionString'
      ? {
          server: '',
          port: 1433,
          database: '',
          user: '',
          trustServerCertificate: true,
          encrypt: false,
          connectionTimeout: 15000,
          requestTimeout: 30000,
          rawConnectionString: rawConnString,
        }
      : {
          server,
          port: Number(port) || 1433,
          database,
          user,
          password,
          trustServerCertificate: trustCert,
          encrypt,
          connectionTimeout: 15000,
          requestTimeout: 30000,
        };

    await onConnect(config, false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600 text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Configurar Conexão SQL Server</h2>
              <p className="text-xs text-slate-500">Conecte a uma instância real ou use o simulador de alta fidelidade</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 flex gap-2">
          <button
            type="button"
            onClick={() => { setActiveMode('form'); setTestResult(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMode === 'form'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Parâmetros Individuais
          </button>
          <button
            type="button"
            onClick={() => { setActiveMode('connectionString'); setTestResult(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMode === 'connectionString'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Connection String (ADO.NET)
          </button>
          <button
            type="button"
            onClick={() => { setActiveMode('demo'); setTestResult(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMode === 'demo'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Simulador de Demonstração
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeMode === 'form' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Servidor / Hostname / IP
                  </label>
                  <input
                    id="inputServer"
                    type="text"
                    value={server}
                    onChange={(e) => setServer(e.target.value)}
                    placeholder="ex: sql.empresa.com, 10.0.0.4 ou localhost"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Porta
                  </label>
                  <input
                    id="inputPort"
                    type="text"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="1433"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Base de Dados Padrão
                  </label>
                  <input
                    id="inputDatabase"
                    type="text"
                    value={database}
                    onChange={(e) => setDatabase(e.target.value)}
                    placeholder="master ou ERP_Production"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Utilizador SQL (Login)
                  </label>
                  <input
                    id="inputUser"
                    type="text"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    placeholder="sa ou sql_monitor"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Palavra-passe
                </label>
                <input
                  id="inputPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={trustCert}
                    onChange={(e) => setTrustCert(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>TrustServerCertificate (Ignorar SSL Autoassinado)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={encrypt}
                    onChange={(e) => setEncrypt(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Encrypt (SSL/TLS Obrigatório)</span>
                </label>
              </div>
            </div>
          )}

          {activeMode === 'connectionString' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Connection String Completa (formato ADO.NET / OLEDB / ODBC)
              </label>
              <textarea
                id="inputRawConnString"
                value={rawConnString}
                onChange={(e) => setRawConnString(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono leading-relaxed"
                placeholder="Server=myServerAddress,1433;Database=myDataBase;User Id=myUsername;Password=myPassword;TrustServerCertificate=True;"
              />
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                Dica: O backend extrairá automaticamente os parâmetros de conexão para invocar as DMVs de diagnóstico.
              </p>
            </div>
          )}

          {activeMode === 'demo' && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                <Server className="w-4 h-4" />
                <span>Modo Demonstração Enterprise Ativado</span>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                Este modo carrega uma instância SQL Server 2022 corporativa com 5 bases de dados, telemetria em tempo real com oscilações de CPU, árvores de bloqueio ativas (SPID 84 bloqueando 2 sessões), histórico de deadlocks, análise de fragmentação de índices e simulação contínua.
              </p>
            </div>
          )}

          {/* Test connection results banner */}
          {testResult && (
            <div className={`p-3 rounded-lg border text-xs ${
              testResult.success 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="font-semibold">{testResult.message}</p>
                  {testResult.details && (
                    <p className="mt-1 font-mono text-slate-600 text-[11px] break-all">{testResult.details}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {activeMode !== 'demo' && (
              <button
                id="btnTestConnection"
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{isTesting ? 'Testando Conexão...' : 'Testar Conexão'}</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200/60 text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btnSaveAndConnect"
              type="button"
              onClick={handleApply}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{activeMode === 'demo' ? 'Carregar Simulador' : 'Salvar & Conectar'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
