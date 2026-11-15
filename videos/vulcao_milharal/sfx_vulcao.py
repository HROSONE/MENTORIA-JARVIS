"""Som do Short "O vulcão que nasceu num milharal" (43,6 s). Regras do canal (DIRETRIZES.md, seção 4):
 - NADA de cama de ruído sintetizada e NADA de música; síntese só para impactos curtos, um por ação visível, volume contido;
 - os dois únicos "ambientes" são gravações reais CC0 do OpenGameArt, bem baixas e filtradas:
     * estrondo grave ("rumble fx", https://opengameart.org/content/rumble-fx, CC0) -> rumble.wav
     * fogo crepitando ("Fireplace Sound loop", https://opengameart.org/content/fireplace-sound-loop, CC0) -> fire.wav
 - nas cenas sem fogo nem vulcão (placa, fim) fica quase silêncio; a narração é gravada pelo dono (este arquivo não tem voz).
Os tempos vêm da linha do tempo de js/planos.js (12 planos) e dos gatilhos visíveis (quadro 0, cortes com flash, relâmpagos do plano 9, troca da placa HRYZ).
Saída: vulcao_sfx.mp3 (+ relatório de verificação no terminal).   Uso: python3 sfx_vulcao.py <pasta com fire.wav e rumble.wav> [saida.mp3]   (precisa de numpy, scipy e ffmpeg)"""
import os, sys, subprocess, collections
import numpy as np
from scipy.signal import butter, sosfilt

AQUI = os.path.dirname(os.path.abspath(__file__))
SR = 44100
TOTAL = 43.6
N = int(SR * TOTAL)
L, R = np.zeros(N), np.zeros(N)
rng = np.random.default_rng(1943)
PASTA = sys.argv[1] if len(sys.argv) > 1 else '/tmp/somvulcao/dl'
SAIDA = sys.argv[2] if len(sys.argv) > 2 else os.path.join(AQUI, 'vulcao_sfx.mp3')

