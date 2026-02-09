/**
 * Instrumented Adapter Proxy
 *
 * Wraps any GenericAdapter so that every method call automatically:
 * 1. Creates a repo-level span as a child of the given parent
 * 2. Invokes the underlying adapter method
 * 3. Extracts agent spans (if InstrumentedAdapterResponse) or synthesizes one
 * 4. Ends the repo span with success/error status
 *
 * The returned proxy is itself a GenericAdapter, so no changes to
 * IntelligenceAggregatorService are needed.
 */

import type { SpanId } from '../types/execution-span';
import type {
  ExecutionGraphBuilder,
  InstrumentedAdapterResponse,
} from '../services/execution-span-builder';

interface GenericAdapter {
  [key: string]: (...args: unknown[]) => Promise<unknown>;
}

export function createInstrumentedAdapter(
  adapter: GenericAdapter,
  repoName: string,
  graphBuilder: ExecutionGraphBuilder,
  parentSpanId: SpanId
): GenericAdapter {
  return new Proxy(adapter, {
    get(target, prop: string) {
      const original = target[prop];
      if (typeof original !== 'function') return original;

      return async (...args: unknown[]): Promise<unknown> => {
        const repoSpanId = graphBuilder.startSpan(
          parentSpanId,
          'repo',
          `repo:${repoName}`
        );

        try {
          const result = await original.apply(target, args);

          if (isInstrumentedResponse(result)) {
            graphBuilder.addAgentSpans(repoSpanId, repoName, result.agent_spans);
            graphBuilder.endSpan(repoSpanId, 'ok');
            return result.data;
          }

          // Synthesize agent span for non-instrumented (plain data) responses
          const agentSpanId = graphBuilder.startSpan(
            repoSpanId,
            'agent',
            `agent:${repoName}:${prop}`
          );
          graphBuilder.attachArtifact(
            agentSpanId,
            `${repoName}:${prop}:result`,
            'application/json',
            result,
            `adapter://${repoName}/${prop}`
          );
          graphBuilder.endSpan(agentSpanId, 'ok');
          graphBuilder.endSpan(repoSpanId, 'ok');

          return result;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const agentSpanId = graphBuilder.startSpan(
            repoSpanId,
            'agent',
            `agent:${repoName}:${prop}`
          );
          graphBuilder.endSpan(agentSpanId, 'error', message);
          graphBuilder.endSpan(repoSpanId, 'error', message);
          throw error;
        }
      };
    },
  });
}

function isInstrumentedResponse(value: unknown): value is InstrumentedAdapterResponse {
  return (
    value !== null &&
    typeof value === 'object' &&
    'data' in value &&
    'agent_spans' in value &&
    Array.isArray((value as InstrumentedAdapterResponse).agent_spans)
  );
}
