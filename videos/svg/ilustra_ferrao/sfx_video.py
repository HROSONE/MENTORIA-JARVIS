# Som do vídeo "Abelha × vespa-mandarina": só gravações reais (BigSoundBank CC0; Wikimedia Commons se houver zumbido de abelha baixado).
# Zumbido: a gravação de inseto 0425 em velocidade normal (abelha) e lenta (vespa-mandarina, mais grave e mais grossa). Tempos = T de cenas_video.js.
# uso: python3 sfx_video.py saida.wav
import os, sys
AQUI = os.path.dirname(os.path.abspath(__file__)); SONS = os.path.join(AQUI, '..', '..', 'biblioteca3d', 'sons')
sys.path.insert(0, SONS); sys.path.insert(0, os.path.join(AQUI, '..', '..', 'trex_corrida'))
from mesa import Mesa
from sfx_trex import camada
TOTAL = 28.5
T = dict(pousaA=2.6, picaA=3.45, puxa=4.7, rasga=5.5, cai=7.7, lupaA=9.0, vespa=12.0, picas=[15.5, 16.9, 18.3, 19.7], lupaV=21.6, foi=24.8)
ZB = os.path.join(SONS, 'commons', 'Buzzing_bees.ogg')

def zumbido(m, t0, dur, db, vel=1.0, pan=0.0, fonte='0425', ini=2.0, lp=4200, hp=200):
    m.por(camada(fonte, ini, dur * vel, vel, alvo=-20, lp=lp, hp=hp), t0, db, ataque=0.15, soltura=0.25, pan=pan)

def montar(saida):
    m = Mesa(TOTAL + 0.05)
    m.por(camada('2749', 60, TOTAL, 1.0, alvo=-20, lp=3000), 0, -22, ataque=0.5, soltura=0.6)
    fb = ZB if os.path.exists(ZB) else '0425'; vb = 1.0 if fb == ZB else 1.25
    # a abelha chega, pousa
    zumbido(m, 0.2, 2.6, -12, vb, pan=(-0.8, 0.0), fonte=fb)
    # a picada: o "ai!" da pessoa e o estalinho
    m.por(camada('2361', 0, 0.6, 1.0, alvo=-20), T['picaA'] + 0.05, -6); m.por('1300', T['picaA'], -14, vel=1.8, lp=9000)
    # ela tenta voar, o abdome estica e rasga
    zumbido(m, T['puxa'], 0.85, -9, vb * 1.1, fonte=fb)
    m.por('1300', T['rasga'], -6, vel=1.2); m.por(camada('0576', 1.0, 0.25, 1.6, alvo=-20, lp=6000), T['rasga'], -12)
    # voo torto, cada vez mais fraco, e cai
    zumbido(m, T['rasga'] + 0.05, 1.5, -12, vb * 0.85, pan=(0.0, 0.4), fonte=fb)
    zumbido(m, T['rasga'] + 1.5, 0.6, -18, vb * 0.7, pan=0.4, fonte=fb)
    m.por('2454', T['cai'] - 0.05, -18, vel=2.0, lp=3000)
    m.por('1800', T['lupaA'], -16, vel=1.2, lp=6000)                                         # a lupa abre
    # a vespa-mandarina: zumbido grave e forte chegando pela direita
    m.passagem('0425', T['vespa'] + 0.2, dur=2.8, de=1.0, para=0.1, db=-6)
    zumbido(m, T['vespa'], 3.3, -8, 0.5, pan=(0.9, 0.1), lp=4000, hp=80)
    for k, tp in enumerate(T['picas']):
        m.por(camada('2361', 0, 0.6, [1.0, 0.94, 1.06, 0.9][k], alvo=-20), tp + 0.04, -5 - k * 0.5)
        m.por('1300', tp, -14, vel=1.6, lp=8000)
        zumbido(m, tp + 0.7, 0.7, -12, 0.5, lp=4000, hp=80)                                       # pula para o próximo lugar
    m.por('1800', T['lupaV'], -16, vel=1.2, lp=6000)
    zumbido(m, T['foi'], 2.4, -9, 0.5, pan=(0.1, 0.9), lp=4000, hp=80)                            # vai embora inteira
    m.finalizar(saida)

if __name__ == '__main__':
    montar(sys.argv[1] if len(sys.argv) > 1 else 'sfx_video.wav')
