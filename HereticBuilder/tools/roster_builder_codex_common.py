import re

from roster_builder_assets import FACTION_IMAGES_BY_ID, FACTION_IMAGES_BY_NAME, UNIT_IMAGES_BY_ID, UNIT_IMAGES_BY_NAME
from roster_builder_codex_rich_text import escape_attr, escape_html
from roster_builder_routes import slugify_name
from roster_builder_templates import render_template

CORE_RULES_PUBLICATION_ID = "4cdf7a87-0914-49e8-b5df-b9f8be4d13c6"
CORE_RULES_IMAGE = {"filename": "core-rules__4cdf7a87__roster-header.png"}
FAQ_RELATION_COLUMNS = {
    "datasheetId",
    "armyRuleId",
    "detachmentId",
    "enhancementId",
    "stratagemId",
    "ruleContainerId",
}
CORE_RULES_INFERRED_FAQ_REFERENCES = {
    "5928ab6e-7113-42c8-9085-4291faddae09": ("06.03", "24.15"),
    "c2df3e97-f21e-4fc9-943e-37072c08c10e": ("18.02", "18.03", "18.04"),
    "4978f15f-2b4a-4805-aacd-db9b5cad71bd": ("06.03", "09.07"),
}

def faction_image_url(image):
    return f"/assets/faction-images/{escape_attr(image['filename'])}"

def unit_image_url(image):
    return f"/assets/unit-images/{escape_attr(image['filename'])}"

def find_faction_image(name, faction_id=None):
    if faction_id and faction_id in FACTION_IMAGES_BY_ID:
        return FACTION_IMAGES_BY_ID[faction_id]
    return FACTION_IMAGES_BY_NAME.get(str(name).lower())

def find_unit_image(name, datasheet_id=None):
    if datasheet_id and datasheet_id in UNIT_IMAGES_BY_ID:
        return UNIT_IMAGES_BY_ID[datasheet_id]
    return UNIT_IMAGES_BY_NAME.get(str(name).lower())

def entity_name(value):
    if isinstance(value, dict):
        return value.get("name") or value.get("id") or ""
    return value

def faction_href(faction):
    return f"/codex/faction/{slugify_name(entity_name(faction))}"

def datasheet_href(faction, datasheet, datasheet_slug=None):
    slug = datasheet_slug or slugify_name(entity_name(datasheet))
    return f"{faction_href(faction)}/datasheet/{slug}/"

def detachment_href(faction, detachment, detachment_slug=None):
    slug = detachment_slug or slugify_name(entity_name(detachment))
    return f"{faction_href(faction)}/detachment/{slug}/"

def normalize_rule_section_code(value):
    match = re.fullmatch(r"\s*(\d{1,2})(?:\..*)?\s*", str(value or ""))
    if not match:
        return ""
    return f"{int(match.group(1)):02d}"

def core_rule_section_href(section):
    code = normalize_rule_section_code(section.get("name", ""))
    return f"/codex/core-rules/section/{code}" if code else "/codex/core-rules/rules"

def app_header_context(hero_image=None, hero_image_url=None):
    if not hero_image_url and hero_image:
        hero_image_url = faction_image_url(hero_image)
    if not hero_image_url:
        return {"app_header_class": "", "app_header_style_attr": ""}
    return {
        "app_header_class": "faction-hero-title",
        "app_header_style_attr": f' style="--faction-hero-image: url(\'{hero_image_url}\');"',
    }

def render_header_title(value):
    return "<br>".join(escape_html(line) for line in str(value).splitlines())

def breadcrumb_label_from_segment(segment):
    labels = {
        "adeptus-astartes": "Adeptus Astartes",
        "army-rule": "Army Rule",
        "chaos": "Chaos",
        "core-rules": "Core Rules",
        "datasheets": "Data Sheets",
        "detachment": "Detachment",
        "detachments": "Detachments",
        "faq": "FAQ",
        "imperium": "Imperium",
        "rules": "Rules",
        "section": "Section",
        "stratagems": "Stratagems",
        "xenos": "Xenos",
    }
    if segment in labels:
        return labels[segment]
    return " ".join(part.capitalize() for part in segment.split("-") if part)

