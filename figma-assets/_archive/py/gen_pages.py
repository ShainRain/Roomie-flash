# -*- coding: utf-8 -*-
"""Roomie - Figma SVG 素材生成器：page-01-home / page-02-live (390x844)"""
import os, random

OUT = r"C:\Roomie\figma-assets"
os.makedirs(OUT, exist_ok=True)

def P(p):
    return f"{p[0]:.1f},{p[1]:.1f}"

def lerp(A, B, t):
    return (A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t)

def pts(points):
    return " ".join(P(p) for p in points)

def cloud(x, y, s, fill, op):
    return (f'<g fill="{fill}" opacity="{op}">'
            f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{30*s:.1f}" ry="{14*s:.1f}"/>'
            f'<ellipse cx="{x+27*s:.1f}" cy="{y-10*s:.1f}" rx="{24*s:.1f}" ry="{16*s:.1f}"/>'
            f'<ellipse cx="{x+55*s:.1f}" cy="{y:.1f}" rx="{27*s:.1f}" ry="{13*s:.1f}"/>'
            f'</g>')

def diamond(cx, cy, a):
    b = a / 2.0
    return {"L": (cx - a, cy), "T": (cx, cy - b), "R": (cx + a, cy), "B": (cx, cy + b), "b": b}

def rock_island(cx, cy, a, shadow_id, shadow_op="0.9", dark=False):
    """岩石底座 + 岛下径向阴影。返回 (svg, tip_y)"""
    d = diamond(cx, cy, a)
    L, B, R = d["L"], d["B"], d["R"]
    depth = a * 0.85
    tip = (cx, cy + d["b"] + depth)
    c_left = "#C8BBA4" if not dark else "#9A8F7C"
    c_right = "#A89A80" if not dark else "#7E7462"
    c_mid = "#B4A892" if not dark else "#8B8170"
    s = []
    s.append(f'<ellipse cx="{cx:.1f}" cy="{tip[1]+26:.1f}" rx="{a*1.08:.1f}" ry="{a*0.17:.1f}" '
             f'fill="url(#{shadow_id})" opacity="{shadow_op}"/>')
    s.append(f'<polygon points="{pts([L, B, tip])}" fill="{c_left}"/>')
    s.append(f'<polygon points="{pts([B, R, tip])}" fill="{c_right}"/>')
    # 中间刻面，增强岩石体块感
    mid = lerp(B, tip, 0.45)
    s.append(f'<polygon points="{pts([B, (lerp(L, B, 0.35)[0], lerp(L, B, 0.35)[1]), mid])}" fill="{c_mid}" opacity="0.55"/>')
    s.append(f'<line x1="{B[0]:.1f}" y1="{B[1]:.1f}" x2="{tip[0]:.1f}" y2="{tip[1]:.1f}" '
             f'stroke="#3E3A32" stroke-opacity="0.12" stroke-width="1"/>')
    return "\n".join(s), tip[1]

def grid8(cx, cy, a, op="0.85"):
    d = diamond(cx, cy, a)
    L, T, R, B = d["L"], d["T"], d["R"], d["B"]
    lines = []
    for k in range(1, 8):
        t = k / 8.0
        p1 = lerp(L, B, t); p2 = lerp(T, R, t)
        q1 = lerp(L, T, t); q2 = lerp(B, R, t)
        lines.append(f'<line x1="{p1[0]:.1f}" y1="{p1[1]:.1f}" x2="{p2[0]:.1f}" y2="{p2[1]:.1f}"/>')
        lines.append(f'<line x1="{q1[0]:.1f}" y1="{q1[1]:.1f}" x2="{q2[0]:.1f}" y2="{q2[1]:.1f}"/>')
    return (f'<g stroke="#C8BBA4" stroke-width="0.75" opacity="{op}">' + "".join(lines) + "</g>")

def bilinear(A, Bq, C, D, u, v):
    x = A[0]*(1-u)*(1-v) + Bq[0]*u*(1-v) + C[0]*u*v + D[0]*(1-u)*v
    y = A[1]*(1-u)*(1-v) + Bq[1]*u*(1-v) + C[1]*u*v + D[1]*(1-u)*v
    return (x, y)

