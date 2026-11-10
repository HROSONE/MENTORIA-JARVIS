import json, wave, numpy as np
SR = 44100
J = json.load(open('cues.json')); D = {int(k): v for k, v in J['D'].items()}; C = {int(k): v for k, v in J['CUES'].items()}
ST = {}; acc = 0
for k in range(1, 11): ST[k] = acc; acc += D[k]
TOTAL = acc + .3
rng = np.random.default_rng(7)
N = int(TOTAL*SR)
mus = np.zeros(N); sfx = np.zeros(N)

def add(buf, sig, t, g=1.0):
    a = int(t*SR)
    if a >= len(buf) or a + len(sig) <= 0: return
    s0 = max(0, -a); b = min(len(buf), a + len(sig))
    buf[a + s0:b] += sig[s0:b - a]*g
def tt(d): return np.arange(int(d*SR))/SR
def lp(x, k): return np.convolve(x, np.ones(k)/k, mode='same')
def noise(d): return rng.standard_normal(int(d*SR))
def bp(x, lo, hi): return lp(x, max(2, int(SR/hi/2))) - lp(x, max(3, int(SR/lo/2)))
def env_ar(n, a=.01, r=.1):
    e = np.ones(n); na = max(1, int(a*SR)); nr = max(1, int(r*SR)); e[:na] = np.linspace(0, 1, na); e[-nr:] = np.minimum(e[-nr:], np.linspace(1, 0, nr)); return e
def chirp(f0, f1, d, exp=False):
    t = tt(d); f = f0 + (f1-f0)*(t/d); return np.sin(2*np.pi*np.cumsum(f)/SR)

def hic(pitch=1.0, soft=1.0):
    d = .26; t = tt(d); ns = noise(d)
    inh = bp(ns, 1200, 3800)*np.exp(-((t-.035)/.03)**2)*5.0
    click = np.sin(2*np.pi*850*pitch*t)*np.exp(-t*260)*.5
    tv = np.maximum(t-.05, 0)
    f = 340*pitch*np.exp(-tv*5) + 110*pitch
    ph = 2*np.pi*np.cumsum(f)/SR
    voiced = sum(np.sin(k*ph)/k**1.2 for k in range(1, 8))*(t > .05)*np.exp(-tv*20)*(1-np.exp(-tv*400))
    return (inh + click + voiced*.9)*soft
def pop(f0=700, f1=1700, d=.05): return chirp(f0, f1, d)*np.exp(-tt(d)*70)*.8
def whoosh(d=.6, k=40, g=1.0):
    n = lp(noise(d), k)*4; return n*np.sin(np.pi*np.linspace(0, 1, len(n)))**2*g
def thump(f=55, d=.4, drop=30): t = tt(d); return np.sin(2*np.pi*(f+drop*np.exp(-t*18))*t)*np.exp(-t*8)
def click(d=.03, f=2200): t = tt(d); return np.sin(2*np.pi*f*t)*np.exp(-t*220)
def tick(f=1800): return click(.03, f)*.5 + bp(noise(.03), 1500, 4000)*np.exp(-tt(.03)*150)*.6
def bell(f0=440, d=2.5):
    t = tt(d); return sum(a*np.sin(2*np.pi*f0*r*t)*np.exp(-t*dec) for a, r, dec in ((1, 1, 1.6), (.6, 2.76, 2.4), (.4, 5.4, 3.5), (.25, 8.9, 5)))*.6
def voiced_snd(f0, d, harm=8, vib=0, jit=0, glide=0):
    t = tt(d); f = f0*(1 + glide*(t/d)) + vib*np.sin(2*np.pi*7*t)
    ph = 2*np.pi*np.cumsum(f)/SR; return sum(np.sin(k*ph)/k for k in range(1, harm))
def oink(pitch=1.0):
    d = .38; t = tt(d); f = (190 + 90*np.sin(t*40))*pitch*(1 + .4*np.exp(-t*8))
    ph = 2*np.pi*np.cumsum(f)/SR; v = sum(np.sin(k*ph)/k for k in range(1, 10))
    nasal = bp(v, 400, 1400)*3 + v*.3
    return nasal*env_ar(len(t), .02, .15)*.8 + bp(noise(d), 300, 900)*.3*np.exp(-t*8)
def squeal(d=.55):
    t = tt(d); f = 900 + 700*np.sin(np.pi*t/d) + 40*np.sin(t*90)
    ph = 2*np.pi*np.cumsum(f)/SR; return (np.sin(ph) + .5*np.sin(2*ph) + .3*np.sin(3*ph))*env_ar(len(t), .02, .2)*.5
