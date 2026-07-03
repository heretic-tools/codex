import re

from roster_builder_codex import (
    datasheet_id_for_faction,
    escape_attr,
    escape_html,
    faction_by_id,
    faction_href,
    faqs_for_entity,
    find_unit_image,
    has_faq,
    normalize_rule_text,
    render_codex_content_page,
    render_faq_card,
    render_rich_text,
    unit_image_url,
)
from roster_builder_templates import render_template
from roster_builder_codex_datasheet_data import datasheet_detail
from roster_builder_codex_datasheet_cards import (
    ability_info_card,
    is_faction_ability,
    merge_info_cards,
    render_datasheet_lore,
    render_info_card,
    render_unit_keyword_tags,
    text_info_card,
)


def profile_display_name(profile):
    item_name = profile["itemName"]
    profile_name = profile["profileName"]
    if profile_name.lower() == item_name.lower():
        return item_name
    return f"{item_name} - {profile_name}"


def format_points(value, signed=False):
    value = int(value or 0)
    if signed and value > 0:
        return f"+{value} pts"
    return f"{value} pts"


def ordinal(value):
    value = int(value)
    if 10 <= value % 100 <= 20:
        suffix = "th"
    else:
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(value % 10, "th")
    return f"{value}{suffix}"


def base_size_entries(value):
    text = str(value or "").strip()
    if not text or text == "-":
        return []
    entries = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if ":" in line:
            label, base_size = line.split(":", 1)
            entries.append((label.strip(), base_size.strip()))
            continue
        for base_size in re.split(r"\s*[,;]\s*", line):
            base_size = base_size.strip()
            if base_size:
                entries.append(("Base", base_size))
    return entries


def weapon_ability_tags(abilities):
    text = normalize_rule_text(abilities)
    if text in {"", "-"}:
        return ""
    tags = [tag.strip() for tag in re.split(r",|\n", text) if tag.strip()]
    return "".join(
        render_template(
            "codex_unit_weapon_ability_tag.html",
            label=escape_html(tag),
        )
        for tag in tags
    )


def weapon_bucket(profile):
    return "melee" if str(profile.get("type") or "").lower() == "melee" else "ranged"


def weapon_profile_skill(profile):
    if weapon_bucket(profile) == "melee":
        return profile.get("weaponSkill") or "-"
    return profile.get("ballisticSkill") or "-"


def weapon_profile_key(profile):
    return (
        profile_display_name(profile).lower(),
        str(profile.get("type") or "").lower(),
        str(profile.get("range") or ""),
        str(profile.get("attacks") or ""),
        str(weapon_profile_skill(profile)),
        str(profile.get("strength") or ""),
        str(profile.get("armourPenetration") or ""),
        str(profile.get("damage") or ""),
        str(profile.get("abilities") or "-").lower(),
    )


def render_unit_meta_item(label, value):
    if value in (None, ""):
        return ""
    return render_template(
        "codex_unit_meta_item.html",
        label=escape_html(label),
        value=escape_html(value),
    )


def format_invulnerable_save_value(value):
    text = normalize_rule_text(value)
    if text in {"", "-"}:
        return ""
    if text.endswith("++"):
        return text
    if text.endswith("+"):
        return f"{text}+"
    return text


def compact_invulnerable_save(save):
    base_save = format_invulnerable_save_value(save.get("save"))
    rules_text = normalize_rule_text(save.get("rules")).lower()
    if base_save and "ranged attacks only" in rules_text:
        return f"R{base_save}"
    if base_save and "melee attacks only" in rules_text:
        return f"M{base_save}"
    if base_save:
        return base_save

    parts = []
    melee_save = format_invulnerable_save_value(save.get("meleeSave"))
    ranged_save = format_invulnerable_save_value(save.get("rangedSave"))
    if melee_save:
        parts.append(f"M{melee_save}")
    if ranged_save:
        parts.append(f"R{ranged_save}")
    return "/".join(parts)


def invulnerable_save_title(save):
    details = []
    if save.get("miniatureName"):
        details.append(save["miniatureName"])
    rules = normalize_rule_text(save.get("rules"))
    if rules not in {"", "-"}:
        details.append(rules)
    return ": ".join(details)


def render_invulnerable_save_cell(save):
    value = compact_invulnerable_save(save) if save else "-"
    title = invulnerable_save_title(save) if save else ""
    title_attr = ""
    if title:
        label = f"Invulnerable save {value}: {title}"
        title_attr = f' title="{escape_attr(title)}" aria-label="{escape_attr(label)}"'
    return f'          <td class="unit-invulnerable-save-cell" data-label="INV"{title_attr}>{escape_html(value)}</td>\n'