def subquad(A, Bq, C, D, u0, u1, v0, v1):
    return [bilinear(A, Bq, C, D, u0, v0), bilinear(A, Bq, C, D, u1, v0),
            bilinear(A, Bq, C, D, u1, v1), bilinear(A, Bq, C, D, u0, v1)]

def cutaway_house(pfx, cx, cy, a, h, win, opts):
    """剖开式等距小屋（后墙可见内部）。opts: loft/rug/pouf/plant/lamp/vinyl/pendant/night"""
    night = opts.get("night", False)
    d = diamond(cx, cy, a)
    L, T, R, B, b = d["L"], d["T"], d["R"], d["B"], d["b"]
    Lv = (L[0], L[1] - h); Tv = (T[0], T[1] - h); Rv = (R[0], R[1] - h)
    floor = "#C49A6C" if not night else "#B78F63"
    wall_l = "#F8F2E6" if not night else "#EAE1CE"   # 受光面（光源 35° 左上）
    wall_r = "#EDE4D0" if not night else "#DDD2BC"   # 背光面
    s = []
    # 地板
    s.append(f'<polygon points="{pts([L, T, R, B])}" fill="{floor}"/>')
    s.append(grid8(cx, cy, a))
    # 后墙
    s.append(f'<polygon points="{pts([L, T, Tv, Lv])}" fill="{wall_l}"/>')
    s.append(f'<polygon points="{pts([T, R, Rv, Tv])}" fill="{wall_r}"/>')
    s.append(f'<path d="M{P(Lv)} L{P(Tv)} L{P(Rv)}" fill="none" stroke="#A87F52" stroke-width="3" stroke-linejoin="round"/>')
    # 窗户（左后墙）+ 光晕 + 地面光斑
    u0, u1 = 0.30, 0.72
    W1 = lerp(L, T, u0); W2 = lerp(L, T, u1)
    wb, wt = -h * 0.30, -h * 0.82
    wq = [(W1[0], W1[1] + wb), (W2[0], W2[1] + wb), (W2[0], W2[1] + wt), (W1[0], W1[1] + wt)]
    wcx, wcy = (W1[0] + W2[0]) / 2, (W1[1] + W2[1]) / 2 + (wb + wt) / 2
    s.append(f'<ellipse cx="{wcx:.1f}" cy="{wcy:.1f}" rx="{a*0.42:.1f}" ry="{a*0.34:.1f}" fill="url(#{pfx}-winGlow)"/>')
    s.append(f'<polygon points="{pts(wq)}" fill="{win}" stroke="#A87F52" stroke-width="2.5" stroke-linejoin="round"/>')
    wm = lerp(W1, W2, 0.5)
    s.append(f'<line x1="{wm[0]:.1f}" y1="{wm[1]+wb:.1f}" x2="{wm[0]:.1f}" y2="{wm[1]+wt:.1f}" stroke="#A87F52" stroke-width="1.6"/>')
    s.append(f'<line x1="{W1[0]:.1f}" y1="{W1[1]+(wb+wt)/2:.1f}" x2="{W2[0]:.1f}" y2="{W2[1]+(wb+wt)/2:.1f}" stroke="#A87F52" stroke-width="1.6"/>')
    # 地面透光
    dv = (B[0] - (L[0] + T[0]) / 2, B[1] - (L[1] + T[1]) / 2)
    k = 0.42
    S1 = (W1[0], W1[1] - 2); S2 = (W2[0], W2[1] - 2)
    S3 = (S2[0] + dv[0] * k, S2[1] + dv[1] * k); S4 = (S1[0] + dv[0] * k, S1[1] + dv[1] * k)
    s.append(f'<polygon points="{pts([S1, S2, S3, S4])}" fill="{win}" opacity="0.28"/>')
    # 地毯
    if opts.get("rug", True):
        s.append(f'<ellipse cx="{cx-8:.1f}" cy="{cy+b*0.42:.1f}" rx="{a*0.30:.1f}" ry="{a*0.15:.1f}" fill="#E7DCC8" opacity="0.9"/>')
        s.append(f'<ellipse cx="{cx-8:.1f}" cy="{cy+b*0.42:.1f}" rx="{a*0.20:.1f}" ry="{a*0.10:.1f}" fill="none" stroke="#C8BBA4" stroke-width="1"/>')
    # Loft（右后角，橡木楼板 + 立柱 + 梯子 + 床垫）
    if opts.get("loft", True):
        lh = h * 0.55
        A = lerp(T, R, 0.42); Bq = R; C = lerp(R, B, 0.52); D = (cx, cy)
        Ae = (A[0], A[1] - lh); Be = (Bq[0], Bq[1] - lh); Ce = (C[0], C[1] - lh); De = (D[0], D[1] - lh)
        # 立柱
        s.append(f'<rect x="{D[0]-2.5:.1f}" y="{De[1]:.1f}" width="5" height="{lh:.1f}" fill="#A87F52"/>')
        # 楼板厚度（前缘）
        s.append(f'<polygon points="{pts([Ae, De, (De[0], De[1]+6), (Ae[0], Ae[1]+6)])}" fill="#A87F52"/>')
        s.append(f'<polygon points="{pts([De, Ce, (Ce[0], Ce[1]+6), (De[0], De[1]+6)])}" fill="#8F6B42"/>')
        # 楼板面
        s.append(f'<polygon points="{pts([Ae, Be, Ce, De])}" fill="#C49A6C"/>')
        # 床垫 + 毯子 + 枕头
        mq = subquad(Ae, Be, Ce, De, 0.30, 0.92, 0.28, 0.85)
        s.append(f'<polygon points="{pts(mq)}" fill="#E7DCC8"/>')
        bq = subquad(Ae, Be, Ce, De, 0.30, 0.62, 0.30, 0.83)
        s.append(f'<polygon points="{pts(bq)}" fill="#C4DED2"/>')
        pq = subquad(Ae, Be, Ce, De, 0.70, 0.90, 0.38, 0.62)
        s.append(f'<polygon points="{pts(pq)}" fill="#FBF8F1"/>')
        # 梯子
        M = lerp(Ae, De, 0.5)
        Mf = (M[0], M[1] + lh)
        s.append(f'<g stroke="#A87F52" stroke-width="2.4" stroke-linecap="round">'
                 f'<line x1="{M[0]-5:.1f}" y1="{M[1]:.1f}" x2="{Mf[0]-5:.1f}" y2="{Mf[1]:.1f}"/>'
                 f'<line x1="{M[0]+5:.1f}" y1="{M[1]:.1f}" x2="{Mf[0]+5:.1f}" y2="{Mf[1]:.1f}"/>')
        for i in range(1, 5):
            yy = M[1] + lh * i / 5.0
            s.append(f'<line x1="{M[0]-5:.1f}" y1="{yy:.1f}" x2="{M[0]+5:.1f}" y2="{yy:.1f}"/>')
        s.append('</g>')
    # 坐垫（mint）
    if opts.get("pouf", True):
        px, py = cx - a * 0.52, cy + b * 0.30
        s.append(f'<g><rect x="{px-a*0.13:.1f}" y="{py-a*0.12:.1f}" width="{a*0.26:.1f}" height="{a*0.12:.1f}" fill="#AECFC0"/>'
                 f'<ellipse cx="{px:.1f}" cy="{py-a*0.12:.1f}" rx="{a*0.13:.1f}" ry="{a*0.065:.1f}" fill="#C4DED2"/>'
                 f'<ellipse cx="{px:.1f}" cy="{py:.1f}" rx="{a*0.13:.1f}" ry="{a*0.065:.1f}" fill="#AECFC0"/></g>')
    # 绿植
    if opts.get("plant", True):
        gx, gy = cx - a * 0.62, cy + b * 0.72
        s.append(f'<g><polygon points="{pts([(gx-7, gy-8), (gx+7, gy-8), (gx+5, gy+4), (gx-5, gy+4)])}" fill="#C8BBA4"/>'
                 f'<path d="M{gx:.1f} {gy-8:.1f} q-9 -10 -4 -18 M{gx:.1f} {gy-8:.1f} q0 -14 6 -19 M{gx:.1f} {gy-8:.1f} q9 -8 8 -17" '
                 f'stroke="#8FB8A4" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>')
    # 落地灯（暖光）
    if opts.get("lamp", True):
        lx, ly = cx + a * 0.30, cy + b * 0.55
        s.append(f'<g><line x1="{lx:.1f}" y1="{ly:.1f}" x2="{lx:.1f}" y2="{ly-h*0.62:.1f}" stroke="#A87F52" stroke-width="2.4"/>'
                 f'<circle cx="{lx:.1f}" cy="{ly-h*0.62:.1f}" r="{a*0.20:.1f}" fill="url(#{pfx}-winGlow)" opacity="0.85"/>'
                 f'<polygon points="{pts([(lx-9, ly-h*0.62), (lx+9, ly-h*0.62), (lx+5, ly-h*0.62-12), (lx-5, ly-h*0.62-12)])}" fill="#E7DCC8"/>'
                 f'</g>')
    # 吊灯
    if opts.get("pendant", False):
        pm = lerp(Tv, Rv, 0.32)
        cy2 = pm[1] + 34
        s.append(f'<g><line x1="{pm[0]:.1f}" y1="{pm[1]:.1f}" x2="{pm[0]:.1f}" y2="{cy2:.1f}" stroke="#3E3A32" stroke-width="1.4"/>'
                 f'<ellipse cx="{pm[0]:.1f}" cy="{cy2+10:.1f}" rx="20" ry="12" fill="url(#{pfx}-winGlow)"/>'
                 f'<polygon points="{pts([(pm[0]-10, cy2), (pm[0]+10, cy2), (pm[0]+5, cy2+9), (pm[0]-5, cy2+9)])}" fill="#A87F52"/>'
                 f'<circle cx="{pm[0]:.1f}" cy="{cy2+9:.1f}" r="3" fill="{win}"/></g>')
    # 黑胶唱机
    if opts.get("vinyl", False):
        vx, vy = cx + a * 0.28, cy + b * 0.18
        vd = diamond(vx, vy, a * 0.22)
        s.append(f'<g>'
                 f'<polygon points="{pts([vd["L"], vd["T"], vd["R"], vd["B"]])}" fill="#8F6B42"/>'
                 f'<ellipse cx="{vx:.1f}" cy="{vy-4:.1f}" rx="{a*0.17:.1f}" ry="{a*0.085:.1f}" fill="#3E3A32"/>'
                 f'<ellipse cx="{vx:.1f}" cy="{vy-4:.1f}" rx="{a*0.115:.1f}" ry="{a*0.058:.1f}" fill="none" stroke="#E8B04B" stroke-width="2.5"/>'
                 f'<ellipse cx="{vx:.1f}" cy="{vy-4:.1f}" rx="{a*0.045:.1f}" ry="{a*0.023:.1f}" fill="#E7DCC8"/>'
                 f'<circle cx="{vx:.1f}" cy="{vy-4:.1f}" r="1.4" fill="#3E3A32"/>'
                 f'<circle cx="{vx+a*0.20:.1f}" cy="{vy-a*0.16:.1f}" r="3" fill="#A87F52"/>'
                 f'<line x1="{vx+a*0.20:.1f}" y1="{vy-a*0.16:.1f}" x2="{vx+a*0.08:.1f}" y2="{vy-6:.1f}" stroke="#3E3A32" stroke-width="2" stroke-linecap="round"/>'
                 # 转动示意弧（虚线）
                 f'<path d="M{vx-a*0.22:.1f} {vy-8:.1f} A {a*0.24:.1f} {a*0.13:.1f} 0 0 1 {vx-2:.1f} {vy-a*0.17:.1f}" fill="none" stroke="#E8B04B" stroke-width="1.6" stroke-dasharray="4 5" opacity="0.8"/>'
                 f'<path d="M{vx+a*0.22:.1f} {vy:.1f} A {a*0.24:.1f} {a*0.13:.1f} 0 0 1 {vx+2:.1f} {vy+a*0.09:.1f}" fill="none" stroke="#E8B04B" stroke-width="1.6" stroke-dasharray="4 5" opacity="0.8"/>'
                 f'</g>')
        s.append(f'<text x="{vx+a*0.34:.1f}" y="{vy-a*0.24:.1f}" font-family="MiSans" font-size="15" fill="#E8B04B" transform="rotate(-12 {vx+a*0.34:.1f} {vy-a*0.24:.1f})">♪</text>')
    return "\n".join(s)

