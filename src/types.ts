export interface ConnectionConfig {
  server: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  trustServerCertificate: boolean;
  encrypt: boolean;
  connectionTimeout: number;
  requestTimeout: number;
  rawConnectionString?: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'demo';

export interface InstanceInfo {
  version: string;
  edition: string;
  level: string; // RTM, SP1, CU14 etc.
  instanceName: string;
  machineName: string;
  collation: string;
  totalMemoryGB: number;
  logicalCpus: number;
  uptimeHours: number;
  isClustered: boolean;
  isAlwaysOn: boolean;
}

export interface CPUData {
  totalUsagePct: number;
  sqlProcessUsagePct: number;
  otherProcessesUsagePct: number;
  systemIdlePct: number;
  workerThreadsCount: number;
  runnableTasksCount: number;
  pendingIoCount: number;
  schedulerYields: number;
  history: {
    timestamp: string;
    sqlPct: number;
    totalPct: number;
  }[];
}

export interface MemoryClerk {
  name: string;
  type: string;
  sizeMB: number;
  pctOfTotal: number;
  description: string;
}

export interface MemoryData {
  totalPhysicalMemoryMB: number;
  availablePhysicalMemoryMB: number;
  sqlTargetMemoryMB: number;
  sqlTotalMemoryMB: number;
  bufferCacheHitRatioPct: number;
  pageLifeExpectancySec: number;
  memoryGrantsPending: number;
  freeMemoryMB: number;
  grantedWorkspaceMemoryMB: number;
  clerks: MemoryClerk[];
}

export interface DiskDrive {
  drive: string;
  totalGB: number;
  freeGB: number;
  usedGB: number;
  usedPct: number;
  label: string;
  isSystemDrive: boolean;
}

export interface TempDbAllocation {
  totalMB: number;
  userObjectsMB: number;
  internalObjectsMB: number;
  versionStoreMB: number;
  freeSpaceMB: number;
}

export interface IoStallMetric {
  dbName: string;
  fileName: string;
  fileType: 'ROWS' | 'LOG';
  readStallMs: number;
  writeStallMs: number;
  avgReadLatencyMs: number;
  avgWriteLatencyMs: number;
  numReads: number;
  numWrites: number;
}

export interface DiskSpaceData {
  drives: DiskDrive[];
  dataFilesTotalGB: number;
  logFilesTotalGB: number;
  tempdb: TempDbAllocation;
  ioStalls: IoStallMetric[];
}

export interface SessionData {
  spid: number;
  status: 'running' | 'suspended' | 'runnable' | 'sleeping' | 'background';
  loginName: string;
  hostName: string;
  programName: string;
  dbName: string;
  cpuTimeMs: number;
  logicalReads: number;
  writes: number;
  durationMs: number;
  executionPercent: number;
  waitType: string;
  waitTimeMs: number;
  lastWaitType: string;
  command: string;
  sqlText: string;
  blockedBySpid: number | null;
  openTranCount: number;
  memoryUsageKB: number;
  transactionIsolationLevel: string;
  loginTime: string;
  lastRequestStart: string;
}

export interface BlockingTreeItem {
  rootSpid: number;
  rootLogin: string;
  rootHost: string;
  rootWaitType: string;
  rootWaitTimeMs: number;
  rootSql: string;
  rootDb: string;
  blockedCount: number;
  blockedSessions: {
    spid: number;
    loginName: string;
    hostName: string;
    waitType: string;
    waitTimeMs: number;
    durationMs: number;
    sqlText: string;
    blockedBySpid: number;
  }[];
}

export interface DeadlockProcess {
  spid: number;
  login: string;
  hostname: string;
  database: string;
  executionText: string;
  lockMode: string;
  waitResource: string;
  isVictim: boolean;
}

export interface DeadlockEvent {
  id: string;
  timestamp: string;
  victimSpid: number;
  victimSql: string;
  conflictSpid: number;
  conflictSql: string;
  lockType: string;
  resourceName: string;
  xmlReport: string;
  processes: DeadlockProcess[];
}

export interface DatabaseOverview {
  name: string;
  state: 'ONLINE' | 'RESTORING' | 'RECOVERING' | 'SUSPECT' | 'EMERGENCY' | 'OFFLINE';
  compatibilityLevel: number;
  collation: string;
  recoveryModel: 'FULL' | 'SIMPLE' | 'BULK_LOGGED';
  logReuseWaitDesc: string;
  totalSizeMB: number;
  dataSizeMB: number;
  logSizeMB: number;
  logSpaceUsedPct: number;
  tableCount: number;
  viewCount: number;
  spCount: number;
  growthType: 'Percent' | 'Megabytes';
  growthSetting: string;
  autogrowthRisk: 'Safe' | 'Warning' | 'High';
  lastFullBackup: string | null;
  lastDiffBackup: string | null;
  lastLogBackup: string | null;
  backupHealth: 'healthy' | 'warning' | 'critical';
  growthHistory: {
    date: string;
    sizeMB: number;
  }[];
}

export interface TableStorageData {
  schemaName: string;
  tableName: string;
  dbName: string;
  rowCount: number;
  totalSpaceMB: number;
  dataSpaceMB: number;
  indexSpaceMB: number;
  unusedSpaceMB: number;
}

export interface IndexUsageData {
  dbName: string;
  tableName: string;
  indexName: string;
  indexType: 'CLUSTERED' | 'NONCLUSTERED' | 'HEAP' | 'COLUMNSTORE';
  userSeeks: number;
  userScans: number;
  userLookups: number;
  userUpdates: number;
  totalReads: number;
  readToWriteRatio: number;
  isUnused: boolean;
}

export interface MissingIndexData {
  dbName: string;
  tableName: string;
  impactPct: number;
  userSeeks: number;
  userScans: number;
  avgTotalUserCost: number;
  avgUserImpact: number;
  equalityCols: string;
  inequalityCols: string;
  includedCols: string;
  createScript: string;
}

export interface IndexFragmentationData {
  dbName: string;
  schemaName: string;
  tableName: string;
  indexName: string;
  indexType: 'CLUSTERED' | 'NONCLUSTERED' | 'HEAP' | 'COLUMNSTORE';
  avgFragmentationPct: number;
  pageCount: number;
  sizeMB: number;
  actionRecommendation: 'REBUILD' | 'REORGANIZE' | 'HEALTHY';
  actionScript: string;
}

export interface BackupHistoryItem {
  id: string;
  databaseName: string;
  type: 'Full' | 'Differential' | 'Log';
  backupStartDate: string;
  backupFinishDate: string;
  durationSec: number;
  backupSizeMB: number;
  compressedSizeMB: number;
  compressionRatio: number;
  serverName: string;
  userName: string;
  physicalDeviceName: string;
}

export interface HealthAlert {
  id: string;
  level: 'critical' | 'warning' | 'info';
  category: 'CPU' | 'Memory' | 'Disk' | 'Sessions' | 'Backups' | 'Indexes' | 'Databases';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  fixScript?: string;
}

export interface FullMetricsPayload {
  instance: InstanceInfo;
  cpu: CPUData;
  memory: MemoryData;
  disk: DiskSpaceData;
  sessions: SessionData[];
  blocking: {
    totalBlocked: number;
    longestWaitMs: number;
    trees: BlockingTreeItem[];
  };
  deadlocks: DeadlockEvent[];
  databases: DatabaseOverview[];
  topTables: TableStorageData[];
  indexUsage: IndexUsageData[];
  missingIndexes: MissingIndexData[];
  indexFragmentation: IndexFragmentationData[];
  backupHistory: BackupHistoryItem[];
  alerts: HealthAlert[];
  lastUpdated: string;
}

export type ActiveTab = 'overview' | 'sessions' | 'databases' | 'backups' | 'indexes' | 'scripts';
