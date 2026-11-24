# Som do Short "Cem filhotes, nenhuma mãe": só gravações reais livres (BigSoundBank em biblioteca3d/sons/bsb e domínio público do Wikimedia Commons em
# biblioteca3d/sons/commons) mixadas pela mesa de som, mais um "plop" úmido curto e sintetizado por ovo (uma síntese por ação visível, nada contínuo).
# Sem música e sem cama sintetizada: o leito da praia é gravação real, baixa e com os agudos cortados; cada lugar tem o seu (praia, debaixo da areia, debaixo d'água).
# O dono narra por cima: tudo fica baixo (média -23 dB) e os picos são só as ações (areia, ovos, onda, caranguejo, ave).
# uso: python3 sfx_tartarugas.py [saida.wav]      (depois: ffmpeg -i saida.wav -b:a 160k tartarugas_sfx.mp3)
import json, os, sys
import numpy as np
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(AQUI, '..', '..', 'biblioteca3d', 'sons'))
from mesa import Mesa, ler, grave, filtro, SR
COM = os.path.join(AQUI, '..', '..', 'biblioteca3d', 'sons', 'commons')
SURF, MARE, GAIVOTA1, GAIVOTA2, SPLASH = [os.path.join(COM, f) for f in ('On_a_pebble_beach.ogg', 'Water_over_rocks_as_tide_recedes.ogg', 'Gull_1.ogg', 'Gull_2.ogg', 'Bathtub_water_splashes.ogg')]
R = np.random.default_rng(23)
CICLO = 0.9                                              # o ciclo de raspar da pata (igual ao _cenas.js)

def tom(a, vel):
    """muda tom e tempo juntos, como fita (vel > 1: mais agudo e mais curto)"""
    n = max(2, int(len(a) / vel)); x = np.linspace(0, len(a) - 1, n)
    return np.stack([np.interp(x, np.arange(len(a)), a[:, c]) for c in (0, 1)], 1).astype(np.float32)

def trecho(a, ini, dur):
    ini = min(ini, max(0.0, len(a) / SR - dur)); return a[int(ini * SR):int((ini + dur) * SR)].copy()

def plop(f0=220.0, dur=0.07):
    """um ovo caindo na pilha: gota úmida curta (queda rápida de tom), só o estalo da ação"""
    t = np.arange(int(dur * SR)) / SR; f = f0 * (1 + 1.6 * np.exp(-t * 90)); s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 55)
    s += 0.25 * R.standard_normal(len(t)) * np.exp(-t * 400)
    return np.stack([s, s], 1).astype(np.float32)

