# Som do Short 2D "Engoliu um feijão 🌱 (ficção)": só gravações reais (BigSoundBank CC0 em bsb/, Wikimedia Commons PD/CC0 em commons/)
# e estalos curtos. Sem música: o dono narra por cima. Tempos iguais aos planos de cenas.js.
# uso: python3 sfx_feijao.py saida.wav
import os, sys
import numpy as np
AQUI = os.path.dirname(os.path.abspath(__file__))
SONS = os.path.join(AQUI, '..', '..', 'biblioteca3d', 'sons')
sys.path.insert(0, SONS); sys.path.insert(0, os.path.join(AQUI, '..', '..', 'trex_corrida'))
from mesa import Mesa, ler, SR
from sfx_trex import camada, golpes
CM = lambda f: os.path.join(SONS, 'commons', f)
TOTAL = 34.0
P = dict(P1=0.0, P2=3.0, P3=6.5, P4=10.5, P5=15.0, P6=19.0, P7=25.5, P8=30.5)
existe = lambda f: os.path.exists(CM(f))

def plim(m, t, db=-8):                 # o broto estoura: estalo de galhinho agudo + whoosh curtinho
    m.por('1300', t, db, vel=1.6, lp=9000); m.por('1800', t - 0.05, db - 8, vel=1.8, lp=7000)
def cresce(m, t, dur, db=-12, pan=0.0):  # a planta crescendo: galhos estalando em sequência, acelerados
    g = golpes('1301', 8, comp=0.3, sem=3)
    n = max(2, int(dur / 0.09))
    for k in range(n): m.por(g[k % 8], t + k * dur / n, db - (k % 3) * 2, vel=1.4, lp=6000, pan=pan + (k % 2 - .5) * .4)
def gulp(m, t, db=-4, vel=1.0):
    m.por(CM('Swallowing_gulp.ogg'), t, db, vel=vel, lp=8000)
def bocejo(m, t, db=-10, vel=1.0):
    if existe('Yawning_1.ogg'): m.por(camada(CM('Yawning_1.ogg'), 0, 2.4, vel, alvo=-20, lp=7000), t, db, ataque=0.05, soltura=0.3, espaco='sala')
def espelho(m, t0):                    # P1 / P8: banheiro de manhã, o broto aparece
    m.por(camada('1880', 30, 3.2, 1.0, alvo=-20, lp=4200), t0, -24, ataque=0.2, soltura=0.4)
    plim(m, t0 + 0.55); cresce(m, t0 + 0.55, 0.25, db=-14, pan=-0.3)
    m.por('1800', t0 + 1.0, -18, vel=0.7, lp=4000)                       # o susto (respiração presa)

