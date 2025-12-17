export interface TelemetryMetrics {
  serviceId: string;
  cpu: number;
  memory: number;
  requests: number;
  errors: number;
  timestamp: Date;
}

export class TelemetryAdapter {
  async getLatestMetrics(): Promise<TelemetryMetrics[]> {
    // Mock implementation for simulator compatibility
    return [
      {
        serviceId: 'service-1',
        cpu: 45.5,
        memory: 2048,
        requests: 10000,
        errors: 5,
        timestamp: new Date(),
      },
    ];
  }
}
