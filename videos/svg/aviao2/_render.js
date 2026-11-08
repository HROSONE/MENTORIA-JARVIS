/* ===================== defs e render ===================== */
let NOISE = '';
(function () { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), im = x.createImageData(256, 256); for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } x.putImageData(im, 0, 0); NOISE = c.toDataURL(); })();
const STATIC = `<filter id="b4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
<linearGradient id="skyGrey" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8A929E"/><stop offset="1" stop-color="#C8CCD2"/></linearGradient>
<linearGradient id="skyRain" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0A0E1A"/><stop offset="1" stop-color="#2A3248"/></linearGradient>
<linearGradient id="beamW2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE6B0" stop-opacity=".6"/><stop offset="1" stop-color="#FFE6B0" stop-opacity="0"/></linearGradient>
<filter id="b12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>
<filter id="b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>
<radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".8"/></radialGradient>
<radialGradient id="gWarm"><stop offset="0" stop-color="#FFD9A0" stop-opacity=".85"/><stop offset=".4" stop-color="#FFB060" stop-opacity=".3"/><stop offset="1" stop-color="#FF8A30" stop-opacity="0"/></radialGradient>
<radialGradient id="gRed"><stop offset="0" stop-color="#FF4A3A" stop-opacity=".7"/><stop offset=".5" stop-color="#B0101A" stop-opacity=".3"/><stop offset="1" stop-color="#600008" stop-opacity="0"/></radialGradient>
<radialGradient id="gTv"><stop offset="0" stop-color="#9FD0FF" stop-opacity=".5"/><stop offset="1" stop-color="#3A6AFF" stop-opacity="0"/></radialGradient>
<radialGradient id="gSun"><stop offset="0" stop-color="#FFF0C0" stop-opacity="1"/><stop offset=".3" stop-color="#FFB060" stop-opacity=".6"/><stop offset="1" stop-color="#FF7A30" stop-opacity="0"/></radialGradient>
<radialGradient id="gMoon"><stop offset="0" stop-color="#DDE6FF" stop-opacity=".6"/><stop offset="1" stop-color="#9AB0FF" stop-opacity="0"/></radialGradient>
<radialGradient id="gCity"><stop offset="0" stop-color="#FFE0A0" stop-opacity=".9"/><stop offset=".4" stop-color="#FFB050" stop-opacity=".35"/><stop offset="1" stop-color="#FF9030" stop-opacity="0"/></radialGradient>
<linearGradient id="skyN" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05081A"/><stop offset=".7" stop-color="#16244A"/><stop offset="1" stop-color="#2A3A66"/></linearGradient>
<linearGradient id="skyDawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A2E5A"/><stop offset=".5" stop-color="#C8605A"/><stop offset=".8" stop-color="#FFB070"/><stop offset="1" stop-color="#FFD8A0"/></linearGradient>
<linearGradient id="skyDay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FA8D8"/><stop offset="1" stop-color="#D8E4EE"/></linearGradient>
<linearGradient id="skyDusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1A1A3A"/><stop offset=".6" stop-color="#6A3A4A"/><stop offset="1" stop-color="#C8705A"/></linearGradient>
<linearGradient id="beamM" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFD4FF" stop-opacity=".45"/><stop offset="1" stop-color="#BFD4FF" stop-opacity="0"/></linearGradient>
<linearGradient id="beamF" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFF6D8" stop-opacity=".8"/><stop offset="1" stop-color="#FFF6D8" stop-opacity="0"/></linearGradient>
<linearGradient id="beamF2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF6D8" stop-opacity=".6"/><stop offset="1" stop-color="#FFF6D8" stop-opacity=".05"/></linearGradient>
<linearGradient id="beamH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFF6D8" stop-opacity=".7"/><stop offset="1" stop-color="#FFF6D8" stop-opacity="0"/></linearGradient>
<linearGradient id="beamS" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F4F8FF" stop-opacity=".8"/><stop offset="1" stop-color="#F4F8FF" stop-opacity="0"/></linearGradient>
<linearGradient id="bootG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0E0D10"/><stop offset=".6" stop-color="#26242A"/><stop offset="1" stop-color="#3A3840"/></linearGradient>
<linearGradient id="portG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E8E0C8"/><stop offset="1" stop-color="#B8A888"/></linearGradient>
<linearGradient id="shine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".8"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient>
<pattern id="bars8" width="60" height="2000" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="14" height="2000" fill="#000"/></pattern>
<pattern id="noiseP" width="256" height="256" patternUnits="userSpaceOnUse"><image href="${NOISE}" width="256" height="256"/></pattern>`;
const defsEl = document.getElementById('defs'), root = document.getElementById('root');
function frame(t) {
  D = []; uid = 0;
  const sh = shotAt(t);
  let body = FN[sh[0]](t);
  for (const c of SH.slice(1)) if (t >= c[1] && t < c[1] + .07 && !['drop2', 'swap'].includes(c[0])) body += `<rect width="1080" height="1920" fill="#fff" opacity="${op(.15 * (1 - (t - c[1]) / .07))}"/>`;
  defsEl.innerHTML = STATIC + D.join('');
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
