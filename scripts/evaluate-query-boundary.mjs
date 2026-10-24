import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const [baseline, candidate, runtime, output] = process.argv.slice(2).map((value) => resolve(value));
assert.ok(
  baseline && candidate && runtime && output,
  'usage: node evaluate-query-boundary.mjs BASELINE CANDIDATE PINNED_TOOLS OUTPUT'
);

const packageVersion = (name) =>
  JSON.parse(readFileSync(join(runtime, 'node_modules', name, 'package.json'), 'utf8')).version;
assert.equal(packageVersion('@metaharness/flywheel'), '0.1.12');

const {
  makeSigner,
  meetsPromotionRule,
  runFlywheelGenerations,
  verifyReplayBundle,
} = await import(pathToFileURL(join(
  runtime,
  'node_modules/@metaharness/flywheel/dist/index.js'
)));

const holdoutSource = String.raw`
const { QueryService } = require('./src/services/query.service.ts');
const service = new QueryService();
const now = new Date();
const cases = [
  ['reversed range', () => service.queryByTimeRange({ start: new Date(now.getTime() + 1), end: now })],
  ['invalid date', () => service.queryByTimeRange({ start: new Date('bad'), end: now })],
  ['negative limit', () => service.queryBySystem('telemetry', { limit: -1 })],
  ['fractional limit', () => service.queryBySystem('telemetry', { limit: 1.5 })],
  ['oversize limit', () => service.queryBySystem('telemetry', { limit: 1001 })],
  ['negative offset', () => service.queryBySystem('telemetry', { offset: -1 })],
  ['unsafe offset', () => service.queryBySystem('telemetry', { offset: Number.MAX_SAFE_INTEGER + 1 })],
  ['invalid sort', () => service.queryBySystem('telemetry', { sortOrder: 'sideways' })],
  ['invalid system', () => service.queryBySystem('bad\\nname')],
];
const itemWins = cases.map(([, run]) => {
  try {
    run();
    return false;
  } catch {
    return true;
  }
});
process.stdout.write(JSON.stringify({ itemWins }));
`;

const measurements = [];
const run = (dir, argv) => {
  const child = spawnSync(argv[0], argv.slice(1), {
    cwd: dir,
    encoding: 'utf8',
    timeout: 120000,
    maxBuffer: 8 * 1024 * 1024,
  });
  assert.equal(child.signal, null, `${argv.join(' ')} timed out`);
  return {
    ok: child.status === 0,
    exit: child.status,
    stdout: child.stdout.slice(-5000),
    stderr: child.stderr.slice(-3000),
    argv,
  };
};

const evaluateHoldout = (dir) => {
  const command = run(dir, [process.execPath, '--import', 'tsx', '-e', holdoutSource]);
  assert.equal(command.exit, 0, command.stderr || command.stdout);
  return { itemWins: JSON.parse(command.stdout).itemWins, command };
};

const evaluateAnchors = (dir) => {
  const commands = [
    run(dir, ['npm', 'run', 'build']),
    run(dir, ['bash', '-lc', 'node --import tsx --test tests/*.test.ts']),
    run(dir, ['npm', 'audit', '--omit=dev', '--audit-level=low']),
  ];
  return { itemWins: commands.map((command) => command.ok), commands };
};

const evaluator = async (policy, suite) => {
  const dir = policy.implementation === 'candidate' ? candidate : baseline;
  const measurement = suite.id === 'query-boundary-holdout'
    ? evaluateHoldout(dir)
    : evaluateAnchors(dir);
  const wins = measurement.itemWins;
  const count = wins.filter(Boolean).length;
  measurements.push({
    implementation: policy.implementation,
    suite: suite.id,
    itemWins: wins,
    command: measurement.command,
    commands: measurement.commands,
  });
  return {
    primary: count / wins.length,
    noopRate: (wins.length - count) / wins.length,
    costPerWin: count === 0 ? 1 : 1 / count,
    regressed: suite.id === 'behavior-anchor' && count !== wins.length,
    itemWins: wins,
  };
};

const parentPath = join(baseline, 'src/services/query.service.ts');
const parentBytes = readFileSync(parentPath, 'utf8');
const result = await runFlywheelGenerations({
  rootPolicy: { implementation: 'baseline' },
  mutationTargets: ['implementation'],
  proposer: async () => ({
    value: 'candidate',
    summary: 'Validate query ranges, pagination, ordering, and system identifiers without regressing build, tests, or audit.',
    inverse: {
      path: 'src/services/query.service.ts',
      parentBytes,
      hash: createHash('sha256').update(parentBytes).digest('hex'),
    },
  }),
  evaluator,
  promotionRule: meetsPromotionRule,
  holdout: { id: 'query-boundary-holdout', items: Array.from({ length: 9 }, (_, index) => index) },
  anchor: { id: 'behavior-anchor', items: ['build', 'tests', 'production-audit'] },
  maxGenerations: 1,
  signer: makeSigner(),
  now: (generation) => `2026-10-24T00:10:0${generation}Z`,
  cacheEvaluations: true,
  dataSource: 'LIVE',
});

const replay = verifyReplayBundle(result.replayBundle);
assert.equal(replay.pass, true, JSON.stringify(replay));
assert.equal(result.promotions.length, 1, 'candidate must pass the frozen promotion gate');

const report = {
  schema: 1,
  versions: {
    flywheel: packageVersion('@metaharness/flywheel'),
    darwin: packageVersion('@metaharness/darwin'),
    metaharness: packageVersion('metaharness'),
  },
  suites: {
    holdout: [
      'reversed time range',
      'invalid date',
      'negative limit',
      'fractional limit',
      'oversize limit',
      'negative offset',
      'unsafe offset',
      'invalid sort order',
      'control character in system name',
    ],
    anchors: ['TypeScript build', '51 pre-existing plus boundary tests', 'production audit'],
  },
  measurements,
  liftCurve: result.liftCurve,
  promotions: result.promotions,
  replay,
  replayBundle: result.replayBundle,
  rollback: {
    strategy: 'Revert the PR or restore the signed inverse for query.service.ts.',
    parentSha: process.env.BASELINE_SHA || null,
    inverseSha256: createHash('sha256').update(parentBytes).digest('hex'),
  },
};
writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({
  promoted: result.promotions.length,
  replayPass: replay.pass,
  liftCurve: result.liftCurve,
  gateFingerprint: result.replayBundle.gateFingerprint,
  output,
}));
