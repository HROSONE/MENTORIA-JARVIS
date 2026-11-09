# Biblioteca 3D do canal (reutilizável)

Todos os modelos aqui são **CC0 (domínio público)**: podem ser usados em qualquer vídeo, sem precisar dar crédito (o crédito é cortesia).

| Pasta | Conteúdo | Autor | Fonte |
|---|---|---|---|
| `personagens/` | `human.fbx`: humano com esqueleto e animações (Idle, Walk, Run, Jump, Punch, Working, Death). Paletas de cor em `*.png` (32×32): trocar as cores da paleta muda roupa, pele e cabelo | Quaternius | https://opengameart.org/content/animated-human-low-poly |
| `veiculos/` | ~50 veículos em `.glb` (sedan, suv, taxi, police, ambulance, firetruck, truck, delivery, van, tractor, kart, peças) + `Textures/colormap.png` | Kenney (Car Kit) | https://opengameart.org/content/car-kit |
| `casas/` | 6 casas em `.obj` com texturas assadas (`house_a/b/c_bake.png`, `ao_house*.png`) | drummyfish | https://opengameart.org/content/family-house-collection |
| `aviao/` | `Jetliner.obj`: jato comercial (partes: Fusalage, Wings, Tail, TurboFans) | NuclearOsmosis | https://opengameart.org/content/jumbo-jetwide-body |

## Como usar no Three.js (r160)
- Personagem: `FBXLoader` → escala `1.78 / altura` → `SkeletonUtils.clone` para várias pessoas → `AnimationMixer`. Recolorir a paleta com canvas (ver `../larry3d/larry3d.html`, função `paletteTex`).
  - Sentar: `LeftUpLeg/RightUpLeg` x −82°, `LeftLeg/RightLeg` x −84°.
  - Acenar: `RightArm` x −140°, `RightForeArm` z −40° ± 25°.
  - Braços para cima: `RightArm` e `LeftArm` x −150°. Mirar para a frente: `RightArm` [−60, 0, −85], `LeftArm` [−60, 0, 85].
  - Acessórios (boné, tênis, logo) seguem o osso em coordenadas de mundo a cada quadro (`updAcc`).
- Veículos: `GLTFLoader`, escala ~1,6–1,9 para ficar na proporção do personagem.
- Casas: `OBJLoader` + `MeshStandardMaterial({ map: house_X_bake.png })`, centralizar a geometria e escalar para ~8 m.
- Avião: `OBJLoader`, nariz no +Z do arquivo (girar 90° em Y para voar em +X).
- Render: servir por HTTP (`python3 -m http.server`) e usar `render3h.js`/Playwright com SwiftShader.

## O que ainda não tem asset pronto (feito em código em `../larry3d/`)
Cadeira de praia, balões, cerca, postes/fio, tanque de hélio, caixas, céu (shader) e nuvens.
