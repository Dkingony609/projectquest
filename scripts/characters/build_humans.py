"""ProjectQuest human production exporter. Blender 4.3 + MPFB2 required.
Output meshes/rig weights are CC0 MakeHuman assets; animation and PPE are authored for ProjectQuest.
"""
import bpy,sys,os,json,math,bmesh
from pathlib import Path
from mathutils import Vector
REPO=Path(__file__).resolve().parents[2]
CACHE=Path(os.environ.get('PROJECTQUEST_CHARACTER_CACHE', REPO/'.cache/characters')).resolve()
sys.path.insert(0,str(CACHE/'research/mpfb2-master/src'))
sys.path.insert(0,str(Path(__file__).parent))
bpy.utils.extension_path_user=lambda package,path='',create=False:str(CACHE/'mpfb-user')
# MPFB's legacy logger also asks for Blender's USER resource root. Keep all
# optional authoring-tool state in the cache, including in restricted CI shells.
_resource_path=bpy.utils.resource_path
bpy.utils.resource_path=lambda kind: str(CACHE/'blender-user') if kind=='USER' else _resource_path(kind)
bpy.ops.preferences.addon_enable(module='mpfb')
from mpfb.services.humanservice import HumanService
from mpfb.services.targetservice import TargetService
from animate import create_animations,pose
OUTPUT=REPO/'public/models/humans';OUTPUT.mkdir(parents=True,exist_ok=True)
(CACHE/'build').mkdir(parents=True,exist_ok=True)
ASSETS=CACHE/'research/system-assets'
TEXTURES=CACHE/'textures';TEXTURES.mkdir(exist_ok=True)

def find(name):
    hits=list(ASSETS.rglob(name))
    if not hits:raise RuntimeError('Missing asset '+name)
    return str(hits[0])

def material(name,texture=None,color=(1,1,1,1),rough=.65,alpha=False,metal=0,normal=None):
    mat=bpy.data.materials.new(name);mat.use_fake_user=True;mat.use_nodes=True;mat.diffuse_color=color
    nodes=mat.node_tree.nodes;bsdf=nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=color
    bsdf.inputs['Roughness'].default_value=rough;bsdf.inputs['Metallic'].default_value=metal
    if texture:
        image=bpy.data.images.load(str(texture),check_existing=True)
        t=nodes.new('ShaderNodeTexImage');t.image=image
        mat.node_tree.links.new(t.outputs['Color'],bsdf.inputs['Base Color'])
        if alpha:
            mat.node_tree.links.new(t.outputs['Alpha'],bsdf.inputs['Alpha']);mat.surface_render_method='DITHERED'
            mat.alpha_threshold=.4
    if normal:
        t=nodes.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(normal),check_existing=True);t.image.colorspace_settings.name='Non-Color'
        n=nodes.new('ShaderNodeNormalMap');n.inputs['Strength'].default_value=.6
        mat.node_tree.links.new(t.outputs['Color'],n.inputs['Color']);mat.node_tree.links.new(n.outputs['Normal'],bsdf.inputs['Normal'])
    mat.use_backface_culling=not alpha
    return mat

def assign(obj,mat,name):
    obj.name=name;obj.data.materials.clear();obj.data.materials.append(mat)
    for p in obj.data.polygons:p.use_smooth=True

def loadcloth(body,path,name,mat,asset_type='Clothes'):
    obj=HumanService.add_mhclo_asset(find(path),body,asset_type=asset_type,subdiv_levels=0)
    assign(obj,mat,name)
    return obj

def split_garment(garment):
    # Connected-island split retains original UVs and interpolated skin weights.
    bm=bmesh.new();bm.from_mesh(garment.data);bm.verts.ensure_lookup_table()
    todo=set(bm.verts);top_ids=set()
    while todo:
        seed=todo.pop();component={seed};stack=[seed]
        while stack:
            v=stack.pop()
            for edge in v.link_edges:
                other=edge.other_vert(v)
                if other in todo:todo.remove(other);component.add(other);stack.append(other)
        if sum(v.co.z for v in component)/len(component)>.87:top_ids.update(v.index for v in component)
    bm.free()
    shirt=garment;trousers=garment.copy();trousers.data=garment.data.copy();bpy.context.collection.objects.link(trousers)
    for obj,wanttop in [(shirt,True),(trousers,False)]:
        bm=bmesh.new();bm.from_mesh(obj.data);bm.verts.ensure_lookup_table()
        bmesh.ops.delete(bm,geom=[v for v in bm.verts if (v.index in top_ids)!=wanttop],context='VERTS')
        bm.to_mesh(obj.data);bm.free()
    return shirt,trousers