def montar(saida):
    m = Mesa(TOTAL + 0.05)
    # P1 espelho
    espelho(m, P['P1'])
    # P2 ontem à noite: grilos lá fora, bocejo, a mão bate na mesa, a colher catapulta, o feijão voa, GULP
    m.por(camada('1880', 60, 3.6, 1.0, alvo=-20, lp=4200), P['P2'], -18, ataque=0.1, soltura=0.2)
    bocejo(m, P['P2'] + 0.5, db=-8)
    m.evento(P['P2'] + 1.58, [('2452', -6, {'lp': 3000}), ('0246', -10, {'atraso': 0.01, 'vel': 1.3})], espaco='sala')
    m.por('1796', P['P2'] + 1.6, -14, vel=1.5, lp=6000, pan=(0.3, 0.0))
    gulp(m, P['P2'] + 2.15, db=-2)
    m.por('1800', P['P2'] + 3.35, -16, vel=1.2, lp=6000)                   # o chicote de volta ao espelho
    # P3 puxa, estica, estala na cara, espirra
    for k in range(6): m.por('1301', P['P3'] + 0.9 + k * 0.16, -18, ini=2 + k * 0.4, dur=0.25, vel=0.6, lp=3000)   # o talo esticando (rangido grave)
    m.por('1300', P['P3'] + 1.9, -6, vel=1.2); m.por('1800', P['P3'] + 1.92, -10, vel=1.5, lp=7000)            # solta e volta
    m.evento(P['P3'] + 2.0, [('2453', -8, {'lp': 2500, 'vel': 1.4}), ('1408', -12, {'atraso': 0.01})], espaco='quarto')  # o tapa na testa
    if existe('Sneeze.ogg'): m.por(CM('Sneeze.ogg'), P['P3'] + 2.35, -4, lp=9000, espaco='quarto')
    m.por('1800', P['P3'] + 2.97, -10, vel=0.9, lp=7000); cresce(m, P['P3'] + 2.97, 0.3, db=-12)
    for k in range(6): m.por('2454', P['P3'] + 3.05 + k * 0.03, -24 - k, vel=2.0, lp=5000, pan=(k % 3 - 1) * 0.5)    # as folhas grudando no vidro
    # P4 rua: carros, assobio não (sem música); os ramos crescendo debaixo do chapéu; o pombo
    m.por(camada('1286', 10, 4.6, 1.0, alvo=-20, lp=4200), P['P4'], -16, ataque=0.15, soltura=0.2, pan=0.2)
    pe = golpes('2889', 8, comp=0.3, sem=1)
    for k in range(8): m.por(pe[k % 8], P['P4'] + 0.15 + k * 0.29, -16, lp=3500, pan=-0.3 + k * 0.06)
    cresce(m, P['P4'] + 0.4, 1.8, db=-15, pan=0.0)
    m.por('2893', P['P4'] + 2.1, -10, lp=6000, pan=(0.8, 0.0))              # o pombo chega batendo asas
    if existe('Dove_cooing.ogg'): m.por(camada(CM('Dove_cooing.ogg'), 0.5, 1.4, 1.0, alvo=-20, lp=6000), P['P4'] + 2.8, -10, ataque=0.05, soltura=0.2)
    for k in range(4): m.por('1300', P['P4'] + 2.85 + k * 0.22, -16, vel=1.8, lp=7000)       # as bicadas
    m.por('2891', P['P4'] + 3.55, -10, lp=6000, pan=(0.0, -0.9))            # vai embora com a vagem
    # P5 chuva → sol → FUUU
    m.por(camada('0740', 20, 2.2, 1.0, alvo=-20, lp=4200), P['P5'], -8, ataque=0.15, soltura=0.4)
    m.por('3113', P['P5'] + 0.4, -14, lp=2500)
    m.por('1800', P['P5'] + 1.95, -12, vel=0.6, lp=5000)
    m.evento(P['P5'] + 2.0, [('1301', -6, {'ini': 0.5, 'vel': 1.0}), ('1300', -4), ('2453', -8, {'lp': 1500, 'atraso': 0.02})], espaco='rua', grave_=True)
    cresce(m, P['P5'] + 2.0, 1.2, db=-10)
    if existe('VOXScrm_homem_jacare.wav'): pass                              # (o grito do Wilhelm não entra: o FUUU é visual)
    m.por('0155', P['P5'] + 3.0, -14, ini=3, dur=1.2, ataque=0.5, soltura=0.2, lp=4200)
    # P6 a subida: vento crescendo, galhos sem parar, passarinhos, avião passando (motor grave), dentro da nuvem abafa
    m.por(camada('0146', 10, 6.5, 1.0, alvo=-20, lp=4200), P['P6'], -10, ataque=0.4, soltura=0.6)
    cresce(m, P['P6'], 4.0, db=-14)
    m.por('2893', P['P6'] + 2.0, -12, lp=6000, pan=(-0.8, 0.8))
    m.passagem('0291', P['P6'] + 2.6, dur=1.6, de=1.0, para=-1.0, db=-10)
    m.abafar(P['P6'] + 4.3, P['P6'] + 5.0, lp=800)
    m.por('1796', P['P6'] + 4.95, -10, vel=0.8, lp=6000)                   # fura a nuvem
    # P7 em cima das nuvens: vento leve, bocejo, a vagem abre, o feijão cai, GULP
    m.por(camada('0155', 5, 5.0, 1.0, alvo=-20, lp=3000), P['P7'], -20, ataque=0.4, soltura=0.4)
    bocejo(m, P['P7'] + 1.0, db=-8, vel=0.92)
    plim(m, P['P7'] + 1.35, db=-10)
    m.por('1800', P['P7'] + 1.55, -16, vel=1.3, lp=7000)
    gulp(m, P['P7'] + 2.12, db=-2, vel=0.95)
    # P8 o laço
    espelho(m, P['P8'])
    m.finalizar(saida)

if __name__ == '__main__':
    montar(sys.argv[1] if len(sys.argv) > 1 else 'sfx_feijao.wav')
