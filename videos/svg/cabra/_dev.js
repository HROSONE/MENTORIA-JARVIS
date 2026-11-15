/* harness de desenvolvimento: a cabra num fundo de pôr do sol. t escolhe o modo:  0-9 corpo inteiro · 10-19 cabeça grande */
const SH = [['dev', 0, TOTAL]]; const FLASH = [];
const shotAt = t => SH[0];
const FN = { dev(t) {
  let s = `<defs><linearGradient id="dvSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A2A58"/><stop offset=".45" stop-color="#C8643C"/><stop offset=".8" stop-color="#FFB45A"/><stop offset="1" stop-color="#FFD890"/></linearGradient></defs>`;
  s += `<rect width="1080" height="1920" fill="url(#dvSky)"/><circle cx="900" cy="700" r="160" fill="url(#gSun)"/><circle cx="900" cy="700" r="70" fill="#FFF2C8"/>`;
  const mast = .5 + .5 * Math.sin(t * 10.5);
  if (t >= 20) s += `<g transform="translate(560,1300) scale(1.25)">${silhuetaDev()}</g><rect x="0" y="1300" width="1080" height="700" fill="#2A1C20"/>`;
  else if (t < 10) s += `<g transform="translate(560,1300) scale(1.25)">${cabraCorpo({ t, mast: mast * .5, lod: 0, pose: t < 5 ? 'alerta' : 'comer' })}</g><rect x="0" y="1300" width="1080" height="700" fill="#2A1C20"/>`;
  else s += `<g transform="translate(470,1000) scale(1.28)">${cabeca({ t, mast, lod: 0 })}</g>`;
  return s + VIG(.5);
} };
