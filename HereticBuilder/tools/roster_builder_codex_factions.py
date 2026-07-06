from roster_builder_codex_common import (
    datasheet_href,
    faction_href,
    find_faction_image,
    find_unit_image,
    render_codex_content_page,
    render_codex_page,
    render_list_item,
    unit_image_url,
)
from roster_builder_codex_faq import render_faq_update_sections
from roster_builder_codex_rich_text import escape_attr, escape_html, render_rule_component
from roster_builder_codex_rules import render_rule_body_with_title
from roster_builder_routes import resolve_entity_ref, scoped_slug_map, slugify_name
from roster_builder_utils import dict_row

ADEPTUS_ASTARTES_FACTION_IDS = {
    "01623188-9470-4441-96b0-e06eb2572bb5",
    "28162de0-fd36-450b-87ee-39e973ead32d",
    "864734c9-d6c7-4486-92de-9b8271a6a1e5",
    "fa0e86ef-b5da-4510-9a9f-8cd86267bb6a",
    "51ac31b0-93ff-4c94-a9a5-5c1a97fbbb75",
    "93423323-3abb-4a72-a51e-b8ac54f2f98d",
    "cd8dd346-3b5a-489d-8e47-22711922098d",
    "780aa838-ed0f-44b7-bca3-ff54d357a07b",
    "8d74ba46-ac06-4c05-a90c-5d25282b2c94",
    "4db683fe-87a0-4138-9b53-4b326c8e8521",
    "bc367514-36b7-47c6-bd3f-ffbf85f5cfd9",
    "b7d67027-cf56-4cd1-8127-9e7658de4ef5",
    "a65e110c-2b80-4887-8b2f-1f335b4dd450",
}
ADEPTUS_ASTARTES_FACTION_ID = "01623188-9470-4441-96b0-e06eb2572bb5"
FACTION_GROUPS = {
    "imperium": {
        "title": "Imperium",
        "header_title": "Imperium",
        "hero_faction_id": "2f81671f-3164-4ab0-93c0-4a99746b5996",
        "hero_faction_name": "Agents of the Imperium",
        "ids": {
            "aee1b46d-3461-4d5d-a612-0efd05dd843d",
            "6cc4ee5e-3bc6-4142-8147-2e1a9fb6e82c",
            "60ecf26b-0c2b-4ea3-8a29-5f06bd02f6d8",
            "fec6e6a5-f491-4d83-99c0-e46e510f29e8",
            "2f81671f-3164-4ab0-93c0-4a99746b5996",
            "9b847488-9663-48dc-b819-08ab93ac4382",
            "5737b3b6-1c33-4cb3-828c-08b6909197aa",
        },
    },
    "chaos": {
        "title": "Chaos",
        "header_title": "Chaos",
        "hero_faction_id": "40a70c91-675a-4ac5-aa97-daedb9cb6f11",
        "hero_faction_name": "Legiones Daemonica",
        "ids": {
            "2e79f9cd-94dc-48ca-bddf-6d5e877609c5",
            "19176137-2faa-4d6e-adb4-2572510032b7",
            "b63a417d-63ea-4d20-b7f0-85c66c56979e",
            "d4162ab7-8356-4e4e-adb3-5e3b631d47e6",
            "40a70c91-675a-4ac5-aa97-daedb9cb6f11",
            "25d2c58f-59b5-4a4f-b597-495ba322ce07",
            "46cec02c-a75a-4e1e-b53a-afab701e94c6",
            "8bd4c67d-4aba-4502-8561-7c6c6faae51d",
        },
    },
    "xenos": {
        "title": "Xenos",
        "header_title": "Xenos",
        "hero_faction_id": "0b30f1e3-1e5c-4823-afa1-07951433a270",
        "hero_faction_name": "Orks",
        "ids": {
            "2cb72f92-bfc7-4d2c-a183-b2bff6b26bfc",
            "43bbfe97-4c14-47be-be2b-90de3e6756b1",
            "800c0387-5033-47da-bad0-f42e53b37453",
            "a42808ab-f00b-4664-aed5-8d9341b96e36",
            "47670bc3-64b8-4c2d-9154-7391f132688b",
            "0b30f1e3-1e5c-4823-afa1-07951433a270",
            "b30b3258-9140-46b8-9c9e-113be9008ea9",
            "1a241f8e-2d79-47c4-82b1-f6faea353970",
        },
    },
}
DATASHEET_GROUPS = (
    ("Epic Heroes", {"Epic Hero"}),
    ("Leaders", {"Character"}),
    ("Supports", {"Character"}),
    ("Characters", {"Character"}),
    ("Battleline", {"Battleline"}),
    ("Infantry", {"Infantry"}),
    ("Transports", {"Dedicated Transport", "Transport"}),
    ("Vehicles", {"Vehicle"}),
    ("Monsters", {"Monster"}),
    ("Mounted", {"Mounted"}),
    ("Beasts", {"Beast"}),
    ("Swarms", {"Swarm", "Endless Multitude"}),
    ("Aircraft", {"Aircraft"}),
    ("Fortifications", {"Fortification", "Fortifications"}),
    ("Titanic", {"Titanic"}),
    ("Allied Units", set()),
    ("Other Datasheets", set()),
)
DATASHEET_GROUP_ORDER = [name for name, _ in DATASHEET_GROUPS]
SPECIAL_DATASHEET_KEYWORDS = {
    "Aircraft",
    "Dedicated Transport",
    "Endless Multitude",
    "Fortification",
    "Fortifications",
    "Swarm",
    "Titanic",
    "Transport",
}

