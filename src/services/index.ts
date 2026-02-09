/**
 * Services Module
 *
 * Core intelligence aggregation and query services.
 */

export {
  IntelligenceAggregatorService,
  IntelligenceSignal,
  IntelligenceSummary,
  DriftAnalysis,
  PerformanceOverview,
  CorrelatedSignals,
  AnomalyReport
} from './intelligence-aggregator.service.js';

export {
  QueryService,
  TimeRange,
  QueryOptions,
  SystemQueryResult
} from './query.service.js';

export {
  ExecutionGraphBuilder,
  AgentSpanInput,
  InstrumentedAdapterResponse
} from './execution-span-builder.js';

export type { ValidationResult } from './execution-graph-validator.js';
export { validateExecutionGraph } from './execution-graph-validator.js';

export { InstrumentedAggregatorService } from './instrumented-aggregator.service.js';
