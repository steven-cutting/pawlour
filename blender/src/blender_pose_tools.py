"""Open this text in Blender and press Run Script to show Biscuit's pose panel.
The same file also works as an optional installed Blender add-on.
"""
bl_info = {'name':'Biscuit Pose Tools','blender':(4,2,0),'category':'Rigging','version':(1,0,0)}
import bpy
import json
import math
import types
from pathlib import Path
from bpy_extras.io_utils import ImportHelper, ExportHelper


def spec():
    return json.loads(bpy.data.texts['rig.json'].as_string())

def io():
    module=types.ModuleType('biscuit_pose_io')
    exec(compile(bpy.data.texts['pose_io.py'].as_string(),'pose_io.py','exec'),module.__dict__)
    return module

class BISCUIT_OT_preset(bpy.types.Operator):
    bl_idname='biscuit.preset';bl_label='Apply Biscuit pose';bl_options={'REGISTER','UNDO'}
    pose:bpy.props.StringProperty()
    def execute(self,context):
        try:io().apply(spec(),json.loads(bpy.data.texts['pose.'+self.pose+'.json'].as_string()))
        except (ValueError,KeyError) as error:self.report({'ERROR'},str(error));return {'CANCELLED'}
        return {'FINISHED'}

class BISCUIT_OT_import(bpy.types.Operator,ImportHelper):
    bl_idname='biscuit.import_pose';bl_label='Open Biscuit pose';bl_options={'REGISTER','UNDO'}
    filename_ext='.json';filter_glob:bpy.props.StringProperty(default='*.json',options={'HIDDEN'})
    def execute(self,context):
        try:
            module=io();module.apply(spec(),module.load(spec(),self.filepath))
        except (ValueError,KeyError,OSError) as error:self.report({'ERROR'},str(error));return {'CANCELLED'}
        self.report({'INFO'},'Biscuit pose opened');return {'FINISHED'}

class BISCUIT_OT_export(bpy.types.Operator,ExportHelper):
    bl_idname='biscuit.export_pose';bl_label='Save Biscuit pose'
    filename_ext='.json';filter_glob:bpy.props.StringProperty(default='*.json',options={'HIDDEN'})
    def execute(self,context):
        try:
            doc=io().export_current(spec(),Path(self.filepath).stem)
            Path(self.filepath).write_text(json.dumps(doc,indent=2)+'\n')
        except (ValueError,OSError) as error:self.report({'ERROR'},str(error));return {'CANCELLED'}
        self.report({'INFO'},'Pose saved, including evaluated IK');return {'FINISHED'}

class BISCUIT_OT_ik(bpy.types.Operator):
    bl_idname='biscuit.paw_ik';bl_label='Match and enable paw target';bl_options={'REGISTER','UNDO'}
    limb:bpy.props.StringProperty();side:bpy.props.StringProperty()
    def execute(self,context):
        rig=bpy.data.objects['Biscuit.Rig'];limb=self.limb;side=self.side
        target=rig.pose.bones[f'CTRL.{limb}.paw.{side}'];paw=rig.pose.bones[f'{limb}.paw.{side}']
        end=rig.pose.bones[f'{limb}.'+('lower' if limb=='front' else 'hock')+'.'+side]
        chain=[end,end.parent] if limb=='front' else [end,end.parent,end.parent.parent]
        desired=[bone.tail.copy() for bone in chain]
        target.matrix=paw.matrix.copy()
        pole=rig.pose.bones[f'CTRL.{limb}.bend.{side}']
        a=chain[-1].head.copy();b=end.tail.copy();joint=chain[-1].tail.copy()
        line=b-a;projected=a+line*((joint-a).dot(line)/max(line.length_squared,.0001))
        direction=(joint-projected).normalized()
        if direction.length<.1:direction=rig.data.bones[pole.name].head_local-a
        matrix=pole.matrix.copy();matrix.translation=joint+direction*.9;pole.matrix=matrix
        target['IK influence']=1.;rig.update_tag();bpy.context.view_layer.update()
        con=end.constraints['Optional paw IK'];best=(float('inf'),0.)
        for i in range(64):
            con.pole_angle=-math.pi+i*2*math.pi/64;bpy.context.view_layer.update()
            score=sum((bone.tail-p).length_squared for bone,p in zip(chain,desired))
            if score<best[0]:best=(score,con.pole_angle)
        con.pole_angle=best[1];bpy.context.view_layer.update()
        self.report({'INFO'},'Paw target matched. Move the paw control; bend control sets joint direction.')
        return {'FINISHED'}

class BISCUIT_PT_poses(bpy.types.Panel):
    bl_label='Biscuit poses';bl_idname='BISCUIT_PT_poses';bl_space_type='VIEW_3D';bl_region_type='UI';bl_category='Biscuit'
    @classmethod
    def poll(cls,context):return 'Biscuit.Rig' in bpy.data.objects
    def draw(self,context):
        layout=self.layout;rig=bpy.data.objects['Biscuit.Rig']
        layout.label(text='Final look · poseable copy',icon='ARMATURE_DATA')
        for key,title in [('standing','Standing / reset'),('sitting','Sitting'),('lying','Lying down'),('paw-raised','Paw raised')]:
            layout.operator('biscuit.preset',text=title).pose=key
        layout.separator();row=layout.row();row.operator('biscuit.import_pose',text='Open pose');row.operator('biscuit.export_pose',text='Save pose')
        layout.separator();layout.label(text='Pose Mode: select bones, then rotate.')
        layout.label(text='Body, head, 3 ear sections, 7 tail sections.')
        layout.label(text='Paw targets (optional IK):')
        for limb in ('front','hind'):
            for side in ('L','R'):
                row=layout.row();op=row.operator('biscuit.paw_ik',text=limb.title()+' '+side);op.limb=limb;op.side=side
                row.prop(rig.pose.bones[f'CTRL.{limb}.paw.{side}'],'["IK influence"]',text='IK')
        layout.label(text='Presets and imported poses use FK.')

CLASSES=(BISCUIT_OT_preset,BISCUIT_OT_import,BISCUIT_OT_export,BISCUIT_OT_ik,BISCUIT_PT_poses)
def register():
    for cls in CLASSES:
        previous=getattr(bpy.types,cls.__name__,None)
        if previous:
            try:bpy.utils.unregister_class(previous)
            except RuntimeError:pass
        bpy.utils.register_class(cls)
def unregister():
    for cls in reversed(CLASSES):bpy.utils.unregister_class(cls)
if __name__=='__main__':register()
