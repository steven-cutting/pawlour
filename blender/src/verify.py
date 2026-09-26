"""Native preservation, skinning, pose interchange and GLB acceptance checks."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import base64, struct, copy, random
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from common import *
import pose_io

def floats(encoded):
    data=base64.b64decode(encoded)
    return struct.unpack('<'+str(len(data)//4)+'f',data)

def matrices(rig):
    return {b.name:b.matrix.copy() for b in rig.evaluated_get(bpy.context.evaluated_depsgraph_get()).pose.bones if b.bone.use_deform}

def difference(a,b):
    return max(abs(a[k][r][c]-b[k][r][c]) for k in a for r in range(4) for c in range(4))

def main():
    source_hash=sha(SOURCE)
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    original={}
    for ob in parts():
        ev=ob.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
        positions=[ob.matrix_world@v.co for v in mesh.vertices]
        mesh.calc_loop_triangles()
        original[ob.name]=BVHTree.FromPolygons(positions,[list(t.vertices) for t in mesh.loop_triangles],all_triangles=True)
        ev.to_mesh_clear()
    bpy.ops.wm.open_mainfile(filepath=str(ROOT/'model/biscuit-poseable.blend'))
    spec=json.loads((ROOT/'model/rig.json').read_text());rig=bpy.data.objects['Biscuit.Rig'];all_parts=parts()
    assert len(all_parts)==len(original)==148
    max_rest_error=0.;vertices=0;max_influences=0;weight_error=0.;rest_errors={}
    for ob in all_parts:
        ev=ob.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
        for v in mesh.vertices:
            near=original[ob.name].find_nearest(ob.matrix_world@v.co)
            max_rest_error=max(max_rest_error,near[3])
            rest_errors[ob.name]=max(rest_errors.get(ob.name,0),near[3])
        ev.to_mesh_clear()
        for v in ob.data.vertices:
            active=[g for g in v.groups if g.weight>0]
            max_influences=max(max_influences,len(active));weight_error=max(weight_error,abs(sum(g.weight for g in active)-1));vertices+=1
            assert active and all(math.isfinite(g.weight) and g.weight>0 for g in active)
        contour=bpy.data.objects.get(ob.name+'.Contour')
        if contour:
            assert contour.data==ob.data
            assert [g.name for g in contour.vertex_groups]==[g.name for g in ob.vertex_groups]
            assert contour.modifiers[0].type=='ARMATURE'
        if ob.name.startswith('Cuff.'):
            side='L' if 'L' in ob.name.split('.') else 'R'
            assert all(ob.vertex_groups[g.group].name.endswith('.'+side) for v in ob.data.vertices for g in v.groups if g.weight>0)
    print('Largest rest surface differences',sorted(rest_errors.items(),key=lambda item:-item[1])[:8],flush=True)
    assert max_rest_error<1e-5,max_rest_error
    assert weight_error<1e-6 and max_influences<=4

    # Native evaluated points are the oracle for the browser's independent skinning.
    packed=json.loads((ROOT/'qa/geometry/rigged.json').read_text())
    selections={}
    for part in packed['parts']:
        ob=bpy.data.objects[part['name']]
        lookup={tuple(round(x,6) for x in v.co):v.index for v in ob.data.vertices}
        selection=[]
        for bi,batch in enumerate(part['batches']):
            rest=floats(batch['vertices']);size=len(rest)//12
            for index in sorted(set(round(i*(size-1)/15) for i in range(16))):
                p=tuple(round(x,6) for x in rest[index*12:index*12+3])
                vi=lookup.get(p)
                if vi is None:vi=min(ob.data.vertices,key=lambda v:(v.co-Vector(p)).length_squared).index
                selection.append(dict(batch=bi,index=index,vertex=vi))
        selections[ob.name]=selection
    poses={k:pose_io.load(spec,ROOT/'poses'/f'{k}.json') for k in ('standing','sitting','lying','paw-raised')}
    poses['head-ears-tail']=pose_io.from_controls(spec,dict(head_turn=34,head_nod=-12,head_tilt=10,ear_droop_L=18,ear_spread_R=12,tail_sway=20,tail_curl=-8,tail_drape=14),'Head, ears and tail')
    samples={};roundtrip_error=0.;driver_error=0.
    for key,doc in poses.items():
        pose_io.apply(spec,doc);before=matrices(rig)
        for name,m in before.items():assert all(math.isfinite(x) for row in m for x in row),name
        for rule in spec['correctives']:
            value=bpy.data.objects['Sweater.Fabric'].data.shape_keys.key_blocks[rule['name']].value
            driver_error=max(driver_error,abs(value-doc['correctives'][rule['name']]))
        native={}
        for ob in all_parts:
            ev=ob.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=ev.to_mesh()
            assert all(math.isfinite(x) for v in mesh.vertices for x in v.co)
            native[ob.name]=[{k:v for k,v in item.items() if k!='vertex'}|dict(position=list(ob.matrix_world@mesh.vertices[item['vertex']].co)) for item in selections[ob.name]]
            ev.to_mesh_clear()
        samples[key]=dict(pose=doc,parts=native)
        saved=pose_io.export_current(spec,key);pose_io.apply(spec,saved)
        roundtrip_error=max(roundtrip_error,difference(before,matrices(rig)))
    assert driver_error<1e-5,driver_error
    assert roundtrip_error<1e-5,roundtrip_error

    # Reject the whole document before any bone changes.
    good=poses['standing'];bad=[]
    def corrupt(fn):
        doc=copy.deepcopy(good);fn(doc);bad.append(doc)
    corrupt(lambda d:d.update(modelId='another-model'))
    corrupt(lambda d:d.update(version=2))
    corrupt(lambda d:d['bones'].pop('head'))
    corrupt(lambda d:d['bones']['head'].update(location=[float('nan'),0,0]))
    corrupt(lambda d:d['bones']['head'].update(rotation=[0,0,0,0]))
    corrupt(lambda d:d['bones']['head'].update(scale=[1,0,1]))
    corrupt(lambda d:d['correctives'].update(Belly=True))
    corrupt(lambda d:d['viewer'].update(zoom=False))
    corrupt(lambda d:d['controls'].update(head_turn=12))
    corrupt(lambda d:d['viewer'].update(display='arbitrary'))
    before=matrices(rig)
    for doc in bad:
        try:pose_io.apply(spec,doc)
        except ValueError:pass
        else:raise AssertionError('Accepted malformed pose')
        assert difference(before,matrices(rig))==0

    namespace={'__name__':'__main__'}
    exec(compile(bpy.data.texts['blender_pose_tools.py'].as_string(),'blender_pose_tools.py','exec'),namespace)
    ik_results={}
    for limb in ('front','hind'):
        pose_io.apply(spec,poses['standing'])
        assert bpy.ops.biscuit.paw_ik(limb=limb,side='L')=={'FINISHED'}
        target=rig.pose.bones[f'CTRL.{limb}.paw.L'];m=target.matrix.copy();m.translation+=Vector((.03,-.08,.08));target.matrix=m
        bpy.context.view_layer.update();before=matrices(rig)
        saved=pose_io.export_current(spec,limb+' IK example');pose_io.apply(spec,saved)
        error=difference(before,matrices(rig));assert error<2e-5,error
        ik_results[limb]=error
        if limb=='front':write_json(ROOT/'qa/blender-ik-pose.json',saved)

    # The portable model really contains skinning and the same deformation joints.
    raw=(ROOT/'model/biscuit-poseable.glb').read_bytes();magic,version,size=struct.unpack_from('<III',raw)
    assert magic==0x46546c67 and version==2 and size==len(raw)
    length,kind=struct.unpack_from('<II',raw,12);gltf=json.loads(raw[20:20+length])
    joint_names={gltf['nodes'][i]['name'] for s in gltf['skins'] for i in s['joints']}
    assert joint_names=={b['name'] for b in spec['bones']},joint_names
    mesh_nodes=[n for n in gltf['nodes'] if 'mesh' in n]
    assert len(mesh_nodes)==148 and all('skin' in n for n in mesh_nodes)
    assert all('JOINTS_0' in p['attributes'] and 'WEIGHTS_0' in p['attributes'] for m in gltf['meshes'] for p in m['primitives'])
    assert any(len(p.get('targets',[]))==5 for m in gltf['meshes'] for p in m['primitives'])
    assert source_hash==sha(SOURCE)
    write_json(ROOT/'qa/native-samples.json',samples)
    write_json(ROOT/'qa/invalid-poses.json',bad[:3]+bad[4:]) # JSON cannot represent NaN portably.
    write_json(ROOT/'qa/native-verification.json',dict(parts=len(all_parts),vertices=vertices,bones=len(spec['bones']),maxRestSurfaceError=max_rest_error,
        maxWeightSumError=weight_error,maxInfluences=max_influences,maxPoseRoundtripError=roundtrip_error,maxCorrectiveDriverError=driver_error,
        malformedPosesRejected=len(bad),ikRoundtripError=ik_results,glbSkinnedMeshes=len(mesh_nodes),glbJoints=len(joint_names),sourceUnchanged=True))
    print('Native rig checks passed',max_rest_error,roundtrip_error,driver_error,flush=True)

if __name__=='__main__':
    import math
    main()
