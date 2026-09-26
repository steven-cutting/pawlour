# Conventions for building Pawlour

This document is the design every ticket under `tickets/` obeys. A ticket cites it by
section (`CONVENTIONS.md §4`) instead of restating it, and embeds exact content only where
the agent executing the ticket would otherwise have to guess. Where a ticket and this
document disagree, this document wins and the ticket is corrected. `PRD.md` beside it
owns what the game does; this document owns how it is built. Changes to this document go
through a pull request on `main`, never through a lane branch, because every lane reads
it.

## 0. What is being built, and where the sources are

`steven-cutting/pawlour` (this repository; today one commit `0b55a6e` on `main`
holding a 10-byte `README.md`, a worktree `full-cozy` on a branch of the same name, no
remote, no GitHub repository) becomes **Pawlour**, a Biscuit Games game: a static
SvelteKit site rendered from the platform's Copier template, consuming the platform
package, whose play surface is a three.js diorama of a log cabin in which Biscuit, the
approved poseable model animated with Blender-authored clips, walks between the things
the player taps. `PRD.md` says what it is.

Seven repositories are the sources, cited with a letter and, where it matters, line
numbers that refer to these exact commits:

| Letter | Repository | Local clone | Commit |
| --- | --- | --- | --- |
| **H** | `steven-cutting/biscuit_games`, the hub that publishes `@steven-cutting/biscuit-games` | `/Users/scutting/projects/biscuit_games` | `575e3dd` (HEAD on 2026-09-25; tag `v1.1.0` is `ca0ca0a`, two tooling-only commits earlier; every file this design cites is identical at both) |
| **T** | `steven-cutting/biscuit_games_template`, the Copier template that renders a game | rendered from `gh:steven-cutting/biscuit_games_template` at tag **`v2.1.0`** (`378acc8`) | the local clone at `/Users/scutting/projects/biscuit_games_template` is `2283589`, six commits behind `origin/main`, and is read for nothing; a ticket that needs a template file reads it with `git -C /Users/scutting/projects/biscuit_games_template show v2.1.0:<path>` after `git fetch --tags` |
| **G** | `steven-cutting/biscuit_games_tooling`, the reusable workflows, the composite action and the `biscuit-games-tooling` package | `/Users/scutting/projects/biscuit_games_tooling` | `6c5c07f` (tag `v0.3.0`) |
| **P** | `steven-cutting/poodl`, the first game and the only one with game code | `/Users/scutting/projects/poodl` | `a2860fc` |
| **S** | `steven-cutting/biscuit_studio`, where the platform's assets are developed | `/Users/scutting/projects/biscuit_studio` | `a4d20af` |
| **D** | the `biscuit_pics` worktree `very_nice_three_deeez`, where the approved model lives | `/Users/scutting/.supacode/repos/biscuit_pics/very_nice_three_deeez` | `1d9d358` |
| **B** | `steven-cutting/tic_tac_toe_beans`, a game rendered from T `v1.0.0` with no game code | `/Users/scutting/.supacode/repos/tic_tac_toe_beans/setup` | `d8966bf`; cited only as a rendered tree to compare against |

D is a git worktree of `/Users/scutting/projects/biscuit_pics`; its object store is
2.7 GB and its working tree 3.2 GB. Nothing here imports that history. **D and S are
read-only for every ticket**: they are read with `cat`, `cp`, `shasum` and `git show`, and
nothing writes there or runs their scripts from inside them.

Tooling verified on this machine on 2026-09-25: uv 0.11.18, just 1.51.0, node 26.5.1 with
npm 11.17.0, Python 3.14, git-lfs 3.8.0 (filters configured globally), Blender 5.2.1 LTS
at `/Applications/Blender.app` (its glTF add-on at
`Contents/Resources/5.2/scripts/addons_core/io_scene_gltf2`), `gh` authenticated as
`steven-cutting`, a `~/.npmrc` line for `npm.pkg.github.com` whose token is never read,
printed or copied. On npm that day: `three` 0.186.1, `@types/three` 0.186.0,
`@gltf-transform/cli` 4.5.0, `sharp` 0.35.4. `typos`, `lychee`, `prek`,
`markdownlint-cli2` and `editorconfig-checker` are not on the PATH; the rendered
toolchain installs them through `uv sync` and the hook cache.

Style references are D `inspiration/persona_5/ann_takamaki/INDEX.md` (five rendering
systems; the game uses system 1 for Biscuit and system 2 for overlays) and D
`inspiration/catherine/katherine/INDEX.md` ("The core": figure and ground are two
rendering systems, one hue axis per picture, contact shadow at 0.60 to 0.65 of the lit
value, sawtooth where soft masses meet). They are cited by section and never copied:
everything under D `inspiration/` is third-party copyrighted reference, and the two fonts
under D `biscuit_pics/generated/katherine/dialogue/p5ui/fonts/` are commercial. The
game's type is the platform's (Bricolage Grotesque for display, Instrument Sans for
interface), which ships in the package.

## 1. Decisions taken with the maintainer, and the facts everything rests on

Decisions, taken on 2026-09-25:

1. **Name: Pawlour**, in the register of Poodl and Pawjong. The repository is
   `steven-cutting/pawlour`. Copier answers: `game_name` `Pawlour`, `game_slug`
   `pawlour`, `description` `Biscuit at home in a log cabin: tap a thing, and she decides
   what to do about it.`, `repository` `steven-cutting/pawlour`. So the package and
   the tooling project are `pawlour` and `pawlour-tooling`, the seed spec is
   `docs/specs/pawlour.allium`, `base_path` is `/pawlour`, and the lockup reads
   "biscuit games / pawlour". The slug was settled as `pawlour` by the maintainer on
   2026-09-25; nothing asks again.
