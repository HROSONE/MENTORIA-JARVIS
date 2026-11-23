# Estúdio de Vídeos — Hryz Animation (Shorts/Reels e Longos)

Animações verticais **1080×1920** (Shorts/Reels) e horizontais **1920×1080** feitas programaticamente em **Three.js (r160)** e **SVG**, renderizadas em MP4 via Playwright/Chromium + FFmpeg, com efeitos sonoros gerados/mixados em Python.

Os arquivos renderizados (`.mp4`, `.wav`, `.mp3`, `quadros/`) ficam fora do Git: todos os vídeos podem ser reproduzidos a partir dos códigos-fonte aqui.

Antes de criar um vídeo novo, consulte [DIRETRIZES.md](DIRETRIZES.md), [ESTILO.md](ESTILO.md) e [biblioteca3d/INVENTARIO.md](biblioteca3d/INVENTARIO.md).

---

## Infraestrutura compartilhada

- **[`core/`](core/README.md)** — núcleo reutilizável dos Shorts 3D:
  - `core/motor.js` (`criarMotor`, carregador GLB com cache, partículas `Rajada`, `tremor`, captura com borrão de movimento)
  - `core/util.js` (matemática, ruído, curvas `Caminho` e `chaves`)
  - `core/harness.js` (servidor local + Chromium SwiftShader interceptando `three@0.160.0`)
  - `core/render.js`, `core/quadros.js`, `core/tiro.js` (render paralelo e capturas de inspeção)
  - `core/montar.sh` (montagem FFmpeg com perfis `bloom`, `padrao` e `vivo`)
- **[`biblioteca3d/`](biblioteca3d/README.md)** — assets reutilizáveis (CC0 e originais do canal):
  - `cidade/` — kit urbano modular (111 peças, grade de 12 m) com detalhe procedural automático ligado em `Kit.carregar()`
  - `personagens/` — `elenco/` (20+ personagens com esqueleto, expressões faciais e animações, incluindo astronauta EMU), `corredor/` (silhueta e colorido) e `human.fbx`
  - `veiculos/` — ~50 `.glb` CC0 (Kenney), `maquina_tempo.js` e a réplica procedural em escala real da viatura **Ford Crown Victoria P71** (`veiculos/policia/viatura.js`)
  - `egito/`, `casas/`, `aviao/` — planalto de Gizé + Esfinge, 18 variantes de casas e `jato-hryz.glb`

---

## Projetos

### Shorts 3D modulares (Three.js + `core/` + `biblioteca3d/`)

| Vídeo | Pasta | Roteiro / Decupagem |
|---|---|---|
| O vulcão do milharal (Parícutin, 1943) | `vulcao_milharal/` | `vulcao_milharal/roteiro_vulcao.md` |
| Chuva de Peixes (Yoro, Honduras) | `chuva_peixes/` | `chuva_peixes/roteiro_chuva_peixes.md` |
| Mestres da Gravidade (cabras 3D) | `mestres_gravidade/` | `mestres_gravidade/roteiro_mestres_gravidade.md` |
| Viagem no futuro / encolhimento | `viagem_futuro/` | `viagem_futuro/roteiro_viagem_futuro.md` |
| Todos pulando ao mesmo tempo | `todos_pulando/` | `todos_pulando/roteiro_todos_pulando.md` |
| Sono militar (2 minutos) | `sono_militar/` | `sono_militar/roteiro_sono_militar.md` |
| O elevador | `elevador/` | `elevador/roteiro_elevador.md` |
| Anurag / A campainha | `anurag/` | `anurag/` |
| Larry (cadeira voadora 3D) | `larry3d/` | `larry3d/narr.json` |

### Projetos 2D em SVG (`svg/`)

