# Mobile-first и GitHub Pages: план доработок Codex + Builder

Дата: 2026-07-04.

Источник: исследовательский артефакт "Design Research — Codex & Builder"
(конкурентный ландшафт, mobile-first UX паттерны, ограничения статического
хостинга GitHub Pages, паттерны reference-приложений и конфигураторов).
Пользовательские приоритеты для этого прохода: **мобильный веб — основной
таргет, десктоп — вторичный, но поддерживается**; хостинг остаётся
статическим GitHub Pages без backend.

Обновление от 2026-07-06: визуальный редизайн больше не вынесен за скобки.
Сначала фиксируем продуктовый скелет и современный mobile-first app shell,
потом доводим Builder/Codex UX, затем PWA/offline и только после этого
возвращаемся к payload/chunking-оптимизациям.

Дизайн-исследование от 2026-07-06 сохранено в
`docs/gemini_design_research.md`. Целевое направление: **dark-first Grimdark
Tactical Mono** — плотный тактический интерфейс с тёмным режимом как
основным tabletop/default сценарием, 1px границами, минимальными
скруглениями, mono-числами и янтарным акцентом. Пользовательское уточнение
поверх исследования: это не dark-only продукт; светлый/тёмный режим нужен на
раннем этапе, поэтому themeable tokens входят в P0, а light theme является
полноценным override тех же tokens.

## Актуальный порядок и статус (2026-07-06)

