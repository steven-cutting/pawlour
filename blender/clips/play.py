"""An eager toy shake, play bow and deliberate reaching paw with a second tap."""

from _keys import begin, endpoints, finish, key_bone, paw_target

NAME = "play"
LOOP = True
FRAMES = 90


def build(rig, start):
    begin(rig, NAME, "standing", start, FRAMES)
    endpoints(rig, start, FRAMES, all_ik=True)

    # Relax the nearly straight forelegs before the shoulders join the shake.
    for frame in (5, 33):
        key_bone(rig, "pelvis", start + frame, location=(0, 0, -0.03))
    key_bone(rig, "pelvis", start + 43, location=(0, 0, 0))

    # The body joins the shake, while both front paws remain anchored.
    for bone, pitch, angle in (("neck", -10, 32), ("head", -8, 16), ("spine", 4, -5)):
        key_bone(rig, bone, start + 5, rotation=(pitch, 0, 0))
        for index in range(10):
            # One half-period is 2.5 frames: a 6 Hz shake at 30 fps.
            frame = 7.25 + 2.5 * index
            key_bone(rig, bone, start + frame, rotation=(pitch, angle * (-1) ** index, 0))
        key_bone(rig, bone, start + 33, rotation=(pitch, 0, 0))

    # A lowered chest and lifted tail make the toy drop read as a play bow.
    for bone, pitch in (("spine", 13), ("chest", 10), ("neck", -42), ("head", -18)):
        for frame in (43, 50):
            key_bone(rig, bone, start + frame, rotation=(pitch, 0, 0))
        key_bone(rig, bone, start + 57, rotation=(pitch * 0.45, 0, 0))
        key_bone(rig, bone, start + 78, rotation=(pitch * 0.45, 0, 0))
        key_bone(rig, bone, start + 86, rotation=(0, 0, 0))

    # Lift, reach, pat the toy forward, then give it a smaller second tap.
    for frame, offset in (
        (55, (0, 0, 0)),
        (61, (0.04, -0.16, 0.4)),
        (67, (0.04, -0.55, 0.26)),
        (71, (0.02, -0.55, 0.02)),
        (75, (0.02, -0.32, 0.2)),
        (79, (0, -0.42, 0.02)),
        (81, (0, -0.2, 0.14)),
        (84, (0, 0, 0)),
    ):
        paw_target(rig, "front", "L", start + frame, offset)

    # Ear and tail follow-through continue through the bow and pawing phases.
    for side, direction in (("L", 1), ("R", -1)):
        for frame, pitch in ((5, 0), (12, 12), (20, -12), (28, 12), (36, -8), (52, 0), (82, 0)):
            key_bone(rig, f"ear.2.{side}", start + frame, rotation=(pitch * direction, 0, 0))
    for frame, sway in ((6, 12), (18, -15), (30, 15), (42, -15), (54, 15), (66, -15), (78, 12)):
        key_bone(rig, "tail.1", start + frame, rotation=(22, sway, 0))
    key_bone(rig, "tail.1", start + 86, rotation=(0, 0, 0))
    # Linear control travel preserves world-space clearance through the return;
    # separate Bezier handles in rotated local axes can dip beneath the floor.
    return finish(rig, NAME, start, linear_paths={'pose.bones["CTRL.front.paw.L"].location'})
