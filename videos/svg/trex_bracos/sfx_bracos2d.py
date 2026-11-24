# Som do Short 2D "Ele não alcança a própria boca 🦖": só gravações reais (BigSoundBank CC0, Wikimedia Commons PD) e estalos curtos.
# Sem música: o dono narra por cima. Tempos iguais aos planos de cenas.js.
# uso: python3 sfx_bracos2d.py saida.wav
import os, sys
import numpy as np
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, '..', '..', 'biblioteca3d', 'sons')); sys.path.insert(0, os.path.join(AQUI, '..', '..', 'trex_corrida'))
from mesa import Mesa, ler, grave, filtro, SR
import sfx_trex as X
from sfx_trex import camada, golpes, rugido, pisada_trex

TOTAL = 34.0
def estalo(m, t, db=0.0):
    m.evento(t, [('1408', db - 2), ('1300', db - 6, {'atraso': 0.01}), ('2453', db - 10, {'atraso': 0.02, 'lp': 1500})], grave_=True, espaco='vale')
def esforco(m, t, db=-8, dur=0.7):                     # grunhido grave de esforço (gente em 0,55x = bicho grande)
    m.por(camada('0486', 1.0 + (t * 7) % 6, dur, 0.55, lp=2500, alvo=-20), t, db, ataque=0.03, soltura=0.2, espaco='vale')
def sopro(m, t, db=-10, vel=1.0, rev=False):
    a = ler('1800' if not rev else '1796', 0, None, vel); m.por(a[::-1].copy() if rev else a, t, db, lp=5000)
def rosnado(m, t, dur, db=-12, vel=0.6):
    m.por(camada('2106', 2.0, dur, vel, lp=900, alvo=-20), t, db, ataque=0.15, soltura=0.3, espaco='vale')

def cena_carne(m, t0, k=1.0):
    """o gancho: esforço para levantar, mordida no ar, a carne cai e quica, um rosnado triste (k = escala do tempo)"""
    esforco(m, t0 + 0.4 * k, db=-9, dur=0.9 * k)
    esforco(m, t0 + 1.2 * k, db=-7, dur=0.7 * k)
    estalo(m, t0 + 1.75 * k, db=-4)                                      # a boca fecha no ar
    sopro(m, t0 + 2.05 * k, db=-14, vel=1.3)                              # a carne escorrega
    m.por('2452', t0 + 2.75 * k, -6, lp=3000)                             # bate no chão
    m.por(golpes('0596', 4, comp=0.25, sem=2)[0], t0 + 2.78 * k, -12, lp=1500)
    m.por('2454', t0 + 2.95 * k, -16, lp=2500)                            # quica
    rosnado(m, t0 + 2.85 * k, 1.0 * k, db=-13, vel=0.5)                   # o lamento