def friend_hut(cx, cy, a, h, win, name):
    """远景好友小屋（外观视角：正面两墙 + 坡屋顶）"""
    d = diamond(cx, cy, a)
    L, T, R, B, b = d["L"], d["T"], d["R"], d["B"], d["b"]
    rock, tip_y = rock_island(cx, cy, a, "p01-shadow", "0.55")
    Lv = (L[0], L[1] - h); Bv = (B[0], B[1] - h); Rv = (R[0], R[1] - h)
    apex = (cx, cy - h - a * 0.55)
    s = [rock]
    s.append(f'<polygon points="{pts([L, B, R, T])}" fill="#C49A6C"/>')
    s.append(f'<polygon points="{pts([L, B, Bv, Lv])}" fill="#F8F2E6"/>')
    s.append(f'<polygon points="{pts([B, R, Rv, Bv])}" fill="#EDE4D0"/>')
    s.append(f'<polygon points="{pts([Lv, Bv, apex])}" fill="#A87F52"/>')
    s.append(f'<polygon points="{pts([Bv, Rv, apex])}" fill="#8F6B42"/>')
    # 小窗透光
    w1 = lerp(L, B, 0.32); w2 = lerp(L, B, 0.66)
    s.append(f'<polygon points="{pts([(w1[0], w1[1]-h*0.28), (w2[0], w2[1]-h*0.28), (w2[0], w2[1]-h*0.68), (w1[0], w1[1]-h*0.68)])}" fill="{win}"/>')
    fs = 11 if a >= 28 else 9
    s.append(f'<text x="{cx:.1f}" y="{tip_y+20:.1f}" text-anchor="middle" font-family="MiSans" font-size="{fs}" fill="#7A7263" letter-spacing="1">{name}</text>')
    return "\n".join(s)

