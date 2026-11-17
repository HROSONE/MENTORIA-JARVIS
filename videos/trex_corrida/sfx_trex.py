# Som do Short "Você fugiria de um T. rex?": rugido em camadas feito de animais reais (não existe gravação de T. rex; o do cinema também é
# montado assim), grito e respiração do trilheiro, pisadas gigantes, passos, galhos, mordida, mastigar, volta no tempo e a selva. Sem música.
# Gravações: BigSoundBank (CC0) em biblioteca3d/sons/bsb e domínio público do Wikimedia Commons em biblioteca3d/sons/commons (ver LISTA.md).
# uso: python3 sfx_trex.py saida.wav            (trilha inteira)      python3 sfx_trex.py teste.wav --so rugido   (só um rugido, para conferir)
import os, sys, json
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'biblioteca3d', 'sons'))
from mesa import Mesa, ler, grave, filtro, SR

COM = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'biblioteca3d', 'sons', 'commons')
JACARE1, JACARE2 = os.path.join(COM, '27alligator2bellow.ogg'), os.path.join(COM, 'Alligatorbellow1.ogg')
URSO = os.path.join(COM, 'Yellowstone_sound_library_-_Grizzly_Bear_vocalizations_-_001.mp3')

def camada(fonte, ini=0.0, dur=None, vel=1.0, alvo=-20.0, lp=None, hp=None):
    """lê um trecho e leva o nível médio (só a parte com som) a `alvo` dB: assim o ganho de cada camada vale o que diz"""
    a = ler(fonte, ini, dur, vel); a = filtro(a, lp, hp) if (lp or hp) else a
    e = np.sqrt((a ** 2).mean(1)); viva = e > e.max() * 0.08; rms = np.sqrt((a[viva] ** 2).mean()) if viva.any() else 1e-6
    return (a * (10 ** (alvo / 20) / max(rms, 1e-9))).astype(np.float32)

def rugido(m, t, db=0.0, dur=2.6, raiva=1.0, espaco='vale'):
    """rugido do T. rex em t (s): ataque (gato grave), corpo (jacaré x2 + veado), rouquidão (rosnado), sub-grave e cauda (urso)"""
    k = dur / 2.6
    m.por(camada('1882', vel=0.42, hp=60), t, db - 4, ataque=0.0, soltura=0.4, espaco=espaco)                                              # estalo de abertura
    m.por(camada(JACARE1, 0.9, 2.6 * k * 0.6, 0.6, hp=35), t + 0.05, db + 0, ataque=0.08, soltura=0.7, espaco=espaco)                   # corpo grave
    m.por(camada(JACARE2, 9.1, 2.4 * k * 0.6, 0.55, hp=35), t + 0.12, db - 3, ataque=0.15, soltura=0.8, espaco=espaco, pan=-0.15)
    m.por(camada('3616', 13.0, 2.2 * k * 0.62, 0.62, lp=3500), t + 0.08, db - 4, ataque=0.1, soltura=0.6, espaco=espaco, pan=0.15)       # bramido: o "berro"
    m.por(camada('2107', 4.7, 2.0 * k * 0.55, 0.55, lp=4500), t + 0.10, db - 10 + 4 * raiva, ataque=0.12, soltura=0.5, espaco=espaco)    # rouquidão
    m.por(grave(28, 1.8 * k, 1.6), t, db - 10)                                                                                              # peito vibrando
    m.por(camada(URSO, 22.6, 1.6, 0.7, hp=50), t + 2.0 * k, db - 4, ataque=0.2, soltura=0.6, espaco=espaco)                              # rosnado no fim

GRITO_VOX = os.path.join(COM, 'VOXScrm_homem_jacare.wav')

