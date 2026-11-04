# Security and data-safety rules

Some people who will use and contribute to this map live in countries where organising can
cost them their job or their freedom. **Safety comes before features.**

## Rules for everyone working on this repository

1. **Never commit real worker data. Not even "just for a minute".** Git keeps every past
   version for ever, and this repository is public. Deleting a file later does not remove it
   from history.
2. **All sample data must be clearly fake.** Mark it `"sample": true` and use invented names
   ("Sample Company A").
3. **City level at most.** No point on the map may be more precise than a city. The map is
   deliberately limited to country-level zoom.
4. **No outside services in the page.** Add no analytics, fonts, CDNs, map-tile servers,
   social-media buttons or embedded videos. The security policy in `index.html` blocks them,
   so don't loosen it.
5. **Never insert data into the page as raw HTML.** Use `textContent` (see `js/map.js`), so
   that text inside data can never run as code.
6. **Protect your own identity.** Your name and email appear in the public history of every
   change you make. If you're at risk:
   - use a GitHub account that is not linked to your real name;
   - turn on GitHub → Settings → Emails → **"Keep my email addresses private"**;
   - turn on 2-factor authentication (GitHub → Settings → Password and authentication).

## Reporting a security problem

Please do not open a public issue for a security problem. Contact the project maintainers
privately. (A private contact address still needs to be set up.)

## Known limits of the prototype

- GitHub Pages, our web host, can see visitors' IP addresses, as any web host can.
- GitHub Pages can't send some extra security headers. The most important protections are
  set inside `index.html` instead.
