# -*- coding: utf-8 -*-
"""Roomie: hero-room-hd.svg (1440x1360) —— 高精细度放映室插画。
构图与 gen_hero.py 的 hero-room.svg (720x680) 相同，k=2 放大输出。
本文件不导入 Figma，允许 feTurbulence / feGaussianBlur / feDisplacementMap 等浏览器滤镜。"""
import math, os, random

OUT = r"C:\Roomie\figma-assets"
os.makedirs(OUT, exist_ok=True)

BG, CREAM = "#F5F1E8", "#EADFCB"
DARK, TEAL, AMBER, CORAL, SOFA = "#2F4A5A", "#6D99A6", "#E6B15A", "#D96A4D", "#F7F3EA"
GREEN, GRAYV = "#4A6752", "#A89F8E"

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
    # 主轮廓：1px 深蓝描边（k=2 时 1.1px，接近最终渲染 1px）
    INK = f' stroke="{DARK}" stroke-opacity="0.3" stroke-width="{0.55*k:.2f}"'

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

    LABELS = {"B": SOFA, "G": SOFA, "W": AMBER, "A": DARK, "C": SOFA}

    def disc(cx, cy, r, sgn, body, label=SOFA):
        """黑胶：盘体 + 3 圈同心纹 + 标签 + 标签高光点 + 轴孔。"""
        add(f'<path d="{SD(disc_pts(cx, cy, r, sgn))}" fill="{body}" '
            f'stroke="{DARK}" stroke-opacity="0.3" stroke-width="{0.55*k:.2f}"/>')
        for rr, op, w in [(0.84, 0.28, 0.7), (0.66, 0.4, 0.8), (0.48, 0.3, 0.7)]:
            add(f'<path d="{SD(disc_pts(cx, cy, r * rr, sgn, n=22))}" fill="none" '
                f'stroke="#1C2F3A" stroke-opacity="{op}" stroke-width="{w*k:.2f}"/>')
        add(f'<path d="{SD(disc_pts(cx, cy, r * 0.30, sgn, n=16))}" fill="{label}" '
            f'stroke="{DARK}" stroke-opacity="0.18" stroke-width="{0.4*k:.2f}"/>')
        circle((cx - r * 0.14, cy - r * 0.13), r * 0.075, "#FFFFFF", ' opacity="0.75"')
        circle((cx, cy), 1.2, DARK)

    SC = [Rw(0.16, 0.14), Rw(0.84, 0.14), Rw(0.84, 0.66), Rw(0.16, 0.66)]
    rng = random.Random(42)
    defs = (
        "<defs>"
        f'<linearGradient id="{pfx}-sky" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="#93B2BC"/><stop offset="1" stop-color="#DCE6DF"/></linearGradient>'
        f'<linearGradient id="{pfx}-lake" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="#7CA3B0"/><stop offset="1" stop-color="#5D8290"/></linearGradient>'
        # 投影墙：深蓝、自上而下微妙明暗
        f'<linearGradient id="{pfx}-pwall" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="#55707F"/><stop offset="1" stop-color="#3C5364"/></linearGradient>'
        # 唱片墙：水彩感径向渐晕
        f'<radialGradient id="{pfx}-vign" cx="0.5" cy="0.42" r="0.78">'
        f'<stop offset="0" stop-color="#EFE4CE" stop-opacity="0"/>'
        f'<stop offset="0.72" stop-color="#DCC9A0" stop-opacity="0.16"/>'
        f'<stop offset="1" stop-color="#B89B6B" stop-opacity="0.4"/></radialGradient>'
        f'<radialGradient id="{pfx}-glow">'
        f'<stop offset="0" stop-color="#F2C979" stop-opacity="0.55"/>'
        f'<stop offset="1" stop-color="#F2C979" stop-opacity="0"/></radialGradient>'
        f'<clipPath id="{pfx}-screenClip"><polygon points="{SP(SC)}"/></clipPath>'
        f'<filter id="{pfx}-soft" x="-20%" y="-20%" width="140%" height="140%">'
        f'<feGaussianBlur stdDeviation="0.5"/></filter>'
        f'<filter id="{pfx}-soft2" x="-30%" y="-30%" width="160%" height="160%">'
        f'<feGaussianBlur stdDeviation="1.6"/></filter>'
        # 手绘感墨线抖动
        f'<filter id="{pfx}-wobble" x="-3%" y="-3%" width="106%" height="106%">'
        f'<feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" seed="7" result="w"/>'
        f'<feDisplacementMap in="SourceGraphic" in2="w" scale="1.6" '
        f'xChannelSelector="R" yChannelSelector="G"/></filter>'
        # 纸张颗粒
        f'<filter id="{pfx}-grain" x="0%" y="0%" width="100%" height="100%">'
        f'<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n"/>'
        f'<feColorMatrix in="n" type="matrix" values="0 0 0 0 0.18  0 0 0 0 0.15  0 0 0 0 0.12  0 0 0 0.9 0" result="c"/>'
        f'<feComposite in="c" in2="SourceGraphic" operator="in"/></filter>'
        "</defs>"
    )

    # ================= Record Wall =================
    add('<g id="Record Wall">')
    wall_l = [Lw(0, 0), Lw(1, 0), Lw(1, 1), Lw(0, 1)]
    poly(wall_l, "#EFE4CE", INK)
    poly(wall_l, f"url(#{pfx}-vign)")
    # Cubby 背板 + 6x6 网格
    poly([Lw(0.06, 0.06), Lw(0.94, 0.06), Lw(0.94, 0.94), Lw(0.06, 0.94)], "#E3D6BB",
         f' stroke="#C4B494" stroke-width="{1.0*k:.2f}"')
    # 格子木框细微木纹线（沿框边空白带）
    for _ in range(6):
        u0 = rng.uniform(0.09, 0.82); ln = rng.uniform(0.04, 0.1)
        v0 = rng.uniform(0.066, 0.094)
        pline(Lw(u0, v0), Lw(min(u0 + ln, 0.93), v0), "#B7A67F", 0.55, ' stroke-opacity="0.5"')
    for _ in range(6):
        u0 = rng.uniform(0.09, 0.82); ln = rng.uniform(0.04, 0.1)
        v0 = rng.uniform(0.906, 0.934)
        pline(Lw(u0, v0), Lw(min(u0 + ln, 0.93), v0), "#B7A67F", 0.55, ' stroke-opacity="0.45"')
    du = 0.88 / 6.0
    for i in range(1, 6):
        u = 0.06 + i * du
        pline(Lw(u, 0.06), Lw(u, 0.94), "#CFC0A2", 0.9, ' stroke-opacity="0.9"')
        pline(Lw(0.06, u), Lw(0.94, u), "#CFC0A2", 0.9, ' stroke-opacity="0.9"')
    grid = [
        ["B", "G", "W", "B", "W", "P"],
        ["W", "B", "A", "G", "B", "W"],
        ["G", "W", "B", "W", "C", "B"],
        ["B", "G", "W", "A", "W", "G"],
        ["W", "B", "G", "B", "W", "A"],
        ["K", "W", "B", "G", "W", "S"],
    ]
    cmap = {"B": DARK, "G": GREEN, "W": GRAYV, "A": AMBER, "C": CORAL}
    lab_cycle = [SOFA, AMBER, CORAL]
    for r in range(6):
        for c in range(6):
            code = grid[r][c]
            if code in cmap:
                cx, cy = Lw(0.06 + (c + 0.5) * du, 0.06 + (r + 0.5) * du)
                lab = LABELS.get(code) if code in ("A", "C") else lab_cycle[(r + c) % 3]
                disc(cx, cy, 12.5, -1, cmap[code], lab)
    # 左下角 3 本书
    vb = 0.925
    for u0, hh, col in [(0.094, 22, TEAL), (0.1125, 26, AMBER), (0.131, 19, CORAL)]:
        b0 = Lw(u0, vb); b1 = Lw(u0 + 0.0145, vb)
        poly([b0, b1, (b1[0], b1[1] - hh), (b0[0], b0[1] - hh)], col,
             f' stroke="{DARK}" stroke-opacity="0.3" stroke-width="{0.5*k:.2f}"')
        pline((b0[0] + 1.5, b0[1] - hh + 3), (b1[0] - 1.5, b1[1] - hh + 3), "#F5F1E8", 0.6,
              ' stroke-opacity="0.55"')
    # 右上角垂叶植物
    pa = Lw(0.846, 0.096); pb = Lw(0.887, 0.096)
    poly([(pa[0], pa[1] - 3), (pb[0], pb[1] - 3), (pb[0] - 1, pb[1] + 11), (pa[0] + 1, pa[1] + 11)], "#C97B4A",
         f' stroke="{DARK}" stroke-opacity="0.3" stroke-width="{0.5*k:.2f}"')
    mx = (pa[0] + pb[0]) / 2; my = (pa[1] + pb[1]) / 2 + 8
    for dx0, cx1, cy1, ex1, ey1 in [(-5, -14, 12, -11, 28), (-2, -7, 18, -5, 38),
                                     (1, 0, 20, 3, 42), (4, 10, 14, 9, 32), (6, 14, 10, 13, 24)]:
        qpath([(mx + dx0, my), (mx + cx1, my + cy1), (mx + ex1, my + ey1)],
              "#5F7D5C", 1.4, ' stroke-linecap="round"')
    for lx, ly in [(mx-11, my+28), (mx-5, my+38), (mx+3, my+42), (mx+9, my+32), (mx+13, my+24)]:
        ell((lx, ly), 2.4, 1.5, "#5F7D5C")
    # 右下角白色几何小雕塑
    sa = Lw(0.845, 0.905); sb = Lw(0.889, 0.905)
    poly([sa, sb, (sb[0], sb[1] - 8), (sa[0], sa[1] - 8)], "#EDE7DA", INK)
    scx = (sa[0] + sb[0]) / 2; scy = (sa[1] + sb[1]) / 2 - 14.0
    add(f'<path d="{SD(disc_pts(scx, scy, 7.5, -1, n=20))}" fill="#FBF8F1" '
        f'stroke="{DARK}" stroke-opacity="0.3" stroke-width="{0.55*k:.2f}"/>')
    add('</g>')

    # ================= Projection Wall =================
    add('<g id="Projection Wall">')
    poly([Rw(0, 0), Rw(1, 0), Rw(1, 1), Rw(0, 1)], f"url(#{pfx}-pwall)", INK)
    pline(Rw(0, 0), Rw(0, 1), "#26404F", 1.4, ' stroke-opacity="0.6"')
    poly([Rw(0.10, 0.08), Rw(0.90, 0.08), Rw(0.90, 0.72), Rw(0.10, 0.72)], "#BFE0E2", ' opacity="0.14"')
    poly([Rw(0.11, 0.09), Rw(0.89, 0.09), Rw(0.89, 0.71), Rw(0.11, 0.71)], DARK, INK)
    add(f'<g clip-path="url(#{pfx}-screenClip)">')
    poly(SC, f"url(#{pfx}-sky)")
    circle(Rw(0.24, 0.22), 1.3, SOFA, ' opacity="0.8"')
    circle(Rw(0.45, 0.19), 1.0, SOFA, ' opacity="0.7"')
    circle(Rw(0.66, 0.24), 0.8, SOFA, ' opacity="0.6"')
    add(f'<path d="{SD(disc_pts(*Rw(0.745, 0.27), 8.5, 1, n=22))}" fill="{SOFA}"/>')
    # 远山两层（更浅更远）
    poly([Rw(0.16, 0.52), Rw(0.27, 0.40), Rw(0.38, 0.52)], "#7E9AA8", ' opacity="0.65"')
    poly([Rw(0.50, 0.52), Rw(0.66, 0.36), Rw(0.80, 0.52)], "#8AA5B1", ' opacity="0.5"')
    # 薄雾层 1（远山脚下）
    poly([Rw(0.16, 0.435), Rw(0.84, 0.435), Rw(0.84, 0.47), Rw(0.16, 0.47)], SOFA,
         f' opacity="0.20" filter="url(#{pfx}-soft2)"')
    # 近山
    poly([Rw(0.16, 0.52), Rw(0.31, 0.33), Rw(0.47, 0.52)], "#567183")
    poly([Rw(0.40, 0.52), Rw(0.56, 0.27), Rw(0.74, 0.52)], "#496373")
    # 薄雾层 2（山腰）
    poly([Rw(0.16, 0.485), Rw(0.84, 0.485), Rw(0.84, 0.515), Rw(0.16, 0.515)], SOFA,
         f' opacity="0.22" filter="url(#{pfx}-soft2)"')
    # 塔楼：主体 + 尖顶 + 小窗 + 旗杆旗帜
    poly([Rw(0.585, 0.52), Rw(0.615, 0.52), Rw(0.615, 0.17), Rw(0.585, 0.17)], DARK)
    poly([Rw(0.582, 0.17), Rw(0.618, 0.17), Rw(0.60, 0.125)], DARK)
    poly([Rw(0.596, 0.29), Rw(0.604, 0.29), Rw(0.604, 0.33), Rw(0.596, 0.33)], AMBER)
    poly([Rw(0.597, 0.385), Rw(0.603, 0.385), Rw(0.603, 0.415), Rw(0.597, 0.415)], SOFA, ' opacity="0.85"')
    poly([Rw(0.597, 0.45), Rw(0.603, 0.45), Rw(0.603, 0.478), Rw(0.597, 0.478)], SOFA, ' opacity="0.6"')
    pline(Rw(0.60, 0.125), Rw(0.60, 0.082), DARK, 0.7)
    poly([Rw(0.60, 0.082), Rw(0.633, 0.093), Rw(0.60, 0.104)], CORAL)
    # 湖面
    poly([Rw(0.16, 0.52), Rw(0.84, 0.52), Rw(0.84, 0.66), Rw(0.16, 0.66)], f"url(#{pfx}-lake)")
    pline(Rw(0.16, 0.52), Rw(0.84, 0.52), SOFA, 0.8, ' stroke-opacity="0.35"')
    poly([Rw(0.585, 0.52), Rw(0.615, 0.52), Rw(0.615, 0.615), Rw(0.585, 0.615)], DARK, ' opacity="0.20"')
    # 湖面倒影波纹 3 条
    pline(Rw(0.30, 0.555), Rw(0.44, 0.555), SOFA, 0.8, ' stroke-opacity="0.4"')
    pline(Rw(0.52, 0.59), Rw(0.71, 0.59), SOFA, 0.8, ' stroke-opacity="0.32"')
    pline(Rw(0.24, 0.625), Rw(0.40, 0.625), SOFA, 0.8, ' stroke-opacity="0.28"')
    add(f'<path d="{SD(disc_pts(*Rw(0.745, 0.585), 6.5, 1, n=18, squash=0.45))}" '
        f'fill="#EAF3F0" opacity="0.35"/>')
    # 薄雾层 3（湖面低空）
    poly([Rw(0.16, 0.545), Rw(0.84, 0.545), Rw(0.84, 0.575), Rw(0.16, 0.575)], SOFA,
         f' opacity="0.15" filter="url(#{pfx}-soft2)"')
    # 屏幕玻璃反光斜带
    poly([Rw(0.30, 0.14), Rw(0.44, 0.14), Rw(0.16, 0.50), Rw(0.16, 0.34)], "#FFFFFF", ' opacity="0.09"')
    poly([Rw(0.50, 0.14), Rw(0.55, 0.14), Rw(0.16, 0.60), Rw(0.16, 0.55)], "#FFFFFF", ' opacity="0.06"')
    add('</g>')
    add('</g>')

    # ================= Floor =================
    add('<g id="Floor">')
    poly([Fl(0, 0), Fl(1, 0), Fl(1, 1), Fl(0, 1)], "#5F7887", INK)
    # 宽木板拼缝：沿等轴测方向主线 + 交错横缝
    for t in (0.2, 0.4, 0.6, 0.8):
        pline(Fl(0.002, t), Fl(0.998, t), "#49626F", 0.9, ' stroke-opacity="0.6"')
    for tlo, thi, ss in [(0.0, 0.2, [0.30, 0.66]), (0.2, 0.4, [0.14, 0.48, 0.82]),
                         (0.4, 0.6, [0.32, 0.68]), (0.6, 0.8, [0.12, 0.46, 0.80]),
                         (0.8, 1.0, [0.30, 0.64])]:
        for s in ss:
            pline(Fl(s, tlo + 0.006), Fl(s, thi - 0.006), "#49626F", 0.8, ' stroke-opacity="0.45"')
    # 稀疏水磨石碎点
    for _ in range(38):
        fx, fy = Fl(rng.uniform(0.03, 0.97), rng.uniform(0.03, 0.97))
        col = "#FFFFFF" if rng.random() < 0.5 else "#46607A"
        op = rng.uniform(0.08, 0.14) if col == "#FFFFFF" else rng.uniform(0.12, 0.18)
        circle((fx, fy), rng.uniform(0.5, 1.1), col, f' opacity="{op:.2f}"')
    add('<g id="Rug">')
    rug = [Fl(0.28, 0.22), Fl(0.76, 0.22), Fl(0.76, 0.54), Fl(0.28, 0.54)]
    poly(rug, CORAL, ' opacity="0.85"')
    # 织物横条纹理
    t = 0.238
    while t < 0.535:
        pline(Fl(0.292, t), Fl(0.748, t), "#B44A33", 0.7, ' stroke-opacity="0.38"')
        t += 0.022
    poly([Fl(0.305, 0.245), Fl(0.735, 0.245), Fl(0.735, 0.515), Fl(0.305, 0.515)], "none",
         f' stroke="{SOFA}" stroke-opacity="0.5" stroke-width="{0.9*k:.2f}"')
    # 四角小穗
    for cs, ct, ds, dt in [(0.28, 0.22, -1, -1), (0.76, 0.22, 1, -1),
                           (0.76, 0.54, 1, 1), (0.28, 0.54, -1, 1)]:
        c0 = Fl(cs, ct)
        for e in [Fl(cs + 0.02 * ds, ct), Fl(cs, ct + 0.02 * dt), Fl(cs + 0.016 * ds, ct + 0.016 * dt)]:
            pline(c0, e, "#B44A33", 0.8, ' stroke-opacity="0.85" stroke-linecap="round"')
    add('</g>')
    def shadow(points, op):
        add(f'<polygon points="{SP([(x - 12, y + 6) for x, y in points])}" fill="#46607A" '
            f'opacity="{op}" filter="url(#{pfx}-soft)"/>')
    shadow([Fl(0.14, 0.46), Fl(0.66, 0.46), Fl(0.66, 0.88), Fl(0.14, 0.88)], 0.25)
    shadow([Fl(0.42, 0.22), Fl(0.80, 0.22), Fl(0.80, 0.44), Fl(0.42, 0.44)], 0.20)
    shadow([Fl(0.78, 0.06), Fl(0.94, 0.06), Fl(0.94, 0.22), Fl(0.78, 0.22)], 0.20)
    shadow([Fl(0.44, 0.36), Fl(0.56, 0.36), Fl(0.56, 0.48), Fl(0.44, 0.48)], 0.18)
    # 地上两张黑胶：同心纹 + 标签 + 高光
    for rc, lab in [(Fl(0.78, 0.52), AMBER), (Fl(0.90, 0.40), CORAL)]:
        ell(rc, 30, 15, DARK, INK)
        ell(rc, 25, 12.5, "none", f' stroke="#1C2F3A" stroke-opacity="0.30" stroke-width="{0.6*k:.2f}"')
        ell(rc, 20, 10, "none", f' stroke="#1C2F3A" stroke-opacity="0.45" stroke-width="{0.6*k:.2f}"')
        ell(rc, 13.5, 6.7, "none", f' stroke="#1C2F3A" stroke-opacity="0.30" stroke-width="{0.5*k:.2f}"')
        ell(rc, 8.5, 4.2, lab, f' stroke="{DARK}" stroke-opacity="0.18" stroke-width="{0.4*k:.2f}"')
        circle((rc[0] - 3.2, rc[1] - 1.6), 0.8, "#FFFFFF", ' opacity="0.7"')
        circle(rc, 1.2, DARK)
    add('</g>')

    # ================= Projector =================
    add('<g id="Projector">')
    pfb = Fl(0.5, 0.42)
    lens = (pfb[0], pfb[1] - 132.0)
    add(f'<polygon points="{SP([lens, Rw(0.17,0.15), Rw(0.83,0.15), Rw(0.83,0.65), Rw(0.17,0.65)])}" '
        f'fill="#A9D6DA" opacity="0.34"/>')
    add(f'<polygon points="{SP([lens, Rw(0.30,0.24), Rw(0.70,0.24), Rw(0.70,0.56), Rw(0.30,0.56)])}" '
        f'fill="#D8EFEF" opacity="0.26"/>')
    # 光束内细微尘埃光点
    for _ in range(22):
        u = rng.uniform(0.2, 0.8); v = rng.uniform(0.18, 0.62)
        tt = rng.uniform(0.22, 0.92)
        px, py = lerp(lens, Rw(u, v), tt)
        col = "#FFFFFF" if rng.random() < 0.7 else "#F2C979"
        circle((px, py), rng.uniform(0.45, 1.1), col, f' opacity="{rng.uniform(0.3, 0.55):.2f}"')
    # 三脚架
    hub = (pfb[0], pfb[1] - 118.0)
    feet = [(pfb[0] - 24, pfb[1] + 15), (pfb[0] + 2, pfb[1] + 26), (pfb[0] + 26, pfb[1] + 12)]
    for ft in feet:
        pline(hub, ft, DARK, 1.1, ' stroke-linecap="round"')
        circle(ft, 1.6, DARK)
    # 机身
    body = cuboid(pfb[0], hub[1], 10, 10, 14, "#3A5A6C", DARK, "#263D4B")
    # 三脚架关节点
    circle(hub, 2.3, "#3A5A6C", f' stroke="{DARK}" stroke-width="{0.5*k:.2f}"')
    # 散热孔点阵（机身左侧面）
    for i in range(3):
        for j in range(3):
            pt = lerp(lerp(body["Dt"], body["At"], 0.22 + 0.28 * i),
                      lerp(body["D"], body["A"], 0.22 + 0.28 * i), 0.28 + 0.22 * j)
            circle(pt, 0.8, "#5B8794", ' opacity="0.8"')
    # 小圆柱
    vcx = pfb[0] - 3.0
    poly([(vcx - 4.4, 297), (vcx + 4.4, 297), (vcx + 4.4, 307), (vcx - 4.4, 307)], "#263D4B", INK)
    ell((vcx, 297), 4.4, 2.2, "#3A5A6C", INK)
    # 大圆柱镜筒
    dlen = 26.0
    pb = (lens[0] - dlen * SQ, lens[1] + dlen * HQ)
    r_b = 7.0
    t1 = (-0.594 * r_b, -1.044 * r_b); t2 = (0.596 * r_b, 1.044 * r_b)
    add(f'<path d="{SD(disc_pts(pb[0], pb[1], r_b, 1, n=20))}" fill="#263D4B" '
        f'stroke="{DARK}" stroke-opacity="0.22" stroke-width="{0.55*k:.2f}"/>')
    poly([(pb[0] + t1[0], pb[1] + t1[1]), (lens[0] + t1[0], lens[1] + t1[1]),
          (lens[0] + t2[0], lens[1] + t2[1]), (pb[0] + t2[0], pb[1] + t2[1])], "#3A5A6C", INK)
    # 镜头端盖 + 镜片 + 玻璃反光
    add(f'<path d="{SD(disc_pts(lens[0], lens[1], r_b, 1, n=20))}" fill="#BFE3E6" '
        f'stroke="{DARK}" stroke-width="{0.7*k:.2f}"/>')
    add(f'<path d="{SD(disc_pts(lens[0], lens[1], 3.4, 1, n=16))}" fill="{DARK}"/>')
    pline((lens[0] - 4.6, lens[1] + 0.6), (lens[0] - 2.0, lens[1] - 3.0), "#FFFFFF", 1.0,
          ' stroke-opacity="0.85" stroke-linecap="round"')
    circle((lens[0] - 1.6, lens[1] - 1.8), 0.9, SOFA)
    add('</g>')

    # ================= Sofa =================
    add('<g id="Sofa">')
    cuboid(*Fl(0.183, 0.60), 12, 30, 50, "#FCF9F2", "#EDE7D8", "#DFD6C2")   # 左扶手（顶面微亮）
    seat = cuboid(*Fl(0.45, 0.60), 50, 30, 34, "#FCF9F2", "#EDE7D8", "#DFD6C2")  # 主座
    cuboid(*Fl(0.46, 0.40), 26, 20, 22, "#FCF9F2", "#EDE7D8", "#DFD6C2")    # 脚踏
    # 坐垫接缝线（顶面 + 前面延伸）
    for f in (1.0 / 3.0, 2.0 / 3.0):
        p1 = lerp(seat["Ct"], seat["Bt"], f)
        p2 = lerp(seat["Dt"], seat["At"], f)
        pline(p1, p2, "#CFC4AE", 0.9, ' stroke-opacity="0.95"')
        pline(p2, (p2[0], p2[1] + 34), "#CFC4AE", 0.8, ' stroke-opacity="0.7"')
    # 琥珀色小靠枕（座位前左角，避开角色与脚踏）
    cuboid(308, 428, 9, 7, 9, "#F2C984", AMBER, "#C08F45")
    cuboid(*Fl(0.74, 0.28), 34, 20, 34, "#D8A759", "#C08F45", "#A87B39")  # 木质茶几
    # 茶几顶面木纹
    for dd in (-6, 0, 6):
        pline((Fl(0.74, 0.28)[0] + dd - 8, Fl(0.74, 0.28)[1] - 34 - 2),
              (Fl(0.74, 0.28)[0] + dd + 8, Fl(0.74, 0.28)[1] - 34 + 2), "#B0803D", 0.6,
              ' stroke-opacity="0.5"')
    # 浅蓝书
    bc = (458.0, 416.0)
    e1 = (SQ * 14, HQ * 14); e2 = (-SQ * 9, HQ * 9)
    bk = [(bc[0]-e1[0]-e2[0], bc[1]-e1[1]-e2[1]), (bc[0]+e1[0]-e2[0], bc[1]+e1[1]-e2[1]),
          (bc[0]+e1[0]+e2[0], bc[1]+e1[1]+e2[1]), (bc[0]-e1[0]+e2[0], bc[1]-e1[1]+e2[1])]
    poly(bk, "#A9C6D8", INK)
    pline(bk[0], bk[3], "#7FA3B5", 1.0)
    # 白色马克杯
    poly([(479, 410), (489, 410), (489, 418), (479, 418)], "#FBF8F1", INK)
    ell((484, 410), 5, 2.6, "#D9CFC0", f' stroke="{DARK}" stroke-opacity="0.3" stroke-width="{0.5*k:.2f}"')
    ell((484, 418), 5, 2.6, "#EFEAE0")
    qpath([(489, 411.5), (494.5, 413), (489, 416)], DARK, 0.9, ' stroke-opacity="0.45"')
    # 杯口热气
    qpath([(482.5, 406), (481.5, 402), (483, 398)], "#FFFFFF", 0.7, ' stroke-opacity="0.5" stroke-linecap="round"')
    add('</g>')

    # ================= Character =================
    add('<g id="Character">')
    # 身下投影
    ell((319, 423), 21, 6.5, "#46607A", f' opacity="0.2" filter="url(#{pfx}-soft)"')
    poly([(300, 420), (336, 414), (343, 421), (307, 427)], "#DCD2BE", ' opacity="0.7"')
    # 斗篷身体
    add(f'<path d="M{P(298,420)} L{P(296,397)} Q{P(298,376)} {P(312,367)} '
        f'Q{P(318,362)} {P(326,363)} Q{P(336,366)} {P(337,380)} L{P(340,420)} Z" '
        f'fill="{DARK}" stroke="{DARK}" stroke-opacity="0.3" stroke-width="{0.55*k:.2f}"/>')
    # 斗篷下摆褶皱线
    qpath([(304, 419), (305, 406), (303, 397)], "#4E6675", 0.8, ' stroke-opacity="0.75" stroke-linecap="round"')
    qpath([(314, 420), (315, 407), (313, 397)], "#4E6675", 0.8, ' stroke-opacity="0.75" stroke-linecap="round"')
    qpath([(326, 420), (327, 408), (329, 398)], "#4E6675", 0.8, ' stroke-opacity="0.75" stroke-linecap="round"')
    # 兜帽
    add(f'<path d="M{P(310,368)} Q{P(305,350)} {P(319,346)} Q{P(332,343)} {P(335,356)} '
        f'Q{P(337,365)} {P(330,370)} L{P(314,371)} Z" '
        f'fill="{DARK}" stroke="{DARK}" stroke-opacity="0.3" stroke-width="{0.55*k:.2f}"/>')
    qpath([(313, 353), (319, 349.5), (327, 352)], "#4E6675", 0.6, ' stroke-opacity="0.55" stroke-linecap="round"')
    # 条纹围巾：颈带 5 段更细
    def band_pt(t, top):
        return (310 + 20 * t + (1 if not top else 0), (371 - 4 * t) if top else (378 - 4 * t))
    for t0, t1, col in [(0.0, 0.2, CORAL), (0.2, 0.4, SOFA), (0.4, 0.62, CORAL),
                        (0.62, 0.82, SOFA), (0.82, 1.0, CORAL)]:
        poly([band_pt(t0, True), band_pt(t1, True), band_pt(t1, False), band_pt(t0, False)], col,
             f' stroke="{DARK}" stroke-opacity="0.2" stroke-width="{0.45*k:.2f}"')
    # 围巾尾巴 3 段
    def tail_pt(t, left):
        a, b = ((311, 376), (299, 388)) if left else ((314, 379), (303, 392))
        return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
    for t0, t1, col in [(0.0, 0.34, CORAL), (0.34, 0.67, SOFA), (0.67, 1.0, CORAL)]:
        poly([tail_pt(t0, True), tail_pt(t1, True), tail_pt(t1, False), tail_pt(t0, False)], col,
             f' stroke="{DARK}" stroke-opacity="0.2" stroke-width="{0.45*k:.2f}"')
    add('</g>')

    # ================= Lamp =================
    add('<g id="Lamp">')
    circle((532.8, 375), 128, f"url(#{pfx}-glow)", ' opacity="0.32"')
    circle((532.8, 375), 72, f"url(#{pfx}-glow)", ' opacity="0.6"')
    circle((532.8, 375), 42, f"url(#{pfx}-glow)", ' opacity="0.9"')
    cuboid(*Fl(0.86, 0.14), 22, 22, 44, "#7FA6B2", TEAL, "#5B8794")
    ell((532.8, 404), 7, 3.5, DARK)
    pline((532.8, 404), (532.8, 378), DARK, 1.8)
    poly([(516.8, 364), (548.8, 364), (548.8, 386), (516.8, 386)], AMBER, INK)
    # 灯罩顶面椭圆 + 内高光
    ell((532.8, 364), 16, 7, "#F2C984")
    ell((532.8, 364), 11.5, 4.6, "#F7DCA6")
    ell((532.8, 386), 16, 7, "#D9A94E")
    add('</g>')

    return defs, "\n".join(E)


def write_hd():
    defs, art = hero(2.0, 0.0, 0.0, "hd")
    svg = (HEADER
           + '<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1360" viewBox="0 0 1440 1360">\n'
           + defs + "\n"
           + f'<rect width="1440" height="1360" fill="{BG}"/>\n'
           + '<g id="Hero" filter="url(#hd-wobble)">\n' + art + '\n</g>\n'
           + '<rect width="1440" height="1360" fill="#000000" filter="url(#hd-grain)" opacity="0.05"/>\n'
           + '</svg>')
    with open(os.path.join(OUT, "hero-room-hd.svg"), "w", encoding="utf-8") as f:
        f.write(svg)


write_hd()
print("done")