def montar(saida):
    X.PISO_TERRA = golpes('0495', 6, comp=0.5); X.GALHOS = golpes('1301', 8, comp=0.4, sem=2)
    m = Mesa(TOTAL + 0.05)
    m.por(camada('2749', 20, None, 1.0, alvo=-20, lp=4200), 0, -14, ate=TOTAL, laco=True, pan=-0.2, ataque=0.3, soltura=0.3)
    m.por(camada('0100', 3, None, 1.0, alvo=-20, lp=4200), 0, -17, ate=TOTAL, laco=True, pan=0.25, ataque=0.3, soltura=0.3)
    cena_carne(m, 0.0)
    # P2 mosquito (3,2–6,4): o zumbido chega e para; esforço tremido; coça na casca da árvore; suspiro
    m.por(camada('0425', 2.0, 1.1, 1.9, hp=900, lp=6000, alvo=-20), 3.2, -10, ataque=0.15, soltura=0.05, pan=(0.8, 0.1))
    esforco(m, 4.3, db=-8, dur=1.0); esforco(m, 4.9, db=-9, dur=0.6)
    for k in range(8): m.por(X.GALHOS[k % 8], 5.5 + k * 0.11, -12 - (k % 3) * 2, lp=3500, pan=0.4)
    m.por(camada('0425', 6.0, 0.6, 2.1, hp=900, lp=6000, alvo=-20), 5.6, -16, pan=(0.3, 1.0), soltura=0.2)      # o mosquito vai embora
    rosnado(m, 6.0, 0.6, db=-15, vel=0.7)
    # P3 régua (6,4–9,6): toque de madeira das réguas, câmera abrindo (sopro), fita métrica correndo
    m.por('1300', 6.55, -10, lp=6000); m.por('1300', 6.75, -12, lp=6000, pan=0.3)
    sopro(m, 7.7, db=-11, vel=0.7)
    for k in range(14): m.por('2254', 8.45 + k * 0.06, -26, lp=5000, pan=-0.6 + k * 0.1)                 # a fita desenrolando (cliques)
    m.por('1300', 9.35, -12)
    # P4 bíceps (9,6–13,0): a tora pesada, esforço a cada rosca, rangido da madeira, rosnado orgulhoso
    m.por('2453', 9.7, -10, lp=1500)
    for k in range(3): esforco(m, 10.15 + k * 1.43, db=-6 - k, dur=0.6)
    rosnado(m, 12.3, 0.8, db=-11, vel=0.75)
    # P5 (13,0–15,0): dar de ombros (dois sopros curtos)
    sopro(m, 13.45, db=-17, vel=1.6); sopro(m, 14.4, db=-18, vel=1.6)
    # P6 briga (15,0–20,5): os outros chegam (pisadas), pulam na carcaça, nuvem de briga: estalos, rosnados, um rugido
    for k, tt in enumerate([15.4, 15.9, 16.4, 16.9]): pisada_trex(m, tt, 14 - 2 * k, (-1) ** k * 0.4, db=-3)
    m.por('2453', 16.7, -4, lp=1200); sopro(m, 16.6, db=-8, vel=0.8)
    for k in range(12): tt = 17.0 + k * 0.28 + (k % 3) * 0.05; estalo(m, tt, db=-8 - (k % 4) * 2); m.por(X.GALHOS[k % 8], tt + 0.04, -14, pan=(-1) ** k * 0.5)
    rosnado(m, 17.0, 3.4, db=-10, vel=0.6); rugido(m, 18.4, db=-6, dur=1.5, raiva=1.2)
    # P7 petisco (20,5–25,0): o braço cresce (sopro estranho), entra na nuvem, NHAC, grito de dor, quica
    sopro(m, 20.7, db=-12, vel=0.55)
    for k in range(5): estalo(m, 21.0 + k * 0.3, db=-14)
    estalo(m, 22.65, db=3); m.por('2453', 22.68, -4, lp=1500)
    m.por(camada('2361', 0, 0.6, 0.62, alvo=-20), 22.72, -3)                                              # o "ai!" (grito curto em 0,62x)
    rugido(m, 22.9, db=-6, dur=1.1, raiva=1.4)
    for k in range(3): m.por('2454', 23.0 + k * 0.32, -12 - 3 * k, lp=2500)                             # os pulinhos
    # P8 seguro (25,0–29,5): ele mastiga tranquilo; mordidas que passam raspando e erram
    m.por(golpes('0596', 6, comp=0.3, sem=4)[1], 25.2, -14, lp=1800)
    for k in range(8): m.por(golpes('0596', 6, comp=0.3, sem=k)[k % 6], 25.3 + k * 0.52, -16, lp=1600)
    for tt in [26.0, 27.2, 28.4]: sopro(m, tt - 0.2, db=-9, vel=1.2); estalo(m, tt + 0.05, db=-3)
    rosnado(m, 28.9, 0.6, db=-16, vel=0.8)
    # P9 laço (29,5–34,0): o gancho de novo, mais lento
    cena_carne(m, 29.5, k=4.5 / (3.2 * 0.9) * 0.9)
    m.finalizar(saida)

if __name__ == '__main__':
    montar(sys.argv[1] if len(sys.argv) > 1 else 'sfx_bracos2d.wav')
