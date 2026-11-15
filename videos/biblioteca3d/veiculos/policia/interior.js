// INTERIOR da viatura (visto pelas janelas): painel, volante, bancos, console com computador (MDT), grade divisória e banco traseiro de plástico.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ZN } from './forma.js';

const zDeD = d => ZN - d;
const mat = (cor, r = 0.7, m = 0.0, extra = {}) => new THREE.MeshStandardMaterial({ color: cor, roughness: r, metalness: m, ...extra });

function texturaGrade() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512; const g = c.getContext('2d');
  g.clearRect(0, 0, 512, 512); g.strokeStyle = '#0b0b0c'; g.lineWidth = 6;
  for (let i = 0; i <= 512; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(512, i); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 3); t.anisotropy = 4; return t;
}

export function criarInterior(opc = {}) {
  const G = new THREE.Group(); G.name = 'interior';
  const plastico = mat(0x1a1b1d, 0.75), painel = mat(0x141516, 0.55), tecido = mat(0x222427, 0.95), duro = mat(0x2b2d30, 0.6), metal = mat(0x30343a, 0.4, 0.8), preto = mat(0x0a0a0b, 0.5);
  const add = (geo, m, x, y, d, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, zDeD(d)); o.rotation.set(rx, ry, rz); o.castShadow = true; o.receiveShadow = true; G.add(o); return o; };
  const R = (w, h, p, r = 0.02) => new RoundedBoxGeometry(w, h, p, 3, r);

  // assoalho e túnel central
  add(new THREE.BoxGeometry(1.5, 0.02, 2.5), preto, 0, 0.27, 3.05);
  add(R(0.34, 0.14, 1.9, 0.05), plastico, 0, 0.34, 3.0);
  // painel de instrumentos
  add(R(1.72, 0.07, 0.46, 0.03), painel, 0, 0.935, 2.06, 0.1);                                      // tampo do painel
  add(R(1.70, 0.34, 0.12, 0.03), painel, 0, 0.78, 2.28);                                            // face do painel
  add(R(0.58, 0.12, 0.2, 0.04), painel, 0.38, 0.97, 2.15, 0.05);                                    // quadro de instrumentos (lado do motorista)
  const mostrador = add(new THREE.PlaneGeometry(0.4, 0.075), new THREE.MeshStandardMaterial({ color: 0x0b1018, emissive: 0x153a52, emissiveIntensity: 0.8, roughness: 0.3 }), 0.38, 0.955, 2.265, -0.1); mostrador.rotation.y = Math.PI;
  add(R(0.32, 0.24, 0.12, 0.03), plastico, 0, 0.68, 2.35);                                          // central do rádio/ar
  // volante e coluna
  add(new THREE.TorusGeometry(0.19, 0.0175, 12, 40), preto, 0.38, 0.83, 2.36, -0.55);
  add(new THREE.CylinderGeometry(0.02, 0.026, 0.28, 12), plastico, 0.38, 0.77, 2.22, 0.95);
  add(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 20), preto, 0.38, 0.83, 2.36, Math.PI / 2 - 0.55);
  // bancos dianteiros (conchas) e apoios de cabeça
  for (const x of [0.37, -0.37]) {
    add(R(0.52, 0.13, 0.52, 0.05), tecido, x, 0.47, 2.78);                                          // assento
    add(R(0.50, 0.62, 0.12, 0.05), tecido, x, 0.80, 3.04, -0.14);                                   // encosto
    add(R(0.24, 0.17, 0.09, 0.04), tecido, x, 1.19, 3.10, -0.14);                                   // apoio de cabeça
  }
  // console central com computador (MDT) e controlador de sirene
  add(R(0.26, 0.18, 0.78, 0.04), plastico, 0, 0.55, 2.74);
  add(R(0.2, 0.04, 0.2, 0.01), metal, 0, 0.66, 2.55);                                               // suporte
  add(new THREE.CylinderGeometry(0.014, 0.014, 0.34, 8), metal, 0, 0.78, 2.5);                      // haste do suporte
  const tela = add(R(0.34, 0.24, 0.025, 0.012), preto, 0, 0.99, 2.48, -0.28); void tela;
  const lcd = add(new THREE.PlaneGeometry(0.30, 0.20), new THREE.MeshStandardMaterial({ color: 0x0a0e14, emissive: 0x27658c, emissiveIntensity: 0.65, roughness: 0.4 }), 0, 0.99, 2.465, -0.28); lcd.rotation.y = Math.PI; lcd.position.z -= 0.0;
  add(R(0.30, 0.04, 0.12, 0.015), preto, 0, 0.665, 2.82);                                           // controlador de sirene
  // grade divisória entre a frente e o banco traseiro
  const grade = new THREE.MeshStandardMaterial({ color: 0x0c0d0f, map: texturaGrade(), transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.4 });
  const painelG = new THREE.Mesh(new THREE.PlaneGeometry(1.52, 0.92), grade); painelG.position.set(0, 0.95, zDeD(3.20)); painelG.rotation.y = Math.PI / 2 * 0; G.add(painelG);
  add(R(1.55, 0.05, 0.05, 0.015), preto, 0, 1.43, 3.20); add(R(1.55, 0.05, 0.05, 0.015), preto, 0, 0.47, 3.20);
  for (const x of [-0.76, 0.76]) add(R(0.05, 1.0, 0.05, 0.015), preto, x, 0.95, 3.20);
  // banco traseiro de plástico duro
  add(R(1.42, 0.10, 0.50, 0.04), duro, 0, 0.47, 3.62);
  add(R(1.40, 0.56, 0.10, 0.04), duro, 0, 0.80, 3.88, -0.12);
  // prateleira traseira
  add(R(1.55, 0.04, 0.34, 0.01), preto, 0, 1.0, 4.05);
  return G;
}
