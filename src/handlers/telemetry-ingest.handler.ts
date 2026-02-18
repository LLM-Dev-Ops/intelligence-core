import { IncomingMessage } from 'http';

const TEST_BENCH_URL = process.env.TEST_BENCH_ENDPOINT
  || 'https://llm-test-bench-1062287243982.us-central1.run.app';
const OBSERVATORY_URL = process.env.OBSERVATORY_ENDPOINT
  || 'https://llm-observatory-1062287243982.us-central1.run.app';
const SENTINEL_URL = process.env.SENTINEL_ENDPOINT
  || 'https://llm-sentinel-1062287243982.us-central1.run.app';
const LATENCY_LENS_URL = process.env.LATENCY_LENS_ENDPOINT
  || 'https://llm-latency-lens-1062287243982.us-central1.run.app';
const ANALYTICS_HUB_URL = process.env.ANALYTICS_ENDPOINT
  || 'https://llm-analytics-hub-1062287243982.us-central1.run.app';

interface TelemetryPayload {
  source: string;
  event_type: string;
  execution_id: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

function parseBody(req: IncomingMessage): Promise<TelemetryPayload> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString());
        resolve(body as TelemetryPayload);
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function postJson(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const LAYER1_TARGETS = [
  { name: 'test-bench', url: () => `${TEST_BENCH_URL}/api/v1/telemetry` },
  { name: 'observatory', url: () => `${OBSERVATORY_URL}/api/v1/observations` },
  { name: 'sentinel', url: () => `${SENTINEL_URL}/api/v1/events` },
  { name: 'latency-lens', url: () => `${LATENCY_LENS_URL}/api/v1/metrics` },
  { name: 'analytics-hub', url: () => `${ANALYTICS_HUB_URL}/api/v1/events` },
];

export async function handleIngestTelemetry(
  req: IncomingMessage
): Promise<{ status: number; body: unknown }> {
  if (req.method !== 'POST') {
    return { status: 405, body: { error: 'Method not allowed' } };
  }

  let telemetry: TelemetryPayload;
  try {
    telemetry = await parseBody(req);
  } catch {
    return { status: 400, body: { error: 'Invalid JSON body' } };
  }

  console.log(
    `[telemetry-ingest] source=${telemetry.source} execution_id=${telemetry.execution_id}`
  );

  // Fire-and-forget fanout to Layer 1 services
  Promise.allSettled(
    LAYER1_TARGETS.map(({ name, url }) =>
      postJson(url(), telemetry).catch((err) => {
        console.warn(`[telemetry-ingest] fanout to ${name} failed:`, err);
        throw err;
      })
    )
  ).then((results) => {
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.warn(
          `[telemetry-ingest] ${LAYER1_TARGETS[i].name} rejected:`,
          result.reason
        );
      }
    });
  });

  return {
    status: 202,
    body: { status: 'accepted', execution_id: telemetry.execution_id },
  };
}
