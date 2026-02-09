import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';

import { ExecutionGraphBuilder } from '../src/services/execution-span-builder';
import { validateExecutionGraph } from '../src/services/execution-graph-validator';
import { createInstrumentedAdapter } from '../src/adapters/instrumented-adapter';
import { InstrumentedAggregatorService } from '../src/services/instrumented-aggregator.service';
import { createMockAdapters } from '../src/adapters/mock-adapters';

// ── ExecutionGraphBuilder tests ──

test('ExecutionGraphBuilder creates core span on construction', () => {
  const builder = new ExecutionGraphBuilder('core:test');
  const graph = builder.build();

  assert.equal(graph.spans.length, 1);
  assert.equal(graph.spans[0].type, 'core');
  assert.equal(graph.spans[0].name, 'core:test');
  assert.equal(graph.spans[0].parent_span_id, null);
  assert.equal(graph.root_span_id, graph.spans[0].span_id);
});

test('ExecutionGraphBuilder creates correct core→repo→agent hierarchy', () => {
  const builder = new ExecutionGraphBuilder('core:test');
  const rootId = builder.getRootSpanId();

  const repoId = builder.startSpan(rootId, 'repo', 'repo:observatory');
  const agentId = builder.startSpan(repoId, 'agent', 'agent:observatory:getDriftMetrics');

  builder.endSpan(agentId, 'ok');
  builder.endSpan(repoId, 'ok');

  const graph = builder.build('ok');

  assert.equal(graph.spans.length, 3);

  const coreSpan = graph.spans.find(s => s.type === 'core')!;
  const repoSpan = graph.spans.find(s => s.type === 'repo')!;
  const agentSpan = graph.spans.find(s => s.type === 'agent')!;

  assert.equal(coreSpan.parent_span_id, null);
  assert.equal(repoSpan.parent_span_id, coreSpan.span_id);
  assert.equal(agentSpan.parent_span_id, repoSpan.span_id);
});

test('attachArtifact produces correct SHA-256 hash', () => {
  const builder = new ExecutionGraphBuilder('core:test');
  const rootId = builder.getRootSpanId();
  const spanId = builder.startSpan(rootId, 'agent', 'agent:test');

  const data = { key: 'value', count: 42 };
  builder.attachArtifact(spanId, 'test-artifact', 'application/json', data, 'test://uri');

  const graph = builder.build();
  const span = graph.spans.find(s => s.span_id === spanId)!;
  assert.equal(span.artifacts.length, 1);

  const artifact = span.artifacts[0];
  const expectedHash = createHash('sha256').update(JSON.stringify(data)).digest('hex');
  assert.equal(artifact.evidence.sha256, expectedHash);
  assert.equal(artifact.evidence.uri, 'test://uri');
  assert.equal(artifact.artifact_id, 'test-artifact');
});

test('endSpan sets duration_ms and ended_at', () => {
  const builder = new ExecutionGraphBuilder('core:test');
  const rootId = builder.getRootSpanId();
  const spanId = builder.startSpan(rootId, 'repo', 'repo:test');
  builder.endSpan(spanId, 'ok');

  const graph = builder.build();
  const span = graph.spans.find(s => s.span_id === spanId)!;

  assert.notEqual(span.ended_at, null);
  assert.notEqual(span.duration_ms, null);
  assert.ok(span.duration_ms! >= 0);
});

test('endSpan with error sets error field', () => {
  const builder = new ExecutionGraphBuilder('core:test');
  const rootId = builder.getRootSpanId();
  const spanId = builder.startSpan(rootId, 'repo', 'repo:test');
  builder.endSpan(spanId, 'error', 'something failed');

  const graph = builder.build();
  const span = graph.spans.find(s => s.span_id === spanId)!;
  assert.equal(span.status, 'error');
  assert.equal(span.error, 'something failed');
});

test('addAgentSpans creates agent children under repo span', () => {
  const builder = new ExecutionGraphBuilder('core:test');
  const rootId = builder.getRootSpanId();
  const repoId = builder.startSpan(rootId, 'repo', 'repo:test');

  builder.addAgentSpans(repoId, 'test-repo', [
    { name: 'agent:test-repo:op1', status: 'ok' },
    { operation: 'op2', status: 'ok' },
  ]);

  const graph = builder.build();
  const agentSpans = graph.spans.filter(s => s.type === 'agent');
  assert.equal(agentSpans.length, 2);
  assert.ok(agentSpans.every(s => s.parent_span_id === repoId));
});

