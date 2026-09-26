"""Every served asset listed, byte-identical and within budget: the checker behind `just check-assets`.

`src/lib/assets/manifest.json` records every file under `src/lib/assets/` with its size,
its sha256, where it came from, under what licence and its byte budget. `check` proves
the worktree agrees with the manifest; `write` rewrites the manifest from the worktree,
keeping the three fields only a person can set; both prove the checker first with
`self-test`, which builds a small tree and asserts every refusal is live. The format is
CONVENTIONS.md section 3 in tickets/.
"""

import argparse
import hashlib
import json
import re
import shutil
import sys
import tempfile
from datetime import UTC, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = Path("src/lib/assets")
MANIFEST = ASSETS / "manifest.json"
FIELDS = ("path", "bytes", "sha256", "source", "licence", "budget")
LICENCES = ("unsettled", "cc0", "platform")
AUDIO_SUFFIXES = frozenset({".aac", ".flac", ".m4a", ".mp3", ".oga", ".ogg", ".opus", ".wav"})
# Files an operating system drops beside the assets; never served, never listed.
IGNORED_NAMES = frozenset({".DS_Store", "Thumbs.db"})
# The four forms of `source`: copied from biscuit_pics at a commit, built by a recipe
# on a date, made here on a date, or downloaded from a public-domain page.
SOURCE = re.compile(
    r"^(?:biscuit_pics@[0-9a-f]{7,40}:\S.*|built:\d{4}-\d{2}-\d{2}|made:\d{4}-\d{2}-\d{2}|cc0:https?://\S+)$"
)
SOURCE_FORMS = "biscuit_pics@<commit>:<path>, built:<date>, made:<date> or cc0:<url>"


class ManifestError(Exception):
    """The manifest cannot be read as a list of entries at all."""


def asset_files(root: Path) -> list[str]:
    """Every file under the assets directory, relative to `root`, the manifest excluded."""
    base = root / ASSETS
    if not base.is_dir():
        return []
    found = (
        path.relative_to(root).as_posix()
        for path in base.rglob("*")
        if path.is_file() and path.name not in IGNORED_NAMES
    )
    return sorted(name for name in found if name != MANIFEST.as_posix())


def digest(path: Path) -> tuple[int, str]:
    """Size and sha256 of a file, read in chunks."""
    sha = hashlib.sha256()
    size = 0
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1 << 20), b""):
            sha.update(chunk)
            size += len(chunk)
    return size, sha.hexdigest()


def render(entries: list[dict[str, object]]) -> str:
    """The manifest's one canonical text: one entry per line, sorted by path."""
    if not entries:
        return '{"schema_version": 1, "assets": []}\n'
    ordered = sorted(entries, key=lambda entry: str(entry["path"]))
    lines = ",\n".join("  " + json.dumps(entry, ensure_ascii=False) for entry in ordered)
    return '{"schema_version": 1, "assets": [\n' + lines + "\n]}\n"


def load_manifest(root: Path) -> tuple[str, list[dict[str, object]]]:
    """The manifest's text and its entries; ManifestError when it has no entries to read."""
    try:
        text = (root / MANIFEST).read_text(encoding="utf-8")
        data = json.loads(text)
    except (OSError, ValueError) as error:
        raise ManifestError(str(error)) from error
    if not isinstance(data, dict) or list(data) != ["schema_version", "assets"]:
        raise ManifestError('must be an object holding "schema_version" then "assets"')
    if data["schema_version"] != 1:
        raise ManifestError("schema_version must be 1")
    assets = data["assets"]
    if not isinstance(assets, list):
        raise ManifestError("assets must be a list")
    seen: set[str] = set()
    for index, entry in enumerate(assets):
        if not isinstance(entry, dict) or not isinstance(entry.get("path"), str):
            raise ManifestError(f"entry {index} must be an object with a string path")
        if entry["path"] in seen:
            raise ManifestError(f"{entry['path']} is listed twice")
        seen.add(entry["path"])
    return text, assets


def is_count(value: object) -> bool:
    return isinstance(value, int) and not isinstance(value, bool) and value >= 0


