// Confere o tubarao.glb no Three.js (navegador sem GPU): node ver_tubarao.js pasta_de_saida [vistas] [largura altura] [opcoes json]
// vistas: lado,ataque,cabeca,boca,baixo,topo,nado0..nado3 (padrão: lado,ataque,cabeca,boca). Usa o servidor e o navegador do trex_corrida/harness.js.
// opções (JSON, para achar a causa de um defeito de aparência): {"sem":"normal,verniz,mapa","rug":0.5,"verniz":0.1,"sufixo":"_teste"}
const { abrir } = require('../../../trex_corrida/harness'); const fs = require('fs'), path = require('path');
(async () => {
  const [saida, lista, L, A, J] = process.argv.slice(2); const vistas = (lista || 'lado,ataque,cabeca,boca').split(','), larg = +(L || 1100), alt = +(A || 700), opc = J ? JSON.parse(J) : {};
  fs.mkdirSync(saida, { recursive: true });
  const { p, fechar } = await abrir('../biblioteca3d/animais/tubarao/ver_tubarao.html' + (process.env.GLB ? `?glb=${process.env.GLB}` : ''), larg, alt);      // GLB=outro.glb (na mesma pasta) para testar uma exportação
  if (!J) console.log(JSON.stringify(await p.evaluate(() => window.__info())));
  for (const v of vistas) {
    const url = await p.evaluate(([n, o]) => window.__vista(n, o), [v, opc]); fs.writeFileSync(path.join(saida, `tub_${v}${opc.sufixo || ''}.jpg`), Buffer.from(url.split(',')[1], 'base64')); console.log('vista', v);
  }
  await fechar();
})();
