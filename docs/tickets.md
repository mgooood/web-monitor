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

**Status:** Done
**Requirements:** F1, N8, N10
**Dependencies:** T1

### Description
Implement the first part of the monitoring flow: fetching the WebTrac base search page and extracting the hidden `_csrf_token` input value.

### Acceptance Criteria
- [x] `monitor.js` loads configuration from `.env` via a built-in parser.
- [x] The script navigates to `SEARCH_BASE_URL` using `playwright` with a real browser to bypass Cloudflare bot detection.
- [x] The script extracts the `_csrf_token` value from the HTML using `node-html-parser`.
- [x] If the token cannot be found, the script logs a clear error and exits without crashing.
- [x] The extracted token is logged (without exposing it fully in production logs) for debugging purposes.

### Verification
- Copy `.env.example` to `.env` and fill in real values.
- Install Playwright and its Chromium browser: `npm install` and `npx playwright install chromium`.
- Run `node monitor.js`.
- Confirm the output shows `SEARCH_BASE_URL` was fetched successfully and a CSRF token was extracted.
- Confirm a token length or presence is logged without printing the full token.
- Temporarily break the URL or selector and confirm the script logs an error and exits cleanly.

---

## T3 — Implement WOOD Search Request and Results Parsing

**Status:** Done
**Requirements:** F2, F3, F4, N7, N8, N10, N11, C1
**Dependencies:** T2

### Description
Use the CSRF token from T2 to construct and request the WOOD search URL. Parse the returned HTML to identify all class rows and extract the required metadata.

### Acceptance Criteria
- [x] The script constructs a GET URL with the extracted token and required parameters: `Action=Start`, `type=SEARCH_TYPE`, `module=SEARCH_MODULE`, and any other parameters needed to match the manual search.
- [x] The script navigates to the search results URL using Playwright.
- [x] The script parses each class row using `node-html-parser` and extracts class name, activity number, section ID, date range, time, location, status text, and item detail URL.
- [x] The extracted data is logged for debugging without exposing tokens.
- [x] If the HTML structure cannot be parsed, the script logs an error and exits gracefully.

### Verification
- Run `node monitor.js`.
- Confirm the output shows the constructed search URL and the number of class rows parsed.
- Confirm at least one parsed class contains: name, activity number, section ID, date range, time, location, status text, and item detail URL.

---

## T4 — Implement Availability Detection and Future-Date Filtering

**Status:** Removed

Future-date filtering is out of scope for this version. The user wants to see all WOOD classes regardless of start date. Availability detection and color-coded console output are already implemented in T3.

---

## T5 — Implement Email Notification

**Status:** Removed

Email notifications are out of scope for this version. The user will run the monitor manually and review the logged results in the console. This decision avoids keeping a Mac awake continuously and removes the need for Gmail credentials or `nodemailer`.

---

## T6 — Implement Logging and Error Handling

**Status:** Done
**Requirements:** F7, F8, N6, N7, N8, N9, C2
**Dependencies:** T3

### Description
Add run logging and error handling so the script produces useful output when run manually and fails gracefully when something goes wrong.

### Acceptance Criteria
- [x] Each run logs a human-readable timestamp, the number of classes checked, and the number of available/waitlist classes found.
- [x] HTTP errors, parse errors, and browser errors are logged but do not crash the process.
- [x] The script exits cleanly after each run.
- [x] The polling interval is configurable but not required for manual use.

### Verification
- Run the script manually and confirm the output contains a timestamp, classes checked, and available/waitlist counts.
- Temporarily break the network or the HTML parser and confirm the script logs an error and exits cleanly.
- Confirm the script does not hang or leave a browser open after an error.

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
- [ ] The script logs each run correctly.

### Verification
- Run the script against the live Arlington WebTrac site.
- Confirm no errors, the CSRF token is extracted, and WOOD search results are retrieved.
- Confirm at least one class row is parsed correctly.
- Confirm all observed statuses (`Unavailable`, `Waitlist`, `Available`) are classified correctly.
- Review the console output for correct run metadata and any matching classes.

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
  - [ ] Prerequisites (Node.js, Playwright browsers)
  - [ ] Installation instructions (`npm install` and `npx playwright install chromium`)
  - [ ] Configuration instructions (copy `.env.example` to `.env`, fill in values)
  - [ ] How to run the monitor manually
  - [ ] Troubleshooting section for common errors
- [ ] `.env.example` has clear comments for every variable.
- [ ] `requirements.md`, `implementation-plan.md`, and `tickets.md` are cross-referenced correctly.
- [ ] The project is ready for handoff.

### Verification
- Clone the repository into a fresh directory and follow the `README.md` instructions end-to-end.
- Confirm the monitor runs once with `npm test` or `node monitor.js`.
- Confirm `.env.example` comments clearly explain every variable.
- Spot-check that `requirements.md`, `implementation-plan.md`, and `tickets.md` are consistent and cross-referenced.
- Confirm no secrets are committed.

---

## Traceability Matrix

| Ticket | Requirements Addressed |
|---|---|
| T1 | N1, N2, N4, N5, I1, I3, I4 |
| T2 | F1, N8, N10 |
| T3 | F2, F3, F4, N7, N8, N10, N11, C1 |
| T4 | Removed |
| T5 | Removed |
| T6 | F7, F8, N6, N7, N8, N9, C2 |
| T7 | All functional and non-functional requirements |
| T8 | I3, I4, N1, N2, N3, N4, N5 |
