"""Esqueleto paramétrico do elenco. Mesma topologia e mesmos nomes do Corredor (Raiz, Quadril, Coluna, Coluna2, Peito, Pescoco, Cabeca,
Ombro/Braco/Antebraco/Mao, Coxa/Canela/Pe/Ponteira, sufixos E = esquerda = +X e D = direita), mais ossos do rosto e cadeias de cabelo.
Todos os ossos têm rotação de repouso = identidade; a posição de repouso de cada osso é a da sua junta.
As proporções vêm de fatores sobre um adulto de referência (1,82 m): perna, tronco, braço, pescoço, ombros, quadril, cabeça e pé.
`curva` (rad) dobra a coluna para frente (corcunda); `cabeca_frente` projeta a cabeça."""
import math
import numpy as np
from mat3 import qmul, qrot, ID

NUCLEO = ['Raiz', 'Quadril', 'Coluna', 'Coluna2', 'Peito', 'Pescoco', 'Cabeca',
          'OmbroE', 'BracoE', 'AntebracoE', 'MaoE', 'OmbroD', 'BracoD', 'AntebracoD', 'MaoD',
          'CoxaE', 'CanelaE', 'PeE', 'PonteiraE', 'CoxaD', 'CanelaD', 'PeD', 'PonteiraD']
PAI_NUCLEO = {'Raiz': None, 'Quadril': 'Raiz', 'Coluna': 'Quadril', 'Coluna2': 'Coluna', 'Peito': 'Coluna2', 'Pescoco': 'Peito', 'Cabeca': 'Pescoco',
              'OmbroE': 'Peito', 'BracoE': 'OmbroE', 'AntebracoE': 'BracoE', 'MaoE': 'AntebracoE',
              'OmbroD': 'Peito', 'BracoD': 'OmbroD', 'AntebracoD': 'BracoD', 'MaoD': 'AntebracoD',
              'CoxaE': 'Quadril', 'CanelaE': 'CoxaE', 'PeE': 'CanelaE', 'PonteiraE': 'PeE',
              'CoxaD': 'Quadril', 'CanelaD': 'CoxaD', 'PeD': 'CanelaD', 'PonteiraD': 'PeD'}
SG = {'E': 1.0, 'D': -1.0}


def _rx(v, a):
    """gira o vetor (x, y, z) em torno de X pelo ângulo a (positivo: o que aponta para cima vai para frente)"""
    x, y, z = v
    return np.array([x, y * math.cos(a) - z * math.sin(a), y * math.sin(a) + z * math.cos(a)])


