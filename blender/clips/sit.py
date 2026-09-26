"""Standing to the approved sitting pose, with the head settling last."""

from _keys import begin, finish, footprints, key_all, key_bone, plant_all, preset

NAME = "sit"
LOOP = False
FRAMES = 30
STEPS = {
    ("front", "L"): (0.15, 0.4),
    ("front", "R"): (0.3, 0.55),
    ("hind", "L"): (0.4, 0.65),
    ("hind", "R"): (0.55, 0.8),
}


def build(rig, start):
    begin(rig, NAME, "standing", start, FRAMES)
    key_all(rig, start)
    plant_all(rig, start)
    first_points = footprints()
    key_bone(rig, "head", start + 4, rotation=(0, 0, 0))
    preset(rig, "sitting")
    key_all(rig, start + FRAMES - 4, exclude=("head",))
    key_all(rig, start + FRAMES)
    plant_all(rig, start + FRAMES)
    return finish(rig, start, footsteps=(first_points, footprints(), STEPS))
