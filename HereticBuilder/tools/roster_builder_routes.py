import re
import unicodedata
from collections import defaultdict


def slugify_name(value):
    text = str(value or "").replace("’", "").replace("'", "").replace("`", "")
    normalized = unicodedata.normalize("NFKD", text)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_text).strip("-").lower()
    return slug or "item"


def scoped_slug_map(rows, scope_key=None, name_key="name", id_key="id"):
    counts = defaultdict(int)
    slug_by_id = {}
    for row in rows:
        scope = row[scope_key] if scope_key else ""
        base = slugify_name(row[name_key])
        counts[(scope, base)] += 1
        index = counts[(scope, base)]
        slug_by_id[row[id_key]] = base if index == 1 else f"{base}-{index}"
    return slug_by_id


def resolve_entity_ref(rows, ref, scope_key=None, name_key="name", id_key="id"):
    ref_text = str(ref or "").strip()
    if not ref_text:
        return None

    for row in rows:
        if row[id_key] == ref_text:
            return row[id_key]

    slug = slugify_name(ref_text)
    slug_by_id = scoped_slug_map(rows, scope_key=scope_key, name_key=name_key, id_key=id_key)
    for row in rows:
        if slug_by_id[row[id_key]] == slug:
            return row[id_key]
    return None
