"""Lying with the head tucked away; breathing is added by the runtime."""

from _keys import begin, endpoints, finish, key_bone

NAME = "sleep"
LOOP = True
FRAMES = 180


def build(rig, start):
    begin(rig, NAME, "lying", start, FRAMES)
    endpoints(rig, start, FRAMES, all_ik=True)
    for frame in (0, FRAMES):
        key_bone(rig, "neck", start + frame, rotation=(-20, -55, 0))
        key_bone(rig, "head", start + frame, rotation=(-15, 0, 0))
    for frame, angle in ((60, 0), (90, 6), (120, 0)):
        key_bone(rig, "ear.1.L", start + frame, rotation=(angle, 0, 0))
    return finish(rig, NAME, start)
