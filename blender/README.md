# Blender

## Provenance

The approved poseable Biscuit was copied from `biscuit_pics` commit `1d9d358`
on 2026-09-25. The model, rig, four pose presets and all sixteen source files are
byte-identical copies. The 12,004,899-byte `.blend` is stored in Git LFS;
served GLBs and still images are ordinary Git blobs. `provenance.json` records
the source digests; `just model-provenance` checks all 22 files.

| Copied file | SHA-256 |
| --- | --- |
| `model/biscuit-poseable.blend` | `95d164730e9354ab3d9bd561a73180690bbb055fffa9bf230c735f735234b4c3` |
| `model/rig.json` | `8de405539beac9f090579c5628c349b3ef69057497fa566796fafa6c5b735d72` |
| `poses/lying.json` | `74bb5ae6e5b29665eae929c0a29520894d18b892d44480667bb83c009f355c25` |
| `poses/paw-raised.json` | `32f7d4ddefe3718f9569d5fc032b24534159f19b2bb592b2958ef0848f8f49e3` |
| `poses/sitting.json` | `b85fe14d8c48cabf51a8495de59acbac88d5a11ce6e78047d23c107a4519aa03` |
| `poses/standing.json` | `8d30fbebfa411ee089646556688a7aa4081218fea4d993fe6d1363304d6fd5fb` |
| `src/blender_pose_tools.py` | `fa75cfa90682459754fc8818075a566daa209f3d9c5e6971118b147c5746d800` |
| `src/browser_test_utils.mjs` | `7976da8ee83c85cb80d3a78386dfd20c13b89ea86c30900c59315ea31112062f` |
| `src/build.py` | `512e35737850826119770cd4de1ca4bcf50f0f6be609f6b3de3e33ef078cbd8f` |
| `src/common.py` | `76edb1b46f085242ed431c5291ade630ad3076f0b0b92fb6c8df4e098d1609e3` |
| `src/export_pose_glb.py` | `6a2940fa03c8941626b3eab740e8e98b3bfcc0ac710938aabdb5ae2ae9b3a1dd` |
| `src/pose_io.py` | `8299f2bd641d4324b675520659116f77b394224aefbc21b5be8d0277e7583705` |
| `src/pose_math.js` | `538610a61dde475254c2add41c361abe03e52efd4900ada911e1a07eb3102398` |
| `src/pose_viewer.js` | `6f2edafd5410eec65481d93d8432006410ca2ba96fcc412d7d3cd112e2c6fad4` |
| `src/proof_sheet.py` | `4c2b8f571f625fc9db9bc55d7be5d027602250f44b4090e17a35532e03ded3f4` |
| `src/render.py` | `28113f96b6f9bf0889d4812127a5620ba6986858c0e9161d1a0da412f3d906fc` |
| `src/rig.py` | `2b76d70318b7e48ed4dab60abdd43551807371c9c66a600f219515f5f1e47c61` |
| `src/verify.py` | `c0c5c3a5c229c48dcc290d689498c95c75b039ccc24c188146516a661b461fba` |
| `src/verify_browser.mjs` | `d1d06e1cb60a9a1db1e6b616651b795eb2f7d331f0c31200634c3a93b1c82e7e` |
| `src/verify_interchange.py` | `c48fc7034a08a31b79df69cefffb8d23d566dc9b7cb355915a87107aa145f6e0` |
| `src/viewer.py` | `fc2d83975e81d9256f0e91b73d93cd656e651af93d7aa61c6168dd6203d71e80` |
| `src/viewer.template.html` | `e8554d39b8d4a9e07527563ab0f5c239c661fbdaf44950e4e9df0bd8f8248ce5` |

The original rebuild chain is `miami-cinematic-eyes-refined` →
`miami-cinematic-sweater-foreleg-refined` → `miami-cinematic-tail-drape-studies` →
`ear-profile-studies` → `ear-studies` → `cinematic-studies` → `miami-angular-base`.
It stays in `biscuit_pics`. The copied `build.py`, `verify.py`, `render.py`,
`viewer.py` and `proof_sheet.py` are records, not recipes here. `rig.py` also
imports that chain through `common.py`; local animation uses the copied
`pose_io.py` and `model/rig.json` directly without importing `rig.py`.

## Building and reviewing

Run `just model-clips`, then `just model-export`, then `just assets-build biscuit`.
Blender 5.2.1 LTS is the verified authoring tool. Set `BLENDER` to another path
if the application is not installed at the default macOS location. The source
scene is never saved: derived scenes and raw exports live in ignored `out/`.
Clips run in sorted filename order, separated by ten unused frames. Each clip
owns its action and NLA track, including every paw's IK influence endpoints.

`PAWLOUR_CLIPS=idle_stand just model-clips` builds the proof alone;
`PAWLOUR_IK_PROBE=1` additionally enables its temporary IK bake probe. Rebuild
without these variables before generating the served asset. `just model-inspect`
records Blender property defaults and packed texture names in `ai_tmp/`.

The exporter ports the source portable material conversion. Texture families map
to packed `<family>-<kind>.png` images, where kind is `color`, `normal`,
`roughness` or `occlusion`; `ear-wave` uses the `.001` suffix on all four.
Families are `coat`, `cream`, `ear-wave`, `eye`, `face-B`, `nose`, `sweater-knit`,
`sweater-label` and `sweater-rib`. No external texture path is read. The exporter
canonicalizes Blender's hierarchy-order skin palette to `rig.json` order by
remapping both inverse-bind matrices and vertex joint indices together.

`just model-sheet idle.stand` renders a twelve-frame contact sheet;
`just model-sheets` renders every clip, and `just model-stills` writes the eighteen
portrait stills. Review artifacts stay in `ai_tmp/`. Clip and room artwork
requires maintainer visual approval before its tickets are closed.

`just cabin-export` builds the room and its three camera renders from primitives.
Run `just check-cabin blender/out/cabin-raw.glb`, then `just assets-build cabin`,
which ends by running the same check on the served file, so both the raw and the
served contracts are verified before the manifest is written. The pipeline retains
named cabin items and their children for hit testing, while Biscuit's compatible
skin primitives are combined by material without changing deformation.

The commands, validation and asset budgets are described in the
[command reference](../docs/reference/commands.md). Runtime rendering and
interaction are separate tickets; these recipes produce their assets only.