| Приоритет | Направление | Статус | Уже сделано | Осталось |
| --- | --- | --- | --- | --- |
| P0 | Продуктовый скелет | Сделано | Основные маршруты и флоу уже существуют: Home, Codex, Builder list, Builder create, roster detail, unit detail/wargear/upgrades. GitHub Pages constraint и local-cache подход зафиксированы в этом плане. Проверяемый продуктовый контракт записан в `docs/product_skeleton.md`. | Поддерживать документ актуальным при изменении экранов или главных действий. |
| P0 | Современный app shell вместо Windows shell | Основной срез сделан | Коммит `7a4fc6e` убрал активные fake window controls из пользовательских шаблонов, ввёл modern shell/tokens для цветов, отступов, кнопок, badges, lists и panels, проверен на Builder/Codex mobile screenshots. `win-scrollbars.js` и optional `setupWinScrollbars` удалены из кода и Builder build. Ранний dark-first/light theme foundation добавлен через общие tokens и browser preference; theme toggle теперь компактный 44px icon-button с сохранённым accessible text state. Legacy header/footer/search DOM/CSS контракты переименованы в `app-header`, `app-footer`, `app-search`; скрытый custom search scrollbar удалён; активный shell переименован из `desktop.css`/`.desktop` в `app.css`/`.app-frame`. Builder CSS mobile overrides сведены в один consolidated max-width layer. Mobile header теперь держит long-title ellipsis без clipping action controls, а Builder detail pages скрывают secondary app footer, когда активна bottom roster summary. | Оставшееся mobile-first переворачивание медиа-запросов делать отдельными проходами по `builder.css`/`codex.css`, чтобы не смешивать с UX-изменениями. |
| P0/P1 | Builder в новом стиле | Частично сделано | Список ростеров, создание ростера, базовый roster detail и validation surfaces уже переведены на новый shell; create flow автозаполняет имя по выбранной фракции и свободному локальному номеру, не перетирая ручной ввод, battle size выбирается компактным flat segmented radio control вместо старого select, сама форма больше не рендерит внутреннюю card-рамку и оставляет единственный full-width `Confirm` action. Roster list получил detachment badges, readable count labels и отдельное quick-actions меню строки с `Rename`/`Duplicate`/`Export JSON`/`Export Text`/`Delete Roster`, не вложенное внутрь основной open-кнопки. Validation messages получили компактные счетчики и severity-маркеры, Attached Units получили видимые подписи и collapsed `Add attached unit` disclosure, чтобы редкая форма не выглядела обязательной кучей полей; roster detail и unit detail получили мобильную bottom sticky-сводку Points/DP/Units с safe-area отступами, roster detail sticky-сводка получила action shortcuts `Issues`, `+ Detach`, `+ Unit`, `Attach` без смены hash route, а unit detail sticky-сводка получила локальные shortcuts `Issues`, `Unit`, `Wargear`, `Upgrades` только для реально доступных секций; unit detail breadcrumbs теперь ведут к parent roster и заменяют локальную Back-кнопку, unit overview получил компактную summary-полосу Points/Models и более низкий art banner, unit detail больше не дублирует название юнита внутри overview, empty roster overview скрывает бесполезный disabled Warlord picker, roster/unit Warlord labels убирают duplicate unit/model names, single-composition units больше не показывают бесполезное read-only Composition поле без локального validation, Warlord/Allegiance fields скрываются у юнитов без selectable target/option и локального validation, пустая Enhancements секция скрывается, если нет selectable option и локального validation, а target-ineligible enhancement rows вроде Epic Hero-only blockers больше не показывают бесполезный `No enhancement` select, пустые unit-detail validation и Wargear секции скрываются до появления messages/controls, а Reset Wargear появляется только у юнитов с реальными wargear controls и dirty loadout. Добавления/удаления roster unit/detachment/attachment и destructive unit-detail изменения composition/reset/wargear-count/upgrades получили undo-toast, roster-level и unit-level Warlord selectors используют тот же undo flow, unit row получил touch swipe-delete, 44px open touch target и компактный summary выбранных enhancements/allegiance/dirty paid wargear без вывода всего default loadout, unit detail Wargear скрывает пустые scopes без validation messages и больше не рендерит вложенные `builder-section` cards для wargear scopes, numeric wargear controls на unit detail заменены на мобильные `-/+` степперы с ручным вводом, checkbox wargear controls получили 44px mobile touch target, fixed default-only wargear scopes стали read-only строками с честным `Fixed`/`Missing`/`xN` состоянием, а import/export errors больше не открывают blocking `alert`, а показывают локальный dismissible status toast с понятным отказом от old roster formats. Последний UX-срез: недоступный empty `Attached Units` editor и `Attach` shortcut скрываются до появления валидной пары или существующего attachment, Warlord/wargear/sticky/list/create/unit-detail select controls получили единые `aria-label`/tooltip labels, allied unit source badges раскрывают полный source через `aria-label`, unit overview получил прямую кнопку `Codex` к datasheet route, а roster-level validation issues на unit detail теперь ведут deep-link назад в нужную секцию roster editor через `#/roster/:id/focus/:target`; `Find`-issues для required datasheet дополнительно проставляют поиск в Units через `unitSearch:<name>` focus target. Текущий проход добавил условный `Composition` shortcut на unit detail только для реально редактируемых составов, синхронизировал header title и browser `document.title`, усилил `aria/title` labels для roster/unit/detachment rows и закрепил guard на split-route imports shared `state`. | Довести unit detail, composition-specific controls и оставшиеся mobile-first сценарии до полноценного UX в новой системе. |
| P1 | Codex в новом стиле | Частично сделано | Базовые Codex surfaces, cards, badges и таблицы получили modern override вместе с app shell; launcher hover/active states переведены на theme tokens, чтобы dark-first режим не ловил светлый hardcoded фон; statline/points/weapon/rich-text table surfaces также перекрывают legacy light backgrounds через theme tokens; weapon tables на мобильном получили horizontal scroll внутри table wrapper и frozen weapon-name column; datasheet info cards на мобильном раскрываются через Show/Hide progressive enhancement; detachment rule/enhancement/stratagem/FAQ cards на мобильном используют тот же Show/Hide collapse, не трогая summary card; collapse buttons получили синхронные `aria-label`/tooltip labels; modern Codex mobile overrides сведены в один max-width layer; faction datasheet groups получили static count badges для быстрого мобильного сканирования; общий поиск получил Cmd/Ctrl+K фокус, grouped result sections по типу, readable result labels, arrow-key navigation и excerpt previews; Home показывает local Favorites/Recent с labeled local-library links, а Codex detail pages получают Save/Saved favorite toggle. | Довести faction list, datasheets, detachment/rules pages и оставшуюся мобильную читаемость таблиц отдельным проходом. |
| P1 | PWA/offline | Первый срез сделан | Подтверждено, что Builder остаётся статическим GitHub Pages приложением без backend, а пользовательские данные хранятся локально. Добавлены root-level `manifest.webmanifest` и `service-worker.js`, регистрация через `pwa.js`, `viewport-fit=cover`, offline badge в header и standalone Builder build-контракт для GitHub Pages `/builder`. HTML shell и Builder metadata (`manifest.json`, `bootstrap.json`) идут network-first/no-cache с offline fallback, хэшированные data/static/assets остаются cache-first, а `pwa.js` после загрузки отправляет текущий HTML/manifest/CSS/scripts в SW для opportunistic shell cache priming и повторяет priming через `navigator.serviceWorker.ready`, если worker ещё не active. Build inventory guard закрепляет, что service worker precache использует `app.css` и `builder.css`, не держит старый `desktop.css`, а build-time `service-worker.js` получает cache namespace `pwa-v2-<assetVersion>`, чтобы новый GitHub Pages деплой не смешивал старый shell cache с новыми versioned JS modules. | Проверить offline-поведение в браузере после первой загрузки и доработать cache strategy после стабилизации data chunking/search shard flow. |
| P2 | Payload/chunking оптимизации | Частично сделано, отложено | Уже есть size/hash guards и часть payload/search-index оптимизаций. | Faction chunks и дальнейшую нарезку данных делать после стабилизации функционала и дизайна. |