def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def ruido(d): return rng.standard_normal(int(d * SR))
def tt(d): return np.arange(int(d * SR)) / SR
def env(n, a=.003, r=.05):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(r, 1e-4))
def db(x): return 10 ** (x / 20)
def add(t, x, g=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N or i + len(x) <= 0: return
    x = x[max(0, -i):]; i = max(0, i); x = x[:N - i]
    L[i:i + len(x)] += x * g * (1 - max(0, pan)); R[i:i + len(x)] += x * g * (1 + min(0, pan))
def norm(x): return x / (np.abs(x).max() + 1e-12)

# ------------------------------------------------------------------------------------------ impactos curtos (síntese)
def boom(g=1.0):                                    # estouro da terra: queda de 75 a 32 Hz, ruído grave e um estalo seco no começo (cai em ~1,8 s)
    d = 1.8; n = int(d * SR); t = tt(d)
    base = np.sin(2 * np.pi * (32 + 43 * np.exp(-t * 3.2)) * t) * env(n, .008, .55)
    x = .55 * base + .9 * np.tanh(3.2 * base) * .6                                   # a saturação cria harmônicos (100 a 250 Hz) que o alto-falante do celular reproduz
    x += np.sin(2 * np.pi * (115 - 160 * t) * t) * env(n, .002, .09) * .9           # batida seca no ataque
    x += lp(ruido(d), 420) * env(n, .01, .5) * 1.1 + lp(ruido(d), 1100) * env(n, .004, .12) * .7
    x += bp(ruido(d), 900, 3800) * env(n, .001, .05) * .45
    return norm(lp(x, 1800)) * g
def trovao(g=1.0):                                  # estrondo grave de relâmpago, sem agudos
    d = 1.5; n = int(d * SR); t = tt(d)
    x = np.sin(2 * np.pi * (58 - 9 * t) * t) * env(n, .03, .38) + lp(ruido(d), 170) * env(n, .05, .5) * 1.2 + lp(ruido(d), 480) * env(n, .015, .13) * .5
    return norm(lp(x, 420)) * g
def pedra(g=1.0, grave=1.0):                        # pedra incandescente batendo no chão: baque curto + cascalho
    d = .3; n = int(d * SR); t = tt(d)
    x = grave * np.sin(2 * np.pi * (125 - 340 * t) * t) * env(n, .002, .07) + lp(ruido(d), 700) * env(n, .002, .06) * .9
    for _ in range(int(rng.integers(2, 5))):
        i = int(rng.uniform(.03, .22) * SR); k = int(.005 * SR); x[i:i + k] += bp(ruido(.005), 1400, 4200)[:k] * env(k, .0006, .002) * rng.uniform(.12, .3)
    return norm(x) * g
def estalo(g=1.0):                                  # terra rachando: estalo seco curto + baque grave
    d = .22; n = int(d * SR); t = tt(d)
    x = bp(ruido(d), 900, 4200) * env(n, .001, .03) + .8 * np.sin(2 * np.pi * (170 - 500 * t) * t) * env(n, .002, .06) + .5 * lp(ruido(d), 500) * env(n, .003, .08)
    return norm(x) * g
def passo(g=1.0):                                   # passo em terra seca: baque + um pouco de crocância
    d = .18; n = int(d * SR); t = tt(d)
    x = np.sin(2 * np.pi * (95 - 260 * t) * t) * env(n, .003, .05) + lp(ruido(d), 1100) * env(n, .003, .05) * .8 + bp(ruido(d), 1800, 4200) * env(n, .006, .03) * .22
    return norm(x) * g
def toc(g=1.0):                                     # batida na madeira (troca do texto da placa)
    d = .12; n = int(d * SR); t = tt(d)
    x = np.sin(2 * np.pi * (480 - 700 * t) * t) * env(n, .001, .03) + bp(ruido(d), 700, 2800) * env(n, .001, .014) * .8
    return norm(x) * g
def chispa(g=1.0):                                  # fagulha estalando (bem baixinha)
    d = .02; n = int(d * SR)
    return norm(hp(ruido(d), 2800) * env(n, .0004, .004)) * g
def bolha(g=1.0):                                   # bolha de lava estourando
    d = .14; n = int(d * SR); t = tt(d)
    x = np.sin(2 * np.pi * (190 - 520 * t) * t) * env(n, .002, .035) + lp(ruido(d), 900) * env(n, .002, .03) * .6
    return norm(x) * g
def telha(g=1.0):                                   # telhado cedendo sob a lava: estalo + baque
    d = .45; n = int(d * SR); t = tt(d)
    x = bp(ruido(d), 600, 3200) * env(n, .002, .06) + np.sin(2 * np.pi * (140 - 200 * t) * t) * env(n, .004, .18) + lp(ruido(d), 400) * env(n, .01, .2) * .7
    return norm(x) * g

log = []
def ev(nome, t, x, g_db, pan=0.0): add(t, x, db(g_db), pan); log.append((round(t, 2), nome, round(g_db, 1)))

# ------------------------------------------------------------------------------------------ gravações reais (CC0): leitura, filtro e laço
def ler(f):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)
def laco(x, n, xf=2.0):                              # repete x até n amostras com emenda em fade cruzado (potência constante)
    k = int(xf * SR); out = x[:].copy()
    while len(out) < n:
        a = np.linspace(0, np.pi / 2, k); out = np.concatenate([out[:-k], out[-k:] * np.cos(a) + x[:k] * np.sin(a), x[k:]])
    return out[:n]
def curva(pts):                                      # [(tempo, dB), ...] -> ganho linear por amostra (interpolação em dB; -90 = mudo)
    t = np.arange(N) / SR; return db(np.interp(t, [p[0] for p in pts], [p[1] for p in pts]))

rumble = ler(os.path.join(PASTA, 'rumble.wav'))[int(1.5 * SR):int(17.5 * SR)]            # miolo da gravação (tira o fade-in e o fade-out)
rumble = lp(hp(rumble, 35), 600)                                                         # sem infrassom inaudível e sem agudos
rumble = np.tanh(rumble / (2.5 * np.sqrt(np.mean(rumble ** 2)))) * 2.5 * np.sqrt(np.mean(rumble ** 2))
rumble = laco(rumble / np.sqrt(np.mean(rumble ** 2)), N, 2.0)                             # RMS 1,0 em todo o arquivo
fogo = ler(os.path.join(PASTA, 'fire.wav'))[int(1.0 * SR):]
fogo = lp(hp(fogo, 250), 5000)                                                           # só o estalar, sem o rugido grave nem chiado
r0 = np.sqrt(np.mean(fogo ** 2)); fogo = np.tanh(fogo / (3.0 * r0)) * 3.0 * r0           # segura os estalos mais altos
fogo = laco(fogo / np.sqrt(np.mean(fogo ** 2)), N, 1.5)

