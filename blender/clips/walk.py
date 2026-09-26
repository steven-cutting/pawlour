"""An in-place, lateral-sequence four-beat walk with planted stance paws."""

import math

from _keys import begin, endpoints, finish, key_bone, paw_target
from mathutils import Quaternion

NAME = "walk"
LOOP = True
FRAMES = 30
# Model units of ground travel per cycle; the runtime multiplies by its scale.
STRIDE = 1.0
STANCE = 0.65
PHASES = (("hind", "L", 0.0), ("front", "L", 0.25), ("hind", "R", 0.5), ("front", "R", 0.75))


def flight_rotation(name, cycle):
    """Relax the toes in flight; landing and the entire stance remain level."""
    limb, _, side = name.split(".")
    phase = next(offset for group, leg, offset in PHASES if (group, leg) == (limb, side))
    progress = (cycle - phase) % 1
    swing = max(0, (progress - STANCE) / (1 - STANCE))
    pitch = -18 * math.sin(2 * math.pi * swing) * math.sin(math.pi * swing)
    return Quaternion((1, 0, 0), math.radians(pitch))


def build(rig, start):
    begin(rig, NAME, "standing", start, FRAMES)
    endpoints(rig, start, FRAMES, all_ik=True)
    # Include each paw's exact liftoff and landing, including across the seam.
    times = {sample / 4 * FRAMES / (FRAMES - 1) for sample in range((FRAMES - 1) * 4 + 1)}
    for _, _, phase in PHASES:
        times.update(FRAMES * ((phase + event) % 1) for event in (0, STANCE))
    excursion = STRIDE * STANCE
    for frame in sorted(times):
        cycle = (frame % FRAMES) / FRAMES
        # Center the front sweep under its shoulder so a shallow crouch suffices.
        bob = -0.045 + 0.01 * math.sin(4 * math.pi * cycle)
        for limb, side, phase in PHASES:
            progress = (cycle - phase) % 1
            if progress <= STANCE:
                travel = -excursion / 2 + STRIDE * progress
                lift = 0.0
            else:
                swing = (progress - STANCE) / (1 - STANCE)
                eased = swing**3 * (10 - 15 * swing + 6 * swing**2)
                # Match stance velocity and zero acceleration at either contact.
                travel = excursion / 2 + STRIDE * ((1 - STANCE) * swing - eased)
                lift = 0.10 * math.sin(math.pi * swing)
            if limb == "front":
                travel += 0.17
            # Paw controls inherit root translation; compensate so stance stays grounded.
            paw_target(rig, limb, side, start + frame, (0, travel, lift - bob))
        key_bone(rig, "root", start + frame, location=(0, bob, 0))
        key_bone(rig, "spine", start + frame, rotation=(0, 2 * math.sin(2 * math.pi * cycle), 0))
    for frame in (0, FRAMES):
        key_bone(rig, "tail.1", start + frame, rotation=(10, 0, 0))
    # at() maps the normalized cycle onto the actual 29-frame interval. Linear
    # target travel cancels STRIDE / duration runtime motion throughout stance;
    # identical linear root/target timing also cancels the inherited bob.
    paths = {'pose.bones["root"].location'} | {
        f'pose.bones["CTRL.{limb}.paw.{side}"].location' for limb, side, _ in PHASES
    }
    return finish(rig, start, linear_paths=paths, paw_rotation=flight_rotation)
