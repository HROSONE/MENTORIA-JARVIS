import cv2, numpy as np, json, sys
from PIL import Image, ImageDraw, ImageFilter

def smooth_path(pts):
    # curva suave passando pelos pontos médios (quadráticas)
    n = len(pts)
    if n < 3: return ''
    mid = [((pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2) for i in range(n)]
    d = f'M{mid[-1][0]:.1f} {mid[-1][1]:.1f}'
    for i in range(n): d += f'Q{pts[i][0]:.1f} {pts[i][1]:.1f} {mid[i][0]:.1f} {mid[i][1]:.1f}'
    return d + 'Z'

def mask_paths(m, ox, oy, eps=1.0, min_area=12):
    cs, hier = cv2.findContours(m, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    d = ''
    for c in cs:
        if cv2.contourArea(c) < min_area: continue
        a = cv2.approxPolyDP(c, eps, True)[:, 0, :]
        d += smooth_path([(p[0] + ox, p[1] + oy) for p in a])
    return d

def trace(rgba, k=9, eps=1.0, region=None, ox=0, oy=0):
    arr = np.array(rgba).astype(np.uint8)
    alpha = arr[:, :, 3] > 110
    if region is not None: alpha &= region
    out = []
    if alpha.sum() < 50: return out
    base = (alpha * 255).astype(np.uint8)
    base = cv2.morphologyEx(base, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    px = arr[:, :, :3][alpha].astype(np.float32)
    med = np.median(px, 0).astype(int)
    out.append(('#%02x%02x%02x' % tuple(med), mask_paths(base, ox, oy, eps)))
    lab = cv2.cvtColor(arr[:, :, :3], cv2.COLOR_RGB2LAB).astype(np.float32)
    data = lab[alpha]
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, .5)
    _, lbl, cen = cv2.kmeans(data, k, None, crit, 3, cv2.KMEANS_PP_CENTERS)
    full = np.full(alpha.shape, -1, np.int32); full[alpha] = lbl[:, 0]
    rgbc = cv2.cvtColor(cen.reshape(1, -1, 3).astype(np.uint8), cv2.COLOR_LAB2RGB)[0]
    order = sorted(range(k), key=lambda i: -(full == i).sum())
    for i in order[1:]:
        m = ((full == i) * 255).astype(np.uint8)
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
        m = cv2.dilate(m, np.ones((2, 2), np.uint8))
        out.append(('#%02x%02x%02x' % tuple(int(v) for v in rgbc[i]), mask_paths(m, ox, oy, eps)))
    return out

def svg_group(layers, gid):
    return f'<g id="{gid}">' + ''.join(f'<path d="{d}" fill="{c}"/>' for c, d in layers if d) + '</g>'

def poly_mask(shape, poly):
    im = Image.new('L', (shape[1], shape[0]), 0); ImageDraw.Draw(im).polygon(poly, fill=255); return np.array(im) > 0

res = {}
# 1) frente, sem cabeça (corrige o resto do olho)
im = Image.open('galinha_sem_cabeca.png').convert('RGBA')
a = np.array(im); er = Image.new('L', im.size, 255); ImageDraw.Draw(er).polygon([(680, 120), (845, 120), (850, 250), (812, 300), (770, 305), (735, 298), (690, 280)], fill=0)
er = np.array(er.filter(ImageFilter.GaussianBlur(3))); a[:, :, 3] = np.minimum(a[:, :, 3], er); im = Image.fromarray(a)
x0, y0, x1, y1 = im.getbbox(); crop = im.crop((x0, y0, x1, y1)); H, Wd = crop.size[1], crop.size[0]
legL = poly_mask((H, Wd), [(p[0] - x0, p[1] - y0) for p in [(860, 590), (915, 585), (945, 700), (950, 800), (900, 800), (870, 700)]])
legR = poly_mask((H, Wd), [(p[0] - x0, p[1] - y0) for p in [(935, 600), (1000, 600), (1000, 720), (985, 860), (920, 860), (930, 720)]])
bodyR = ~(legL | legR) | poly_mask((H, Wd), [(0, 0), (Wd, 0), (Wd, 600 - y0), (0, 600 - y0)])
res['frente_corpo'] = svg_group(trace(crop, 9, 1.0, bodyR, x0, y0), 'fCorpo')
res['frente_pernaE'] = svg_group(trace(crop, 6, 1.0, legL & ~poly_mask((H, Wd), [(0, 0), (Wd, 0), (Wd, 600 - y0), (0, 600 - y0)]), x0, y0), 'fPernaE')
res['frente_pernaD'] = svg_group(trace(crop, 6, 1.0, legR & ~poly_mask((H, Wd), [(0, 0), (Wd, 0), (Wd, 605 - y0), (0, 605 - y0)]), x0, y0), 'fPernaD')
# 2) de lado, sem cabeça
im2 = Image.open('lado_sem_cabeca.png').convert('RGBA'); x0, y0, x1, y1 = im2.getbbox()
res['lado'] = svg_group(trace(im2.crop((x0, y0, x1, y1)), 9, 1.0, None, x0, y0), 'lado')
# 3) cabeça (close)
im3 = Image.open('px_375510_cut.png').convert('RGBA'); x0, y0, x1, y1 = im3.getbbox()
res['cabeca'] = svg_group(trace(im3.crop((x0, y0, x1, y1)), 14, .8, None, x0, y0), 'cabeca')
json.dump(res, open('../svg/mike/galinha_svg.json', 'w'))
for k, v in res.items(): print(k, len(v) // 1024, 'KB', v.count('<path'))