def render_statline_table(miniatures, invulnerable_saves=None):
    if not miniatures:
        return ""
    invulnerable_saves = invulnerable_saves or []
    global_invulnerable_save = next((save for save in invulnerable_saves if not save.get("miniatureId")), None)
    invulnerable_saves_by_miniature = {
        save["miniatureId"]: save
        for save in invulnerable_saves
        if save.get("miniatureId")
    }

    # Group models by identical statline (including invulnerable save) so each
    # unique statline renders one full-width table; every model that shares it is
    # listed by name in that table's heading. Models hidden via statlineHidden are
    # duplicates of a shown statline and merge naturally into the same group.
    groups = []
    group_index = {}
    for miniature in miniatures:
        invulnerable_save = invulnerable_saves_by_miniature.get(miniature["id"], global_invulnerable_save)
        invulnerable_value = compact_invulnerable_save(invulnerable_save) if invulnerable_save else ""
        key = (
            miniature["movement"],
            miniature["toughness"],
            miniature["save"],
            miniature["wounds"],
            miniature["leadership"],
            miniature["objectiveControl"],
            invulnerable_value,
        )
        index = group_index.get(key)
        if index is None:
            group_index[key] = len(groups)
            groups.append({
                "names": [miniature["name"]],
                "movement": miniature["movement"],
                "toughness": miniature["toughness"],
                "save": miniature["save"],
                "wounds": miniature["wounds"],
                "leadership": miniature["leadership"],
                "objectiveControl": miniature["objectiveControl"],
                "invulnerable": invulnerable_value,
            })
        else:
            groups[index]["names"].append(miniature["name"])

    if not groups:
        return ""

    show_names = len(groups) > 1 or len(groups[0]["names"]) > 1

    blocks = []
    for group in groups:
        invulnerable_header_html = ""
        invulnerable_cell_html = ""
        if group["invulnerable"]:
            invulnerable_header_html = '          <th class="unit-invulnerable-save-cell" scope="col">INV</th>\n'
            invulnerable_cell_html = (
                f'          <td class="unit-invulnerable-save-cell" data-label="INV">'
                f'{escape_html(group["invulnerable"])}</td>\n'
            )
        name_html = ""
        if show_names:
            name_html = render_template(
                "codex_unit_statline_group_name.html",
                names="<br>".join(escape_html(name) for name in group["names"]),
            )
        blocks.append(render_template(
            "codex_unit_statline_group.html",
            name_html=name_html,
            invulnerable_header_html=invulnerable_header_html,
            invulnerable_cell_html=invulnerable_cell_html,
            movement=escape_html(group["movement"]),
            toughness=escape_html(group["toughness"]),
            save=escape_html(group["save"]),
            wounds=escape_html(group["wounds"]),
            leadership=escape_html(group["leadership"]),
            objective_control=escape_html(group["objectiveControl"]),
        ))

    return render_template(
        "codex_unit_statline.html",
        groups_html="".join(blocks),
    )


def render_base_sizes(base_size):
    entries = base_size_entries(base_size)
    if not entries:
        return ""
    items_html = "".join(
        render_template(
            "codex_unit_base_size.html",
            label="<br>".join(escape_html(part) for part in label.split(", ")),
            value=escape_html(value),
        )
        for label, value in entries
    )
    return render_template(
        "codex_unit_base_sizes.html",
        items_html=items_html,
    )


def composition_label_html(label):
    # Stack each model in the composition ("1 A + 1 B + ...") on its own line.
    parts = [part.strip() for part in str(label or "").split("+")]
    return "<br>".join(escape_html(part) for part in parts if part)


def render_points_section(point_options, points_steps, paid_wargear):
    if not point_options and not points_steps and not paid_wargear:
        return ""
    rows = []
    for option in point_options:
        rows.append(render_template(
            "codex_unit_points_row.html",
            label=composition_label_html(option["label"]),
            value=escape_html(format_points(option["points"])),
            tag_html=render_template("codex_unit_points_tag.html", label="models"),
        ))
    for step in points_steps:
        rows.append(render_template(
            "codex_unit_points_row.html",
            label=escape_html(f'{ordinal(step["stepAt"])} copy and later'),
            value=escape_html(format_points(step["stepPoints"], signed=True)),
            tag_html=render_template("codex_unit_points_tag.html", label="repeat"),
        ))
    for item in paid_wargear:
        rows.append(render_template(
            "codex_unit_points_row.html",
            label=escape_html(item["itemName"]),
            value=escape_html(format_points(item["points"], signed=True)),
            tag_html=render_template("codex_unit_points_tag.html", label="wargear"),
        ))
    return render_template(
        "codex_unit_points.html",
        rows_html="".join(rows),
    )


def render_reference_stack(*sections):
    sections_html = "".join(section for section in sections if section)
    if not sections_html:
        return ""
    return render_template(
        "codex_unit_reference_stack.html",
        sections_html=sections_html,
    )


