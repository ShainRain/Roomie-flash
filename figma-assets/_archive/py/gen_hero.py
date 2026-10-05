# -*- coding: utf-8 -*-
"""Roomie: hero-room.svg (720x680) + page-01-home-v2.svg (390x844).
无 transform / use / symbol，全部绝对坐标；等轴测 2:1 软等距直接写入路径。"""
import math, os

OUT = r"C:\Roomie\figma-assets"
os.makedirs(OUT, exist_ok=True)

BG, CREAM = "#F5F1E8", "#EADFCB"
DARK, TEAL, AMBER, CORAL, SOFA = "#2F4A5A", "#6D99A6", "#E6B15A", "#D96A4D", "#F7F3EA"
GREEN, GRAYV = "#4A6752", "#A89F8E"

SQ = math.sqrt(0.8)   # 0.8944  等轴测水平单位 x
HQ = math.sqrt(0.2)   # 0.4472  等轴测水平单位 y (26.57°)

# ---- 房间基准（720x680 画布，后角 C=(360,330)，墙高 220，轴 (±240,120)）
def Lw(u, v):  # 左墙（唱片墙）u: 左角->后角, v: 顶->底
    return (120.0 + 240.0 * u, 230.0 - 120.0 * u + 220.0 * v)
def Rw(u, v):  # 右墙（投影墙）u: 后角->右角, v: 顶->底
    return (360.0 + 240.0 * u, 110.0 + 120.0 * u + 220.0 * v)
def Fl(s, t):  # 地面 s: ->右, t: ->左
    return (360.0 + 240.0 * (s - t), 330.0 + 120.0 * (s + t))

def disc_pts(cx, cy, r, sgn, n=26, squash=1.0):
    """墙面正圆 -> 等轴测斜圆采样点。sgn=+1 右墙, -1 左墙。"""
    out = []
    for i in range(n):
        th = 2 * math.pi * i / n
        out.append((cx + SQ * r * math.cos(th),
                    cy + sgn * HQ * r * math.cos(th) - squash * r * math.sin(th)))
    return out

HEADER = '<?xml version="1.0" encoding="UTF-8"?>\n'


