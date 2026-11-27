# Ciber-Herói (`ciber_heroi`)

Personagem 3D de super-herói / velocista tático montado integralmente no **Blender 4.0** por script (`criar_ciber_heroi.py`), com esqueleto completo `game_engine` de **53 ossos** (incluindo os **10 dedos articulados** das mãos) e compatibilidade imediata com todas as **117+ animações profissionais** de `biblioteca3d/animacoes/universal.js`.

## Componentes do Modelo
- **`TrajeCorpo`:** Malha muscular contínua (peitoral bipartido esculpido, abdômen *6-pack* segmentado, deltoides, dorsais em V, bíceps/antebraços, glúteos, quadríceps e panturrilhas) com textura PBR *micro-hexagonal* (`tex/hex_albedo.png`, `hex_normal.png`, `hex_roughness.png`).
- **`Luvas`:** Mãos táticas articuladas com os 5 dedos individuais preservados e pesados nos 30 ossos de falange.
- **`ArmaduraEFrisos`:** Placas rígidas e frisos 3D chanfrados projetados sobre a musculatura via `KDTree`:
  - Cinto tático prata escovado em V com fivela central carmesim (frente e costas)
  - Chevrons dorsais prata escovado + carmesim sobre as escápulas
  - Micro-LEDs azul-ciano luminosos abaixo do peitoral externo
  - Braceletes em V prata + vermelho nos antebraços e punhos carmesim
  - Joelheiras hexagonais com aro prata + caneleiras em V prata/vermelho + calcanhares prata
  - Rede completa de costuras 3D em relevo vermelho anodizado
- **`Capacete`:** Casco aerodinâmico azul-marinho acetinado preso ao osso `head`, com viseira em **T** (óptica superior azul-ciano luminosa + canal central fumê + aro prata no maxilar), cápsulas auriculares vermelhas rentes, aletas/asas metálicas prata varridas para trás e placa occipital prata/vermelha.

## Como Reconstruir no Blender
```bash
blender -b --python videos/biblioteca3d/personagens/ciber_heroi/gerar_texturas_hex.py
blender -b --python videos/biblioteca3d/personagens/ciber_heroi/criar_ciber_heroi.py
```

## Uso no Three.js
```js
import { carregarCiberHeroi } from './videos/biblioteca3d/personagens/ciber_heroi/ciber_heroi.js';

const heroi = await carregarCiberHeroi();
scene.add(heroi.obj);
await heroi.tocar('CorrerSprint'); // ou 'ParadoPro', 'SocoJab', 'AcrobaciaRolar', etc.
// no loop: heroi.atualizar(dt);
```
