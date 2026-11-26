"""Som do Short "A carne que ainda se mexe" (sem narração, sem música): só gravações reais do BigSoundBank (CC0) e impactos curtos.
Mugido 2383, mastigar = passos na lama 0495 abafado, engolir = commons/Swallowing_gulp, rúmen = água nas pedras (abafada), woosh 1796/1800,
pistola de dardo cativo = estalo curto + reforço grave, queda = Body Fall 2452/2453, cutelo = baque 2454 + estalo curto de osso (0596) +
tábua, carne tremendo = lama bem baixa e abafada (cada vez menos), cronômetro = bipe curto.
Uso: python3 sfx.py [saida.wav]"""
import sys, numpy as np
sys.path.insert(0, '../biblioteca3d/sons'); from mesa import Mesa, SR, grave
C = '../biblioteca3d/sons/commons/'
DUR = 55.0
T_TIRO, GOLPES = 23.6, [28.0, 29.0, 30.0, 31.0, 32.0, 33.0]
m = Mesa(DUR)
def estalo(f=2500, dur=0.03, ruido=0.85, sem=1):
    t = np.arange(int(dur * SR)) / SR; r = np.random.default_rng(sem).standard_normal(len(t))
    s = (np.sin(2 * np.pi * f * t) * (1 - ruido) + r * ruido) * np.exp(-t * 140); return np.stack([s, s], 1).astype(np.float32)
def bipe(f=2800, dur=0.09):
    t = np.arange(int(dur * SR)) / SR; s = np.sign(np.sin(2 * np.pi * f * t)) * 0.3 * np.minimum(1, (dur - t) * 60) * np.minimum(1, t * 400); return np.stack([s, s], 1).astype(np.float32)

# gancho: a carne fervilhando (molhado, baixinho)
for k, t in enumerate(np.arange(0.2, 3.4, 0.55)): m.por('0495', float(t), -30, ini=0.3 + k * 0.7, dur=0.35, lp=900, pan=-0.2)
m.passagem('1800', 3.5, dur=0.7, db=-16, de=0.6, para=-0.6)                                  # volta no tempo: o boi vivo
# pasto: mugido, mastigação (de perto, mais alta no close da boca)
m.por('2383', 4.0, -10, espaco='rua', pan=0.2)
for k, t in enumerate(np.arange(4.6, 9.5, 1 / 1.35)):
    db = -26 if t < 6.6 else -17
    m.por('0495', float(t), db, ini=1.0 + (k % 5) * 1.1, dur=0.32, lp=1400, pan=0.15)
m.por('2383', 8.7, -16, ini=0.4, dur=1.6, espaco='rua', pan=-0.3)
# digestão: engole, o bolo desce e o rúmen borbulha
m.por(C + 'Swallowing_gulp.ogg', 10.4, -10)
m.por(C + 'Swallowing_gulp.ogg', 12.8, -16, lp=700)
m.por(C + 'Water_over_rocks_as_tide_recedes.ogg', 12.7, -24, ini=3.0, dur=2.6, lp=600, ataque=0.4, soltura=0.6)
m.passagem('1796', 15.75, dur=0.6, db=-14)                                                  # mergulho no músculo
# células: o ATP "acendendo" (estalinhos de luz bem baixos)
for k, t in enumerate(np.linspace(17.2, 21.0, 16)): m.por(estalo(3200 + 300 * (k % 4), 0.02, 0.5, k), float(t), -32, pan=float(np.sin(k)) * 0.5)
# abate: silêncio curto antes, o estalo do dardo cativo, o corpo cai (joelhos e depois de lado)
m.silencio(T_TIRO - 0.4, T_TIRO, 0.2)
m.evento(T_TIRO, [(estalo(1800, 0.05, 0.9, 7), -6), ('2453', -14, {'dur': 0.15})], grave_=True)
m.por('2452', T_TIRO + 0.75, -8, espaco='rua')
m.por('2453', T_TIRO + 1.7, -6, espaco='rua'); m.por(grave(45, 0.6, 6), T_TIRO + 1.7, -12)
m.abafar(T_TIRO + 0.05, T_TIRO + 1.2, lp=900)
# açougue: cada golpe do cutelo = baque + estalo + tábua
for k, t in enumerate(GOLPES):
    m.evento(t, [('2454', -9, {'dur': 0.4}), ('0596', -22, {'ini': 2.0 + k * 1.3, 'dur': 0.12}), (estalo(900, 0.06, 0.95, 20 + k), -14)], espaco='sala', pan=-0.25)
    m.por(estalo(4200, 0.015, 0.7, 40 + k), t - 0.16, -30, pan=-0.4)                         # o ar cortado na descida
for k, t in enumerate(np.arange(26.6, 34, 0.5)): m.por('0495', float(t), -34, ini=0.2 + k * 0.4, dur=0.3, lp=800)   # carne viva na tábua
# a carne fervilhando: o som some junto com o tremor
for k, t in enumerate(np.arange(34.1, 47.0, 0.45)):
    amp = max(0.0, 1 - (t - 34) / 13) ** 1.5
    if amp > 0.04: m.por('0495', float(t), -24 + 20 * np.log10(amp + 1e-3), ini=0.5 + (k % 7) * 0.9, dur=0.3, lp=900 if t < 39 or t > 43 else 500)
m.passagem('1800', 39.0, dur=0.5, db=-20); m.passagem('1796', 43.0, dur=0.5, db=-20)
m.passagem('1800', 49.5, dur=0.5, db=-22); m.passagem('1796', 52.0, dur=0.5, db=-22)
# cronômetro: bipe quando chega em 1 h e em 12 h
for t in (46.9, 53.0): m.por(bipe(), t, -18); m.por(bipe(), t + 0.15, -18)
m.finalizar(sys.argv[1] if len(sys.argv) > 1 else 'som.wav', media=-23.0)
