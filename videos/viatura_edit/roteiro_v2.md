# Edit da viatura v2 "Perseguição": decupagem (143 BPM, vertical 1080×1920, 30 fps, 43 batidas ≈ 18,0 s)

**Por que existe:** o dono aprovou o gancho da v1 ("o início está bom") e pediu estratégias de retenção para o desenvolvimento (depois do gancho até o fim). A pesquisa e o diagnóstico da v1 estão em `retencao.md`. A v1 fica como está (`roteiro_edit.md`); a v2 mantém o gancho e reescreve o meio e o fecho.

**Ideia central (micro-missão):** a viatura recebe um alerta no computador de bordo (MDT) e persegue um carro preto. Há **uma pergunta que o espectador acompanha** (a distância até o alvo: 600 m → 520 → 260 → 0), um **laço aberto cedo** (o carro preto à vista logo no começo), **escalada** até o clímax (o cerco, em 72–86 % do vídeo) e um **final que volta ao quadro 0** ("NOVO ALERTA" e o herói de frente). Todo texto é diegético (tela do MDT); sem legenda.

Planos **N** = novos (renderizados em `index2.html`); os demais são quadros da v1 reaproveitados com a mesma câmera, deslocados em batidas inteiras (`exportar2.mjs`). Batida B = 0,4196 s; a queda (drop) cai na **batida 14 (5,874 s)**.

| Plano | Batidas | Tempo (s) | Papel na retenção | Tamanho / ângulo / lente | Movimento |
|---|---|---|---|---|---|
| A1 | 0–2 | 0,00–0,84 | **gancho** (inalterado): o herói de frente, luzes e faróis | geral→close, contra-plongée, 46→42° | push-in na grade |
| A2 | 2–3 | 0,84–1,26 | pista (roda) | detalhe baixo, 3/4, 46→41° | aproxima, a roda gira |
| A3 | 3–4 | 1,26–1,68 | pista (barra de luzes) | detalhe, contra-plongée forte, 58→52° | sobe e gira |
| A4 | 4–5 | 1,68–2,10 | pista (retrovisor e holofote) | detalhe, 40° | push-in |
| **N1** | 5–7 | 2,10–2,94 | **a pergunta**: "ALERTA, veículo preto em fuga, 600 m" | câmera dentro da cabine, olhos do motorista, 56→52° | push-in lento na tela, inclinação leve |
| A6 | 7–8 | 2,94–3,36 | pista (porta POLICE) | close lateral, 42° | travelling na porta |
| **N2** | 8–10 | 3,36–4,20 | **laço aberto**: o carro preto aparece longe, arranca e some na rua | ponto de vista do motorista pelo para-brisa, 34→20° | zoom de aproximação, fumaça |
| B2 | 10–12 | 4,20–5,03 | tensão: pneu traseiro queima | close baixo, 48→42° | push-in lateral |
| B4 | 12–14 | 5,03–5,87 | tensão: o motor grita; escurece na última meia batida | geral→médio, chão, 50→46° | push-in |
| C1 | 14–15,5 | 5,87–6,50 | **QUEDA** (clarão): arrancada, pneu queima | geral, baixo, 36→46° | panorâmica, soco de zoom |
| **N3** | 15,5–16,5 | 6,50–6,92 | **placar da missão**: "520 m" | MDT, em movimento (a rua passa pelo para-brisa) | desfoque de movimento |
| C2 | 16,5–18,5 | 6,92–7,76 | ação: passagem a 115 km/h | médio, calçada, 36→52° | panorâmica |
| C3 | 18,5–19,5 | 7,76–8,18 | ação: a roda, o asfalto em fuga | detalhe, 44° | câmera presa ao carro |
| C4 | 19,5–21 | 8,18–8,81 | ação: drift visto de drone | geral, plongée, 56° | segue a trajetória |
| **N4** | 21–22 | 8,81–9,23 | **placar**: "260 m" (a distância cai à metade: progresso visível) | MDT | desfoque |
| C5 | 22–24 | 9,23–10,07 | respiro de impacto: deslize em câmera lenta (0,3×→0,7×) | médio, calçada, 38° | panorâmica |
| **N5** | 24–25 | 10,07–10,49 | **virada (≈ 56 %)**: o alvo à frente, cada vez maior (a promessa vai ser paga) | câmera no para-choque, 44° | rígida, o alvo cresce |
| D6 | 25–27 | 10,49–11,33 | perseguição: lanternas piscando na batida | médio, traseiro baixo, 46° | rígida, sobe |
| D7 | 27–29 | 11,33–12,17 | perseguição: cruza o letreiro HRYZ (marca diegética) | geral, baixo, 54° | fixa |
| **N7** | 29–31 | 12,17–13,01 | **impasse** (a respirada antes da segunda queda): o alvo parou, faróis acesos; imagem dessaturada, luzes lentas, quase sem som | ponto de vista da viatura, travelling baixo, 32→27° | rente ao flanco da viatura |
| **N8** | 31–34 | 13,01–14,27 | **CLÍMAX** (clarão e glitch): o cerco, a viatura gira em volta do alvo, fumaça e marcas de pneu | médio/geral, 2 m, 48° | a câmera acompanha a viatura por fora do círculo |
| **N9** | 34–35 | 14,27–14,69 | clímax: a roda de fumaça vista de cima | plongée 90°, 52° | gira em volta do eixo |
| **N10** | 35–37 | 14,69–15,52 | clímax: do rabo do alvo, a viatura (e o letreiro) giram ao fundo | baixo, 46° | inclinação, fecha o cerco |
| **N11** | 37–39 | 15,52–16,36 | **recompensa**: a viatura freia de frente para o alvo; a fumaça baixa em câmera lenta (0,5×) | teleobjetiva 24→20°, atrás da viatura | sobe devagar |
| **N12** | 39–40 | 16,36–16,78 | **pergunta respondida**: "SUSPEITO PARADO, 0 m" (a tela muda para verde) | MDT | respiro |
| **N13** | 40–42 | 16,78–17,62 | **fecho com sentido**: gira e pousa no enquadramento do quadro 0 | geral→close, 46° | órbita de 115° descendo até o A1 |
| **N14** | 42–43 | 17,62–18,04 | **laço**: "NOVO ALERTA, 600 m" (volta ao A1 e ao N1) | MDT | push-in |

