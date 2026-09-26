"""Rest skeleton, deterministic skinning, controls, and garment corrections."""
import math
import bpy
import bmesh
from mathutils import Vector, Matrix, Quaternion
from common import *

ARMATURE = 'Biscuit.Rig'

def smooth(a, b, x):
    t = max(0., min(1., (x-a)/(b-a)))
    return t*t*(3-2*t)

def make_spec():
    bones=[]
    def add(name, head, tail, parent=None):
        bones.append(dict(name=name, head=list(head), tail=list(tail), parent=parent))
    add('root',(0,0,0),(0,0,.35))
    add('pelvis',(0,1.13,1.38),(0,.72,1.4),'root')
    add('spine',(0,.72,1.4),(0,.08,1.36),'pelvis')
    add('chest',(0,.08,1.36),(0,-.45,1.4),'spine')
    add('neck',(0,-.47,1.48),(0,-.86,2.08),'chest')
    add('head',(0,-.86,2.08),(0,-1.16,2.46),'neck')
    for side,s in [('L',1),('R',-1)]:
        x=s*.275
        add('front.upper.'+side,(x,-.45,1.5),(x,-.51,1.0),'chest')
        add('front.lower.'+side,(x,-.51,1.0),(x,-.62,.22),'front.upper.'+side)
        add('front.paw.'+side,(x,-.62,.22),(x,-.86,.10),'front.lower.'+side)
        add('hind.thigh.'+side,(s*.25,1.11,1.445),(s*.29,.82,.97),'pelvis')
        add('hind.shin.'+side,(s*.29,.82,.97),(s*.30,1.23,.58),'hind.thigh.'+side)
        add('hind.hock.'+side,(s*.30,1.23,.58),(s*.30,1.13,.20),'hind.shin.'+side)
        add('hind.paw.'+side,(s*.30,1.13,.20),(s*.30,.88,.10),'hind.hock.'+side)
        ear=bpy.data.objects['Ear.Foundation.'+side]
        rings=[sum((ear.matrix_world@v.co for v in ear.data.vertices[i:i+36]),Vector())/36 for i in range(0,792,36)]
        points=[rings[i] for i in (0,7,14,21)]
        for i in range(3): add(f'ear.{i+1}.{side}',points[i],points[i+1],'head' if i==0 else f'ear.{i}.{side}')
    curve=[Vector(p) for p in bpy.data.objects['Tail.Curl.Foundation']['centerline']]
    stations=[0,14,28,43,58,73,86,100]
    for i in range(7): add(f'tail.{i+1}',curve[stations[i]],curve[stations[i+1]],'pelvis' if i==0 else f'tail.{i}')
    controls=[]
    def control(id,label,group,low,high,targets,axis=(1,0,0),unit='°',step=1):
        controls.append(dict(id=id,label=label,group=group,min=low,max=high,step=step,default=0,unit=unit,
                             targets=[dict(bone=b,factor=f,axis=list(axis)) for b,f in targets]))
    control('height','Body height','Body',-.95,.5,[('root',1)],axis=(0,0,1),unit='m',step=.01)
    control('body_pitch','Body lean','Body',-50,65,[('pelvis',1)])
    control('back_bend','Back bend','Body',-35,40,[('spine',.6),('chest',.4)])
    control('back_turn','Body turn','Body',-30,30,[('spine',.6),('chest',.4)],axis=(0,0,1))
    control('neck','Neck lift','Head',-40,50,[('neck',1)])
    control('head_nod','Head nod','Head',-35,35,[('head',1)])
    control('head_turn','Head turn','Head',-60,60,[('head',1)],axis=(0,0,1))
    control('head_tilt','Head tilt','Head',-25,25,[('head',1)],axis=(0,1,0))
    for side in ('L','R'):
        word='Left' if side=='L' else 'Right'
        for id,label,low,high in [('upper','Shoulder',-100,85),('lower','Elbow',-125,25),('paw','Paw angle',-100,100)]:
            control(f'front_{id}_{side}',label,word+' front leg',low,high,[(f'front.{id}.{side}',1)])
        control(f'front_spread_{side}','Leg spread',word+' front leg',-18,35,[(f'front.upper.{side}',1 if side=='R' else -1)],axis=(0,1,0))
        for id,label,low,high in [('thigh','Hip',-100,115),('shin','Knee',-130,130),('hock','Hock',-140,125),('paw','Paw angle',-100,100)]:
            control(f'hind_{id}_{side}',label,word+' hind leg',low,high,[(f'hind.{id}.{side}',1)])
        control(f'hind_spread_{side}','Leg spread',word+' hind leg',-18,40,[(f'hind.thigh.{side}',1 if side=='R' else -1)],axis=(0,1,0))
        control('ear_droop_'+side,word+' ear bend','Ears',-25,35,[(f'ear.2.{side}',.6),(f'ear.3.{side}',.4)])
        control('ear_spread_'+side,word+' ear spread','Ears',-12,35,[(f'ear.1.{side}',1 if side=='L' else -1)],axis=(0,1,0))
    control('tail_lift','Tail lift','Tail',-35,35,[('tail.1',1)])
    control('tail_sway','Tail side bend','Tail',-40,40,[('tail.1',.65),('tail.2',.35)],axis=(0,1,0))
    control('tail_curl','Curl adjustment','Tail',-20,20,[(f'tail.{i}',.2) for i in range(2,7)])
    control('tail_drape','Drape tip','Tail',-35,35,[('tail.6',.4),('tail.7',.6)])
    return dict(modelId=MODEL_ID,rigVersion=RIG_VERSION,coordinateSystem='right-handed Z-up, -Y forward, +X Biscuit left',bones=bones,controls=controls,
        correctives=[dict(name=n,bone=b,threshold=.25,range=1.3) for n,b in [('Shoulder.L','front.upper.L'),('Shoulder.R','front.upper.R'),('Hip.L','hind.thigh.L'),('Hip.R','hind.thigh.R'),('Belly','spine')]])

