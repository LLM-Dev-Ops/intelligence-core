export interface BenchmarkResult {
  modelId: string;
  taskType: string;
  score: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface TestBenchAdapter {
  getBenchmarkResults(modelId: string): Promise<BenchmarkResult[]>;
  getLatestBenchmark(modelId: string, taskType: string): Promise<BenchmarkResult | null>;
}

export function createTestBenchAdapter(config?: { baseUrl?: string }): TestBenchAdapter {
  return {
    async getBenchmarkResults(modelId: string): Promise<BenchmarkResult[]> {
      return [];
    },
    async getLatestBenchmark(modelId: string, taskType: string): Promise<BenchmarkResult | null> {
      return null;
    },
  };
}