2. **A Biscuit Games game**, rendered from T at `v2.1.0`, consuming
   `@steven-cutting/biscuit-games` at exactly `1.1.0` (T's `hub_package_version`). The
   platform's dark shell, header, lockup, type and controls surround the scene; the warm
   room exists inside the play surface and nowhere else. Because H `docs/design/direction.md`
   and `docs/design/character.md` forbid, as written, most of what this game is (§1 fact
   12), **ticket C01 writes a hub decision record and narrows both pages**, and nothing
   deploys before it lands (P12 depends on it). The game is built regardless.
3. **Blender-authored animation clips from the start.** No pose tweening in the
   browser. Every clip is a python script under `blender/clips/` that keyframes the
   approved rig; the exported GLB carries them (§4).
4. **She walks between items**, within the room, along a waypoint graph the room
   declares (§5). Later rooms are joined by a Persona-style diagonal wipe; v1 has one room
   and uses the wipe for load-in and photo mode only, so the mechanism exists.
5. **This repository owns its animated model.** D's `.blend` and the sixteen files of
   its `src/` are copied here byte for byte with provenance (§3, §4). Reconciling with S
   (where the platform's assets are meant to be developed and leave by ledger) is C02,
   after v1. Until then nothing here is promoted anywhere and S's ledger is untouched.
6. **Camera: a fixed diorama** with three preset positions (§5), cut between, never
   panned. No orbit, no scene zoom; the page itself still pinch-zooms as the platform
   requires.
7. **Time of day from the device's clock** through T's clock port, three phases, a
   visible override that persists through T's storage port (§6).
8. **Sound: ambient, off by default**, a visible switch, never autoplays; every file
   public domain or made here, licence recorded in the manifest (§3).
9. **Scene extras in v1**: window with weather; floor lamp and string lights, on by
   phase and tappable; rug, bookshelf, records, mug of tea with steam; treat jar (the
   object ships; its interaction is v1.1).
10. **Idle behaviour**: breathing, ear twitch, tail sway procedural and always on; head
    turns toward the last tap; behaviour biased by phase. Yawn, stretch and circling are
    v1.1 clips.
11. **Interactions beyond items**: pet her; photo mode as a plain PNG download. No
    caption log, no fire stoking in v1.
12. **One rendering register per layer** (§5): Biscuit is P5 system 1, cel-over-gradient
    with ink outlines, which is the approved look; the room is Catherine's painted
    background, one warm hue axis, planes separated by value, no ink; overlays and title
    cards are P5 system 2, red, black and white with hard diagonals.
13. **Motion off or reduced motion: a still diorama** (§5, §6). The renderer draws one
    frame per state change; no clips, no fire flicker, no particles, no wipe; time and
    captions still work.
14. **Public repository, GitHub Pages** through T's `pages.yml`, at
    `https://stevencutting.com/pawlour/` (a project site under the account's
    user-site domain, which S measured on its first deploy; `steven-cutting.github.io`
    redirects there).
15. **Clips: the core set in v1** — `idle.stand`, `idle.sit`, `walk`, `sit`, `lie`,
    `sleep`, `drink`, `eat`, `play`, `pet`; v1.1 adds `yawn`, `stretch`, `circle`,
    `treat`, `look`.

Technical decisions this document takes, numbered 16 to 21 so a ticket cites them as §1
decisions like the fifteen above, and each recorded in the game's own decision records by
P09:

16. **three.js is the renderer** (S ticket C03 chose it for the same model and its steps
    5 and 6 are the reference for the cel look), pinned exactly, with `@types/three` at
    the same version; `three/addons` for `GLTFLoader` and `MeshoptDecoder`. Decision 0014.
17. **The canvas lives outside the coverage glob.** Everything three.js touches sits
    under `src/routes/scene/`, which `vite.config.ts`'s `include` of `src/lib/**` does
    not measure and jsdom could not run; everything with a decision in it is a pure
    module under `src/lib/` tested to the floor; the browser touchpoints the scene needs
    are ports under `src/lib/ports/` with fakes. `vite.config.ts` is not edited. S C03
    is the precedent. Decision 0012.
18. **Served assets are ordinary blobs; `.blend` files are LFS.** G's three workflows
    check out without `lfs: true`, so Pages would publish a pointer; nothing the site
    serves may be an LFS object. The `.blend` is never served or read in CI, so it is
    LFS. Decision 0011.
19. **Assets are imported by Vite** from `src/lib/assets/`, so every URL is hashed and
    carries `paths.base` (T decision 0010: every path the app builds goes through
    `paths.base`). Nothing goes under `static/`, which Storybook's `staticDirs` would ship
    in every story build.
20. **The room is built by Blender python scripts**, the way the model itself was built,
    under `blender/cabin/`, and exported through the same pipeline as Biscuit (§4, §5).
21. **All dependencies land in P00.** `package.json` and the lockfiles are files no lane
    touches (§10), so P00 adds `three`, `@types/three`, `@gltf-transform/cli` and `sharp`
    at exact pins even though P00 uses none of them. Decision 0013 records the fork of
    the model; the dependency list is recorded in `AGENTS.md`'s deviations.

Facts, each verified in source, that shape the mechanism:

1. **The approved model** is D `models/biscuit/`: `model/biscuit-poseable.glb`
   16,112,380 bytes, sha256 `51d16c1826b2c3ad6ad85fcb176a73e0d1c7a0ac3665ad10f1b6700e9e9be716`;
   `model/biscuit-poseable.blend` 12,004,899 bytes, sha256
   `95d164730e9354ab3d9bd561a73180690bbb055fffa9bf230c735f735234b4c3`; `model/rig.json`
   (33 deform bones, 34 controls, 5 correctives, `coordinateSystem` "right-handed Z-up,
   -Y forward, +X Biscuit left"); `poses/{standing,sitting,lying,paw-raised}.json`;
   `src/` holding `common.py`, `rig.py`, `build.py`, `pose_io.py`, `blender_pose_tools.py`,
   `export_pose_glb.py`, `verify.py`, `verify_interchange.py`, `render.py`,
   `proof_sheet.py`, `viewer.py`, `pose_math.js`, `pose_viewer.js`,
   `viewer.template.html`, `browser_test_utils.mjs`, `verify_browser.mjs` (sixteen files); `textures/` (36 PNG); `previews/`; `qa/`. The GLB: generator
   "Khronos glTF Blender I/O v5.2.40", 182 nodes, 148 meshes, 86,828 triangles, 27
   materials (`PBR.Cinema.*`), 27 PNG images (2048² for coat, cream, ear-wave and face
   colour and normal maps; 1280² eye; 1024² elsewhere), 66 textures, one skin of 33
   joints, `Sweater.Fabric.001` with five morph targets named in `extras.targetNames`,
   **zero animations**. Bind-pose bounds in glTF Y-up: X −0.781 to 0.810, Y 0 to 3.113,
   Z −1.632 to 1.673. No decimation exists anywhere in the build.
2. **The cel look is not in the GLB.** Natively (D
   `biscuit_pics/generated/3d/miami-cinematic-studies/src/build.py`, `material()` around
   lines 61–117) it is Diffuse BSDF → Shader to RGB → a ColorRamp "Soft cinematic cel
   lighting" (EASE, stops at 0, .28, .48, .71) × tinted colour × occlusion → Emission,
   with inverted-hull `*.Contour` objects (a Geometry Nodes group pushing vertices 0.004
   along the normal, faces flipped, an unlit "Ink" material, D
   `miami-angular-base/src/build.py:534`). The GLB's materials are Principled PBR with
   `KHR_materials_specular`. S C03 specifies the three.js reproduction: `MeshToonMaterial`
   with a three-band `gradientMap` (`NearestFilter`), colour and occlusion maps carried,
   `roughnessMap` dropped, an inverted-hull outline as a `BackSide` mesh per part in the
   ink colour, and the old viewer's `normalStrength` of `.18` on the face and `.32`
   elsewhere as the reference for how much the normal maps contribute.
3. **How the GLB is exported today.** D `src/build.py` `export_glb` (lines 61–77, the exporter call at 72) swaps
   every material for `legacy.c.portable_material(src)` (D
   `miami-cinematic-studies/src/build.py:542`, reachable only through `common.py`'s
   import chain into the studies, which this repository does not have) and calls
   `bpy.ops.export_scene.gltf(filepath=..., export_format='GLB', use_selection=True,
   export_extras=True, export_yup=True, export_animations=False, export_cameras=False,
   export_lights=False, export_apply=False, export_tangents=True, export_skins=True,
   export_def_bones=True, export_morph=True, export_morph_normal=True,
   export_influence_nb=4, export_all_influences=False)`. `export_pose_glb.py` never
   calls the exporter: it rewrites joint `matrix` values and `node.weights` in the GLB
   JSON. No script in the package keyframes anything, creates an action or uses the NLA.
4. **The sweater correctives** are five shape keys on `Sweater.Fabric` (`Shoulder.L`
   ← `front.upper.L`, `Shoulder.R` ← `front.upper.R`, `Hip.L` ← `hind.thigh.L`, `Hip.R`
   ← `hind.thigh.R`, `Belly` ← `spine`), each a SCRIPTED driver reading the bone's
   `ROT_X` in `LOCAL_SPACE` (`rotation_mode='XYZ'`) with the expression
   `min(1,max(0,(abs(angle)-0.25)/1.3))`; `pose_io.correctives` computes the same from the
   pose quaternion's XYZ Euler x, and `verify.py` measured them equal within 5e-8.
   Blender 5.2.1's exporter (`blender/exp/animation/drivers.py`, `get_sk_drivers`) bakes
   a valid shape-key driver on a mesh parented to the armature into morph-weight
   channels of the same clip when sampling is on; an invalid driver makes it skip that
   mesh's drivers entirely. glTF carries no drivers, so anything posed at runtime
   recomputes the formula.
5. **The IK controls** (`CTRL.{front,hind}.paw.{L,R}` at the paw, `CTRL.{front,hind}.bend.{L,R}`
   poles, both parented to `root`, non-deform; an IK constraint "Optional paw IK" on
   `front.lower.{S}` with `chain_count=2` and on `hind.hock.{S}` with `chain_count=3`,
   influence driven by the control's `IK influence` custom property, default 0;
   `ik_stretch` 0 on every chain bone) are dropped by `export_def_bones=True`;
   `export_force_sampling=True` (the default) bakes their effect into the 33 deform
   bones. `pose_io.apply` and every preset reset `IK influence` to 0.
6. **Coordinates.** Blender is Z-up with −Y forward; the GLB is Y-up. `root`'s local Y
   is world Z (the `height` control moves `root` along it). An empty exported with
   `export_yup=True` has +Y up and its local −Z as forward.
7. **The template** at `v2.1.0`: `copier.yml` asks `game_name`, `game_slug`,
   `description`, `repository` and computes the rest; fourteen seed paths are excluded on
   `update` and skipped if they exist (`/README.md`, `/CHANGELOG.md`, `/SECURITY.md`,
   `/docs/project/purpose-and-scope.md`, `/docs/project/terminology.md`,
   `/docs/decisions/`, `/docs/specs/`, `/src/lib/brand.ts`, `/src/lib/components/`,
   `/src/routes/+page.svelte`, `/stories/`, `/tests/restated.ts`, `/tests/lockup.test.ts`,
   `/tests/route.test.ts`); `just check` runs `lock-check`, `lint`, `frontend-static`,
   `frontend-coverage`, `frontend-build`, `storybook-build`, `storybook-test`,
   `check-docs`, `check-agents`, `check-specs`, `analyse-specs`, then `check-clean`, and
   fails if any recipe changed a file Git does not ignore; coverage is v8 over
   `src/lib/**/*.{ts,svelte}` at 90 on all four figures with no exclude; the hook gate
   carries `check-added-large-files --maxkb=768`; `.gitattributes` is
   `* text=auto eol=lf`; ports for `clock`, `random` and `storage` exist with fakes and
   `tests/ports.test.ts` says a port the game adds appends its cases at the end; there is
   no timer or animation-frame port; `vitest.storybook.config.ts` names
   `optimizeDeps.include` and must name any dependency a story imports; every component
   lands with a test and a story, and every story runs axe with `test: 'error'`;
   `scripts/initialize.sh` skips `install-hooks` in a secondary worktree; `dev` and
   `preview` bind `127.0.0.1`; the first `just check` needs the network.
8. **Vite 8.2.1 knows `glb`, `gltf` and `ktx2` as asset types** (`KNOWN_ASSET_TYPES`), so
   `import url from '$lib/assets/biscuit.glb'` yields a hashed, base-aware URL with no
   configuration; `.json` imports parse as modules; `mp3` is an asset type too.
9. **G's workflows** (`game-ci.yml`, `game-pages.yml`, `game-chromatic.yml` at `v0.3.0`)
   check out with `persist-credentials: false` and without `lfs: true`. `game-ci.yml`
   runs three jobs, `frontend`, `documents` and `stories`, and the required checks on
   `main` are `ci / frontend`, `ci / documents`, `ci / stories`. T's `pages.yml` deploys
   after a successful `CI` run of a push to `main`.
10. **`bg-validate-agents`** requires six literal phrases in `AGENTS.md` (`untrusted`,
    `just check`, `explicit authorization`, `ai_tmp/`, `docs/specs/`, `runes`), 300 words,
    and the bridge body byte for byte; **`bg-validate-docs`** requires the five
    frontmatter keys equal to the manifest entry, the H1 equal to the title, forty words,
    no template delimiters or `TODO`/`TBD`/`FIXME`, resolvable links, every page reachable
    from `docs/README.md`, nothing unregistered. T decisions run 0001 to 0010; a game's
    start at 0011.
11. **P's `src/lib/ports/timer.ts`** is the shape for a repeating port: `TimerPort {
    every(intervalMs, tick): () => void }`, a `Scheduler` interface, `createIntervalTimer(
    scheduler = {...globalThis})`, `FakeTimer` with `advance(ms)`. P constructs every port
    in `src/routes/+page.svelte` inside `onMount`.
12. **The hub rules this game breaks as written**, each at H `575e3dd`: direction.md
    line 260 (cream or warm-neutral grounds), 262–263 (3D rendering), 55 and 178–179
    (nothing decorative moves; the only thing that moves is her), 186–189 (sound is
    deferred and "when it is taken, it is taken here"), 220–224 (motion off reduces her to
    the mark), 91–98 (differentiation never by re-theming the shell), 85–89 (the naming
    table lists Poodl and Pawjong only); character.md 69–73 and 115–120 (absent while a
    player is thinking; never anywhere she competes with play), 89–98 (the first pose set
    is commissioned from an illustrator), 100–104 (a clock is a side effect and needs a
    port). H decision `0018` is claimed by S ticket C01 (open) and by T ticket C05, so
    C01 here writes the next free number: `0018` if it absorbs S C01, otherwise `0019` or
    later. S C01's narrowed Avoid bullet still
    forbids "3D that reads as 3D — physically based materials, gloss, realistic
    lighting", so it does not cover a fire-lit room; C01 here narrows further and, if S
    C01 has not landed when C01 is picked up, absorbs S C01's narrowing so that the hub
    changes once.
13. **The platform clauses every surface owes** (H `docs/specs/operation.allium`):
    `ATapDoesOnlyWhatTheControlDoes` (119), `DeliberateZoomIsNeverTakenAway` (126),
    `EveryControlIsAComfortableTarget` (133; 44 px both ways; a control built from a
    generic element is the surface's own to size, 182–190), `ATouchIsAcknowledged` (195),
    `FullyKeyboardOperable` (220), `FocusIsVisibleWhereverItLands` (227),
    `AChangeNobodyIsLookingAtIsAnnounced` (240), `EveryPromiseHereHoldsAtTheNarrowestWidth`
    (247; 320 px, nothing scrolls sideways); the `Dialog` guarantees (258–287) for the
    settings modal; the `TypedInput` rules (353–399) if any bare key is ever claimed. H
    `docs/specs/appearance.allium`: `ReducedMotionOverridesTheAnimationSetting` (140),
    `AppearanceNeverCarriesMeaningAlone` (152), `EveryCombinationMeetsTheLegibilityFloor`
    (159). The `--dur-*` tokens are `0ms` unless `data-animations="on"` and do nothing for
    a `requestAnimationFrame` loop: the scene stops itself when `animationsActive(...)`
    is false. `Announcer` (`role="status"`) is how a change is said in words.

## 2. Repository tree (exact paths), with the ticket that owns each

Legend: the owner is the ticket whose Files-touched table lists the path in its final
form. P00 renders the template, so every template path exists after P00 in the form T
gives it; paths below are the ones the game adds or edits. Paths marked **(no lane)** are
written by P00 and touched by no lane; a lane that needs a change there hands it back.
"H", "T", "G", "P", "S", "D" as §0.

```text
.copier-answers.yml                          P00   rendered; answers as §1 decision 1
package.json, package-lock.json              P00   T's, appended: three, @types/three, @gltf-transform/cli, sharp (§2.1) (no lane)
pyproject.toml, uv.lock                      P00   T's, appended: recipes gain check-assets; ruff and typos excludes for blender/src/ (§2.2) (no lane)
Justfile                                     P00   T's, appended: the assets and model sections (§2.3) (no lane)
.gitattributes                               P00   T's, appended (§3) (no lane)
.gitignore                                   P00   T's, appended: blender/out/ (no lane)
.pre-commit-config.yaml, .pre-commit-fix.yaml  P00 T's, check-added-large-files gains exclude (§3) (no lane)
.prettierignore                              P00   T's, appended: blender/src, src/lib/assets
eslint.config.js                             P00   T's, ignores gains 'blender/'
lychee.toml                                  P00   T's, exclude_path gains "blender/src"
.markdownlint-cli2.jsonc                     P00   T's, ignores gains "blender/src"
vitest.storybook.config.ts                   P00   optimizeDeps.include gains 'three' (a deviation, §1 decision 21) (no lane)
scripts/check_assets.py                      P00   §3, final (no lane); P03 may extend only through a hand-back
scripts/build_assets.sh                      P03   the gltf-transform pipeline (§4.3)
scripts/contact_sheet.py                     P04   renders a clip to a sheet under ai_tmp/ (Blender + Pillow)
scripts/strip_normals.mjs, scripts/clip_table.mjs, scripts/placeholder_still.mjs   P03   pipeline helpers on @gltf-transform/core and sharp
scripts/check_cabin.py                       P05   asserts the §5.2 contract on cabin.glb
scripts/make_fire.py                         P07b  draws the flame flipbook (Pillow)
scripts/make_audio.py                        P08   synthesises the five loops
src/lib/assets/manifest.json                 P00   stub `{"schema_version": 1, "assets": []}`; P03 fills; P04, P05, P08 append through `just assets-manifest`
src/lib/assets/biscuit.glb                   P03   the served model (P02's proof clip); P04 replaces it with the core set
src/lib/assets/biscuit.clips.json            P03   clip table (§4.3); P04 replaces
src/lib/assets/cabin.glb                     P05
src/lib/assets/stills/<activity>.<phase>.webp  P04 the stills (§3)
src/lib/assets/stills/idle.morning.webp      P03   placeholder from D previews/standing-hero.png so P07a has a still; P04 replaces it
src/lib/assets/fire.webp                     P07b  the flame flipbook, 256×2048, eight frames
src/lib/assets/audio/{fire,rain,wind,lapping,squeak}.mp3 (or .m4a, §3)  P08
docs/specs/pawlour.allium                    P01   the seed, rewritten (§8)
docs/specs/cabin.allium                      P01   (§8)
tests/restated.ts                            P01   (§8)
blender/README.md                            P00 stub; P02   provenance (§3)
blender/model/biscuit-poseable.blend         P02   D's, byte-identical, LFS
blender/src/** (D's src/, sixteen files)     P02   byte-identical; excluded from every linter
blender/model/rig.json, blender/poses/*.json P02   D's, byte-identical, in D's layout so the copied scripts resolve them
blender/export_animated_glb.py               P02   the exporter (§4.2)
blender/build_clips.py                       P02   runs every blender/clips/*.py into blender/out/biscuit-clips.blend (§4.1); P02 ships it with the proof clip
blender/clips/idle_stand.py (the proof clip) P02
blender/clips/<clip>.py (nine more)          P04
blender/clips/_keys.py                       P04   shared keyframe helpers; build_clips.py skips `_`-prefixed files
blender/cabin/build.py, blender/cabin/*.py   P05   the room (§5.2)
src/lib/domain/director.ts                   P06   the reducer (§6)
src/lib/domain/phases.ts, weather.ts, captions.ts, items.ts, timing.ts   P06
src/lib/data/captions.ts                     P06   the bank (§6.3)
src/lib/ports/timer.ts, frame.ts, audio.ts   P06   (§6.2); cases appended to tests/ports.test.ts
src/lib/components/ItemControls.svelte, TimeControl.svelte, SoundControl.svelte, CameraControl.svelte, Caption.svelte, TitleCard.svelte, PhotoButton.svelte, SettingsDialog.svelte   P08  each with tests/<name>.test.ts and stories/<Name>.stories.svelte
src/lib/photo.ts                             P08   the title-card composition, pure (§7)
src/lib/components/overlay.css               P08   the graphic register's tokens (§5.3)
tests/scene-canvas.test.ts                   P07a  the still renders when WebGL2RenderingContext is absent
src/routes/scene/SceneCanvas.svelte          P07a  the canvas component (§5)
src/routes/scene/scene.ts, materials.ts, lighting.ts, camera.ts, cabin.ts, biscuit.ts, hit.ts, still.ts   P07a
src/routes/scene/motion.ts, walk.ts, fire.ts, weather.ts, wipe.ts, idle.ts   P07b
src/routes/+page.svelte                      P08   T's seed replaced (§7)
docs/** (game pages, decisions 0011–0014)    P09   (§9); docs/manifest.yml and docs/README.md appended by P09 only
tests/*.test.ts (game tests)                 the ticket that owns the module
stories/*.stories.svelte (game stories)      P08
tickets/                                     the maintainer's; each ticket edits its own `status:` line
```

### 2.1 `package.json` additions (P00)

Appended to T's rendered file, exact versions re-read with `npm view <name> version` on
the day and recorded in P00's hand-back (the figures below are 2026-09-25's):

```json
"dependencies": { "...T's...", "three": "0.186.1" },
"devDependencies": { "...T's...", "@gltf-transform/cli": "4.5.0", "@types/three": "0.186.0", "sharp": "0.35.4" }
```

`three` is a dependency because the built site ships it. `@types/three` is pinned to the
same minor as `three`; if npm's `@types/three` lags a patch behind, the pair is pinned at
`three`'s minor and `@types/three`'s latest patch of that minor, and the hand-back says
so. `sharp` is what `@gltf-transform/cli` uses to resize and encode textures; if `npm ls
sharp` shows the CLI already installs it, the explicit pin stays (an exact pin of a
transitive dependency is harmless and makes the version visible).

### 2.2 `pyproject.toml` additions (P00)

```toml
[tool.biscuit-games-tooling]
recipes = [
  "lock-check", "lint", "frontend-static", "frontend-coverage", "frontend-build",
  "storybook-build", "storybook-test", "check-docs", "check-agents", "check-specs",
  "analyse-specs", "check-assets",
]
```

The dev group gains `pillow==<current>` (for `scripts/contact_sheet.py` and the still
crops). `[tool.ruff] extend-exclude` gains `"blender/src"`; `[tool.ruff.lint.per-file-ignores]`
gains `"blender/**"` and `"scripts/**"` with the studio's list (S `pyproject.toml`
lines 460–463: `ANN`, `BLE001`, `EM101`, `EM102`, `INP001`, `PLR0912`, `PLR0915`,
`PLR2004`, `S404`, `S603`, `S607`, `T201`, `TRY003`), because they print, shell out and
run inside Blender. `[tool.typos.files] extend-exclude` gains `"blender/src/"` and
`"src/lib/assets/"`.

### 2.3 `Justfile` additions (P00)

Appended after T's `check-agents` recipe, comments in T's register:

```just
# ------------------------------------------------------------------ assets ---

# Every file under src/lib/assets/ against src/lib/assets/manifest.json:
# present, listed, byte-identical to the recorded sha256, within its budget,
# and carrying a settled licence. Part of `just check`.
check-assets:
    uv run --frozen python scripts/check_assets.py check

# Rewrites the manifest from the worktree after the checker's self-test. Keeps
# every entry's `source`, `licence` and `budget`; recomputes the rest. Read the
# diff before committing.
assets-manifest:
    uv run --frozen python scripts/check_assets.py write

# One served GLB (and, for biscuit, the clip table) from blender/out/, through
# gltf-transform: `just assets-build biscuit` or `just assets-build cabin`.
# Needs `just model-export` or `just cabin-export` to have run.
assets-build name:
    sh scripts/build_assets.sh {{name}}

# ------------------------------------------------------------------- model ---

# blender/out/biscuit-clips.blend: the approved .blend plus every clip under
# blender/clips/ as an NLA track. Needs Blender; never part of `just check`.
model-clips:
    "${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}" --background --python-exit-code 1 --python blender/build_clips.py

# blender/out/biscuit-raw.glb: the clips .blend exported with animations and
# the portable materials. Needs `just model-clips`.
model-export:
    "${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}" --background --python-exit-code 1 --python blender/export_animated_glb.py

# blender/out/cabin-raw.glb: the room, built and exported in one run.
cabin-export:
    "${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}" --background --python-exit-code 1 --python blender/cabin/build.py

# ----------------------------------------------------------------- develop ---

# The preview server on every interface, for a phone on the same network.
# `just preview` stays on 127.0.0.1.
preview-lan:
    npm run preview -- --host 0.0.0.0
```

## 3. Assets, large files and the manifest

`.gitattributes` (P00 appends to T's one line):

```text
# Large-file policy: docs/decisions/0011-served-assets-are-blobs-and-blends-are-lfs.md.
# Nothing the site serves may be an LFS object, because the shared workflows
# check out without LFS and Pages would publish a pointer. The .blend is never
# served or read in CI, so it lives in LFS.
blender/**/*.blend filter=lfs diff=lfs merge=lfs -text

# Binary and generated: never normalised, never diffed.
*.glb -text -diff
*.webp -text -diff
*.png -text -diff
*.jpg -text -diff
*.mp3 -text -diff
*.m4a -text -diff
```

`git lfs install --local` runs in P00 (it is per clone; `scripts/initialize.sh` does not
run it and is a managed file, so P00 documents it in `docs/how-to/develop-locally.md`'s
game section through P09 and runs it by hand). A CI checkout sees pointer text for the
`.blend`, which nothing there reads.

`.pre-commit-config.yaml` and `.pre-commit-fix.yaml`: the `check-added-large-files` hook
gains `exclude: ^src/lib/assets/` (a per-hook `exclude`, §11 claim 1). No other hook
changes. `--maxkb` stays at 768, so a large file anywhere else is still refused.

**The manifest.** `src/lib/assets/manifest.json` is strict JSON, one object per line inside
`assets`, sorted by `path`, one trailing newline (Prettier ignores it; `check-json` parses
it). Every file under `src/lib/assets/` has an entry except the manifest itself. An
entry:

```json
{"path": "src/lib/assets/biscuit.glb", "bytes": 5210044, "sha256": "…", "source": "built:2026-10-02", "licence": "unsettled", "budget": 6291456}
```

Fields, all required, in this order: `path`, `bytes`, `sha256`, `source`
(`biscuit_pics@1d9d358:<path>` for a copied file, `built:<date>` for a file
`scripts/build_assets.sh` or a Blender recipe wrote, `made:<date>` for a file made by
hand or by a script here, `cc0:<url>` for a public-domain download), `licence`
(`unsettled`, `cc0`, or `platform` for a file whose licence is the platform's own
unresolved question, H `docs/design/character.md` lines 128–134) and `budget` (bytes;
`0` for no budget).

`write` fills `source`, `licence` and `budget` with defaults for a new file; the ticket
that adds the file then sets those three fields by hand in the same commit, and they are
the only fields the manifest ever takes by hand. `bytes` and `sha256` are always the
tool's.

`scripts/check_assets.py` (P00, final; ruff-clean under §2.2; standard library only) has
`check` (walk `src/lib/assets/`; refuse a file with no entry and an entry with no file;
recompute `bytes` and `sha256` and refuse a mismatch; refuse `bytes` above a non-zero
`budget`; refuse a `licence` that is not one of the three values; refuse an audio file
whose `licence` is `unsettled`; refuse a `source` in none of the four forms; exit 0 with
one summary line or print every finding as `<path>: <reason>` and exit 1), `write`
(recompute every entry from the worktree keeping `source`, `licence` and `budget` where
an entry exists and writing `made:<today>`, `unsettled`, `0` for a new file; run
`self-test` first and write nothing if it fails; then run `check`), and `self-test` (a
temporary tree with one in-budget file, one over budget, one unlisted, one listed but
absent, one tampered byte, an audio file with `unsettled`; assert each refusal names the
file). `check` runs `self-test` first so `just check-assets` proves its checker on every
run.

**Budgets** (`PRD.md`'s table, in bytes): `biscuit.glb` 6,291,456; `cabin.glb`
3,145,728; each still 262,144; `fire.webp` 262,144; each audio file 524,288. `check`
asserts each file against its own budget and no total: the per-file budgets sum past
12 MB by design, because a visit loads the two GLBs, one still and the fire texture and
fetches audio and the other stills on demand. `PRD.md`'s 12 MB first-load figure is what
P10 measures on the device, not a rule of the manifest.

**Provenance.** `blender/README.md` names D `1d9d358`, the date, the sha256 of the
`.blend` and of every copied file, the seven-folder rebuild chain the copied `build.py`
would read (`miami-cinematic-eyes-refined` → `miami-cinematic-sweater-foreleg-refined` →
`miami-cinematic-tail-drape-studies` → `ear-profile-studies` → `ear-studies` →
`cinematic-studies` → `miami-angular-base`) and the sentence that the chain stays in
`biscuit_pics` and that `build.py` is therefore not runnable here: the copied scripts are
kept as the record of how the model was made and for `pose_io.py`, `rig.py`'s constants
and `blender_pose_tools.py`, which the exporter and the clip scripts import.

**Stills.** `src/lib/assets/stills/<activity>.<phase>.webp`, one per activity in
`idle`, `sleep.bed`, `sleep.chair`, `drink`, `eat`, `play` and per phase in `morning`,
`evening`, `night` (eighteen files), rendered by P04's `scripts/contact_sheet.py` from
the hearth camera at 1170×2532 (the phone's portrait pixel size) and encoded WebP at
quality 80, each under 262,144 bytes. They are what still mode shows before the renderer
has drawn and what context loss shows. They are `built:` files. Until P04 lands, P03
ships one placeholder, `stills/idle.morning.webp`, encoded from D
`models/biscuit/previews/standing-hero.png` (source
`biscuit_pics@1d9d358:models/biscuit/previews/standing-hero.png`, licence `platform`), so
P07a's still has a source.

**Audio.** `src/lib/assets/audio/{fire,rain,wind,lapping,squeak}.mp3` (or `.m4a` when the
machine has no MP3 encoder; P08 records which, and the extension is the same for all
five), mono, 44.1 kHz,
loops of 8 to 20 seconds, each under 524,288 bytes, made by P08 either by synthesis in
`scripts/make_audio.py` (noise shaped by filters and envelopes; `made:` source, `cc0`
licence because it is this repository's own work) or downloaded from a source whose
licence is CC0 and recorded as `cc0:<url>`. No file from a commercial library and no
file whose licence is `unsettled` ships: `check` refuses it.

**Content policy.** No photograph of the real dog is copied (D `biscuit_pics/raw/`,
163 files, most with camera EXIF). Nothing under D `inspiration/`, `generated/bad/`,
`generated/3d/`, `model_sheets/`, `ai_tmp/` or `good/`. The licence of the model itself
is the platform's open question; the manifest says `platform` for every `biscuit_pics@`
entry and the game does not resolve it.

## 4. The model and the animation pipeline

### 4.1 Clips

A clip is a python script `blender/clips/<name>.py` exporting one function
`build(rig: bpy.types.Object, start: int) -> int` that, on the open scene, creates an
Action named `<name>` (the dotted name, `idle.stand`), keyframes it, pushes it as a strip
on an NLA track named `<name>` starting at frame `start`, and returns the last frame
used plus one. `blender/build_clips.py` opens `blender/model/biscuit-poseable.blend`,
sets the scene to 30 fps, imports every script under `blender/clips/` in name order,
calls each `build`, and saves `blender/out/biscuit-clips.blend` (gitignored). The
committed `.blend` is never modified: it stays byte-identical to D's.

Rules every clip obeys:

- **Authored in place.** No clip translates `root` along the floor. `walk` bobs `root`
  vertically only (`root` local Y, which is world Z) and cycles the legs; forward motion
  is the runtime's, applied to the model's transform (§5.4), so the two never add.
- **Starts and ends on the approved poses** where a pose exists: `idle.stand` and `walk`
  on `standing.json`, `idle.sit` on `sitting.json`, `sleep` on `lying.json`. Transitions
  (`sit`: standing → sitting; `lie`: sitting → lying) are played forward and, by the
  runtime, in reverse. `pose_io.apply` (imported from `blender/src/pose_io.py`) sets a
  preset; interpolation between presets is keyframed on the deform bones with Bezier
  handles and ease.
- **IK is allowed and is baked.** A clip may enable a paw's `IK influence`, move its
  `CTRL.*.paw.*` target and keyframe the target; the exporter's sampling bakes the result
  into the deform bones. Every clip keys every paw's `IK influence` on its own first and
  last frame, 1 across a clip that uses that paw's IK and 0 otherwise, so no action
  inherits the value another left behind and no key falls outside the strip (a key on
  the frame after the strip would extend the action's range into the export and break
  the loop).
- **Loops loop.** `idle.stand`, `idle.sit`, `walk`, `sleep`, `drink`, `eat`, `play`
  have identical first and last frames. `sit`, `lie` and `pet` are one-shot.
- **`pet` is additive.** It is authored on `standing.json`, moves only `pelvis`, `spine`,
  `tail.1`, `ear.1.L` and `ear.1.R`, and keys every other bone constant at the preset, so
  the runtime can turn it into an additive clip (a constant channel becomes an identity
  delta) and play it over whatever clip is running (§5.4, §11 claim 15); it is never
  crossfaded to as a pose of its own.
- **The correctives take care of themselves**: the drivers stay on the shape keys and
  the exporter bakes them (§1 fact 4). No clip keyframes a shape key.
- **Every clip has a contact sheet**: `scripts/contact_sheet.py <name>` renders twelve
  evenly spaced frames from the hearth camera's angle with `render.py`'s settings into
  `ai_tmp/clips/<name>.jpg`, and the maintainer's approval of the sheet is the gate for
  the clip. A clip the maintainer refuses is reworked, not shipped.

The core set, with duration, kind and what it must read as:

| Clip | Frames at 30 fps | Kind | Reads as |
| --- | --- | --- | --- |
| `idle.stand` | 120 | loop | standing, weight shifting once, head turning a little; the P02 proof clip |
| `idle.sit` | 120 | loop | sitting, ears settling, one look aside |
| `walk` | 30 | loop | one stride cycle, four-beat, head level, tail up; stride length recorded (§4.3) |
| `sit` | 30 | one-shot | standing to sitting |
| `lie` | 36 | one-shot | sitting to lying, head coming down last |
| `sleep` | 180 | loop | lying, slow breath (the runtime adds the rest), head turned away from the hearth camera or under a foreleg (`PRD.md`, her eyes stay open) |
| `drink` | 60 | loop | head down to a bowl, small lapping nods |
| `eat` | 60 | loop | head down, a chewing motion, one glance up |
| `play` | 90 | loop | a shake of the head with the toy, a drop, a paw at it |
| `pet` | 60 | one-shot, additive | a lean into the touch, tail up, ear back, settle, played over the running clip |

v1.1: `yawn`, `stretch`, `circle` (three turns then `lie`), `treat` (sit, take, chew),
`look` (a head turn to a direction the runtime blends).

### 4.2 The exporter

`blender/export_animated_glb.py` opens `blender/out/biscuit-clips.blend`, replaces every
material on the character parts with a port of `portable_material` (P02 reads D
`biscuit_pics/generated/3d/miami-cinematic-studies/src/build.py` line 542 onward and
reproduces it here, in this file, with the source cited in a comment; the port keeps the
same texture assignments so the exported GLB's materials match D's GLB's; the original
calls `image(texture, kind)` from the studies module and reads the material custom
properties `texture_family`, `tint`, `gloss` and `solid_color`, and the port replaces
`image()` with a lookup of the images packed in `bpy.data.images`, recording the mapping
in P02's hand-back), selects the
148 parts and `Biscuit.Rig`, makes the rig active, and calls
`bpy.ops.export_scene.gltf` with D's arguments (§1 fact 3) changed as follows:

```python
export_animations=True,
export_animation_mode='NLA_TRACKS',
export_force_sampling=True,
export_frame_step=1,
export_morph=True,
export_morph_animation=True,
export_optimize_animation_size=True,
export_anim_slide_to_zero=True,
export_image_format='AUTO',
```

For the 2026-09-25 paw-contact correction, the exporter temporarily scales NLA
strip times and scene fps by 20 in memory, sampling at 600 Hz. Blender's integer
frame sampler otherwise drops authored fractional-frame contacts and introduces
sliding between them. Clip durations stay unchanged; the saved scene and source
actions remain at 30 fps. Export assertions check every changing channel's sample
grid, original duration and authored walk-contact boundaries.

Output: `blender/out/biscuit-raw.glb` (gitignored). The exporter asserts, by reading the
GLB's JSON chunk afterwards, that `animations` has one entry per clip named after its
track, that the `Sweater.Fabric.001` node's morph weights are animated in every clip
whose bones move the corrective bones, and that `skins[0].joints` has 33 entries whose
names equal `rig.json`'s bone names in order. §11 claims 3 and 4 are what P02 proves.

### 4.3 The pipeline

`scripts/build_assets.sh <name>` (P03) takes `biscuit` or `cabin` and runs:

```sh
npx gltf-transform prune  blender/out/<name>-raw.glb ai_tmp/<name>.1.glb
npx gltf-transform dedup  ai_tmp/<name>.1.glb        ai_tmp/<name>.2.glb
npx gltf-transform flatten ai_tmp/<name>.2.glb       ai_tmp/<name>.3.glb
npx gltf-transform join   ai_tmp/<name>.3.glb        ai_tmp/<name>.4.glb   # per material; keeps skins and morphs (§11 claim 5); the cabin pass adds --keepNamed true
npx gltf-transform resize ai_tmp/<name>.4.glb        ai_tmp/<name>.5a.glb --width 1024 --height 1024
npx gltf-transform resize ai_tmp/<name>.5a.glb       ai_tmp/<name>.5.glb --pattern "occlusion|roughness" --width 512 --height 512
npx gltf-transform webp   ai_tmp/<name>.5.glb        ai_tmp/<name>.6.glb --quality 82
npx gltf-transform meshopt ai_tmp/<name>.6.glb       src/lib/assets/<name>.glb --level medium
```

then writes `src/lib/assets/biscuit.clips.json`:

```json
{ "clips": [ { "name": "walk", "seconds": 1.0, "loop": true, "stride": 0.45 }, ... ], "height": 3.113 }
```

`seconds` from the GLB's animation samplers, `loop` from §4.1, `stride` (scene units of
forward travel per cycle at the runtime's scale, §5.1) from a constant in
`blender/clips/walk.py` that the script reads, `height` from the GLB's bind bounds; then
runs `just assets-manifest`. Normal maps are removed before `resize` (`gltf-transform
prune --keep-attributes false` does not do this; the script strips `normalTexture` from
every material with `scripts/strip_normals.mjs`, a small `@gltf-transform/core` script beside it; the
clip table is written by `scripts/clip_table.mjs`) unless P07a's
look review keeps them, in which case P07a hands back a one-line change to the script.
The `cabin` pass skips `join` where P05 needs separate item meshes for hit-testing (§5.2):
every mesh under an `item.*` empty is kept apart by `join --keepNamed true`.
Its deduplication also preserves unique material names. The cabin meshopt pass
quantizes other vertex attributes but keeps positions as compressed floats:
position quantization would shift the named pane origins that weather and room
validation use. `scripts/optimize_cabin.mjs` implements those two cabin passes;
the character keeps the standard compression settings.

`check_assets.py check` then proves the budgets. P03 records, in its hand-back, the
triangle count, draw-call count (materials × primitives), file size and texture bytes
before and after, and whether `join` reduced the 148 meshes to a number the phone can
draw (§12); if not, `gltf-transform simplify` is the next lever and its error figure is
recorded.

## 5. The scene and rendering

### 5.1 Units, scale and axes

The scene unit is the metre. The room is modelled at true scale: floor 5 × 4 units, origin
at the floor's centre, +Y up (after export), the hearth wall at −Z. Biscuit is scaled by
the runtime so that her bind-pose height (`biscuit.clips.json` `height`, 3.113 today)
becomes **0.55 units** (a miniature poodle to the top of the topknot); the factor is
computed, never hard-coded. An empty's forward is its local −Z. Walking speed is
`stride / seconds` of the `walk` clip at that scale, so the feet do not slide.

### 5.2 The `cabin.glb` contract

This is the one interface P05 (which makes the room) and P07 (which draws it) share, and
they run in parallel; P07a builds against a stub cabin of boxes it writes under `ai_tmp/`
until P05 lands. The runtime refuses a cabin missing any required node and names it.

Required empties (glTF nodes with no mesh), by exact name:

| Name | Meaning |
| --- | --- |
| `item.bed`, `item.chair`, `item.water`, `item.food`, `item.toy`, `item.jar`, `item.lamp`, `item.lights`, `item.fire`, `item.window`, `item.table`, `item.shelf` | the thing's origin; every mesh belonging to it is a descendant of this node |
| `item.<name>.approach` for `bed`, `chair`, `water`, `food`, `toy`, `jar`, `lamp`, `lights` | where she stands to use it, facing −Z toward it; carries `extras.nav` naming its nearest waypoint |
| `spot.bed`, `spot.chair` | where she lies, with facing; `spot.chair` is on the seat |
| `nav.0` to `nav.<n>` | waypoints on the floor; each carries `extras.edges`, a list of neighbouring waypoint names; the graph is connected and undirected |
| `camera.hearth`, `camera.window`, `camera.chair` | the three presets; position and −Z view direction; `extras.fov` vertical degrees |
| `light.window`, `light.fire`, `light.lamp`, `light.strings.0` to `light.strings.<n>` | positions the lighting rigs place lights at |
| `glass.window` | the pane, a mesh; weather particles live in the box behind it (`extras.depth` units) |
| `fire.anchor` | where the flame planes and embers sit |
| `steam.anchor` | the mug's steam |

Meshes: every mesh carries `COLOR_0` vertex colours in the phase-neutral warm axis (§5.3)
and a material named `cabin.<surface>` (`cabin.log`, `cabin.plank`, `cabin.rug`,
`cabin.leather`, `cabin.ceramic`, `cabin.cloth`, `cabin.metal`, `cabin.paper`,
`cabin.stone`, `cabin.glass`); no textures in v1 except one 512² `cabin.rug` colour map and one for the
record sleeves. The window glass is `cabin.glass` and is transparent. Triangles in total
at most 40,000; P05 records the figure.

### 5.3 The look, one register per layer

**Biscuit (P5 system 1, S C03's recipe).** Every `MeshStandardMaterial` in `biscuit.glb`
is replaced by a `MeshToonMaterial` with a three-band `gradientMap` (`NearestFilter`,
bands at the values D's viewer used, which P07a reads from D
`models/biscuit/src/viewer.template.html` lines 55–63 and 111–118 and records), `map` and
`aoMap` carried, no `roughnessMap`, `normalMap` only if kept (§4.3). An inverted-hull
outline mesh per part (`BackSide`, a solid ink material, vertices pushed along the normal
by 0.004 × the model's scale) in the ink colour. Face lines read as coloured ink, not
black: the ink is the platform's `--text` on the dark theme only where it borders the
room; on her it is a warm near-black fixed in `materials.ts`. She casts no shadow map;
under her sits a hard-edged contact disc at 0.6 of the lit floor value (Catherine, "Contact
shadow is a flat hard-edged shape at 0.60–0.65× the lit value").

**The room (Catherine's painted ground).** `cabin.*` materials are `MeshToonMaterial`
with a five-band ramp (softer than hers), vertex colours multiplied in, no outlines, no
specular. Every surface's hue sits inside a 15° wedge on the warm axis (hue 20° to 35°);
planes are separated by value and by the ramp, never by hue; the one off-axis accent per
phase is the window's sky (cool by night, pale by morning) at a budget of a few percent
of the frame. Dark masses (the hearth's interior, the shelf's shadow) are pushed toward
true black by zeroing green and blue rather than greying. A large soft gradient sits
across the whole frame as a vignette in the post pass, never inside a shape.

**Overlays (P5 system 2).** The title card, the loading card, the photo frame and the
wipe are DOM, not canvas: flat scarlet, black and white panels split by hard diagonals
(`clip-path` polygons), type in Bricolage Grotesque at the platform's display sizes,
white on black and black on white alternating, no halftone, no gradient, no rotation of
letters (ransom lettering is out: it reads as noise beside the platform's type). Colour
values are tokens the game states once in `src/lib/components/overlay.css`, measured
against the platform floors in all four combinations because the card carries words.
The one warm family the platform rations to the brand mark is not used here; the
scarlet is the game's own and is declared as a game token with its contrast recorded.

### 5.4 The runtime (`src/routes/scene/`)

`SceneCanvas.svelte` owns a `<canvas aria-hidden="true">` and, in `onMount`, constructs
`scene.ts`'s `createScene({ canvas, frame, preferencesAnimationsActive, assets })` which:

- Loads `biscuit.glb` and `cabin.glb` with `GLTFLoader` and `MeshoptDecoder`
  (`three/addons/libs/meshopt_decoder.module.js`), reports progress to the loading card
  through a callback, and refuses a cabin missing a required node (§5.2).
- Applies the materials (§5.3), scales Biscuit (§5.1), builds the three lighting rigs
  (`lighting.ts`) as three fixed light sets switched by phase with a 600 ms blend when
  motion is on and a cut when it is off: a `HemisphereLight` for the room's ambient, a
  `DirectionalLight` at `light.window` (key by morning, weak amber by evening, off at
  night), a `PointLight` at `light.fire` (weak by morning, medium by evening, the key at
  night; flicker is `fire.ts`), a `PointLight` at `light.lamp` and small ones at
  `light.strings.*` (on by the director's light state).
- Places the camera at the active preset (`camera.ts`), portrait framing; on resize keeps
  the room's floor width in view by adjusting distance, never fov; DPR capped at 2.
- Applies a `SceneState` (§6.1) each time the page hands it one: her position and facing
  (interpolated along the path by `walk.ts`, §5.1's speed, turning in place before
  setting off), her clip (`motion.ts` crossfades on the `AnimationMixer` over 250 ms;
  `stand` reverses, by `timeScale = -1`, the clips that reach the pose she is leaving,
  `lie` then `sit` from lying and `sit` alone from sitting; `pet` is an additive action
  layered over the interrupted activity's clip, which keeps playing), the lights, the
  fire level, the weather, the phase.
- Layers procedural idle (`idle.ts`) on top of any clip: a breathing scale on `chest` of
  ±1.5% at 0.25 Hz, an ear twitch on `ear.1.L` or `ear.1.R` every 6–14 s, a tail sway on
  `tail.1`–`tail.3` of ±8° at 0.4 Hz while standing or sitting, a head turn toward
  `lookAt` (a floor point, or an item resolved to its node's position) on `neck` and
  `head` limited to ±40° and eased over 400 ms. Bone names
  are `rig.json`'s; the runtime finds them by name and refuses a GLB missing one.
- Draws the fire (`fire.ts`): three camera-facing planes at `fire.anchor` stacked in
  depth, each an eight-frame flipbook of a cel flame (three value steps, drawn by P07b
  as a 256×2048 WebP under `src/lib/assets/`), advanced at 8 fps out of phase; embers as
  twenty instanced quads rising; the point light's intensity is its rig value × (1 +
  0.15 × a 3 Hz smoothed noise). Weather (`weather.ts`): at most 300 instanced quads in
  the box behind `glass.window`, streaks for rain falling at 4 units/s, flakes for snow
  at 0.6 units/s with sideways drift; none by clear. Steam at `steam.anchor`: six quads
  rising and fading.
- Hit-tests (`hit.ts`) a tap with a `Raycaster` against every descendant of every
  `item.*` node and against Biscuit's meshes, and reports `item.<name>`, `biscuit` or
  `floor` with the floor point to the page, which issues the command (§6.1). The
  canvas's own tap is a convenience; the DOM controls (§7) are the controls.
- Runs the loop only through the frame port and only while `animationsActive` is true;
  otherwise (`still.ts`) it renders exactly once per `SceneState` it is handed, with the
  fire at a fixed middle frame, no particles, and lighting cuts. Before the first frame
  and on `webglcontextlost` the component shows the still for the current activity and
  phase (§3) as an `<img>` with the caption as alt text and reports the loss through
  `onContextLost`; a tap on the still calls the component's exported
  `forceContextRestore()`, which restores through the `WEBGL_lose_context` extension when
  present and otherwise rebuilds the renderer and reloads the assets.
- Exports two functions the page calls on the component instance: `capture(): string`
  (a synchronous render, then `toDataURL('image/png')`, §11 claim 12; the director and
  the frame loop are not touched) and `forceContextRestore(): void`. Takes `webgl:
  boolean` (default `true`; `false` constructs no scene and shows the still, for the
  story and the tests).
- The wipe (`wipe.ts` and the `TitleCard` component): a DOM panel that sweeps a
  diagonal across the viewport over `--dur-3` (180 ms when animations are on, 0 when
  off) on load-in and when photo mode opens.

Nothing under `src/routes/scene/` reads a global: `requestAnimationFrame` comes through
the frame port, `devicePixelRatio` and the canvas size through arguments the component
passes from `window` inside `onMount`, time through the clock port.

## 6. The director, the state and the ports

### 6.1 The director (`src/lib/domain/director.ts`)

A pure reducer `step(state, command, deps): SceneState` where `deps` carries the random
port and the constants in `timing.ts`. Commands: `tap(item)`, `tapBiscuit`,
`tapFloor(point)`, `tick(ms)`, `setPhase(phase | 'auto')`, `clockPhase(phase)`,
`setWeather(weather)`, `toggleLight('lamp' | 'strings')`, `setSound(on)`,
`setCamera(preset)`, `motionChanged(active)`.

`SceneState` (serialisable): `activity` (`idle.stand`, `idle.sit`, `walk`, `sit`, `lie`,
`sleep`, `drink`, `eat`, `play`, `pet`, `stand` for the reversed transitions), `at` (the
item she is at or heading to, or `floor`), `target` (a point and facing, or absent),
`lookAt` (a floor point or the item to look toward, or absent), `phase`, `phaseOverride`,
`weather`, `lights` (`lamp`, `strings`), `fire` (0 to 1), `camera`, `sound`, `caption`
(the sentence and a sequence number, or absent), `motion`. P06 embeds the type and the
command union in its ticket and that text is canonical: it may add bookkeeping fields
(`elapsed`, `untilIdleChoice`, `shown`, `resume`, `standFrom`) and an `arrived` command,
and P07 and P08 read P06's file. `Item` in v1 is `bed`, `chair`, `water`, `food`, `toy`,
`lamp`, `lights`; `jar` and `fire` ship as room anchors and the director ignores them
until v1.1.

Rules: a tap on the item she is using is ignored; a tap on the lamp or the string lights
toggles that light and turns her head toward it, and never walks her; a tap while she is
busy replaces any pending target so the last tap wins once the current activity's minimum
has elapsed; a tap on her is a reaction, not an activity: `pet` plays at once over
`idle.stand`, `idle.sit`, `drink`, `eat` or `play`, with that activity's `elapsed` paused
and any pending target kept, and hands her back to it after the pet duration; a tap on
her while she walks, sits, lies, stands or is already being petted changes nothing, and
asleep it wakes her as any tap does; `walk` is entered by turning to face the target
first; arriving at an item plays its transitions (`sit` then `lie` for the bed and the
chair, each for its clip's length, stepped by the director) and then its activity; a
settled activity sets `caption` once (never on the tap); lights follow phase unless
toggled, and a toggle holds until the phase changes; `fire` is 0.35 by morning, 0.7 by
evening, 1.0 by night; `sleep` lasts until a tap or the sleep duration, then `stand` and
`idle.stand`; when idle for the idle interval she chooses an item, or a sit, by
phase-weighted random choice; idle past the interval's scaled minimum sets the
`idle.long` caption once for that stretch; `motionChanged(false)` freezes `activity` at
the nearest still-able state.

`timing.ts` constants (seconds): minimum activity 4; drink 6; eat 10; play 15; pet 2;
transitions `sit` 1.0 and `lie` 1.2 (the clip lengths, §4.1; `stand` is their sum from
lying and `sit` alone from sitting); sleep 90 by morning, 150 by evening, 300 by night;
idle interval uniform 20 to 40, ×0.7 by morning, ×1.5 by night, and `idle.long` at the
scaled 20; walking speed from the clip. Phase weights for the idle
choice: morning play 0.4, water 0.2, sit 0.2, bed 0.1, chair 0.1; evening chair 0.3,
bed 0.2, sit 0.2, water 0.15, play 0.15; night bed 0.5, chair 0.3, sit 0.2.

### 6.2 Ports

- `src/lib/ports/timer.ts`: P's file, taken as its shape (`TimerPort`, `Scheduler`,
  `createIntervalTimer`, `createFakeTimer`), the comment rewritten for this game. The
  director ticks from it at 250 ms whether motion is on or off, so time and behaviour
  advance in still mode; the clock is read through it once a minute for `clockPhase`.
- `src/lib/ports/frame.ts`: `FramePort { each(callback: (ms: number) => void): () => void }`;
  `createAnimationFrames(host: { requestAnimationFrame, cancelAnimationFrame } =
  globalThis)`; `createFakeFrames()` with `step(ms)` that calls the callback once. Drives
  rendering only; never the director.
- `src/lib/ports/audio.ts`: `AudioPort { setBed(names: string[]): void; play(name): void;
  stop(name): void; enable(): Promise<void>; disable(): void }`; `createWebAudio(sources:
  Record<string, string>, host: { AudioContext, fetch } = globalThis)` decoding each file
  once into a buffer and looping the bed gaplessly; `createFakeAudio()` recording every
  call. `enable()` is called only from the sound switch's handler, inside the user
  gesture, which is what lets Safari start the context.
- Clock, random and storage are T's; preferences is H's. Every port is constructed in
  `src/routes/+page.svelte` inside `onMount` and passed down as props; nothing else
  reaches a global.

Cases for the three game ports are appended to `tests/ports.test.ts` after T's, as T's
`docs/reference/testing.md` says.

### 6.3 Captions

`src/lib/data/captions.ts` exports `CAPTIONS: Record<Settled, readonly string[]>` keyed by
the settled activity (`sleep.bed`, `sleep.chair`, `drink`, `eat`, `play`, `pet`,
`idle.long`) with at least five sentences each and at least forty in all; `captions.ts`
in `domain/` picks one not yet shown this session through the random port and returns
`undefined` when the key is exhausted. Every sentence: third person, about her, present
perfect or present continuous, no exclamation mark, no first person, no question, under
twelve words, dry. The seed set (the executing agent writes the rest in this register):

- `sleep.bed`: *Biscuit has gone to bed.* / *Biscuit is asleep in front of the fire.* /
  *Biscuit has stopped watching.*
- `sleep.chair`: *Biscuit has taken the chair.* / *The chair is occupied.*
- `drink`: *Biscuit has had some water.* / *Biscuit is drinking. It is taking a while.*
- `eat`: *Biscuit is eating. Nothing else is happening.* / *Dinner has been located.*
- `play`: *Biscuit has found the rope.* / *The rope has lost.*
- `pet`: *Biscuit has allowed it.* / *Biscuit has decided that was acceptable.*
- `idle.long`: *Biscuit is considering her options.* / *Nothing has happened for some time.*

## 7. The interface

`src/routes/+page.svelte` replaces T's seed: `<svelte:head>` from `brand.ts`; `HeaderBar`
with the `Lockup` and an `IconButton` "Settings" opening `SettingsDialog` (a platform
`Modal` holding `TimeControl`, `SoundControl`, `CameraControl`); `<main>` holding
`SceneCanvas` (full width; height the viewport minus header and controls on a phone, a
9:16 box centred above 60rem), `Caption` (a `Notice` fed by `state.caption`, and an
`Announcer` that says the same sentence), and `ItemControls` (a wrapping grid of platform
`Button`s, three per row at 320 px, each an icon from the platform's map plus the word:
Bed, Chair, Water, Food, Toy, Lamp, Lights, Pet, Photo; Jar arrives in v1.1). Every
port is constructed in `onMount` and the director's state lives in a `$state` in the
page; components take state and callbacks as props (runes, callbacks not events).

`TimeControl`: a `SegmentedControl` with Auto, Morning, Evening, Night; the selection
persists through the storage port under `pawlour.time`. `SoundControl`: a `Switch`,
off by default, persisted under `pawlour.sound`; turning it on calls `audio.enable()`
inside the handler. `CameraControl`: a `SegmentedControl` Hearth, Window, Chair, persisted under
`pawlour.camera`.
`PhotoButton`: asks the canvas for `capture()` (`SceneCanvas` renders once, synchronously,
and returns `toDataURL('image/png')` at the canvas's size; the director is sent nothing
and the state does not change), composes the card in
`src/lib/photo.ts` (pure: given the image size, the caption and the phase, returns the
panel geometry and text the component draws onto an offscreen canvas), and triggers a
download named `pawlour-<phase>-<n>.png`. `TitleCard`: the loading and photo overlay in
the graphic register (§5.3), a `progress` prop, plain copy ("Loading the room", "Saved").

Accessibility, every item a spec clause (§8): every control is a platform component
measured at 44 px; the canvas is `aria-hidden` and a visually hidden `<p>` beside it
states the scene in words from `SceneState` ("Biscuit is asleep in the bed. It is night.
Snow.") and updates with it; captions go through `Announcer`; the page never scrolls
sideways at 320 px; `touch-action: manipulation` on the canvas, never `touch-action:
none` on the page, no `user-scalable=no`; the dialog follows the platform `Modal`'s
guarantees; nothing claims a bare key; the wipe and every transition run on `--dur-*`
and the loop stops when `animationsActive` is false.

## 8. The specification

`docs/specs/pawlour.allium` (root; keeps the six platform figures and `surface Play` as
the seed states them, so `tests/platformSpecs.test.ts` keeps holding them equal) and
`docs/specs/cabin.allium`, imported by the root, declaring the game's own types (`Phase`,
`Weather`, `Activity`, `Item`) and `surface Cabin` with these guarantees, each written in
the platform's register (a name, then the prose that is the rule):

- `EveryItemIsAControl`: every thing she can be sent to is a named control outside the
  canvas, and the canvas's own hit-test adds nothing a control does not offer.
- `ATapIsAnInvitation`: a tap never interrupts the minimum of an activity; the last tap
  wins when it ends; a tap on the thing she is using changes nothing; a tap on her is a
  reaction that plays over what she is doing and returns her to it with the minimum
  unspent.
- `ACaptionIsShownAndAnnounced`: a caption appears once an activity has settled, never on
  the tap, is shown in words and announced in the same words, and is never repeated in a
  session.
- `SheIsTheOnlyThingAlive`: nothing in the room moves of its own accord except the fire,
  the weather and the steam; every other movement is hers.
- `TimeFollowsTheClockUntilOverridden`: the phase is the device's hour until the player
  chooses one, and the choice persists until cleared.
- `SoundNeverStartsUnasked`: no audio plays before the switch is turned on, in that
  visit, by the player.
- `MotionOffIsAStillDiorama`: when animations are off or the device asks for less
  motion, the room is drawn once per change, nothing flickers or falls, and every control
  and caption still works.
- `AContextLossLeavesAStill`: losing the drawing context shows the still for the state
  with its caption, and a tap tries to bring the drawing back.

`tests/restated.ts` lists the platform clauses `cabin.allium` restates word for word
(`EveryControlIsAComfortableTarget`, which is an `@invariant` of H's `contract
DirectManipulation` and is restated under the same contract name and kind;
`FullyKeyboardOperable`,
`AChangeNobodyIsLookingAtIsAnnounced`, `ReducedMotionOverridesTheAnimationSetting`) under
the surface that states them, so `platformSpecs.test.ts` holds them equal. `just
check-specs` and `just analyse-specs` require empty diagnostics and findings; findings
are never waived.

## 9. Handbook pages this game adds

Registered by P09 in `docs/manifest.yml` after T's last decision entry and linked from
`docs/README.md` under `## This game`; frontmatter as T's contract; every page forty
words or more.

| Page | Kind | Audience | `canonical_for` |
| --- | --- | --- | --- |
| `project/purpose-and-scope.md` (T's seed, rewritten from `PRD.md`) | project | user, contributor, maintainer, agent | `project_purpose`, `project_non_goals` |
| `project/terminology.md` (T's seed, the game's words: phase, item, approach, waypoint, clip, still, caption) | project | contributor, maintainer, operator, agent | `project_terminology` |
| `design/art-direction.md` | explanation | contributor, maintainer, agent | `art_direction` |
| `design/the-room.md` | reference | contributor, maintainer, agent | `room_contract` |
| `how-to/export-the-model.md` | how-to | contributor, maintainer, agent | `model_export_procedure` |
| `how-to/author-a-clip.md` | how-to | contributor, maintainer, agent | `clip_authoring` |
| `how-to/build-assets.md` | how-to | contributor, maintainer, agent | `asset_build_procedure` |
| `how-to/test-on-a-phone.md` | how-to | contributor, maintainer, agent | `device_testing` |
| `explanation/rendering.md` | explanation | contributor, maintainer, agent | `rendering_model` |
| `explanation/the-director.md` | explanation | contributor, maintainer, agent | `director_model` |
| `reference/asset-manifest.md` | reference | contributor, maintainer, agent | `asset_manifest_format` |
| `reference/budget.md` | reference | contributor, maintainer, agent | `performance_budget` |
| `decisions/0011-served-assets-are-blobs-and-blends-are-lfs.md` | decision | contributor, maintainer, operator, agent | `decision_large_file_storage` |
| `decisions/0012-the-canvas-lives-outside-the-coverage-glob.md` | decision | contributor, maintainer, agent | `decision_canvas_placement` |
| `decisions/0013-this-repository-owns-its-animated-model.md` | decision | contributor, maintainer, agent | `decision_model_ownership` |
| `decisions/0014-three-js-is-the-renderer.md` | decision | contributor, maintainer, agent | `decision_renderer` |

T's managed pages are not edited; the game's own procedure for `git lfs install --local`
and `preview-lan` lives on the game's how-to pages, not on T's `develop-locally.md`.

## 10. Rules for tickets and lanes

- **Worktrees and branches.** Each ticket is executed on the branch its `branch:` field
  names (`ticket/p02-model-import`) in its own worktree, created from `main` after every
  ticket it depends on has merged. From a Supacode terminal:
  `supacode repo worktree-new --branch <branch> --base main --name <id>`; otherwise
  `git worktree add ../<id> -b <branch> main`. A ticket touches only its listed files
  plus the `status:` line of its own `tickets/<id>-*.md`.
- **P00 ships a shape-complete render.** `just check` is green after P00 with every
  path §2 marks as P00's in final form and a stub for every other path a lane replaces
  (the manifest, `blender/README.md`, the spec, the routes). Lanes **replace** stubs.
- **Files no lane touches:** `package.json`, `package-lock.json`, `pyproject.toml`,
  `uv.lock`, `Justfile`, the two prek configs, `.gitattributes`, `.gitignore`,
  `vite.config.ts`, `vitest.storybook.config.ts`, `scripts/check_assets.py`,
  `docs/manifest.yml`, `docs/README.md`. A lane that needs a change there stops and
  hands it back as a P00 follow-up on `main` (P11 carries them). P09 alone edits
  `docs/manifest.yml` and `docs/README.md`; it depends on P00 only, writes from this
  document, and in practice runs once the lanes have merged, with P11 correcting any
  drift.
- **Files with one writer per phase.** `src/lib/assets/manifest.json` is written by
  `just assets-manifest`; the ticket that adds an asset runs it, sets the new entry's
  `source`, `licence` and `budget` (§3), and reads the diff; nothing else in it is edited
  by hand. It is the one file two parallel lanes both change (P04, P05, P07b and P08 each
  add entries, sorted by path, so the hunks are adjacent): the second lane to merge
  resolves the conflict by re-running `just assets-manifest` on the merged tree,
  re-setting its own entries' three hand fields, and reading the diff, and says so in
  its hand-back. `tests/ports.test.ts` is appended by P06 only.
- **No path appears in two lanes' Files-touched lists.** The lanes are P01 to P08; the
  tickets were checked against each other; an agent that finds a need to edit another
  lane's file hands it back instead. The rule is about lanes running side by side: a
  ticket that runs after another has merged (P07b after P07a; P10, P11, P12 and P13)
  may edit files of the tickets it depends on when it lists them.
- **A done ticket is not reopened.** Once `status:` is `done`, or an agent has started
  it, no other ticket edits its file or reopens it; what is handed back to it goes into
  a follow-up ticket (P11 is the first) that cites each item by source ticket and bullet.
  A ticket nobody has started may be amended in place, and the commit says which
  hand-back it carries.
- **Self-contained.** A ticket is written for an agent with no context: it embeds exact
  content or cites this document by section, and names the H, T, G, P, S and D paths to
  read. It never cites a chat transcript, a scratch directory or a tool result.
- **Paths as code spans.** Ticket text writes repository paths as code spans, never as
  relative Markdown links: the rendered hook gate runs lychee offline over `tickets/`,
  and a link to a file that does not exist yet fails it.
- **Definition of done**, for every build ticket: `just check` green in this
  repository, the ticket's own acceptance criteria met, the verification commands run
  with their output quoted in the hand-back notes, every open point answered or carried
  forward, and the ticket's `status:` set to `done` in the same pull request.
- **The maintainer's eye is a gate.** Every clip (P04) and the room (P05) and the look
  (P07a) end in a contact sheet or screenshot under `ai_tmp/` that the maintainer
  approves before the ticket is done; the hand-back records the path and the date of
  approval.
- **Separately authorised actions.** Commits on the ticket branch are the ticket's work.
  Pushing, opening a pull request, creating the GitHub repository, changing a repository
  setting, granting the package read, enabling Pages, tagging, filing issues, editing
  another repository (H, T, G, P, S, D or a game) and copying any photograph of the real
  dog are each a separately authorised action: the ticket says where one occurs, and the
  agent stops and asks the maintainer rather than proceeding. Nothing under `tickets/`
  has been filed as a GitHub issue.
- **Credentials.** The GitHub Packages token lives only in `~/.npmrc` on the developer's
  machine and in `github.token` in CI. No file here carries a token, and documentation
  writes `<your token>` after `_authToken=` because ripsecrets flags a bare word there.
- **Blender is local.** No recipe that runs Blender is part of `just check` or CI; the
  built assets are committed, and the recipes are how they are rebuilt.

## 11. Unverified claims, and the ticket that checks each

Each claim below was reasoned from source but not executed. The named ticket runs the
check and records the outcome in its hand-back notes; a claim that fails is a design
change that goes back through this document.

1. prek 0.4.12 honours a per-hook `exclude:` on `check-added-large-files`, so a 6 MB
   GLB under `src/lib/assets/` passes `just lint` while a large file elsewhere is
   refused. **P00.**
2. `uvx copier copy gh:steven-cutting/biscuit_games_template --vcs-ref v2.1.0 .` into
   this clone, with the stub `README.md` deleted first, renders cleanly, and
   `just initialize` then `just check` are green on the first run with the network. **P00.**
3. Blender 5.2.1 with `export_animation_mode='NLA_TRACKS'` and `export_force_sampling=True`
   writes one glTF animation per track, named after it, with the IK-driven paws baked
   into the deform bones. **P02.**
4. The same export bakes the five shape-key drivers into morph-weight channels of each
   clip (`get_sk_drivers` finds them because every part is parented to `Biscuit.Rig`).
   **P02.**
5. `gltf-transform join` merges the 148 skinned primitives per material while keeping
   the skin, the morph targets on the sweater and the animations intact, and three.js
   plays the clips on the result. **P03.**
6. `gltf-transform webp` plus `meshopt` brings the model under 6 MB at 1024² colour and
   512² occlusion with normals removed; and iPhone 17 Pro Safari through three.js 0.186
   decodes `EXT_texture_webp` and `EXT_meshopt_compression`. **P03**, proven on the
   device by **P10**.
7. The joined model draws in at most 30 calls (27 materials plus outlines merged per
   material), and with the room stays under 60. **P03** counts; **P10** measures.
8. T's jsdom exposes no `requestAnimationFrame` and no WebGL, so the frame port is
   required and `SceneCanvas` cannot be unit-tested; the story job's headless Chromium
   does create a WebGL2 context (SwiftShader) well enough to mount the canvas. **P06**
   for the first half, **P08** for the second.
9. A Vite import of a `.glb` from `src/lib/assets/` yields a URL carrying `paths.base` in
   the prerendered build, and `GLTFLoader` fetches it under `/pawlour/`. **P07a**,
   proven on Pages by **P12**.
10. `vitest.storybook.config.ts` accepting `'three'` in `optimizeDeps.include` is enough
    for a story that imports a component importing `three/addons/...` subpaths; if not,
    the subpaths are listed too. **P08.**
11. `MeshToonMaterial` with vertex colours and a five-band ramp reads as a painted plane
    rather than a flat cartoon, once the vignette is on. **P07a**, by the maintainer's
    eye.
12. A `canvas.toDataURL` on a WebGL canvas created with `preserveDrawingBuffer: false`
    is blank; the renderer is created with `preserveDrawingBuffer: true` only for the
    frame photo mode captures, or the scene is re-rendered synchronously before the
    capture. **P08.**
13. Pages serves a `.glb` with a content type a browser accepts (`model/gltf-binary` or
    `application/octet-stream`; `GLTFLoader` reads either) and a long cache header for
    hashed filenames. **P12.**
14. `scripts/initialize.sh` skipping `install-hooks` in a secondary worktree means the
    `full-cozy` worktree has no hooks until `just install-hooks` is run by hand. **P00.**
15. `AnimationUtils.makeClipAdditive` on the exported `pet` (every unmoved bone a
    constant channel under `export_force_sampling` and `export_optimize_animation_size`)
    yields identity deltas on those bones, and the lean reads over `drink`, `eat` and
    `play` as well as over the idles. **P07b**, by the maintainer's eye on the recording;
    the contact sheet cannot show it because it renders the clip alone.

## 12. Risks every ticket states where it applies

- **The scripted walk may not pass the maintainer.** A walk cycle keyframed by a script
  is the hardest clip to make read as a dog. P04 carries the approval gate and a
  fallback: a slower, shorter-stride walk with the head steady reads better than a fast
  one that slides, and the runtime's speed follows the clip, so slowing the clip is a
  one-constant change.
- **Draw calls.** 148 meshes, unjoined, are 148 calls before outlines; the phone will
  not hold 60 fps. `join` is the lever (§4.3) and P03 measures before anything is drawn.
- **The hub decision gates shipping.** Nothing deploys before C01 lands; the game is
  built regardless and `just preview-lan` is how it is seen before then.
- **Chromatic and WebGL.** A snapshot of a live canvas is nondeterministic; the
  `SceneCanvas` story renders the fallback still (no WebGL), and the platform components
  around it are what Chromatic compares.
- **`copier update` will conflict** on `vitest.storybook.config.ts` (a managed file this
  game appends to) and nowhere else; the deviation is recorded in `AGENTS.md` and the
  conflict is resolved by re-appending.
- **LFS bandwidth.** Every `.blend` change costs 12 MB of LFS; clips are scripts and
  the `.blend` is byte-identical to D's, so it changes only with a new approved model.
- **The model's licence is unsettled** (H `character.md` lines 128–134). The manifest
  says so and the game does not resolve it; the site is public, so the maintainer is
  choosing to publish renders of the model under that open question, and C01's record
  says so.
- **Safari's audio policy.** An `AudioContext` starts only inside a user gesture; the
  switch handler is the only place `enable()` is called, and a failed `enable()` leaves
  the switch off with a `Notice` saying so.
- **Same-hunk appends** in `docs/manifest.yml`, `docs/README.md` and `AGENTS.md`: P09 and
  P13 are the only tickets after P00 that edit them, in sequence.