def montar(saida):
    N = json.load(open(os.path.join(AQUI, 'narr.json'))); total = N['total']
    m = Mesa(total + 0.05)
    lama, terra, graveto, graveto2 = ler('0495'), ler('1837'), ler('1300'), ler('1299')

    def areia(t, db, n, dur, vel=(1.3, 2.0), lp=3500, hp=300, pan=.6, comp=(.12, .3)):
        """n raspadas curtas espalhadas em dur segundos (pés de muitos filhotes, areia caindo): trechos diferentes da mesma gravação, nunca em laço"""
        for k in range(n):
            ini = R.random() * (len(lama) / SR - .5); d = comp[0] + R.random() * (comp[1] - comp[0]); a = tom(trecho(lama, ini, d), vel[0] + R.random() * (vel[1] - vel[0]))
            m.por(a, t + R.random() * dur, db - R.random() * 6, pan=(R.random() * 2 - 1) * pan, lp=lp, hp=hp, ataque=.004, soltura=.05)

    def raspada(t, db=-6, espaco='vale', forte=1.0):
        """a mãe raspando e jogando areia: corpo (terra, lento e grave) + grãos + um baque surdo"""
        m.evento(t, [(tom(terra, .72), db, {'lp': 2400}), (tom(trecho(lama, 1.0, .5), .8), db - 5, {'lp': 1300, 'atraso': .03}), (tom(trecho(lama, 4.0, .35), 1.4), db - 11, {'hp': 700, 'atraso': .12})], espaco=espaco)
        m.por(grave(46, .35, 8.0), t, db - 12 - (1 - forte) * 6)

    def sopro(t, db=-18, vel=.5, lp=700):
        """a respiração pesada da tartaruga: trecho de respiração real, lento e abafado"""
        m.por('2195', t, db, ini=10 + R.random() * 40, dur=1.4, vel=vel, lp=lp, hp=60, ataque=.25, soltura=.5)

    # ----------------------------------------------------------------- leitos de ambiente (gravação real, baixo, agudos cortados), um por lugar
    def leito(t0, t1, alvo, lp, fonte=SURF, ini=2.0, vel=1.0, hp=70):
        """leito de ambiente: gravação real, filtrada e levada ao nível médio `alvo` (dB), para o 'ar' da cena não oscilar de um plano para o outro"""
        a = filtro(ler(fonte, ini, min(26.0, t1 - t0 + 2.0), vel), lp=lp, hp=hp); e = np.sqrt((a ** 2).mean())
        a = (a * (10 ** (alvo / 20) / max(e, 1e-9))).astype(np.float32)
        m.por(a, t0, 0.0, ate=t1, laco=True, ataque=.4, soltura=.4)
    # (o mar do Commons "On a pebble beach" tem ~-10 dB nos trechos fortes; "Water over rocks" é bem mais baixo e vira só efeito de onda)
    leito(0.0, 8.3, -33, 2600, SURF, ini=17); leito(8.2, 9.95, -34, 2200, SURF, ini=22)         # praia: o mar ao longe
    leito(9.9, 11.95, -36, 380, SURF, ini=24)                                                     # debaixo da areia: só o mar abafado
    leito(11.9, 14.0, -34, 2800, SURF, ini=25); leito(14.0, 16.2, -32, 3000, SURF, ini=27)       # a caminhada: o mar vai chegando
    leito(16.1, 19.95, -33, 3000, SURF, ini=19)
    leito(21.3, 23.35, -35, 420, SURF, ini=26)                                                    # debaixo d'água: tudo abafado
    leito(23.3, 26.45, -35, 1500, SURF, ini=20); leito(26.4, total, -33, 2600, SURF, ini=29)
    m.por('0425', 0.0, -23, ini=2, ate=9.95, laco=True, lp=5200, hp=900, ataque=.5, soltura=.5)  # insetos da duna (só em terra)
    m.por('0425', 11.9, -23, ini=1, ate=21.3, laco=True, lp=5200, hp=900, ataque=.5, soltura=.5)
    m.por('0425', 26.4, -23, ini=4, ate=total, laco=True, lp=5200, hp=900, ataque=.5, soltura=.5)

    # ----------------------------------------------------------------- 1. a areia ferve (0–2,5) e 2. ele procura a mãe (2,5–4,1)
    m.evento(0.0, [(tom(terra, .85), -4, {'lp': 3200}), (tom(trecho(lama, 2.0, .4), 1.1), -7, {'atraso': .02})], espaco='vale')
    areia(0.0, -11, 34, 2.6)
    for tt in (.15, .45, .75, 1.1, 1.6): m.por(tom(terra, 1.0 + .3 * R.random()), tt, -10 - 2 * R.random(), lp=3000, pan=(R.random() * 2 - 1) * .5)
    m.por(tom(trecho(lama, 3.2, .2), 2.6), 3.35, -26, lp=3000, hp=900)                                # um piscar: só uma batidinha de areia
    # volta no tempo (3,9–4,3): sopro de som real tocado ao contrário e acelerado
    m.riser('1796', ate=4.3, dur=.95, db=-5, vel=1.5); m.por(tom(ler('1800'), 1.2)[::-1].copy(), 3.85, -9, lp=4500, soltura=.1)

    # ----------------------------------------------------------------- 3. a mãe cava (4,1–5,5), 4. os ovos (5,5–6,6), 5. cobre e vai (6,6–8,3)
    for n in range(4, 6): raspada(CICLO * (n + .42), db=-6)
    sopro(4.3, -20); sopro(5.6, -21)
    n_ov = 26
    for i in range(n_ov):                                                                         # um plop por grupo de ovos (reunidos para não virar chuva)
        tt = 5.62 + i / n_ov * .8 + R.random() * .02
        m.por(plop(170 + R.random() * 160, .06 + .03 * R.random()), tt, -19 + 5 * R.random(), pan=-.3 + .1 * R.random(), lp=2600, espaco='quarto')
    m.por(tom(ler('1520', 0, 1.4), 1.8), 5.7, -27, lp=2400, ataque=.02)
    for tt in (6.78, 7.1, 7.4): raspada(tt, db=-7, forte=.8)                                     # cobre e espalha areia
    m.por(tom(trecho(lama, 0, 1.4), .55), 7.55, -10, lp=1500, ataque=.06, soltura=.3)
    for k, tt in enumerate((7.85, 8.15)): m.por(tom(trecho(lama, 4.5 + k, .5), .6), tt, -12, lp=1700, pan=(-.1, .1), ataque=.02, soltura=.15)   # ela se arrasta para o mar
    sopro(7.0, -21)

    # ----------------------------------------------------------------- 6. dois meses (8,3–9,9): o tempo corre; 7. quebram a casca e cavam juntos (9,9–11,9)
    m.por(tom(ler('1796'), .5), 8.25, -14, lp=2600, ataque=.1, soltura=.5); m.por(tom(ler('1800'), .6)[::-1].copy(), 8.9, -16, lp=2400, soltura=.2)
    m.por(tom(trecho(graveto, .2, .5), 1.7), 9.72, -17, hp=500, lp=4000)                         # estalo de areia no dia 60
    for k in range(26):                                                                            # cascas rachando: estalos finos e baixinhos (1408/1409 mais agudos)
        tt = 9.95 + .05 + k * .065 + R.random() * .03; m.por(tom(ler('1408' if k % 2 else '1409'), 1.7 + .8 * R.random()), tt, -17 + 4 * R.random(), hp=900, lp=5200, pan=(R.random() * 2 - 1) * .5, ataque=.002, soltura=.06)
    areia(10.0, -16, 42, 1.8, vel=(1.1, 1.9), lp=1100, hp=200, pan=.5)                           # arranhões abafados lá embaixo: um ajudando o outro
    m.evento(11.62, [(tom(terra, .8), -6, {'lp': 2800}), (tom(trecho(lama, 6.0, .6), .9), -9, {'atraso': .03, 'lp': 2400})], espaco='vale'); areia(11.62, -14, 22, .9)

    # ----------------------------------------------------------------- 8. a bússola (11,9–16,1): dezenas de pezinhos batendo na areia e o mar chegando
    areia(11.95, -14, 36, 2.2, vel=(1.5, 2.3), lp=3800, hp=450, comp=(.08, .2))
    areia(14.1, -13, 56, 2.0, vel=(1.6, 2.4), lp=3800, hp=450, comp=(.08, .2))
    m.por(tom(ler('1796'), .4), 12.3, -16, lp=1800, ataque=.2, soltura=.6, pan=(-.4, .4))        # a câmera sobe até a lua

    # ----------------------------------------------------------------- 9. a luz errada, o caranguejo e a ave (16,1–19,9)
    m.por('0026', 16.5, -12, hp=300, lp=6500, espaco='rua'); m.por(grave(60, .18, 14), 16.5, -26)  # a lâmpada acende
    areia(16.2, -16, 40, 3.5, vel=(1.5, 2.3), lp=3800, hp=450, comp=(.08, .2))
    for k in range(15):                                                                            # o caranguejo: estalinhos de graveto e correria
        tt = 17.95 + k * .065 + R.random() * .02; m.por(tom(trecho(graveto2 if k % 3 else graveto, R.random() * 3, .08), 1.6 + R.random()), tt, -20 + 4 * R.random(), hp=1800, lp=7000, pan=(.1, .4), ataque=.002, soltura=.03)
    areia(18.0, -22, 14, 1.0, vel=(2.0, 2.8), lp=4200, hp=900, comp=(.06, .12), pan=.4)
    m.por(tom(trecho(graveto, 0, .3), 1.2), 18.95, -14, hp=900, lp=6000, pan=.35)                  # a garra fecha
    m.passagem('2891', 19.35, dur=.9, de=1.0, para=-1.0, db=-9, espaco='vale')                    # a sombra da ave passa, da direita para a esquerda
    m.por(GAIVOTA2, 19.2, -13, ini=.4, dur=1.4, hp=600, lp=7000, pan=(.8, -.6), ataque=.03, soltura=.4, espaco='vale')

    # ----------------------------------------------------------------- 10. a água: onda (19,9–21,3), debaixo d'água (21,35–23,3)
    m.por(MARE, 19.95, -1, ini=3.5, dur=1.8, lp=3500, hp=120, ataque=.4, soltura=.5)
    m.por(tom(ler('1520', 0, 1.6), 1.0), 20.5, -13, lp=5200, espaco='vale'); areia(20.2, -24, 10, 1.0, vel=(1.8, 2.5), lp=3000)
    for k in range(7): m.por(tom(ler('1519', 0, .8), 1.6 + R.random() * .8), 20.45 + k * .13, -23, lp=5000, pan=(R.random() * 2 - 1) * .5)
    m.por(tom(ler('1521', 0, 1.6), .9), 21.3, -9, lp=3800, ataque=.01, soltura=.3)                         # mergulha
    for k in range(5): m.por(tom(ler('1796'), 1.7), 21.55 + k * .42, -23, lp=600, hp=60, pan=-.15 + .1 * k)      # remadas debaixo d'água
    for k in range(10): m.por(tom(ler('1521', 0, .6), 2.4 + R.random() * .9), 21.5 + k * .17 + R.random() * .05, -27, lp=1400, hp=300)  # bolhas
    m.por(tom(ler('1796'), .33), 22.0, -16, lp=300, hp=40, pan=(.9, -.9), ataque=.3, soltura=.6)     # a sombra do peixe passa por baixo
    m.por(tom(ler('1796'), .45), 22.9, -18, lp=900, hp=60, ataque=.3, soltura=.4)                    # sobe para o mar aberto

    # ----------------------------------------------------------------- 11. um em cada mil (23,3–26,4) e 12. trinta anos (26,4–30,3)
    m.por(tom(ler('1796'), .5), 23.35, -17, lp=1800, ataque=.2, soltura=.6)
    areia(23.4, -27, 24, 1.7, vel=(1.8, 2.6), lp=2200, hp=500)
    m.por(tom(ler('0487', 0, 1.2), 1.25), 25.55, -21, lp=6200, hp=500, soltura=.7, espaco='vale')                 # o "tim" delicado do pontinho dourado (garrafa de verdade, baixinho)
    m.por(tom(ler('1796'), .35), 26.3, -14, lp=2000, ataque=.2, soltura=.7)                       # o tempo passa rápido: estrelas e luas
    m.por(tom(ler('1800'), .45), 27.4, -16, lp=2400, ataque=.2, soltura=.7)
    # a adulta sai da arrebentação (28,3–30,3): onda escorrendo, respiração pesada, pata arrastando na areia molhada, gotas
    m.por(MARE, 28.2, -3, ini=8, dur=2.6, lp=3500, hp=120, ataque=.4, soltura=.7)
    sopro(28.7, -16, .5, 800); sopro(29.7, -17, .5, 800)
    for k, tt in enumerate((28.9, 29.5, 30.1)): m.por(tom(trecho(lama, 3 + k * 1.2, .7), .62), tt, -11, lp=1800, ataque=.05, soltura=.2, pan=(.0, .15))
    for k in range(12): m.por(tom(ler('1521', 0, .6), 1.8 + R.random()), 28.8 + k * .13 + R.random() * .06, -26, lp=4800, hp=500, pan=(R.random() - .5) * .5)

    # ----------------------------------------------------------------- 13. igualzinho (30,3–34,4): cava, bota, cobre, vai e a areia treme
    for n in (0, 1): raspada(30.3 + CICLO * (n + .42), db=-6)
    sopro(30.6, -20)
    for i in range(n_ov):
        tt = 31.55 + i / n_ov * .7 + R.random() * .02; m.por(plop(170 + R.random() * 160, .06 + .03 * R.random()), tt, -19 + 5 * R.random(), pan=-.3 + .1 * R.random(), lp=2600, espaco='quarto')
    for tt in (32.4, 32.65, 32.9): raspada(tt, db=-7, forte=.8)
    for k, tt in enumerate((33.1, 33.4)): m.por(tom(trecho(lama, 4.5 + k, .5), .6), tt, -12, lp=1700, pan=(.1, -.1), ataque=.02, soltura=.15)
    for k in range(40):                                                                            # a areia começa a tremer: grãos pulando, cada vez mais
        q = (k / 40) ** 1.6; tt = 33.6 + q * .85
        m.por(tom(trecho(lama, R.random() * 8, .09), 2.2 + R.random()), tt, -26 + 10 * q, lp=3800, hp=700, pan=(R.random() - .5) * .4, ataque=.002, soltura=.04)
    m.por(grave(34, .55, 6.0), 34.0, -26)
    m.finalizar(saida)

if __name__ == '__main__':
    montar(sys.argv[1] if len(sys.argv) > 1 else os.path.join(AQUI, 'tartarugas_sfx.wav'))