def golpes(fonte, n=8, ini=0.0, dur=None, comp=0.35, sem=0):
    """corta os n golpes mais fortes de uma gravação de passos/estalos (cada um com `comp` s, começando um pouco antes do pico)"""
    a = ler(fonte, ini, dur); m = np.abs(a).mean(1); w = int(0.01 * SR)
    e = np.convolve(m, np.ones(w) / w, 'same'); picos = []
    for k in np.argsort(e)[::-1]:
        if len(picos) >= n: break
        if all(abs(k - q) > 0.25 * SR for q in picos) and k > 0.02 * SR and k + comp * SR < len(a): picos.append(k)
    rng = np.random.default_rng(sem); rng.shuffle(picos)
    return [a[int(k - 0.02 * SR): int(k + comp * SR)] for k in picos]

# tomadas de grito da sessão VOX (início, duração em s), medidas por energia/tom: todas de homem adulto, 377-686 Hz
TOMADAS = {'a': (34.50, 1.05), 'b': (27.20, 1.10), 'c': (13.80, 0.95), 'd': (16.60, 0.85), 'e': (22.65, 0.70), 'f': (30.70, 1.15)}
def grito(m, t, db=0.0, dur=1.0, espaco='rua', tomadas=('a', 'b'), vel=0.96, corta=None):
    """grito de homem adulto: DUAS tomadas diferentes da sessão original (CC0) somadas (a principal e outra 8 dB abaixo), um pouco mais graves;
    assim não soa como a tomada famosa. Sem a sessão baixada, usa o uivo de menino (BSB 1664) a 0,75x. corta: instante em que o grito é cortado seco"""
    fim = corta if corta else t + dur
    if os.path.exists(GRITO_VOX):
        for k, (q, g) in enumerate(zip(tomadas, (0, -8))):
            i0, d = TOMADAS[q]; m.por(camada(GRITO_VOX, i0, d, vel + 0.03 * k, alvo=-18, hp=110), t + 0.03 * k, db + g, ate=fim, ataque=0.015, soltura=0.02 if corta else 0.2, espaco=espaco)
    else: m.por(camada('1664', 0.05, 2.4, 0.75, alvo=-18, hp=140), t, db, ate=fim, ataque=0.02, soltura=0.25, espaco=espaco)
    m.por(camada('2361', 0, 0.35, 1.0, alvo=-20), t - 0.08, db - 7, espaco=espaco)                   # o soluço que puxa o ar antes

def pisada_trex(m, t, dist, pan, db=0.0, espaco='vale', mato=False):
    """pé de 8 t: impacto grave (sub), estrondo de terra, rangido de folhas/galhos se estiver na mata; cai com a distância"""
    g = db - 20 * np.log10(max(dist, 4) / 8)
    m.por(grave(30, 0.55, 5.0), t, g - 4, pan=pan * 0.5)
    m.por(camada('1023', 0.0, 1.2, 0.55, lp=500, alvo=-20), t, g - 6, pan=pan, espaco=espaco)
    m.por(PISO_TERRA[int(t * 7) % len(PISO_TERRA)], t, g - 10, pan=pan, lp=2500)
    if mato: m.por(GALHOS[int(t * 13) % len(GALHOS)], t + 0.03, g - 9, pan=pan, espaco=espaco)

def passo(m, t, dist, pan, db=0.0, chao='estrada'):
    g = db - 20 * np.log10(max(dist, 1.5) / 3)
    s = (PASSO_ESTRADA if chao == 'estrada' else PASSO_FOLHA)[int(t * 31) % 6]
    m.por(s, t, g, pan=pan, hp=90)

