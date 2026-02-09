/**
 * Execution Graph Builder
 *
 * Accumulates execution spans in append-only order to produce
 * a fully hierarchical ExecutionGraph.
 */

import { randomUUID, createHash } from 'node:crypto';
import type {
  SpanId,
  SpanType,
  SpanStatus,
  ExecutionSpan,
  ExecutionGraph,
} from '../types/execution-span';

/**
 * Input structure for agent spans returned by repos/adapters.
 * Adapters that support instrumentation natively return these.
 */
export interface AgentSpanInput {
  name?: string;
  operation?: string;
  status?: SpanStatus;
  error?: string;
  artifacts?: Array<{
    artifact_id: string;
    type: string;
    data: unknown;
    evidence_uri: string;
  }>;
}

/**
 * Extended adapter response that includes agent span data.
 * Adapters return this shape so the instrumentation layer can extract spans.
 */
export interface InstrumentedAdapterResponse {
  data: unknown;
  agent_spans: AgentSpanInput[];
}

/**
 * Builds an ExecutionGraph by accumulating spans in append-only order.
 */
export class ExecutionGraphBuilder {
  private readonly executionId: string;
  private readonly rootSpanId: SpanId;
  private readonly spans: ExecutionSpan[] = [];
  private readonly startedAt: string;

  constructor(rootSpanName: string) {
    this.executionId = randomUUID();
    this.rootSpanId = randomUUID();
    this.startedAt = new Date().toISOString();

    this.spans.push({
      span_id: this.rootSpanId,
      parent_span_id: null,
      type: 'core',
      name: rootSpanName,
      started_at: this.startedAt,
      ended_at: null,
      duration_ms: null,
      status: 'ok',
      artifacts: [],
    });
  }

  getRootSpanId(): SpanId {
    return this.rootSpanId;
  }

  /**
   * Create a new child span and append it to the graph.
   * Returns the new span_id.
   */
  startSpan(parentSpanId: SpanId, type: SpanType, name: string): SpanId {
    const spanId = randomUUID();
    this.spans.push({
      span_id: spanId,
      parent_span_id: parentSpanId,
      type,
      name,
      started_at: new Date().toISOString(),
      ended_at: null,
      duration_ms: null,
      status: 'ok',
      artifacts: [],
    });
    return spanId;
  }

  /**
   * End a span, setting ended_at, duration_ms, and status.
   */
  endSpan(spanId: SpanId, status: SpanStatus, error?: string): void {
    const span = this.spans.find(s => s.span_id === spanId);
    if (!span) return;
    const endedAt = new Date();
    span.ended_at = endedAt.toISOString();
    span.duration_ms = endedAt.getTime() - new Date(span.started_at).getTime();
    span.status = status;
    if (error) span.error = error;
  }

  /**
   * Attach an artifact to a span with machine-verifiable SHA-256 evidence.
   */
  attachArtifact(
    spanId: SpanId,
    artifactId: string,
    type: string,
    data: unknown,
    evidenceUri: string
  ): void {
    const span = this.spans.find(s => s.span_id === spanId);
    if (!span) return;
    const serialized = JSON.stringify(data);
    const sha256 = createHash('sha256').update(serialized).digest('hex');
    span.artifacts.push({
      artifact_id: artifactId,
      type,
      data,
      evidence: { uri: evidenceUri, sha256 },
    });
  }

  /**
   * Add agent-level spans from a repo's response into the graph.
   */
  addAgentSpans(
    repoSpanId: SpanId,
    repoName: string,
    agentSpans: AgentSpanInput[]
  ): void {
    for (const agent of agentSpans) {
      const agentSpanId = this.startSpan(
        repoSpanId,
        'agent',
        agent.name || `agent:${repoName}:${agent.operation || 'unknown'}`
      );
      if (agent.artifacts) {
        for (const artifact of agent.artifacts) {
          this.attachArtifact(
            agentSpanId,
            artifact.artifact_id,
            artifact.type,
            artifact.data,
            artifact.evidence_uri
          );
        }
      }
      this.endSpan(agentSpanId, agent.status || 'ok', agent.error);
    }
  }

  /**
   * Finalize the root span and build the ExecutionGraph.
   */
  build(overallStatus?: SpanStatus): ExecutionGraph {
    const rootSpan = this.spans[0];
    if (!rootSpan.ended_at) {
      this.endSpan(this.rootSpanId, overallStatus || rootSpan.status);
    }

    const stats = {
      total_spans: this.spans.length,
      core_spans: this.spans.filter(s => s.type === 'core').length,
      repo_spans: this.spans.filter(s => s.type === 'repo').length,
      agent_spans: this.spans.filter(s => s.type === 'agent').length,
      failed_spans: this.spans.filter(s => s.status === 'error').length,
    };

    return {
      execution_id: this.executionId,
      root_span_id: this.rootSpanId,
      spans: [...this.spans],
      started_at: this.startedAt,
      ended_at: rootSpan.ended_at,
      status: overallStatus || rootSpan.status,
      stats,
    };
  }
}
