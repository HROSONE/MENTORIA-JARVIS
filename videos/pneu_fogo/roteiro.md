# "Encher pneu com fogo": Short 3D

- **Formato:** vertical 1080×1920, 30 qps, cerca de 45 s.
- **Tema:** como o spray inflamável e o fogo encaixam o talão do pneu no aro, e por que isso é perigoso.
- **Tom:** "como isso é possível?", mostrado passo a passo, com corte transversal (raio-x) e a física visível. Termina com o aviso.

## Fatos (com fonte)
- **Para que serve:** o truque não "enche" o pneu. Ele **encaixa o talão** (a borda de borracha com arames de aço) no aro de um pneu sem câmara que ficou solto e vaza pela fresta.
- **Como funciona:**
  - O vapor do spray inflamável (éter de partida, fluido de isqueiro, WD-40) se mistura ao ar dentro do pneu.
  - Ao acender, a mistura queima num estalo. O gás esquenta e se expande mais rápido do que consegue escapar pela fresta.
  - O pico de pressão empurra os talões contra as abas do aro e o pneu "pula" e veda.
  - Fontes: [AutoPapo (SAE)](https://autopapo.com.br/noticia/encher-pneu-com-fogo-e-possivel/), [Straight Dope](https://boards.straightdope.com/t/mounting-a-tire-with-ether-how-does-it-work/568673), [BITOG](https://bobistheoilguy.com/forums/threads/mounting-a-tire-using-fire.396603/).
- **Depois do estalo:** o gás esfria em segundos e a pressão cai. É preciso encher com ar logo em seguida, senão o pneu murcha.
  - Isso é consequência da lei dos gases: quando o gás esfria, a pressão cai. Não achei uma medição publicada disso, só relatos.
- **Risco real:**
  - A OSHA registra um trabalhador que borrifou fluido de partida (éter), acendeu com um maçarico para encaixar o talão e morreu: foi atingido pelo aro. Fonte: [OSHA, relatório de acidente](https://www.osha.gov/pls/imis/accidentsearch.accident_detail?id=937060).
  - A OSHA e o governo de Ontário dizem para **nunca** usar éter, fluido de partida ou gasolina para assentar talão. Fontes: [OSHA](https://www.osha.gov/sites/default/files/publications/3401tubeless-truck-bus-tires-wall-chart.pdf), [Ontário](https://www.ontario.ca/page/alert-tire-machines).
  - No borracheiro, quem faz isso é a máquina, com ar comprimido e gaiola de segurança, e sem passar de ~40 psi para assentar. Fonte: [Washington L&I](https://seguridad.lni.wa.gov/safety-health/safety-research/files/2013/TireExplosionHazardAlert.pdf).
- **O que o vídeo NÃO vai afirmar:** números de pressão do estalo, porque não achei medição confiável. Mostro "sobe muito e cai" no manômetro, sem valor inventado.

## Decupagem (diretor)
| t (s) | Plano | Função | Tamanho / ângulo / lente | Movimento e motivo | Luz e herói | Transição |
|---|---|---|---|---|---|---|
| 0–3 | **Quadro 0:** pneu deitado no chão; uma chama laranja sai pela fresta do talão, o pneu dá um pulo e encaixa ("POP") | Gancho absurdo | Plano médio baixo (contra-plongée), grande-angular | Câmera quase no chão, push-in curto no estalo | O fogo ilumina tudo; fundo escuro | Rebobina (whip pan) |
| 3–8 | Pneu vazio e solto no aro, com a fresta visível; a mão borrifa o spray pela fresta (névoa) | Premissa | Close 3/4 de cima | Órbita lenta até a fresta | A névoa com borda de luz | Corte para o raio-x |
| 8–14 | **Corte transversal:** o pneu cortado ao meio mostra o vapor (pontinhos azuis) se espalhando e se misturando ao ar (pontinhos brancos) dentro do pneu | Como funciona 1 | Plano detalhe do corte | Travelling ao longo do anel | Metade de vidro; vapor brilhante | O isqueiro entra |
| 14–19 | O isqueiro acende; a chama entra pela fresta e a frente de fogo corre pelo anel inteiro em câmera lenta (contador "0,05 s") | Tragédia / clímax | Close baixo, depois geral de cima | Câmera acompanha a frente de fogo | A chama é a única luz | Clarão |
| 19–26 | Dentro do corte, as moléculas aceleram (agitação), as setas de pressão empurram as paredes e os **talões deslizam para fora e sobem na aba do aro** ("POP"); o manômetro dispara | Concerto: a física | Close do talão no aro | Push-in no talão subindo | Talão destacado em amarelo; manômetro diegético | Pull-out |
| 26–32 | O gás esfria (as moléculas desaceleram), o ponteiro do manômetro cai e a mangueira de ar entra para encher | A virada | Plano médio | Push-in no manômetro | Luz volta ao normal | Corte |
| 32–41 | O perigo: o pico pode estourar o pneu ou arrancar o aro, que voa (simulação curta, sem pessoa atingida); no borracheiro, a máquina, a gaiola e o ar comprimido | Aviso | Geral, de baixo | Câmera recua com o estouro (sem tremor) | Contraluz | Corte seco |
| 41–45 | Volta à imagem do começo (loop), com "Não tente em casa" num cartaz diegético | Loop | Igual ao quadro 0 | Push-in | — | Loop |

## Elementos
- **Pneu e aro** (novo, Blender por script):
  - Pneu sem câmara de picape 265/70 R16, com sulcos, letras na lateral ("HRYZ"), talão com arames e camadas por dentro, visíveis no corte.
  - Aro de aço com aba, assento do talão, rebaixo central e válvula.
  - O corte transversal vem por plano de recorte no Three.js.
- **Personagem:** o operador do elenco, de luvas.
  - A captura real da CMU dá o agachar e o borrifar: 69_70 "agachar e pegar" e 79_43 "pintando".
  - A mão vai até a fresta por IK.
  - O susto no estalo usa o clipe "Assustado".
- **Efeitos:**
  - Névoa do spray em partículas.
  - Frente de chama em volta do anel, com shader de fogo (há base no `vulcao_milharal/js/vulcao.js` e no `lucas_poder/js/efeitos.js`).
  - Moléculas instanciadas (frias = lentas; quentes = rápidas e laranja), setas de pressão, fumaça depois do estalo e manômetro diegético.
- **Cenário:** estúdio azul neutro (escolha do dono).
- **Som (só gravações CC0):** spray (aerossol), isqueiro, "whoomp" do fogo, o estalo do talão, compressor e chiado de ar. Sem música.
- **Render:** Three.js com llvmpipe (o caminho rápido), sem tremor de câmera.

## Versão final (o que foi feito)
- **Pneu:** procedural em Three.js (`biblioteca3d/veiculos/pneu/pneu.js`), não no Blender: o talão precisa mudar de forma (solto ↔ assentado) e o corte precisa abrir em tempo real.
- **Operador:** captura real CMU 69_70 (agachar) + IK nas duas mãos; a lata e o isqueiro ficam presos à mão.
- **Marca:** "HRYZ ANIMATION" no flanco do pneu, na lata de spray, no calibrador e na placa final.

| t (s) | O que aparece |
|---|---|
| 0–3 | Gancho: o pneu solto no aro, as línguas de fogo saem pela fresta e o talão estala no lugar (0,8 s); fumaça |
| 3–8 | O operador agachado borrifa o spray na fresta (geral, depois close de 3/4) |
| 8–14 | Corte: o vapor (azul) se espalha e se mistura ao ar (branco) dentro do pneu |
| 14–15,5 | O isqueiro acende (14,6 s) e o vapor pega fogo na fresta ("uuf", 15,0 s) |
| 15,5–19 | Raio-x de cima: duas frentes de fogo correm pelo anel e se encontram no corte |
| 19–26 | A seção em chamas, as moléculas agitadas, as setas de pressão, o talão sobe na aba: POP (21,6 s); o calibrador dispara |
| 26–32 | O gás esfria, as moléculas param, o ponteiro cai; a mangueira do compressor encaixa e o ar chia |
| 32–41 | Simulação em tom vermelho: o pneu estoura e o aro voa (34,2 s); a placa "NÃO TENTE EM CASA · HRYZ ANIMATION" |
| 41–45 | Loop: volta à imagem do começo |

**Som** (`sfx.py`, só gravações CC0): spray, isqueiro, boca de fogão acendendo (o "uuf"), incêndio de gasolina, estalo, vazamento de ar e compressor.
