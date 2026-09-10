# Acceptance Criteria

Written **before** any AI assistant was asked to change the project
(Assignment Q3). Each criterion describes observable behavior and names the
check that decides pass/fail. Results are recorded in `docs/test-results.md`.

| # | Acceptance criterion | How I will verify it |
| --- | --- | --- |
| 1 | The published site shows my real name, professional title, and a working contact link. No template placeholder identity remains anywhere in the shipped HTML — not "Richard hanrick", not `richard@example.com`, not the stock avatar, not Sacramento. | `grep -riE "richard\|hanrick\|example\.com\|sacramento\|lorem" index.html` returns zero matches. Then load the live GitHub Pages URL and read the sidebar with my own eyes. |
| 2 | The Portfolio section presents at least three real projects. Each has a title, a description, and a link that resolves with HTTP 200. Resume Forge is the featured entry and links to a written architecture summary. | Click every project link on the **live** site; confirm 200 (not 404) in the DevTools Network panel. Count the rendered project cards. |
| 3 | Every navigation control reaches its intended section using the keyboard alone, and the active section is announced to assistive technology. | Tab through the nav with no mouse; press Enter on each item; confirm the section changes, the focus ring is visible, and the active control carries `aria-current="page"`. |
| 4 | A visitor can choose an AI provider and supply their own API key, and that key is never persisted beyond the browser tab and never committed. `localStorage` stays empty; "Forget key" clears the field and the session store. | Enter a dummy key, open DevTools → Application: confirm the value is in `sessionStorage` only and `localStorage` is empty. Click **Forget key**, confirm both are clear. Run `bash scripts/scan-secrets.sh` against the repo. |
| 5 | The layout stays usable at a 360px-wide viewport with no horizontal scrolling, and every image either carries meaningful `alt` text or is explicitly marked decorative (`alt=""`). | DevTools device toolbar at 360×640. In the console, assert `document.documentElement.scrollWidth <= window.innerWidth`. Audit every `<img>` for an `alt` attribute. |

## Non-goals for this assignment

Recorded so that "we didn't build it" is a decision on the record, not an
oversight:

- No backend service, no database, no login or session system.
- No analytics, telemetry, or third-party tracking script.
- No server-side storage or transmission of visitor data or API keys. The
  site operator (me) never receives either.
- No invented education, employment history, dates, awards, or credentials.
- The upstream MIT license and attribution are preserved.
- The vCard layout and visual system are preserved. Changes are limited to
  content, styling, and small front-end corrections.
