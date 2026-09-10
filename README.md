# Resume Forge Portfolio

Personal portfolio for **Jerad Dunne**, with a bring-your-own-key AI panel that
rewrites resume bullets in the browser.

Built for **SWE 380 / CSC 580, Assignment 1 — GitHub + AI Engineering
Practice**. The point of the assignment is not that a model can produce a
website. It is that I can direct, inspect, test, and take responsibility for
AI-assisted work, so this repository publishes the reasoning as well as the
result.

**Live site:** https://jeraddunne.github.io/resume-forge-portfolio/

---

## Attribution

This is a fork of **[vCard Personal Portfolio][vcard]** by
**[codewithsadee][author]**, used under the MIT License. The original layout,
visual system, and CSS architecture are theirs. `LICENSE` is preserved
unchanged, with its original copyright line intact.

My work is the content, the accessibility and correctness fixes, and the Forge
panel. Everything I changed is itemised in [`docs/code-review.md`](docs/code-review.md)
and visible in the commit history.

[vcard]: https://github.com/codewithsadee/vcard-personal-portfolio
[author]: https://github.com/codewithsadee

---

## The Forge panel

A working slice of [Resume Forge](docs/resume-forge.md): paste one resume
bullet, get three rewrites plus an explicit list of the evidence the bullet is
missing. The prompt's anti-fabrication rule outranks every style rule — if your
bullet has no metric, it asks you a question instead of inventing one.

### Bring your own key

There is no shared key, no default key, and no key of mine anywhere in this
repository. You supply your own, and it stays in your browser.

| | Claude | Codex (U-M GPT Toolkit) |
| --- | --- | --- |
| Transport | Direct browser call to `api.anthropic.com` | Handoff to your local `codex` CLI |
| Key location | `sessionStorage`, this tab only | **Never enters the browser** |
| Network call from this page | Yes, to Anthropic only | None at all |
| Where to get a key | [console.anthropic.com][keys] | U-M GPT Toolkit |

[keys]: https://console.anthropic.com/settings/keys

**Why two transports rather than two versions of the site?** Both providers
take the same `{system, user}` prompt and return text, so provider support is
one object in [`assets/js/forge/providers.js`](assets/js/forge/providers.js),
not a second codebase. The transports differ because the endpoints do: the
U-M Toolkit gateway rejects browser preflight requests, so no web page can call
it. That is measured, not assumed — see
[`docs/provider-transport-findings.md`](docs/provider-transport-findings.md)
for the probes and the raw responses. Standing up a proxy would have fixed the
CORS problem and broken two project constraints at once, so the Codex path
hands the prompt to the CLI instead.

### What happens to your data

- The key is held in `sessionStorage` for one tab and is gone when you close
  it. It is never written to `localStorage`, a cookie, or a server.
- Your bullet text goes to the provider you selected, and nowhere else. This
  site has no backend for it to pass through.
- Error text is passed through a redactor before display, so a key echoed back
  inside an API error cannot surface in the UI.
- Model output is rendered with `textContent`, never `innerHTML`.

Full policy: [`docs/SECURITY-KEYS.md`](docs/SECURITY-KEYS.md).

---

## Running it locally

The site is static with no build step, but the Forge panel uses ES modules, so
it needs a web server — `file://` will block the module imports and the API
call alike.

```bash
git clone https://github.com/jeraddunne/resume-forge-portfolio.git
cd resume-forge-portfolio
python -m http.server 8000
# then open http://localhost:8000
```

Check that nothing sensitive is tracked before you push:

```bash
bash scripts/scan-secrets.sh
```

---

## Assignment documentation

| Document | What it holds |
| --- | --- |
| [`content-notes.md`](content-notes.md) | Public-safe source material, and every template field I deliberately declined to publish |
| [`ai-log.md`](ai-log.md) | The prompts, the responses, and what I did with each |
| [`docs/ai-usage-journal.md`](docs/ai-usage-journal.md) | Full session-by-session AI record for academic integrity |
| [`docs/acceptance-criteria.md`](docs/acceptance-criteria.md) | The five criteria, written before any AI touched the project |
| [`docs/ai-plan-review.md`](docs/ai-plan-review.md) | What I accepted from the AI plan, what I revised, what it missed |
| [`docs/code-review.md`](docs/code-review.md) | Human review of every AI-generated change |
| [`docs/test-results.md`](docs/test-results.md) | Test runs and evidence |
| [`docs/provider-transport-findings.md`](docs/provider-transport-findings.md) | The CORS investigation that decided the architecture |
| [`docs/resume-forge.md`](docs/resume-forge.md) | Case study for the desktop application |
| [`docs/reflection.md`](docs/reflection.md) | Reflection responses |

---

## Project structure

```
├── index.html                  # single page, five tabbed sections
├── assets/
│   ├── css/
│   │   ├── style.css           # upstream template styles, unmodified
│   │   ├── forge.css           # Forge panel (mine)
│   │   └── a11y.css            # accessibility corrections (mine)
│   ├── js/
│   │   ├── script.js           # template shell, with fixes marked FIX/ADDED
│   │   └── forge/
│   │       ├── providers.js    # provider adapter — the only provider-aware file
│   │       ├── prompts.js      # bullet doctrine and anti-fabrication rules
│   │       ├── key-store.js    # session-only key handling
│   │       └── forge.js        # UI controller
│   └── images/                 # generated SVGs; no stock photography
├── scripts/scan-secrets.sh     # pre-push credential scan
└── docs/                       # assignment documentation
```

The Forge feature is removable by deleting `assets/js/forge/`,
`assets/css/forge.css`, and one `<article>` from `index.html`.

---

## License

MIT — see [`LICENSE`](LICENSE). Original template © 2022 codewithsadee.
Additions © 2026 Jerad Dunne, under the same license.
