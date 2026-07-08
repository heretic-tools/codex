import re

from roster_builder_codex_common import (
    detachment_href,
    faction_href,
    render_codex_content_page,
    render_list_item,
    render_meta_badge,
)
from roster_builder_codex_factions import faction_by_id, faction_hero_image, rule_components_for
from roster_builder_codex_faq import attach_faqs, faqs_for_entity, render_faq_update_sections
from roster_builder_codex_rich_text import escape_attr, escape_html, normalize_rule_text, render_rich_text
from roster_builder_codex_rules import (
    render_lore_block,
    render_rule_article,
    render_section_title,
    render_stratagem_card,
)
from roster_builder_routes import resolve_entity_ref, scoped_slug_map
from roster_builder_utils import dict_row

def detachment_meta_items(detachment):
    meta = []
    if detachment.get("detachmentPointsCost") is not None:
        meta.append(f'{detachment["detachmentPointsCost"]} DP')
    if detachment.get("isCombatPatrol"):
        meta.append("Combat Patrol")
    return meta

def detachment_meta(detachment):
    meta = detachment_meta_items(detachment)
    return " / ".join(meta)

def disposition_slug(name):
    return re.sub(r"[^a-z0-9]+", "-", (name or "").lower()).strip("-")

def render_disposition_badge(name):
    if not name:
        return ""
    slug = disposition_slug(name)
    classes = "disposition-badge"
    if slug:
        classes += f" disposition-{slug}"
    return f'<span class="{escape_attr(classes)}">{escape_html(name)}</span>'

def detachment_badges_html(detachment):
    badges = [render_meta_badge(item) for item in detachment_meta_items(detachment)]
    badges.append(render_disposition_badge(detachment.get("forceDisposition")))
    badges_html = "".join(badge for badge in badges if badge)
    return f'<div class="detachment-badge-row">{badges_html}</div>' if badges_html else ""

def detachment_by_id_for_faction(heretic_builder, faction_id, detachment_id):
    with heretic_builder.connect(readonly=True) as conn:
        rows = conn.execute(
            """
            select d.id, d.name, d.bannerImage, d.rowImage, d.isCombatPatrol,
                   coalesce(dfdpc.detachmentPointsCost, d.detachmentPointsCost) as detachmentPointsCost,
                   fd.name as forceDisposition
            from detachment d
            join detachment_faction_keyword dfk
              on dfk.detachmentId = d.id
             and dfk.factionKeywordId = ?
            left join detachment_faction_detachment_points_cost dfdpc
              on dfdpc.detachmentId = d.id
             and dfdpc.factionKeywordId = ?
            left join detachment_force_disposition dfd
              on dfd.detachmentId = d.id
            left join force_disposition fd
              on fd.id = dfd.forceDispositionId
            where d.isCombatPatrol = 0
            order by d.displayOrder, lower(d.name), d.id
            """,
            [faction_id, faction_id],
        ).fetchall()
    resolved_id = resolve_entity_ref(rows, detachment_id)
    row = next((item for item in rows if item["id"] == resolved_id), None)
    if not row:
        raise ValueError("Detachment not found")
    return dict_row(row)

def detachment_slug_map_for_faction(heretic_builder, faction_id):
    detachments = heretic_builder.detachments(faction_id).get("detachments", [])
    return scoped_slug_map(detachments)

def detachment_rules_for(heretic_builder, detachment_id):
    with heretic_builder.connect(readonly=True) as conn:
        rules = [
            dict_row(row)
            for row in conn.execute(
                """
                select id, name
                from detachment_rule
                where detachmentId = ?
                  and hiddenFromCommandBunker = 0
                order by displayOrder, lower(name)
                """,
                [detachment_id],
            )
        ]
        for rule in rules:
            rule["components"] = rule_components_for(conn, "detachmentRuleId", rule["id"])
    return rules

def detachment_details_for(heretic_builder, detachment_id):
    with heretic_builder.connect(readonly=True) as conn:
        details = [
            dict_row(row)
            for row in conn.execute(
                """
                select id, title
                from detachment_detail
                where detachmentId = ?
                order by displayOrder, lower(title)
                """,
                [detachment_id],
            )
        ]
        for detail in details:
            detail["bulletPoints"] = [
                dict_row(row)
                for row in conn.execute(
                    """
                    select text
                    from detachment_detail_bullet_point
                    where detachmentDetailId = ?
                    order by displayOrder
                    """,
                    [detail["id"]],
                )
            ]
    return details

def detachment_enhancements_for(heretic_builder, detachment_id):
    with heretic_builder.connect(readonly=True) as conn:
        rows = conn.execute(
            """
            select id, name, rules, lore, basePointsCost, enhancementType
            from enhancement
            where detachmentId = ?
            order by displayOrder, lower(name)
            """,
            [detachment_id],
        ).fetchall()
    return [dict_row(row) for row in rows]

def detachment_stratagems_for(heretic_builder, detachment_id):
    with heretic_builder.connect(readonly=True) as conn:
        rows = conn.execute(
            """
            select id, name, lore, whenRules, targetRules, effectRules, restrictionRules,
                   cpCost, category, secondaryEffectAdditionalCPCost,
                   secondaryEffectIsMutuallyExclusive, secondaryEffect
            from stratagem
            where detachmentId = ?
            order by displayOrder, lower(name)
            """,
            [detachment_id],
        ).fetchall()
    return [dict_row(row) for row in rows]

