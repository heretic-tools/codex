from roster_builder_codex_common import (
    CORE_RULES_IMAGE,
    CORE_RULES_PUBLICATION_ID,
    core_rule_section_href,
    normalize_rule_section_code,
    render_codex_content_page,
    render_codex_page,
    render_list_item,
)
from roster_builder_codex_faq import (
    related_faqs_for_core_rule,
    render_faq_section,
    render_faq_update_sections,
)
from roster_builder_codex_rich_text import (
    core_rule_href,
    escape_html,
    normalize_rule_reference_code,
    normalize_rule_text,
    render_rich_text,
    render_rule_component,
)
from roster_builder_codex_rules import render_stratagem_card
from roster_builder_utils import dict_row

def render_core_rules_page():
    return render_codex_page(
        title="Core Rules",
        header_title="Core Rules",
        task_title="Core Rules",
        page_class="core-rules-page",
        grid_label="Core Rules sections",
        back_href="/codex",
        back_label="Back to Codex",
        buttons=[
            {"label": "Rules", "tag": "Reference", "route": "rules", "href": "/codex/core-rules/rules"},
            {"label": "Stratagems", "tag": "Tactics", "route": "stratagems", "href": "/codex/core-rules/stratagems"},
            {"label": "FAQ", "tag": "Updates", "route": "faq", "href": "/codex/core-rules/faq"},
        ],
        hero_image=CORE_RULES_IMAGE,
    )

def core_rule_sections(heretic_builder):
    with heretic_builder.connect(readonly=True) as conn:
        rows = conn.execute(
            """
            select rs.id, rs.name, rs.displayOrder,
                   count(rc.id) as containerCount
            from rule_section rs
            left join rule_container rc on rc.ruleSectionId = rs.id
            where rs.publicationId = ?
            group by rs.id
            order by rs.displayOrder, rs.name
            """,
            [CORE_RULES_PUBLICATION_ID],
        ).fetchall()
    return [dict_row(row) for row in rows]

def core_rule_section_by_code(heretic_builder, code):
    normalized = normalize_rule_section_code(code)
    if not normalized:
        raise ValueError("Rule section not found")
    with heretic_builder.connect(readonly=True) as conn:
        row = conn.execute(
            """
            select id, name, displayOrder
            from rule_section
            where publicationId = ?
              and name like ?
            order by displayOrder
            limit 1
            """,
            [CORE_RULES_PUBLICATION_ID, f"{normalized}.%"],
        ).fetchone()
    if not row:
        raise ValueError("Rule section not found")
    return dict_row(row)

def core_rule_containers_for_section(heretic_builder, section_id):
    with heretic_builder.connect(readonly=True) as conn:
        rows = conn.execute(
            """
            select rc.id, rc.title, rc.subtitle, rc.containerType, rc.displayOrder,
                   s.cpCost, s.category,
                   count(fc.faqId) as faqCount
            from rule_container rc
            left join stratagem s on s.id = rc.stratagemId
            left join faq_config fc on fc.ruleContainerId = rc.id
            where rc.ruleSectionId = ?
            group by rc.id
            order by rc.displayOrder, rc.subtitle, rc.title
            """,
            [section_id],
        ).fetchall()
    return [dict_row(row) for row in rows]

def core_stratagem_containers(heretic_builder):
    with heretic_builder.connect(readonly=True) as conn:
        rows = conn.execute(
            """
            select rc.id, rc.title, rc.subtitle, rc.containerType, rc.displayOrder,
                   s.cpCost, s.category,
                   count(fc.faqId) as faqCount
            from rule_container rc
            join rule_section rs on rs.id = rc.ruleSectionId
            left join stratagem s on s.id = rc.stratagemId
            left join faq_config fc on fc.ruleContainerId = rc.id
            where rs.publicationId = ?
              and rc.containerType = 'stratagem'
            group by rc.id
            order by rc.displayOrder, rc.subtitle, rc.title
            """,
            [CORE_RULES_PUBLICATION_ID],
        ).fetchall()
    return [dict_row(row) for row in rows]

def core_rule_faqs(heretic_builder):
    with heretic_builder.connect(readonly=True) as conn:
        rows = conn.execute(
            """
            select id, errataHeader, errataText, question, answer, displayOrder
            from faq
            where publicationId = ?
            order by displayOrder, id
            """,
            [CORE_RULES_PUBLICATION_ID],
        ).fetchall()
    return [dict_row(row) for row in rows]

