# API Key Handling Policy

This project is **bring-your-own-key**. There is no shared key, no default key,
no trial key, and no key of mine anywhere in this repository or in the deployed
site. This document states what happens to a key, what the residual risks are,
and how the policy is enforced.

---

## The rules

1. **No credential is ever committed.** Not in source, not in config, not in a
   comment, not in a test fixture, not in documentation.
2. **The site operator cannot receive a visitor's key.** Not by design choice —
   by architecture. There is no backend, so there is nowhere for it to arrive.
3. **A key lives no longer than the browser tab.** `sessionStorage` only, and
   only if the visitor ticks the box.
4. **A key travels to exactly one destination:** the provider the visitor
   selected, over HTTPS, in the request that visitor triggered.
5. **A key never appears in a URL.** Not a path, not a query string, not a
   fragment. URLs land in server logs, browser history, and `Referer` headers.
6. **A key is never logged, and never rendered.**

---

## What actually happens to a key

### Claude (direct transport)

```
[ visitor's browser ] ──HTTPS──> api.anthropic.com
         │
         └── sessionStorage, this tab only, if the box is ticked
```

The request goes from the visitor's browser straight to Anthropic. It does not
pass through GitHub Pages, and it does not pass through anything of mine.
GitHub Pages serves static files; it has no ability to intercept an outbound
`fetch` from a page it served.

The `anthropic-dangerous-direct-browser-access: true` header is required for
this. The name is a deliberate warning: browser-side calls are dangerous when
the key belongs to the *site operator*, because every visitor would be spending
it. They are appropriate when the key belongs to the *person at the keyboard*,
which is this case.

### Codex (handoff transport)

```
[ visitor's browser ] ── prompt text ──> clipboard ──> local `codex` CLI ──> U-M Toolkit
```

The key never enters the browser at all. It stays in `~/.codex/auth.json` where
the U-M setup process put it. The page makes **no network call** on this path —
verified by wrapping `window.fetch` and counting calls across the full flow:
zero.

This started as a workaround for a CORS restriction and ended up the more
secure of the two paths.

---

## Code-level protections

| Protection | Where | Why |
| --- | --- | --- |
| `sessionStorage`, never `localStorage` | `key-store.js` | A key must not outlive the tab on a shared or lab machine. |
| Every storage access wrapped in `try/catch` | `key-store.js` | `sessionStorage` throws on *access*, not just write, under some privacy settings. An unguarded read would break the panel for those users. |
| `purge()` sweeps `localStorage` too | `key-store.js` | Cleans up anything an older cached build on the same origin may have written. |
| `leakedToLocalStorage()` detector | `key-store.js` | Surfaces a stale key to the visitor instead of leaving it sitting there. |
| `redact()` on all error text | `providers.js` | An API error can echo the submitted key back. Without this it would be rendered into the page. |
| `textContent`, never `innerHTML`, for model output | `forge.js` | Model output is untrusted text and must never be parsed as markup. |
| `type="password"`, `autocomplete="off"` | `index.html` | Keeps the key out of the browser's saved-form store and off the screen. |
| `novalidate` + explicit submit handler | `forge.js` / `index.html` | Prevents an Enter keypress reloading the page mid-request. |
| No key in any URL | throughout | See rule 5. |

---

## Repository protections

**`.gitignore`** leads with secrets rather than build artefacts:

```
.env / .env.*      auth.json        credentials.json
*.key *.pem        secrets.json     .codex/
*.p12 *.pfx        **/apikey*.txt
```

**`scripts/scan-secrets.sh`** fails on anything key-shaped in tracked files:

```bash
bash scripts/scan-secrets.sh
```

It checks for Anthropic (`sk-ant-…`) and OpenAI (`sk-…`) key formats, bearer
token literals, assigned `*_API_KEY` variables, AWS access key ids, and private
key blocks — and separately rejects filenames that must never be tracked at
all, regardless of content. Run before every push.

Current status: **clean**.

---

## Residual risks, stated plainly

No design is risk-free, and a security document that only lists mitigations is
marketing. These are the real ones:

| Risk | Assessment |
| --- | --- |
| **A key is in the page's JavaScript memory while in use.** Any script running on the origin could read it. | This is inherent to any browser-side BYOK design. Mitigated by the site loading no third-party JavaScript except the Ionicons font-icon library, and by there being no user-generated content, no query-parameter rendering, and no `innerHTML` sink for an attacker to reach. It is not eliminated. |
| **Ionicons loads from `unpkg.com`.** | Inherited from the template. A compromise of that CDN would put script on the origin. Pinned to `5.5.2`. Self-hosting it would remove the risk entirely and is the first thing I would change in a second iteration. |
| **A visitor might paste a key into the wrong field.** | The key field is the only `type="password"` input on the page, and it is labelled and grouped under a numbered step. |
| **Browser extensions can read page memory.** | Outside the site's control. True of every web page that handles a credential. |
| **A key typed on a shared machine.** | `sessionStorage` bounds exposure to the tab's lifetime, the "keep for this tab" box is off by default, and **Forget key** purges both stores immediately. |

---

## If a key is ever exposed

1. **Revoke it first**, at `console.anthropic.com` or with the U-M ITS AI
   Services team. Revocation is the fix; everything else is cleanup.
2. Remove it from the working tree and run `bash scripts/scan-secrets.sh`.
3. If it was ever pushed, rewriting history is **not** sufficient on its own —
   assume it was scraped the moment it was public. Revoke regardless.
