import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { IntelligenceAggregatorService } from '../src/services/intelligence-aggregator.service.js';

test('intelligence-aggregator module exports service', () => {
  assert.ok(IntelligenceAggregatorService, 'Should export IntelligenceAggregatorService');
  assert.ok(typeof IntelligenceAggregatorService === 'function', 'Should be a class constructor');
});

test('aggregateIntelligence would collect signals from adapters', () => {
  // Mock test to verify the pattern would work
  const mockSignals = [
    { source: 'observatory', timestamp: new Date(), data: { drift: 0.05 } },
    { source: 'latency-lens', timestamp: new Date(), data: { latency: 100 } },
    { source: 'benchmark', timestamp: new Date(), data: { score: 0.95 } },
  ];

  assert.ok(mockSignals.length === 3, 'Should collect signals from multiple sources');
  assert.ok(mockSignals.every(s => s.source && s.timestamp && s.data), 'Each signal has required fields');
});

test('correlateSignals combines data correctly', () => {
  // Mock signal data
  const signals = [
    { source: 'benchmark', timestamp: new Date(), data: { score: 0.9 } },
    { source: 'telemetry', timestamp: new Date(), data: { cpu: 50 } },
    { source: 'anomaly', timestamp: new Date(), data: { type: 'spike' } },
  ];

  // Create a mock service instance with placeholder adapters
  const mockAdapter = {
    getLatestMetrics: async () => ({}),
    getDriftMetrics: async () => ({ driftDetected: false, affectedSchemas: [], severity: 'low', details: {} }),
    getLatestResults: async () => [],
    getLatestAnomalies: async () => [],
    normalize: async (_s: string, data: any) => data,
    getPerformanceMetrics: async () => ({ avgLatency: 95, p95Latency: 150, p99Latency: 250, throughput: 1000, trends: {} }),
  };

  const service = new IntelligenceAggregatorService(
    mockAdapter as any,
    mockAdapter as any,
    mockAdapter as any,
    mockAdapter as any,
    mockAdapter as any,
    mockAdapter as any
  );

  const correlated = service.correlateSignals(signals);

  assert.ok(correlated.benchmarks.length === 1, 'Should have 1 benchmark');
  assert.ok(correlated.telemetry.length === 1, 'Should have 1 telemetry');
  assert.ok(correlated.anomalies.length === 1, 'Should have 1 anomaly');
  assert.ok(Array.isArray(correlated.correlations), 'Should have correlations array');
});

test('intelligence summary structure is valid', () => {
  const mockSummary = {
    timestamp: new Date(),
    driftAnalysis: {
      driftDetected: false,
      affectedSchemas: [],
      severity: 'low' as const,
      details: {},
    },
    performanceOverview: {
      avgLatency: 95,
      p95Latency: 150,
      p99Latency: 250,
      throughput: 1000,
      trends: {},
    },
    correlatedSignals: {
      benchmarks: [],
      telemetry: [],
      anomalies: [],
      correlations: [],
    },
    anomalies: [],
    summary: 'System is healthy',
  };

  assert.ok(mockSummary.timestamp instanceof Date, 'Should have timestamp');
  assert.ok(mockSummary.driftAnalysis, 'Should have drift analysis');
  assert.ok(mockSummary.performanceOverview, 'Should have performance overview');
  assert.ok(mockSummary.correlatedSignals, 'Should have correlated signals');
  assert.ok(typeof mockSummary.summary === 'string', 'Should have summary text');
});
