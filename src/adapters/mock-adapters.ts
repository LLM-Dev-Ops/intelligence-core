import type { DriftAnalysis, PerformanceOverview } from '../services/intelligence-aggregator.service.js';

// Mock Observatory Adapter with methods expected by IntelligenceAggregatorService
export class MockObservatoryAdapter {
  async getLatestMetrics(): Promise<Record<string, unknown>> {
    return {
      serviceName: 'mock-service',
      health: 'healthy',
      uptime: 99.9,
      timestamp: new Date().toISOString(),
    };
  }

  async getDriftMetrics(): Promise<Partial<DriftAnalysis>> {
    return {
      driftDetected: false,
      affectedSchemas: [],
      severity: 'low',
      details: {},
    };
  }
}

// Mock Latency-Lens Adapter
export class MockLatencyLensAdapter {
  async getLatestMetrics(): Promise<Record<string, unknown>> {
    return {
      p50: 45,
      p95: 120,
      p99: 250,
      throughput: 1500,
      timestamp: new Date().toISOString(),
    };
  }

  async getPerformanceMetrics(): Promise<Partial<PerformanceOverview>> {
    return {
      avgLatency: 65,
      p95Latency: 120,
      p99Latency: 250,
      throughput: 1500,
      trends: {},
    };
  }
}

// Mock Schema Registry Adapter
export class MockSchemaRegistryAdapter {
  async normalize<T>(schemaType: string, data: unknown): Promise<T> {
    // Simple passthrough normalization for mocking
    return data as T;
  }
}

// Mock Benchmark Adapter
export class MockBenchmarkAdapter {
  async getLatestResults(): Promise<unknown[]> {
    return [
      {
        benchmarkId: 'bench-1',
        score: 85,
        taskType: 'latency',
        timestamp: new Date().toISOString(),
      },
    ];
  }
}

// Mock Telemetry Adapter
export class MockTelemetryAdapter {
  async getLatestMetrics(): Promise<unknown[]> {
    return [
      {
        serviceId: 'service-1',
        cpu: 45.5,
        memory: 2048,
        requests: 10000,
        errors: 5,
        timestamp: new Date().toISOString(),
      },
    ];
  }
}

// Mock Anomaly Adapter
export class MockAnomalyAdapter {
  async getLatestAnomalies(): Promise<unknown[]> {
    return [
      {
        anomalyId: 'anomaly-1',
        type: 'latency-spike',
        severity: 'medium',
        description: 'Latency spike detected',
        timestamp: new Date().toISOString(),
      },
    ];
  }
}

interface GenericAdapter {
  [key: string]: (...args: unknown[]) => Promise<unknown>;
}

export function createMockAdapters() {
  return {
    observatory: new MockObservatoryAdapter() as unknown as GenericAdapter,
    latencyLens: new MockLatencyLensAdapter() as unknown as GenericAdapter,
    schemaRegistry: new MockSchemaRegistryAdapter() as unknown as GenericAdapter,
    benchmark: new MockBenchmarkAdapter() as unknown as GenericAdapter,
    telemetry: new MockTelemetryAdapter() as unknown as GenericAdapter,
    anomaly: new MockAnomalyAdapter() as unknown as GenericAdapter,
  };
}
