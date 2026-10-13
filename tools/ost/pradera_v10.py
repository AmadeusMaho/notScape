"""Pradera v10b (medieval, «hogar» con espíritu de aventura). Segunda versión tras el comentario del dueño («un poco menos genérico: Dies irae, pegajoso, más aventura;
Chrono Trigger y Zelda como referencia»). Se toman de esas referencias TÉCNICAS (no melodías): motivos con saltos de quinta, ritmo sincopado 3+3+2, acorde bVII prestado
(modo mixolidio), contramelodía de trompa en notas largas, barridos de arpa, redobles de timbal, pizzicatos a contratiempo, remates de cadencia con subida dominante.
El «Dies irae» (canto gregoriano, dominio público) abre al jefe y asoma como aviso en el combate: grados b3-2-b3-1-2-b7-1 (en mi: sol fa# sol mi fa# re mi; en re: fa mi fa re mi do re).
 mundo   «Senda de Hierba»      4/4, sol mayor con fa♮ (bVII), 132 bpm — intro de trompa, tema heroico A (saltos de quinta, 3+3+2), tema B sincopado en mi menor, puente de flauta
 aldea   «Posada del Trigal»    6/8 lento, la dórico, 70 bpm — acordeón, silbato, guitarra; salto de sexta como firma; sección B luminosa en do mayor
 combate «Escaramuza»           4/4, re menor, 150 bpm — riff de fiddle con célula rítmica .75-.75-.5 (3+3+2 semicorcheas) y el Dies irae lento en las trompas
 jefe    «Machaca-Huesos»       4/4, mi menor, 92 bpm — el Dies irae en trombón y tuba como riff, grito orco en 3+3+2, puente coral
 noche   «Luciérnagas»          3/4, fa lidio, 56 bpm — caja de música, celesta; el si natural (#4) da el misterio"""
from compose import *