# níveis (dBFS de RMS) por plano: o estrondo acompanha a intensidade do vulcão
cama_rumble = curva([(0, -90), (0.05, -38), (3.3, -36), (3.4, -90), (6.8, -90), (7.0, -48), (9.9, -30), (10.4, -27), (13.5, -25), (13.6, -27), (17.2, -29), (21.2, -31),
                     (25.2, -35), (28.9, -34), (29.2, -26), (32.8, -24), (33.2, -34), (34.7, -48), (36.0, -90), (43.6, -90)])
cama_fogo = curva([(0, -90), (0.1, -46), (3.3, -42), (3.4, -33), (6.7, -33), (6.9, -90), (21.0, -90), (21.4, -40), (24.0, -34), (25.0, -33), (29.0, -34), (29.5, -90), (43.6, -90)])
cama = rumble * cama_rumble + fogo * cama_fogo
L += cama; R += cama

# ------------------------------------------------------------------------------------------ eventos (um por ação visível)
# 1. gancho (0 a 3,4 s): o chão já está aberto no quadro 0; fagulhas
ev('estouro do chão (quadro 0)', 0.0, boom(), -7)
for t in np.sort(rng.uniform(0.15, 3.3, 9)): ev('fagulha', t, chispa(), -33 - rng.uniform(0, 4), pan=float(rng.uniform(-.5, .5)))
# 2. o campo (3,4 a 6,8 s): Dionísio caminhando ao fundo (pé no chão em 3,56 / 4,56 / 5,56 / 6,56 s, medido no clipe Andar com rit 0,5), bem baixo por causa da distância
for t in (3.56, 4.56, 5.56, 6.56): ev('passo (caminhada)', t, passo(), -34, pan=-.25)
# 3. o chão incha (6,8 a 10,4 s): batidas graves cada vez mais fortes e o estalo da fenda
for t, g in [(7.7, -24), (8.5, -22), (9.2, -19.5), (9.75, -17)]: ev('o chão pulsa', t, pedra(1.0, 1.6), g)
ev('a terra racha', 10.02, estalo(), -15)
# 4. o buraco abre (10,4 a 13,6 s): estouro e Dionísio correndo para a câmera (passos mais fortes ao chegar perto)
ev('estouro da fenda', 10.42, boom(), -7)
for k, t in enumerate([10.475, 10.919, 11.371, 11.815, 12.267, 12.711, 13.163]):     # instantes em que o pé toca o chão no clipe Correr (rit 0,8), medidos no esqueleto
    ev('passo (corrida)', t, passo(), -28 + 1.6 * k, pan=float(-0.3 + 0.06 * k))
