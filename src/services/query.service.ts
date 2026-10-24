/**
 * Query Service
 *
 * Read-only query interface for downstream consumers to access
 * intelligence summaries and system-specific signals.
 */

import type {
  IntelligenceSummary,
  IntelligenceSignal,
} from './intelligence-aggregator.service.js';

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

interface NormalizedQueryOptions {
  limit: number;
  offset: number;
  sortOrder: 'asc' | 'desc';
}

const DEFAULT_QUERY_LIMIT = 100;
export const MAX_QUERY_LIMIT = 1000;
export const MAX_SYSTEM_NAME_LENGTH = 128;

function normalizeOptions(options: QueryOptions): NormalizedQueryOptions {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('query options must be an object');
  }

  const limit = options.limit ?? DEFAULT_QUERY_LIMIT;
  const offset = options.offset ?? 0;
  const sortOrder = options.sortOrder ?? 'desc';

  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_QUERY_LIMIT) {
    throw new RangeError(`limit must be a safe integer between 1 and ${MAX_QUERY_LIMIT}`);
  }
  if (!Number.isSafeInteger(offset) || offset < 0) {
    throw new RangeError('offset must be a non-negative safe integer');
  }
  if (sortOrder !== 'asc' && sortOrder !== 'desc') {
    throw new TypeError("sortOrder must be either 'asc' or 'desc'");
  }

  return { limit, offset, sortOrder };
}

function validateTimeRange(timeRange: TimeRange): void {
  if (!timeRange || typeof timeRange !== 'object' || Array.isArray(timeRange)) {
    throw new TypeError('timeRange must be an object');
  }

  const start = timeRange.start;
  const end = timeRange.end;
  if (
    !(start instanceof Date) ||
    !(end instanceof Date) ||
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime())
  ) {
    throw new TypeError('timeRange start and end must be valid Date instances');
  }
  if (start.getTime() > end.getTime()) {
    throw new RangeError('timeRange start must not be after end');
  }
}

function validateSystemName(systemName: string): void {
  if (
    typeof systemName !== 'string' ||
    systemName.length === 0 ||
    systemName.length > MAX_SYSTEM_NAME_LENGTH ||
    /[\u0000-\u001f\u007f]/.test(systemName)
  ) {
    throw new TypeError(
      `systemName must be a non-empty printable string no longer than ${MAX_SYSTEM_NAME_LENGTH} characters`
    );
  }
}

export class QueryService {
  private summaries: IntelligenceSummary[] = [];
  private signalsBySystem: Map<string, IntelligenceSignal[]> = new Map();

  /**
   * Store a new intelligence summary (internal use)
   */
  storeSummary(summary: IntelligenceSummary): void {
    this.summaries.push(summary);
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
    validateTimeRange(timeRange);
    const { limit, offset, sortOrder } = normalizeOptions(options);

    const filtered = this.summaries.filter(
      summary =>
        summary.timestamp >= timeRange.start &&
        summary.timestamp <= timeRange.end
    );

    filtered.sort((a, b) =>
      sortOrder === 'asc'
        ? a.timestamp.getTime() - b.timestamp.getTime()
        : b.timestamp.getTime() - a.timestamp.getTime()
    );

    return filtered.slice(offset, offset + limit);
  }

  /**
   * Query signals from a specific system
   */
  queryBySystem(
    systemName: string,
    options: QueryOptions = {}
  ): SystemQueryResult {
    validateSystemName(systemName);
    const { limit, offset, sortOrder } = normalizeOptions(options);
    const allSignals = this.signalsBySystem.get(systemName) || [];
    const signals = [...allSignals];

    signals.sort((a, b) =>
      sortOrder === 'desc'
        ? b.timestamp.getTime() - a.timestamp.getTime()
        : a.timestamp.getTime() - b.timestamp.getTime()
    );

    return {
      system: systemName,
      signals: signals.slice(offset, offset + limit),
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
    validateSystemName(systemName);
    validateTimeRange(timeRange);
    const { limit, offset, sortOrder } = normalizeOptions(options);
    const allSignals = this.signalsBySystem.get(systemName) || [];

    const filtered = allSignals.filter(
      signal =>
        signal.timestamp >= timeRange.start &&
        signal.timestamp <= timeRange.end
    );

    filtered.sort((a, b) =>
      sortOrder === 'desc'
        ? b.timestamp.getTime() - a.timestamp.getTime()
        : a.timestamp.getTime() - b.timestamp.getTime()
    );

    return {
      system: systemName,
      signals: filtered.slice(offset, offset + limit),
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
