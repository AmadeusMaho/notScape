"""Cumbres (nórdico, montaña): aldea = taberna tipo Oda a la alegría en la dórico (viola, arpa-kantele, trompa, cello) · mundo = amanecer pastoral en 6/8 (pentatónico, oboe/flauta/trompa) ·
combate = rey de la montaña (ostinato que crece, si menor) · jefe Yeti = el amanecer en mi menor, pesado, taiko · noche = el amanecer, lento.
GM: viola 41, cello 42, arpa 46, trompa 60, oboe 68, flauta 73, voz 53, coro 52, fagot 70, tremolo 44, timbal 47, celesta 8, tom (kit)."""
from common import *
# ---- aldea ----
A_C = "3:1 3:1 4:1 5:1|5:1 4:1 3:1 2:1|1:1 1:1 2:1 3:1|3:1.5 2:.5 2:2|3:1 3:1 4:1 5:1|5:1 4:1 3:1 2:1|1:1 1:1 2:1 3:1|2:1.5 1:.5 1:2"
V_C = "1^:1 1^:1 2^:1 3^:1|3^:1 2^:1 1^:1 7:1|6:1 6:1 7:1 1^:1|1^:1.5 7:.5 7:2|1^:1 1^:1 2^:1 3^:1|3^:1 2^:1 1^:1 7:1|6:1 6:1 7:1 1^:1|7:1.5 6:.5 6:2"
DR_CA = [(0, 45, 56), (1, 47, 34), (2, 45, 50), (3, 47, 34)]
ALDEA = dict(tonic='A', scale='dorian', bpm=92, beats=4, cycles=5, prog=[1, 1, 4, 1, 1, 4, 7, 1], mel={'A': A_C, 'V': V_C}, db=[4, 1, 0, 3, 1], layers=[
  dict(role='arp', i=46, cy=cyc(5), vel=54, pat=ARP8), dict(role='bass', i=42, cy=[1, 2, 3, 4], vel=56, pat='oct'),
  dict(role='drums', cy=[2, 3, 4], vel=50, pat=DR_CA), dict(role='pad', i=60, cy=[2, 4], vel=40), dict(role='pad', i=48, cy=[3], vel=42),
  dict(role='mel', i=15, cy=[0], name='A', vel=50, bars=[0, 1, 2, 3]),
  dict(role='mel', i=41, cy=[1], name='A', vel=78), dict(role='mel', i=41, cy=[2], name='A', vel=76), dict(role='mel', i=60, cy=[2], name='A', vel=50, o=-12),
  dict(role='mel', i=73, cy=[3], name='V', vel=64), dict(role='mel', i=41, cy=[3], name='V', vel=60, shift=-2),
  dict(role='mel', i=68, cy=[4], name='A', vel=70), dict(role='mel', i=41, cy=[4], name='A', vel=62, o=-12), dict(role='mel', i=46, cy=[4], name='A', vel=48, o=12)])
# ---- mundo (6/8: 6 corcheas por compás) ----
A_CM = "5:3 3:1 2:1 3:1|5:3 3:1 2:1 3:1|5:2 6:1 5:2 3:1|2:6|5:3 3:1 2:1 3:1|6:3 5:1 3:1 5:1|6:2 5:1 3:2 2:1|1:6"
B_CM = "3^:3 2^:1 1^:1 2^:1|3^:3 5^:3|6:3 1^:3|2^:3 3^:3|3^:3 2^:1 1^:1 2^:1|5^:3 3^:3|2^:2 1^:1 6:3|1^:6"
P_CM = [1, 1, 4, 1, 5, 1, 4, 5]
HARP6 = [(0, 'b', 3, 4), (1, 0, .9, -8), (2, 1, .9, -8), (3, 2, .9, -6), (4, 1, .9, -8), (5, 0, .9, -8)]
PB_CM = [6, 6, 4, 4, 2, 5, 4, 5]
MUNDO = dict(tonic='E', scale='major', bpm=120, beats=6, cycles=6, rest=2, prog=P_CM, prog_alt={3: PB_CM}, mel={'A': A_CM, 'B': B_CM, 'C': bridge(PB_CM, 6)}, db=[3, 1, 0, 2, 0, 3], layers=[
  dict(role='arp', i=46, cy=cyc(6), vel=52, pat=HARP6), dict(role='bass', i=42, cy=[1, 2, 4], vel=48, pat='whole'), dict(role='pad', i=48, cy=[2, 4], vel=30),
  dict(role='mel', i=68, cy=[0], name='A', vel=56, bars=[0, 1, 2, 3]),
  dict(role='mel', i=68, cy=[1], name='A', vel=76), dict(role='mel', i=73, cy=[2], name='B', vel=70),
  dict(role='mel', i=60, cy=[3], name='C', vel=64, leg=1.0), dict(role='pad', i=48, cy=[3], vel=30),
  dict(role='mel', i=68, cy=[4], name='A', vel=80), dict(role='mel', i=73, cy=[4], name='A', vel=36, o=12),
  dict(role='mel', i=68, cy=[5], name='A', vel=50, bars=[0, 1, 2, 3])])
# ---- combate ----
R_CC = ("1:.5 2:.5 3:.5 4:.5 3:.5 2:.5 3:1|1:.5 2:.5 3:.5 4:.5 3:.5 2:.5 3:1|3:.5 4:.5 5:.5 6:.5 5:.5 4:.5 5:1|3:.5 4:.5 5:.5 6:.5 5:.5 4:.5 5:1|"
        "5:.5 6:.5 7:.5 1^:.5 7:.5 6:.5 7:1|5:.5 6:.5 7:.5 1^:.5 7:.5 6:.5 7:1|1^:.5 7:.5 6:.5 5:.5 4:.5 3:.5 2:1|1:3 r:1")
