import json, re, wave, numpy as np
SR = 44100
tl = json.load(open('timeline.json')); D, LEAD, durs = tl['D'], tl['LEAD'], tl['durs']
order = json.load(open('order.json'))
S = {}; acc = 0
for nm, d in order: S[nm] = acc; acc += d
ST = [S['scene%d' % k] for k in range(1, 9)]
ORDER_TOTAL = acc
src = open('tts.py').read(); N = eval(re.search(r"N = (\[.*?\n\])", src, re.S).group(1))
def tp(i, ph): return LEAD[i-1] + N[i-1].index(ph) / len(N[i-1]) * durs[i-1]
total = ORDER_TOTAL + .5
mus = np.zeros(int(total*SR)); sfx = np.zeros_like(mus); nar = np.zeros_like(mus)
rng = np.random.default_rng(1)
def add(buf, sig, t, g=1.0):
    a = int(t*SR); b = min(len(buf), a+len(sig))
    if a < 0 or a >= len(buf): return
    buf[a:b] += sig[:b-a]*g
def tt(d): return np.arange(int(d*SR))/SR
def env(n, a=.01, r=.2):
    e = np.ones(n); na = int(a*SR); nr = int(r*SR)
    e[:na] = np.linspace(0, 1, na); e[-nr:] = np.minimum(e[-nr:], np.linspace(1, 0, nr)); return e
def lp(x, k):  # moving-average lowpass
    return np.convolve(x, np.ones(k)/k, mode='same')
def noise(d): return rng.standard_normal(int(d*SR))
def whoosh(d=.6, k0=40):
    n = noise(d); s = lp(n, k0)*4
    e = np.sin(np.pi*np.linspace(0, 1, len(s)))**2
    return s*e
def thump(f=55, d=.35, drop=30):
    t = tt(d); return np.sin(2*np.pi*(f+drop*np.exp(-t*18))*t)*np.exp(-t*9)
def click(d=.03, f=2200):
    t = tt(d); return np.sin(2*np.pi*f*t)*np.exp(-t*220)
def step(): return (thump(90, .12, 50)*.7 + lp(noise(.08), 12)[:int(.08*SR)].repeat(1)[:int(.12*SR)].tolist().__len__()*0) if False else np.pad(thump(95,.14,40)*.8, (0,0))
def ding(f=880, d=.5):
    t = tt(d); return (np.sin(2*np.pi*f*t)+.4*np.sin(2*np.pi*2*f*t))*np.exp(-t*7)*.5
def ring(d=.8):
    t = tt(d); s = (np.sin(2*np.pi*440*t)+np.sin(2*np.pi*480*t))*(np.sin(2*np.pi*22*t)>0)
    return s*env(len(s), .01, .05)*.35

# narration
for i in range(8):
    w = wave.open(f'audio/n{i+1}.wav'); a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float)/32768; w.close()
    pass  # narração removida (será gravada pelo usuário)
# music: drone
t = np.arange(len(mus))/SR
drone = (np.sin(2*np.pi*55*t) + .6*np.sin(2*np.pi*82.4*t+1) + .35*np.sin(2*np.pi*110.5*t))*(.7+.3*np.sin(2*np.pi*t/7))
drone += lp(noise(total), 300)*3*(.5+.5*np.sin(2*np.pi*t/11))
mus += drone*.045*np.minimum(1, t/3)*np.minimum(1, (total-t)/2.5)
# scene 1
add(sfx, whoosh(1.0, 120)*.8*np.linspace(0, 1, int(SR))**2, ST[0]+.05, .5)
add(sfx, thump(45, 1.3, 40)*1.6, ST[0]+1.0, .9)
add(sfx, lp(noise(.5), 8)*np.exp(-tt(.5)*6)*3, ST[0]+1.0, .4)
for i in range(8): add(sfx, whoosh(.5, 60), ST[i]-.05 if i else 0, .35)
# scene 2: shimmer on ring + soft wind
add(mus, lp(noise(D[1]), 200)*2.2*env(int(D[1]*SR), 1, 1), ST[1], .05)
# scene 3: footsteps
ph = 1.25
k = 0
while .2 + k/(2*ph) < D[2]-.5:
    add(sfx, thump(110, .12, 60)*.6, ST[2]+.2+k/(2*ph), .5); add(sfx, click(.02, 900), ST[2]+.2+k/(2*ph), .2); k += 1
add(sfx, ding(1400, .6)*.4, ST[2]+3.1, .25)
# scene 4: clock ticks + heartbeat
for s in range(int(D[3])):
    add(sfx, click(.03, 2600 if s % 2 else 2000), ST[3]+s, .5)
tcur = 0.4
while tcur < D[3]-.6:
    per = 1.0 - .25*tcur/D[3]
    add(sfx, thump(58, .3, 25), ST[3]+tcur, 1.0); add(sfx, thump(52, .3, 20), ST[3]+tcur+.22, .7)
    tcur += per
