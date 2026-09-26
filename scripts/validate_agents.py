"""The agent contract, less the vendored skills: the checker behind `just check-agents`.

`bg-validate-agents` holds every directory under `.agents/skills/` to this project's
skill contract. The skills `skills-lock.json` pins are vendored from upstream and kept
byte for byte, so they cannot cite AGENTS.md, carry two-key frontmatter or have
bridges instead of symlinks. This wrapper removes exactly those skills from the
inventory and the skill checks, then runs the package's validator unchanged over
everything else. Decision 0011 records why, and when to delete this file.
"""

import json
import sys
from pathlib import Path

from biscuit_games_tooling import _project
from biscuit_games_tooling import validate_agents as upstream

LOCK = Path("skills-lock.json")
SKILL_ROOTS = (Path(".agents/skills"), Path(".claude/skills"), Path(".codex/skills"))


def vendored_skills(root: Path) -> frozenset[str]:
    """Name every skill the lock pins; an absent lock vendors nothing."""
    path = root / LOCK
    if not path.is_file():
        return frozenset()
    return frozenset(json.loads(path.read_text(encoding="utf-8"))["skills"])


def is_vendored(relative: Path, names: frozenset[str]) -> bool:
    """True for a vendored skill's directory, its bridge symlink, or anything inside."""
    for skill_root in SKILL_ROOTS:
        for name in names:
            directory = skill_root / name
            if relative == directory or directory in relative.parents:
                return True
    return False


def main() -> int:
    """Run the package's validator with the vendored skills left out."""
    root = _project.root()
    names = vendored_skills(root)
    missing = sorted(
        name for name in names if not (root / ".agents/skills" / name / "SKILL.md").is_file()
    )
    if missing:
        for name in missing:
            print(
                f"agent validation: {LOCK} pins {name} but .agents/skills/{name}/SKILL.md is missing",
                file=sys.stderr,
            )
        return 1

    skill_names = upstream._skill_names  # noqa: SLF001 -- no public seam; decision 0011
    versioned_paths = upstream._versioned_paths  # noqa: SLF001 -- no public seam; decision 0011
    upstream._skill_names = lambda at: tuple(n for n in skill_names(at) if n not in names)  # noqa: SLF001 -- as above
    upstream._versioned_paths = lambda at: {  # noqa: SLF001 -- as above
        p for p in versioned_paths(at) if not is_vendored(p, names)
    }
    status = upstream.main()
    if status == 0 and names:
        print(f"Left out {len(names)} vendored skills pinned by {LOCK}.")
    return status


if __name__ == "__main__":
    raise SystemExit(main())
