"""Volcán (mesoamericano): aldea = preludio arpegiado tipo Bach en do mayor (marimba, ocarina, flauta de pan) · mundo = bolero en mi frigio (3/4; la melodía crece por ciclos) ·
combate = danza húngara en re armónico (marimba/ocarina, timbales) · jefe Señor del Fuego = bolero en mi frigio dominante, coro y metales · noche = bolero lento.
GM: marimba 12, ocarina 79, flauta de pan 75, pad cálido 89, contrabajo 32, trompa 60, metales 61, trombón 57, coro 52, timbal 47, tremolo 44; percusión: maracas 70, claves 75, caja 38, toms."""
from common import *
# ---- aldea ----
A_VA = "3:2 5:1 3:1|2:2 4:1 2:1|5:2 7:1 5:1|1^:4|3^:2 1^:1 6:1|6:2 4:1 6:1|7:2 5:1 2:1|1^:4"
V_VA = "3:1 5:.5 3:.5 5:1 1^:1|4:1 6:.5 4:.5 2^:1 6:1|7:1 5:.5 7:.5 2^:1 5:1|3^:2 1^:2|3^:1 1^:.5 6:.5 3^:1 1^:1|4^:1 1^:.5 6:.5 4:1 6:1|5:1 7:.5 2^:.5 5^:1 2^:1|1^:4"
BACH = [(0, 'b', .9, 5), (.5, 0, .5, -8), (1, 1, .5, -6), (1.5, 2, .5, -4), (2, 3, .5, -6), (2.5, 1, .5, -8), (3, 2, .5, -6), (3.5, 3, .5, -8)]
ALDEA = dict(tonic='C', scale='major', bpm=72, beats=4, cycles=4, prog=[1, 2, 5, 1, 6, 4, 5, 1], mel={'A': A_VA, 'V': V_VA}, db=[4, 1, 0, 3], layers=[
  dict(role='arp', i=12, cy=cyc(4), vel=56, pat=BACH), dict(role='pad', i=89, cy=[1, 2, 3], vel=34), dict(role='bass', i=32, cy=[1, 2, 3], vel=54, pat='oct'),
  dict(role='drums', cy=[2, 3], vel=36, pat=[(x / 2, 70, 22 + (x % 2) * 6) for x in range(8)]),
  dict(role='mel', i=75, cy=[0], name='A', vel=48, bars=[0, 1, 2, 3], leg=1.2),
  dict(role='mel', i=79, cy=[1], name='A', vel=74), dict(role='mel', i=75, cy=[2], name='V', vel=60), dict(role='mel', i=79, cy=[2], name='A', vel=52, shift=-2),
  dict(role='mel', i=79, cy=[3], name='A', vel=80), dict(role='mel', i=75, cy=[3], name='A', vel=44, o=12), dict(role='mel', i=48, cy=[3], name='A', vel=34)])
# ---- mundo: bolero (3/4) ----
A_VM = "1:1.5 2:.5 1:.5 r:.5|3:1.5 4:.5 3:.5 2:.5|1:1.5 2:.5 1:.5 7_:.5|1:3|5:1.5 6:.5 5:.5 4:.5|3:1.5 4:.5 3:.5 2:.5|2:1 1:1 7_:1|1:3"
P_VM = [1, 1, 7, 1, 4, 2, 7, 1]
BOLERO = [(0, 38, 56), (.5, 38, 38), (.75, 38, 36), (1, 38, 50), (1.5, 38, 38), (1.75, 38, 36), (2, 38, 50), (2.25, 38, 32), (2.5, 38, 38), (2.75, 38, 34)] + [(x / 2, 70, 26 + (x % 2) * 8) for x in range(6)] + [(0, 36, 44)]
PB_VM = [6, 6, 4, 4, 7, 7, 2, 1]
MUNDO = dict(tonic='E', scale='phrygian', bpm=88, beats=3, cycles=6, rest=2, prog=P_VM, prog_alt={3: PB_VM}, mel={'A': A_VM, 'C': bridge(PB_VM, 3)}, db=[3, 1, 0, 2, 0, 3], layers=[
  dict(role='drums', cy=[0, 1, 2, 4, 5], vel=40, pat=BOLERO), dict(role='drums', cy=[3], vel=40, pat=[(x / 2, 70, 26 + (x % 2) * 8) for x in range(6)]),
  dict(role='bass', i=32, cy=cyc(6), vel=54, pat='beats', seq=[(0, 0, 1.2), (1.5, 7, .6), (2, 0, .8)]),
  dict(role='arp', i=12, cy=[1, 2, 4], vel=40, pat=[(0, 'b', .5, 0), (.5, 0, .4, -8), (1, 1, .4, -8), (1.5, 2, .4, -6), (2, 1, .4, -8), (2.5, 0, .4, -8)]),
  dict(role='pad', i=89, cy=[1, 2, 3, 4], vel=30),
  dict(role='mel', i=79, cy=[0], name='A', vel=60), dict(role='mel', i=75, cy=[1], name='A', vel=66), dict(role='mel', i=79, cy=[2], name='A', vel=72),
  dict(role='mel', i=60, cy=[3], name='C', vel=60, leg=1.0),
  dict(role='mel', i=60, cy=[4], name='A', vel=76), dict(role='mel', i=75, cy=[4], name='A', vel=40, o=12),
  dict(role='mel', i=79, cy=[5], name='A', vel=48, bars=[0, 1, 2, 3])])
