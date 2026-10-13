"""Pradera (medieval, sol mayor): aldea = Canon (suelo descendente, capas escalonadas) · mundo = galope de fanfarria ·
combate = rondó con apoyaturas (mi menor) · jefe Gruk = el mundo en mi menor con golpe de martillo · noche = el mundo, lento.
Instrumentos GM: laúd (nylon 24), flauta dulce 74, dulcimer 15, violín 40, fiddle 110, silbato 78, trompa 60, gaita 109, oboe 68, cuerdas, bajo 32."""
from common import *
LUTE3 = [(0, 'b', .9, 5), (0.5, 0, .55, -8), (1, 1, .55, -8), (1.5, 2, .55, -2), (2, 1, .55, -8), (2.5, 0, .55, -8)]
LUTE4 = [(0, 'b', .9, 5), (1, 0, .55, -6), (1.5, 1, .55, -6), (2, 2, .55, -4), (2.5, 1, .55, -8), (3, 0, .55, -6), (3.5, 2, .55, -8)]
UP3 = [(0.5, 3, .8, 0), (1, 4, .8, -8), (1.5, 5, .8, 0), (2, 4, .8, -8), (2.5, 5, .8, 0)]
# ---- aldea (Canon): sol mayor, 3/4 ----
A_ALD = "3:1.5 2:.5 1:1|7_:1 2:1 5:1|6:1.5 5:.5 3:1|7_:1 3:1 5:1|6:1.5 5:.5 4:1|3:1 5:1 1^:1|1^:1 6:1 4:1|3:1 2:1 7_:1"
V_ALD = "5:1 3:.5 5:.5 1^:1|7:1 5:1 2:1|1^:1.5 7:.5 6:1|7:1 5:1 3:1|4:1 6:1 1^:1|5:1.5 3:.5 1:1|6:1 1^:1 6:1|7:2 2:1"
H_ALD = "3:3|7_:3|6:3|7_:3|6:3|3:3|1^:3|3:3"
ALDEA = dict(tonic='G', scale='major', bpm=72, beats=3, cycles=6, prog=[1, 5, 6, 3, 4, 1, 4, 5], mel={'A': A_ALD, 'V': V_ALD, 'H': H_ALD},
  db=[5, 2, 0, 3, -1, 4], layers=[
  dict(role='arp', i=24, cy=[0, 1, 2, 3, 4, 5], vel=60, pat=LUTE3),
  dict(role='bass', i=42, cy=[1, 2, 3, 4], vel=58, o=0), dict(role='bass', i=42, cy=[5], bars=[0, 1, 2, 3], vel=46),
  dict(role='pad', i=48, cy=[2, 4], vel=52), dict(role='pad', i=48, cy=[3], vel=42), dict(role='pad', i=48, cy=[1], bars=[4, 5, 6, 7], vel=38), dict(role='pad', i=48, cy=[5], bars=[0, 1, 2, 3], vel=34),
  dict(role='arp', i=46, cy=[2, 4], vel=50, pat=UP3, o=12),
  dict(role='mel', i=74, cy=[1], name='H', vel=54, leg=.97, check=0),
  dict(role='mel', i=74, cy=[2], name='A', vel=82), dict(role='mel', i=40, cy=[2], name='A', vel=44, shift=-2),
  dict(role='mel', i=15, cy=[3], name='V', vel=66), dict(role='mel', i=74, cy=[3], name='V', vel=38, o=12),
  dict(role='mel', i=74, cy=[4], name='A', vel=90), dict(role='mel', i=40, cy=[4], name='A', vel=62, shift=-2),
  dict(role='mel', i=46, cy=[4], name='A', vel=64, o=12), dict(role='mel', i=73, cy=[4], name='A', vel=36, o=12),
  dict(role='mel', i=74, cy=[5], name='A', vel=52, bars=[0, 1, 2, 3]), dict(role='mel', i=15, cy=[5], name='A', vel=46, o=12, bars=[0, 1, 2, 3])])
# ---- mundo: galope de fanfarria, sol mayor 4/4 112 ----
A_MUN = ("5:.5 5:.5 5:1 5:.5 5:.5 5:1|5:.5 5:.5 5:1 3^:2|4:.5 4:.5 4:1 6:.5 6:.5 6:1|3:.5 3:.5 3:1 1^:2|"
         "2^:.5 2^:.5 2^:1 7:.5 7:.5 7:1|5:.5 5:.5 5:1 3^:.5 3^:.5 3^:1|5:.5 6:.5 7:.5 1^:.5 2^:2|1^:2 5:1 1:1")
