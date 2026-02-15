/**
 * Intelligence Core - Main Library Entry Point
 *
 * Provides a unified interface for intelligence operations including
 * summaries, drift analysis, performance metrics, and signal queries.
 *
 * @example
 * ```typescript
 * import { create } from '@llm-devops/intelligence-core';
 *
 * const intelligence = create();
 * const summary = await intelligence.getSummary();
 * const drift = await intelligence.getDrift();
 * const performance = await intelligence.getPerformance();
 * ```
 */

// Re-export SDK
export { IntelligenceCore, create } from './sdk';

// Re-export all types from services
export type {
  IntelligenceSummary,
  DriftAnalysis,
  PerformanceOverview,
  IntelligenceSignal,
  QueryOptions,
  TimeRange,
  SystemQueryResult,
  CorrelatedSignals,
  AnomalyReport,
} from './services';

// Re-export types from types module
export * from './types';

// Re-export execution span instrumentation
export {
  InstrumentedAggregatorService,
  ExecutionGraphBuilder,
  validateExecutionGraph,
} from './services';

export type {
  AgentSpanInput,
  InstrumentedAdapterResponse,
  ValidationResult,
} from './services';

// Re-export handlers for advanced use cases
export {
  handleGetSummary,
  handleGetDrift,
  handleGetPerformance,
  handleQuerySignals,
  initializeHandlers,
} from './handlers';

// Re-export event bus and lifecycle subscriber
export { EventBus } from './events';
export type {
  ExecutionCompletedEvent,
  LifecycleEventMap,
  LifecycleEventName,
  LifecycleEventHandler,
} from './events';

export { ExecutionLifecycleSubscriber } from './subscribers';
export type {
  TelemetryAggregate,
  DriftDelta,
  AnalyticsUpdate,
} from './subscribers';

// Library version
export const VERSION = '0.1.0';