def montar_trilha(saida, eventos):
    global PISO_TERRA, GALHOS, PASSO_ESTRADA, PASSO_FOLHA
    PISO_TERRA = [x for x in golpes('0495', 6, comp=0.5)]
    GALHOS = golpes('1301', 8, comp=0.4, sem=2)
    PASSO_ESTRADA = golpes('1837', 3, comp=0.25) + golpes('0495', 3, comp=0.25, sem=4)
    PASSO_FOLHA = golpes('0137', 6, comp=0.3, sem=1)
    E = json.load(open(eventos)); P = {p['nome']: p for p in E['planos']}; total = max(p['t1'] for p in E['planos'])
    # filtro físico: o tremor da captura cria fundos de passo falsos; no máximo um contato por pé a cada 0,25 s (gente) e 0,6 s (T. rex)
    ult, bons = {}, []
    for e in sorted(E['ev'], key=lambda e: e['t']):
        k = (e['quem'], e['lado']); g = 0.6 if e['quem'] == 'T' else 0.25
        if e['t'] - ult.get(k, -9) >= g: bons.append(e); ult[k] = e['t']
    E['ev'] = bons
    m = Mesa(total + 0.05); E2 = E.get('marcas', {})
    t_ = lambda nome, d=0.0: P[nome]['t0'] + d
    # --- leito: mata (dois trechos longos, um de cada lado), pássaros somem depois do rugido
    m.por(camada('2749', 20, None, 1.0, alvo=-20), 0, -11, ate=total, laco=True, pan=-0.2, ataque=0.3, soltura=0.3)
    m.por(camada('0100', 3, None, 1.0, alvo=-20), 0, -14, ate=total, laco=True, pan=0.25, ataque=0.3, soltura=0.3)
    # --- passos e pisadas, lidos da animação
    for e in E['ev']:
        pl = e['plano']; mato = pl in ('S7 mata', 'S8 fenda') or pl == 'S11 esconde'
        esp = 'corredor' if pl == 'S8 fenda' else 'vale'
        if e['quem'] == 'T': pisada_trex(m, e['t'], e['dist'], e['pan'], db=-1 if e['visivel'] else -5, espaco=esp, mato=mato)
        else: passo(m, e['t'], e['dist'], e['pan'], db=-4, chao='folha' if mato else 'estrada')
    # --- tentativa 1
    rugido(m, 0.02, db=0, dur=1.9, raiva=1.0)
    for k, (tt, pn) in enumerate([(0.35, -0.6), (0.55, 0.5), (0.8, -0.2)]): m.por('2891' if k % 2 == 0 else '2893', tt, -14, pan=(pn, pn * 1.6), espaco='vale')
    m.por('1762', 1.0, -24, hp=900, espaco='vale', pan=0.7)                                           # pássaro de alarme ao longe
    grito(m, t_('S2 grito', 0.15), db=1, dur=0.95)
    m.por(camada('1103', 2.0, 9.0, 1.08, alvo=-20), 3.0, -8, ate=10.2, ataque=0.4, soltura=0.1)      # ofego dele (cresce no close)
    m.por(camada('1103', 11.0, 1.8, 1.15, alvo=-20), t_('S4 perto'), -4, ate=t_('S5 mordida', 0.85))
    grito(m, t_('S5 mordida', 0.18), db=2, tomadas=('c', 'd'), vel=0.94, corta=t_('S6 mastiga') - 0.03)     # grita quando a boca desce: cortado pelo fechar
    tf = t_('S6 mastiga')                                                                              # a boca fecha no corte
    m.evento(tf - 0.04, [('1408', -2), ('1300', -6, {'atraso': 0.01}), ('2453', -8, {'atraso': 0.02, 'lp': 1500})], grave_=True, espaco='vale')
    for k in range(6):                                                                                 # mastigar (abafado: dentro da boca)
        tm = tf + 0.18 + k * 0.42; m.por(golpes('0596', 6, comp=0.3, sem=k)[k], tm, -12, lp=1800); m.por(PISO_TERRA[k % 6], tm + 0.02, -16, lp=900)
    m.por(camada('2106', 2.0, 2.4, 0.6, lp=900, alvo=-20), tf + 0.2, -12, espaco='vale')            # rosnado de satisfação
    m.por('2454', tf + 0.9 + 0.79, -9, ate=tf + 0.9 + 1.2, lp=4000)                                  # o tênis bate na estrada
    m.por('1837', tf + 0.9 + 1.05, -18, lp=5000)
    # --- volta no tempo 1: o próprio som de trás para a frente, acelerado, e um sopro
    def rebobinar(t0, de, ate_):
        seg = m.mix[int(de * SR):int(ate_ * SR)][::-1].copy(); n = int(1.0 * SR)
        seg = seg[np.linspace(0, len(seg) - 1, n).astype(int)]; seg = filtro(seg, lp=3500, hp=200)
        m.mix[int(t0 * SR):int(t0 * SR) + n] *= 0.25
        m.por(seg, t0, -4, ataque=0.05, soltura=0.15)
        m.por(ler('1796', 0, None, 0.7)[::-1].copy(), t0 - 0.1, -8); m.por('1800', t0 + 0.75, -10)
    rebobinar(t_('R1 volta no tempo'), 2.4, t_('R1 volta no tempo'))
    # --- tentativa 2: na mata
    ts8 = t_('S8 fenda'); eT = [e for e in E['ev'] if e['plano'] == 'S8 fenda' and e['quem'] == 'H']
    m.por(camada('1103', 4.0, 6.0, 1.1, alvo=-20), t_('S7 mata', 0.3), -14, ate=ts8 + 3.0, ataque=0.3)
    for k, tt in enumerate([0.8, 1.7, 2.6, 3.4]): m.por(GALHOS[k], t_('S7 mata', tt), -10, pan=(-1) ** k * 0.4, espaco='vale')   # galhos estalando atrás
    m.por('2452', E2.get('fenda_chega', ts8 + 0.15), -10, espaco='corredor')                                                    # ele bate na pedra e se agacha
    m.por(camada('1103', 13.0, 3.0, 1.0, alvo=-20), ts8 + 0.3, -9, ate=ts8 + 3.0, espaco='corredor')
    tsnap = E2.get('fenda_estalo', ts8 + 1.35)
    grito(m, tsnap - 0.05, db=-7, tomadas=('e', 'f'), vel=1.0, dur=0.55, espaco='corredor')                # susto curto, de dentro da fenda
    m.evento(tsnap, [('1408', -3), ('1300', -6), ('1837', -10, {'atraso': 0.02})], grave_=True, espaco='corredor')   # dentes batendo na entrada
    rugido(m, tsnap + 0.08, db=0, dur=2.0, raiva=1.2, espaco='corredor')
    rebobinar(t_('R2 volta no tempo'), t_('S7 mata'), t_('R2 volta no tempo'))
    # --- tentativa 3: o maratonista
    m.por(camada('2195', 10.0, 12.0, 1.25, alvo=-20), t_('S9 maratonista'), -15, ate=t_('S11 esconde', 0.9), ataque=0.3)   # respiração ritmada
    m.por('2254', t_('S9r relogio', 0.15), -12); m.por('2254', t_('S9r relogio', 0.45), -14)          # bipe do relógio
    ts11 = t_('S11 esconde'); tar = E2.get('esconde_rugido', ts11 + 1.4)
    m.por('2452', E2.get('esconde_agacha', ts11 + 0.9), -11)
    m.por(camada('2195', 30.0, 4.0, 1.0, alvo=-20), ts11 + 1.0, -11, ate=t_('S12 laco'))
    rugido(m, tar, db=-1, dur=1.8, raiva=1.0, espaco='vale')
    # --- S12: boca fechada, o rosnado cresce até o rugido do quadro 0 (laço)
    m.por(camada('2106', 6.0, 3.0, 0.5, lp=700, alvo=-20), t_('S12 laco'), -10, ate=total, ataque=0.6, soltura=0.02)
    m.por(grave(26, 1.5, 0.6), t_('S12 laco'), -14)
    m.finalizar(saida)

if __name__ == '__main__':
    import json

    saida = sys.argv[1] if len(sys.argv) > 1 else 'sfx_trex.wav'
    if '--so' in sys.argv and sys.argv[sys.argv.index('--so') + 1] == 'rugido':
        m = Mesa(4.5); rugido(m, 0.3); m.finalizar(saida); sys.exit(0)
    else: montar_trilha(saida, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'eventos.json'))
