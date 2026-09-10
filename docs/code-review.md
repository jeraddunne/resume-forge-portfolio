# Human Code Review

Assignment Q9. Every AI-generated change was inspected before merge. Below are
the regions I reviewed line by line, what I checked, and what changed as a
result.

Review standard applied: correctness, unnecessary change, invented content,
privacy, accessibility, security, maintainability.

---

## Required table

| File or region | What the AI changed | What I verified | Change made after review |
| --- | --- | --- | --- |
| **1. `assets/js/script.js`** — navigation block (lines ~95–150) | Rewrote the nav handler; matched pages by an explicit `data-nav-link` value instead of `innerHTML`, added `aria-current`, added hash routing. | Read upstream's original first. It set the active link with `navigationLinks[i]` where `i` was the **inner (page)** loop counter — correct only while the nav list and page list were the same length and order. Adding the Forge section would have silently highlighted the wrong tab. Confirmed the replacement by clicking all five nav items in Chrome and asserting `activePage === clicked` and that exactly one element carries `aria-current="page"`. All five pass. | Accepted the fix. Added the `pageNames` guard so `activatePage` ignores an unknown hash instead of clearing every section and leaving a blank page — the AI's version would have shown nothing for `/#nonsense`. |
| **2. `assets/js/script.js`** — module top level | Removed the testimonials modal block, since the markup was deleted. | This is where I found the worst defect in the change set, and it was **self-inflicted by an earlier step in the same session**. Deleting the testimonials markup left `modalCloseBtn.addEventListener(...)` and `overlay.addEventListener(...)` pointing at `null`. That throws at load, and everything registered after it — including all navigation — never binds. The page would have rendered perfectly and been completely unresponsive to clicks. | Rewrote the whole file with every DOM lookup guarded, so removing a section degrades one feature instead of the page. Verified by loading the site and exercising all five tabs plus the portfolio filter. |
| **3. `assets/js/forge/providers.js`** — `callClaude` | Wrote the Anthropic Messages API call, headers, error mapping, and response parsing. | Checked the header set against the preflight response: `x-api-key`, `anthropic-version`, and `anthropic-dangerous-direct-browser-access` are exactly the headers the server advertises as allowed. Checked that `output_config.effort` is gated on a per-model `supportsEffort` flag — sending it to a model that rejects it would 400. Checked that the error path cannot leak: every message goes through `redact()` before display. Confirmed the transport end to end in Chrome with a deliberately invalid key: `401` with a JSON body and `response.type === "cors"`, i.e. reached and evaluated. | Accepted with two additions. The AI's first version let a raw API error string reach the UI; a key echoed back inside an error body would have been displayed. Added `redact()` and routed all error text through it. Also added the explicit `stop_reason === 'refusal'` branch, which otherwise fell through to "empty response" and would have looked like a bug rather than a decision. |
| **4. `assets/js/forge/key-store.js`** | Session-only key storage. | The original proposal used `localStorage`. On a shared or lab machine that means the next person at that browser has the key. Verified the replacement in Chrome against the real module: after `saveKey`, the value is in `sessionStorage` and `localStorage` has zero `forge.` entries; `leakedToLocalStorage()` returns `false` clean and `true` when a stale key is planted; `purge()` clears both. | Changed to `sessionStorage`. Added the `localStorage` sweep in `purge()` and the `leakedToLocalStorage()` detector, so a key written by an older cached build on the same origin gets cleaned up rather than sitting there indefinitely. Wrapped every storage access — `sessionStorage` **throws** on access in some privacy configurations, not just on write, and an unguarded read would have taken the panel down for those users. |
| **5. `index.html`** — Forge article | Generated the panel markup. | Checked every form control has an associated `<label for>`; checked the key field is `type="password"` with `autocomplete="off"`; checked the output element is `<pre>` written via `textContent` in the controller, never `innerHTML`, because model output is untrusted text. Checked the status region carries `role="status"` and `aria-live="polite"` so results are announced. | Accepted. Added `novalidate` plus an explicit `submit` handler — pressing Enter in the role field would otherwise have submitted the form, reloaded the page, and dropped the key mid-request. |

---

## Additional findings from the same review

Not in the required table, but found and acted on:

| Finding | Action |
| --- | --- |
| `index.txt` — a plain-text dump of the entire template, still containing "Richard hanrick" and `richard@example.com` | Deleted. GitHub Pages would have served it at `/index.txt`, failing acceptance criterion 1 on a URL that never appears in the rendered page. Verified: now returns 404. |
| `.github/FUNDING.yml` inherited from the fork | Deleted. Left in place, my repository would have shown a "Sponsor" button soliciting money for the template's author. |
| Contact form posting to `action="#"` | Replaced with a `mailto:` link. Every "Send Message" click silently discarded the visitor's message. A form that pretends to work is worse than no form. |
| Google Maps iframe (`data-mapbox`) | Removed. Loads third-party tracking on every visit, against the no-analytics constraint in issue #1. |
| 26 unreferenced template assets (stock portraits, blog images, client logos, project photos) | Removed. Dead weight, and shipping stock photography next to project titles implies screenshots of work that does not exist. |
| Upstream's `data-selecct-value` typo | **Deliberately kept.** It is the contract between `script.js` and `index.html`. Renaming it in one place only would silently break the select label, and renaming it in both is churn with no user-visible benefit. Documented in the source so the next reader does not "fix" half of it. |

---

## What I did not verify, and why

Honest limits on this review:

- **A real Claude API call with a valid key.** The transport is confirmed
  reachable (a `401` from Anthropic proves the request arrived and was
  evaluated), and the request body is checked against the API's documented
  shape. The end-to-end path with a live key and a real completion has not been
  exercised by me. Test procedure is in
  [`test-results.md`](test-results.md#manual-test-still-outstanding).
- **The Codex handoff round trip against the real CLI.** The panel's half is
  verified — it makes zero network calls and produces the correct prompt text.
  Piping that into `codex exec` and pasting the result back has not been run.
- **Screen-reader testing.** `aria-current`, `role="status"`, labels, and alt
  text are present and structurally correct. No actual NVDA or VoiceOver pass
  was made, so this is a code-level check, not a usability result.
