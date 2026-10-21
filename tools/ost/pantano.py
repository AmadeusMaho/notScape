"""Pantano (palafito, fango y bruma): aldea = tipo Gymnopédie (clarinete, guitarra, acordeón) · mundo = marcha de marioneta (banjo, tuba, clarinete) ·
combate = danza macabra (xilófono, banjo, fiddle, la menor armónica) · jefe Rey Ciénaga = marcha fúnebre (tuba, fagot, timbal, coro) · noche = kalimba/vibráfono.
GM: clarinete 71, fagot 70, acordeón 21, guitarra acero 25, armónica 22, marimba 12, tuba 58, contrabajo 32, kalimba 108, banjo 105, vibráfono 11, xilófono 13."""
from common import *
# ---- aldea ----
A_P = "5:1 3^:2|3^:2 2^:1|1^:2 7:1|5:3|5:1 3^:2|4^:2 3^:1|2^:2 1^:1|1^:3"
V_P = "3:1 5:1 1^:1|2^:2 1^:1|7:1 1^:1 3^:1|2^:3|3:1 5:1 1^:1|4^:2 3^:1|2^:1 3^:1 2^:1|1^:3"
G3 = [(0, 'b', 1.0, 5), (1, 0, .9, -8), (1.5, 1, .9, -6), (2, 2, .9, -6), (2.5, 1, .9, -8)]
ALDEA = dict(tonic='F', scale='major', bpm=63, beats=3, cycles=5, prog=[1, 4, 1, 4, 1, 4, 5, 1], mel={'A': A_P, 'V': V_P}, db=[4, 1, 0, 2, 3], layers=[
  dict(role='arp', i=25, cy=cyc(5), vel=54, pat=G3), dict(role='bass', i=70, cy=[1, 2, 3, 4], vel=52, pat='beats', seq=[(0, 0, 2.6)]),
  dict(role='pad', i=21, cy=[1, 3], vel=36), dict(role='pad', i=21, cy=[2, 4], vel=44), dict(role='arp', i=12, cy=[2, 4], vel=40, pat=[(1.5, 4, .8, 0), (2.5, 3, .8, -8)], o=12),
  dict(role='mel', i=12, cy=[0], name='A', vel=44, o=12, bars=[0, 1, 2, 3], leg=1.2),
  dict(role='mel', i=71, cy=[1], name='A', vel=76), dict(role='mel', i=22, cy=[2], name='V', vel=52), dict(role='mel', i=71, cy=[2], name='V', vel=58, shift=-2),
  dict(role='mel', i=71, cy=[3], name='A', vel=80), dict(role='mel', i=22, cy=[3], name='A', vel=40, o=12),
  dict(role='mel', i=71, cy=[4], name='V', vel=78), dict(role='mel', i=12, cy=[4], name='V', vel=46, o=12), dict(role='mel', i=21, cy=[4], name='V', vel=36)])
# ---- mundo ----
A_PM = ("5:.5 r:.5 5:1 3:.5 r:.5 5:1|6:.5 r:.5 6:1 4:.5 r:.5 6:1|5:.5 r:.5 5:1 3:.5 5:.5 7:1|1^:3 r:1|"
        "2^:.5 r:.5 2^:1 7:.5 r:.5 2^:1|1^:.5 r:.5 1^:1 6:.5 r:.5 1^:1|7:.5 6:.5 5:1 4:1 3:1|5:3 r:1")
B_PM = ("1^:1 7:.5 6:.5 5:1 3:1|4:1 3:.5 4:.5 5:1 6:1|7:1 6:.5 7:.5 1^:1 3^:1|2^:2 5:2|"
        "1^:1 7:.5 6:.5 5:1 3:1|4:1 6:1 1^:1 6:1|5:1 7:1 2^:1 4^:1|3^:3 r:1")
P_PM = [1, 1, 4, 1, 7, 4, 1, 5]
OOM = dict(role='bass', i=58, pat='beats', seq=[(0, 0, .5), (1, 7, .4), (2, 0, .5), (3, 7, .4)])
DR_PM = [(0, 36, 50), (1, 56, 36), (2, 36, 46), (3, 56, 36), (.5, 82, 24), (1.5, 82, 24), (2.5, 82, 24), (3.5, 82, 24)]
BANJO = [(0, 'b', .4, 0), (.5, 1, .3, -12), (1, 2, .3, -8), (1.5, 1, .3, -12), (2, 'b', .4, 0), (2.5, 1, .3, -12), (3, 2, .3, -8), (3.5, 1, .3, -12)]
PB_PM = [6, 6, 4, 4, 7, 7, 5, 5]
MUNDO = dict(tonic='C', scale='mixo', bpm=108, beats=4, cycles=6, rest=2, prog=P_PM, prog_alt={3: PB_PM}, mel={'A': A_PM, 'B': B_PM, 'C': bridge(PB_PM)}, db=[3, 1, 0, 2, 0, 3], layers=[
  dict(OOM, cy=[0, 1, 2, 4, 5], vel=62), dict(role='arp', i=105, cy=cyc(6), vel=46, pat=BANJO), dict(role='drums', cy=[0, 1, 2, 4, 5], vel=52, pat=DR_PM),
  dict(role='stab', i=21, cy=[2, 4], vel=32, beats=[.5, 1.5, 2.5, 3.5], d=.3),
  dict(role='mel', i=108, cy=[0], name='A', vel=50, bars=[0, 1, 2, 3]),
  dict(role='mel', i=71, cy=[1], name='A', vel=80), dict(role='mel', i=22, cy=[2], name='B', vel=62),
  dict(role='mel', i=21, cy=[3], name='C', vel=58, leg=1.0), dict(role='bass', i=70, cy=[3], vel=50, pat='whole'),
  dict(role='mel', i=71, cy=[4], name='A', vel=84), dict(role='mel', i=12, cy=[4], name='A', vel=34, o=12),
  dict(role='mel', i=71, cy=[5], name='B', vel=54, bars=[0, 1, 2, 3])])
