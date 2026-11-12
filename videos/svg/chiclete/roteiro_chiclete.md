# Se Você Engolir Um Chiclete 🤔

Short 2D (SVG), 1080×1920, 33 s, 9 planos. Primeiro teste do formato aprendido com os virais (ESTILO.md, "O que aprendi lendo virais"): 84 palavras (2,6 palavras/s), a primeira frase já é a ação, cada frase muda a tela, termina quando o processo termina e a bola rosa no centro emenda o fim no começo (loop).

## Narração (narr.json)
| bloco | tempo | texto |
|---|---|---|
| b1 | 0,1–5,2 | Quando você engole um chiclete, a sua garganta aperta em onda e empurra ele pra baixo. |
| b2 | 5,3–10,4 | No estômago, o ácido dissolve o açúcar e o sabor… mas a goma não se desfaz. |
| b3 | 10,5–15,0 | Ela é amassada junto com a comida, horas e horas, e continua inteira. |
| b4 | 15,1–21,0 | Aí desce pelo intestino, uns seis metros de tubo, empurrada pelas mesmas ondas. |
| b5 | 21,1–26,9 | No intestino grosso, ela segue junto com o que sobrou da comida. |
| b6 | 27,0–32,6 | Uns dois dias depois, ela sai do seu corpo… quase do jeito que entrou. |

## Decupagem (diretor)
1. **boca** 0–2,4: corte lateral da cabeça (perfil em silhueta, por dentro em cores); a língua empurra o chiclete para a garganta; push-in.
2. **esofago** 2,4–5,2: dentro do tubo, anéis de músculo apertam em onda atrás da bola; a câmera desce junto (usa a altura do vertical).
3. **estomago** 5,2–7,8: plongée; a bola cai no ácido, splash, comida boiando.
4. **acido** 7,8–10,4: macro; cristais de açúcar e pontos de sabor se soltam e chiam; a goma fica.
5. **amassa** 10,4–15,0: paredes amassando; a comida encolhe, a goma continua igual.
6. **corpo** 15,0–17,7: pull-out para o corpo inteiro com a barriga transparente; o caminho acende; fita métrica "6 m".
7. **intestino** 17,7–21,0: intestino delgado (vilosidades), travelling lateral com a bola espremida.
8. **grosso** 21,0–26,9: intestino grosso (bolsas, bactérias coloridas, restos), câmera desce.
9. **saida** 26,9–33,0: plongée sobre o vaso (embalagem HRYZ no chão); a bola cai na água; push-in até a bola rosa no centro.

## Som (sfx_chiclete.py, tudo sintetizado)
Coração e drone grave ao fundo; língua e gole; squish das ondas do esôfago; splash e gorgolejo no estômago; chiado do ácido; squish ritmado amassando; ding + fita métrica; squish longos no intestino; borbulhas graves; plop no vaso.

## Fatos e fontes
- A goma-base não é digerida; açúcar, adoçantes e aromas são. O chiclete passa inteiro e sai em poucos dias (o trânsito intestinal costuma levar cerca de 2 dias). O mito dos "7 anos" é falso.
- Intestino delgado: cerca de 6 m.
- Engolir muitos de uma vez (principalmente crianças) pode causar obstrução: não é recomendado.
- Fontes: Duke Health ("Does swallowed gum stay in your stomach for 7 years?"), Scientific American ("Does it take 7 years to digest swallowed gum?"), Healthline, Cleveland Clinic.

## Título e descrição
- Título: **Se Você Engolir Um Chiclete 🤔**
- Descrição: A goma do chiclete não é digerida, mas também não fica 7 anos no estômago. Ela faz a viagem inteira e sai em uns dois dias. (Não engula de propósito, principalmente muitos de uma vez.) #shorts #curiosidades #corpohumano

## Gerar
```
python3 sfx_chiclete.py && python3 build.py
cd ../.. && PAGE=svg/chiclete/chiclete.html FR=<pasta> VW=1080 VH=1920 node render_svg.js <w> 4 30   # 4 workers
ffmpeg -framerate 30 -i <pasta>/f%05d.jpg -i svg/chiclete/chiclete_sfx.mp3 -c:v libx264 -b:v 3200k -pix_fmt yuv420p -c:a aac -b:a 160k -shortest chiclete.mp4
```
