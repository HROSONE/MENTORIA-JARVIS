# Viatura Ford Crown Victoria Police Interceptor (P71, 2006–2011)

Réplica **procedural** (só código: sem GLB e sem textura externa) do carro de polícia mais famoso dos EUA, modelada a partir das medidas oficiais da Ford e de fotos de referência (Wikimedia Commons, licenças livres).
Escala real em metros, **frente em +Z**, **+X = lado do motorista (esquerda)**, origem no meio do comprimento, pneus apoiados em `y = 0`.

```js
import { criarViatura, criarAmbiente } from './biblioteca3d/veiculos/policia/viatura.js';
const carro = criarViatura({ livery: 'preto-branco', numero: '117', cidade: 'HRYZ CITY', placa: 'HRYZ 911' });
scene.add(carro.grupo);
scene.environment = criarAmbiente(renderer);          // reflexos de céu (opcional: use o ambiente da sua cena)
// a cada quadro:
carro.luzes(t, 'ligado');   // barra + LEDs: 'off' | 'ligado' (vermelho/azul alternando, duplo clarão) | 'fixo' | 'busca'
carro.farois(true);         // faróis acesos (brilho nas lentes + 2 SpotLights)
carro.freio(true); carro.re(false); carro.seta(1, true);   // seta: 1 = esquerda, -1 = direita
carro.rodar(metrosPercorridos); carro.esterco(-0.3);       // gira as rodas (distância acumulada) / esterça as dianteiras (rad, + = esquerda)
```

`criarViatura(opc)`: `livery` (`'preto-branco'` clássica, `'branco-azul'` faixa azul e dourada, `'branco'` lisa), `numero` (teto, porta traseira), `cidade`, `placa`, `barra` (`false` = sem barra), `pushbar` (`true` = para-choque de proteção), `corBase` (substitui a cor da pintura), `sujeira` (0–1, sujeira de estrada embaixo; padrão 0,5), `sombraChao` (`false` desliga a sombra de contato), `luzes` (modo inicial da barra), `relevo` (força das frestas).
Devolve `{ grupo, pintura, rodas, barra, luzes, farois, freio, re, seta, rodar, esterco }`.

## O que tem
- **Carroceria** em "loft" de seções transversais (capô, para-lamas, portas, porta-malas, para-choques com projeção e recuo) + casca da cabine (teto, colunas) com os vidros recortados por máscara; arcos de roda circulares com friso e túnel escuro.
- **Pintura** (`pintura.js`): verniz (clearcoat), frestas dos painéis com relevo, vedação preta dos vidros, coluna B preta, tampa do tanque, sujeira de estrada, grafismo (POLICE, distintivo genérico, número, faixa). Tudo é desenhado em canvas e aplicado por projeção planar nos três eixos (lados, topo, frente/trás) — por isso não precisa de UV.
- **Frente/trás** (`frente.js`): grade com malha e oval, faróis (lente + seta âmbar), entradas de ar, placa; lanternas com lente de ré, oval da Ford, placa traseira; todas as luzes acendem (`farois`, `freio`, `re`, `seta`).
- **Rodas** (`rodas.js`): pneu P235/55R17 com banda de rodagem, roda de aço preta 17" com calota cromada e furos de ventilação, disco e pinça de freio.
- **Acessórios** (`acessorios.js`): barra de luzes baixa (vermelho/azul, faróis de busca brancos, setas âmbar atrás) com clarões e **luz colorida que ilumina a cena**; LEDs na grade, nos retrovisores e no deck traseiro; retrovisores, holofote da coluna A, maçanetas, antenas, limpadores, escapamento; push bar opcional.
- **Interior** (`interior.js`): painel, volante, bancos, console com computador (MDT) aceso, grade divisória, banco traseiro de plástico — visto pelas janelas.

## Medidas e como foram obtidas
Comprimento 5,385 m · largura 1,989 m (sem retrovisores) · altura 1,443 m · entre-eixos 2,914 m · bitola ≈ 1,60 m · pneu P235/55R17 (Ø ≈ 0,69 m) · vão livre mínimo ≈ 0,14 m (a soleira fica a ≈ 0,17 m). Fontes: fichas técnicas do P71 em agregadores de especificações (AutoPadre, iSeeCars; não é documento da Ford) e fotos da categoria *Ford Crown Victoria Police Interceptor* do Wikimedia Commons.
Posições na carroceria (base do para-brisa ≈ 1,74 m do nariz, fresta entre as portas ≈ 2,90 m, traseira da porta ≈ 3,78 m, base do vidro traseiro ≈ 4,17 m) e o layout da frente e da traseira foram **lidos em fotos** (régua: entre-eixos, largura do carro e placa de 0,305 m) e conferidos sobrepondo o modelo a uma foto de 3/4 com a câmera calculada por PnP — a aproximação é boa, mas não é uma digitalização: contornos finos (nariz, capô, colunas) são interpretados.
**Marcas:** o oval da Ford aparece como no carro real. O **departamento é fictício** ("HRYZ CITY", placa "HRYZ STATE", distintivo genérico) — não copia emblema de nenhuma polícia real.

## Como ver
- `viatura.html` (bancada): `?cam=tq|tqt|lado|frente|tras|topo|baixo`, `?pos=x,y,z&alvo=x,y,z&fov=40`, `?ort=1&h=2` (ortográfica), `?grade=1`, `?livery=branco-azul`, `?pushbar=1`, `?luzes=ligado&t=0.3`, `?farois=1&freio=1&seta=1`, `?env=0.3`, `?still`.
- `viatura_vitrine.html`: vitrine noturna com câmera de cinema (protocolo `__total` / `__frame(t)` do projeto; `?t=segundos` para um quadro só).
- `previews/*.webp`: imagens de referência do resultado.

## Custo
≈ 167 mil triângulos; três pares de texturas de pintura (4096×2048, 1024×2048, 2048×1024) desenhadas no carregamento (alguns segundos num navegador sem GPU, bem menos com GPU). Em cena com muitos carros, reaproveite a mesma instância quando possível.
