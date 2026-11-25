# Render rápido sem placa de vídeo (descoberta de 25/11, Short da câmara de ar)

## O problema
A máquina do Claude Code na nuvem não tem GPU. O Chromium headless desenhava o WebGL com o **SwiftShader**: ~10–14 s por quadro 1080×1920 com
a moto do Blender (156 mil triângulos, mapa de ambiente PMREM, sombras), ou ~2 h para um Short de 37 s. Rodar 4 navegadores em paralelo
não ajudava (4 × 38 s ≈ os mesmos ~10 s/quadro), porque o SwiftShader já ocupa todos os núcleos e eles brigam entre si.

## A solução
Trocar o desenhador por software do Chrome para o **Mesa llvmpipe** (ANGLE sobre EGL). É uma opção de linha de comando:

```js
chromium.launch({ args: ['--use-gl=angle', '--use-angle=gl-egl', '--ignore-gpu-blocklist'] })
```

| Desenhador | Opções | Renderizador informado pelo WebGL | s/quadro (1 navegador) |
|---|---|---|---|
| SwiftShader (antigo) | `--use-angle=swiftshader --enable-unsafe-swiftshader` | ANGLE (Google, Vulkan … SwiftShader) | 14,1 |
| `--use-angle=gl` | (caiu de volta no SwiftShader) | SwiftShader | 13,7 |
| `--use-gl=egl` | (caiu de volta no SwiftShader) | SwiftShader | 14,1 |
| **llvmpipe** | `--use-gl=angle --use-angle=gl-egl` | ANGLE (Mesa, llvmpipe (LLVM 20.1.2 256 bits), OpenGL ES 3.2) | **2,2** |

- **Com 2 trabalhadores em paralelo:** ~0,5 s por quadro na média, e as 760 quadros que faltavam saíram em ~5 min.
- **Imagem:** a diferença média entre SwiftShader e llvmpipe foi de 0,8–0,9 em 255 por canal, ou seja, igual a olho nu. Dá para misturar quadros dos dois no mesmo vídeo.
- **Onde está:** `videos/core/harness.js` (padrão). `RENDER_GL=swiftshader node render.js …` volta ao antigo.
- **Pré-requisito:** Mesa instalado (`libEGL_mesa`, `libgallium`). Já vem nesta imagem do Ubuntu 24.04; conferir com `ls /usr/lib/x86_64-linux-gnu | grep -i mesa`.
- **Como conferir qual desenhador está ativo:**
  `gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL)` precisa dizer **llvmpipe**.

## Como medir (método que achou o problema)
1. `renderer.render()` volta em milissegundos: o desenho de verdade só acontece quando o quadro é lido (`toDataURL`, `readPixels`,
   `drawImage` do canvas). Medir sempre o quadro inteiro (`window.__frame(t)`), nunca só o `render`.
2. Abrir a página uma vez e cronometrar o mesmo quadro ligando e desligando partes: `?sombra=0`, `?aa=0`, `scene.environment = null`,
   esconder a moto ou o fundo. No SwiftShader, o mapa de ambiente custava ~7 dos ~11 s; sem a moto o quadro levava 0,65 s.
3. Testar com o render pesado pausado (`pkill -STOP` / `pkill -CONT`) para a medida não ser roubada.
4. Comparar a imagem nova com a antiga pela diferença média (Pillow `ImageChops.difference` + `ImageStat`).

## Outras alavancas (se ainda precisar)
- **Reflexo de estúdio calculado no shader** (`reflexoEstudio` em `videos/camara_ar/js/cena.js`, `?ibl=analitico`): troca o PMREM por uma
  fórmula (céu, chão, duas softboxes). Era ~2,5x mais rápido no SwiftShader, mas muda um pouco o metal. Com llvmpipe não precisou.
- **Sombra fixa** (`renderer.shadowMap.autoUpdate = false` e `needsUpdate = true` só quando algo se mexe), com ~10% de ganho.
- **GPU de verdade:** Google Colab (`videos/colab/`) ou o computador do dono. O mesmo `render.js` roda lá, com quadro em fração de segundo.
- **Não adianta:** escrever um rasterizador próprio. O llvmpipe e o SwiftShader já são rasterizadores SIMD multinúcleo.

## Fontes
- Microlink: [WebGL sem GPU](https://microlink.io/blog/webgl-without-a-gpu) (relato de ~24 s para ~6 s com llvmpipe) e [screenshots WebGL mais rápidos](https://microlink.io/blog/faster-webgl-screenshots)
- [Remotion: GPU no Chrome headless](https://v3.remotion.dev/docs/gpu)
- [Chromium: uso do SwiftShader](https://chromium.googlesource.com/chromium/src/+/798e59c5275d4131797e8ea2e96e6c6000256b58/docs/gpu/swiftshader.md)
- [Fórum three.js: leitura de pixels no servidor](https://discourse.threejs.org/t/server-side-render-and-get-pixel-data-fast/26784)
