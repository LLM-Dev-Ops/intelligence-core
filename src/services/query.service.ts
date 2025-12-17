/**
 * Query Service
 *
 * Read-only query interface for downstream consumers to access
 * intelligence summaries and system-specific signals.
 */

import { IntelligenceSummary, IntelligenceSignal } from './intelligence-aggregator.service.js';

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  sortOrder?: 'asc' | 'desc';
}

export interface SystemQueryResult {
  system: string;
  signals: IntelligenceSignal[];
  count: number;
}

export class QueryService {
  private summaries: IntelligenceSummary[] = [];
  private signalsBySystem: Map<string, IntelligenceSignal[]> = new Map();

  constructor() {}

  /**
   * Store a new intelligence summary (internal use)
   */
  storeSummary(summary: IntelligenceSummary): void {
    this.summaries.push(summary);

    // Sort by timestamp descending (most recent first)
    this.summaries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Store signals by system (internal use)
   */
  storeSignals(signals: IntelligenceSignal[]): void {
    for (const signal of signals) {
      const existing = this.signalsBySystem.get(signal.source) || [];
      existing.push(signal);
      this.signalsBySystem.set(signal.source, existing);
    }
  }

  /**
   * Returns the most recent intelligence summary
   */
  getLatestSummary(): IntelligenceSummary | null {
    return this.summaries.length > 0 ? this.summaries[0] : null;
  }

  /**
   * Query historical summaries within a time range
   */
  queryByTimeRange(
    timeRange: TimeRange,
    options: QueryOptions = {}
  ): IntelligenceSummary[] {
    const { limit = 100, offset = 0, sortOrder = 'desc' } = options;

    let filtered = this.summaries.filter(
      summary =>
        summary.timestamp >= timeRange.start &&
        summary.timestamp <= timeRange.end
    );

    // Apply sort order
    if (sortOrder === 'asc') {
      filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    // Apply pagination
    return filtered.slice(offset, offset + limit);
  }

  /**
   * Query signals from a specific system
   */
  queryBySystem(
    systemName: string,
    options: QueryOptions = {}
  ): SystemQueryResult {
    const { limit = 100, offset = 0, sortOrder = 'desc' } = options;

    const allSignals = this.signalsBySystem.get(systemName) || [];

    let signals = [...allSignals];

    // Sort by timestamp
    if (sortOrder === 'desc') {
      signals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } else {
      signals.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    // Apply pagination
    const paginatedSignals = signals.slice(offset, offset + limit);

    return {
      system: systemName,
      signals: paginatedSignals,
      count: allSignals.length
    };
  }

  /**
   * Query signals from a specific system within a time range
   */
  queryBySystemAndTimeRange(
    systemName: string,
    timeRange: TimeRange,
    options: QueryOptions = {}
  ): SystemQueryResult {
    const { limit = 100, offset = 0, sortOrder = 'desc' } = options;

    const allSignals = this.signalsBySystem.get(systemName) || [];

    let filtered = allSignals.filter(
      signal =>
        signal.timestamp >= timeRange.start &&
        signal.timestamp <= timeRange.end
    );

    // Sort by timestamp
    if (sortOrder === 'desc') {
      filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } else {
      filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    // Apply pagination
    const paginatedSignals = filtered.slice(offset, offset + limit);

    return {
      system: systemName,
      signals: paginatedSignals,
      count: filtered.length
    };
  }

  /**
   * Get all available system names
   */
  getAvailableSystems(): string[] {
    return Array.from(this.signalsBySystem.keys());
  }

  /**
   * Clear all stored data (useful for testing/simulation)
   */
  clear(): void {
    this.summaries = [];
    this.signalsBySystem.clear();
  }
}
