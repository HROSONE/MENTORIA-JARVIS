# Short "Câmara de ar sem tirar a roda" (37,4 s, 1080×1920, sem legenda e sem som: o dono narra)

Por que não dá: as duas pernas do garfo + o eixo formam um anel fechado que passa pelo meio da roda; a câmara de ar também é um anel
fechado. Para ela ficar em volta do pneu, o eixo teria de passar por dentro dela (os dois anéis enganchados), e isso só acontece cortando
um deles. Sem uma perna do garfo, o anel abre: a câmara sai pela ponta livre do eixo, passa por baixo do pneu e fica em pé em volta dele.

| Tempo | O que aparece | Fala sugerida |
|---|---|---|
| 0,0–3,0 | Close: a câmara de ar enganchada no eixo, sendo puxada | "Ele quer colocar essa câmara de ar sem tirar a roda da moto." |
| 3,0–8,0 | A câmara entra deitada pela frente, por cima do pneu, é puxada para baixo pela frente e por trás e engancha no eixo | "Põe por cima do pneu, puxa por trás… e trava no eixo." |
| 8,0–13,0 | Vista do outro lado: presa também | "Do outro lado, a mesma coisa." |
| 13,0–19,0 | Raio-x: garfo + eixo acendem como um anel amarelo | "O garfo e o eixo fazem um anel fechado em volta da roda." |
| 19,0–24,0 | A câmara (vermelha) enganchada nesse anel | "E a câmara também é um anel fechado. Um não sai do outro sem cortar." |
| 24,0–30,0 | A perna esquerda do garfo sobe e sai | "Mas se um lado do garfo não existisse…" |
| 30,0–35,0 | A câmara sai pela ponta do eixo, passa por baixo do pneu e fica em pé em volta dele | "…ela passaria inteira por cima do pneu." |
| 35,0–37,4 | Volta à imagem do começo (loop) | "Com os dois lados presos, não tem jeito." |

Render: `node render.js --trabalhadores 2` (quadros em `quadros/`), depois `bash montar.sh quadros silencio.wav saida.mp4`.
Cena: `js/cena.js` (moto do Blender `biblioteca3d/veiculos/moto/moto.glb`, sem o para-lama; disco e pinça transparentes nos closes).
