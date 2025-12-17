/**
 * Intelligence Aggregator Service
 *
 * Core orchestration service that consumes outputs from integrated systems
 * and correlates them into a unified intelligence view.
 */

export interface IntelligenceSignal {
  source: string;
  timestamp: Date;
  data: unknown;
  metadata?: Record<string, unknown>;
}

export interface IntelligenceSummary {
  timestamp: Date;
  driftAnalysis: DriftAnalysis;
  performanceOverview: PerformanceOverview;
  correlatedSignals: CorrelatedSignals;
  anomalies: AnomalyReport[];
  summary: string;
}

export interface DriftAnalysis {
  driftDetected: boolean;
  affectedSchemas: string[];
  severity: 'low' | 'medium' | 'high';
  details: Record<string, unknown>;
}

export interface PerformanceOverview {
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
  throughput: number;
  trends: Record<string, unknown>;
}

export interface CorrelatedSignals {
  benchmarks: unknown[];
  telemetry: unknown[];
  anomalies: unknown[];
  correlations: Array<{ type: string; confidence: number; description: string }>;
}

export interface AnomalyReport {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  description: string;
}

// Generic adapter interface for flexibility
interface GenericAdapter {
  [key: string]: (...args: unknown[]) => Promise<unknown>;
}

export class IntelligenceAggregatorService {
  constructor(
    private observatoryAdapter: GenericAdapter,
    private latencyLensAdapter: GenericAdapter,
    private schemaRegistryAdapter: GenericAdapter,
    private benchmarkAdapter: GenericAdapter,
    private telemetryAdapter: GenericAdapter,
    private anomalyAdapter: GenericAdapter
  ) {}

  /**
   * Collects signals from all integrated systems
   */
  async aggregateIntelligence(): Promise<IntelligenceSignal[]> {
    const signals: IntelligenceSignal[] = [];

    // Collect from Observatory
    if (this.observatoryAdapter.getDriftMetrics) {
      const observatoryData = await this.observatoryAdapter.getDriftMetrics('default');
      signals.push({
        source: 'observatory',
        timestamp: new Date(),
        data: observatoryData
      });
    }

    // Collect from Latency-Lens
    if (this.latencyLensAdapter.getPerformanceProfile) {
      const latencyData = await this.latencyLensAdapter.getPerformanceProfile('default');
      signals.push({
        source: 'latency-lens',
        timestamp: new Date(),
        data: latencyData
      });
    }

    // Collect from Benchmark system
    if (this.benchmarkAdapter.getLatestResults) {
      const benchmarkData = await this.benchmarkAdapter.getLatestResults();
      signals.push({
        source: 'benchmark',
        timestamp: new Date(),
        data: benchmarkData
      });
    }

    // Collect from Telemetry system
    if (this.telemetryAdapter.getLatestMetrics) {
      const telemetryData = await this.telemetryAdapter.getLatestMetrics();
      signals.push({
        source: 'telemetry',
        timestamp: new Date(),
        data: telemetryData
      });
    }

    // Collect from Anomaly detection
    if (this.anomalyAdapter.getLatestAnomalies) {
      const anomalyData = await this.anomalyAdapter.getLatestAnomalies();
      signals.push({
        source: 'anomaly',
        timestamp: new Date(),
        data: anomalyData
      });
    }

    return signals;
  }

  /**
   * Correlates benchmark results with telemetry and anomalies
   */
  correlateSignals(signals: IntelligenceSignal[]): CorrelatedSignals {
    const benchmarks = signals.filter(s => s.source === 'benchmark').map(s => s.data);
    const telemetry = signals.filter(s => s.source === 'telemetry').map(s => s.data);
    const anomalies = signals.filter(s => s.source === 'anomaly').map(s => s.data);

    const correlations = this.findCorrelations(benchmarks, telemetry, anomalies);

    return {
      benchmarks,
      telemetry,
      anomalies,
      correlations
    };
  }

  /**
   * Produces unified IntelligenceSummary
   */
  async generateSummary(): Promise<IntelligenceSummary> {
    const signals = await this.aggregateIntelligence();
    const correlatedSignals = this.correlateSignals(signals);
    const driftAnalysis = await this.getDriftAnalysis();
    const performanceOverview = await this.getPerformanceOverview();
    const anomalies = this.extractAnomalies(signals);

    const summary = this.buildSummaryText(driftAnalysis, performanceOverview, anomalies);

    return {
      timestamp: new Date(),
      driftAnalysis,
      performanceOverview,
      correlatedSignals,
      anomalies,
      summary
    };
  }

