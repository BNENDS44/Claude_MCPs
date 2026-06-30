# Clock Tower Labs — Landing & Sign-Up Page

A single-file, dependency-free landing page for **Clock Tower Labs, Inc.**

> Audit the past · Monitor the present · Optimize the future

The page opens with the animated Clock Tower Labs emblem and a brand "boot"
sequence, then reveals an **early-access sign-up CTA** so visitors can leave
their email to learn more.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The entire page — HTML, CSS, and JS in one file. No build step. |

## Local preview

Just open the file in a browser:

```bash
open index.html      # macOS
xdg-open index.html  # Linux
```

## Sign-up form setup (Formspree)

The CTA posts to [Formspree](https://formspree.io) via a small AJAX handler, so
submitting shows an inline "You're on the list" message without leaving the page.
Sign-ups are routed **server-side by Formspree** to the destination inbox, so the
address is *not* exposed in the page source (avoids scraping).

**Configured destination:** `monitor@clocktowerlabs.com`

To go live:

1. Create a free account at <https://formspree.io>.
2. Add a new form and set its destination/notification email to
   `monitor@clocktowerlabs.com`.
3. Copy the form's endpoint ID (the page after `formspree.io/f/`, e.g. `abcdwxyz`).
4. In `index.html`, replace the placeholder in the form `action`:

   ```html
   <form class="signup" id="signupForm" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```

   Swap `YOUR_FORM_ID` for your real ID. Until then, the form shows a friendly
   "add your Formspree form ID" notice instead of submitting.

The form includes a hidden `_gotcha` honeypot field for spam filtering and an
email-client-friendly `_subject` line.

## Hosting

`index.html` is fully static, so it can be served by any static host:

- **GitHub Pages** — set Pages to serve from the branch root (requires a public
  repo, or a GitHub plan that allows Pages on private repos).
- **Netlify / Vercel / Cloudflare Pages** — drop the folder in, no build command.

## Customizing

- **Tagline cycle** — edit the three `<b>` items inside `#tag`.
- **Boot duration** — change `DURATION` (ms) in the script; or call
  `window.ctlDone()` to finish early and reveal the CTA immediately.
- **Copy** — the CTA heading/blurb live in the `<section class="cta">` block.
- **Brand colors** — the `:root` CSS variables (`--purple`, `--purple-deep`, …).

## Accessibility

- Honors `prefers-reduced-motion` (animations collapse to a static layout).
- A `<noscript>` fallback reveals the sign-up form when JavaScript is disabled.
- Live-region status messaging on the form (`role="status"`, `aria-live`).
