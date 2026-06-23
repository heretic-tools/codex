const DATA_ROOT = './data/factions/'
const DEFAULT_PUBLICATION = 'Codex: Chaos Space Marines'

const categoryRules = [
  { id: 'characters', label: 'Characters', keywords: ['Character'] },
  { id: 'battleline', label: 'Battleline', keywords: ['Battleline'] },
  { id: 'transports', label: 'Transports', keywords: ['Dedicated Transport', 'Transport'] },
  { id: 'vehicles', label: 'Vehicles', keywords: ['Vehicle', 'Walker', 'Frame'] },
  { id: 'monsters', label: 'Monsters', keywords: ['Monster'] },
  { id: 'mounted', label: 'Mounted', keywords: ['Mounted', 'Beast', 'Cavalry'] },
  { id: 'infantry', label: 'Infantry', keywords: ['Infantry'] },
  { id: 'fortifications', label: 'Fortifications', keywords: ['Fortification'] },
]

const categoryFallback = { id: 'other', label: 'Other' }
const categoryOrder = [...categoryRules.map((item) => item.id), categoryFallback.id]
const quickKeywords = ['Character', 'Battleline', 'Vehicle', 'Monster', 'Transport', 'Psyker', 'Fly', 'Deep Strike']
const sectionIds = ['stats', 'weapons', 'abilities', 'loadout', 'rules', 'keywords']

const state = {
  publications: [],
  selectedPublication: null,
  source: null,
  cards: [],
  filtered: [],
  activeId: null,
  viewMode: 'datasheets',
  query: '',
  category: 'all',
  keyword: 'all',
  sortMode: 'codex',
  weaponFilter: 'all',
  armoryType: 'all',
  armoryAp: 'all',
  armoryDamage: 'all',
  collapsed: new Set(),
  activeCompositionIds: new Map(),
  loadoutValues: new Map(),
  commonAbilityNames: new Set(),
}

const els = {
  sourceMeta: document.querySelector('#sourceMeta'),
  viewModes: document.querySelectorAll('.view-mode'),
  factionSelect: document.querySelector('#factionSelect'),
  searchInput: document.querySelector('#searchInput'),
  categoryFilter: document.querySelector('#categoryFilter'),
  keywordFilter: document.querySelector('#keywordFilter'),
  quickFilters: document.querySelector('#quickFilters'),
  sortMode: document.querySelector('#sortMode'),
  resultCount: document.querySelector('#resultCount'),
  unitList: document.querySelector('#unitList'),
  sheetDetail: document.querySelector('#sheetDetail'),
  collapseAll: document.querySelector('#collapseAll'),
  expandAll: document.querySelector('#expandAll'),
}

async function boot() {
  await loadIndex()
  hydrateFactionSelect()
  bindEvents()

  const initial = state.publications.find((item) => item.publication === DEFAULT_PUBLICATION) ?? state.publications[0]
  if (!initial) throw new Error('No faction data found.')
  await loadPublication(initial.filename)
}

async function loadIndex() {
  const response = await fetch(`${DATA_ROOT}index.json`)
  if (!response.ok) throw new Error(`Failed to load faction index: ${response.status}`)
  const data = await response.json()
  state.publications = [...(data.publications ?? [])].sort(sortPublications)
}

async function loadPublication(filename) {
  setLoadingState()
  const response = await fetch(`${DATA_ROOT}${filename}`)
  if (!response.ok) throw new Error(`Failed to load faction data: ${response.status}`)
  const data = await response.json()

  state.selectedPublication = state.publications.find((item) => item.filename === filename) ?? null
  state.source = data.source
  state.cards = (data.cards ?? []).map((card) => normalizeCard(card, data.source.publication.name))
  state.commonAbilityNames = getCommonAbilityNames(state.cards)
  state.activeId = state.cards[0]?.id ?? null
  state.query = ''
  state.category = 'all'
  state.keyword = 'all'
  state.weaponFilter = 'all'
  state.armoryType = 'all'
  state.armoryAp = 'all'
  state.armoryDamage = 'all'
  state.collapsed.clear()
  state.activeCompositionIds.clear()

  els.searchInput.value = ''
  els.factionSelect.value = filename
  hydrateFilters()
  applyFilters()
}

