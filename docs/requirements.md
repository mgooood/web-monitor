# Woodshop Class Availability Monitor — Requirements

---
description: Product requirements for a configurable WebTrac class availability monitor.
---

## Purpose
Build a free, automated monitor that checks the Arlington WebTrac system for open woodworking classes across the entire year and notifies the user immediately when a class becomes available for registration. The solution should be configurable so it can be reused for other class types, locations, or modules in the future.

---

## Functional Requirements

### F1 — Fetch Base Search Page
The system must fetch the base search page (`https://vaarlingtonweb.myvscloud.com/webtrac/web/search.html`) and extract the `_csrf_token` value from the hidden form field in the HTML.

### F2 — Construct and Request WOOD Search URL
The system must construct the search URL using the token from F1 and the required parameters (`Action=Start`, `type=WOOD`, `module=AR`, and any other parameters needed to match the manual search), then request it via GET to retrieve the class list.

### F3 — Retrieve All Yearly Results
The system must retrieve all woodworking classes returned by the search. The default “All Months” filter should be used by leaving `beginmonth` empty or by using the equivalent default parameter.

### F4 — Parse Class Rows
The system must parse the returned HTML and identify every individual class row. For each row it must extract:
- Class name
- Activity number (e.g., `440180`)
- Section ID (e.g., `A` from `440180-A`)
- Date range
- Time
- Location
- Availability status text
- Item detail URL (e.g., `iteminfo.html?Module=AR&FMID=...`)

### F5 — Detect Availability Status
The system must detect the following availability states from the class row status text:
- `Available`
- `Waitlist`
- `Unavailable`

A class is considered available for registration when its status text is `Available`. A class is considered waitlist-only when its status text is `Waitlist`.

### F6 — Log Matching Classes
When matching classes are found, the system must log each class with its name, activity number, section ID, date range, status, and a link to the base search page (`https://vaarlingtonweb.myvscloud.com/webtrac/web/search.html`) so the user can re-run the search manually and register.

### F7 — Handle Empty Results
If no woodworking classes are returned, or all classes are `Unavailable`, the system must complete without logging matching classes.

### F8 — Log Execution Status
The system must log each run with a timestamp, the number of classes checked, and the number of available or waitlist classes found.

---

## Non-Functional Requirements

### N1 — Free Tools Only
The entire solution must use free, open-source tools and built-in macOS capabilities. No paid services, APIs, or hosting platforms may be required.

### N2 — No New Desktop or Mobile Apps
The solution should not require the user to install new desktop applications or mobile apps. Existing tools such as Node.js are acceptable.

### N3 — macOS Compatible
The system must run on macOS using the existing Node.js installation.

### N4 — Configuration Isolation
The system must store all runtime configuration in a separate `.env` file, never in the source code.

### N5 — Version Control Safe
The `.env` file must be excluded from version control via `.gitignore`. Only `.env.example` with placeholder values may be committed.

### N6 — Optional Periodic Execution
The system may run automatically on a schedule when the Mac is awake. It must also support manual execution by the user. The default interval is configurable.

### N7 — Resilient to HTML Changes
The system must fail gracefully if the WebTrac HTML structure changes. It should log an error and continue to the next scheduled run.

### N8 — Network Error Handling
The system must handle HTTP errors, timeouts, and network failures without crashing. It should log the error and retry on the next scheduled run.

### N9 — Rate Limiting Awareness
The system should not poll the site more frequently than necessary to avoid being blocked. The default check interval is 10 minutes and is configurable.

### N10 — Configurable and Reusable
The system must be driven by configuration values rather than hardcoded values. This allows the same script to be reused for other class types, locations, or WebTrac modules by changing the `.env` file.

### N11 — Console Output
When run manually, the script must display all parsed classes and their metadata in the console. Status text must be color-coded: unavailable in red, waitlist in orange, and available in green.

---

## Configuration Requirements

### C1 — Search URL and Parameters
The base search URL, search type code, and module must be configurable via the `.env` file.

### C2 — Check Interval
The polling interval in minutes must be configurable via the `.env` file. This is optional when the user runs the monitor manually.

### C3 — Status Keywords
The keywords used to detect `Available`, `Waitlist`, and `Unavailable` statuses must be configurable via the `.env` file.

### C4 — Waitlist Notification Toggle
Whether to include `Waitlist` classes in the logged results must be configurable via the `.env` file.

---

## Implementation Requirements

### I1 — Node.js Runtime
The solution must be implemented in JavaScript and run with the existing Node.js installation.

### I2 — Package Dependencies
Allowed runtime dependencies are:
- `node-html-parser` for HTML parsing
- `playwright` for browser automation when the target site blocks non-browser HTTP clients

The following capabilities are implemented without external dependencies:
- Environment variable loading via a built-in `.env` parser
- Scheduling via macOS `cron` or `launchd`

### I3 — Script Structure
The project must contain at least:
- `monitor.js` — main monitoring logic
- `.env` — secrets and configuration (ignored by Git)
- `.env.example` — example configuration file
- `.gitignore` — excludes `.env`
- `requirements.md` — this file
- `README.md` — setup and run instructions
- `package.json` — project metadata and dependencies

### I4 — Secrets File Template
The `.env.example` file must list all required environment variables with placeholder values and comments explaining each one.

---

## Requirement-to-Behavior Mapping

| Requirement ID | Behavior |
|---|---|
| F1, F2 | Authenticate with WebTrac and run the search |
| F3, F4 | Collect the full list of relevant woodworking classes |
| F5, F6 | Detect openings and log them for the user |
| F7 | Stay quiet when nothing changes |
| F8 | Provide visibility into each run |
| N11 | Display all parsed classes with color-coded status in the console |
| N1, N2, N3 | Keep the solution free and local |
| N4, N5 | Keep configuration out of source control |
| N6, N9, C2 | Optionally run repeatedly at a safe interval |
| N7, N8 | Survive site or network issues |
| N10, C1–C4 | Make the script reusable without code changes |
| I1–I4 | Define the implementation boundaries |