HEADER = '<?xml version="1.0" encoding="UTF-8"?>\n'

# ============================================================ PAGE 01
def page01():
    p = "p01"
    s = [HEADER,
         f'<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">',
         '<defs>',
         f'<linearGradient id="{p}-sky" x1="5%" y1="29%" x2="95%" y2="71%">'
         f'<stop offset="0" stop-color="#F2D9A0"/><stop offset="1" stop-color="#F6E8C8"/></linearGradient>',
         f'<radialGradient id="{p}-shadow"><stop offset="0" stop-color="#3E3A32" stop-opacity="0.15"/>'
         f'<stop offset="1" stop-color="#3E3A32" stop-opacity="0"/></radialGradient>',
         f'<radialGradient id="{p}-sun"><stop offset="0" stop-color="#E8B04B" stop-opacity="0.55"/>'
         f'<stop offset="1" stop-color="#E8B04B" stop-opacity="0"/></radialGradient>',
         f'<radialGradient id="{p}-winGlow"><stop offset="0" stop-color="#FFD98A" stop-opacity="0.65"/>'
         f'<stop offset="1" stop-color="#FFD98A" stop-opacity="0"/></radialGradient>',
         f'<filter id="{p}-btn" x="-40%" y="-60%" width="180%" height="260%">'
         f'<feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#3E3A32" flood-opacity="0.2"/></filter>',
         '</defs>',
         # 背景
         '<rect width="390" height="844" fill="#F6F0E4"/>',
         # 天空（晴天 Golden Sunset，115°）
         '<ellipse cx="195" cy="398" rx="168" ry="188" fill="url(#p01-sky)"/>',
         # 太阳（光源 35° 左上）
         '<circle cx="112" cy="210" r="32" fill="url(#p01-sun)"/>',
         '<circle cx="112" cy="210" r="16" fill="#E8B04B" opacity="0.85"/>',
         # 光斑点点
         '<g fill="#E8B04B" opacity="0.5">'
         '<circle cx="300" cy="210" r="2.2"/><circle cx="330" cy="300" r="1.6"/>'
         '<circle cx="70" cy="330" r="1.8"/><circle cx="255" cy="170" r="1.5"/></g>',
         # 远景云
         cloud(30, 180, 0.62, "#FBF8F1", 0.6),
         cloud(270, 140, 0.5, "#FBF8F1", 0.5),
         # 顶部文字
         '<text x="195" y="92" text-anchor="middle" font-family="Oranienbaum" font-size="10" '
         'letter-spacing="2" fill="#7A7263">ROOMIE · A LITTLE FLOATING ROOM</text>',
         '<text x="195" y="148" text-anchor="middle" font-family="Noto Serif SC" font-size="44" fill="#3E3A32">随音乐呼吸</text>',
         '<text x="195" y="182" text-anchor="middle" font-family="Noto Serif SC" font-size="14" '
         'letter-spacing="1" fill="#7A7263">把喜欢的歌，都住进来</text>',
         # 好友小屋（远景，更小）
         friend_hut(64, 256, 32, 28, "#FFD98A", "MOMO 的家"),
         friend_hut(316, 246, 30, 26, "#FFD98A", "KIKI 的家"),
         friend_hut(322, 452, 18, 15, "#FFD98A", "NANA 的家"),
         # 主岛云（屋后）
         cloud(46, 462, 1.0, "#FBF8F1", 0.95),
         ]
    rock, _tip = rock_island(195, 430, 110, "p01-shadow")
    s.append(rock)
    s.append(cutaway_house(p, 195, 430, 110, 88, "#FFD98A",
                           {"loft": True, "rug": True, "pouf": True, "plant": True, "lamp": True}))
    # 岛前云（遮挡岩石下缘，营造漂浮感）
    s.append(cloud(238, 545, 1.12, "#FBF8F1", 0.97))
    s.append(cloud(96, 580, 0.7, "#FBF8F1", 0.9))
    # 底部文案 + 主按钮
    s.append('<text x="195" y="700" text-anchor="middle" font-family="MiSans" font-size="11" '
             'fill="#7A7263" letter-spacing="0.5">打开就是漂浮房间，好友的家漂浮在一旁</text>')
    s.append('<g filter="url(#p01-btn)"><rect x="59" y="716" width="272" height="52" rx="26" fill="#31C27C"/></g>')
    s.append('<text x="195" y="748" text-anchor="middle" font-family="MiSans" font-size="15" '
             'font-weight="500" letter-spacing="1" fill="#FBF8F1">进入我的房间</text>')
    # 状态栏 + Home 指示条
    s.append('<text x="30" y="30" font-family="MiSans" font-size="12.5" font-weight="500" fill="#3E3A32">9:41</text>')
    s.append('<g fill="#3E3A32" opacity="0.85">'
             '<rect x="304" y="22" width="3" height="6" rx="1"/><rect x="309" y="20" width="3" height="8" rx="1"/>'
             '<rect x="314" y="18" width="3" height="10" rx="1"/><rect x="319" y="16" width="3" height="12" rx="1"/></g>')
    s.append('<g><rect x="334" y="17" width="24" height="12" rx="3.5" fill="none" stroke="#3E3A32" stroke-width="1"/>'
             '<rect x="336" y="19" width="15" height="8" rx="2" fill="#3E3A32"/>'
             '<rect x="359.5" y="20.5" width="2.5" height="5" rx="1.2" fill="#3E3A32"/></g>')
    s.append('<rect x="128" y="830" width="134" height="5" rx="2.5" fill="#3E3A32" opacity="0.25"/>')
    s.append('</svg>')
    return "\n".join(s)

