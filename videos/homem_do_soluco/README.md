# Short do homem que soluçou por 68 anos (fontes)

Animação 2D em SVG/HTML da história de Charles Osborne (soluços de 1922 a 1990). Shorts 1080 x 1920, 24 fps, 75 s, **só efeitos sonoros** (sem narração: a voz é gravada pelo dono do canal). O roteiro com tempos, na versão em que a explicação só aparece no final, está em `../../roteiro_homem_do_soluco.md`. O MP4 (`homem_do_soluco.mp4`) não está na `main`; fica só na branch `ccr-ddaac555-8twb6u`.

## Cenas (`order.json`)

`a1` a `a10`, nessa ordem, com as durações de `order.json` e `cues.json` (esse também marca os instantes dos soluços e dos outros sons de cada cena).

## Como foi feito

1. `build_anim.py` monta as páginas `a1.html` a `a10.html` (SVG animado por `setT(t)`) a partir de `scenes_a.py`, `scenes2_a.py` e `props_a.py`; `scenes.py`, `scenes2.py` e `props.py` geram as imagens do storyboard (`sc1.svg` a `sc10.svg`), que foram aprovadas antes da animação. O personagem está em `hu.py` e o gato (pelos) em `cats.py`.
2. `render_all.js <pasta> <trabalhador> <n>` tira os quadros JPG (Playwright + Chromium) chamando `setT(f / 24)`; `renderS.js` renderiza só um SVG e `shot.js` fotografa um SVG.
3. `mix_hic.py` sintetiza os efeitos sonoros (numpy) a partir de `cues.json` e grava um `.wav`.
4. ffmpeg junta os quadros (24 fps) com o áudio em H.264 + AAC.

Precisa de Python 3 com numpy, Node com `playwright` e ffmpeg. Os scripts usam caminhos relativos: rode dentro desta pasta (crie `frames/` antes de renderizar).
