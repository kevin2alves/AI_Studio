import React, { useState, useEffect, useCallback } from 'react';
import { 
  ActiveTab, 
  ConnectionConfig, 
  ConnectionStatus, 
  FullMetricsPayload 
} from './types';
import { INITIAL_MOCK_METRICS } from './mockData';
import { SqlClient } from './api/sqlClient';
import { Navbar } from './components/Navbar';
import { ConnectionModal } from './components/ConnectionModal';
import { OverviewTab } from './components/OverviewTab';
import { SessionsTab } from './components/SessionsTab';
import { DatabasesTab } from './components/DatabasesTab';
import { BackupsTab } from './components/BackupsTab';
import { IndexesTab } from './components/IndexesTab';
import { ScriptsTab } from './components/ScriptsTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('demo');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<ConnectionConfig | null>(null);
  const [metrics, setMetrics] = useState<FullMetricsPayload>(INITIAL_MOCK_METRICS);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [refreshIntervalSec] = useState(5);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize SqlClient with default demo configuration
  useEffect(() => {
    SqlClient.setConfig(
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
  }, []);

  // Fetch metrics function
  const fetchTelemetry = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await SqlClient.fetchMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Telemetry fetch error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Auto-refresh interval
  useEffect(() => {
    if (!isAutoRefresh) return;
    const interval = setInterval(() => {
      fetchTelemetry();
    }, refreshIntervalSec * 1000);
    return () => clearInterval(interval);
  }, [isAutoRefresh, refreshIntervalSec, fetchTelemetry]);

  // Connect handler
  const handleConnect = async (config: ConnectionConfig, isDemo: boolean) => {
    setCurrentConfig(config);
    if (isDemo) {
      SqlClient.setConfig(config, true);
      setConnectionStatus('demo');
      await fetchTelemetry();
    } else {
      SqlClient.setConfig(config, false);
      setConnectionStatus('connected');
      await fetchTelemetry();
    }
  };

  // Kill session action
  const handleKillSession = async (spid: number) => {
    const result = await SqlClient.killSession(spid);
    await fetchTelemetry();
  };

  // Rebuild index action
  const handleRebuildIndex = async (script: string) => {
    await SqlClient.rebuildIndex(script);
    await fetchTelemetry();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Application Header & Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        connectionStatus={connectionStatus}
        onOpenConnect={() => setIsConnectModalOpen(true)}
        metrics={metrics}
        isAutoRefresh={isAutoRefresh}
        setIsAutoRefresh={setIsAutoRefresh}
        refreshIntervalSec={refreshIntervalSec}
        onManualRefresh={fetchTelemetry}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewTab
            metrics={metrics}
            onKillSession={handleKillSession}
          />
        )}

        {activeTab === 'sessions' && (
          <SessionsTab
            metrics={metrics}
            onKillSession={handleKillSession}
          />
        )}

        {activeTab === 'databases' && (
          <DatabasesTab
            metrics={metrics}
          />
        )}

        {activeTab === 'backups' && (
          <BackupsTab
            metrics={metrics}
          />
        )}

        {activeTab === 'indexes' && (
          <IndexesTab
            metrics={metrics}
            onRebuildIndex={handleRebuildIndex}
          />
        )}

        {activeTab === 'scripts' && (
          <ScriptsTab />
        )}
      </main>

      {/* Connection & Configuration Modal */}
      <ConnectionModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnect={handleConnect}
        currentConfig={currentConfig}
        isDemo={connectionStatus === 'demo'}
      />
    </div>
  );
}
