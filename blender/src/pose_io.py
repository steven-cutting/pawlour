"""Versioned browser/Blender pose interchange. No executable code in pose files."""
import math
import json
from pathlib import Path
import bpy
from mathutils import Matrix, Vector, Quaternion
MODEL_ID = "biscuit-miami-soft-charm-poseable"
RIG_VERSION = 1
ARMATURE = "Biscuit.Rig"

IDENTITY = dict(location=[0,0,0],rotation=[1,0,0,0],scale=[1,1,1])

def fresh():
    return {k:list(v) for k,v in IDENTITY.items()}

def from_controls(spec, values=None, name='Custom pose'):
    values=values or {}
    transforms={b['name']:fresh() for b in spec['bones']}
    lookup={b['name']:b for b in spec['bones']}
    complete={c['id']:float(values.get(c['id'],0)) for c in spec['controls']}
    for c in spec['controls']:
        value=complete[c['id']]
        if not c['min']<=value<=c['max']:raise ValueError('Control outside its range: '+c['id'])
        for target in c['targets']:
            t=transforms[target['bone']]
            if c['id']=='height':t['location'][1]+=value # Root bone local Y = world Z.
            else:
                rest=Quaternion(lookup[target['bone']]['restRotation'])
                axis=rest.inverted()@Vector(target['axis'])
                q=Quaternion(axis,math.radians(value*target['factor']))
                t['rotation']=list(Quaternion(t['rotation'])@q)
    result=dict(format='biscuit-pose',version=1,modelId=MODEL_ID,rigVersion=RIG_VERSION,name=name,
                bones=transforms,controls=complete,correctives=correctives(spec,transforms),
                viewer=dict(yaw=.85,pitch=.32,frame='body',display='dressed',surface='color',contours=True))
    return result

def correctives(spec,bones):
    return {r['name']:min(1,max(0,(abs(Quaternion(bones[r['bone']]['rotation']).to_euler('XYZ').x)-r['threshold'])/r['range'])) for r in spec['correctives']}

def validate(spec,doc):
    if not isinstance(doc,dict) or doc.get('format')!='biscuit-pose' or doc.get('version')!=1:
        raise ValueError('This is not a supported Biscuit pose file.')
    if doc.get('modelId')!=MODEL_ID or doc.get('rigVersion')!=RIG_VERSION:
        raise ValueError('This pose belongs to a different model or rig version.')
    names={b['name'] for b in spec['bones']}
    if not isinstance(doc.get('bones'),dict) or set(doc['bones'])!=names:raise ValueError('Pose must contain each rig bone exactly once.')
    def numbers(value,length):
        return isinstance(value,list) and len(value)==length and all(isinstance(x,(float,int)) and not isinstance(x,bool) and math.isfinite(x) for x in value)
    for name,t in doc['bones'].items():
        if not isinstance(t,dict):raise ValueError('Invalid transform: '+name)
        if not numbers(t.get('location'),3) or max(map(abs,t['location']))>5:raise ValueError('Invalid location: '+name)
        if not numbers(t.get('scale'),3) or not all(.25<=v<=4 for v in t['scale']):raise ValueError('Invalid scale: '+name)
        if not numbers(t.get('rotation'),4) or abs(sum(v*v for v in t['rotation'])-1)>.002:raise ValueError('Invalid quaternion: '+name)
    if not isinstance(doc.get('name'),str) or len(doc['name'])>120:raise ValueError('Invalid pose name.')
    expected=correctives(spec,doc['bones'])
    if not isinstance(doc.get('correctives'),dict) or set(doc['correctives'])!=set(expected):raise ValueError('Missing garment corrections.')
    for k,v in expected.items():
        if isinstance(doc['correctives'][k],bool) or not isinstance(doc['correctives'][k],(float,int)) or not math.isfinite(doc['correctives'][k]) or abs(doc['correctives'][k]-v)>.002:raise ValueError('Garment corrections do not match the bone transforms.')
    controls=doc.get('controls')
    if controls is not None:
        if not isinstance(controls,dict) or set(controls)!={c['id'] for c in spec['controls']}:raise ValueError('Invalid slider values.')
        for c in spec['controls']:
            v=controls[c['id']]
            if isinstance(v,bool) or not isinstance(v,(float,int)) or not math.isfinite(v) or not c['min']<=v<=c['max']:raise ValueError('Invalid slider: '+c['id'])
        regenerated=from_controls(spec,controls)['bones']
        for name,t in doc['bones'].items():
            def matrix(transform):
                return Matrix.LocRotScale(Vector(transform['location']),Quaternion(transform['rotation']),Vector(transform['scale']))
            a=matrix(t);b=matrix(regenerated[name])
            if max(abs(a[i][j]-b[i][j]) for i in range(4) for j in range(4))>.002:raise ValueError('Slider values do not match the bone transforms.')
    view=doc.get('viewer',{})
    if not isinstance(view,dict):raise ValueError('Invalid camera settings.')
    for k in ('yaw','pitch','zoom'):
        if k in view and (isinstance(view[k],bool) or not isinstance(view[k],(float,int)) or not math.isfinite(view[k])):raise ValueError('Invalid camera setting: '+k)
    if 'pitch' in view and not -1.56<=view['pitch']<=1.57:raise ValueError('Camera pitch is out of range.')
    if 'zoom' in view and not .3<=view['zoom']<=12:raise ValueError('Camera zoom is out of range.')
    for k,allowed in [('frame',('body','sweater','collar','forelegs')),('display',('dressed','sweater','biscuit')),('surface',('color','clay','wire'))]:
        if k in view and view[k] not in allowed:raise ValueError('Invalid viewer setting: '+k)
    if 'contours' in view and not isinstance(view['contours'],bool):raise ValueError('Invalid contour setting.')
    return doc

