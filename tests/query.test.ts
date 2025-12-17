import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { QueryService } from '../src/services/query.service.js';
import type { IntelligenceSummary, IntelligenceSignal } from '../src/services/intelligence-aggregator.service.js';

test('getLatestSummary returns most recent summary', () => {
  const service = new QueryService();

  const summary1: IntelligenceSummary = {
    timestamp: new Date(Date.now() - 1000),
    driftAnalysis: { driftDetected: false, affectedSchemas: [], severity: 'low', details: {} },
    performanceOverview: { avgLatency: 95, p95Latency: 150, p99Latency: 250, throughput: 1000, trends: {} },
    correlatedSignals: { benchmarks: [], telemetry: [], anomalies: [], correlations: [] },
    anomalies: [],
    summary: 'Test summary 1',
  };

  const summary2: IntelligenceSummary = {
    timestamp: new Date(),
    driftAnalysis: { driftDetected: false, affectedSchemas: [], severity: 'low', details: {} },
    performanceOverview: { avgLatency: 100, p95Latency: 160, p99Latency: 260, throughput: 1100, trends: {} },
    correlatedSignals: { benchmarks: [], telemetry: [], anomalies: [], correlations: [] },
    anomalies: [],
    summary: 'Test summary 2',
  };

  service.storeSummary(summary1);
  service.storeSummary(summary2);

  const latest = service.getLatestSummary();

  assert.ok(latest, 'Should return a summary');
  assert.strictEqual(latest.summary, 'Test summary 2', 'Should return most recent summary');
});

test('queryByTimeRange filters correctly', () => {
  const service = new QueryService();

  const now = Date.now();
  const summary1: IntelligenceSummary = {
    timestamp: new Date(now - 3600000),
    driftAnalysis: { driftDetected: false, affectedSchemas: [], severity: 'low', details: {} },
    performanceOverview: { avgLatency: 95, p95Latency: 150, p99Latency: 250, throughput: 1000, trends: {} },
    correlatedSignals: { benchmarks: [], telemetry: [], anomalies: [], correlations: [] },
    anomalies: [],
    summary: 'Old summary',
  };

  const summary2: IntelligenceSummary = {
    timestamp: new Date(now - 1800000),
    driftAnalysis: { driftDetected: false, affectedSchemas: [], severity: 'low', details: {} },
    performanceOverview: { avgLatency: 100, p95Latency: 160, p99Latency: 260, throughput: 1100, trends: {} },
    correlatedSignals: { benchmarks: [], telemetry: [], anomalies: [], correlations: [] },
    anomalies: [],
    summary: 'Recent summary',
  };

  service.storeSummary(summary1);
  service.storeSummary(summary2);

  const results = service.queryByTimeRange({
    start: new Date(now - 4000000),
    end: new Date(now + 1000),
  });

  assert.strictEqual(results.length, 2, 'Should return both summaries in range');
});

test('queryBySystem returns correct data', () => {
  const service = new QueryService();

  const signals: IntelligenceSignal[] = [
    { source: 'observatory', timestamp: new Date(), data: { drift: 0.05 } },
    { source: 'observatory', timestamp: new Date(), data: { drift: 0.07 } },
    { source: 'benchmark', timestamp: new Date(), data: { score: 0.95 } },
  ];

  service.storeSignals(signals);

  const result = service.queryBySystem('observatory');

  assert.ok(result, 'Should return a result');
  assert.strictEqual(result.system, 'observatory', 'Should match system name');
  assert.strictEqual(result.signals.length, 2, 'Should return 2 observatory signals');
  assert.strictEqual(result.count, 2, 'Should have correct count');
});

test('queryBySystem respects limit option', () => {
  const service = new QueryService();

  const signals: IntelligenceSignal[] = Array.from({ length: 15 }, (_, i) => ({
    source: 'test-system',
    timestamp: new Date(Date.now() - i * 1000),
    data: { value: i },
  }));

  service.storeSignals(signals);

  const result = service.queryBySystem('test-system', { limit: 5 });

  assert.strictEqual(result.signals.length, 5, 'Should respect limit');
  assert.strictEqual(result.count, 15, 'Count should reflect total signals');
});

test('getAvailableSystems returns all system names', () => {
  const service = new QueryService();

  const signals: IntelligenceSignal[] = [
    { source: 'observatory', timestamp: new Date(), data: {} },
    { source: 'benchmark', timestamp: new Date(), data: {} },
    { source: 'latency-lens', timestamp: new Date(), data: {} },
  ];

  service.storeSignals(signals);

  const systems = service.getAvailableSystems();

  assert.ok(systems.length === 3, 'Should return 3 systems');
  assert.ok(systems.includes('observatory'), 'Should include observatory');
  assert.ok(systems.includes('benchmark'), 'Should include benchmark');
  assert.ok(systems.includes('latency-lens'), 'Should include latency-lens');
});
