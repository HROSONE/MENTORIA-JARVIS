# MESA DE SOM do canal: mixagem em Python de gravações reais (BigSoundBank em bsb/, Kenney) com o que faltou no "Ele podia voar" (16/11):
# camadas por evento, espaço (reverberação por ambiente), perspectiva (abafado dentro do carro / de longe), movimento no estéreo com Doppler,
# "riser" feito de som real invertido antes do impacto, pré-escuta do próximo plano (J-cut) e a checagem automática de nível e chiado.
# Sem música, sem cama sintetizada: a síntese aqui só gera o reforço grave curto de um impacto e a resposta de sala da reverberação.
#
#   from mesa import Mesa
#   m = Mesa(50)
#   m.por('0740', 0, db=-6, ate=4, espaco='quarto')                          # som do bsb pelo id, ou caminho de arquivo
#   m.evento(19.0, [('1808', -4), ('1023', 0, {'vel': 0.6}), ('0148', -10, {'atraso': 0.03})], espaco='vale', grave=True)
#   m.passagem('1796', 29.3, dur=0.8, de=-1, para=1)                        # passa da esquerda para a direita com Doppler
#   m.riser('0146', ate=19.0, dur=1.2)                                         # sobe até o corte/impacto
#   m.finalizar('saida.wav')                                                   # -23 dB de média, limitador, relatório e checagens
import os, subprocess, wave
import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt

SR = 48000
BSB = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'bsb')
ESPACOS = {                     # (RT60 s, pré-atraso s, brilho Hz, mistura): resposta de sala sintetizada só como reverberação
    'quarto': (0.35, 0.004, 6000, 0.12), 'sala': (0.8, 0.010, 7000, 0.16), 'carro': (0.12, 0.002, 4000, 0.10),
    'rua': (0.9, 0.020, 8000, 0.10), 'vale': (2.6, 0.060, 5000, 0.22), 'corredor': (1.4, 0.015, 6500, 0.20),
}

def ler(fonte, ini=0.0, dur=None, vel=1.0):
    """id do BigSoundBank ('0740') ou caminho; vel muda tempo e tom juntos (como fita)"""
    f = os.path.join(BSB, f'{fonte}.ogg') if fonte.isdigit() else fonte
    if not os.path.exists(f) and fonte.isdigit():
        subprocess.run(['curl', '-s', '-f', f'https://bigsoundbank.com/UPLOAD/ogg/{fonte}.ogg', '-o', f], check=True)
    cmd = ['ffmpeg', '-v', 'error', '-ss', str(ini)] + (['-t', str(dur)] if dur else []) + ['-i', f, '-ac', '2', '-ar', str(int(SR / vel)), '-f', 'f32le', '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).copy()

def filtro(a, lp=None, hp=None):
    if lp: a = sosfilt(butter(4, lp, 'low', fs=SR, output='sos'), a, axis=0)
    if hp: a = sosfilt(butter(2, hp, 'high', fs=SR, output='sos'), a, axis=0)
    return a.astype(np.float32)

_ir = {}
def resposta(espaco):
    """resposta de sala estéreo: reflexões iniciais + cauda de ruído com decaimento exponencial (RT60) e agudos que morrem antes"""
    if espaco in _ir: return _ir[espaco]
    rt, pre, brilho, _ = ESPACOS[espaco]; n = int((rt * 1.2 + pre) * SR); R = np.random.default_rng(7)
    t = np.arange(n) / SR; ir = R.standard_normal((n, 2)).astype(np.float32) * np.exp(-6.91 * t / rt)[:, None]
    ir[:int(pre * SR)] = 0; ir = filtro(ir, lp=brilho)
    for k in range(6): d = int((pre * (1 + k * 0.7) + 0.002 * k) * SR); ir[min(d, n - 1), k % 2] += 0.5 / (1 + k)
    ir /= np.sqrt((ir ** 2).sum() / 2) + 1e-9
    _ir[espaco] = ir; return ir

def env(n, ataque=0.01, soltura=0.1):
    e = np.ones(n, np.float32); a, r = min(n, int(ataque * SR)), min(n, int(soltura * SR))
    if a: e[:a] = np.linspace(0, 1, a)
    if r: e[n - r:] *= np.linspace(1, 0, r)
    return e[:, None]

def grave(f0=50, dur=0.6, queda=6.0):
    """reforço sub curto de impacto (só junto de um som real)"""
    t = np.arange(int(dur * SR)) / SR; f = f0 * (1 + 1.2 * np.exp(-t * 30))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * queda); return np.stack([s, s], 1).astype(np.float32)

