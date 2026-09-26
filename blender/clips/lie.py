"""Sitting to lying, leaving the neck and head to settle last."""

from _keys import begin, finish, footprints, key_all, key_bone, plant_all, preset

NAME = "lie"
LOOP = False
FRAMES = 36
STEPS = {
    ("front", "L"): (0.1, 0.55),
    ("front", "R"): (0.3, 0.75),
    ("hind", "L"): (0.4, 0.65),
    ("hind", "R"): (0.55, 0.8),
}


def build(rig, start):
    begin(rig, NAME, "sitting", start, FRAMES)
    key_all(rig, start)
    plant_all(rig, start)
    first_points = footprints()
    for bone in ("neck", "head"):
        key_bone(rig, bone, start + 8, rotation=(0, 0, 0))
    preset(rig, "lying")
    key_all(rig, start + FRAMES - 8, exclude=("neck", "head"))
    key_all(rig, start + FRAMES)
    plant_all(rig, start + FRAMES)
    return finish(rig, NAME, start, footsteps=(first_points, footprints(), STEPS))
