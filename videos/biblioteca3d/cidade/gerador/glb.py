"""Escritor mínimo de glTF 2.0 binário (.glb), só com numpy.
Materiais PBR (cor, rugosidade, emissão, textura PNG embutida), hierarquia de nós com nomes e `extras`.
As cores são dadas em sRGB (#rrggbb) e convertidas para linear, como o glTF exige."""
import json
import struct
import numpy as np


def hex_rgb(h):
    h = h.lstrip('#')
    return [int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)]


def srgb_to_linear(c):
    c = np.asarray(c, dtype=float)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


class Material:
    def __init__(self, name, color='#ffffff', rough=0.9, metal=0.0, emissive=None, texture=None, double_sided=False,
                 alpha=None, repeat=False):
        self.name = name
        self.color = hex_rgb(color) if isinstance(color, str) else list(color)
        self.rough = rough
        self.metal = metal
        self.emissive = None if emissive is None else (hex_rgb(emissive) if isinstance(emissive, str) else list(emissive))
        self.texture = texture            # bytes de um PNG (opcional)
        self.double_sided = double_sided
        self.alpha = alpha                # None (opaco) ou 'BLEND': usa o canal alfa do PNG (tela de alambrado, vidro)
        self.repeat = repeat              # textura que se repete (UV maiores que 1)


class Prim:
    def __init__(self, material, positions, normals, indices, uvs=None, joints=None, weights=None, colors=None):
        self.material = material
        self.positions = np.asarray(positions, dtype='<f4').reshape(-1, 3)
        self.normals = np.asarray(normals, dtype='<f4').reshape(-1, 3)
        self.indices = np.asarray(indices, dtype='<u4').reshape(-1)
        self.uvs = None if uvs is None else np.asarray(uvs, dtype='<f4').reshape(-1, 2)
        self.joints = None if joints is None else np.asarray(joints, dtype='<u2').reshape(-1, 4)       # malha com esqueleto: 4 juntas por vértice
        self.weights = None if weights is None else np.asarray(weights, dtype='<f4').reshape(-1, 4)    # e os 4 pesos (somam 1)
        self.colors = None if colors is None else np.asarray(colors, dtype='<f4').reshape(-1, 3)       # cor por vértice (COLOR_0, multiplica a cor do material): sujeira, olheiras, barba


class Skin:
    """esqueleto de uma malha: `joints` (lista de Node, na ordem dos índices JOINTS_0) e `ibms` (matriz 4x4 inversa da pose de repouso de cada junta)"""
    def __init__(self, joints, ibms, nome='Esqueleto', raiz=None):
        self.joints, self.ibms, self.nome, self.raiz = joints, ibms, nome, raiz


class Animacao:
    """clipe: `canais` = [(Node, 'rotation' | 'translation' | 'scale', tempos, valores)], interpolação linear"""
    def __init__(self, nome, canais):
        self.nome, self.canais = nome, canais


class Node:
    def __init__(self, name, prims=None, children=None, translation=(0, 0, 0), rotation=(0, 0, 0, 1), scale=(1, 1, 1), extras=None, skin=None):
        self.skin = skin
        self.name = name
        self.prims = prims or []
        self.children = children or []
        self.translation = translation
        self.rotation = rotation
        self.scale = scale
        self.extras = extras


