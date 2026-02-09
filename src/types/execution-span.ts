/**
 * Execution Span Instrumentation Types
 *
 * Defines the hierarchical span model required by agentics-execution-engine:
 *
 *   Core (type: "core")
 *     └─ Repo (type: "repo")  — one per adapter invocation
 *         └─ Agent (type: "agent") — from invoked Layer 2 repos
 *
 * All spans are append-only, JSON-serializable, and linked via parent_span_id.
 */

/** Unique span identifier (UUID v4) */
export type SpanId = string;

/** The three levels of the span hierarchy */
export type SpanType = 'core' | 'repo' | 'agent';

/** Outcome of a span's execution */
export type SpanStatus = 'ok' | 'error' | 'partial';

/**
 * An artifact produced at the lowest possible span level.
 * Evidence references are machine-verifiable via uri + sha256.
 */
export interface SpanArtifact {
  artifact_id: string;
  type: string;
  data: unknown;
  evidence: {
    uri: string;
    sha256: string;
  };
}

/**
 * A single execution span in the hierarchy.
 * Append-only: fields are set once at creation, with status/ended_at set at completion.
 */
export interface ExecutionSpan {
  span_id: SpanId;
  parent_span_id: SpanId | null;
  type: SpanType;
  name: string;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  status: SpanStatus;
  error?: string;
  artifacts: SpanArtifact[];
  metadata?: Record<string, unknown>;
}

/**
 * The complete execution graph returned from a core execution.
 * Fully hierarchical, append-only, JSON-serializable.
 */
export interface ExecutionGraph {
  execution_id: string;
  root_span_id: SpanId;
  spans: ExecutionSpan[];
  started_at: string;
  ended_at: string | null;
  status: SpanStatus;
  stats: {
    total_spans: number;
    core_spans: number;
    repo_spans: number;
    agent_spans: number;
    failed_spans: number;
  };
}

/**
 * Result contract for any core-level execution.
 * Wraps the original result data alongside the execution graph.
 * Conforms to the CoreExecutionResult contract defined by agentics-execution-engine.
 */
export interface CoreExecutionResult<T = unknown> {
  success: boolean;
  data: T | null;
  execution_graph: ExecutionGraph;
  error?: string;
}
