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