def create_armature(spec):
    data=bpy.data.armatures.new('Biscuit.Deformation')
    rig=bpy.data.objects.new(ARMATURE,data);bpy.context.scene.collection.objects.link(rig)
    rig.show_in_front=True;data.display_type='OCTAHEDRAL'
    bpy.context.view_layer.objects.active=rig;rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    for item in spec['bones']:
        bone=data.edit_bones.new(item['name']);bone.head=item['head'];bone.tail=item['tail']
        if item['parent']: bone.parent=data.edit_bones[item['parent']]
        bone.use_connect=False
        bone.align_roll(Vector((0,0,1)) if item['name']=='root' else Vector((0,1,0)))
    bpy.ops.object.mode_set(mode='OBJECT')
    for item in spec['bones']:
        b=data.bones[item['name']];matrix=b.matrix_local
        item['restWorld']=flat(matrix);item['inverseBind']=flat(matrix.inverted())
        item['restLocal']=flat(data.bones[item['parent']].matrix_local.inverted()@matrix if item['parent'] else matrix)
        item['restRotation']=list(matrix.to_quaternion()) # Blender wxyz, explicit in pose format.
        rig.pose.bones[b.name].rotation_mode='QUATERNION'
    rig['model_id']=MODEL_ID;rig['rig_version']=RIG_VERSION
    rig['pose_guide']='Use the Pose Library panel; FK bones match the browser. Optional paw IK: enable that paw control’s IK influence.'
    return rig

def segment_distance(point,a,b):
    line=b-a;t=max(0,min(1,(point-a).dot(line)/line.length_squared))
    return (point-a-line*t).length,t

def chain_weights(point,names,lookup,soft=.11):
    # Distance to connected segments yields identical weights on overlapping joint parts.
    scores=[]
    for name in names:
        b=lookup[name];d,t=segment_distance(point,Vector(b['head']),Vector(b['tail']))
        scores.append((name,d))
    near=min(d for _,d in scores)
    raw={name:math.exp(-((d-near)/soft)**2) for name,d in scores}
    return normalize(raw)

def normalize(weights):
    ordered=sorted(((n,w) for n,w in weights.items() if w>1e-5),key=lambda x:-x[1])[:4]
    total=sum(w for _,w in ordered)
    # Blender's glTF exporter drops influences <= .0001. Prune the same
    # normalized weights here so native, browser and GLB skins stay identical.
    ordered=[(n,w) for n,w in ordered if w/total>1e-4]
    total=sum(w for _,w in ordered)
    return {n:w/total for n,w in ordered}

def mix(a,b,t):
    return normalize({n:a.get(n,0)*(1-t)+b.get(n,0)*t for n in set(a)|set(b)})

