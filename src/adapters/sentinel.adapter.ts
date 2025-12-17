export interface AnomalySignal {
  modelId: string;
  anomalyType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  timestamp: number;
  details?: Record<string, unknown>;
}

export interface SentinelAdapter {
  getAnomalies(modelId: string, since?: number): Promise<AnomalySignal[]>;
  checkForAnomalies(modelId: string): Promise<AnomalySignal[]>;
}

export function createSentinelAdapter(config?: { baseUrl?: string }): SentinelAdapter {
  return {
    async getAnomalies(modelId: string, since?: number): Promise<AnomalySignal[]> {
      return [];
    },
    async checkForAnomalies(modelId: string): Promise<AnomalySignal[]> {
      return [];
    },
  };
}
