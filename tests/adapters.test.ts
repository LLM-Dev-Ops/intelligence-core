import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createTestBenchAdapter } from '../src/adapters/test-bench.adapter';
import { createObservatoryAdapter } from '../src/adapters/observatory.adapter';
import { createSentinelAdapter } from '../src/adapters/sentinel.adapter';
import { createLatencyLensAdapter } from '../src/adapters/latency-lens.adapter';
import { createAnalyticsHubAdapter } from '../src/adapters/analytics-hub.adapter';
import { createSchemaRegistryAdapter } from '../src/adapters/schema-registry.adapter';

test('TestBenchAdapter can be created and returns expected shape', async () => {
  const adapter = createTestBenchAdapter();

  assert.ok(adapter, 'Adapter should be created');
  assert.ok(typeof adapter.getBenchmarkResults === 'function', 'Should have getBenchmarkResults method');
  assert.ok(typeof adapter.getLatestBenchmark === 'function', 'Should have getLatestBenchmark method');

  const results = await adapter.getBenchmarkResults('test-model');
  assert.ok(Array.isArray(results), 'Should return array');
});

test('ObservatoryAdapter can be created and returns expected shape', async () => {
  const adapter = createObservatoryAdapter();

  assert.ok(adapter, 'Adapter should be created');
  assert.ok(typeof adapter.getDriftMetrics === 'function', 'Should have getDriftMetrics method');
  assert.ok(typeof adapter.getCurrentDrift === 'function', 'Should have getCurrentDrift method');

  const drift = await adapter.getCurrentDrift('test-model');
  assert.ok(typeof drift === 'number', 'Should return number');
});

test('SentinelAdapter can be created and returns expected shape', async () => {
  const adapter = createSentinelAdapter();

  assert.ok(adapter, 'Adapter should be created');
  assert.ok(typeof adapter.getAnomalies === 'function', 'Should have getAnomalies method');
  assert.ok(typeof adapter.checkForAnomalies === 'function', 'Should have checkForAnomalies method');

  const anomalies = await adapter.getAnomalies('test-model');
  assert.ok(Array.isArray(anomalies), 'Should return array');
});

test('LatencyLensAdapter can be created and returns expected shape', async () => {
  const adapter = createLatencyLensAdapter();

  assert.ok(adapter, 'Adapter should be created');
  assert.ok(typeof adapter.getPerformanceProfile === 'function', 'Should have getPerformanceProfile method');
  assert.ok(typeof adapter.getLatencyTrend === 'function', 'Should have getLatencyTrend method');

  const profile = await adapter.getPerformanceProfile('test-model');
  assert.ok(profile === null || typeof profile === 'object', 'Should return null or object');
});

test('AnalyticsHubAdapter can be created and returns expected shape', async () => {
  const adapter = createAnalyticsHubAdapter();

  assert.ok(adapter, 'Adapter should be created');
  assert.ok(typeof adapter.getAggregatedMetrics === 'function', 'Should have getAggregatedMetrics method');
  assert.ok(typeof adapter.getUsageTrend === 'function', 'Should have getUsageTrend method');

  const metrics = await adapter.getAggregatedMetrics('test-model');
  assert.ok(metrics === null || typeof metrics === 'object', 'Should return null or object');
});

test('SchemaRegistryAdapter can be created and returns expected shape', async () => {
  const adapter = createSchemaRegistryAdapter();

  assert.ok(adapter, 'Adapter should be created');
  assert.ok(typeof adapter.getSchema === 'function', 'Should have getSchema method');
  assert.ok(typeof adapter.listSchemas === 'function', 'Should have listSchemas method');
  assert.ok(typeof adapter.validateAgainstSchema === 'function', 'Should have validateAgainstSchema method');

  const schemas = await adapter.listSchemas();
  assert.ok(Array.isArray(schemas), 'Should return array');

  const validation = await adapter.validateAgainstSchema('test-schema', {});
  assert.ok(typeof validation.valid === 'boolean', 'Should return validation result');
});

test('All adapters work in simulator mode', async () => {
  const testBench = createTestBenchAdapter({ baseUrl: 'simulator' });
  const observatory = createObservatoryAdapter({ baseUrl: 'simulator' });
  const sentinel = createSentinelAdapter({ baseUrl: 'simulator' });
  const latencyLens = createLatencyLensAdapter({ baseUrl: 'simulator' });
  const analyticsHub = createAnalyticsHubAdapter({ baseUrl: 'simulator' });
  const schemaRegistry = createSchemaRegistryAdapter({ baseUrl: 'simulator' });

  assert.ok(testBench, 'TestBench adapter created in simulator mode');
  assert.ok(observatory, 'Observatory adapter created in simulator mode');
  assert.ok(sentinel, 'Sentinel adapter created in simulator mode');
  assert.ok(latencyLens, 'LatencyLens adapter created in simulator mode');
  assert.ok(analyticsHub, 'AnalyticsHub adapter created in simulator mode');
  assert.ok(schemaRegistry, 'SchemaRegistry adapter created in simulator mode');
});