  /**
   * Gets drift data from Observatory
   */
  async getDriftAnalysis(): Promise<DriftAnalysis> {
    let driftData: unknown = null;

    if (this.observatoryAdapter.getDriftMetrics) {
      driftData = await this.observatoryAdapter.getDriftMetrics('default');
    }

    // Return normalized data or default
    if (driftData && typeof driftData === 'object') {
      return {
        driftDetected: (driftData as Record<string, unknown>).driftDetected as boolean ?? false,
        affectedSchemas: (driftData as Record<string, unknown>).affectedSchemas as string[] ?? [],
        severity: (driftData as Record<string, unknown>).severity as 'low' | 'medium' | 'high' ?? 'low',
        details: (driftData as Record<string, unknown>).details as Record<string, unknown> ?? {}
      };
    }

    return {
      driftDetected: false,
      affectedSchemas: [],
      severity: 'low',
      details: {}
    };
  }

  /**
   * Gets performance data from Latency-Lens
   */
  async getPerformanceOverview(): Promise<PerformanceOverview> {
    let perfData: unknown = null;

    if (this.latencyLensAdapter.getPerformanceProfile) {
      perfData = await this.latencyLensAdapter.getPerformanceProfile('default');
    }

    // Return normalized data or default
    if (perfData && typeof perfData === 'object') {
      const data = perfData as Record<string, unknown>;
      return {
        avgLatency: data.avgLatency as number ?? data.p50Latency as number ?? 0,
        p95Latency: data.p95Latency as number ?? 0,
        p99Latency: data.p99Latency as number ?? 0,
        throughput: data.throughput as number ?? 0,
        trends: data.trends as Record<string, unknown> ?? {}
      };
    }

    return {
      avgLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      throughput: 0,
      trends: {}
    };
  }

  // Private helper methods
  private findCorrelations(
    benchmarks: unknown[],
    telemetry: unknown[],
    anomalies: unknown[]
  ): Array<{ type: string; confidence: number; description: string }> {
    const correlations: Array<{ type: string; confidence: number; description: string }> = [];

    if (benchmarks.length > 0 && anomalies.length > 0) {
      correlations.push({
        type: 'benchmark-anomaly',
        confidence: 0.8,
        description: 'Benchmark results correlated with detected anomalies'
      });
    }

    if (telemetry.length > 0 && anomalies.length > 0) {
      correlations.push({
        type: 'telemetry-anomaly',
        confidence: 0.75,
        description: 'Telemetry patterns correlated with anomalies'
      });
    }

    return correlations;
  }

  private extractAnomalies(signals: IntelligenceSignal[]): AnomalyReport[] {
    const anomalySignals = signals.filter(s => s.source === 'anomaly');
    const reports: AnomalyReport[] = [];

    for (const signal of anomalySignals) {
      if (Array.isArray(signal.data)) {
        for (const item of signal.data) {
          if (item && typeof item === 'object') {
            const anomaly = item as Record<string, unknown>;
            reports.push({
              type: anomaly.type as string ?? 'unknown',
              severity: anomaly.severity as 'low' | 'medium' | 'high' | 'critical' ?? 'low',
              timestamp: new Date(anomaly.timestamp as string) ?? new Date(),
              description: anomaly.description as string ?? ''
            });
          }
        }
      }
    }

    return reports;
  }

  private buildSummaryText(
    drift: DriftAnalysis,
    performance: PerformanceOverview,
    anomalies: AnomalyReport[]
  ): string {
    const parts: string[] = [];

    if (drift.driftDetected) {
      parts.push(`Drift detected (${drift.severity} severity) affecting ${drift.affectedSchemas.length} schemas.`);
    }

    parts.push(`Performance: avg=${performance.avgLatency}ms, p95=${performance.p95Latency}ms, p99=${performance.p99Latency}ms.`);

    if (anomalies.length > 0) {
      const critical = anomalies.filter(a => a.severity === 'critical').length;
      parts.push(`${anomalies.length} anomalies detected${critical > 0 ? ` (${critical} critical)` : ''}.`);
    }

    return parts.join(' ');
  }
}
