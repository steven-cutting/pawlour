"""A seated idle: ears settling and one quiet look aside."""

from _keys import begin, endpoints, finish, key_bone

NAME = "idle.sit"
LOOP = True
FRAMES = 120


def build(rig, start):
    begin(rig, NAME, "sitting", start, FRAMES)
    endpoints(rig, start, FRAMES, all_ik=True)
    for side, direction in (("L", 1), ("R", -1)):
        for frame, angle in ((20, 5), (60, -5), (100, 0)):
            key_bone(rig, f"ear.2.{side}", start + frame, rotation=(angle * direction, 0, 0))
    for bone, yaw in (("neck", 18), ("head", 7)):
        for frame, angle in ((40, 0), (55, yaw), (70, yaw), (85, 0)):
            key_bone(rig, bone, start + frame, rotation=(0, angle, 0))
    return finish(rig, start)
