# Short do gato Oscar (fontes)

Animação 2D em SVG/HTML do gato Oscar, o gato do asilo de Providence que "previa" mortes. Shorts 1080 x 1920, 24 fps, 102,75 s, **só efeitos sonoros** (sem narração: a voz é gravada pelo dono do canal). O MP4 (`oscar_shorts.mp4`) não está na `main`; fica só na branch `ccr-ddaac555-8twb6u`.

## Ordem das cenas (`order.json`)

`scene1`, `scene2`, `scene3`, `scene4`, `sceneD` (o ceticismo), `scene5`, `sceneA` (a despedida), `sceneE` (os outros gatos), `scene6`, `sceneC` (o cemitério), `scene7`, `scene8`.

## Como foi feito

1. Cada cena é uma página HTML com SVG animado por uma função `setT(t)` (t em segundos). As páginas saem de `build.py` e `build2.py` (cenas e a página base), `newscenes.py` (despedida, ceticismo e os outros gatos), `cemiterio.py` + `cem_defs.txt` + `cem_body.txt` (cemitério: céu escuro, grama, caixão, coveiro com a pá). O gato com pelos está em `cats.py`; `helpers.py` e `gen.py` têm pessoas, barra de progresso e as fontes DejaVu.
2. `render_all.js <pasta> <trabalhador> <n>` tira os quadros JPG (Playwright + Chromium) chamando `setT(f / 24)`, seguindo `order.json`; `frames_multi*.js`, `renderN.js`, `render.js` e `frame.js` são variantes (vários processos em paralelo, só alguns quadros). `shot.js` fotografa uma página ou SVG.
3. `mix.py` e `mix2.py` sintetizam os efeitos sonoros (numpy) a partir de `timeline.json` e gravam um `.wav`. `tts.py` guarda o texto da narração sintética que foi removida; serve de referência de tempo.
4. ffmpeg junta os quadros (24 fps) com o áudio em H.264 + AAC.

Precisa de Python 3 com numpy, Node com `playwright` e ffmpeg. Os scripts usam caminhos relativos: rode dentro desta pasta (crie `frames/` antes de renderizar).
