import {
  IntelligenceAggregatorService,
  IntelligenceSummary,
  DriftAnalysis,
  PerformanceOverview,
  IntelligenceSignal,
  QueryService,
  QueryOptions,
  TimeRange,
  SystemQueryResult,
} from '../services';

// Initialize services (in production, these would be injected via DI)
let aggregatorService: IntelligenceAggregatorService | null = null;
let queryService: QueryService | null = null;

export function initializeHandlers(
  aggregator: IntelligenceAggregatorService,
  query: QueryService
): void {
  aggregatorService = aggregator;
  queryService = query;
}

export async function handleGetSummary(): Promise<IntelligenceSummary | null> {
  if (!queryService) {
    throw new Error('Handlers not initialized. Call initializeHandlers() first.');
  }
  return queryService.getLatestSummary();
}

export async function handleGetDrift(): Promise<DriftAnalysis> {
  if (!aggregatorService) {
    throw new Error('Handlers not initialized. Call initializeHandlers() first.');
  }
  return aggregatorService.getDriftAnalysis();
}

export async function handleGetPerformance(): Promise<PerformanceOverview> {
  if (!aggregatorService) {
    throw new Error('Handlers not initialized. Call initializeHandlers() first.');
  }
  return aggregatorService.getPerformanceOverview();
}

export async function handleQuerySignals(
  systemName?: string,
  timeRange?: TimeRange,
  options: QueryOptions = {}
): Promise<IntelligenceSignal[] | SystemQueryResult | SystemQueryResult[]> {
  if (!queryService) {
    throw new Error('Handlers not initialized. Call initializeHandlers() first.');
  }

  if (systemName && timeRange) {
    return queryService.queryBySystemAndTimeRange(systemName, timeRange, options);
  } else if (systemName) {
    return queryService.queryBySystem(systemName, options);
  } else if (timeRange) {
    const summaries = queryService.queryByTimeRange(timeRange, options);
    // Extract all signals from summaries
    const signals: IntelligenceSignal[] = [];
    for (const summary of summaries) {
      if (summary.correlatedSignals) {
        // Flatten correlated signals
        const benchmarks = summary.correlatedSignals.benchmarks || [];
        const telemetry = summary.correlatedSignals.telemetry || [];
        const anomalies = summary.correlatedSignals.anomalies || [];
        // Convert to IntelligenceSignal format
        benchmarks.forEach((data: unknown) =>
          signals.push({ source: 'benchmark', timestamp: summary.timestamp, data })
        );
        telemetry.forEach((data: unknown) =>
          signals.push({ source: 'telemetry', timestamp: summary.timestamp, data })
        );
        anomalies.forEach((data: unknown) =>
          signals.push({ source: 'anomaly', timestamp: summary.timestamp, data })
        );
      }
    }
    return signals;
  }

  // Default: return available systems
  const systems = queryService.getAvailableSystems();
  return systems.map((system) => queryService!.queryBySystem(system, { limit: 10 }));
}
