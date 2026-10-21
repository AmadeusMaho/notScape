"""Oriental (japonés, hirajoshi/pentatónica): aldea = arabesco fluido (koto, shakuhachi, shamisen) · mundo = largo pentatónico (shakuhachi, koto, campanas) ·
combate = danza de caballeros (shamisen, taiko, koto) · jefe Oni Gigante = ostinato en 5/4 tipo Marte (taiko, coro, metales) · noche = largo lento con campanilla.
GM: koto 107, shakuhachi 77, shamisen 106, campanilla 112, campanas tubulares 14, cuerdas 48, taiko 116 (+toms del kit), coro 52, trombón 57, metales 61, tremolo 44.
Escalas de 5 notas ⇒ acordes personalizados ['x', bajo, [semitonos]] respecto a la octava 3 de la tónica."""
from common import *
# hirajoshi en re: D E F A Bb
Dm = ['x', -12, [0, 3, 7]]; Bb = ['x', -16, [-4, 0, 3]]; F_ = ['x', -9, [3, 7, 10]]; Ao = ['x', -5, [-5, 2, 7]]
# ---- aldea ----
A_OA = "4:2 5:1 4:1|3:2 2:1 1:1|4:1 5:1 1^:2|5:2 4:2|4:2 5:1 4:1|3:1 4:1 5:1 4:1|3:1 2:1 1:2|1:4"
V_OA = "1^:1 5:.5 4:.5 3:1 4:1|5:.5 4:.5 3:.5 2:.5 1:2|4:1 5:1 1^:1 2^:1|3^:2 1^:2|1^:1 5:.5 4:.5 3:1 4:1|5:1 1^:1 3^:1 1^:1|5:1 4:1 3:.5 2:.5 1:1|1:4"
ALDEA = dict(tonic='D', scale='hira', bpm=80, beats=4, cycles=4, prog=[Dm, Bb, F_, Ao, Dm, Bb, Ao, Dm], mel={'A': A_OA, 'V': V_OA}, db=[4, 1, 0, 3], layers=[
  dict(role='arp', i=107, cy=cyc(4), vel=58, pat=ARP8), dict(role='arp', i=107, cy=[2, 3], vel=42, pat=UP4, o=12),
  dict(role='pad', i=48, cy=[1, 3], vel=36), dict(role='pad', i=48, cy=[2], vel=42), dict(role='bass', i=42, cy=[1, 2, 3], vel=48, pat='whole'),
  dict(role='arp', i=112, cy=[0, 2], vel=38, pat=[(1.5, 4, .8, 0), (3.5, 3, .8, -6)], o=12),
  dict(role='mel', i=77, cy=[1], name='A', vel=72), dict(role='mel', i=77, cy=[2], name='V', vel=64), dict(role='mel', i=106, cy=[2], name='A', vel=44, o=12),
  dict(role='mel', i=77, cy=[3], name='A', vel=80), dict(role='mel', i=107, cy=[3], name='A', vel=58, o=12), dict(role='mel', i=48, cy=[3], name='A', vel=36)])
# ---- mundo (la pentatónica en fa) ----
Fp = ['x', -12, [0, 4, 7]]; Dp = ['x', -15, [-3, 0, 4]]; Cp = ['x', -17, [-5, -1, 2]]; Gp = ['x', -10, [2, 5, 9]]
A_OM = "3:2 5:1 3:1|2:2 1:2|3:2 5:1 3:1|5:4|1^:2 5:1 4:1|3:2 2:2|3:1 2:1 1:2|1:4"
B_OM = "1^:1 5:1 4:1 5:1|3:2 2:1 1:1|3:1 4:1 5:2|4:2 3:2|1^:1 5:1 4:1 5:1|3:2 2:1 1:1|3:1 2:1 1:2|1:4"
P_OM = [Fp, Dp, Fp, Cp, Fp, Gp, Cp, Fp]
PB_OM = [Dp, Dp, Gp, Cp, Fp, Dp, Cp, Fp]
C_OM = "3:2 5:2|1^:2 3:2|2:2 5:2|4:4|3:2 1^:2|5:2 3:2|4:2 2:2|1:4"
MUNDO = dict(tonic='F', scale='pent', bpm=76, beats=4, cycles=6, rest=2, prog=P_OM, prog_alt={3: PB_OM}, mel={'A': A_OM, 'B': B_OM, 'C': C_OM}, db=[3, 1, 0, 2, 0, 3], layers=[
  dict(role='arp', i=107, cy=cyc(6), vel=50, pat=ARP8), dict(role='bass', i=42, cy=[1, 2, 3, 4], vel=46, pat='oct'),
  dict(role='drums', cy=[2, 4], vel=36, pat=[(0, 45, 44), (2, 47, 36)]),
  dict(role='mel', i=77, cy=[0], name='A', vel=58, bars=[0, 1, 2, 3]),
  dict(role='mel', i=77, cy=[1], name='A', vel=72), dict(role='mel', i=106, cy=[2], name='B', vel=66),
  dict(role='mel', i=48, cy=[3], name='C', vel=54, leg=1.0), dict(role='arp', i=14, cy=[3], vel=34, pat=[(0, 'b', 3.6, 0)], o=12),
  dict(role='mel', i=77, cy=[4], name='A', vel=80), dict(role='mel', i=48, cy=[4], name='A', vel=30),
  dict(role='mel', i=77, cy=[5], name='A', vel=48, bars=[0, 1, 2, 3])])
