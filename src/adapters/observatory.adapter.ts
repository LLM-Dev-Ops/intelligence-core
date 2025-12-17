export interface DriftMetric {
  modelId: string;
  metricName: string;
  value: number;
  baseline: number;
  driftScore: number;
  timestamp: number;
}

export interface ObservatoryAdapter {
  getDriftMetrics(modelId: string, timeRange?: { start: number; end: number }): Promise<DriftMetric[]>;
  getCurrentDrift(modelId: string): Promise<number>;
}

export function createObservatoryAdapter(config?: { baseUrl?: string }): ObservatoryAdapter {
  return {
    async getDriftMetrics(modelId: string, timeRange?: { start: number; end: number }): Promise<DriftMetric[]> {
      return [];
    },
    async getCurrentDrift(modelId: string): Promise<number> {
      return 0;
    },
  };
}
