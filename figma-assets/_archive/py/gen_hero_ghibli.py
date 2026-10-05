# -*- coding: utf-8 -*-
"""Roomie: hero-room-ghibli.svg (1440x1360) —— 吉卜力风格放映室插画。
构图/结构与 gen_hero_hd.py 完全一致（720x680 逻辑坐标，k=2 放大输出），
仅重新调色（明亮午后阳光 + 蓝天白云 + 翠绿草地）并重绘角色（琪琪风小孩）。"""
import math, os, random

OUT = r"C:\Roomie\figma-assets"
os.makedirs(OUT, exist_ok=True)

AMBER, CORAL = "#E6B15A", "#D96A4D"
HAIR = "#3A3230"          # 深色短发
SKIN = "#F7D9BE"          # 肉色小脸
BROWN = "#4A3526"         # 手绘深棕描边
SKIRT, SKIRT_D = "#C84B38", "#A83E2E"   # 砖红背带裙 + 暗面
BLOUSE = "#FBF3E2"        # 奶油色上衣
BOW, BOW_D = "#D63A2F", "#B52E24"       # 大红蝴蝶结
SHADOW = "#7A6B8A"        # 暖紫灰阴影

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
    # 主轮廓：1px 手绘深棕描边
    INK = f' stroke="{BROWN}" stroke-opacity="0.32" stroke-width="{0.55*k:.2f}"'

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
        """吉卜力大白云：多层椭圆叠加 + 浅灰蓝阴影面。"""
        ell((cx + 2 * s, cy + 7 * s), 52 * s, 13 * s, "#C8E2F0", f' opacity="{0.85 * op}"')
        ell((cx, cy + 8 * s), 50 * s, 14 * s, "#FFFFFF", f' opacity="{op}"')
        for dx, dy, rx, ry in [(-30, 3, 22, 13), (-9, -9, 26, 17), (17, -5, 24, 15), (38, 4, 18, 10)]:
            ell((cx + dx * s, cy + dy * s), rx * s, ry * s, "#FFFFFF", f' opacity="{op}"')

    SC = [Rw(0.16, 0.14), Rw(0.84, 0.14), Rw(0.84, 0.66), Rw(0.16, 0.66)]
    rng = random.Random(42)
    defs = (
        "<defs>"
        # 页面背景：晴朗天空
        f'<linearGradient id="{pfx}-bgsky" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="#3E9BD8"/><stop offset="1" stop-color="#7FC4E8"/></linearGradient>'
        # 屏幕内：QQ 音乐黑胶页底色（粉→米白沉浸渐变）
        f'<linearGradient id="{pfx}-page" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="#F5C6C6"/><stop offset="1" stop-color="#F8E8DC"/></linearGradient>'
        # 屏幕外发光晕
        f'<radialGradient id="{pfx}-halo" cx="0.5" cy="0.5" r="0.62">'
        f'<stop offset="0" stop-color="#FFD9E2" stop-opacity="0.16"/>'
        f'<stop offset="0.6" stop-color="#FFD9E2" stop-opacity="0.07"/>'
        f'<stop offset="1" stop-color="#FFD9E2" stop-opacity="0"/></radialGradient>'
        # 投影墙：暖胡桃木
        f'<linearGradient id="{pfx}-pwall" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="#6B5138"/><stop offset="1" stop-color="#543F2C"/></linearGradient>'
        # 地板：翠绿草地
        f'<linearGradient id="{pfx}-grass" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="#4E9E5F"/><stop offset="1" stop-color="#3D8A50"/></linearGradient>'
        # 唱片墙：水彩感暖光渐晕
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
    # ---- QQ 音乐黑胶播放页（竖版居中，左右粉色边）----
    poly([Rw(0.16, 0.14), Rw(0.385, 0.14), Rw(0.385, 0.66), Rw(0.16, 0.66)], "#C9758A")
    poly([Rw(0.615, 0.14), Rw(0.84, 0.14), Rw(0.84, 0.66), Rw(0.615, 0.66)], "#C9758A")
    poly([Rw(0.385, 0.14), Rw(0.615, 0.14), Rw(0.615, 0.66), Rw(0.385, 0.66)], f"url(#{pfx}-page)")
    # 顶部迷你状态条
    pline(Rw(0.465, 0.165), Rw(0.535, 0.165), "#FFFFFF", 0.8,
          ' stroke-opacity="0.8" stroke-linecap="round"')
    # 粉色半透明黑胶转盘（同心圆环纹理）
    dcx, dcy = Rw(0.50, 0.36)
    add(f'<path d="{SD(disc_pts(dcx, dcy, 18.5, 1, n=28))}" fill="#EE88A2" fill-opacity="0.9" '
        f'stroke="#B84A64" stroke-opacity="0.55" stroke-width="{0.55*k:.2f}"/>')
    for rr, op in [(0.89, 0.4), (0.76, 0.34), (0.63, 0.4), (0.50, 0.32)]:
        add(f'<path d="{SD(disc_pts(dcx, dcy, 18.5 * rr, 1, n=24))}" fill="none" '
            f'stroke="#B84A64" stroke-opacity="{op}" stroke-width="{0.5*k:.2f}"/>')
    # 盘面高光弧
    qpath([(dcx - 13, dcy - 9), (dcx - 15, dcy), (dcx - 11.5, dcy + 10.5)], "#FFFFFF", 1.2,
          ' stroke-opacity="0.55" stroke-linecap="round"')
    # 中心专辑封面（暖色几何拼贴）+ 小圆孔
    cover = disc_pts(dcx, dcy, 6.8, 1, n=20)
    add(f'<path d="{SD(cover)}" fill="{AMBER}" '
        f'stroke="#B84A64" stroke-opacity="0.5" stroke-width="{0.45*k:.2f}"/>')
    poly([(dcx, dcy)] + cover[0:8], CORAL, ' opacity="0.85"')
    poly([(dcx, dcy)] + cover[10:15], "#F7F3EA", ' opacity="0.8"')
    circle((dcx - 2.1, dcy - 1.9), 1.7, "#FFF3D0")
    circle((dcx, dcy), 1.2, "#F8E8DC", f' stroke="#A04A5C" stroke-opacity="0.6" stroke-width="{0.4*k:.2f}"')
    # 唱臂：右上配重 + 细杆 + 唱头（压在唱片边缘）
    ap = Rw(0.592, 0.185); hd = Rw(0.562, 0.335)
    circle(ap, 2.8, "#8A4A5A", f' stroke="{BROWN}" stroke-opacity="0.4" stroke-width="{0.4*k:.2f}"')
    circle(ap, 1.2, "#E8A0AE")
    pline(ap, hd, "#7A4A56", 1.0, ' stroke-linecap="round"')
    poly([hd, (hd[0] - 1.8, hd[1] + 2.7), (hd[0] + 0.5, hd[1] + 3.7), (hd[0] + 2.3, hd[1] + 0.9)], "#8A4A5A")
    # 歌名横条 + 副信息（圆角粗线模拟文字）
    pline(Rw(0.44, 0.505), Rw(0.56, 0.505), "#8A3A4E", 2.6, ' stroke-linecap="round"')
    pline(Rw(0.46, 0.54), Rw(0.54, 0.54), "#C9758A", 1.6, ' stroke-linecap="round"')
    pline(Rw(0.475, 0.565), Rw(0.525, 0.565), "#D9A0AC", 1.3, ' stroke-linecap="round"')
    # 进度条 + 圆形播放键
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
    # 屏幕玻璃反光斜带
    poly([Rw(0.30, 0.14), Rw(0.44, 0.14), Rw(0.16, 0.50), Rw(0.16, 0.34)], "#FFFFFF", ' opacity="0.09"')
    poly([Rw(0.50, 0.14), Rw(0.55, 0.14), Rw(0.16, 0.60), Rw(0.16, 0.55)], "#FFFFFF", ' opacity="0.06"')
    add('</g>')
    # 屏幕外发光晕（内容比房间亮）
    poly([Rw(0.08, 0.06), Rw(0.92, 0.06), Rw(0.92, 0.74), Rw(0.08, 0.74)], f"url(#{pfx}-halo)")
    add('</g>')

    # ================= Floor =================
    add('<g id="Floor">')
    poly([Fl(0, 0), Fl(1, 0), Fl(1, 1), Fl(0, 1)], f"url(#{pfx}-grass)", INK)
    # 手绘草叶短线
    for _ in range(70):
        gx, gy = Fl(rng.uniform(0.03, 0.97), rng.uniform(0.03, 0.97))
        col = rng.choice(["#6FCB7A", "#2F7040", "#8FDB92"])
        pline((gx, gy), (gx + rng.uniform(-1.0, 2.2), gy - rng.uniform(2.0, 4.2)), col, 0.7,
              ' stroke-opacity="0.7" stroke-linecap="round"')
    # 小白花 / 小黄花
    for _ in range(9):
        fx, fy = Fl(rng.uniform(0.06, 0.94), rng.uniform(0.06, 0.94))
        petal = "#FFFFFF" if rng.random() < 0.55 else "#F7D54E"
        ctr = "#E6B15A" if petal == "#FFFFFF" else "#D96A4D"
        for pdx, pdy in [(-1.6, 0), (1.6, 0), (0, -1.1), (0, 1.1)]:
            circle((fx + pdx, fy + pdy), 0.95, petal)
        circle((fx, fy), 0.8, ctr)
    add('<g id="Rug">')
    rug = [Fl(0.28, 0.22), Fl(0.76, 0.22), Fl(0.76, 0.54), Fl(0.28, 0.54)]
    poly(rug, CORAL, ' opacity="0.9"')
    t = 0.238
    while t < 0.535:
        pline(Fl(0.292, t), Fl(0.748, t), "#F7F3EA", 0.55, ' stroke-opacity="0.4"')
        t += 0.026
    poly([Fl(0.305, 0.245), Fl(0.735, 0.245), Fl(0.735, 0.515), Fl(0.305, 0.515)], "none",
         f' stroke="#F7F3EA" stroke-opacity="0.55" stroke-width="{0.9*k:.2f}"')
    for cs, ct, ds, dt in [(0.28, 0.22, -1, -1), (0.76, 0.22, 1, -1),
                           (0.76, 0.54, 1, 1), (0.28, 0.54, -1, 1)]:
        c0 = Fl(cs, ct)
        for e in [Fl(cs + 0.02 * ds, ct), Fl(cs, ct + 0.02 * dt), Fl(cs + 0.016 * ds, ct + 0.016 * dt)]:
            pline(c0, e, "#B84A39", 0.8, ' stroke-opacity="0.85" stroke-linecap="round"')
    add('</g>')
    def shadow(points, op):
        add(f'<polygon points="{SP([(x - 12, y + 6) for x, y in points])}" fill="{SHADOW}" '
            f'opacity="{op}" filter="url(#{pfx}-soft)"/>')
    shadow([Fl(0.14, 0.46), Fl(0.66, 0.46), Fl(0.66, 0.88), Fl(0.14, 0.88)], 0.26)
    shadow([Fl(0.42, 0.22), Fl(0.80, 0.22), Fl(0.80, 0.44), Fl(0.42, 0.44)], 0.22)
    shadow([Fl(0.78, 0.06), Fl(0.94, 0.06), Fl(0.94, 0.22), Fl(0.78, 0.22)], 0.22)
    shadow([Fl(0.44, 0.36), Fl(0.56, 0.36), Fl(0.56, 0.48), Fl(0.44, 0.48)], 0.20)
    for rc, lab in [(Fl(0.78, 0.52), AMBER), (Fl(0.90, 0.40), CORAL)]:
        ell(rc, 30, 15, "#2F4A5A", INK)
        ell(rc, 25, 12.5, "none", f' stroke="#16242E" stroke-opacity="0.30" stroke-width="{0.6*k:.2f}"')
        ell(rc, 20, 10, "none", f' stroke="#16242E" stroke-opacity="0.45" stroke-width="{0.6*k:.2f}"')
        ell(rc, 13.5, 6.7, "none", f' stroke="#16242E" stroke-opacity="0.30" stroke-width="{0.5*k:.2f}"')
        ell(rc, 8.5, 4.2, lab, f' stroke="{BROWN}" stroke-opacity="0.18" stroke-width="{0.4*k:.2f}"')
        circle((rc[0] - 3.2, rc[1] - 1.6), 0.8, "#FFFFFF", ' opacity="0.7"')
        circle(rc, 1.2, "#3A3230")
    add('</g>')

    # ================= Projector =================
    add('<g id="Projector">')
    pfb = Fl(0.5, 0.42)
    lens = (pfb[0], pfb[1] - 132.0)
    add(f'<polygon points="{SP([lens, Rw(0.17,0.15), Rw(0.83,0.15), Rw(0.83,0.65), Rw(0.17,0.65)])}" '
        f'fill="#C9E8EA" opacity="0.32"/>')
    add(f'<polygon points="{SP([lens, Rw(0.30,0.24), Rw(0.70,0.24), Rw(0.70,0.56), Rw(0.30,0.56)])}" '
        f'fill="#E8F6F4" opacity="0.22"/>')
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

    # ================= Sofa =================
    add('<g id="Sofa">')
    cuboid(*Fl(0.183, 0.60), 12, 30, 50, "#FFFDF5", "#F5ECDA", "#ECE0C6")
    seat = cuboid(*Fl(0.45, 0.60), 50, 30, 34, "#FFFDF5", "#F5ECDA", "#ECE0C6")
    cuboid(*Fl(0.46, 0.40), 26, 20, 22, "#FFFDF5", "#F5ECDA", "#ECE0C6")
    for f in (1.0 / 3.0, 2.0 / 3.0):
        p1 = lerp(seat["Ct"], seat["Bt"], f)
        p2 = lerp(seat["Dt"], seat["At"], f)
        pline(p1, p2, "#D8C9A8", 0.9, ' stroke-opacity="0.95"')
        pline(p2, (p2[0], p2[1] + 34), "#D8C9A8", 0.8, ' stroke-opacity="0.7"')
    cuboid(308, 428, 9, 7, 9, "#F2C984", AMBER, "#C08F45")
    cuboid(*Fl(0.74, 0.28), 34, 20, 34, "#D8A759", "#C08F45", "#A87B39")
    for dd in (-6, 0, 6):
        pline((Fl(0.74, 0.28)[0] + dd - 8, Fl(0.74, 0.28)[1] - 34 - 2),
              (Fl(0.74, 0.28)[0] + dd + 8, Fl(0.74, 0.28)[1] - 34 + 2), "#B0803D", 0.6,
              ' stroke-opacity="0.5"')
    bc = (458.0, 416.0)
    e1 = (SQ * 14, HQ * 14); e2 = (-SQ * 9, HQ * 9)
    bk = [(bc[0]-e1[0]-e2[0], bc[1]-e1[1]-e2[1]), (bc[0]+e1[0]-e2[0], bc[1]+e1[1]-e2[1]),
          (bc[0]+e1[0]+e2[0], bc[1]+e1[1]+e2[1]), (bc[0]-e1[0]+e2[0], bc[1]-e1[1]+e2[1])]
    poly(bk, "#A9C6D8", INK)
    pline(bk[0], bk[3], "#7FA3B5", 1.0)
    poly([(479, 410), (489, 410), (489, 418), (479, 418)], "#FDFAF3", INK)
    ell((484, 410), 5, 2.6, "#D9CFC0", f' stroke="{BROWN}" stroke-opacity="0.3" stroke-width="{0.5*k:.2f}"')
    ell((484, 418), 5, 2.6, "#F1EADB")
    qpath([(489, 411.5), (494.5, 413), (489, 416)], BROWN, 0.9, ' stroke-opacity="0.45"')
    qpath([(482.5, 406), (481.5, 402), (483, 398)], "#FFFFFF", 0.7, ' stroke-opacity="0.5" stroke-linecap="round"')
    add('</g>')

    # ================= Character（琪琪风小孩，侧面坐姿面向屏幕）=================
    add('<g id="Character">')
    CINK = f' stroke="{BROWN}" stroke-opacity="0.8" stroke-width="{0.6*k:.2f}" stroke-linejoin="round"'
    # 身下投影
    ell((319, 423), 21, 6.5, SHADOW, f' opacity="0.24" filter="url(#{pfx}-soft)"')
    poly([(300, 420), (336, 414), (343, 421), (307, 427)], "#E8DCC4", ' opacity="0.7"')
    # 砖红背带裙：坐姿摊开的圆润裙体（臀腿体块，覆在座垫上）
    fpath([(304, 398), (309, 391), (320, 390), (331, 392), (337, 401), (339, 410),
           (333, 416), (318, 420), (305, 416), (301, 407)], SKIRT, CINK)
    # 裙摆暗面（右下浅浅一块，立体感）+ 褶皱
    fpath([(318, 420), (333, 416), (339, 410), (337, 401), (331, 407), (322, 414)],
          SKIRT_D, ' opacity="0.5"')
    qpath([(310, 398), (309, 406), (310, 413)], SKIRT_D, 0.7, ' stroke-opacity="0.6" stroke-linecap="round"')
    # 小腿 + 小鞋（裙摆前缘露出，前伸弯曲）
    pline((333, 413), (340, 415), SKIN, 2.2, ' stroke-linecap="round"')
    ell((342, 415.5), 3.4, 2.2, HAIR, CINK)
    # 奶油色上衣（短圆躯干）
    fpath([(311, 393), (309, 378), (312, 370), (320, 367), (327, 370), (329, 378),
           (328, 393), (320, 396)], BLOUSE, CINK)
    # 背带
    pline((314, 371), (312, 391), SKIRT, 1.3)
    pline((325, 371), (326, 390), SKIRT, 1.3)
    circle((313, 381), 1.1, SKIRT_D)
    circle((325.5, 381), 1.1, SKIRT_D)
    # 袖口 + 小手（自然放在膝上）
    ell((329, 384), 3.0, 3.4, BLOUSE, CINK)
    circle((331.5, 389), 2.4, SKIN, CINK)
    # 后发（深色短发，头后体块）
    fpath([(308, 363), (303, 348), (311, 340), (323, 338), (330, 346), (330, 358),
           (325, 365), (315, 366)], HAIR, CINK)
    # 小脸（无五官，极简一点鼻子）
    circle((319, 356), 10, SKIN, CINK)
    circle((312.5, 357.5), 1.3, SKIN, f' stroke="{BROWN}" stroke-opacity="0.6" stroke-width="{0.4*k:.2f}"')
    # 前发刘海
    fpath([(310, 355), (311, 346), (319, 343), (328, 346), (329, 353), (324, 349),
           (319, 348), (313, 350)], HAIR, CINK)
    # 鼻子 + 腮红
    circle((328.5, 359), 0.9, "#E8B596")
    ell((324.5, 362), 2.2, 1.2, "#F2A58C", ' opacity="0.5"')
    # 大红色蝴蝶结（两片圆润蝶翼 + 结）
    fpath([(315, 341), (306, 329), (296, 333), (300, 343), (314, 343.5)], BOW, CINK)
    fpath([(316, 341), (326, 328), (336, 332), (331, 343), (316, 343.5)], BOW, CINK)
    circle((315.5, 342), 2.6, BOW_D, CINK)
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

    # ================= 午后阳光（左上入射暖光带）=================
    add('<g id="Sunlight">')
    poly([(60, 0), (195, 0), (520, 680), (330, 680)], "#FFF0B8", ' opacity="0.10"')
    poly([(215, 0), (265, 0), (645, 680), (560, 680)], "#FFF0B8", ' opacity="0.07"')
    add('</g>')

    return defs, "\n".join(E)


def write_ghibli():
    defs, art = hero(2.0, 0.0, 0.0, "gb")
    svg = (HEADER
           + '<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1360" viewBox="0 0 1440 1360">\n'
           + defs + "\n"
           + '<rect width="1440" height="1360" fill="url(#gb-bgsky)"/>\n'
           + '<g id="Hero" filter="url(#gb-wobble)">\n' + art + '\n</g>\n'
           + '<rect width="1440" height="1360" fill="#000000" filter="url(#gb-grain)" opacity="0.05"/>\n'
           + '</svg>')
    with open(os.path.join(OUT, "hero-room-ghibli.svg"), "w", encoding="utf-8") as f:
        f.write(svg)


write_ghibli()
print("done")