tj = tp(4, "Entrava")
add(sfx, thump(70, .25, 40)*1.2, ST[3]+tj+.9, .9)
add(sfx, whoosh(.5, 30), ST[3]+tj-.1, .3)
# scene 5: phone ring, pop, running steps
for off in (.15, 1.15): add(sfx, ring(.7), ST[4]+off, .55)
tb = tp(5, "a equipe passou"); add(sfx, (np.sin(2*np.pi*(500+800*tt(.12))*tt(.12))*np.exp(-tt(.12)*30)), ST[4]+tb, .5)
tf = tp(5, "Para dar tempo")
for k in range(10): add(sfx, thump(100, .1, 50)*.6, ST[4]+tf+.3+k*.26, .5); 
# scene 6
tj6, tb6, t50, t100 = tp(6, "Em dois"), tp(6, "Virou livro"), tp(6, "cinquenta"), tp(6, "Algumas")
add(sfx, whoosh(.7, 20), ST[5]+tj6, .55); add(sfx, whoosh(.7, 20), ST[5]+tb6, .55)
for tx, f in ((tj6+.8, 660), (t50, 784), (t100, 988)): add(sfx, ding(f, .7), ST[5]+tx, .5)
# scene 7: eerie shimmer
tm = tp(7, "Talvez")
for k, f in enumerate((1318, 1760, 1568, 2093, 1760)):
    tt_ = tt(1.6); add(sfx, np.sin(2*np.pi*f*tt_+2*np.sin(2*np.pi*5*tt_))*np.exp(-tt_*2.2)*.5, ST[6]+tm+k*.3, .13)
add(mus, (np.sin(2*np.pi*185*t[:int(D[6]*SR)])*np.sin(np.pi*np.linspace(0, 1, int(D[6]*SR))))*.03, ST[6], 1)
# scene 8: lamp click + pad
tb8 = tp(8, "Mas, nas")+0.0
add(sfx, click(.05, 1200), ST[7]+D[7]-3.3, 1.2); add(sfx, thump(80,.2,10), ST[7]+D[7]-3.3, .3)
tp8 = tt(D[7]+1)
pad = sum(np.sin(2*np.pi*f*tp8) for f in (220, 261.63, 329.63, 164.8))*.02
add(mus, pad*np.minimum(1, tp8/2.5)*np.minimum(1, (D[7]+1-tp8)/2.5), ST[7], 1)

# ===== novas cenas
for nm in ('sceneD', 'sceneA', 'sceneE', 'sceneC'):
    add(sfx, whoosh(.5, 60), S[nm]-.05, .35)
# D: marcador riscando + interrogação
for k in range(19):
    sc = lp(noise(.12), 6)*np.exp(-tt(.12)*14)*3; add(sfx, sc, S['sceneD']+.7+k*.2, .5)
for j, f in enumerate((392, 466)):
    add(sfx, ding(f, .8), S['sceneD']+4.6+j*.28, .35)
add(mus, (np.sin(2*np.pi*98*tt(7.5))*np.sin(np.pi*np.linspace(0, 1, int(7.5*SR))))*.05, S['sceneD'], 1)
# A: coração desacelerando até parar + pad
tcur, per = .5, 1.0
while tcur < 8.5-2.6:
    add(sfx, thump(55, .3, 25), S['sceneA']+tcur, .9); add(sfx, thump(50, .3, 20), S['sceneA']+tcur+.25, .6)
    per *= 1.12; tcur += per
padA = tt(8.5)
add(mus, sum(np.sin(2*np.pi*f*padA) for f in (196, 233.1, 293.7))*.025*np.sin(np.pi*np.linspace(0, 1, len(padA)))**1.2, S['sceneA'], 1)
# E: ronronar + passos suaves
pur = lp(noise(7.5), 40)*(.5+.5*np.sin(2*np.pi*24*tt(7.5)))*np.sin(np.pi*np.linspace(0, 1, int(7.5*SR)))
add(mus, pur*1.2, S['sceneE'], .09)
k = 0
while .3 + k/2.5 < 7.5-.6:
    add(sfx, thump(100, .12, 50)*.4, S['sceneE']+.3+k/2.5, .4); k += 1
# C: vento, chuva leve, pá e terra
Dc = 10.0
wind = lp(noise(Dc), 120)*3*(.6+.4*np.sin(2*np.pi*tt(Dc)/4))
add(mus, wind*np.sin(np.pi*np.linspace(0, 1, len(wind)))**.6, S['sceneC'], .13)
rain = (noise(Dc)-lp(noise(Dc), 6))*.35
add(mus, rain*np.sin(np.pi*np.linspace(0, 1, len(rain)))**.6, S['sceneC'], .05)
add(sfx, lp(noise(3.9), 25)*3*np.exp(-tt(3.9)*.6)*(0.5+0.5*np.sin(2*np.pi*tt(3.9)*3.3)), S['sceneC']+.3, .06)
for kk in range(4):
    t0 = S['sceneC'] + .6 + kk*2.7
    add(sfx, (noise(.28)-lp(noise(.28), 8))*np.exp(-tt(.28)*10)*1.2, t0+.1, .35)   # raspa
    tl_ = t0 + 1.45 + .42
    add(sfx, thump(70, .35, 30)*1.0 + lp(noise(.3), 10)[:int(.35*SR)].tolist().__len__()*0, tl_, .8)
    add(sfx, (noise(.4)-lp(noise(.4), 4))*np.exp(-tt(.4)*14)*.8, tl_, .35)  # terra caindo
add(sfx, thump(45, 1.2, 30), S['sceneC']+4.2, .6)  # caixão assenta
padC = tt(Dc)
add(mus, sum(np.sin(2*np.pi*f*padC) for f in (220, 261.63, 329.63, 174.6))*.022*np.sin(np.pi*np.linspace(0, 1, len(padC))), S['sceneC'], 1)

mix = nar + mus*1.0 + sfx*0.9
mix = mix/np.max(np.abs(mix))*1.0
mix = np.tanh(mix*1.6)*.9
pcm = (np.clip(mix, -1, 1)*32767).astype(np.int16)
w = wave.open('mix.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('mix', round(len(pcm)/SR, 1), 's')
