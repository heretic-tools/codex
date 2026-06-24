# План реализации адаптивного Web UI

## Цель

Сделать максимально легкий и простой веб-интерфейс для локального проекта HereticSheets поверх текущего Python + SQLite кода.

Основные принципы:

- без тяжелого frontend stack: без React, Vite, npm и сборки;
- vanilla HTML/CSS/JS;
- один локальный Python HTTP server;
- SQLite остается единственным источником данных;
- все правила сборки ростеров остаются на backend;
- UI работает на мобильном и десктопе;
- визуальный стиль: простые сайты 90х-00х, таблицы, fieldset, синие ссылки, 1px borders, системные шрифты.

## Верхнеуровневая структура

Главная страница `/` содержит только две большие кнопки:

- `HereticBuilder`
- `HereticSheets`

Рекомендуемый layout:

- mobile: две кнопки друг под другом;
- desktop: две кнопки рядом или компактная центральная таблица;
- без landing page, hero, декоративных карточек и тяжелых ассетов.

## Технический подход

Текущий проект уже подходит для легкого web UI:

- `HereticBuilder/tools/roster_builder_server.py` содержит локальный HTTP server;
- `HereticBuilder/tools/roster_builder_core.py` объединяет логику билдера;
- `data/heretic_db.sqlite` содержит данные и ростеры;
- существующие `/api/*` endpoints уже покрывают большую часть HereticBuilder.

Предлагаемая структура файлов:

```text
HereticBuilder/
  tools/
    roster_builder_server.py
    roster_builder_core.py
    roster_builder_catalog.py
    roster_builder_rosters.py
    roster_builder_sheets.py        # новый read-only слой для HereticSheets
  web/
    index.html
    styles.css
    app.js
```

`roster_builder_server.py` должен:

- отдавать HTML для `/`, `/builder/*`, `/sheets/*`;
- отдавать статические файлы из `HereticBuilder/web/`;
- сохранить текущие builder endpoints;
- добавить read-only endpoints для HereticSheets.

## UX стиль

Визуальная система:

- `body` с серым или белым фоном;
- системный шрифт: Arial, Verdana, sans-serif;
- ссылки стандартно синие и подчеркнутые;
- кнопки похожи на старые HTML forms;
- секции через `fieldset` и `legend`;
- списки через простые таблицы;
- минимум цветов: серый, белый, черный, синий, темно-красный для ошибок;
- ширина контента ограничена, но без современных card-heavy layout.

Responsive правила:

- mobile-first;
- основной breakpoint: `720px`;
- mobile: один столбец;
- desktop: 2-3 рабочие колонки там, где это ускоряет работу;
- никакого горизонтального скролла, кроме таблиц с большим содержимым;
- длинные названия переносятся.

## HereticBuilder

Подход: rules logic driven UI.

UI не должен дублировать правила составления ростеров. Он должен показывать только то, что разрешает backend, и всегда обновлять состояние через существующую validation logic.

### Страница 1: создание ростера

Route:

```text
/builder/new
```

Назначение:

Создать пустой ростер без выбора detachments.

Поля:

- название ростера;
- battle size / mode;
- faction.

Источник данных:

```text
GET /api/bootstrap
```

Submit:

```text
POST /api/roster/create
```

Payload:

```json
{
  "name": "New Roster",
  "battleSizeId": "...",
  "factionKeywordId": "...",
  "detachmentIds": []
}
```

После успешного создания:

```text
/builder/roster?id=<rosterId>
```

### Страница 2: редактор ростера

Route:

```text
/builder/roster?id=<rosterId>
```

Основные блоки:

- summary ростера: name, faction, battle size, points;
- detachments;
- validation messages;
- добавление units/datasheets;
- список units;
- detail выбранного unit.

Backend endpoints:

```text
GET  /api/roster?id=...
GET  /api/detachments?factionId=...
POST /api/roster/detachments
GET  /api/datasheets?factionId=...&detachmentIds=...&q=...&allyType=native
POST /api/unit/add
POST /api/unit/delete
GET  /api/unit?id=...
POST /api/unit/composition
POST /api/wargear
POST /api/unit-wargear
POST /api/warlord
POST /api/allegiance
POST /api/unit-enhancement
POST /api/model-enhancement
POST /api/attached/create
POST /api/attached/delete
```

Mobile layout:

- один столбец;
- быстрые текстовые nav-ссылки: `Roster`, `Add`, `Units`, `Errors`;
- unit detail открывается ниже списка или отдельным экраном внутри router.

Desktop layout:

- левая колонка: roster summary, detachments, validation;
- средняя колонка: add unit/search, units list;
- правая колонка: selected unit detail.

Validation UX:

- после каждого mutation endpoint заново грузить `/api/roster?id=...`;
- errors показывать сверху и рядом с проблемным unit, если есть связь;
- warning/error styling делать простым: border + текст.

## HereticSheets

Подход: database driven reference UI.

