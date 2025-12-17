#!/bin/bash

# Example: Using the Intelligence Core CLI
#
# This demonstrates the command-line interface for accessing
# intelligence summaries, drift analysis, performance metrics,
# and signals from the LLM DevOps platform.

echo "Intelligence Core CLI Examples"
echo "=============================="
echo ""

# Show help
echo "1. Show help:"
node dist/cli.js help
echo ""

# Get summary
echo "2. Get intelligence summary (JSON format):"
node dist/cli.js summary --format json
echo ""

# Get drift analysis
echo "3. Get drift analysis:"
node dist/cli.js drift
echo ""

# Get performance overview
echo "4. Get performance overview:"
node dist/cli.js performance
echo ""

# Query signals
echo "5. Query signals (default):"
node dist/cli.js signals
echo ""

# Query signals with limit
echo "6. Query signals with limit:"
node dist/cli.js signals --limit 5
echo ""

# Query signals from specific system
echo "7. Query signals from observatory system:"
node dist/cli.js signals --system observatory --limit 10
echo ""

# Query signals with time range
echo "8. Query signals with time range:"
node dist/cli.js signals \
  --start-time "2025-01-01T00:00:00Z" \
  --end-time "2025-12-31T23:59:59Z" \
  --limit 20
echo ""

echo "Examples completed!"
