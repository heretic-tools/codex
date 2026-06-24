#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import re
import shutil
import sqlite3
import struct
import subprocess
import sys
import tempfile
import unicodedata
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DB = PROJECT_ROOT / "data" / "heretic_db.sqlite"
DEFAULT_OUTPUT_DIR = PROJECT_ROOT / "generated" / "unit_images_90s"


@dataclass(frozen=True)
class ImageJob:
    datasheet_id: str
    name: str
    kind: str
    url: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Download unit images from datasheet.bannerImage/rowImage and "
            "convert them to a low-pixel, limited-palette 90s-style PNG set."
        )
    )
    parser.add_argument("--db", type=Path, default=DEFAULT_DB, help="SQLite DB path.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help="Directory for generated PNGs, source cache, and manifest.csv.",
    )
    parser.add_argument(
        "--source-cache",
        type=Path,
        default=None,
        help="Directory for downloaded originals. Defaults to OUTPUT/source_cache.",
    )
    parser.add_argument(
        "--kind",
        choices=("all", "banner", "row"),
        default="all",
        help="Which datasheet image column to process.",
    )
    parser.add_argument("--name", help="Only process datasheets whose name contains this text.")
    parser.add_argument("--limit", type=int, help="Process at most this many images.")
    parser.add_argument(
        "--max-side",
        type=int,
        default=96,
        help="Longest side in the low-resolution intermediate image.",
    )
    parser.add_argument("--scale", type=int, default=4, help="Nearest-neighbor upscale factor.")
    parser.add_argument("--colors", type=int, default=16, help="Palette size, 2..256.")
    parser.add_argument(
        "--engine",
        choices=("auto", "pillow", "sips"),
        default="auto",
        help="Image engine. 'sips' is a macOS fallback when Pillow is not installed.",
    )
    parser.add_argument(
        "--dither",
        choices=("none", "floyd-steinberg"),
        default="floyd-steinberg",
        help="Dithering mode for palette reduction.",
    )
    parser.add_argument(
        "--background",
        default="#ffffff",
        help="RGB background for images with transparency, as #rrggbb.",
    )
    parser.add_argument("--timeout", type=float, default=30.0, help="Download timeout in seconds.")
    parser.add_argument("--force", action="store_true", help="Regenerate existing outputs.")
    parser.add_argument(
        "--skip-download",
        action="store_true",
        help="Only use files already present in the source cache.",
    )
    parser.add_argument(
        "--print-urls",
        action="store_true",
        help="Print the image URL list as CSV and do not download or process images.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show how many images would be processed without downloading or writing files.",
    )
    return parser.parse_args()


def validate_args(args: argparse.Namespace) -> None:
    if args.limit is not None and args.limit < 1:
        raise SystemExit("--limit must be at least 1")
    if args.max_side < 1:
        raise SystemExit("--max-side must be at least 1")
    if args.scale < 1:
        raise SystemExit("--scale must be at least 1")
    if not 2 <= args.colors <= 256:
        raise SystemExit("--colors must be between 2 and 256")
    parse_hex_color(args.background)


def load_jobs(db_path: Path, kind: str, name_filter: str | None, limit: int | None) -> list[ImageJob]:
    if not db_path.exists():
        raise SystemExit(f"DB not found: {db_path}")

    with sqlite3.connect(db_path) as conn:
        rows = conn.execute(
            """
            select id, name, bannerImage, rowImage
            from datasheet
            where bannerImage is not null or rowImage is not null
            order by name, id
            """
        ).fetchall()

    jobs: list[ImageJob] = []
    name_filter_lower = name_filter.lower() if name_filter else None
    for datasheet_id, name, banner_url, row_url in rows:
        if name_filter_lower and name_filter_lower not in name.lower():
            continue
        if kind in ("all", "banner") and banner_url:
            jobs.append(ImageJob(datasheet_id, name, "banner", banner_url))
        if kind in ("all", "row") and row_url:
            jobs.append(ImageJob(datasheet_id, name, "row", row_url))
        if limit is not None and len(jobs) >= limit:
            return jobs[:limit]
    return jobs