Дополнение от 2026-07-07: очередной Builder UX проход добавил визуальный
progress по очкам и дату обновления в строки ростеров, сгруппировал выбранные
юниты по ролям `Character` / `Battleline` / `Dedicated Transport` / `Other`,
а строки внутри групп теперь стабильно сортируются по имени, очкам и id,
добавил действие `Duplicate Roster` на overview экране с пересчетом локального
validation cache, а undo/status toast actions получили явные accessible labels.
Следующий короткий срез закрепил корректное поведение roster list quick-actions:
`Delete Roster` из меню `...` удаляет запись из IndexedDB и сразу
перерисовывает текущий `#/` список без reload/hashchange, а non-navigation
actions вроде `Export Text` закрывают popover-меню после клика. Roster detail
sticky shortcuts теперь не показывают `Issues`, когда validation messages нет,
сохраняя `Issues` и саму `Roster Validation` секцию только для реально
actionable validation-поверхности. Transfer/import pipeline больше не носит
`legacy` naming для старых roster fields: old-format поля явно описаны как
unsupported и продолжают reject-иться с понятной ошибкой.
Validation action routing теперь отдаёт attached-unit diagnostics приоритет
attachment row/editor, даже если сообщение одновременно содержит `unitId`.
Mobile sticky summary actions используют adaptive `auto-fit` сетку вместо
фиксированных четырёх колонок, чтобы unit detail с пятью shortcuts не ломал
нижнюю панель.
Roster-level Warlord picker теперь скрывается, если в текущем ростере нет
ни одного выбираемого Warlord target, а `Pick one Warlord` ведёт к Units,
когда пользователю сначала нужно добавить подходящий Character.
Unit detail wargear controls получили контекстные accessible labels, чтобы
одинаковые visible названия вроде `Power fist` в разных choice groups не
сливались для клавиатурной/assistive-навигации.
Unit-detail roster issues теперь используют локальный Warlord control, когда
он уже есть на странице юнита: `Pick one Warlord` фокусит select на месте,
а detachment/unit-level issues по-прежнему ведут deep-link назад в roster
editor.
Unit-detail Wargear перестал использовать длинные instruction-абзацы как
семантические заголовки: группы рендерят компактные `Default Wargear` /
`Choice N` headings, сохраняя полный текст правила отдельной строкой внутри
группы.
Unit-detail sticky shortcut для редактируемой composition теперь короче
показывается как `Models`, сохраняя доступное имя `Edit unit composition`,
а `Reset Wargear` получает unit-specific accessible label.
Wargear model scopes больше не показывают шумный счётчик вроде `2 groups` в
header: сами `Default Wargear` / `Choice N` группы уже видны ниже.
Builder→Codex links теперь генерируют canonical trailing-slash URLs, чтобы
static preview/GitHub Pages не делали лишний directory redirect при открытии
datasheet или detachment страницы из Builder.
Wargear control labels теперь используют эти компактные group headings
(`Power fist - Choice 1`) вместо повторения полного instruction-абзаца на
каждом checkbox/stepper.
Undo/status messages для прямого изменения wargear count теперь называют
конкретный wargear item, если он резолвится из каталога, с прежним fallback
`Wargear changed` для synthetic/edge rows.
Unit-detail upgrade/enhancement editor теперь называет секцию и controls по
фактическим типам доступных опций: `Upgrades`, `Enhancements` или
`Enhancements & Upgrades`; unit-scope target отображается как `Whole unit`,
а не техническое `Unit`.
Undo/status messages для тех же controls используют тот же словарь, поэтому
upgrade-only выбор теперь сообщает `Upgrade changed`, а не старый общий
`Enhancement changed`.
Roster unit rows используют тот же словарь для compact summary, поэтому
выбранные upgrade-опции больше не подписываются как `Enhancements`, а shared
CSS shell перестал держать legacy `--window` alias.
Builder shared controls больше не держат старый 2px bevel fallback в базовом
слое CSS, а Codex static CSS очищен от оставшихся Win95/titlebar терминов.
Builder not-found теперь различает missing roster и missing unit: удалённый
юнит показывает `Unit Not Found` и breadcrumbs к родительскому ростеру.
Builder CSS полностью очищен от legacy `border-width: 2px` bevel borders в
исходном файле; оставшиеся акценты используют 1px token borders.
Codex CSS также очищен от legacy bevel borders/inset shadows на rule/list/table
surfaces; guard закрепляет 1px token-border направление для нового shell.
Codex datasheet points tables на мобильном теперь превращаются в читаемый
двухколоночный список без горизонтального overflow всей страницы.
Codex datasheet statlines на мобильном теперь рендерятся как compact
3-column stat grid с labels из существующих `data-label`, без изменения
генерируемых данных и без нового JS.
Shared breadcrumbs на узком mobile viewport доведены до 44px touch target
без изменения самих маршрутов и breadcrumb-контракта.
Codex mobile collapsible cards теперь сохраняют чистый title до DOM-мутации и
рендерят кнопку Show/Hide рядом с direct `h2/h3`, а не внутри heading, чтобы
heading text и accessible labels не загрязнялись управляющим текстом.
Codex datasheet/detachment detail links теперь генерируются как canonical
directory hrefs с trailing slash, чтобы GitHub Pages/static preview не делали
лишний redirect при переходе из списков.
Builder roster quick-actions menu (`Rename`, `Duplicate`, exports, delete)
доведен до 44px mobile touch target и проверен на `/builder/` без page overflow.
Mobile roster/unit detail content padding увеличен под sticky summary actions,
чтобы нижний bar не перекрывал `Add Unit` и другие последние controls.
Create roster battle-size radio controls теперь занимают всю видимую option
card, так что mobile hit target совпадает с интерфейсом, а focus-ring остаётся
на карточке.
Базовый Builder CSS fallback очищен от оставшихся 2px light/shadow bevel
borders на empty/read-only/metric/validation/wargear surfaces; modern layer
больше не зависит от перекрытия старого Windows-style вида.
Unit-detail sticky actions теперь показывают `Warlord` и `Ability` только
когда соответствующие локальные controls реально отрендерены в overview; для
Pactbound Zealots/Chosen это даёт прямой mobile shortcut к `Mark of Chaos`.
Character/enhancement mobile smoke выявил внутреннее переполнение текста в
нижней панели при 6 shortcuts; sticky buttons закреплены на compact mono 11px,
а visible label для pure `Enhancements` сокращён до `Enhance` при сохранении
полного `aria-label`.
Unit-detail enhancement/upgrades selects теперь показывают compact availability
status (`available / locked`) из уже рассчитанных candidate statuses и связывают
его с control через `aria-describedby`, чтобы locked причины были видны без
открытия native select.
Тот же availability-pattern вынесен в общий helper и применён к allegiance
ability controls; Mark of Chaos/аналогичные обязательные выборы показывают
сколько опций доступно прямо в unit detail.
Composition controls на unit detail получили context-aware accessible label
(`Choose composition for <unit>`) и compact option-count status, связанный с
select через `aria-describedby`.
Roster unit row actions теперь включают visible compact summary
(abilities/enhancements/wargear changes) в `aria-label`/`title`, а выбранные
detachment Codex links закреплены на 44px mobile touch target.
Create roster flow получил explicit `aria-label`/tooltip labels для name,
faction и battle-size controls, сохраняя текущий compact mobile layout.
Roster list quick-actions menu синхронизирует `aria-expanded` с native
`details` state и закрывается по Escape с возвратом фокуса на trigger.
Roster list open-row labels теперь включают visible detachment badge names
compact-форматом, чтобы экранные считыватели не теряли главный визуальный
контекст строки.
Roster list quick-actions menu дополнительно закрывается по outside
pointerdown и объявляет себя как popup-menu, чтобы мобильный popover не
зависал поверх списка после тапа в другое место.
Список ростеров теперь держит открытым только одно quick-actions menu за раз:
открытие второго `...` аккуратно закрывает предыдущее и снимает его outside
listener.
Live mobile smoke нашёл и закрепил regression: тап по второму `...` больше не
теряется из-за раннего outside-close первого menu на `pointerdown`.
Тот же smoke выявил физическое перекрытие следующего `...` открытой menu panel;
на mobile panel теперь открывается влево от trigger, а не вниз поверх списка.
Attached Units `Add attached unit` disclosure синхронизирует `aria-expanded`
и закрывается по Escape с возвратом фокуса на summary.
Поиск в `Add Detachment` и `Add Unit` теперь очищается по Escape и сразу
восстанавливает список доступных options, как inline `x`.
Roster overview и sticky summary теперь включают Points/DP/Units в
accessible label, а Rename/Duplicate/Delete называют конкретный ростер.
Unit overview section получил accessible label с именем юнита, Points и
Models, чтобы unit detail не начинался с безымянной панели.
Unit-level Warlord select теперь называется `Choose Warlord for <unit>`, не
путаясь с roster-level Warlord picker.
Unit-level allegiance/ability select тоже называет конкретный unit в
accessible label.
Все изменения остаются thin-client: используются уже сохраненные local roster
documents, предрасчитанный catalog и локальный validator, без backend и без
нового пользовательского формата хранения.

