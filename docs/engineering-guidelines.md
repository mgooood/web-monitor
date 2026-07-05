# Engineering Guidelines

---
description: Best practices for building, maintaining, and securing the class availability monitor.
---

## Philosophy

This project is a small, personal automation tool. The goal is to keep it simple, secure, and easy to maintain. Prefer built-in capabilities over new dependencies. Every dependency is a potential supply-chain risk and must be justified.

---

## Dependency Policy

### Minimize dependencies

Only add a dependency if the task cannot be done safely with Node.js built-in modules or simple local code.

Approved dependencies for this project:

| Dependency | Purpose | Justification |
|---|---|---|
| `nodemailer` | SMTP email delivery | Node.js has no built-in SMTP client. Sending email via raw sockets is impractical. |
| `node-html-parser` | HTML parsing | Node.js has no built-in DOM parser. Regex-based HTML parsing is brittle and unsafe. |

Not used:

- `cheerio` — heavier than `node-html-parser` and has more transitive dependencies.
- `dotenv` — replaced by a simple built-in `.env` parser to avoid an extra dependency.
- `node-cron` — replaced by macOS `cron` or `launchd` for scheduling.

### Vet every dependency before adding

Before adding or updating any dependency, check it on [Snyk’s vulnerability database](https://security.snyk.io/):

```text
https://security.snyk.io/package/npm/<package-name>
```

Look for:

- **No known security issues** in the latest version
- **Healthy maintenance** and recent publish history
- **Active community** or sustainable community rating
- **Zero or minimal vulnerabilities** in the latest version (0 C, 0 H, 0 M, 0 L)
- **Fewer transitive dependencies** when possible

### Pin exact versions

Always pin exact versions in `package.json`. Never use `^` or `~` ranges that silently update packages.

```json
{
  "dependencies": {
    "nodemailer": "9.0.3",
    "node-html-parser": "8.0.4"
  }
}
```

### Use a lock file

Generate and commit `package-lock.json` so installs are reproducible:

```bash
npm install --package-lock-only
```

Install dependencies in production or on a new machine with:

```bash
npm ci
```

### Run npm audit

Run `npm audit` after every dependency change. Fix or explicitly suppress any high or critical severity findings before marking a ticket as done.

### Check transitive dependencies

When a dependency has runtime dependencies, check those too on Snyk. For example, `node-html-parser` depends on `css-select` and `entities`. Review their Snyk pages before committing to the version.

---

## Security Practices

### No secrets in code

Never commit credentials, tokens, passwords, or private configuration to the repository. All secrets live in `.env`, which is excluded from version control via `.gitignore`.

### Safe logging

Do not log:

- `_csrf_token` values
- Gmail App Passwords
- Any `.env` values

It is safe to log:

- Timestamps
- Number of classes checked
- Number of available or waitlist classes found
- HTTP status codes (without response bodies containing tokens)
- Error messages that do not contain secrets

### Email credentials

Use a Google App Password, not your main Gmail password. Store it in `.env`. Consider using a separate Gmail account just for notifications to limit blast radius if credentials are exposed.

### Network safety

- Use HTTPS for all WebTrac requests.
- Do not disable TLS certificate validation.
- Respect the configured polling interval to avoid rate limiting or being blocked.

---

## Code Quality

### Keep functions small and focused

Each function should do one thing: fetch, parse, classify, notify, log, or schedule.

### Error handling

- Wrap all external calls (HTTP, email, parsing) in error handling.
- Log errors clearly.
- Never let an unhandled exception crash the long-running monitor.
- On failure, exit the current run cleanly and retry on the next scheduled interval.

### HTML parsing

Use `node-html-parser` selectors that target semantic attributes such as `name`, `data-title`, and class names. Avoid brittle positional selectors or fragile regex.

### Configuration

All runtime behavior must be controlled by `.env`. No hardcoded WebTrac URLs, class types, or status keywords in the source code.

---

## Git Practices

### Always ignore sensitive files

`.gitignore` must include:

```text
.env
node_modules/
*.log
```

### Small, focused commits

Each commit should correspond to one ticket or one logical change. Write descriptive commit messages.

### Never commit `package-lock.json` changes blindly

Review `package-lock.json` diffs when dependencies change to ensure no unexpected transitive packages are introduced.

---

## Testing and Validation

### Live smoke test

Before declaring a ticket done, run the script against the live WebTrac site and verify it produces the expected output.

### Security review before release

Before any release or deployment:

- [ ] Run `npm audit`
- [ ] Verify all dependencies are pinned to exact versions
- [ ] Check the latest versions of all dependencies on Snyk
- [ ] Confirm `.env` is in `.gitignore`
- [ ] Confirm no secrets are in the code

---

## Documentation

- `README.md` must explain how to install, configure, and run the monitor.
- `requirements.md` is the source of truth for behavior.
- `implementation-plan.md` describes the technical approach.
- `tickets.md` tracks work.
- `ideas.md` holds future enhancements.
- This file governs how the project is built and maintained.

When behavior changes, update the relevant documentation file before marking the ticket done.
