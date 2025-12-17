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

// Re-export handlers for advanced use cases
export {
  handleGetSummary,
  handleGetDrift,
  handleGetPerformance,
  handleQuerySignals,
  initializeHandlers,
} from './handlers';

// Library version
export const VERSION = '0.1.0';
