# Woodshop Class Availability Monitor — Implementation Plan

---
description: Technical implementation plan for the WebTrac class availability monitor.
---

## Overview
This plan describes how to implement the requirements defined in `requirements.md`. The solution is a Node.js script that fetches the Arlington WebTrac search page for woodworking classes, detects when classes become `Available` or `Waitlist`, and logs the results to the console.

The design prioritizes configurability so the same script can monitor other WebTrac class types or locations by changing environment variables.

---

## Goals

- Build a reliable, free monitor that runs on the user’s Mac.
- Avoid hardcoding WebTrac-specific values.
- Parse the HTML search results without relying on brittle full-page regex.
- Display clear, actionable class availability information in the console.
- Gracefully handle network failures and HTML changes.

---

## Tech Stack

| Component | Technology | Purpose |
|---|---|---|
| Runtime | Node.js | Already installed on the user’s Mac |
| HTTP client | `playwright` | Request base page and search results through a real browser to bypass bot detection |
| HTML parser | `node-html-parser` | Fast HTML parser with zero runtime dependencies |
| Configuration | Built-in `.env` parser | Load configuration from `.env` without extra dependencies |
| Scheduling | macOS `cron` or `launchd` | Optionally run the monitor on a configurable interval |

---

## Architecture

```text
┌─────────────┐      ┌──────────────┐      ┌──────────────┐      ┌─────────────┐
│   Cron      │─────▶│   monitor.js  │─────▶│  Playwright  │─────▶│  WebTrac    │
│(cron/launchd)│      │              │      │   Browser    │      │ search.html │
└─────────────┘      └──────────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  node-html   │
                     │    parser    │
                     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Console     │
                     │  output      │
                     └──────────────┘
```

---

## Data Flow

1. **Load configuration** from `.env`.
2. **Launch Playwright browser** and navigate to the base search page (`SEARCH_BASE_URL`).
3. **Parse HTML** with `node-html-parser` to extract the `_csrf_token` hidden input value.
4. **Construct search URL** with token and parameters: `Action=Start`, `type=SEARCH_TYPE`, `module=SEARCH_MODULE`, and any required defaults.
5. **Navigate to search results** via Playwright.
6. **Parse results HTML** with `node-html-parser` to find every class row.
7. **Extract per-class metadata**:
   - Name from the result header or section title
   - Activity number from the row
   - Section ID from the activity number suffix (e.g., `440180-A` → `A`)
   - Dates, time, location, status text
   - Item detail URL from the activity link
8. **Classify statuses** against configured keywords.
9. **Log all classes** to the console with full metadata.
10. **Log the run** result and any errors.

---

## File Structure

```text
web-monitor/
├── .env                      # User secrets and config (ignored by Git)
├── .env.example              # Template with placeholder values
├── .gitignore                # Ignores .env and node_modules
├── implementation-plan.md    # This file
├── monitor.js                # Main script
├── package.json              # Dependencies and scripts
├── README.md                 # Setup and usage instructions
├── requirements.md           # Product requirements
└── tickets.md                # Engineering task breakdown
```

---

## Parsing Strategy

WebTrac returns server-rendered HTML. The search results page contains collapsible result containers and an internal table for each class.

### Base page token extraction
Use a CSS selector to find the hidden input:

```javascript
const token = root.querySelector('input[name="_csrf_token"]')?.getAttribute('value');
```

### Search results parsing
For each result container:
- Find the class name from the result header (`<h2>` or `<div class="result-header__info">`).
- Find the internal table rows (`<tbody> tr`).
- For each row:
  - Extract the activity number from the first activity link text.
  - Derive the section ID from the suffix after the dash, if present.
  - Extract the date range, time, location, and status from the corresponding cells.
  - Extract the item detail URL from the `href` attribute.

### Status detection
Compare the parsed status text against the configured keywords:
- `STATUS_AVAILABLE` → `Available`
- `STATUS_WAITLIST` → `Waitlist`
- `STATUS_UNAVAILABLE` → `Unavailable`

Only classes matching `STATUS_AVAILABLE` (and optionally `STATUS_WAITLIST` if `NOTIFY_ON_WAITLIST=true`) are highlighted in the matching classes summary.

---

## Configuration Strategy

All runtime values live in `.env`. The script reads them once at startup via a built-in parser that reads the file line by line and populates `process.env`. No hardcoded values should exist in `monitor.js` except defaults for the `.env` example.

Key configuration groups:
- **Search:** base URL, type code, module
- **Status:** keyword mappings
- **Behavior:** waitlist toggle, optional check interval

---

## Scheduling Strategy

The script is designed to run once per invocation and exit. The default usage is manual: run `node monitor.js` when you are at your Mac and want to check for classes.

Optional continuous scheduling is possible with macOS `cron` or `launchd` based on `CHECK_INTERVAL_MINUTES`, but this requires the Mac to stay awake to be effective. A laptop that sleeps will miss scheduled runs.

Example `crontab` entry for 10 minutes:

```bash
*/10 * * * * cd /Users/markgood/HomeProjects/web-monitor && /usr/local/bin/node monitor.js >> monitor.log 2>&1
```

For `launchd`, create a plist that runs `monitor.js` on the configured interval.

---

## Error Handling Strategy

- **HTTP errors:** Log status code and response snippet.
- **Token extraction failure:** Log error and exit the current run. Retry on next run.
- **HTML structure changes:** Wrap parsing in try/catch, log the error, and continue. Do not crash the process.
- **No classes found:** Log and exit silently.
- **All classes unavailable:** Log and exit silently.

---

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| WebTrac changes its HTML structure | Use `node-html-parser` CSS selectors that target semantic classes and data attributes rather than brittle DOM positions. Wrap parsing in error handling. |
| CSRF token format changes | Extract by input name, not position. Log token presence or absence. |
| Site rate-limits or blocks the script | Default 10-minute interval. Run manually to avoid frequent polling. |
| Visible Chrome browser uses power and screen focus | Run manually when at the Mac; do not schedule continuously on a laptop. |
| Mac sleep prevents scheduled runs | Default to manual execution; document optional scheduling with sleep caveats. |
| Status keywords differ for other WebTrac locations | Make keywords configurable via `.env`. |
| Date format varies by locale | Use a flexible date parser (e.g., `MM/DD/YYYY`). |
| Class has no section ID suffix | Handle gracefully by setting section ID to empty string. |

---

## Acceptance Criteria

The implementation is complete when:

- `monitor.js` runs without errors on the user’s Mac.
- The script successfully extracts the CSRF token from the base page.
- The script retrieves the WOOD search results.
- The script correctly parses each class row and extracts the required metadata.
- The script correctly identifies `Available`, `Waitlist`, and `Unavailable` classes.
- The script logs all classes for the user with full metadata.
- The `.env` file controls all configurable behavior.
- The `README.md` explains how to install, configure, and run the monitor manually.
