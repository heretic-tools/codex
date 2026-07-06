#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import re
import shutil
from dataclasses import dataclass
from pathlib import Path

from build_static_site import (
    CONFIG_FILENAME,
    HERETIC_BUILDER_ROOT,
    PROJECT_ROOT,
    STATIC_ROOT,
    inject_static_config,
    load_toml_config,
    merge_profile_config,
    normalize_base_path,
    prepare_out_dir,
    resolve_config_path,
    resolve_project_path,
    resolve_source_path,
)
from export_builder_data import export_builder_data
from roster_builder_templates import render_template

BUILDER_STATIC_SUPPORT_FILES = (
    "desktop.css",
    "codex.css",
    "win-scrollbars.js",
    "builder.css",
)

BUILDER_ICON_FILES = (
    "boosty.png",
)


@dataclass(frozen=True)
class BuilderSiteConfig:
    db: Path
    out: Path
    base_path: str
    source: Path
    config: Path | None = None
    profile: str | None = None


@dataclass(frozen=True)
class BuilderSiteBuildResult:
    out_dir: Path
    base_path: str
    asset_version: str
    data_version: int
    data_file_count: int


def builder_site_config_from_args(args):
    source_dir = resolve_source_path(args.source)
    config_path = resolve_config_path(source_dir, args.config)
    raw_config = merge_profile_config(load_toml_config(config_path), args.profile)

    db = args.db if args.db is not None else raw_config.get("db", "data/heretic_db.sqlite")
    out = args.out if args.out is not None else raw_config.get("out", "dist")
    base_path = args.base_path if args.base_path is not None else raw_config.get("base_path", "")

    return BuilderSiteConfig(
        db=resolve_project_path(db, source_dir),
        out=resolve_project_path(out, source_dir),
        base_path=normalize_base_path(base_path),
        source=source_dir,
        config=config_path,
        profile=args.profile,
    )


def builder_asset_version():
    digest = hashlib.sha256()
    for path in sorted((PROJECT_ROOT / "HereticBuilder" / "static").glob("builder*.js")):
        digest.update(path.name.encode("utf-8"))
        digest.update(path.read_bytes())
    for path in [
        PROJECT_ROOT / "HereticBuilder" / "static" / "builder.css",
        PROJECT_ROOT / "HereticBuilder" / "templates" / "builder.html",
    ]:
        digest.update(path.name.encode("utf-8"))
        digest.update(path.read_bytes())
    return digest.hexdigest()[:12]


def write_builder_page(out_dir, base_path, asset_version):
    html = render_template("builder.html").replace("__BUILDER_ASSET_VERSION__", asset_version)
    html = inject_static_config(html, base_path)
    (out_dir / "index.html").write_text(html, encoding="utf-8")
    (out_dir / "404.html").write_text(html, encoding="utf-8")


def copy_file(src, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)


def copy_builder_assets(out_dir):
    static_dir = out_dir / "static"
    for path in sorted(STATIC_ROOT.glob("builder*.js")):
        copy_file(path, static_dir / path.name)
    for filename in BUILDER_STATIC_SUPPORT_FILES:
        copy_file(STATIC_ROOT / filename, static_dir / filename)

    source_assets = HERETIC_BUILDER_ROOT / "assets"
    unit_images_dir = source_assets / "unit-images"
    for path in sorted(unit_images_dir.glob("*.png")):
        copy_file(path, out_dir / "assets" / "unit-images" / path.name)
    for filename in BUILDER_ICON_FILES:
        copy_file(source_assets / "icons" / filename, out_dir / "assets" / "icons" / filename)
    (out_dir / ".nojekyll").write_text("", encoding="utf-8")


def version_builder_static_imports(out_dir, asset_version):
    static_dir = out_dir / "static"
    if not static_dir.exists():
        return

    def versioned(specifier):
        if not specifier.startswith("./") or not specifier.endswith(".js"):
            return specifier
        return f"{specifier}?v={asset_version}"

    patterns = [
        re.compile(r'((?:import|export)\s+(?:[^"\']+\s+from\s+)?["\'])(\./[^"\']+\.js)(["\'])'),
        re.compile(r'(import\(\s*["\'])(\./[^"\']+\.js)(["\']\s*\))'),
    ]
    for path in static_dir.glob("builder*.js"):
        source = path.read_text(encoding="utf-8")
        for pattern in patterns:
            source = pattern.sub(lambda match: f"{match.group(1)}{versioned(match.group(2))}{match.group(3)}", source)
        path.write_text(source, encoding="utf-8")


def build_builder_site(config):
    if not config.db.exists():
        raise SystemExit(f"Database does not exist: {config.db}")

    out_dir = prepare_out_dir(config.out, protected_dirs=(config.source,))
    asset_version = builder_asset_version()
    copy_builder_assets(out_dir)
    version_builder_static_imports(out_dir, asset_version)
    write_builder_page(out_dir, config.base_path, asset_version)
    data_result = export_builder_data(config.db, out_dir / "builder-data")
    return BuilderSiteBuildResult(
        out_dir=out_dir,
        base_path=config.base_path,
        asset_version=asset_version,
        data_version=data_result.data_version,
        data_file_count=data_result.file_count,
    )


def add_builder_site_arguments(parser):
    parser.add_argument("--source", default=str(PROJECT_ROOT), help="Project source directory")
    parser.add_argument("--config", help=f"Build config path, defaults to {CONFIG_FILENAME} under --source")
    parser.add_argument("--profile", help="Build profile from the config file")
    parser.add_argument("--db", help="SQLite database path")
    parser.add_argument("--out", help="Output directory")
    parser.add_argument("--base-path", help="Site base path, e.g. /builder for project Pages")
    return parser


def parse_args():
    parser = argparse.ArgumentParser(description="Build the standalone static Heretic Builder app.")
    add_builder_site_arguments(parser)
    return parser.parse_args()


def build_builder_site_from_args(args):
    return build_builder_site(builder_site_config_from_args(args))


def print_builder_site_build_result(result):
    print(f"Builder site: {result.out_dir}")
    print(f"Base path: {result.base_path or '/'}")
    print(f"Asset version: {result.asset_version}")
    print(f"Data version: {result.data_version}")
    print(f"Builder data files: {result.data_file_count}")


def main():
    print_builder_site_build_result(build_builder_site_from_args(parse_args()))


if __name__ == "__main__":
    main()
