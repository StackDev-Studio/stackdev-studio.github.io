# stackdev-studio.github.io

Лендинг StackDev Studio (stack-dev.ru). Статика: HTML + CSS + ванильный JS.

## Структура

- `index.html` — единственная страница + `404.html`
- `assets/css/site.css` — дизайн-система и все стили
- `assets/css/fonts.css` — генерируется, не редактировать руками
- `assets/fonts/` — self-hosted вариативные шрифты Inter и JetBrains Mono
- `assets/js/site.js` — меню, reveal-анимации, форма, портфолио из GitHub API
- `site.webmanifest` — PWA-манифест

## Бренд-иконки

вектор `assets/brand/logo.svg` (512×512, viewBox `0 0 512 512`).
Из него рендерится растровый мастер `icon.png` (512×512), а из него — всё остальное.
