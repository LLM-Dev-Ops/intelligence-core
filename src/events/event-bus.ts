/**
 * Event Bus
 *
 * Typed publish/subscribe event bus for lifecycle events.
 * Enables reactive subscribers to respond to execution lifecycle
 * transitions without coupling to the aggregation pipeline.
 */

import type {
  IntelligenceSignal,
  IntelligenceSummary,
  DriftAnalysis,
  PerformanceOverview,
} from '../services/intelligence-aggregator.service';

export interface ExecutionCompletedEvent {
  timestamp: Date;
  operation: string;
  signals: IntelligenceSignal[];
  summary: IntelligenceSummary | null;
  driftAnalysis: DriftAnalysis | null;
  performanceOverview: PerformanceOverview | null;
  durationMs: number;
}

export interface LifecycleEventMap {
  execution_completed: ExecutionCompletedEvent;
}

export type LifecycleEventName = keyof LifecycleEventMap;
export type LifecycleEventHandler<E extends LifecycleEventName> = (
  event: LifecycleEventMap[E]
) => void | Promise<void>;

export class EventBus {
  private listeners = new Map<string, Array<(...args: unknown[]) => void | Promise<void>>>();

  on<E extends LifecycleEventName>(
    event: E,
    handler: LifecycleEventHandler<E>
  ): void {
    const handlers = this.listeners.get(event) || [];
    handlers.push(handler as (...args: unknown[]) => void | Promise<void>);
    this.listeners.set(event, handlers);
  }

  off<E extends LifecycleEventName>(
    event: E,
    handler: LifecycleEventHandler<E>
  ): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    const index = handlers.indexOf(handler as (...args: unknown[]) => void | Promise<void>);
    if (index !== -1) handlers.splice(index, 1);
  }

  async emit<E extends LifecycleEventName>(
    event: E,
    payload: LifecycleEventMap[E]
  ): Promise<void> {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    for (const handler of handlers) {
      await handler(payload);
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}