def entry_findings(root: Path, entry: dict[str, object]) -> list[str]:
    """Every reason one listed file is refused, each as `<path>: <reason>`."""
    name = str(entry["path"])
    if list(entry) != list(FIELDS):
        return [f"{name}: fields must be {', '.join(FIELDS)}, all present, in that order"]
    reasons: list[str] = []
    size, sha = digest(root / name)
    if entry["bytes"] != size:
        reasons.append(f"bytes is {entry['bytes']} but the file holds {size}")
    if entry["sha256"] != sha:
        reasons.append("sha256 differs from the file; run just assets-manifest and read the diff")
    budget = entry["budget"]
    if not is_count(budget):
        reasons.append("budget must be a whole number of bytes, 0 for none")
    elif budget and size > budget:
        reasons.append(f"{size} bytes is over its budget of {budget}")
    licence = entry["licence"]
    if licence not in LICENCES:
        reasons.append(f"licence must be one of {', '.join(LICENCES)}")
    elif licence == "unsettled" and Path(name).suffix.lower() in AUDIO_SUFFIXES:
        reasons.append("audio may not ship with an unsettled licence")
    source = entry["source"]
    if not (isinstance(source, str) and SOURCE.match(source)):
        reasons.append(f"source must be {SOURCE_FORMS}")
    return [f"{name}: {reason}" for reason in reasons]


def check_tree(root: Path) -> list[str]:
    """Every finding against the manifest and the files under `root`, or an empty list."""
    try:
        text, entries = load_manifest(root)
    except ManifestError as error:
        return [f"{MANIFEST.as_posix()}: {error}"]
    findings: list[str] = []
    if text != render(entries) or [e["path"] for e in entries] != sorted(
        str(e["path"]) for e in entries
    ):
        findings.append(
            f"{MANIFEST.as_posix()}: not in canonical form (one entry per line, sorted by path, "
            "fields in order); run just assets-manifest"
        )
    present = set(asset_files(root))
    listed = {str(entry["path"]): entry for entry in entries}
    for name in sorted(set(listed) | present):
        if name not in present:
            findings.append(f"{name}: listed in the manifest but absent from the worktree")
        elif name not in listed:
            findings.append(f"{name}: present but not listed; run just assets-manifest")
        else:
            findings.extend(entry_findings(root, listed[name]))
    return findings


def write_tree(root: Path, today: str) -> list[str]:
    """Rewrite the manifest from the files, keeping source, licence and budget; then check."""
    try:
        _, entries = load_manifest(root)
    except ManifestError as error:
        if (root / MANIFEST).exists():
            return [f"{MANIFEST.as_posix()}: {error}; repair it by hand, then run this again"]
        entries = []
    kept = {str(entry["path"]): entry for entry in entries}
    written: list[dict[str, object]] = []
    for name in asset_files(root):
        size, sha = digest(root / name)
        old = kept.get(name, {})
        written.append(
            {
                "path": name,
                "bytes": size,
                "sha256": sha,
                "source": old.get("source", f"made:{today}"),
                "licence": old.get("licence", "unsettled"),
                "budget": old.get("budget", 0),
            }
        )
    (root / MANIFEST).parent.mkdir(parents=True, exist_ok=True)
    (root / MANIFEST).write_text(render(written), encoding="utf-8")
    return check_tree(root)


def refused(findings: list[str], name: str, reason: str) -> bool:
    return any(f.startswith(f"{name}: ") and reason in f for f in findings)


