"""An additive lean; every untouched deform channel is constant."""

from _keys import begin, endpoints, finish, key_bone

NAME = "pet"
LOOP = False
FRAMES = 60


def build(rig, start):
    begin(rig, NAME, "standing", start, FRAMES)
    endpoints(rig, start, FRAMES)
    # A nuzzle toward the touch keeps limb ancestors constant for additive use
    # over both standing and sitting, so planted feet never inherit the lean.
    for bone, rotation in (("neck", (0, -12, -6)), ("head", (0, -6, 8)), ("tail.1", (25, 0, 0))):
        key_bone(rig, bone, start + 8, rotation=(0, 0, 0))
        key_bone(rig, bone, start + 20, rotation=rotation)
        key_bone(rig, bone, start + 48, rotation=(0, 0, 0))
    for side in ("L", "R"):
        key_bone(rig, f"ear.1.{side}", start + 10, rotation=(0, 0, 0))
        key_bone(rig, f"ear.1.{side}", start + 24, rotation=(-12, 0, 0))
    return finish(rig, start)
