# Short 3D em Three.js (o jeito que funciona)

Exemplo completo e recente: `videos/camara_ar/` (moto do Blender, fundo azul, câmara de ar que deforma, raio-x, 8 planos, 37 s).
Outros: `elevador/`, `trex_corrida/`, `lucas_poder/` (nível cinema, com pós), `mestres_gravidade/`.

## Esqueleto de um projeto
```
videos/<nome>/
  index.html      # importmap do three@0.160.0; window.__setTime(t), window.__frame(t), window.__total, window.__ready
  js/cena.js      # criarMotor() do core, construir(), atualizar(t), efeitos(t), PLANOS e TOTAL
  render.js       # require('../core/render').renderizar(__dirname)
  quadros.js      # require('../core/quadros').capturarQuadros(__dirname)   (stills em instantes soltos)
  montar.sh       # exec bash "$(dirname "$0")/../core/montar.sh" --acabamento padrao "$@"
  roteiro.md      # tabela tempo · o que aparece · fala (o dono narra)
```

## O vídeo é uma função do tempo
- `atualizar(t)` posiciona tudo (objetos, deformações, câmera) só a partir de `t`. Sem estado acumulado, para que qualquer quadro possa ser
  renderizado em qualquer ordem e em vários navegadores.
- **Planos:** a lista `PLANOS = [{ id, t0, t1 }]` e `plano(t)` decidem o que aparece. A câmera é um `switch` por plano com `lerp` +
  `suave()` entre duas posições (push-in, pull-out, órbita), mais o `tremor(cam, t, a)` do core.
- **Efeitos de corte:** `efeitos(t)` devolve `flash` (clarão branco) e `subs` (borrão de movimento com subamostras perto dos cortes). O
  `capturar` do core junta as subamostras.
- **Raio-x:** trocar os materiais por um `MeshBasicMaterial` claro e transparente (guardar o original em `userData.mat0`) e desenhar as
  linhas-chave como `TubeGeometry` emissivo com `setDrawRange` animado (o laço que "se desenha").
- **Objeto deformável** (ex.: a câmara de ar): uma curva fechada de pontos de controle → `CatmullRomCurve3(..., 'centripetal')` →
  `getSpacedPoints(N)` → seção achatada em volta da curva, com a geometria atualizada a cada quadro (`BufferAttribute` +
  `computeVertexNormals`). As formas são funções (`anelDeitado`, `anelPuxado`, `preso`) misturadas por `suave(inv(a, b, k))`.
- **Herói legível:** borda de luz via `onBeforeCompile` (fresnel somado no fim do fragment shader), peças que tapam a ação escondidas ou
  transparentes só nos closes.

## Comandos
```bash
cd videos/<nome>
W=540 H=960 node quadros.js /tmp/pasta/q 1.5 5 10 20     # stills rápidos para revisar
node render.js --saida /tmp/quadros --ate 119              # teste de 4 s para o dono
node render.js --saida /tmp/quadros --trabalhadores 2      # vídeo inteiro (~0,5 s/quadro com llvmpipe); pula quadros já feitos
ffmpeg -f lavfi -i anullsrc=r=48000:cl=stereo -t <dur> silencio.wav   # quando o vídeo vai sem som (o dono narra)
bash montar.sh /tmp/quadros silencio.wav /tmp/saida.mp4
```
- O `render.js` **retoma de onde parou**: arquivos `fNNNNN.jpg` que já existem são pulados, e dá para trocar opções no meio.
- Folha de contato: um script Pillow que cola os quadros (veja `sheet.py`, ou faça um rápido em Python).
- Entrega: MP4 até ~20 MB (o celular do dono não baixa 70 MB). Mandar com o SendUserFile; nunca commitar MP4.

## Lições de direção que custaram caro
- Câmera de frente para a roda escondia a ação atrás do para-lama → ângulo 3/4, de cima ou de baixo, conforme o ponto-chave.
- Pessoa em silhueta tapando a câmera → o dono pediu "só os objetos"; personagem só se for o assunto.
- O dono descreveu a ação ("a câmara deitada, por cima do pneu, puxando por trás"): seguir exatamente a descrição física dele, depois
  conferir se não atravessa nada (a carenagem fica acima do pneu: entra pela frente, por baixo do bico).
- Whip pan muito forte deixa alguns quadros só com o fundo: usar giro menor ou cortar no meio do giro.