def self_test() -> list[str]:
    """Prove every refusal is live on a tree built for the purpose; the problems, or none."""
    problems: list[str] = []
    stage = Path(tempfile.mkdtemp(prefix="check_assets."))
    try:
        base = stage / ASSETS
        base.mkdir(parents=True)
        if found := write_tree(stage, "2026-01-01"):
            problems.append(f"an empty tree was refused: {found}")
        if (stage / MANIFEST).read_text(encoding="utf-8") != render([]):
            problems.append("an empty tree did not write the empty manifest")

        prefix = ASSETS.as_posix()
        fits, heavy, tampered, loop = (
            f"{prefix}/fits.bin",
            f"{prefix}/heavy.bin",
            f"{prefix}/tampered.bin",
            f"{prefix}/audio/loop.mp3",
        )
        (base / "audio").mkdir()
        (stage / fits).write_bytes(b"biscuit" * 10)
        (stage / heavy).write_bytes(b"biscuit" * 100)
        (stage / tampered).write_bytes(b"biscuit" * 10)
        (stage / loop).write_bytes(b"not really audio")
        found = write_tree(stage, "2026-01-01")
        if found != [f"{loop}: audio may not ship with an unsettled licence"]:
            problems.append(f"write did not refuse exactly the unsettled audio: {found}")
        _, entries = load_manifest(stage)
        if [e["path"] for e in entries] != sorted([fits, heavy, tampered, loop]) or any(
            list(e) != list(FIELDS) or e["source"] != "made:2026-01-01" for e in entries
        ):
            problems.append(f"write did not list every file with its defaults: {entries}")

        by_path = {str(entry["path"]): entry for entry in entries}
        by_path[fits]["budget"] = 70
        by_path[heavy]["budget"] = 699
        absent = f"{prefix}/absent.bin"
        by_path[absent] = dict(by_path[fits], path=absent)
        mislicensed = f"{prefix}/mislicensed.bin"
        unsourced = f"{prefix}/unsourced.bin"
        for name in (mislicensed, unsourced):
            (stage / name).write_bytes(b"biscuit")
            size, sha = digest(stage / name)
            by_path[name] = dict(by_path[fits], path=name, bytes=size, sha256=sha)
        by_path[mislicensed]["licence"] = "all rights reserved"
        by_path[unsourced]["source"] = "found on the internet"
        (stage / MANIFEST).write_text(render(list(by_path.values())), encoding="utf-8")
        unlisted = f"{prefix}/unlisted.bin"
        (stage / unlisted).write_bytes(b"biscuit")
        (stage / tampered).write_bytes(b"biscuiT" + b"biscuit" * 9)

        found = check_tree(stage)
        expected = (
            (heavy, "over its budget"),
            (unlisted, "present but not listed"),
            (absent, "absent from the worktree"),
            (tampered, "sha256 differs"),
            (loop, "unsettled licence"),
            (mislicensed, "licence must be"),
            (unsourced, "source must be"),
        )
        problems.extend(
            f"{name} was not refused for {reason!r}: {found}"
            for name, reason in expected
            if not refused(found, name, reason)
        )
        if any(f.startswith(f"{fits}: ") for f in found):
            problems.append(f"an in-budget, untouched file was refused: {found}")
        if len(found) != len(expected):
            problems.append(f"expected {len(expected)} refusals, found {len(found)}: {found}")

        (stage / MANIFEST).write_text(
            (stage / MANIFEST).read_text(encoding="utf-8").replace("\n  ", "\n    "),
            encoding="utf-8",
        )
        if not refused(check_tree(stage), MANIFEST.as_posix(), "canonical form"):
            problems.append("a manifest out of canonical form was not refused")
    finally:
        shutil.rmtree(stage, ignore_errors=True)
    return problems


def run_self_test() -> bool:
    problems = self_test()
    for problem in problems:
        print(f"self-test: {problem}", file=sys.stderr)
    if problems:
        print("self-test: failed; the checker cannot be trusted", file=sys.stderr)
        return False
    print("self-test: every refusal is live (budget, unlisted, absent, sha256, licence, source)")
    return True


def report(findings: list[str], action: str) -> int:
    for finding in findings:
        print(finding, file=sys.stderr)
    if findings:
        return 1
    count = len(asset_files(ROOT))
    print(f"check-assets: {action} {count} file(s) against {MANIFEST.as_posix()}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("command", choices=("check", "write", "self-test"))
    command = parser.parse_args(argv).command
    if not run_self_test():
        return 1
    if command == "check":
        return report(check_tree(ROOT), "checked")
    if command == "write":
        today = datetime.now(tz=UTC).date().isoformat()
        return report(write_tree(ROOT, today), "wrote")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