def grunt(d=.45):
    t = tt(d); v = voiced_snd(105*np.exp(-t*.6), d, 10, vib=3)
    return lp(v, 5)*env_ar(len(t), .06, .2)*.7 + bp(noise(d), 200, 700)*.25*env_ar(len(t), .1, .2)
def crowd(d=1.4, laugh=True):
    t = tt(d); n = bp(noise(d), 500, 2600)
    mod = (.55 + .45*np.sin(2*np.pi*(6.5 if laugh else 20)*t + np.cumsum(rng.standard_normal(len(t))*.002)))**2
    return n*mod*np.sin(np.pi*np.linspace(0, 1, len(t)))**.7*3.0
def pad(freqs, d, a=1.5, r=1.5, g=.05):
    t = tt(d); s = sum(np.sin(2*np.pi*f*t + i)*(1 + .1*np.sin(2*np.pi*(.2+.03*i)*t)) for i, f in enumerate(freqs))/len(freqs)
    return s*env_ar(len(t), a, r)*g
def chirp_bird(d=.18):
    t = tt(d); f0 = rng.uniform(2200, 3800); f = f0 + 900*np.sin(np.pi*t/d*rng.choice([1, 2, 3])) ; ph = 2*np.pi*np.cumsum(f)/SR
    return np.sin(ph)*env_ar(len(t), .01, .06)*.3

# ---------------- global bed: low drone
tg = np.arange(N)/SR
bed = (np.sin(2*np.pi*55*tg) + .6*np.sin(2*np.pi*82.4*tg+1) + .3*np.sin(2*np.pi*110*tg))*(.75 + .25*np.sin(2*np.pi*tg/9))
mus += bed*.035*np.minimum(1, tg/2)*np.minimum(1, (TOTAL - tg)/2)

# ---------------- transitions
for k in range(2, 11): add(sfx, whoosh(.5, 60), ST[k]-.08, .3)

# ---------------- S1
s = ST[1]
add(sfx, whoosh(.7, 140)*np.linspace(0, 1, int(.7*SR))**2, s, .6)
add(sfx, thump(48, 1.1, 40)*1.4, s+.62, .9)
for i, h in enumerate(C[1]['H']):
    add(sfx, hic(1.0 + .04*i), s+h, .95)
    add(sfx, thump(70, .25, 30), s+h-.01, .55)
add(sfx, bell(660, 1.8), s+2.2, .22); add(sfx, thump(60, .5, 40), s+2.2, .7)
add(sfx, whoosh(.4, 50), s+2.7, .25)

# ---------------- S2 farm
s = ST[2]; d = D[2]
wind = lp(noise(d), 150)*3*(.55 + .45*np.sin(2*np.pi*tt(d)/5)); add(mus, wind*np.sin(np.pi*np.linspace(0, 1, len(wind)))**.5, s, .12)
cr = (np.sin(2*np.pi*4300*tt(d))*(np.sin(2*np.pi*17*tt(d)) > .3)*(np.sin(2*np.pi*.8*tt(d)) > -.2)); add(mus, cr*.5, s, .015)
for h in C[2]['G']: add(sfx, grunt(), s+h-.1, .55)
for h in C[2]['O']: add(sfx, oink(1.0 + .08*h/5), s+h, .5)
n0, n1 = C[2]['N0'], C[2]['N1']; x = n0; i = 0
while x < n1:
    add(sfx, tick(1500 + 40*i), s+x, .35); x += .13 + .05*(i/40); i += 1
for tcr in (2.0, 4.4): add(sfx, bp(noise(.7), 300, 700)*np.sin(np.pi*np.linspace(0, 1, int(.7*SR)))*(.5 + .5*np.sin(2*np.pi*9*tt(.7))), s+tcr, .35)
add(sfx, thump(75, .3, 20)*.6, s+6.9, .5)

