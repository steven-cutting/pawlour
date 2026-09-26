---
title: "Decision 0011: Vendored skills sit outside the agent contract"
kind: "decision"
audience: [contributor, maintainer, agent]
canonical_for: [decision_vendored_skills]
requires: []
---

# Decision 0011: Vendored skills sit outside the agent contract

## Context

The Allium skills — `allium`, `distill`, `elicit`, `propagate`, `tend`, `weed` and
`witness` — come from [`juxt/allium`][upstream] and are pinned in `skills-lock.json`.
They live in `.agents/skills/<name>/`, and each `.claude/skills/<name>` is a symlink to
that directory.

The [agent contract](../reference/agent-contract.md) holds every directory under
`.agents/skills/` to this project's skill rules. The vendored skills break those rules:
their frontmatter has more than two keys, they do not cite `AGENTS.md`, they name no
`just` recipe, they carry `references/` files, and their bridges are symlinks rather than
thin pointers. Editing them to comply would turn an upstream update from a clean replace
into a merge, so they are kept byte for byte. `bg-validate-agents` has no setting that
excludes a skill, and a `.gitignore` entry does not hide a file that is committed.

## Decision

`scripts/validate_agents.py` wraps the package's validator. It reads the skill names
from `skills-lock.json`, requires `.agents/skills/<name>/SKILL.md` to exist for each one,
leaves those skills and their `.claude/` and `.codex/` bridge paths out of the inventory
and the skill checks, and runs the unchanged validator over everything else.
`just check-agents` and the `validate-agents` pre-commit hook run the wrapper instead of
`bg-validate-agents`.

markdownlint, typos and Prettier ignore the same seven skills in their own
configuration, and Prettier also ignores `skills-lock.json`, because the installer writes
it.

## Consequences

**The wrapper patches two private functions**, `_skill_names` and `_versioned_paths`,
because the package offers no public way to exclude a skill. A tooling release that
renames either function breaks `just check-agents`, and the break shows up as an error
rather than a silent pass.

**The lock is the only list.** Vendoring another skill means adding it to
`skills-lock.json`, which the installer already does, and to the three linter ignore
lists. A skill that is in the lock but missing from `.agents/skills/` fails the check.

**Two lines in template-managed files changed**, the `check-agents` recipe in the
`Justfile` and the hook entry in `.pre-commit-config.yaml`, rather than being appended.
A `copier update` that edits either line will show conflict markers there.

## What would reopen this

`biscuit-games-tooling` learning to read `skills-lock.json`, or offering any other way to
exclude a skill. When that happens, delete the wrapper and point both callers back at
`bg-validate-agents`.

## Related pages

- [Agent contract](../reference/agent-contract.md)
- [Quality gates](../reference/quality-gates.md)
- [Decision 0009: Rendered from the template](0009-rendered-from-the-template.md)

[upstream]: https://github.com/juxt/allium
