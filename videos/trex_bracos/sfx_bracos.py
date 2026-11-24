# Som do Short "Por que o braço do T. rex era curto?": mata, pisadas, rosnados e rugidos em camadas de animais reais (as mesmas receitas do
# Short da corrida, sfx_trex.py), mordidas que estalam, carne sendo puxada e a volta no tempo. Sem música (o dono narra por cima).
# Gravações: BigSoundBank (CC0) em biblioteca3d/sons/bsb e domínio público do Wikimedia Commons em biblioteca3d/sons/commons.
# uso: python3 sfx_bracos.py saida.wav
import os, sys, json
import numpy as np
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, '..', 'biblioteca3d', 'sons')); sys.path.insert(0, os.path.join(AQUI, '..', 'trex_corrida'))
from mesa import Mesa, ler, grave, filtro, SR
import sfx_trex as X
from sfx_trex import camada, golpes, rugido, pisada_trex

P = {p['nome']: p for p in json.load(open(os.path.join(AQUI, 'eventos.json')))['planos']}
t_ = lambda nome, d=0.0: P[nome]['t0'] + d
TOTAL = max(p['t1'] for p in P.values())

def estalo(m, t, db=0.0, espaco='vale'):
    """dentes de 30 cm batendo: estalo seco + madeira + sub-grave"""
    m.evento(t, [('1408', db - 2), ('1300', db - 6, {'atraso': 0.01}), ('2453', db - 9, {'atraso': 0.02, 'lp': 1500})], grave_=True, espaco=espaco)
def bote(m, t, db=0.0):
    """o ar empurrado pela cabeça que avança (sopro curto) antes do estalo"""
    m.por(ler('1796', 0, None, 1.15), t, db - 9, lp=2500, ataque=0.05, soltura=0.1)
def rosnado(m, t, dur, db=-12, pan=0.0):
    m.por(camada('2106', 2.0, dur, 0.6, lp=900, alvo=-20), t, db, pan=pan, ataque=0.2, soltura=0.3, espaco='vale')
def come(m, t0, t1, db=-13, per=0.55, pan=0.0, sem=0):
    """carne sendo arrancada e mastigada, em ciclos (abafado)"""
    G = golpes('0596', 6, comp=0.3, sem=sem); k = 0; t = t0
    while t < t1: m.por(G[k % 6], t, db + (k % 3 == 0) * 2, lp=1800, pan=pan); m.por(X.PISO_TERRA[k % 6], t + 0.02, db - 5, lp=700, pan=pan); t += per * (0.85 + 0.3 * ((k * 37) % 10) / 10); k += 1