# ---- combate ----
R_VC = "1:1 1:.5 2:.5 3:1 2:.5 1:.5|3:1 3:.5 4:.5 5:1 4:.5 3:.5|5:1 5:.5 6:.5 7:1 6:.5 5:.5|1^:2 5:2|1:1 1:.5 2:.5 3:1 2:.5 1:.5|3:1 5:1 6:1 5:1|7:1 6:.5 5:.5 4:1 3:1|1:3 r:1"
E_VC = "5:4|5:4|7:4|1^:4|5:4|6:4|7:2 2^:2|1^:3 r:1"
DR_VC = [(0, 36, 80), (1, 45, 62), (2, 36, 72), (3, 47, 70), (2.5, 45, 54)] + [(x / 2, 70, 28 + (x % 2) * 10) for x in range(8)]
FL_VC = [(0, 36, 80), (.5, 45, 66), (1, 45, 70), (1.5, 47, 72), (2, 47, 76), (2.5, 41, 78), (3, 41, 82), (3.5, 38, 88), (0, 49, 66)]
COMBATE = dict(tonic='D', scale='harm', bpm=144, beats=4, cycles=7, mel_oct=4, prog=[1, 1, 4, 5, 1, 4, 5, 1], mel={'R': R_VC, 'E': E_VC}, db=[0, 2, 0, 2, 3, 1, 0], layers=[
  dict(role='drums', cy=cyc(7), vel=72, pat=DR_VC, fill=FL_VC), dict(role='bass', i=32, cy=cyc(7), vel=66, pat='eighth', alt=1),
  dict(role='stab', i=12, cy=cyc(7), vel=48, beats=[.5, 1.5, 2.5, 3.5], d=.25, o=12), dict(role='arp', i=12, cy=[2, 3, 4, 5, 6], vel=44, pat=ARP8, o=12),
  dict(role='mel', i=79, cy=[1, 3, 5], name='R', vel=82), dict(role='mel', i=75, cy=[2, 4, 6], name='R', vel=80), dict(role='mel', i=12, cy=[2, 4, 6], name='R', vel=54, o=12),
  dict(role='mel', i=60, cy=[3, 5], name='E', vel=60), dict(role='stab', i=61, cy=[4, 6], vel=58, beats=[0, 2], d=.6), dict(role='mel', i=75, cy=[0], name='E', vel=50, bars=[0, 1, 2, 3])])
# ---- jefe Señor del Fuego (mismo bolero en mi frigio dominante) ----
DR_VJ = [(0, 36, 90), (0, 49, 55), (1, 38, 80), (1.5, 45, 64), (2, 38, 80), (2.5, 47, 70), (.5, 42, 38), (1.5, 42, 38), (2.5, 42, 38)]
FL_VJ = [(0, 36, 90), (.5, 45, 70), (1, 45, 72), (1.5, 47, 76), (2, 47, 80), (2.5, 38, 86), (2.75, 38, 90), (0, 49, 70)]
JEFE = dict(tonic='E', scale='pdom', bpm=108, beats=3, cycles=7, mel_oct=3, prog=P_VM, mel={'A': A_VM}, db=[0, 1, 0, 1, 2, 1, 0], layers=[
  dict(role='drums', cy=cyc(7), vel=80, pat=DR_VJ, fill=FL_VJ), dict(role='bass', i=33, cy=cyc(7), vel=72, pat='gallop'),
  dict(role='bass', i=47, cy=cyc(7), vel=70, pat='beats', seq=[(0, 0, .3), (1.5, 0, .3)]),
  dict(role='pad', i=44, cy=cyc(7), vel=44), dict(role='pad', i=52, cy=[1, 2, 3, 4, 5], vel=50, o=-12), dict(role='drone', i=57, cy=cyc(7), vel=48, offs=[0, 7], o=0, every=4),
  dict(role='mel', i=60, cy=[0, 1, 2], name='A', vel=84), dict(role='mel', i=79, cy=[0, 1, 2], name='A', vel=66, o=12),
  dict(role='mel', i=61, cy=[3, 4, 5, 6], name='A', vel=84), dict(role='mel', i=57, cy=[3, 4, 5, 6], name='A', vel=70), dict(role='mel', i=52, cy=[3, 4, 5], name='A', vel=60),
  dict(role='stab', i=61, cy=[2, 4, 6], bars=[3, 7], vel=72, beats=[0, 1, 2], d=.6)])
# ---- noche ----
NOCHE = dict(tonic='E', scale='phrygian', bpm=60, beats=3, cycles=4, prog=P_VM, mel={'A': A_VM}, db=[2, 0, 1, 3], tail=5, layers=[
  dict(role='arp', i=12, cy=cyc(4), vel=44, pat=[(0, 'b', 1.8, 0), (1, 0, 1.4, -8), (2, 1, 1.2, -6)]), dict(role='pad', i=89, cy=cyc(4), vel=30, len=1.05),
  dict(role='mel', i=75, cy=[0], name='A', vel=40, o=12, bars=[0, 2, 4, 6], leg=1.4),
  dict(role='mel', i=79, cy=[1], name='A', vel=60, leg=.97), dict(role='mel', i=75, cy=[2], name='A', vel=50, leg=.97, bars=[0, 1, 2, 3, 4]),
  dict(role='mel', i=12, cy=[3], name='A', vel=40, o=12, bars=[0, 1, 2, 3, 4, 5])])
TRACKS = dict(aldea=ALDEA, mundo=MUNDO, combate=COMBATE, jefe=JEFE, noche=NOCHE)