HereticSheets должен быть справочником по данным из SQLite, а не билдером. Навигация строится по структуре БД и ветвится от верхнего уровня к конкретным сущностям.

### Главная HereticSheets

Route:

```text
/sheets
```

Кнопки верхнего уровня:

- `Core Rules`
- `Army Rules`

Позже можно добавить:

- `Missions`
- `Wargear`
- `Keywords`
- `Publications`

### Core Rules

Route examples:

```text
/sheets/core
/sheets/core/rules
/sheets/core/stratagems
/sheets/core/faq
/sheets/rule-section?id=...
/sheets/rule-container?id=...
```

Внутренние разделы:

- общие правила;
- общие стратагемы;
- FAQ, если в данных есть FAQ для core publication.

Источник данных:

- `publication`
- `rule_section`
- `rule_container`
- `rule_container_component`
- `stratagem`;
- `faq`.

UI:

- стартовая страница Core Rules с кнопками `Общие правила`, `Общие стратагемы`, `FAQ`;
- в общих правилах список секций;
- внутри секции список containers;
- внутри container последовательный render компонентов.

Компоненты можно рендерить минимально:

- text;
- header;
- bullet list;
- image, если URL есть;
- trigger/effect;
- boxed text;
- linked FAQ.

### Army Rules

Route examples:

```text
/sheets/army-rules
/sheets/faction?id=...
/sheets/publication?id=...
/sheets/army-rule?id=...
/sheets/datasheets?factionId=...
/sheets/detachments?factionId=...
```

Источник данных:

- `faction_keyword`;
- `publication`;
- `army_rule`;
- `army_rule_faction_keyword`;
- связанные `rule_container_component`.

Навигация:

1. `/sheets/army-rules` показывает только список армий;
2. `/sheets/faction?id=...` показывает страницу выбранной армии;
3. внутри армии доступны разделы:
   - `Army Rules`;
   - `Datasheets`;
   - `Detachments`;
   - `Stratagems`;
   - `Enhancements`;
   - `FAQ`, если в данных есть FAQ для этой армии/публикаций;
4. каждый раздел ведет к списку сущностей;
5. список ведет к detail page конкретной сущности.

Страница армии должна быть главным hub для faction-specific контента. Глобальных top-level кнопок `Datasheets`, `Detachments`, `Stratagems`, `Enhancements`, `FAQ` быть не должно.

### Datasheets

Route examples:

```text
/sheets/datasheets?factionId=...
/sheets/datasheet?id=...
```

Этот раздел открывается только из страницы конкретной армии.

Источник данных:

- `datasheet`;
- `datasheet_faction_keyword`;
- `miniature`;
- `unit_composition`;
- `datasheet_ability`;
- `datasheet_rule`;
- `wargear_item`;
- `wargear_item_profile`;
- `keyword`;
- `datasheet_points_step`.

Detail page должна показывать:

- название;
- faction/publication;
- statline;
- unit composition;
- points;
- abilities;
- datasheet rules;
- weapons/wargear profiles;
- keywords;
- base size;
- lore, если есть.

### Detachments

Route examples:

```text
/sheets/detachments?factionId=...
/sheets/detachment?id=...
```

Этот раздел открывается только из страницы конкретной армии.

Источник данных:

- `detachment`;
- `detachment_faction_keyword`;
- `detachment_detail`;
- `detachment_detail_bullet_point`;
- `detachment_rule`;
- `enhancement`;
- `stratagem`;
- required/excluded/linked datasheet tables.

Detail page должна показывать:

- название;
- factions;
- detachment points cost;
- details;
- detachment rules;
- linked enhancements;
- linked stratagems;
- restrictions and requirements.

### Stratagems, Enhancements, FAQ

Route examples:

```text
/sheets/core/stratagems
/sheets/core/faq
/sheets/stratagems?factionId=...
/sheets/enhancements?factionId=...
/sheets/faq?factionId=...
```

Core stratagems/FAQ открываются из `Core Rules`.

Army stratagems, enhancements и FAQ открываются только из страницы конкретной армии.

На первом этапе достаточно списков и detail rows. Фильтрация должна идти через faction publications и detachments, а не через глобальные списки.

Stratagem fields:

- name;
- cpCost;
- category;
- whenRules;
- targetRules;
- effectRules;
- restrictionRules.

Enhancement fields:

- name;
- points;
- rules;
- detachment;
- restrictions.

FAQ fields:

- question;
- answer;
- errataHeader;
- errataText;
- publication.

## HereticSheets API

Добавить `RosterSheetsMixin` или отдельный `HereticSheets` helper.

Минимальный набор endpoints:

