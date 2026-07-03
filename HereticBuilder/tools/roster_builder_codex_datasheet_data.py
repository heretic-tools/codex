from roster_builder_codex_rich_text import normalize_rule_text
from roster_builder_utils import dict_row

def option_group_title(group):
    text = normalize_rule_text(group.get("instructionText"))
    first_line = next((line.strip(" ■") for line in text.splitlines() if line.strip()), "")
    return first_line or "Wargear"

def plain_wargear_group_rule(group):
    text = normalize_rule_text(group.get("instructionText"))
    if option_group_title(group).lower() == "default wargear":
        default_items = [
            item
            for item in group["items"]
            if item.get("defaultValue")
        ]
        if default_items:
            item_lines = []
            for item in default_items:
                count = item.get("defaultValue") or 1
                prefix = f"{count} " if count > 1 else ""
                item_lines.append(f"◦ {prefix}{item['itemName']}")
            text = "\n".join([text or "Default Wargear", *item_lines])
    return text.strip()

def datasheet_wargear_rules(conn, datasheet_id, wargear_groups):
    default_rules = [
        plain_wargear_group_rule(group)
        for group in wargear_groups
        if option_group_title(group).lower() == "default wargear"
    ]
    rows = [
        row["rulesText"]
        for row in conn.execute(
            """
            select rulesText
            from wargear_rule
            where datasheetId = ?
            order by displayOrder
            """,
            [datasheet_id],
        )
    ]
    if rows:
        return [rule for rule in [*default_rules, *rows] if rule.strip()]
    return [
        plain_wargear_group_rule(group)
        for group in wargear_groups
        if plain_wargear_group_rule(group)
    ]

def datasheet_wargear_groups(conn, datasheet_id):
    rows = conn.execute(
        """
        select wog.id as groupId, wog.instructionText, wog.displayOrder as groupOrder,
               wog.isStaticWargear, m.name as miniatureName,
               wo.id as optionId, wo.defaultValue, wo.points, wo.displayOrder as optionOrder,
               wi.id as wargearItemId, wi.name as itemName, wi.wargearType, wi.ruleText
        from wargear_option_group wog
        join wargear_option wo on wo.wargearOptionGroupId = wog.id
        join wargear_item wi on wi.id = wo.wargearItemId
        left join miniature m on m.id = wog.miniatureId
        where wog.datasheetId = ?
        order by wog.displayOrder, lower(coalesce(m.name, '')), wo.displayOrder, lower(wi.name)
        """,
        [datasheet_id],
    ).fetchall()
    groups = []
    by_id = {}
    seen_options = set()
    for row in rows:
        group = by_id.get(row["groupId"])
        if not group:
            group = {
                "id": row["groupId"],
                "instructionText": row["instructionText"],
                "displayOrder": row["groupOrder"],
                "isStaticWargear": row["isStaticWargear"],
                "miniatureName": row["miniatureName"],
                "items": [],
                "profiles": [],
            }
            by_id[row["groupId"]] = group
            groups.append(group)
        if row["optionId"] in seen_options:
            continue
        seen_options.add(row["optionId"])
        group["items"].append({
            "id": row["optionId"],
            "itemId": row["wargearItemId"],
            "itemName": row["itemName"],
            "wargearType": row["wargearType"],
            "ruleText": row["ruleText"],
            "defaultValue": row["defaultValue"],
            "points": row["points"],
        })

    if not groups:
        return []

    profile_rows = conn.execute(
        """
        select wog.id as groupId, wo.id as optionId, wo.defaultValue, wo.points,
               wi.id as wargearItemId,
               wi.name as itemName, wip.id as profileId, wip.name as profileName,
               wip.type, wip.range, wip.attacks, wip.ballisticSkill, wip.weaponSkill,
               wip.strength, wip.armourPenetration, wip.damage, wip.displayOrder,
               group_concat(wa.name, ', ') as abilities
        from wargear_option_group wog
        join wargear_option wo on wo.wargearOptionGroupId = wog.id
        join wargear_item wi on wi.id = wo.wargearItemId
        join wargear_item_profile wip on wip.wargearItemId = wi.id
        left join wargear_item_profile_wargear_ability wipwa on wipwa.wargearItemProfileId = wip.id
        left join wargear_ability wa on wa.id = wipwa.wargearAbilityId
        where wog.datasheetId = ?
        group by wog.id, wo.id, wip.id
        order by wog.displayOrder,
                 case lower(wip.type) when 'ranged' then 0 when 'melee' then 1 else 2 end,
                 lower(wi.name), wip.displayOrder
        """,
        [datasheet_id],
    ).fetchall()
    for row in profile_rows:
        group = by_id.get(row["groupId"])
        if not group:
            continue
        group["profiles"].append(dict_row(row))
    return groups