## Не входит в объём

- Combat Patrol и остальной roster-validation parity tail — уже трекается в
  `docs/builder_roster_validation_fix_plan.md`.
- Аккаунты пользователей / синхронизация ростеров между устройствами —
  прямо противоречит принципу "no backend" ниже.

## Текущее состояние (проверено в коде на 2026-07-04)

| Факт | Где в коде |
| --- | --- |
| Codex — полностью пререндеренный статический HTML на маршрут (`dist/faction/<slug>/...`) | `HereticBuilder/tools/build_static_site.py` |
| Builder — client-side SPA, роутинг на хэше (`#/roster/<id>`, `#/new`) | `HereticBuilder/static/builder_routes.js:3-16` |
| Builder грузит все ~70 таблиц каталога одним `Promise.all`, независимо от выбранной фракции | `HereticBuilder/static/builder_catalog_tables.js` (список `CATALOG_TABLES`) + `HereticBuilder/static/builder_catalog_loader.js:12-16` (`loadCatalogTables`) |
| Экспорт каталога пишет по одному JSON-файлу на таблицу без учёта фракции | `HereticBuilder/tools/export_builder_data.py:684-693` (цикл по `CATALOG_TABLES`) |
| Итоговый вес `dist/builder-data/` | 19MB (`tables/` — основной вес, `bootstrap.json` — 9KB) |
| Поисковый индекс Codex | `dist/search-index/manifest.json` + typed shards; `app-search.js` грузит manifest и shard payloads |
| Вес поискового индекса | Шардирован; бюджет проверяется optional guard после сборки `dist/search-index/` |
| Web app manifest / service worker | есть в root static files и в standalone Builder build |
| Медиа-запросы в CSS | 1 в `builder.css`, 3 в `app.css`, 3 в `codex.css` — фактически desktop-first |
| `.nojekyll`, `404.html` | `.nojekyll` есть; standalone Builder build пишет `404.html`, идентичный `index.html`, для GitHub Pages SPA fallback |
| Есть готовый guard на размеры/хэши экспорта | `tests/builder_validation_catalog_inventory.test.mjs` (пинит byte counts/hashes каталога) |

## Принципы

1. **Мобильный — primary.** Любое решение по умолчанию проверяется на "работает ли это одной рукой на телефоне в игровом клубе с плохим wifi", десктоп — второй проход, не первый.
2. **Backend не появляется никогда.** Всё, что раньше требовало бы серверной логики (нарезка данных по фракции, поиск, кэширование), делается на этапе `python3 HereticBuilder/tools/builder.py build...` или в service worker на клиенте.
3. **Хэш-роутинг Builder не трогаем.** Он уже корректно решает классическую проблему "GitHub Pages 404 на прямой ссылке" — не заменять на History API routing.
4. **Каждая фаза — рабочий, тестируемый срез.** `npm test` должен проходить и статическая сборка должна успешно строиться после каждой фазы, не только в конце.
5. **Именование файлов = контракт кэширования.** Там, где вводится чанкинг (данные каталога, поисковый индекс), файлы получают контент-хэш в имени — не полагаемся на непроверенное поведение CDN GitHub Pages по `?v=` query-string.
6. **Dark-first, не dark-only.** Dark theme — дефолт и основной игровой
   режим; light theme — полноценный ранний override на тех же tokens,
   preference хранится только как tiny UI setting в browser storage.

