import json
# (chave, texto, pausa depois em s)
S = [
 ('h1', 'Esse bebê foi condenado à prisão perpétua.', .5),
 ('h2', 'Ele tinha dois anos.', .7),
 ('h3', 'O crime? A família dele tinha uma Bíblia.', .8),
 ('h4', 'E se você acha que ele foi solto logo depois… você está completamente enganado.', 1.2),
 ('a1', 'Coreia do Norte, 2009.', .5),
 ('a2', 'Numa casa simples, uma família guardava um segredo debaixo do assoalho: uma Bíblia.', .5),
 ('a3', 'Os pais liam escondidos, à noite, enquanto o filho de dois anos dormia.', 1.0),
 ('b1', 'Só tem um detalhe.', .5),
 ('b2', 'Na Coreia do Norte, quem é adorado é o próprio líder.', .4),
 ('b3', 'Desde pequenas, as pessoas aprendem a se curvar diante das estátuas da família Kim.', .4),
 ('b4', 'Em toda casa, os retratos deles ficam pendurados na parede, e precisam estar sempre limpos.', .5),
 ('b5', 'A lei até fala em liberdade religiosa. Mas, na prática, quem acredita em outro deus vira inimigo do Estado.', 1.0),
 ('c1', 'E não é só isso.', .4),
 ('c2', 'O povo não tem acesso à internet. Existe só uma rede interna, controlada pelo governo, com poucos sites aprovados.', .5),
 ('c3', 'E quem for pego com um filme, uma música ou uma série estrangeira pode ser preso. Ou coisa pior.', 1.3),
 ('d1', 'Até os turistas são vigiados.', .4),
 ('d2', 'Eles andam sempre acompanhados por guias do governo, só visitam lugares escolhidos, e não podem sair sozinhos nem conversar livremente com as pessoas na rua.', 1.0),
 ('e1', 'Tudo isso tem um motivo: controlar o que o povo vê, ouve e pensa.', .5),
 ('e2', 'Quem nunca conheceu outro mundo… não sonha com ele.', 1.0),
 ('f1', 'E a vigilância mais forte vem de perto.', .4),
 ('f2', 'Cada bairro tem grupos de vizinhos que vigiam uns aos outros e contam tudo às autoridades.', .4),
 ('f3', 'Basta um vizinho desconfiar.', 1.0),
 ('g1', 'Foi assim que, em 2009, a polícia bateu naquela porta e encontrou a Bíblia.', .6),
 ('g2', 'E na Coreia do Norte, a punição não é só de quem cometeu o crime.', .4),
 ('g3', 'Pode cair sobre a família inteira, até três gerações.', .6),
 ('g4', 'Por isso o bebê foi junto.', .5),
 ('g5', 'A família toda foi condenada à prisão perpétua, num campo de prisioneiros políticos.', 1.2),
 ('i1', 'Esses campos ficam escondidos nas montanhas.', .4),
 ('i2', 'A ONU estima que dezenas de milhares de pessoas vivam neles, entre trabalho forçado, fome e frio.', .5),
 ('i3', 'Muitas nunca mais saem.', 1.2),
 ('j1', 'E o bebê?', .6),
 ('j2', 'O caso só veio a público mais de dez anos depois, num relatório de direitos humanos, citado pelo governo dos Estados Unidos.', .6),
 ('j3', 'Hoje, ele teria uns dezenove anos.', .5),
 ('j4', 'E ninguém sabe se ele ainda está vivo, nem se um dia saiu de lá.', .8),
 ('j5', 'Ele pode ter passado a vida inteira preso… por causa de um livro que ainda nem sabia ler.', 1.5),
 ('k1', 'Se você acha que mais gente precisa saber disso, compartilha esse vídeo.', .3),
 ('k2', 'E se inscreve.', 1.5),
]
t = .4; out = []
for k, txt, p in S:
    w = len(txt.split()); d = w / 2.45 + .3
    out.append({'k': k, 'txt': txt, 't0': round(t, 2), 't1': round(t + d, 2)}); t += d + p
json.dump({'total': round(t + 1.0, 2), 's': out}, open('narr.json', 'w'), ensure_ascii=False, indent=1)
for o in out: print(o['k'], o['t0'], o['t1'])
print('total', round(t + 1, 1))
