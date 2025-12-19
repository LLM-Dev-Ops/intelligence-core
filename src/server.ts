import { createServer, IncomingMessage, ServerResponse } from 'http';
import {
  handleGetSummary,
  handleGetDrift,
  handleGetPerformance,
  handleQuerySignals,
  initializeHandlers,
} from './handlers';
import { IntelligenceAggregatorService, QueryService } from './services';
import { createMockAdapters } from './adapters';

const PORT = parseInt(process.env.PORT || '8080', 10);

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function parseUrl(url: string): { pathname: string; params: URLSearchParams } {
  const [pathname, query] = url.split('?');
  return { pathname: pathname || '/', params: new URLSearchParams(query || '') };
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const { pathname, params } = parseUrl(req.url || '/');

  try {
    switch (pathname) {
      case '/':
      case '/health':
        sendJson(res, 200, {
          status: 'healthy',
          service: 'intelligence-core',
          version: process.env.npm_package_version || 'unknown'
        });
        break;

      case '/summary':
        sendJson(res, 200, await handleGetSummary());
        break;

      case '/drift':
        sendJson(res, 200, await handleGetDrift());
        break;

      case '/performance':
        sendJson(res, 200, await handleGetPerformance());
        break;

      case '/signals': {
        const system = params.get('system') || undefined;
        const startTime = params.get('start');
        const endTime = params.get('end');
        const limit = params.get('limit');
        const offset = params.get('offset');

        const timeRange =
          startTime && endTime
            ? { start: new Date(startTime), end: new Date(endTime) }
            : undefined;

        const options = {
          limit: limit ? parseInt(limit, 10) : undefined,
          offset: offset ? parseInt(offset, 10) : undefined,
        };

        sendJson(res, 200, await handleQuerySignals(system, timeRange, options));
        break;
      }

      default:
        sendJson(res, 404, { error: 'Not found' });
    }
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : 'Internal server error' });
  }
}

async function main(): Promise<void> {
  // Initialize services with mock adapters
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

  // Generate and store initial data
  const summary = await aggregator.generateSummary();
  query.storeSummary(summary);
  const signals = await aggregator.aggregateIntelligence();
  query.storeSignals(signals);

  initializeHandlers(aggregator, query);

  const server = createServer((req, res) => {
    handleRequest(req, res).catch((err) => {
      console.error('Request error:', err);
      sendJson(res, 500, { error: 'Internal server error' });
    });
  });

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
