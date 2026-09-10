# Review of the AI Plan

Assignment Q7. Completed before any AI-proposed change was applied.

---

## Required table

| Review item | My response |
| --- | --- |
| **Accepted plan element** | **One provider adapter, not two builds of the site.** I had asked whether supporting Claude and Codex meant maintaining two versions. The plan showed that both APIs take a `{system, user}` prompt and return text, so the only real difference is endpoint, headers, and response shape — data, not code. Accepted, and it became `assets/js/forge/providers.js`, the single provider-aware file in the project. Evidence it holds: adding a third provider is one object literal and touches nothing else. |
| **Revised plan element** | **Key storage, and the Codex transport.** The plan proposed `localStorage` for the visitor's key; I changed it to `sessionStorage` so a key cannot outlive the tab on a shared or lab machine, and added a purge that also sweeps `localStorage` in case an earlier build wrote there. Larger revision: the plan assumed both providers could be called from the browser. Testing showed the U-M Toolkit cannot be, so the single direct-call design became one adapter with two transports. |
| **Risk the AI identified** | **The constraint conflict, raised before it proposed anything.** The assignment's own prompt template forbids "a backend, login system, analytics tracker, or external data collection," and a browser-side AI panel makes outbound calls. Rather than quietly deciding this was fine, it put the decision to me with the trade-off stated. I chose to ship the panel and to write the constraints section of issue #1 so the exception is authorised on the record. It also flagged that it could not verify U-M Toolkit CORS without testing — which turned out to matter more than either of us expected. |
| **Risk the AI missed** | **Everything downstream of deleting a section.** The plan treated "remove the testimonials, clients, and blog sections" as pure content work. It is not: `script.js` held `modalCloseBtn.addEventListener(...)` with no null check, so removing that markup threw on page load and killed every listener registered after it, navigation included. The site would have rendered and been completely dead to clicks. It also missed `index.txt` — a plain-text dump of the whole template, still carrying "Richard hanrick" and `richard@example.com`, which GitHub Pages would have served at `/index.txt` and which fails acceptance criterion 1 on a URL that never appears in the rendered page. Neither was in the plan. Both were found by reading the template's own code and file list rather than trusting a summary of it. |

---

## Additional notes on the plan

### What I asked it to prove rather than assert

The plan's riskiest line was "the browser calls the provider directly." That is
a network claim, and network claims are cheap to state and expensive to be
wrong about. I had it probed with `curl` before a line of provider code was
written, then confirmed in Chrome afterwards. Half the claim was false. Had I
accepted it, I would have built the Codex path, deployed, and discovered on the
live site that it could never have worked.

The general lesson I am taking from this: a plan's factual assumptions about
systems you do not control are the part to test first, because they are the
part that invalidates the design rather than just the implementation.

### What I declined for content reasons

The plan was willing to generate a resume timeline, skill proficiency
percentages, testimonials, and client logos, because the template has slots for
them. Every one of those would have been fabricated. A resume tool that
fabricates is worse than no tool, and the same standard has to apply to the
portfolio advertising it. Those sections were deleted rather than filled, and
the skills section carries a visible note explaining why there are no
percentages on it.

### Where I overrode the tooling default

`gh issue create` was run without `--repo` and filed the project issue against
the upstream template repository instead of my fork. That is logged in
[`../ai-log.md`](../ai-log.md), Entry 6. The correction was to enable Issues on
the fork and pin `gh repo set-default`. The general form of the mistake —
a tool silently resolving to a different target than intended — is worth more
attention than the specific slip.