def apply(spec,doc):
    validate(spec,doc) # Complete validation before touching the scene.
    rig=bpy.data.objects[ARMATURE]
    for pb in rig.pose.bones:
        if pb.name.startswith('CTRL.') and 'IK influence' in pb:pb['IK influence']=0.
    for name,t in doc['bones'].items():
        pb=rig.pose.bones[name];pb.rotation_mode='QUATERNION'
        pb.location=t['location'];pb.rotation_quaternion=t['rotation'];pb.scale=t['scale']
    rig.update_tag();bpy.context.view_layer.update()
    rig['current_pose']=doc['name']

def export_current(spec,name='Blender pose'):
    rig=bpy.data.objects[ARMATURE];bpy.context.view_layer.update()
    evaluated=rig.evaluated_get(bpy.context.evaluated_depsgraph_get())
    transforms={}
    for item in spec['bones']:
        pb=evaluated.pose.bones[item['name']];rest=rig.data.bones[item['name']].matrix_local
        if item['parent']:
            parent=evaluated.pose.bones[item['parent']]
            rest_local=rig.data.bones[item['parent']].matrix_local.inverted()@rest
            basis=rest_local.inverted()@parent.matrix.inverted()@pb.matrix
        else:basis=rest.inverted()@pb.matrix
        loc,rot,scale=basis.decompose()
        transforms[item['name']]=dict(location=list(loc),rotation=list(rot),scale=list(scale))
    result=dict(format='biscuit-pose',version=1,modelId=MODEL_ID,rigVersion=RIG_VERSION,name=name,
                bones=transforms,controls=None,correctives=correctives(spec,transforms),viewer={})
    return validate(spec,result)

def load(spec,path):
    path=Path(path)
    if path.stat().st_size>262144:raise ValueError('Pose file is too large.')
    def unique(pairs):
        result={}
        for k,v in pairs:
            if k in result:raise ValueError('Duplicate field in pose file: '+k)
            result[k]=v
        return result
    return validate(spec,json.loads(path.read_text(),object_pairs_hook=unique))