def weights_for(name,p,lookup):
    x,y,z=p;side='L' if x>=0 else 'R'
    if name.startswith('Ear.'):
        side=name.split('.')[-1] if name.endswith(('.L','.R')) else ('L' if '.L.' in name else 'R')
        return chain_weights(p,[f'ear.{i}.{side}' for i in (1,2,3)],lookup,.085)
    if name.startswith('Tail.'):
        return chain_weights(p,[f'tail.{i}' for i in range(1,8)],lookup,.065)
    if name.startswith(('Eye','Head.','Topknot.','Nose.','Mouth.')):return {'head':1}
    if name=='Neck':
        return mix({'chest':1},mix({'neck':1},{'head':1},smooth(1.89,2.16,z)),smooth(1.35,1.66,z))
    if name.startswith(('Foreleg','Hindleg','Paw.','Claw.','Cuff.','Joint.')):
        side='L' if 'L' in name.split('.') else 'R'
        front=name.startswith('Foreleg') or '.Front.' in name
        if name.startswith(('Paw.','Claw.')): return {('front' if front else 'hind')+'.paw.'+side:1}
        names=[f'front.{s}.{side}' for s in ('upper','lower','paw')] if front else [f'hind.{s}.{side}' for s in ('thigh','shin','hock','paw')]
        if name.startswith('Cuff.'):
            # The ankle fur belongs to the lower leg, above the wrist. Blending it
            # evenly with the turning paw collapses its volume in folded poses.
            return {names[-2]:1}
        w=chain_weights(p,names,lookup,.10 if front else .07)
        if not name.startswith('Cuff.'):
            w=mix(w,{'chest' if front else 'pelvis':1},smooth(1.31,1.63,z)*.8)
        return w
    # The same torso field is used by skin, sweater and hem label.
    torso=mix({'chest':1},mix({'spine':1},{'pelvis':1},smooth(.58,1.03,y)),smooth(-.10,.48,y))
    if name.startswith('Sweater'):
        if z>1.62 and y<-.30:
            return mix({'chest':1},{'neck':1},smooth(1.58,1.96,z)*.35)
        # The rim straddles the elbow. Use the limb's own joint blend there so
        # a folded lower leg does not pass through a rim following only the shoulder.
        opening=(1-smooth(1.13,1.43,z))*(1-smooth(.13,.34,abs(y+.52)))*smooth(.10,.23,abs(x))
        limb=chain_weights(p,[f'front.{joint}.{side}' for joint in ('upper','lower','paw')],lookup,.10)
        limb=mix(limb,{'chest':1},smooth(1.31,1.63,z)*.8)
        torso=mix(torso,limb,opening)
    return torso

def prepare_meshes(all_parts):
    # Bake only the final visible subdivision/thickness. Preserve UVs and material indices.
    # Simple subdivision adds bendable edges without smoothing the approved silhouette.
    for ob in all_parts:
        ob.data=ob.data.copy()
        bpy.context.view_layer.objects.active=ob
        for mod in list(ob.modifiers):
            if mod.type in ('SUBSURF','SOLIDIFY'):
                bpy.ops.object.modifier_apply(modifier=mod.name)
        if ob.name.startswith(('Body.','Neck','Foreleg.','Hindleg.')):
            # Subdivide the exact rendered triangles. Subdividing nonplanar quads
            # instead changes their surface, even with zero smoothing.
            source=ob.data;source.calc_loop_triangles()
            tris=list(source.loop_triangles);mesh=bpy.data.meshes.new(source.name+'.Bendable')
            mesh.from_pydata([v.co[:] for v in source.vertices],[],[t.vertices[:] for t in tris])
            for material in source.materials:mesh.materials.append(material)
            for polygon,tri in zip(mesh.polygons,tris):
                polygon.material_index=tri.material_index;polygon.use_smooth=source.polygons[tri.polygon_index].use_smooth
            for layer in source.uv_layers:
                uv=mesh.uv_layers.new(name=layer.name)
                for polygon,tri in zip(mesh.polygons,tris):
                    for target,index in zip(polygon.loop_indices,tri.loops):uv.data[target].uv=layer.data[index].uv
            ob.data=mesh
            bm=bmesh.new();bm.from_mesh(ob.data)
            bmesh.ops.subdivide_edges(bm,edges=list(bm.edges),cuts=2,use_grid_fill=True)
            bm.to_mesh(ob.data);bm.free();ob.data.update()
        bm=bmesh.new();bm.from_mesh(ob.data)
        bmesh.ops.triangulate(bm,faces=[f for f in bm.faces if len(f.verts)>4])
        bm.to_mesh(ob.data);bm.free();ob.data.update()
        # All bind vertices live in one coordinate system, avoiding inherited transforms twice.
        world=ob.matrix_world.copy();ob.data.transform(world)
        ob.parent=None;ob.matrix_world=Matrix.Identity(4)
        ob.vertex_groups.clear()
        contour=bpy.data.objects.get(ob.name+'.Contour')
        if contour:
            contour.vertex_groups.clear();contour.data=ob.data;contour.parent=ob;contour.matrix_parent_inverse=Matrix.Identity(4);contour.matrix_basis=Matrix.Identity(4)
            for mod in list(contour.modifiers):
                if mod.type in ('SUBSURF','SOLIDIFY'):contour.modifiers.remove(mod)

