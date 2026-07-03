from roster_builder_codex_rich_text import (
    escape_html,
    normalize_rule_text,
    render_rich_text,
    render_rule_component,
)

def render_section_title(title):
    return f'<h2 class="detachment-section-title">{escape_html(title)}</h2>'

def render_rule_body_with_title(title, components_html):
    """Merge the rule name into the first rule-card so the name and its text are
    a single block, not two separate cards."""
    title_html = f'<h2 class="rule-card-title">{escape_html(title)}</h2>'
    if components_html.lstrip().startswith("<section"):
        idx = components_html.find(">")
        return components_html[:idx + 1] + title_html + components_html[idx + 1:]
    return f'<section class="rule-card">{title_html}</section>{components_html}'

def render_rule_article(title, components):
    components_html = "".join(render_rule_component(component) for component in components)
    return (
        '<article class="codex-content">'
        f'{render_rule_body_with_title(title, components_html)}'
        '</article>'
    )

def render_lore_block(text, current_rule_reference=None):
    if not text or not normalize_rule_text(text):
        return ""
    return f'<div class="detachment-lore lore-flavor-card">{render_rich_text(text, current_rule_reference)}</div>'

def render_stratagem_rule(label, text, current_rule_reference=None):
    if not text or not normalize_rule_text(text):
        return ""
    return (
        '<div class="stratagem-rule-block">'
        f'<div class="stratagem-rule-label">{escape_html(label)}</div>'
        f'{render_rich_text(text, current_rule_reference)}'
        '</div>'
    )

def render_stratagem_card(stratagem, current_rule_reference=None):
    tags = []
    if stratagem.get("cpCost"):
        tags.append(f'{stratagem["cpCost"]} CP')
    if stratagem.get("category"):
        tags.append(stratagem["category"])
    tag_html = "".join(f'<span class="unit-card-tag">{escape_html(tag)}</span>' for tag in tags)
    secondary_label = "Secondary Effect"
    if stratagem.get("secondaryEffectAdditionalCPCost") is not None:
        secondary_label = f'Secondary Effect (+{stratagem["secondaryEffectAdditionalCPCost"]} CP)'
    pieces = [
        render_stratagem_rule("When", stratagem.get("whenRules"), current_rule_reference),
        render_stratagem_rule("Target", stratagem.get("targetRules"), current_rule_reference),
        render_stratagem_rule("Effect", stratagem.get("effectRules"), current_rule_reference),
        render_stratagem_rule("Restrictions", stratagem.get("restrictionRules"), current_rule_reference),
        render_stratagem_rule(secondary_label, stratagem.get("secondaryEffect"), current_rule_reference),
    ]
    lore_html = render_lore_block(stratagem["lore"], current_rule_reference) if stratagem.get("lore") else ""
    return (
        '<section class="rule-card detachment-feature-card stratagem-card">'
        '<div class="unit-card-heading">'
        f'<h3>{escape_html(stratagem["name"])}</h3>'
        f'<div class="detachment-tag-row">{tag_html}</div>'
        '</div>'
        f'{lore_html}'
        f'{"".join(piece for piece in pieces if piece)}'
        '</section>'
    )