## Фаза 0 — Измерительная защитная сетка

Низкий риск, делать первым, чтобы все следующие фазы имели объективный критерий "стало легче/тяжелее".

Deliverables:

- Расширить `tests/builder_validation_catalog_inventory.test.mjs` явным порогом на суммарный вес `dist/builder-data/tables/*.json` (например, "eager-loaded core payload не должен расти без явного обновления бюджета"), опираясь на уже существующий в этом файле механизм пиновки byte counts/hashes.
- Добавить аналогичный guard на вес `dist/search-index.json` в новом файле `tests/builder_search_index_size.test.mjs` (Node `node:test`, читает собранный `dist/search-index.json`, требует запуска сборки перед тестом — пропускается, если файла нет, аналогично другим optional-guard тестам в проекте).

Acceptance:

- `npm test` показывает явное число байт для каталога и поискового индекса, а не проходит вслепую.
- Тест **фейлит**, если кто-то в будущем случайно раздует eager-payload (например, добавит новую тяжёлую таблицу в общий eager-набор) без осознанного обновления бюджета.

## Фаза 1 — Build-time чанкинг каталога Builder по фракции

Проблема: `export_builder_data` (`export_builder_data.py:657-719`) пишет по одному файлу на таблицу из `CATALOG_TABLES` без разбора по фракции (цикл `export_builder_data.py:684-693`). `builder_catalog_loader.js:12-21` (`loadCatalogTables`) грузит их все параллельно на старте Builder. GitHub Pages не может нарезать данные по запросу — значит нарезка обязана произойти на этапе сборки (см. раздел "Chunking data at build time" исследования).

Deliverables:

1. В `export_builder_data.py` разделить `CATALOG_TABLES` на два списка:
   - `CORE_TABLES` — небольшие, нужные до выбора фракции: `battle_size`, `faction_keyword`, `publication`, `force_disposition`, `detachment_force_disposition`, `keyword`, `keyword_restriction_group*` и т.п. — таблицы, нужные для экрана выбора фракции/детачмента и для верхнеуровневой навигации.
   - `FACTION_HEAVY_TABLES` — тяжёлые таблицы, зависящие от юнитов: `datasheet*`, `miniature*`, `unit_composition*`, `wargear_option*`, `wargear_item`, `loadout_choice*`, `limited_wargear_choice*`, `all_model_wargear_choice*`, `base_miniature_loadout*`, `enhancement*`.
2. Для `CORE_TABLES` оставить текущее поведение (один файл на таблицу, как сейчас), они и так маленькие.
3. Для `FACTION_HEAVY_TABLES` добавить новую функцию `faction_heavy_chunk(conn, faction_keyword_id, heavy_tables)`, которая для каждой видимой в builder-е фракции (`faction_keyword.excludedFromArmyBuilder = 0`) вычисляет замыкание строк тяжёлых таблиц, релевантных этой фракции (через `datasheet_faction_keyword`, `allied_faction_datasheet` и связанные join-таблицы), и пишет `dist/builder-data/factions/<factionKeywordId>-<contenthash>.json`.
4. В `manifest.json` (`export_builder_data.py:699-711`) добавить секцию `factionChunks: [{ factionKeywordId, path, sha256, bytes }]`.
5. На клиенте: `builder_catalog_loader.js` получает новую функцию `loadFactionChunk(factionKeywordId)`, которая резолвит путь из `manifest.factionChunks` и фетчит **только** нужный чанк; `builder_catalog_tables.js` разделяется на `CORE_TABLE_DEFINITIONS` (грузятся на старте) и `FACTION_TABLE_DEFINITIONS` (грузятся при выборе/смене фракции, не раньше).
6. Точки вызова в Builder-приложении, которые сейчас читают из общего каталога напрямую (`builder_model*.js`, `builder_roster_*_view.js`), должны получать объединённый catalog-объект `{ ...core, ...factionChunk }` вместо предзагруженного всего сразу — без изменения их внутренней логики выборки (они уже читают по ключам таблиц, а не по факту "всё в памяти").

Acceptance:

- `python3 HereticBuilder/tools/builder.py export-builder-data` создаёт `dist/builder-data/factions/*.json` с суммой байт чанков, примерно равной текущим 19MB, разделённым по фракциям, а не одним блоком.
- Открытие Builder и выбор одной фракции инициирует ровно один дополнительный fetch (chunk этой фракции), видимый в `preview_network`/DevTools — не 70 отдельных запросов таблиц.
- `npm test` проходит; guard из Фазы 0 подтверждает, что eager-payload на старте Builder (до выбора фракции) стал значительно меньше 19MB.
- Существующие 100+ validation-тестов в `tests/builder_validation_*.test.mjs` продолжают проходить без изменений в семантике правил — меняется только транспорт данных, не логика валидации.

## Фаза 2 — Шардинг поискового индекса Codex

Проблема: `dist/search-index.json` (6.7MB) собирается целиком в `write_search_index` (`build_static_site.py:291-299`) и грузится одним fetch в `app-search.js:173`, до того как пользователь начал печатать. Исследование указывает на Pagefind-стиль шардинга как прямое решение для multi-MB индекса на статическом хостинге без сервера.