function normalizeCard(card, publicationName) {
  const ds = card.datasheet
  const compositions = card.unit_compositions ?? []
  const miniatures = card.miniatures ?? []
  const keywords = card.keywords ?? []
  const minPoints = compositions.reduce((best, item) => Math.min(best, numberish(item.points)), Number.POSITIVE_INFINITY)
  const maxPoints = compositions.reduce((best, item) => Math.max(best, numberish(item.points)), 0)
  const maxWounds = miniatures.reduce((best, item) => Math.max(best, numberish(item.wounds)), 0)
  const category = deriveCategory(keywords)
  const weaponCount = uniqueWeaponNames(card).length
  const optionCount = (card.wargear_options ?? []).filter((item) => item.instructionText !== 'Default Wargear').length
  const compositionCount = compositions.length
  const complexity = weaponCount + optionCount + compositionCount * 3 + (card.abilities ?? []).length * 2
  const searchText = [
    publicationName,
    ds.name,
    ds.unitComposition,
    ds.lore,
    ds.baseSize,
    ...(card.faction_keywords ?? []),
    ...keywords,
    ...(card.abilities ?? []).map((item) => `${item.name} ${item.abilityType} ${item.rules}`),
    ...(card.datasheet_rules ?? []).map((item) => `${item.name} ${item.rules}`),
    ...(card.wargear_rules ?? []).map((item) => item.rulesText),
    ...(card.weapon_profiles ?? []).map((item) => `${item.wargearName} ${item.profileName ?? ''} ${item.type ?? ''} ${item.ruleText ?? ''}`),
    ...(card.wargear_options ?? []).map((item) => `${item.miniatureName} ${item.instructionText} ${item.wargearName}`),
  ]
    .join(' ')
    .toLowerCase()

  return {
    ...card,
    id: ds.id,
    name: ds.name,
    category,
    minPoints: Number.isFinite(minPoints) ? minPoints : null,
    maxPoints: maxPoints || null,
    maxWounds,
    weaponCount,
    optionCount,
    compositionCount,
    complexity,
    searchText,
  }
}

function bindEvents() {
  els.viewModes.forEach((button) => {
    button.addEventListener('click', () => {
      state.viewMode = button.dataset.viewMode
      updateViewModeControls()
      render()
    })
  })
  els.factionSelect.addEventListener('change', () => {
    loadPublication(els.factionSelect.value).catch(showError)
  })
  els.searchInput.addEventListener('input', () => {
    state.query = els.searchInput.value.trim().toLowerCase()
    applyFilters()
  })
  els.categoryFilter.addEventListener('change', () => {
    state.category = els.categoryFilter.value
    applyFilters()
  })
  els.keywordFilter.addEventListener('change', () => {
    state.keyword = els.keywordFilter.value
    renderQuickFilters()
    applyFilters()
  })
  els.sortMode.addEventListener('change', () => {
    state.sortMode = els.sortMode.value
    applyFilters()
  })
  els.collapseAll.addEventListener('click', () => {
    state.collapsed = new Set(sectionIds)
    renderDetail()
  })
  els.expandAll.addEventListener('click', () => {
    state.collapsed.clear()
    renderDetail()
  })
}

function hydrateFactionSelect() {
  els.factionSelect.innerHTML = state.publications
    .map((item) => `<option value="${escapeAttr(item.filename)}">${escapeHtml(cleanPublicationName(item.publication))}</option>`)
    .join('')
}

function hydrateFilters() {
  const categoryCounts = countBy(state.cards, (card) => card.category.id)
  els.categoryFilter.innerHTML = [
    '<option value="all">All categories</option>',
    ...categoryOrder
      .filter((id) => categoryCounts.get(id))
      .map((id) => {
        const category = getCategoryById(id)
        return `<option value="${escapeAttr(id)}">${escapeHtml(category.label)} (${categoryCounts.get(id)})</option>`
      }),
  ].join('')

  const keywords = [...new Set(state.cards.flatMap((card) => card.keywords ?? []))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
  els.keywordFilter.innerHTML = [
    '<option value="all">All keywords</option>',
    ...keywords.map((keyword) => `<option value="${escapeAttr(keyword)}">${escapeHtml(keyword)}</option>`),
  ].join('')

  renderQuickFilters()
  renderSourceMeta()
}

function renderQuickFilters() {
  const present = new Set(state.cards.flatMap((card) => card.keywords ?? []))
  const buttons = quickKeywords
    .filter((keyword) => present.has(keyword))
    .map((keyword) => {
      const active = state.keyword === keyword ? 'is-active' : ''
      return `<button class="filter-chip ${active}" type="button" data-keyword="${escapeAttr(keyword)}">${escapeHtml(keyword)}</button>`
    })
  els.quickFilters.innerHTML = buttons.join('')
  els.quickFilters.querySelectorAll('.filter-chip').forEach((button) => {
    button.addEventListener('click', () => {
      const keyword = button.dataset.keyword
      state.keyword = state.keyword === keyword ? 'all' : keyword
      els.keywordFilter.value = state.keyword
      renderQuickFilters()
      applyFilters()
    })
  })
}

function renderSourceMeta() {
  if (!state.source) return
  const publication = state.source.publication
  els.sourceMeta.textContent = `${publication.name} - ${state.cards.length} datasheets - data ${state.source.dataVersion} - errata ${publication.errataDate ?? 'none'}`
}

function applyFilters() {
  const tokens = state.query.split(/\s+/).filter(Boolean)
  state.filtered = state.cards
    .filter((card) => {
      const matchesQuery = !tokens.length || tokens.every((token) => card.searchText.includes(token))
      const matchesCategory = state.category === 'all' || card.category.id === state.category
      const matchesKeyword = state.keyword === 'all' || card.keywords.includes(state.keyword)
      return matchesQuery && matchesCategory && matchesKeyword
    })
    .sort(sortCards)

  if (!state.filtered.some((card) => card.id === state.activeId)) {
    state.activeId = state.filtered[0]?.id ?? state.cards[0]?.id ?? null
    state.weaponFilter = 'all'
  }
  render()
}

function sortCards(a, b) {
  if (state.sortMode === 'name') return a.name.localeCompare(b.name)
  if (state.sortMode === 'points') return (a.minPoints ?? 9999) - (b.minPoints ?? 9999) || a.name.localeCompare(b.name)
  if (state.sortMode === 'wounds') return b.maxWounds - a.maxWounds || a.name.localeCompare(b.name)
  if (state.sortMode === 'complexity') return b.complexity - a.complexity || a.name.localeCompare(b.name)
  return a.datasheet.displayOrder - b.datasheet.displayOrder || a.name.localeCompare(b.name)
}

function render() {
  updateViewModeControls()
  renderList()
  renderDetail()
}

function renderList() {
  els.resultCount.textContent = `${state.filtered.length} of ${state.cards.length} datasheets`
  if (!state.filtered.length) {
    els.unitList.innerHTML = '<div class="list-empty">No datasheets match the current filters.</div>'
    return
  }

  const groups = groupCardsByCategory(state.filtered)
  els.unitList.innerHTML = groups
    .map(({ category, cards }) => `
      <section class="unit-group">
        <h2>${escapeHtml(category.label)}</h2>
        ${cards.map(renderUnitRow).join('')}
      </section>
    `)
    .join('')

  els.unitList.querySelectorAll('.unit-row').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeId = button.dataset.unitId
      state.weaponFilter = 'all'
      render()
    })
  })
}

