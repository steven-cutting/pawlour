"""Verify that the vendored model, rig, poses and scripts remain byte-identical."""

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    record = json.loads((ROOT / "blender/provenance.json").read_text())
    findings = []
    for name, expected in record["files"].items():
        path = ROOT / "blender" / name
        if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
            findings.append(f"{name}: does not match approved source")
    actual = {
        path.relative_to(ROOT / "blender").as_posix()
        for directory in ("model", "poses", "src")
        for path in (ROOT / "blender" / directory).iterdir()
        if path.is_file()
    }
    findings.extend(
        f"{name}: unrecorded source file" for name in sorted(actual - record["files"].keys())
    )
    if findings:
        raise SystemExit("\n".join(findings))
    print(f"Model provenance: {len(record['files'])} files match biscuit_pics@{record['commit']}")


if __name__ == "__main__":
    main()
