"""Bosque (silvano/élfico, re lidio): aldea = «Aria» tipo Air (arpa + violín + cello) · mundo = primavera de llamada y respuesta ·
combate = escalas descendentes tipo Hada de Azúcar (celesta, pizzicato) · jefe Fenrir = el mundo en re menor · noche = el mundo, lento.
GM: arpa 46, violín 40, cello 42, cuerdas 48, flauta 73, celesta 8, marimba 12, pizzicato 45, glockenspiel 9, oboe 68, trompa 60, coro 52, timbal 47."""
from common import *
# ---- aldea ----
A_B = "5:2 1^:1 7:1|6:2 5:1 3:1|3:2 6:1 5:1|4:1 3:1 5:2|2^:2 1^:1 7:1|6:1 5:1 7:2|1^:2 6:1 5:1|5:4"
V_B = "3:1 5:1 1^:1 3^:1|2^:.5 1^:.5 7:1 5:2|6:1 5:.5 3:.5 6:1 5:1|4:1 3:1 2:2|5:1 2^:1 1^:.5 7:.5 6:1|5:1 7:1 1^:2|3^:1 2^:.5 1^:.5 7:1 6:1|5:4"
ALDEA = dict(tonic='D', scale='lydian', bpm=66, beats=4, cycles=4, prog=[1, 5, 6, 3, 2, 5, 1, 5], mel={'A': A_B, 'V': V_B}, db=[4, 1, 0, 3], layers=[
  dict(role='arp', i=46, cy=cyc(4), vel=58, pat=ARP8), dict(role='arp', i=46, cy=[2, 3], vel=46, pat=UP4, o=12),
  dict(role='pad', i=48, cy=[0], vel=30), dict(role='pad', i=48, cy=[1, 3], vel=44), dict(role='pad', i=48, cy=[2], vel=38),
  dict(role='bass', i=42, cy=[1, 2, 3], vel=52, pat='oct'),
  dict(role='arp', i=8, cy=[0, 2], vel=40, pat=[(1.5, 4, .8, 0), (3.5, 3, .8, -6)], o=12),
  dict(role='mel', i=40, cy=[1], name='A', vel=76), dict(role='mel', i=73, cy=[1], name='A', vel=34, o=12),
  dict(role='mel', i=73, cy=[2], name='V', vel=66), dict(role='mel', i=40, cy=[2], name='V', vel=44, shift=-2),
  dict(role='mel', i=40, cy=[3], name='A', vel=84), dict(role='mel', i=42, cy=[3], name='A', vel=56, o=-12), dict(role='mel', i=73, cy=[3], name='A', vel=40, o=12)])
# ---- mundo ----
A_M = "1:1 3:.5 5:.5 1^:2|7:.5 1^:.5 2^:1 3^:2|2^:.5 1^:.5 2^:.5 3^:.5 1^:2|7:1 5:1 6:2|5:.5 6:.5 7:.5 1^:.5 2^:1 3^:1|3^:.5 2^:.5 1^:.5 7:.5 6:2|5:1 6:.5 7:.5 1^:1 2^:1|1^:4"
B_M = "5:.5 1^:.5 3^:.5 1^:.5 5^:2|4^:.5 3^:.5 2^:.5 1^:.5 7:2|6:.5 1^:.5 3^:.5 1^:.5 6^:2|5^:1 3^:1 2^:2|3^:.5 2^:.5 3^:.5 5^:.5 3^:2|2^:.5 1^:.5 2^:.5 3^:.5 1^:2|7:.5 1^:.5 2^:.5 4^:.5 3^:1 2^:1|1^:3 r:1"
P_M = [1, 1, 5, 1, 5, 1, 2, 5]
DR_WOOD = [(0, 77, 40), (1, 76, 34), (2, 77, 38), (3, 76, 34)] + [(x / 2 + .5, 82, 22) for x in range(0, 8, 2)]
MARI4 = [(0, 'b', .9, 4), (.5, 0, .5, -8), (1, 1, .5, -8), (1.5, 2, .5, -4), (2, 1, .5, -8), (2.5, 0, .5, -8), (3, 2, .5, -6), (3.5, 1, .5, -10)]
PB_M = [6, 6, 2, 5, 6, 3, 2, 5]
MUNDO = dict(tonic='D', scale='lydian', bpm=100, beats=4, cycles=6, rest=2, prog=P_M, prog_alt={3: PB_M}, mel={'A': A_M, 'B': B_M, 'C': bridge(PB_M)}, db=[3, 1, 0, 2, 0, 3], layers=[
  dict(role='arp', i=12, cy=cyc(6), vel=50, pat=MARI4), dict(role='bass', i=45, cy=[0, 1, 2, 4, 5], vel=56, pat='walk'), dict(role='bass', i=42, cy=[3], vel=48, pat='whole'),
  dict(role='drums', cy=[0, 1, 2, 4, 5], vel=50, pat=DR_WOOD),
  dict(role='mel', i=9, cy=[0], name='A', vel=40, o=12, bars=[0, 1, 2, 3]),
  dict(role='mel', i=40, cy=[1], name='A', vel=78), dict(role='mel', i=73, cy=[2], name='B', vel=72),
  dict(role='mel', i=68, cy=[3], name='C', vel=64, leg=1.0), dict(role='pad', i=48, cy=[3], vel=32),
  dict(role='mel', i=40, cy=[4], name='A', vel=82), dict(role='mel', i=9, cy=[4], name='A', vel=34, o=12),
  dict(role='mel', i=73, cy=[5], name='B', vel=50, bars=[0, 1, 2, 3])])
