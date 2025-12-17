#!/usr/bin/env node

import {
  handleGetSummary,
  handleGetDrift,
  handleGetPerformance,
  handleQuerySignals,
  initializeHandlers,
} from './handlers';
import { IntelligenceAggregatorService, QueryService } from './services';
import { createMockAdapters } from './adapters';

type OutputFormat = 'json' | 'table' | 'csv';

interface CLIOptions {
  format?: OutputFormat;
  system?: string;
  limit?: number;
  offset?: number;
  startTime?: string;
  endTime?: string;
}

function parseArgs(args: string[]): { command: string; options: CLIOptions } {
  const command = args[0] || 'help';
  const options: CLIOptions = {};

  for (let i = 1; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];

    if (key === 'format') options.format = value as OutputFormat;
    else if (key === 'system') options.system = value;
    else if (key === 'limit') options.limit = parseInt(value, 10);
    else if (key === 'offset') options.offset = parseInt(value, 10);
    else if (key === 'start-time') options.startTime = value;
    else if (key === 'end-time') options.endTime = value;
  }

  return { command, options };
}

function formatOutput(data: unknown, format: OutputFormat = 'json'): string {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  } else if (format === 'table') {
    return `Table format not yet implemented. Data: ${JSON.stringify(data)}`;
  } else if (format === 'csv') {
    return `CSV format not yet implemented. Data: ${JSON.stringify(data)}`;
  }
  return JSON.stringify(data);
}

function showHelp(): void {
  console.log(`
Intelligence Core CLI

Usage:
  intelligence-core <command> [options]

Commands:
  summary       Get latest intelligence summary
  drift         Get drift analysis
  performance   Get performance overview
  signals       Query signals with optional filters

Options:
  --format      Output format: json (default), table, csv
  --system      Filter signals by system name
  --limit       Limit number of results (default: 10)
  --offset      Offset for pagination (default: 0)
  --start-time  Start time for query (ISO 8601)
  --end-time    End time for query (ISO 8601)

Examples:
  intelligence-core summary --format json
  intelligence-core drift
  intelligence-core performance
  intelligence-core signals --system observatory --limit 20
  intelligence-core signals --start-time 2025-01-01T00:00:00Z --end-time 2025-01-02T00:00:00Z
  `);
}

async function main() {
  const args = process.argv.slice(2);
  const { command, options } = parseArgs(args);

  // Initialize services with mock adapters for simulator compatibility
  const adapters = createMockAdapters();
  const aggregator = new IntelligenceAggregatorService(
    adapters.observatory,
    adapters.latencyLens,
    adapters.schemaRegistry,
    adapters.benchmark,
    adapters.telemetry,
    adapters.anomaly
  );
  const query = new QueryService();

  // Generate and store initial data for simulation
  const summary = await aggregator.generateSummary();
  query.storeSummary(summary);
  const signals = await aggregator.aggregateIntelligence();
  query.storeSignals(signals);

  initializeHandlers(aggregator, query);

  try {
    let result: unknown;

    switch (command) {
      case 'summary':
        result = await handleGetSummary();
        break;
      case 'drift':
        result = await handleGetDrift();
        break;
      case 'performance':
        result = await handleGetPerformance();
        break;
      case 'signals': {
        const timeRange =
          options.startTime && options.endTime
            ? {
                start: new Date(options.startTime),
                end: new Date(options.endTime),
              }
            : undefined;
        result = await handleQuerySignals(options.system, timeRange, {
          limit: options.limit,
          offset: options.offset,
        });
        break;
      }
      case 'help':
      default:
        showHelp();
        return;
    }

    console.log(formatOutput(result, options.format));
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();

export { main };
