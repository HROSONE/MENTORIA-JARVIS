# Créditos — Short "Dormir em dois minutos" (Hryz Animation)

- **Motor:** Three.js r160 (MIT), renderizado quadro a quadro com Chromium/Playwright (SwiftShader) e montado com ffmpeg (`render.js`, `montar.sh`).
- **Cenário:** guarita de sacos de areia, campo de batalha com ruínas e torre inimiga, ninho do atirador, mesa dos comprimidos, sala de aula de 1942, quarto, lago e canoa — tudo gerado por código nesta pasta (`js/`): geometria, texturas procedurais (canvas), explosões, holofotes, mísseis e caças.
- **Personagens:** gerados por código (`biblioteca3d/personagens/elenco/gerador`): **soldado** e **aviador** (novos, `personagens4.py`), mais o `pai` (instrutor, repintado) e o `homem` (pessoa na cama), já do elenco; nenhum representa uma pessoa real.
- **Tipografia dos textos diegéticos** (quadro de giz, placa "POSTO 7", cartela final): DejaVu Sans (licença Bitstream Vera/DejaVu), desenhada em canvas.
- **Som:** todos os efeitos são sintetizados por `sfx_sono.py` (numpy): explosões em camadas, assobio de míssil, jatos com efeito Doppler, tiros, giz, comprimidos, cantil, relógio, grilos, sapos, água. Respirações e bocejo são vozes sintéticas de apoio; **a locução é gravada pelo dono do canal.** Sem música.
- **Dramatização:** as cenas de guerra são encenadas (sem sangue, sem pessoas reais); o método e os fatos históricos têm fonte em `roteiro_sono_militar.md`.