def bind(all_parts,rig,spec):
    lookup={b['name']:b for b in spec['bones']}
    for ob in all_parts:
        ob.parent=rig;ob.matrix_parent_inverse=Matrix.Identity(4);ob.matrix_basis=Matrix.Identity(4)
        groups={b['name']:ob.vertex_groups.new(name=b['name']) for b in spec['bones']}
        for v in ob.data.vertices:
            for name,w in weights_for(ob.name,v.co,lookup).items():groups[name].add([v.index],w,'REPLACE')
        mod=ob.modifiers.new('Biscuit skin','ARMATURE');mod.object=rig;mod.use_deform_preserve_volume=False
        contour=bpy.data.objects.get(ob.name+'.Contour')
        if contour:
            for b in spec['bones']:contour.vertex_groups.new(name=b['name'])
            mod=contour.modifiers.new('Biscuit skin','ARMATURE');mod.object=rig;mod.use_deform_preserve_volume=False
            bpy.context.view_layer.objects.active=contour
            bpy.ops.object.modifier_move_up(modifier=mod.name)

def garment_correctives(spec):
    ob=bpy.data.objects['Sweater.Fabric'];ob.shape_key_add(name='Basis')
    for rule in spec['correctives']:
        key=ob.shape_key_add(name=rule['name'])
        for v,d in zip(ob.data.vertices,key.data):
            x,y,z=v.co
            if rule['name'].startswith('Shoulder'):
                side=1 if rule['name'].endswith('L') else -1
                f=math.exp(-((y+.50)/.28)**2-((z-1.12)/.25)**2)*smooth(.04,.24,x*side)
                # Folding the sleeve rim inward needs extra side clearance over
                # the chest; a small static bulge leaves the ribcage poking through.
                d.co+=Vector((side*.38,-.018,-.025))*f
            elif rule['name'].startswith('Hip'):
                side=1 if rule['name'].endswith('L') else -1
                f=math.exp(-((y-.95)/.38)**2-((z-1.15)/.45)**2)*smooth(.02,.22,x*side)
                d.co+=Vector((side*.04,0,.025))*f
            else:
                f=math.exp(-((y-.28)/.55)**2)*(1-smooth(1.0,1.35,z))
                d.co+=Vector((0,0,-.035))*f
        driver=key.driver_add('value').driver;driver.type='SCRIPTED'
        variable=driver.variables.new();variable.name='angle';variable.type='TRANSFORMS'
        target=variable.targets[0];target.id=bpy.data.objects[ARMATURE];target.bone_target=rule['bone']
        target.transform_type='ROT_X';target.transform_space='LOCAL_SPACE';target.rotation_mode='XYZ'
        driver.expression='min(1,max(0,(abs(angle)-0.25)/1.3))'

def native_controls(rig,spec):
    # Optional limb IK is off at rest: canonical FK transforms always reproduce browser poses.
    bpy.context.view_layer.objects.active=rig;bpy.ops.object.mode_set(mode='EDIT')
    for side,s in [('L',1),('R',-1)]:
        for limb in ('front','hind'):
            end=rig.data.edit_bones[f'{limb}.paw.{side}']
            target=rig.data.edit_bones.new(f'CTRL.{limb}.paw.{side}');target.head=end.head;target.tail=end.tail
            target.use_deform=False;target.parent=rig.data.edit_bones['root']
            pole=rig.data.edit_bones.new(f'CTRL.{limb}.bend.{side}')
            pole.head=(s*.3,-1.5 if limb=='front' else -.15,1);pole.tail=pole.head+Vector((0,0,.18));pole.use_deform=False
            pole.parent=rig.data.edit_bones['root']
    bpy.ops.object.mode_set(mode='OBJECT')
    deform=rig.data.collections.new('Body, limbs, ears and tail')
    ik_collection=rig.data.collections.new('Optional paw IK targets')
    for bone in rig.data.bones:
        (ik_collection if bone.name.startswith('CTRL.') else deform).assign(bone)
        bone.color.palette='THEME04' if bone.name.startswith('CTRL.') else 'THEME03'
    for side in ('L','R'):
        for limb in ('front','hind'):
            ctrl=rig.pose.bones[f'CTRL.{limb}.paw.{side}'];ctrl['IK influence']=0.
            ctrl.id_properties_ui('IK influence').update(min=0.,max=1.,description='0 = FK / browser poses; 1 = use this paw target and bend direction control')
            last='lower' if limb=='front' else 'hock'
            pb=rig.pose.bones[f'{limb}.{last}.{side}']
            con=pb.constraints.new('IK');con.name='Optional paw IK';con.target=rig;con.subtarget=ctrl.name
            con.pole_target=rig;con.pole_subtarget=f'CTRL.{limb}.bend.{side}';con.chain_count=2 if limb=='front' else 3
            con.use_stretch=False;con.influence=0
            driver=con.driver_add('influence').driver;driver.expression='influence'
            var=driver.variables.new();var.name='influence';var.targets[0].id=rig;var.targets[0].data_path=f'pose.bones["{ctrl.name}"]["IK influence"]'
            for b in [pb]+[pb.parent] if limb=='front' else [pb,pb.parent,pb.parent.parent]: b.ik_stretch=0.
    rig.data.collections.active=deform
