# Som da animação "Morteiro 60 mm": só gravações reais do BigSoundBank (CC0) + o reforço grave curto do disparo. Tempos iguais a js/planos.js (T).
# uso: python3 sfx_morteiro.py saida.wav
import os, sys
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, '..', 'biblioteca3d', 'sons')); sys.path.insert(0, os.path.join(AQUI, '..', 'trex_corrida'))
from mesa import Mesa, ler
from sfx_trex import camada, golpes
TOTAL = 15.5
T = dict(gira=(0.2, 4.0), abre=(2.5, 4.4), tampaPula=4.85, desliza=(5.0, 5.9), sobe=(5.9, 6.95), voo=(6.95, 9.4), cai=(9.9, 10.3), tiro=11.2)

def montar(saida):
    m = Mesa(TOTAL + 0.05)
    m.por(camada('0146', 20, TOTAL, 1.0, alvo=-20, lp=3000), 0, -22, ataque=0.5, soltura=0.5)                 # vento baixo no campo
    m.por(camada('2749', 40, TOTAL, 1.0, alvo=-20, lp=4200), 0, -24, ataque=0.5, soltura=0.5, pan=0.3)       # pássaros longe
    # a caixa gira (madeira raspando de leve) e a tampa abre rangendo
    m.por('1796', 0.3, -20, vel=0.45, lp=3000)
    for k in range(5): m.por('1301', 0.6 + k * 0.7, -24, ini=1 + k * 0.5, dur=0.3, vel=0.6, lp=2500)
    m.por(camada('0616', 10, 1.9, 0.8, alvo=-20, lp=4000), T['abre'][0], -12, ataque=0.1, soltura=0.3)
    m.por('2453', T['abre'][1] - 0.05, -16, lp=1500)                                                            # a tampa encosta
    # a tampinha do tubo pula e cai
    m.por('1300', T['tampaPula'], -8, vel=1.5, lp=9000); m.por('1800', T['tampaPula'] - 0.03, -16, vel=1.8, lp=7000)
    m.por('2454', T['tampaPula'] + 0.6, -14, vel=1.5, lp=4000)
    # a granada desliza para fora do tubo de fibra e sobe sozinha
    m.por(camada('0576', 1.0, 0.9, 1.3, alvo=-20, lp=5000), T['desliza'][0], -16, ataque=0.05, soltura=0.2)
    a = ler('1800', 0, None, 0.55); m.por(a[::-1].copy(), T['sobe'][0], -14, lp=4000)
    # o voo até o morteiro (passa da esquerda para a direita)
    m.passagem('1796', T['voo'][0] + 0.9, dur=1.6, de=-0.8, para=0.8, db=-10)
    # desce pelo tubo e bate no fundo (metal)
    m.por('1800', T['cai'][0], -12, vel=1.3, lp=6000)
    m.evento(T['cai'][1] + 0.04, [('0246', -6, {'vel': 0.7}), ('2452', -10, {'lp': 1500, 'atraso': 0.01})], espaco='rua')
    m.silencio(T['tiro'] - 0.45, T['tiro'] - 0.02, resto=0.25)
    # o disparo
    m.evento(T['tiro'], [('1808', 0), ('1023', -2, {'vel': 0.8}), ('1807', -6, {'atraso': 0.005})], espaco='vale', grave_=True)
    m.por('1796', T['tiro'] + 0.05, -10, vel=0.75, lp=6000)                                                       # a granada sai assobiando
    m.por(camada('0155', 2, 3.5, 1.0, alvo=-20, lp=4000), T['tiro'] + 0.4, -18, ataque=0.3, soltura=1.0)        # o eco e o ar depois
    m.finalizar(saida)

if __name__ == '__main__':
    montar(sys.argv[1] if len(sys.argv) > 1 else 'sfx_morteiro.wav')
