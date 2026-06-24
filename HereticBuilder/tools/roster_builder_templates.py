from pathlib import Path


HERETIC_BUILDER_ROOT = Path(__file__).resolve().parents[1]
TEMPLATE_ROOT = HERETIC_BUILDER_ROOT / "templates"


def _resolve_template(name):
    path = (TEMPLATE_ROOT / name).resolve()
    if path != TEMPLATE_ROOT and TEMPLATE_ROOT not in path.parents:
        raise ValueError(f"Invalid template path: {name}")
    return path


def render_template(name, **context):
    template = _resolve_template(name).read_text(encoding="utf-8")
    for key, value in context.items():
        template = template.replace(f"{{{{ {key} }}}}", str(value))
    return template