test('build() computes correct stats', () => {
  const builder = new ExecutionGraphBuilder('core:test');
  const rootId = builder.getRootSpanId();

  const repo1 = builder.startSpan(rootId, 'repo', 'repo:a');
  const agent1 = builder.startSpan(repo1, 'agent', 'agent:a:1');
  builder.endSpan(agent1, 'ok');
  builder.endSpan(repo1, 'ok');

  const repo2 = builder.startSpan(rootId, 'repo', 'repo:b');
  const agent2 = builder.startSpan(repo2, 'agent', 'agent:b:1');
  builder.endSpan(agent2, 'error', 'fail');
  builder.endSpan(repo2, 'error', 'fail');

  const graph = builder.build('partial');

  assert.equal(graph.stats.total_spans, 5);
  assert.equal(graph.stats.core_spans, 1);
  assert.equal(graph.stats.repo_spans, 2);
  assert.equal(graph.stats.agent_spans, 2);
  assert.equal(graph.stats.failed_spans, 2);
});

test('ExecutionGraph is JSON-serializable without loss', () => {
  const builder = new ExecutionGraphBuilder('core:test');
  const rootId = builder.getRootSpanId();
  const repoId = builder.startSpan(rootId, 'repo', 'repo:test');
  const agentId = builder.startSpan(repoId, 'agent', 'agent:test:op');
  builder.attachArtifact(agentId, 'artifact-1', 'application/json', { x: 1 }, 'test://uri');
  builder.endSpan(agentId, 'ok');
  builder.endSpan(repoId, 'ok');

  const graph = builder.build('ok');
  const serialized = JSON.stringify(graph);
  const deserialized = JSON.parse(serialized);

  assert.equal(deserialized.execution_id, graph.execution_id);
  assert.equal(deserialized.root_span_id, graph.root_span_id);
  assert.equal(deserialized.spans.length, graph.spans.length);
  assert.equal(deserialized.status, 'ok');
  assert.deepStrictEqual(deserialized.stats, graph.stats);

  // Verify artifact evidence survives round-trip
  const agentSpan = deserialized.spans.find((s: { type: string }) => s.type === 'agent');
  assert.equal(agentSpan.artifacts.length, 1);
  assert.ok(/^[a-f0-9]{64}$/.test(agentSpan.artifacts[0].evidence.sha256));
});

// ── Validator tests ──

test('validateExecutionGraph fails with no repo spans', () => {
  const builder = new ExecutionGraphBuilder('core:test');
  const graph = builder.build();
  const result = validateExecutionGraph(graph);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('No repo-level child spans')));
});

test('validateExecutionGraph fails when repo span lacks agent children', () => {
  const builder = new ExecutionGraphBuilder('core:test');
  const rootId = builder.getRootSpanId();
  builder.startSpan(rootId, 'repo', 'repo:orphan');
  const graph = builder.build();
  const result = validateExecutionGraph(graph);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('no agent-level children')));
});

