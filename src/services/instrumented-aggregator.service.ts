/**
 * Instrumented Aggregator Service
 *
 * Wraps IntelligenceAggregatorService to produce CoreExecutionResult
 * with a full hierarchical ExecutionGraph.
 *
 * For each operation:
 * 1. Creates an ExecutionGraphBuilder with a core span
 * 2. Wraps each adapter with instrumented proxy
 * 3. Constructs a new IntelligenceAggregatorService with wrapped adapters
 * 4. Runs the operation
 * 5. Validates the resulting graph
 * 6. Returns CoreExecutionResult<T>
 */

import { IntelligenceAggregatorService } from './intelligence-aggregator.service';
import type {
  IntelligenceSummary,
  IntelligenceSignal,
  DriftAnalysis,
  PerformanceOverview,
} from './intelligence-aggregator.service';
import { ExecutionGraphBuilder } from './execution-span-builder';
import { validateExecutionGraph } from './execution-graph-validator';
import { createInstrumentedAdapter } from '../adapters/instrumented-adapter';
import type { CoreExecutionResult } from '../types/execution-span';

interface GenericAdapter {
  [key: string]: (...args: unknown[]) => Promise<unknown>;
}

export class InstrumentedAggregatorService {
  constructor(
    private observatory: GenericAdapter,
    private latencyLens: GenericAdapter,
    private schemaRegistry: GenericAdapter,
    private benchmark: GenericAdapter,
    private telemetry: GenericAdapter,
    private anomaly: GenericAdapter
  ) {}

  async generateSummary(): Promise<CoreExecutionResult<IntelligenceSummary>> {
    return this.executeInstrumented('core:generateSummary', async (service) => {
      return service.generateSummary();
    });
  }

  async aggregateIntelligence(): Promise<CoreExecutionResult<IntelligenceSignal[]>> {
    return this.executeInstrumented('core:aggregateIntelligence', async (service) => {
      return service.aggregateIntelligence();
    });
  }

  async getDriftAnalysis(): Promise<CoreExecutionResult<DriftAnalysis>> {
    return this.executeInstrumented('core:getDriftAnalysis', async (service) => {
      return service.getDriftAnalysis();
    });
  }

  async getPerformanceOverview(): Promise<CoreExecutionResult<PerformanceOverview>> {
    return this.executeInstrumented('core:getPerformanceOverview', async (service) => {
      return service.getPerformanceOverview();
    });
  }

  private async executeInstrumented<T>(
    operationName: string,
    operation: (service: IntelligenceAggregatorService) => Promise<T>
  ): Promise<CoreExecutionResult<T>> {
    const builder = new ExecutionGraphBuilder(operationName);
    const rootSpanId = builder.getRootSpanId();

    const wrappedObservatory = createInstrumentedAdapter(
      this.observatory, 'observatory', builder, rootSpanId
    );
    const wrappedLatencyLens = createInstrumentedAdapter(
      this.latencyLens, 'latency-lens', builder, rootSpanId
    );
    const wrappedSchemaRegistry = createInstrumentedAdapter(
      this.schemaRegistry, 'schema-registry', builder, rootSpanId
    );
    const wrappedBenchmark = createInstrumentedAdapter(
      this.benchmark, 'benchmark', builder, rootSpanId
    );
    const wrappedTelemetry = createInstrumentedAdapter(
      this.telemetry, 'telemetry', builder, rootSpanId
    );
    const wrappedAnomaly = createInstrumentedAdapter(
      this.anomaly, 'anomaly', builder, rootSpanId
    );

    const instrumentedService = new IntelligenceAggregatorService(
      wrappedObservatory,
      wrappedLatencyLens,
      wrappedSchemaRegistry,
      wrappedBenchmark,
      wrappedTelemetry,
      wrappedAnomaly
    );

    try {
      const data = await operation(instrumentedService);
      const graph = builder.build('ok');
      const validation = validateExecutionGraph(graph);

      if (!validation.valid) {
        return {
          success: false,
          data,
          execution_graph: { ...graph, status: 'error' },
          error: `Execution graph validation failed: ${validation.errors.join('; ')}`,
        };
      }

      return { success: true, data, execution_graph: graph };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const graph = builder.build('error');
      return {
        success: false,
        data: null,
        execution_graph: graph,
        error: message,
      };
    }
  }
}
