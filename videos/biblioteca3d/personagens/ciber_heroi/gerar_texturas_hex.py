#!/usr/bin/env python3
"""Gera texturas PBR 100% determinísticas em PNG 8-bit puro (struct + zlib, zero alteração de gama!)
para o tecido tático micro-hexagonal azul-marinho escuro do Ciber-Herói."""
import math
import os
import struct
import zlib
import bpy
import numpy as np

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tex')
os.makedirs(OUT_DIR, exist_ok=True)


def gravar_png_rgb8(caminho, rgb_u8):
    """Grava array uint8 (H, W, 3) diretamente como PNG 8-bit exato, sem gerenciamento de cor do Blender."""
    h, w, _ = rgb_u8.shape
    linhas = b''.join(b'\x00' + rgb_u8[y].tobytes() for y in range(h))

    def chunk(tag, dados):
        return struct.pack('>I', len(dados)) + tag + dados + struct.pack('>I', zlib.crc32(tag + dados) & 0xffffffff)

    ihdr = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(linhas, 6)) + chunk(b'IEND', b'')
    with open(caminho, 'wb') as f:
        f.write(png)


def gerar_hex_pbr(w=1024):
    nx = 32
    ny = int(round(nx / (math.sqrt(3) / 2) / 2)) * 2

    u = np.linspace(0.0, 1.0, w, endpoint=False)
    v = np.linspace(0.0, 1.0, w, endpoint=False)
    uu, vv = np.meshgrid(u, v)

    px = uu * nx
    py = vv * ny

    best_d = np.full((w, w), 1e9, dtype=np.float64)
    second_d = np.full((w, w), 1e9, dtype=np.float64)

    aspect = (nx / ny) * (math.sqrt(3) / 2.0)
    for ox, oy in ((0.0, 0.0), (0.5, 0.5)):
        fx = (px - ox) - np.round(px - ox)
        fy = ((py - oy) - np.round(py - oy)) * aspect
        for dx in (-1.0, 0.0, 1.0):
            for dy in (-1.0, 0.0, 1.0):
                qx = fx - dx
                qy = fy - dy * aspect
                d = np.hypot(qx, qy)
                mask1 = d < best_d
                second_d = np.where(mask1, best_d, np.minimum(second_d, d))
                best_d = np.where(mask1, d, best_d)

    # Sulco hexagonal nítido e domo chanfrado
    edge = np.clip((second_d - best_d) / 0.175, 0.0, 1.0)
    bevel = (edge ** 0.45) * (1.0 - 0.12 * (1.0 - best_d / 0.36).clip(0.0, 1.0))
    weave = 0.040 * np.sin(2.0 * math.pi * (uu * nx * 3 + vv * ny * 3)) * (edge > 0.24)
    height = np.clip(bevel + weave, 0.0, 1.0)

    # 1) Height map p/ Bump (imune a costuras de tangente UV!)
    h_u8 = np.repeat((height * 255.0).clip(0, 255).astype(np.uint8)[..., None], 3, axis=-1)
    gravar_png_rgb8(os.path.join(OUT_DIR, 'hex_height.png'), h_u8)

    # 2) Normal map OpenGL p/ glTF / Three.js
    strength = 3.4
    dh_dx = (np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)) * strength
    dh_dy = (np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)) * strength
    nx_m = -dh_dx
    ny_m = dh_dy
    nz_m = np.ones_like(height)
    inv = 1.0 / np.sqrt(nx_m * nx_m + ny_m * ny_m + nz_m * nz_m)
    nrm_u8 = np.stack([
        (nx_m * inv * 0.5 + 0.5) * 255.0,
        (ny_m * inv * 0.5 + 0.5) * 255.0,
        (nz_m * inv * 0.5 + 0.5) * 255.0,
    ], axis=-1).clip(0, 255).astype(np.uint8)
    gravar_png_rgb8(os.path.join(OUT_DIR, 'hex_normal.png'), nrm_u8)

    # 3) Albedo sRGB exato: azul-marinho meia-noite rico no topo RGB(40, 55, 82), sulco escuro RGB(13, 19, 32)
    top_rgb = np.array([40.0, 55.0, 82.0])
    groove_rgb = np.array([13.0, 19.0, 32.0])
    t = (edge ** 0.52)[..., None]
    alb_u8 = (groove_rgb * (1.0 - t) + top_rgb * t + weave[..., None] * 10.0).clip(0, 255).astype(np.uint8)
    gravar_png_rgb8(os.path.join(OUT_DIR, 'hex_albedo.png'), alb_u8)

    # 4) Roughness: topo acetinado (0.36 -> 92), sulco fosco (0.74 -> 189)
    rough = (0.74 * (1.0 - edge ** 0.52) + 0.36 * (edge ** 0.52) - weave * 0.05).clip(0.20, 0.92)
    rgh_u8 = np.repeat((rough * 255.0).astype(np.uint8)[..., None], 3, axis=-1)
    gravar_png_rgb8(os.path.join(OUT_DIR, 'hex_roughness.png'), rgh_u8)
    print('Texturas PNG 8-bit exatas salvas em:', OUT_DIR)


if __name__ == '__main__':
    gerar_hex_pbr(1024)
