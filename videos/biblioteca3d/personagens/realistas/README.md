# Lucas (personagem realista do Short "Ele podia voar")

Gerado no **Blender 4.2** a partir dos **dados do MakeHuman** (malha base hm08, alvos de forma, esqueleto `game_engine`, roupas e cabelos como proxies). Os modelos exportados do MakeHuman são **CC0**.
Nenhum código de terceiros é executado: `mh.py` lê os arquivos e `criar_lucas.py` monta tudo com `bpy`.

- `mh.py`: leitura de `.obj`, `.target.gz` e `.mhclo`; corpo do Lucas (idade, músculo, peso, magreza/atrofia); recorte da roupa (manga curta, bermuda).
- `texturas_lucas.py` (Python comum com PIL): pele pálida com sardas e olheiras no lugar certo do UV, olho castanho, roupa recolorida, cabelo castanho.
- `criar_lucas.py` (Blender): esqueleto com pesos, 18 expressões como *morph targets* (olhos fechando, sobrancelhas, boca), olhos, exporta GLB e renderiza prévia em Cycles.

```
python3 texturas_lucas.py --dados <mpfb/data> --assets <mhdata> --saida <tex> [--idade 12 --magreza 1 --roupa casa|carro]
blender -b --python criar_lucas.py -- --dados <mpfb/data> --assets <mhdata> --texturas <tex> --saida lucas12.glb --cabelo short01 [--previa previa.png]
```
Dados: `mpfb/data` vem do pacote do MPFB (extensions.blender.org, só os arquivos de dados); `mhdata` são os assets 1.1 do MakeHuman (download.tuxfamily.org/makehuman/assets/1.1/base).
