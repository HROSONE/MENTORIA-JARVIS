# Descobertas e decisões (com data)

Registro do que funcionou e do que não funcionou, para não repetir erro. As regras de conteúdo do canal estão em `videos/DIRETRIZES.md` e
`videos/ESTILO.md`; aqui ficam sobretudo as técnicas.

## Render e desempenho
- **25/11:** Mesa llvmpipe em vez de SwiftShader deixou o render 20x mais rápido, sem perder qualidade. Detalhes em [render-rapido.md](render-rapido.md).
- **25/11:** paralelo no SwiftShader não ajuda (4 navegadores = mesmo tempo); no llvmpipe, 2 trabalhadores rendem bem.
- **25/11:** o mapa de ambiente PMREM era o item mais caro no SwiftShader (~65% do quadro).
- **26/11: o llvmpipe não acelera o Blender.** O ganho era do navegador, que deixou o SwiftShader pelo Mesa llvmpipe.
  - O Cycles calcula direto na CPU, sem OpenGL, então nada muda para ele.
  - O Eevee Next (4.2) roda sem tela por EGL no próprio Mesa: o aviso `EGL_BAD_MATCH` aparece, mas o render funciona.
  - Medido no boi, a 1080×1920:

    | Motor | Tempo por quadro |
    |---|---|
    | Eevee (16 amostras) | ~8,4 s (o 1º tem a compilação dos shaders) |
    | Cycles (32 amostras, com denoise) | ~16,5 s |
    | Three.js (llvmpipe, 2 navegadores) | ~0,4–0,8 s |

  - Regra: vídeo inteiro no Three.js. Blender para modelar e para stills. Se o vídeo tiver que sair do Blender, usar Eevee (2× o Cycles).
- **17/11 (T. rex):** vegetação instanciada era 93% do custo. A correção foi recorte por campo de visão, LOD e sombra só na janela da câmera (`trex_corrida/js/corte.js`).
- **Blender Cycles no Colab (T4):** ~3 h para 1080 quadros 720p e com defeitos. Para vídeo inteiro, Three.js sai melhor.
- **Jogo no celular:** limite de 60 qps, resolução dinâmica (piso por qualidade), sombra a cada 2 quadros, mescla de peças paradas por material e sem luzes pontuais permanentes.

## Modelagem
- **Personagem anime "estilo Dragon Ball" original:**
  - Traços: corpo em V, pescoço grosso, olhos estreitos com delineado, sobrancelha angulada, calça larga que embola na bota.
  - Para ficar original: cores próprias (marinho e carmim, nunca laranja e azul) e cabelo próprio.
  - Medir pela referência do dono lado a lado, na mesma altura.
- **Quadril e calça:** a calça abre logo abaixo da faixa e tem a largura da faixa até as coxas. O volume fica só na canela.
- **Rosto realista com sombreado toon fica estranho.** O que ajudou: nariz curto (`nariz_ponte`), delineado, sobrancelha grossa e contorno fino na pele.
- **Moto:** a carenagem como superfície contínua (meia seção que sobe e curva), e não um "bico" separado. Pinça de freio em arco abraçando o disco. Textos com rotação conferida (eles saíam espelhados).
- **Peças que um vídeo pode precisar soltar** (perna do garfo, para-lama) já saem do Blender como nós separados.

## Vídeo (o dono aprovou ou pediu)
- O dono prefere o modelo do Blender ao procedural, no visual.
- "Só os objetos" quando a pessoa atrapalha a leitura. Fundo azul neutro de estúdio (esfera com degradê + chão).
- Sem legenda e sem som quando ele vai narrar: entregar o MP4 mudo e o roteiro com tempos.
- O dono descreve a ação física, e eu sigo à risca. Ex.: a câmara de ar entra **deitada**, **por cima** do pneu, puxada **por trás**.
- A demora irrita: medir e acelerar antes de deixar o render rodando por horas. Avisar o tempo real (medido), não o estimado.

## Detalhe e movimento (26/11, vídeo do boi: o dono achou as imagens "com poucos detalhes")
- **Carne procedural no shader saiu com cara de plástico**, e o voronoi forte ficou parecendo azulejo.
  - O que resolveu foi gerar as texturas em Python, com numpy e Pillow:
    - feixes de fibra com bordas curvas (deformação em duas escalas);
    - tecido conjuntivo bem discreto;
    - marmoreio em veios ramificados (ruído "crista");
    - normal e rugosidade próprias.
  - O tremor ficou como relevo animado na normal, pelas derivadas de tela (`dFdx(-vViewPosition)`, como o bump do three).
  - O `modelMatrix` não existe no fragment shader.
- **Mixamo pede login da Adobe.** No lugar, usar as capturas da CMU que o projeto já baixa (`biblioteca3d/mocap/baixar.py`).
  - Para o elenco: retarget por direção com os nomes de ossos do elenco (`aplicarCorpo` no `boi_energia/js/acougue.js`), ancorado no lugar.
  - A ação forte (o golpe do cutelo) vai por IK, com preparação, golpe acelerando, parada no impacto e recuperação.
  - Uma captura de martelar dá o peso e a cabeça olhando a peça.
- **Posicionar a raiz do personagem:** somar a diferença (raiz − quadril no mundo) em 2 passadas. A cópia direta deixava o boneco 1 m abaixo do chão.
- **Vertical 9:16:** a largura visível é estreita (~22° com fov 40), então o objeto e o contador precisam estar quase na mesma linha de visão. Pôr o contador como objeto ao lado (cronômetro na mesa), e não um painel ao fundo.
- **Mundo micro legível:** fibra finita com a ponta cortada de frente para a câmera em 3/4, mitocôndrias nos vãos do arranjo e rentes à membrana, casca de vidro com fresnel e cristas que acendem (`emissiveIntensity` pela média das acesas).

## Voz e narração
- **26/11:** pela primeira vez, o dono pediu uma voz criada por mim. Testei estas vozes em português:
  - Piper: faber, cadu, jeff;
  - Kokoro: pm_alex, pm_santa, pf_dora.
- **Teste de clareza:** passei cada voz no Whisper. O Kokoro deu a transcrição mais confiável (logprob médio de −0,14, contra −0,25 do Piper).
- **A "voz Hryz":** mistura dos vetores de estilo (`0.7*pm_alex + 0.3*pm_santa`) a 1,08×.
- **Pronúncia:** escrever como se fala o que o modelo erra. Exemplos: "llvmpipe" → "éli éli vi em paipe", "FFmpeg" → "éfe éfe ém pég", "Three.js" → "Trí djêi ési".
- **Sincronia:** o `voz.py` gera o `tempos.json` com o tempo de cada palavra (Whisper `word_timestamps`) e o `envelope.json`. As batidas da animação usam `P('palavra')`; o orbe-narrador pulsa com o envelope.
- **Mixagem:** a voz entra como base na `Mesa` (`m.por(array, 0)`), com efeitos curtos de −17 a −27 dB, e o `finalizar(media=-19.5)`.

## Processo
- Antes de prometer tempo, renderizar 3 quadros e cronometrar.
- Stills em 540×960 para revisar e folha de contato; teste de 4 s antes do vídeo inteiro.
- Commit e push a cada etapa (o hook de Stop cobra). PR só quando pedido; merge só com o "sim" do dono.
