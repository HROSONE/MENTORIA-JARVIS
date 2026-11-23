// Instância do motor compartilhado (videos/core/motor.js) com os parâmetros deste vídeo.
import { criarMotor, glb, clonarGLB, sombras, canvasTex, texBrilho, texFumaca, brilho, Rajada, tremor } from '../../core/motor.js';

export const { LARG, ALT, FPS, renderer, scene, cam, mundos, capturar, tela } = criarMotor({ exposicao: 1.1, near: 0.2, far: 3200, mundos: ['V'] });
export { glb, clonarGLB, sombras, canvasTex, texBrilho, texFumaca, brilho, Rajada, tremor };
