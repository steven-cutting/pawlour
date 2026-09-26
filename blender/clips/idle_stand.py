"""Standing proof: a weight shift, a small look and settling ears."""

from _keys import begin, endpoints, finish, ik_on, key_bone, paw_target

NAME = "idle.stand"
LOOP = True
FRAMES = 120


def build(rig, start, *, ik_probe=False):
    begin(rig, NAME, "standing", start, FRAMES)
    endpoints(rig, start, FRAMES, all_ik=not ik_probe)
    # Roll around the body's long axis; IK holds the four supporting paws.
    for frame, roll in ((30, 1.5), (90, -1.5)):
        key_bone(rig, "pelvis", start + frame, rotation=(0, roll, 0))
        if not ik_probe:
            # Relax the straight forelegs enough to reach through the weight shift.
            key_bone(rig, "pelvis", start + frame, location=(0, 0, -0.012))
    for bone in ("neck", "head"):
        key_bone(rig, bone, start + 60, rotation=(0, 12, 0))
    for side in ("L", "R"):
        key_bone(rig, f"ear.1.{side}", start + 66, rotation=(3, 0, 0))
    for tail in ("tail.1", "tail.2", "tail.3"):
        for frame, angle in ((30, 5), (90, -5)):
            key_bone(rig, tail, start + frame, rotation=(0, angle, 0))
    if ik_probe:
        # P02's export proof is explicitly enabled, never part of the served clip.
        for frame in (start, start + FRAMES):
            ik_on(rig, "front", "L", frame)
            paw_target(rig, "front", "L", frame, (0, 0, 0))
        paw_target(rig, "front", "L", start + 12, (0, 0, 0.05))
        paw_target(rig, "front", "L", start + 24, (0, 0, 0))
    return finish(rig, NAME, start)
