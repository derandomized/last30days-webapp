# Last30Days Webapp

A web viewer for [Last30Days](https://github.com/mvanhorn/last30days-skill) research reports. Browse Reddit, X/Twitter, YouTube, and Hacker News sources with AI-powered executive summaries.

## Features

- **Source browser** — Reddit, X, YouTube, HN items as styled cards with thumbnails, engagement metrics, and direct links
- **Collapsible sidebar** — Twitter/X-style navigation
- **AI summaries** — Claude-powered executive briefs with key takeaways and actionable follow-ups
- **New research runs** — Kick off Last30Days research directly from the UI
- **Refresh button** — Re-parse data without touching the CLI

## Prerequisites

- [Last30Days skill](https://github.com/mvanhorn/last30days-skill) installed (for data collection)
- Node.js 18+
- Python 3.10+
- Anthropic API key (optional, for AI summaries)

## Setup

```bash
# Install webapp dependencies
npm install

# Copy env template and add your Anthropic API key (optional, for summaries)
cp .env.local.example .env.local
# Edit .env.local with your ANTHROPIC_API_KEY

# Run a research query to generate data
python3 scripts/run-last30days.py "NVDA stock"

# Parse the results into JSON for the webapp
python3 scripts/parse-last30days.py

# Start the dev server
npm run dev -- -p 7777
```

Open http://localhost:7777

## Scripts

### `scripts/run-last30days.py`

Runs the Last30Days research engine with both `--emit=compact` (raw sources) and `--emit=md` (full report) in parallel.

```bash
python3 scripts/run-last30days.py "topic" [options]

Options:
  --quick          Fewer sources, faster (8-12 per source)
  --deep           More sources, comprehensive (50-70 per source)
  --days=N         Look back N days instead of 30
  --x-handle=NAME  Search a specific X account's posts
```

Output goes to `~/Documents/Last30Days/` (raw) and `~/Documents/Last30Days/reports/` (full).

### `scripts/parse-last30days.py`

Converts raw markdown files from `~/Documents/Last30Days/` into structured JSON for the webapp.

```bash
python3 scripts/parse-last30days.py
```

## How It Works

1. **Data collection**: `run-last30days.py` calls the Last30Days Python script to scrape Reddit, X, YouTube, HN, etc.
2. **Parsing**: `parse-last30days.py` converts the markdown output into structured JSON
3. **Webapp**: Next.js app renders the data as browsable cards with filters
4. **Summaries**: On-demand Claude API calls analyze the sources and produce executive briefs

The webapp also has a **Refresh** button (re-runs the parser) and a **New** button (runs research from the UI).

## License

MIT
