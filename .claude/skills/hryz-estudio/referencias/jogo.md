# Jogo Hryz City (index.html + jogo/)

Mundo aberto em Three.js r160, publicado na Vercel. A página inicial do site é o jogo.

## Arquivos
| Arquivo | O que faz |
|---|---|
| `jogo/jogo.js` | Laço principal, renderer, qualidade (Leve/Médio/Alto), entradas teclado + toque ("pata de cachorro"), andar/pular/rolar/soco, dirigir (física de carro e de moto), câmera, minimapa, frota de veículos (`frotaCanal`), sala, missão, debug `window.__jogo` |
| `jogo/cidade.js` | Cidade (setores mesclados, InstancedMesh), céu, chão com variação, postes, NPCs (pedestres) com `atingirNpc`, colisores (com `maxY` = topo dos prédios) |
| `jogo/sala.js` / `abertura.js` | Sala de escolha (personagem, veículo, local) e abertura pulável pela cidade |
| `jogo/armas.js`, `balacam.js`, `loja.js`, `missao.js` | Pistola/metralhadora/sniper, câmera da bala, loja de munição, missão do refém |
| `jogo/poderes.js` | Kael: rajada vermelha (mira que trava no alvo; carro explode, rombo em parede, pessoa cai no 2º acerto), super força (levanta e arremessa carro), impacto do super pulo |
| `jogo/pilotar.js` | Piloto montado na moto por IK |
| `jogo/canteiro.js`, `terreno.js`, `dano.js`, `otimizar.js` | Canteiro de obras com terreno cavável, vida/dano/explosões, mescla de peças paradas dos veículos |

## Como testar (headless, sem GPU)
- Abrir `index.html?direto&semmissao&qualidade=medio` no Playwright, com o CDN do three redirecionado para `videos/node_modules/three`.
- Pausar e andar quadro a quadro: `__jogo.pausar(true)` + `__jogo.passo(1/30)`. Isso torna o teste determinístico.
- Ganchos úteis:
  - posição e personagem: `__jogo.irPara(x, z, ang)`, `__jogo.pers('kael')`;
  - estado: `__jogo.veiculo(id)`, `__jogo.poderes()`, `__jogo.fisica()`;
  - câmera de cinema: `__jogo.camFixa([pos], [alvo])`.
- Teclas no teste: `p.keyboard.down('KeyW')` … `up`. Prints com `p.screenshot`.
- Os scripts de teste ficam no scratchpad da sessão. Exemplos do que já foi testado: rajada no táxi, pulo de 32 m até o telhado de 22 m, moto a 209 km/h.

## Coisas que já deram errado (e a correção)
- Raio com sprites na cena: definir `raycaster.camera`, ou o `Sprite.raycast` quebra.
- Mira pela direção da câmera em 3ª pessoa acerta o chão (a câmera olha para baixo, para o personagem). Mirar pelo yaw da câmera,
  saindo da mão, com trava no alvo mais alinhado (até ~12° e 90 m).
- `replace` de texto em código acertou o lugar errado (a manga do Kael em vez da calça): sempre conferir o `git diff` depois de editar por script.
- Veículos com o mesmo raio de colisão estacionados em fila empurram um ao outro: estacionar lado a lado, com distância maior que `(r1 + r2) * 0,72`.
- Celular esquentando: o limite de 60 qps, a resolução dinâmica, a sombra a cada 2 quadros, a mescla de malhas paradas e menos NPCs no Alto resolveram.

## Trânsito, mapa e progresso (26/11)
- **Trânsito da rodovia:** `cidade.trafego`, cada carro com `va`, que é a velocidade atual.
  - Segue o carro da frente e freia para os obstáculos que o jogo passa em `cidade.atualizar(..., obstaculosTransito())`.
  - Buzina quando para por causa do jogador.
- **`interagirTransito`:** batida de verdade, uma por encontro (`tBatida`). Atropela quem está a pé na faixa e derruba pedestres acima de ~18 km/h.
- **`lugarLivre(x, z, r)`:** procura em espiral o ponto livre mais próximo. É usado no início, no teleporte e na sala, para ninguém nascer dentro de carro ou poste.
- **Mapa:** `fundoMapa` é desenhado uma vez (ruas, rodovia, aeroporto, selva e os prédios a partir de `cidade.colisores`, com a cor pela altura).
  - O minimapa é redondo, gira com `camYaw` e muda de zoom pela velocidade.
  - O mapa grande abre com Tab ou toque e tem os pontos clicáveis que teleportam.
- **Sombra:** só as peças de veículo com raio de 0,3 m ou mais projetam sombra (`projetaSombra`). Isso cortou ~68% das peças no passe de sombra.
- **Progresso:** pontos e checkpoint ficam em `localStorage` (`hryz_progresso_v1`).
- **Diagnóstico:** perfil por CDP (`Profiler.start`) mais a contagem de malhas visíveis por grupo da cena (`__jogo.cena()`).
  - No teste use `--ignore-gpu-blocklist` junto do llvmpipe, senão a página não sobe.

## Física da moto (jogo.js)
- Entre-eixos de 1,375 m e esterço menor em alta.
- Inclinação de equilíbrio na curva: `atan(v·ω/g)`, limitada a ±0,85 rad e suavizada. Ela levanta a frente um pouco ao acelerar e afunda ao frear.
- **Velocidade (todos os veículos, 26/11):**
  - **Motor:** `0,4·acel·gás·(1 − (v/vmax)³)`, o que dá 0–100 km/h em ~3 s na moto.
  - **Solto:** perde `0,4 + 0,035v + 0,0006v²` m/s² (o triplo nas máquinas). Vai embalado: na moto, de 169 para 129 km/h em 4 s.
  - **Freio:** `0,3·freio` (~9–10 m/s²). O acelerador sobe em rampa (`gasS`).
  - **Antes:** acelerava a 24 m/s² e parava em 4 s, e o dono reclamou.
- **Botões de toque dirigindo:** ficam em arco em volta do GÁS. Grau fica em cima do GÁS, Babalu em cima do RÉ e Drift à esquerda do RÉ. No carro, o Drift passa para cima do GÁS.
- Parada: descanso abaixado e inclinada 0,11 rad para a esquerda (`estacionarMoto`).
- **Manobras:**
  - **Grau** (Shift + W, ou botão Grau): empina na roda de trás até ~53°, com oscilação, e limita a ~97 km/h. Gira em volta do contato do pneu traseiro.
  - **Babalu** (B na freada, ou botão Babalu): traseira no ar, freando forte. Gira em volta do pneu da frente.
  - **Queimar pneu** (Espaço + W parado): a roda de trás gira no lugar e solta fumaça.
  - A sombra de contato some enquanto a moto está empinada.