# ---------------- S3 fall
s = ST[3]; TF = C[3]['TF']
add(mus, lp(noise(TF+.2), 200)*3*np.linspace(0, 1, int((TF+.2)*SR))**2, s, .09)
add(sfx, whoosh(.5, 25), s+TF-.08, .5)
add(sfx, thump(55, .9, 35)*1.3, s+TF+.18, .9); add(sfx, bp(noise(.5), 200, 1200)*np.exp(-tt(.5)*7)*3, s+TF+.18, .5)
add(sfx, squeal(.55), s+TF+.05, .55)
add(sfx, (noise(.5)*(.5 + .5*np.sign(np.sin(2*np.pi*22*tt(.5))))*np.exp(-tt(.5)*4))*.25, s+TF+.1, .25)
add(sfx, hic(1.05), s+TF+.14, 1.0)
add(sfx, chirp(220, 90, .35)*np.exp(-tt(.35)*6)*1.0, s+TF+.2, .4)
add(sfx, np.sin(2*np.pi*3100*tt(2.2))*np.exp(-tt(2.2)*2.2), s+TF, .05)
for h in C[3]['H']: add(sfx, hic(1.0), s+h, .8)

# ---------------- S4 brain
s = ST[4]; d = D[4]
x = .3
while x < d-.8:
    add(sfx, chirp(260, 900, .8)*env_ar(int(.8*SR), .1, .35)*.5, s+x, .09); x += 2.3
for h in C[4]['H']:
    add(sfx, hic(.95, .8), s+h, .6); add(sfx, thump(58, .3, 25), s+h, .8); add(sfx, thump(50, .3, 20), s+h+.22, .55); add(sfx, bell(1760, .9)*.5, s+h, .16)
for j in range(14): add(sfx, pop(1200 + rng.uniform(0, 1400), 800, .04)*.5, s+.8+rng.uniform(0, d-1.5), .22)
add(mus, pad([98, 146.8, 196, 233.1], d, 1.2, 1.2, .5), s, .06)

# ---------------- S5 night
s = ST[5]; d = D[5]
for sec in range(int(d)): add(sfx, tick(2200 if sec % 2 else 1700), s+sec, .35)
cr = (np.sin(2*np.pi*3900*tt(d))*(np.sin(2*np.pi*14*tt(d)) > .2)*(np.sin(2*np.pi*.6*tt(d)) > 0)); add(mus, cr, s, .02)
add(mus, lp(noise(d), 200)*2.4*np.sin(np.pi*np.linspace(0, 1, int(d*SR)))**.5, s, .07)
for i, h in enumerate(C[5]['H']):
    add(sfx, hic(.9 + .03*i, .9), s+h, .9); add(sfx, pop(600, 1500, .06), s+h+.12, .45)
add(sfx, bp(noise(.9), 200, 600)*np.sin(np.pi*np.linspace(0, 1, int(.9*SR))), s+3.4, .2)
add(mus, pad([110, 165, 220, 261.6], d, 1.6, 1.6, .5), s, .05)

# ---------------- S6 cures
s = ST[6]; Cc = C[6]
add(sfx, whoosh(.6, 30), s+Cc['TA'], .45); add(sfx, whoosh(.6, 30), s+Cc['TB'], .45); add(sfx, whoosh(.6, 30), s+Cc['TC'], .45)
x = Cc['TA']+.2
while x < Cc['TB']+.3:
    add(sfx, bp(noise(.14), 120, 700)*np.exp(-tt(.14)*22)*4, s+x, .5); add(sfx, thump(70, .12, 20)*.5, s+x, .35); x += .27
w = (chirp(523, 530, 1.1) + chirp(659, 666, 1.1))*(1 + .05*np.sin(2*np.pi*6*tt(1.1)))*env_ar(int(1.1*SR), .08, .35); add(sfx, w, s+Cc['WHISTLE'], .22)
add(mus, lp(noise(3.3), 40)*1.6*np.sin(np.pi*np.linspace(0, 1, int(3.3*SR))), s+Cc['TA'], .06)
x = Cc['TS']
add(sfx, (bp(noise(.7), 150, 5000)*np.exp(-tt(.7)*9))*4, s+x, 1.0); add(sfx, thump(60, .7, 50)*1.6, s+x, 1.0)
add(sfx, np.sin(2*np.pi*3300*tt(2.5))*np.exp(-tt(2.5)*2.2), s+x, .05)
add(sfx, chirp(380, 760, .28)*env_ar(int(.28*SR), .02, .1)*.9 + lp(noise(.28), 6)*.2, s+x+.08, .45)
add(sfx, (noise(.6)*(.5 + .5*np.sign(np.sin(2*np.pi*20*tt(.6))))*np.exp(-tt(.6)*3))*.3, s+x+.25, .3)
for k in range(16):
    add(sfx, bp(noise(.07), 3000, 7000)*np.exp(-tt(.07)*40)*4, s+Cc['TC']+.35+k*.07 + rng.uniform(0, .03), .35)
