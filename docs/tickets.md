# Woodshop Class Availability Monitor — Engineering Tickets

---
description: Engineering task breakdown for building the WebTrac class availability monitor.
---

## Ticket Status Legend

- **Open** — Not yet started
- **In Progress** — Currently being worked on
- **Ready for Review** — Implemented, needs testing or review
- **Done** — Completed and verified

---

## T1 — Create Project Skeleton and Configuration Template

**Status:** Done
**Requirements:** N1, N2, N4, N5, I1, I3, I4
**Dependencies:** None

### Description
Set up the project structure and create the configuration files needed before implementation begins. This ticket should not contain any real secrets.

### Acceptance Criteria
- [x] `package.json` exists with project metadata and pinned dependencies: `nodemailer` and `node-html-parser`.
- [x] `.env.example` exists with all required placeholder variables and comments.
- [x] `.gitignore` exists and excludes `.env` and `node_modules/`.
- [x] `README.md` exists with a brief project description and a note that setup instructions will be added later.
- [x] `monitor.js` exists as an empty or stub file.
- [x] The project is initialized as a Git repository (`git init`) and an initial commit is made with the skeleton files.

### Verification
- Run `ls -la` and confirm `package.json`, `.env.example`, `.gitignore`, `README.md`, `monitor.js`, and `package-lock.json` exist.
- Run `git status` and confirm the repository is initialized and clean.
- Run `npm audit --audit-level=high` and confirm `found 0 vulnerabilities`.
- Run `grep -r "woodWorkingClass" . --include="*.md"` and confirm no stale references.

---

## T2 — Implement Base Page Fetch and CSRF Token Extraction

**Status:** Open
**Requirements:** F1, N8, N10
**Dependencies:** T1

### Description
Implement the first part of the monitoring flow: fetching the WebTrac base search page and extracting the hidden `_csrf_token` input value.

### Acceptance Criteria
- [ ] `monitor.js` loads configuration from `.env` via a built-in parser.
- [ ] The script fetches `SEARCH_BASE_URL` using `fetch` with a session-preserving cookie jar.
- [ ] The script extracts the `_csrf_token` value from the HTML using `node-html-parser`.
- [ ] If the token cannot be found, the script logs a clear error and exits without crashing.
- [ ] The extracted token is logged (without exposing it fully in production logs) for debugging purposes.

### Verification
- Copy `.env.example` to `.env` and fill in real values.
- Run `node monitor.js --once`.
- Confirm the output shows `SEARCH_BASE_URL` was fetched successfully.
- Confirm a token length or presence is logged without printing the full token.
- Temporarily break the URL or selector and confirm the script logs an error and exits cleanly.

---

## T3 — Implement WOOD Search Request and Results Parsing

**Status:** Open
**Requirements:** F2, F3, F4, N7, N8, N10, C1
**Dependencies:** T2

### Description
Use the CSRF token from T2 to construct and request the WOOD search URL. Parse the returned HTML to identify all class rows and extract the required metadata.

### Acceptance Criteria
- [ ] The script constructs a GET URL with the extracted token and required parameters: `Action=Start`, `type=SEARCH_TYPE`, `module=SEARCH_MODULE`, and any other parameters needed to match the manual search.
- [ ] The script fetches the search results HTML.
- [ ] The script parses each class row using `node-html-parser` and extracts class name, activity number, section ID, date range, time, location, status text, and item detail URL.
- [ ] The extracted data is logged for debugging without exposing tokens.
- [ ] If the HTML structure cannot be parsed, the script logs an error and exits gracefully.

### Verification
- Run `node monitor.js --once`.
- Confirm the output shows the constructed search URL and the number of class rows parsed.
- Confirm at least one parsed class contains: name, activity number, section ID, date range, time, location, status text, and item detail URL.
- Save a sample of the search results HTML for later regression tests.

---

## T4 — Implement Availability Detection and Future-Date Filtering

**Status:** Open
**Requirements:** F5, F6, C5, C6, N7
**Dependencies:** T3

### Description
Classify each parsed class by its status text and filter out classes whose start date has already passed. Only classes with a start date today or in the future are considered.

### Acceptance Criteria
- [ ] Each class status is compared against `STATUS_AVAILABLE`, `STATUS_WAITLIST`, and `STATUS_UNAVAILABLE` from `.env`.
- [ ] Classes with `STATUS_AVAILABLE` are marked as available.
- [ ] Classes with `STATUS_WAITLIST` are marked as waitlist if `NOTIFY_ON_WAITLIST=true`.
- [ ] Classes with `STATUS_UNAVAILABLE` are ignored.
- [ ] The start date is parsed from the date range and compared to the current date.
- [ ] Classes with a start date in the past are excluded.
- [ ] The script logs the number of available and waitlist classes found.

### Verification
- Run `node monitor.js --once`.
- Confirm the counts of available and waitlist classes match the visible WebTrac statuses.
- Verify classes with start dates in the past are excluded from the counts.
- Compare the parsed results against the live site manually for a few rows.

---

## T5 — Implement Email Notification

**Status:** Open
**Requirements:** F7, F7.1, F8, N1, N2, N4, C2, C3
**Dependencies:** T4

