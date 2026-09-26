"""Reopen saved browser poses and posed GLBs in Blender and compare surfaces."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import json
import math
import tempfile
import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
import pose_io
import export_pose_glb as portable

ROOT = Path(__file__).resolve().parents[1]

def portable_surface_error(doc, chunks, expected):
    """Evaluate the glTF skin independently of Blender's glTF import/rebinding."""
    binary = next(data for kind, data in chunks if kind == 0x004e4942)
    cache = {}
    dtypes = {5121:'u1', 5123:'<u2', 5125:'<u4', 5126:'<f4'}
    def read_view(view_index, offset, rows, columns, dtype):
        view = doc['bufferViews'][view_index]
        return np.ndarray((rows, columns), dtype=dtype, buffer=binary,
            offset=view.get('byteOffset', 0)+offset,
            strides=(view.get('byteStride', columns*dtype.itemsize), dtype.itemsize)).copy()
    def accessor(index):
        if index not in cache:
            a = doc['accessors'][index]
            dtype = np.dtype(dtypes[a['componentType']])
            count = {'SCALAR':1, 'VEC2':2, 'VEC3':3, 'VEC4':4, 'MAT4':16}[a['type']]
            value = read_view(a['bufferView'], a.get('byteOffset', 0), a['count'], count, dtype) if 'bufferView' in a else np.zeros((a['count'],count), dtype=dtype)
            if 'sparse' in a:
                sparse = a['sparse']; indices = sparse['indices']; values = sparse['values']
                locations = read_view(indices['bufferView'], indices.get('byteOffset', 0), sparse['count'], 1, np.dtype(dtypes[indices['componentType']])).ravel()
                value[locations] = read_view(values['bufferView'], values.get('byteOffset', 0), sparse['count'], count, dtype)
            cache[index] = value
        return cache[index]
    world, _ = portable.worlds(doc); max_error = 0.; errors = {}
    for node in doc['nodes']:
        if 'mesh' not in node: continue
        skin = doc['skins'][node['skin']]
        ibm = accessor(skin['inverseBindMatrices']).reshape(-1,4,4).transpose(0,2,1)
        matrices = np.array([np.array(world[index])@bind for index, bind in zip(skin['joints'], ibm)])
        mesh = doc['meshes'][node['mesh']]; morph = node.get('weights', mesh.get('weights', []))
        for primitive in mesh['primitives']:
            attr = primitive['attributes']; p = accessor(attr['POSITION']).astype(float)
            for weight, target in zip(morph, primitive.get('targets', [])):
                if weight and 'POSITION' in target: p += weight*accessor(target['POSITION'])
            points = np.concatenate([p, np.ones((len(p),1))], axis=1)
            weights = accessor(attr['WEIGHTS_0']); joints = accessor(attr['JOINTS_0'])
            transformed = np.einsum('nkij,nj,nk->ni', matrices[joints], points, weights)
            for x, y, z, _ in transformed:
                error = expected[node['name']].find_nearest(Vector((x,-z,y)))[3]
                max_error = max(max_error, error)
                errors[node['name']] = max(errors.get(node['name'], 0.), error)
    print('Largest independently evaluated GLB errors:', sorted(errors.items(), key=lambda item: -item[1])[:5], flush=True)
    return max_error

def main():
    spec = json.loads((ROOT/'model/rig.json').read_text())
    paths = {key: ROOT/'poses'/f'{key}.json' for key in ('standing', 'sitting', 'lying', 'paw-raised')}
    paths['browser-saved'] = ROOT/'qa/browser-saved-pose.json'
    results = {}
    for key, path in paths.items():
        bpy.ops.wm.open_mainfile(filepath=str(ROOT/'model/biscuit-poseable.blend'))
        pose = pose_io.load(spec, path)
        pose_io.apply(spec, pose)
        # Browser -> native -> JSON preserves the actual FK transforms.
        roundtrip = pose_io.export_current(spec, pose['name'])
        transform_error = 0.
        for name, value in pose['bones'].items():
            def local(t):
                from mathutils import Matrix, Quaternion, Vector
                return Matrix.LocRotScale(Vector(t['location']), Quaternion(t['rotation']), Vector(t['scale']))
            a, b = local(value), local(roundtrip['bones'][name])
            transform_error = max(transform_error, *(abs(a[r][c]-b[r][c]) for r in range(4) for c in range(4)))
        assert transform_error < 2e-5, (key, transform_error)
        expected = {}
        for ob in bpy.context.scene.objects:
            if ob.type != 'MESH' or not ob.get('base_part'): continue
            ev = ob.evaluated_get(bpy.context.evaluated_depsgraph_get()); mesh = ev.to_mesh()
            mesh.calc_loop_triangles()
            expected[ob.name] = BVHTree.FromPolygons([ob.matrix_world@v.co for v in mesh.vertices],
                [list(t.vertices) for t in mesh.loop_triangles], all_triangles=True)
            ev.to_mesh_clear()
        gltf, chunks = portable.read_glb(ROOT/'model/biscuit-poseable.glb')
        portable.apply_to_glb(gltf, spec, pose)
        direct_error = portable_surface_error(gltf, chunks, expected)
        assert direct_error < 1e-5, (key, 'portable skin', direct_error)
        with tempfile.TemporaryDirectory(prefix='biscuit-glb-check-') as folder:
            output = Path(folder)/f'{key}.glb'
            portable.write_glb(output, gltf, chunks)
            bpy.ops.wm.read_factory_settings(use_empty=True)
            bpy.ops.import_scene.gltf(filepath=str(output))
        errors = {}; count = 0
        for ob in bpy.context.scene.objects:
            if ob.type != 'MESH' or not ob.get('base_part'): continue
            assert ob.name in expected, ob.name
            ev = ob.evaluated_get(bpy.context.evaluated_depsgraph_get()); mesh = ev.to_mesh()
            error = 0.
            for v in mesh.vertices:
                point = ob.matrix_world@v.co
                assert all(math.isfinite(x) for x in point)
                error = max(error, expected[ob.name].find_nearest(point)[3]); count += 1
            errors[ob.name] = error
            ev.to_mesh_clear()
        assert len(errors) == len(expected) == 148
        worst = sorted(errors.items(), key=lambda item: -item[1])[:5]
        print(key, 'largest GLB reimport errors:', worst, flush=True)
        # Both portable skin evaluation and Blender reimport must agree within
        # 0.01 mm, including reconstructed bone rest frames and morph targets.
        assert worst[0][1] < 1e-5, (key, worst)
        results[key] = dict(meshes=len(errors), vertices=count, maxSurfaceError=worst[0][1],
                            maxPortableSkinSurfaceError=direct_error, maxNativePoseRoundtripError=transform_error)
    (ROOT/'qa/interchange-verification.json').write_text(json.dumps(results, indent=2)+'\n')
    print('Browser/native pose and portable GLB reimport checks passed.', flush=True)

if __name__ == '__main__': main()
