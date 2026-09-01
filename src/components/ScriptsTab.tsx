import React, { useState } from 'react';
import { 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  Server, 
  Cpu, 
  Activity, 
  HardDrive, 
  Layers, 
  ShieldAlert, 
  SlidersHorizontal,
  Archive
} from 'lucide-react';

interface ScriptItem {
  id: string;
  category: string;
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
  sql: string;
}

const DBA_SCRIPTS: ScriptItem[] = [
  {
    id: 'cpu-analysis',
    category: 'CPU & Processamento',
    icon: Cpu,
    title: 'Utilização de CPU via Ring Buffers & Top Queries Consumidoras',
    description: 'Extrai o histórico recente de CPU do SQL Server vs Sistema Operacional e lista as 10 queries com maior tempo de CPU acumulado.',
    sql: `-- 1. Histórico de CPU do SQL Server vs Sistema Operacional (sys.dm_os_ring_buffers)
DECLARE @ts_now BIGINT = (SELECT cpu_ticks/(cpu_ticks/ms_ticks) FROM sys.dm_os_sys_info);

SELECT TOP(20)
  DATEADD(ms, -1 * (@ts_now - [timestamp]), GETDATE()) AS EventTime,
  SQLProcessUtilization AS [SQL_Server_CPU_%],
  SystemIdle AS [Idle_CPU_%],
  100 - SystemIdle - SQLProcessUtilization AS [Other_Process_CPU_%]
FROM (
  SELECT record.value('(./Record/@id)[1]', 'int') AS record_id,
         record.value('(./Record/SchedulerMonitorEvent/SystemHealth/SystemIdle)[1]', 'int') AS SystemIdle,
         record.value('(./Record/SchedulerMonitorEvent/SystemHealth/ProcessUtilization)[1]', 'int') AS SQLProcessUtilization,
         [timestamp]
  FROM (
    SELECT [timestamp], convert(xml, record) AS [record]
    FROM sys.dm_os_ring_buffers
    WHERE ring_buffer_type = N'RING_BUFFER_SCHEDULER_MONITOR'
      AND record LIKE N'%<SystemHealth>%'
  ) AS x
) AS y
ORDER BY record_id DESC;

-- 2. Top 10 Consultas com Maior Consumo de CPU
SELECT TOP (10)
    qs.total_worker_time / 1000 AS [Total_CPU_ms],
    qs.execution_count AS [Exec_Count],
    (qs.total_worker_time / qs.execution_count) / 1000 AS [Avg_CPU_ms],
    qs.total_elapsed_time / 1000 AS [Total_Duration_ms],
    SUBSTRING(st.text, (qs.statement_start_offset/2)+1,
        (((CASE qs.statement_end_offset
            WHEN -1 THEN DATALENGTH(st.text)
            ELSE qs.statement_end_offset
        END) - qs.statement_start_offset)/2) + 1) AS [Query_Text]
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
ORDER BY qs.total_worker_time DESC;`,
  },
  {
    id: 'memory-analysis',
    category: 'Memória & Buffer Pool',
    icon: Activity,
    title: 'Page Life Expectancy (PLE), Buffer Cache Hit Ratio & Memory Clerks',
    description: 'Diagnostica a saúde da memória RAM, pressão do buffer pool e os 10 maiores consumidores de memória no SQL Server.',
    sql: `-- 1. Indicadores Principais de Memória (PLE & Buffer Cache Hit Ratio)
SELECT 
    object_name,
    counter_name,
    cntr_value,
    CASE 
        WHEN counter_name = 'Page life expectancy' AND cntr_value < 300 THEN 'CRÍTICO: Pressão de Memória no Buffer Pool'
        WHEN counter_name = 'Page life expectancy' AND cntr_value >= 300 THEN 'SAUDÁVEL: Tempo de Retenção Adequado'
        ELSE ''
    END AS [Diagnostico]
FROM sys.dm_os_performance_counters
WHERE (counter_name IN ('Page life expectancy', 'Target Server Memory (KB)', 'Total Server Memory (KB)', 'Memory Grants Pending')
       AND (instance_name LIKE '%Buffer Node%' OR instance_name = ''))
   OR (counter_name = 'Buffer cache hit ratio' AND object_name LIKE '%Buffer Manager%');

-- 2. Top Consumidores de Memória (Memory Clerks)
SELECT TOP (10)
    type AS [Memory_Clerk_Type],
    SUM(pages_kb) / 1024 AS [Size_MB],
    CAST((SUM(pages_kb) * 1.0 / (SELECT SUM(pages_kb) FROM sys.dm_os_memory_clerks)) * 100 AS DECIMAL(5,2)) AS [Pct_Of_Total]
FROM sys.dm_os_memory_clerks
GROUP BY type
ORDER BY [Size_MB] DESC;`,
  },
  {
    id: 'disks-io',
    category: 'Armazenamento & Discos',
    icon: HardDrive,
    title: 'Latência de I/O por Ficheiro de Base de Dados (Stall Time)',
    description: 'Mede a latência média de leitura e escrita em milissegundos para cada ficheiro .mdf e .ldf do subsistema de armazenamento.',
    sql: `-- Latência de I/O por Ficheiro de Base de Dados (sys.dm_io_virtual_file_stats)
SELECT 
    DB_NAME(vfs.database_id) AS [Database_Name],
    mf.name AS [Logical_File_Name],
    mf.type_desc AS [File_Type],
    mf.physical_name AS [Physical_Path],
    vfs.num_of_reads AS [Num_Reads],
    vfs.num_of_writes AS [Num_Writes],
    CAST(vfs.io_stall_read_ms / (CASE WHEN vfs.num_of_reads = 0 THEN 1 ELSE vfs.num_of_reads END) AS DECIMAL(10,2)) AS [Avg_Read_Latency_ms],
    CAST(vfs.io_stall_write_ms / (CASE WHEN vfs.num_of_writes = 0 THEN 1 ELSE vfs.num_of_writes END) AS DECIMAL(10,2)) AS [Avg_Write_Latency_ms],
    CASE 
        WHEN (vfs.io_stall_read_ms / (CASE WHEN vfs.num_of_reads = 0 THEN 1 ELSE vfs.num_of_reads END)) > 20 THEN 'CRÍTICO: Gargalo de Leitura em Disco (>20ms)'
        WHEN (vfs.io_stall_write_ms / (CASE WHEN vfs.num_of_writes = 0 THEN 1 ELSE vfs.num_of_writes END)) > 10 THEN 'ALERTA: Gargalo de Escrita em Disco (>10ms)'
        ELSE 'SAUDÁVEL'
    END AS [Status_Disco]
FROM sys.dm_io_virtual_file_stats(NULL, NULL) vfs
JOIN sys.master_files mf ON vfs.database_id = mf.database_id AND vfs.file_id = mf.file_id
ORDER BY (vfs.io_stall_read_ms + vfs.io_stall_write_ms) DESC;`,
  },
  {
    id: 'sessions-blocking',
    category: 'Sessões & Bloqueios',
    icon: Layers,
    title: 'Sessões Ativas, Árvore de Bloqueios & Lead Blocker',
    description: 'Descobre instantaneamente qual sessão está gerando bloqueios em cadeia e qual instrução SQL está sendo executada.',
    sql: `-- Árvore de Bloqueios & Sessões Ativas (sys.dm_exec_requests)
SELECT 
    s.session_id AS [SPID],
    r.status AS [Request_Status],
    s.login_name AS [Login],
    s.host_name AS [Host_Name],
    DB_NAME(r.database_id) AS [Database],
    r.blocking_session_id AS [Blocked_By_SPID],
    r.wait_type AS [Wait_Type],
    r.wait_time AS [Wait_Time_ms],
    r.cpu_time AS [CPU_Time_ms],
    r.total_elapsed_time AS [Duration_ms],
    r.percent_complete AS [Progress_%],
    SUBSTRING(t.text, (r.statement_start_offset/2)+1,
        (((CASE r.statement_end_offset
            WHEN -1 THEN DATALENGTH(t.text)
            ELSE r.statement_end_offset
        END) - r.statement_start_offset)/2) + 1) AS [SQL_Text]
FROM sys.dm_exec_sessions s
LEFT JOIN sys.dm_exec_requests r ON s.session_id = r.session_id
OUTER APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE s.is_user_process = 1 AND (r.session_id IS NOT NULL OR s.session_id IN (SELECT blocking_session_id FROM sys.dm_exec_requests WHERE blocking_session_id <> 0))
ORDER BY r.blocking_session_id DESC, r.total_elapsed_time DESC;`,
  },
  {
    id: 'indexes-frag',
    category: 'Índices & Tuning',
    icon: SlidersHorizontal,
    title: 'Fragmentação de Índices e Geração Automática de REBUILD / REORGANIZE',
    description: 'Calcula o percentual de fragmentação física em todas as tabelas e produz comandos ALTER INDEX prontos para execução.',
    sql: `-- Análise de Fragmentação de Índices com Geração de Script
SELECT 
    DB_NAME() AS [Database_Name],
    OBJECT_SCHEMA_NAME(ips.object_id) AS [Schema],
    OBJECT_NAME(ips.object_id) AS [Table_Name],
    i.name AS [Index_Name],
    i.type_desc AS [Index_Type],
    CAST(ips.avg_fragmentation_in_percent AS DECIMAL(5,2)) AS [Fragmentation_%],
    ips.page_count AS [Page_Count],
    CASE 
        WHEN ips.avg_fragmentation_in_percent > 30 THEN 'ALTER INDEX [' + i.name + '] ON [' + OBJECT_SCHEMA_NAME(ips.object_id) + '].[' + OBJECT_NAME(ips.object_id) + '] REBUILD WITH (ONLINE = ON, SORT_IN_TEMPDB = ON);'
        WHEN ips.avg_fragmentation_in_percent >= 10 THEN 'ALTER INDEX [' + i.name + '] ON [' + OBJECT_SCHEMA_NAME(ips.object_id) + '].[' + OBJECT_NAME(ips.object_id) + '] REORGANIZE;'
        ELSE '-- Índice Saudável (<10%)'
    END AS [Comando_Manutencao_Recomendado]
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
WHERE ips.page_count > 100 AND i.name IS NOT NULL
ORDER BY ips.avg_fragmentation_in_percent DESC;`,
  },
  {
    id: 'backups-sla',
    category: 'Backups & SLA',
    icon: Archive,
    title: 'Auditoria de Backups e Conformidade de SLA',
    description: 'Valida a data do último backup Full, Diferencial e Log para todas as bases de dados e sinaliza riscos de perda de dados.',
    sql: `-- Auditoria de Conformidade de Backups (msdb.dbo.backupset)
SELECT 
    d.name AS [Database_Name],
    d.recovery_model_desc AS [Recovery_Model],
    d.log_reuse_wait_desc AS [Log_Reuse_Wait],
    MAX(CASE WHEN bs.type = 'D' THEN bs.backup_finish_date END) AS [Last_Full_Backup],
    MAX(CASE WHEN bs.type = 'I' THEN bs.backup_finish_date END) AS [Last_Diff_Backup],
    MAX(CASE WHEN bs.type = 'L' THEN bs.backup_finish_date END) AS [Last_Log_Backup],
    CASE 
        WHEN MAX(CASE WHEN bs.type = 'D' THEN bs.backup_finish_date END) IS NULL THEN 'CRÍTICO: Sem Backup Full'
        WHEN DATEDIFF(DAY, MAX(CASE WHEN bs.type = 'D' THEN bs.backup_finish_date END), GETDATE()) > 7 THEN 'CRÍTICO: Backup Full com mais de 7 dias'
        WHEN d.recovery_model_desc = 'FULL' AND (MAX(CASE WHEN bs.type = 'L' THEN bs.backup_finish_date END) IS NULL OR DATEDIFF(HOUR, MAX(CASE WHEN bs.type = 'L' THEN bs.backup_finish_date END), GETDATE()) > 2) THEN 'ALERTA: Log de Transações sem backup recente'
        ELSE 'CONFORME SLA'
    END AS [SLA_Status]
FROM sys.databases d
LEFT JOIN msdb.dbo.backupset bs ON d.name = bs.database_name
WHERE d.database_id > 0
GROUP BY d.name, d.recovery_model_desc, d.log_reuse_wait_desc
ORDER BY d.name;`,
  },
];

