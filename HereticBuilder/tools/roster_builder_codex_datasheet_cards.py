from roster_builder_codex import (
    escape_attr,
    escape_html,
    normalize_rule_text,
    render_rich_text,
)
from roster_builder_templates import render_template

def is_empty_rule(value):
    return normalize_rule_text(value) in {"", "-"}

def class_names(*groups):
    result = []
    seen = set()
    for group in groups:
        if not group:
            continue
        items = group if isinstance(group, (list, tuple)) else str(group).split()
        for item in items:
            if item and item not in seen:
                result.append(item)
                seen.add(item)
    return result

def info_card_key(title):
    return normalize_rule_text(title).lower()

def merge_info_cards(cards):
    merged = []
    by_key = {}
    for card in cards:
        if not card:
            continue
        key = info_card_key(card["title"])
        existing = by_key.get(key)
        if existing is None:
            existing = {
                "title": card["title"],
                "classes": list(card["classes"]),
                "tags": list(card.get("tags") or []),
                "bodyParts": list(card.get("bodyParts") or []),
            }
            by_key[key] = existing
            merged.append(existing)
            continue
        existing["classes"] = class_names(existing["classes"], card["classes"])
        for tag in card.get("tags") or []:
            if tag not in existing["tags"]:
                existing["tags"].append(tag)
        existing["bodyParts"].extend(card.get("bodyParts") or [])
    return merged

def render_info_card(card):
    tag_html = "".join(
        render_template("codex_unit_ability_tag.html", label=escape_html(tag))
        for tag in card.get("tags") or []
    )
    if tag_html:
        heading_html = (
            '<div class="unit-card-heading">'
            f'<h3>{escape_html(card["title"])}</h3>{tag_html}'
            '</div>'
        )
    else:
        heading_html = f'<h3>{escape_html(card["title"])}</h3>'
    return (
        f'<section class="{escape_attr(" ".join(card["classes"]))}">'
        f'{heading_html}'
        f'{"".join(card.get("bodyParts") or [])}'
        '</section>'
    )

def text_info_card(title, text, class_name=""):
    if is_empty_rule(text):
        return None
    return {
        "title": title,
        "classes": class_names("rule-card", class_name),
        "tags": [],
        "bodyParts": [render_rich_text(text)],
    }

def render_datasheet_lore(text):
    if is_empty_rule(text):
        return ""
    return render_template(
        "codex_unit_lore.html",
        body_html=render_rich_text(text),
    )

def ability_info_card(ability):
    tags = []
    if ability.get("abilityType"):
        tags.append(ability["abilityType"].title())
    if ability.get("isPsychic"):
        tags.append("Psychic")
    if ability.get("isAura"):
        tags.append("Aura")
    if ability.get("isBondsman"):
        tags.append("Bondsman")
    tag_labels = [" / ".join(tags)] if tags else []

    restriction_html = ""
    if ability.get("restriction"):
        restriction_html = render_template("codex_unit_restriction.html", text=escape_html(ability["restriction"]))

    body_parts = []
    if not is_empty_rule(ability.get("rules")):
        body_parts.append(render_rich_text(ability["rules"]))
    if not is_empty_rule(ability.get("lore")):
        body_parts.append(
            f'<div class="unit-ability-lore lore-flavor-card">{render_rich_text(ability["lore"])}</div>'
        )

    sub_abilities = []
    if ability.get("subAbilities"):
        if ability.get("subAbilityHeader"):
            sub_abilities.append(render_template(
                "codex_unit_sub_ability_header.html",
                title=escape_html(ability["subAbilityHeader"]),
            ))
        for sub_ability in ability["subAbilities"]:
            sub_abilities.append(render_template(
                "codex_unit_sub_ability.html",
                sub_ability_name=escape_html(sub_ability["name"]),
                rules_html=render_rich_text(sub_ability["rules"]),
            ))
    return {
        "title": ability["name"],
        "classes": class_names("rule-card unit-info-card unit-ability-card"),
        "tags": tag_labels,
        "bodyParts": [restriction_html, *body_parts, "".join(sub_abilities)],
    }

def render_invulnerable_saves(saves):
    if not saves:
        return ""
    rows = []
    for save in saves:
        values = []
        if save.get("save"):
            values.append(save["save"])
        if save.get("meleeSave"):
            values.append(f'Melee {save["meleeSave"]}')
        if save.get("rangedSave"):
            values.append(f'Ranged {save["rangedSave"]}')
        label = ", ".join(values) if values else "Invulnerable Save"
        if save.get("miniatureName"):
            label = f'{save["miniatureName"]}: {label}'
        rows.append(render_template(
            "codex_unit_invulnerable_save.html",
            label=escape_html(label),
            rules_html=render_rich_text(save["rules"]) if not is_empty_rule(save.get("rules")) else "",
        ))
    return render_template(
        "codex_unit_invulnerable_saves.html",
        saves_html="".join(rows),
    )

def render_unit_keywords(keywords):
    if not keywords:
        return ""
    return render_template(
        "codex_unit_keywords.html",
        keywords=escape_html(", ".join(keywords)),
    )

def is_faction_ability(ability):
    return str(ability.get("abilityType") or "").lower() == "faction"

def render_unit_keyword_tags(keywords, faction_abilities=None):
    faction_abilities = faction_abilities or []
    if not keywords and not faction_abilities:
        return ""
    keyword_tags_html = "".join(
        render_template(
            "codex_unit_keyword_tag.html",
            label=escape_html(keyword),
        )
        for keyword in keywords
    )
    faction_tags_html = "".join(
        f'<span class="unit-keyword-tag unit-faction-ability-tag">{escape_html(ability["name"])}</span>'
        for ability in faction_abilities
    )
    return render_template(
        "codex_unit_keyword_tags.html",
        tags_html=f"{keyword_tags_html}{faction_tags_html}",
    )
