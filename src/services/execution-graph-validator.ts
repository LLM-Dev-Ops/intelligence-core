/**
 * Execution Graph Validator
 *
 * Enforces the mandatory failure semantics from the agentics-execution-engine contract:
 *
 * MUST FAIL if:
 *  - No repo-level child spans exist
 *  - Any repo span has zero agent-level children
 *  - Any artifact evidence is not machine-verifiable
 */

import type { ExecutionGraph } from '../types/execution-span';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateExecutionGraph(graph: ExecutionGraph): ValidationResult {
  const errors: string[] = [];

  const repoSpans = graph.spans.filter(s => s.type === 'repo');
  if (repoSpans.length === 0) {
    errors.push('No repo-level child spans found in execution graph');
  }

  for (const repoSpan of repoSpans) {
    const agentChildren = graph.spans.filter(
      s => s.type === 'agent' && s.parent_span_id === repoSpan.span_id
    );
    if (agentChildren.length === 0) {
      errors.push(
        `Repo span "${repoSpan.name}" (${repoSpan.span_id}) has no agent-level children`
      );
    }
  }

  const agentSpans = graph.spans.filter(s => s.type === 'agent');
  for (const agentSpan of agentSpans) {
    for (const artifact of agentSpan.artifacts) {
      if (!artifact.evidence.uri || !artifact.evidence.sha256) {
        errors.push(
          `Artifact "${artifact.artifact_id}" on span "${agentSpan.name}" lacks machine-verifiable evidence`
        );
      }
      if (artifact.evidence.sha256 && !/^[a-f0-9]{64}$/.test(artifact.evidence.sha256)) {
        errors.push(
          `Artifact "${artifact.artifact_id}" has invalid SHA-256 hash: ${artifact.evidence.sha256}`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
