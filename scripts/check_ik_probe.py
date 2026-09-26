"""Compare the temporary IK export with the ordinary proof at the deform joint."""

import json
import struct
import sys
from pathlib import Path


def lower_leg(path):
    raw = Path(path).read_bytes()
    length = struct.unpack_from("<I", raw, 12)[0]
    document = json.loads(raw[20 : 20 + length])
    binary = raw[28 + length :]
    names = [node.get("name", "") for node in document["nodes"]]
    if any(name.startswith("CTRL.") for name in names):
        raise ValueError("IK control node leaked into export")
    animation = next(clip for clip in document["animations"] if clip["name"] == "idle.stand")
    channel = next(
        channel
        for channel in animation["channels"]
        if channel["target"] == {"node": names.index("front.lower.L"), "path": "rotation"}
    )
    sampler = animation["samplers"][channel["sampler"]]
    accessor = document["accessors"][sampler["output"]]
    view = document["bufferViews"][accessor["bufferView"]]
    offset = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
    stride = view.get("byteStride", 16)
    return [
        struct.unpack_from("<4f", binary, offset + row * stride)
        for row in range(accessor["count"])
    ]


def main():
    ordinary, probe = (lower_leg(path) for path in sys.argv[1:])
    baseline_span = max(
        abs(value - ordinary[0][column]) for row in ordinary for column, value in enumerate(row)
    )
    probe_span = max(
        abs(value - probe[0][column]) for row in probe for column, value in enumerate(row)
    )
    if baseline_span > 0.00001 or probe_span < 0.001:
        raise ValueError(
            f"IK proof did not isolate joint motion: baseline={baseline_span}, probe={probe_span}"
        )
    print(
        f"IK baked into front.lower.L: baseline span {baseline_span:.8f}, probe span {probe_span:.8f}; no CTRL nodes"
    )


if __name__ == "__main__":
    main()
