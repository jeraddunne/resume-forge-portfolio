# Content Notes

Source material for the public portfolio site. **Everything in this file is
information I am comfortable publishing on a public website.** Nothing here is
private, and nothing here was invented by an AI assistant — see
"Provenance rules" at the bottom.

Assignment: SWE 380 / CSC 580 Assignment 1 — GitHub + AI Engineering Practice.

---

## 1. Identity

| Field | Value |
| --- | --- |
| Name | Jerad Dunne |
| Professional title | Software Engineer — AI-assisted tooling |
| Public email | jeradrush2112@gmail.com |
| GitHub | https://github.com/jeraddunne |
| Location shown on site | *(omitted by choice — see Privacy decisions)* |
| Phone shown on site | *(omitted by choice — see Privacy decisions)* |
| Birthday shown on site | *(omitted by choice — see Privacy decisions)* |

## 2. Positioning statement

I build tools that put a real engineer in the loop with a language model rather
than handing the work over to one. My current focus is document-generation
software where correctness is checkable: the model drafts, deterministic code
audits the draft against a published standard, and the human decides.

## 3. Featured project — Resume Forge

Verifiable facts, drawn from my own source tree (`resume-forge/`), not from a
model's summary:

- **What it is:** a local desktop application that produces OPM-compliant
  two-page federal resumes and ATS-friendly private-sector resumes.
- **Stack:** Electron 33, React 18, Vite 5, Node 18+; `@anthropic-ai/sdk` for
  model calls; `docx` for export; `mammoth` + `pdf-parse` for ingest;
  `keytar` for OS-keychain credential storage.
- **Architecture:** three layers with a hard security seam — renderer
  (`src/`, no secrets/filesystem/network), main process (`electron/main.js`,
  owns keychain + network), and shared pure logic (`shared/`, unit-testable
  with no Electron dependency).
- **The distinguishing feature:** a *deterministic* compliance scanner
  (`shared/compliance.js`) that never calls the model. It parses the markdown
  resume and checks the two-page budget, required per-position OPM fields
  (title, employer + location, MM/YYYY dates, hours per week, GS series-grade),
  header requirements (citizenship, veterans preference, clearance), and
  orphan bullets against the parsed job announcement. The audit is instant,
  local, and free — it runs on every keystroke.
- **Model routing:** task-based. Cheap models for interview/parsing/verbiage,
  stronger models for generation and triage. A running cost meter is shown in
  the app.
- **Compliance basis:** OPM Merit Hiring Plan (29 May 2025), enforced on
  USAJobs as of 27 Sep 2025.
- **License:** MIT. **Author:** Jerad Dunne.

## 4. Featured project — this portfolio + Forge panel

- Fork of the MIT-licensed [vCard Personal Portfolio][vcard] template.
- Adds a browser-only, bring-your-own-key panel that rewrites a resume bullet
  against the Resume Forge bullet doctrine.
- Two provider transports, chosen by the visitor: **Claude** (direct browser
  call to the Anthropic Messages API) and **Codex / U-M GPT Toolkit**
  (prompt handoff to the local `codex` CLI — no browser network call, so the
  U-M key never enters a web page). The reason for the split is measured, not
  assumed: see `docs/provider-transport-findings.md`.
- No backend, no database, no login, no analytics, no server-side storage.

[vcard]: https://github.com/codewithsadee/vcard-personal-portfolio

## 5. Skills I can evidence from published work

Listed only where the repository itself is the evidence. No credential,
certification, or employer claim appears on the site.

- JavaScript (ES modules), React, Electron, Vite
- LLM API integration: Anthropic Messages API, OpenAI-compatible Chat
  Completions, prompt design, structured/JSON output handling, token-cost
  modelling
- Document processing: PDF and DOCX ingest, DOCX generation
- Secure credential handling: OS keychain storage, process isolation,
  `contextIsolation` / `nodeIntegration: false`
- Deterministic rule engines and text auditing
- Git and GitHub workflow: forks, issues, feature branches, pull requests,
  GitHub Pages

## 6. Coursework context

- SWE 380 / CSC 580 — Assignment 1: GitHub + AI Engineering Practice.

## 7. Privacy decisions (deliberate omissions)

The template ships fields I chose **not** to publish. Each was removed rather
than filled in:

| Template field | Decision |
| --- | --- |
| Phone number | Removed. Not publishing a personal number. |
| Street/city location | Removed. |
| Birthday | Removed. Date of birth is an identity-theft input. |
| Google Maps embed (`data-mapbox`) | Removed. Third-party iframe that loads Google tracking on every visit — conflicts with the "no analytics tracker" constraint. |
| Testimonials / clients logos | Removed. I have no real testimonials, and inventing them would be fabrication. |
| Blog posts | Removed. I have no published posts; the template's six entries are lorem-ipsum placeholders. |

## 8. Provenance rules I held myself to

1. No education, employer, job title, date, award, certification, or
   credential appears on the site unless I can point to the source.
2. AI assistance was used for code and prose *structure*. Every factual claim
   about Resume Forge was checked against its source tree.
3. Where I had no real content, I **deleted the section** rather than let an
   assistant generate plausible filler.
4. Full prompt-and-response record: `ai-log.md` and `docs/ai-usage-journal.md`.
