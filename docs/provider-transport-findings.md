# Provider Transport Findings

**Question:** can a static page on GitHub Pages call the Anthropic API and the
U-M GPT Toolkit API directly from the visitor's browser?

**Answer:** Anthropic yes, U-M Toolkit no. This is why the Forge panel has two
transports instead of one, and it is the single finding that most changed the
architecture. It was measured before any provider code was written.

Date of measurement: **2026-09-10**.

---

## Why this had to be tested rather than assumed

A browser will not let a page call an arbitrary API. For any request carrying
an `Authorization` header or a JSON content type, the browser first sends a
**preflight** `OPTIONS` request, and it enforces two rules:

1. The preflight response status must be **2xx**.
2. The browser **never** sends `Authorization` on a preflight — so the endpoint
   must answer an unauthenticated `OPTIONS`.

An endpoint that requires auth on `OPTIONS` therefore cannot be called from a
web page, no matter what the key is. There is no client-side workaround: it is
not a bug to route around, it is the security model working as designed.

---

## Test 1 — Anthropic preflight

```
curl -i -X OPTIONS https://api.anthropic.com/v1/messages \
  -H "Origin: https://jeraddunne.github.io" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,x-api-key,anthropic-version,anthropic-dangerous-direct-browser-access"
```

```
HTTP/1.1 200 OK
access-control-allow-methods: DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT
access-control-allow-headers: content-type,x-api-key,anthropic-version,anthropic-dangerous-direct-browser-access
access-control-allow-origin: *
access-control-max-age: 600
```

**Result: PASS.** 2xx, wildcard origin, and the browser-access header is
explicitly permitted. Anthropic supports this deliberately — the header is
named `anthropic-dangerous-direct-browser-access` because direct browser calls
are only safe when the key belongs to the person at the keyboard, which is
exactly the bring-your-own-key case.

---

## Test 2 — U-M GPT Toolkit preflight

```
curl -i -X OPTIONS https://api.toolkit.umgpt.umich.edu/v1/chat/completions \
  -H "Origin: https://jeraddunne.github.io" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

```
HTTP/1.1 401 Unauthorized
access-control-allow-origin: https://jeraddunne.github.io
access-control-expose-headers: x-portkey-cache-status
Server: cloudflare

{"status":"failure","message":"Portkey Error: Invalid API Key. Error Code: 03", ...}
```

**Result: FAIL.** The CORS header is present, which is misleading — but the
status is `401`, and a browser rejects any preflight that is not 2xx.

The gateway is **Portkey** (see `x-portkey-cache-status`), and it authenticates
the `OPTIONS` request itself rather than treating it as a preflight.

### Ruling out the alternatives

| Variation | Status | Conclusion |
| --- | --- | --- |
| No `Origin` header | 401 | Not origin-dependent |
| Bogus `Authorization: Bearer ...` | 401 | Not fixable with a valid key either — browsers never send it on a preflight |
| `OPTIONS /v1/models` | **200** | Route-specific, not a blanket `OPTIONS` block, so the 401 is a real auth decision |

Could the preflight be avoided? No. A request avoids preflight only if it uses
solely CORS-safelisted headers, and `Authorization` is not one of them. Any
Bearer-authenticated JSON API is preflighted by definition.

---

## Test 3 — Confirmation in a real browser

The curl probes predict the behaviour; Chrome confirms it. Both run from the
actual page, via the DevTools console:

```js
// Anthropic — deliberately invalid key. A 401 proves reachability.
await fetch('https://api.anthropic.com/v1/messages', { method:'POST', headers:{
  'content-type':'application/json', 'x-api-key':'sk-ant-invalid-...',
  'anthropic-version':'2023-06-01',
  'anthropic-dangerous-direct-browser-access':'true' }, body: '...' })
```

| Endpoint | Outcome |
| --- | --- |
| `api.anthropic.com` | `status: 401`, `response.type: "cors"`, JSON body `{"type":"error","error":{"type":"authentication_error","message":"API key is invalid."}}` — **reached** |
| `api.toolkit.umgpt.umich.edu` | `TypeError: Failed to fetch` — **blocked before the request was sent** |

A `401` from Anthropic is a success for this test: it means the request arrived
and was evaluated. A `TypeError` from the Toolkit means the browser refused to
send it at all.

---

## The decision

| Option | Verdict |
| --- | --- |
| Proxy Toolkit calls through a small server | **Rejected.** It is a backend, which issue #1 forbids, and it would route a U-M credential through a third-party server. Solving a CORS error is not worth either. |
| Put the key in a query string to dodge the preflight | **Rejected.** `Content-Type` would still need to be non-JSON, and keys in URLs land in server logs, browser history, and referrer headers. |
| Drop Codex support | **Rejected.** Provider choice was the point of the feature. |
| **Two transports behind one adapter** | **Adopted.** |

Claude is called directly from the browser. Codex is handoff-only: the panel
builds the prompt, the visitor runs it in their local `codex` CLI — already
holding their Toolkit key — and pastes the answer back.

The constraint produced a better design than the original plan. In the handoff
path the U-M key never enters a web page at all, which is a stronger privacy
position than the direct call I had originally intended for it.

---

## Reproducing this

```bash
# Preflight probes
curl -i -X OPTIONS https://api.anthropic.com/v1/messages \
  -H "Origin: https://jeraddunne.github.io" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,x-api-key,anthropic-version,anthropic-dangerous-direct-browser-access"

curl -i -X OPTIONS https://api.toolkit.umgpt.umich.edu/v1/chat/completions \
  -H "Origin: https://jeraddunne.github.io" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

Note that curl is **not** a browser and does not enforce CORS. The curl output
shows what the server says; the browser test in Test 3 shows what a browser
does with it. Both are needed — the curl probe alone would have been suggestive
but not conclusive.
