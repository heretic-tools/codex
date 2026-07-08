#!/usr/bin/env python3
from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path

from build_static_site import PROJECT_ROOT, normalize_base_path, prepare_out_dir, resolve_project_path


@dataclass(frozen=True)
class BetaIndexBuildResult:
    out_dir: Path
    base_path: str


def add_beta_index_arguments(parser):
    parser.add_argument("--out", default="dist/beta", help="Output directory for the beta index.")
    parser.add_argument("--base-path", default="", help="GitHub Pages base path for the beta index.")


def beta_href(base_path: str, child: str) -> str:
    return f"{base_path}/{child}/" if base_path else f"/{child}/"


def render_beta_index(base_path: str) -> str:
    codex_href = beta_href(base_path, "codex")
    builder_href = beta_href(base_path, "builder")
    return f"""<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>HereticTools Beta</title>
  <style>
    :root {{
      color-scheme: dark;
      --bg: #181818;
      --panel: #242424;
      --panel-strong: #2f2f2f;
      --text: #f4f4f4;
      --muted: #b7b7b7;
      --line: #3a3a3a;
    }}
    * {{ box-sizing: border-box; }}
    html, body {{ min-height: 100%; }}
    body {{
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }}
    main {{
      min-height: 100vh;
      display: grid;
      align-content: center;
      gap: 20px;
      width: min(680px, 100%);
      margin: 0 auto;
      padding: 24px;
    }}
    h1 {{
      margin: 0;
      font-size: clamp(2rem, 8vw, 4.75rem);
      line-height: 0.95;
      letter-spacing: 0;
    }}
    p {{
      margin: 0;
      color: var(--muted);
      font-size: 1rem;
      line-height: 1.5;
    }}
    nav {{
      display: grid;
      gap: 0;
      border-block: 1px solid var(--line);
      margin-top: 8px;
    }}
    a {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 64px;
      padding: 16px 0;
      color: var(--text);
      text-decoration: none;
      border-bottom: 1px solid var(--line);
      font-size: 1.125rem;
      font-weight: 650;
    }}
    a:last-child {{ border-bottom: 0; }}
    a:hover, a:focus-visible {{
      background: var(--panel);
      outline: 0;
    }}
    span {{
      color: var(--muted);
      font-size: 0.875rem;
      font-weight: 500;
    }}
  </style>
</head>
<body>
  <main>
    <h1>HereticTools Beta</h1>
    <p>Isolated beta entry points for testing the next Codex and Builder builds without changing production paths.</p>
    <nav aria-label="Beta apps">
      <a href="{codex_href}">Codex <span>/beta/codex</span></a>
      <a href="{builder_href}">Builder <span>/beta/builder</span></a>
    </nav>
  </main>
</body>
</html>
"""


def build_beta_index(out: Path | str, base_path: str) -> BetaIndexBuildResult:
    out_dir = prepare_out_dir(resolve_project_path(out, PROJECT_ROOT))
    normalized_base_path = normalize_base_path(base_path)
    (out_dir / "index.html").write_text(render_beta_index(normalized_base_path), encoding="utf-8")
    return BetaIndexBuildResult(out_dir=out_dir, base_path=normalized_base_path)


def build_beta_index_from_args(args) -> BetaIndexBuildResult:
    return build_beta_index(args.out, args.base_path)


def print_beta_index_result(result: BetaIndexBuildResult) -> None:
    print(f"Beta index: {result.out_dir}")
    print(f"Base path: {result.base_path or '/'}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build HereticTools beta index.")
    add_beta_index_arguments(parser)
    print_beta_index_result(build_beta_index_from_args(parser.parse_args()))


if __name__ == "__main__":
    main()