def render_weapon_profiles_table(groups):
    weapon_groups = [group for group in groups if group.get("profiles")]
    if not weapon_groups:
        return ""
    profile_names_by_item = {}
    for group in weapon_groups:
        for profile in group["profiles"]:
            profile_names_by_item.setdefault(profile["itemName"].lower(), set()).add(profile["profileName"].lower())
    multi_profile_items = {
        item_name
        for item_name, profile_names in profile_names_by_item.items()
        if len(profile_names) > 1
    }

    profiles = {"ranged": [], "melee": []}
    seen = set()
    for group in weapon_groups:
        for profile in group["profiles"]:
            profile_key = weapon_profile_key(profile)
            if profile_key in seen:
                continue
            seen.add(profile_key)
            profiles[weapon_bucket(profile)].append({
                "profile": profile,
                "skill": weapon_profile_skill(profile),
                "abilities": profile.get("abilities") or "-",
                "hasModes": profile["itemName"].lower() in multi_profile_items,
            })

    group_html = []
    for bucket, title, skill_label in (("ranged", "Ranged Weapons", "BS"), ("melee", "Melee Weapons", "WS")):
        rows = []
        for item in profiles[bucket]:
            profile = item["profile"]
            rows.append(render_template(
                "codex_unit_weapon_row.html",
                row_class="unit-weapon-row",
                profile_name=escape_html(profile_display_name(profile)),
                mode_marker_html=render_template("codex_unit_weapon_mode_marker.html") if item["hasModes"] else "",
                ability_tags_html=weapon_ability_tags(item["abilities"]),
                range_html=(
                    '<span class="desktop-label">Melee</span><span class="mobile-label">М</span>'
                    if profile["range"] == "Melee"
                    else escape_html(profile["range"])
                ),
                attacks=escape_html(profile["attacks"]),
                skill=escape_html(item["skill"]),
                strength=escape_html(profile["strength"]),
                armour_penetration=escape_html(profile["armourPenetration"]),
                damage=escape_html(profile["damage"]),
                skill_label=skill_label,
            ))
        if rows:
            group_html.append(render_template(
                "codex_unit_weapon_group.html",
                title=escape_html(title),
                skill_label=skill_label,
                rows_html="".join(rows),
            ))
    return render_template(
        "codex_unit_weapons.html",
        groups_html="".join(group_html),
    )


def render_wargear_rules_section(rules):
    if not rules:
        return ""
    rule_html = "".join(
        render_template(
            "codex_unit_wargear_rule.html",
            rules_text=escape_html(rule),
        )
        for rule in rules
    )
    return render_template(
        "codex_unit_wargear_rules.html",
        rules_html=rule_html,
    )


def render_datasheet_page(heretic_builder, faction_id, datasheet_id):
    faction = faction_by_id(heretic_builder, faction_id)
    datasheet_id = datasheet_id_for_faction(heretic_builder, faction["id"], datasheet_id)
    detail = datasheet_detail(heretic_builder, faction["id"], datasheet_id)
    datasheet = detail["datasheet"]
    image = find_unit_image(datasheet["name"], datasheet["id"])
    points_html = render_points_section(
        detail["pointOptions"],
        detail["pointsSteps"],
        detail["paidWargear"],
    )
    base_sizes_html = render_base_sizes(datasheet.get("baseSize"))
    statline_html = render_statline_table(detail["miniatures"], detail["invulnerableSaves"])
    weapons_html = render_weapon_profiles_table(detail["wargearGroups"])

    faction_abilities = [ability for ability in detail["abilities"] if is_faction_ability(ability)]
    datasheet_abilities = [ability for ability in detail["abilities"] if not is_faction_ability(ability)]

    info_cards = []
    info_cards.extend(ability_info_card(ability) for ability in datasheet_abilities)
    info_cards.extend(
        text_info_card(rule["name"], rule["rules"], "unit-info-card unit-rule-card")
        for rule in detail["rules"]
    )
    info_cards.extend(
        text_info_card(
            damage["name"] if not damage.get("damagedAt") else f'{damage["name"]}: {damage["damagedAt"]} wounds',
            damage["rules"],
            "unit-info-card unit-damage-card",
        )
        for damage in detail["damageRows"]
    )
    info_sections = [render_info_card(card) for card in merge_info_cards(info_cards)]

    # FAQ cards and lore are rule-cards, so placing them in the rules grid makes
    # them 1/3-width like the other blocks. Errata is intentionally not shown.
    datasheet_faqs = faqs_for_entity(heretic_builder, "datasheetId", datasheet_id)
    faq_cards_html = "".join(render_faq_card(faq) for faq in datasheet_faqs if has_faq(faq))
    lore_html = render_datasheet_lore(datasheet.get("lore"))
    grid_tail_html = render_wargear_rules_section(detail["wargearRules"]) + faq_cards_html + lore_html

    content_html = render_template(
        "codex_unit_detail.html",
        keyword_tags_html=render_unit_keyword_tags(detail["keywords"], faction_abilities),
        statline_html=statline_html,
        points_html=render_reference_stack(points_html, base_sizes_html),
        weapons_html=weapons_html,
        info_html="".join(section for section in info_sections if section),
        wargear_rules_html=grid_tail_html,
    )

    return render_codex_content_page(
        title=datasheet["name"],
        window_title=f"{datasheet['name']}",
        task_title=f"{faction['name']} / {datasheet['name']}",
        page_class="faction-detail-page unit-detail-page",
        content_html=content_html,
        back_href=f"{faction_href(faction)}/datasheets",
        back_label=f"Back to {faction['name']} Data Sheets",
        hero_image_url=unit_image_url(image) if image else None,
    )
