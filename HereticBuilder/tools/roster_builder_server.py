import argparse
import json
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from roster_builder_core import HereticBuilder


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DB = PROJECT_ROOT / "data" / "heretic_db.sqlite"
WEB_ROOT = PROJECT_ROOT / "HereticBuilder" / "web"


def find_port(host, start):
    for port in range(start, start + 50):
        try:
            return ThreadingHTTPServer((host, port), Handler), port
        except OSError:
            continue
    raise OSError(f"No free port found from {start} to {start + 49}")


class Handler(BaseHTTPRequestHandler):
    heretic_builder = None

    def log_message(self, fmt, *args):
        return

    def send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_file(self, path, status=200):
        body = path.read_bytes()
        content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        if path.suffix == ".js":
            content_type = "text/javascript"
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_index(self):
        index = WEB_ROOT / "index.html"
        if index.exists():
            self.send_file(index)
        else:
            self.send_json({"ok": True, "message": "UI files are not installed yet."})

    def read_json(self):
        length = int(self.headers.get("Content-Length") or 0)
        if not length:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def fail(self, error):
        self.send_json({"error": str(error)}, status=400)

    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        param = lambda name, default="": params.get(name, [default])[0]
        try:
            if parsed.path == "/":
                self.send_index()
            elif parsed.path == "/api/bootstrap":
                self.send_json(self.heretic_builder.bootstrap())
            elif parsed.path == "/api/detachments":
                self.send_json(self.heretic_builder.detachments(param("factionId")))
            elif parsed.path == "/api/builder/dets":
                self.send_json(self.heretic_builder.detachments(param("factionId")))
            elif parsed.path == "/api/builder/forms":
                self.send_json(self.heretic_builder.detachments(param("factionId")))
            elif parsed.path == "/api/datasheets":
                self.send_json(self.heretic_builder.datasheets(
                    param("factionId"),
                    param("detachmentIds", param("detachmentId")),
                    param("q"),
                    param("allyType", "native"),
                ))
            elif parsed.path == "/api/allied-factions":
                self.send_json(self.heretic_builder.allied_factions(param("rosterId")))
            elif parsed.path == "/api/roster":
                self.send_json(self.heretic_builder.roster(param("id")))
            elif parsed.path == "/api/unit":
                self.send_json(self.heretic_builder.unit_detail(param("id")))
            elif parsed.path == "/api/sheets/home":
                self.send_json(self.heretic_builder.sheets_home())
            elif parsed.path == "/api/sheets/core":
                self.send_json(self.heretic_builder.sheets_core())
            elif parsed.path == "/api/sheets/core/stratagems":
                self.send_json(self.heretic_builder.sheets_core_stratagems(param("q")))
            elif parsed.path == "/api/sheets/core/faqs":
                self.send_json(self.heretic_builder.sheets_core_faqs(param("q")))
            elif parsed.path == "/api/sheets/factions":
                self.send_json(self.heretic_builder.sheets_factions(param("q")))
            elif parsed.path == "/api/sheets/faction":
                self.send_json(self.heretic_builder.sheets_faction(param("id")))
            elif parsed.path == "/api/sheets/publications":
                self.send_json(self.heretic_builder.sheets_publications(param("factionId")))
            elif parsed.path == "/api/sheets/publication":
                self.send_json(self.heretic_builder.sheets_publication(param("id")))
            elif parsed.path == "/api/sheets/rule-sections":
                self.send_json(self.heretic_builder.sheets_rule_sections(
                    param("publicationId"),
                    param("parentId", None),
                ))
            elif parsed.path == "/api/sheets/rule-section":
                self.send_json(self.heretic_builder.sheets_rule_section(param("id")))
            elif parsed.path == "/api/sheets/rule-container":
                self.send_json(self.heretic_builder.sheets_rule_container(param("id")))
            elif parsed.path == "/api/sheets/army-rules":
                self.send_json(self.heretic_builder.sheets_army_rules(
                    param("factionId"),
                    param("publicationId"),
                    param("q"),
                ))
            elif parsed.path == "/api/sheets/army-rule":
                self.send_json(self.heretic_builder.sheets_army_rule(param("id")))
            elif parsed.path == "/api/sheets/datasheets":
                self.send_json(self.heretic_builder.sheets_datasheets(
                    param("factionId"),
                    param("publicationId"),
                    param("q"),
                ))
            elif parsed.path == "/api/sheets/datasheet":
                self.send_json(self.heretic_builder.sheets_datasheet(param("id")))
            elif parsed.path == "/api/sheets/detachments":
                self.send_json(self.heretic_builder.sheets_detachments(
                    param("factionId"),
                    param("publicationId"),
                ))
            elif parsed.path == "/api/sheets/dets":
                self.send_json(self.heretic_builder.sheets_detachments(
                    param("factionId"),
                    param("publicationId"),
                ))
            elif parsed.path == "/api/sheets/forms":
                self.send_json(self.heretic_builder.sheets_detachments(
                    param("factionId"),
                    param("publicationId"),
                ))
            elif parsed.path == "/api/sheets/detachment":
                self.send_json(self.heretic_builder.sheets_detachment(param("id")))
            elif parsed.path == "/api/sheets/det":
                self.send_json(self.heretic_builder.sheets_detachment(param("id")))
            elif parsed.path == "/api/sheets/form":
                self.send_json(self.heretic_builder.sheets_detachment(param("id")))
            elif parsed.path == "/api/sheets/stratagems":
                self.send_json(self.heretic_builder.sheets_stratagems(
                    param("factionId"),
                    param("publicationId"),
                    param("detachmentId"),
                    param("q"),
                ))
            elif parsed.path == "/api/sheets/stratagem":
                self.send_json(self.heretic_builder.sheets_stratagem(param("id")))
            elif parsed.path == "/api/sheets/enhancements":
                self.send_json(self.heretic_builder.sheets_enhancements(
                    param("factionId"),
                    param("publicationId"),
                    param("detachmentId"),
                    param("q"),
                ))
            elif parsed.path == "/api/sheets/enhancement":
                self.send_json(self.heretic_builder.sheets_enhancement(param("id")))
            elif parsed.path == "/api/sheets/faqs":
                self.send_json(self.heretic_builder.sheets_faqs(
                    param("factionId"),
                    param("publicationId"),
                    param("q"),
                ))
            elif parsed.path == "/api/sheets/faq":
                self.send_json(self.heretic_builder.sheets_faq(param("id")))
            elif not parsed.path.startswith("/api/"):
                requested = (WEB_ROOT / parsed.path.lstrip("/")).resolve()
                if requested.is_file() and requested.is_relative_to(WEB_ROOT):
                    self.send_file(requested)
                else:
                    self.send_index()
            else:
                self.send_json({"error": "Not found"}, status=404)
        except Exception as error:
            self.fail(error)

    def do_POST(self):
        try:
            payload = self.read_json()
            if self.path == "/api/roster/create":
                self.send_json(self.heretic_builder.create_roster(payload))
            elif self.path == "/api/roster/delete":
                self.send_json(self.heretic_builder.delete_roster(payload["id"]))
            elif self.path == "/api/roster/detachments":
                self.send_json(self.heretic_builder.set_roster_detachments(
                    payload["rosterId"],
                    payload.get("detachmentIds", []),
                ))
            elif self.path == "/api/unit/add":
                self.send_json(self.heretic_builder.add_unit(
                    payload["rosterId"],
                    payload["datasheetId"],
                    payload.get("allyType", "native"),
                ))
            elif self.path == "/api/unit/delete":
                self.send_json(self.heretic_builder.delete_unit(payload["id"]))
            elif self.path == "/api/unit/composition":
                self.send_json(self.heretic_builder.set_composition(payload["rosterUnitId"], payload["compositionId"]))
            elif self.path == "/api/allegiance":
                self.send_json(self.heretic_builder.set_allegiance_ability(
                    payload["rosterUnitId"],
                    payload["allegianceAbilityId"],
                    bool(payload.get("enabled")),
                ))
            elif self.path == "/api/unit-enhancement":
                self.send_json(self.heretic_builder.set_unit_enhancement(
                    payload["rosterUnitId"],
                    payload["enhancementId"],
                    bool(payload.get("enabled")),
                ))
            elif self.path == "/api/model-enhancement":
                self.send_json(self.heretic_builder.set_miniature_enhancement(
                    payload["rosterUnitMiniatureId"],
                    payload["enhancementId"],
                    bool(payload.get("enabled")),
                ))
            elif self.path == "/api/attached/create":
                self.send_json(self.heretic_builder.create_attached_unit(
                    payload["bodyguardUnitId"],
                    payload["attachedUnitId"],
                    payload.get("attachedType", "leader"),
                ))
            elif self.path == "/api/attached/delete":
                self.send_json(self.heretic_builder.delete_attached_unit(payload["id"]))
            elif self.path == "/api/wargear":
                self.send_json(self.heretic_builder.set_wargear(
                    payload["rosterUnitMiniatureId"],
                    payload["wargearOptionId"],
                    payload.get("count", 0),
                ))
            elif self.path == "/api/unit-wargear":
                self.send_json(self.heretic_builder.set_unit_wargear(
                    payload["rosterUnitId"],
                    payload["wargearOptionId"],
                    payload.get("count", 0),
                ))
            elif self.path == "/api/warlord":
                self.send_json(self.heretic_builder.set_warlord(
                    payload["rosterUnitMiniatureId"],
                    bool(payload.get("enabled")),
                ))
            else:
                self.send_json({"error": "Not found"}, status=404)
        except Exception as error:
            self.fail(error)


def main():
    parser = argparse.ArgumentParser(description="Minimal read/write HereticBuilder")
    parser.add_argument("--db", default=str(DEFAULT_DB), help="SQLite database path")
    parser.add_argument("--host", default="127.0.0.1", help="Bind host")
    parser.add_argument("--port", type=int, default=4175, help="Preferred port")
    args = parser.parse_args()
    db_path = Path(args.db).resolve()
    if not db_path.exists():
        raise SystemExit(f"Database does not exist: {db_path}")
    Handler.heretic_builder = HereticBuilder(db_path)
    server, port = find_port(args.host, args.port)
    print(f"HereticBuilder: http://{args.host}:{port}", flush=True)
    print(f"Database: {db_path}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