class Mesa:
    def __init__(self, dur):
        self.dur = dur; self.mix = np.zeros((int(dur * SR) + SR, 2), np.float32); self.eventos = []

    def por(self, som, t, db=0.0, *, ini=0.0, dur=None, vel=1.0, ate=None, ataque=0.01, soltura=0.1, pan=0.0, lp=None, hp=None, espaco=None, seco=1.0, laco=False):
        """coloca um som em t. pan: número (-1..1) ou (inicio, fim) para mover no estéreo. lp/hp: perspectiva (lp 900 = abafado/dentro;
        hp 300 = longe/fino). espaco: reverberação do ambiente. laco: repete até `ate` (leitos de ambiente de gravação longa)."""
        a = ler(som, ini, dur, vel) if isinstance(som, str) else som.copy()
        if laco and ate is not None:
            while len(a) < (ate - t) * SR: a = np.concatenate([a, a])
        if ate is not None: a = a[:max(0, int((ate - t) * SR))]
        if not len(a): return
        a = filtro(a, lp, hp) * env(len(a), ataque, soltura) * 10 ** (db / 20)
        if isinstance(pan, tuple): p = np.linspace(pan[0], pan[1], len(a), dtype=np.float32)
        else: p = np.full(len(a), pan, np.float32)
        if np.any(p):                                                     # pan de potência constante (no centro os dois canais ficam iguais)
            ang = (np.clip(p, -1, 1) + 1) * np.pi / 4; a = a * np.stack([np.cos(ang), np.sin(ang)], 1).astype(np.float32) * np.float32(1.4142)
        if espaco:
            w = fftconvolve(a, resposta(espaco), axes=0)[:len(a) + int(ESPACOS[espaco][0] * SR)].astype(np.float32)
            a = np.concatenate([a * seco, np.zeros((len(w) - len(a), 2), np.float32)]) + w * ESPACOS[espaco][3]
        i0 = int(t * SR); a = a[:max(0, len(self.mix) - i0)]
        self.mix[i0:i0 + len(a)] += a; self.eventos.append((t, som if isinstance(som, str) else 'sintese', db))

    def evento(self, t, camadas, *, espaco=None, grave_=False, pan=0.0, lp=None):
        """um acontecimento = várias camadas: transiente (estalo), corpo (estrondo), cauda/detritos. camadas: (fonte, db[, opções])"""
        for c in camadas:
            op = dict(c[2]) if len(c) > 2 else {}; atraso = op.pop('atraso', 0.0)
            self.por(c[0], t + atraso, c[1], espaco=espaco, pan=op.pop('pan', pan), lp=op.pop('lp', lp), **op)
        if grave_: self.por(grave(), t, -10)

    def passagem(self, som, t, *, dur=0.8, de=-1.0, para=1.0, db=0.0, doppler=0.06, espaco=None):
        """objeto passando pela câmera: atravessa o estéreo, cresce e some, e o tom cai na passagem (Doppler)"""
        a = ler(som); n = len(a); x = np.linspace(-1, 1, n)
        fase = np.cumsum(1 + doppler * -np.tanh(3 * x)); fase = fase / fase[-1] * (n - 1)
        a = np.stack([np.interp(fase, np.arange(n), a[:, 0]), np.interp(fase, np.arange(n), a[:, 1])], 1).astype(np.float32)
        a *= (1 / (1 + 4 * x ** 2))[:, None].astype(np.float32)
        a = a[np.linspace(0, n - 1, int(dur * SR)).astype(int)] if dur else a
        self.por(a, t - len(a) / SR / 2, db, pan=(de, para), espaco=espaco, ataque=0.05, soltura=0.1)

    def riser(self, som, ate, *, dur=1.2, db=-6.0, vel=1.6):
        """subida até um corte ou impacto feita de som real tocado ao contrário e mais agudo (nunca tom sintetizado)"""
        a = ler(som, 0, dur * vel, vel)[::-1].copy()[:int(dur * SR)]
        a *= np.linspace(0, 1, len(a), dtype=np.float32)[:, None] ** 2
        self.por(a, ate - len(a) / SR, db, ataque=0.0, soltura=0.01)

    def abafar(self, t0, t1, lp=700, rampa=0.15):
        """deixa um trecho abafado (ouvido zunindo depois de explosão, ponto de vista debaixo d'água ou de dentro)"""
        i0, i1 = int(t0 * SR), int(t1 * SR); seg = self.mix[i0:i1].copy(); f = filtro(seg, lp=lp)
        k = np.ones(len(seg), np.float32); r = int(rampa * SR); k[:r] = np.linspace(0, 1, r); k[-r:] = np.linspace(1, 0, r)
        self.mix[i0:i1] = seg * (1 - k[:, None]) + f * k[:, None]

    def silencio(self, t0, t1, resto=0.1):
        """buraco de silêncio antes de um impacto (dá peso)"""
        i0, i1 = int(t0 * SR), int(t1 * SR); self.mix[i0:i1] *= np.linspace(1, resto, i1 - i0, dtype=np.float32)[:, None]

    def finalizar(self, saida, media=-23.0, teto=-1.0):
        mix = self.mix[:int(self.dur * SR)]
        rms = 20 * np.log10(np.sqrt((mix ** 2).mean()) + 1e-12); mix = mix * 10 ** ((media - rms) / 20)
        lim = 0.45; a = np.abs(mix); s = a > lim; mix[s] = np.sign(mix[s]) * (lim + (1 - lim) * np.tanh((a[s] - lim) / (1 - lim)))
        p = np.abs(mix).max(); mix *= min(1.0, 10 ** (teto / 20) / max(p, 1e-9))
        rms = 20 * np.log10(np.sqrt((mix ** 2).mean()) + 1e-12)
        # chiado: energia acima de 8 kHz que nunca cai (cama de ruído) -> alerta
        jan = SR // 2; hf = filtro(mix, hp=8000); bloco = [np.sqrt((hf[i:i + jan] ** 2).mean()) for i in range(0, len(hf) - jan, jan)]
        chiado = len(bloco) > 4 and np.percentile(bloco, 10) > 10 ** (-52 / 20)
        por2 = [round(float(20 * np.log10(np.sqrt((mix[i:i + 2 * SR] ** 2).mean()) + 1e-12)), 1) for i in range(0, len(mix), 2 * SR)]
        pcm = (np.clip(mix, -1, 1) * 32767).astype('<i2')
        with wave.open(saida, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
        print(f'ok {saida}  média {rms:.1f} dB  pico {20 * np.log10(np.abs(mix).max() + 1e-12):.1f} dB  eventos {len(self.eventos)}')
        print('média a cada 2 s:', por2)
        if rms > -18: print('ATENÇÃO: média acima de -18 dB')
        if chiado: print('ATENÇÃO: agudo constante (chiado/cama de ruído): rever os leitos de ambiente')
        return rms