# ============================ MUNDO · aventura en sol mayor/mixolidio ============================
def mundo():
    T = Track(bpm=132, bpb=4, tonic='G', mode='major', seed=12, rest=2, reverb=(2.0, .22))
    A = T.sec('G F C D G F C.D G')
    MA = ("D5:1.5 G5:1.5 B5:1 | C6:1.5 A5:1.5 F5:1 | G5:1.5 E5:1.5 G5:1 | A5:2 F#5:1 D5:1 | "
          "D5:1.5 G5:1.5 B5:1 | C6:1.5 A5:1.5 C6:1 | G5:1 E5:1 F#5:1 A5:1 | D6:2 B5:1 G5:1")
    CA = "B4:4 | A4:4 | G4:4 | F#4:4 | B4:4 | A4:4 | G4:2 A4:2 | B4:4"      # contramelodía de trompa: línea interna que desciende y vuelve
    B = T.sec('Em C Am B7 Em C D D')
    MB = ("E5:1.5 B5:1.5 G5:1 | E5:1.5 G5:1.5 C6:1 | A5:1.5 E5:1.5 C5:1 | B5:1.5 D#6:1.5 F#6:1 | "
          "G5:1.5 B5:1.5 E6:1 | C6:1.5 B5:1.5 G5:1 | A5:1.5 F#5:1.5 A5:1 | D6:2 r:2")
    C = T.sec('Cmaj7 D Bm7 Em Cmaj7 D G G')
    MC = ("E5:2 G5:2 | F#5:2 A5:2 | D6:2 B5:2 | G5:3 r:1 | C6:2 B5:2 | A5:2 F#5:2 | D5:2 G5:2 | B5:4")
    I = T.sec('G F G D')
    MI = "D4:1.5 G4:1.5 B4:1 | C5:1.5 A4:1.5 F4:1 | G4:4 | r:4"
    pizz = lambda v=44: acc('stab', 45, vel=v, lo=55, hi=74, at=[1.0, 2.5, 3.5], d=.3)
    bass = lambda v=64, b=33: acc('bass', b, vel=v, pat='sync332', bo=2)
    # intro: trompa lejana, barrido de arpa, redoble suave
    T.play(I, [mel(60, MI, vel=62, leg=1.0), acc('sweep', 46, vel=44, lo=48, hi=84, gap=.1, n=9, bars=[0, 1, 2]), acc('roll', 47, vel=48, bo=1, bars=[3]), drums('heart', vel=44, bars=[2, 3]),
               acc('pad', 48, vel=26, lo=50, hi=68)])
    T.play(A, [mel(73, MA, vel=76), mel(60, CA, vel=50, leg=1.0), pizz(), bass(60), drums('adv', vel=58, fill=True, fill_p='adv_fill', fill_every=4)])
    T.play(A, [mel(56, MA, vel=80), mel(73, MA, vel=44, o=12), mel(60, CA, vel=56, leg=1.0), pizz(46), bass(66), acc('sweep', 46, vel=40, lo=55, hi=84, bars=[0, 4]),
               drums('adv', vel=68, fill=True, fill_p='adv_fill', fill_every=4)])
    T.play(B, [mel(110, MB, vel=74), acc('arp', 46, vel=40, lo=55, hi=79, pat=[0, 1, 2, 3, 2, 1], sub=.5), pizz(40), bass(56, 32), mel(42, "B3:4 | G3:4 | A3:4 | F#3:4 | G3:4 | E3:4 | F#3:4 | A3:4", vel=44, leg=1.0),
               drums('adv', vel=56, fill=True, fill_p='adv_fill', fill_every=4)])
    T.play(A, [mel(56, MA, vel=82), mel(78, MA, vel=50, o=12), mel(110, T.third(MA, -2), vel=40), mel(60, CA, vel=58, leg=1.0), pizz(48), bass(68),
               acc('roll', 47, vel=62, bo=1, bars=[7]), drums('adv', vel=72, fill=True, fill_p='adv_fill', fill_every=4)])
    T.play(C, [mel(73, MC, vel=64, leg=1.0), acc('arp', 46, vel=44, lo=57, hi=79, pat=[0, 1, 2, 3, 2, 1], sub=.5), acc('pad', 48, vel=32, lo=48, hi=68),
               acc('bass', 43, vel=36, pat='root', bo=2), acc('roll', 47, vel=56, bo=1, bars=[7]), drums('heart', vel=40, bars=[4, 5, 6])])
    T.play(B, [mel(56, MB, vel=78), mel(110, MB, vel=52, o=12), mel(60, T.third(MB, -2), vel=48), pizz(46), bass(64, 32), acc('sweep', 46, vel=42, lo=55, hi=84, bars=[0, 4]),
               drums('adv', vel=70, fill=True, fill_p='adv_fill', fill_every=4)])
    T.play(A, [mel(56, MA, vel=88), mel(73, MA, vel=56, o=12), mel(110, T.third(MA, -2), vel=48), mel(60, CA, vel=62, leg=1.0), mel(42, "G3:4 | F3:4 | C3:4 | D3:4 | G3:4 | F3:4 | C3:2 D3:2 | G3:4", vel=50, leg=1.0),
               acc('pad', 48, vel=36, lo=48, hi=68), pizz(52), bass(72), acc('roll', 47, vel=66, bo=1, bars=[3, 7]), drums('adv', vel=78, fill=True, fill_p='adv_fill', fill_every=4)])
    return T