# ---- combate ----
R_OC = "1:1 r:.5 1:.5 3:1 1:1|5:1 4:.5 3:.5 2:1 1:1|1:1 r:.5 1:.5 3:1 4:1|5:2 r:1 5:1|1^:1 r:.5 1^:.5 5:1 4:1|3:1 4:.5 5:.5 1^:2|5:1 4:1 3:1 2:1|1:3 r:1"
E_OC = "5:4|4:4|3:4|4:4|5:2 1^:2|3^:4|2^:2 1^:2|1^:4"
DR_OC = [(0, 36, 84), (1, 45, 64), (2, 36, 76), (2.5, 36, 56), (3, 43, 70), (.5, 56, 30), (1.5, 56, 30), (2.5, 56, 30), (3.5, 56, 30)]
FL_OC = [(0, 36, 84), (.5, 45, 66), (1, 45, 70), (1.5, 43, 72), (2, 43, 76), (2.5, 41, 78), (3, 41, 82), (3.5, 41, 86), (0, 49, 66)]
COMBATE = dict(tonic='D', scale='hira', bpm=132, beats=4, cycles=7, prog=[Dm, Dm, Bb, Ao, Dm, F_, Bb, Ao], mel={'R': R_OC, 'E': E_OC}, db=[0, 2, 0, 2, 3, 1, 0], layers=[
  dict(role='drums', cy=cyc(7), vel=70, pat=DR_OC, fill=FL_OC), dict(role='bass', i=42, cy=cyc(7), vel=66, pat='eighth', alt=1),
  dict(role='stab', i=106, cy=cyc(7), vel=50, beats=[.5, 1.5, 2.5, 3.5], d=.25, o=12), dict(role='arp', i=107, cy=[1, 2, 3, 4, 5, 6], vel=48, pat=ARP8, o=12),
  dict(role='mel', i=106, cy=[1, 3, 5], name='R', vel=82), dict(role='mel', i=77, cy=[2, 4, 6], name='R', vel=78), dict(role='mel', i=107, cy=[2, 4, 6], name='R', vel=56, o=12),
  dict(role='mel', i=48, cy=[3, 5], name='E', vel=60), dict(role='stab', i=61, cy=[4, 6], vel=58, beats=[0, 2], d=.6), dict(role='mel', i=77, cy=[0], name='E', vel=50, bars=[0, 1, 2, 3])])
# ---- jefe Oni (5/4) ----
M_OJ = "1:.5 1:.5 1:1 1:.5 1:.5 4:1 3:1|1:.5 1:.5 1:1 1:.5 1:.5 4:1 3:1|5:.5 5:.5 5:1 5:.5 5:.5 4:1 3:1|5:.5 5:.5 5:1 5:.5 5:.5 4:1 3:1|3:1 4:1 5:1 4:1 3:1|1:.5 1:.5 1:1 1:.5 1:.5 2:1 1:1|3:1 4:1 5:1 4:1 3:1|1:3 2:1 1:1"
H_OJ = "1^:5|5:5|1^:5|4:5|3^:5|1^:5|5:5|1^:5"
DR_OJ = [(0, 36, 90), (0, 49, 55), (1, 42, 40), (2, 38, 85), (3, 42, 40), (4, 36, 70), (4.5, 36, 60)]
FL_OJ = [(0, 36, 90), (1, 45, 70), (2, 45, 72), (2.5, 43, 74), (3, 43, 78), (3.5, 41, 80), (4, 41, 84), (4.5, 38, 90), (0, 49, 70)]
JEFE = dict(tonic='D', scale='hira', bpm=140, beats=5, cycles=6, mel_oct=3, prog=[Dm, Dm, Bb, Ao, Dm, Dm, Bb, Ao], mel={'M': M_OJ, 'H': H_OJ}, db=[0, 1, 0, 1, 2, 0], layers=[
  dict(role='drums', cy=cyc(6), vel=80, pat=DR_OJ, fill=FL_OJ), dict(role='bass', i=33, cy=cyc(6), vel=72, pat='gallop'),
  dict(role='bass', i=47, cy=cyc(6), vel=70, pat='beats', seq=[(0, 0, .3), (2, 0, .3), (4, 0, .3)]),
  dict(role='pad', i=44, cy=cyc(6), vel=44), dict(role='pad', i=52, cy=[2, 3, 4], vel=50, o=-12),
  dict(role='mel', i=42, cy=cyc(6), name='M', vel=76), dict(role='mel', i=106, cy=[1, 2, 3, 4], name='M', vel=66, o=12), dict(role='mel', i=57, cy=[2, 3, 4], name='M', vel=64),
  dict(role='mel', i=77, cy=[1, 3], name='H', vel=64), dict(role='mel', i=61, cy=[3, 4], name='H', vel=58),
  dict(role='stab', i=61, cy=[1, 3, 4], bars=[3, 7], vel=70, beats=[0, .5, 2, 3], d=.35)])
# ---- noche ----
NOCHE = dict(tonic='F', scale='pent', bpm=56, beats=4, cycles=3, prog=P_OM, mel={'A': A_OM}, db=[2, 0, 3], tail=5, layers=[
  dict(role='arp', i=107, cy=cyc(3), vel=46, pat=SLOW4), dict(role='pad', i=48, cy=cyc(3), vel=30, len=1.05), dict(role='pad', i=89, cy=[1], vel=24),
  dict(role='mel', i=112, cy=[0], name='A', vel=40, o=12, bars=[0, 2, 4, 6], leg=1.4),
  dict(role='mel', i=77, cy=[1], name='A', vel=62, leg=.97), dict(role='mel', i=112, cy=[1], name='A', vel=40, o=12),
  dict(role='mel', i=107, cy=[2], name='A', vel=50, bars=[0, 1, 2, 3, 4]), dict(role='mel', i=14, cy=[2], name='A', vel=34, o=12, bars=[0, 1, 2, 3, 4, 5])])
TRACKS = dict(aldea=ALDEA, mundo=MUNDO, combate=COMBATE, jefe=JEFE, noche=NOCHE)
