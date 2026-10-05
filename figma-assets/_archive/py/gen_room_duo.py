# -*- coding: utf-8 -*-
"""Roomie: hero-room-duo.svg (1440x1360) —— 双人同房间听歌场景。
画幅/视角/房间结构与 gen_hero_ghibli.py 完全一致（720x680 逻辑坐标，k=2 放大），
仅重新布置家具让客厅更宽敞：
  - 撤掉笨重的白色大沙发与脚踏，换成两只低矮蒲团（MOMO 薄荷绿 / KIKI 奶油黄）
  - 原木大茶几换成更小的圆形矮茶几，放到靠近投影墙一侧
  - 投影仪移到唱片墙角落地带，光束斜跨屋顶，不再占用客厅中心
  - 前区地板留白，只添一盆绿植，空间感更开阔
  - 两个角色并排坐在蒲团上，面向放映墙（正在播放的歌）"""
import math, os, random

OUT = r"C:\Roomie\figma-assets"
os.makedirs(OUT, exist_ok=True)

AMBER, CORAL = "#E6B15A", "#D96A4D"
TEAL, TEAL_D = "#6D99A6", "#557E8C"
HAIR = "#3A3230"
SKIN, SKIN_D = "#F7D9BE", "#EEC5A4"
BROWN = "#4A3526"
SKIRT, SKIRT_D = "#C84B38", "#A83E2E"
BLOUSE = "#FBF3E2"
BOW, BOW_D = "#D63A2F", "#B52E24"
SHADOW = "#7A6B8A"

SQ = math.sqrt(0.8)
HQ = math.sqrt(0.2)

def Lw(u, v):
    return (120.0 + 240.0 * u, 230.0 - 120.0 * u + 220.0 * v)
def Rw(u, v):
    return (360.0 + 240.0 * u, 110.0 + 120.0 * u + 220.0 * v)
def Fl(s, t):
    return (360.0 + 240.0 * (s - t), 330.0 + 120.0 * (s + t))

def disc_pts(cx, cy, r, sgn, n=26, squash=1.0):
    out = []
    for i in range(n):
        th = 2 * math.pi * i / n
        out.append((cx + SQ * r * math.cos(th),
                    cy + sgn * HQ * r * math.cos(th) - squash * r * math.sin(th)))
    return out

def lerp(a, b, f):
    return (a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f)

HEADER = '<?xml version="1.0" encoding="UTF-8"?>\n'