def render_faction_group_page(heretic_builder, group_key):
    group = FACTION_GROUPS[group_key]
    factions = heretic_builder.bootstrap()["factions"]
    group_ids = group["ids"]
    group_factions = [faction for faction in factions if faction["id"] in group_ids]
    buttons = [
        {
            "label": faction["name"],
            "route": slugify_name(faction["name"]),
            "href": faction_href(faction),
            "image": find_faction_image(faction["name"], faction["id"]),
        }
        for faction in group_factions
    ]
    if group_key == "imperium":
        buttons.append({
            "label": "Adeptus Astartes",
            "route": "adeptus-astartes",
            "href": "/codex/imperium/adeptus-astartes",
            "image": find_faction_image("Adeptus Astartes"),
        })
        buttons.sort(key=lambda button: button["label"].lower())
    return render_codex_page(
        title=group["title"],
        header_title=group["header_title"],
        task_title=group["title"],
        page_class="faction-list-page",
        grid_label="Faction sections",
        back_href="/codex",
        back_label="Back to Codex",
        hero_image=find_faction_image(group["hero_faction_name"], group["hero_faction_id"]),
        buttons=buttons,
    )

def render_adeptus_astartes_page(heretic_builder):
    factions = heretic_builder.bootstrap()["factions"]
    group_factions = [
        faction
        for faction in factions
        if faction["id"] in ADEPTUS_ASTARTES_FACTION_IDS
    ]
    return render_codex_page(
        title="Adeptus Astartes",
        header_title="AdeptusAstartes",
        task_title="Adeptus Astartes",
        page_class="faction-list-page",
        grid_label="Adeptus Astartes factions",
        back_href="/codex/imperium",
        back_label="Back to Imperium",
        buttons=[
            {
                "label": faction["name"],
                "route": slugify_name(faction["name"]),
                "href": faction_href(faction),
                "image": find_faction_image(faction["name"], faction["id"]),
            }
            for faction in group_factions
        ],
    )

def faction_back_href(faction_id):
    if faction_id in ADEPTUS_ASTARTES_FACTION_IDS:
        return "/codex/imperium/adeptus-astartes"
    for group_key, group in FACTION_GROUPS.items():
        if faction_id in group["ids"]:
            return f"/codex/{group_key}"
    return "/codex"

def faction_by_id(heretic_builder, faction_id):
    with heretic_builder.connect(readonly=True) as conn:
        row = conn.execute(
            """
            select id, name, lore
            from faction_keyword
            where id = ?
              and excludedFromArmyBuilder = 0
            """,
            [faction_id],
        ).fetchone()
        if not row:
            rows = conn.execute(
                """
                select id, name, lore
                from faction_keyword
                where excludedFromArmyBuilder = 0
                order by lower(name)
                """
            ).fetchall()
            resolved_id = resolve_entity_ref(rows, faction_id)
            if resolved_id:
                row = next((item for item in rows if item["id"] == resolved_id), None)
    if not row:
        raise ValueError("Faction not found")
    return dict_row(row)

def faction_hero_image(faction):
    return find_faction_image(faction["name"], faction["id"])

