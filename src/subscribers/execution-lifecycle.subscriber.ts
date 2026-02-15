/**
 * Execution Lifecycle Subscriber
 *
 * Subscribes to execution_completed events and performs:
 * 1. Telemetry aggregation - rolls up raw signal metrics into summary stats
 * 2. Drift calculation - computes drift delta from baseline across schemas
 * 3. Analytics emission - publishes computed analytics updates to the query layer
 */

import type { EventBus, ExecutionCompletedEvent } from '../events/event-bus';
import type { QueryService } from '../services/query.service';
import type { IntelligenceSignal } from '../services/intelligence-aggregator.service';

export interface TelemetryAggregate {
  timestamp: Date;
  signalCount: number;
  sourceBreakdown: Record<string, number>;
  avgCpu: number;
  avgMemory: number;
  totalRequests: number;
  totalErrors: number;
  errorRate: number;
}

export interface DriftDelta {
  timestamp: Date;
  driftDetected: boolean;
  severity: 'low' | 'medium' | 'high';
  affectedSchemaCount: number;
  affectedSchemas: string[];
}

export interface AnalyticsUpdate {
  timestamp: Date;
  operation: string;
  executionDurationMs: number;
  telemetry: TelemetryAggregate;
  drift: DriftDelta;
  overallHealth: 'healthy' | 'degraded' | 'unhealthy';
}

export class ExecutionLifecycleSubscriber {
  private latestUpdate: AnalyticsUpdate | null = null;

  constructor(
    private eventBus: EventBus,
    private queryService: QueryService
  ) {
    this.eventBus.on('execution_completed', this.handleExecutionCompleted);
  }

  private handleExecutionCompleted = async (
    event: ExecutionCompletedEvent
  ): Promise<void> => {
    const telemetry = this.aggregateTelemetry(event.signals);
    const drift = this.calculateDrift(event);
    const health = this.deriveHealth(telemetry, drift);

    const update: AnalyticsUpdate = {
      timestamp: event.timestamp,
      operation: event.operation,
      executionDurationMs: event.durationMs,
      telemetry,
      drift,
      overallHealth: health,
    };

    this.latestUpdate = update;
    this.emitAnalyticsUpdate(event, update);
  };

  /**
   * Aggregates raw telemetry signals into summary statistics.
   */
  private aggregateTelemetry(signals: IntelligenceSignal[]): TelemetryAggregate {
    const sourceBreakdown: Record<string, number> = {};
    let cpuSum = 0;
    let memorySum = 0;
    let totalRequests = 0;
    let totalErrors = 0;
    let telemetryCount = 0;

    for (const signal of signals) {
      sourceBreakdown[signal.source] = (sourceBreakdown[signal.source] || 0) + 1;

      if (signal.source === 'telemetry' && Array.isArray(signal.data)) {
        for (const metric of signal.data) {
          if (metric && typeof metric === 'object') {
            const m = metric as Record<string, unknown>;
            cpuSum += (m.cpu as number) || 0;
            memorySum += (m.memory as number) || 0;
            totalRequests += (m.requests as number) || 0;
            totalErrors += (m.errors as number) || 0;
            telemetryCount++;
          }
        }
      }
    }

    return {
      timestamp: new Date(),
      signalCount: signals.length,
      sourceBreakdown,
      avgCpu: telemetryCount > 0 ? cpuSum / telemetryCount : 0,
      avgMemory: telemetryCount > 0 ? memorySum / telemetryCount : 0,
      totalRequests,
      totalErrors,
      errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
    };
  }

  /**
   * Calculates drift delta from the execution result.
   */
  private calculateDrift(event: ExecutionCompletedEvent): DriftDelta {
    const analysis = event.driftAnalysis;

    if (!analysis) {
      return {
        timestamp: new Date(),
        driftDetected: false,
        severity: 'low',
        affectedSchemaCount: 0,
        affectedSchemas: [],
      };
    }

    return {
      timestamp: new Date(),
      driftDetected: analysis.driftDetected,
      severity: analysis.severity,
      affectedSchemaCount: analysis.affectedSchemas.length,
      affectedSchemas: [...analysis.affectedSchemas],
    };
  }

  /**
   * Derives overall health from telemetry and drift signals.
   */
  private deriveHealth(
    telemetry: TelemetryAggregate,
    drift: DriftDelta
  ): 'healthy' | 'degraded' | 'unhealthy' {
    if (drift.severity === 'high' || telemetry.errorRate > 0.05) {
      return 'unhealthy';
    }
    if (drift.driftDetected || telemetry.errorRate > 0.01) {
      return 'degraded';
    }
    return 'healthy';
  }

  /**
   * Emits the computed analytics update into the query layer
   * so downstream consumers can access the latest reactive state.
   */
  private emitAnalyticsUpdate(
    event: ExecutionCompletedEvent,
    update: AnalyticsUpdate
  ): void {
    if (event.summary) {
      this.queryService.storeSummary(event.summary);
    }
    if (event.signals.length > 0) {
      this.queryService.storeSignals(event.signals);
    }
  }

  /**
   * Returns the most recent analytics update, if any.
   */
  getLatestAnalyticsUpdate(): AnalyticsUpdate | null {
    return this.latestUpdate;
  }

  /**
   * Unsubscribes from all events.
   */
  dispose(): void {
    this.eventBus.off('execution_completed', this.handleExecutionCompleted);
  }
}
