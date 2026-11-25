# Modelos 3D: personagens, veículos e objetos

Sempre checar `videos/biblioteca3d/INVENTARIO.md` antes de criar. Tudo que for novo entra lá e no README da pasta.

## Personagens do elenco (Python → GLB com esqueleto, rosto e animações)
- Gerador: `videos/biblioteca3d/personagens/elenco/gerador/`.
  - `personagens*.py`: uma função por personagem.
  - `gerar.py`: lista `ELENCO`…`ELENCO7`.
  - Para gerar: `python3 gerar.py kael` cria `kael.glb`.
- **API de construção:**
  - `base_personagem(esq, rosto, corpo)` devolve `(e, cab, cp, S, _)`, onde `esq` são as proporções do esqueleto (perna, tronco, braço, pescoço, ombros, quadril, cabeça, pé).
  - Os parâmetros do rosto (olho_r, lid_aberta, nariz_*, sobr_*, boca_*, res…) estão em `cabeca.py:PAD`. O `nariz_ponte` foi criado para o nariz curto de anime.
  - Peças do corpo: `cp.casca_torso(t0, t1, ease, off, mat, perfil_extra=, recorte=, flare=)`, `cp.membro('braco'|'perna', lado, s0, s1, ease, off, mat, extra=)`, `cp.mao`, `cp.sapato`.
  - Cabelo: `H.touca`, `tubo`/`loft`/`elipsoide` de `forma.py`, com pesos `osso(e.nb, e.idx, Cabeca=1)`.
- **Clipes:** Parado, Andar, Correr, Pular, Assustado. No jogo entram também as animações universais (`instalarAnimacoesUniversal`).
- **Anime (Kael):**
  - No jogo usa `MeshToonMaterial` de 2 tons e contorno por casca invertida (`SkinnedMesh` + `BackSide` + `objectNormal * espessura`).
  - O contorno fica só nas peças grandes (pele, gi, calça, cabelo, bota, faixa, camiseta) e nunca em olho, boca ou sobrancelha.
  - O delineado é um tubo na borda da pálpebra preso ao osso `Palpebra`.
- **Proporção pela referência:** comparar o modelo e a imagem do dono lado a lado na mesma altura (câmera ortográfica) e ajustar até a silhueta bater.
- **Otimizar:** baixar `nseg`/`n_an`/`res`, medindo os triângulos por material (`collections.Counter(S.M)`). O Kael caiu de 122 mil para 71 mil sem perda visível.

## Pose por alvos (IK) para personagens do elenco
- `jogo/pilotar.js`: cada osso é orientado a partir da **pose de repouso** tirada das
  `skeleton.boneInverses` (eixo do osso + uma referência perpendicular: frente do corpo, lado da palma). Assim não torce a pele, ao
  contrário do `setFromUnitVectors`, que gira pelo caminho mais curto e deforma o braço.
- IK de dois ossos com polo (cotovelo para fora e para baixo, joelho para frente).
- Usos: piloto na moto (mãos nas manoplas que viram com o guidão, pés nas pedaleiras) e braço da rajada do Kael (palma para o alvo, laser
  saindo do centro da palma e acompanhando a mão a cada quadro).

## Objetos e veículos "perfeitos" no Blender (script)
- Exemplos:
  - `videos/biblioteca3d/veiculos/moto/criar_moto.py`: moto esportiva 600 cc com ~156 mil triângulos.
  - `videos/biblioteca3d/objetos/armas/criar_armas.py`.
- Comando: `blender -b -P criar_moto.py -- --glb moto.glb [--blend x.blend] [--render pasta --amostras 64 --vistas tres_quartos,lado]`.
- **Ajudantes do script** (copiar e reutilizar):
  - `loft` de seções superelípticas (`sec`), com `revolucao` para pneus, aros e discos;
  - `barra`/`viga` de seção retangular por um caminho e `tubo` (curva bezier com bevel);
  - `furar` (booleano), `texto` (logo HRYZ) e `juntar` (aplica modificadores e junta por material).
- **Peças móveis como nós separados**, com o pivô no lugar certo:
  - `Direcao` girando no eixo da coluna (24°);
  - `RodaDianteira`/`RodaTraseira` girando em X;
  - `Balanca` e `Descanso`;
  - no vídeo, `PernaGarfoE` e `ParaLama` saem.
  - No glTF a frente é +Z e o y é para cima; Blender −Y equivale a Three +Z.
- **Medidas reais da classe:** entre-eixos 1,375 m, cáster 24°, trail ~97 mm, pneus 120/70 e 180/55 ZR17, disco de 310 mm.
- **Carenagem lisa:** uma meia seção por estação, subindo pela lateral até o "ombro" e curvando até o centro, a borda da bolha ou o topo da lateral. Os faróis ficam rentes à frente (`yfrente(x)`).
- **Render Cycles na CPU:** ~1–2 min por vista 1600×1000 com 64 amostras. Serve para prévias, não para vídeo inteiro.

## Veículos procedurais leves (Three.js, kit)
- `videos/biblioteca3d/veiculos/kit/kit.js`. A API comum `K.api(G, { L, W, H, R, luzes, rodas, extra })` traz `rodar`, `esterco`, `farois`, `freio`, `seta`, `luzes` e `posicao`.
- Moto procedural: `veiculos/moto/moto.js`, a mesma moto do Blender com ~94 mil triângulos.
- Moto do Blender no Three.js: `veiculos/moto/motoGLB.js`. Ela acha sozinha o eixo local da direção, liga as luzes pelos nomes dos materiais e expõe `pontos` (Assento, PeE/PeD, MaoE/MaoD) para montar o piloto.
- Bancada: `veiculos/bancada.html?v=<nome>&cam=tq|lado|frente`. Fotos: `node fotos.js <nome> <pasta> tq,lado`.
