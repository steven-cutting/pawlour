"""Front paws planted, chewing and one glance up from the bowl."""

from _keys import begin, endpoints, finish, key_bone

NAME = "eat"
LOOP = True
FRAMES = 60


def build(rig, start):
    begin(rig, NAME, "standing", start, FRAMES)
    endpoints(rig, start, FRAMES, front_ik=True)
    for bone, pitch in (("spine", 8), ("chest", 6), ("neck", -45), ("head", -25)):
        for frame in (12, 50):
            key_bone(rig, bone, start + frame, rotation=(pitch, 0, 0))
    for index, frame in enumerate(range(16, 45, 4)):
        key_bone(rig, "head", start + frame, rotation=(-25, 0, 4 if index % 2 == 0 else -4))
    for frame, pitch in ((46, -45), (52, -25), (58, -45)):
        key_bone(rig, "neck", start + frame, rotation=(pitch, 0, 0))
    return finish(rig, start)
