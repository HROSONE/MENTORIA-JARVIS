# Armas do jogo (Blender, por script)

`criar_armas.py` faz três armas genéricas (sem marca e sem copiar um modelo real) e exporta `pistola.glb`, `metralhadora.glb` e `sniper.glb`:
- **Pistola** semiautomática (~19 cm): ferrolho com serrilhas e janela de ejeção, armação com trilho, cabo inclinado com frisos, guarda-mato, miras, cano.
- **Sniper** (fuzil de ferrolho, ~1,43 m): cano pesado com freio de boca, luneta com objetiva, ocular e torres, anéis no trilho, bipé recolhido, coronha de polímero verde-oliva com apoio de rosto, ferrolho com alavanca e bola, carregador pequeno. Marcador extra `Luneta` (olho atrás da ocular).
- **Metralhadora** (carabina automática, ~84 cm): caixa da culatra com trilho e mira de ponto vermelho, guarda-mão com fendas, cano com quebra-chamas, coronha retrátil, cabo, carregador curvo.

Peças separadas para animar: `Ferrolho` (corre para trás no tiro), `Gatilho`, `Carregador` (sai na recarga). Marcadores: `Boca` (saída do cano),
`Ejecao` (janela das cápsulas) e, na metralhadora, `Apoio` (onde a mão esquerda segura). No Three.js o cano aponta para +Z, y para cima, e a origem é o topo do cabo (onde a mão direita segura).

Gerar de novo: `blender -b -P criar_armas.py -- --glb . [--render pasta]`.

No jogo: `jogo/armas.js` (classe `Armas`): o personagem mira com IK de dois ossos nos braços do elenco, tiro com recuo, ferrolho, clarão com luz,
cápsula que quica, rastro, faíscas, poeira e marca no ponto atingido, som sintetizado, munição (15 e 30), recarga e clique sem munição.
Controles: 1 pistola, 2 metralhadora, 3 sniper, G guarda (só depois de pegar a arma no mapa), clique esquerdo atira (segurar = rajada na metralhadora), X recarrega; no celular, botões Arma e Atirar.

Sniper no jogo: 1 bala no pente; a reserva só aumenta comprando na Loja de Munição (`jogo/loja.js`). Botão direito (ou Z / Mirar) abre a luneta
(roda = zoom, setas = ajuste fino, Shift segura a respiração) e todo tiro dela vira a **câmera da bala** (`jogo/balacam.js`): câmera lenta seguindo a
bala por toda a trajetória, com rastro e ondas de choque, corte para o alvo no impacto e resolução maior durante a cena.