class Esq:
    def __init__(self, perna=1.0, tronco=1.0, braco=1.0, pescoco=1.0, ombros=1.0, quadril=1.0, cabeca=1.0, pe=1.0,
                 curva=0.0, cabeca_frente=0.0, abre_braco=18.0, flexao_cotovelo=25.0):
        self.par = dict(perna=perna, tronco=tronco, braco=braco, pescoco=pescoco, ombros=ombros, quadril=quadril, cabeca=cabeca, pe=pe,
                        curva=curva, cabeca_frente=cabeca_frente)
        self.ossos, self.pai, self.rep, self.cadeias = [], {}, {}, {}
        tz = 0.10 * pe                                          # altura do tornozelo (sola + osso)
        self.torn_y = tz
        joelho_y = tz + 0.43 * perna
        hip_y = tz + 0.87 * perna
        quad_y = hip_y + 0.02 * perna
        self.quad_y = quad_y
        P = {'Raiz': (0.0, 0.0, 0.0), 'Quadril': (0.0, quad_y, 0.0)}
        # coluna: segmentos retos que vão girando para frente (corcunda)
        seg = [('Coluna', 0.09 * tronco, 0.10), ('Coluna2', 0.14 * tronco, 0.30), ('Peito', 0.15 * tronco, 0.55), ('Pescoco', 0.14 * tronco, 0.85),
               ('Cabeca', 0.09 * pescoco, 1.10)]
        pos = np.array(P['Quadril'])
        ang = {}
        for nome, comp, f in seg:
            a = curva * f
            pos = pos + _rx((0.0, comp, 0.0), a)
            if nome == 'Cabeca':
                pos = pos + np.array([0.0, 0.0, cabeca_frente + 0.007])
            P[nome] = tuple(pos)
            ang[nome] = a
        a_ombro = 0.8 * curva
        peito = np.array(P['Peito'])
        for lado in 'ED':
            s = SG[lado]
            P['Ombro' + lado] = tuple(peito + _rx((s * 0.045 * ombros, 0.10 * tronco, -0.005), a_ombro))
            sh = peito + _rx((s * 0.195 * ombros, 0.065 * tronco, 0.0), a_ombro)
            P['Braco' + lado] = tuple(sh)
            ab, fl = math.radians(abre_braco), math.radians(flexao_cotovelo)
            u = np.array([s * math.sin(ab), -math.cos(ab), math.sin(math.radians(3))])
            u /= np.linalg.norm(u)
            cot = sh + 0.33 * braco * u
            f = np.array([s * math.sin(math.radians(8)) * math.cos(fl), -math.cos(math.radians(8)) * math.cos(fl), math.sin(fl)])
            f /= np.linalg.norm(f)
            P['Antebraco' + lado] = tuple(cot)
            P['Mao' + lado] = tuple(cot + 0.26 * braco * f)
            P['Coxa' + lado] = (s * 0.09 * quadril, hip_y, 0.0)
            P['Canela' + lado] = (s * 0.095 * quadril, joelho_y, 0.012 * perna)
            P['Pe' + lado] = (s * 0.095 * quadril, tz, -0.012 * perna)
            P['Ponteira' + lado] = (s * 0.095 * quadril, tz - 0.065 * pe, -0.012 * perna + 0.115 * pe)
        for n in NUCLEO:
            self._add(n, PAI_NUCLEO[n], P[n])
        # medidas do pé (no sistema do pé, relativas ao tornozelo)
        self.PE_CALC = np.array([0.0, -tz, -0.085 * pe])
        self.PE_BOLA = np.array([0.0, -tz, 0.115 * pe])
        self.PE_JUNTA = np.array([0.0, -0.065 * pe, 0.115 * pe])
        self.pe_k = pe
        # cabeça: queixo e topo
        head_y = self.rep['Cabeca'][1]
        self.cabeca_h = 0.235 * cabeca
        self.queixo_y = head_y - 0.045 * cabeca
        self.topo_y = self.queixo_y + self.cabeca_h
        self.altura = self.topo_y
        self._derivar()

    def _add(self, nome, pai, pos):
        self.ossos.append(nome)
        self.pai[nome] = pai
        self.rep[nome] = np.array(pos, dtype=float)

    def _derivar(self):
        self.idx = {n: i for i, n in enumerate(self.ossos)}
        self.loc = {n: (self.rep[n] if self.pai[n] is None else self.rep[n] - self.rep[self.pai[n]]) for n in self.ossos}
        self.L1 = float(np.linalg.norm(self.rep['CanelaE'] - self.rep['CoxaE']))
        self.L2 = float(np.linalg.norm(self.rep['PeE'] - self.rep['CanelaE']))
        self.LB1 = float(np.linalg.norm(self.rep['AntebracoE'] - self.rep['BracoE']))
        self.LB2 = float(np.linalg.norm(self.rep['MaoE'] - self.rep['AntebracoE']))
        self.D0 = {}
        for l in 'ED':
            v = self.rep['Canela' + l] - self.rep['Coxa' + l]
            w = self.rep['Pe' + l] - self.rep['Canela' + l]
            self.D0[l] = (v / np.linalg.norm(v), w / np.linalg.norm(w))
        self.nb = len(self.ossos)

    def add_osso(self, nome, pai, pos):
        self._add(nome, pai, pos)
        self._derivar()

    def add_cadeia(self, nome, pai, pontos):
        """cadeia de M ossos (cabelo, fita): `pontos` tem M+1 pontos do mundo (as M juntas e a ponta). Cria os ossos nome1..nomeM."""
        pontos = [np.asarray(p, dtype=float) for p in pontos]
        anterior = pai
        nomes = []
        for k in range(len(pontos) - 1):
            n = '%s%d' % (nome, k + 1)
            self._add(n, anterior, pontos[k])
            nomes.append(n)
            anterior = n
        self.cadeias[nome] = dict(ossos=nomes, pontos=np.array(pontos), pai=pai)
        self._derivar()
        return nomes

    def fk(self, rots, quad_pos=None):
        """cinemática direta: `rots` nome -> quaternion local (faltou = identidade). Devolve (posições, rotações) de mundo"""
        P, Q = {}, {}
        for n in self.ossos:
            pai = self.pai[n]
            r = rots.get(n, ID)
            if pai is None:
                Q[n], P[n] = r, self.loc[n].copy()
            else:
                Q[n] = qmul(Q[pai], r)
                loc = self.loc[n] if (n != 'Quadril' or quad_pos is None) else np.asarray(quad_pos, dtype=float)
                P[n] = P[pai] + qrot(Q[pai], loc)
        return P, Q

    def comprimento(self, a, b):
        return float(np.linalg.norm(self.rep[b] - self.rep[a]))