def default_breadcrumb_items(back_href):
    items = [{"label": "HereticTools", "href": "/"}]
    path = (back_href or "/").split("?", 1)[0].split("#", 1)[0].strip("/")
    segments = [segment for segment in path.split("/") if segment]

    if segments[:1] == ["codex"]:
        items.append({"label": "Codex", "href": "/codex"})
        href_segments = ["codex"]
        for segment in segments[1:]:
            href_segments.append(segment)
            if segment == "faction":
                continue
            label = breadcrumb_label_from_segment(segment)
            if not label:
                continue
            items.append({"label": label, "href": f'/{"/".join(href_segments)}'})
    return items

def render_breadcrumbs(back_href, breadcrumb_items=None):
    items = breadcrumb_items if breadcrumb_items is not None else default_breadcrumb_items(back_href)
    parts = []
    for index, item in enumerate(items):
        label = escape_html(item["label"])
        if index:
            parts.append('        <span class="breadcrumb-separator" aria-hidden="true">/</span>')
        parts.append(f'        <a class="breadcrumb-menu-item" href="{escape_attr(item["href"])}">{label}</a>')
    return '      <nav class="breadcrumb-menu" aria-label="Breadcrumb">\n' + "\n".join(parts) + "\n      </nav>"

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

def render_codex_page(
    title,
    header_title,
    task_title,
    page_class,
    grid_label,
    buttons,
    back_href,
    back_label,
    hero_image=None,
    hero_image_url=None,
    breadcrumb_items=None,
):
    if len(buttons) > 5:
        page_class = f"{page_class} many-buttons-page"

    return render_template(
        "codex.html",
        **app_header_context(hero_image, hero_image_url),
        document_title=escape_html(f"{title} - HereticTools"),
        page_class=escape_attr(page_class),
        title=escape_attr(title),
        header_title=render_header_title(header_title),
        breadcrumb_html=render_breadcrumbs(back_href, breadcrumb_items),
        grid_label=escape_attr(grid_label),
        buttons_html="\n".join(render_launcher(button) for button in buttons),
        back_href=escape_attr(back_href),
        back_label=escape_attr(back_label),
        task_title=escape_html(task_title),
    )

def render_codex_content_page(
    title,
    header_title,
    task_title,
    page_class,
    content_html,
    back_href,
    back_label,
    hero_image=None,
    hero_image_url=None,
    breadcrumb_items=None,
):
    return render_template(
        "codex_content.html",
        **app_header_context(hero_image, hero_image_url),
        document_title=escape_html(f"{title} - HereticTools"),
        page_class=escape_attr(page_class),
        title=escape_attr(title),
        header_title=render_header_title(header_title),
        breadcrumb_html=render_breadcrumbs(back_href, breadcrumb_items),
        content_html=content_html,
        back_href=escape_attr(back_href),
        back_label=escape_attr(back_label),
        task_title=escape_html(task_title),
    )

def render_codex_root_page():
    return render_codex_page(
        title="Codex",
        header_title="Codex",
        task_title="Codex",
        page_class="codex-root-page",
        grid_label="Codex sections",
        back_href="/",
        back_label="Back to HereticTools",
        buttons=[
            {
                "label": "Core Rules",
                "tag": "Reference",
                "route": "core-rules",
                "href": "/codex/core-rules",
                "image": CORE_RULES_IMAGE,
            },
            {
                "label": "Imperium",
                "route": "imperium",
                "href": "/codex/imperium",
                "image": find_faction_image("Agents of the Imperium", "2f81671f-3164-4ab0-93c0-4a99746b5996"),
            },
            {
                "label": "Chaos",
                "route": "chaos",
                "href": "/codex/chaos",
                "image": find_faction_image("Legiones Daemonica", "40a70c91-675a-4ac5-aa97-daedb9cb6f11"),
            },
            {
                "label": "Xenos",
                "route": "xenos",
                "href": "/codex/xenos",
                "image": find_faction_image("Orks", "0b30f1e3-1e5c-4823-afa1-07951433a270"),
            },
        ],
    )

def render_list_item(title, meta, href=None, extra_class="", badge_html=""):
    meta_html = f'<div class="list-item-meta">{escape_html(meta)}</div>' if meta else ""
    classes = " ".join(item for item in ("list-item", extra_class) if item)
    if href:
        return (
            f'<a class="{escape_attr(classes)}" href="{escape_attr(href)}">'
            f'<div class="list-item-title">{escape_html(title)}</div>'
            f'{meta_html}'
            f'{badge_html}'
            '</a>'
        )
    return (
        f'<div class="{escape_attr(classes)}">'
        f'<div class="list-item-title">{escape_html(title)}</div>'
        f'{meta_html}'
        f'{badge_html}'
        '</div>'
    )
