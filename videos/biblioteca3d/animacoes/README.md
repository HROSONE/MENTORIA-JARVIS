# Biblioteca Universal de Animações Profissionais (`biblioteca3d/animacoes/`)

Pacote unificado de **117+ animações profissionais livres para uso comercial (CC0 / Domínio Público)** com **retarget universal automático** para **todos os personagens 3D do projeto**:
- **Elenco (21 personagens):** `policial`, `bombeiro`, `soldado`, `aviador`, `astronauta`, `jovem_a/b/c`, `homem`, `pai`, `mae`, `davi`, `teo`, `lia`, `nina`, `velha`, `maniaco`, `faxineira`, `entregador`, `terno2/3`...
- **Corredor:** `corredor.glb`, `corredor-colorido.glb`
- **Realistas (MakeHuman/Unreal):** `lucas10`, `lucas12`, `maratonista`, `mendes`, `rocha`, `professora`, `trilheiro` (incluindo movimento automático dos 5 dedos das mãos!)

## Fontes Baixadas Localmente
1. `UAL1_Standard.glb` & `UAL1_Standard_RM.glb` — **Quaternius Universal Animation Library 1** (42 animações 30 fps, **CC0 1.0**).
2. `UAL2_Standard.glb` & `UAL2_Standard_RM.glb` — **Quaternius Universal Animation Library 2** (42 animações 30 fps, **CC0 1.0**).
3. `../mocap/cmu/*.json` — **32 capturas ópticas de estúdio CMU** convertidas a 30 fps (+ mais de 2.300 disponíveis via `python3 ../mocap/baixar.py <código>`).

## Como usar em qualquer personagem (1 linha!)

```js
import { Personagem } from '../biblioteca3d/personagens/elenco/elenco.js';
import { criarLucasReal, URL_REAL } from '../lucas_poder/js/lucasreal.js';
import { instalarAnimacoesUniversal } from '../biblioteca3d/animacoes/universal.js';

// 1) Em qualquer personagem do Elenco ou Corredor:
const policial = await Personagem.carregar('../biblioteca3d/personagens/elenco/policial.glb');
await instalarAnimacoesUniversal(policial);
await policial.tocar('MirarPistola'); // ou 'CorrerSprint', 'AgacharAndar', 'Escalar1m', 'AndarFurtivo'...
// As expressões faciais continuam funcionando junto!
policial.rosto({ expressao: 'raiva', forca: 0.8 });

// 2) Em qualquer personagem Realista (lucas10, lucas12, professora, mendes...):
const lucas = await criarLucasReal({ url: URL_REAL('lucas10') });
await instalarAnimacoesUniversal(lucas);
await lucas.tocar('CorrerSprint');

// Em tempo real:
policial.atualizar(dt);
lucas.atualizar(dt);

// Ou em quadro exato `t` (para vídeos determinísticos window.__frame(t)):
await policial.pose('MirarPistola', t);
await lucas.pose('AcrobaciaRolar', t);
```

## Principais Animações Prontas (Apelidos PT-BR ou Nome Original)

- **Locomoção & Parkour:** `ParadoPro` (`Idle_Loop`), `BracosCruzados` (`Idle_FoldArms_Loop`), `AndarPro` (`Walk_Loop`), `AndarFormal` (`Walk_Formal_Loop`), `CarregarAndando` (`Walk_Carry_Loop`), `Trotar` (`Jog_Fwd_Loop`), `CorrerSprint` (`Sprint_Loop`), `AgacharParado` (`Crouch_Idle_Loop`), `AgacharAndar` (`Crouch_Fwd_Loop`), `AndarDeCostas` (`cmu:69_34`), `AndarFurtivo` (`cmu:120_09`), `Mancar` (`cmu:77_19`), `PularInicio` (`Jump_Start`), `PuloNinja` (`NinjaJump_Start`), `AcrobaciaRolar` (`Roll`), `EscorregarLoop` (`Slide_Loop`), `Escalar1m` (`ClimbUp_1m`), `SubirEscada` (`cmu:13_33`), `NadarFrente` (`Swim_Fwd_Loop`), `Empurrar` (`Push_Loop`).
- **Cotidiano & Atuação:** `ConversarEmPe` (`Idle_Talking_Loop`), `ConversarCelular` (`Idle_TalkingPhone_Loop`), `SentarEntrar` (`Sitting_Enter`), `SentadoParado` (`Sitting_Idle_Loop`), `ConversarSentado` (`Sitting_Talking_Loop`), `Dirigir` (`Driving_Loop`), `Interagir` (`Interact`), `PegarNaMesa` (`PickUp_Table`), `PegarNoChao` (`cmu:69_69`), `CarregarMala` (`cmu:70_03`), `ComerBeber` (`Consume`), `ConsertarAjoelhado` (`Fixing_Kneeling`), `LevantarDoChao` (`LayToIdle`), `Dancar` (`Dance_Loop`), `Rir` (`cmu:13_14`), `Chorar` (`cmu:79_72`), `AcenarApontar` (`cmu:13_27`), `Comemorar` (`cmu:142_09`).
- **Ação, Tiro & Combate:** `PistolaParado` (`Pistol_Idle_Loop`), `MirarPistola` (`Pistol_Aim_Neutral`), `AtirarPistola` (`Pistol_Shoot`), `RecarregarPistola` (`Pistol_Reload`), `SocoJab` (`Punch_Jab`), `SocoDireto` (`Punch_Cross`), `SocoGancho` (`Melee_Hook`), `Arremessar` (`OverhandThrow`), `DanoPeito` (`Hit_Chest`), `DanoCabeca` (`Hit_Head`), `DanoEmpurrao` (`Hit_Knockback`), `CairMorto` (`Death01`), `EspadaCombo` (`Sword_Regular_Combo`), `ZumbiAndar` (`Zombie_Walk_Fwd_Loop`).
