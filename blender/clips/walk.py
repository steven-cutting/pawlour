"""An in-place, lateral-sequence four-beat walk with planted stance paws."""

import math

from _keys import begin, endpoints, finish, key_bone, paw_target

NAME = "walk"
LOOP = True
FRAMES = 30
# Model units of ground travel per cycle; the runtime multiplies by its scale.
STRIDE = 0.8
STANCE = 0.65
PHASES = (("hind", "L", 0.0), ("front", "L", 0.25), ("hind", "R", 0.5), ("front", "R", 0.75))


def build(rig, start):
    begin(rig, NAME, "standing", start, FRAMES)
    endpoints(rig, start, FRAMES, all_ik=True)
    # Include each paw's exact liftoff and landing, including across the seam.
    times = set(range(0, FRAMES + 1, 3))
    for _, _, phase in PHASES:
        times.update(FRAMES * ((phase + event) % 1) for event in (0, STANCE))
    excursion = STRIDE * STANCE
    for frame in sorted(times):
        cycle = (frame % FRAMES) / FRAMES
        # A small crouch keeps the otherwise straight front legs within IK reach.
        bob = -0.08 + 0.03 * math.sin(4 * math.pi * cycle)
        for limb, side, phase in PHASES:
            progress = (cycle - phase) % 1
            if progress <= STANCE:
                travel = -excursion / 2 + STRIDE * progress
                lift = 0.0
            else:
                swing = (progress - STANCE) / (1 - STANCE)
                travel = excursion / 2 - excursion * swing
                lift = 0.18 * math.sin(math.pi * swing)
            # Paw controls inherit root translation; compensate so stance stays grounded.
            paw_target(rig, limb, side, start + frame, (0, travel, lift - bob))
        key_bone(rig, "root", start + frame, location=(0, bob, 0))
        key_bone(rig, "spine", start + frame, rotation=(0, 3 * math.sin(2 * math.pi * cycle), 0))
    for frame in (0, FRAMES):
        key_bone(rig, "tail.1", start + frame, rotation=(10, 0, 0))
    # at() maps the normalized cycle onto the actual 29-frame interval. Linear
    # target travel cancels STRIDE / duration runtime motion throughout stance;
    # identical linear root/target timing also cancels the inherited bob.
    paths = {'pose.bones["root"].location'} | {
        f'pose.bones["CTRL.{limb}.paw.{side}"].location' for limb, side, _ in PHASES
    }
    return finish(rig, NAME, start, linear_paths=paths)