B_MUN = ("5:1 5:.5 6:.5 5:1 3:1|1:1 3:1 5:2|4:1 4:.5 5:.5 6:1 4:1|5:2 3:1 1:1|"
         "7:1 7:.5 1^:.5 2^:1 7:1|1^:1 3:1 3^:2|2^:1 1^:.5 7:.5 5:1 7:1|1^:3 r:1")
P_MUN = [1, 1, 4, 1, 5, 1, 5, 1]
DR_SOFT = [(0, 36, 55), (1, 37, 50), (2, 36, 48), (3, 37, 50), (.5, 54, 30), (1.5, 54, 30), (2.5, 54, 30), (3.5, 54, 30)]
PB_MUN = [6, 6, 4, 1, 2, 5, 4, 5]
MUNDO = dict(tonic='G', scale='major', bpm=112, beats=4, cycles=6, rest=2, prog=P_MUN, prog_alt={3: PB_MUN}, mel={'A': A_MUN, 'B': B_MUN, 'C': bridge(PB_MUN)},
  tr={4: 2, 5: 2}, db=[3, 1, 0, 2, 0, 3], layers=[
  dict(role='arp', i=24, cy=cyc(6), vel=54, pat=LUTE4),
  dict(role='bass', i=32, cy=[0, 1, 2, 4, 5], vel=60, pat='walk'), dict(role='bass', i=42, cy=[3], vel=50, pat='whole'),
  dict(role='drums', cy=[0, 1, 2, 4, 5], vel=56, pat=DR_SOFT),
  dict(role='mel', i=78, cy=[0], name='A', vel=44, bars=[0, 1, 2, 3]),
  dict(role='mel', i=78, cy=[1], name='A', vel=80),
  dict(role='mel', i=110, cy=[2], name='B', vel=72),
  dict(role='mel', i=60, cy=[3], name='C', vel=66, leg=1.0), dict(role='pad', i=48, cy=[3], vel=34),
  dict(role='mel', i=78, cy=[4], name='A', vel=86), dict(role='mel', i=110, cy=[4], name='A', vel=38, shift=-2),
  dict(role='mel', i=78, cy=[5], name='A', vel=48, bars=[0, 1, 2, 3])])
# ---- combate: rondó con apoyaturas, mi menor 4/4 112 ----
R_COM = ("3:.5 2:.25 3:.25 5:.5 3:.5 1^:1 5:1|4:.5 3:.25 4:.25 6:.5 4:.5 1^:1 6:1|3:.5 2:.25 3:.25 5:.5 3:.5 1^:1 5:1|5:.5 4:.25 5:.25 7:.5 5:.5 2^:1 7:1|"
         "1^:.5 7:.25 1^:.25 3^:.5 1^:.5 5:1 3:1|6:.5 5:.25 6:.25 1^:.5 6:.5 4^:1 1^:1|5:.5 4:.25 5:.25 7:.5 5:.5 2^:1 5^:1|1^:2 5:1 3:.5 1:.5")
E_COM = ("5:1 3:1 5:1 1^:1|6:1 4:1 6:1 1^:1|3^:1 1^:1 5:1 3:1|5:1 7:1 2^:2|3:1 5:1 1^:2|4:1 6:1 1^:1 6:1|7:1 5:1 2^:2|1^:3 r:1")
P_COM = [1, 4, 1, 5, 1, 4, 5, 1]
DR_COM = [(0, 36, 80), (1, 38, 78), (2, 36, 72), (2.5, 36, 50), (3, 38, 78)] + [(x / 2, 42, 40 + (x % 2) * 14) for x in range(8)]
FL_COM = [(0, 36, 80), (1, 38, 78), (2, 38, 70), (2.5, 38, 66), (3, 38, 76), (3.25, 45, 70), (3.5, 47, 74), (3.75, 50, 80)] + [(x / 2, 42, 40) for x in range(8)]
COMBATE = dict(tonic='E', scale='minor', bpm=112, beats=4, cycles=6, prog=P_COM, mel={'R': R_COM, 'E': E_COM}, db=[0, 2, 0, 2, 3, 0], layers=[
  dict(role='drums', cy=[0, 1, 2, 3, 4, 5], vel=70, pat=DR_COM, fill=FL_COM),
  dict(role='bass', i=33, cy=[0, 1, 2, 3, 4, 5], vel=68, pat='eighth', alt=1),
  dict(role='stab', i=45, cy=[0, 1, 2, 3, 4, 5], vel=48, beats=[.5, 1.5, 2.5, 3.5], d=.3, o=12),
  dict(role='mel', i=110, cy=[1, 3, 4], name='R', vel=80), dict(role='mel', i=78, cy=[3, 4], name='R', vel=48, o=12),
  dict(role='mel', i=110, cy=[2], name='E', vel=72), dict(role='pad', i=48, cy=[2], vel=46), dict(role='stab', i=61, cy=[4], vel=58, beats=[0, 2], d=.6)])
