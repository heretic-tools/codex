#!/usr/bin/env python3
from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path

from build_static_site import PROJECT_ROOT, normalize_base_path, resolve_project_path


@dataclass(frozen=True)
class ServiceWorkerResetResult:
    out_dir: Path
    base_path: str
    html_count: int


def add_service_worker_reset_arguments(parser):
    parser.add_argument("--out", default="dist", help="Static site output directory to patch.")
    parser.add_argument("--base-path", default="", help="GitHub Pages base path for the production site.")


def reset_script(base_path: str) -> str:
    service_worker_url = f"{base_path}/service-worker.js" if base_path else "/service-worker.js"
    scope = f"{base_path}/" if base_path else "/"
    return f"""<script>
(() => {{
  if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller) return;
  navigator.serviceWorker.register("{service_worker_url}", {{ scope: "{scope}" }})
    .then((registration) => registration.update())
    .catch(() => {{}});
}})();
</script>"""


def service_worker_source() -> str:
    return """self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => /heretic|pwa|codex|builder/i.test(name))
        .map((name) => caches.delete(name))
    );
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    await self.registration.unregister();
    for (const client of clients) {
      if (client.url && !client.url.includes("/beta/")) {
        client.navigate(client.url);
      }
    }
  })());
});
"""


def inject_reset_script(html: str, script: str) -> str:
    if "navigator.serviceWorker.register" in html or "service-worker.js" in html:
        return html
    if "</body>" in html:
        return html.replace("</body>", f"{script}\n</body>", 1)
    return f"{html}\n{script}\n"


def reset_service_worker(out: Path | str, base_path: str) -> ServiceWorkerResetResult:
    out_dir = resolve_project_path(out, PROJECT_ROOT)
    normalized_base_path = normalize_base_path(base_path)
    script = reset_script(normalized_base_path)
    html_count = 0

    (out_dir / "service-worker.js").write_text(service_worker_source(), encoding="utf-8")
    for path in out_dir.rglob("*.html"):
        if "/beta/" in path.as_posix():
            continue
        original = path.read_text(encoding="utf-8")
        patched = inject_reset_script(original, script)
        if patched != original:
            path.write_text(patched, encoding="utf-8")
            html_count += 1

    return ServiceWorkerResetResult(out_dir=out_dir, base_path=normalized_base_path, html_count=html_count)


def reset_service_worker_from_args(args) -> ServiceWorkerResetResult:
    return reset_service_worker(args.out, args.base_path)


def print_service_worker_reset_result(result: ServiceWorkerResetResult) -> None:
    print(f"Service worker reset: {result.out_dir}")
    print(f"Base path: {result.base_path or '/'}")
    print(f"HTML files patched: {result.html_count}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Patch a static production site to clear stale service workers.")
    add_service_worker_reset_arguments(parser)
    print_service_worker_reset_result(reset_service_worker_from_args(parser.parse_args()))


if __name__ == "__main__":
    main()