def skin_to(obj,rig,bone='head'):
    obj.parent=rig
    g=obj.vertex_groups.new(name=bone);g.add(list(range(len(obj.data.vertices))),1,'REPLACE')
    mod=obj.modifiers.new('Human skinning','ARMATURE');mod.object=rig

def hardhat(rig,top):
    # A formed shell, brim, central rib and short rear nape; all weighted to the head bone.
    verts=[];faces=[];segments=40;rings=13
    z0=top-.085
    for j in range(rings):
        theta=(j/(rings-1))*math.pi/2
        for i in range(segments):
            phi=2*math.pi*i/segments
            verts.append((.118*math.sin(theta)*math.cos(phi),-.012+.153*math.sin(theta)*math.sin(phi),z0+.122*math.cos(theta)))
    for j in range(rings-1):
        for i in range(segments):
            a=j*segments+i;b=j*segments+(i+1)%segments
            # Outward winding: the crown must remain visible with backface culling.
            faces.append((a,a+segments,b+segments,b))
    # Brim is a continuous oval with extra frontal sun coverage, not a box on the head.
    inner=len(verts)
    for radius in [1,1.19]:
        for i in range(segments):
            phi=2*math.pi*i/segments
            verts.append((.118*radius*math.cos(phi),-.012+.153*radius*math.sin(phi)-(.01 if radius>1 else 0),z0-.005))
    for i in range(segments):
        a=inner+i;b=inner+(i+1)%segments;faces.append((a,a+segments,b+segments,b))
    mesh=bpy.data.meshes.new('Hardhat shell topology');mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new('PPE_Hardhat',mesh);bpy.context.collection.objects.link(obj)
    assign(obj,material('Hardhat',color=(.95,.72,.14,1),rough=.39),'PPE_Hardhat');skin_to(obj,rig)
    return obj

def vest_from(shirt):
    vest=shirt.copy();vest.data=shirt.data.copy();bpy.context.collection.objects.link(vest);vest.name='PPE_Vest'
    # Form a sleeveless working vest from the fitted garment topology, retaining its transferred weights.
    bm=bmesh.new();bm.from_mesh(vest.data)
    kill=[]
    for v in bm.verts:
        if abs(v.co.x)>.19 and v.co.z>1.03:kill.append(v)
    bmesh.ops.delete(bm,geom=kill,context='VERTS')
    for v in bm.verts:
        v.co.x*=1.035;v.co.y*=1.07
    bm.to_mesh(vest.data);bm.free();vest.data.update()
    vest.data.materials.clear();vest.data.materials.append(material('Vest',TEXTURES/'fabric.jpg',(.95,.43,.055,1)))
    vest.data.materials.append(material('Reflective trim',color=(.72,.78,.75,1),rough=.34,metal=.2))
    for p in vest.data.polygons:
        p.use_smooth=True
        co=p.center
        if 1.00<co.z<1.045 or 1.13<co.z<1.17 or (.07<abs(co.x)<.097 and co.z>1.16):p.material_index=1
    return vest

