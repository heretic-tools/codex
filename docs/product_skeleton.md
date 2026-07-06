# Product skeleton: Codex + Builder

Дата: 2026-07-06.

Цель документа: зафиксировать продуктовый каркас до дальнейшей визуальной
полировки. Этот контракт описывает экраны, главные действия и то, что должно
быть видно на мобильном. Он не задаёт финальный визуальный стиль.

## Общие правила shell

- `HereticTools` всегда ведёт на главную.
- Breadcrumbs показывают путь назад, но не дублируют текущую страницу.
- Текущий экран называется в header/title, а не отдельной плиткой внутри
  контента.
- Мобильный viewport является основным: все главные действия доступны без
  hover, touch-target не меньше 44px, обязательные предупреждения и ошибки не
  должны прятаться ниже второстепенных контролов.
- GitHub Pages остаётся единственным хостингом: все маршруты Builder живут на
  hash routing, Codex генерируется статическими HTML-страницами.
- Пользовательские данные не уходят на сервер: ростеры хранятся локально в
  IndexedDB и могут переноситься через JSON export/import.

## Builder flow

Источник маршрутов: `HereticBuilder/static/builder_routes.js`.

| Экран | Route | Главные действия | Что видно на мобильном |
| --- | --- | --- | --- |
| Builder list | `#/` | Открыть ростер, создать ростер, export/import ростеров. | Header `Builder`, breadcrumbs назад к `HereticTools`, список ростеров, статус валидации, очки, количество детачей/юнитов, detachment badges, кнопка `Create Roster` под списком. |
| Create roster | `#/new` | Ввести имя, выбрать фракцию, выбрать battle size, подтвердить или вернуться назад. | Header `Create Roster`, три поля формы, primary action `Confirm`, secondary action `Back`. |
| Roster detail | `#/roster/:rosterId` | Смотреть статус ростера, выбрать Warlord, удалить ростер, добавлять/удалять detachments, units, attached units, переходить в Codex по detachment, переходить в unit detail. | Название ростера в header, компактный overview с faction/battle size, validation state, points, DP, units, блок validation messages, затем редакторы detachments/units/attachments. |
| Unit detail | `#/roster/:rosterId/unit/:unitId` | Вернуться в ростер, менять composition, Warlord state, allegiance, enhancements/upgrades, wargear по моделям. | Название юнита в header, локальная unit validation, критичные действия редактирования, wargear сгруппирован по моделям и не требует desktop-wide layout. |
| Not found | unknown roster/unit | Вернуться к Builder list. | Понятное сообщение, без пустого экрана. |

Builder не должен иметь старую совместимость со старыми локальными ростерами:
это новое приложение. Единственная допустимая совместимость — чтение текущей
новой схемы local cache и JSON import/export этой же схемы.

## Builder UX contract

- Roster list rows являются основными кнопками, а не вложенными карточками.
- Validation всегда видна в roster detail и unit detail, с различением errors и
  warnings.
- Детачи и юниты добавляются из контролов рядом с выбором; выбранные элементы
  являются кликабельными строками, если у них есть detail/Codex destination.
- Unit detail является единственным местом для глубокой настройки юнита:
  composition, wargear, Warlord, allegiance, enhancements/upgrades.
- Attached Units не должны выглядеть как обязательная куча полей: пустое
  состояние объясняет, почему пары недоступны, а реальные controls появляются
  только когда есть допустимые пары.

## Codex flow

Источник генерации: `HereticBuilder/tools/build_static_site.py` и
`HereticBuilder/tools/roster_builder_codex.py`.

| Экран | Route family | Главные действия | Что видно на мобильном |
| --- | --- | --- | --- |
| Home | `/` | Выбрать Codex или Builder. | Два главных входа без marketing layer. |
| Codex root / faction list | `/codex` or `/` when mounted at root | Выбрать faction/faction group, открыть core rules/search. | Сканируемый список фракций и групп. |
| Faction overview | faction route | Перейти в datasheets, detachments, army rules. | Название фракции, основные разделы, быстрый возврат назад. |
| Datasheet list | faction datasheets route | Найти и открыть datasheet. | Список datasheets с понятными badges/points where available. |
| Datasheet detail | datasheet route | Читать профиль, weapons, abilities, keywords. | Название юнита, ключевые stats, таблицы с контролируемым horizontal scroll только там, где таблица действительно шире экрана. |
| Detachments list | faction detachments route | Выбрать detachment. | Список detachments с disposition/cost badges. |
| Detachment/rules detail | detachment/rules routes | Читать rule, enhancements, stratagems, restrictions. | Заголовок, badges, читаемые правила без desktop-only таблиц. |
| Core rules / FAQ | core rules routes | Читать базовые правила и FAQ. | Текстовые разделы с удобным скроллом и breadcrumbs назад. |

## Thin-client boundary

- Клиент может хранить только пользовательский state и ephemeral UI state.
- Catalog/rule data должны приходить из build-time артефактов в `dist/`.
- Новая логика правил должна жить в проверяемых JS validator/model modules,
  покрываться `node:test` и не зависеть от backend.
- Оптимизации payload/chunking допустимы только если не меняют семантику правил
  и не усложняют пользовательский local cache.

## Acceptance checklist

- `node --test --test-reporter=dot tests/*.test.mjs` проходит.
- `python3 HereticBuilder/tools/build_builder_site.py` проходит.
- `python3 HereticBuilder/tools/build_builder_site.py --base-path /builder`
  проходит.
- На свежем локальном preview roster detail показывает overview, validation
  section и не пишет console errors.
- На мобильном viewport главные действия каждого экрана доступны без
  горизонтального скролла всей страницы.
