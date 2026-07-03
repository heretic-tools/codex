import re

from roster_builder_codex_rich_text import normalize_rule_text
from roster_builder_codex import (
    datasheet_href as codex_datasheet_href,
    detachment_href as codex_detachment_href,
    faction_href as codex_faction_href,
    visible_codex_datasheets_for_faction,
)
from roster_builder_routes import scoped_slug_map


CORE_RULES_PUBLICATION_ID = "4cdf7a87-0914-49e8-b5df-b9f8be4d13c6"
MAX_SEARCH_LIMIT = 50

def compact_text(*values):
    chunks = []
    for value in values:
        text = normalize_rule_text(value)
        if text:
            text = re.sub(r"\*+", "", text).replace("■", " ")
            chunks.append(text)
    return " ".join(" ".join(chunks).split())

def search_tokens(value):
    return re.findall(r"[\w']+", compact_text(value).casefold())

def normalize_rule_section_code(value):
    match = re.fullmatch(r"\s*(\d{1,2})(?:\..*)?\s*", str(value or ""))
    if not match:
        return ""
    return f"{int(match.group(1)):02d}"

def faction_href(faction_name):
    return codex_faction_href(faction_name)

def codex_route_maps(builder):
    cached = getattr(builder, "_codex_search_route_maps", None)
    if cached is not None:
        return cached

    datasheet_routes = {}
    detachment_routes = {}
    for faction in builder.bootstrap()["factions"]:
        native_datasheets, allied_datasheets = visible_codex_datasheets_for_faction(builder, faction["id"])
        datasheets = [
            {**datasheet, "allyType": "native"}
            for datasheet in native_datasheets
        ] + [
            {**datasheet, "allyType": "allied"}
            for datasheet in allied_datasheets
        ]
        datasheet_slug_by_id = scoped_slug_map(datasheets)
        for datasheet in datasheets:
            datasheet_routes[(faction["id"], datasheet["id"])] = codex_datasheet_href(
                faction,
                datasheet,
                datasheet_slug_by_id[datasheet["id"]],
            )

        detachments = builder.detachments(faction["id"]).get("detachments", [])
        detachment_slug_by_id = scoped_slug_map(detachments)
        for detachment in detachments:
            detachment_routes[(faction["id"], detachment["id"])] = codex_detachment_href(
                faction,
                detachment,
                detachment_slug_by_id[detachment["id"]],
            )

    cached = {"datasheets": datasheet_routes, "detachments": detachment_routes}
    setattr(builder, "_codex_search_route_maps", cached)
    return cached

def clipped_excerpt(text, query, tokens, length=180):
    source = compact_text(text)
    if not source:
        return ""
    source_folded = source.casefold()
    query_index = source_folded.find(query)
    indexes = [query_index] if query_index >= 0 else [
        source_folded.find(token)
        for token in tokens
        if source_folded.find(token) >= 0
    ]
    start = min(indexes) if indexes else 0
    start = max(0, start - 48)
    end = min(len(source), start + length)
    excerpt = source[start:end].strip()
    if start > 0:
        excerpt = f"...{excerpt}"
    if end < len(source):
        excerpt = f"{excerpt}..."
    return excerpt

def result_score(item, query, tokens):
    title = compact_text(item["title"]).casefold()
    meta = compact_text(item.get("meta")).casefold()
    text = compact_text(item.get("text")).casefold()
    haystack = f"{title} {meta} {text}"
    if not all(token in haystack for token in tokens):
        return None

    score = 0
    if title == query:
        score += 300
    elif title.startswith(query):
        score += 220
    elif query in title:
        score += 160
    elif query in meta:
        score += 80
    elif query in text:
        score += 40

    for token in tokens:
        if title.startswith(token):
            score += 60
        elif token in title:
            score += 45
        elif token in meta:
            score += 25
        elif token in text:
            score += 10
    return score

def match_results(items, query, limit):
    query_text = compact_text(query).casefold()
    tokens = search_tokens(query)
    if not query_text or not tokens:
        return []

    matched = []
    seen = set()
    for item in items:
        if not item.get("title") or not item.get("href"):
            continue
        key = (item.get("type"), item["title"].casefold(), item["href"])
        if key in seen:
            continue
        seen.add(key)
        score = result_score(item, query_text, tokens)
        if score is None:
            continue
        matched.append({
            "score": score,
            "type": item.get("type") or "Result",
            "title": compact_text(item["title"]),
            "meta": compact_text(item.get("meta")),
            "excerpt": clipped_excerpt(item.get("text"), query_text, tokens),
            "href": item["href"],
        })

    matched.sort(key=lambda item: (-item["score"], item["type"], item["title"].casefold()))
    return [
        {key: value for key, value in item.items() if key != "score"}
        for item in matched[:limit]
    ]
