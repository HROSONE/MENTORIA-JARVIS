import json
# uma frase por cena; a imagem conta a mesma coisa sozinha
S = [
 ('n1', 'Na vida real, esse preso de Alcatraz começou a esconder capas de chuva debaixo do colchão.', 4.8),
 ('n2', 'Ele roubava uma de cada vez, sempre que o guarda virava as costas.', 4.6),
 ('n3', 'Noite após noite, a pilha foi crescendo. Mais de cinquenta capas.', 4.4),
 ('n4', 'No calor do cano de vapor, ele colava uma capa na outra, até formar um bote.', 5.0),
 ('n5', 'Na barbearia, ele juntava escondido o cabelo cortado do chão.', 4.2),
 ('n6', 'Com sabão, papel e tinta, fez uma cabeça falsa, colou o cabelo e deixou na cama, no lugar dele.', 6.2),
 ('n7', 'Na ronda da madrugada, o guarda olhou pela grade e viu ele dormindo.', 4.6),
 ('n8', 'Mas ele já estava no telhado com mais dois presos, levando o bote até a água.', 5.4),
 ('n9', 'De manhã, a cabeça rolou no chão. E os três nunca mais foram encontrados.', 5.6)]
t = 0; out = []
for k, txt, d in S:
    out.append({'k': k, 'txt': txt, 't0': round(t + .1, 2), 't1': round(t + d - .3, 2), 'a': round(t, 2), 'b': round(t + d, 2)}); t += d
json.dump({'total': round(t, 2), 's': out}, open('narr.json', 'w'), ensure_ascii=False, indent=1)
for o in out: print(o['k'], o['a'], o['b'], round(len(o['txt'].split()) / (o['t1'] - o['t0']), 2), 'pal/s')
print(t)