export const ScriptsTab: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadAll = () => {
    const fullScript = DBA_SCRIPTS.map(
      (s) => `/* =========================================================================
   ${s.title.toUpperCase()}
   ${s.description}
========================================================================= */
${s.sql}
GO

`
    ).join('\n');

    const dataStr = 'data:text/sql;charset=utf-8,' + encodeURIComponent(fullScript);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SQLServer_Performance_Diagnostic_Bundle_${new Date().toISOString().slice(0, 10)}.sql`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-blue-600" />
            <span>Biblioteca de Scripts T-SQL de Diagnóstico (DBA Diagnostic Toolkit)</span>
          </h3>
          <p className="text-xs text-slate-500">Coleção de consultas DMVs prontas para execução no SSMS, Azure Data Studio ou sqlcmd</p>
        </div>

        <button
          onClick={handleDownloadAll}
          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Baixar Pacote Completo (.sql)</span>
        </button>
      </div>

      {/* Script Cards */}
      <div className="space-y-4">
        {DBA_SCRIPTS.map((script) => {
          const Icon = script.icon;
          const isCopied = copiedId === script.id;

          return (
            <div key={script.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{script.title}</h4>
                    <p className="text-[11px] text-slate-500">{script.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(script.id, script.sql)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copiado!' : 'Copiar T-SQL'}</span>
                </button>
              </div>

              <div className="p-4 bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
                <pre>{script.sql}</pre>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
