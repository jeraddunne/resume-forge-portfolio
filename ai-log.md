# AI Use Log

Required by Assignment 1, Q6. This is the record of every AI interaction that
shaped this repository: what I asked, what came back, and what I did about it.

A fuller session-by-session record, including the interactions that produced no
code, is in [`docs/ai-usage-journal.md`](docs/ai-usage-journal.md).

---

## Tools used

| Tool | Model | Role in this work |
| --- | --- | --- |
| Claude Code (CLI) | Claude Opus 5 | Planning, implementation, verification. The primary assistant. |
| Codex CLI | `gpt-5.6-terra` via U-M GPT Toolkit | Configured and used as the second provider the Forge panel targets. Not used to write repository code. |

**A note on honesty of format.** The assignment's template imagines one prompt
and one response. My actual work was an agentic session: I gave direction, the
assistant read files, ran commands, proposed, and I accepted or rejected. I
have logged it as it happened rather than reformatting it into a tidy
single-exchange shape it never had. The structured prompt the assignment asks
for is in the appendix, and it is the prompt that framed the planning turn.

---

## Entry 1 — Opening direction

**Date:** 2026-09-10 · **Model:** Claude Opus 5

**My prompt, verbatim:**

> I am looking at building out the following assignment based on the resume
> forge initial concept I built for me personally and integrate api key usage
> for claude and codex. I sm looking to build this out in my git repository
> ensuring I do not expose any api keys. I want the users to use their own api
> keys and have a choice to use codex or claude so that being said I am not
> sure if two versions need to be added or if I can have the user select the
> api plateform then put the key that matches. I am looking to follow the
> assignment. I also want to make sure I keep a log of my AI prompting and
> usage for academic integrity and provide what my prompts and choices and the
> outcomes

**Attachments in context:** the assignment PDF, my `resume-forge` source
archive, and the U-M ITS Codex setup article.

**What the assistant did:** read the assignment and the Resume Forge source
tree, then flagged a conflict before proposing anything — the assignment's own
prompt template says "Do not add: a backend, login system, analytics tracker,
or external data collection," and a browser-side AI panel makes outbound API
calls. It did not quietly resolve this for me; it put the decision up.

**My decision:** ship the live panel, and write the constraints section of
issue #1 to scope and authorise it explicitly, so the grader sees a documented
decision rather than scope creep.

**Answer to my actual question — one version or two:** one. Both providers take
the same `{system, user}` prompt and return text, so provider support is a data
difference, not a code difference. It became one object per provider in
`assets/js/forge/providers.js`. **Accepted.**

---

## Entry 2 — Three decisions I was asked to make

**Model:** Claude Opus 5

Rather than assume, the assistant asked three questions where different answers
meant materially different work:

| Question | My choice | Why |
| --- | --- | --- |
| Which starter repo? | vCard Personal Portfolio | No instructor alternative was provided; the assignment names this one. |
| How does Resume Forge appear on the site? | Live BYOK tool **and** case study | The live tool is the strongest available evidence of AI-engineering practice. The risk is documented rather than avoided. |
| Which providers? | Claude + U-M GPT Toolkit | The Toolkit key is the one my course issues, and it is the FERPA-compliant path. |

---

## Entry 3 — The assumption I made it check

**Model:** Claude Opus 5 · **This is the most important entry in the log.**

The plan assumed both APIs could be called from a browser. Before writing any
provider code, I had that assumption tested rather than trusted.

**Result: half the plan was wrong.**

- `api.anthropic.com` answers a CORS preflight with `200`,
  `access-control-allow-origin: *`, and explicitly permits the
  `anthropic-dangerous-direct-browser-access` header. Browser calls work.
- `api.toolkit.umgpt.umich.edu/v1/chat/completions` answers `OPTIONS` with
  `401` in every variation tried — no origin, bogus key, valid-looking headers.
  It sits behind a Portkey gateway that authenticates the preflight itself.
  Browsers never send `Authorization` on a preflight and reject any preflight
  that is not `2xx`, so **no web page can ever call it.**

Later confirmed live in Chrome: the Anthropic probe returned `401` with a JSON
body and `response.type === "cors"` (reached), while the Toolkit probe threw
`TypeError: Failed to fetch` (blocked).

**Rejected fix:** a small proxy to forward Toolkit calls. It would have solved
CORS and broken two constraints at once — it is a backend, and it would put a
U-M key on a third-party server.

