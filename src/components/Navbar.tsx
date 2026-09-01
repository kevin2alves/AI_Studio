import React from 'react';
import { 
  Database, 
  Activity, 
  Layers, 
  Archive, 
  FileCode, 
  RefreshCw, 
  SlidersHorizontal, 
  ShieldAlert, 
  Server, 
  Play, 
  Pause,
  Download,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ActiveTab, ConnectionStatus, FullMetricsPayload } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  connectionStatus: ConnectionStatus;
  onOpenConnect: () => void;
  metrics: FullMetricsPayload;
  isAutoRefresh: boolean;
  setIsAutoRefresh: (val: boolean) => void;
  refreshIntervalSec: number;
  onManualRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  connectionStatus,
  onOpenConnect,
  metrics,
  isAutoRefresh,
  setIsAutoRefresh,
  onManualRefresh,
  isRefreshing,
}) => {
  const criticalCount = metrics.alerts.filter((a) => a.level === 'critical').length;
  const warningCount = metrics.alerts.filter((a) => a.level === 'warning').length;

  const tabs: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Dashboard Integrado', icon: Activity },
    { id: 'sessions', label: 'Sessões & Bloqueios', icon: Layers },
    { id: 'databases', label: 'Bases de Dados & Growth', icon: Database },
    { id: 'backups', label: 'Backups & SLA', icon: Archive },
    { id: 'indexes', label: 'Índices & Tuning', icon: SlidersHorizontal },
    { id: 'scripts', label: 'Scripts T-SQL DMV', icon: FileCode },
  ];

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(metrics, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sql_performance_report_${metrics.instance.machineName}_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner: Instance Telemetry Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 border-b border-slate-100 gap-3">
          
          {/* Logo & Instance Details */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 text-lg leading-none">
                  SQL Server Performance Monitor
                </h1>
                {connectionStatus === 'connected' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Instance
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Demo Simulator
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono font-medium text-slate-700">{metrics.instance.machineName}\{metrics.instance.instanceName}</span>
                <span>•</span>
                <span>{metrics.instance.edition}</span>
                <span>•</span>
                <span>{metrics.instance.logicalCpus} vCPUs</span>
                <span>•</span>
                <span>{metrics.instance.totalMemoryGB} GB RAM</span>
                <span>•</span>
                <span>Uptime: {Math.round(metrics.instance.uptimeHours)}h</span>
              </div>
            </div>
          </div>

          {/* Actions & Connection Controls */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Health Pill */}
            {criticalCount > 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>{criticalCount} Crítico(s)</span>
              </div>
            ) : warningCount > 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{warningCount} Alerta(s)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Saudável</span>
              </div>
            )}

            {/* Auto Refresh Toggle */}
            <button
              id="btnToggleAutoRefresh"
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              title={isAutoRefresh ? "Pausar atualização automática" : "Ativar atualização automática"}
              className={`p-1.5 rounded-md border text-xs font-medium flex items-center gap-1 transition-colors ${
                isAutoRefresh 
                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' 
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {isAutoRefresh ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isAutoRefresh ? 'Auto (5s)' : 'Pausado'}</span>
            </button>

            {/* Manual Refresh */}
            <button
              id="btnManualRefresh"
              onClick={onManualRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
              title="Atualizar agora"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>

            {/* Export JSON */}
            <button
              id="btnExportReport"
              onClick={handleExportJSON}
              className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
              title="Exportar dados do diagnóstico"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Exportar</span>
            </button>

            {/* Connect / Change Instance Button */}
            <button
              id="btnOpenConnectModal"
              onClick={onOpenConnect}
              className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Conectar Instância</span>
            </button>
          </div>

        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.id === 'sessions' && metrics.blocking.totalBlocked > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs font-bold bg-rose-500 text-white">
                    {metrics.blocking.totalBlocked}
                  </span>
                )}
                {tab.id === 'indexes' && metrics.indexFragmentation.filter(f => f.actionRecommendation === 'REBUILD').length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs font-bold bg-amber-500 text-white">
                    {metrics.indexFragmentation.filter(f => f.actionRecommendation === 'REBUILD').length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
