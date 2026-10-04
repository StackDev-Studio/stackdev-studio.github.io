# stackdev-studio.github.io

Marketing site for StackDev Studio — a small studio building Telegram bots,
WebApps, landing pages and automation scripts.

Static site: plain HTML, CSS and vanilla JS. Hosted on GitHub Pages at
[stack-dev.ru](https://stack-dev.ru).

## Layout

```
index.html privacy.html thanks.html 404.html   pages
robots.txt sitemap.xml site.webmanifest CNAME  crawler + PWA config
assets/     css, js, fonts, images, icons, brand
tools/      asset generators (fonts, icons, social card)
```

## Pages

- `index.html` — landing page with the lead form
- `privacy.html` — privacy policy
- `thanks.html` — post-submit confirmation
- `404.html` — error page

## Assets

- `assets/css/site.css` — design system and all styles
- `assets/css/fonts.css` — generated, do not edit
- `assets/fonts/` — self-hosted Inter and JetBrains Mono
- `assets/js/site.js` — menu, scroll animations, lead form, GitHub projects
- `assets/img/` — header logo and social card
- `assets/icons/` — favicons, apple-touch and PWA icons
- `assets/brand/logo.svg` — vector brand master

## Lead form

Submissions are handled by [Forminit](https://app.forminit.com) — the site
posts to the `api.getform.io` endpoint. Form id: `om4k5v1gztd`.

Email notifications and the recipient (`stackdev.studio@yandex.ru`) are
configured in the Forminit dashboard, not in this repo. Without them the
submissions are only stored in the dashboard.

Field names follow the Forminit block schema (`fi-{type}-{name}`):

| Field                 | Block                     |
|-----------------------|---------------------------|
| `fi-sender-fullName`  | sender                    |
| `fi-text-contact`     | text                      |
| `fi-radio-service`    | radio                     |
| `fi-text-message`     | text                      |
| `fi-text-page`        | text, added by the script |
| `fi-checkbox-consent` | checkbox                  |
| `fi-text-website`     | honeypot                  |

## Icons

`assets/brand/logo.svg` is the master. `tools/make_icons.py` renders every
PNG icon in `assets/icons/` straight from it at the target size, and
`tools/make_og.py` builds `assets/img/og-image.jpg`.

## Local preview

```sh
python3 -m http.server 8080
```
