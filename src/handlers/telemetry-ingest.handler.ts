import { IncomingMessage } from 'http';

const OBSERVATORY_URL = process.env.LLM_OBSERVATORY_URL
  || 'https://llm-observatory-1062287243982.us-central1.run.app';
const ANALYTICS_HUB_URL = process.env.LLM_ANALYTICS_HUB_URL
  || 'https://llm-analytics-hub-1062287243982.us-central1.run.app';
const SENTINEL_URL = process.env.LLM_SENTINEL_URL
  || 'https://llm-sentinel-prod-1062287243982.us-central1.run.app';
const LATENCY_LENS_URL = process.env.LLM_LATENCY_LENS_URL
  || 'https://llm-latency-lens-1062287243982.us-central1.run.app';

interface TelemetryPayload {
  event: string;
  source: string;
  timing?: number;
  [key: string]: unknown;
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

export async function handleIngestTelemetry(
  req: IncomingMessage
): Promise<{ status: number; body: unknown }> {
  if (req.method !== 'POST') {
    return { status: 405, body: { error: 'Method not allowed' } };
  }

  let payload: TelemetryPayload;
  try {
    payload = await parseBody(req);
  } catch {
    return { status: 400, body: { error: 'Invalid JSON body' } };
  }

  const timestamp = new Date().toISOString();
  const routed_to: string[] = ['observatory', 'analytics-hub', 'sentinel'];

  const forwards: Promise<unknown>[] = [
    postJson(`${OBSERVATORY_URL}/api/v1/telemetry/ingest`, payload),
    postJson(`${ANALYTICS_HUB_URL}/api/v1/events`, payload),
    postJson(`${SENTINEL_URL}/api/v1/events`, {
      event_type: payload.event,
      source: payload.source,
      data: payload,
      timestamp,
    }),
  ];

  if (payload.timing !== undefined) {
    routed_to.push('latency-lens');
    forwards.push(
      postJson(`${LATENCY_LENS_URL}/api/v1/metrics`, {
        source: payload.source,
        latency_ms: payload.timing,
        timestamp,
      })
    );
  }

  // Fire-and-forget: don't block the response
  Promise.allSettled(forwards).catch(() => {});

  return {
    status: 202,
    body: { accepted: true, routed_to },
  };
}
