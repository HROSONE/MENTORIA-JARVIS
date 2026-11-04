import cv2, numpy as np, json
from PIL import Image, ImageDraw, ImageFilter
exec(open('vetoriza.py').read().split('res = {}')[0].split('def trace')[0])  # smooth_path, mask_paths

def clean_alpha(a, open_px=0):
    m = (a > 110).astype(np.uint8) * 255
    if open_px:
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (open_px, open_px))
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, k)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    if n > 1:
        big = st[1:, cv2.CC_STAT_AREA].max()
        keep = [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] > big * .04]
        m = np.isin(lab, keep).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    return m > 0

FORCE_RED = False; LO = 95; GAM = .9
def recolor(lab):
    L, A, B = lab; ch = np.hypot(A - 128, B - 128)
    red = A > 145; yel = B > 160 and A < 145 and L > 110
    if FORCE_RED: return np.array([L * .97, max(160, 128 + (A - 128) * 1.3), 128 + (B - 128) * 1.1])
    if not red and not yel:  # pena: branco quente / cinza quente
        L2 = LO + (L / 255) ** GAM * (252 - LO)
        return np.array([min(250, L2), 130, 136])
    # vermelho/amarelo: mais saturado
    return np.array([L * 1.03, 128 + (A - 128) * 1.25, 128 + (B - 128) * 1.2])

def trace(arr, alpha, k, eps, ox, oy, stroke='#3a2a1e', sw=2.5, ms=(7, 18)):
    out = []; base = (alpha * 255).astype(np.uint8)
    sm = cv2.pyrMeanShiftFiltering(np.ascontiguousarray(arr[:, :, :3]), *ms)
    sm = cv2.bilateralFilter(sm, 9, 40, 9)
    lab = cv2.cvtColor(sm, cv2.COLOR_RGB2LAB).astype(np.float32)
    data = lab[alpha]
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, .3)
    _, lbl, cen = cv2.kmeans(data, k, None, crit, 3, cv2.KMEANS_PP_CENTERS)
    cen = np.array([recolor(c) for c in cen]).clip(0, 255)
    full = np.full(alpha.shape, -1, np.int32); full[alpha] = lbl[:, 0]
    rgb = cv2.cvtColor(cen.reshape(1, -1, 3).astype(np.uint8), cv2.COLOR_LAB2RGB)[0]
    hexc = lambda i: '#%02x%02x%02x' % tuple(int(v) for v in rgb[i])
    order = sorted(range(k), key=lambda i: -(full == i).sum())
    # base: cor do maior cluster
    bf = np.zeros_like(base); cs, _ = cv2.findContours(base, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE); cv2.drawContours(bf, cs, -1, 255, -1)
    out.append((hexc(order[0]), mask_paths(bf, ox, oy, eps), stroke, sw))
    # ordem de pintura: do mais claro para o mais escuro para sombras ficarem por cima? usar área
    for i in order[1:]:
        m = ((full == i) * 255).astype(np.uint8)
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        m = cv2.dilate(m, np.ones((2, 2), np.uint8)) & base
        out.append((hexc(i), mask_paths(m, ox, oy, eps, 8), None, 0))
    return out

def group(layers, gid):
    s = f'<g id="{gid}">'
    for c, d, st, sw in layers:
        if not d: continue
        s += f'<path d="{d}" fill="{c}"' + (f' stroke="{st}" stroke-width="{sw}" stroke-linejoin="round"' if st else '') + '/>'
    # contorno por cima, fino
    c, d, st, sw = layers[0]
    s += f'<path d="{d}" fill="none" stroke="{st}" stroke-width="{sw*.6:.1f}" stroke-opacity=".55" stroke-linejoin="round"/>'
    return s + '</g>'

def poly_mask(shape, poly):
    im = Image.new('L', (shape[1], shape[0]), 0); ImageDraw.Draw(im).polygon(poly, fill=255); return np.array(im) > 0

res = {}
# 1) frente sem cabeça
im = Image.open('galinha_sem_cabeca.png').convert('RGBA'); a = np.array(im)
er = Image.new('L', im.size, 255); ImageDraw.Draw(er).polygon([(680,120),(845,120),(850,250),(812,300),(770,305),(735,298),(690,280)], fill=0)
a[:, :, 3] = np.minimum(a[:, :, 3], np.array(er.filter(ImageFilter.GaussianBlur(3))))
al = clean_alpha(a[:, :, 3], 3); S = al.shape
top600 = poly_mask(S, [(0,0),(1400,0),(1400,600),(0,600)]); top605 = poly_mask(S, [(0,0),(1400,0),(1400,605),(0,605)])
legL = poly_mask(S, [(860,590),(915,585),(945,700),(950,800),(900,800),(870,700)]) & ~top600
legR = poly_mask(S, [(935,600),(1000,600),(1000,720),(985,860),(920,860),(930,720)]) & ~top605
low = ~poly_mask(S, [(0,0),(1400,0),(1400,640),(0,640)])
body = al & ~((legL | legR) & low)
LO = 75; GAM = 1.1
res['frente_corpo'] = group(trace(a, body, 18, 1.0, 0, 0), 'fCorpo')
LO = 60; GAM = 1.1
# 2) lado
a2 = np.array(Image.open('lado_sem_cabeca.png').convert('RGBA'))
res['lado'] = group(trace(a2, clean_alpha(a2[:, :, 3], 9), 14, 1.0, 0, 0, ms=(12, 30)), 'lado')
LO = 95; GAM = .9
# 3) cabeça + pescoço (close): recorte em (540,60)
a3 = np.array(Image.open('cabeca_pescoco.png').convert('RGBA'))
al3 = clean_alpha(a3[:, :, 3], 5)
rgb = a3[:, :, :3].astype(int); rr = ((rgb[:, :, 0] - np.maximum(rgb[:, :, 1], rgb[:, :, 2])) > 45).astype(np.uint8) * 255
rr = cv2.GaussianBlur(rr, (0, 0), 4) > 110
rr = cv2.morphologyEx(rr.astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))) > 0
rr &= al3
feat = trace(a3, al3, 14, .9, 540, 60, ms=(6, 16))
FORCE_RED = True
reds = trace(a3, rr, 9, .8, 540, 60, stroke='#4a1010', sw=1.8, ms=(4, 10))
res['cabeca'] = group(feat, 'cabeca')[:-4] + group(reds, 'cr')[len('<g id="cr">'):-4].rsplit('<path d=', 1)[0] + '</g>'
json.dump(res, open('../svg/mike/galinha_svg.json', 'w'))
for k, v in res.items(): print(k, len(v) // 1024, 'KB', v.count('<path'))
