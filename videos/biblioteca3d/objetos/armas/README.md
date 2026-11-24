# Armas do jogo (Blender, por script)

`criar_armas.py` faz duas armas genéricas (sem marca e sem copiar um modelo real) e exporta `pistola.glb` e `metralhadora.glb`:
- **Pistola** semiautomática (~19 cm): ferrolho com serrilhas e janela de ejeção, armação com trilho, cabo inclinado com frisos, guarda-mato, miras, cano.
- **Metralhadora** (carabina automática, ~84 cm): caixa da culatra com trilho e mira de ponto vermelho, guarda-mão com fendas, cano com quebra-chamas, coronha retrátil, cabo, carregador curvo.

Peças separadas para animar: `Ferrolho` (corre para trás no tiro), `Gatilho`, `Carregador` (sai na recarga). Marcadores: `Boca` (saída do cano),
`Ejecao` (janela das cápsulas) e, na metralhadora, `Apoio` (onde a mão esquerda segura). No Three.js o cano aponta para +Z, y para cima, e a origem é o topo do cabo (onde a mão direita segura).

Gerar de novo: `blender -b -P criar_armas.py -- --glb . [--render pasta]`.

No jogo: `jogo/armas.js` (classe `Armas`): o personagem mira com IK de dois ossos nos braços do elenco, tiro com recuo, ferrolho, clarão com luz,
cápsula que quica, rastro, faíscas, poeira e marca no ponto atingido, som sintetizado, munição (15 e 30), recarga e clique sem munição.
Controles: 1 pistola, 2 metralhadora, 3 ou G guarda, clique esquerdo atira (segurar = rajada na metralhadora), X recarrega; no celular, botões Arma e Atirar.
