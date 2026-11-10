"""Materiais do kit (cores chapadas, estilo low poly do Kenney). Cores em sRGB."""
from glb import Material

ASFALTO = Material('Asfalto', '#3d4147', rough=0.95)
MEIOFIO = Material('MeioFio', '#d8d5cc', rough=0.85)
CALCADA = Material('Calcada', '#bcb9af', rough=0.9)
CALCADA_LADO = Material('CalcadaLado', '#a19e95', rough=0.9)
FAIXA_BRANCA = Material('FaixaBranca', '#f4f3ee', rough=0.7)
FAIXA_AMARELA = Material('FaixaAmarela', '#f2b50c', rough=0.7)
GRAMA = Material('Grama', '#72b04f', rough=1.0)
TERRA = Material('Terra', '#8a6b4a', rough=1.0)

METAL = Material('Metal', '#8d9298', rough=0.5, metal=0.6)
METAL_ESCURO = Material('MetalEscuro', '#4a4f55', rough=0.55, metal=0.5)
PRETO = Material('Preto', '#232529', rough=0.6, metal=0.2)
PLACA_COSTAS = Material('PlacaCostas', '#9aa0a6', rough=0.6, metal=0.4)

VERMELHO_HIDRANTE = Material('HidranteVermelho', '#d1332c', rough=0.55, metal=0.15)
VERMELHO_HIDRANTE_ESCURO = Material('HidranteVermelhoEscuro', '#9f221e', rough=0.55, metal=0.15)
AMARELO_HIDRANTE = Material('HidranteAmarelo', '#f1bf1d', rough=0.55, metal=0.15)
AMARELO_HIDRANTE_ESCURO = Material('HidranteAmareloEscuro', '#b98a10', rough=0.55, metal=0.15)

CALCADA_B = Material('CalcadaB', '#b0ada3', rough=0.9)          # segundo tom das lajes (alterna com CALCADA)
POSTE = Material('PosteLuz', '#5d636a', rough=0.5, metal=0.5)
POSTE_BASE = Material('PosteLuzBase', '#3f444a', rough=0.55, metal=0.5)
LUMINARIA = Material('Luminaria', '#464b51', rough=0.5, metal=0.4)