def render_rule_container_item(container):
    meta = [container["subtitle"], container["containerType"].replace("behaviourType", "movement")]
    if container.get("cpCost"):
        meta.append(f'{container["cpCost"]} CP')
    if container.get("category"):
        meta.append(container["category"])
    if container.get("faqCount"):
        meta.append(f'{container["faqCount"]} FAQ')
    return render_list_item(
        container["title"],
        " / ".join(item for item in meta if item),
        href=core_rule_href(container["subtitle"]),
    )

def render_core_rules_rules_page(heretic_builder):
    sections = core_rule_sections(heretic_builder)
    items_html = "".join(
        render_list_item(
            section["name"],
            f'{section["containerCount"]} rules',
            href=core_rule_section_href(section),
        )
        for section in sections
    )
    content_html = f'<div class="list-grid core-rules-list-grid">{items_html}</div>'
    return render_codex_content_page(
        title="Core Rules",
        header_title="Rules",
        task_title="Core Rules / Rules",
        page_class="faction-detail-page core-rules-list-page",
        content_html=content_html,
        back_href="/codex/core-rules",
        back_label="Back to Core Rules",
        hero_image=CORE_RULES_IMAGE,
    )

def render_core_rules_section_page(heretic_builder, section_code):
    section = core_rule_section_by_code(heretic_builder, section_code)
    containers = core_rule_containers_for_section(heretic_builder, section["id"])

    intro_parts = []
    sub_containers = []
    for container in containers:
        if is_zero_subrule(container["subtitle"]):
            try:
                rule = core_rule_by_reference(heretic_builder, container["subtitle"])
                for component in rule["components"]:
                    part = render_rule_component(component, container["subtitle"])
                    if part:
                        intro_parts.append(part)
                faq_html = render_faq_update_sections(
                    rule.get("faqs") or [], errata_title="", faq_title="",
                )
                if faq_html:
                    intro_parts.append(faq_html)
            except ValueError:
                pass
        else:
            sub_containers.append(container)

    intro_html = (
        f'<article class="codex-content core-rule-content">{"".join(intro_parts)}</article>'
        if intro_parts else ""
    )
    items_html = "".join(render_rule_container_item(container) for container in sub_containers)
    grid_html = f'<div class="list-grid core-rules-list-grid">{items_html}</div>' if items_html else ""
    content_html = intro_html + grid_html

    return render_codex_content_page(
        title=section["name"],
        header_title=section["name"],
        task_title=f'Core Rules / {section["name"]}',
        page_class="faction-detail-page core-rules-list-page",
        content_html=content_html,
        back_href="/codex/core-rules/rules",
        back_label="Back to Core Rules",
        hero_image=CORE_RULES_IMAGE,
    )

def render_core_stratagems_page(heretic_builder):
    stratagems = core_stratagem_containers(heretic_builder)
    items_html = "".join(render_rule_container_item(stratagem) for stratagem in stratagems)
    content_html = f'<div class="list-grid core-rules-list-grid">{items_html}</div>'
    return render_codex_content_page(
        title="Core Stratagems",
        header_title="Core Stratagems",
        task_title="Core Rules / Stratagems",
        page_class="faction-detail-page core-rules-list-page",
        content_html=content_html,
        back_href="/codex/core-rules",
        back_label="Back to Core Rules",
        hero_image=CORE_RULES_IMAGE,
    )

def render_core_faq_page(heretic_builder):
    faqs = core_rule_faqs(heretic_builder)
    content_html = render_faq_section("FAQ", faqs) or '<div class="empty-state">No FAQ found.</div>'
    return render_codex_content_page(
        title="Core Rules FAQ",
        header_title="Core Rules\nFAQ",
        task_title="Core Rules / FAQ",
        page_class="faction-detail-page core-rules-faq-page",
        content_html=content_html,
        back_href="/codex/core-rules",
        back_label="Back to Core Rules",
        hero_image=CORE_RULES_IMAGE,
    )