# ---- combate ----
R_B = ("5^:.5 4^:.5 3^:.5 2^:.5 1^:.5 7:.5 6:.5 5:.5|4:.5 5:.5 6:.5 4:.5 5:1 r:1|5^:.5 4^:.5 3^:.5 2^:.5 1^:.5 7:.5 6:.5 5:.5|6:.5 7:.5 1^:.5 2^:.5 1^:2|"
       "3^:.5 2^:.5 1^:.5 7:.5 6:.5 5:.5 4:.5 3:.5|2:.5 3:.5 4:.5 5:.5 6:1 7:1|1^:.5 7:.5 6:.5 5:.5 4:.5 5:.5 6:.5 7:.5|1^:3 r:1")
E_B = "1^:2 5:2|4:2 6:2|1^:2 5:2|2^:2 4^:2|3^:2 1^:2|6:2 7:2|1^:2 5:2|1^:3 r:1"
DR_BC = [(0, 36, 76), (1, 38, 72), (2, 36, 70), (3, 38, 74), (2.5, 45, 50)] + [(x / 2, 42, 36 + (x % 2) * 14) for x in range(8)]
FL_BC = [(0, 36, 76), (1, 38, 72), (1.5, 38, 60), (2, 45, 70), (2.5, 45, 72), (3, 47, 76), (3.5, 47, 80), (3.75, 50, 84)] + [(x / 2, 42, 36) for x in range(8)]
COMBATE = dict(tonic='D', scale='dorian', bpm=108, beats=4, cycles=6, prog=[1, 4, 1, 4, 1, 7, 4, 1], mel={'R': R_B, 'E': E_B}, db=[0, 2, 0, 2, 3, 0], layers=[
  dict(role='drums', cy=cyc(6), vel=64, pat=DR_BC, fill=FL_BC), dict(role='bass', i=45, cy=cyc(6), vel=68, pat='eighth', alt=1),
  dict(role='stab', i=12, cy=cyc(6), vel=44, beats=[.5, 1.5, 2.5, 3.5], d=.25, o=12),
  dict(role='mel', i=8, cy=[1, 3, 4], name='R', vel=74), dict(role='mel', i=73, cy=[1, 3, 4], name='R', vel=62),
  dict(role='mel', i=13, cy=[3, 4], name='R', vel=44, o=12),
  dict(role='mel', i=40, cy=[2], name='E', vel=78), dict(role='mel', i=73, cy=[2], name='E', vel=52), dict(role='pad', i=48, cy=[2, 4], vel=46), dict(role='stab', i=60, cy=[4], vel=56, beats=[0, 2], d=.6),
  dict(role='mel', i=40, cy=[5], name='E', vel=60, bars=[0, 1, 2, 3])])
# ---- jefe Fenrir ----
JEFE = dict(tonic='D', scale='minor', bpm=120, beats=4, cycles=6, prog=[1, 1, 6, 1, 5, 1, 4, 5], mel={'A': A_M, 'B': B_M}, tr={4: 1}, db=[0, 1, 0, 1, 2, 0], layers=[
  dict(role='drums', cy=cyc(6), vel=78, pat=DR_BOSS, fill=FL_BOSS), dict(role='bass', i=33, cy=cyc(6), vel=74, pat='gallop'),
  dict(role='bass', i=47, cy=cyc(6), vel=70, pat='beats', seq=[(0, 0, .3), (2, 0, .3)]),
  dict(role='pad', i=44, cy=[0, 1, 2, 3, 4, 5], vel=44), dict(role='pad', i=52, cy=[2, 3, 4], vel=50, o=-12),
  dict(role='mel', i=40, cy=[0, 1, 3, 4], name='A', vel=84), dict(role='mel', i=60, cy=[0, 1, 3, 4], name='A', vel=72),
  dict(role='mel', i=68, cy=[2], name='B', vel=82), dict(role='mel', i=40, cy=[2], name='B', vel=70),
  dict(role='mel', i=57, cy=[1, 3, 4], name='A', vel=62, o=-12), dict(role='stab', i=61, cy=[1, 3, 4], bars=[3, 7], vel=70, beats=[0, .5, 1, 2], d=.35)])
# ---- noche ----
NOCHE = dict(tonic='D', scale='lydian', bpm=60, beats=4, cycles=3, prog=P_M, mel={'A': A_M}, db=[2, 0, 3], tail=5, layers=[
  dict(role='arp', i=46, cy=cyc(3), vel=46, pat=SLOW4), dict(role='pad', i=48, cy=cyc(3), vel=32, len=1.05), dict(role='pad', i=89, cy=[1], vel=26),
  dict(role='mel', i=8, cy=[0], name='A', vel=40, o=12, bars=[0, 2, 4, 6], leg=1.4),
  dict(role='mel', i=73, cy=[1], name='A', vel=62, leg=.97), dict(role='mel', i=8, cy=[1], name='A', vel=44, o=12),
  dict(role='mel', i=40, cy=[2], name='A', vel=50, leg=.97, bars=[0, 1, 2, 3, 4]), dict(role='mel', i=9, cy=[2], name='A', vel=36, o=12, bars=[0, 1, 2, 3, 4, 5])])
TRACKS = dict(aldea=ALDEA, mundo=MUNDO, combate=COMBATE, jefe=JEFE, noche=NOCHE)
