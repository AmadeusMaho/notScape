"""Patrones compartidos de los 30 temas (arpegios, percusión GM bank 128)."""
ARP8 = [(0, 'b', 1.8, 5), (.5, 0, .6, -8), (1, 1, .6, -6), (1.5, 2, .6, -4), (2, 3, .6, -6), (2.5, 2, .6, -8), (3, 1, .6, -6), (3.5, 2, .6, -8)]
UP4 = [(0.5, 3, .8, 0), (1.5, 4, .8, -6), (2.5, 5, .8, 0), (3.5, 4, .8, -8)]
SLOW4 = [(0, 'b', 3, 0), (1, 0, 2.5, -8), (2, 1, 2, -8), (3, 2, 1.5, -4)]
DR_BOSS = [(0, 36, 85), (1, 38, 85), (1, 45, 70), (2, 36, 80), (2.5, 36, 55), (3, 38, 88), (3, 47, 75)] + [(x / 2, 42, 44) for x in range(8)]
FL_BOSS = [(0, 36, 85), (.5, 45, 70), (1, 38, 85), (1.5, 45, 72), (2, 47, 78), (2.5, 47, 80), (3, 50, 85), (3.5, 50, 90), (0, 49, 70)]
def cyc(n): return list(range(n))

def bridge(prog, beats=4, base=(4, 6, 7, 9, 9, 7, 5, 4), nbars=8):
    """Puente automático para escalas de 7 notas: dos notas largas por compás, siempre del acorde (prog = grados enteros),
    siguiendo un arco `base` (pasos de escala sobre la tónica). Devuelve la cadena de melodía."""
    prev = None; prev2 = None; out = []; d = beats / 2.0
    for i in range(nbars):
        r = prog[i] - 1; cand = [r + o + 7 * k for o in (0, 2, 4) for k in (0, 1)]
        notes = []
        for tgt in (base[i], base[(i + 1) % nbars] + (1 if i % 2 else -1)):
            best = min((c for c in cand if c != prev and c != prev2), key=lambda c: abs(c - tgt)); notes.append(best); prev2, prev = prev, best
        out.append(' '.join('%d%s:%g' % (n % 7 + 1, '^' * (n // 7), d) for n in notes))
    return '|'.join(out)