def scrubs_from(shirt,trousers,rig):
    # Roomier clinical uniform cut: V-neck tunic, loose hem and solid woven drawstring trousers.
    top=shirt.copy();top.data=shirt.data.copy();bpy.context.collection.objects.link(top)
    assign(top,material('ScrubTop',TEXTURES/'fabric.jpg',rough=.8),'Wardrobe_ScrubTop')
    for v in top.data.vertices:
        waist=max(0,min(1,(1.08-v.co.z)/.2));v.co.x*=1+.06*waist;v.co.y*=1.04+.04*waist
        if v.co.y<-.035 and v.co.z>1.22 and abs(v.co.x)<.055:
            v.co.z-=.042*(1-abs(v.co.x)/.055)
    pants=trousers.copy();pants.data=trousers.data.copy();bpy.context.collection.objects.link(pants)
    assign(pants,material('ScrubTrousers',TEXTURES/'fabric.jpg',rough=.8),'Wardrobe_ScrubTrousers')
    for v in pants.data.vertices:
        v.co.x*=1.045;v.co.y*=1.07
    # A small chest patch pocket is actual cloth geometry, not a printed jacket label.
    verts=[(-.135,-.118,1.115),(-.075,-.13,1.115),(-.075,-.125,1.16),(-.135,-.114,1.16)]
    mesh=bpy.data.meshes.new('Scrub pocket');mesh.from_pydata(verts,[],[(0,1,2,3)]);mesh.update()
    pocket=bpy.data.objects.new('Wardrobe_ScrubPocket',mesh);bpy.context.collection.objects.link(pocket)
    assign(pocket,material('ScrubPocket',TEXTURES/'fabric.jpg',rough=.8),'Wardrobe_ScrubPocket');skin_to(pocket,rig,'spine_02')
    # Drawstrings and tie form real curved geometry weighted to the pelvic bone.
    curve=bpy.data.curves.new('Scrub waist tie','CURVE');curve.dimensions='3D';curve.bevel_depth=.002;curve.bevel_resolution=1
    for coords in [[(-.012,-.118,.92),(-.022,-.122,.89),(-.018,-.122,.86)],[(.012,-.118,.92),(.024,-.125,.9),(.020,-.122,.873)]]:
        spline=curve.splines.new('BEZIER');spline.bezier_points.add(2)
        for p,co in zip(spline.bezier_points,coords):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    tie=bpy.data.objects.new('Wardrobe_ScrubDrawstring',curve);bpy.context.collection.objects.link(tie);bpy.context.view_layer.objects.active=tie;tie.select_set(True);bpy.ops.object.convert(target='MESH')
    assign(tie,material('ScrubTrim',color=(.7,.78,.76,1)),'Wardrobe_ScrubDrawstring');skin_to(tie,rig,'pelvis')

def apply_mask(obj):
    bpy.context.view_layer.objects.active=obj
    for mod in list(obj.modifiers):
        if mod.type=='MASK':bpy.ops.object.modifier_apply(modifier=mod.name)

def render_preview(rig,path):
    for obj in bpy.context.scene.objects:
        if obj.name.startswith('Wardrobe_Scrub'):obj.hide_render=True
    pose(rig,0,False)
    bpy.ops.object.camera_add(location=(2.1,-4.8,1.8));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.92))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.05;bpy.context.scene.camera=cam
    for pos,power,size in [((2,-3,5),700,4),((-3,-1,3),450,3),((0,3,4),650,3)]:
        bpy.ops.object.light_add(type='AREA',location=pos);light=bpy.context.object;light.data.energy=power;light.data.size=size;light.rotation_euler=(Vector((0,0,1))-light.location).to_track_quat('-Z','Y').to_euler()
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=False
    scene.world.color=(.15,.15,.15);scene.render.resolution_x=800;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
    scene.render.filepath=str(path);bpy.ops.render.render(write_still=True)

