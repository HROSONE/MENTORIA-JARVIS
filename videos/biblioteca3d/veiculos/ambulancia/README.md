# Ambulância Type III (EUA): cabine Ford E-450 "cutaway" + módulo de atendimento

Réplica **procedural** (só código: sem GLB e sem textura externa), no mesmo esquema da viatura (`../policia/`).
Escala real em metros, **frente em +Z**, **+X = lado do motorista (esquerda)**, origem no meio do comprimento, pneus em `y = 0`.

```js
import { criarAmbulancia } from './biblioteca3d/veiculos/ambulancia/ambulancia.js';
import { criarAmbiente } from './biblioteca3d/veiculos/policia/viatura.js';   // reflexos de céu (opcional)
const amb = criarAmbulancia({ numero: '7', cidade: 'HRYZ CITY EMS', placa: 'EMS 911' });
scene.add(amb.grupo);
// a cada quadro:
amb.luzes(t, 'ligado');   // 'off' | 'ligado' (vermelhas alternando lado a lado, branca da frente, âmbar atrás; luz colorida na cena) | 'fixo'
amb.farois(true); amb.posicao(true); amb.cena(true);   // faróis (+2 SpotLights), luzes de contorno, holofotes brancos laterais
amb.freio(true); amb.re(false); amb.seta(1, true);     // seta: 1 = esquerda, -1 = direita
amb.rodar(metros); amb.esterco(-0.3);                  // gira as rodas / esterça as dianteiras
```
`criarAmbulancia(opc)`: `numero` (MEDIC n), `cidade` (nome do serviço), `servico` (texto grande da lateral, padrão AMBULANCE), `placa`, `corBase`, `sombraChao` (`false` desliga).
Devolve `{ grupo, rodas, luzes, farois, posicao, cena, freio, re, seta, rodar, esterco }`.

## O que tem
- **Cabine** (perfil lateral extrudado com bevel): capô, para-brisa inclinado, arco da roda dianteira, janelas, retrovisores grandes de braço cromado, maçanetas, degrau, limpadores; frente com grade cromada, emblema oval genérico, faróis duplos, setas, para-choque cromado e placa; AMBULANCE **espelhado** no capô (para ler no retrovisor de quem vai na frente).
- **Módulo (baú)** com cantos arredondados, calha, ar-condicionado no teto, saias com o vão do **rodado duplo** traseiro, friso cromado lateral, porta lateral do paciente com janela (lado do passageiro), compartimento externo com maçaneta.
- **Grafismo** (canvas): faixa vermelha larga + filete, AMBULANCE, HRYZ CITY EMS, MEDIC 7, estrela da vida genérica; traseira com portas duplas, janelas, dobradiças e **chevrons vermelho/amarelo**; AMBULANCE espelhado na testa do módulo.
- **Luzes**: 5 cabeças na testa (vermelha-vermelha-**branca**-vermelha-vermelha), cantos de cima e de baixo vermelhos, âmbar no meio das laterais e no centro de trás, holofotes de cena brancos, luzes de cruzamento nos para-lamas e na grade, contorno âmbar/vermelho, lanternas verticais (freio, seta, ré).
- **Rodas**: pneu 225/75R16 (Ø ≈ 0,75 m), roda de aço com cubo e porcas; dianteiras simples, traseiras **duplas**.

## Medidas (de fichas de fabricantes de ambulância sobre o E-450)
Entre-eixos 158" (4,013 m) · comprimento 268,5" (6,82 m) · largura 98" (2,49 m) · altura 106,5" (2,70 m) · módulo 169" × 96" (4,29 × 2,44 m), pé-direito 72".
Fontes: Braun Industries (Chief XL, tabela do E-450), Horton Concept 3, edital de compra com E-450 de 158", Osage Ambulances (Type III). Os contornos da cabine são interpretados de fotos: não é digitalização.
**Marcas:** o serviço é fictício ("HRYZ CITY EMS", placa "HRYZ STATE"); o emblema da grade é um oval genérico; a estrela da vida é desenhada de forma genérica.

## Como ver
`ambulancia.html` (bancada): `?cam=tq|tqt|tq2|lado|lado2|frente|tras|topo`, `?pos=..&alvo=..&fov=..`, `?noite`, `?luzes=ligado&t=0.3`, `?farois=1&posicao=1&cena=1&freio=1&seta=1`, `?still`.
`node fotos.js [pasta] [cams] [extra]` tira as fotos de conferência (Chromium sem GPU). `previews/*.webp`: dia (frente, lados, trás, 3/4) e noite com as luzes ligadas.
≈ 57 mil triângulos.