E_CC = "1^:4|1^:4|6:2 1^:2|7:2 5:2|1^:4|3^:4|4^:2 2^:2|1^:3 r:1"
DR_CC = [(0, 36, 80), (1, 43, 60), (2, 36, 76), (3, 41, 64), (2.5, 45, 56)] + [(x / 2, 42, 34 + (x % 2) * 12) for x in range(8)]
FL_CC = [(0, 36, 80), (.5, 45, 66), (1, 45, 70), (1.5, 43, 72), (2, 43, 74), (2.5, 41, 78), (3, 41, 82), (3.5, 36, 88), (0, 49, 70)]
COMBATE = dict(tonic='B', scale='minor', bpm=120, beats=4, cycles=6, mel_oct=3, prog=[1, 1, 6, 5, 1, 1, 4, 5], mel={'R': R_CC, 'E': E_CC}, db=[0, 2, 0, 2, 3, 0], layers=[
  dict(role='drums', cy=cyc(6), vel=70, pat=DR_CC, fill=FL_CC), dict(role='bass', i=42, cy=cyc(6), vel=68, pat='eighth', alt=1),
  dict(role='stab', i=60, cy=[2, 4, 5], vel=54, beats=[0, 2], d=.7), dict(role='pad', i=44, cy=[1, 3, 4], vel=44),
  dict(role='mel', i=70, cy=[0, 1], name='R', vel=76), dict(role='mel', i=42, cy=[0, 1], name='R', vel=58),
  dict(role='mel', i=70, cy=[2, 3], name='R', vel=78, o=12), dict(role='mel', i=41, cy=[2, 3], name='R', vel=62, o=12), dict(role='mel', i=68, cy=[3, 4], name='R', vel=56, o=12),
  dict(role='mel', i=60, cy=[4, 5], name='R', vel=82), dict(role='mel', i=52, cy=[4], name='E', vel=60), dict(role='mel', i=73, cy=[4, 5], name='R', vel=54, o=24),
  dict(role='mel', i=60, cy=[3], name='E', vel=64, o=12)])
# ---- jefe Yeti ----
DR_CJ = [(0, 36, 90), (0, 49, 55), (1, 42, 40), (2, 42, 40), (3, 38, 88), (4, 42, 40), (5, 45, 70)]
FL_CJ = [(0, 36, 90), (1, 45, 70), (2, 45, 72), (3, 47, 78), (4, 47, 80), (5, 38, 88), (5.5, 38, 90), (0, 49, 70)]
JEFE = dict(tonic='E', scale='minor', bpm=132, beats=6, cycles=5, prog=[1, 1, 6, 1, 5, 1, 4, 5], mel={'A': A_CM, 'B': B_CM}, db=[0, 1, 0, 1, 2], layers=[
  dict(role='drums', cy=cyc(5), vel=78, pat=DR_CJ, fill=FL_CJ), dict(role='bass', i=42, cy=cyc(5), vel=74, pat='gallop'),
  dict(role='bass', i=47, cy=cyc(5), vel=70, pat='beats', seq=[(0, 0, .4), (3, 0, .4)]),
  dict(role='pad', i=44, cy=cyc(5), vel=46), dict(role='pad', i=52, cy=[2, 3, 4], vel=50, o=-12), dict(role='drone', i=60, cy=cyc(5), vel=48, offs=[0, 7], o=12, every=4),
  dict(role='mel', i=60, cy=[0, 1, 3, 4], name='A', vel=84), dict(role='mel', i=68, cy=[0, 1, 3, 4], name='A', vel=70, o=12),
  dict(role='mel', i=57, cy=[2], name='B', vel=82, o=-12), dict(role='mel', i=40, cy=[2], name='B', vel=70),
  dict(role='mel', i=57, cy=[1, 3, 4], name='A', vel=62, o=-12), dict(role='stab', i=61, cy=[1, 3, 4], bars=[3, 7], vel=70, beats=[0, 1, 3], d=.7)])
# ---- noche ----
NOCHE = dict(tonic='E', scale='major', bpm=90, beats=6, cycles=3, prog=P_CM, mel={'A': A_CM}, db=[2, 0, 3], tail=5, layers=[
  dict(role='arp', i=46, cy=cyc(3), vel=46, pat=HARP6), dict(role='pad', i=48, cy=cyc(3), vel=30, len=1.05), dict(role='pad', i=53, cy=[1, 2], vel=24),
  dict(role='mel', i=8, cy=[0], name='A', vel=40, o=12, bars=[0, 2, 4, 6], leg=1.4),
  dict(role='mel', i=73, cy=[1], name='A', vel=62, leg=.97), dict(role='mel', i=8, cy=[1], name='A', vel=44, o=12),
  dict(role='mel', i=68, cy=[2], name='A', vel=50, leg=.97, bars=[0, 1, 2, 3, 4]), dict(role='mel', i=8, cy=[2], name='A', vel=38, o=12, bars=[0, 1, 2, 3, 4, 5])])
TRACKS = dict(aldea=ALDEA, mundo=MUNDO, combate=COMBATE, jefe=JEFE, noche=NOCHE)
