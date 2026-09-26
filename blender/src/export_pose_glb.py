"""Apply a saved pose to the portable GLB without changing its bind geometry.

blender --background --python src/export_pose_glb.py -- pose.json output.glb
The result retains skinning, textures and garment morphs for further editing.
"""
import sys
import json
import struct
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from mathutils import Matrix, Vector, Quaternion
import pose_io

ROOT = Path(__file__).resolve().parents[1]

def matrix(values):
    return Matrix([values[i::4] for i in range(4)])

def flat(m):
    return [float(m[r][c]) for c in range(4) for r in range(4)]

def read_glb(path):
    raw = Path(path).read_bytes()
    if len(raw) < 20 or struct.unpack_from('<III', raw) != (0x46546c67, 2, len(raw)):
        raise ValueError('Invalid GLB container.')
    chunks = []; offset = 12
    while offset < len(raw):
        size, kind = struct.unpack_from('<II', raw, offset)
        chunks.append((kind, raw[offset+8:offset+8+size])); offset += 8+size
    if chunks[0][0] != 0x4e4f534a: raise ValueError('Missing GLB JSON chunk.')
    return json.loads(chunks[0][1]), chunks[1:]

def write_glb(path, doc, other_chunks):
    encoded = json.dumps(doc, separators=(',', ':'), allow_nan=False).encode()
    encoded += b' ' * (-len(encoded) % 4)
    chunks = [(0x4e4f534a, encoded)] + other_chunks
    data = b''.join(struct.pack('<II', len(data), kind)+data for kind, data in chunks)
    Path(path).write_bytes(struct.pack('<III', 0x46546c67, 2, len(data)+12)+data)

def local(node):
    if 'matrix' in node: return matrix(node['matrix'])
    q = node.get('rotation', [0, 0, 0, 1])
    return Matrix.LocRotScale(Vector(node.get('translation', [0, 0, 0])),
                             Quaternion([q[3], *q[:3]]), Vector(node.get('scale', [1, 1, 1])))

def worlds(doc):
    parents = {child: i for i, n in enumerate(doc['nodes']) for child in n.get('children', [])}
    result = {}
    def visit(i):
        if i not in result:
            result[i] = (visit(parents[i]) if i in parents else Matrix.Identity(4)) @ local(doc['nodes'][i])
        return result[i]
    for i in range(len(doc['nodes'])): visit(i)
    return result, parents

def apply_to_glb(doc, spec, pose):
    pose_io.validate(spec, pose)
    original, parents = worlds(doc)
    native = {}; skin = {}
    # Convert canonical Z-up deformation matrices, not local Euler angles:
    # glTF's exported joint frames differ from the Blender rest-bone frames.
    conversion = Matrix(((1,0,0,0),(0,0,1,0),(0,-1,0,0),(0,0,0,1)))
    inverse = conversion.inverted()
    for bone in spec['bones']:
        name = bone['name']; t = pose['bones'][name]
        delta = Matrix.LocRotScale(Vector(t['location']), Quaternion(t['rotation']), Vector(t['scale']))
        native[name] = (native[bone['parent']] if bone['parent'] else Matrix.Identity(4)) @ matrix(bone['restLocal']) @ delta
        skin[name] = conversion @ native[name] @ matrix(bone['inverseBind']) @ inverse
    joints = {i for s in doc['skins'] for i in s['joints']}
    targets = {i: skin[doc['nodes'][i]['name']] @ original[i] for i in joints}
    updated = {}
    def visit(i):
        if i in updated: return updated[i]
        parent = visit(parents[i]) if i in parents else Matrix.Identity(4)
        node = doc['nodes'][i]
        if i in targets:
            updated[i] = targets[i]
            node['matrix'] = flat(parent.inverted() @ targets[i])
            for field in ('translation', 'rotation', 'scale'): node.pop(field, None)
        else: updated[i] = parent @ local(node)
        return updated[i]
    for i in range(len(doc['nodes'])): visit(i)
    for node in doc['nodes']:
        if 'mesh' not in node: continue
        mesh = doc['meshes'][node['mesh']]
        names = mesh.get('extras', {}).get('targetNames', [])
        if names: node['weights'] = [pose['correctives'].get(name, 0.) for name in names]
    doc['asset'].setdefault('extras', {})['biscuitPose'] = pose['name']
    return doc

def main():
    args = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    if len(args) != 2: raise SystemExit('Usage: blender --background --python src/export_pose_glb.py -- pose.json output.glb')
    source = ROOT/'model/biscuit-poseable.glb'; output = Path(args[1]).resolve()
    if output == source.resolve(): raise ValueError('Choose a new output file to preserve the neutral model.')
    spec = json.loads((ROOT/'model/rig.json').read_text())
    pose = pose_io.load(spec, args[0]); doc, chunks = read_glb(source)
    write_glb(output, apply_to_glb(doc, spec, pose), chunks)
    print('Saved poseable GLB:', output)

if __name__ == '__main__': main()
