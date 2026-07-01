#!/usr/bin/env python3
from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path

from build_static_site import (
    CONFIG_FILENAME,
    PROJECT_ROOT,
    copy_assets,
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


def write_builder_page(out_dir, base_path):
    html = inject_static_config(render_template("builder.html"), base_path)
    (out_dir / "index.html").write_text(html, encoding="utf-8")
    (out_dir / "404.html").write_text(html, encoding="utf-8")


def build_builder_site(config):
    if not config.db.exists():
        raise SystemExit(f"Database does not exist: {config.db}")

    out_dir = prepare_out_dir(config.out, protected_dirs=(config.source,))
    copy_assets(out_dir)
    write_builder_page(out_dir, config.base_path)
    data_result = export_builder_data(config.db, out_dir / "builder-data")
    return BuilderSiteBuildResult(
        out_dir=out_dir,
        base_path=config.base_path,
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
    print(f"Data version: {result.data_version}")
    print(f"Builder data files: {result.data_file_count}")


def main():
    print_builder_site_build_result(build_builder_site_from_args(parse_args()))


if __name__ == "__main__":
    main()
