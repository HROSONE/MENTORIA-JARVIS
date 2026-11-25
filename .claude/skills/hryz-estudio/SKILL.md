---
name: hryz-estudio
description: Guia completo do projeto MENTORIA-JARVIS (canal Hryz Animation + jogo Hryz City). Use ao criar ou mexer em vídeos (Shorts 2D em SVG ou 3D em Three.js), renderizar quadros, montar MP4, criar modelos (Blender por script, elenco de personagens em Python, veículos procedurais em Three.js), mexer no jogo Hryz City (jogo/), ou quando precisar saber como o projeto é feito, quais tecnologias usa, o jeito mais rápido de fazer algo e as descobertas já feitas (ex.: render 20x mais rápido com Mesa llvmpipe).
---

# Estúdio Hryz: como o projeto funciona

Repositório com três coisas:
1. **Vídeos do canal Hryz Animation** (`videos/`): Shorts 9:16 e longos 16:9, feitos 100% em código. Há dois tipos: 2D em SVG e 3D em Three.js.
2. **Biblioteca 3D reutilizável** (`videos/biblioteca3d/`): personagens com esqueleto e rosto que mexe, veículos, cidade, cenários, sons, mocap e armas.
3. **Jogo Hryz City** (`index.html` + `jogo/`): mundo aberto em Three.js publicado na Vercel. Tem carros, motos, máquinas de obra, missão com sniper, o herói Kael com poderes, etc.

Antes de qualquer vídeo, as regras do dono valem acima de tudo: `CLAUDE.md`, `videos/DIRETRIZES.md` e `videos/ESTILO.md`. Elas pedem pensar como diretor (decupagem antes de animar e mostrar ao dono), fatos com fonte, sem música, sem legenda salvo pedido, nunca commitar MP4 e teste de 3–5 s antes do render inteiro.

## Mapa rápido

| Quero… | Onde / como | Detalhes |
|---|---|---|
| Fazer um Short 3D | pasta nova `videos/<nome>/` com `index.html` + `js/cena.js` usando `videos/core/` | [videos-3d.md](referencias/videos-3d.md) |
| Renderizar rápido (sem GPU) | `node render.js --trabalhadores 2` (o `core/harness.js` já usa Mesa llvmpipe) | [render-rapido.md](referencias/render-rapido.md) |
| Montar o MP4 | `bash montar.sh <quadros> <som.wav> <saida.mp4>` (~16–20 MB) | [videos-3d.md](referencias/videos-3d.md) |
| Fazer um Short 2D | `videos/svg/<nome>/` (página SVG + `render_svg.js`) | DIRETRIZES §9 |
| Criar personagem | gerador Python do elenco (`biblioteca3d/personagens/elenco/gerador/`) | [modelos.md](referencias/modelos.md) |
| Criar objeto/veículo "perfeito" | script do Blender (`blender -b -P criar_x.py -- --glb x.glb --render pasta`) | [modelos.md](referencias/modelos.md) |
| Criar veículo leve para o jogo | kit procedural Three.js (`biblioteca3d/veiculos/kit/kit.js`) | [modelos.md](referencias/modelos.md) |
| Mexer no jogo | `jogo/jogo.js` (laço, entradas, física) + módulos | [jogo.md](referencias/jogo.md) |
| Ver o que já existe | `videos/biblioteca3d/INVENTARIO.md` (sempre checar antes de criar) | — |
| Lições e descobertas | — | [descobertas.md](referencias/descobertas.md) |

## Tecnologias

- **Three.js r160** (importmap do jsDelivr; nos testes e renders o CDN é redirecionado para `videos/node_modules/three`).
- **Playwright + Chromium** headless para renderizar quadros e testar o jogo. A máquina não tem GPU: o desenho é por software, com **Mesa llvmpipe** (ver abaixo).
- **Python 3 + numpy** para gerar personagens (malha, esqueleto, pesos, rosto, animações) e exportar GLB. **Pillow** para folhas de contato e miniaturas, **soundfile/scipy** para sons.
- **Blender 4.2 LTS** em modo script (`-b -P`) para modelos detalhados (moto, armas) e renders Cycles. O binário não está no repositório: baixar o tarball 4.2 LTS de download.blender.org e chamar pelo caminho completo.
- **FFmpeg** para montar o MP4 (H.264 ~2,5–3,5 Mbps + AAC) e acabamento (`core/montar.sh`: `padrao`, `bloom`, `vivo`).
- **Vercel** publica o site (`vercel.json` com headers de `.glb`). GitHub: branch de trabalho + PR; o dono decide o merge.

## As 7 regras de ouro (aprendidas na prática)

1. **Render sem GPU = Mesa llvmpipe**, nunca SwiftShader: `--use-gl=angle --use-angle=gl-egl`. Medido: 14,1 s para 2,2 s por quadro 1080×1920, e ~0,5 s com 2 navegadores em paralelo; imagem igual (diferença média < 1/255). Já é o padrão em `videos/core/harness.js` (`RENDER_GL=swiftshader` volta ao antigo).
2. **Medir antes de otimizar, e medir o quadro inteiro.** `renderer.render()` só enfileira; o desenho real acontece na leitura (`toDataURL`/`readPixels`). Ligar e desligar partes (`?sombra=0`, `?aa=0`, esconder objetos) e cronometrar `window.__frame(t)`.
3. **Quadro 0 é a imagem mais forte do vídeo**, e o último plano volta a ela (loop). Uma ação clara por plano. Câmera sempre em movimento, com motivo.
4. **Clareza > realismo no que importa:** esconder o que tapa a ação (o para-lama tirado), deixar transparente o que esconde o ponto-chave (o disco de freio) e dar borda de luz ao herói do plano (a câmara de ar preta sobre o pneu preto).
5. **Física e topologia corretas:** nada flutua nem atravessa (a câmara de ar não pode passar pelo bico da carenagem: entra pela frente). Escala real (moto 600 cc com medidas de ficha técnica).
6. **Folha de quadros antes de entregar** (início, meio e fim de cada plano), e conferir texto espelhado, cortes e enquadramento 9:16.
7. **Commit e push sempre** (o hook de Stop cobra), sem MP4, sem dados pessoais. PR só com pedido; merge só quando o dono manda.

## Fluxo padrão de um Short 3D (resumo)

1. Ler DIRETRIZES/ESTILO. Checar o INVENTARIO. Escrever o roteiro com tempos + a decupagem e mostrar ao dono.
2. Montar `videos/<nome>/` copiando o esqueleto de [videos-3d.md](referencias/videos-3d.md).
3. Fazer stills: `W=540 H=960 node quadros.js <pasta>/q 1.5 5 10 …` e montar a folha. Corrigir o que não lê.
4. Teste de 4 s (`node render.js --ate 119`) para o dono aprovar.
5. Render completo: `node render.js --trabalhadores 2` (~0,5 s/quadro: 37 s de vídeo em ~10 min).
6. `bash montar.sh …`, conferir a duração e o tamanho, mandar ao dono, commit do projeto (sem MP4).
