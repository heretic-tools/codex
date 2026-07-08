#!/usr/bin/env python3
from __future__ import annotations

import argparse

from build_static_site import add_static_build_arguments, build_from_args, print_build_result
from build_builder_site import (
    add_builder_site_arguments,
    build_builder_site_from_args,
    print_builder_site_build_result,
)
from build_beta_index import (
    add_beta_index_arguments,
    build_beta_index_from_args,
    print_beta_index_result,
)
from export_builder_data import (
    add_export_builder_data_arguments,
    export_builder_data_from_args,
    print_export_builder_data_result,
)


def parse_args():
    parser = argparse.ArgumentParser(
        prog="builder",
        description="HereticTools build CLI.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    build_parser = subparsers.add_parser(
        "build",
        help="Build the static HereticTools site.",
    )
    add_static_build_arguments(build_parser)

    build_builder_parser = subparsers.add_parser(
        "build-builder",
        help="Build the standalone static Builder app.",
    )
    add_builder_site_arguments(build_builder_parser)

    build_beta_index_parser = subparsers.add_parser(
        "build-beta-index",
        help="Build the HereticTools beta index page.",
    )
    add_beta_index_arguments(build_beta_index_parser)

    export_builder_data_parser = subparsers.add_parser(
        "export-builder-data",
        help="Export catalog-only builder data for a static client.",
    )
    add_export_builder_data_arguments(export_builder_data_parser)

    return parser.parse_args()


def main():
    args = parse_args()
    if args.command == "build":
        print_build_result(build_from_args(args))
        return
    if args.command == "build-builder":
        print_builder_site_build_result(build_builder_site_from_args(args))
        return
    if args.command == "build-beta-index":
        print_beta_index_result(build_beta_index_from_args(args))
        return
    if args.command == "export-builder-data":
        print_export_builder_data_result(export_builder_data_from_args(args))
        return
    raise SystemExit(f"Unknown command: {args.command}")


if __name__ == "__main__":
    main()