def hero(k, tx, ty, pfx):
    def SP(points):
        return " ".join(f"{p[0]*k+tx:.1f},{p[1]*k+ty:.1f}" for p in points)
    def SD(points):
        return "M" + " L".join(f"{p[0]*k+tx:.1f},{p[1]*k+ty:.1f}" for p in points) + " Z"
    def P(x, y):
        return f"{x*k+tx:.1f},{y*k+ty:.1f}"
    E = []
    add = E.append
    def poly(points, fill, extra=""):
        add(f'<polygon points="{SP(points)}" fill="{fill}"{extra}/>')
    def pline(p1, p2, stroke, w, extra=""):
        add(f'<line x1="{p1[0]*k+tx:.1f}" y1="{p1[1]*k+ty:.1f}" '
            f'x2="{p2[0]*k+tx:.1f}" y2="{p2[1]*k+ty:.1f}" '
            f'stroke="{stroke}" stroke-width="{w*k:.2f}"{extra}/>')
    def circle(c, r, fill, extra=""):
        add(f'<circle cx="{c[0]*k+tx:.1f}" cy="{c[1]*k+ty:.1f}" r="{r*k:.1f}" fill="{fill}"{extra}/>')
    def ell(c, rx, ry, fill, extra=""):
        add(f'<ellipse cx="{c[0]*k+tx:.1f}" cy="{c[1]*k+ty:.1f}" rx="{rx*k:.1f}" ry="{ry*k:.1f}" fill="{fill}"{extra}/>')
    def qpath(pts, stroke, w, extra=""):
        d = f"M{P(*pts[0])} " + " ".join(f"Q{P(*pts[i])} {P(*pts[i+1])}" for i in range(1, len(pts) - 1, 2))
        add(f'<path d="{d}" fill="none" stroke="{stroke}" stroke-width="{w*k:.2f}"{extra}/>')
    def fpath(pts, fill, extra=""):
        d = f"M{P(*pts[0])} " + " ".join(f"Q{P(*pts[i])} {P(*pts[i+1])}" for i in range(1, len(pts) - 1, 2)) + " Z"
        add(f'<path d="{d}" fill="{fill}"{extra}/>')
    INK = f' stroke="{BROWN}" stroke-opacity="0.32" stroke-width="{0.55*k:.2f}"'
    CINK = f' stroke="{BROWN}" stroke-opacity="0.8" stroke-width="{0.6*k:.2f}" stroke-linejoin="round"'

    def cuboid(cx, cy, ax, ay, h, ctop, cleft, cright):
        EXv = (SQ * ax, HQ * ax); EYv = (-SQ * ay, HQ * ay)
        A = (cx + EXv[0] + EYv[0], cy + EXv[1] + EYv[1])
        B = (cx + EXv[0] - EYv[0], cy + EXv[1] - EYv[1])
        Cc = (cx - EXv[0] - EYv[0], cy - EXv[1] - EYv[1])
        D = (cx - EXv[0] + EYv[0], cy - EXv[1] + EYv[1])
        At = (A[0], A[1] - h); Bt = (B[0], B[1] - h)
        Ct = (Cc[0], Cc[1] - h); Dt = (D[0], D[1] - h)
        poly([Dt, At, A, D], cleft, INK)
        poly([At, Bt, B, A], cright, INK)
        poly([Ct, Bt, At, Dt], ctop, INK)
        return dict(A=A, B=B, C=Cc, D=D, At=At, Bt=Bt, Ct=Ct, Dt=Dt)

    def cushion(cx, cy, cside, ctop):
        """低矮圆蒲团：底面 + 柱侧 + 顶面 + 滚边缝线"""
        ell((cx - 4, cy + 3), 21, 6.5, SHADOW, f' opacity="0.24" filter="url(#{pfx}-soft)"')
        ell((cx, cy), 17, 7.5, cside, INK)
        poly([(cx - 17, cy - 7), (cx + 17, cy - 7), (cx + 17, cy), (cx - 17, cy)], cside)
        ell((cx, cy - 7), 17, 7.5, ctop, INK)
        ell((cx, cy - 7), 12.5, 5.2, "none",
            f' stroke="{BROWN}" stroke-opacity="0.25" stroke-width="{0.5*k:.2f}" stroke-dasharray="2.5 2"')

    LABELS = {"B": "#F7F3EA", "G": "#F7F3EA", "W": AMBER, "A": "#B84A39", "C": "#F7F3EA"}

    def disc(cx, cy, r, sgn, body, label="#F7F3EA"):
        add(f'<path d="{SD(disc_pts(cx, cy, r, sgn))}" fill="{body}" '
            f'stroke="{BROWN}" stroke-opacity="0.3" stroke-width="{0.55*k:.2f}"/>')
        for rr, op, w in [(0.84, 0.28, 0.7), (0.66, 0.4, 0.8), (0.48, 0.3, 0.7)]:
            add(f'<path d="{SD(disc_pts(cx, cy, r * rr, sgn, n=22))}" fill="none" '
                f'stroke="#241A12" stroke-opacity="{op}" stroke-width="{w*k:.2f}"/>')
        add(f'<path d="{SD(disc_pts(cx, cy, r * 0.30, sgn, n=16))}" fill="{label}" '
            f'stroke="{BROWN}" stroke-opacity="0.18" stroke-width="{0.4*k:.2f}"/>')
        circle((cx - r * 0.14, cy - r * 0.13), r * 0.075, "#FFFFFF", ' opacity="0.75"')
        circle((cx, cy), 1.2, "#3A3230")

    def cloud(cx, cy, s, op=1.0):
        ell((cx + 2 * s, cy + 7 * s), 52 * s, 13 * s, "#C8E2F0", f' opacity="{0.85 * op}"')
        ell((cx, cy + 8 * s), 50 * s, 14 * s, "#FFFFFF", f' opacity="{op}"')
        for dx, dy, rx, ry in [(-30, 3, 22, 13), (-9, -9, 26, 17), (17, -5, 24, 15), (38, 4, 18, 10)]:
            ell((cx + dx * s, cy + dy * s), rx * s, ry * s, "#FFFFFF", f' opacity="{op}"')

    SC = [Rw(0.16, 0.14), Rw(0.84, 0.14), Rw(0.84, 0.66), Rw(0.16, 0.66)]
    rng = random.Random(42)
    defs = (
        "<defs>"
        f'<linearGradient id="{pfx}-bgsky" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="#3E9BD8"/><stop offset="1" stop-color="#7FC4E8"/></linearGradient>'
        f'<linearGradient id="{pfx}-page" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="#F5C6C6"/><stop offset="1" stop-color="#F8E8DC"/></linearGradient>'
        f'<radialGradient id="{pfx}-halo" cx="0.5" cy="0.5" r="0.62">'
        f'<stop offset="0" stop-color="#FFD9E2" stop-opacity="0.16"/>'
        f'<stop offset="0.6" stop-color="#FFD9E2" stop-opacity="0.07"/>'
        f'<stop offset="1" stop-color="#FFD9E2" stop-opacity="0"/></radialGradient>'
        f'<linearGradient id="{pfx}-pwall" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="#6B5138"/><stop offset="1" stop-color="#543F2C"/></linearGradient>'
        f'<linearGradient id="{pfx}-grass" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="#4E9E5F"/><stop offset="1" stop-color="#3D8A50"/></linearGradient>'
        f'<radialGradient id="{pfx}-vign" cx="0.5" cy="0.42" r="0.78">'
        f'<stop offset="0" stop-color="#F2E4C4" stop-opacity="0"/>'
        f'<stop offset="0.72" stop-color="#E8CD9C" stop-opacity="0.18"/>'
        f'<stop offset="1" stop-color="#D8B984" stop-opacity="0.42"/></radialGradient>'
        f'<radialGradient id="{pfx}-glow">'
        f'<stop offset="0" stop-color="#F2C979" stop-opacity="0.55"/>'
        f'<stop offset="1" stop-color="#F2C979" stop-opacity="0"/></radialGradient>'
        f'<clipPath id="{pfx}-screenClip"><polygon points="{SP(SC)}"/></clipPath>'
        f'<filter id="{pfx}-soft" x="-20%" y="-20%" width="140%" height="140%">'
        f'<feGaussianBlur stdDeviation="0.5"/></filter>'
        f'<filter id="{pfx}-soft2" x="-30%" y="-30%" width="160%" height="160%">'
        f'<feGaussianBlur stdDeviation="1.6"/></filter>'
        f'<filter id="{pfx}-wobble" x="-3%" y="-3%" width="106%" height="106%">'
        f'<feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" seed="7" result="w"/>'
        f'<feDisplacementMap in="SourceGraphic" in2="w" scale="1.6" '
        f'xChannelSelector="R" yChannelSelector="G"/></filter>'
        f'<filter id="{pfx}-grain" x="0%" y="0%" width="100%" height="100%">'
        f'<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n"/>'
        f'<feColorMatrix in="n" type="matrix" values="0 0 0 0 0.18  0 0 0 0 0.15  0 0 0 0 0.12  0 0 0 0.9 0" result="c"/>'
        f'<feComposite in="c" in2="SourceGraphic" operator="in"/></filter>'
        "</defs>"
    )

    # ================= Sky & Clouds =================
    add('<g id="Sky">')
    cloud(168, 96, 1.35)
    cloud(600, 74, 1.1, 0.97)
    cloud(436, 148, 0.6, 0.9)
    add('</g>')

    # ================= Record Wall =================
    add('<g id="Record Wall">')
    wall_l = [Lw(0, 0), Lw(1, 0), Lw(1, 1), Lw(0, 1)]
    poly(wall_l, "#F2E4C4", INK)
    poly(wall_l, f"url(#{pfx}-vign)")
    poly([Lw(0.06, 0.06), Lw(0.94, 0.06), Lw(0.94, 0.94), Lw(0.06, 0.94)], "#EBD8B0",
         f' stroke="#8A6B4A" stroke-width="{1.0*k:.2f}"')
    for _ in range(6):
        u0 = rng.uniform(0.09, 0.82); ln = rng.uniform(0.04, 0.1)
        v0 = rng.uniform(0.066, 0.094)
        pline(Lw(u0, v0), Lw(min(u0 + ln, 0.93), v0), "#A07C54", 0.55, ' stroke-opacity="0.5"')
    for _ in range(6):
        u0 = rng.uniform(0.09, 0.82); ln = rng.uniform(0.04, 0.1)
        v0 = rng.uniform(0.906, 0.934)
        pline(Lw(u0, v0), Lw(min(u0 + ln, 0.93), v0), "#A07C54", 0.55, ' stroke-opacity="0.45"')
    du = 0.88 / 6.0
    for i in range(1, 6):
        u = 0.06 + i * du
        pline(Lw(u, 0.06), Lw(u, 0.94), "#A5855E", 0.9, ' stroke-opacity="0.85"')
        pline(Lw(0.06, u), Lw(0.94, u), "#A5855E", 0.9, ' stroke-opacity="0.85"')
    grid = [
        ["B", "G", "W", "B", "W", "P"],
        ["W", "B", "A", "G", "B", "W"],
        ["G", "W", "B", "W", "C", "B"],
        ["B", "G", "W", "A", "W", "G"],
        ["W", "B", "G", "B", "W", "A"],
        ["K", "W", "B", "G", "W", "S"],
    ]
    cmap = {"B": "#2F4A5A", "G": "#4A6752", "W": "#A89F8E", "A": AMBER, "C": CORAL}
    lab_cycle = ["#F7F3EA", AMBER, CORAL, "#B84A39"]
    for r in range(6):
        for c in range(6):
            code = grid[r][c]
            if code in cmap:
                cx, cy = Lw(0.06 + (c + 0.5) * du, 0.06 + (r + 0.5) * du)
                lab = LABELS.get(code) if code in ("A", "C") else lab_cycle[(r + c) % 4]
                disc(cx, cy, 12.5, -1, cmap[code], lab)
    vb = 0.925
    for u0, hh, col in [(0.094, 22, "#5FA8B8"), (0.1125, 26, AMBER), (0.131, 19, CORAL)]:
        b0 = Lw(u0, vb); b1 = Lw(u0 + 0.0145, vb)
        poly([b0, b1, (b1[0], b1[1] - hh), (b0[0], b0[1] - hh)], col,
             f' stroke="{BROWN}" stroke-opacity="0.3" stroke-width="{0.5*k:.2f}"')
        pline((b0[0] + 1.5, b0[1] - hh + 3), (b1[0] - 1.5, b1[1] - hh + 3), "#F7F3EA", 0.6,
              ' stroke-opacity="0.55"')
    pa = Lw(0.846, 0.096); pb = Lw(0.887, 0.096)
    poly([(pa[0], pa[1] - 3), (pb[0], pb[1] - 3), (pb[0] - 1, pb[1] + 11), (pa[0] + 1, pa[1] + 11)], "#C97B4A",
         f' stroke="{BROWN}" stroke-opacity="0.3" stroke-width="{0.5*k:.2f}"')
    mx = (pa[0] + pb[0]) / 2; my = (pa[1] + pb[1]) / 2 + 8
    for dx0, cx1, cy1, ex1, ey1 in [(-5, -14, 12, -11, 28), (-2, -7, 18, -5, 38),
                                     (1, 0, 20, 3, 42), (4, 10, 14, 9, 32), (6, 14, 10, 13, 24)]:
        qpath([(mx + dx0, my), (mx + cx1, my + cy1), (mx + ex1, my + ey1)],
              "#4E8A46", 1.4, ' stroke-linecap="round"')
    for lx, ly in [(mx-11, my+28), (mx-5, my+38), (mx+3, my+42), (mx+9, my+32), (mx+13, my+24)]:
        ell((lx, ly), 2.4, 1.5, "#4E8A46")
    sa = Lw(0.845, 0.905); sb = Lw(0.889, 0.905)
    poly([sa, sb, (sb[0], sb[1] - 8), (sa[0], sa[1] - 8)], "#F1EADB", INK)
    scx = (sa[0] + sb[0]) / 2; scy = (sa[1] + sb[1]) / 2 - 14.0
    add(f'<path d="{SD(disc_pts(scx, scy, 7.5, -1, n=20))}" fill="#FDFAF3" '
        f'stroke="{BROWN}" stroke-opacity="0.3" stroke-width="{0.55*k:.2f}"/>')
    add('</g>')

    # ================= Projection Wall =================
    add('<g id="Projection Wall">')
    poly([Rw(0, 0), Rw(1, 0), Rw(1, 1), Rw(0, 1)], f"url(#{pfx}-pwall)", INK)
    pline(Rw(0, 0), Rw(0, 1), "#42311F", 1.4, ' stroke-opacity="0.6"')
    poly([Rw(0.10, 0.08), Rw(0.90, 0.08), Rw(0.90, 0.72), Rw(0.10, 0.72)], "#FFF3D0", ' opacity="0.10"')
    poly([Rw(0.11, 0.09), Rw(0.89, 0.09), Rw(0.89, 0.71), Rw(0.11, 0.71)], "#3A2C1E", INK)
    add(f'<g clip-path="url(#{pfx}-screenClip)">')
    poly([Rw(0.16, 0.14), Rw(0.385, 0.14), Rw(0.385, 0.66), Rw(0.16, 0.66)], "#C9758A")
    poly([Rw(0.615, 0.14), Rw(0.84, 0.14), Rw(0.84, 0.66), Rw(0.615, 0.66)], "#C9758A")
    poly([Rw(0.385, 0.14), Rw(0.615, 0.14), Rw(0.615, 0.66), Rw(0.385, 0.66)], f"url(#{pfx}-page)")
    pline(Rw(0.465, 0.165), Rw(0.535, 0.165), "#FFFFFF", 0.8,
          ' stroke-opacity="0.8" stroke-linecap="round"')
    dcx, dcy = Rw(0.50, 0.36)
    add(f'<path d="{SD(disc_pts(dcx, dcy, 18.5, 1, n=28))}" fill="#EE88A2" fill-opacity="0.9" '
        f'stroke="#B84A64" stroke-opacity="0.55" stroke-width="{0.55*k:.2f}"/>')
    for rr, op in [(0.89, 0.4), (0.76, 0.34), (0.63, 0.4), (0.50, 0.32)]:
        add(f'<path d="{SD(disc_pts(dcx, dcy, 18.5 * rr, 1, n=24))}" fill="none" '
            f'stroke="#B84A64" stroke-opacity="{op}" stroke-width="{0.5*k:.2f}"/>')
    qpath([(dcx - 13, dcy - 9), (dcx - 15, dcy), (dcx - 11.5, dcy + 10.5)], "#FFFFFF", 1.2,
          ' stroke-opacity="0.55" stroke-linecap="round"')
    cover = disc_pts(dcx, dcy, 6.8, 1, n=20)
    add(f'<path d="{SD(cover)}" fill="{AMBER}" '
        f'stroke="#B84A64" stroke-opacity="0.5" stroke-width="{0.45*k:.2f}"/>')
    poly([(dcx, dcy)] + cover[0:8], CORAL, ' opacity="0.85"')
    poly([(dcx, dcy)] + cover[10:15], "#F7F3EA", ' opacity="0.8"')
    circle((dcx - 2.1, dcy - 1.9), 1.7, "#FFF3D0")
    circle((dcx, dcy), 1.2, "#F8E8DC", f' stroke="#A04A5C" stroke-opacity="0.6" stroke-width="{0.4*k:.2f}"')
    ap = Rw(0.592, 0.185); hd = Rw(0.562, 0.335)
    circle(ap, 2.8, "#8A4A5A", f' stroke="{BROWN}" stroke-opacity="0.4" stroke-width="{0.4*k:.2f}"')
    circle(ap, 1.2, "#E8A0AE")
    pline(ap, hd, "#7A4A56", 1.0, ' stroke-linecap="round"')
    poly([hd, (hd[0] - 1.8, hd[1] + 2.7), (hd[0] + 0.5, hd[1] + 3.7), (hd[0] + 2.3, hd[1] + 0.9)], "#8A4A5A")
    pline(Rw(0.44, 0.505), Rw(0.56, 0.505), "#8A3A4E", 2.6, ' stroke-linecap="round"')
    pline(Rw(0.46, 0.54), Rw(0.54, 0.54), "#C9758A", 1.6, ' stroke-linecap="round"')
    pline(Rw(0.475, 0.565), Rw(0.525, 0.565), "#D9A0AC", 1.3, ' stroke-linecap="round"')
    pline(Rw(0.42, 0.60), Rw(0.58, 0.60), "#E0A0AE", 1.1, ' stroke-linecap="round"')
    pline(Rw(0.42, 0.60), Rw(0.50, 0.60), "#8A3A4E", 1.5, ' stroke-linecap="round"')
    circle(Rw(0.50, 0.60), 1.5, "#8A3A4E")
    pbc = Rw(0.50, 0.64)
    add(f'<circle cx="{pbc[0]*k+tx:.1f}" cy="{pbc[1]*k+ty:.1f}" r="{3.2*k:.1f}" fill="none" '
        f'stroke="#8A3A4E" stroke-width="{0.7*k:.2f}"/>')
    poly([(pbc[0] - 1.1, pbc[1] - 1.6), (pbc[0] - 1.1, pbc[1] + 1.6), (pbc[0] + 1.8, pbc[1])], "#8A3A4E")
    pbc = Rw(0.50, 0.635)
    add(f'<circle cx="{pbc[0]*k+tx:.1f}" cy="{pbc[1]*k+ty:.1f}" r="{2.6*k:.1f}" fill="none" '
        f'stroke="#A04A5C" stroke-width="{0.6*k:.2f}"/>')
    poly([(pbc[0] - 0.9, pbc[1] - 1.3), (pbc[0] - 0.9, pbc[1] + 1.3), (pbc[0] + 1.5, pbc[1])], "#A04A5C")
    poly([Rw(0.30, 0.14), Rw(0.44, 0.14), Rw(0.16, 0.50), Rw(0.16, 0.34)], "#FFFFFF", ' opacity="0.09"')
    poly([Rw(0.50, 0.14), Rw(0.55, 0.14), Rw(0.16, 0.60), Rw(0.16, 0.55)], "#FFFFFF", ' opacity="0.06"')
    add('</g>')
    poly([Rw(0.08, 0.06), Rw(0.92, 0.06), Rw(0.92, 0.74), Rw(0.08, 0.74)], f"url(#{pfx}-halo)")
    add('</g>')

    # ================= Floor（留白更多，只保留地毯/音符）=================
    add('<g id="Floor">')
    poly([Fl(0, 0), Fl(1, 0), Fl(1, 1), Fl(0, 1)], f"url(#{pfx}-grass)", INK)
    for _ in range(70):
        gx, gy = Fl(rng.uniform(0.03, 0.97), rng.uniform(0.03, 0.97))
        col = rng.choice(["#6FCB7A", "#2F7040", "#8FDB92"])
        pline((gx, gy), (gx + rng.uniform(-1.0, 2.2), gy - rng.uniform(2.0, 4.2)), col, 0.7,
              ' stroke-opacity="0.7" stroke-linecap="round"')
    for _ in range(9):
        fx, fy = Fl(rng.uniform(0.06, 0.94), rng.uniform(0.06, 0.94))
        petal = "#FFFFFF" if rng.random() < 0.55 else "#F7D54E"
        ctr = "#E6B15A" if petal == "#FFFFFF" else "#D96A4D"
        for pdx, pdy in [(-1.6, 0), (1.6, 0), (0, -1.1), (0, 1.1)]:
            circle((fx + pdx, fy + pdy), 0.95, petal)
        circle((fx, fy), 0.8, ctr)
    # 更大的双人地毯
    add('<g id="Rug">')
    rug = [Fl(0.26, 0.30), Fl(0.80, 0.30), Fl(0.80, 0.68), Fl(0.26, 0.68)]
    poly(rug, CORAL, ' opacity="0.9"')
    t = 0.318
    while t < 0.675:
        pline(Fl(0.272, t), Fl(0.788, t), "#F7F3EA", 0.55, ' stroke-opacity="0.4"')
        t += 0.026
    poly([Fl(0.285, 0.325), Fl(0.775, 0.325), Fl(0.775, 0.655), Fl(0.285, 0.655)], "none",
         f' stroke="#F7F3EA" stroke-opacity="0.55" stroke-width="{0.9*k:.2f}"')
    for cs, ct, ds, dt in [(0.26, 0.30, -1, -1), (0.80, 0.30, 1, -1),
                           (0.80, 0.68, 1, 1), (0.26, 0.68, -1, 1)]:
        c0 = Fl(cs, ct)
        for e in [Fl(cs + 0.02 * ds, ct), Fl(cs, ct + 0.02 * dt), Fl(cs + 0.016 * ds, ct + 0.016 * dt)]:
            pline(c0, e, "#B84A39", 0.8, ' stroke-opacity="0.85" stroke-linecap="round"')
    add('</g>')
    def shadow(points, op):
        add(f'<polygon points="{SP([(x - 12, y + 6) for x, y in points])}" fill="{SHADOW}" '
            f'opacity="{op}" filter="url(#{pfx}-soft)"/>')
    # 家具投影：茶几 / 灯柜 / 投影仪
    shadow([Fl(0.60, 0.16), Fl(0.78, 0.16), Fl(0.78, 0.34), Fl(0.60, 0.34)], 0.20)
    shadow([Fl(0.78, 0.06), Fl(0.94, 0.06), Fl(0.94, 0.22), Fl(0.78, 0.22)], 0.22)
    shadow([Fl(0.08, 0.52), Fl(0.20, 0.52), Fl(0.20, 0.66), Fl(0.08, 0.66)], 0.20)
    # 地上两张黑胶（挪到右下角空旷处）
    for rc, lab in [(Fl(0.86, 0.55), AMBER), (Fl(0.95, 0.42), CORAL)]:
        ell(rc, 30, 15, "#2F4A5A", INK)
        ell(rc, 25, 12.5, "none", f' stroke="#16242E" stroke-opacity="0.30" stroke-width="{0.6*k:.2f}"')
        ell(rc, 20, 10, "none", f' stroke="#16242E" stroke-opacity="0.45" stroke-width="{0.6*k:.2f}"')
        ell(rc, 13.5, 6.7, "none", f' stroke="#16242E" stroke-opacity="0.30" stroke-width="{0.5*k:.2f}"')
        ell(rc, 8.5, 4.2, lab, f' stroke="{BROWN}" stroke-opacity="0.18" stroke-width="{0.4*k:.2f}"')
        circle((rc[0] - 3.2, rc[1] - 1.6), 0.8, "#FFFFFF", ' opacity="0.7"')
        circle(rc, 1.2, "#3A3230")
    add('</g>')

    # ================= Projector（移到前左角落地，光束斜跨整个客厅）=================
    add('<g id="Projector">')
    pfb = Fl(0.14, 0.58)
    lens = (pfb[0], pfb[1] - 132.0)
    add(f'<polygon points="{SP([lens, Rw(0.17,0.15), Rw(0.83,0.15), Rw(0.83,0.65), Rw(0.17,0.65)])}" '
        f'fill="#C9E8EA" opacity="0.42"/>')
    add(f'<polygon points="{SP([lens, Rw(0.30,0.24), Rw(0.70,0.24), Rw(0.70,0.56), Rw(0.30,0.56)])}" '
        f'fill="#E8F6F4" opacity="0.30"/>')
    for _ in range(22):
        u = rng.uniform(0.2, 0.8); v = rng.uniform(0.18, 0.62)
        tt = rng.uniform(0.22, 0.92)
        px, py = lerp(lens, Rw(u, v), tt)
        col = "#FFFFFF" if rng.random() < 0.7 else "#F2C979"
        circle((px, py), rng.uniform(0.45, 1.1), col, f' opacity="{rng.uniform(0.3, 0.55):.2f}"')
    hub = (pfb[0], pfb[1] - 118.0)
    feet = [(pfb[0] - 24, pfb[1] + 15), (pfb[0] + 2, pfb[1] + 26), (pfb[0] + 26, pfb[1] + 12)]
    for ft in feet:
        pline(hub, ft, "#3A3230", 1.1, ' stroke-linecap="round"')
        circle(ft, 1.6, "#3A3230")
    body = cuboid(pfb[0], hub[1], 10, 10, 14, "#4A6E80", "#33505F", "#2A4450")
    circle(hub, 2.3, "#4A6E80", f' stroke="{BROWN}" stroke-width="{0.5*k:.2f}"')
    for i in range(3):
        for j in range(3):
            pt = lerp(lerp(body["Dt"], body["At"], 0.22 + 0.28 * i),
                      lerp(body["D"], body["A"], 0.22 + 0.28 * i), 0.28 + 0.22 * j)
            circle(pt, 0.8, "#7FA6B2", ' opacity="0.8"')
    vcx = pfb[0] - 3.0
    poly([(vcx - 4.4, 297), (vcx + 4.4, 297), (vcx + 4.4, 307), (vcx - 4.4, 307)], "#2A4450", INK)
    ell((vcx, 297), 4.4, 2.2, "#4A6E80", INK)
    dlen = 26.0
    pb = (lens[0] - dlen * SQ, lens[1] + dlen * HQ)
    r_b = 7.0
    t1 = (-0.594 * r_b, -1.044 * r_b); t2 = (0.596 * r_b, 1.044 * r_b)
    add(f'<path d="{SD(disc_pts(pb[0], pb[1], r_b, 1, n=20))}" fill="#2A4450" '
        f'stroke="{BROWN}" stroke-opacity="0.22" stroke-width="{0.55*k:.2f}"/>')
    poly([(pb[0] + t1[0], pb[1] + t1[1]), (lens[0] + t1[0], lens[1] + t1[1]),
          (lens[0] + t2[0], lens[1] + t2[1]), (pb[0] + t2[0], pb[1] + t2[1])], "#4A6E80", INK)
    add(f'<path d="{SD(disc_pts(lens[0], lens[1], r_b, 1, n=20))}" fill="#C9E8EA" '
        f'stroke="{BROWN}" stroke-width="{0.7*k:.2f}"/>')
    add(f'<path d="{SD(disc_pts(lens[0], lens[1], 3.4, 1, n=16))}" fill="#2A4450"/>')
    pline((lens[0] - 4.6, lens[1] + 0.6), (lens[0] - 2.0, lens[1] - 3.0), "#FFFFFF", 1.0,
          ' stroke-opacity="0.85" stroke-linecap="round"')
    circle((lens[0] - 1.6, lens[1] - 1.8), 0.9, "#F7F3EA")
    add('</g>')

    # ================= 圆形矮茶几（双人份茶点）=================
    add('<g id="Tea Table">')
    ttx, tty = Fl(0.68, 0.24)
    ell((ttx - 4, tty + 4), 22, 6.5, SHADOW, f' opacity="0.22" filter="url(#{pfx}-soft)"')
    ell((ttx, tty), 18, 8, "#A87B39", INK)
    poly([(ttx - 18, tty - 11), (ttx + 18, tty - 11), (ttx + 18, tty), (ttx - 18, tty)], "#C08F45")
    ell((ttx, tty - 11), 18, 8, "#E8BC72", INK)
    for dd in (-5, 0, 5):
        pline((ttx + dd - 6, tty - 12.2), (ttx + dd + 6, tty - 9.6), "#B0803D", 0.5,
              ' stroke-opacity="0.5"')
    # 两只马克杯（白 + 薄荷）
    for mxx, myy, mc in [(ttx - 7.5, tty - 13.5, "#FDFAF3"), (ttx + 6.5, tty - 12.5, "#A8D8C0")]:
        poly([(mxx - 3.4, myy - 5), (mxx + 3.4, myy - 5), (mxx + 3.4, myy + 1), (mxx - 3.4, myy + 1)], mc, INK)
        ell((mxx, myy - 5), 3.4, 1.7, "#D9CFC0", f' stroke="{BROWN}" stroke-opacity="0.3" stroke-width="{0.4*k:.2f}"')
        qpath([(mxx + 3.4, myy - 3.5), (mxx + 6, myy - 2), (mxx + 3.4, myy - 0.5)], BROWN, 0.8,
              ' stroke-opacity="0.45"')
        qpath([(mxx - 1, myy - 8), (mxx - 2, myy - 11), (mxx - 0.5, myy - 14)], "#FFFFFF", 0.7,
              ' stroke-opacity="0.55" stroke-linecap="round"')
    # 小碟饼干
    ell((ttx, tty - 8.5), 5.5, 2.4, "#FDFAF3", INK)
    circle((ttx - 1.8, tty - 9.4), 1.6, AMBER, f' stroke="{BROWN}" stroke-opacity="0.3" stroke-width="{0.4*k:.2f}"')
    circle((ttx + 2.0, tty - 9.0), 1.6, "#C08F45", f' stroke="{BROWN}" stroke-opacity="0.3" stroke-width="{0.4*k:.2f}"')
    add('</g>')

    # ================= 绿植（前左角，点缀空旷区）=================
    add('<g id="Plant">')
    plx, ply = Fl(0.05, 0.84)
    ell((plx - 4, ply + 3), 14, 4.5, SHADOW, f' opacity="0.22" filter="url(#{pfx}-soft)"')
    poly([(plx - 8, ply - 9), (plx + 8, ply - 9), (plx + 6, ply + 3), (plx - 6, ply + 3)], "#C97B4A", INK)
    pline((plx - 8, ply - 9), (plx + 8, ply - 9), "#A85E36", 1.0)
    for dx0, cx1, cy1, ex1, ey1 in [(-4, -16, -8, -13, -20), (-1, -8, -14, -5, -27),
                                     (1, 0, -16, 3, -30), (4, 10, -10, 9, -22), (6, 15, -6, 14, -16)]:
        qpath([(plx + dx0, ply - 9), (plx + cx1, ply + cy1), (plx + ex1, ply + ey1)],
              "#4E8A46", 1.6, ' stroke-linecap="round"')
    for lx, ly in [(plx - 13, ply - 20), (plx - 5, ply - 27), (plx + 3, ply - 30),
                   (plx + 9, ply - 22), (plx + 14, ply - 16)]:
        ell((lx, ly), 2.8, 1.7, "#5FA85A")
    add('</g>')

    # ================= 蒲团 + 双人角色 =================
    add('<g id="Duo">')
    # ---- MOMO：薄荷蒲团，抱膝坐姿，面向放映墙 ----
    mcx, mcy = Fl(0.40, 0.58)
    cushion(mcx, mcy, "#8FC3AC", "#C9EAD8")
    # 裙体（抱膝圆丘，宽而低，覆住蒲团）
    fpath([(mcx - 19, mcy - 11), (mcx - 20, mcy - 24), (mcx - 14, mcy - 36),
           (mcx - 4, mcy - 41), (mcx + 8, mcy - 40), (mcx + 16, mcy - 32),
           (mcx + 19, mcy - 20), (mcx + 16, mcy - 10), (mcx + 2, mcy - 7)], SKIRT, CINK)
    fpath([(mcx + 8, mcy - 40), (mcx + 16, mcy - 32), (mcx + 19, mcy - 20),
           (mcx + 16, mcy - 10), (mcx + 7, mcy - 9), (mcx + 12, mcy - 20), (mcx + 10, mcy - 32)],
          SKIRT_D, ' opacity="0.5"')
    qpath([(mcx - 8, mcy - 36), (mcx - 9, mcy - 26), (mcx - 8, mcy - 16)], SKIRT_D, 0.7,
          ' stroke-opacity="0.6" stroke-linecap="round"')
    # 小腿 + 小鞋（裙摆右前缘露出一点）
    pline((mcx + 15, mcy - 12), (mcx + 22, mcy - 11), SKIN, 2.2, ' stroke-linecap="round"')
    ell((mcx + 24, mcy - 10.5), 3.4, 2.2, HAIR, CINK)
    # 奶油上衣（短圆，盖住裙腰）
    fpath([(mcx - 6, mcy - 33), (mcx - 8, mcy - 46), (mcx - 4, mcy - 55), (mcx + 3, mcy - 58),
           (mcx + 10, mcy - 55), (mcx + 12, mcy - 46), (mcx + 11, mcy - 33), (mcx + 3, mcy - 30)], BLOUSE, CINK)
    pline((mcx - 3, mcy - 54), (mcx - 5, mcy - 35), SKIRT, 1.3)
    pline((mcx + 9, mcy - 54), (mcx + 10, mcy - 34), SKIRT, 1.3)
    circle((mcx - 4, mcy - 44), 1.1, SKIRT_D)
    circle((mcx + 9.5, mcy - 44), 1.1, SKIRT_D)
    # 手臂环抱膝前
    qpath([(mcx + 11, mcy - 46), (mcx + 17, mcy - 38), (mcx + 15, mcy - 28)], SKIN, 2.4,
          ' stroke-linecap="round"')
    circle((mcx + 15, mcy - 27), 2.3, SKIN, CINK)
    # 后发
    fpath([(mcx - 8, mcy - 60), (mcx - 13, mcy - 75), (mcx - 5, mcy - 83), (mcx + 7, mcy - 85),
           (mcx + 14, mcy - 77), (mcx + 14, mcy - 65), (mcx + 9, mcy - 58), (mcx - 1, mcy - 57)], HAIR, CINK)
    # 脸
    circle((mcx + 1, mcy - 67), 10.5, SKIN, CINK)
    # 刘海
    fpath([(mcx - 8, mcy - 68), (mcx - 7, mcy - 78), (mcx + 1, mcy - 81), (mcx + 11, mcy - 78),
           (mcx + 12, mcy - 71), (mcx + 7, mcy - 75), (mcx + 1, mcy - 76), (mcx - 5, mcy - 74)], HAIR, CINK)
    # 眼睛 / 鼻 / 腮红 / 微笑
    circle((mcx + 6, mcy - 66.5), 1.2, HAIR)
    circle((mcx + 11.5, mcy - 64), 0.9, "#E8B596")
    ell((mcx + 6.5, mcy - 62), 2.2, 1.2, "#F2A58C", ' opacity="0.55"')
    qpath([(mcx + 7, mcy - 60.5), (mcx + 9, mcy - 59), (mcx + 11, mcy - 60.5)], "#A8543F", 1.0,
          ' stroke-linecap="round"')
    # 大红蝴蝶结
    fpath([(mcx - 1, mcy - 83), (mcx - 10, mcy - 95), (mcx - 20, mcy - 91), (mcx - 16, mcy - 81), (mcx - 2, mcy - 80.5)], BOW, CINK)
    fpath([(mcx, mcy - 83), (mcx + 10, mcy - 96), (mcx + 20, mcy - 92), (mcx + 15, mcy - 81), (mcx, mcy - 80.5)], BOW, CINK)
    circle((mcx - 0.5, mcy - 82), 2.6, BOW_D, CINK)

    # ---- KIKI：奶油蒲团，盘腿坐姿，戴耳机捧热可可 ----
    kcx, kcy = Fl(0.62, 0.48)
    cushion(kcx, kcy, "#E8C98F", "#F7E3BC")
    # 连帽衫身体（盘腿圆墩）
    fpath([(kcx - 12, kcy - 12), (kcx - 15, kcy - 26), (kcx - 11, kcy - 38), (kcx - 3, kcy - 44),
           (kcx + 6, kcy - 43), (kcx + 12, kcy - 36), (kcx + 13, kcy - 24), (kcx + 10, kcy - 12),
           (kcx - 1, kcy - 9)], TEAL, CINK)
    fpath([(kcx + 6, kcy - 43), (kcx + 12, kcy - 36), (kcx + 13, kcy - 24), (kcx + 10, kcy - 12),
           (kcx + 3, kcy - 11), (kcx + 8, kcy - 24), (kcx + 7, kcy - 36)], TEAL_D, ' opacity="0.5"')
    # 盘起的两条腿
    ell((kcx - 7, kcy - 12), 6.5, 3.6, TEAL_D, CINK)
    ell((kcx + 5, kcy - 11), 6.5, 3.6, TEAL_D, CINK)
    # 帽子搭在背后
    fpath([(kcx - 9, kcy - 40), (kcx - 13, kcy - 34), (kcx - 10, kcy - 28), (kcx - 5, kcy - 32)], TEAL_D,
          f' opacity="0.85" stroke="{BROWN}" stroke-opacity="0.5" stroke-width="{0.5*k:.2f}"')
    # 头
    circle((kcx - 1, kcy - 56), 10.5, SKIN, CINK)
    # 头发（短碎发 + 呆毛）
    fpath([(kcx - 12, kcy - 58), (kcx - 13, kcy - 70), (kcx - 6, kcy - 77), (kcx + 4, kcy - 78),
           (kcx + 11, kcy - 72), (kcx + 11, kcy - 62), (kcx + 7, kcy - 68), (kcx + 2, kcy - 71),
           (kcx - 4, kcy - 69), (kcx - 9, kcy - 66)], HAIR, CINK)
    qpath([(kcx - 1, kcy - 78), (kcx + 1, kcy - 84), (kcx + 5, kcy - 86)], HAIR, 1.3,
          ' stroke-linecap="round"')
    # 耳机（珊瑚橙）：头梁 + 两侧耳罩
    qpath([(kcx - 11.5, kcy - 58), (kcx - 1, kcy - 74), (kcx + 9.5, kcy - 58)], CORAL, 2.2,
          ' stroke-linecap="round"')
    circle((kcx - 11.5, kcy - 57), 3.6, CORAL, CINK)
    circle((kcx - 11.5, kcy - 57), 1.6, "#F2C984")
    circle((kcx + 9.5, kcy - 57), 3.6, CORAL, CINK)
    circle((kcx + 9.5, kcy - 57), 1.6, "#F2C984")
    qpath([(kcx + 9.5, kcy - 53.5), (kcx + 12, kcy - 44), (kcx + 11, kcy - 36)], CORAL, 0.8,
          ' stroke-opacity="0.8" stroke-linecap="round"')
    # 闭着的笑眼 / 腮红 / 嘴
    qpath([(kcx - 7, kcy - 57), (kcx - 5, kcy - 55.4), (kcx - 3, kcy - 57)], HAIR, 1.2,
          ' stroke-linecap="round"')
    qpath([(kcx + 1, kcy - 57), (kcx + 3, kcy - 55.4), (kcx + 5, kcy - 57)], HAIR, 1.2,
          ' stroke-linecap="round"')
    ell((kcx - 8, kcy - 52.5), 2.0, 1.1, "#F2A58C", ' opacity="0.55"')
    ell((kcx + 6, kcy - 52.5), 2.0, 1.1, "#F2A58C", ' opacity="0.55"')
    qpath([(kcx - 4, kcy - 51), (kcx - 1, kcy - 48.6), (kcx + 2, kcy - 51)], "#A8543F", 1.3,
          ' stroke-linecap="round"')
    # 双手捧热可可
    circle((kcx - 6.5, kcy - 26), 2.4, SKIN, CINK)
    circle((kcx + 5.5, kcy - 26), 2.4, SKIN_D, CINK)
    poly([(kcx - 4.5, kcy - 30), (kcx + 3.5, kcy - 30), (kcx + 3.5, kcy - 21), (kcx - 4.5, kcy - 21)],
         "#FDFAF3", CINK)
    ell((kcx - 0.5, kcy - 30), 4.0, 1.9, "#C08F45", f' stroke="{BROWN}" stroke-opacity="0.3" stroke-width="{0.4*k:.2f}"')
    qpath([(kcx - 2, kcy - 34), (kcx - 3, kcy - 38), (kcx - 1.5, kcy - 41)], "#FFFFFF", 0.8,
          ' stroke-opacity="0.6" stroke-linecap="round"')
    qpath([(kcx + 1, kcy - 33), (kcx + 0.5, kcy - 37), (kcx + 2, kcy - 40)], "#FFFFFF", 0.7,
          ' stroke-opacity="0.5" stroke-linecap="round"')
    add('</g>')

    # ================= 音符（漂浮在两人头顶的空气感）=================
    add('<g id="Notes" font-family="MiSans">')
    add(f'<text x="{292*k+tx:.1f}" y="{322*k+ty:.1f}" font-size="{13*k:.1f}" fill="{CORAL}" opacity="0.9" '
        f'transform="rotate(-12 {292*k+tx:.1f} {322*k+ty:.1f})">♪</text>')
    add(f'<text x="{408*k+tx:.1f}" y="{336*k+ty:.1f}" font-size="{9*k:.1f}" fill="{AMBER}" opacity="0.9" '
        f'transform="rotate(8 {408*k+tx:.1f} {336*k+ty:.1f})">♫</text>')
    add(f'<text x="{345*k+tx:.1f}" y="{296*k+ty:.1f}" font-size="{8*k:.1f}" fill="#FDFAF3" opacity="0.9" '
        f'transform="rotate(-6 {345*k+tx:.1f} {296*k+ty:.1f})">♪</text>')
    add('</g>')

    # ================= Lamp =================
    add('<g id="Lamp">')
    circle((532.8, 375), 110, f"url(#{pfx}-glow)", ' opacity="0.18"')
    circle((532.8, 375), 64, f"url(#{pfx}-glow)", ' opacity="0.35"')
    circle((532.8, 375), 40, f"url(#{pfx}-glow)", ' opacity="0.55"')
    cuboid(*Fl(0.86, 0.14), 22, 22, 44, "#7FA6B2", "#6D99A6", "#5B8794")
    ell((532.8, 404), 7, 3.5, "#3A3230")
    pline((532.8, 404), (532.8, 378), "#3A3230", 1.8)
    poly([(516.8, 364), (548.8, 364), (548.8, 386), (516.8, 386)], AMBER, INK)
    ell((532.8, 364), 16, 7, "#F2C984")
    ell((532.8, 364), 11.5, 4.6, "#F7DCA6")
    ell((532.8, 386), 16, 7, "#D9A94E")
    add('</g>')

    # ================= 午后阳光 =================
    add('<g id="Sunlight">')
    poly([(60, 0), (195, 0), (520, 680), (330, 680)], "#FFF0B8", ' opacity="0.10"')
    poly([(215, 0), (265, 0), (645, 680), (560, 680)], "#FFF0B8", ' opacity="0.07"')
    add('</g>')

    return defs, "\n".join(E)


def write_duo():
    defs, art = hero(2.0, 0.0, 0.0, "duo")
    svg = (HEADER
           + '<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1360" viewBox="0 0 1440 1360">\n'
           + defs + "\n"
           + '<rect width="1440" height="1360" fill="url(#duo-bgsky)"/>\n'
           + '<g id="Hero" filter="url(#duo-wobble)">\n' + art + '\n</g>\n'
           + '<rect width="1440" height="1360" fill="#000000" filter="url(#duo-grain)" opacity="0.05"/>\n'
           + '</svg>')
    with open(os.path.join(OUT, "hero-room-duo.svg"), "w", encoding="utf-8") as f:
        f.write(svg)


write_duo()
print("done")
