# MENTORIA-JARVIS · Estúdio Hryz Animation

Repositório que reúne a landing page da **Mentoria Jarvis OS** na raiz e o **estúdio programático de animações 2D (SVG) e 3D (Three.js)** do canal **Hryz Animation** em `videos/`.

## Estrutura do repositório

```text
.
├── index.html                  # Landing page da Mentoria Jarvis OS (Tailwind + Alpine.js)
├── CLAUDE.md                   # Regras obrigatórias de criação e direção de vídeo
├── roteiro_homem_do_soluco.md  # Roteiro histórico na raiz (versões de produção ficam em videos/)
└── videos/                     # Estúdio de produção de vídeos (Shorts 9:16 e longos 16:9)
    ├── DIRETRIZES.md           # Playbook do canal (retenção, visual, som, fatos, entrega)
    ├── ESTILO.md               # Gramática de câmera, direção de cena e aprendizados
    ├── core/                   # Núcleo compartilhado de Shorts 3D (motor, util, harness, render, montar.sh)
    ├── biblioteca3d/           # Assets 3D reutilizáveis (cidade, elenco, veículos, Egito, casas, jato)
    ├── svg/                    # Projetos 2D em SVG (Shorts e documentários 16:9)
    └── <nome_do_short>/        # Projetos 3D em Three.js (ex.: vulcao_milharal, chuva_peixes, mestres_gravidade)
```

## Início rápido (produção de vídeos)

Requisitos: **Node.js 20+**, **Python 3.10+** e **FFmpeg**.

```bash
cd videos
npm install                        # instala three@0.160.0 e playwright
npm run setup:browser              # baixa o Chromium usado pelo Playwright
pip install -r requirements.txt    # numpy, scipy, Pillow e soundfile (SFX e folhas de contato)
```

Para scripts que geram malhas/personagens 3D em Python (`biblioteca3d/*/gerador/`):

```bash
pip install -r requirements-assets.txt
```

### Renderizar e montar um Short 3D (exemplo: `vulcao_milharal`)

```bash
cd videos/vulcao_milharal
node render.js --trabalhadores 4
python3 sfx_vulcao.py
bash montar.sh quadros vulcao_sfx.mp3 vulcao_milharal.mp4
```

Para mais detalhes de pipeline, projetos e bibliotecas, veja:
- [videos/README.md](videos/README.md) — guia técnico e catálogo de projetos
- [videos/core/README.md](videos/core/README.md) — módulos compartilhados dos Shorts 3D
- [videos/biblioteca3d/INVENTARIO.md](videos/biblioteca3d/INVENTARIO.md) — inventário completo de assets 3D e 2D
- [videos/DIRETRIZES.md](videos/DIRETRIZES.md) e [videos/ESTILO.md](videos/ESTILO.md) — diretrizes editoriais e de direção
