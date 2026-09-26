"""Rebuild the poseable derivative without modifying the approved source."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import base64
import struct
import shutil
import math
from mathutils import Vector, Matrix
from common import *
import rig as rigging
import pose_io

def binary(values,fmt='f'):
    return base64.b64encode(struct.pack('<'+str(len(values))+fmt,*values)).decode()

def packed_geometry(all_parts,spec):
    lookup={b['name']:i for i,b in enumerate(spec['bones'])};packed=[]
    for ob in all_parts:
        mesh=ob.data;mesh.calc_loop_triangles();mesh.calc_tangents()
        groups={g.index:lookup[g.name] for g in ob.vertex_groups if g.name in lookup}
        weights=[]
        for v in mesh.vertices:
            row=sorted(((groups[g.group],g.weight) for g in v.groups if g.group in groups),key=lambda x:-x[1])[:4]
            row+= [(0,0)]*(4-len(row));weights.append(row)
        keys=mesh.shape_keys
        morphs={k.name:[k.data[i].co-mesh.vertices[i].co for i in range(len(mesh.vertices))] for k in keys.key_blocks if k.name!='Basis'} if keys else {}
        batches=[]
        for mi,mat in enumerate(mesh.materials):
            verts=[];indices=[];mapping={};skin=[];js=[];deltas={k:[] for k in morphs}
            for tri in mesh.loop_triangles:
                if tri.material_index!=mi:continue
                for vi,li in zip(tri.vertices,tri.loops):
                    p=mesh.vertices[vi].co;n=mesh.corner_normals[li].vector;uv=mesh.uv_layers.active.data[li].uv
                    tangent=mesh.loops[li].tangent
                    record=tuple(round(x,6) for x in (*p,*n,*uv,*tangent,mesh.loops[li].bitangent_sign))
                    key=(vi,record)
                    if key not in mapping:
                        mapping[key]=len(mapping);verts.extend(record)
                        js.extend(i for i,w in weights[vi]);skin.extend(w for i,w in weights[vi])
                        for name in morphs:deltas[name].extend(morphs[name][vi])
                    indices.append(mapping[key])
            if indices:batches.append(dict(material=mat.name,texture=mat.get('texture_family',''),tint=list(mat.get('tint',(1,1,1))),solid=list(mat.get('solid_color',(.05,.03,.02))),gloss=bool(mat.get('gloss',False)),vertices=binary(verts),indices=binary(indices,'I'),count=len(indices),joints=binary(js,'H'),weights=binary(skin),morphs={k:binary(v) for k,v in deltas.items()}))
        edge_vis=[vi for e in mesh.edges for vi in e.vertices]
        edges=[c for vi in edge_vis for c in mesh.vertices[vi].co]
        packed.append(dict(name=ob.name,group=ob['part_group'],owner='garment' if ob.name.startswith('Sweater.') else 'shared',outline=bool(ob.get('outline',False)),batches=batches,edges=binary(edges),edge_count=len(edge_vis),edgeJoints=binary([i for vi in edge_vis for i,w in weights[vi]],'H'),edgeWeights=binary([w for vi in edge_vis for i,w in weights[vi]]),edgeMorphs={k:binary([c for vi in edge_vis for c in morphs[k][vi]]) for k in morphs}))
    return packed

def presets(spec):
    # All values are relative to the final approved standing model.
    recipes={'standing':('Standing',{}),'sitting':('Sitting',dict(height=-.88,body_pitch=-38,back_bend=12,neck=26)),
      'lying':('Lying down',dict(height=-.87,body_pitch=0,back_bend=0,neck=0)),
      'paw-raised':('Paw raised',dict(front_upper_L=35,front_lower_L=-100,front_paw_L=65,head_tilt=-6))}
    for side in ('L','R'):
        recipes['sitting'][1].update({f'hind_thigh_{side}':-1.4,f'hind_shin_{side}':61.5,f'hind_hock_{side}':-100.8,f'hind_paw_{side}':78.7,f'hind_spread_{side}':9,
            f'front_upper_{side}':43.3,f'front_lower_{side}':-25.6,f'front_paw_{side}':8.3})
        recipes['lying'][1].update({f'front_upper_{side}':10,f'front_lower_{side}':-99,f'front_paw_{side}':89,
            f'hind_thigh_{side}':-24.7,f'hind_shin_{side}':60.9,f'hind_hock_{side}':-112.5,f'hind_paw_{side}':76.3,f'hind_spread_{side}':12})
    return {k:pose_io.from_controls(spec,values,name) for k,(name,values) in recipes.items()}

def export_glb(all_parts,rig,path):
    saved={};portable={}
    for ob in all_parts:
        saved[ob.name]=list(ob.data.materials)
        for i,src in enumerate(saved[ob.name]):
            if src.name not in portable:portable[src.name]=legacy.c.portable_material(src)
            ob.data.materials[i]=portable[src.name]
    try:
        bpy.ops.object.select_all(action='DESELECT')
        for ob in all_parts+[rig]:ob.select_set(True)
        bpy.context.view_layer.objects.active=rig
        bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_extras=True,
            export_yup=True,export_animations=False,export_cameras=False,export_lights=False,export_apply=False,
            export_tangents=True,export_skins=True,export_def_bones=True,export_morph=True,export_morph_normal=True,
            export_influence_nb=4,export_all_influences=False)
    finally:
        for ob in all_parts:
            for i,mat in enumerate(saved[ob.name]):ob.data.materials[i]=mat
        for mat in portable.values():bpy.data.materials.remove(mat)

def main():
    digest=sha(SOURCE);bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    for directory in ('model','textures','qa/geometry','poses','previews'):(ROOT/directory).mkdir(parents=True,exist_ok=True)
    for file in (BASE/'textures').glob('*.png'):shutil.copy2(file,ROOT/'textures'/file.name)
    spec=rigging.make_spec();all_parts=parts()
    original={ob.name:dict(vertices=len(ob.data.vertices),matrix=flat(ob.matrix_world)) for ob in all_parts}
    rigging.prepare_meshes(all_parts)
    rig=rigging.create_armature(spec);rigging.bind(all_parts,rig,spec);rigging.garment_correctives(spec);rigging.native_controls(rig,spec)
    bpy.context.scene['look']='Catherine / Persona-inspired Biscuit; poseable Soft Charm derivative'
    rig['correctives']='Sweater morph weights follow rig.json corrective rules; pose JSON contains evaluated values.'
    pose_set=presets(spec);pose_io.apply(spec,pose_set['standing'])
    write_json(ROOT/'model/rig.json',spec)
    for key,doc in pose_set.items():write_json(ROOT/'poses'/f'{key}.json',doc)
    packed=packed_geometry(all_parts,spec)
    stats=lambda owner:dict(parts=sum(p['owner']==owner for p in packed),triangles=sum(b['count']//3 for p in packed if p['owner']==owner for b in p['batches']))
    write_json(ROOT/'qa/geometry/rigged.json',dict(parts=packed,rig=spec,presets=pose_set,character=stats('shared'),garment=stats('garment')))
    write_json(ROOT/'qa/source-state.json',dict(source=str(SOURCE.relative_to(REPO_ROOT)),sha256=digest,original=original))
    # Internal text copies make the native posing panel available without installation.
    for name in ('common.py','rig.py','pose_io.py','blender_pose_tools.py'):
        path=ROOT/'src'/name
        if path.exists():
            text=bpy.data.texts.get(name) or bpy.data.texts.new(name);text.clear();text.write(path.read_text())
    text=bpy.data.texts.get('rig.json') or bpy.data.texts.new('rig.json');text.clear();text.write(json.dumps(spec))
    for key,doc in pose_set.items():
        text=bpy.data.texts.new('pose.'+key+'.json');text.write(json.dumps(doc))
    for image in bpy.data.images:
        if image.packed_file:image.filepath='//../textures/'+Path(image.filepath).name
    bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
    # Leave the native file in its approved rest pose, ready for Pose Mode.
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'model/biscuit-poseable.blend'))
    export_glb(all_parts,rig,ROOT/'model/biscuit-poseable.glb')
    assert sha(SOURCE)==digest,'Approved source changed!'
    print('POSEABLE BUILD COMPLETE',stats('shared'),stats('garment'),len(spec['bones']),'bones',flush=True)

if __name__=='__main__':main()
