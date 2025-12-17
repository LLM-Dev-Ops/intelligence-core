# Intelligence Core Tests

Minimal test suite for the intelligence-core module.

## Test Files

1. **intelligence-aggregator.test.ts** (~88 LOC)
   - Tests aggregateIntelligence returns valid signals
   - Tests correlateSignals combines data correctly
   - Tests with mock adapter data

2. **query.test.ts** (~122 LOC)
   - Tests getLatestSummary returns summary
   - Tests queryByTimeRange filters correctly
   - Tests queryBySystem returns correct data
   - Tests limit and pagination options

3. **adapters.test.ts** (~94 LOC)
   - Tests each adapter can be created
   - Tests adapters return expected data shapes
   - Verifies simulator mode works

4. **cli.test.ts** (~109 LOC)
   - Tests CLI handlers work correctly
   - Tests handler initialization
   - Tests query and aggregation functionality

## Running Tests

The tests are simulator-compatible and use Node's built-in test framework.

### Using tsx (recommended):

```bash
npx tsx --test tests/*.test.ts
```

### Running individual test files:

```bash
npx tsx --test tests/adapters.test.ts
npx tsx --test tests/query.test.ts
npx tsx --test tests/cli.test.ts
npx tsx --test tests/intelligence-aggregator.test.ts
```

### Prerequisites:

```bash
npm install --save-dev tsx typescript @types/node
```

## Test Structure

All tests use:
- Node's built-in `node:test` module
- Node's built-in `node:assert` module (strict mode)
- Simple assertion-based testing (no external frameworks)
- TypeScript with ES modules

Tests are designed to be minimal and verify:
- Module compilation
- Basic functionality
- Simulator compatibility
- Expected data shapes and interfaces
