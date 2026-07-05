---
description: Keep project markdown files synchronized as implementation progresses.
---

# Update Project Tracking

Use this workflow after completing work on any implementation ticket or when project decisions change.

## When to use

- After completing a ticket in `tickets.md`
- After changing requirements or behavior
- After discovering a new idea that should be deferred
- After changing the tech stack, dependencies, or security practices

## Operating rules

- **AI scope:** Only read and write files inside the project directory (`/Users/markgood/HomeProjects/web-monitor`). Do not run command-line tools, install packages, or execute scripts.
- **User commands:** All terminal commands, package installations, Git operations, and runtime tests must be run by the user.
- **Destructive acts:** Never delete files, modify existing code without explicit direction, or run commands that mutate system or project state without user confirmation first.
- **Safety first:** If a requested action could affect data, credentials, or system state, pause and ask for confirmation before proceeding.

## Steps

1. **Update the ticket status**
   - Open `tickets.md`
   - Find the completed ticket
   - Change its status from **Open** to **Done** or **Ready for Review**

2. **Update requirements if behavior changed**
   - Open `requirements.md`
   - If the implementation differs from what was written, update the relevant requirement
   - If a new requirement emerged, add it with a new ID

3. **Update the implementation plan if the approach changed**
   - Open `implementation-plan.md`
   - Update the tech stack, data flow, or file structure sections if they no longer match the code

4. **Log new ideas**
   - Open `ideas.md`
   - Add any deferred feature or improvement with a short description and the problem it solves

5. **Review engineering guidelines**
   - Open `engineering-guidelines.md`
   - If a new dependency was added, document how it was vetted
   - If a new security or code-quality rule applies, add it

6. **Final check before handoff**
   - Confirm all markdown files are consistent with the current code
   - Confirm no secrets are in the code or committed files