Deliverables:

1. В `build_static_site.py` изменить `write_search_index` так, чтобы вместо одного `search-index.json` со всеми items писались шарды по типу контента (`search-index/datasheet.json`, `search-index/stratagem.json`, `search-index/faq.json`, ... — по значению поля `type` из `search_index_items`), плюс маленький `search-index/manifest.json` со списком шардов и их размерами.
2. В `app-search.js` заменить единый eager `fetch(staticSearchIndexUrl)` (строка 173) на: загрузку `search-index/manifest.json` сразу (маленький файл), затем lazy-фетч конкретных шардов **только когда пользователь открывает поиск** (по первому нажатию на search-триггер), с последующим кэшированием уже загруженных шардов в памяти на время сессии.
3. Сохранить обратную совместимость метатега `heretic-search-index` (`build_static_site.py:194`) — он теперь указывает на `search-index/manifest.json` вместо монолитного файла.

Acceptance:

- Открытие любой страницы Codex больше не тянет 6.7MB сразу — сетевая вкладка показывает только маленький `manifest.json` до открытия поиска.
- Открытие поиска и ввод запроса подтягивает только релевantные шарды (проверяется через `preview_network`, фильтр `search-index/`).
- Поиск по-прежнему находит датащиты, стратагемы, FAQ и т.д. — golden-проверка: искать "Abaddon" находит датащит, искать "3+" не ломает поиск на числовых токенах.

## Фаза 3 — Mobile-first responsive слой

Проблема: текущий CSS практически без медиа-запросов (см. таблицу в начале документа) — то есть построен desktop-first, что противоречит теперь заявленному приоритету.

Deliverables:

1. Инвертировать порядок правил в `codex.css`, `builder.css`: базовые (без медиа-запроса) стили теперь пишутся для узкого вьюпорта (~375px), а текущие "десктопные" правила заворачиваются в `@media (min-width: 768px)` — mobile-first по direction медиа-запросов (`min-width`, не `max-width`).
2. Датащит-таблицы оружия (`codex_unit_weapon_row.html`, колонки R/A/Skill/S/AP/D) получают frozen-first-column паттерн: обёртка `overflow-x:auto`, `position:sticky; left:0` на `<th scope="row">` с именем оружия, остальные колонки скроллятся горизонтально под большим пальцем — конкретно из исследования (CSS-Tricks frozen-first-column). **Сделано первым modern override:** mobile weapon tables используют внутренний horizontal scroll и sticky weapon-name column; полный mobile-first CSS inversion остаётся отдельным проходом.
3. Основные touch-таргеты (кнопки создания/сохранения ростера, переключатели в Builder, ссылки в navigation) получают минимум 44×44pt согласно Apple HIG / 48×48dp согласно Material — проверяется через `preview_inspect` на реальной сборке. **Частично сделано:** mobile override закрепляет 44px для shared shell controls, Builder remove/search/stepper/sticky actions и Codex info-card collapse controls.
4. Основная навигация/действия Builder (создать юнит, посмотреть очки, провалидировать) переносятся в нижний sticky-бар вместо текущей схемы с верхним `app-header` и общим `app-footer` для мобильного вьюпорта — десктопный `app-header` остаётся для `min-width: 768px`.

Acceptance:

- `preview_resize` на `mobile` (375×812) показывает: датащит-таблицу оружия без горизонтального переполнения всей страницы (только сама таблица скроллится), нижний sticky-бар с очками не перекрыт safe-area, все интерактивные элементы ≥44px через `preview_inspect`.
- `preview_resize` на `desktop` (1280×800) показывает прежнее поведение без регрессий (тот же app-header/app-footer, что и сейчас).
- Не увеличивается число медиа-запросов бессистемно — направление (`min-width`) единое по всему `codex.css`/`builder.css`.

## Фаза 4 — PWA: manifest, service worker, offline

Проблема: нет `manifest.json` (web app manifest) и service worker — при том что ровно этот сценарий ("собрать список в последний момент в игровом клубе без интернета") уже закрыт прямым аналогом BattleScribe.

Deliverables:

1. Добавить `HereticBuilder/static/manifest.webmanifest` (иконки 192×192 и 512×512, включая maskable-вариант, `display: standalone`, `short_name` до ~12 символов), подключить через `<link rel="manifest">` в `templates/builder.html` и `templates/codex.html`.
2. Добавить `HereticBuilder/static/service-worker.js` с явным `{scope: './'}` при регистрации (обязательно из-за деплоя в подпуть `/builder` или `/codex`, согласно MDN-предупреждению из исследования):
   - cache-first для контент-хэшированных чанков данных/поиска и статических assets (`assets/unit-images`, `assets/faction-images`);
   - network-first (с fallback на кэш) для HTML-шелла (`index.html`, `builder.html`), который может меняться между деплоями.
3. Регистрация service worker — в `builder.js` и `codex.js`, только если `navigator.serviceWorker` доступен; без service worker сайт должен продолжать работать как сейчас (progressive enhancement, не хард-зависимость).
4. Добавить компактный статус-индикатор "офлайн, синхронизируется при подключении" в Builder — аналог явного офлайн-баннера GameChanger из исследования, а не тихий сбой fetch.
5. `env(safe-area-inset-bottom)` на нижнем sticky-баре из Фазы 3, `viewport-fit=cover` в `<meta name="viewport">`.