def render_detachment_details(details):
    if not details:
        return ""
    cards = []
    for detail in details:
        bullet_html = "".join(
            f'<li>{render_rich_text(point["text"])}</li>'
            for point in detail["bulletPoints"]
        )
        if not bullet_html:
            continue
        cards.append(
            '<section class="rule-card detachment-detail-card">'
            f'<h3>{escape_html(detail["title"])}</h3>'
            f'<ul class="detachment-bullet-list">{bullet_html}</ul>'
            '</section>'
        )
    if not cards:
        return ""
    return render_section_title("Details") + '<div class="detachment-card-grid">' + "".join(cards) + "</div>"

def render_enhancement_card(enhancement):
    tags = []
    if enhancement.get("basePointsCost") is not None:
        tags.append(f'{enhancement["basePointsCost"]} pts')
    if enhancement.get("enhancementType"):
        tags.append(enhancement["enhancementType"].title())
    tag_html = "".join(f'<span class="unit-card-tag">{escape_html(tag)}</span>' for tag in tags)
    lore_html = render_lore_block(enhancement["lore"]) if enhancement.get("lore") else ""
    lore_class = " has-lore" if lore_html else ""
    return (
        f'<section class="rule-card detachment-feature-card{lore_class}">'
        '<div class="unit-card-heading">'
        f'<h3>{escape_html(enhancement["name"])}</h3>'
        f'<div class="detachment-tag-row">{tag_html}</div>'
        '</div>'
        f'{render_rich_text(enhancement["rules"])}'
        f'{lore_html}'
        '</section>'
    )

def render_detachment_enhancements(enhancements):
    if not enhancements:
        return ""
    cards = "".join(render_enhancement_card(enhancement) for enhancement in enhancements)
    return render_section_title("Enhancements") + '<div class="detachment-card-grid">' + cards + "</div>"

def render_detachment_stratagems(stratagems):
    if not stratagems:
        return ""
    cards = "".join(render_stratagem_card(stratagem) for stratagem in stratagems)
    return render_section_title("Stratagems") + '<div class="detachment-card-grid stratagem-grid">' + cards + "</div>"

def render_detachment_summary_card(detachment):
    # The detachment name is already shown in the page header, so this card holds
    # only the DP / disposition badges (omitted entirely when there are none).
    tags = detachment_meta_items(detachment)
    tag_html = "".join(render_meta_badge(tag) for tag in tags)
    tag_html += render_disposition_badge(detachment.get("forceDisposition"))
    if not tag_html:
        return ""
    return (
        '<section class="rule-card detachment-detail-card detachment-summary-card">'
        f'<div class="detachment-tag-row">{tag_html}</div>'
        '</section>'
    )

def render_faction_detachment_page(heretic_builder, faction_id, detachment_id):
    faction = faction_by_id(heretic_builder, faction_id)
    detachment = detachment_by_id_for_faction(heretic_builder, faction["id"], detachment_id)
    rules = detachment_rules_for(heretic_builder, detachment["id"])
    details = detachment_details_for(heretic_builder, detachment["id"])
    enhancements = detachment_enhancements_for(heretic_builder, detachment["id"])
    stratagems = detachment_stratagems_for(heretic_builder, detachment["id"])
    attach_faqs(heretic_builder, enhancements, "enhancementId")
    attach_faqs(heretic_builder, stratagems, "stratagemId")

    sections = [render_detachment_summary_card(detachment)]
    sections.extend(render_rule_article(rule["name"], rule["components"]) for rule in rules)
    sections.append(render_detachment_details(details))
    sections.append(render_detachment_enhancements(enhancements))
    sections.append(render_detachment_stratagems(stratagems))
    sections.append(render_faq_update_sections(
        faqs_for_entity(heretic_builder, "detachmentId", detachment["id"]),
        errata_title="Detachment Errata",
        faq_title="Detachment FAQ",
    ))
    sections.extend(
        render_faq_update_sections(
            enhancement.get("faqs") or [],
            errata_title=f'{enhancement["name"]} Errata',
            faq_title=f'{enhancement["name"]} FAQ',
        )
        for enhancement in enhancements
    )
    sections.extend(
        render_faq_update_sections(
            stratagem.get("faqs") or [],
            errata_title=f'{stratagem["name"]} Errata',
            faq_title=f'{stratagem["name"]} FAQ',
        )
        for stratagem in stratagems
    )
    content_html = '<div class="codex-content detachment-detail-content">' + "".join(section for section in sections if section) + "</div>"
    return render_codex_content_page(
        title=f"{detachment['name']} Detachment",
        header_title=f"{detachment['name']}\nDetachment",
        task_title=f"{faction['name']} / {detachment['name']}",
        page_class="faction-detail-page detachment-detail-page",
        content_html=content_html,
        back_href=f"{faction_href(faction)}/detachments",
        back_label=f"Back to {faction['name']} Detachments",
        hero_image=faction_hero_image(faction),
    )

def render_faction_detachments_page(heretic_builder, faction_id):
    faction = faction_by_id(heretic_builder, faction_id)
    detachments = heretic_builder.detachments(faction["id"]).get("detachments", [])
    if detachments:
        slug_by_id = scoped_slug_map(detachments)
        items_html = "".join(
            render_list_item(
                detachment["name"],
                "",
                href=detachment_href(faction, detachment, slug_by_id[detachment["id"]]),
                badge_html=detachment_badges_html(detachment),
            )
            for detachment in detachments
        )
        content_html = f'<div class="list-grid">{items_html}</div>'
    else:
        content_html = '<div class="empty-state">No detachments found.</div>'
    return render_codex_content_page(
        title=f"{faction['name']} Detachments",
        header_title=f"{faction['name']}\nDetachments",
        task_title=f"{faction['name']} / Detachments",
        page_class="faction-detail-page many-buttons-page",
        content_html=content_html,
        back_href=faction_href(faction),
        back_label=f"Back to {faction['name']}",
        hero_image=faction_hero_image(faction),
    )
