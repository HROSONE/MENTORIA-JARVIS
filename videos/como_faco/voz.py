"""Voz do narrador "Hryz" (sintética, roda no próprio computador) + tempos de cada fala e de cada palavra.

Modelo: Kokoro-82M (Apache 2.0) via kokoro-onnx. Voz = 70% pm_alex + 30% pm_santa, 1,08x.
Baixar uma vez (pasta --modelos):
  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
pip install kokoro-onnx soundfile scipy faster-whisper
Uso: python3 voz.py --modelos <pasta> [--saida narracao.wav]
Saída: narracao.wav (48 kHz mono) e tempos.json ({falas:[{id,t0,t1,txt}], palavras:[{p,t0,t1}], total}).
"""
import argparse, json, numpy as np, soundfile as sf, scipy.signal as ss
from kokoro_onnx import Kokoro

ap = argparse.ArgumentParser(); ap.add_argument('--modelos', required=True); ap.add_argument('--saida', default='narracao.wav')
a = ap.parse_args()
PRON = {'llvmpipe': 'éli éli vi em paipe', 'Three.js': 'Trí djêi ési', 'FFmpeg': 'éfe éfe ém pég', 'MP4': 'ême pê quatro'}
INICIO, PAUSA = 0.10, {'gancho': 0.45, 'mapa': 0.5, 'roteiro': 0.5, 'modelos': 0.5, 'cena': 0.45, 'render': 0.5, 'descoberta': 0.5, 'montagem': 0.45}

k = Kokoro(f'{a.modelos}/kokoro.onnx', f'{a.modelos}/voices.bin')
voz = (0.7 * k.get_voice_style('pm_alex') + 0.3 * k.get_voice_style('pm_santa')).astype(np.float32)
SR = 48000
partes, falas, t = [np.zeros(int(INICIO * SR), np.float32)], [], INICIO
for fid, txt in json.load(open('falas.json')):
    dito = txt
    for k_, v in PRON.items(): dito = dito.replace(k_, v)
    au, sr = k.create(dito, voice=voz, speed=1.08, lang='pt-br')
    au = ss.resample_poly(au, SR, sr).astype(np.float32)
    nz = np.where(np.abs(au) > 0.01)[0]; au = au[max(0, nz[0] - 200): nz[-1] + 2400]      # corta silêncio das pontas
    falas.append({'id': fid, 't0': round(t, 3), 't1': round(t + len(au) / SR, 3), 'txt': txt})
    partes.append(au); t += len(au) / SR
    p = PAUSA.get(fid, 0.8); partes.append(np.zeros(int(p * SR), np.float32)); t += p
au = np.concatenate(partes)
# leve compressão + normalização (-16 LUFS aprox. por RMS)
au = np.tanh(au * 1.6) / np.tanh(1.6)
au *= 0.16 / max(1e-6, np.sqrt(np.mean(au[np.abs(au) > 0.01] ** 2)))
au = np.clip(au, -0.97, 0.97)
sf.write(a.saida, au, SR)

from faster_whisper import WhisperModel
m = WhisperModel('small', device='cpu', compute_type='int8')
segs, _ = m.transcribe(ss.resample_poly(au, 16000, SR).astype(np.float32), language='pt', word_timestamps=True,
                       initial_prompt=' '.join(x['txt'] for x in falas))
palavras = [{'p': w.word.strip(), 't0': round(w.start, 3), 't1': round(w.end, 3)} for s in segs for w in s.words]
json.dump({'falas': falas, 'palavras': palavras, 'total': round(t, 3)}, open('tempos.json', 'w'), ensure_ascii=False, indent=1)
print('total', round(t, 2), 's;', len(palavras), 'palavras')
for f in falas: print(f"{f['id']:11s} {f['t0']:6.2f} {f['t1']:6.2f}")