def hero(k, tx, ty, pfx, extra_defs=""):
    """生成 Hero 插画（defs, 7 个顶层分组）。映射: X = x*k+tx, Y = y*k+ty。"""
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
        add(f'<line x1="{P(*p1).split(",")[0]}" y1="{p1[1]*k+ty:.1f}" '
            f'x2="{p2[0]*k+tx:.1f}" y2="{p2[1]*k+ty:.1f}" '
            f'stroke="{stroke}" stroke-width="{w*k:.2f}"{extra}/>')
    def circle(c, r, fill, extra=""):
        add(f'<circle cx="{c[0]*k+tx:.1f}" cy="{c[1]*k+ty:.1f}" r="{r*k:.1f}" fill="{fill}"{extra}/>')
    def ell(c, rx, ry, fill, extra=""):
        add(f'<ellipse cx="{c[0]*k+tx:.1f}" cy="{c[1]*k+ty:.1f}" rx="{rx*k:.1f}" ry="{ry*k:.1f}" fill="{fill}"{extra}/>')
    INK = f' stroke="{DARK}" stroke-opacity="0.22" stroke-width="{1.0*k:.2f}"'

    def cuboid(cx, cy, ax, ay, h, ctop, cleft, cright):
        """(cx,cy)=底面中心, ax/ay=沿 eR/eL 半宽, h=高"""
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

    def disc(cx, cy, r, sgn, body):
        add(f'<path d="{SD(disc_pts(cx, cy, r, sgn))}" fill="{body}" '
            f'stroke="{DARK}" stroke-opacity="0.3" stroke-width="{1.0*k:.2f}"/>')
        add(f'<path d="{SD(disc_pts(cx, cy, r * 0.66, sgn, n=22))}" fill="none" '
            f'stroke="#1C2F3A" stroke-opacity="0.4" stroke-width="{0.9*k:.2f}"/>')
        add(f'<path d="{SD(disc_pts(cx, cy, r * 0.30, sgn, n=16))}" fill="{SOFA}"/>')
        circle((cx, cy), 1.2, DARK)

    SC = [Rw(0.16, 0.14), Rw(0.84, 0.14), Rw(0.84, 0.66), Rw(0.16, 0.66)]
    defs = (
        "<defs>"
        f'<linearGradient id="{pfx}-sky" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="#93B2BC"/><stop offset="1" stop-color="#DCE6DF"/></linearGradient>'
        f'<linearGradient id="{pfx}-lake" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="#7CA3B0"/><stop offset="1" stop-color="#5D8290"/></linearGradient>'
        f'<radialGradient id="{pfx}-glow">'
        f'<stop offset="0" stop-color="#F2C979" stop-opacity="0.55"/>'
        f'<stop offset="1" stop-color="#F2C979" stop-opacity="0"/></radialGradient>'
        f'<clipPath id="{pfx}-screenClip"><polygon points="{SP(SC)}"/></clipPath>'
        + extra_defs + "</defs>"
    )

    # ================= Record Wall =================
    add('<g id="Record Wall">')
    poly([Lw(0, 0), Lw(1, 0), Lw(1, 1), Lw(0, 1)], "#EFE4CE", INK)
    # Cubby 背板 + 6x6 网格
    poly([Lw(0.06, 0.06), Lw(0.94, 0.06), Lw(0.94, 0.94), Lw(0.06, 0.94)], "#E3D6BB",
         f' stroke="#C4B494" stroke-width="{2.0*k:.2f}"')
    du = 0.88 / 6.0
    for i in range(1, 6):
        u = 0.06 + i * du
        pline(Lw(u, 0.06), Lw(u, 0.94), "#CFC0A2", 1.2, ' stroke-opacity="0.9"')
        pline(Lw(0.06, u), Lw(0.94, u), "#CFC0A2", 1.2, ' stroke-opacity="0.9"')
    grid = [
        ["B", "G", "W", "B", "W", "P"],
        ["W", "B", "A", "G", "B", "W"],
        ["G", "W", "B", "W", "C", "B"],
        ["B", "G", "W", "A", "W", "G"],
        ["W", "B", "G", "B", "W", "A"],
        ["K", "W", "B", "G", "W", "S"],
    ]
    cmap = {"B": DARK, "G": GREEN, "W": GRAYV, "A": AMBER, "C": CORAL}
    for r in range(6):
        for c in range(6):
            code = grid[r][c]
            if code in cmap:
                cx, cy = Lw(0.06 + (c + 0.5) * du, 0.06 + (r + 0.5) * du)
                disc(cx, cy, 12.5, -1, cmap[code])
    # 左下角 3 本书
    vb = 0.925
    for u0, hh, col in [(0.094, 22, TEAL), (0.1125, 26, AMBER), (0.131, 19, CORAL)]:
        b0 = Lw(u0, vb); b1 = Lw(u0 + 0.0145, vb)
        poly([b0, b1, (b1[0], b1[1] - hh), (b0[0], b0[1] - hh)], col,
             f' stroke="{DARK}" stroke-opacity="0.3" stroke-width="{0.8*k:.2f}"')
    # 右上角垂叶植物
    pa = Lw(0.846, 0.096); pb = Lw(0.887, 0.096)
    poly([(pa[0], pa[1] - 3), (pb[0], pb[1] - 3), (pb[0] - 1, pb[1] + 11), (pa[0] + 1, pa[1] + 11)], "#C97B4A",
         f' stroke="{DARK}" stroke-opacity="0.3" stroke-width="{0.8*k:.2f}"')
    mx = (pa[0] + pb[0]) / 2; my = (pa[1] + pb[1]) / 2 + 8
    for dx0, cx1, cy1, ex1, ey1 in [(-5, -14, 12, -11, 28), (-2, -7, 18, -5, 38),
                                     (1, 0, 20, 3, 42), (4, 10, 14, 9, 32), (6, 14, 10, 13, 24)]:
        add(f'<path d="M{P(mx+dx0, my)} Q{P(mx+cx1, my+cy1)} {P(mx+ex1, my+ey1)}" '
            f'fill="none" stroke="#5F7D5C" stroke-width="{2.0*k:.2f}" stroke-linecap="round"/>')
    for lx, ly in [(mx-11, my+28), (mx+3, my+42), (mx+13, my+24)]:
        circle((lx, ly), 2.2, "#5F7D5C")
    # 右下角白色几何小雕塑
    sa = Lw(0.845, 0.905); sb = Lw(0.889, 0.905)
    poly([sa, sb, (sb[0], sb[1] - 8), (sa[0], sa[1] - 8)], "#EDE7DA", INK)
    scx = (sa[0] + sb[0]) / 2; scy = (sa[1] + sb[1]) / 2 - 14.0
    add(f'<path d="{SD(disc_pts(scx, scy, 7.5, -1, n=20))}" fill="#FBF8F1" '
        f'stroke="{DARK}" stroke-opacity="0.3" stroke-width="{1.0*k:.2f}"/>')
    add('</g>')

    # ================= Projection Wall =================
    add('<g id="Projection Wall">')
    poly([Rw(0, 0), Rw(1, 0), Rw(1, 1), Rw(0, 1)], "#E6DABF", INK)
    pline(Rw(0, 0), Rw(0, 1), "#B7A982", 2.0, ' stroke-opacity="0.6"')
    poly([Rw(0.10, 0.08), Rw(0.90, 0.08), Rw(0.90, 0.72), Rw(0.10, 0.72)], "#BFE0E2", ' opacity="0.12"')
    poly([Rw(0.11, 0.09), Rw(0.89, 0.09), Rw(0.89, 0.71), Rw(0.11, 0.71)], DARK, INK)
    add(f'<g clip-path="url(#{pfx}-screenClip)">')
    poly(SC, f"url(#{pfx}-sky)")
    circle(Rw(0.24, 0.22), 1.3, SOFA, ' opacity="0.8"')
    circle(Rw(0.45, 0.19), 1.0, SOFA, ' opacity="0.7"')
    add(f'<path d="{SD(disc_pts(*Rw(0.745, 0.27), 8.5, 1, n=22))}" fill="{SOFA}"/>')
    poly([Rw(0.16, 0.52), Rw(0.31, 0.33), Rw(0.47, 0.52)], "#567183")
    poly([Rw(0.40, 0.52), Rw(0.56, 0.27), Rw(0.74, 0.52)], "#496373")
    poly([Rw(0.585, 0.52), Rw(0.615, 0.52), Rw(0.615, 0.17), Rw(0.585, 0.17)], DARK)
    poly([Rw(0.582, 0.17), Rw(0.618, 0.17), Rw(0.60, 0.125)], DARK)
    poly([Rw(0.596, 0.29), Rw(0.604, 0.29), Rw(0.604, 0.33), Rw(0.596, 0.33)], AMBER)
    poly([Rw(0.16, 0.52), Rw(0.84, 0.52), Rw(0.84, 0.66), Rw(0.16, 0.66)], f"url(#{pfx}-lake)")
    pline(Rw(0.16, 0.52), Rw(0.84, 0.52), SOFA, 1.0, ' stroke-opacity="0.35"')
    poly([Rw(0.585, 0.52), Rw(0.615, 0.52), Rw(0.615, 0.615), Rw(0.585, 0.615)], DARK, ' opacity="0.20"')
    add(f'<path d="{SD(disc_pts(*Rw(0.745, 0.585), 6.5, 1, n=18, squash=0.45))}" '
        f'fill="#EAF3F0" opacity="0.35"/>')
    add('</g>')
    add('</g>')

    # ================= Floor =================
    add('<g id="Floor">')
    poly([Fl(0, 0), Fl(1, 0), Fl(1, 1), Fl(0, 1)], "#5F7887", INK)
    for t in (0.25, 0.5, 0.75):
        pline(Fl(0.002, t), Fl(0.998, t), "#4E6675", 1.0, ' stroke-opacity="0.5"')
    add('<g id="Rug">')
    poly([Fl(0.28, 0.22), Fl(0.76, 0.22), Fl(0.76, 0.54), Fl(0.28, 0.54)], CORAL, ' opacity="0.85"')
    poly([Fl(0.305, 0.245), Fl(0.735, 0.245), Fl(0.735, 0.515), Fl(0.305, 0.515)], "none",
         f' stroke="{SOFA}" stroke-opacity="0.5" stroke-width="{1.5*k:.2f}"')
    add('</g>')
    def shadow(points, op):
        add(f'<polygon points="{SP([(x - 12, y + 6) for x, y in points])}" fill="#46607A" opacity="{op}"/>')
    shadow([Fl(0.14, 0.46), Fl(0.66, 0.46), Fl(0.66, 0.88), Fl(0.14, 0.88)], 0.25)
    shadow([Fl(0.42, 0.22), Fl(0.80, 0.22), Fl(0.80, 0.44), Fl(0.42, 0.44)], 0.20)
    shadow([Fl(0.78, 0.06), Fl(0.94, 0.06), Fl(0.94, 0.22), Fl(0.78, 0.22)], 0.20)
    shadow([Fl(0.44, 0.36), Fl(0.56, 0.36), Fl(0.56, 0.48), Fl(0.44, 0.48)], 0.18)
    for rc in (Fl(0.78, 0.52), Fl(0.90, 0.40)):
        ell(rc, 30, 15, DARK, INK)
        ell(rc, 20, 10, "none", f' stroke="#1C2F3A" stroke-opacity="0.45" stroke-width="{1.0*k:.2f}"')
        ell(rc, 8.5, 4.2, SOFA)
        circle(rc, 1.2, DARK)
    add('</g>')

    # ================= Projector =================
    # 物理一致性：落地于屏幕中心垂直连线（s=0.5 直线），镜头高度 == 屏幕中心高度 132，
    # 光轴 lens -> 屏幕中心 (480,258) 斜率恰为 -0.5（3D 水平、垂直打在屏幕上）。
    add('<g id="Projector">')
    pfb = Fl(0.5, 0.42)                    # 三脚架落地点 (379.2, 440.4)
    lens = (pfb[0], pfb[1] - 132.0)        # 镜头中心 (379.2, 308.4)
    add(f'<polygon points="{SP([lens, Rw(0.17,0.15), Rw(0.83,0.15), Rw(0.83,0.65), Rw(0.17,0.65)])}" '
        f'fill="#A9D6DA" opacity="0.34"/>')
    add(f'<polygon points="{SP([lens, Rw(0.30,0.24), Rw(0.70,0.24), Rw(0.70,0.56), Rw(0.30,0.56)])}" '
        f'fill="#D8EFEF" opacity="0.26"/>')
    # 极细线条三脚架
    hub = (pfb[0], pfb[1] - 118.0)
    pline(hub, (pfb[0] - 24, pfb[1] + 15), DARK, 1.5, ' stroke-linecap="round"')
    pline(hub, (pfb[0] + 2, pfb[1] + 26), DARK, 1.5, ' stroke-linecap="round"')
    pline(hub, (pfb[0] + 26, pfb[1] + 12), DARK, 1.5, ' stroke-linecap="round"')
    # 立方体机身（顶面高度 == 镜头高度）
    cuboid(pfb[0], hub[1], 10, 10, 14, "#3A5A6C", DARK, "#263D4B")
    # 小圆柱（立方体上，竖直）
    vcx = pfb[0] - 3.0
    poly([(vcx - 4.4, 297), (vcx + 4.4, 297), (vcx + 4.4, 307), (vcx - 4.4, 307)], "#263D4B", INK)
    ell((vcx, 297), 4.4, 2.2, "#3A5A6C", INK)
    # 大圆柱镜筒（横置，轴向 = 光轴方向 (SQ,-HQ)）
    dlen = 26.0
    pb = (lens[0] - dlen * SQ, lens[1] + dlen * HQ)   # 镜筒尾端中心
    r_b = 7.0
    t1 = (-0.594 * r_b, -1.044 * r_b); t2 = (0.596 * r_b, 1.044 * r_b)
    add(f'<path d="{SD(disc_pts(pb[0], pb[1], r_b, 1, n=20))}" fill="#263D4B" '
        f'stroke="{DARK}" stroke-opacity="0.22" stroke-width="{1.0*k:.2f}"/>')
    poly([(pb[0] + t1[0], pb[1] + t1[1]), (lens[0] + t1[0], lens[1] + t1[1]),
          (lens[0] + t2[0], lens[1] + t2[1]), (pb[0] + t2[0], pb[1] + t2[1])], "#3A5A6C", INK)
    # 镜头端盖 + 镜片
    add(f'<path d="{SD(disc_pts(lens[0], lens[1], r_b, 1, n=20))}" fill="#BFE3E6" '
        f'stroke="{DARK}" stroke-width="{1.2*k:.2f}"/>')
    add(f'<path d="{SD(disc_pts(lens[0], lens[1], 3.4, 1, n=16))}" fill="{DARK}"/>')
    circle((lens[0] - 1.6, lens[1] - 1.8), 0.9, SOFA)
    add('</g>')

    # ================= Sofa =================
    add('<g id="Sofa">')
    cuboid(*Fl(0.183, 0.60), 12, 30, 50, SOFA, "#EDE7D8", "#DFD6C2")   # 左扶手
    cuboid(*Fl(0.45, 0.60), 50, 30, 34, SOFA, "#EDE7D8", "#DFD6C2")    # 主座
    cuboid(*Fl(0.46, 0.40), 26, 20, 22, SOFA, "#EDE7D8", "#DFD6C2")    # 脚踏
    cuboid(*Fl(0.74, 0.28), 34, 20, 34, "#D8A759", "#C08F45", "#A87B39")  # 木质茶几
    # 浅蓝书
    bc = (458.0, 416.0)
    e1 = (SQ * 14, HQ * 14); e2 = (-SQ * 9, HQ * 9)
    bk = [(bc[0]-e1[0]-e2[0], bc[1]-e1[1]-e2[1]), (bc[0]+e1[0]-e2[0], bc[1]+e1[1]-e2[1]),
          (bc[0]+e1[0]+e2[0], bc[1]+e1[1]+e2[1]), (bc[0]-e1[0]+e2[0], bc[1]-e1[1]+e2[1])]
    poly(bk, "#A9C6D8", INK)
    pline(bk[0], bk[3], "#7FA3B5", 1.5)
    # 白色马克杯
    poly([(479, 410), (489, 410), (489, 418), (479, 418)], "#FBF8F1", INK)
    ell((484, 410), 5, 2.6, "#D9CFC0", f' stroke="{DARK}" stroke-opacity="0.3" stroke-width="{0.8*k:.2f}"')
    ell((484, 418), 5, 2.6, "#EFEAE0")
    add(f'<path d="M{P(489,411.5)} Q{P(494.5,413)} {P(489,416)}" fill="none" '
        f'stroke="{DARK}" stroke-opacity="0.45" stroke-width="{1.2*k:.2f}"/>')
    add('</g>')

    # ================= Character =================
    add('<g id="Character">')
    poly([(300, 420), (336, 414), (343, 421), (307, 427)], "#DCD2BE", ' opacity="0.7"')
    # 斗篷身体（侧面坐姿剪影，面向屏幕）
    add(f'<path d="M{P(298,420)} L{P(296,397)} Q{P(298,376)} {P(312,367)} '
        f'Q{P(318,362)} {P(326,363)} Q{P(336,366)} {P(337,380)} L{P(340,420)} Z" '
        f'fill="{DARK}" stroke="{DARK}" stroke-opacity="0.3" stroke-width="{1.0*k:.2f}"/>')
    # 兜帽（与斗篷同色的连帽剪影）
    add(f'<path d="M{P(310,368)} Q{P(305,350)} {P(319,346)} Q{P(332,343)} {P(335,356)} '
        f'Q{P(337,365)} {P(330,370)} L{P(314,371)} Z" '
        f'fill="{DARK}" stroke="{DARK}" stroke-opacity="0.3" stroke-width="{1.0*k:.2f}"/>')
    # 条纹围巾：颈带 3 段（珊瑚/奶油/珊瑚）
    def band_pt(t, top):
        return (310 + 20 * t + (1 if not top else 0), (371 - 4 * t) if top else (378 - 4 * t))
    for t0, t1, col in [(0.0, 0.36, CORAL), (0.36, 0.68, SOFA), (0.68, 1.0, CORAL)]:
        poly([band_pt(t0, True), band_pt(t1, True), band_pt(t1, False), band_pt(t0, False)], col,
             f' stroke="{DARK}" stroke-opacity="0.25" stroke-width="{0.8*k:.2f}"')
    # 围巾尾巴 2 段（珊瑚 + 奶油尾尖）
    def tail_pt(t, left):
        a, b = ((311, 376), (299, 388)) if left else ((314, 379), (303, 392))
        return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
    for t0, t1, col in [(0.0, 0.55, CORAL), (0.55, 1.0, SOFA)]:
        poly([tail_pt(t0, True), tail_pt(t1, True), tail_pt(t1, False), tail_pt(t0, False)], col,
             f' stroke="{DARK}" stroke-opacity="0.25" stroke-width="{0.8*k:.2f}"')
    add('</g>')

    # ================= Lamp =================
    add('<g id="Lamp">')
    circle((532.8, 375), 88, f"url(#{pfx}-glow)", ' opacity="0.5"')
    circle((532.8, 375), 50, f"url(#{pfx}-glow)", ' opacity="0.9"')
    cuboid(*Fl(0.86, 0.14), 22, 22, 44, "#7FA6B2", TEAL, "#5B8794")  # 立方体边几
    ell((532.8, 404), 7, 3.5, DARK)
    pline((532.8, 404), (532.8, 378), DARK, 2.5)
    poly([(516.8, 364), (548.8, 364), (548.8, 386), (516.8, 386)], AMBER, INK)
    ell((532.8, 364), 16, 7, "#F2C984")
    ell((532.8, 386), 16, 7, "#D9A94E")
    add('</g>')

    return defs, "\n".join(E)


