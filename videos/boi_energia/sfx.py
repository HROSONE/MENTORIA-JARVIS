"""Som do Short "A carne que ainda se mexe" (sem narração, sem música), só com gravações reais CC0:
- pasto: Horse eating grass 0986/0990 (BigSoundBank: arranca e mastiga capim), mugido 2383;
- digestão: commons/Swallowing_gulp e água nas pedras bem abafada (rúmen);
- abate: qubodupImpactMetal (o dardo cativo) + Body Fall 2452/2453 com grave curto;
- açougue: qubodupImpactMeat01/02 (cutelo na carne) + qubodupImpactWood (tábua);
- carne viva: impactsplat/squish (OpenGameArt) bem baixos, cada vez mais raros até sumir;
- transições: woosh 1796/1800 baixos. Sem estalos sintéticos e sem bipes (o dono achou os sons ruins).
Uso: python3 sfx.py [saida.wav]"""
import sys, numpy as np
sys.path.insert(0, '../biblioteca3d/sons'); from mesa import Mesa, grave
C, O = '../biblioteca3d/sons/commons/', '../biblioteca3d/sons/oga/'
DUR = 55.0
T_TIRO, GOLPES = 23.6, [28.0, 29.0, 30.0, 31.0, 32.0, 33.0]
R = np.random.default_rng(7)
m = Mesa(DUR)
molhados = [O + f'impactsplat0{i}.ogg' for i in (1, 2, 3, 4, 6, 7, 8)] + [O + f'squish_0{i}.ogg' for i in (2, 3, 4, 5, 6)]

def carne_viva(t0, t1, densidade, db0, lp=2500):
    """estalidos molhados da carne se contraindo (abalos), mais raros e baixos conforme a energia acaba"""
    t = t0
    while t < t1:
        k = (t - t0) / max(1e-3, t1 - t0); dens = densidade(k)
        if dens <= 0.02: break
        m.por(molhados[R.integers(len(molhados))], float(t), db0 + 20 * np.log10(max(dens, 1e-3)) - R.uniform(0, 5), dur=0.35, lp=lp, pan=float(R.uniform(-0.3, 0.3)), vel=float(R.uniform(0.85, 1.15)))
        t += R.uniform(0.25, 0.6) / max(dens, 0.15)

# gancho: a carne viva (o tremor é forte aqui)
carne_viva(0.05, 3.4, lambda k: 1.0, -24)
m.passagem('1800', 3.5, dur=0.7, db=-22, de=0.5, para=-0.5)
# pasto: o boi arranca e mastiga o capim (gravação real), mugido distante
m.por('0986', 3.6, -15, ini=4.0, dur=2.9, lp=6000, ataque=0.3, pan=0.15)
m.por('0990', 6.5, -10, ini=2.0, dur=3.1, lp=7000, ataque=0.1, pan=0.1)                    # close da boca: mais perto e mais alto
m.por('2383', 4.1, -14, espaco='rua', pan=0.3)
# digestão: engole, o bolo desce, o rúmen borbulha
m.por(C + 'Swallowing_gulp.ogg', 10.4, -11)
m.por(C + 'Swallowing_gulp.ogg', 12.7, -18, lp=600)
m.por(C + 'Water_over_rocks_as_tide_recedes.ogg', 12.7, -26, ini=3.0, dur=2.8, lp=500, ataque=0.5, soltura=0.7)
m.passagem('1796', 15.85, dur=0.6, db=-20)
# células: o sangue correndo no capilar (água abafadíssima, bem baixa)
m.por(C + 'Water_over_rocks_as_tide_recedes.ogg', 16.0, -32, ini=8.0, dur=6.0, lp=350, ataque=0.8, soltura=1.0)
# abate: um instante de silêncio, o dardo cativo, os joelhos cedem, o corpo tomba
m.silencio(T_TIRO - 0.5, T_TIRO, 0.15)
m.por(O + 'qubodupImpactMetal.ogg', T_TIRO, -10, lp=5000)
m.por('2452', T_TIRO + 0.85, -10, espaco='rua')
m.por('2453', T_TIRO + 1.75, -7, espaco='rua'); m.por(grave(42, 0.7, 5), T_TIRO + 1.75, -14)
# açougue: o cutelo entra na carne e bate na tábua
for k, t in enumerate(GOLPES):
    m.por(O + ('qubodupImpactMeat01.ogg' if k % 2 == 0 else 'qubodupImpactMeat02.ogg'), t, -7, espaco='sala', pan=-0.2)
    m.por(O + 'qubodupImpactWood.ogg', t + 0.01, -15, espaco='sala', pan=-0.2, lp=4000)
carne_viva(26.6, 34.0, lambda k: 0.55, -28)
# a carne fervilhando: forte no começo, some perto de 1 hora
carne_viva(34.05, 39.0, lambda k: 1.0 - 0.3 * k, -21)
carne_viva(43.0, 47.0, lambda k: max(0.0, 0.45 - 0.42 * k), -24)
for t, nome in ((39.0, '1800'), (43.0, '1796'), (49.5, '1800'), (52.0, '1796')): m.passagem(nome, t, dur=0.5, db=-26)
m.finalizar(sys.argv[1] if len(sys.argv) > 1 else 'som.wav', media=-23.0)
