from pathlib import Path
import os
from PIL import Image,ImageOps,ImageEnhance,ImageFilter
import numpy as np
repo=Path(__file__).resolve().parents[2]
cache=Path(os.environ.get('PROJECTQUEST_CHARACTER_CACHE', repo/'.cache/characters')).resolve();root=cache/'research/system-assets';out=cache/'textures';out.mkdir(parents=True,exist_ok=True)
def convert(source,name,size=1024,grey=False):
 files=list(root.rglob(source));assert files,source
 im=Image.open(files[0]);im.thumbnail((size,size),Image.Resampling.LANCZOS)
 if grey:im=ImageEnhance.Brightness(ImageOps.grayscale(im)).enhance(1.7).convert('RGB')
 if name.endswith('.jpg'):im=im.convert('RGB');im.save(out/name,quality=91,optimize=True)
 else:im.save(out/name,optimize=True)
for sex in ['male','female']:
 convert('young_lightskinned_'+sex+'_diffuse.png','skin-'+sex+'.jpg',2048)
 outfit='male_casualsuit04' if sex=='male' else 'female_casualsuit01'
 convert(outfit+'_diffuse.png','trousers-'+sex+'.jpg',1024,True)
 convert(outfit+'_normal.png','fabric-normal-'+sex+'.jpg',1024)
 convert('short01_diffuse.png' if sex=='male' else 'ponytail01_diffuse.png','hair-'+sex+'.png',1024)
convert('shoes01_diffuse.png','shoes.jpg',512)
convert('shoes01_normal.png','shoes-normal.jpg',512)
convert('brown_eye.png','eyes.jpg',512)
convert('eyebrow001.png','eyebrows.png',512)
# Authored neutral woven-cotton albedo retains tintability. Garment normal maps supply real sewn fold detail.
rng=np.random.default_rng(414);y,x=np.mgrid[:512,:512]
v=225+3*np.sin(x*np.pi)+3*np.cos(y*np.pi)+rng.normal(0,2,(512,512))
Image.fromarray(np.repeat(np.clip(v,0,255).astype('uint8')[:,:,None],3,axis=2)).save(out/'fabric.jpg',quality=91)