Acceptance:

- После одного успешного онлайн-открытия Builder, отключение сети (через `preview_network`/DevTools "offline") и повторная загрузка страницы всё ещё показывает приложение и позволяет редактировать уже загруженный ростер.
- Иконка "добавить на главный экран" появляется в мобильном браузере с корректной иконкой и именем (не дефолтной/обрезанной).
- `preview_console_logs` не показывает ошибок регистрации service worker при обычной онлайн-загрузке.

## Фаза 5 — Codex: mobile-first UX из исследования

Deliverables:

1. Поисковая палитра: единый шорткат (Cmd/Ctrl+K на десктопе, доступный tap-триггер на мобильном) с группировкой результатов по типу (датащит / стратагема / FAQ / правило) — используя уже шардированный индекс из Фазы 2. **Частично сделано:** текущий общий search surface фокусится через Cmd/Ctrl+K, сохраняет tap-доступность через поле поиска, группирует результаты по `type`, показывает excerpt совпадения и поддерживает стрелочную навигацию по результатам.
2. Датащит-детали (`codex_unit_detail.html`, способности/wargear rules) по умолчанию свёрнуты, разворачиваются по тапу — так лист юнитов фракции остаётся сканируемым на маленьком экране (паттерн D&D Beyond из исследования). **Частично сделано:** ability/rule/wargear info cards на мобильном получают Show/Hide без изменения статического HTML-контента для non-JS сценария.
3. Favorites/recently-viewed: два визуально различимых состояния иконки (заполненная/контурная), единая метафора по всему приложению, непустой explaining empty-state на экране избранного. **Первый срез сделан:** detail/index Codex pages пишут Recent, header favorite toggle сохраняет/удаляет страницу в localStorage, Home показывает Favorites/Recent с empty states.

Acceptance:

- На мобильном вьюпорте список датащитов фракции (30+ юнитов) не требует бесконечного скролла для каждого юнита — карточки компактны, полный стат-блок раскрывается по тапу.
- Поиск с клавиатуры (десктоп) и по тапу (мобильный) даёт одинаковый набор результатов, сгруппированных по типу.

## Фаза 6 — Builder: mobile-first UX из исследования

Deliverables:

1. Итоговые очки ростера — sticky и itemized на всех вьюпортах (не только видны по скроллу вверх), с safe-area отступом на мобильном (зависит от Фазы 3/4). **Частично сделано:** roster detail и unit detail получили мобильную bottom sticky-сводку Points/DP/Units над footer с safe-area отступом; roster detail получил action shortcuts к Issues/Add Detachment/Add Unit/Attach controls; mobile sticky-сводка сжата до компактной двухрядной компоновки, а unit detail получил локальные shortcuts к Issues/Unit/Wargear/Upgrades только при наличии соответствующих секций; shortcuts центрируют первый рабочий control секции, чтобы форма не оказывалась под bottom overlay; sticky `+ Detach` и `+ Unit` ведут к соответствующим controls без автодобавления первого option. `Attach` остаётся навигацией к раскрываемой форме и открывает disclosure, когда attachment controls доступны. Unit-detail validation/focus jumps тоже центрируют первый рабочий control и раскрывают disclosure при наличии.
2. Разделение blocking-ошибок и soft-warnings визуально (красный + stop-иконка для реально нелегальных состояний, янтарный + треугольник для "стоит пересмотреть") — Builder уже возвращает `{level, code, text}` для сообщений (см. `docs/builder_roster_validation_fix_plan.md`, раздел "Order of work" п.1), это чисто слой представления над существующим контрактом, без изменения валидаторов. **Частично сделано:** группы validation messages получили визуальные severity-маркеры и aria-label; пустые unit-detail validation секции больше не занимают место, но появляются при первом реальном message.
3. Удаление юнита/модели — мгновенное действие с undo-toast с ограничением по времени, вместо confirm-диалога на каждое удаление. **Частично сделано:** добавление и удаление юнита/детача/attached unit, удаление участника attached unit и всего ростера сохраняет предыдущий snapshot и показывает Undo; roster-level Warlord picker, смена composition, Reset Wargear, прямое изменение wargear count, Warlord, Allegiance и Enhancement selectors на unit detail тоже откатываются через Undo. Numeric wargear count controls получили мобильные `-/+` степперы с тем же undoable update path. Первый UX-проход по composition-specific controls убрал бесполезное read-only Composition поле у single-composition units, Warlord/Allegiance поля без action и пустую Enhancements секцию, но оставляет соответствующие редакторы видимыми при локальном validation. Non-blocking status toasts теперь можно закрывать вручную через серый dismiss control.
4. Свайп-жест для удаления юнита из списка ростера на мобильном вьюпорте (в дополнение к, не вместо, обычной кнопке удаления — жест не единственный способ, как рекомендует исследование по доступности). **Сделано для unit row:** touch/pen-свайп влево использует тот же undoable removal, mouse drag игнорируется.

Acceptance:

- Очки ростера видны без скролла на любом экране Builder независимо от длины списка юнитов.
- Валидационные сообщения визуально различимы по серьёзности без необходимости читать текст (проверяется через `preview_screenshot` + `preview_inspect` на цвет/иконку).
- Удаление юнита не открывает модальное окно; в течение окна ~5с доступен undo.

## Фаза 7 — Верификация и деплой

Deliverables:

- Обновить `.github/workflows/deploy.yml`, если Фазы 1-2 меняют шаги генерации (например, добавление `export-builder-data` перед `build`, если он ещё не входит в единый `build`). **Сделано для текущего Pages workflow:** `.github/workflows/pages.yml` теперь оставляет Codex repo на `builder.py build`, но в standalone `builder` repo собирает `builder.py build-builder --out dist --base-path "/${{ github.event.repository.name }}"`.
- Прогнать полный `npm test`.
- Локальная статическая сборка (`python3 HereticBuilder/tools/builder.py build --out dist ...` и `build-builder`), затем smoke-тест в `preview_start`/`preview_resize(mobile)`/`preview_resize(desktop)` по каждому из изменённых экранов.
- Обновить `README.md`, если появились новые команды/шаги сборки (например, генерация manifest/service worker, если она не полностью автоматическая часть `builder.py build`).

Acceptance:

- Свежий чекаут + `npm test` + сборка + smoke-тест проходят без ручных шагов, не описанных в `README.md`.
- Прямая ссылка на глубокий Builder-роут (`#/roster/<id>`) продолжает работать после `git push` на реальном GitHub Pages деплое (регрессия на роутинг — это единственное, что реально может тихо сломаться при рефакторинге чанкинга).

## Тест-план (сводно)

Автоматически (`npm test`, Node `node:test`):

- Существующие ~100+ validation-тестов в `tests/builder_validation_*.test.mjs` — не трогать логику, только транспорт (Фаза 1).
- Новые: бюджет байт для eager-каталога и поискового индекса (Фаза 0), корректность per-faction чанков относительно исходных монолитных таблиц (сумма строк по фракциям = исходные строки, без потерь/дублей) (Фаза 1), корректность шардов поиска относительно исходного набора items (Фаза 2).

Браузер (`preview_*` инструменты, вручную на каждую фазу):

- Мобильный вьюпорт (375×812): datasheet-таблицы без горизонтального overflow страницы, нижний sticky-бар очков не перекрыт safe-area, touch-таргеты ≥44px, офлайн после первой загрузки, undo-toast при удалении юнита.
- Десктопный вьюпорт (1280×800): существующее поведение не регрессирует.
- `preview_network`: количество и размер запросов на старте Builder падает с "все таблицы каталога" до "core + один faction-чанк"; поиск не тянет полный индекс до открытия search UI.

## Риски и решения

1. **Замыкание тяжёлых таблиц по фракции — самая рискованная часть Фазы 1.**
   Некоторые тяжёлые строки (например, общие `wargear_item`, используемые несколькими фракциями, или allied-faction related datasheets) не принадлежат ровно одной фракции. Решение: замыкание должно включать союзные (`allied_faction_datasheet`) и cross-referenced строки, а Фаза 0 guard должен явно проверять "сумма строк по всем фракционным чанкам покрывает 100% строк исходных монолитных таблиц" — не просто "чанки маленькие".

2. **Service worker может закэшировать устаревшую версию каталога после смены `dataVersion`.**
   Решение: имя каждого чанка данных уже включает контент-хэш (Фаза 1) — при изменении данных путь меняется, старый закэшированный ответ просто больше не запрашивается. `manifest.json` с `dataVersion` остаётся источником истины для инвалидации записей IndexedDB (это уже описано как принцип в `docs/builder_rules_and_static_client_plan.md`, раздел "Recommended storage split").

3. **Шардинг поиска может ухудшить релевантность, если один термин раскидан по нескольким шардам типа.**
   Решение: шардинг по `type` (датащит/стратагема/FAQ/...), не по алфавиту/фракции — пользователь, ищущий "Abaddon", релевантен в первую очередь для типа "датащит", остальные типы подгружаются параллельно, но не блокируют первый релевантный результат.

4. **Mobile-first инверсия CSS (Фаза 3) может визуально сломать десктопный вид, если `min-width` breakpoint выбран неверно.**
   Решение: делать по одному файлу за раз (`codex.css`, затем `builder.css`), с `preview_resize(desktop)` скриншотом до и после каждого файла.

## Рекомендуемый порядок первого слайса

1. Фаза 0 (защитная сетка) — почти нулевой риск, даёт число, с которым можно сравнивать всё остальное.
2. Фаза 1 (чанкинг каталога) — самый большой реальный выигрыш для целевого сценария "телефон на плохом wifi", и разблокирует корректную работу Фазы 4 (service worker кэширует по чанкам, а не по одному 19MB блобу).
3. Фаза 2 (шардинг поиска) — независима от Фазы 1, можно делать параллельно другим агентом/сессией.
4. Фазы 3-4 (mobile CSS + PWA) — после того, как транспорт данных (1-2) устоялся, чтобы не кэшировать/тестировать на два фронта одновременно.
5. Фазы 5-6 (точечные UX-паттерны) — после того, как платформенный слой (routing/data/offline) стабилен; эти фазы почти не пересекаются друг с другом файлово и могут идти параллельно.
6. Фаза 7 в конце каждого крупного шага, не только в самом конце всего плана.

## Порядок коммитов (предлагаемый)

1. `catalog-size-guard`
2. `faction-chunked-catalog-export`
3. `faction-chunked-catalog-client`
4. `search-index-sharding`
5. `mobile-first-css-codex`
6. `mobile-first-css-builder`
7. `pwa-manifest-and-service-worker`
8. `codex-mobile-ux-search-and-collapse`
9. `builder-mobile-ux-totals-and-undo`
10. `deploy-workflow-and-docs-update`