def print_urls(jobs: list[ImageJob]) -> None:
    writer = csv.writer(sys.stdout)
    writer.writerow(["id", "name", "kind", "url"])
    for job in jobs:
        writer.writerow([job.datasheet_id, job.name, job.kind, job.url])


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_value).strip("-").lower()
    return slug or "unit"


def output_name(job: ImageJob) -> str:
    return f"{slugify(job.name)}__{job.datasheet_id[:8]}__{job.kind}.png"


def source_name(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest() + ".source"


def parse_hex_color(value: str) -> tuple[int, int, int]:
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", value):
        raise SystemExit("--background must look like #ffffff")
    return tuple(int(value[index : index + 2], 16) for index in (1, 3, 5))


def import_pillow():
    try:
        from PIL import Image, ImageOps
    except ModuleNotFoundError as exc:
        raise RuntimeError("Pillow is not installed") from exc
    return Image, ImageOps


def read_source(job: ImageJob, source_path: Path, timeout: float, skip_download: bool, force: bool) -> bytes:
    if source_path.exists() and not force:
        return source_path.read_bytes()
    if skip_download:
        raise FileNotFoundError(f"missing cached source: {source_path}")

    request = urllib.request.Request(
        job.url,
        headers={"User-Agent": "HereticSheets-unit-image-pixelizer/1.0"},
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            data = response.read()
    except urllib.error.URLError as exc:
        raise RuntimeError(f"download failed: {exc}") from exc

    source_path.write_bytes(data)
    return data


def resize_to_max_side(image, max_side: int):
    width, height = image.size
    ratio = max_side / max(width, height)
    low_width = max(1, round(width * ratio))
    low_height = max(1, round(height * ratio))
    return image.resize((low_width, low_height), resample=resample_mode(image, "BILINEAR"))


def resample_mode(image, name: str):
    resampling = getattr(image.__class__, "Resampling", None)
    if resampling is not None:
        return getattr(resampling, name)
    return getattr(image.__class__, name)


def quantize_mode(image, name: str):
    quantize = getattr(image.__class__, "Quantize", None)
    if quantize is not None:
        return getattr(quantize, name)
    return getattr(image.__class__, name)


def dither_mode(image, enabled: bool):
    dither = getattr(image.__class__, "Dither", None)
    if dither is not None:
        return dither.FLOYDSTEINBERG if enabled else dither.NONE
    return image.__class__.FLOYDSTEINBERG if enabled else image.__class__.NONE


def flatten_to_rgb(image, image_ops, background: tuple[int, int, int]):
    image = image_ops.exif_transpose(image)
    if image.mode in ("RGBA", "LA") or "transparency" in image.info:
        rgba = image.convert("RGBA")
        base = image.__class__.new("RGBA", rgba.size, (*background, 255))
        base.alpha_composite(rgba)
        return base.convert("RGB")
    return image.convert("RGB")


def pixelize_with_pillow(data: bytes, output_path: Path, args: argparse.Namespace) -> dict[str, int | str]:
    Image, ImageOps = import_pillow()
    background = parse_hex_color(args.background)

    with Image.open(io.BytesIO(data)) as opened:
        original_width, original_height = opened.size
        image = flatten_to_rgb(opened, ImageOps, background)

    low = resize_to_max_side(image, args.max_side)
    low_width, low_height = low.size
    palette = low.quantize(
        colors=args.colors,
        method=quantize_mode(low, "MEDIANCUT"),
        dither=dither_mode(low, args.dither == "floyd-steinberg"),
    )
    final = palette.resize(
        (low_width * args.scale, low_height * args.scale),
        resample=resample_mode(palette, "NEAREST"),
    )
    final.save(output_path, format="PNG", optimize=False)
    return {
        "engine": "pillow",
        "original_width": original_width,
        "original_height": original_height,
        "low_width": low_width,
        "low_height": low_height,
        "output_width": low_width * args.scale,
        "output_height": low_height * args.scale,
    }


def run_sips(command: list[str]) -> subprocess.CompletedProcess[str]:
    try:
        return subprocess.run(
            ["sips", *command],
            check=True,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError as exc:
        raise RuntimeError("macOS sips command is not available") from exc
    except subprocess.CalledProcessError as exc:
        message = exc.stderr.strip() or exc.stdout.strip() or str(exc)
        raise RuntimeError(f"sips failed: {message}") from exc


def read_bmp(path: Path) -> tuple[int, int, list[tuple[int, int, int]]]:
    data = path.read_bytes()
    if data[:2] != b"BM":
        raise ValueError(f"not a BMP file: {path}")

    pixel_offset = struct.unpack_from("<I", data, 10)[0]
    dib_size = struct.unpack_from("<I", data, 14)[0]
    if dib_size < 40:
        raise ValueError("unsupported BMP header")

    width = struct.unpack_from("<i", data, 18)[0]
    height_signed = struct.unpack_from("<i", data, 22)[0]
    planes = struct.unpack_from("<H", data, 26)[0]
    bits_per_pixel = struct.unpack_from("<H", data, 28)[0]
    compression = struct.unpack_from("<I", data, 30)[0]
    if planes != 1 or bits_per_pixel not in (24, 32) or compression not in (0, 3):
        raise ValueError(
            f"unsupported BMP encoding: planes={planes}, bpp={bits_per_pixel}, compression={compression}"
        )

    height = abs(height_signed)
    bytes_per_pixel = bits_per_pixel // 8
    row_stride = ((width * bits_per_pixel + 31) // 32) * 4
    rows: list[list[tuple[int, int, int]]] = []
    for row_index in range(height):
        source_row = row_index if height_signed < 0 else height - 1 - row_index
        start = pixel_offset + source_row * row_stride
        row: list[tuple[int, int, int]] = []
        for column in range(width):
            offset = start + column * bytes_per_pixel
            blue, green, red = data[offset : offset + 3]
            row.append((red, green, blue))
        rows.append(row)

    pixels = [pixel for row in rows for pixel in row]
    return width, height, pixels


def write_bmp(path: Path, width: int, height: int, pixels: list[tuple[int, int, int]]) -> None:
    bits_per_pixel = 24
    row_stride = ((width * bits_per_pixel + 31) // 32) * 4
    pixel_data_size = row_stride * height
    file_size = 14 + 40 + pixel_data_size

    header = bytearray()
    header += b"BM"
    header += struct.pack("<IHHI", file_size, 0, 0, 14 + 40)
    header += struct.pack("<IiiHHIIiiII", 40, width, height, 1, bits_per_pixel, 0, pixel_data_size, 2835, 2835, 0, 0)

    rows = bytearray()
    padding = b"\x00" * (row_stride - width * 3)
    for row_index in range(height - 1, -1, -1):
        start = row_index * width
        for red, green, blue in pixels[start : start + width]:
            rows += bytes((blue, green, red))
        rows += padding

    path.write_bytes(bytes(header + rows))


def median_cut_palette(pixels: list[tuple[int, int, int]], color_count: int) -> list[tuple[int, int, int]]:
    boxes = [pixels]
    while len(boxes) < color_count:
        box_index = max(
            range(len(boxes)),
            key=lambda index: color_range(boxes[index]) * len(boxes[index]),
        )
        box = boxes.pop(box_index)
        if len(box) <= 1 or color_range(box) == 0:
            boxes.append(box)
            break

        channel = widest_channel(box)
        box = sorted(box, key=lambda pixel: pixel[channel])
        midpoint = len(box) // 2
        boxes.append(box[:midpoint])
        boxes.append(box[midpoint:])

    return [average_color(box) for box in boxes if box]


def color_range(box: list[tuple[int, int, int]]) -> int:
    return max(max(pixel[channel] for pixel in box) - min(pixel[channel] for pixel in box) for channel in range(3))


def widest_channel(box: list[tuple[int, int, int]]) -> int:
    ranges = [max(pixel[channel] for pixel in box) - min(pixel[channel] for pixel in box) for channel in range(3)]
    return max(range(3), key=lambda channel: ranges[channel])


def average_color(box: list[tuple[int, int, int]]) -> tuple[int, int, int]:
    length = len(box)
    return tuple(round(sum(pixel[channel] for pixel in box) / length) for channel in range(3))


def nearest_color(pixel: tuple[int, int, int], palette: list[tuple[int, int, int]]) -> tuple[int, int, int]:
    red, green, blue = pixel
    return min(
        palette,
        key=lambda color: (red - color[0]) ** 2 + (green - color[1]) ** 2 + (blue - color[2]) ** 2,
    )


def clamp(value: float) -> int:
    return max(0, min(255, round(value)))


def quantize_pixels(
    width: int,
    height: int,
    pixels: list[tuple[int, int, int]],
    color_count: int,
    use_dither: bool,
) -> list[tuple[int, int, int]]:
    palette = median_cut_palette(pixels, color_count)
    nearest_cache: dict[tuple[int, int, int], tuple[int, int, int]] = {}

    if not use_dither:
        reduced = []
        for pixel in pixels:
            if pixel not in nearest_cache:
                nearest_cache[pixel] = nearest_color(pixel, palette)
            reduced.append(nearest_cache[pixel])
        return reduced

    work = [[float(channel) for channel in pixel] for pixel in pixels]
    reduced = [(0, 0, 0)] * len(pixels)
    for y in range(height):
        for x in range(width):
            index = y * width + x
            old = tuple(clamp(channel) for channel in work[index])
            if old not in nearest_cache:
                nearest_cache[old] = nearest_color(old, palette)
            new = nearest_cache[old]
            reduced[index] = new
            error = [old[channel] - new[channel] for channel in range(3)]
            for dx, dy, factor in ((1, 0, 7 / 16), (-1, 1, 3 / 16), (0, 1, 5 / 16), (1, 1, 1 / 16)):
                nx = x + dx
                ny = y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    target = ny * width + nx
                    for channel in range(3):
                        work[target][channel] += error[channel] * factor
    return reduced


def scale_pixels(
    width: int,
    height: int,
    pixels: list[tuple[int, int, int]],
    scale: int,
) -> tuple[int, int, list[tuple[int, int, int]]]:
    if scale == 1:
        return width, height, pixels

    scaled_width = width * scale
    scaled_height = height * scale
    scaled: list[tuple[int, int, int]] = []
    for y in range(height):
        row = pixels[y * width : (y + 1) * width]
        scaled_row: list[tuple[int, int, int]] = []
        for pixel in row:
            scaled_row.extend([pixel] * scale)
        for _ in range(scale):
            scaled.extend(scaled_row)
    return scaled_width, scaled_height, scaled


def pixelize_with_sips(source_path: Path, output_path: Path, args: argparse.Namespace) -> dict[str, int | str]:
    if shutil.which("sips") is None:
        raise RuntimeError("macOS sips command is not available")

    with tempfile.TemporaryDirectory(prefix="pixelizer-", dir=str(output_path.parent)) as temp_dir:
        temp_path = Path(temp_dir)
        low_bmp = temp_path / "low.bmp"
        final_bmp = temp_path / "final.bmp"
        run_sips(["-s", "format", "bmp", "-Z", str(args.max_side), str(source_path), "--out", str(low_bmp)])

        low_width, low_height, pixels = read_bmp(low_bmp)
        reduced = quantize_pixels(
            low_width,
            low_height,
            pixels,
            args.colors,
            args.dither == "floyd-steinberg",
        )
        output_width, output_height, scaled = scale_pixels(low_width, low_height, reduced, args.scale)
        write_bmp(final_bmp, output_width, output_height, scaled)
        run_sips(["-s", "format", "png", str(final_bmp), "--out", str(output_path)])

    return {
        "engine": "sips",
        "original_width": "",
        "original_height": "",
        "low_width": low_width,
        "low_height": low_height,
        "output_width": output_width,
        "output_height": output_height,
    }


def pixelize(
    data: bytes,
    source_path: Path,
    output_path: Path,
    args: argparse.Namespace,
) -> dict[str, int | str]:
    if args.engine in ("auto", "pillow"):
        try:
            return pixelize_with_pillow(data, output_path, args)
        except RuntimeError:
            if args.engine == "pillow":
                raise RuntimeError(
                    "Pillow is required for --engine pillow. Install it with: python3 -m pip install Pillow"
                )

    if args.engine in ("auto", "sips"):
        return pixelize_with_sips(source_path, output_path, args)

    raise RuntimeError("No image engine is available")


def process_jobs(args: argparse.Namespace, jobs: list[ImageJob]) -> int:
    output_dir = args.output_dir
    source_cache = args.source_cache or output_dir / "source_cache"
    image_dir = output_dir / "images"
    manifest_path = output_dir / "manifest.csv"

    output_dir.mkdir(parents=True, exist_ok=True)
    source_cache.mkdir(parents=True, exist_ok=True)
    image_dir.mkdir(parents=True, exist_ok=True)

    fields = [
        "id",
        "name",
        "kind",
        "url",
        "source_file",
        "output_file",
        "original_width",
        "original_height",
        "low_width",
        "low_height",
        "output_width",
        "output_height",
        "engine",
        "colors",
        "max_side",
        "scale",
        "status",
        "error",
    ]

    failures = 0
    with manifest_path.open("w", newline="", encoding="utf-8") as manifest_file:
        writer = csv.DictWriter(manifest_file, fieldnames=fields)
        writer.writeheader()
        for index, job in enumerate(jobs, start=1):
            source_path = source_cache / source_name(job.url)
            output_path = image_dir / output_name(job)
            row: dict[str, str | int] = {
                "id": job.datasheet_id,
                "name": job.name,
                "kind": job.kind,
                "url": job.url,
                "source_file": str(source_path),
                "output_file": str(output_path),
                "colors": args.colors,
                "max_side": args.max_side,
                "scale": args.scale,
                "status": "ok",
                "error": "",
            }

            if output_path.exists() and not args.force:
                row["status"] = "exists"
                writer.writerow(row)
                print(f"[{index}/{len(jobs)}] exists {output_path.name}", file=sys.stderr)
                continue

            try:
                data = read_source(job, source_path, args.timeout, args.skip_download, args.force)
                row.update(pixelize(data, source_path, output_path, args))
                print(f"[{index}/{len(jobs)}] wrote {output_path.name}", file=sys.stderr)
            except Exception as exc:  # noqa: BLE001 - keep batch processing resilient.
                failures += 1
                row["status"] = "error"
                row["error"] = str(exc)
                print(f"[{index}/{len(jobs)}] error {job.name} {job.kind}: {exc}", file=sys.stderr)
            writer.writerow(row)

    print(f"Manifest: {manifest_path}", file=sys.stderr)
    return 1 if failures else 0


def main() -> int:
    args = parse_args()
    validate_args(args)
    jobs = load_jobs(args.db, args.kind, args.name, args.limit)

    if args.print_urls:
        print_urls(jobs)
        return 0

    if args.dry_run:
        print(f"{len(jobs)} image(s) would be processed from {args.db}")
        print(f"Output directory: {args.output_dir}")
        print(f"Style: max_side={args.max_side}, scale={args.scale}, colors={args.colors}")
        return 0

    if not jobs:
        print("No images matched.", file=sys.stderr)
        return 0

    return process_jobs(args, jobs)


if __name__ == "__main__":
    raise SystemExit(main())
