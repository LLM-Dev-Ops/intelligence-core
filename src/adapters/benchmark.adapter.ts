export interface AggregatorBenchmarkResult {
  benchmarkId: string;
  modelId: string;
  taskType: string;
  score: number;
  metrics: Record<string, unknown>;
  timestamp: Date;
}

export class BenchmarkAdapter {
  async getLatestResults(): Promise<AggregatorBenchmarkResult[]> {
    // Mock implementation for simulator compatibility
    return [
      {
        benchmarkId: 'bench-1',
        modelId: 'model-1',
        taskType: 'latency',
        score: 85,
        metrics: { latency: 120, throughput: 1000 },
        timestamp: new Date(),
      },
    ];
  }
}