- **Shorts recentes (pipeline modular `build.py` + `narr.json`):** `svg/cabra/`, `svg/terremoto/`, `svg/terremoto_carro/`, `svg/cafe/`, `svg/nasce_raio/`, `svg/pipoca/`, `svg/lagarta/`, `svg/dillinger/`, `svg/xadrez/`, `svg/alcatraz/`, `svg/alcatraz2/`, `svg/alcatraz3/`, `svg/mike/`, `svg/mike2/`, `svg/aviao/`, `svg/aviao2/`, `svg/aviao3/`, `svg/acordasse/`, `svg/chiclete/`, `svg/terminal/`, `svg/ferrari/`, `svg/onoda/`, `svg/coreia/`, `svg/cavalo/`, `svg/chave/`, `svg/elnino/`, `svg/elsie/`, `svg/gato/`, `svg/joquei/`, `svg/vulcao/`, `svg/cadeira/`, `svg/raio/`, `svg/anime/`.
- **Primeiros SVG e vídeos longos 16:9:** `svg/pegada.html`, `svg/gemeos.html`, `svg/zepto_src.html` (`build_zepto.py`), `svg/elef_src.html` (`build_elef.py`).

### Fase inicial (HTML monolítico, Stickmen e testes)

- Criaturas 3D iniciais: `mosca.html`, `dentadura.html`, `camaleao.html`, `polvo.html`, `camarao.html` (`roteiro_camarao.md`).
- Stickmen (`stick/`): `botoes_*`, `altura_*`, `portal_*`, `hw_*`, `raio_*` (`stick_core2.js` + `skin2.json`).
- Outros protótipos: `teen/` (`teen.glb`), `assets/` (`RobotExpressive.glb`, Quaternius CC0), `voo3d/`, `oscar/`, `homem_do_soluco/`.

---

## Instalação

Requisitos: **Node.js 20+**, **Python 3.10+** e **FFmpeg**.

```bash
npm install                        # instala three@0.160.0 e playwright
npm run setup:browser              # instala o Chromium do Playwright
pip install -r requirements.txt    # numpy, scipy, Pillow e soundfile
# Opcional (geradores 3D em biblioteca3d/*/gerador/):
pip install -r requirements-assets.txt
```

---

## Como renderizar e montar

### 1. Shorts 3D modernos (`vulcao_milharal`, `chuva_peixes`, `mestres_gravidade`)

```bash
cd vulcao_milharal

# Pré-visualizar quadros soltos (PNG)
node quadros.js teste 0 5 12

# Renderizar todos os quadros (4 trabalhadores em paralelo, 30 fps)
node render.js --trabalhadores 4

# Gerar áudio e montar o MP4 final (acabamento bloom + grão, ~20 MB)
python3 sfx_vulcao.py
bash montar.sh quadros vulcao_sfx.mp3 vulcao_milharal.mp4
```

Também é possível chamar o renderizador compartilhado diretamente de `videos/`:

```bash
node core/render.js --proj vulcao_milharal --trabalhadores 4
```

### 2. Shorts 3D que usam servidor HTTP manual (`sono_militar`, `todos_pulando`, `viagem_futuro`, `elevador`, `anurag`)

```bash
# Em um terminal dentro de videos/:
npm run serve    # sobe http://127.0.0.1:8777

# Em outro terminal:
cd sono_militar && node render.js --trabalhadores 3
python3 sfx_sono.py && bash montar.sh quadros sono_sfx.wav sono_militar.mp4
```

### 3. Vídeos 2D em SVG (`svg/`)

Use `render_svg.js` (captura direta via CDP, sem emular WebGL — 5–7× mais rápido):

```bash
# Vertical 9:16 (Shorts)
mkdir -p fr && for w in 0 1 2 3; do PAGE=svg/cabra/cabra.html FR=fr VW=1080 VH=1920 node render_svg.js $w 4 30 & done; wait

# Horizontal 16:9 (Longos)
mkdir -p fr && for w in 0 1 2 3; do PAGE=svg/elefantes.html FR=fr VW=1920 VH=1080 node render_svg.js $w 4 24 & done; wait
```

### 4. Projetos legados (`stick/`, `mosca.html`, `camarao.html`, etc.)

```bash
cd stick && python3 sfx_raio.py && ffmpeg -i raio_sfx.wav raio_sfx.mp3 && python3 build_raio.py && cd ..
mkdir -p fr && for w in 0 1 2 3; do PAGE=stick/raio.html FR=fr node render.js $w 4 30 & done; wait
ffmpeg -framerate 30 -i fr/f%05d.jpg -i stick/raio_sfx.wav -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -shortest raio.mp4
```

Para 16:9 nos legados, use `render169.js` e `shot169.js`. Para testes em GPU no Colab, veja `colab/teste_render_gpu.ipynb`.