def core_rule_by_reference(heretic_builder, reference):
    normalized = normalize_rule_reference_code(reference)
    if not normalized:
        raise ValueError("Rule reference not found")
    with heretic_builder.connect(readonly=True) as conn:
        rule = conn.execute(
            """
            select rc.id, rc.title, rc.subtitle, rc.containerType, rc.behaviourTypeId, rc.stratagemId
                   , rs.name as sectionName
            from rule_container rc
            join rule_section rs on rs.id = rc.ruleSectionId
            where rc.subtitle = ?
              and rs.publicationId = ?
            """,
            [normalized, CORE_RULES_PUBLICATION_ID],
        ).fetchone()
        if not rule:
            raise ValueError("Rule reference not found")
        result = dict_row(rule)
        result["components"] = [
            dict_row(row)
            for row in conn.execute(
                """
                select type, title, textContent, trigger, effect, imageUrl, altText, displayOrder
                from rule_container_component
                where ruleContainerId = ?
                order by displayOrder
                """,
                [result["id"]],
            )
        ]
        result["behaviourType"] = None
        result["stratagem"] = None
        result["faqs"] = related_faqs_for_core_rule(conn, result["id"], normalized)
        if result.get("stratagemId"):
            stratagem = conn.execute(
                """
                select id, name, lore, whenRules, targetRules, effectRules, restrictionRules,
                       cpCost, category, secondaryEffectAdditionalCPCost,
                       secondaryEffectIsMutuallyExclusive, secondaryEffect
                from stratagem
                where id = ?
                """,
                [result["stratagemId"]],
            ).fetchone()
            if stratagem:
                result["stratagem"] = dict_row(stratagem)
        if result.get("behaviourTypeId"):
            behaviour = conn.execute(
                """
                select *
                from behaviour_type
                where id = ?
                """,
                [result["behaviourTypeId"]],
            ).fetchone()
            if behaviour:
                result["behaviourType"] = dict_row(behaviour)
    return result

def render_behaviour_type(behaviour, current_rule_reference=None):
    fields = (
        ("eligibleIf", "Eligible If"),
        ("effect", "Effect"),
        ("maximumDistance", "Maximum Distance"),
        ("setupDistance", "Set-up Distance"),
        ("beforeMoving", "Before Moving"),
        ("whileMoving", "While Moving"),
        ("afterMoving", "After Moving"),
        ("beforeFighting", "Before Fighting"),
        ("whileFighting", "While Fighting"),
        ("afterFighting", "After Fighting"),
        ("beforeShooting", "Before Shooting"),
        ("whileShooting", "While Shooting"),
        ("afterShooting", "After Shooting"),
    )
    cards = []
    for key, label in fields:
        value = behaviour.get(key)
        if not normalize_rule_text(value):
            continue
        cards.append(
            f'<section class="rule-card core-rule-field-card">'
            f'<h3>{escape_html(label)}</h3>'
            f'{render_rich_text(value, current_rule_reference)}'
            f'</section>'
        )
    return "".join(cards)

def is_zero_subrule(subtitle):
    """True for subtitles like '19.00' — the intro/overview entry for a major rule."""
    parts = str(subtitle or "").split(".")
    return len(parts) == 2 and parts[1] == "00"

def display_subtitle(subtitle):
    """For '19.00' returns '19', for '19.01' returns '19.01'."""
    if is_zero_subrule(subtitle):
        return str(int(subtitle.split(".")[0]))
    return subtitle

def render_core_rule_page(heretic_builder, reference):
    rule = core_rule_by_reference(heretic_builder, reference)
    current_rule_reference = rule["subtitle"]
    disp = display_subtitle(rule["subtitle"])
    heading = f'{disp} {rule["title"]}' if disp else rule["title"]
    section_code = normalize_rule_reference_code(rule["subtitle"]).split(".")[0]
    section_href = f"/codex/core-rules/section/{section_code}"
    breadcrumb_items = [
        {"label": "HereticTools", "href": "/"},
        {"label": "Codex", "href": "/codex"},
        {"label": "Core Rules", "href": "/codex/core-rules"},
        {"label": "Rules", "href": "/codex/core-rules/rules"},
        {"label": rule["sectionName"], "href": section_href},
    ]
    # The rule number + title are already in the page header, so no heading card here.
    sections = []
    sections.extend(render_rule_component(component, current_rule_reference) for component in rule["components"])
    if rule.get("stratagem"):
        sections.append(render_stratagem_card(rule["stratagem"], current_rule_reference))
    if rule.get("behaviourType"):
        sections.append(render_behaviour_type(rule["behaviourType"], current_rule_reference))
    faq_html = render_faq_update_sections(
        rule.get("faqs") or [],
        errata_title="",
        faq_title="",
        current_rule_reference=current_rule_reference,
    )
    if faq_html:
        sections.append(faq_html)
    if not [section for section in sections if section]:
        sections.append('<section class="rule-card"><p>No rule text found.</p></section>')
    content_html = '<article class="codex-content core-rule-content">' + "".join(section for section in sections if section) + "</article>"
    return render_codex_content_page(
        title=heading,
        header_title=heading,
        task_title=f"Core Rules / {heading}",
        page_class="core-rule-page",
        content_html=content_html,
        back_href=section_href,
        back_label=f'Back to {rule["sectionName"]}',
        breadcrumb_items=breadcrumb_items,
        hero_image=CORE_RULES_IMAGE,
    )
