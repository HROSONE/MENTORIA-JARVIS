/* ===================== defs e render ===================== */
let NOISE = '';
(function () { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), im = x.createImageData(256, 256); for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } x.putImageData(im, 0, 0); NOISE = c.toDataURL(); })();
const STATIC = `<filter id="b4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
<filter id="b12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
<filter id="b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>
<radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".8"/></radialGradient>
<radialGradient id="gMoon"><stop offset="0" stop-color="#E4EDFF" stop-opacity=".85"/><stop offset=".35" stop-color="#9FB8FF" stop-opacity=".32"/><stop offset="1" stop-color="#6F8CFF" stop-opacity="0"/></radialGradient>
<radialGradient id="gLamp"><stop offset="0" stop-color="#FFE2A8" stop-opacity=".95"/><stop offset=".3" stop-color="#FFA640" stop-opacity=".5"/><stop offset="1" stop-color="#FF7A18" stop-opacity="0"/></radialGradient>
<radialGradient id="gAmber"><stop offset="0" stop-color="#FFD9A0" stop-opacity=".9"/><stop offset=".5" stop-color="#FFA24A" stop-opacity=".3"/><stop offset="1" stop-color="#FF7A20" stop-opacity="0"/></radialGradient>
<radialGradient id="gGold"><stop offset="0" stop-color="#FFF4B8" stop-opacity="1"/><stop offset=".3" stop-color="#FFD15A" stop-opacity=".55"/><stop offset="1" stop-color="#FFB020" stop-opacity="0"/></radialGradient>
<pattern id="noiseP" width="256" height="256" patternUnits="userSpaceOnUse"><image href="${NOISE}" width="256" height="256"/></pattern>`;
const defsEl = document.getElementById('defs'), root = document.getElementById('root');
function frame(t) {
  D = []; uid = 0;
  const sh = shotAt(t);
  let body = FN[sh[0]](t);
  if (typeof POS === 'function') body = POS(t, body);
  for (const c of SH.slice(1)) if (t >= c[1] && t < c[1] + .07 && FLASH.includes(c[0])) body += `<rect width="1080" height="1920" fill="#fff" opacity="${op(.18 * (1 - (t - c[1]) / .07))}"/>`;
  defsEl.innerHTML = STATIC + EXTRA + (typeof EXTRA2 !== 'undefined' ? EXTRA2 : '') + (typeof EXTRA3 !== 'undefined' ? EXTRA3 : '') + (typeof EXTRA4 !== 'undefined' ? EXTRA4 : '') + (typeof EXTRA5 !== 'undefined' ? EXTRA5 : '') + (typeof EXTRA6 !== 'undefined' ? EXTRA6 : '') + D.join('');
  root.innerHTML = body;
}
const params = new URLSearchParams(location.search);
const stage = document.getElementById('stage'), startEl = document.getElementById('start');
const fit = () => stage.style.setProperty('--s', Math.min(innerWidth / 1080, innerHeight / 1920));
addEventListener('resize', fit); fit();
const audio = window.AUDIO_SRC ? new Audio(window.AUDIO_SRC) : null;
let playing = false, offset = parseFloat(params.get('t') || '0'), t0 = 0;
const current = () => playing ? Math.min(TOTAL, offset + (performance.now() - t0) / 1000) : offset;
function play() { if (playing) return; playing = true; t0 = performance.now(); startEl.classList.add('hide'); if (audio) { audio.currentTime = offset; audio.play(); } }
startEl.addEventListener('click', play);
window.__total = TOTAL;
window.__seek = t => { playing = false; offset = t; frame(t); };
window.__ready = true;
if (params.has('hideui')) startEl.classList.add('hide');
if (params.has('still')) frame(offset); else (function loop() { frame(current()); requestAnimationFrame(loop); })();
