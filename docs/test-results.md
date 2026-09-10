# Test Results

Assignment Q10. Tests are written to be repeatable — each one names the exact
command or assertion, so the result can be reproduced rather than taken on
trust.

- **Local environment:** Chrome, `python -m http.server 8765`, 2026-09-10
- **Live environment:** GitHub Pages, `https://jeraddunne.github.io/resume-forge-portfolio/`
- **Evidence:** [`evidence/`](evidence/)

The Forge panel uses ES modules, so it must be served over HTTP. Opening
`index.html` from `file://` blocks the module imports and the API call alike.

---

## Required test table

| Test | Result and evidence |
| --- | --- |
| Page loads without a visible error | **PASS.** `curl -o /dev/null -w "%{http_code}" http://localhost:8765/` → `200`. Page renders in Chrome with sidebar, nav, and the About section active. Screenshot: [`01-desktop-about.jpg`](evidence/01-desktop-about.jpg) |
| Navigation links reach the intended sections | **PASS.** Programmatic pass over all five controls: for each, click, then assert the active page matches the clicked target. `about→about, resume→resume, portfolio→portfolio, forge→forge, contact→contact`. All five matched, and exactly one element carried `aria-current="page"` at each step. |
| Personal content replaces template placeholders | **PASS.** `['richard','hanrick','example.com','sacramento','lorem ipsum']` filtered against `document.documentElement.outerHTML` → `[]` (empty). Also `curl http://localhost:8765/index.txt` → `404`, confirming the template's text dump is gone rather than merely unlinked. |
| Project links and external links work | **PASS (local shape) / see note.** 3 project cards, each with a title, an `alt`-bearing image, and an `href`: two GitHub blob URLs and one in-page `#forge`. GitHub URLs resolve only after the branch is merged to `master`; re-checked on the live site after deployment. |
| Layout remains usable on a narrow viewport | **PASS.** Tested at a real 357×757 viewport by loading the site into a 360px iframe, so the CSS media queries resolve against that width rather than being faked. `document.documentElement.scrollWidth` = 342 ≤ 357. Elements wider than the viewport: **none**. Nav collapses to a bottom bar; the provider radios stack. Screenshot: [`03-responsive-360px.jpg`](evidence/03-responsive-360px.jpg) |
| Keyboard navigation is usable | **PASS.** Every nav control is a real `<button>`, so it is in the tab order natively. `:focus-visible` rings added in `assets/css/a11y.css` — the template styled `:hover` but never `:focus`. A skip link jumps past the sidebar. The active tab is marked by weight and underline as well as colour, so the state does not depend on colour perception. |
| Images have meaningful alternative text or are decorative | **PASS.** 8 `<img>` elements, 0 missing an `alt` attribute. Project thumbnails describe what the image shows; the avatar monogram and the four service icons are `alt=""`, correctly marked decorative because the adjacent heading carries the meaning. |
| No secrets or private data are exposed | **PASS.** `bash scripts/scan-secrets.sh` → `Clean: no credentials found in tracked files.` Scans tracked files for Anthropic and OpenAI key formats, bearer literals, assigned API-key variables, AWS ids, and private-key blocks, and fails on filenames that must never be committed. Phone, street address, and date of birth are deliberately absent from the site — see `content-notes.md`. |
| Browser console has no unexplained errors | **PASS, with one expected error.** The module graph provably evaluates: the provider radios are built by JavaScript at runtime and dynamic `import()` of both `key-store.js` and `prompts.js` succeeded. The one network error that can appear is the U-M Toolkit CORS rejection, which is expected, documented, and the reason the Codex path is handoff-only. |
| The implementation satisfies the five acceptance criteria | **PASS.** All five verified below. |

---

## Acceptance criteria, verified

Run in the page context against the live DOM and the real modules.

| # | Criterion | Assertion | Result |
| --- | --- | --- | --- |
| 1 | No template placeholder identity | placeholder word list against `outerHTML` | `[]` — **PASS** |
| 2 | ≥3 real projects with resolving links | `.project-item` count and href/alt audit | 3 projects, all with title + alt + href — **PASS** |
| 3 | Keyboard nav + `aria-current` | click all 5; assert target match and exactly one `aria-current` | 5/5 — **PASS** |
| 4 | Key never persists beyond the tab | see key-handling tests below | **PASS** |
| 5 | 360px, no horizontal scroll, alt text | `scrollWidth` 342 ≤ 357; 0 images missing alt | **PASS** |

---

## Key-handling tests

