import cv2, numpy as np, json
from PIL import Image, ImageDraw, ImageFilter
src = open('vetoriza2.py').read()
exec(src.split('\nres = {}\n')[0])   # smooth_path, mask_paths, clean_alpha, recolor, trace, group, poly_mask
import builtins
def run(a, al, k, kr, eps=1.0, ms=(8, 20), lo=70, gam=1.1):
    global LO, GAM, FORCE_RED
    rgb = a[:, :, :3].astype(int)
    rr = ((rgb[:, :, 0] - np.maximum(rgb[:, :, 1], rgb[:, :, 2])) > 45).astype(np.uint8) * 255
    rr = cv2.GaussianBlur(rr, (0, 0), 3) > 110
    rr = cv2.morphologyEx(rr.astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))) > 0
    rr &= al
    LO, GAM, FORCE_RED = lo, gam, False
    g = globals(); g['LO'], g['GAM'], g['FORCE_RED'] = lo, gam, False
    feat = group(trace(a, al, k, eps, 0, 0, ms=ms), 'x')
    reds = ''
    if rr.sum() > 200:
        g['FORCE_RED'] = True
        reds = group(trace(a, rr, kr, eps * .9, 0, 0, stroke='#4a1010', sw=2, ms=(5, 12)), 'x')
        g['FORCE_RED'] = False
    strip = lambda s: s[len('<g id="x">'):-4]
    return strip(feat), strip(reds) if reds else ''
res = {}
# lado com cabeça e sem
for name, f, op in [('lado_c', 'px_58902_cut.png', 9), ('lado_s', 'lado_sem_cabeca.png', 9)]:
    a = np.array(Image.open(f).convert('RGBA')); al = clean_alpha(a[:, :, 3], op)
    res[name] = run(a, al, 14, 7, ms=(10, 26), lo=75, gam=1.05)
# frente com cabeça e sem (sem as canelas, desenhadas à parte)
for name, f in [('frente_c', 'px_18846312_cut.png'), ('frente_s', 'galinha_sem_cabeca.png')]:
    im = Image.open(f).convert('RGBA'); a = np.array(im)
    if name == 'frente_s':
        er = Image.new('L', im.size, 255); ImageDraw.Draw(er).polygon([(680,120),(845,120),(850,250),(812,300),(770,305),(735,298),(690,280)], fill=0)
        a[:, :, 3] = np.minimum(a[:, :, 3], np.array(er.filter(ImageFilter.GaussianBlur(3))))
    al = clean_alpha(a[:, :, 3], 3); S = al.shape
    legL = poly_mask(S, [(860,590),(915,585),(945,700),(950,800),(900,800),(870,700)]); legR = poly_mask(S, [(935,600),(1000,600),(1000,720),(985,860),(920,860),(930,720)])
    low = ~poly_mask(S, [(0,0),(1400,0),(1400,640),(0,640)])
    res[name] = run(a, al & ~((legL | legR) & low), 16, 8, ms=(8, 20), lo=75, gam=1.1)
json.dump(res, open('../svg/mike2/galinhas.json', 'w'))
for k, v in res.items(): print(k, len(v[0]) // 1024, len(v[1]) // 1024, 'KB')
