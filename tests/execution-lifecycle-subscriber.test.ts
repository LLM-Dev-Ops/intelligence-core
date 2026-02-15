import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { EventBus } from '../src/events/event-bus';
import { ExecutionLifecycleSubscriber } from '../src/subscribers/execution-lifecycle.subscriber';
import { QueryService } from '../src/services/query.service';
import type { ExecutionCompletedEvent } from '../src/events/event-bus';

function createTestEvent(overrides: Partial<ExecutionCompletedEvent> = {}): ExecutionCompletedEvent {
  return {
    timestamp: new Date(),
    operation: 'generateSummary',
    signals: [
      {
        source: 'telemetry',
        timestamp: new Date(),
        data: [
          { cpu: 45.5, memory: 2048, requests: 10000, errors: 5 },
        ],
      },
      {
        source: 'observatory',
        timestamp: new Date(),
        data: { driftDetected: false },
      },
      {
        source: 'benchmark',
        timestamp: new Date(),
        data: [{ score: 85 }],
      },
    ],
    summary: {
      timestamp: new Date(),
      driftAnalysis: {
        driftDetected: false,
        affectedSchemas: [],
        severity: 'low' as const,
        details: {},
      },
      performanceOverview: {
        avgLatency: 65,
        p95Latency: 120,
        p99Latency: 250,
        throughput: 1500,
        trends: {},
      },
      correlatedSignals: {
        benchmarks: [],
        telemetry: [],
        anomalies: [],
        correlations: [],
      },
      anomalies: [],
      summary: 'All systems nominal.',
    },
    driftAnalysis: {
      driftDetected: false,
      affectedSchemas: [],
      severity: 'low' as const,
      details: {},
    },
    performanceOverview: {
      avgLatency: 65,
      p95Latency: 120,
      p99Latency: 250,
      throughput: 1500,
      trends: {},
    },
    durationMs: 42,
    ...overrides,
  };
}

test('EventBus delivers execution_completed to subscriber', async () => {
  const bus = new EventBus();
  const query = new QueryService();
  const subscriber = new ExecutionLifecycleSubscriber(bus, query);

  await bus.emit('execution_completed', createTestEvent());

  const update = subscriber.getLatestAnalyticsUpdate();
  assert.ok(update, 'Should have an analytics update after event');
  assert.equal(update.operation, 'generateSummary');
  subscriber.dispose();
});

test('subscriber aggregates telemetry from signals', async () => {
  const bus = new EventBus();
  const query = new QueryService();
  const subscriber = new ExecutionLifecycleSubscriber(bus, query);

  await bus.emit('execution_completed', createTestEvent());

  const update = subscriber.getLatestAnalyticsUpdate()!;
  assert.equal(update.telemetry.signalCount, 3);
  assert.equal(update.telemetry.avgCpu, 45.5);
  assert.equal(update.telemetry.avgMemory, 2048);
  assert.equal(update.telemetry.totalRequests, 10000);
  assert.equal(update.telemetry.totalErrors, 5);
  assert.ok(update.telemetry.errorRate < 0.01, 'Error rate should be low');
  subscriber.dispose();
});

test('subscriber calculates drift from event', async () => {
  const bus = new EventBus();
  const query = new QueryService();
  const subscriber = new ExecutionLifecycleSubscriber(bus, query);

  await bus.emit('execution_completed', createTestEvent({
    driftAnalysis: {
      driftDetected: true,
      affectedSchemas: ['user-profile', 'api-response'],
      severity: 'high',
      details: { reason: 'schema migration' },
    },
  }));

  const update = subscriber.getLatestAnalyticsUpdate()!;
  assert.equal(update.drift.driftDetected, true);
  assert.equal(update.drift.severity, 'high');
  assert.equal(update.drift.affectedSchemaCount, 2);
  assert.deepEqual(update.drift.affectedSchemas, ['user-profile', 'api-response']);
  subscriber.dispose();
});

test('subscriber derives unhealthy status from high drift', async () => {
  const bus = new EventBus();
  const query = new QueryService();
  const subscriber = new ExecutionLifecycleSubscriber(bus, query);

  await bus.emit('execution_completed', createTestEvent({
    driftAnalysis: {
      driftDetected: true,
      affectedSchemas: ['schema-a'],
      severity: 'high',
      details: {},
    },
  }));

  const update = subscriber.getLatestAnalyticsUpdate()!;
  assert.equal(update.overallHealth, 'unhealthy');
  subscriber.dispose();
});

test('subscriber derives degraded status from low drift', async () => {
  const bus = new EventBus();
  const query = new QueryService();
  const subscriber = new ExecutionLifecycleSubscriber(bus, query);

  await bus.emit('execution_completed', createTestEvent({
    driftAnalysis: {
      driftDetected: true,
      affectedSchemas: ['schema-a'],
      severity: 'low',
      details: {},
    },
  }));

  const update = subscriber.getLatestAnalyticsUpdate()!;
  assert.equal(update.overallHealth, 'degraded');
  subscriber.dispose();
});

test('subscriber emits analytics update to query service', async () => {
  const bus = new EventBus();
  const query = new QueryService();
  const subscriber = new ExecutionLifecycleSubscriber(bus, query);

  await bus.emit('execution_completed', createTestEvent());

  const latest = query.getLatestSummary();
  assert.ok(latest, 'Summary should be stored in query service');
  assert.equal(latest.summary, 'All systems nominal.');

  const systems = query.getAvailableSystems();
  assert.ok(systems.length > 0, 'Should have stored signals by system');
  subscriber.dispose();
});

test('subscriber dispose stops receiving events', async () => {
  const bus = new EventBus();
  const query = new QueryService();
  const subscriber = new ExecutionLifecycleSubscriber(bus, query);

  subscriber.dispose();
  await bus.emit('execution_completed', createTestEvent());

  const update = subscriber.getLatestAnalyticsUpdate();
  assert.equal(update, null, 'Should not receive events after dispose');
});

test('EventBus supports multiple listeners', async () => {
  const bus = new EventBus();
  let count = 0;

  bus.on('execution_completed', () => { count++; });
  bus.on('execution_completed', () => { count++; });

  await bus.emit('execution_completed', createTestEvent());
  assert.equal(count, 2);

  bus.removeAllListeners();
});

test('subscriber returns null before any events', () => {
  const bus = new EventBus();
  const query = new QueryService();
  const subscriber = new ExecutionLifecycleSubscriber(bus, query);

  assert.equal(subscriber.getLatestAnalyticsUpdate(), null);
  subscriber.dispose();
});
