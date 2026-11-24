# Assets do Poly Haven usados pelo canal (CC0: uso livre, sem crédito obrigatório)

Fonte: https://polyhaven.com (licença CC0, https://polyhaven.com/license). Os arquivos não vão para o git (imagens são ignoradas);
para baixar tudo de novo: `python3 baixar.py lista`. Formato de cada linha: `tipo id resolução`.

## Short "Ele podia voar" (lucas_poder): quarto
`textura wood_floor_worn 2k`
`textura painted_plaster_wall 2k`
`textura fabric_pattern_07 1k`
`modelo wooden_bookshelf_worn 1k`
`modelo painted_wooden_nightstand 1k`
`modelo desk_lamp_arm_01 1k`
`modelo modern_ceiling_lamp_01 1k`
`modelo alarm_clock_01 1k`
`modelo throw_pillows_01 1k`
`modelo gamepad 1k`
`modelo WoodenTable_01 1k`
`modelo painted_wooden_chair_01 1k`
`hdri approaching_storm 1k`

## Short "Ele podia voar": desfiladeiro, estrada de terra e carro
`textura red_laterite_soil_stones 2k`
`textura cliff_side 2k`
`textura dry_ground_rocks 2k`
`textura rock_face 1k`
`modelo namaqualand_boulder_02 1k`
`modelo namaqualand_boulder_05 1k`
`modelo namaqualand_cliff_01 1k`
`modelo island_tree_02 1k`
`modelo shrub_02 1k`
`modelo shrub_04 1k`
`modelo dead_tree_trunk 1k`
`modelo metal_toolbox 1k`
`hdri valley_of_desolation 2k`
`hdri red_hill_curve 2k`

## Short "Ele podia voar": escola
`modelo SchoolDesk_01 1k`
`modelo SchoolChair_01 1k`
`modelo wall_clock 1k`

## Selva com lago e rochas (cenário do T. rex)
`hdri mossy_forest 2k`
`textura forest_leaves_02 2k`
`textura brown_mud_03 2k`
`textura mossy_rock 2k`
`modelo jacaranda_tree 1k`
`modelo island_tree_01 1k`
`modelo island_tree_03 1k`
`modelo tree_small_02 1k`
`modelo fern_02 1k`
`modelo anthurium_botany_01 1k`
`modelo calathea_orbifolia_01 1k`
`modelo pachira_aquatica_01 1k`
`modelo shrub_01 1k`
`modelo shrub_04 1k`
`modelo root_cluster_01 1k`
`modelo dead_tree_trunk_02 1k`
`modelo rock_moss_set_01 1k`
`modelo rock_moss_set_02 1k`
`modelo boulder_01 1k`
`modelo rock_07 1k`
`modelo rock_face_01 1k`
`modelo mountainside 1k`

## Versões leves e LOD (geradas no Blender a partir do `_1k`; também não vão para o git)
O `modelo/` inteiro é ignorado pelo git (`videos/.gitignore`): depois de baixar de novo com `python3 baixar.py lista`, refazer as versões abaixo. As árvores do Poly Haven têm
milhões de triângulos: para espalhar muitas cópias (`trex_corrida/js/selva3d.js`) o canal usa o `_leve.glb` (com textura) e, para as cópias distantes, o `_lod.glb` (só a geometria).
```
blender -b --python decimar.py -- modelo/<id>/<id>_1k.gltf modelo/<id>/<id>_leve.glb <razão>
blender -b --python gerar_lod.py -- modelo/ <id>:leve:<alvo>        # ou <id>:1k:<alvo> quando não há leve
```
Triângulos medidos nos arquivos que o canal usou (a decimação chega perto do alvo, não exatamente nele):

| modelo | `_1k` | `_leve` (razão do `decimar.py`) | `_lod` |
|---|---|---|---|
| jacaranda_tree | 3863832 | 77276 (0,02) | 8000 |
| island_tree_01 | 1599403 | 47982 (0,03) | 6000 |
| island_tree_02 | 1072213 | 26805 (0,025) | — |
| island_tree_03 | 2085320 | 52133 (0,025) | 6000 |
| tree_small_02 | 2062487 | 61874 (0,03) | 6000 |
| root_cluster_01 | 225261 | 33789 (0,15) | 3999 |
| shrub_01 | 156012 | 31201 (0,2) | 4000 |
| shrub_02 | 27254 | 8174 (0,3) | — |
| dead_tree_trunk | 101802 | 10179 (0,1) | — |
| namaqualand_boulder_02 | 97964 | 7837 (0,08) | — |
| namaqualand_boulder_05 | 89618 | 7169 (0,08) | — |
| anthurium_botany_01 | 67152 | — | 4996 |
| boulder_01 | 66122 | — | 26614 |
| calathea_orbifolia_01 | 16688 | — | 2996 |
| dead_tree_trunk_02 | 83128 | — | 4000 |
| fern_02 | 6232 | — | 2495 |
| pachira_aquatica_01 | 76914 | — | 5994 |
| rock_07 | 14844 | — | 3000 |
| rock_moss_set_01 | 63127 | — | 4996 |
| rock_moss_set_02 | 57647 | — | 4992 |
| shrub_04 | 27327 | — | 3999 |

A fonte exata de cada `_lod` (leve ou 1k) não ficou registrada: ao refazer, use `leve` quando existir e `1k` nos demais.
