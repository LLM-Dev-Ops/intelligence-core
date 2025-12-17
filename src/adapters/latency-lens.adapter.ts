export interface PerformanceProfile {
  modelId: string;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  throughput: number;
  costPerRequest: number;
  timestamp: number;
}

export interface LatencyLensAdapter {
  getPerformanceProfile(modelId: string): Promise<PerformanceProfile | null>;
  getLatencyTrend(modelId: string, timeRange?: { start: number; end: number }): Promise<PerformanceProfile[]>;
}

export function createLatencyLensAdapter(config?: { baseUrl?: string }): LatencyLensAdapter {
  return {
    async getPerformanceProfile(modelId: string): Promise<PerformanceProfile | null> {
      return null;
    },
    async getLatencyTrend(modelId: string, timeRange?: { start: number; end: number }): Promise<PerformanceProfile[]> {
      return [];
    },
  };
}
