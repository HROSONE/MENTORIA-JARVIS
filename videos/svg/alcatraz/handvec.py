import cv2, numpy as np, json
from PIL import Image
from rembg import remove, new_session
exec(open('../clip/vetoriza.py').read().split('def trace')[0])   # smooth_path, mask_paths
def cutout(id, sat_min=0):
    a = np.array(Image.open(f'cut_{id}.png'))
    if sat_min:
        im = np.array(Image.open(f'px_{id}.jpg').convert('RGB')); hsv = cv2.cvtColor(im, cv2.COLOR_RGB2HSV)
        ycc = cv2.cvtColor(im, cv2.COLOR_RGB2YCrCb)
        m = (a[:, :, 3] > 0) & (hsv[:, :, 1] > sat_min) & (ycc[:, :, 1] > 138)
        m = cv2.morphologyEx(m.astype(np.uint8) * 255, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
        n, lab, st, _ = cv2.connectedComponentsWithStats(m); big = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]); a[:, :, 3] = ((lab == big) * 255).astype(np.uint8)
    return a
def trace_skin(a, k=12):
    al = a[:, :, 3] > 100
    sm = cv2.pyrMeanShiftFiltering(np.ascontiguousarray(a[:, :, :3]), 6, 14); sm = cv2.bilateralFilter(sm, 9, 30, 9)
    lab = cv2.cvtColor(sm, cv2.COLOR_RGB2LAB).astype(np.float32); data = lab[al]
    _, lbl, cen = cv2.kmeans(data, k, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, .3), 3, cv2.KMEANS_PP_CENTERS)
    cen[:, 1] = 128 + (cen[:, 1] - 128) * 1.15; cen[:, 0] = np.clip(cen[:, 0] * 1.02, 0, 255)
    full = np.full(al.shape, -1, np.int32); full[al] = lbl[:, 0]
    rgb = cv2.cvtColor(cen.reshape(1, -1, 3).astype(np.uint8), cv2.COLOR_LAB2RGB)[0]
    hexc = lambda i: '#%02x%02x%02x' % tuple(int(v) for v in rgb[i])
    order = sorted(range(k), key=lambda i: -(full == i).sum())
    base = (al * 255).astype(np.uint8)
    out = f'<path d="{mask_paths(base, 0, 0, 1.2)}" fill="{hexc(order[0])}" stroke="#4a2a1a" stroke-width="5" stroke-linejoin="round"/>'
    for i in order[1:]:
        m = ((full == i) * 255).astype(np.uint8); m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)); m = cv2.dilate(m, np.ones((2, 2), np.uint8)) & base
        d = mask_paths(m, 0, 0, 1.2, 20)
        if d: out += f'<path d="{d}" fill="{hexc(i)}"/>'
    out += f'<path d="{mask_paths(base, 0, 0, 1.2)}" fill="none" stroke="#3a2010" stroke-width="3" opacity=".6" stroke-linejoin="round"/>'
    return out
def sleeve(a, exit_pt, D, folds=5):
    al = (a[:, :, 3] > 100).astype(np.uint8)
    yy, xx = np.mgrid[0:al.shape[0], 0:al.shape[1]]
    dist = np.hypot(xx - exit_pt[0], yy - exit_pt[1])
    m = ((al > 0) & (dist < D)).astype(np.uint8) * 255
    m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
    d = mask_paths(m, 0, 0, 2.0, 200)
    # dobras: arcos perpendiculares ao braço, dentro da manga
    ys, xs = np.where(m > 0); cx, cy = xs.mean(), ys.mean()
    vx, vy = cx - exit_pt[0], cy - exit_pt[1]; L = np.hypot(vx, vy) + 1e-6; vx, vy = vx / L, vy / L; px, py = -vy, vx
    f = ''
    for i in range(folds):
        t = (i + 1) / (folds + 1) * D * .95; ox, oy = exit_pt[0] + vx * t, exit_pt[1] + vy * t
        w = 160
        f += f'<path d="M{ox - px * w:.0f} {oy - py * w:.0f} Q{ox + vx * 40:.0f} {oy + vy * 40:.0f} {ox + px * w:.0f} {oy + py * w:.0f}" stroke="#1E2836" stroke-width="10" fill="none" opacity=".55" stroke-linecap="round"/>'
    # punho (borda da manga)
    edge = cv2.Canny(m, 50, 150)
    cuff = f'<path d="{d}" fill="none" stroke="#141C28" stroke-width="10" stroke-linejoin="round"/>'
    cid = 'clp' + str(abs(hash(d)) % 100000)
    return f'<g><clipPath id="{cid}"><path d="{d}"/></clipPath><path d="{d}" fill="url(#slvG)"/><g clip-path="url(#{cid})">{f}<path d="{d}" fill="none" stroke="#8A9CB6" stroke-width="14" opacity=".35" transform="translate(-8,-8)"/></g>{cuff}</g>'
res = {}
spec = {'pinca': ('20805378', 0, (1400, 0), 520), 'aberta': ('1257770', 0, (1400, 470), 420)}
for name, (id, sat, ex, D) in spec.items():
    a = cutout(id, sat)
    bb = Image.fromarray(a).getbbox()
    res[name] = {'skin': trace_skin(a), 'sleeve': sleeve(a, ex, D), 'bbox': bb, 'exit': ex}
    print(name, bb, len(res[name]['skin']) // 1024, 'KB')
json.dump(res, open('maos.json', 'w'))
