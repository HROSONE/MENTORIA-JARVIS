# Vídeos curtos (Shorts/Reels) — arquivos de projeto

Animações verticais 1080×1920 feitas em **Three.js** (3D) e **SVG** (2D), renderizadas em MP4 com efeitos sonoros sintetizados em Python.
Os vídeos (MP4) não estão aqui: dá para gerar todos de novo com estes arquivos.

## Projetos

| Vídeo | Arquivos | Roteiro |
|---|---|---|
| A mosca | `mosca.html` | — |
| A dentadura | `dentadura.html` | — |
| O camaleão | `camaleao.html` | — |
| O polvo | `polvo.html` | — |
| O camarão-louva-a-deus | `camarao_head.html` + `camarao_tail.html` (+ `reef_common.js`) → `camarao.html` | `roteiro_camarao.md` |
| Botões placebo | `stick/botoes_*` | `stick/roteiro_botoes.md` |
| Mais alto de manhã | `stick/altura_*` | `stick/roteiro_altura.md` |
| Gato e portais | `stick/portal_*`, `stick/sfx_portal.py` | — |
| Origem do Halloween | `stick/hw_*`, `stick/sfx_hw.py` | `stick/roteiro_halloween.md` |
| Atingido por um raio | `stick/raio_*`, `stick/sfx_raio.py` | `stick/roteiro_raio.md` |
| O soluço | `teen/soluco_*`, `teen/sfx_soluco.py` | `teen/roteiro_soluco.md` |
| Vale da estranheza (robô) | `assets/robo_*`, `assets/sfx_robo.py` | `assets/roteiro_robo.md` |
| A pegada na Lua (SVG) | `svg/pegada.html`, `svg/sfx_final.py` | `svg/roteiro_pegada.md` |
| O paradoxo dos gêmeos (SVG) | `svg/gemeos.html`, `svg/sfx_gemeos.py` | `svg/roteiro_gemeos.md` |

Personagens:
- `stick/stick_core2.js` + `stick/skin2.json` — stickmen com pele (gerada por `stick/skin_model2.py`).
- `teen/teen.glb` — o garoto de camisa vermelha (gerado por `teen/teen_model.py`).
- `assets/RobotExpressive.glb` — robô de Tomás Laulhé (Quaternius), licença CC0.

## Como gerar um vídeo

Requisitos: Node.js com Playwright/Chromium, Python 3 (numpy, scipy), ffmpeg.

```bash
npm install                      # instala three@0.160.0 (usado no render)

# 1) efeitos sonoros (gera *_sfx.wav)
cd stick && python3 sfx_raio.py && ffmpeg -i raio_sfx.wav raio_sfx.mp3 && cd ..

# 2) monta a página final (cabeça + núcleo + cauda + áudio embutido)
cd stick && python3 build_raio.py && cd ..

# 3) renderiza os quadros (4 processos em paralelo, 30 fps)
mkdir -p fr && for w in 0 1 2 3; do PAGE=stick/raio.html FR=fr node render.js $w 4 30 & done; wait

# 4) junta em MP4
ffmpeg -framerate 30 -i fr/f%05d.jpg -i stick/raio_sfx.wav -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -shortest raio.mp4
```

Os vídeos em SVG (`svg/pegada.html`, `svg/gemeos.html`) não precisam do passo 2: abra o HTML direto no navegador para ver a animação (ESPAÇO toca/pausa) ou renderize com `PAGE=svg/gemeos.html`.

Pré-visualizar quadros soltos: `PAGE=svg/gemeos.html OUT=shots node shot.js 1 5 10` e `python3 sheet.py shots folha.png 1 5 10`.
