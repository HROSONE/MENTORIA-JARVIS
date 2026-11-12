# Short "A viagem ao futuro" — versão 2 (ficção)

**Formato:** 1080×1920, 30 fps, 56,5 s, só efeitos sonoros. **É ficção** (selo "FICÇÃO" no começo; deixar o aviso na descrição). Herói: o garoto de camisa vermelha e calça azul (`jovem_a` repintado; o `teen.glb` não tem esqueleto). Sem violência explícita: o encolhimento é um efeito de fantasia, feito para **salvar** pessoas vivas.

## Mudanças da v2 (pedidos do dono)
- Abertura: **simulação de pessoas magras andando fracas, caindo no chão e morrendo de fome** (personagens do elenco, com esqueleto e rosto), herói **triste, chorando**, e só então ele vai para a máquina.
- **Máquina do tempo nova e detalhada** (`biblioteca3d/veiculos/maquina_tempo.js`): três anéis de giroscópio, reator de plasma, console com tela do ano, relógio e alavanca, pilares com descargas, engrenagens, antena, luzes.
- **Viagem no tempo** de verdade: vórtice com relógios gigantes, folhas de calendário, riscos de luz e contador do ano.
- Ele **volta um dia antes** (selo "UM DIA ANTES") e atira em **pessoas vivas**, não nas que morreram.
- **Banana gigante** no meio da cidade: o povo olha, **corta fatias com machados e carrega para casa** e come.
- Final: ele com a arma numa mão e a maçã na outra, e a **maçã posta na rua ao lado de uma casa: bem maior que ela**.

## Lista de planos (tempo, assunto)
| Tempo | Plano | Imagem | Locução sugerida |
|---|---|---|---|
| 0:00 | fome1 | pés arrastando na terra rachada → praça com gente cambaleando | **O mundo ficou sem comida e sem água.** |
| 0:03 | fome2 | câmera gira em volta de um homem que desaba | **Um por um, as pessoas caíam.** |
| 0:06 | triste | close no rosto dele chorando, zoom-out revelando os corpos | **Ele não aguentou ver aquilo.** |
| 0:09 | maq1 | giro de 150° em volta da máquina do tempo | **Mas ele tinha uma máquina do tempo.** |
| 0:12 | maq2 | cabine: tela do ano, ele puxa a alavanca | |
| 0:14,5 | ativa | anéis disparam, descargas, onda no chão, clarão | |
| 0:16,5 | viag1 | vórtice de relógios e calendários, contador do ano | **Ele atravessou os séculos.** |
| 0:19,5 | viag2 | rosto dele no vórtice, ano subindo até 2500 | |
| 0:22 | chega | máquina surge sobre a cidade neon (selo "ANO 2500") | **No futuro, achou a solução:** |
| 0:24,5 | lab1 | a arma sob a cúpula de vidro | **uma arma que encolhe pessoas.** |
| 0:26,3 | lab2 | ele pega, alarme vermelho, corre | |
| 0:28,5 | volta | a máquina pousa na praça, "UM DIA ANTES" | **Ele voltou antes que fosse tarde.** |
| 0:31 | atira1 | cano da arma carregando e disparando | |
| 0:33 | atira2 | uma pessoa encolhe; câmera desce ao nível da formiguinha | **E encolheu todo mundo, para salvá-los.** |
| 0:35,5 | atira3 | o raio varre a multidão; todos viram formiguinhas | |
| 0:38 | constroi | a cidade miniatura surge peça por peça | **Construiu uma cidade só para eles.** |
| 0:41,5 | banana | uma banana gigante cai no cruzamento | **Uma banana, para a cidade inteira.** |
| 0:44 | corta1 | machados cortam a primeira fatia | |
| 0:47 | corta2 | duplas carregam as fatias; outros comem | **Todo mundo comeu.** |
| 0:50 | final1 | ele sorri com a arma e a maçã | |
| 0:53 | final2 | a maçã na rua, maior que a casa; cartão final | **E uma maçã é maior que a casa. Se inscreve.** |

Moral para a legenda: "Uma cidade pequena precisa de muito menos comida e água."

## Escala (física certa)
Cidade miniatura a 1:83 (pessoa de 1,7 m vira ~2 cm, casa ~7 cm). Banana real (21 cm) e maçã (12 cm, uma maçã grande) ficam gigantes perto das pessoas; a maçã é mais alta que a casinha.

## Arquivos
`js/` (cena Three.js: `mundo.js`, `cenas.js`, `gente.js` com andar fraco/queda/deitado), `sfx_viagem.py` (som sintetizado, sincronizado por `planos.json`), `montar.sh` (encode), `render.js`. Máquina: `biblioteca3d/veiculos/maquina_tempo.js` (+ visualizador `maquina_tempo.html`).
