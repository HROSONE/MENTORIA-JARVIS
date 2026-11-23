// Instância do motor compartilhado (videos/core/motor.js) com os parâmetros deste vídeo.
import { criarMotor, glb, clonarGLB, sombras, canvasTex, texBrilho, texFumaca, brilho, Rajada, tremor } from '../../core/motor.js';

export const { LARG, ALT, FPS, renderer, scene, cam, mundos, capturar, tela } = criarMotor({ exposicao: 1.1, near: 0.05, far: 700, mundos: ['P', 'A', 'V'] });
export { glb, clonarGLB, sombras, canvasTex, texBrilho, texFumaca, brilho, Rajada, tremor };
