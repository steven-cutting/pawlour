"""Read a GLB container strictly, without a buffer decoder.

Shared by the offline checkers and the Blender export script so one parser
decides what counts as a well-formed file.
"""

import json
import struct

JSON_CHUNK = 0x4E4F534A
BINARY_CHUNK = 0x004E4942


def read_glb(path):
    """Return the JSON document and the raw binary chunk of a GLB file."""
    data = path.read_bytes()
    if len(data) < 20:
        raise ValueError("truncated GLB header")
    magic, version, length, chunk_length, chunk_type = struct.unpack_from("<4sIIII", data)
    if magic != b"glTF" or version != 2 or length != len(data):
        raise ValueError("invalid GLB magic, version or length")
    if chunk_type != JSON_CHUNK or chunk_length % 4 or 20 + chunk_length > length:
        raise ValueError("invalid or truncated JSON chunk")
    document = json.loads(data[20 : 20 + chunk_length])
    if not isinstance(document, dict):
        raise TypeError("GLB JSON must be an object")
    binary_start = 20 + chunk_length
    if binary_start == length:
        return document, b""
    binary_length, binary_type = struct.unpack_from("<II", data, binary_start)
    if binary_type != BINARY_CHUNK or binary_start + 8 + binary_length > length:
        raise ValueError("invalid or truncated binary chunk")
    return document, data[binary_start + 8 : binary_start + 8 + binary_length]


def floats(document, binary, index):
    """Return the rows of an ordinary float accessor as tuples."""
    accessor = document["accessors"][index]
    if accessor["componentType"] != 5126 or "sparse" in accessor:
        raise ValueError("Expected ordinary float animation accessor")
    width = {"SCALAR": 1, "VEC3": 3, "VEC4": 4}[accessor["type"]]
    view = document["bufferViews"][accessor["bufferView"]]
    offset = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
    stride = view.get("byteStride", width * 4)
    return [
        struct.unpack_from("<" + "f" * width, binary, offset + row * stride)
        for row in range(accessor["count"])
    ]
