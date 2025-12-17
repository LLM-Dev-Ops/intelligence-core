/**
 * Core type definitions for LLM DevOps Intelligence Core
 * Layer 3 - Intelligence aggregation and analysis
 */

/**
 * Benchmark signal from Test-Bench (Layer 2)
 */
export interface BenchmarkSignal {
  timestamp: string;
  benchmarkId: string;
  modelId: string;
  score: number;
  metrics: {
    latency?: number;
    throughput?: number;
    accuracy?: number;
    [key: string]: unknown;
  };
  status: 'passed' | 'failed' | 'degraded';
  metadata?: Record<string, unknown>;
}

/**
 * Telemetry snapshot from Observatory (Layer 2)
 */
export interface TelemetrySnapshot {
  timestamp: string;
  serviceId: string;
  metrics: {
    cpu?: number;
    memory?: number;
    requests?: number;
    errors?: number;
    [key: string]: unknown;
  };
  health: 'healthy' | 'degraded' | 'unhealthy';
  metadata?: Record<string, unknown>;
}

/**
 * Anomaly alert from Sentinel (Layer 2)
 */
export interface AnomalyAlert {
  timestamp: string;
  alertId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  anomalyType: string;
  description: string;
  detectedValue: number;
  expectedRange: {
    min: number;
    max: number;
  };
  confidence: number;
  metadata?: Record<string, unknown>;
}

/**
 * Performance profile from Latency-Lens (Layer 2)
 */
export interface PerformanceProfile {
  timestamp: string;
  profileId: string;
  modelId: string;
  latencyMetrics: {
    p50: number;
    p95: number;
    p99: number;
    mean: number;
    max: number;
  };
  throughputMetrics: {
    requestsPerSecond: number;
    tokensPerSecond?: number;
  };
  resourceUtilization: {
    cpu: number;
    memory: number;
    gpu?: number;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Analytics data from Analytics-Hub (Layer 2)
 */
export interface AnalyticsData {
  timestamp: string;
  analyticsId: string;
  timeRange: {
    start: string;
    end: string;
  };
  aggregations: {
    totalRequests: number;
    successRate: number;
    errorRate: number;
    avgLatency: number;
    [key: string]: unknown;
  };
  trends: Array<{
    metric: string;
    direction: 'up' | 'down' | 'stable';
    changePercent: number;
  }>;
  metadata?: Record<string, unknown>;
}

/**
 * Schema contract from Schema-Registry (Layer 2)
 */
export interface SchemaContract {
  schemaId: string;
  version: string;
  schemaType: string;
  definition: Record<string, unknown>;
  validatedAt: string;
  compatibility: 'backward' | 'forward' | 'full' | 'none';
  metadata?: Record<string, unknown>;
}

/**
 * Intelligence Summary - aggregated view across all Layer 2 services
 */
export interface IntelligenceSummary {
  timestamp: string;
  summaryId: string;
  timeRange: {
    start: string;
    end: string;
  };
  overallHealth: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
  healthScore: number;
  insights: {
    benchmarks?: {
      totalBenchmarks: number;
      passRate: number;
      avgScore: number;
      trending: 'improving' | 'stable' | 'degrading';
    };
    telemetry?: {
      servicesMonitored: number;
      healthyServices: number;
      degradedServices: number;
      unhealthyServices: number;
    };
    anomalies?: {
      totalAlerts: number;
      criticalAlerts: number;
      resolvedAlerts: number;
      activeAlerts: number;
    };
    performance?: {
      avgLatencyP95: number;
      avgThroughput: number;
      resourceEfficiency: number;
    };
    analytics?: {
      totalRequests: number;
      successRate: number;
      topTrends: Array<{
        metric: string;
        direction: 'up' | 'down' | 'stable';
        impact: 'high' | 'medium' | 'low';
      }>;
    };
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    description: string;
    actionable: boolean;
  }>;
  metadata?: Record<string, unknown>;
}
