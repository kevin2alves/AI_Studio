import React, { useState } from 'react';
import { 
  Archive, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  FileText, 
  Copy, 
  Check, 
  Download,
  HardDrive
} from 'lucide-react';
import { FullMetricsPayload } from '../types';

interface BackupsTabProps {
  metrics: FullMetricsPayload;
}

export const BackupsTab: React.FC<BackupsTabProps> = ({ metrics }) => {
  const [copiedDb, setCopiedDb] = useState<string | null>(null);
  const [selectedDbName, setSelectedDbName] = useState<string>(metrics.databases[0]?.name || 'ERP_Production');

  const handleCopyScript = (dbName: string, script: string) => {
    navigator.clipboard.writeText(script);
    setCopiedDb(dbName);
    setTimeout(() => setCopiedDb(null), 2000);
  };

  const getTsqlBackupScript = (dbName: string) => {
    return `-- Backup Completo com Compressão e Validação de Checksum
BACKUP DATABASE [${dbName}]
TO DISK = N'B:\\Backups_NFS\\${dbName}_FULL_' + REPLACE(CONVERT(VARCHAR(10), GETDATE(), 120), '-', '') + '.bak'
WITH 
  CHECKSUM,
  COMPRESSION,
  STATS = 5,
  INIT,
  NAME = N'Full Backup of ${dbName}';
GO

-- Backup de Log de Transações (se Recovery Model = FULL)
BACKUP LOG [${dbName}]
TO DISK = N'B:\\Backups_NFS\\${dbName}_LOG_' + REPLACE(CONVERT(VARCHAR(10), GETDATE(), 120), '-', '') + '_' + REPLACE(CONVERT(VARCHAR(8), GETDATE(), 108), ':', '') + '.trn'
WITH 
  COMPRESSION,
  STATS = 10;
GO`;
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Backup Compliance & SLA Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Archive className="w-4 h-4 text-blue-600" />
              <span>Conformidade de Backups & SLAs por Base de Dados (msdb.dbo.backupset)</span>
            </h3>
            <p className="text-xs text-slate-500">Monitoramento do último backup Completo (Full), Diferencial e de Log</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-3 px-4">Base de Dados</th>
                <th className="py-3 px-3">Recovery Model</th>
                <th className="py-3 px-3">Último FULL Backup</th>
                <th className="py-3 px-3">Último DIFF Backup</th>
                <th className="py-3 px-3">Último LOG Backup</th>
                <th className="py-3 px-3">SLA Status</th>
                <th className="py-3 px-4 text-right">Ação T-SQL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {metrics.databases.map((db) => {
                const isCritical = db.backupHealth === 'critical';
                const isWarning = db.backupHealth === 'warning';

                return (
                  <tr key={db.name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                      {db.name}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        db.recoveryModel === 'FULL' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {db.recoveryModel}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {db.lastFullBackup ? (
                        <span>{db.lastFullBackup}</span>
                      ) : (
                        <span className="text-rose-600 font-bold">NENHUM BACKUP</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {db.lastDiffBackup || '-'}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {db.lastLogBackup || (db.recoveryModel === 'SIMPLE' ? 'N/A (Simple)' : <span className="text-rose-600 font-bold">AUSENTE</span>)}
                    </td>
                    <td className="py-3 px-3">
                      {isCritical ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                          Crítico (&gt; 7 dias)
                        </span>
                      ) : isWarning ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Atrasado (&gt; 24h)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Conforme SLA
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedDbName(db.name)}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors"
                      >
                        Gerar Script
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Generated T-SQL Script for Selected Database */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Script de Backup Otimizado (Native Compression) - [{selectedDbName}]</span>
            </h4>
            <p className="text-xs text-slate-500">Geração de script de backup em conformidade com as melhores práticas da Microsoft</p>
          </div>
          <button
            onClick={() => handleCopyScript(selectedDbName, getTsqlBackupScript(selectedDbName))}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copiedDb === selectedDbName ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedDb === selectedDbName ? 'Copiado!' : 'Copiar Script'}</span>
          </button>
        </div>

        <div className="p-4 bg-slate-950 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed">
          <pre>{getTsqlBackupScript(selectedDbName)}</pre>
        </div>
      </div>

      {/* 3. Recent Backup Execution History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Histórico Recente de Execução de Backups (msdb.dbo.backupset)</span>
          </h3>
          <p className="text-xs text-slate-500">Taxa de compressão, duração e localização dos ficheiros de salvaguarda</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-3 px-4">Base de Dados</th>
                <th className="py-3 px-3">Tipo</th>
                <th className="py-3 px-3">Data / Hora Conclusão</th>
                <th className="py-3 px-3">Duração</th>
                <th className="py-3 px-3">Tamanho Real</th>
                <th className="py-3 px-3">Tamanho Comprimido</th>
                <th className="py-3 px-3">Taxa Compressão</th>
                <th className="py-3 px-4 text-right">Destino em Disco</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {metrics.backupHistory.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {b.databaseName}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800">
                      {b.type}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {b.backupFinishDate}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-800 font-semibold">
                    {b.durationSec}s
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {(b.backupSizeMB / 1024).toFixed(1)} GB
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                    {(b.compressedSizeMB / 1024).toFixed(1)} GB
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-blue-700">
                    {b.compressionRatio.toFixed(2)}x
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-500 truncate max-w-xs" title={b.physicalDeviceName}>
                    {b.physicalDeviceName}
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