# ============================ ALDEA · 6/8 lento, la dórico ============================
def aldea():
    T = Track(bpm=70, bpb=3, tonic='A', mode='dorian', seed=22, rest=1, reverb=(2.1, .25))
    A = T.sec('Am D Am D C G Am E')
    MA = ("E5:1.5 A5:.5 G5:.5 E5:.5 | F#5:1.5 D5:.5 E5:.5 F#5:.5 | E5:1 A5:.5 C6:1.5 | B5:1.5 A5:.5 F#5:.5 D5:.5 | "
          "G5:1.5 E5:.5 G5:.5 C6:.5 | D6:1.5 B5:.5 G5:.5 B5:.5 | C6:1 B5:.5 A5:1.5 | G#5:1.5 B5:.5 E5:1")
    A2 = T.sec('Am D Am D C G E Am')
    MA2 = ("E5:1.5 A5:.5 G5:.5 E5:.5 | F#5:1.5 D5:.5 E5:.5 F#5:.5 | E5:1 A5:.5 C6:1.5 | B5:1.5 A5:.5 F#5:.5 D5:.5 | "
           "G5:1.5 E5:.5 G5:.5 C6:.5 | D6:1.5 B5:.5 G5:.5 B5:.5 | G#5:1 B5:.5 E6:1.5 | A5:3")
    B = T.sec('C G Am F C G E E')
    MB = ("E5:1 G5:.5 C6:1.5 | D5:1 G5:.5 B5:1.5 | C6:1.5 B5:.5 A5:.5 E5:.5 | A5:1.5 F5:.5 A5:.5 C6:.5 | "
          "E6:1.5 C6:.5 G5:.5 E5:.5 | D6:1 B5:.5 G5:1.5 | G#5:1.5 B5:.5 E6:1 | E6:2 r:1")
    g = lambda v=42: acc('arp', 24, vel=v, lo=52, hi=72, pat=[0, 2, 1, 3, 1, 2], sub=.5)
    bs = lambda v=40: acc('bass', 32, vel=v, pat='slow', bo=2)
    T.play(A, [g(40), bs(36), mel(78, MA, vel=64), drums('waltz_br', vel=26)])
    T.play(A2, [g(44), bs(38), mel(21, MA2, vel=60), mel(78, T.third(MA2, 2), vel=34), acc('pad', 42, vel=28, lo=45, hi=62), drums('waltz_br', vel=28)])
    T.play(B, [acc('arp', 46, vel=44, lo=57, hi=79, pat=[0, 1, 2, 3, 2, 1], sub=.5), acc('pad', 48, vel=34, lo=48, hi=68), bs(36), mel(73, MB, vel=66, leg=1.0), drums('waltz_br', vel=28)])
    T.play(A, [g(44), bs(40), mel(110, MA, vel=64), mel(21, T.third(MA, -2), vel=38), drums('waltz_br', vel=30)])
    T.play(B, [acc('arp', 46, vel=46, lo=57, hi=79, pat=[0, 1, 2, 3, 2, 1], sub=.5), acc('pad', 48, vel=36, lo=48, hi=68), bs(38), mel(40, MB, vel=66, leg=1.0), mel(73, MB, vel=34, o=12), drums('waltz_br', vel=30)])
    T.play(A2, [g(46), bs(40), mel(78, MA2, vel=64), mel(40, T.third(MA2, -2), vel=38), acc('pad', 42, vel=30, lo=45, hi=62), drums('waltz_br', vel=30)])
    T.play(A, [g(38), bs(34), mel(21, MA, vel=52, dyn=(1.0, .55)), acc('pad', 42, vel=24, lo=45, hi=62), drums('waltz_br', vel=22, bars=[0, 1, 2, 3])])
    return T

