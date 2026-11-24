# Som do Short 2D "O nariz do Carlos fugiu 👃 (ficção)": só gravações reais (BigSoundBank CC0 em bsb/, Wikimedia Commons PD/CC0 em commons/)
# e estalos curtos. Sem música: o dono narra por cima. Tempos iguais aos planos de cenas.js.
# uso: python3 sfx_nariz.py saida.wav
import os, sys
AQUI = os.path.dirname(os.path.abspath(__file__))
SONS = os.path.join(AQUI, '..', '..', 'biblioteca3d', 'sons')
sys.path.insert(0, SONS); sys.path.insert(0, os.path.join(AQUI, '..', '..', 'trex_corrida'))
from mesa import Mesa
from sfx_trex import camada, golpes
CM = lambda f: os.path.join(SONS, 'commons', f)
TOTAL = 35.0
P = dict(P1=0.0, P2=3.2, P3=6.5, P4=11.0, P5=16.5, P6=21.5, P7=27.0, P8=31.5)

def ah_atchim(m, t_ah, t_at, db=-2):
    m.por(camada('2195', 4.0, t_at - t_ah, 1.15, alvo=-20, lp=6000), t_ah, -12, ataque=0.25, soltura=0.05)   # puxando o ar
    m.por(CM('Sneeze.ogg'), t_at - 0.1, db, lp=9000, espaco='quarto')
def plim(m, t, db=-8):
    m.por('1300', t, db, vel=1.6, lp=9000); m.por('1800', t - 0.05, db - 8, vel=1.8, lp=7000)
def pezinhos(m, t0, t1, passo=0.11, db=-20, pan=0.0):      # as perninhas do nariz correndo (passos acelerados e agudos)
    g = golpes('2889', 8, comp=0.2, sem=2); k = 0; t = t0
    while t < t1: m.por(g[k % 8], t, db, vel=1.9, lp=7000, pan=pan); t += passo; k += 1
def passos(m, t0, t1, passo=0.3, db=-16, pan=0.0):
    g = golpes('2889', 8, comp=0.3, sem=1); k = 0; t = t0
    while t < t1: m.por(g[k % 8], t, db, lp=3500, pan=pan); t += passo; k += 1
def snif(m, t, db=-12):
    m.por(camada('2195', 10.0, 0.22, 1.7, alvo=-20, lp=7000), t, db, ataque=0.02, soltura=0.05)

def montar(saida):
    m = Mesa(TOTAL + 0.05)
    # leitos: rua lá fora (baixinho na cozinha), rua, feira
    m.por(camada('1286', 30, 6.5, 1.0, alvo=-20, lp=2500), 0, -26, ataque=0.3, soltura=0.3)
    m.por(camada('1286', 40, 4.5, 1.0, alvo=-20, lp=4200), P['P3'], -16, ataque=0.1, soltura=0.2)
    m.por(camada('1072', 60, 10.5, 1.0, alvo=-20, lp=4200), P['P4'], -22, ataque=0.3, soltura=0.3)
    m.por(camada('1286', 50, 13.5, 1.0, alvo=-20, lp=4200), P['P6'], -20, ataque=0.3, soltura=0.4)
    # P1 o espirro
    m.por('1796', 0.2, -20, vel=0.8, lp=5000)                                      # a pimenta no ar
    ah_atchim(m, 0.3, 1.2, db=0)
    plim(m, 1.2, db=-6); m.por('1800', 1.25, -8, vel=0.9, lp=7000, pan=(0.0, -0.6))  # o nariz sai voando
    # P2 cai, quica, perninhas, corre
    for k, (tt, db) in enumerate([(0.42, -6), (0.68, -12), (0.86, -18)]): m.por('2454', P['P2'] + tt, db, vel=1.6, lp=5000, espaco='quarto')
    plim(m, P['P2'] + 1.0, db=-10)
    pezinhos(m, P['P2'] + 2.25, P['P2'] + 3.1, passo=0.09, db=-16, pan=-0.3)
    passos(m, P['P2'] + 2.5, P['P2'] + 3.3, passo=0.28, db=-10, pan=0.4)
    # P3 a perseguição; o cachorro acorda (rosnadinho); o Carlos pula
    pezinhos(m, P['P3'], P['P3'] + 4.4, passo=0.1, db=-20, pan=0.3)
    passos(m, P['P3'], P['P3'] + 4.4, passo=0.23, db=-13, pan=-0.3)
    m.por(camada('2106', 2.0, 0.6, 1.3, alvo=-20, lp=3000), P['P3'] + 1.65, -16, ataque=0.05, soltura=0.15)
    m.por('1800', P['P3'] + 1.95, -12, vel=1.0, lp=6000); m.por('2453', P['P3'] + 2.45, -10, lp=2500)
    # P4 o mergulho no monte e as batatas na cara
    m.por('1800', P['P4'] + 0.05, -14, vel=1.3, lp=7000)
    for k in range(4): m.por('2453', P['P4'] + 0.5 + k * 0.05, -12 - 3 * k, vel=1.7, lp=3500)
    passos(m, P['P4'] + 0.5, P['P4'] + 1.1, passo=0.25, db=-14)
    for t0 in [1.35, 2.3, 3.25, 4.2]:
        m.por('2453', P['P4'] + t0 + 0.12, -10, vel=1.5, lp=3000)                    # a batata bate na cara
        m.por('1796', P['P4'] + t0 + 0.78, -14, vel=1.4, lp=6000)                  # joga fora
    plim(m, P['P4'] + 3.45, db=-10)                                                # a batata com broto
    # P5 o cheiro; snif snif; tremedeira
    m.por('1800', P['P5'] + 0.1, -22, vel=0.5, lp=3000); plim(m, P['P5'] + 1.5, db=-12)
    for k in range(6): snif(m, P['P5'] + 3.0 + k * 0.28, db=-10 - (k % 2) * 3)
    for k in range(8): m.por('2453', P['P5'] + 3.8 + k * 0.07, -22, vel=2.0, lp=3000)
    # P6 a isca: o nariz vem correndo, pula, PLOFT
    pezinhos(m, P['P6'] + 0.9, P['P6'] + 2.6, passo=0.085, db=-14, pan=-0.4)
    m.por('1800', P['P6'] + 2.6, -10, vel=1.2, lp=7000)
    m.evento(P['P6'] + 3.15, [('1520', -6, {'vel': 1.3}), ('2452', -8, {'lp': 2500, 'atraso': 0.01})], espaco='rua')
    # P7 o conserto: torce, plim, cheira o pão
    for k in range(3): m.por('1300', P['P7'] + 0.8 + k * 0.25, -16, vel=0.9, lp=4000)
    plim(m, P['P7'] + 1.6, db=-6)
    for k in range(3): snif(m, P['P7'] + 2.5 + k * 0.3, db=-12)
    # P8 o pimenteiro no vento, ah… ATCHIM, as orelhas voando
    m.passagem('1796', P['P8'] + 0.1, dur=1.2, de=-1.0, para=1.0, db=-12)
    ah_atchim(m, P['P8'] + 1.0, P['P8'] + 1.9, db=0)
    m.por('2891', P['P8'] + 1.95, -8, lp=7000)                                       # as orelhas batendo feito asas
    m.finalizar(saida)

if __name__ == '__main__':
    montar(sys.argv[1] if len(sys.argv) > 1 else 'sfx_nariz.wav')