for t in (11.2, 11.9, 12.5, 13.1): ev('pedra cai', t, pedra(), -25, pan=float(rng.uniform(-.7, .7)))
# 5. a primeira noite (13,6 a 17,2 s): novo estouro e pedras em brasa caindo
ev('estouro (noite)', 13.62, boom(), -9)
for t in np.sort(rng.uniform(13.9, 17.0, 10)): ev('pedra cai', t, pedra(1.0, .8), -27 + rng.uniform(0, 5), pan=float(rng.uniform(-.8, .8)))
for t in np.sort(rng.uniform(14.0, 17.0, 5)): ev('bolha de lava', t, bolha(), -31, pan=float(rng.uniform(-.6, .6)))
# 6. lapso com a placa HRYZ (17,2 a 21,2 s): a placa troca de texto em 18,4 e 19,7; pedras mais espaçadas
for t in (18.4, 19.68): ev('placa troca o texto', t, toc(), -19)
for t in np.sort(rng.uniform(17.5, 21.0, 6)): ev('pedra cai', t, pedra(1.0, .8), -29 + rng.uniform(0, 3), pan=float(rng.uniform(-.8, .8)))
# 7. a lava vem (21,2 a 25,2 s): bolhas e a lava cedendo o telhado da casa em primeiro plano
for t in np.sort(rng.uniform(21.6, 24.6, 9)): ev('bolha de lava', t, bolha(), -30 - rng.uniform(0, 3), pan=float(rng.uniform(-.7, .7)))
ev('lava cobre a casa', 24.78, telha(), -16)
# 8. a torre (25,2 a 29,2 s): lava borbulhando em volta da igreja
for t in np.sort(rng.uniform(25.5, 29.0, 8)): ev('bolha de lava', t, bolha(), -29 - rng.uniform(0, 3), pan=float(rng.uniform(-.7, .7)))
# 9. o ápice (29,2 a 33,2 s): estouro e um trovão em cada relâmpago (o som chega ~0,3 s depois do clarão)
ev('estouro (ápice)', 29.3, boom(), -9)
for tl in (0.5, 1.5, 2.2, 2.9, 3.5): ev('trovão', 29.2 + tl + 0.3, trovao(), -11)
for t in np.sort(rng.uniform(29.8, 33.0, 6)): ev('pedra cai', t, pedra(1.0, .8), -29 + rng.uniform(0, 3), pan=float(rng.uniform(-.8, .8)))
# 10. o fim (33,2 a 37,2 s): a lava esfriando estala de longe
for t in (34.0, 35.1, 36.2): ev('lava esfriando', t, bolha(), -36, pan=float(rng.uniform(-.5, .5)))
# 12. rebobina (41,0 a 43,6 s): o estouro "ao contrário" (o vulcão entra na terra) termina em 43,55 e o loop recomeça no estouro do quadro 0
rev = np.concatenate([np.flip(boom()), np.flip(trovao() * .6)[:int(.4 * SR)]])
rev = rev[-int(1.9 * SR):]; rev = rev * np.linspace(0, 1, len(rev)) ** 1.6
ev('estouro ao contrário (rebobina)', 43.55 - len(rev) / SR, rev, -7)

# ------------------------------------------------------------------------------------------ mixagem, verificação e MP3
mix = np.stack([L, R], 1); mix = np.tanh(mix * 1.15) / 1.15                              # limitador suave
pico = np.abs(mix).max()
if pico > db(-3): mix *= db(-3) / pico
wav = SAIDA.replace('.mp3', '.wav')
import wave
with wave.open(wav, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '160k', SAIDA], check=True)
os.remove(wav)
m = mix.mean(1); rmsg = 20 * np.log10(np.sqrt(np.mean(m ** 2)) + 1e-12); pk = 20 * np.log10(np.abs(m).max() + 1e-12)
Nf = 16384; P = np.mean([np.abs(np.fft.rfft(m[i:i + Nf] * np.hanning(Nf))) ** 2 for i in range(0, len(m) - Nf, Nf)], axis=0); fr = np.fft.rfftfreq(Nf, 1 / SR)
faixas = [(0, 60), (60, 150), (150, 400), (400, 1500), (1500, 5000), (5000, 9000), (9000, 22050)]; tot = P.sum()
print(f'média {rmsg:.1f} dBFS (limite -18), pico {pk:.1f} dBFS; eventos: {len(log)}')
print('energia por faixa (%):', {f'{a}-{b}': round(100 * P[(fr >= a) & (fr < b)].sum() / tot, 1) for a, b in faixas})
# nível médio por plano (dBFS) para conferir que cada cena tem o som que combina com ela
plano = [('gancho', 0, 3.4), ('campo', 3.4, 6.8), ('incha', 6.8, 10.4), ('abre', 10.4, 13.6), ('noite1', 13.6, 17.2), ('lapso', 17.2, 21.2), ('lava', 21.2, 25.2), ('torre', 25.2, 29.2), ('apice', 29.2, 33.2), ('fim', 33.2, 37.2), ('placa', 37.2, 41.0), ('rebobina', 41.0, 43.6)]
print('nível médio por plano (dBFS):', {n: round(20 * np.log10(np.sqrt(np.mean(m[int(a * SR):int(b * SR)] ** 2)) + 1e-12), 1) for n, a, b in plano})
print('eventos por tipo:', dict(collections.Counter(n.split(' (')[0] for _, n, _ in log)))
for t, nome, g in sorted(log):
    if nome.startswith(('estouro', 'trovão', 'a terra', 'lava cobre', 'placa troca', 'o chão pulsa')): print(f'  {t:6.2f} s  {nome}  ({g} dB)')
