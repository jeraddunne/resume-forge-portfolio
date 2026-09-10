# Submission Package

**SWE 380 / CSC 580 — Assignment 1: GitHub + AI Engineering Practice**
**Jerad Dunne** · 2026-09-10

The assignment asks for two documents: a zipped copy of the repository, and one
text document containing the eleven items below. This is that document.

---

## 1. Repository URL

https://github.com/jeraddunne/resume-forge-portfolio

Fork of the MIT-licensed [vCard Personal Portfolio](https://github.com/codewithsadee/vcard-personal-portfolio)
by codewithsadee. `LICENSE` preserved unchanged with its original copyright
line; attribution stated at the top of the README.

## 2. Live GitHub Pages URL

https://jeraddunne.github.io/resume-forge-portfolio/

Deployed from `master` / `(root)`.

## 3. Original issue URL

https://github.com/jeraddunne/resume-forge-portfolio/issues/1

Contains the problem statement, intended audience, the five acceptance
criteria, the constraints (including "this assignment will not add a database
or login system"), and a task checklist.

## 4. Feature-branch and commit-history URLs

- Branch: https://github.com/jeraddunne/resume-forge-portfolio/tree/feature/portfolio-personalization
- Commit history: https://github.com/jeraddunne/resume-forge-portfolio/commits/feature/portfolio-personalization

Seven commits, each independently understandable:

| Commit | Message |
| --- | --- |
| `62966d2` | Add initial portfolio content notes and acceptance criteria |
| `1c5cac0` | Update portfolio identity and navigation |
| `15269e9` | Add projects and experience content |
| `639cf37` | Add bring-your-own-key Forge panel with provider selection |
| `3ce64ef` | Improve responsive layout and accessibility |
| `7ffcd27` | Document AI usage, code review, and test evidence |
| `8dab3fb` | Fix low-contrast link colour in the Forge panel hints |

No commit contains a password, API key, token, private document, or generated
artifact.

## 5. Pull-request URL

https://github.com/jeraddunne/resume-forge-portfolio/pull/2

Contains the change summary, the link to issue #1, the acceptance-criteria
checklist, the testing performed, the AI assistance used, and the known
limitations.

## 6. Merge commit URL

https://github.com/jeraddunne/resume-forge-portfolio/commit/4c978befe516bf75f88d3448a2373e2538c7a882

Merged with a merge commit rather than a squash, so the seven individual
commits remain in history. The feature branch was **not** deleted.

## 7. AI-use record

- https://github.com/jeraddunne/resume-forge-portfolio/blob/master/ai-log.md
- https://github.com/jeraddunne/resume-forge-portfolio/blob/master/docs/ai-usage-journal.md
- https://github.com/jeraddunne/resume-forge-portfolio/blob/master/docs/ai-plan-review.md

`ai-log.md` holds the prompts, the responses, and the accept/revise/reject
decision for each — including the generated output I rejected and a mistake the
assistant made that had to be corrected publicly.

## 8. Acceptance criteria and test results

- Criteria: https://github.com/jeraddunne/resume-forge-portfolio/blob/master/docs/acceptance-criteria.md
- Results: https://github.com/jeraddunne/resume-forge-portfolio/blob/master/docs/test-results.md

All five acceptance criteria pass. All ten required tests pass. Each test names
the exact command or assertion used, so it can be re-run rather than taken on
trust. One test — a live Claude completion with a valid key — is documented as
outstanding, with its procedure and pass/fail condition.

## 9. Screenshots

https://github.com/jeraddunne/resume-forge-portfolio/tree/master/docs/evidence

| File | Test evidenced |
| --- | --- |
| `01-desktop-about.jpg` | Page loads without error; active-tab `aria-current` underline visible |
| `02-forge-panel.jpg` | Provider selector, model list, and password-type key field |
| `03-responsive-360px.jpg` | 360px viewport, no horizontal scroll, nav collapsed to bottom bar |

## 10. Human code-review table

https://github.com/jeraddunne/resume-forge-portfolio/blob/master/docs/code-review.md

Five file regions reviewed line by line, plus six further findings outside the
required table, plus an explicit statement of what I did **not** verify and
why.

## 11. Reflection responses

- Issue: https://github.com/jeraddunne/resume-forge-portfolio/issues/3
- Document: https://github.com/jeraddunne/resume-forge-portfolio/blob/master/docs/reflection.md

Answers A through E.

---

## Supporting documents

Not required, but they hold the reasoning behind the decisions above.

| Document | What it holds |
| --- | --- |
| [`provider-transport-findings.md`](https://github.com/jeraddunne/resume-forge-portfolio/blob/master/docs/provider-transport-findings.md) | The CORS investigation that changed the architecture, with raw responses and the alternatives ruled out |
| [`SECURITY-KEYS.md`](https://github.com/jeraddunne/resume-forge-portfolio/blob/master/docs/SECURITY-KEYS.md) | Key-handling policy, code-level protections, and residual risks |
| [`resume-forge.md`](https://github.com/jeraddunne/resume-forge-portfolio/blob/master/docs/resume-forge.md) | Case study for the desktop application the portfolio is built around |
| [`content-notes.md`](https://github.com/jeraddunne/resume-forge-portfolio/blob/master/content-notes.md) | Public-safe source material, and every template field deliberately not published |

---

## Note on scope

The assignment's sample prompt says "Do not add: a backend, login system,
analytics tracker, or external data collection." This site adds a
bring-your-own-key AI panel, which makes outbound API calls. That tension was
identified before implementation and resolved deliberately, not by accident:

- It adds **no backend, no database, and no login**. The site is static files
  on GitHub Pages.
- It performs **no data collection**. I receive nothing — no key, no text, no
  telemetry. There is no server of mine for anything to arrive at.
- The exception is written into the constraints section of issue #1, so it is
  authorised on the record rather than assumed.
- The Google Maps iframe and the template's other third-party embeds were
  **removed** for exactly the reason the constraint exists.

The full reasoning is in issue #1 and in `docs/reflection.md` §A.
