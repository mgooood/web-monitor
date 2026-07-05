# Future Ideas

---
description: A backlog of ideas that could be implemented in future versions of the monitor.
---

This file tracks ideas that are out of scope for the MVP but may be worth implementing later. Each idea should include a brief description and the problem it solves.

---

## Web Dashboard

**Description:** Add a simple local web interface (e.g., Express + static HTML) that displays recent log entries, the current status of the monitor, and a button to manually trigger a check.

**Problem it solves:** Gives the user visibility into what the monitor is doing without reading terminal logs, and allows manual testing without editing cron or running terminal commands.

**Why not in MVP:** Adds complexity, requires a running server, and is not needed for the core alert flow. Consider as Phase 2.

---

## Quick Enroll Integration

**Description:** Include a direct link to the WebTrac Quick Enroll form in the notification email, pre-filling the Activity Number and Section ID where possible.

**Problem it solves:** Reduces the number of clicks needed to register once a class opens.

**Why not in MVP:** Requires confirming the exact Quick Enroll URL format and whether the Activity Number and Section ID can be reliably parsed from the search results. The current base search link is a safer fallback.

---

## Direct Item Detail Link in Email

**Description:** Include the stable `iteminfo.html` link for each class in the notification email, in addition to the base search link.

**Problem it solves:** Allows the user to go directly to the class page from the email instead of re-running the search.

**Why not in MVP:** Need to verify the item detail URL is accessible without a session token and that the link remains stable across sessions. Can be added once validated.

---

## SMS or Push Notifications

**Description:** Add support for SMS (e.g., Twilio free tier or email-to-SMS gateway) or push notifications (e.g., Pushover, ntfy.sh) in addition to email.

**Problem it solves:** Email may be delayed; SMS or push notifications can be faster and more attention-grabbing for time-sensitive registration windows.

**Why not in MVP:** Requires external services or app installation. Gmail email is free and sufficient for the first version.

---

## Multiple Search Types

**Description:** Allow the monitor to check multiple class types (e.g., `WOOD`, `COOK`, `PAINT`) in a single run by accepting a list of type codes in the configuration.

**Problem it solves:** User may want to monitor more than one class category without running multiple instances of the script.

**Why not in MVP:** Adds complexity to parsing and notification formatting. Current single-type configuration is simpler and sufficient for the immediate need.

---

## Multiple WebTrac Locations

**Description:** Support multiple `SEARCH_BASE_URL` values so the same monitor can watch different cities or recreation departments.

**Problem it solves:** Makes the tool reusable across different WebTrac installations without maintaining separate codebases.

**Why not in MVP:** The current focus is Arlington WebTrac only. The existing configuration already makes it easy to change the URL for a different location.

---

## Historical Availability Tracking

**Description:** Persist availability status over time to a simple datastore (e.g., JSON file or SQLite) and report trends such as "this class has been unavailable for 30 days" or "this class became available 3 times in the last week."

**Problem it solves:** Helps the user understand registration patterns and predict when classes might open.

**Why not in MVP:** Adds storage and complexity. The immediate goal is simply to alert when a class is currently open.

---

## Rate Limiting and Backoff

**Description:** Add intelligent backoff if the site starts returning rate-limit responses, or add random jitter to the check interval to avoid predictable polling patterns.

**Problem it solves:** Reduces the chance of being blocked by WebTrac if they enforce rate limits.

**Why not in MVP:** A 10-minute default interval is already conservative. Can be added if blocking becomes an issue.

---

## Configuration Reload Without Restart

**Description:** Watch the `.env` file for changes and reload configuration on the next run without restarting the monitor process.

**Problem it solves:** Allows the user to tweak settings (e.g., check interval, status keywords) without stopping and restarting the script.

**Why not in MVP:** Restarting the script is simple enough for a personal tool. Adds unnecessary complexity.

---

## Cloud Deployment

**Description:** Package the monitor so it can run on a free cloud scheduler (e.g., GitHub Actions, Render, Railway free tier) instead of only on the user’s Mac.

**Problem it solves:** The monitor runs even when the user’s laptop is asleep or offline.

**Why not in MVP:** Requires external hosting, secrets management, and may violate the "no new apps/services" constraint. Keep local for now.

---

## Docker / Containerization

**Description:** Provide a `Dockerfile` and docker-compose configuration for running the monitor in a container.

**Problem it solves:** Simplifies deployment and dependency management across different machines.

**Why not in MVP:** Overkill for a single Node.js script running on one Mac. Consider if the project expands.

---

## Add Test Suite

**Description:** Add unit tests for the HTML parser, status classifier, and date filter using mocked WebTrac HTML.

**Problem it solves:** Makes it safer to refactor the parser and detect regressions if WebTrac changes its HTML.

**Why not in MVP:** Adds setup time. The live test in T7 will verify the initial parser works.

---

## How to Promote an Idea

When an idea becomes relevant, convert it into a ticket in `tickets.md` and link back to this file.
