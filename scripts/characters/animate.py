import bpy, math
from mathutils import Vector,Quaternion

def aim(rig,name,direction,twist=0):
    p=rig.pose.bones[name]
    rest=p.bone.matrix_local.to_quaternion()
    y=rest @ Vector((0,1,0))
    delta=y.rotation_difference(Vector(direction).normalized())
    desired=Quaternion(Vector(direction).normalized(),twist) @ delta @ rest
    prior=rest
    if p.parent:prior=p.parent.matrix.to_quaternion() @ p.parent.bone.matrix_local.to_quaternion().inverted() @ rest
    p.rotation_mode='QUATERNION';p.rotation_quaternion=prior.inverted() @ desired
    bpy.context.view_layer.update()

def pose(rig,phase=0,walking=False):
    for p in rig.pose.bones:p.rotation_mode='QUATERNION';p.rotation_quaternion=Quaternion();p.location=(0,0,0)
    bpy.context.view_layer.update()
    swing=math.sin(phase) if walking else .025*math.sin(phase)
    bob=.008*(1-math.cos(2*phase)) if walking else .002*math.sin(phase)
    rig.pose.bones['pelvis'].location.z=bob
    for side,sign in [('l',1),('r',-1)]:
        s=swing*sign
        # Natural narrow gait: thigh descends just outboard of the hip. Blender forward is -Y.
        thigh=.43*s if walking else 0
        knee=.05 + (.66*max(0,-s)**2 if walking else .015)
        aim(rig,'thigh_'+side,(.015*sign,-math.sin(thigh),-math.cos(thigh)))
        # World shin points backwards during recovery; every knee bends in the anatomical direction.
        shin=thigh-knee
        aim(rig,'calf_'+side,(.012*sign,-math.sin(shin),-math.cos(shin)))
        # Foot plantar/dorsiflexion and heel-toe articulation avoids a rigid ankle.
        ankle=.10*max(0,s)-.18*max(0,-s) if walking else 0
        aim(rig,'foot_'+side,(0,-1,-.43+ankle))
        aim(rig,'ball_'+side,(0,-1,.03+(.16*max(0,s) if walking else 0)))
        arm=-.27*s if walking else .018*math.sin(phase+sign)
        aim(rig,'upperarm_'+side,(.11*sign,-math.sin(arm),-math.cos(arm)))
        elbow=arm+.12
        aim(rig,'lowerarm_'+side,(.035*sign,-math.sin(elbow),-math.cos(elbow)))
        aim(rig,'hand_'+side,(.02*sign,-.15,-1))
        # Preserve real three-segment finger topology and relax the palm; not fists or paddle hands.
        for finger in ['index','middle','ring','pinky','thumb']:
            for segment in [1,2,3]:
                p=rig.pose.bones[f'{finger}_{segment:02}_{side}']
                p.rotation_mode='QUATERNION'
                p.rotation_quaternion=Quaternion((1,0,0),.10 if finger=='thumb' else .08)
    # Subtle chest breath, natural head stability. Bone axes differ; use small local oscillations.
    for name,amplitude in [('spine_02',.01),('spine_03',.013),('head',.008)]:
        rig.pose.bones[name].rotation_quaternion=Quaternion((1,0,0),amplitude*math.sin(phase))
    bpy.context.view_layer.update()

def create_animations(rig):
    bpy.context.scene.render.fps=30
    for name,frames,walking in [('Idle',120,False),('Walk',30,True)]:
        action=bpy.data.actions.new(name);rig.animation_data_create();rig.animation_data.action=action
        for frame in range(0,frames+1,2):
            phase=2*math.pi*frame/frames
            pose(rig,phase,walking)
            for p in rig.pose.bones:
                p.keyframe_insert('rotation_quaternion',frame=frame,group=p.name)
                if p.name=='pelvis':p.keyframe_insert('location',frame=frame,group=p.name)
        for fc in action.fcurves:
            for point in fc.keyframe_points:point.interpolation='BEZIER'
        track=rig.animation_data.nla_tracks.new();track.name=name
        strip=track.strips.new(name,0,action);strip.name=name
        track.mute=True
    rig.animation_data.action=None
    pose(rig,0,False)