### Description
Send a Gmail notification when one or more classes are detected as available or waitlist. The email must include all required class details and a link to the base search page.

### Acceptance Criteria
- [ ] `nodemailer` is configured to use Gmail SMTP with `GMAIL_USER` and `GMAIL_APP_PASSWORD`.
- [ ] The email is sent to `NOTIFY_TO`.
- [ ] The email subject indicates whether the alert is for available or waitlist classes.
- [ ] The email body lists each class with: name, activity number, section ID, dates, status, and a link to `SEARCH_BASE_URL`.
- [ ] If no matching classes are found, no email is sent.
- [ ] If email sending fails, the error is logged and the process continues.

### Verification
- Run `node monitor.js --once` when available or waitlist classes exist.
- Confirm the email is received at `NOTIFY_TO`.
- Verify the subject indicates available or waitlist.
- Verify the body lists each class with name, activity number, section ID, dates, status, and a link to `SEARCH_BASE_URL`.
- When no classes match, confirm no email is sent.
- Temporarily break the email credentials and confirm the error is logged but the script does not crash.

---

## T6 — Implement Scheduling, Logging, and Error Handling

**Status:** Open
**Requirements:** F9, F10, N6, N7, N8, N9, C4
**Dependencies:** T5

### Description
Add the scheduling loop, run logging, and comprehensive error handling so the script can run continuously without manual intervention.

### Acceptance Criteria
- [ ] The monitor is scheduled via macOS `cron` or `launchd` to run every `CHECK_INTERVAL_MINUTES` minutes.
- [ ] Each run logs a timestamp, the number of classes checked, and the number of available/waitlist classes found.
- [ ] HTTP errors, parse errors, and email errors are logged but do not crash the process.
- [ ] The script exits cleanly after each run and relies on the scheduler for the next execution.
- [ ] The polling interval is respected and does not exceed the configured value.

### Verification
- Add a `crontab` or `launchd` entry based on `CHECK_INTERVAL_MINUTES`.
- Run the script manually and confirm the log file contains a timestamp, classes checked, and available/waitlist counts.
- Temporarily break the network, the HTML parser, or the email config and confirm the script logs an error and exits cleanly.
- Wait for one scheduled interval and confirm the scheduler triggers another run.

---

## T7 — Live Test Against WebTrac

**Status:** Open
**Requirements:** All functional and non-functional requirements
**Dependencies:** T6

### Description
Run the complete monitor against the live Arlington WebTrac site and verify that it correctly parses the current WOOD search results.

### Acceptance Criteria
- [ ] The script runs successfully against the live site without errors.
- [ ] The script correctly extracts the CSRF token.
- [ ] The script retrieves the WOOD search results.
- [ ] The script parses at least one class row correctly.
- [ ] The script correctly classifies all observed statuses: `Unavailable`, `Waitlist`, and `Available`.
- [ ] When forced to detect a known available or waitlist class (or via a test scenario), the script sends an email.
- [ ] The script logs each run correctly.

### Verification
- Run the script against the live Arlington WebTrac site.
- Confirm no errors, the CSRF token is extracted, and WOOD search results are retrieved.
- Confirm at least one class row is parsed correctly.
- Confirm all observed statuses (`Unavailable`, `Waitlist`, `Available`) are classified correctly.
- Force a known available or waitlist detection (or temporarily tweak status keywords) and confirm an email is sent.
- Review the log file for correct run metadata.

---

## T8 — Documentation and Final Review

**Status:** Open
**Requirements:** I3, I4, N1, N2, N3, N4, N5
**Dependencies:** T7

### Description
Complete the project documentation so the user can install, configure, run, and maintain the monitor without assistance.

### Acceptance Criteria
- [ ] `README.md` includes:
  - [ ] Project overview
  - [ ] Prerequisites (Node.js, Gmail App Password)
  - [ ] Installation instructions (`npm install`)
  - [ ] Configuration instructions (copy `.env.example` to `.env`, fill in values)
  - [ ] How to run the monitor once for testing
  - [ ] How to run it continuously
  - [ ] How to stop the monitor
  - [ ] Troubleshooting section for common errors
- [ ] `.env.example` has clear comments for every variable.
- [ ] `requirements.md`, `implementation-plan.md`, and `tickets.md` are cross-referenced correctly.
- [ ] The project is ready for handoff.

### Verification
- Clone the repository into a fresh directory and follow the `README.md` instructions end-to-end.
- Confirm the monitor runs once with `npm test` or `node monitor.js --once`.
- Confirm `.env.example` comments clearly explain every variable.
- Spot-check that `requirements.md`, `implementation-plan.md`, and `tickets.md` are consistent and cross-referenced.
- Confirm no secrets are committed.

---

## Traceability Matrix

| Ticket | Requirements Addressed |
|---|---|
| T1 | N1, N2, N4, N5, I1, I3, I4 |
| T2 | F1, N8, N10 |
| T3 | F2, F3, F4, N7, N8, N10, C1 |
| T4 | F5, F6, C5, C6, N7 |
| T5 | F7, F7.1, F8, N1, N2, N4, C2, C3 |
| T6 | F9, F10, N6, N7, N8, N9, C4 |
| T7 | All functional and non-functional requirements |
| T8 | I3, I4, N1, N2, N3, N4, N5 |