**Accepted fix:** two transports behind one adapter. Claude is called directly;
Codex hands the prompt to the local `codex` CLI and takes the answer back. The
U-M key never enters a web page at all, which is a better security outcome than
what I originally asked for.

Evidence: [`docs/provider-transport-findings.md`](docs/provider-transport-findings.md).

---

## Entry 4 — Generated output I rejected

Not everything the assistant produced survived review.

| Generated | Verdict | Reason |
| --- | --- | --- |
| Skill bars — "JavaScript 85%", "React 90%" | **Rejected** | A proficiency percentage is not measured against anything. The template supplying the markup does not make the number true. Replaced with a grouped capability list and a note on the page saying why. |
| Filled-in education and employment timeline entries | **Rejected** | I did not supply this history, so any version of it would have been invented. Section rebuilt around work I can point to. |
| Testimonials and client-logo sections | **Rejected** | I have no testimonials and no clients. Deleted rather than filled. |
| Keeping the contact form | **Rejected** | It posts to `#`, so every "Send Message" click silently discarded the visitor's message. Replaced with a `mailto:` link. |
| Keeping the Google Maps iframe | **Rejected** | Third-party tracking on every page load, against the no-analytics constraint. |
| `localStorage` for the API key | **Revised** | Changed to `sessionStorage` so a key cannot outlive the tab on a shared or lab machine. |

---

## Entry 5 — What the assistant caught that I would have missed

| Finding | Consequence if shipped |
| --- | --- |
| `index.txt` — a plain-text dump of the whole template, still containing "Richard hanrick" and `richard@example.com` | GitHub Pages would have served it at `/index.txt`. Acceptance criterion 1 fails on a URL that never appears in the rendered page. |
| `.github/FUNDING.yml` inherited from the fork | My repository would have solicited sponsorship for the template's author. |
| `navigationLinks[i]` indexed by the **page** loop counter | Adding the Forge section silently highlighted the wrong tab. |
| Removing testimonials orphaned `modalCloseBtn.addEventListener` | Threw on load and killed every listener registered after it — navigation included. Self-inflicted by an earlier step in the same session, caught before commit. |

---

## Entry 6 — A mistake the assistant made, and the correction

While creating the project issue, `gh issue create` was run without `--repo`.
In a fork clone, `gh` resolves to the **parent** repository, so the issue was
filed against `codewithsadee/vcard-personal-portfolio` — a public project with
8,000 stars — instead of my fork.

It was closed within a minute with an apology comment. Deleting an issue needs
admin rights on that repository, so closing is the most that could be done; the
closed issue remains visible in their tracker. The fork had Issues disabled by
default, which is what let the fallthrough happen. Fixed by enabling Issues on
the fork and pinning `gh repo set-default`.

Recorded here because a log that only contains successes is not a log.

---

## Appendix — The structured prompt

The prompt form the assignment asks for, as used to frame the planning turn.

```
You are assisting with a small, public static portfolio website.

Project context:
- Purpose: present my skills and projects to internship reviewers.
- Existing system: a fork of the MIT-licensed vCard HTML/CSS/JS portfolio
  template.
- Allowed changes: content, styling, and small front-end corrections only.
- Do not add: a backend, login system, analytics tracker, or external data
  collection.
- One scoped exception, authorised in issue #1: a client-side panel where a
  visitor supplies their OWN API key. No server, no database, no login, no
  key of mine, and no data returned to me.

Acceptance criteria:
1. Real name, title, and working contact link; no template placeholder
   identity anywhere in the shipped HTML.
2. At least three real projects, each with a title, description, and a link
   that resolves 200.
3. Every navigation control reaches its section by keyboard alone, with a
   visible focus ring and aria-current on the active control.
4. A visitor can pick a provider and supply their own key; the key never
   persists beyond the tab and never appears in a committed file.
5. Usable at 360px with no horizontal scroll; every image has meaningful alt
   text or is explicitly decorative.

Constraints:
- Do not invent education, work history, awards, links, or technical skills.
  Where I have no real content, delete the section rather than fill it.
- Preserve the upstream license and attribution.
- Keep the site usable on mobile screens.
- Maintain readable contrast, keyboard navigation, meaningful link text, and
  useful image alternative text.
- Do not expose private information.

First provide:
1. A file-by-file implementation plan.
2. Any assumptions or risks — and verify the network assumptions by probing
   the actual endpoints before relying on them.
3. A proposed test checklist.
4. Any questions that must be answered before implementation.

Do not modify files until the plan is reviewed.
```