The security property this feature lives or dies on, tested against the real
`key-store.js` module rather than a description of it. A dummy key was used throughout: the literal prefix `sk-ant-` followed by
an obvious non-key string. It is written that way here rather than inline,
because `scripts/scan-secrets.sh` correctly flagged the full literal when it
appeared in this file -- the scanner cannot tell a fake key from a real one,
which is the behaviour you want from it.

| Assertion | Result |
| --- | --- |
| After `saveKey`, the value is in `sessionStorage` | **PASS** |
| `localStorage` contains zero `forge.` entries | **PASS** |
| `leakedToLocalStorage()` returns `false` when clean | **PASS** |
| `leakedToLocalStorage()` returns `true` when a stale key is planted | **PASS** — the detector actually detects |
| `purge()` clears both stores | **PASS** — `sessionStorage` null, `localStorage` leftovers `[]` |
| Key field is `type="password"`, `autocomplete="off"`, `spellcheck="false"` | **PASS** |
| The Codex handoff path makes **zero** network calls | **PASS** — `window.fetch` was wrapped and counted across the full copy-prompt flow; count was 0 |

---

## Transport tests

Run from the page in Chrome. Full analysis in
[`provider-transport-findings.md`](provider-transport-findings.md).

| Endpoint | Probe | Result |
| --- | --- | --- |
| `api.anthropic.com` | POST with a deliberately invalid key | `status: 401`, `response.type: "cors"`, JSON error body — **reached**. Transport works; a valid key will go through. |
| `api.toolkit.umgpt.umich.edu` | POST with a bearer token | `TypeError: Failed to fetch` — **blocked by CORS before sending**. Confirms the handoff design. |

A `401` is the success condition here: it proves the browser reached the API
and the server evaluated the request. Only the key was wrong.

---

## Manual test still outstanding

**A live Claude completion with a valid key has not been run by me.** The
transport is proven reachable and the request body matches the API's documented
shape, but I have not exercised the full round trip, because doing so requires
a real API key and spends real money on whoever's key it is.

To close this test:

1. Open the live site and go to **Forge**.
2. Select **Claude (Anthropic)** and paste your own key from
   `console.anthropic.com`.
3. Paste a real bullet — the placeholder *"Responsible for managing the team
   inbox and helping with reports."* is a good adversarial case, because it has
   no metric in it.
4. Press **Rewrite bullet**.

**Expected:** three rewrites, plus a **MISSING EVIDENCE** section asking what
would let the bullet carry a number. **The test fails if the model invents a
metric** — a percentage, a dollar figure, or a team size that was not in the
input. That is the behaviour the anti-fabrication rule in `prompts.js` exists to
prevent, and it is the only assertion in this document that needs a human to
read the output and judge it.

Record the outcome in [`ai-usage-journal.md`](ai-usage-journal.md).

---

## Live-site verification (Q14)

Re-run against the deployed URL rather than the local copy, because a local
pass proves the files are correct and a live pass proves the *deployment* is.

**URL:** https://jeraddunne.github.io/resume-forge-portfolio/
**Date:** 2026-09-10 · **Evidence:** [`04-live-site-forge.jpg`](evidence/04-live-site-forge.jpg)

| Check | Live result |
| --- | --- |
| Site loads | **PASS** — `200`, title `Jerad Dunne — Software Engineer, AI-Assisted Tooling` |
| AC1 — no placeholder identity | **PASS** — placeholder word list against live `outerHTML` → empty |
| AC3 — navigation | **PASS** — all 5 controls clicked on the live page, target matched every time |
| AC4 — storage clean on first load | **PASS** — 0 `forge.` keys in `localStorage` on a fresh visit |
| AC5 — alt text | **PASS** — 8 images, 0 missing `alt` |
| Forge panel initialises from the deployed modules | **PASS** — 2 provider radios built at runtime; model list `claude-opus-5, claude-sonnet-5, claude-haiku-4-5` |
| `/index.txt` removed | **PASS** — `404` on the live site, confirming the template's text dump is not served |
| Asset paths resolve | **PASS** — `/assets/js/forge/forge.js`, `/assets/js/forge/providers.js`, `/assets/css/a11y.css`, `/docs/resume-forge.md`, `/ai-log.md` all `200` |

### One result that needed interpreting rather than recording

A `fetch(..., {method:'HEAD'})` from the live page to the two GitHub project
links returned `TypeError` rather than a status code. That is **not** a broken
link — github.com does not send CORS headers, so the browser refuses to expose
the response to a page on another origin. The links were confirmed separately
with `curl`, which is not subject to CORS, and both return `200`. Clicking them
in the browser works normally, because a navigation is not a cross-origin
`fetch`.

Recorded because the raw output looks like a failure and is not one. The test
method was wrong for the question, which is worth more than the result.
