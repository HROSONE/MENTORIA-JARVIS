# Mede o tubarao.glb contra a tabela de proporções do canal (% do comprimento total, CT = do focinho à ponta do lobo de cima da cauda).
# uso: blender -b --python medir_tubarao.py -- tubarao.glb
import bpy, sys
import numpy as np
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=sys.argv[-1])
o = next(x for x in bpy.data.objects if x.type == 'MESH' and len(x.data.polygons) > 50000)
V = np.array([o.matrix_world @ v.co for v in o.data.vertices]); x, y, z = V.T          # importado: x frente, z cima
X0 = x.max(); cauda = x < 1.0
sup = V[np.argmax(np.where(cauda, z, -9))]; inf = V[np.argmin(np.where(cauda, z, 9))]
CT = X0 - sup[0]; pc = lambda xx: 100 * (X0 - xx) / CT
def linha(nome, valor, faixa): print(f'MEDIDA {nome:<34} {valor:6.1f}   tabela {faixa}')
print(f'MEDIDA CT {CT:.3f} m')
fatias = []
for xs in np.arange(0.8, 4.45, 0.025):
    s = np.abs(x - xs) < 0.012; c = s & (np.abs(y) < 0.02); m = s & (np.abs(z) < 0.15)
    if c.sum() < 2 or not m.any(): continue
    fatias.append((xs, z[c].min(), z[c].max(), np.abs(y[m]).max()))
L = max((f for f in fatias if f[0] > 1.2), key=lambda f: f[3])
linha('largura máxima (% CT)', 200 * L[3] / CT, '15–18'); linha('posição da largura máxima (%)', pc(L[0]), '32–36')
H = max((f for f in fatias if 3.15 < f[0] < 3.4), key=lambda f: f[2] - f[1])          # logo à frente da 1ª dorsal (sem a nadadeira)
linha('altura máxima do tronco (% CT)', 100 * (H[2] - H[1]) / CT, '18–22')
P = min((f for f in fatias if 0.8 < f[0] < 1.2), key=lambda f: f[2] - f[1])
linha('altura do pedúnculo (% CT)', 100 * (P[2] - P[1]) / CT, '3,5–4,5'); linha('fosseta pré-caudal (%)', pc(P[0]), '78–80')
linha('largura do pedúnculo c/ quilhas (% CT)', 200 * max(f[3] for f in fatias if 0.85 < f[0] < 1.05) / CT, '~6')
d = V[np.argmax(z)]; dorso = max(f[2] for f in fatias if 3.15 < f[0] < 3.4)
linha('altura da 1ª dorsal acima do dorso (%)', 100 * (d[2] - dorso) / CT, '11–13')
c0 = np.array((0.945, 0, 0.03)); linha('ângulo do lobo de cima (graus)', np.degrees(np.arctan2(sup[2] - c0[2], c0[0] - sup[0])), '35–42')
linha('ponta do lobo de baixo (%)', pc(inf[0]), '92–95'); linha('ângulo do lobo de baixo (graus)', np.degrees(np.arctan2(-0.02 - inf[2], 0.93 - inf[0])), '35–40')
pe = V[np.argmax(np.abs(y))]; raiz = np.array((3.42, np.sign(pe[1]) * 0.27, -0.22))
linha('borda de ataque da peitoral (% CT)', 100 * np.linalg.norm(pe - raiz) / CT, '18–21')
for xs in (4.30, 4.10):
    f = min(fatias, key=lambda f: abs(f[0] - xs)); print(f'MEDIDA cabeça em {pc(xs):.0f}%: altura {f[2] - f[1]:.3f} m, largura {2 * f[3]:.3f} m (tabela: mais larga que alta)')
for xs in (2.0, 1.6):
    f = min(fatias, key=lambda f: abs(f[0] - xs)); print(f'MEDIDA tronco em {pc(xs):.0f}%: altura {f[2] - f[1]:.3f} m, largura {2 * f[3]:.3f} m (tabela: mais alta que larga)')
