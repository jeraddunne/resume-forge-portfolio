# Resume Forge — Case Study

A local desktop application that builds **OPM-compliant two-page federal
resumes** and **ATS-friendly private-sector resumes**, powered by the user's
own Claude API key.

The Forge panel on this portfolio is a browser-sized slice of it.

---

## The problem

Federal hiring runs on rules that are published, specific, and unforgiving.
Since OPM's Merit Hiring Plan took effect on USAJobs on **27 September 2025**, a
federal resume must fit two pages and must carry, for every position: job
title, employer and location, MM/YYYY dates, hours per week, and GS
series-grade where applicable. Miss one and the application can be screened out
before a human reads a word of it.

The obvious application of a language model here is "write my resume," and it
is the wrong one. A model will happily produce a fluent resume that quietly
runs to three pages, omits hours per week, and invents a metric that sounded
plausible. Fluency is not the constraint. Compliance is.

## The design

The interesting engineering is the part that does not call a model.

```
┌──────────────────────────────────────────────────────────────┐
│ RENDERER (src/) — React. No secrets, no filesystem, no net.  │
│   Talks only to window.forge.* over a contextBridge.          │
└────────────────────────────┬─────────────────────────────────┘
                             │  preload.cjs (contextIsolation: true)
┌────────────────────────────▼─────────────────────────────────┐
│ MAIN (electron/main.js) — privileged. Owns the OS keychain,   │
│   the filesystem, and the only network path to Anthropic.     │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│ SHARED (shared/) — pure logic, no Electron, unit-testable:    │
│   prompts.js · compliance.js · anthropic.js · documents.js    │
└──────────────────────────────────────────────────────────────┘
```

Two properties fall out of this split:

**The API key never enters the renderer.** The UI process has no filesystem, no
network, and no process access — only the named methods exposed on the
contextBridge. Every model call happens in the main process. A bug in a React
component cannot leak a credential it never had.

**The rule engine is testable without an API key.** `shared/` has no Electron
dependency, so `node test/smoke.mjs` exercises the compliance audit, the
tolerant JSON parser, the DOCX exporter, and private-sector mode with no
network and no cost.

## The compliance scanner

The component the product is actually built around. It **never calls the
model**. It parses the markdown resume and checks:

- the two-page budget, estimated against the same constants the DOCX exporter
  uses, so the preview and the export agree
- required per-position fields — title, employer + location, MM/YYYY dates,
  hours per week, GS series-grade
- header requirements — citizenship, veterans preference, clearance
- orphan bullets: content with no corresponding requirement in the parsed job
  announcement

Because it is deterministic it runs on **every keystroke**, instantly and for
free. The division of labour is the whole idea: the model drafts, the rule
engine decides whether the draft is acceptable, and the human decides whether
the facts are true.

## Model routing

Task-based rather than one-model-for-everything. Cheap, fast models handle the
interview questions, announcement parsing, and verbiage suggestions; a stronger
model handles generation and the over-length triage pass. A running cost meter
is displayed in the app, driven by a pricing table kept next to the model map.
A full resume build typically costs a couple of cents.

## Choosing the verb

A small feature that matters more than it looks. "Supervised", "led", and
"coordinated" are not synonyms on a federal application — they describe
different scopes of authority, and claiming the wrong one is a
misrepresentation rather than a style choice. The interview step asks the
narrow questions that decide which verb is accurate, instead of letting the
model pick whichever sounds strongest.

The same rule is carried into this portfolio's Forge panel: `prompts.js` will
only use "supervised" when the source states direct reports.

## Stack

Electron 33 · React 18 · Vite 5 · Node 18+ · `@anthropic-ai/sdk` · `docx` ·
`mammoth` and `pdf-parse` for ingest · `keytar` for OS-keychain storage.
MIT licensed.

---

## What the portfolio panel keeps, and what it drops

| | Resume Forge (desktop) | Forge panel (this site) |
| --- | --- | --- |
| Key storage | OS keychain, via the main process | `sessionStorage`, this tab only |
| Scope | Whole resume, interview, export | One bullet |
| Compliance scanner | Yes — the core feature | No |
| Export to `.docx` | Yes | No |
| Providers | Claude | Claude, or Codex via CLI handoff |
| Anti-fabrication rule | Yes | Yes — carried over intact |

The panel exists to demonstrate the prompt doctrine and the key handling in
something anyone can try in ten seconds. The part that makes the desktop
application worth using — the deterministic scanner — is exactly the part that
does not fit in a browser panel, which is itself the point of the case study.

---

## How the brief was decomposed

The project began as a single request with eleven distinct requirements
embedded in it. Before any code was written, the brief was decomposed into
testable requirements, each mapped to a specific implementation. That mapping
is why the finished application has no orphan features and no unmet asks.

| Requirement as stated | Where it landed |
| --- | --- |
| Takes day-to-day activities, job titles, elements | Freeform intake box, mined during generation |
| Skills that certificates require | Profile schema + prompt instruction folding skills into bullets |
| Reusable application | `electron-store` session persistence; stateless prompt functions |
| OPM approved format | `shared/prompts.js` rule blocks + `shared/compliance.js` audit |
| Also meet public job standards | Federal / Private mode toggle branching all four prompts |
| Bring job announcements into the prompt | `joaParsePrompt` plus paste or file import |
| Bring in premade resumes to populate data | `documents.js` PDF, DOCX, TXT, MD extraction |
| Ask the user about skills | `interviewPrompt`, returns up to six targeted questions |
| Correct verbiage for leadership claims | `verbiagePrompt` verb calibration ladder |
| Expandable using best prompting | Prompt library isolated in `shared/`, composed from named rule blocks |
| No longer than two pages | Live page estimator, blocking error, one-click auto-trim |

### The one interpretation that shaped everything else

The brief said resumes can be no longer than two pages. That could have been
implemented as a prompt instruction alone. It was not.

**Language models are unreliable at counting, so a page limit enforced only by
prompt is a page limit that silently fails.** The decision was to build a
separate deterministic engine that measures the output independently of the
model. That single choice produced the compliance scanner, which became the
defining feature of the application.

---

## Known limitations

Stated because a case study that lists only strengths is marketing.

**The OPM rules are secondary-sourced.** They were inherited from my own
`usajobs-resume` skill file and have not been independently verified against
opm.gov or usajobs.gov. The skill asserts the two-page limit took effect
27 September 2025 under the Merit Hiring Plan of 29 May 2025, supported by
EO 13932 and EO 14170. That chain is internally consistent and detailed enough
to be credible, but it is a secondary source. **Before submitting a real
application, confirm the rule against the announcement itself.** Some
non-Title 5, judicial, legislative, and CV-required postings waive the two-page
limit entirely.

**Two subsystems were never tested.** They are in the verification record as
untested, not as passing.

**Roughly 636 lines of federal hiring doctrine are not wired in.** Six
reference files sit in the skill directory that the application does not
currently load — the largest source of untapped value already in hand.

The same standard applies to the Forge panel on this site: the live Claude
round trip is documented as untested rather than assumed working. See
[`test-results.md`](test-results.md#manual-test-still-outstanding).