def paid_wargear_options(wargear_groups):
    seen = set()
    result = []
    for group in wargear_groups:
        for item in group["items"]:
            if not item.get("points"):
                continue
            key = (item["itemName"].lower(), item["points"])
            if key in seen:
                continue
            seen.add(key)
            result.append(item)
    return sorted(result, key=lambda item: (abs(item["points"]), item["itemName"].lower()))

def datasheet_detail(heretic_builder, faction_id, datasheet_id):
    with heretic_builder.connect(readonly=True) as conn:
        row = conn.execute(
            """
            select d.id, d.name, d.baseSize, d.unitComposition, d.lore,
                   coalesce((
                     select uc.points
                     from unit_composition uc
                     where uc.datasheetId = d.id
                     order by uc.isDefault desc, uc.displayOrder
                     limit 1
                   ), 0) as points
            from datasheet d
            where d.id = ?
            """,
            [datasheet_id],
        ).fetchone()
        if not row:
            raise ValueError("Datasheet not found")

        datasheet = dict_row(row)
        composition_faction_ids = heretic_builder.composition_faction_keyword_ids(conn, faction_id)
        composition = heretic_builder.default_composition(conn, datasheet_id, composition_faction_ids, [])
        if composition:
            datasheet["points"] = composition["points"]
        point_options = [
            comp
            for comp in heretic_builder.compositions(conn, datasheet_id, {"factionKeywordId": composition_faction_ids}, [])
            if comp.get("available")
        ]

        miniatures = [
            dict_row(miniature)
            for miniature in conn.execute(
                """
                select id, name, movement, toughness, save, wounds, leadership,
                       objectiveControl, statlineHidden, displayOrder
                from miniature
                where datasheetId = ?
                order by displayOrder, lower(name)
                """,
                [datasheet_id],
            )
        ]
        rules = [
            dict_row(rule)
            for rule in conn.execute(
                """
                select name, rules, displayOrder
                from datasheet_rule
                where datasheetId = ?
                order by displayOrder, lower(name)
                """,
                [datasheet_id],
            )
        ]
        abilities = [
            {**dict_row(ability), "subAbilities": []}
            for ability in conn.execute(
                """
                select da.id, da.name, da.abilityType, da.rules, da.lore,
                       da.subAbilityHeader, da.isPsychic, da.isAura, da.isBondsman,
                       dda.restriction, dda.displayOrder
                from datasheet_datasheet_ability dda
                join datasheet_ability da on da.id = dda.datasheetAbilityId
                where dda.datasheetId = ?
                order by dda.displayOrder, lower(da.name)
                """,
                [datasheet_id],
            )
        ]
        ability_by_id = {ability["id"]: ability for ability in abilities}
        if ability_by_id:
            placeholders = ",".join("?" for _ in ability_by_id)
            for sub_ability in conn.execute(
                f"""
                select datasheetAbilityId, name, rules, displayOrder
                from datasheet_sub_ability
                where datasheetAbilityId in ({placeholders})
                order by displayOrder, lower(name)
                """,
                list(ability_by_id),
            ):
                ability_by_id[sub_ability["datasheetAbilityId"]]["subAbilities"].append(dict_row(sub_ability))

        keywords = [
            row["name"]
            for row in conn.execute(
                """
                select distinct k.name
                from miniature m
                join miniature_keyword mk on mk.miniatureId = m.id
                join keyword k on k.id = mk.keywordId
                where m.datasheetId = ?
                order by lower(k.name)
                """,
                [datasheet_id],
            )
        ]
        invulnerable_saves = [
            dict_row(save)
            for save in conn.execute(
                """
                select inv.miniatureId, inv.save, inv.meleeSave, inv.rangedSave, inv.rules,
                       m.name as miniatureName
                from invulnerable_save inv
                left join miniature m on m.id = inv.miniatureId
                where inv.datasheetId = ?
                order by lower(coalesce(m.name, ''))
                """,
                [datasheet_id],
            )
        ]
        points_steps = [
            dict_row(step)
            for step in conn.execute(
                """
                select stepAt, stepPoints
                from datasheet_points_step
                where datasheetId = ?
                order by stepAt
                """,
                [datasheet_id],
            )
        ]
        wargear_groups = datasheet_wargear_groups(conn, datasheet_id)
        wargear_rules = datasheet_wargear_rules(conn, datasheet_id, wargear_groups)
        damage_rows = [
            dict_row(damage)
            for damage in conn.execute(
                """
                select name, damagedAt, rules, displayOrder
                from datasheet_damage
                where datasheetId = ?
                order by displayOrder, lower(name)
                """,
                [datasheet_id],
            )
        ]

    return {
        "datasheet": datasheet,
        "pointOptions": point_options,
        "pointsSteps": points_steps,
        "miniatures": miniatures,
        "rules": rules,
        "abilities": abilities,
        "keywords": keywords,
        "invulnerableSaves": invulnerable_saves,
        "wargearGroups": wargear_groups,
        "wargearRules": wargear_rules,
        "paidWargear": paid_wargear_options(wargear_groups),
        "damageRows": damage_rows,
    }
