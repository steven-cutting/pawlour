"""Bundle the pose studio, rig, textures and presets into one offline HTML file."""
from pathlib import Path
import base64, hashlib, io, json
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
REPO_ROOT=ROOT.parents[1]
FRAME_SOURCE=REPO_ROOT/'biscuit_pics/generated/3d/miami-cinematic-sweater-foreleg-refined/qa/viewer-package.json'
def main():
    payload=json.loads((ROOT/'qa/geometry/rigged.json').read_text())
    payload['frames']=json.loads(FRAME_SOURCE.read_text())['frames']
    payload['textures']={}
    for path in sorted((ROOT/'textures').glob('*.png')):
        im=Image.open(path);limit=2048 if path.stem.endswith('-color') else 1024 if path.stem.endswith('-normal') else 512
        if im.width>limit:im=im.resize((limit,limit),Image.Resampling.LANCZOS)
        out=io.BytesIO();im.save(out,format='PNG',optimize=True)
        payload['textures'][path.stem]='data:image/png;base64,'+base64.b64encode(out.getvalue()).decode()
    html=(ROOT/'src/viewer.template.html').read_text()
    for token,content in [('__GEOMETRY__',json.dumps(payload,separators=(',',':'))),('__POSE_MATH__',(ROOT/'src/pose_math.js').read_text()),('__POSE_VIEWER__',(ROOT/'src/pose_viewer.js').read_text())]:
        assert html.count(token)==1;html=html.replace(token,content)
    (ROOT/'viewer.html').write_text(html)
    (ROOT/'qa/viewer-package.json').write_text(json.dumps(dict(offline=True,bytes=len(html.encode()),sha256=hashlib.sha256(html.encode()).hexdigest(),bones=len(payload['rig']['bones']),presets=list(payload['presets']),character=payload['character'],garment=payload['garment']),indent=2)+'\n')
    print('Offline pose studio:',round(len(html.encode())/1024**2,1),'MiB')
if __name__=='__main__':main()
