# Gravações do Wikimedia Commons usadas pelo canal (só domínio público ou CC0)

Fonte: https://commons.wikimedia.org (licença conferida na página de cada arquivo). Arquivos fora do git.

| arquivo | licença | usado em |
|---|---|---|
| 27alligator2bellow.ogg | domínio público | trex_corrida: rugido (corpo grave) |
| Alligatorbellow1.ogg | domínio público | trex_corrida: rugido |
| Alligatorbellowedit.ogg | domínio público | trex_corrida: rugido |
| Yellowstone sound library - Grizzly Bear vocalizations - 001.mp3 | domínio público (NPS, Yellowstone) | trex_corrida: rosnado |
| VOXScrm_homem_jacare.wav (original: "VOXScrm Man eaten by alligator; screams (Wilhelm CS USC).wav", Sheb Wooley, 1951) | CC0 | trex_corrida: gritos do homem (duas tomadas somadas por grito, nunca a tomada famosa sozinha) |
| Gull_1.ogg (18 s), Gull_2.ogg (6 s) | domínio público | tartarugas: gaivota (a sombra da ave) |
| Bathtub_water_splashes.ogg (48 s) | domínio público | tartarugas: respingos (onda levantando o filhote) |
| On_a_pebble_beach.ogg (40 s) | domínio público | tartarugas: arrebentação (reserva do leito do mar) |
| Water_over_rocks_as_tide_recedes.ogg (41 s) | domínio público | tartarugas: água voltando (reserva) |
| Ocean_Waves_on_a_Tropical_Beach.ogg | CC0 | tartarugas: leito do mar (se o servidor deixar baixar; ver abaixo) |
| Swallowing_gulp.ogg (0,4 s) | domínio público | feijao: GULP (engolir o feijão) |
| Sneeze.ogg | CC0 | feijao: o espirro (ATCHIM) |
| Yawning_1.ogg | domínio público | feijao: bocejo no jantar |
| Yawning_twice.ogg | domínio público | reserva (bocejo) |
| Dove_cooing.ogg | domínio público | feijao: o pombo no chapéu |

Para baixar de novo: `curl -A "HryzSoundFetcher/1.0" -o VOXScrm_homem_jacare.wav "https://upload.wikimedia.org/wikipedia/commons/5/57/VOXScrm_Man_eaten_by_alligator%3B_screams_%28Wilhelm_CS_USC%29.wav"` (o servidor às vezes responde 429: tentar de novo depois de 1-2 min).

Os demais arquivos desta lista baixam do mesmo jeito: `curl -A "HryzSoundFetcher/1.0" -o <arquivo> "<url do arquivo na página do Commons: https://commons.wikimedia.org/wiki/File:<nome>>"` (pegar a URL do `upload.wikimedia.org` pela API `action=query&prop=imageinfo&iiprop=url`). Quando o Commons responde 429, esperar alguns minutos e tentar de novo.
O BigSoundBank passou a bloquear acesso automático (403 do Cloudflare) em 17/11: os `.ogg` que já estão em `bsb/` continuam valendo; sons novos de lá só baixando pelo navegador, com a pessoa.