```text
GET /api/sheets/home
GET /api/sheets/core
GET /api/sheets/core/stratagems
GET /api/sheets/core/faqs
GET /api/sheets/factions
GET /api/sheets/faction?id=...
GET /api/sheets/publications?factionId=...
GET /api/sheets/publication?id=...
GET /api/sheets/rule-sections?publicationId=...&parentId=...
GET /api/sheets/rule-container?id=...
GET /api/sheets/army-rules?factionId=...
GET /api/sheets/datasheets?factionId=...&publicationId=...&q=...
GET /api/sheets/datasheet?id=...
GET /api/sheets/detachments?factionId=...&publicationId=...
GET /api/sheets/detachment?id=...
GET /api/sheets/stratagems?factionId=...&publicationId=...&detachmentId=...
GET /api/sheets/enhancements?factionId=...&publicationId=...&detachmentId=...
GET /api/sheets/faqs?factionId=...&publicationId=...
```

Правила API:

- только read-only connections для HereticSheets;
- mutation endpoints остаются только в HereticBuilder;
- все SQL queries с параметрами;
- возвращать простые JSON payloads без лишней вложенности;
- большие списки ограничивать `limit` и поддержать `q`.

## Порядок реализации

### Этап 1: web shell

Результат:

- `/` показывает две кнопки;
- `/builder/new` и `/sheets` открываются через client router;
- общий CSS готов;
- сервер отдает static assets.

Готово, когда:

- `python3 HereticBuilder/tools/roster_builder.py` стартует;
- главная открывается в браузере;
- mobile ширина 360px не ломает layout.

### Этап 2: создание пустого ростера

Результат:

- `/builder/new` грузит factions и battle sizes;
- форма создает ростер без detachment;
- после создания происходит автопереход в editor.

Готово, когда:

- новый roster появляется в таблице `roster`;
- `roster_detachment` для него пустой;
- `/builder/roster?id=...` открывается.

### Этап 3: MVP редактора ростера

Результат:

- summary;
- detachments selector;
- validation panel;
- datasheet search;
- add/delete unit;
- points total.

Готово, когда:

- выбор detachments меняет validation;
- список datasheets зависит от faction/detachments;
- добавленный unit получает default composition;
- errors из backend видны в UI.

### Этап 4: unit detail editor

Результат:

- composition selection;
- wargear;
- enhancements;
- allegiance abilities;
- warlord;
- attached units.

Готово, когда:

- каждый control вызывает существующий mutation endpoint;
- после изменения ростер перегружается;
- backend validation остается единственным источником правды.

### Этап 5: HereticSheets root + Core Rules

Результат:

- `/sheets` показывает только top-level buttons `Core Rules` и `Army Rules`;
- `/sheets/core` показывает внутренние разделы `Общие правила`, `Общие стратагемы`, `FAQ`;
- Core Rules drill-down работает через publications/sections/containers;
- rule components рендерятся простыми HTML блоками.

Готово, когда:

- можно открыть Core Rules;
- можно открыть общие стратагемы;
- можно провалиться в секцию;
- можно открыть rule container и прочитать content.

### Этап 6: Army Rules hub

Результат:

- `/sheets/army-rules` показывает список армий;
- `/sheets/faction?id=...` показывает hub конкретной армии;
- список publications для faction;
- страница армии показывает разделы `Army Rules`, `Datasheets`, `Detachments`, `Stratagems`, `Enhancements`, `FAQ`, если в данных есть соответствующий контент.

Готово, когда:

- Adeptus Mechanicus или Space Marines открываются из списка армий;
- страница выбранной армии показывает только ее faction-specific контент;
- глобальных top-level ссылок на datasheets/detachments/stratagems/enhancements/FAQ нет.

### Этап 7: army content detail

Результат:

- datasheet list + detail внутри армии;
- detachment list + detail внутри армии;
- army stratagems list;
- army enhancements list;
- army FAQ list, если есть;
- linked rules, abilities, wargear, keywords.

Готово, когда:

- datasheet detail содержит statline, abilities, weapons, keywords, points;
- detachment detail содержит rules, enhancements, stratagems.

### Этап 8: polish и проверка адаптивности

Результат:

- desktop layout удобен для редактирования ростера;
- mobile layout не требует горизонтального скролла;
- длинные названия и rule text не ломают интерфейс;
- все ошибки API видны пользователю.

Проверить размеры:

- 360x740;
- 768x1024;
- 1280x800;
- 1440x900.

## Ограничения первого релиза

В первый релиз не включать:

- авторизацию;
- облачное сохранение;
- импорт/экспорт ростеров;
- избранное;
- полноценный глобальный поиск по всем сущностям;
- War Journal / battle tracking;
- entitlement gates.

Эти функции можно добавить позже, когда Builder и Sheets будут стабильно читать текущую БД и использовать существующую rules logic.

## Главный критерий качества

HereticBuilder считается правильным, если UI не содержит собственной копии правил ростера. Все ограничения, ошибки, доступность units, detachments, wargear, enhancements и warlord state должны приходить из backend.

HereticSheets считается правильным, если навигация естественно следует структуре БД и позволяет быстро дойти от верхнего уровня до конкретного правила, datasheet, detachment, stratagem, enhancement или FAQ.