def write_file1():
    defs, art = hero(1.0, 0.0, 0.0, "hero")
    svg = (HEADER
           + '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="680" viewBox="0 0 720 680">\n'
           + defs + "\n"
           + f'<rect width="720" height="680" fill="{BG}"/>\n'
           + '<g id="Hero">\n' + art + '\n</g>\n</svg>')
    with open(os.path.join(OUT, "hero-room.svg"), "w", encoding="utf-8") as f:
        f.write(svg)


# ============================================================ PAGE 01 v2
def write_file2():
    k, tx, ty = 0.64, -35.4, 86.4
    extra = ('<filter id="pg1-cardShadow" x="-20%" y="-20%" width="140%" height="160%">'
             '<feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#2F4A5A" flood-opacity="0.1"/></filter>'
             '<clipPath id="pg1-heroClip"><rect x="16" y="126" width="358" height="372" rx="32"/></clipPath>')
    defs, art = hero(k, tx, ty, "pg1", extra)
    s = [HEADER,
         '<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">',
         defs,
         f'<rect width="390" height="844" fill="{BG}"/>',
         # ---------- 状态栏 ----------
         '<g id="Status Bar">',
         f'<text x="28" y="34" font-family="Inter" font-size="13" font-weight="600" fill="{DARK}">9:41</text>',
         f'<g fill="{DARK}" opacity="0.85">'
         '<rect x="300" y="24" width="3" height="7" rx="1"/><rect x="305" y="22" width="3" height="9" rx="1"/>'
         '<rect x="310" y="20" width="3" height="11" rx="1"/><rect x="315" y="18" width="3" height="13" rx="1"/></g>',
         f'<rect x="328" y="19" width="24" height="12" rx="3.5" fill="none" stroke="{DARK}" stroke-width="1"/>'
         f'<rect x="330" y="21" width="15" height="8" rx="2" fill="{DARK}"/>'
         f'<rect x="353.5" y="22.5" width="2.5" height="5" rx="1.2" fill="{DARK}"/>',
         '</g>',
         # ---------- Header ----------
         '<g id="Header">',
         f'<text x="24" y="88" font-family="Inter" font-size="28" font-weight="600" fill="{DARK}">Roomie</text>',
         '<text x="24" y="110" font-family="Inter" font-size="12" fill="#7C93A0">'
         'Meet your people through music &amp; films</text>',
         '</g>',
         # ---------- Hero 卡片 ----------
         '<g id="Hero">',
         f'<rect x="16" y="126" width="358" height="372" rx="32" fill="{SOFA}" filter="url(#pg1-cardShadow)"/>',
         '<g id="Hero Artwork" clip-path="url(#pg1-heroClip)">',
         art,
         '</g>',
         '</g>',
         ]
    # ---------- Feature Cards ----------
    s.append('<g id="Feature Cards">')
    def card(x, y, cid, icon, title, caption):
        return (f'<g id="{cid}">'
                f'<rect x="{x}" y="{y}" width="173" height="86" rx="20" fill="{SOFA}" stroke="#E9E0CD" stroke-width="1"/>'
                + icon(x + 40, y + 43)
                + f'<text x="{x+72}" y="{y+40}" font-family="MiSans" font-size="14" font-weight="600" fill="{DARK}">{title}</text>'
                + f'<text x="{x+72}" y="{y+60}" font-family="MiSans" font-size="10.5" fill="#8AA0AB">{caption}</text>'
                + '</g>')
    def icon_music(cx, cy):
        return (f'<g fill="{TEAL}">'
                f'<ellipse cx="{cx-7}" cy="{cy+9}" rx="5" ry="4"/><ellipse cx="{cx+5}" cy="{cy+9}" rx="5" ry="4"/>'
                f'<rect x="{cx-2.5}" y="{cy-13}" width="2.5" height="22"/>'
                f'<rect x="{cx+9.5}" y="{cy-13}" width="2.5" height="22"/>'
                f'<polygon points="{cx-2.5},{cy-13} {cx+12},{cy-13} {cx+12},{cy-7} {cx-2.5},{cy-7}"/></g>')
    def icon_film(cx, cy):
        return (f'<rect x="{cx-15}" y="{cy-11}" width="30" height="22" rx="5" fill="none" '
                f'stroke="{CORAL}" stroke-width="2.5"/>'
                f'<polygon points="{cx-4},{cy-5} {cx-4},{cy+5} {cx+6},{cy}" fill="{CORAL}"/>')
    def icon_books(cx, cy):
        return (f'<rect x="{cx-13}" y="{cy-11}" width="7" height="24" rx="1.5" fill="{AMBER}"/>'
                f'<rect x="{cx-4}" y="{cy-13}" width="7" height="26" rx="1.5" fill="{DARK}"/>'
                f'<polygon points="{cx+5},{cy+13} {cx+12},{cy+13} {cx+9},{cy-11} {cx+2},{cy-11}" fill="{TEAL}"/>')
    def icon_cup(cx, cy):
        return (f'<path d="M{cx-11},{cy-4} L{cx-11},{cy+8} Q{cx-11},{cy+13} {cx-6},{cy+13} '
                f'L{cx+6},{cy+13} Q{cx+11},{cy+13} {cx+11},{cy+8} L{cx+11},{cy-4} Z" '
                f'fill="none" stroke="{DARK}" stroke-width="2.5" stroke-linejoin="round"/>'
                f'<path d="M{cx+11},{cy} Q{cx+18},{cy+2} {cx+11},{cy+6}" fill="none" stroke="{DARK}" stroke-width="2.5"/>'
                f'<path d="M{cx-4},{cy-8} q2,-3 0,-6 M{cx+4},{cy-8} q2,-3 0,-6" fill="none" '
                f'stroke="{DARK}" stroke-width="2" stroke-linecap="round"/>')
    s.append(card(16, 528, "Card Discover", icon_music, "发现房间", "遇见同频的人"))
    s.append(card(201, 528, "Card Cinema", icon_film, "一起放映", "同步看电影"))
    s.append(card(16, 626, "Card Shelf", icon_books, "兴趣书架", "收藏共同爱好"))
    s.append(card(201, 626, "Card Companion", icon_cup, "今日陪伴", "有人在等你"))
    s.append('</g>')
    # ---------- Bottom Nav ----------
    s += [
        '<g id="Bottom Nav">',
        '<rect x="0" y="764" width="390" height="80" fill="#FBF8F1"/>',
        '<line x1="0" y1="764" x2="390" y2="764" stroke="#E7DFCE" stroke-width="1"/>',
        # Home（选中）
        f'<polygon points="28,790 39,780 50,790" fill="{DARK}"/>'
        f'<rect x="32.5" y="789" width="13" height="12" fill="{DARK}"/>'
        f'<rect x="36.5" y="794" width="5" height="7" fill="#FBF8F1"/>',
        # Vinyl
        '<circle cx="117" cy="788" r="9.5" fill="none" stroke="#9AABB4" stroke-width="2"/>'
        '<circle cx="117" cy="788" r="2.6" fill="#9AABB4"/>',
        # Chat
        '<polygon points="268,794 268,801 274,794" fill="#9AABB4"/>'
        '<rect x="264" y="781" width="18" height="14" rx="4" fill="none" stroke="#9AABB4" stroke-width="2"/>',
        # User
        '<circle cx="351" cy="783" r="5" fill="none" stroke="#9AABB4" stroke-width="2"/>'
        '<path d="M342.5,800 Q342.5,790.5 351,790.5 Q359.5,790.5 359.5,800" fill="none" '
        'stroke="#9AABB4" stroke-width="2" stroke-linecap="round"/>',
        # ＋创建（上浮大按钮）
        f'<circle cx="195" cy="770" r="29" fill="{DARK}"/>'
        '<line x1="195" y1="761" x2="195" y2="779" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>'
        '<line x1="186" y1="770" x2="204" y2="770" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>',
        # 标签
        f'<text x="39" y="816" text-anchor="middle" font-family="MiSans" font-size="10" font-weight="600" fill="{DARK}">首页</text>'
        '<text x="117" y="816" text-anchor="middle" font-family="MiSans" font-size="10" fill="#9AABB4">房间</text>'
        '<text x="195" y="816" text-anchor="middle" font-family="MiSans" font-size="10" fill="#9AABB4">创建</text>'
        '<text x="273" y="816" text-anchor="middle" font-family="MiSans" font-size="10" fill="#9AABB4">消息</text>'
        '<text x="351" y="816" text-anchor="middle" font-family="MiSans" font-size="10" fill="#9AABB4">我的</text>',
        # Home 指示条
        f'<rect x="128" y="828" width="134" height="5" rx="2.5" fill="{DARK}" opacity="0.2"/>',
        '</g>',
        '</svg>',
    ]
    with open(os.path.join(OUT, "page-01-home-v2.svg"), "w", encoding="utf-8") as f:
        f.write("\n".join(s))


write_file1()
write_file2()
print("done")
