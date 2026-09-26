"""Render the supplied still poses with the approved native materials and lights."""
from pathlib import Path
import hashlib
import json
import math
import sys
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'src'))
import pose_io


def main():
    path = ROOT / 'model/biscuit-poseable.blend'
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    bpy.ops.wm.open_mainfile(filepath=str(path))
    spec = json.loads((ROOT / 'model/rig.json').read_text())
    scene = bpy.context.scene
    camera = bpy.data.objects.new('PoseReview.Camera', bpy.data.cameras.new('PoseReview.Camera'))
    scene.collection.objects.link(camera)
    scene.camera = camera
    camera.data.type = 'ORTHO'
    scene.render.resolution_x = scene.render.resolution_y = 1000
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.view_layers[0].material_override = None
    output = ROOT / 'previews/native'
    output.mkdir(parents=True, exist_ok=True)
    for name in ('standing', 'sitting', 'lying', 'paw-raised'):
        pose_io.apply(spec, pose_io.load(spec, ROOT / 'poses' / (name + '.json')))
        points = []
        graph = bpy.context.evaluated_depsgraph_get()
        for ob in scene.objects:
            if ob.type != 'MESH' or not ob.get('base_part'):
                continue
            ev = ob.evaluated_get(graph)
            mesh = ev.to_mesh()
            points.extend(ob.matrix_world @ v.co for v in mesh.vertices)
            ev.to_mesh_clear()
        low = Vector([min(p[i] for p in points) for i in range(3)])
        high = Vector([max(p[i] for p in points) for i in range(3)])
        target = (low + high) / 2
        yaw, pitch = .85, .32
        camera.location = target + Vector((9 * math.sin(yaw) * math.cos(pitch),
            -9 * math.cos(yaw) * math.cos(pitch), 9 * math.sin(pitch)))
        camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
        rotation = camera.rotation_euler.to_matrix().transposed()
        projected = [rotation @ (p - target) for p in points]
        camera.data.ortho_scale = 2 * max(abs(p[i]) for p in projected for i in (0, 1)) * 1.22
        scene.render.filepath = str(output / (name + '.png'))
        bpy.ops.render.render(write_still=True)
    assert hashlib.sha256(path.read_bytes()).hexdigest() == digest
    print('Four native pose renders complete; saved scene unchanged.', flush=True)


if __name__ == '__main__':
    main()