def render_faction_page(heretic_builder, faction_id):
    faction = faction_by_id(heretic_builder, faction_id)
    base_href = faction_href(faction)
    return render_codex_page(
        title=faction["name"],
        header_title=f"{faction['name']}",
        task_title=faction["name"],
        page_class="faction-home-page",
        grid_label=f"{faction['name']} sections",
        back_href=faction_back_href(faction["id"]),
        back_label="Back to Factions",
        hero_image=faction_hero_image(faction),
        buttons=[
            {"label": "Army Rule", "tag": "Reference", "route": "army-rule", "href": f"{base_href}/army-rule"},
            {"label": "Detachments", "tag": "Forces", "route": "detachments", "href": f"{base_href}/detachments"},
            {"label": "Data Sheets", "tag": "Units", "route": "datasheets", "href": f"{base_href}/datasheets"},
        ],
    )

def rule_components_for(conn, relation_column, relation_id):
    if relation_column not in {"armyRuleId", "detachmentRuleId"}:
        raise ValueError("Unsupported rule component relation")
    return [
        dict_row(row)
        for row in conn.execute(
            f"""
                select type, title, textContent, trigger, effect, imageUrl, altText, displayOrder
                from rule_container_component
                where {relation_column} = ?
                order by displayOrder
            """,
            [relation_id],
        )
    ]

def army_rules_for_faction(heretic_builder, faction_id):
    with heretic_builder.connect(readonly=True) as conn:
        rules = [
            dict_row(row)
            for row in conn.execute(
                """
                select ar.id, ar.name
                from army_rule ar
                join army_rule_faction_keyword arfk on arfk.armyRuleId = ar.id
                where arfk.factionKeywordId = ?
                  and ar.hiddenFromCommandBunker = 0
                order by ar.displayOrder, lower(ar.name)
                """,
                [faction_id],
            )
        ]
        for rule in rules:
            rule["components"] = rule_components_for(conn, "armyRuleId", rule["id"])
            rule["faqs"] = [
                dict_row(row)
                for row in conn.execute(
                    """
                    select distinct f.id, f.errataHeader, f.errataText, f.question, f.answer, f.displayOrder
                    from faq_config fc
                    join faq f on f.id = fc.faqId
                    where fc.armyRuleId = ?
                    order by f.displayOrder, f.id
                    """,
                    [rule["id"]],
                )
            ]
    return rules

def render_faction_army_rule_page(heretic_builder, faction_id):
    faction = faction_by_id(heretic_builder, faction_id)
    rules = army_rules_for_faction(heretic_builder, faction["id"])
    if not rules:
        content_html = '<div class="empty-state">No army rule found.</div>'
    else:
        rule_html = []
        for rule in rules:
            components = "".join(render_rule_component(component) for component in rule["components"])
            rule_html.append(
                f'<article class="codex-content">'
                f'{render_rule_body_with_title(rule["name"], components)}'
                f'{render_faq_update_sections(rule.get("faqs") or [], errata_title="", faq_title="")}'
                f'</article>'
            )
        content_html = '<div class="codex-content">' + "".join(rule_html) + "</div>"
    return render_codex_content_page(
        title=f"{faction['name']} Army Rule",
        header_title=f"{faction['name']}\nRule",
        task_title=f"{faction['name']} / Army Rule",
        page_class="faction-detail-page",
        content_html=content_html,
        back_href=faction_href(faction),
        back_label=f"Back to {faction['name']}",
        hero_image=faction_hero_image(faction),
    )

def render_datasheet_item(datasheet, faction, datasheet_slug):
    image = find_unit_image(datasheet["name"], datasheet.get("id"))
    meta = f'{datasheet["points"]} pts' if datasheet.get("points") is not None else ""
    href = datasheet_href(faction, datasheet, datasheet_slug)
    if not image:
        return render_list_item(datasheet["name"], meta, href=href)
    return (
        f'<a class="list-item datasheet-tile has-unit-image" href="{escape_attr(href)}">'
        f'<span class="unit-art-frame" aria-hidden="true"><img class="unit-art" src="{unit_image_url(image)}" alt=""></span>'
        '<span class="datasheet-tile-text">'
        f'<span class="list-item-title">{escape_html(datasheet["name"])}</span>'
        f'<span class="list-item-meta">{escape_html(meta)}</span>'
        '</span>'
        '</a>'
    )

