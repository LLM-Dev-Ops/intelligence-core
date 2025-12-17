/**
 * Example: Using the Intelligence Core SDK
 *
 * This demonstrates the programmatic interface for accessing
 * intelligence summaries, drift analysis, performance metrics,
 * and signals from the LLM DevOps platform.
 */

import { create, IntelligenceCore } from '../src/lib';

async function main() {
  console.log('Intelligence Core SDK Example\n');

  // Create SDK instance
  const intelligence: IntelligenceCore = create();

  // Get latest intelligence summary
  console.log('1. Fetching intelligence summary...');
  const summary = await intelligence.getSummary();
  console.log('Summary:', JSON.stringify(summary, null, 2));
  console.log('');

  // Get drift analysis
  console.log('2. Fetching drift analysis...');
  const drift = await intelligence.getDrift();
  console.log('Drift Analysis:', JSON.stringify(drift, null, 2));
  console.log('');

  // Get performance overview
  console.log('3. Fetching performance overview...');
  const performance = await intelligence.getPerformance();
  console.log('Performance:', JSON.stringify(performance, null, 2));
  console.log('');

  // Query signals
  console.log('4. Querying signals...');
  const signals = await intelligence.querySignals();
  console.log('Signals:', JSON.stringify(signals, null, 2));
  console.log('');

  // Get available systems
  console.log('5. Fetching available systems...');
  const systems = await intelligence.getAvailableSystems();
  console.log('Available Systems:', systems);
  console.log('');

  // Query signals from specific system
  if (systems.length > 0) {
    console.log(`6. Querying signals from ${systems[0]}...`);
    const systemSignals = await intelligence.querySignals(systems[0], undefined, { limit: 5 });
    console.log(`${systems[0]} Signals:`, JSON.stringify(systemSignals, null, 2));
  }
}

main().catch(console.error);