x = Cc['TSTAMP']
add(sfx, thump(80, .35, 30)*1.4, s+x, .85); add(sfx, click(.04, 1200), s+x, .6); add(sfx, bp(noise(.2), 200, 2000)*np.exp(-tt(.2)*20)*3, s+x, .4)

# ---------------- S7 kitchen
s = ST[7]; d = D[7]
hum = (np.sin(2*np.pi*60*tt(d)) + .5*np.sin(2*np.pi*120*tt(d)))*.4; add(mus, hum*np.sin(np.pi*np.linspace(0, 1, len(hum)))**.4, s, .05)
for sec in range(int(d)): add(sfx, tick(1500 if sec % 2 else 1200), s+sec+.5, .12)
for k in range(8): add(sfx, pop(520 + k*40, 1200 + k*60, .05), s+.5+k*.28, .35)
for i, h in enumerate(C[7]['H']): add(sfx, hic(1.0 + .03*i, .85), s+h, .85)
b0, b1 = C[7]['B0'], C[7]['B1']; bd = b1 - b0; tb = tt(bd)
f = 110 + 120*np.minimum(1, tb/.8) - 90*np.maximum(0, (tb-(bd-.8))/.8)
ph = 2*np.pi*np.cumsum(f)/SR
motor = (np.sin(ph) + .5*np.sin(2*ph) + .3*np.sin(3*ph))*(1 + .15*np.sin(2*np.pi*13*tb)) + bp(noise(bd), 1500, 5000)*.6
add(sfx, motor*env_ar(len(tb), .25, .8)*.5, s+b0, .45)

# ---------------- S8 TV
s = ST[8]; d = D[8]
add(sfx, bp(noise(.5), 1500, 6000)*np.exp(-tt(.5)*6)*5, s, .5)
add(mus, np.sin(2*np.pi*60*tt(d))*.6 + bp(noise(d), 3000, 6000)*.04, s, .05)
for i, h in enumerate(C[8]['H']):
    add(sfx, hic(.85, .6), s+h, .7); add(sfx, crowd(1.5), s+h+.15, .5); add(sfx, bp(noise(.5), 1200, 5000)*np.exp(-tt(.5)*6)*3, s+h+.15, .3)
add(sfx, crowd(2.2, False), s+.8, .12)
add(mus, pad([196, 246.9, 293.7], d, 1.2, 1.2, .5), s, .04)

# ---------------- S9 silence
s = ST[9]; d = D[9]; TR_ = C[9]['TREL']
add(sfx, hic(.9, .8), s+.9, .8)
add(sfx, whoosh(.5, 25), s+1.4, .35)
for sec in range(2, int(d)): add(sfx, tick(2000 if sec % 2 else 1600), s+sec+.2, .6)
for k in range(10): add(sfx, chirp_bird(), s+3.0+k*.5 + rng.uniform(0, .3), .5)
for k in range(3): add(sfx, pop(500, 800, .08)*.8, s+3.2+k*.55, .3)
add(sfx, chirp(300, 1800, 1.6)*env_ar(int(1.6*SR), .6, .5)*.5, s+TR_-.3, .1)
chord = pad([261.6, 329.6, 392, 523.3, 659.3], d-TR_+1.0, 1.4, 2.0, .6)
add(mus, chord, s+TR_, .18); add(sfx, bell(1046.5, 3.0), s+TR_+.2, .18)

# ---------------- S10 sunset
s = ST[10]; d = D[10]
wind = lp(noise(d), 120)*3.4*(.6 + .4*np.sin(2*np.pi*tt(d)/3.5)); add(mus, wind*np.sin(np.pi*np.linspace(0, 1, len(wind)))**.5, s, .14)
add(sfx, bell(523.3, 3.2), s+C[10]['T1'], .22); add(sfx, bell(392, 3.5), s+C[10]['T2'], .22)
for k in range(5): add(sfx, chirp_bird(), s+.5+k*1.3 + rng.uniform(0, .4), .35)
add(mus, pad([174.6, 220, 261.6, 349.2], d, 1.2, 2.5, .6), s, .2)

mix = mus + sfx
pk = np.max(np.abs(mix)); mix = np.tanh(mix/pk*1.5)*.88
mix *= np.minimum(1, (TOTAL - tg)/1.2)
pcm = (mix*32767).astype(np.int16)
w = wave.open('mix_hic.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes()); w.close()
print('mix', round(len(pcm)/SR, 1), 's  peak-before', round(float(pk), 2))
