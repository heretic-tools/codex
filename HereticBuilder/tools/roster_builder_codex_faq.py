import re

from roster_builder_codex_common import (
    CORE_RULES_INFERRED_FAQ_REFERENCES,
    CORE_RULES_PUBLICATION_ID,
    FAQ_RELATION_COLUMNS,
)
from roster_builder_codex_rich_text import (
    escape_html,
    normalize_rule_reference_code,
    normalize_rule_text,
    render_rich_text,
)
from roster_builder_utils import dict_row

def has_errata(faq):
    return bool(normalize_rule_text(faq.get("errataHeader")) or normalize_rule_text(faq.get("errataText")))

def has_faq(faq):
    return bool(normalize_rule_text(faq.get("question")) or normalize_rule_text(faq.get("answer")))

def render_errata_card(faq, current_rule_reference=None):
    pieces = []
    if normalize_rule_text(faq.get("errataHeader")):
        pieces.append(f'<h3>{escape_html(normalize_rule_text(faq["errataHeader"]))}</h3>')
    if normalize_rule_text(faq.get("errataText")):
        pieces.append(render_rich_text(faq["errataText"], current_rule_reference))
    if not pieces:
        return ""
    return f'<section class="rule-card faq-card errata-card"><div class="faq-card-kicker">Errata</div>{"".join(pieces)}</section>'

def render_faq_card(faq, current_rule_reference=None):
    pieces = []
    if normalize_rule_text(faq.get("question")):
        pieces.append(f'<div class="faq-question">{render_rich_text(faq["question"], current_rule_reference)}</div>')
    if normalize_rule_text(faq.get("answer")):
        pieces.append(f'<div class="faq-answer">{render_rich_text(faq["answer"], current_rule_reference)}</div>')
    if not pieces:
        return ""
    return f'<section class="rule-card faq-card question-card"><div class="faq-card-kicker">FAQ</div>{"".join(pieces)}</section>'

def render_faq_section(title, faqs, current_rule_reference=None):
    cards = "".join(render_faq_card(faq, current_rule_reference) for faq in faqs if has_faq(faq))
    if not cards:
        return ""
    title_html = f'<h2 class="detachment-section-title">{escape_html(title)}</h2>' if title else ""
    return (
        f'<section class="codex-content faq-section">'
        f'{title_html}'
        f'{cards}'
        f'</section>'
    )

def render_errata_section(title, faqs, current_rule_reference=None):
    cards = "".join(render_errata_card(faq, current_rule_reference) for faq in faqs if has_errata(faq))
    if not cards:
        return ""
    title_html = f'<h2 class="detachment-section-title">{escape_html(title)}</h2>' if title else ""
    return (
        f'<section class="codex-content faq-section errata-section">'
        f'{title_html}'
        f'{cards}'
        f'</section>'
    )

def render_faq_update_sections(faqs, errata_title="Errata", faq_title="FAQ", current_rule_reference=None):
    return (
        render_errata_section(errata_title, faqs, current_rule_reference)
        + render_faq_section(faq_title, faqs, current_rule_reference)
    )

def faqs_for_entity(heretic_builder, relation_column, relation_id):
    if relation_column not in FAQ_RELATION_COLUMNS:
        raise ValueError("Unsupported FAQ relation")
    if not relation_id:
        return []
    with heretic_builder.connect(readonly=True) as conn:
        rows = conn.execute(
            f"""
            select distinct f.id, f.errataHeader, f.errataText, f.question, f.answer, f.displayOrder
            from faq_config fc
            join faq f on f.id = fc.faqId
            where fc.{relation_column} = ?
            order by f.displayOrder, f.id
            """,
            [relation_id],
        ).fetchall()
    return [dict_row(row) for row in rows]

def attach_faqs(heretic_builder, items, relation_column):
    for item in items:
        item["faqs"] = faqs_for_entity(heretic_builder, relation_column, item["id"])
    return items

def rule_reference_codes_from_faq(faq):
    text = " ".join(
        str(faq.get(key) or "")
        for key in ("errataHeader", "errataText", "question", "answer")
    )
    return {
        normalize_rule_reference_code(match.group(1))
        for match in re.finditer(r"\((\d{1,2}(?:\.\d{1,2})?)\)", text)
        if normalize_rule_reference_code(match.group(1))
    }

def related_faqs_for_core_rule(conn, rule_container_id, reference):
    normalized = normalize_rule_reference_code(reference)
    faq_by_id = {}
    explicit_rows = conn.execute(
        """
        select f.id, f.errataHeader, f.errataText, f.question, f.answer, f.displayOrder
        from faq_config fc
        join faq f on f.id = fc.faqId
        where fc.ruleContainerId = ?
        """,
        [rule_container_id],
    ).fetchall()
    for row in explicit_rows:
        faq = dict_row(row)
        faq_by_id[faq["id"]] = faq

    core_rows = conn.execute(
        """
        select id, errataHeader, errataText, question, answer, displayOrder
        from faq
        where publicationId = ?
        """,
        [CORE_RULES_PUBLICATION_ID],
    ).fetchall()
    for row in core_rows:
        faq = dict_row(row)
        inferred_codes = set(CORE_RULES_INFERRED_FAQ_REFERENCES.get(faq["id"], ()))
        inferred_codes.update(rule_reference_codes_from_faq(faq))
        if normalized in inferred_codes:
            faq_by_id[faq["id"]] = faq

    return sorted(faq_by_id.values(), key=lambda faq: (faq["displayOrder"], faq["id"]))
