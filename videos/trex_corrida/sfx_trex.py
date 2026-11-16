# Som do Short "Você fugiria de um T. rex?": rugido em camadas feito de animais reais (não existe gravação de T. rex; o do cinema também é
# montado assim), grito e respiração do trilheiro, pisadas gigantes, passos, galhos, mordida, mastigar, volta no tempo e a selva. Sem música.
# Gravações: BigSoundBank (CC0) em biblioteca3d/sons/bsb e domínio público do Wikimedia Commons em biblioteca3d/sons/commons (ver LISTA.md).
# uso: python3 sfx_trex.py saida.wav            (trilha inteira)      python3 sfx_trex.py teste.wav --so rugido   (só um rugido, para conferir)
import os, sys
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

if __name__ == '__main__':
    saida = sys.argv[1] if len(sys.argv) > 1 else 'sfx_trex.wav'
    if '--so' in sys.argv and sys.argv[sys.argv.index('--so') + 1] == 'rugido':
        m = Mesa(4.5); rugido(m, 0.3); m.finalizar(saida); sys.exit(0)
