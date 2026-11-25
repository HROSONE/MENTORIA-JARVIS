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

## Física da moto (jogo.js)
- Entre-eixos de 1,375 m e esterço menor em alta.
- Inclinação de equilíbrio na curva: `atan(v·ω/g)`, limitada a ±0,85 rad e suavizada. Ela levanta a frente um pouco ao acelerar e afunda ao frear.
- Parada: descanso abaixado e inclinada 0,11 rad para a esquerda (`estacionarMoto`).
- **Manobras:**
  - **Grau** (Shift + W, ou botão Grau): empina na roda de trás até ~53°, com oscilação, e limita a ~97 km/h. Gira em volta do contato do pneu traseiro.
  - **Babalu** (B na freada, ou botão Babalu): traseira no ar, freando forte. Gira em volta do pneu da frente.
  - **Queimar pneu** (Espaço + W parado): a roda de trás gira no lugar e solta fumaça.
  - A sombra de contato some enquanto a moto está empinada.
