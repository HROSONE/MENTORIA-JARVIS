# Caixa de munição de morteiro 60 mm (EUA, 2ª Guerra Mundial)

Feita no Blender por script (`criar_caixa.py`), texturas pintadas por script (`texturas.py` → `tex/`).

- **Caixote de madeira** pintado de verde-oliva com lascas e sujeira, travessas nas cabeceiras, **alças de corda**, dobradiças e trinco, **tampa aberta**.
- **Estêncil amarelo**: "10 CARTRIDGES / 60MM, HE, M49A2 / W/FUZE, P.D., M52 / LOT… / WT. 49 LBS." na frente, "10 RDS. / OCT. 1944" na cabeceira e "60MM HE M49A2" na tampa.
- **Granada M49A2** (perfil em gota, espoleta M52 de alumínio, tubo da cauda com 6 aletas, marcas amarelas) e **tubo de fibra preto** com fita amarela e tampas.
- Arrumação: 2 camadas de 5 tubos (10 granadas); 3 tubos de cima já saíram: um aberto com a granada saindo, outro vazio no chão, uma tampa solta, granadas deitadas e uma em pé.
- Medidas reais aproximadas: caixote 34,5 × 41 × 17 cm; granada 24,7 cm × 6 cm de diâmetro; tubo 30 cm × 7,2 cm.

Arquivos: `caixa_morteiro.glb` (para Three.js; tudo dentro do vazio `CaixaMorteiro60mm`, metros, z para cima no Blender = y para cima no glTF), `caixa_morteiro.blend` (texturas embutidas).

Para gerar de novo: `python3 texturas.py` e `blender -b -P criar_caixa.py -- --glb caixa_morteiro.glb --blend caixa_morteiro.blend --render heroi.png [--cam detalhe] [--amostras 96]` (o render põe chão Poly Haven `dry_ground_rocks` e HDRI `mossy_forest`).

Fontes: caixote datado de outubro de 1944 marcado "10 RDS." (International Military Antiques); FM 23-90, apêndice A (cada granada vem num tubo de fibra). O lote, o peso e o mês no estêncil são ilustrativos.
