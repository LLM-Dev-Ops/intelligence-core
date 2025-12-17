import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  handleGetSummary,
  handleGetDrift,
  handleGetPerformance,
  handleQuerySignals,
  initializeHandlers,
} from '../src/handlers/intelligence.handler.js';
import { QueryService } from '../src/services/query.service.js';
import { IntelligenceAggregatorService } from '../src/services/intelligence-aggregator.service.js';
import type { IntelligenceSummary } from '../src/services/intelligence-aggregator.service.js';

// Mock adapters for testing
const mockAdapter = {
  getLatestMetrics: async () => ({ drift: 0.05 }),
  getDriftMetrics: async () => ({ driftDetected: false, affectedSchemas: [], severity: 'low', details: {} }),
  getLatestResults: async () => [{ score: 0.95 }],
  getLatestAnomalies: async () => [],
  normalize: async (_s: string, data: any) => data,
  getPerformanceMetrics: async () => ({ avgLatency: 95, p95Latency: 150, p99Latency: 250, throughput: 1000, trends: {} }),
};

// Initialize services once for all tests
const aggregatorService = new IntelligenceAggregatorService(
  mockAdapter as any,
  mockAdapter as any,
  mockAdapter as any,
  mockAdapter as any,
  mockAdapter as any,
  mockAdapter as any
);

const queryService = new QueryService();

// Store a test summary
const testSummary: IntelligenceSummary = {
  timestamp: new Date(),
  driftAnalysis: { driftDetected: false, affectedSchemas: [], severity: 'low', details: {} },
  performanceOverview: { avgLatency: 95, p95Latency: 150, p99Latency: 250, throughput: 1000, trends: {} },
  correlatedSignals: { benchmarks: [], telemetry: [], anomalies: [], correlations: [] },
  anomalies: [],
  summary: 'Test system is healthy',
};
queryService.storeSummary(testSummary);

// Store some test signals
queryService.storeSignals([
  { source: 'observatory', timestamp: new Date(), data: { drift: 0.05 } },
  { source: 'benchmark', timestamp: new Date(), data: { score: 0.9 } },
]);

initializeHandlers(aggregatorService, queryService);

test('CLI handleGetSummary returns valid summary', async () => {
  const summary = await handleGetSummary();

  assert.ok(summary, 'Summary should exist');
  assert.ok(summary.driftAnalysis, 'Should have drift analysis');
  assert.ok(summary.performanceOverview, 'Should have performance overview');
  assert.strictEqual(summary.summary, 'Test system is healthy', 'Should have summary text');
});

test('CLI handleGetDrift returns drift analysis', async () => {
  const drift = await handleGetDrift();

  assert.ok(drift, 'Drift analysis should exist');
  assert.ok(typeof drift.driftDetected === 'boolean', 'Should have driftDetected flag');
  assert.ok(Array.isArray(drift.affectedSchemas), 'Should have affectedSchemas array');
  assert.ok(['low', 'medium', 'high'].includes(drift.severity), 'Should have valid severity');
});

test('CLI handleGetPerformance returns performance overview', async () => {
  const performance = await handleGetPerformance();

  assert.ok(performance, 'Performance data should exist');
  assert.ok(typeof performance.avgLatency === 'number', 'Should have avgLatency');
  assert.ok(typeof performance.p95Latency === 'number', 'Should have p95Latency');
  assert.ok(typeof performance.p99Latency === 'number', 'Should have p99Latency');
  assert.ok(typeof performance.throughput === 'number', 'Should have throughput');
});

test('CLI handleQuerySignals can query by system', async () => {
  const result = await handleQuerySignals('observatory');

  assert.ok(result, 'Should return result');
  assert.ok('system' in result, 'Should be a SystemQueryResult');
  assert.ok('signals' in result, 'Should have signals');
  assert.ok('count' in result, 'Should have count');
});

test('CLI handleQuerySignals returns multiple systems by default', async () => {
  const result = await handleQuerySignals();

  assert.ok(Array.isArray(result), 'Should return an array');
  assert.ok(result.length > 0, 'Should have results');
});

test('CLI handlers are properly initialized', async () => {
  // This test verifies that handlers don't throw when called
  try {
    await handleGetSummary();
    await handleGetDrift();
    await handleGetPerformance();
    assert.ok(true, 'All handlers executed without errors');
  } catch (error) {
    assert.fail('Handlers should not throw when properly initialized');
  }
});