# ---- jefe Gruk: el mundo en mi menor, 120 ----
DR_BOSS = [(0, 36, 85), (1, 38, 85), (1, 45, 70), (2, 36, 80), (2.5, 36, 55), (3, 38, 88), (3, 47, 75)] + [(x / 2, 42, 44) for x in range(8)]
FL_BOSS = [(0, 36, 85), (.5, 45, 70), (1, 38, 85), (1.5, 45, 72), (2, 47, 78), (2.5, 47, 80), (3, 50, 85), (3.5, 50, 90), (0, 49, 70)]
JEFE = dict(tonic='E', scale='minor', bpm=120, beats=4, cycles=6, prog=P_MUN, mel={'A': A_MUN, 'B': B_MUN}, tr={4: 1}, db=[0, 1, 0, 1, 2, 0], layers=[
  dict(role='drums', cy=[0, 1, 2, 3, 4, 5], vel=78, pat=DR_BOSS, fill=FL_BOSS),
  dict(role='bass', i=33, cy=[0, 1, 2, 3, 4, 5], vel=74, pat='gallop'),
  dict(role='bass', i=47, cy=[0, 1, 2, 3, 4, 5], vel=70, pat='beats', seq=[(0, 0, .3), (2, 0, .3)], o=0),
  dict(role='drone', i=109, cy=[0, 1, 2, 3, 4, 5], vel=52, offs=[0, 7], o=12, every=4),
  dict(role='mel', i=68, cy=[0, 1, 3, 4], name='A', vel=84), dict(role='mel', i=110, cy=[0, 1, 3, 4], name='A', vel=76),
  dict(role='mel', i=68, cy=[2], name='B', vel=82), dict(role='mel', i=110, cy=[2], name='B', vel=70),
  dict(role='mel', i=57, cy=[1, 3, 4], name='A', vel=62, o=-12), dict(role='pad', i=44, cy=[1, 2, 3, 4], vel=46),
  dict(role='pad', i=52, cy=[3, 4], vel=52, o=-12), dict(role='stab', i=61, cy=[0, 1, 3, 4], bars=[3, 7], vel=70, beats=[0, .5, 1, 2], d=.35)])
# ---- noche: el mundo, lento ----
NOCHE = dict(tonic='G', scale='major', bpm=56, beats=4, cycles=3, prog=P_MUN, mel={'A': A_MUN}, db=[2, 0, 3], tail=5, layers=[
  dict(role='arp', i=24, cy=[0, 1, 2], vel=44, pat=[(0, 'b', 1.5, 0), (1, 0, 1.2, -8), (2, 1, 1.2, -8), (3, 2, 1.2, -4)]),
  dict(role='pad', i=48, cy=[0, 1, 2], vel=34, len=1.05), dict(role='pad', i=89, cy=[1], vel=26),
  dict(role='mel', i=8, cy=[0], name='A', vel=40, o=12, bars=[0, 2, 4, 6], leg=1.4),
  dict(role='mel', i=74, cy=[1], name='A', vel=64, leg=.97), dict(role='mel', i=8, cy=[1], name='A', vel=46, o=12),
  dict(role='mel', i=73, cy=[2], name='A', vel=44, leg=.97, bars=[0, 1, 2, 3, 4]), dict(role='mel', i=8, cy=[2], name='A', vel=40, o=12, bars=[0, 1, 2, 3, 4, 5])])
TRACKS = dict(aldea=ALDEA, mundo=MUNDO, combate=COMBATE, jefe=JEFE, noche=NOCHE)
