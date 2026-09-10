# Reflection

Assignment Q15. Also posted as a **Reflection** issue in this repository.

---

## A. GitHub practice

*Which GitHub action, issue, branch, commit, pull request, review, or Pages
deployment was most useful to you, and why?*

**The issue, written before any code.** Not because it tracked work — a
five-item checklist does not need GitHub — but because writing the
**Constraints** section forced a decision I would otherwise have drifted into.

The assignment's own prompt template says "Do not add: a backend, login system,
analytics tracker, or external data collection." I wanted a panel that calls an
AI provider. Those are in tension. Having to write that tension down as an
explicit, authorised exception — *bring-your-own-key only, no server, no
database, no login, no key of mine, no data returned to me* — turned a vague
intention into a testable boundary.

It paid off twice. When CORS blocked the Toolkit endpoint, the obvious fix was
a small proxy. The constraints section said no backend, in my own words, dated
before I hit the problem. That rejected the shortcut for me instead of leaving
me to argue with myself at the point of maximum temptation. And acceptance
criterion 4 came straight out of it, which is what made the key handling
testable rather than merely intended.

The feature branch mattered for a duller reason: it meant every intermediate
state — including the one where I broke navigation — stayed off `master`.

## B. AI practice

*Which AI-generated suggestion did you accept, and what evidence justified
accepting it?*

**The single-adapter design.** I started this genuinely unsure whether
supporting Claude and Codex meant maintaining two versions of the site. The
assistant's answer was that both providers take the same `{system, user}`
prompt and return text, so the difference is endpoint, headers, and response
shape — data, not code.

I did not accept that because it sounded right. I accepted it because it made a
falsifiable prediction: if true, adding a provider should be one object literal
touching no other file. That is exactly how it turned out — `providers.js` is
the only provider-aware file in the project, and `forge.js` never learns which
provider it is talking to.

The stronger evidence came later, when the two providers turned out to need
completely different **transports**. A design that had branched on provider
throughout the codebase would have needed surgery in every branch. Because the
difference was isolated to one object, "Codex cannot be called from a browser"
became a `transport: 'handoff'` field and one hidden block. The abstraction
survived a change it was not designed for, which is the only real test an
abstraction gets.

## C. AI limitation

*What did the AI get wrong, overlook, or make unnecessarily complicated? How
did you detect and correct it?*

Three things, and the pattern connecting them is more useful than any of them
individually.

**It asserted a network fact it had not checked.** The plan said the browser
calls both providers directly. Half of that was false. I had it probe the
endpoints with `curl` before writing provider code: `api.anthropic.com` answers
a preflight with `200`; the U-M Toolkit answers `OPTIONS` with `401` in every
variation, because it sits behind a gateway that authenticates the preflight
itself. Browsers never send `Authorization` on a preflight and reject any
preflight that is not `2xx`, so no web page can ever call it. Confirmed in
Chrome afterwards: Anthropic returned `401` with a JSON body — reached — while
the Toolkit threw `TypeError: Failed to fetch` — blocked. Detected by testing
the assumption instead of the code.

**It did not follow through on the consequences of its own deletion.** Removing
the testimonials section was treated as content work. It was not: `script.js`
called `modalCloseBtn.addEventListener` with no null check, so deleting that
markup threw at load and killed every listener registered afterwards, including
all navigation. The site would have rendered perfectly and been completely dead
to clicks. Detected by reading the template's JavaScript rather than trusting a
summary of what the change touched. Corrected by guarding every DOM lookup.

**It was willing to fabricate.** Offered a skills section with "JavaScript 85%",
and a filled-in education and employment timeline I had never supplied. The
percentages are not measured against anything, and the history would have been
invented outright. Rejected both; the skills section now carries a visible note
saying why there are no percentages on it. This is the failure that would have
mattered most, because it is the one that produces a confident, professional
artifact that is simply untrue — and on a *resume* tool, of all things.

**The pattern:** the AI was reliable on things it could see (the template's
markup, the shape of an API request) and unreliable on things it could not (how
a remote server behaves, what my actual work history is). It did not
distinguish between those two categories in its own output. Both arrived in the
same confident register. Learning to sort its claims by *what would this have
to have observed to know it* was the most transferable thing I got from this
assignment.

## D. Engineering judgment

*How did the workflow change your understanding of the statement: "AI may
generate code, but engineers remain responsible for the system"?*

I read that statement, before this assignment, as being about **review** —
about catching bugs in generated code. That is the small version of it.

Every consequential decision in this project was one the AI could not have made
for me, and mostly one it did not raise until asked:

- Whether an outbound API call violates "no external data collection" is a
  reading of an assignment specification. That is a judgment about intent.
- Whether to reject a proxy — the fastest fix to a real blocker — is a judgment
  about which constraint is load-bearing.
- Whether "JavaScript 85%" is acceptable is a judgment about honesty, and the
  AI had no way to know it was false, because I never told it what was true.

The last one is the sharpest. The AI's fabricated skill bars were not a bug. The
code worked. The bars rendered. They were *wrong* in a way no test suite would
have caught, and the only reason they did not ship is that a person who knew
the facts looked at them and said no. Correctness and truthfulness are
different properties, and only one of them is mechanically checkable.

What actually changed: I now think of responsibility as sitting with whoever
holds the **context the model does not have** — the specification's intent,
the real facts, the consequences of being wrong, and the standing to decide
what is acceptable. Generation is the cheap part. That context is the job, and
it does not transfer.

The clearest single illustration is that a proxy server would have worked. It
would have fixed CORS, shipped Codex support, and looked like a win in a demo.
It also would have violated a constraint I had written down myself and put a
U-M credential on a third-party server. No test would have failed. Only a
person reading their own constraints could have caught it.

## E. Next improvement

*Identify one improvement you would make in a second iteration. State its
value, risk, and the evidence you would need before implementing it.*

**Self-host the Ionicons library instead of loading it from `unpkg.com`.**

**Value.** It is currently the only third-party JavaScript on the origin, and
it is the weakest link in the security posture of the whole Forge panel. That
panel handles a visitor's API key in page memory. Any script on the origin can
read that memory, so a compromise of that CDN — or of the pinned package on it
— would put an attacker in the same execution context as a live credential.
Removing it makes the site's script surface entirely first-party, which is the
difference between "we trust our own code" and "we trust our own code and a
third party's release pipeline." It would also remove two blocking external
requests and let the site work fully offline.

**Risk.** Low, and mostly cosmetic. The icons are used throughout the template's
markup as `<ion-icon name="...">` custom elements, so I would need either the
full library or a hand-built subset with a matching custom-element definition.
A subset risks missing an icon somewhere I did not check, which shows as a
blank space rather than an error — a silent, easy-to-miss regression. Self-
hosting also means the version freezes at whatever I vendor, so a security fix
upstream is now my job to notice.

**Evidence I would need first.** An inventory of every `ion-icon` name actually
used in `index.html` after my content changes, since I deleted several sections
and the set is much smaller than the template's original. A size comparison
between the full library and that subset, to see whether the subset is even
worth the added risk. And a rendering pass over all five sections at both
desktop and 360px widths, comparing against the current build, to confirm no
icon silently disappeared. If the used-icon set turns out to be small — I
expect roughly eight — the honest answer is probably to drop the dependency
entirely and inline those eight as SVG, which removes the custom-element
runtime as well.
