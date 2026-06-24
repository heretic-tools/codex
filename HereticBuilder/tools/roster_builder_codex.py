import html

from roster_builder_assets import FACTION_IMAGES_BY_ID, FACTION_IMAGES_BY_NAME
from roster_builder_templates import render_template


def escape_html(value):
    return html.escape(str(value), quote=False)


def escape_attr(value):
    return html.escape(str(value), quote=True)


def faction_image_url(image):
    return f"/assets/faction-images/{escape_attr(image['filename'])}"


def find_faction_image(name, faction_id=None):
    if faction_id and faction_id in FACTION_IMAGES_BY_ID:
        return FACTION_IMAGES_BY_ID[faction_id]
    return FACTION_IMAGES_BY_NAME.get(str(name).lower())


def render_launcher(button):
    href_attr = f' data-href="{escape_attr(button["href"])}"' if button.get("href") else ""
    classes = ["launcher"]
    tag_html = ""
    image_html = ""

    if button.get("tag"):
        tag_html = render_template("codex_launcher_tag.html", tag=escape_html(button["tag"]))

    image = button.get("image")
    if image:
        classes.append("has-faction-image")
        image_html = render_template(
            "codex_launcher_image.html",
            src=faction_image_url(image),
        )

    return render_template(
        "codex_launcher.html",
        class_attr=escape_attr(" ".join(classes)),
        label_attr=escape_attr(button["label"]),
        route_attr=escape_attr(button["route"]),
        href_attr=href_attr,
        image_html=image_html,
        label=escape_html(button["label"]),
        tag_html=tag_html,
    )


def render_codex_page(title, window_title, task_title, page_class, grid_label, buttons, back_href, back_label):
    if len(buttons) > 5:
        page_class = f"{page_class} many-buttons-page"

    return render_template(
        "codex.html",
        document_title=escape_html(f"{title} - HereticTools"),
        page_class=escape_attr(page_class),
        title=escape_attr(title),
        window_title=escape_html(window_title),
        grid_label=escape_attr(grid_label),
        buttons_html="\n".join(render_launcher(button) for button in buttons),
        back_href=escape_attr(back_href),
        back_label=escape_attr(back_label),
        task_title=escape_html(task_title),
    )


def render_codex_root_page():
    return render_codex_page(
        title="Codex",
        window_title="Codex.exe",
        task_title="Codex",
        page_class="codex-root-page",
        grid_label="Codex sections",
        back_href="/",
        back_label="Back to HereticTools",
        buttons=[
            {"label": "Core Rules", "tag": "Reference", "route": "core-rules", "href": "/codex/core-rules"},
            {"label": "Imperium", "route": "imperium", "href": "/codex/imperium"},
            {"label": "Chaos", "route": "chaos", "href": "/codex/chaos"},
            {"label": "Xenos", "route": "xenos", "href": "/codex/xenos"},
        ],
    )


def render_core_rules_page():
    return render_codex_page(
        title="Core Rules",
        window_title="CoreRules.exe",
        task_title="Core Rules",
        page_class="core-rules-page",
        grid_label="Core Rules sections",
        back_href="/codex",
        back_label="Back to Codex",
        buttons=[
            {"label": "Rules", "tag": "Reference", "route": "rules"},
            {"label": "Stratagems", "tag": "Tactics", "route": "stratagems"},
            {"label": "FAQ", "tag": "Updates", "route": "faq"},
        ],
    )


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


FACTION_GROUPS = {
    "imperium": {
        "title": "Imperium",
        "window_title": "Imperium.exe",
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
        "window_title": "Chaos.exe",
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
        "window_title": "Xenos.exe",
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


def render_faction_group_page(heretic_builder, group_key):
    group = FACTION_GROUPS[group_key]
    factions = heretic_builder.bootstrap()["factions"]
    group_ids = group["ids"]
    group_factions = [faction for faction in factions if faction["id"] in group_ids]
    buttons = [
        {
            "label": faction["name"],
            "route": faction["id"],
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
        window_title=group["window_title"],
        task_title=group["title"],
        page_class="faction-list-page",
        grid_label="Faction sections",
        back_href="/codex",
        back_label="Back to Codex",
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
        window_title="AdeptusAstartes.exe",
        task_title="Adeptus Astartes",
        page_class="faction-list-page",
        grid_label="Adeptus Astartes factions",
        back_href="/codex/imperium",
        back_label="Back to Imperium",
        buttons=[
            {
                "label": faction["name"],
                "route": faction["id"],
                "image": find_faction_image(faction["name"], faction["id"]),
            }
            for faction in group_factions
        ],
    )
