<div align="center">

<!-- Header Banner -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0d1117,50:161b22,100:1f6feb&height=220&section=header&text=Intelligence%20Core&fontSize=52&fontColor=ffffff&fontAlignY=35&desc=Layer%203%20%E2%80%A2%20Intelligence%20Aggregation%20%26%20Analysis&descSize=18&descAlignY=55&descColor=8b949e&animation=fadeIn" width="100%" />

# Intelligence Core

<br />

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-ES2022-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Zero Dependencies](https://img.shields.io/badge/Runtime_Deps-Zero-success?style=for-the-badge&logo=npm&logoColor=white)](#-tech-stack)
[![License](https://img.shields.io/badge/License-PSACL_v1.0-blue?style=for-the-badge&logo=brain&logoColor=white)](LICENSE.md)
[![Version](https://img.shields.io/badge/Version-0.1.0-orange?style=for-the-badge&logo=semver&logoColor=white)](package.json)

<br />

**The top-layer intelligence aggregation service in the LLM DevOps stack.**
<br />
Consumes data from all Layer 2 services to provide unified insights, health scoring, and actionable recommendations.

<br />

> **Proprietary Software** — This product is commercially licensed under the [PSACL v1.0](LICENSE.md).
> A valid license is required for production use. Contact **sales@globalbusinessadvisors.co** for licensing.

<br />

[📖 Getting Started](#-getting-started) •
[🏗️ Architecture](#%EF%B8%8F-architecture) •
[🔌 API Reference](#-api-reference) •
[💻 CLI Usage](#-cli-usage) •
[🧪 Testing](#-testing)

</div>

<br />

---

<br />

## 🎯 Overview

**Intelligence Core** is the brain of the LLM DevOps platform. It sits at **Layer 3** of the stack, aggregating and correlating signals from six Layer 2 services to generate unified intelligence about your LLM systems.

### ✨ Key Capabilities

| Capability | Description |
|:--|:--|
| 📊 **Data Aggregation** | Collects and unifies signals from all Layer 2 services |
| 🧠 **Intelligence Generation** | Analyzes patterns across benchmarks, telemetry, and anomalies |
| 💚 **Health Scoring** | Calculates overall system health metrics in real time |
| 📋 **Recommendations** | Provides actionable recommendations based on correlated analysis |
| 🔍 **Drift Detection** | Identifies schema drift and behavioral changes across systems |
| 📈 **Execution Instrumentation** | Hierarchical span tracing for full execution graph visibility |
| ⚡ **Reactive Lifecycle** | Event-driven subscriber pipeline for real-time reactive processing |

<br />

## 🛠️ Tech Stack

| Technology | Purpose |
|:--|:--|
| 🟦 **TypeScript 5.9** | Strict-mode type safety |
| 🟢 **Node.js (ES2022)** | Runtime environment |
| 📦 **Zero runtime dependencies** | Node.js built-ins only (`http`, `crypto`, `test`, `assert`) |
| ⚡ **tsx** | Fast TypeScript execution for development |
| 🏗️ **tsc** | TypeScript compiler for production builds |

<br />

## 🏗️ Architecture

Intelligence Core integrates with six canonical Layer 2 systems through thin adapter facades:

```
┌─────────────────────────────────────────────────────────────────┐
│                    🧠  INTELLIGENCE CORE (Layer 3)              │
│                                                                 │
│  ┌───────────┐  ┌──────────┐  ┌────────────┐  ┌─────────────┐  │
│  │ Aggregator│→ │ Correlator│→ │  Summarizer│→ │ Event Bus   │  │
│  │  Service  │  │          │  │            │  │ (Lifecycle) │  │
│  └─────┬─────┘  └──────────┘  └────────────┘  └──────┬──────┘  │
│        │                                              │         │
│        │         ┌──────────────┐                     ▼         │
│        │         │ Query Service│         ┌──────────────────┐  │
│        │         │  (Read-only) │         │   Subscribers    │  │
│        │         └──────────────┘         └──────────────────┘  │
├────────┼────────────────────────────────────────────────────────┤
│        ▼            ADAPTER LAYER                               │
│  ┌──────────┬──────────┬──────────┬──────────┬────────┬──────┐  │
│  │🔭 Observ-│⚡ Latency│🧪 Test- │📡 Tele- │📜 Schema│🛡️ Sen-│  │
│  │  atory   │  Lens    │  Bench   │  metry  │Registry│tinel │  │
│  └──────────┴──────────┴──────────┴──────────┴────────┴──────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                    Layer 2 Services
```

### 🔗 Layer 2 Integrations

| Service | Adapter | Provides |
|:--|:--|:--|
| 🔭 **Observatory** | `observatory.adapter.ts` | Health & drift metrics |
| ⚡ **Latency-Lens** | `latency-lens.adapter.ts` | Performance profiles & latency percentiles |
| 🧪 **Test-Bench** | `test-bench.adapter.ts` | Benchmark results & test scoring |
| 📡 **Telemetry** | `telemetry.adapter.ts` | System metrics (CPU, memory, errors) |
| 📜 **Schema-Registry** | `schema-registry.adapter.ts` | Contract validation & normalization |
| 🛡️ **Sentinel** | `sentinel.adapter.ts` | Anomaly detection & alerts |
| 📊 **Analytics-Hub** | `analytics-hub.adapter.ts` | Aggregated trends & analytics |

> 💡 All adapters are thin facades over the six canonical Phase 1/2 systems — no additional upstream systems are introduced by this core.

<br />

## 📂 Project Structure

```
intelligence-core/
├── 📁 src/
│   ├── 📁 adapters/          # Layer 2 service adapters
│   │   ├── observatory.adapter.ts
│   │   ├── latency-lens.adapter.ts
│   │   ├── benchmark.adapter.ts
│   │   ├── telemetry.adapter.ts
│   │   ├── schema-registry.adapter.ts
│   │   ├── sentinel.adapter.ts
│   │   ├── analytics-hub.adapter.ts
│   │   ├── instrumented-adapter.ts
│   │   └── mock-adapters.ts
│   ├── 📁 services/          # Business logic
│   │   ├── intelligence-aggregator.service.ts
│   │   ├── query.service.ts
│   │   ├── instrumented-aggregator.service.ts
│   │   ├── execution-span-builder.ts
│   │   └── execution-graph-validator.ts
│   ├── 📁 handlers/          # HTTP request handlers
│   │   ├── intelligence.handler.ts
│   │   └── telemetry-ingest.handler.ts
│   ├── 📁 events/            # Typed pub/sub event system
│   │   └── event-bus.ts
│   ├── 📁 subscribers/       # Lifecycle event subscribers
│   │   └── execution-lifecycle.subscriber.ts
│   ├── 📁 types/             # TypeScript type definitions
│   │   ├── index.ts
│   │   └── execution-span.ts
│   ├── cli.ts                # CLI entry point
│   ├── server.ts             # HTTP server
│   ├── sdk.ts                # SDK class & factory
│   └── lib.ts                # Library entry point
├── 📁 tests/                 # Test suite
├── 📁 examples/              # Usage examples
├── 📄 package.json
├── 📄 tsconfig.json
├── 📄 LICENSE.md
└── 📄 README.md
```

<br />

## 🚀 Getting Started

### 📜 Licensing

Intelligence Core is proprietary software. Usage is governed by the [PSACL v1.0](LICENSE.md).

| Use Case | License Required |
|:--|:--|
| Internal evaluation, testing, research | No — permitted under Non-Production Use |
| Production, commercial, hosted, or customer-facing use | **Yes** — paid commercial license required |
| Redistribution, forking, or republishing | **Prohibited** |

To obtain a commercial license, contact **sales@globalbusinessadvisors.co**.

### 📋 Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- A valid **commercial license** (for production use)

### ⬇️ Installation

Licensed customers receive access through private distribution. Follow the instructions provided with your license agreement.

```bash
# After obtaining repository access via your license agreement
cd intelligence-core

# Install dependencies
npm install
```

### 🔨 Build

```bash
npm run build
```

### ▶️ Start the Server

```bash
# Default port: 8080 (override with PORT env var)
npm start

# Verify it's running
curl http://localhost:8080/health
```

### 🧹 Clean

```bash
npm run clean
```

<br />

## 🔌 API Reference

Intelligence Core exposes a REST API with the following endpoints:

### v1 Endpoints

| Method | Endpoint | Description |
|:--|:--|:--|
| `GET` | `/health` | 💚 Service health check |
| `GET` | `/summary` | 📊 Intelligence summary |
| `GET` | `/drift` | 🔍 Drift analysis |
| `GET` | `/performance` | ⚡ Performance overview |
| `GET` | `/signals` | 📡 Query signals with filters |
| `POST` | `/v1/ingest/telemetry` | 📥 Telemetry ingestion |

### v2 Endpoints (Instrumented)

| Method | Endpoint | Description |
|:--|:--|:--|
| `GET` | `/v2/summary` | 📊 Summary with execution spans |
| `GET` | `/v2/drift` | 🔍 Drift with execution spans |
| `GET` | `/v2/performance` | ⚡ Performance with execution spans |

### 🔎 Signal Query Parameters

```
GET /signals?system=observatory&start=2025-01-01&end=2025-12-31&limit=10&offset=0
```

| Parameter | Type | Description |
|:--|:--|:--|
| `system` | `string` | Filter by Layer 2 system name |
| `start` | `ISO 8601` | Start time for range filter |
| `end` | `ISO 8601` | End time for range filter |
| `limit` | `number` | Max results to return |
| `offset` | `number` | Pagination offset |

<br />

## 💻 CLI Usage

Intelligence Core includes a CLI for quick access to intelligence data:

```bash
# Get a full intelligence summary
node dist/cli.js summary

# Analyze drift across systems
node dist/cli.js drift

# View performance overview
node dist/cli.js performance

# Query signals with filters
node dist/cli.js signals --system observatory --limit 5

# Output as JSON
node dist/cli.js signals --format json

# Show help
node dist/cli.js help
```

### 🎛️ CLI Options

| Option | Description |
|:--|:--|
| `--format` | Output format (`text` or `json`) |
| `--system` | Filter by Layer 2 system |
| `--limit` | Max results |
| `--offset` | Pagination offset |
| `--start-time` | Start of time range |
| `--end-time` | End of time range |

<br />

## 🔧 SDK Usage

Use Intelligence Core programmatically via the SDK. The package is distributed to licensed customers through private channels — see your license agreement for registry configuration.

```typescript
import { create } from '@llm-devops/intelligence-core';

const intelligence = create();

// 📊 Get intelligence summary
const summary = await intelligence.getSummary();

// 🔍 Get drift analysis
const drift = await intelligence.getDrift();

// 📡 Query signals from a specific system
const signals = await intelligence.querySignals('observatory');

// 📈 Instrumented versions (with execution span graphs)
const summaryWithSpans = await intelligence.getSummaryInstrumented();
const driftWithSpans = await intelligence.getDriftInstrumented();
const perfWithSpans = await intelligence.getPerformanceInstrumented();
```

<br />

## 🧪 Testing

```bash
# Run the full test suite
npm run build && npm test

# Run with tsx (no build step required)
npx tsx --test tests/**/*.test.ts

# Run individual test files
npx tsx --test tests/intelligence-aggregator.test.ts
npx tsx --test tests/execution-span.test.ts
npx tsx --test tests/execution-lifecycle-subscriber.test.ts
```

### 📝 Test Coverage

| Test File | Covers |
|:--|:--|
| `intelligence-aggregator.test.ts` | Core aggregation & correlation logic |
| `query.test.ts` | Query service filtering & pagination |
| `adapters.test.ts` | Layer 2 adapter contracts |
| `cli.test.ts` | CLI argument parsing & output |
| `execution-span.test.ts` | Span instrumentation & graph building |
| `execution-lifecycle-subscriber.test.ts` | Reactive lifecycle event processing |

<br />

## 📊 Project Stats

<div align="center">

| Metric | Value |
|:--|:--|
| 📏 Source Lines | ~2,000 LOC |
| 📄 Source Files | 32 TypeScript files |
| 🧪 Test Files | 6 test suites |
| 🔌 Adapters | 12 implementations |
| ⚙️ Services | 6 core services |
| 🌐 API Endpoints | 9 routes |
| 💻 CLI Commands | 5 commands |
| 📦 Runtime Deps | **Zero** |

</div>

<br />

## 📜 License

This project is proprietary software licensed under the **LLM DevOps Permanent Source-Available Commercial License (PSACL v1.0)**. This is **not** open-source software.

- Source code is viewable for evaluation and non-production use only
- Production, commercial, hosted, or embedded use requires a paid commercial license
- Redistribution, forking, and republishing are prohibited
- This license will **not** convert to an open-source license at any time

For commercial licensing inquiries, contact **sales@globalbusinessadvisors.co**.

© 2025 Global Business Advisors Inc. — See [LICENSE.md](LICENSE.md) for full terms.

<br />

<div align="center">

---

<br />

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0d1117,50:161b22,100:1f6feb&height=120&section=footer" width="100%" />

**Built with 🧠 by the LLM DevOps team**

</div>
