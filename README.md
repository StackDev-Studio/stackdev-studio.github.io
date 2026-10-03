# stackdev-studio.github.io

Лендинг StackDev Studio (stack-dev.ru). Статика: HTML + CSS + ванильный JS,
сборки нет, деплой — GitHub Pages.

## Структура

- `index.html` — единственная страница + `404.html`
- `assets/css/site.css` — дизайн-система и все стили
- `assets/css/fonts.css` — генерируется, не редактировать руками
- `assets/fonts/` — self-hosted вариативные шрифты Inter и JetBrains Mono
- `assets/js/site.js` — меню, reveal-анимации, форма, портфолио из GitHub API
- `site.webmanifest` — PWA-манифест

## Бренд-иконки

Единственный источник правды — `icon.png` (512×512). Всё остальное выводится из него:

```
python3 tools/make_icons.py   # favicon-16/32/96, apple-touch-icon, icon-192/512, assets/img/logo.png
python3 tools/fetch_fonts.py  # обновить шрифты + assets/css/fonts.css
python3 tools/make_og.py      # og-image.png / og-image.jpg
```

Требования: Python 3 + Pillow. SVG-версии логотипа больше не используются.