def datasheet_keywords(heretic_builder, datasheet_ids):
    if not datasheet_ids:
        return {}
    placeholders = ",".join("?" for _ in datasheet_ids)
    with heretic_builder.connect(readonly=True) as conn:
        rows = conn.execute(
            f"""
            select m.datasheetId, k.name
            from miniature m
            join miniature_keyword mk on mk.miniatureId = m.id
            join keyword k on k.id = mk.keywordId
            where m.datasheetId in ({placeholders})
            """,
            datasheet_ids,
        )
        result = {datasheet_id: set() for datasheet_id in datasheet_ids}
        for row in rows:
            result.setdefault(row["datasheetId"], set()).add(row["name"])
    return result

def datasheet_attachment_types(heretic_builder, datasheet_ids):
    if not datasheet_ids:
        return {}
    placeholders = ",".join("?" for _ in datasheet_ids)
    with heretic_builder.connect(readonly=True) as conn:
        rows = conn.execute(
            f"""
            select datasheetId, bodyguardType
            from datasheet_bodyguard_group
            where datasheetId in ({placeholders})
            """,
            datasheet_ids,
        )
        result = {datasheet_id: set() for datasheet_id in datasheet_ids}
        for row in rows:
            result.setdefault(row["datasheetId"], set()).add(row["bodyguardType"])
    return result

def allied_datasheets_for_faction(heretic_builder, faction_id):
    with heretic_builder.connect(readonly=True) as conn:
        rows = conn.execute(
            """
            select distinct d.id, d.name,
                   coalesce((
                     select uc.points
                     from unit_composition uc
                     where uc.datasheetId = d.id
                     order by uc.isDefault desc, uc.displayOrder
                     limit 1
                   ), 0) as points
            from faction_keyword_allied_faction fkaf
            join allied_faction_datasheet afd on afd.alliedFactionId = fkaf.alliedFactionId
            join datasheet d on d.id = afd.datasheetId
            where fkaf.factionKeywordId = ?
            order by lower(d.name)
            limit 250
            """,
            [faction_id],
        ).fetchall()
    return [dict_row(row) for row in rows]

def astartes_codex_datasheets(heretic_builder, faction_id):
    params = [faction_id]
    chapter_filter = ""
    if faction_id == ADEPTUS_ASTARTES_FACTION_ID:
        chapter_ids = sorted(ADEPTUS_ASTARTES_FACTION_IDS - {ADEPTUS_ASTARTES_FACTION_ID})
        placeholders = ",".join("?" for _ in chapter_ids)
        chapter_filter = f"""
          and not exists (
            select 1
            from datasheet_faction_keyword chapter_dfk
            where chapter_dfk.datasheetId = d.id
              and chapter_dfk.factionKeywordId in ({placeholders})
          )
        """
        params.extend(chapter_ids)

    with heretic_builder.connect(readonly=True) as conn:
        rows = conn.execute(
            f"""
            select distinct d.id, d.name,
                   coalesce((
                     select uc.points
                     from unit_composition uc
                     where uc.datasheetId = d.id
                     order by uc.isDefault desc, uc.displayOrder
                     limit 1
                   ), 0) as points
            from datasheet d
            join datasheet_faction_keyword dfk
              on dfk.datasheetId = d.id
             and dfk.factionKeywordId = ?
            where not exists (
                select 1
                from faction_keyword_excluded_datasheet fked
                where fked.datasheetId = d.id
                  and fked.factionKeywordId = ?
              )
              {chapter_filter}
            order by lower(d.name)
            limit 250
            """,
            [faction_id, *params],
        ).fetchall()
    return [dict_row(row) for row in rows]

def codex_datasheets_for_faction(heretic_builder, faction_id):
    if faction_id in ADEPTUS_ASTARTES_FACTION_IDS:
        return astartes_codex_datasheets(heretic_builder, faction_id)
    return heretic_builder.datasheets(faction_id).get("datasheets", [])

def visible_codex_datasheets_for_faction(heretic_builder, faction_id):
    native_datasheets = [
        datasheet
        for datasheet in codex_datasheets_for_faction(heretic_builder, faction_id)
        if datasheet.get("points", 0) > 0
    ]
    allied_datasheets = [
        datasheet
        for datasheet in allied_datasheets_for_faction(heretic_builder, faction_id)
        if datasheet.get("points", 0) > 0
    ]
    return native_datasheets, allied_datasheets

def visible_datasheet_slug_map(heretic_builder, faction_id):
    native_datasheets, allied_datasheets = visible_codex_datasheets_for_faction(heretic_builder, faction_id)
    rows = [
        {**datasheet, "allyType": "native"}
        for datasheet in native_datasheets
    ] + [
        {**datasheet, "allyType": "allied"}
        for datasheet in allied_datasheets
    ]
    return scoped_slug_map(rows)