## Mapa de retenção (o que segura o espectador em cada trecho)
- **0–2,1 s gancho** (A1–A4): inalterado.
- **2,1–5,9 s a pergunta e o laço aberto** (N1, N2): quem é o carro preto? Quanto falta? A tela do computador de bordo dá o número; o carro some na rua.
- **5,9–10,1 s subida de placar** (C1–C5 + N3/N4): cada inserção do MDT mostra progresso (600 → 520 → 260). Quebra de padrão a cada 0,4–0,8 s com ação; o texto grande dá o "onde estamos".
- **10,1–12,2 s a virada** (N5, D6, D7): o alvo à frente e crescendo; o espectador agora vê o que está perseguindo.
- **12,2–13 s impasse** (N7): a única pausa; quebra o padrão de cortes rápidos para o clímax ter contraste (música "respirando").
- **13–16,4 s clímax e pagamento** (N8–N12): 70–86 % do vídeo. A promessa do N1/N2 é paga: o carro preto é cercado e parado; o contador chega a 0.
- **16,4–18 s fecho** (N13, N14): volta ao herói e abre o laço seguinte ("NOVO ALERTA"); o último quadro empurra para o primeiro (replay).

## Sons (curtos, sintetizados; a música do dono entra por cima)
Impactos na queda (b14), no cerco (b31) e no pagamento (b37); passadas de ar nos cortes de varrida; **bipes do MDT** (duplo no alerta, simples nos contadores, "ding" de confirmação no "suspeito parado", duplo de novo no "novo alerta"); respiro no impasse (efeitos quase mudos). Sem cama de ruído e sem música sintetizada.

## Técnica
`index2.html` + `js/planos2.js` renderizam os planos novos (viatura + carro preto civil `criarViatura({ livery: 'liso', civil: true })` + tela do MDT `carro.mdt({...})`); `exportar2.mjs` gera `edl2.json` (quadros da v1 a reaproveitar, efeitos de pós); `render.js --pagina index2.html --lista` renderiza só os quadros novos (≈ 262); `pos2.py` aplica o pós com os tempos da v2; `sfx2.py` faz os efeitos; `montar2.sh` junta.
