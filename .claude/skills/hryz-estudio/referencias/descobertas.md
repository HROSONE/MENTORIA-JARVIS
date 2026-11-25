# Descobertas e decisões (com data)

Registro do que funcionou e do que não funcionou, para não repetir erro. As regras de conteúdo do canal estão em `videos/DIRETRIZES.md` e
`videos/ESTILO.md`; aqui ficam sobretudo as técnicas.

## Render e desempenho
- **25/11:** Mesa llvmpipe em vez de SwiftShader deixou o render 20x mais rápido, sem perder qualidade. Detalhes em [render-rapido.md](render-rapido.md).
- **25/11:** paralelo no SwiftShader não ajuda (4 navegadores = mesmo tempo); no llvmpipe, 2 trabalhadores rendem bem.
- **25/11:** o mapa de ambiente PMREM era o item mais caro no SwiftShader (~65% do quadro).
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

## Processo
- Antes de prometer tempo, renderizar 3 quadros e cronometrar.
- Stills em 540×960 para revisar e folha de contato; teste de 4 s antes do vídeo inteiro.
- Commit e push a cada etapa (o hook de Stop cobra). PR só quando pedido; merge só com o "sim" do dono.