def create(sex):
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    for datablock in list(bpy.data.materials):bpy.data.materials.remove(datablock)
    macro=TargetService.get_default_macro_info_dict();macro.update(gender=1.0 if sex=='male' else 0.0,age=.4,muscle=.45,weight=.46,height=.5)
    macro['race']={'african':.20,'asian':.15,'caucasian':.65}
    body=HumanService.create_human(macro_detail_dict=macro)
    # A mild, neutral upper-lid rest pose avoids the generator's wide-open default stare.
    for side in ['left','right']:
        target=CACHE/'research/mpfb2-master/src/mpfb/data/targets/expression/units/caucasian'/f'eye-{side}-closure.target.gz'
        TargetService.load_target(body,str(target),weight=.16,name='neutral_eye_'+side)
    body.name='Human_'+sex
    rig=HumanService.add_builtin_rig(body,'game_engine');rig.name='HumanRig'
    skin=material('Skin',TEXTURES/('skin-'+sex+'.jpg'),rough=.62)
    assign(body,skin,'Body')
    garment=loadcloth(body,'male_casualsuit04.mhclo' if sex=='male' else 'female_casualsuit01.mhclo','Garment',material('Garment'),asset_type='Clothes')
    shirt,trousers=split_garment(garment)
    assign(shirt,material('Shirt',TEXTURES/'fabric.jpg',normal=TEXTURES/('fabric-normal-'+sex+'.jpg')),'Shirt')
    assign(trousers,material('Trousers',TEXTURES/('trousers-'+sex+'.jpg'),normal=TEXTURES/('fabric-normal-'+sex+'.jpg')),'Trousers')
    shoes=loadcloth(body,'shoes01.mhclo','Shoes',material('Shoes',TEXTURES/'shoes.jpg',rough=.53,normal=TEXTURES/'shoes-normal.jpg'))
    # Remove the separate tall sock collar where it would pierce close-fitting trouser calves.
    bm=bmesh.new();bm.from_mesh(shoes.data)
    bmesh.ops.delete(bm,geom=[v for v in bm.verts if v.co.z>.125],context='VERTS')
    bm.to_mesh(shoes.data);bm.free()
    eyes=loadcloth(body,'low-poly.mhclo','Eyes',material('Eyes',TEXTURES/'eyes.jpg',rough=.22),asset_type='Eyes')
    eyebrows=loadcloth(body,'eyebrow001.mhclo','Eyebrows',material('Eyebrows',TEXTURES/'eyebrows.png',alpha=True),asset_type='Eyebrows')
    hairfile='short01.mhclo' if sex=='male' else 'ponytail01.mhclo'
    hair=loadcloth(body,hairfile,'Hair',material('Hair',TEXTURES/('hair-'+sex+'.png'),rough=.73,alpha=True),asset_type='Hair')
    # Bake MPFB phenotype shape keys before topology masks; preserve the fitted appearance.
    bpy.context.view_layer.objects.active=body
    bpy.ops.object.shape_key_remove(all=True,apply_mix=True)
    # Masks remove helpers and unseen skin under fitted clothes while preserving exposed face and hands.
    apply_mask(body)
    for group in body.vertex_groups:
        if group.name.startswith('Delete.'):
            # Retain natural upper-chest skin behind the clinical V-neck; original tee masks were crew-neck.
            neck_skin=[v.index for v in body.data.vertices if v.co.z>1.15 and abs(v.co.x)<.085 and v.co.y<-.025]
            group.remove(neck_skin)
            mod=body.modifiers.new(group.name,'MASK');mod.vertex_group=group.name;mod.invert_vertex_group=True
    apply_mask(body)
    # Top of visible anatomical scalp used to fit head protection, distinct from hair volume.
    top=max(v.co.z for v in body.data.vertices)
    hardhat(rig,top)
    vest_from(shirt)
    scrubs_from(shirt,trousers,rig)
    # Normalize the complete weighted hierarchy to a 1.75m body while keeping a stable ground origin.
    factor=1.75/top
    rig.scale=(factor,factor,factor)
    bpy.context.view_layer.objects.active=rig;rig.select_set(True)
    # Preserve all real fingers, face loops and garment seams. Tangents and smooth normals exported below.
    for obj in bpy.context.scene.objects:
        if obj.type=='MESH':
            bpy.context.view_layer.objects.active=obj;obj.select_set(True)
            for p in obj.data.polygons:p.use_smooth=True
            mod=obj.modifiers.new('Game topology','TRIANGULATE');bpy.ops.object.modifier_apply(modifier=mod.name)
    create_animations(rig)
    bpy.context.scene.frame_set(0)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.context.scene.objects:
        if obj.type in ['MESH','ARMATURE']:obj.select_set(True)
    bpy.context.view_layer.objects.active=rig
    path=OUTPUT/f'human-{sex}.glb'
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_apply=False,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_frame_range=False,export_yup=True,export_tangents=True,export_skins=True,export_all_influences=False,export_image_format='AUTO',export_extras=False)
    meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
    report={'asset':path.name,'bodyHeightMetres':1.75,'bones':len(rig.data.bones),'vertices':sum(len(o.data.vertices) for o in meshes),'triangles':sum(len(o.data.polygons) for o in meshes),'meshes':{o.name:len(o.data.polygons) for o in meshes},'clips':['Idle','Walk']}
    (OUTPUT/f'human-{sex}.stats.json').write_text(json.dumps(report,indent=2)+'\n')
    bpy.ops.wm.save_as_mainfile(filepath=str(CACHE/'build'/f'human-{sex}.blend'))
    render_preview(rig,CACHE/'build'/f'human-{sex}.png')
    print('EXPORTED',report)

for sex in (sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else ['male','female']):create(sex)
