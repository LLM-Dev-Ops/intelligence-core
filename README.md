# LLM DevOps Intelligence Core

**Layer 3 - Intelligence Aggregation & Analysis**

## Overview

Intelligence Core is the top-layer intelligence aggregation service in the LLM DevOps stack. It consumes data from all Layer 2 services to provide unified insights, health scoring, and actionable recommendations.

## Architecture

### Layer 2 Integrations

- **Test-Bench**: Benchmark signals and test results
- **Observatory**: Telemetry snapshots and service health
- **Sentinel**: Anomaly alerts and detection signals
- **Latency-Lens**: Performance profiles and latency metrics
- **Analytics-Hub**: Aggregated analytics and trends
- **Schema-Registry**: Schema contracts and validation

### Core Responsibilities

1. **Data Aggregation**: Collect and unify signals from all Layer 2 services
2. **Intelligence Generation**: Analyze patterns and generate insights
3. **Health Scoring**: Calculate overall system health metrics
4. **Recommendations**: Provide actionable recommendations based on analysis

## Project Structure

```
intelligence-core/
├── src/
│   ├── handlers/       # Request handlers
│   ├── services/       # Business logic services
│   ├── adapters/       # Layer 2 service adapters
│   ├── types/          # TypeScript type definitions
├── tests/              # Test files
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Clean

```bash
npm run clean
```

## License

See LICENSE file for details.