def datasheet_id_for_faction(heretic_builder, faction_id, datasheet_ref):
    native_datasheets, allied_datasheets = visible_codex_datasheets_for_faction(heretic_builder, faction_id)
    rows = [
        {**datasheet, "allyType": "native"}
        for datasheet in native_datasheets
    ] + [
        {**datasheet, "allyType": "allied"}
        for datasheet in allied_datasheets
    ]
    resolved_id = resolve_entity_ref(rows, datasheet_ref)
    if not resolved_id:
        raise ValueError("Datasheet not found")
    return resolved_id

def datasheet_group_name(datasheet, keywords, attachment_types):
    if datasheet.get("allyType") == "allied":
        return "Allied Units"
    if "Epic Hero" in keywords:
        return "Epic Heroes"
    if "Character" in keywords:
        if "leader" in attachment_types:
            return "Leaders"
        if "support" in attachment_types:
            return "Supports"
        return "Characters"
    if "Battleline" in keywords:
        return "Battleline"
    if keywords.intersection({"Swarm", "Endless Multitude"}):
        return "Swarms"
    if "Aircraft" in keywords:
        return "Aircraft"
    if keywords.intersection({"Fortification", "Fortifications"}):
        return "Fortifications"
    if "Titanic" in keywords:
        return "Titanic"
    if keywords.intersection({"Dedicated Transport", "Transport"}):
        return "Transports"
    if "Infantry" in keywords:
        return "Infantry"
    if "Vehicle" in keywords and not keywords.intersection(SPECIAL_DATASHEET_KEYWORDS):
        return "Vehicles"
    if "Monster" in keywords and not keywords.intersection(SPECIAL_DATASHEET_KEYWORDS):
        return "Monsters"
    if "Mounted" in keywords:
        return "Mounted"
    if "Beast" in keywords:
        return "Beasts"
    if "Vehicle" in keywords:
        return "Vehicles"
    if "Monster" in keywords:
        return "Monsters"
    return "Other Datasheets"

def render_datasheet_groups(heretic_builder, native_datasheets, allied_datasheets, faction):
    datasheets = [
        {**datasheet, "allyType": "native"}
        for datasheet in native_datasheets
    ] + [
        {**datasheet, "allyType": "allied"}
        for datasheet in allied_datasheets
    ]
    slug_by_id = scoped_slug_map(datasheets)
    keyword_map = datasheet_keywords(heretic_builder, [datasheet["id"] for datasheet in datasheets])
    attachment_type_map = datasheet_attachment_types(heretic_builder, [datasheet["id"] for datasheet in datasheets])
    grouped = {name: [] for name in DATASHEET_GROUP_ORDER}
    for datasheet in datasheets:
        keywords = keyword_map.get(datasheet["id"], set())
        attachment_types = attachment_type_map.get(datasheet["id"], set())
        grouped[datasheet_group_name(datasheet, keywords, attachment_types)].append(datasheet)

    sections = []
    for group_name in DATASHEET_GROUP_ORDER:
        group_datasheets = grouped[group_name]
        if not group_datasheets:
            continue
        items_html = "".join(
            render_datasheet_item(datasheet, faction, slug_by_id[datasheet["id"]])
            for datasheet in sorted(group_datasheets, key=lambda item: item["name"].lower())
        )
        sections.append(
            f'<section class="datasheet-group">'
            f'<h2 class="datasheet-group-title">{escape_html(group_name)}</h2>'
            f'<div class="list-grid">{items_html}</div>'
            f'</section>'
        )
    return '<div class="codex-content">' + "".join(sections) + "</div>"

def render_faction_datasheets_page(heretic_builder, faction_id):
    faction = faction_by_id(heretic_builder, faction_id)
    datasheets, allied_datasheets = visible_codex_datasheets_for_faction(heretic_builder, faction["id"])
    if datasheets or allied_datasheets:
        content_html = render_datasheet_groups(heretic_builder, datasheets, allied_datasheets, faction)
    else:
        content_html = '<div class="empty-state">No datasheets found.</div>'
    return render_codex_content_page(
        title=f"{faction['name']} Data Sheets",
        header_title=f"{faction['name']}\nData Sheets",
        task_title=f"{faction['name']} / Data Sheets",
        page_class="faction-detail-page many-buttons-page",
        content_html=content_html,
        back_href=faction_href(faction),
        back_label=f"Back to {faction['name']}",
        hero_image=faction_hero_image(faction),
    )
