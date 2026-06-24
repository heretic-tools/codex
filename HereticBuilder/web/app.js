(function () {
  "use strict";

  var app = document.getElementById("app");
  var state = {
    bootstrap: null,
    rosterId: "",
    rosterData: null,
    detachments: [],
    datasheets: [],
    search: "",
    selectedUnitId: "",
    pageError: "",
    routeToken: 0
  };

  var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return entityMap[char];
    });
  }

  function attr(value) {
    return escapeHtml(value);
  }

  function enc(value) {
    return encodeURIComponent(value == null ? "" : value);
  }

  function getRosterId() {
    return new URLSearchParams(window.location.search).get("id") || "";
  }

  function selectedDetachmentIds() {
    if (!state.rosterData || !state.rosterData.detachments) {
      return [];
    }
    return state.rosterData.detachments.map(function (item) {
      return item.id;
    });
  }

  function pointsText(value) {
    var points = Number(value || 0);
    return points + " pts";
  }

  function countText(value, label) {
    return Number(value || 0) + " " + label;
  }

  function displayText(value, fallback) {
    var text = String(value == null ? "" : value).trim();
    return text || (fallback || "-");
  }

  function simpleList(items, renderItem) {
    if (!items || !items.length) {
      return '<p class="muted">No records found.</p>';
    }
    return '<ul class="plain-list">' + items.map(renderItem).join("") + '</ul>';
  }

  function shell(title, body) {
    return [
      '<div class="shell">',
      '  <nav class="topbar" aria-label="Main">',
      '    <span class="brand">HereticSheets</span>',
      '    <a href="/" data-link>Home</a>',
      '    <a href="/builder/new" data-link>HereticBuilder</a>',
      '    <a href="/sheets" data-link>HereticSheets</a>',
      '  </nav>',
      '  <h1 class="page-title">' + escapeHtml(title) + '</h1>',
      errorBox(),
      body,
      '</div>'
    ].join("");
  }

  function errorBox() {
    if (!state.pageError) {
      return "";
    }
    return '<div class="error-box" role="alert">' + escapeHtml(state.pageError) + '</div>';
  }

  function renderLoading(title) {
    app.innerHTML = shell(title || "Loading", '<fieldset><legend>Loading</legend>Loading...</fieldset>');
  }

  function renderHome() {
    state.pageError = "";
    app.innerHTML = [
      '<main class="portal">',
      '  <a class="button-link" href="/builder/new" data-link>HereticBuilder</a>',
      '  <a class="button-link" href="/sheets" data-link>HereticSheets</a>',
      '</main>'
    ].join("");
  }

  function renderNotFound() {
    app.innerHTML = shell("Not Found", '<fieldset><legend>404</legend>Page not found.</fieldset>');
  }

  function renderNewRoster() {
    var data = state.bootstrap || {};
    var factions = data.factions || [];
    var sizes = data.battleSizes || [];
    var factionOptions = factions.map(function (item) {
      var selected = item.id === data.defaultFactionId ? " selected" : "";
      return '<option value="' + attr(item.id) + '"' + selected + '>' + escapeHtml(item.name) + '</option>';
    }).join("");
    var sizeOptions = sizes.map(function (item) {
      var label = item.name + (item.pointsLimit ? " (" + item.pointsLimit + " pts)" : "");
      var selected = item.id === data.defaultBattleSizeId ? " selected" : "";
      return '<option value="' + attr(item.id) + '"' + selected + '>' + escapeHtml(label) + '</option>';
    }).join("");

    app.innerHTML = shell("New Roster", [
      '<form data-form="create-roster">',
      '  <fieldset>',
      '    <legend>Roster</legend>',
      '    <div class="form-row">',
      '      <label><span>Name</span><input name="name" value="New Roster" autocomplete="off"></label>',
      '      <label><span>Battle size</span><select name="battleSizeId" required>' + sizeOptions + '</select></label>',
      '      <label><span>Faction</span><select name="factionKeywordId" required>' + factionOptions + '</select></label>',
      '    </div>',
      '    <div class="form-actions">',
      '      <button type="submit">Create roster</button>',
      '      <a href="/" data-link>Cancel</a>',
      '    </div>',
      '  </fieldset>',
      '</form>'
    ].join(""));
  }

  function renderSheets(data) {
    var sections = (data && data.sections) || [];
    var links = sections.map(function (section) {
      var href = section.id === "core" ? "/sheets/core" : "/sheets/army-rules";
      var counts = section.counts || {};
      var countLine = Object.keys(counts).map(function (key) {
        return key + ": " + counts[key];
      }).join(", ");
      return [
        '<a class="button-link" href="' + attr(href) + '" data-link>',
        escapeHtml(section.name),
        countLine ? '<br><small>' + escapeHtml(countLine) + '</small>' : '',
        '</a>'
      ].join("");
    }).join("");
    app.innerHTML = shell("HereticSheets", [
      '<fieldset>',
      '  <legend>Sections</legend>',
      '  <div class="sheets-menu">',
      links || '<p class="muted">No sections found.</p>',
      '  </div>',
      '</fieldset>'
    ].join(""));
  }

  function renderCore(data) {
    var publication = data.publication || {};
    var sections = (data.ruleSections || []).map(function (section) {
      return [
        '<tr>',
        '<td><a href="/sheets/rule-section?id=' + attr(section.id) + '" data-link>' + escapeHtml(section.name) + '</a></td>',
        '<td class="nowrap">' + countText(section.childSectionCount, "sub") + '</td>',
        '<td class="nowrap">' + countText(section.containerCount, "rules") + '</td>',
        '</tr>'
      ].join("");
    }).join("");
    var cards = (data.sections || []).map(function (section) {
      var href = section.id === "stratagems" ? "/sheets/core/stratagems" : (section.id === "faqs" ? "/sheets/core/faq" : "/sheets/core");
      return '<a class="button-link" href="' + attr(href) + '" data-link>' + escapeHtml(section.name) + '<br><small>' + escapeHtml(section.count) + '</small></a>';
    }).join("");
    app.innerHTML = shell("Core Rules", [
      '<fieldset>',
      '  <legend>' + escapeHtml(publication.name || "Core Rules") + '</legend>',
      '  <div class="sheets-menu compact">' + cards + '</div>',
      '</fieldset>',
      '<fieldset>',
      '  <legend>Общие правила</legend>',
      '  <div class="scroll-table"><table>',
      '    <thead><tr><th>Section</th><th>Sub</th><th>Rules</th></tr></thead>',
      '    <tbody>' + (sections || '<tr><td colspan="3">No sections found.</td></tr>') + '</tbody>',
      '  </table></div>',
      '</fieldset>'
    ].join(""));
  }

  function renderRuleSection(data) {
    var section = data.ruleSection || {};
    var children = simpleList(data.childSections || [], function (item) {
      return '<li><a href="/sheets/rule-section?id=' + attr(item.id) + '" data-link>' + escapeHtml(item.name) + '</a> <span class="muted">(' + escapeHtml(item.containerCount) + ')</span></li>';
    });
    var containers = simpleList(data.ruleContainers || [], function (item) {
      return '<li><a href="/sheets/rule-container?id=' + attr(item.id) + '" data-link>' + escapeHtml(displayText(item.title, item.containerType)) + '</a> <span class="muted">' + escapeHtml(item.containerType) + '</span></li>';
    });
    app.innerHTML = shell(section.name || "Rule Section", [
      '<fieldset>',
      '  <legend>Subsections</legend>',
      children,
      '</fieldset>',
      '<fieldset>',
      '  <legend>Rules</legend>',
      containers,
      '</fieldset>'
    ].join(""));
  }

  function renderRuleContainer(data) {
    var container = data.ruleContainer || {};
    var components = (data.components || []).map(renderRuleComponent).join("");
    var faqs = renderFaqItems(data.faqs || []);
    app.innerHTML = shell(container.title || "Rule", [
      '<fieldset>',
      '  <legend>' + escapeHtml(container.containerType || "Rule") + '</legend>',
      container.subtitle ? '<p><strong>' + escapeHtml(container.subtitle) + '</strong></p>' : '',
      components || '<p class="muted">No components found.</p>',
      '</fieldset>',
      faqs ? '<fieldset><legend>FAQ</legend>' + faqs + '</fieldset>' : ''
    ].join(""));
  }

  function renderRuleComponent(component) {
    var title = component.title ? '<h2>' + escapeHtml(component.title) + '</h2>' : '';
    var subtitle = component.subtitle ? '<p><strong>' + escapeHtml(component.subtitle) + '</strong></p>' : '';
    var text = component.textContent ? '<p>' + escapeHtml(component.textContent) + '</p>' : '';
    var trigger = component.trigger ? '<p><strong>Trigger:</strong> ' + escapeHtml(component.trigger) + '</p>' : '';
    var effect = component.effect ? '<p><strong>Effect:</strong> ' + escapeHtml(component.effect) + '</p>' : '';
    var bullets = (component.bulletPoints || []).length
      ? '<ul>' + component.bulletPoints.map(function (item) {
        return '<li>' + escapeHtml(item.text) + '</li>';
      }).join("") + '</ul>'
      : '';
    var image = component.imageUrl ? '<p><a href="' + attr(component.imageUrl) + '" target="_blank" rel="noreferrer">Image</a></p>' : '';
    return '<div class="rule-component">' + title + subtitle + text + trigger + effect + bullets + image + '</div>';
  }

  function renderFactions(data) {
    var rows = (data.factions || []).map(function (faction) {
      return [
        '<tr>',
        '<td><a href="/sheets/faction?id=' + attr(faction.id) + '" data-link>' + escapeHtml(faction.name) + '</a></td>',
        '<td class="nowrap">' + escapeHtml(faction.datasheetCount || 0) + '</td>',
        '<td class="nowrap">' + escapeHtml(faction.detachmentCount || 0) + '</td>',
        '<td class="nowrap">' + escapeHtml(faction.faqCount || 0) + '</td>',
        '</tr>'
      ].join("");
    }).join("");
    app.innerHTML = shell("Army Rules", [
      '<fieldset>',
      '  <legend>Armies</legend>',
      '  <div class="scroll-table"><table>',
      '    <thead><tr><th>Army</th><th>Datasheets</th><th>Detachments</th><th>FAQ</th></tr></thead>',
      '    <tbody>' + (rows || '<tr><td colspan="4">No armies found.</td></tr>') + '</tbody>',
      '  </table></div>',
      '</fieldset>'
    ].join(""));
  }

  function renderFactionHub(data) {
    var faction = data.faction || {};
    var sections = (data.sections || []).filter(function (section) {
      return Number(section.count || 0) > 0 || section.id === "army-rules";
    }).map(function (section) {
      var routeId = section.id === "detachments" ? "formations" : section.id;
      var href = "/sheets/" + routeId + "?factionId=" + enc(faction.id);
      return '<a class="button-link" href="' + attr(href) + '" data-link>' + escapeHtml(section.name) + '<br><small>' + escapeHtml(section.count) + '</small></a>';
    }).join("");
    var publications = simpleList(data.publications || [], function (item) {
      var parts = [
        countText(item.armyRuleCount, "army rules"),
        countText(item.datasheetCount, "datasheets"),
        countText(item.detachmentCount, "detachments")
      ];
      return '<li><strong>' + escapeHtml(item.name) + '</strong> <span class="muted">' + escapeHtml(parts.join(", ")) + '</span></li>';
    });
    app.innerHTML = shell(faction.name || "Army", [
      '<fieldset>',
      '  <legend>Sections</legend>',
      '  <div class="sheets-menu compact">' + sections + '</div>',
      '</fieldset>',
      '<fieldset>',
      '  <legend>Publications</legend>',
      publications,
      '</fieldset>'
    ].join(""));
  }

  function renderArmyRules(data) {
    app.innerHTML = shell(((data.faction || {}).name || "Army") + " Army Rules", [
      '<fieldset><legend>Army Rules</legend>',
      simpleList(data.armyRules || [], function (item) {
        return '<li><strong>' + escapeHtml(item.name) + '</strong> <span class="muted">' + escapeHtml(item.publicationName || "") + '</span></li>';
      }),
      '</fieldset>'
    ].join(""));
  }

  function renderDatasheets(data) {
    var faction = data.faction || {};
    var rows = (data.datasheets || []).map(function (item) {
      return [
        '<tr>',
        '<td><a href="/sheets/datasheet?id=' + attr(item.id) + '" data-link>' + escapeHtml(item.name) + '</a><br><span class="muted">' + escapeHtml(item.unitComposition || "") + '</span></td>',
        '<td class="nowrap">' + pointsText(item.points) + '</td>',
        '<td>' + escapeHtml(item.publicationName || "") + '</td>',
        '</tr>'
      ].join("");
    }).join("");
    app.innerHTML = shell((faction.name || "Army") + " Datasheets", [
      '<fieldset><legend>Datasheets</legend><div class="scroll-table"><table>',
      '<thead><tr><th>Name</th><th>Points</th><th>Publication</th></tr></thead>',
      '<tbody>' + (rows || '<tr><td colspan="3">No datasheets found.</td></tr>') + '</tbody>',
      '</table></div></fieldset>'
    ].join(""));
  }

  function renderDetachments(data) {
    var faction = data.faction || {};
    var rows = (data.detachments || []).map(function (item) {
      return [
        '<tr>',
        '<td><a href="/sheets/formation?id=' + attr(item.id) + '" data-link>' + escapeHtml(item.name) + '</a></td>',
        '<td class="nowrap">' + pointsText(item.detachmentPointsCost) + '</td>',
        '<td class="nowrap">' + escapeHtml(item.ruleCount || 0) + '</td>',
        '<td>' + escapeHtml(item.publicationName || "") + '</td>',
        '</tr>'
      ].join("");
    }).join("");
    app.innerHTML = shell((faction.name || "Army") + " Detachments", [
      '<fieldset><legend>Detachments</legend><div class="scroll-table"><table>',
      '<thead><tr><th>Name</th><th>DP</th><th>Rules</th><th>Publication</th></tr></thead>',
      '<tbody>' + (rows || '<tr><td colspan="4">No detachments found.</td></tr>') + '</tbody>',
      '</table></div></fieldset>'
    ].join(""));
  }

  function renderStratagems(data, title) {
    app.innerHTML = shell(title || (((data.faction || data.publication || {}).name || "Rules") + " Stratagems"), [
      '<fieldset><legend>Stratagems</legend>',
      simpleList(data.stratagems || [], function (item) {
        return '<li><strong>' + escapeHtml(item.name) + '</strong> <span class="muted">' + escapeHtml(item.cpCost || "") + ' ' + escapeHtml(item.category || "") + '</span><br>' + escapeHtml(item.effectRules || "") + '</li>';
      }),
      '</fieldset>'
    ].join(""));
  }

  function renderEnhancements(data) {
    app.innerHTML = shell(((data.faction || {}).name || "Army") + " Enhancements", [
      '<fieldset><legend>Enhancements</legend>',
      simpleList(data.enhancements || [], function (item) {
        return '<li><strong>' + escapeHtml(item.name) + '</strong> <span class="muted">' + pointsText(item.basePointsCost) + ' ' + escapeHtml(item.detachmentName || "") + '</span><br>' + escapeHtml(item.rules || "") + '</li>';
      }),
      '</fieldset>'
    ].join(""));
  }

  function renderFaqs(data, title) {
    app.innerHTML = shell(title || (((data.faction || data.publication || {}).name || "Rules") + " FAQ"), [
      '<fieldset><legend>FAQ</legend>',
      renderFaqItems(data.faqs || []) || '<p class="muted">No FAQ found.</p>',
      '</fieldset>'
    ].join(""));
  }

  function renderFaqItems(items) {
    if (!items || !items.length) {
      return "";
    }
    return '<ul class="plain-list">' + items.map(function (item) {
      var head = item.question || item.errataHeader || item.publicationName || "FAQ";
      var body = item.answer || item.errataText || "";
      return '<li><strong>' + escapeHtml(head) + '</strong>' + (body ? '<br>' + escapeHtml(body) : '') + '</li>';
    }).join("") + '</ul>';
  }

  function renderDatasheetDetail(data) {
    var item = data.datasheet || {};
    app.innerHTML = shell(item.name || "Datasheet", [
      '<fieldset><legend>Summary</legend>',
      '<dl class="meta-list">',
      '<dt>Publication</dt><dd>' + escapeHtml(item.publicationName || "") + '</dd>',
      '<dt>Base size</dt><dd>' + escapeHtml(item.baseSize || "") + '</dd>',
      '<dt>Composition</dt><dd>' + escapeHtml(item.unitComposition || "") + '</dd>',
      '</dl>',
      '</fieldset>',
      '<fieldset><legend>Miniatures</legend>',
      simpleList(data.miniatures || [], function (model) {
        return '<li><strong>' + escapeHtml(model.name) + '</strong> M ' + escapeHtml(model.movement) + ' T ' + escapeHtml(model.toughness) + ' Sv ' + escapeHtml(model.save) + ' W ' + escapeHtml(model.wounds) + ' OC ' + escapeHtml(model.objectiveControl) + '</li>';
      }),
      '</fieldset>',
      '<fieldset><legend>Abilities</legend>',
      simpleList(data.abilities || [], function (ability) {
        return '<li><strong>' + escapeHtml(ability.name) + '</strong><br>' + escapeHtml(ability.rules || "") + '</li>';
      }),
      '</fieldset>',
      '<fieldset><legend>Weapons</legend>',
      simpleList(data.wargearProfiles || [], function (profile) {
        return '<li><strong>' + escapeHtml(profile.wargearItemName || profile.name) + '</strong> ' + escapeHtml(profile.range || "") + ' A ' + escapeHtml(profile.attacks || "") + ' S ' + escapeHtml(profile.strength || "") + ' AP ' + escapeHtml(profile.armourPenetration || "") + ' D ' + escapeHtml(profile.damage || "") + '</li>';
      }),
      '</fieldset>'
    ].join(""));
  }

  function renderDetachmentDetail(data) {
    var item = data.detachment || {};
    app.innerHTML = shell(item.name || "Detachment", [
      '<fieldset><legend>Rules</legend>',
      simpleList(data.rules || [], function (rule) {
        return '<li><strong>' + escapeHtml(rule.name) + '</strong><br>' + escapeHtml(rule.rules || "") + '</li>';
      }),
      '</fieldset>',
      '<fieldset><legend>Details</legend>',
      simpleList(data.details || [], function (detail) {
        return '<li><strong>' + escapeHtml(detail.name) + '</strong></li>';
      }),
      '</fieldset>',
      '<fieldset><legend>Linked</legend>',
      '<p>' + countText((data.enhancements || []).length, "enhancements") + ', ' + countText((data.stratagems || []).length, "stratagems") + '</p>',
      '</fieldset>'
    ].join(""));
  }

  function renderRosterPage() {
    var payload = state.rosterData;
    if (!payload || !payload.roster) {
      app.innerHTML = shell("Roster", '<fieldset><legend>Roster</legend>No roster loaded.</fieldset>');
      return;
    }
    normalizeSelectedUnit();
    var roster = payload.roster;
    var title = roster.name || "Roster";
    app.innerHTML = shell(title, [
      '<nav class="jump-links" aria-label="Roster">',
      '  <a href="#roster">Roster</a>',
      '  <a href="#add">Add</a>',
      '  <a href="#units">Units</a>',
      '  <a href="#errors">Errors</a>',
      '</nav>',
      '<div class="roster-grid">',
      '  <div class="roster-side">',
      renderSummary(payload),
      renderDetachments(payload),
      renderValidation(payload),
      '  </div>',
      '  <div class="roster-main">',
      renderDatasheetSearch(),
      renderUnits(payload),
      '  </div>',
      '  <div class="roster-detail">',
      renderUnitDetail(payload),
      '  </div>',
      '</div>'
    ].join(""));
  }

  function renderSummary(payload) {
    var roster = payload.roster;
    var points = payload.points || {};
    var validation = payload.validation || {};
    var over = Number(points.limit || 0) && Number(points.total || 0) > Number(points.limit || 0);
    var status = validation.state || "unknown";
    return [
      '<fieldset id="roster">',
      '  <legend>Summary</legend>',
      '  <dl class="meta-list">',
      '    <dt>Name</dt><dd>' + escapeHtml(roster.name) + '</dd>',
      '    <dt>Faction</dt><dd>' + escapeHtml(roster.factionName) + '</dd>',
      '    <dt>Battle</dt><dd>' + escapeHtml(roster.battleSizeName || "") + '</dd>',
      '    <dt>Points</dt><dd class="points ' + (over ? "over" : "") + '">' + pointsText(points.total) + ' / ' + pointsText(points.limit) + '</dd>',
      '    <dt>Status</dt><dd><span class="status ' + attr(status) + '">' + escapeHtml(status) + '</span></dd>',
      '  </dl>',
      '</fieldset>'
    ].join("");
  }

  function renderDetachments(payload) {
    var chosen = new Set(selectedDetachmentIds());
    var selectedCost = (payload.detachments || []).reduce(function (sum, item) {
      return sum + Number(item.detachmentPointsCost || 0);
    }, 0);
    var boxes = (state.detachments || []).map(function (item) {
      var checked = chosen.has(item.id) ? " checked" : "";
      var cost = Number(item.detachmentPointsCost || 0);
      var label = item.name + (cost ? " (" + cost + " pts)" : "");
      return [
        '<label class="check-item">',
        '  <input type="checkbox" name="detachmentId" value="' + attr(item.id) + '"' + checked + '>',
        '  <span>' + escapeHtml(label) + '</span>',
        '</label>'
      ].join("");
    }).join("");
    if (!boxes) {
      boxes = '<p class="muted">No detachments found.</p>';
    }
    return [
      '<form data-form="detachments">',
      '  <fieldset>',
      '    <legend>Detachments</legend>',
      '    <div class="check-list">' + boxes + '</div>',
      '    <p class="muted">Selected cost: ' + pointsText(selectedCost) + '</p>',
      '    <button type="submit">Save detachments</button>',
      '  </fieldset>',
      '</form>'
    ].join("");
  }

  function renderValidation(payload) {
    var validation = payload.validation || {};
    var messages = validation.messages || [];
    var content = "";
    if (!messages.length) {
      content = '<div class="message ok">No validation messages.</div>';
    } else {
      content = messages.map(function (item) {
        var level = item.level || "warning";
        return '<div class="message ' + attr(level) + '">' + escapeHtml(item.text) + '</div>';
      }).join("");
    }
    return [
      '<fieldset id="errors">',
      '  <legend>Validation</legend>',
      content,
      '</fieldset>'
    ].join("");
  }

  function renderDatasheetSearch() {
    var rows = (state.datasheets || []).map(function (item) {
      return [
        '<tr>',
        '  <td class="unit-name"><strong>' + escapeHtml(item.name) + '</strong><br><span class="muted">' + escapeHtml(item.unitComposition || "") + '</span></td>',
        '  <td class="nowrap">' + pointsText(item.points) + '</td>',
        '  <td><button type="button" data-action="add-unit" data-datasheet-id="' + attr(item.id) + '">Add</button></td>',
        '</tr>'
      ].join("");
    }).join("");
    if (!rows) {
      rows = '<tr><td colspan="3">No datasheets found.</td></tr>';
    }
    return [
      '<fieldset id="add">',
      '  <legend>Add Unit</legend>',
      '  <form data-form="datasheet-search">',
      '    <div class="form-row search-row">',
      '      <label><span>Search</span><input name="q" value="' + attr(state.search) + '" autocomplete="off"></label>',
      '      <div class="form-actions">',
      '        <button type="submit">Search</button>',
      '        <button type="button" data-action="clear-search">Clear</button>',
      '      </div>',
      '    </div>',
      '  </form>',
      '  <div class="scroll-table">',
      '    <table>',
      '      <thead><tr><th>Datasheet</th><th>Points</th><th>Action</th></tr></thead>',
      '      <tbody>' + rows + '</tbody>',
      '    </table>',
      '  </div>',
      '</fieldset>'
    ].join("");
  }

  function renderUnits(payload) {
    var units = payload.units || [];
    var rows = units.map(function (unit) {
      var selected = unit.id === state.selectedUnitId ? " selected" : "";
      return [
        '<tr class="' + selected + '">',
        '  <td class="unit-name">',
        '    <button type="button" class="unit-button" data-action="select-unit" data-unit-id="' + attr(unit.id) + '">' + escapeHtml(unit.name) + '</button>',
        '    <br><span class="muted">' + escapeHtml(unit.compositionLabel || "") + '</span>',
        '  </td>',
        '  <td class="nowrap">' + escapeHtml(unit.modelCount || 0) + '</td>',
        '  <td class="nowrap">' + pointsText(unit.points) + '</td>',
        '  <td><button type="button" data-action="delete-unit" data-unit-id="' + attr(unit.id) + '">Delete</button></td>',
        '</tr>'
      ].join("");
    }).join("");
    if (!rows) {
      rows = '<tr><td colspan="4">No units in this roster.</td></tr>';
    }
    return [
      '<fieldset id="units">',
      '  <legend>Units</legend>',
      '  <div class="scroll-table">',
      '    <table>',
      '      <thead><tr><th>Unit</th><th>Models</th><th>Points</th><th>Action</th></tr></thead>',
      '      <tbody>' + rows + '</tbody>',
      '    </table>',
      '  </div>',
      '</fieldset>'
    ].join("");
  }

  function renderUnitDetail(payload) {
    var units = payload.units || [];
    var unit = units.find(function (item) {
      return item.id === state.selectedUnitId;
    });
    if (!unit) {
      return [
        '<fieldset>',
        '  <legend>Unit Detail</legend>',
        '  <p class="muted">Select a unit.</p>',
        '</fieldset>'
      ].join("");
    }
    var miniatures = (unit.miniatures || []).map(function (model) {
      var label = model.count + " x " + model.name;
      if (model.isWarlord) {
        label += " (Warlord)";
      }
      return '<li>' + escapeHtml(label) + '</li>';
    }).join("");
    var keywords = (unit.keywordNames || []).map(function (name) {
      return '<li>' + escapeHtml(name) + '</li>';
    }).join("");
    var extras = [];
    if (unit.allegianceAbilities && unit.allegianceAbilities.length) {
      extras.push("Allegiance: " + unit.allegianceAbilities.map(function (item) {
        return item.name;
      }).join(", "));
    }
    if (unit.unitEnhancements && unit.unitEnhancements.length) {
      extras.push("Enhancements: " + unit.unitEnhancements.map(function (item) {
        return item.name;
      }).join(", "));
    }
    if (unit.miniatureEnhancements && unit.miniatureEnhancements.length) {
      extras.push("Model enhancements: " + unit.miniatureEnhancements.map(function (item) {
        return item.name;
      }).join(", "));
    }
    return [
      '<fieldset>',
      '  <legend>Unit Detail</legend>',
      '  <dl class="meta-list">',
      '    <dt>Name</dt><dd>' + escapeHtml(unit.name) + '</dd>',
      '    <dt>Points</dt><dd>' + pointsText(unit.points) + '</dd>',
      '    <dt>Models</dt><dd>' + escapeHtml(unit.modelCount || 0) + '</dd>',
      '    <dt>Ally</dt><dd>' + escapeHtml(unit.allyType || "native") + '</dd>',
      '  </dl>',
      miniatures ? '<h2>Models</h2><ul>' + miniatures + '</ul>' : '',
      keywords ? '<h2>Keywords</h2><ul class="tag-list">' + keywords + '</ul>' : '',
      extras.length ? '<h2>Options</h2><p>' + escapeHtml(extras.join(" | ")) + '</p>' : '',
      '</fieldset>'
    ].join("");
  }

  function normalizeSelectedUnit() {
    var units = state.rosterData && state.rosterData.units ? state.rosterData.units : [];
    if (!units.length) {
      state.selectedUnitId = "";
      return;
    }
    var exists = units.some(function (unit) {
      return unit.id === state.selectedUnitId;
    });
    if (!exists) {
      state.selectedUnitId = units[0].id;
    }
  }

  async function fetchJson(path, options) {
    var opts = options || {};
    var controller = window.AbortController ? new AbortController() : null;
    var init = {
      method: opts.method || "GET",
      headers: {
        "Accept": "application/json"
      },
      signal: controller ? controller.signal : undefined
    };
    if (opts.body !== undefined) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(opts.body);
    }
    var timeoutId = null;
    var timeoutPromise = new Promise(function (_, reject) {
      timeoutId = window.setTimeout(function () {
        if (controller) {
          controller.abort();
        }
        reject(new Error("API request timed out: " + path));
      }, opts.timeout || 8000);
    });
    var response;
    try {
      response = await Promise.race([fetch(path, init), timeoutPromise]);
    } catch (error) {
      if (error && error.name === "AbortError") {
        throw new Error("API request timed out: " + path);
      }
      throw error;
    } finally {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    }
    var text = await response.text();
    var data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (error) {
        throw new Error("API returned invalid JSON.");
      }
    }
    if (!response.ok || data.error) {
      throw new Error(data.error || ("HTTP " + response.status));
    }
    return data;
  }

  async function ensureBootstrap() {
    if (!state.bootstrap) {
      state.bootstrap = await fetchJson("/api/bootstrap");
    }
  }

  async function loadRosterBundle(rosterId) {
    state.rosterId = rosterId;
    state.rosterData = await fetchJson("/api/roster?id=" + enc(rosterId));
    var factionId = state.rosterData.roster.factionKeywordId;
    var detachmentData = await fetchJson("/api/builder/forms?factionId=" + enc(factionId));
    state.detachments = detachmentData.detachments || [];
    await loadDatasheets();
    normalizeSelectedUnit();
  }

  async function loadDatasheets() {
    if (!state.rosterData || !state.rosterData.roster) {
      state.datasheets = [];
      return;
    }
    var roster = state.rosterData.roster;
    var params = new URLSearchParams();
    params.set("factionId", roster.factionKeywordId);
    params.set("detachmentIds", selectedDetachmentIds().join(","));
    params.set("q", state.search || "");
    params.set("allyType", "native");
    var data = await fetchJson("/api/datasheets?" + params.toString());
    state.datasheets = data.datasheets || [];
  }

  async function route() {
    var token = ++state.routeToken;
    var path = window.location.pathname;
    var query = new URLSearchParams(window.location.search);
    state.pageError = "";
    try {
      if (path === "/" || path === "") {
        renderHome();
        return;
      }
      if (path === "/builder" || path === "/builder/") {
        navigate("/builder/new", true);
        return;
      }
      if (path === "/builder/new") {
        renderLoading("New Roster");
        await ensureBootstrap();
        if (token === state.routeToken) {
          renderNewRoster();
        }
        return;
      }
      if (path === "/builder/roster") {
        var rosterId = getRosterId();
        if (!rosterId) {
          throw new Error("Missing roster id.");
        }
        renderLoading("Roster");
        await loadRosterBundle(rosterId);
        if (token === state.routeToken) {
          renderRosterPage();
        }
        return;
      }
      if (path === "/sheets" || path === "/sheets/") {
        renderLoading("HereticSheets");
        var sheetsHome = await fetchJson("/api/sheets/home");
        if (token === state.routeToken) {
          renderSheets(sheetsHome);
        }
        return;
      }
      if (path === "/sheets/core") {
        renderLoading("Core Rules");
        var core = await fetchJson("/api/sheets/core");
        if (token === state.routeToken) {
          renderCore(core);
        }
        return;
      }
      if (path === "/sheets/core/stratagems") {
        renderLoading("Core Stratagems");
        var coreStratagems = await fetchJson("/api/sheets/core/stratagems");
        if (token === state.routeToken) {
          renderStratagems(coreStratagems, "Core Stratagems");
        }
        return;
      }
      if (path === "/sheets/core/faq") {
        renderLoading("Core FAQ");
        var coreFaqs = await fetchJson("/api/sheets/core/faqs");
        if (token === state.routeToken) {
          renderFaqs(coreFaqs, "Core FAQ");
        }
        return;
      }
      if (path === "/sheets/rule-section") {
        renderLoading("Rule Section");
        var ruleSection = await fetchJson("/api/sheets/rule-section?id=" + enc(query.get("id")));
        if (token === state.routeToken) {
          renderRuleSection(ruleSection);
        }
        return;
      }
      if (path === "/sheets/rule-container") {
        renderLoading("Rule");
        var ruleContainer = await fetchJson("/api/sheets/rule-container?id=" + enc(query.get("id")));
        if (token === state.routeToken) {
          renderRuleContainer(ruleContainer);
        }
        return;
      }
      if (path === "/sheets/army-rules") {
        if (query.get("factionId")) {
          renderLoading("Army Rules");
          var armyRules = await fetchJson("/api/sheets/army-rules?factionId=" + enc(query.get("factionId")));
          if (token === state.routeToken) {
            renderArmyRules(armyRules);
          }
        } else {
          renderLoading("Army Rules");
          var factions = await fetchJson("/api/sheets/factions");
          if (token === state.routeToken) {
            renderFactions(factions);
          }
        }
        return;
      }
      if (path === "/sheets/faction") {
        renderLoading("Army");
        var faction = await fetchJson("/api/sheets/faction?id=" + enc(query.get("id")));
        if (token === state.routeToken) {
          renderFactionHub(faction);
        }
        return;
      }
      if (path === "/sheets/datasheets") {
        renderLoading("Datasheets");
        var datasheets = await fetchJson("/api/sheets/datasheets?factionId=" + enc(query.get("factionId")));
        if (token === state.routeToken) {
          renderDatasheets(datasheets);
        }
        return;
      }
      if (path === "/sheets/datasheet") {
        renderLoading("Datasheet");
        var datasheet = await fetchJson("/api/sheets/datasheet?id=" + enc(query.get("id")));
        if (token === state.routeToken) {
          renderDatasheetDetail(datasheet);
        }
        return;
      }
      if (path === "/sheets/detachments") {
        navigate("/sheets/formations" + window.location.search, true);
        return;
      }
      if (path === "/sheets/detachment") {
        navigate("/sheets/formation" + window.location.search, true);
        return;
      }
      if (path === "/sheets/formations") {
        renderLoading("Detachments");
        var detachments = await fetchJson("/api/sheets/forms?factionId=" + enc(query.get("factionId")));
        renderDetachments(detachments);
        return;
      }
      if (path === "/sheets/formation") {
        renderLoading("Detachment");
        var detachment = await fetchJson("/api/sheets/form?id=" + enc(query.get("id")));
        if (token === state.routeToken) {
          renderDetachmentDetail(detachment);
        }
        return;
      }
      if (path === "/sheets/stratagems") {
        renderLoading("Stratagems");
        var stratagems = await fetchJson("/api/sheets/stratagems?factionId=" + enc(query.get("factionId")));
        if (token === state.routeToken) {
          renderStratagems(stratagems);
        }
        return;
      }
      if (path === "/sheets/enhancements") {
        renderLoading("Enhancements");
        var enhancements = await fetchJson("/api/sheets/enhancements?factionId=" + enc(query.get("factionId")));
        if (token === state.routeToken) {
          renderEnhancements(enhancements);
        }
        return;
      }
      if (path === "/sheets/faq") {
        renderLoading("FAQ");
        var faqs = await fetchJson("/api/sheets/faqs?factionId=" + enc(query.get("factionId")));
        if (token === state.routeToken) {
          renderFaqs(faqs);
        }
        return;
      }
      renderNotFound();
    } catch (error) {
      state.pageError = error.message;
      if (path === "/builder/new") {
        renderNewRoster();
      } else if (path === "/builder/roster" && state.rosterData) {
        renderRosterPage();
      } else {
        app.innerHTML = shell("Error", '<fieldset><legend>Error</legend>Could not load page.</fieldset>');
      }
    }
  }

  function navigate(path, replace) {
    if (replace) {
      window.history.replaceState({}, "", path);
    } else {
      window.history.pushState({}, "", path);
    }
    route();
  }

  async function handleCreateRoster(form) {
    var button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    state.pageError = "";
    try {
      var payload = {
        name: form.elements.name.value.trim() || "New Roster",
        battleSizeId: form.elements.battleSizeId.value,
        factionKeywordId: form.elements.factionKeywordId.value,
        detachmentIds: []
      };
      var created = await fetchJson("/api/roster/create", {
        method: "POST",
        body: payload
      });
      navigate("/builder/roster?id=" + enc(created.id));
    } catch (error) {
      state.pageError = error.message;
      renderNewRoster();
    }
  }

  async function handleDetachments(form) {
    var button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    state.pageError = "";
    try {
      var ids = Array.prototype.slice.call(form.querySelectorAll('input[name="detachmentId"]:checked')).map(function (input) {
        return input.value;
      });
      await fetchJson("/api/roster/detachments", {
        method: "POST",
        body: {
          rosterId: state.rosterId || getRosterId(),
          detachmentIds: ids
        }
      });
      await loadRosterBundle(state.rosterId || getRosterId());
      renderRosterPage();
    } catch (error) {
      state.pageError = error.message;
      renderRosterPage();
    }
  }

  async function handleDatasheetSearch(form) {
    var button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    state.pageError = "";
    try {
      state.search = form.elements.q.value.trim();
      await loadDatasheets();
      renderRosterPage();
    } catch (error) {
      state.pageError = error.message;
      renderRosterPage();
    }
  }

  async function addUnit(button) {
    var datasheetId = button.getAttribute("data-datasheet-id");
    button.disabled = true;
    state.pageError = "";
    try {
      var added = await fetchJson("/api/unit/add", {
        method: "POST",
        body: {
          rosterId: state.rosterId || getRosterId(),
          datasheetId: datasheetId,
          allyType: "native"
        }
      });
      state.selectedUnitId = added.id || "";
      await loadRosterBundle(state.rosterId || getRosterId());
      renderRosterPage();
    } catch (error) {
      state.pageError = error.message;
      renderRosterPage();
    }
  }

  async function deleteUnit(button) {
    var unitId = button.getAttribute("data-unit-id");
    if (!window.confirm("Delete this unit?")) {
      return;
    }
    button.disabled = true;
    state.pageError = "";
    try {
      await fetchJson("/api/unit/delete", {
        method: "POST",
        body: {
          id: unitId
        }
      });
      if (state.selectedUnitId === unitId) {
        state.selectedUnitId = "";
      }
      await loadRosterBundle(state.rosterId || getRosterId());
      renderRosterPage();
    } catch (error) {
      state.pageError = error.message;
      renderRosterPage();
    }
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest("a[data-link]");
    if (link) {
      var url = new URL(link.href, window.location.origin);
      if (url.origin === window.location.origin) {
        event.preventDefault();
        navigate(url.pathname + url.search);
      }
      return;
    }

    var button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }
    var action = button.getAttribute("data-action");
    if (action === "add-unit") {
      addUnit(button);
    } else if (action === "delete-unit") {
      deleteUnit(button);
    } else if (action === "select-unit") {
      state.selectedUnitId = button.getAttribute("data-unit-id");
      renderRosterPage();
    } else if (action === "clear-search") {
      state.search = "";
      loadDatasheets().then(renderRosterPage).catch(function (error) {
        state.pageError = error.message;
        renderRosterPage();
      });
    }
  });

  document.addEventListener("submit", function (event) {
    var form = event.target.closest("form[data-form]");
    if (!form) {
      return;
    }
    event.preventDefault();
    var type = form.getAttribute("data-form");
    if (type === "create-roster") {
      handleCreateRoster(form);
    } else if (type === "detachments") {
      handleDetachments(form);
    } else if (type === "datasheet-search") {
      handleDatasheetSearch(form);
    }
  });

  window.addEventListener("popstate", route);
  route();
}());