function renderUnitRow(card) {
  const active = card.id === state.activeId ? 'is-active' : ''
  const tags = primaryKeywords(card)
  const image = card.datasheet.rowImage
    ? `<img src="${escapeAttr(card.datasheet.rowImage)}" alt="" loading="lazy" />`
    : '<span class="unit-thumb-fallback" aria-hidden="true"></span>'
  return `
    <button class="unit-row ${active}" type="button" data-unit-id="${escapeAttr(card.id)}">
      <span class="unit-thumb">${image}</span>
      <span class="unit-row-main">
        <strong>${escapeHtml(card.name)}</strong>
        <small>${escapeHtml(formatPoints(card))} - ${escapeHtml(tags.join(', ') || card.category.label)}</small>
      </span>
      <span class="unit-row-actions">
        <span class="mini-stat">${escapeHtml(String(card.maxWounds || '-'))}W</span>
        <span class="complexity-mark" title="${escapeAttr(`${card.weaponCount} weapons, ${card.optionCount} options`)}">${escapeHtml(String(card.weaponCount))}</span>
      </span>
    </button>
  `
}

function renderDetail() {
  if (state.viewMode === 'armory') {
    renderArmory()
    return
  }

  const card = getCard(state.activeId)
  if (!card) {
    els.sheetDetail.innerHTML = '<div class="empty-state">No datasheet selected.</div>'
    return
  }

  const activeComposition = getActiveComposition(card)
  const heroStyle = card.datasheet.bannerImage
    ? `style="background-image: linear-gradient(90deg, rgba(10,10,12,.96), rgba(10,10,12,.78) 48%, rgba(10,10,12,.3)), url('${escapeAttr(card.datasheet.bannerImage)}')"`
    : ''

  els.sheetDetail.innerHTML = `
    <header class="sheet-hero" ${heroStyle}>
      <div class="sheet-title">
        <p class="eyebrow">${escapeHtml([state.source.publication.name, ...card.faction_keywords].filter(Boolean).join(' / '))}</p>
        <h2>${escapeHtml(card.name)}</h2>
        <div class="hero-tags">${primaryKeywords(card).map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div>
      </div>
      <div class="hero-metrics">
        <div><span>Points</span><strong>${escapeHtml(formatCompositionPoints(activeComposition, card))}</strong></div>
        <div><span>Models</span><strong>${escapeHtml(formatCompositionModels(activeComposition, card))}</strong></div>
        <div><span>Base</span><strong>${escapeHtml(card.datasheet.baseSize ?? '-')}</strong></div>
      </div>
    </header>

    ${renderCompositionChooser(card)}

    <div class="info-strip">
      <div><span>Profiles</span><strong>${card.weapon_profiles.filter((item) => item.profileName).length}</strong></div>
      <div><span>Options</span><strong>${card.optionCount}</strong></div>
      <div><span>Rules</span><strong>${(card.abilities?.length ?? 0) + (card.datasheet_rules?.length ?? 0) + (card.wargear_rules?.length ?? 0)}</strong></div>
      <div><span>Keywords</span><strong>${card.keywords.length}</strong></div>
    </div>

    ${renderSection('stats', 'Statlines', renderStats(card))}
    ${renderSection('weapons', 'Weapons', renderWeapons(card))}
    ${renderSection('abilities', 'Abilities', renderAbilities(card))}
    ${renderSection('loadout', 'Loadout', renderLoadout(card))}
    ${renderSection('rules', 'Datasheet Rules', renderDatasheetRules(card))}
    ${renderSection('keywords', 'Keywords', renderKeywords(card))}
  `

  bindDetailEvents(card)
  updateWeaponHighlights(card)
}