# ============================ COMBATE · re menor, Dies irae de aviso ============================
def combate():
    T = Track(bpm=150, bpb=4, tonic='D', mode='minor', seed=32, rest=1)
    A = T.sec('Dm Dm Bb A Dm Dm Bb A')
    RA = ("D5:.75 D5:.75 F5:.5 A5:.75 A5:.75 G5:.5 | F5:.75 F5:.75 E5:.5 D5:.75 C5:.75 D5:.5 | Bb4:.75 Bb4:.75 D5:.5 F5:.75 F5:.75 Bb5:.5 | A4:.75 A4:.75 C#5:.5 E5:.75 A5:.75 G5:.5 | "
          "D5:.75 D5:.75 F5:.5 A5:.75 A5:.75 G5:.5 | F5:.75 F5:.75 E5:.5 D5:.75 C5:.75 D5:.5 | Bb4:.75 D5:.75 F5:.5 Bb5:.75 A5:.75 F5:.5 | A4:.5 C#5:.5 E5:.5 A5:.5 C#6:1 E6:1")
    DI = "r:4 | r:4 | r:4 | r:4 | F4:1 E4:1 F4:1 D4:1 | E4:1 C4:1 D4:2 | r:4 | r:4"      # Dies irae (re): fa mi fa re mi do re
    B = T.sec('Gm Gm Dm Dm Bb C A A')
    RB = ("G5:.75 G5:.75 Bb5:.5 D6:.75 D6:.75 C6:.5 | Bb5:.75 Bb5:.75 A5:.5 G5:.75 F5:.75 G5:.5 | A5:.75 A5:.75 F5:.5 D5:.75 F5:.75 A5:.5 | D6:1.5 A5:.5 F5:1 D5:1 | "
          "Bb5:1.5 A5:.5 F5:1 D5:1 | C6:1.5 G5:.5 E5:1 G5:1 | C#6:.75 C#6:.75 E6:.5 E6:.75 D6:.75 C#6:.5 | E6:2 r:2")
    I = T.sec('Dm Dm A A')
    bass = lambda v=64: acc('bass', 33, vel=v, pat='gallop', bo=2)
    chop = lambda v=42: acc('stab', 45, vel=v, lo=55, hi=72, at=[.5, 1.5, 2.5, 3.5], d=.3)
    dr = lambda v: drums('gallop', vel=v, fill=True, fill_p='gallop_fill', fill_every=4)
    T.play(I, [bass(52), dr(58), mel(110, "r:4 | r:4 | A4:.75 A4:.75 C#5:.5 E5:.75 A5:.75 G5:.5 | A4:.5 C#5:.5 E5:.5 A5:.5 C#6:1 E6:1", vel=72, check=0), acc('roll', 47, vel=60, bo=1, bars=[1])])
    T.play(A, [bass(), chop(), mel(110, RA, vel=78), dr(70)])
    T.play(A, [bass(68), chop(44), mel(110, RA, vel=78), mel(56, RA, vel=52, o=12), mel(60, DI, vel=64, leg=1.0, check=0), mel(57, DI, vel=56, o=-12, leg=1.0, check=0), dr(76)])
    T.play(B, [bass(62), acc('pad', 48, vel=42, lo=48, hi=67), mel(56, RB, vel=76), mel(60, T.third(RB, -2), vel=46), dr(66)])
    T.play(A, [bass(70), chop(46), mel(110, RA, vel=80), mel(78, RA, vel=50, o=12), mel(60, DI, vel=70, leg=1.0, check=0), mel(57, DI, vel=62, o=-12, leg=1.0, check=0), dr(80)])
    T.play(B, [bass(66), acc('pad', 48, vel=44, lo=48, hi=67), mel(56, RB, vel=80), mel(110, RB, vel=56, o=12), mel(60, T.third(RB, -2), vel=50), acc('roll', 47, vel=64, bo=1, bars=[7]), dr(72)])
    T.play(A, [bass(72), chop(48), mel(110, RA, vel=82), mel(56, RA, vel=62, o=12), mel(60, DI, vel=74, leg=1.0, check=0), mel(57, DI, vel=66, o=-12, leg=1.0, check=0), dr(86)])
    return T

# ============================ JEFE · Machaca-Huesos (mi menor; Dies irae como riff) ============================
def jefe():
    T = Track(bpm=92, bpb=4, tonic='E', mode='minor', seed=42, rest=1, reverb=(2.4, .26))
    A = T.sec('Em D.Em Em D.Em C D Em B')
    DI = ("G3:1 F#3:1 G3:1 E3:1 | F#3:1 D3:1 E3:2 | G3:1 F#3:1 G3:1 E3:1 | F#3:1 D3:1 E3:2 | "
          "E3:1.5 G3:1.5 C4:1 | F#3:1.5 A3:1.5 D4:1 | G3:1.5 B3:1.5 E4:1 | B3:1 D#4:1 F#4:2")
    CH = ("E5:.75 E5:.75 G5:.5 B5:2 | A5:.75 A5:.75 F#5:.5 E5:2 | E5:.75 E5:.75 G5:.5 B5:2 | A5:.75 A5:.75 F#5:.5 G5:1 E5:1 | "
          "C6:.75 C6:.75 B5:.5 G5:2 | D6:.75 D6:.75 C6:.5 A5:2 | B5:.75 B5:.75 G5:.5 E5:2 | D#6:1 F#6:1 B5:2")
    B = T.sec('Am Am Em Em C D B B')
    BR = "A4:4 | C5:4 | B4:4 | G4:4 | E5:4 | F#5:4 | D#5:4 | B4:4"
    I = T.sec('Em Em Em B')
    bass = lambda v=70: acc('bass', 43, vel=v, pat='hammer', bo=1)
    dr = lambda v: drums('stomp', vel=v, fill=True, fill_p='stomp_fill', fill_every=4)
    T.play(I, [drums('heart', vel=72), acc('drone', 109, vel=34, every=4, offs=[0, 7], bo=2), acc('drone', 47, vel=52, every=2, offs=[0], bo=1), mel(52, "r:4 | r:4 | E4:4 | F#4:4", vel=34, check=0)])
    T.play(A, [mel(57, DI, vel=84), mel(58, DI, vel=76, o=-12), bass(), dr(78)])
    T.play(A, [mel(57, DI, vel=84), mel(58, DI, vel=76, o=-12), bass(), mel(60, CH, vel=72), acc('drone', 109, vel=30, every=4, offs=[0, 7], bo=2), dr(84)])
    T.play(B, [mel(52, BR, vel=60, leg=1.0), mel(53, T.third(BR, -2), vel=44, leg=1.0), mel(8, "E5:.5 B4:.5 E5:.5 B4:.5 E5:2 | r:4 | E5:.5 B4:.5 E5:.5 B4:.5 E5:2 | r:4 | r:4 | r:4 | r:4 | r:4", vel=30, check=0, partial=1),
               acc('drone', 47, vel=56, every=4, offs=[0], bo=1), acc('pad', 48, vel=34, lo=46, hi=66), acc('bass', 43, vel=50, pat='root', bo=1), drums('heart', vel=70), acc('roll', 47, vel=70, bo=1, bars=[7])])
    T.play(A, [mel(57, DI, vel=90), mel(58, DI, vel=80, o=-12), bass(76), mel(60, CH, vel=80), mel(52, CH, vel=54, o=-12), acc('stab', 61, vel=54, lo=52, hi=70, at=[0], d=1.2), dr(90)])
    T.play(A, [mel(57, DI, vel=92), mel(58, DI, vel=82, o=-12), mel(116, DI, vel=70, o=0, check=0), bass(80), mel(60, CH, vel=84), mel(109, CH, vel=52, o=12), mel(52, CH, vel=60),
               acc('stab', 61, vel=62, lo=52, hi=70, at=[0, 2], d=1.0), dr(94)])
    return T

