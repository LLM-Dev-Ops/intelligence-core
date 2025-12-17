export interface Anomaly {
  anomalyId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedValue: number;
  expectedRange: { min: number; max: number };
  timestamp: Date;
}

export class AnomalyAdapter {
  async getLatestAnomalies(): Promise<Anomaly[]> {
    // Mock implementation for simulator compatibility
    return [
      {
        anomalyId: 'anomaly-1',
        type: 'latency-spike',
        severity: 'medium',
        description: 'Latency spike detected',
        detectedValue: 250,
        expectedRange: { min: 50, max: 150 },
        timestamp: new Date(),
      },
    ];
  }
}