function renderArmory() {
  const counts = getArmoryTypeCounts()
  if (state.armoryType !== 'all' && !counts[state.armoryType]) state.armoryType = 'all'
  const refinementRows = getArmoryRows({ ignoreProfileFilters: true })
  normalizeArmoryRefinements(refinementRows)
  const rows = getArmoryRows()
  const typeTabs = ['all', 'ranged', 'melee', 'wargear']
    .filter((type) => counts[type])
    .map((type) => `
      <button class="armory-type ${state.armoryType === type ? 'is-active' : ''}" type="button" data-armory-type="${escapeAttr(type)}">
        ${escapeHtml(labelWeaponFilter(type))}<span>${counts[type]}</span>
      </button>
    `)
    .join('')

  els.sheetDetail.innerHTML = `
    <section class="armory-shell">
      <header class="armory-header">
        <div>
          <p class="eyebrow">${escapeHtml(state.source.publication.name)}</p>
          <h2>Armory Matrix</h2>
          <p>${escapeHtml(`${rows.length} profiles shown from ${state.filtered.length} datasheets`)}</p>
        </div>
        <div class="armory-metrics">
          <div><span>Ranged</span><strong>${counts.ranged ?? 0}</strong></div>
          <div><span>Melee</span><strong>${counts.melee ?? 0}</strong></div>
          <div><span>Wargear</span><strong>${counts.wargear ?? 0}</strong></div>
        </div>
      </header>
      <div class="segmented-tabs armory-tabs">${typeTabs}</div>
      ${renderArmoryRefinements(refinementRows)}
      ${rows.length ? renderArmoryTable(rows) : '<div class="empty-state">No weapon profiles match the current filters.</div>'}
    </section>
  `

  els.sheetDetail.querySelectorAll('.armory-type').forEach((button) => {
    button.addEventListener('click', () => {
      state.armoryType = button.dataset.armoryType
      renderArmory()
    })
  })
  els.sheetDetail.querySelectorAll('[data-armory-refinement]').forEach((select) => {
    select.addEventListener('change', () => {
      state[select.dataset.armoryRefinement] = select.value
      renderArmory()
    })
  })
  els.sheetDetail.querySelectorAll('[data-armory-unit-id]').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeId = button.dataset.armoryUnitId
      state.viewMode = 'datasheets'
      state.weaponFilter = 'all'
      updateViewModeControls()
      render()
    })
  })
}