# ============================ NOCHE · nana en fa lidio ============================
def noche():
    T = Track(bpm=56, bpb=3, tonic='F', mode='lydian', seed=52, rest=1, reverb=(2.8, .32), tail=5.0)
    P1 = T.sec('Fmaj7 G Am7 Fmaj7 Dm7 G C Fmaj7')
    M1 = ("A5:1 C6:1 E6:1 | D6:1.5 B5:.5 G5:1 | C6:1 E6:1 A5:1 | A5:2 F5:1 | F5:1 A5:1 D6:1 | B5:1.5 D6:.5 G6:1 | E6:1 C6:1 G5:1 | A5:3")
    P2 = T.sec('Fmaj7 G Am7 Fmaj7 Dm7 Bb C Fmaj7')
    M2 = ("A5:1 C6:1 E6:1 | D6:1.5 B5:.5 G5:1 | C6:1 E6:1 A5:1 | A5:2 F5:1 | F5:1 A5:1 D6:1 | Bb5:1.5 D6:.5 F6:1 | E6:1 G5:1 C6:1 | A5:3")
    hp = lambda v=34: acc('arp', 46, vel=v, lo=48, hi=76, pat=[0, 1, 2, 1], sub=1.0)
    ce = lambda v=24: acc('arp', 8, vel=v, lo=72, hi=96, pat=[0, 2, 1, 2, 0, 2], sub=.5)
    T.play(P1, [mel(10, M1, vel=62, leg=1.2), hp(34), acc('bass', 43, vel=28, pat='waltz', bo=2)])
    T.play(P2, [mel(10, M2, vel=62, leg=1.2), hp(36), ce(20), acc('bass', 43, vel=30, pat='waltz', bo=2), acc('pad', 94, vel=22, lo=48, hi=68)])
    T.play(P1, [mel(8, M1, vel=54, leg=1.2), mel(10, M1, vel=40, leg=1.2), hp(38), acc('pad', 94, vel=26, lo=48, hi=68), acc('bass', 43, vel=30, pat='waltz', bo=2), mel(73, T.third(M1, -2), vel=28, leg=1.0, o=-12)])
    T.play(P2, [mel(10, M2, vel=56, leg=1.2, dyn=(1.0, .55)), hp(32), ce(18), acc('pad', 94, vel=22, lo=48, hi=68), acc('bass', 43, vel=26, pat='waltz', bo=2)])
    return T

TRACKS = dict(mundo=mundo(), aldea=aldea(), combate=combate(), jefe=jefe(), noche=noche())
