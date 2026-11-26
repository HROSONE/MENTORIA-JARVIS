"""Som do "Como eu faço": voz (narracao.wav) + efeitos curtos nas batidas (woosh nos cortes, clique nos ícones, obturador no render,
batida no 20× e no MP4). Sem música. Woosh = BigSoundBank 1796/1800; cliques e batidas = síntese curta (só impacto, nada contínuo).
Uso: python3 sfx.py [saida.wav]"""
import sys, json, numpy as np, soundfile as sf
sys.path.insert(0, '../biblioteca3d/sons'); from mesa import Mesa, SR, grave, filtro

T = json.load(open('tempos.json')); F = {f['id']: f for f in T['falas']}
def P(p, depois=0):
    for w in T['palavras']:
        if w['t0'] >= depois - 0.01 and p.lower() in w['p'].lower().strip('.,!?'): return w['t0']
    raise KeyError(p)
def clique(f=2200, dur=0.05, ruido=0.6):
    t = np.arange(int(dur * SR)) / SR; r = np.random.default_rng(int(f)).standard_normal(len(t))
    s = (np.sin(2 * np.pi * f * t) * (1 - ruido) + r * ruido) * np.exp(-t * 90); return np.stack([s, s], 1).astype(np.float32)
def batida(): return grave(55, 0.5, 7) * 0.9 + np.pad(clique(900, 0.08, 0.8), ((0, int(0.42 * SR)), (0, 0)))

DUR = 73.0
m = Mesa(DUR)
voz, sr = sf.read('narracao.wav', dtype='float32'); voz = np.stack([voz, voz], 1) if voz.ndim == 1 else voz
m.por(voz, 0, 0, ataque=0, soltura=0.05)
# woosh nos cortes (alternando os dois arquivos e o lado)
cortes = [F[k]['t0'] - 0.2 for k in ['mapa', 'roteiro', 'modelos', 'cena', 'render', 'descoberta', 'montagem', 'voz']]
for i, c in enumerate(cortes): m.passagem('1796' if i % 2 else '1800', c, dur=0.6, de=-0.6 if i % 2 else 0.6, para=0.6 if i % 2 else -0.6, db=-17)
m.passagem('1796', P('Kael') if False else P('personagens', F['modelos']['t0']) - 0.25, dur=0.5, db=-18)   # whip para o Kael
# gancho: ícones entram (clique) e são riscados (clique mais grave)
for p, d, pan in [('câmera', 1, -0.5), ('edição', 2.4, 0), ('placa', 3.6, 0.5)]:
    t = P(p, d); m.por(clique(2600), t - 0.12, -20, pan=pan); m.por(clique(900, 0.07, 0.9), t + 0.3, -21, pan=pan)
m.por(batida(), P('Só', 4.5), -16)
# mapa: um clique por etapa acesa
for i in range(6): m.por(clique(1800 + i * 150, 0.04), F['mapa']['t0'] + 0.15 + i * 0.5, -24)
# roteiro: colunas da decupagem + claquete
td = P('decupagem', F['roteiro']['t0'])
for p in ['plano', 'ângulo', 'alente', 'movimento']: m.por(clique(2000, 0.04), P(p, td) - 0.05, -23)
m.por(clique(1200, 0.06, 0.95) * 2, P('filme', td), -14)
# modelos: peças encaixando (cliques rápidos) e o contador chegando
tm, t156 = P('montar', F['modelos']['t0']), P('156', F['modelos']['t0'])
rng = np.random.default_rng(3)
for t in np.sort(rng.uniform(tm, t156, 14)): m.por(clique(rng.uniform(1500, 3200), 0.03), float(t), -27, pan=float(rng.uniform(-0.4, 0.4)))
m.por(batida(), t156, -17)
# render: obturador acelerando
tf, t30 = P('fotografa', F['render']['t0']), P('30', F['render']['t0'])
t = tf
while t < t30 + 0.6:
    k = min(1, (t - tf) / (t30 + 0.5 - tf)); vel = 1.5 + 6.5 * (3 * k * k - 2 * k ** 3)
    m.por(clique(3800, 0.025, 0.9), t, -25 - 4 * k); t += 1 / vel
# descoberta: cada barra, o 20× e o "mesma imagem"
d0 = F['descoberta']['t0']
m.por(clique(700, 0.08, 0.9), P('placa', d0) + 0.35, -20)
for p in ['llv', 'dois']: m.por(clique(2400, 0.05), P(p, d0), -21)
t20 = P('20', P('mesma', d0)); m.silencio(t20 - 0.25, t20, 0.6); m.por(batida(), t20, -12); m.por(clique(1500, 0.1, 0.9), t20, -18)
# montagem e final
m.por(batida(), P('mp4', F['montagem']['t0']) - 0.25, -16)
m.passagem('1800', P('Agora', F['voz']['t0']) + 0.4, dur=1.2, db=-19)
m.finalizar(sys.argv[1] if len(sys.argv) > 1 else 'som.wav', media=-19.5)