function renderArmoryRefinements(rows) {
  const apValues = sortedProfileValues(rows.map((row) => row.weapon.armourPenetration).filter(Boolean), 'ap')
  const damageValues = sortedProfileValues(rows.map((row) => row.weapon.damage).filter(Boolean), 'damage')
  return `
    <div class="armory-refinements">
      <label>
        AP
        <select data-armory-refinement="armoryAp">
          <option value="all">All AP</option>
          ${apValues.map((value) => `<option value="${escapeAttr(value)}" ${state.armoryAp === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}
        </select>
      </label>
      <label>
        Damage
        <select data-armory-refinement="armoryDamage">
          <option value="all">All damage</option>
          ${damageValues.map((value) => `<option value="${escapeAttr(value)}" ${state.armoryDamage === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}
        </select>
      </label>
    </div>
  `
}

function renderArmoryTable(rows) {
  return `
    <div class="table-wrap armory-table">
      <table>
        <thead>
          <tr>
            <th>Unit</th><th>Weapon</th><th>Profile</th><th>Type</th><th>Range</th><th>A</th><th>Skill</th><th>S</th><th>AP</th><th>D</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>
                <button class="unit-link" type="button" data-armory-unit-id="${escapeAttr(row.card.id)}">${escapeHtml(row.card.name)}</button>
                <small>${escapeHtml(formatPoints(row.card))}</small>
              </td>
              <td><strong>${escapeHtml(row.weapon.wargearName)}</strong>${row.weapon.ruleText ? `<small>${formatRules(row.weapon.ruleText)}</small>` : ''}</td>
              <td>${escapeHtml(row.weapon.profileName ?? '-')}</td>
              <td><span class="type-badge type-${escapeAttr(row.type)}">${escapeHtml(labelWeaponFilter(row.type))}</span></td>
              <td>${escapeHtml(row.weapon.range ?? '-')}</td>
              <td>${escapeHtml(row.weapon.attacks ?? '-')}</td>
              <td>${escapeHtml(row.weapon.ballisticSkill ?? row.weapon.weaponSkill ?? '-')}</td>
              <td>${escapeHtml(row.weapon.strength ?? '-')}</td>
              <td>${escapeHtml(row.weapon.armourPenetration ?? '-')}</td>
              <td>${escapeHtml(row.weapon.damage ?? '-')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}

function getArmoryRows({ ignoreType = false, ignoreProfileFilters = false } = {}) {
  const tokens = state.query.split(/\s+/).filter(Boolean)
  return state.filtered
    .flatMap((card) => (card.weapon_profiles ?? [])
      .filter((weapon) => weapon.profileName || weapon.ruleText)
      .map((weapon) => ({ card, weapon, type: getArmoryType(weapon) })))
    .filter((row) => ignoreType || state.armoryType === 'all' || row.type === state.armoryType)
    .filter((row) => {
      if (!tokens.length) return true
      const text = [
        row.card.name,
        row.card.category.label,
        ...(row.card.keywords ?? []),
        row.weapon.wargearName,
        row.weapon.profileName,
        row.weapon.type,
        row.weapon.range,
        row.weapon.attacks,
        row.weapon.ballisticSkill,
        row.weapon.weaponSkill,
        row.weapon.strength,
        row.weapon.armourPenetration,
        row.weapon.damage,
        row.weapon.ruleText,
      ].join(' ').toLowerCase()
      return tokens.every((token) => text.includes(token))
    })
    .filter((row) => ignoreProfileFilters || state.armoryAp === 'all' || row.weapon.armourPenetration === state.armoryAp)
    .filter((row) => ignoreProfileFilters || state.armoryDamage === 'all' || row.weapon.damage === state.armoryDamage)
    .sort(sortArmoryRows)
}

function getArmoryTypeCounts() {
  const counts = { all: 0, ranged: 0, melee: 0, wargear: 0 }
  for (const row of getArmoryRows({ ignoreType: true, ignoreProfileFilters: true })) {
    counts.all += 1
    counts[row.type] = (counts[row.type] ?? 0) + 1
  }
  return counts
}

function getArmoryType(weapon) {
  if (weapon.type === 'ranged' || weapon.type === 'melee') return weapon.type
  return 'wargear'
}

function sortArmoryRows(a, b) {
  return (
    a.card.datasheet.displayOrder - b.card.datasheet.displayOrder ||
    a.card.name.localeCompare(b.card.name) ||
    (a.weapon.wargearName ?? '').localeCompare(b.weapon.wargearName ?? '') ||
    numberish(a.weapon.profileDisplayOrder) - numberish(b.weapon.profileDisplayOrder) ||
    (a.weapon.profileName ?? '').localeCompare(b.weapon.profileName ?? '')
  )
}

function sortedProfileValues(values, mode) {
  const unique = [...new Set(values)]
  return unique.sort((a, b) => {
    if (mode === 'ap') return numberish(a) - numberish(b) || String(a).localeCompare(String(b))
    const numericA = /^\d+$/.test(String(a)) ? Number(a) : Number.POSITIVE_INFINITY
    const numericB = /^\d+$/.test(String(b)) ? Number(b) : Number.POSITIVE_INFINITY
    return numericA - numericB || String(a).localeCompare(String(b))
  })
}

function normalizeArmoryRefinements(rows) {
  const apValues = new Set(rows.map((row) => row.weapon.armourPenetration).filter(Boolean))
  const damageValues = new Set(rows.map((row) => row.weapon.damage).filter(Boolean))
  if (state.armoryAp !== 'all' && !apValues.has(state.armoryAp)) state.armoryAp = 'all'
  if (state.armoryDamage !== 'all' && !damageValues.has(state.armoryDamage)) state.armoryDamage = 'all'
}

function updateViewModeControls() {
  els.viewModes.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.viewMode === state.viewMode)
  })
  els.searchInput.placeholder = state.viewMode === 'armory'
    ? 'Search units, weapons, profiles'
    : 'Search datasheets, weapons, rules'
}

function bindDetailEvents(card) {
  els.sheetDetail.querySelectorAll('.section-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.section
      if (state.collapsed.has(id)) state.collapsed.delete(id)
      else state.collapsed.add(id)
      renderDetail()
    })
  })
  els.sheetDetail.querySelectorAll('.composition-choice').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeCompositionIds.set(card.id, button.dataset.compositionId)
      renderDetail()
    })
  })
  els.sheetDetail.querySelectorAll('.weapon-filter').forEach((button) => {
    button.addEventListener('click', () => {
      state.weaponFilter = button.dataset.weaponFilter
      renderDetail()
    })
  })
  els.sheetDetail.querySelectorAll('[data-option-key]').forEach((input) => {
    const update = () => {
      const value = input.type === 'checkbox' ? (input.checked ? 1 : 0) : Math.max(0, Number(input.value) || 0)
      state.loadoutValues.set(input.dataset.optionKey, value)
      updateWeaponHighlights(card)
    }
    input.addEventListener('change', update)
    input.addEventListener('input', update)
  })
}

function renderSection(id, title, body) {
  if (!body) return ''
  const collapsed = state.collapsed.has(id)
  return `
    <section class="data-section ${collapsed ? 'is-collapsed' : ''}">
      <button class="section-toggle" type="button" data-section="${escapeAttr(id)}">
        <span>${escapeHtml(title)}</span>
        <span aria-hidden="true">${collapsed ? '+' : '-'}</span>
      </button>
      <div class="section-body">${collapsed ? '' : body}</div>
    </section>
  `
}

function renderCompositionChooser(card) {
  const compositions = card.unit_compositions ?? []
  if (!compositions.length) return ''
  const active = getActiveComposition(card)

  if (compositions.length === 1) {
    return `
      <div class="composition-panel">
        <div class="composition-single">
          <strong>${escapeHtml(`${active.points} pts`)}</strong>
          <span>${escapeHtml(formatModels(active.models))}</span>
        </div>
      </div>
    `
  }

  return `
    <div class="composition-panel">
      ${compositions.map((item) => `
        <button class="composition-choice ${item.id === active.id ? 'is-active' : ''}" type="button" data-composition-id="${escapeAttr(item.id)}">
          <strong>${escapeHtml(`${item.points} pts`)}</strong>
          <span>${escapeHtml(formatModels(item.models))}</span>
        </button>
      `).join('')}
    </div>
  `
}

function renderStats(card) {
  if (!card.miniatures.length) return ''
  return `
    <div class="table-wrap stats-table">
      <table>
        <thead><tr><th>Model</th><th>M</th><th>T</th><th>Sv</th><th>W</th><th>Ld</th><th>OC</th></tr></thead>
        <tbody>
          ${card.miniatures.map((m) => `
            <tr>
              <td>${escapeHtml(m.name)}${m.statlineHidden ? '<span class="row-note">hidden</span>' : ''}</td>
              <td>${escapeHtml(m.movement)}</td>
              <td>${escapeHtml(m.toughness)}</td>
              <td>${escapeHtml(m.save)}</td>
              <td>${escapeHtml(m.wounds)}</td>
              <td>${escapeHtml(m.leadership)}</td>
              <td>${escapeHtml(m.objectiveControl)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}

function renderWeapons(card) {
  const profiles = card.weapon_profiles.filter((item) => item.profileName)
  const gear = card.weapon_profiles.filter((item) => !item.profileName && item.ruleText)
  if (!profiles.length && !gear.length) return ''

  const counts = {
    all: profiles.length + gear.length,
    ranged: profiles.filter((item) => item.type === 'ranged').length,
    melee: profiles.filter((item) => item.type === 'melee').length,
    wargear: gear.length,
  }

  const filteredProfiles = profiles.filter((item) => {
    if (state.weaponFilter === 'all') return true
    return item.type === state.weaponFilter
  })

  const tabs = ['all', 'ranged', 'melee', 'wargear']
    .filter((type) => counts[type])
    .map((type) => `
      <button class="weapon-filter ${state.weaponFilter === type ? 'is-active' : ''}" type="button" data-weapon-filter="${escapeAttr(type)}">
        ${escapeHtml(labelWeaponFilter(type))}<span>${counts[type]}</span>
      </button>
    `)
    .join('')

  const weaponTable = state.weaponFilter === 'wargear' || !filteredProfiles.length ? '' : `
    <div class="table-wrap weapon-table">
      <table>
        <thead><tr><th>Weapon</th><th>Profile</th><th>Range</th><th>A</th><th>Skill</th><th>S</th><th>AP</th><th>D</th></tr></thead>
        <tbody>
          ${filteredProfiles.map((w) => `
            <tr class="weapon-row" data-weapon-name="${escapeAttr(w.wargearName)}">
              <td>
                <strong>${escapeHtml(w.wargearName)}</strong>
                ${w.hunterProfileKeyword ? `<small>${escapeHtml(w.hunterProfileKeyword)}</small>` : ''}
              </td>
              <td><span class="type-badge type-${escapeAttr(w.type ?? 'other')}">${escapeHtml(w.type ?? '-')}</span> ${escapeHtml(w.profileName)}</td>
              <td>${escapeHtml(w.range ?? '-')}</td>
              <td>${escapeHtml(w.attacks ?? '-')}</td>
              <td>${escapeHtml(w.ballisticSkill ?? w.weaponSkill ?? '-')}</td>
              <td>${escapeHtml(w.strength ?? '-')}</td>
              <td>${escapeHtml(w.armourPenetration ?? '-')}</td>
              <td>${escapeHtml(w.damage ?? '-')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `

  const gearCards = state.weaponFilter === 'melee' || state.weaponFilter === 'ranged' ? '' : renderGearProfiles(gear)

  return `
    <div class="segmented-tabs">${tabs}</div>
    ${weaponTable}
    ${gearCards}
  `
}

function renderGearProfiles(gear) {
  if (!gear.length) return ''
  return `
    <div class="gear-grid">
      ${gear.map((item) => `
        <div class="gear-card" data-weapon-name="${escapeAttr(item.wargearName)}">
          <strong>${escapeHtml(item.wargearName)}</strong>
          <p>${formatRules(item.ruleText)}</p>
        </div>
      `).join('')}
    </div>
  `
}

function renderAbilities(card) {
  if (!card.abilities.length) return ''
  const groups = groupBy(card.abilities, (ability) => ability.abilityType || 'other')
  const order = ['core', 'faction', 'datasheet', 'other']
  const abilityTypes = [...order, ...[...groups.keys()].filter((type) => !order.includes(type))]
  return abilityTypes
    .filter((type) => groups.has(type))
    .map((type) => `
      <div class="rule-group">
        <h3>${escapeHtml(labelAbilityType(type))}</h3>
        <div class="rule-stack">
          ${groups.get(type).map((ability) => renderRuleCard(ability.name, ability.rules, ability.abilityType, state.commonAbilityNames.has(ability.name))).join('')}
        </div>
      </div>
    `)
    .join('')
}

function renderDatasheetRules(card) {
  const datasheetRules = card.datasheet_rules ?? []
  const wargearRules = card.wargear_rules ?? []
  if (!datasheetRules.length && !wargearRules.length) return ''
  return `
    ${datasheetRules.length ? `
      <div class="rule-group">
        <h3>Datasheet</h3>
        <div class="rule-stack">${datasheetRules.map((rule) => renderRuleCard(rule.name, rule.rules)).join('')}</div>
      </div>
    ` : ''}
    ${wargearRules.length ? `
      <div class="rule-group">
        <h3>Wargear</h3>
        <div class="rule-stack">${wargearRules.map((rule) => renderRuleCard('Option', rule.rulesText)).join('')}</div>
      </div>
    ` : ''}
  `
}

function renderLoadout(card) {
  const base = card.base_wargear ?? []
  const options = (card.wargear_options ?? []).filter((item) => item.instructionText !== 'Default Wargear')
  if (!base.length && !options.length) return ''

  return `
    ${base.length ? renderBaseLoadout(base) : ''}
    ${options.length ? renderOptionGroups(card, options) : ''}
  `
}

function renderBaseLoadout(base) {
  const groups = groupBy(base, (item) => item.miniatureName || 'Unit')
  return `
    <div class="loadout-block">
      <h3>Base Loadout</h3>
      <div class="loadout-grid">
        ${[...groups].map(([model, items]) => `
          <div class="loadout-model">
            <strong>${escapeHtml(model)}</strong>
            <div class="tag-cloud">
              ${items.map((item) => `<span>${escapeHtml(`${item.count}x ${item.wargearName}`)}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

function renderOptionGroups(card, options) {
  const modelGroups = groupBy(options, (item) => item.miniatureName || 'Unit')
  return `
    <div class="loadout-block">
      <h3>Options</h3>
      <div class="option-model-stack">
        ${[...modelGroups].map(([model, modelOptions]) => {
          const instructionGroups = groupBy(modelOptions, (item) => item.instructionText || 'Options')
          return `
            <div class="option-model">
              <h4>${escapeHtml(model)}</h4>
              ${[...instructionGroups].map(([instruction, items]) => `
                <div class="option-group">
                  <p>${formatRules(instruction)}</p>
                  <div class="option-controls">
                    ${items.map((item) => renderOptionControl(card, item)).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          `
        }).join('')}
      </div>
    </div>
  `
}

function renderOptionControl(card, option) {
  const key = optionKey(card, option)
  const value = getOptionValue(card, option)
  const points = option.points ? `<small>${escapeHtml(`${option.points} pts`)}</small>` : ''

  if (option.inputType === 'stepper') {
    return `
      <label class="option-control">
        <input type="number" min="0" inputmode="numeric" value="${escapeAttr(value)}" data-option-key="${escapeAttr(key)}" />
        <span>${escapeHtml(option.wargearName)}${points}</span>
      </label>
    `
  }

  return `
    <label class="option-control">
      <input type="checkbox" ${value > 0 ? 'checked' : ''} data-option-key="${escapeAttr(key)}" />
      <span>${escapeHtml(option.wargearName)}${points}</span>
    </label>
  `
}

function renderKeywords(card) {
  return `
    <div class="keyword-columns">
      <div>
        <h3>Faction</h3>
        <div class="tag-cloud">${card.faction_keywords.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div>
      </div>
      <div>
        <h3>Keywords</h3>
        <div class="tag-cloud">${card.keywords.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div>
      </div>
    </div>
  `
}

function renderRuleCard(title, body, meta = '', collapsed = false) {
  if (collapsed && body && body !== '-') {
    return `
      <details class="rule-card rule-details">
        <summary>
          <strong>${escapeHtml(title)}</strong>
          ${meta ? `<span>${escapeHtml(meta)}</span>` : ''}
        </summary>
        <p>${formatRules(body)}</p>
      </details>
    `
  }

  return `
    <div class="rule-card">
      <div class="rule-title">
        <strong>${escapeHtml(title)}</strong>
        ${meta ? `<span>${escapeHtml(meta)}</span>` : ''}
      </div>
      <p>${formatRules(body)}</p>
    </div>
  `
}

function updateWeaponHighlights(card) {
  const selected = getSelectedWargearNames(card)
  els.sheetDetail.querySelectorAll('[data-weapon-name]').forEach((node) => {
    node.classList.toggle('is-selected', selected.has(node.dataset.weaponName))
  })
}

function getSelectedWargearNames(card) {
  const names = new Set()
  for (const item of card.base_wargear ?? []) {
    if (numberish(item.count) > 0) names.add(item.wargearName)
  }
  for (const option of card.wargear_options ?? []) {
    if (getOptionValue(card, option) > 0) names.add(option.wargearName)
  }
  return names
}

function getOptionValue(card, option) {
  const key = optionKey(card, option)
  if (state.loadoutValues.has(key)) return state.loadoutValues.get(key)
  return numberish(option.defaultValue)
}

function optionKey(card, option) {
  return [card.id, option.miniatureName, option.instructionText, option.wargearName, option.displayOrder].join('::')
}

function getActiveComposition(card) {
  const compositions = card.unit_compositions ?? []
  if (!compositions.length) return null
  const activeId = state.activeCompositionIds.get(card.id)
  return compositions.find((item) => item.id === activeId) ?? compositions.find((item) => item.isDefault) ?? compositions[0]
}

function groupCardsByCategory(cards) {
  const groups = groupBy(cards, (card) => card.category.id)
  return categoryOrder
    .filter((id) => groups.has(id))
    .map((id) => ({ category: getCategoryById(id), cards: groups.get(id) }))
}

function getCategoryById(id) {
  return categoryRules.find((item) => item.id === id) ?? categoryFallback
}

function deriveCategory(keywords) {
  const set = new Set(keywords)
  return categoryRules.find((rule) => rule.keywords.some((keyword) => set.has(keyword))) ?? categoryFallback
}

function getCommonAbilityNames(cards) {
  const counts = countBy(cards.flatMap((card) => card.abilities ?? []), (ability) => ability.name)
  const threshold = Math.max(5, Math.floor(cards.length * 0.35))
  return new Set([...counts].filter(([, count]) => count >= threshold).map(([name]) => name))
}

function countBy(items, fn) {
  const counts = new Map()
  for (const item of items) {
    const key = fn(item)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

function groupBy(items, fn) {
  const groups = new Map()
  for (const item of items) {
    const key = fn(item)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  }
  return groups
}

function sortPublications(a, b) {
  const rank = (name) => {
    if (name.startsWith('Codex:')) return 0
    if (name.startsWith('Index:')) return 1
    if (name.startsWith('Codex Supplement:')) return 2
    return 3
  }
  return rank(a.publication) - rank(b.publication) || cleanPublicationName(a.publication).localeCompare(cleanPublicationName(b.publication))
}

function cleanPublicationName(name) {
  return name.replace(/^Codex Supplement:\s*/, '').replace(/^Codex:\s*/, '').replace(/^Index:\s*/, '')
}

function getCard(id) {
  return state.cards.find((card) => card.id === id)
}

function primaryKeywords(card) {
  const preferred = [
    'Character',
    'Epic Hero',
    'Battleline',
    'Infantry',
    'Vehicle',
    'Monster',
    'Transport',
    'Terminator',
    'Daemon',
    'Mounted',
    'Fly',
    'Psyker',
  ]
  return preferred.filter((keyword) => card.keywords.includes(keyword)).slice(0, 4)
}

function uniqueWeaponNames(card) {
  return [...new Set((card.weapon_profiles ?? []).map((item) => item.wargearName).filter(Boolean))]
}

function formatPoints(card) {
  const values = [...new Set((card.unit_compositions ?? []).map((item) => numberish(item.points)).filter(Boolean))]
  if (!values.length) return '-'
  return values.length === 1 ? `${values[0]} pts` : `${Math.min(...values)}-${Math.max(...values)} pts`
}

function formatCompositionPoints(composition, card) {
  return composition ? `${composition.points} pts` : formatPoints(card)
}

function formatCompositionModels(composition, card) {
  if (composition) return formatModels(composition.models)
  const totals = (card.unit_compositions ?? []).map((item) => item.models.reduce((sum, model) => sum + model.max, 0))
  if (!totals.length) return '-'
  const min = Math.min(...totals)
  const max = Math.max(...totals)
  return min === max ? String(min) : `${min}-${max}`
}

function formatModels(models = []) {
  return models
    .map((model) => {
      const count = model.min === model.max ? model.min : `${model.min}-${model.max}`
      return `${count} ${model.name}`
    })
    .join(', ')
}

function labelWeaponFilter(type) {
  return {
    all: 'All',
    ranged: 'Ranged',
    melee: 'Melee',
    wargear: 'Wargear',
  }[type] ?? type
}

function labelAbilityType(type) {
  return {
    core: 'Core',
    faction: 'Faction',
    datasheet: 'Datasheet',
    other: 'Other',
  }[type] ?? type
}

function setLoadingState() {
  els.sourceMeta.textContent = 'Loading faction data...'
  els.unitList.innerHTML = '<div class="list-empty">Loading datasheets...</div>'
  els.sheetDetail.innerHTML = '<div class="empty-state">Loading datasheet.</div>'
}

function showError(error) {
  els.sourceMeta.textContent = 'Failed to load data.'
  els.sheetDetail.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`
}

function formatRules(text) {
  return escapeHtml(text ?? '-')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/g, '<u>$1</u>')
    .replace(/&lt;\/?ul&gt;/g, '')
    .replace(/&lt;li&gt;/g, '<br />- ')
    .replace(/&lt;\/li&gt;/g, '')
    .replace(/\n/g, '<br />')
}

function numberish(value) {
  const parsed = Number(String(value ?? '').replace(/[^\d.-]+/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function escapeAttr(value) {
  return escapeHtml(value)
}

boot().catch(showError)