def montar(saida):
    X.PISO_TERRA = golpes('0495', 6, comp=0.5); X.GALHOS = golpes('1301', 8, comp=0.4, sem=2)
    m = Mesa(TOTAL + 0.05)
    # leito: mata (pássaros e insetos); some um pouco no caos
    m.por(camada('2749', 20, None, 1.0, alvo=-20, lp=4200), 0, -12, ate=TOTAL, laco=True, pan=-0.2, ataque=0.3, soltura=0.3)
    m.por(camada('0100', 3, None, 1.0, alvo=-20, lp=4200), 0, -15, ate=TOTAL, laco=True, pan=0.25, ataque=0.3, soltura=0.3)
    # P1: comendo; o bote de B (sopro) e os dentes fecham a um palmo do braço; REX solta um rosnado curto
    def cena_mordida(t0, esc=1.0):
        come(m, t0, t0 + 2.3 * esc, db=-14, sem=1); rosnado(m, t0, 2.2 * esc, db=-14, pan=0.3)
        bote(m, t0 + 1.25 * esc, db=-2); estalo(m, t0 + 1.85 * esc, db=1)
        m.por(camada('2107', 4.7, 0.9, 0.6, lp=4000), t0 + 1.95 * esc, -8, ataque=0.03, soltura=0.3, espaco='vale', pan=-0.2)   # REX rosna de susto
    cena_mordida(t_('P1 mordida'))
    # R1: o próprio som de trás para a frente, acelerado, e um sopro
    t0, de = t_('R1 volta'), 0.0; seg = m.mix[int(de * SR):int(t0 * SR)][::-1].copy(); n = int(0.5 * SR)
    seg = filtro(seg[np.linspace(0, len(seg) - 1, n).astype(int)], lp=3500, hp=200); m.mix[int(t0 * SR):int(t0 * SR) + n] *= 0.25
    m.por(seg, t0, -4, ataque=0.03, soltura=0.08); m.por(ler('1796', 0, None, 0.8)[::-1].copy(), t0 - 0.1, -9)
    # P2-P3: REX anda sozinho (2,2 m/s: uma pisada a cada ~0,85 s) e para
    tp = t_('P2 escala') + 0.25; k = 0
    while tp < t_('P3 boca', 0.35): pisada_trex(m, tp, 12 if tp < t_('P3 boca') else 8, (-1) ** k * 0.3, db=-2); tp += 0.85; k += 1
    rosnado(m, t_('P3 boca', 0.8), 2.4, db=-17)                                                    # respira grave enquanto tenta
    # P4: o braço dobra com força (três puxadas): um baque surdo em cada uma
    for k in range(3): m.por(grave(38, 0.35, 7.0), t_('P4 forca', 0.55 + k * 1.5), -12); m.por(X.PISO_TERRA[k], t_('P4 forca', 0.6 + k * 1.5), -22, lp=400)
    m.por(grave(30, 1.6, 1.2), t_('P5 pergunta', 0.2), -18)
    # P6: o grupo chega (pisadas distantes que se aproximam) e começa a comer
    t6 = t_('P6 grupo')
    for k in range(9): pisada_trex(m, t6 + 0.3 + k * 0.48, lerp := max(6, 22 - k * 1.8), (-1) ** k * 0.6, db=-4)
    come(m, t6, t_('P7 caos'), db=-15, sem=2)
    rugido(m, t6 + 2.6, db=-9, dur=1.6, raiva=0.6)
    # P7: disputa: estalos, rosnados dos lados, um rugido curto
    t7 = t_('P7 caos'); come(m, t7, t7 + 5.0, db=-13, per=0.4, sem=3)
    for k, (tt, pn) in enumerate([(0.55, -0.5), (1.6, 0.6), (2.45, 0.0), (3.6, -0.3), (4.5, 0.5)]): bote(m, tt + t7 - 0.25, db=-6); estalo(m, t7 + tt, db=-2 - (k % 2) * 3, espaco='vale')
    rosnado(m, t7 + 0.2, 4.6, db=-11, pan=-0.4); rosnado(m, t7 + 1.0, 3.8, db=-12, pan=0.5)
    rugido(m, t7 + 2.9, db=-5, dur=1.5, raiva=1.2)
    # P8: o braço comprido é mordido: estalo, puxão e um rugido de dor (sem nada sangrento)
    t8 = t_('P8 comprido'); come(m, t8, t8 + 2.4, db=-16, sem=4)
    bote(m, t8 + 2.65, db=-3); estalo(m, t8 + 3.2, db=1); m.por(X.PISO_TERRA[2], t8 + 3.25, -6, lp=900)
    rugido(m, t8 + 3.35, db=-2, dur=1.8, raiva=1.4)
    # P9: o braço volta ao tamanho real; a mordida passa e erra
    t9 = t_('P9 curto'); come(m, t9, t9 + 4.5, db=-16, sem=5)
    bote(m, t9 + 2.45, db=-4); estalo(m, t9 + 3.0, db=-2)
    rosnado(m, t9 + 3.1, 1.4, db=-12)
    # P10: igual ao P1, um pouco mais lento (laço)
    cena_mordida(t_('P10 laco'), esc=3.5 / 2.4)
    m.finalizar(saida)

if __name__ == '__main__':
    montar(sys.argv[1] if len(sys.argv) > 1 else 'sfx_bracos.wav')