test('validateExecutionGraph passes for valid core→repo→agent hierarchy', () => {
  const builder = new ExecutionGraphBuilder('core:test');
  const rootId = builder.getRootSpanId();
  const repoId = builder.startSpan(rootId, 'repo', 'repo:test');
  const agentId = builder.startSpan(repoId, 'agent', 'agent:test:op');
  builder.attachArtifact(agentId, 'art-1', 'application/json', {}, 'test://uri');
  builder.endSpan(agentId, 'ok');
  builder.endSpan(repoId, 'ok');
  const graph = builder.build('ok');
  const result = validateExecutionGraph(graph);

  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

// ── Instrumented Adapter Proxy tests ──

test('createInstrumentedAdapter creates repo and agent spans per method call', async () => {
  const builder = new ExecutionGraphBuilder('core:test');
  const rootId = builder.getRootSpanId();

  const mockAdapter: Record<string, (...args: unknown[]) => Promise<unknown>> = {
    async getData() { return { value: 42 }; },
  };

  const instrumented = createInstrumentedAdapter(mockAdapter, 'mock-repo', builder, rootId);
  const result = await instrumented.getData();

  assert.deepStrictEqual(result, { value: 42 });

  const graph = builder.build();
  const repoSpans = graph.spans.filter(s => s.type === 'repo');
  const agentSpans = graph.spans.filter(s => s.type === 'agent');

  assert.equal(repoSpans.length, 1);
  assert.equal(repoSpans[0].name, 'repo:mock-repo');
  assert.equal(repoSpans[0].parent_span_id, rootId);

  assert.equal(agentSpans.length, 1);
  assert.equal(agentSpans[0].name, 'agent:mock-repo:getData');
  assert.equal(agentSpans[0].parent_span_id, repoSpans[0].span_id);
});

test('createInstrumentedAdapter handles errors and creates error spans', async () => {
  const builder = new ExecutionGraphBuilder('core:test');
  const rootId = builder.getRootSpanId();

  const failingAdapter: Record<string, (...args: unknown[]) => Promise<unknown>> = {
    async failOp() { throw new Error('adapter failure'); },
  };

  const instrumented = createInstrumentedAdapter(failingAdapter, 'fail-repo', builder, rootId);

  await assert.rejects(() => instrumented.failOp(), { message: 'adapter failure' });

  const graph = builder.build();
  const repoSpan = graph.spans.find(s => s.type === 'repo')!;
  const agentSpan = graph.spans.find(s => s.type === 'agent')!;

  assert.equal(repoSpan.status, 'error');
  assert.equal(repoSpan.error, 'adapter failure');
  assert.equal(agentSpan.status, 'error');
  assert.equal(agentSpan.error, 'adapter failure');
});

test('createInstrumentedAdapter detects InstrumentedAdapterResponse', async () => {
  const builder = new ExecutionGraphBuilder('core:test');
  const rootId = builder.getRootSpanId();

  const instrumentedRepoAdapter: Record<string, (...args: unknown[]) => Promise<unknown>> = {
    async fetchData() {
      return {
        data: { result: 'ok' },
        agent_spans: [
          { name: 'agent:real:fetchData', status: 'ok' as const },
        ],
      };
    },
  };

  const instrumented = createInstrumentedAdapter(instrumentedRepoAdapter, 'real-repo', builder, rootId);
  const result = await instrumented.fetchData();

  // Should unwrap and return just the data
  assert.deepStrictEqual(result, { result: 'ok' });

  const graph = builder.build();
  const agentSpans = graph.spans.filter(s => s.type === 'agent');
  assert.equal(agentSpans.length, 1);
  assert.equal(agentSpans[0].name, 'agent:real:fetchData');
});

// ── InstrumentedAggregatorService integration tests ──

test('InstrumentedAggregatorService.generateSummary returns valid CoreExecutionResult', async () => {
  const adapters = createMockAdapters();
  const service = new InstrumentedAggregatorService(
    adapters.observatory,
    adapters.latencyLens,
    adapters.schemaRegistry,
    adapters.benchmark,
    adapters.telemetry,
    adapters.anomaly
  );

  const result = await service.generateSummary();

  assert.equal(result.success, true);
  assert.ok(result.data);
  assert.ok(result.data.timestamp);
  assert.ok(result.data.driftAnalysis);
  assert.ok(result.data.performanceOverview);
  assert.ok(result.execution_graph);
  assert.equal(result.execution_graph.status, 'ok');

  // Verify hierarchy invariant
  assert.ok(result.execution_graph.stats.core_spans >= 1);
  assert.ok(result.execution_graph.stats.repo_spans >= 1);
  assert.ok(result.execution_graph.stats.agent_spans >= 1);

  // Verify validation passes
  const validation = validateExecutionGraph(result.execution_graph);
  assert.equal(validation.valid, true, `Validation errors: ${validation.errors.join('; ')}`);
});

test('InstrumentedAggregatorService.aggregateIntelligence produces repo spans for active adapters', async () => {
  const adapters = createMockAdapters();
  const service = new InstrumentedAggregatorService(
    adapters.observatory,
    adapters.latencyLens,
    adapters.schemaRegistry,
    adapters.benchmark,
    adapters.telemetry,
    adapters.anomaly
  );

  const result = await service.aggregateIntelligence();

  assert.equal(result.success, true);
  assert.ok(Array.isArray(result.data));

  // aggregateIntelligence calls adapters that have the expected methods.
  // MockLatencyLensAdapter lacks getPerformanceProfile, so only 4 adapters are invoked:
  // observatory, benchmark, telemetry, anomaly
  const repoSpans = result.execution_graph.spans.filter(s => s.type === 'repo');
  assert.ok(repoSpans.length >= 4, `Expected at least 4 repo spans, got ${repoSpans.length}`);

  // Every repo span must have at least one agent child
  for (const repo of repoSpans) {
    const agentChildren = result.execution_graph.spans.filter(
      s => s.type === 'agent' && s.parent_span_id === repo.span_id
    );
    assert.ok(agentChildren.length >= 1,
      `Repo span "${repo.name}" has no agent children`);
  }
});

test('InstrumentedAggregatorService.getDriftAnalysis produces repo span for observatory', async () => {
  const adapters = createMockAdapters();
  const service = new InstrumentedAggregatorService(
    adapters.observatory,
    adapters.latencyLens,
    adapters.schemaRegistry,
    adapters.benchmark,
    adapters.telemetry,
    adapters.anomaly
  );

  const result = await service.getDriftAnalysis();

  assert.equal(result.success, true);
  assert.ok(result.data);
  assert.equal(typeof result.data.driftDetected, 'boolean');

  const repoSpans = result.execution_graph.spans.filter(s => s.type === 'repo');
  assert.ok(repoSpans.some(s => s.name === 'repo:observatory'));
});

test('InstrumentedAggregatorService.getPerformanceOverview returns valid result', async () => {
  const adapters = createMockAdapters();
  const service = new InstrumentedAggregatorService(
    adapters.observatory,
    adapters.latencyLens,
    adapters.schemaRegistry,
    adapters.benchmark,
    adapters.telemetry,
    adapters.anomaly
  );

  const result = await service.getPerformanceOverview();

  // MockLatencyLensAdapter lacks getPerformanceProfile so no latency-lens
  // repo span is created; the method returns defaults. The graph may fail
  // validation if no repo spans exist (which is correct per the contract).
  assert.ok(result.execution_graph);
  assert.ok(result.data);
  assert.equal(typeof result.data.avgLatency, 'number');
});

test('execution graph is returned even on total failure', async () => {
  // Use adapters where every method throws
  const failingAdapter: Record<string, (...args: unknown[]) => Promise<unknown>> = {
    async getDriftMetrics() { throw new Error('total failure'); },
    async getPerformanceProfile() { throw new Error('total failure'); },
    async getLatestResults() { throw new Error('total failure'); },
    async getLatestMetrics() { throw new Error('total failure'); },
    async getLatestAnomalies() { throw new Error('total failure'); },
    async normalize() { throw new Error('total failure'); },
  };

  const service = new InstrumentedAggregatorService(
    failingAdapter, failingAdapter, failingAdapter,
    failingAdapter, failingAdapter, failingAdapter
  );

  const result = await service.getDriftAnalysis();

  // Must return an execution graph even on failure
  assert.ok(result.execution_graph);
  assert.equal(result.execution_graph.status, 'error');
  assert.equal(result.success, false);
  assert.ok(result.error);
});

test('spans are append-only during execution', () => {
  const builder = new ExecutionGraphBuilder('core:test');
  const rootId = builder.getRootSpanId();

  let prevLength = 1; // core span

  const repo1 = builder.startSpan(rootId, 'repo', 'repo:a');
  assert.ok(builder.build().spans.length > prevLength);
  prevLength = builder.build().spans.length;

  const agent1 = builder.startSpan(repo1, 'agent', 'agent:a:1');
  assert.ok(builder.build().spans.length > prevLength);
  prevLength = builder.build().spans.length;

  builder.endSpan(agent1, 'ok');
  builder.endSpan(repo1, 'ok');

  // Ending spans doesn't change array length
  assert.equal(builder.build().spans.length, prevLength);
});