# ============================================================ PAGE 02
def page02():
    p = "p02"
    random.seed(11)
    s = [HEADER,
         f'<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">',
         '<defs>',
         f'<linearGradient id="{p}-sky" x1="5%" y1="29%" x2="95%" y2="71%">'
         f'<stop offset="0" stop-color="#6B7B8C"/><stop offset="1" stop-color="#9AA8B2"/></linearGradient>',
         f'<radialGradient id="{p}-shadow"><stop offset="0" stop-color="#3E3A32" stop-opacity="0.28"/>'
         f'<stop offset="1" stop-color="#3E3A32" stop-opacity="0"/></radialGradient>',
         f'<radialGradient id="{p}-winGlow"><stop offset="0" stop-color="#FFC97A" stop-opacity="0.7"/>'
         f'<stop offset="1" stop-color="#FFC97A" stop-opacity="0"/></radialGradient>',
         f'<filter id="{p}-card" x="-30%" y="-40%" width="160%" height="200%">'
         f'<feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#3E3A32" flood-opacity="0.2"/></filter>',
         '</defs>',
         # 雨夜天空（Lo-fi Rainy Neon，115°）
         '<rect width="390" height="844" fill="url(#p02-sky)"/>',
         # 高层夜云
         cloud(10, 150, 1.2, "#5C6B7A", 0.35),
         cloud(240, 105, 0.9, "#5C6B7A", 0.3),
         # 远景小岛剪影
         '<g opacity="0.28" fill="#4E5D6C">'
         '<polygon points="34,235 58,223 82,235 58,247"/>'
         '<polygon points="44,235 58,247 58,262 44,250"/>'
         '<polygon points="58,247 72,235 72,250 58,262"/>'
         '<polygon points="52,228 58,222 64,228 58,233"/></g>',
         '<g opacity="0.22" fill="#4E5D6C">'
         '<polygon points="318,170 334,162 350,170 334,178"/>'
         '<polygon points="324,170 334,178 334,188 324,180"/>'
         '<polygon points="334,178 344,170 344,180 334,188"/></g>',
         ]
    # 雨丝（屋后层）
    rain = ['<g stroke="#E9EEF2" stroke-width="1" stroke-linecap="round">']
    for _ in range(48):
        x = random.uniform(8, 382); y = random.uniform(70, 660)
        ln = random.uniform(10, 24); dx = ln * 0.22
        op = random.uniform(0.10, 0.30)
        rain.append(f'<line x1="{x:.1f}" y1="{y:.1f}" x2="{x+dx:.1f}" y2="{y+ln:.1f}" opacity="{op:.2f}"/>')
    rain.append('</g>')
    s.append("".join(rain))
    # 岛下阴影 + 岩石 + 小屋
    rock, _tip = rock_island(195, 395, 150, "p02-shadow", dark=True)
    s.append(cloud(30, 560, 1.25, "#7C8A99", 0.55))
    s.append(rock)
    s.append(cutaway_house(p, 195, 395, 150, 112, "#FFC97A",
                           {"loft": True, "rug": True, "pouf": True, "plant": False,
                            "lamp": False, "pendant": True, "vinyl": True, "night": True}))
    s.append(cloud(232, 615, 1.3, "#7C8A99", 0.6))
    # 雨丝（屋前层，更亮）
    rain2 = ['<g stroke="#F2F5F7" stroke-width="1" stroke-linecap="round">']
    for _ in range(14):
        x = random.uniform(20, 370); y = random.uniform(90, 620)
        ln = random.uniform(12, 26); dx = ln * 0.22
        op = random.uniform(0.22, 0.42)
        rain2.append(f'<line x1="{x:.1f}" y1="{y:.1f}" x2="{x+dx:.1f}" y2="{y+ln:.1f}" opacity="{op:.2f}"/>')
    rain2.append('</g>')
    s.append("".join(rain2))
    # ---------- 顶部 UI ----------
    s.append('<text x="30" y="30" font-family="MiSans" font-size="12.5" font-weight="500" fill="#FBF8F1">9:41</text>')
    s.append('<g fill="#FBF8F1" opacity="0.9">'
             '<rect x="304" y="22" width="3" height="6" rx="1"/><rect x="309" y="20" width="3" height="8" rx="1"/>'
             '<rect x="314" y="18" width="3" height="10" rx="1"/><rect x="319" y="16" width="3" height="12" rx="1"/></g>')
    s.append('<g><rect x="334" y="17" width="24" height="12" rx="3.5" fill="none" stroke="#FBF8F1" stroke-width="1"/>'
             '<rect x="336" y="19" width="15" height="8" rx="2" fill="#FBF8F1"/>'
             '<rect x="359.5" y="20.5" width="2.5" height="5" rx="1.2" fill="#FBF8F1"/></g>')
    # 返回箭头
    s.append('<path d="M32 44 L23 52.5 L32 61" fill="none" stroke="#FBF8F1" stroke-width="2.2" '
             'stroke-linecap="round" stroke-linejoin="round"/>')
    # LIVE 胶囊（QQ 绿描边，全圆角）
    s.append('<rect x="128" y="39" width="134" height="27" rx="13.5" fill="#FBF8F1" fill-opacity="0.08" '
             'stroke="#31C27C" stroke-width="1.2"/>')
    s.append('<circle cx="146" cy="52.5" r="3" fill="#31C27C"/>')
    s.append('<text x="155" y="56.2" font-family="MiSans" font-size="10.5" letter-spacing="1" fill="#FBF8F1">正在播放 · LIVE</text>')
    # 分享图标（三节点）
    s.append('<g stroke="#FBF8F1" stroke-width="1.6"><line x1="347" y1="52" x2="359" y2="43"/>'
             '<line x1="347" y1="52" x2="359" y2="61"/></g>'
             '<g fill="#FBF8F1"><circle cx="346" cy="52" r="2.6"/><circle cx="360" cy="42.5" r="2.6"/>'
             '<circle cx="360" cy="61.5" r="2.6"/></g>')
    # ---------- 底部迷你播放器 ----------
    s.append('<g filter="url(#p02-card)"><rect x="16" y="692" width="358" height="100" rx="12" fill="#FBF8F1"/></g>')
    # 黑胶缩略图
    s.append('<g><circle cx="66" cy="742" r="28" fill="#3E3A32"/>'
             '<circle cx="66" cy="742" r="19" fill="none" stroke="#E8B04B" stroke-width="3"/>'
             '<circle cx="66" cy="742" r="7" fill="#E7DCC8"/>'
             '<circle cx="66" cy="742" r="1.8" fill="#3E3A32"/></g>')
    # 文案
    s.append('<text x="106" y="730" font-family="MiSans" font-size="15" font-weight="500" fill="#3E3A32">晴天</text>')
    s.append('<text x="106" y="750" font-family="MiSans" font-size="11" fill="#7A7263">周杰伦</text>')
    # 进度条
    s.append('<rect x="106" y="770" width="160" height="3" rx="1.5" fill="#E7DCC8"/>')
    s.append('<rect x="106" y="770" width="78" height="3" rx="1.5" fill="#31C27C"/>')
    s.append('<circle cx="184" cy="771.5" r="3.5" fill="#FBF8F1" stroke="#31C27C" stroke-width="1.5"/>')
    s.append('<text x="106" y="786" font-family="Oranienbaum" font-size="9.5" letter-spacing="1" fill="#7A7263">2:14</text>')
    s.append('<text x="266" y="786" text-anchor="end" font-family="Oranienbaum" font-size="9.5" letter-spacing="1" fill="#7A7263">4:29</text>')
    # 控制按钮
    s.append('<g fill="#3E3A32">'
             '<rect x="274" y="735" width="2.4" height="14" rx="1.2"/>'
             '<polygon points="285,735 277,742 285,749"/>'
             '<rect x="353.6" y="735" width="2.4" height="14" rx="1.2"/>'
             '<polygon points="345,735 353,742 345,749"/></g>')
    s.append('<circle cx="320" cy="742" r="18" fill="#31C27C"/>')
    s.append('<g fill="#FBF8F1"><rect x="314.5" y="735.5" width="3.4" height="13" rx="1.5"/>'
             '<rect x="321.5" y="735.5" width="3.4" height="13" rx="1.5"/></g>')
    # Home 指示条
    s.append('<rect x="128" y="830" width="134" height="5" rx="2.5" fill="#FBF8F1" opacity="0.4"/>')
    s.append('</svg>')
    return "\n".join(s)

with open(os.path.join(OUT, "page-01-home.svg"), "w", encoding="utf-8") as f:
    f.write(page01())
with open(os.path.join(OUT, "page-02-live.svg"), "w", encoding="utf-8") as f:
    f.write(page02())
print("done")