# ---- combate ----
R_PC = "1^:1 7:.5 1^:.5 5:1|1^:1 7:.5 1^:.5 5:1|6:1 5:.5 6:.5 3:1|4:1 3:.5 4:.5 2:1|1^:1 7:.5 1^:.5 5:1|6:1 7:1 1^:1|2^:1 1^:.5 7:.5 6:1|5:2 r:1"
E_PC = "3^:3|2^:3|1^:3|7:3|6:3|1^:3|7:2 5:1|1^:3"
DR_PC = [(0, 36, 76), (1, 77, 50), (2, 77, 50), (.5, 42, 34), (1.5, 42, 34), (2.5, 42, 34)]
FL_PC = [(0, 36, 76), (1, 38, 60), (1.5, 38, 64), (2, 45, 70), (2.5, 47, 74)]
COMBATE = dict(tonic='A', scale='harm', bpm=138, beats=3, cycles=7, prog=[1, 1, 6, 5, 1, 4, 5, 1], mel={'R': R_PC, 'E': E_PC}, db=[0, 2, 0, 2, 3, 1, 0], layers=[
  dict(role='drums', cy=cyc(7), vel=66, pat=DR_PC, fill=FL_PC), dict(role='bass', i=58, cy=cyc(7), vel=64, pat='beats', seq=[(0, 0, .5), (1, 7, .35), (2, 7, .35)]),
  dict(role='stab', i=21, cy=cyc(7), vel=44, beats=[1, 2], d=.3), dict(role='arp', i=105, cy=cyc(7), vel=44, pat=[(0, 0, .3, 0), (.5, 1, .3, -8), (1, 2, .3, -4), (1.5, 1, .3, -8), (2, 2, .3, -4), (2.5, 1, .3, -8)]),
  dict(role='mel', i=13, cy=[1, 3, 4, 5], name='R', vel=78), dict(role='mel', i=110, cy=[2, 4, 6], name='R', vel=76), dict(role='mel', i=13, cy=[2, 6], name='R', vel=44, o=12),
  dict(role='mel', i=71, cy=[3, 5], name='E', vel=58), dict(role='pad', i=48, cy=[3, 5], vel=44), dict(role='mel', i=40, cy=[4], name='E', vel=64),
  dict(role='mel', i=13, cy=[0], name='R', vel=48, bars=[0, 1, 2, 3])])
# ---- jefe Rey Ciénaga ----
DR_PJ = [(0, 36, 88), (0, 49, 55), (2, 38, 80), (3, 36, 60), (3.5, 45, 66)] + [(x / 2, 42, 36) for x in range(8)]
FL_PJ = [(0, 36, 88), (1, 45, 72), (1.5, 45, 74), (2, 47, 78), (2.5, 47, 80), (3, 38, 86), (3.5, 38, 90), (0, 49, 70)]
JEFE = dict(tonic='C', scale='minor', bpm=92, beats=4, cycles=5, prog=[1, 1, 4, 1, 6, 4, 1, 5], mel={'A': A_PM, 'B': B_PM}, db=[0, 1, 0, 1, 1], layers=[
  dict(role='drums', cy=cyc(5), vel=78, pat=DR_PJ, fill=FL_PJ), dict(OOM, cy=cyc(5), vel=72),
  dict(role='bass', i=47, cy=cyc(5), vel=72, pat='beats', seq=[(0, 0, .4), (2, 0, .4)]), dict(role='bass', i=70, cy=cyc(5), vel=64, pat='whole'),
  dict(role='pad', i=44, cy=cyc(5), vel=44), dict(role='pad', i=21, cy=[1, 2, 3, 4], vel=40, o=-12), dict(role='pad', i=52, cy=[3, 4], vel=50, o=-12),
  dict(role='mel', i=71, cy=[0, 1, 3], name='A', vel=84, o=-12), dict(role='mel', i=58, cy=[0, 1, 3, 4], name='A', vel=72, o=-12), dict(role='mel', i=61, cy=[3, 4], name='A', vel=58),
  dict(role='mel', i=70, cy=[2], name='B', vel=82), dict(role='mel', i=22, cy=[2, 4], name='B', vel=58), dict(role='mel', i=71, cy=[4], name='B', vel=76),
  dict(role='stab', i=61, cy=[1, 3, 4], bars=[3, 7], vel=70, beats=[0, 1, 2], d=.6)])
# ---- noche ----
NOCHE = dict(tonic='C', scale='mixo', bpm=60, beats=4, cycles=3, prog=P_PM, mel={'B': B_PM}, db=[2, 0, 3], tail=5, layers=[
  dict(role='arp', i=108, cy=cyc(3), vel=46, pat=SLOW4), dict(role='pad', i=21, cy=cyc(3), vel=30, len=1.05), dict(role='pad', i=89, cy=[1], vel=24),
  dict(role='mel', i=11, cy=[0], name='B', vel=40, o=12, bars=[0, 1, 2, 3], leg=1.3),
  dict(role='mel', i=71, cy=[1], name='B', vel=62, leg=.97), dict(role='mel', i=11, cy=[1], name='B', vel=42, o=12),
  dict(role='mel', i=22, cy=[2], name='B', vel=48, leg=.97, bars=[0, 1, 2, 3, 4]), dict(role='mel', i=11, cy=[2], name='B', vel=38, o=12, bars=[0, 1, 2, 3, 4, 5])])
TRACKS = dict(aldea=ALDEA, mundo=MUNDO, combate=COMBATE, jefe=JEFE, noche=NOCHE)
