"""Som do Short "Encher pneu com fogo" (sem narração, sem música), só com gravações reais CC0 (BigSoundBank e OpenGameArt):
- spray: 0048/0043 (aerossol); isqueiro: 2131 (isqueiro acendendo);
- o "uuf" do vapor pegando fogo: 0057 (boca de fogão a gás acendendo) + 1340 (incêndio de gasolina, o começo);
- a frente de fogo correndo no anel: 1340 abafado; o estalo do talão: 1808 + qubodupImpactMetal + grave curto;
- o ar: 1486 (vazamento de ar) no calibrador e 1487 (compressor) de longe; o estouro simulado: 1808 + 1023 + metal;
- transições: woosh 1796/1800 baixos. Sem tremor e sem bipes.
Uso: python3 sfx.py [saida.wav]"""
import sys
sys.path.insert(0, '../biblioteca3d/sons'); from mesa import Mesa, grave
O = '../biblioteca3d/sons/oga/'
DUR = 45.0
T_POP0, T_FLICK, T_UUF, T_FRENTE, T_POP, T_ESTOURO = 0.8, 14.6, 15.0, 15.8, 21.6, 34.2
T_POP_LOOP = 41 + T_POP0 + 0.6
m = Mesa(DUR)

def estalo(t, forte=1.0):
    """o talão batendo na aba do aro: estalo seco + metal + grave curto, com o 'uuf' do fogo logo antes"""
    m.por('0057', t - 0.17, -12, ini=2.1, dur=0.8, lp=5000)
    m.por('1808', t, -4 + 4 * (forte - 1), espaco='sala')
    m.por(O + 'qubodupImpactMetal.ogg', t + 0.005, -10, lp=3500, espaco='sala')
    m.por(grave(48, 0.5, 6), t, -10 + 4 * (forte - 1))
    m.por('1340', t + 0.05, -18, ini=0.3, dur=2.2, lp=3000, ataque=0.05, soltura=1.2)   # o fogo saindo pela fresta e apagando

# gancho: o estalo
estalo(T_POP0)
m.passagem('1800', 2.85, dur=0.6, db=-22, de=0.5, para=-0.5)
# premissa: a lata chacoalha e borrifa na fresta
m.por(O + 'qubodupImpactMetal.ogg', 3.6, -30, lp=2500)
m.por('0048', 4.0, -14, ini=0.0, dur=1.35, pan=-0.2)
m.por('0048', 5.45, -13, ini=2.1, dur=1.2, pan=-0.1)
m.por('0043', 6.7, -15, ini=4.2, dur=0.75, pan=-0.1)
m.passagem('1796', 7.9, dur=0.5, db=-24)
# mistura (corte): o vapor se espalhando, um chiado bem baixo
m.por('0043', 8.2, -30, ini=2.0, dur=0.7, lp=1200, ataque=0.3, soltura=0.4)
m.por('1486', 8.6, -33, ini=5.0, dur=5.0, lp=1400, ataque=1.0, soltura=1.2)                     # o vapor se espalhando no pneu (sopro abafado)
m.passagem('1800', 13.85, dur=0.5, db=-24)
# acende: o isqueiro, o "uuf" e a frente de fogo dando a volta
m.por('2131', T_FLICK - 0.12, -10, pan=-0.15)
m.por('0057', T_UUF - 0.1, -9, ini=2.1, dur=1.2, lp=6000)
m.por('1340', T_UUF + 0.05, -16, ini=0.0, dur=1.0, lp=4000, soltura=0.4)
m.por('1340', T_FRENTE - 0.2, -13, ini=0.4, dur=3.0, lp=2500, ataque=0.6, soltura=0.5)
# pressão: o fogo ruge dentro, a pressão sobe, POP; a fumaça sai
m.por('1340', 19.0, -14, ini=3.0, dur=2.7, lp=1800, ataque=0.3, soltura=0.2)
estalo(T_POP, 1.2)
m.por('3322', 22.4, -24, ini=8.0, dur=4.2, lp=4000, ataque=0.2, soltura=1.5)                    # o resto do fogo estalando e apagando
# esfria: o gás esfria, silêncio; o compressor entra e o ar chia no calibrador
m.por('1487', 28.6, -26, ini=6.0, dur=3.3, lp=3000, ataque=0.6, soltura=0.4, espaco='sala')
m.por('1486', 29.15, -17, ini=2.0, dur=2.7, ataque=0.05, soltura=0.3)
# perigo (simulação): pressão demais, o pneu estoura e o aro voa
m.passagem('1796', 31.9, dur=0.6, db=-20)
m.silencio(T_ESTOURO - 0.6, T_ESTOURO, 0.15)
m.por('1808', T_ESTOURO, 0, espaco='sala')
m.por('1023', T_ESTOURO, -6, dur=3.5, soltura=1.5)
m.por(grave(38, 1.0, 5), T_ESTOURO, -6)
m.por(O + 'qubodupImpactMetal.ogg', T_ESTOURO + 0.01, -8, espaco='sala')
m.passagem('1800', T_ESTOURO + 0.3, dur=0.8, db=-16, de=0.0, para=0.6)
m.por(O + 'qubodupImpactMetal.ogg', 36.75, -14, lp=4000, espaco='sala', pan=-0.6)   # o aro caindo longe
m.por(O + 'qubodupImpactMetal.ogg', 37.05, -20, lp=3000, espaco='sala', pan=-0.6)
# loop: de volta ao começo
m.passagem('1796', 40.9, dur=0.5, db=-24)
estalo(T_POP_LOOP)
m.finalizar(sys.argv[1] if len(sys.argv) > 1 else 'som.wav', media=-20.0)
