"""Front paws planted, a head dip and three small lapping motions."""

from _keys import begin, endpoints, finish, key_bone

NAME = "drink"
LOOP = True
FRAMES = 60


def build(rig, start):
    begin(rig, NAME, "standing", start, FRAMES)
    endpoints(rig, start, FRAMES, front_ik=True)
    for bone, pitch in (("spine", 8), ("chest", 6), ("neck", -45), ("head", -25)):
        for frame in (12, 50):
            key_bone(rig, bone, start + frame, rotation=(pitch, 0, 0))
    for frame, nod in ((18, 6), (26, -6), (34, 6), (42, -6)):
        key_bone(rig, "head", start + frame, rotation=(-25 + nod, 0, 0))
    return finish(rig, NAME, start)
