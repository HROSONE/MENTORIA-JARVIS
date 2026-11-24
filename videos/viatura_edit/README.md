# Edit da viatura (vídeo vertical estilo *edit*, cortes na batida)

Vídeo curto (≈ 21 s, 1080×1920, 30 fps) com a viatura Crown Victoria P71 da biblioteca (`biblioteca3d/veiculos/policia`), rua noturna, fumaça de pneu, marcas de pneu, luzes de emergência na batida e pós de *edit* (brilho, clarões, aberração cromática, glitch, varridas, cor). Decupagem completa em `roteiro_edit.md`.

```
node render.js --trabalhadores 3 --w 720 --h 1280 --saida quadros      # renderiza a linha do tempo inteira (630 quadros)
python3 pos.py quadros quadros1080 --proc 4                              # sobe para 1080×1920 e aplica os efeitos
python3 sfx_edit.py sfx_edit.wav                                         # efeitos sonoros curtos (impactos e passadas de ar)
bash montar.sh quadros1080 viatura_edit.mp4 sfx_edit.wav                 # gera viatura_edit_mudo.mp4 e viatura_edit.mp4 (com os efeitos)
bash com_musica.sh musica.mp3 viatura_edit_mudo.mp4 viatura_edit_musica.mp4 <segundo_do_drop_na_musica>
```

- **Música:** a faixa pedida pelo dono é comercial e não é baixada pelo agente; o vídeo está cortado em **143 BPM** (valor de uma fonte de terceiros, a confirmar) com a queda na **batida 17 (6,713 s)**. O `com_musica.sh` alinha a queda da música com a do vídeo, faz fade de saída e mistura os efeitos por cima.
- **Ajustes de andamento:** `BPM` em `js/planos.js` e `pos.py`/`sfx_edit.py`. Mudar o BPM exige renderizar de novo (os cortes mudam de lugar); para pequenas diferenças (±3%) basta esticar o vídeo pronto com `setpts`.
- Os cortes, as luzes (`luzesManual`), a fumaça (`js/fumaca.js`, em forma fechada no tempo) e as marcas de pneu são funções do tempo: câmera lenta e rampas saem exatas em qualquer quadro. Cenário (rua, prédios, postes, letreiro HRYZ) em `js/cena.js`.
- Marca do canal só diegética: placa **HRYZ STATE**, porta **HRYZ CITY**, letreiro de neon **HRYZ ANIMATION**. Sem legendas.
- Quadros e MP4 ficam fora do repositório (`.gitignore` do projeto): só o código é versionado.
