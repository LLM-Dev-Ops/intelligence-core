import {
  handleGetSummary,
  handleGetDrift,
  handleGetPerformance,
  handleQuerySignals,
  initializeHandlers,
} from './handlers';
import {
  IntelligenceAggregatorService,
  QueryService,
  IntelligenceSummary,
  DriftAnalysis,
  PerformanceOverview,
  IntelligenceSignal,
  QueryOptions,
  TimeRange,
  SystemQueryResult,
  InstrumentedAggregatorService,
} from './services';
import { createMockAdapters } from './adapters';
import type { CoreExecutionResult } from './types/execution-span';

export class IntelligenceCore {
  private aggregator: IntelligenceAggregatorService;
  private instrumentedAggregator: InstrumentedAggregatorService;
  private queryService: QueryService;
  private initialized = false;

  constructor() {
    // Initialize with mock adapters for simulator compatibility
    const adapters = createMockAdapters();
    this.aggregator = new IntelligenceAggregatorService(
      adapters.observatory,
      adapters.latencyLens,
      adapters.schemaRegistry,
      adapters.benchmark,
      adapters.telemetry,
      adapters.anomaly
    );
    this.instrumentedAggregator = new InstrumentedAggregatorService(
      adapters.observatory,
      adapters.latencyLens,
      adapters.schemaRegistry,
      adapters.benchmark,
      adapters.telemetry,
      adapters.anomaly
    );
    this.queryService = new QueryService();
  }

  /**
   * Initialize the SDK by generating and storing initial intelligence data
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const summary = await this.aggregator.generateSummary();
    this.queryService.storeSummary(summary);
    const signals = await this.aggregator.aggregateIntelligence();
    this.queryService.storeSignals(signals);

    initializeHandlers(this.aggregator, this.queryService);
    this.initialized = true;
  }

  /**
   * Get latest intelligence summary
   */
  async getSummary(): Promise<IntelligenceSummary | null> {
    await this.initialize();
    return handleGetSummary();
  }

  /**
   * Get drift analysis
   */
  async getDrift(): Promise<DriftAnalysis> {
    await this.initialize();
    return handleGetDrift();
  }

  /**
   * Get performance overview
   */
  async getPerformance(): Promise<PerformanceOverview> {
    await this.initialize();
    return handleGetPerformance();
  }

  /**
   * Query signals with optional filtering
   * @param systemName - Filter by system name
   * @param timeRange - Filter by time range
   * @param options - Query options (limit, offset, sortOrder)
   */
  async querySignals(
    systemName?: string,
    timeRange?: TimeRange,
    options: QueryOptions = {}
  ): Promise<IntelligenceSignal[] | SystemQueryResult | SystemQueryResult[]> {
    await this.initialize();
    return handleQuerySignals(systemName, timeRange, options);
  }

  /**
   * Get list of available systems
   */
  async getAvailableSystems(): Promise<string[]> {
    await this.initialize();
    return this.queryService.getAvailableSystems();
  }

  /**
   * Get intelligence summary with full execution graph
   */
  async getSummaryInstrumented(): Promise<CoreExecutionResult<IntelligenceSummary>> {
    await this.initialize();
    return this.instrumentedAggregator.generateSummary();
  }

  /**
   * Get drift analysis with full execution graph
   */
  async getDriftInstrumented(): Promise<CoreExecutionResult<DriftAnalysis>> {
    await this.initialize();
    return this.instrumentedAggregator.getDriftAnalysis();
  }

  /**
   * Get performance overview with full execution graph
   */
  async getPerformanceInstrumented(): Promise<CoreExecutionResult<PerformanceOverview>> {
    await this.initialize();
    return this.instrumentedAggregator.getPerformanceOverview();
  }

  /**
   * Aggregate intelligence signals with full execution graph
   */
  async aggregateIntelligenceInstrumented(): Promise<CoreExecutionResult<IntelligenceSignal[]>> {
    await this.initialize();
    return this.instrumentedAggregator.aggregateIntelligence();
  }

  /**
   * Clear all stored data (useful for testing)
   */
  clear(): void {
    this.queryService.clear();
    this.initialized = false;
  }
}

/**
 * Create a new IntelligenceCore SDK instance
 */
export function create(): IntelligenceCore {
  return new IntelligenceCore();
}

// Re-export all types
export type {
  IntelligenceSummary,
  DriftAnalysis,
  PerformanceOverview,
  IntelligenceSignal,
  QueryOptions,
  TimeRange,
  SystemQueryResult,
} from './services';

export * from './types';
