export interface AggregatedMetrics {
  modelId: string;
  totalRequests: number;
  successRate: number;
  averageLatency: number;
  totalCost: number;
  timestamp: number;
  breakdown?: Record<string, unknown>;
}

export interface AnalyticsHubAdapter {
  getAggregatedMetrics(modelId: string, timeRange?: { start: number; end: number }): Promise<AggregatedMetrics | null>;
  getUsageTrend(modelId: string, granularity: 'hour' | 'day' | 'week'): Promise<AggregatedMetrics[]>;
}

export function createAnalyticsHubAdapter(config?: { baseUrl?: string }): AnalyticsHubAdapter {
  return {
    async getAggregatedMetrics(modelId: string, timeRange?: { start: number; end: number }): Promise<AggregatedMetrics | null> {
      return null;
    },
    async getUsageTrend(modelId: string, granularity: 'hour' | 'day' | 'week'): Promise<AggregatedMetrics[]> {
      return [];
    },
  };
}