def write_glb(path, roots, generator='Hryz Animation - kit cidade', animations=None):
    buf = bytearray()
    views, accessors, jmats, jimgs, jtex, jmeshes, jnodes = [], [], [], [], [], [], []
    mat_index, tex_index = {}, {}

    def add_view(data, target=None):
        while len(buf) % 4:
            buf.append(0)
        views.append({'buffer': 0, 'byteOffset': len(buf), 'byteLength': len(data), **({'target': target} if target else {})})
        buf.extend(data)
        return len(views) - 1

    def add_accessor(arr, comp, typ, target, minmax=False):
        v = add_view(np.ascontiguousarray(arr).tobytes(), target)
        a = {'bufferView': v, 'componentType': comp, 'count': int(len(arr)), 'type': typ}
        if minmax:
            a['min'] = [float(x) for x in arr.min(axis=0)]
            a['max'] = [float(x) for x in arr.max(axis=0)]
        accessors.append(a)
        return len(accessors) - 1

    def material(m):
        if id(m) in mat_index:
            return mat_index[id(m)]
        pbr = {'baseColorFactor': [*[float(x) for x in srgb_to_linear(m.color)], float(getattr(m, 'opacidade', 1.0))], 'metallicFactor': float(m.metal), 'roughnessFactor': float(m.rough)}
        jm = {'name': m.name, 'pbrMetallicRoughness': pbr}
        if m.texture is not None:
            if id(m.texture) not in tex_index:
                jimgs.append({'bufferView': add_view(m.texture), 'mimeType': 'image/jpeg' if bytes(m.texture[:2]) == b'\xff\xd8' else 'image/png', 'name': m.name})
                jtex.append({'sampler': 1 if m.repeat else 0, 'source': len(jimgs) - 1})
                tex_index[id(m.texture)] = len(jtex) - 1
            pbr['baseColorTexture'] = {'index': tex_index[id(m.texture)]}
            pbr['baseColorFactor'] = [1.0, 1.0, 1.0, 1.0]
        if m.emissive is not None:
            jm['emissiveFactor'] = [float(x) for x in srgb_to_linear(m.emissive)]
        if m.double_sided:
            jm['doubleSided'] = True
        if m.alpha:
            jm['alphaMode'] = m.alpha
        jmats.append(jm)
        mat_index[id(m)] = len(jmats) - 1
        return mat_index[id(m)]

    def make_mesh(node):
        prims = []
        for p in node.prims:
            attrs = {'POSITION': add_accessor(p.positions, 5126, 'VEC3', 34962, True), 'NORMAL': add_accessor(p.normals, 5126, 'VEC3', 34962)}
            if p.uvs is not None:
                attrs['TEXCOORD_0'] = add_accessor(p.uvs, 5126, 'VEC2', 34962)
            if p.colors is not None:
                attrs['COLOR_0'] = add_accessor(p.colors, 5126, 'VEC3', 34962)
            if p.joints is not None:
                attrs['JOINTS_0'] = add_accessor(p.joints, 5123, 'VEC4', 34962)
                attrs['WEIGHTS_0'] = add_accessor(p.weights, 5126, 'VEC4', 34962)
            if p.positions.shape[0] < 65535:
                idx = add_accessor(p.indices.astype('<u2'), 5123, 'SCALAR', 34963)
            else:
                idx = add_accessor(p.indices, 5125, 'SCALAR', 34963)
            prims.append({'attributes': attrs, 'indices': idx, 'material': material(p.material), 'mode': 4})
        jmeshes.append({'name': node.name, 'primitives': prims})
        return len(jmeshes) - 1

    node_index, skin_nodes = {}, []

    def emit(node):
        idx = len(jnodes)
        jn = {'name': node.name}
        jnodes.append(jn)
        node_index[id(node)] = idx
        if node.skin is not None:
            skin_nodes.append((idx, node.skin))
        if node.prims:
            jn['mesh'] = make_mesh(node)
        if tuple(node.translation) != (0, 0, 0):
            jn['translation'] = [float(x) for x in node.translation]
        if tuple(node.rotation) != (0, 0, 0, 1):
            jn['rotation'] = [float(x) for x in node.rotation]
        if tuple(node.scale) != (1, 1, 1):
            jn['scale'] = [float(x) for x in node.scale]
        if node.extras:
            jn['extras'] = node.extras
        if node.children:
            jn['children'] = [emit(c) for c in node.children]
        return idx

    scene_nodes = [emit(r) for r in roots]
    jskins, skin_idx = [], {}
    for idx, sk in skin_nodes:                       # esqueletos: matrizes inversas de repouso (MAT4, colunas em sequência)
        if id(sk) not in skin_idx:
            ibm = np.stack([np.asarray(m, dtype='<f4').flatten(order='F') for m in sk.ibms])
            d = {'joints': [node_index[id(j)] for j in sk.joints], 'inverseBindMatrices': add_accessor(ibm, 5126, 'MAT4', None), 'name': sk.nome}
            if sk.raiz is not None:
                d['skeleton'] = node_index[id(sk.raiz)]
            jskins.append(d)
            skin_idx[id(sk)] = len(jskins) - 1
        jnodes[idx]['skin'] = skin_idx[id(sk)]
    janims = []
    for an in animations or []:                      # clipes de animação: um amostrador linear por canal
        samplers, channels = [], []
        for nodo, caminho, tempos, valores in an.canais:
            t = np.asarray(tempos, dtype='<f4').reshape(-1, 1)
            v = np.asarray(valores, dtype='<f4').reshape(len(t), -1)
            samplers.append({'input': add_accessor(t, 5126, 'SCALAR', None, True), 'output': add_accessor(v, 5126, 'VEC4' if caminho == 'rotation' else 'VEC3', None), 'interpolation': 'LINEAR'})
            channels.append({'sampler': len(samplers) - 1, 'target': {'node': node_index[id(nodo)], 'path': caminho}})
        janims.append({'name': an.nome, 'samplers': samplers, 'channels': channels})
    while len(buf) % 4:
        buf.append(0)
    doc = {'asset': {'version': '2.0', 'generator': generator}, 'scene': 0, 'scenes': [{'nodes': scene_nodes}],
           'nodes': jnodes, 'meshes': jmeshes, 'materials': jmats, 'accessors': accessors,
           'bufferViews': views, 'buffers': [{'byteLength': len(buf)}]}
    if jskins:
        doc['skins'] = jskins
    if janims:
        doc['animations'] = janims
    if jimgs:
        doc['images'] = jimgs
        doc['textures'] = jtex
        doc['samplers'] = [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 33071, 'wrapT': 33071},
                           {'magFilter': 9729, 'minFilter': 9987, 'wrapS': 10497, 'wrapT': 10497}]
    js = json.dumps(doc, separators=(',', ':')).encode('utf-8')
    js += b' ' * ((4 - len(js) % 4) % 4)
    total = 12 + 8 + len(js) + 8 + len(buf)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(js), 0x4E4F534A) + js)
        f.write(struct.pack('<II', len(buf), 0x004E4942) + bytes(buf))
    return total
