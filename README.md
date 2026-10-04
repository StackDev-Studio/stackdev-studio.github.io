# stackdev-studio.github.io

Лендинг StackDev Studio (stack-dev.ru). Статика: HTML + CSS + ванильный JS,
размещается на GitHub Pages.

## Структура

- `index.html` — главная (лендинг + форма заявки)
- `privacy.html` — политика конфиденциальности (нужна для согласия на обработку данных)
- `thanks.html` — страница «заявка отправлена» (noindex, закрыта в `robots.txt`)
- `404.html` — страница ошибки
- `assets/css/site.css` — дизайн-система и все стили
- `assets/css/fonts.css` — генерируется, не редактировать руками
- `assets/fonts/` — self-hosted вариативные шрифты Inter и JetBrains Mono
- `assets/js/site.js` — меню, reveal-анимации, форма заявки, портфолио из GitHub API
- `site.webmanifest` — PWA-манифест

## Как приходят заявки

Заявки приходят на рабочую почту **stackdev.studio@yandex.ru**.
Своего сервера у статического сайта нет, поэтому форма отправляет письмо через
релей [FormSubmit.co](https://formsubmit.co):

- в разметке у формы стоит `action="https://formsubmit.co/stackdev.studio@yandex.ru"` и
  скрытые поля `_subject`, `_template`, `_captcha=false`, `_next`, `_blacklist`;
- с включённым JS тот же состав отправляется AJAX-запросом на
  `https://formsubmit.co/ajax/...` — посетитель остаётся на странице и видит
  строчный статус, а при недоступности релея браузер молча выполняет обычный POST
  (заявка не теряется);
- спам фильтруют honeypot-поле `_honey`, `_blacklist` и проверка контакта на клиенте.

### Разовая активация (обязательно, один раз)

При первой отправке FormSubmit пришлёт на `stackdev.studio@yandex.ru` письмо со
ссылкой **Activate Form**. Нужно перейти по ней один раз — после этого все заявки
начнут приходить на почту. До подтверждения релей отклоняет отправки, и JS в этом
случае откатывается на нативный POST (письмо всё равно будет отправлено после
активации). Адрес получателя можно заменить на почту домена, когда она появится —
меняется только `action` формы и этот раздел README.

## Бренд-иконки

Вектор `assets/brand/logo.svg` (512×512, viewBox `0 0 512 512`).
Из него рендерится растровый мастер `icon.png` (512×512), а из него — всё остальное
(`tools/make_icons.py`, `tools/render_icon.py`).

## Локальный запуск

```sh
python3 -m http.server 8080
```

Откройте `http://localhost:8080`. Отправку формы на проде проверяйте после деплоя:
`_next` указывает на `https://stack-dev.ru/thanks.html`.
