import { ConnectionConfig, FullMetricsPayload } from '../types';
import { INITIAL_MOCK_METRICS, simulateNextTelemetryTick } from '../mockData';

export class SqlClient {
  private static config: ConnectionConfig | null = null;
  private static isDemoMode: boolean = true;
  private static cachedMetrics: FullMetricsPayload = INITIAL_MOCK_METRICS;

  public static setConfig(config: ConnectionConfig, isDemo: boolean = false) {
    this.config = config;
    this.isDemoMode = isDemo;
  }

  public static isDemo(): boolean {
    return this.isDemoMode;
  }

  public static getConfig(): ConnectionConfig | null {
    return this.config;
  }

  public static async testConnection(config: ConnectionConfig): Promise<{ success: boolean; message: string; instance?: any }> {
    try {
      const response = await fetch('/api/sql/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Connection test failed');
      }
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Could not connect to SQL Server backend service');
    }
  }

  public static async fetchMetrics(): Promise<FullMetricsPayload> {
    if (this.isDemoMode || !this.config) {
      // Simulate live telemetry tick
      this.cachedMetrics = simulateNextTelemetryTick(this.cachedMetrics);
      return this.cachedMetrics;
    }

    try {
      const response = await fetch('/api/sql/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.config),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to extract metrics');
      }
      this.cachedMetrics = data;
      return data;
    } catch (error: any) {
      console.warn('Backend metrics fetch failed, falling back to simulated data:', error.message);
      this.cachedMetrics = simulateNextTelemetryTick(this.cachedMetrics);
      return this.cachedMetrics;
    }
  }

  public static async killSession(spid: number): Promise<{ success: boolean; message: string }> {
    if (this.isDemoMode || !this.config) {
      // Remove from mock data
      this.cachedMetrics = {
        ...this.cachedMetrics,
        sessions: this.cachedMetrics.sessions.filter((s) => s.spid !== spid),
        blocking: {
          ...this.cachedMetrics.blocking,
          trees: this.cachedMetrics.blocking.trees.filter((t) => t.rootSpid !== spid),
          totalBlocked: this.cachedMetrics.blocking.trees.some((t) => t.rootSpid === spid) ? 0 : this.cachedMetrics.blocking.totalBlocked,
        },
      };
      return { success: true, message: `Session SPID ${spid} terminated in simulator.` };
    }

    const response = await fetch('/api/sql/kill-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...this.config, spid }),
    });
    return response.json();
  }

  public static async rebuildIndex(script: string): Promise<{ success: boolean; message: string }> {
    if (this.isDemoMode || !this.config) {
      return { success: true, message: 'Index maintenance simulated successfully.' };
    }

    const response = await fetch('/api/sql/rebuild-index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...this.config, script }),
    });
    return response.json();
  }
}
