# Decision Log

Every decision on this project that could reasonably have gone another way,
with the reasoning and who made the call. Recorded so that "why is it like
this" has an answer that is not "the AI did it."

**Legend:** *Mine* = I decided. *Proposed / accepted* = the assistant suggested
it and I agreed. *Proposed / rejected* = it suggested it and I did not.

---

## D1 — One codebase with a provider adapter, not two versions of the site

**Date:** 2026-09-10 · **Status:** Implemented · **Proposed / accepted**

I started unsure whether supporting Claude and Codex meant maintaining two
builds. It does not. Both providers take the same `{system, user}` prompt and
return text, so the difference is endpoint, headers, and response shape — data,
not code. Isolated into one object per provider in
`assets/js/forge/providers.js`.

**Falsifiable prediction that justified accepting it:** adding a provider
should be one object literal touching no other file. It held, and it survived a
change it was not designed for (D2).

**Alternative rejected:** two branches or two HTML files. Doubles the
maintenance surface and guarantees drift.

## D2 — Two transports behind one adapter

**Date:** 2026-09-10 · **Status:** Implemented · **Mine, on tested evidence**

Testing showed `api.anthropic.com` accepts browser calls and
`api.toolkit.umgpt.umich.edu` cannot — its gateway answers a CORS preflight
with `401`, and browsers never send `Authorization` on a preflight nor accept a
non-2xx one. So Claude is called directly and Codex hands the prompt to the
local `codex` CLI.

**Alternative rejected — a proxy server.** It would have worked. It also would
have been a backend, which the constraints in issue #1 forbid, and it would
have routed a U-M credential through a third-party server. No test would have
caught either problem; only reading my own constraints did.

**Unintended benefit:** in the handoff path the U-M key never enters a web page
at all. The constraint produced a better design than the plan.

Evidence: `provider-transport-findings.md`.

## D3 — Ship the AI panel despite the "no external data collection" constraint

**Date:** 2026-09-10 · **Status:** Implemented · **Mine**

The assignment's sample prompt forbids "a backend, login system, analytics
tracker, or external data collection." A browser AI panel makes outbound calls.
The assistant raised the tension before proposing anything rather than quietly
resolving it.

**Decision:** ship it, and write the exception into the constraints section of
issue #1 so it is authorised on the record. It adds no backend, no database, no
login, and collects nothing — I receive no key, no text, and no telemetry,
because there is no server of mine to receive them. The Google Maps iframe was
removed for exactly the reason the constraint exists.

## D4 — `sessionStorage`, never `localStorage`, for the visitor's key

**Date:** 2026-09-10 · **Status:** Implemented · **Proposed `localStorage` / revised**

`localStorage` survives reboots. On a shared or lab machine that hands the next
person a working API key. Changed to `sessionStorage`, plus a `purge()` that
also sweeps `localStorage` in case a cached older build wrote there, and a
`leakedToLocalStorage()` detector that surfaces a stale key instead of leaving
it.

Verified both directions: the detector returns `false` clean and `true` when a
stale key is planted.

## D5 — Delete sections rather than fill them

**Date:** 2026-09-10 · **Status:** Implemented · **Mine**

The template has slots for testimonials, client logos, blog posts, and skill
proficiency bars. The assistant was willing to generate all of them. I have no
testimonials and no clients, and a percentage like "JavaScript 85%" is not
measured against anything.

**Decision:** delete, do not fill. The skills section carries a visible note on
the page explaining why there are no percentages on it. A portfolio advertising
a resume tool that refuses to fabricate cannot itself fabricate.

## D6 — Replace the contact form with a `mailto:` link

**Date:** 2026-09-10 · **Status:** Implemented · **Proposed / accepted**

The template's form posts to `action="#"`, so every "Send Message" click
silently discarded the visitor's message. With no backend there is nothing to
receive it. A form that pretends to work is worse than no form.

## D7 — Fix the template's navigation bug rather than work around it

**Date:** 2026-09-10 · **Status:** Implemented · **Proposed / accepted**

Upstream set the active nav link using the inner (page) loop counter, so the
right tab highlighted only while the nav list and page list stayed the same
length and order. Adding the Forge section would have silently highlighted the
wrong tab. Pages are now addressed by an explicit `data-nav-link` value.

Also added `aria-current`, hash deep-linking, and null guards on every DOM
lookup — the last after removing the testimonials markup orphaned
`modalCloseBtn.addEventListener` and killed every listener after it.

## D8 — Keep upstream's `data-selecct-value` typo

**Date:** 2026-09-10 · **Status:** Implemented · **Mine**

It is misspelled, and it is the contract between `script.js` and `index.html`.
Renaming it in one place silently breaks the select label; renaming it in both
is churn with no user-visible benefit. Kept, and documented in the source so
the next reader does not "fix" half of it.

## D9 — Publish professional content only; withhold clearance, phone, address, and Veterans' Preference

**Date:** 2026-09-10 · **Status:** Implemented · **Mine, after being asked**

The resumes contain a phone number, a home address, "Active Secret Clearance
(Tier 3)", and "Veterans' Preference: 10-Point / 30% Compensable."

**Decision:** none of those go on the public site.

- **Veterans' Preference / 30% Compensable** discloses a service-connected
  disability rating. That is medical information. It is a legitimate factor on
  a federal application and has no place on a permanently indexed public page.
- **Clearance level** is OPSEC-adjacent for a serving ISSM. It belongs on a
  targeted application. Available on request.
- **Phone and street address** have no professional reason to be published.

A resume goes to a named recipient; a portfolio is public and permanent. They
do not warrant the same disclosure. Full table in `content-notes.md` §4.

## D10 — Federal resume is authoritative where the two disagree

**Date:** 2026-09-10 · **Status:** Implemented · **Mine, after being asked**

My two resumes conflict on TACOM role dates (06/2024 vs 03/2022), on whether
the Army Fellows Program is a separate role, on the 2025 award's name
("Department of the Army" vs "Department of War"), and on the M.S. start date.

**Decision:** the federal resume governs, because a federal resume is held to a
higher accuracy standard and its version is more granular. The 74% / $33,500
outcomes appear only in the June 2026 resume and are published, attributed to
the TACOM role, because they are my own claim about my own work.

**Open action:** one of those documents is wrong and both are in circulation.
Reconcile before either is sent anywhere. Tracked as an issue in this repo.

## D11 — Raw `fetch`, not the Anthropic SDK

**Date:** 2026-09-10 · **Status:** Implemented · **Mine**

The SDK is the normal choice. This site is deliberately a no-build static
deployment, so there is no bundler to install a package into, and loading an
SDK from a CDN would add a third-party script to an origin that handles a live
API key. The same adapter also has to serve a non-Anthropic provider.

**Trade-off accepted:** I own the error mapping and response parsing that the
SDK would have provided.

## D12 — Keep the API key file out of the repository, and stop keeping it in OneDrive

**Date:** 2026-09-10 · **Status:** Recommendation open · **Mine**

`Codex API Key.txt` sits two directories above the repository, so it cannot be
committed from here, and `.gitignore` would catch it if it moved in.

**But it is inside `OneDrive\Desktop`,** so it is not local — it is synced to
Microsoft's cloud and to every device signed into that account. It is also
redundant: `codex` reads `~/.codex/auth.json`, which already holds the key.

**Recommendation:** delete the OneDrive copy. If a scratch copy is needed for
testing, keep it outside any synced folder. See `SECURITY-KEYS.md`.

## D13 — Documentation lives in the repository, mirrored outward

**Date:** 2026-09-10 · **Status:** Implemented · **Mine**

The repository is the source of truth for every assignment artifact, because it
is version-controlled, timestamped, and the thing being graded. Copies made
elsewhere — the submission text file, a Google Doc — are mirrors of it, and are
regenerated from it rather than edited independently.
