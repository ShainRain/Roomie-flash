# -*- coding: utf-8 -*-
"""Roomie: page-02-live-v2.svg + page-03-edit-v2.svg (390x844)。
复用 gen_hero.hero() 的等轴测放映室几何；无 transform / use / symbol。"""
import os
from gen_hero import hero, HEADER, OUT, SQ, HQ, Lw, Rw, Fl

DARK, SOFA, GRAY = "#2F4A5A", "#F7F3EA", "#8AA0AB"
QQ = "#31C27C"


def status_bar(color):
    return [
        f'<text x="28" y="34" font-family="Inter" font-size="13" font-weight="600" fill="{color}">9:41</text>',
        f'<g fill="{color}" opacity="0.85">'
        '<rect x="300" y="24" width="3" height="7" rx="1"/><rect x="305" y="22" width="3" height="9" rx="1"/>'
        '<rect x="310" y="20" width="3" height="11" rx="1"/><rect x="315" y="18" width="3" height="13" rx="1"/></g>',
        f'<rect x="328" y="19" width="24" height="12" rx="3.5" fill="none" stroke="{color}" stroke-width="1"/>'
        f'<rect x="330" y="21" width="15" height="8" rx="2" fill="{color}"/>'
        f'<rect x="353.5" y="22.5" width="2.5" height="5" rx="1.2" fill="{color}"/>',
    ]


# ============================================================ PAGE 02 LIVE
def write_page02():
    k, tx, ty = 0.82, -90.0, 110.0

    def P(x, y):
        return (x * k + tx, y * k + ty)

    extra = (
        '<filter id="pg2-cardShadow" x="-20%" y="-20%" width="140%" height="160%">'
        '<feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="#2F4A5A" flood-opacity="0.18"/></filter>'
        '<linearGradient id="pg2-topfade" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0" stop-color="#2F4A5A" stop-opacity="0.55"/>'
        '<stop offset="1" stop-color="#2F4A5A" stop-opacity="0"/></linearGradient>'
    )
    defs, art = hero(k, tx, ty, "pg2", extra)

    lx, ly = P(532.8, 375)          # 台灯中心（缩放后）
    sc = [P(*Rw(u, v)) for u, v in [(0.16, 0.14), (0.84, 0.14), (0.84, 0.66), (0.16, 0.66)]]
    sheen_pts = " ".join(f"{a:.1f},{b:.1f}" for a, b in sc)

    s = [HEADER,
         '<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">',
         defs,
         '<rect width="390" height="844" fill="#F5F1E8"/>',
         # ---------- Room Scene ----------
         '<g id="Room Scene">',
         art,
         # 深夜放映：环境光压暗
         '<rect width="390" height="844" fill="#2F4A5A" opacity="0.17"/>',
         # 主光源压暗后补强：屏幕反光 + 台灯暖光
         f'<polygon points="{sheen_pts}" fill="#D8EFEF" opacity="0.12"/>',
         f'<circle cx="{lx:.1f}" cy="{ly:.1f}" r="{88*k:.1f}" fill="url(#pg2-glow)" opacity="0.55"/>',
         f'<circle cx="{lx:.1f}" cy="{ly:.1f}" r="{50*k:.1f}" fill="url(#pg2-glow)" opacity="0.95"/>',
         '</g>',
         # ---------- Top Bar ----------
         '<g id="Top Bar">',
         '<rect x="0" y="0" width="390" height="120" fill="url(#pg2-topfade)"/>',
         ]
    s += status_bar(SOFA)
    s += [
        # 返回箭头
        '<path d="M34,50 L24,58 L34,66" fill="none" stroke="#F7F3EA" stroke-width="2" '
        'stroke-linecap="round" stroke-linejoin="round"/>',
        # LIVE 胶囊
        f'<rect x="126" y="42" width="138" height="32" rx="16" fill="{DARK}" fill-opacity="0.45" '
        f'stroke="{QQ}" stroke-width="1.2"/>',
        f'<circle cx="144" cy="58" r="4" fill="{QQ}"/>',
        '<text x="156" y="62" font-family="MiSans" font-size="11" fill="#F7F3EA">正在播放 · LIVE</text>',
        # 分享图标（纸白线条，三节点）
        '<g stroke="#F7F3EA" stroke-width="1.6" fill="none">'
        '<line x1="349.6" y1="51.6" x2="356.4" y2="55.4"/><line x1="349.6" y1="64.4" x2="356.4" y2="60.6"/>'
        '<circle cx="347" cy="49" r="2.6"/><circle cx="347" cy="67" r="2.6"/><circle cx="360" cy="58" r="2.6"/></g>',
        '</g>',
        # ---------- Mini Player ----------
        '<g id="Mini Player">',
        '<rect x="16" y="690" width="358" height="88" rx="12" fill="#F7F3EA" filter="url(#pg2-cardShadow)"/>',
        # 黑胶缩略
        f'<circle cx="58" cy="734" r="22" fill="{DARK}"/>',
        '<circle cx="58" cy="734" r="14" fill="none" stroke="#1C2F3A" stroke-width="1" stroke-opacity="0.6"/>',
        f'<circle cx="58" cy="734" r="7" fill="{SOFA}"/>',
        f'<circle cx="58" cy="734" r="1.6" fill="{DARK}"/>',
        # 歌名 / 艺人
        f'<text x="96" y="724" font-family="MiSans Semibold" font-size="15" fill="{DARK}">晴天</text>',
        f'<text x="96" y="743" font-family="MiSans" font-size="10.5" fill="{GRAY}">周杰伦</text>',
        # 进度条（2:14 / 4:29）
        '<rect x="96" y="754" width="156" height="3.5" rx="1.75" fill="#E3DACA"/>',
        f'<rect x="96" y="754" width="77.7" height="3.5" rx="1.75" fill="{QQ}"/>',
        f'<text x="96" y="771" font-family="Inter" font-size="9" fill="{GRAY}">2:14</text>',
        f'<text x="252" y="771" text-anchor="end" font-family="Inter" font-size="9" fill="{GRAY}">4:29</text>',
        # 上一曲
        f'<rect x="268" y="726" width="2.5" height="16" rx="1.25" fill="{DARK}"/>'
        f'<polygon points="288,726 288,742 275,734" fill="{DARK}"/>',
        # 暂停（QQ 绿圆）
        f'<circle cx="320" cy="734" r="17" fill="{QQ}"/>'
        '<rect x="313.5" y="728" width="3.4" height="12" rx="1.7" fill="#F7F3EA"/>'
        '<rect x="323.1" y="728" width="3.4" height="12" rx="1.7" fill="#F7F3EA"/>',
        # 下一曲
        f'<polygon points="352,726 352,742 365,734" fill="{DARK}"/>'
        f'<rect x="369.5" y="726" width="2.5" height="16" rx="1.25" fill="{DARK}" transform="none"/>',
        # Home 指示条
        '<rect x="128" y="828" width="134" height="5" rx="2.5" fill="#F7F3EA" opacity="0.35"/>',
        '</g>',
        '</svg>',
    ]
    # 去掉误加的 transform 占位
    s = [line.replace(' transform="none"', '') for line in s]
    with open(os.path.join(OUT, "page-02-live-v2.svg"), "w", encoding="utf-8") as f:
        f.write("\n".join(s))


# ============================================================ PAGE 03 EDIT
def write_page03():
    k, tx, ty = 0.5, 15.0, 120.0

    def P(x, y):
        return (x * k + tx, y * k + ty)

    def SP(points):
        return " ".join(f"{a:.1f},{b:.1f}" for a, b in points)

    floor_pts = [P(*Fl(0, 0)), P(*Fl(1, 0)), P(*Fl(1, 1)), P(*Fl(0, 1))]
    extra = (
        '<linearGradient id="pg3-temp" x1="0" y1="0" x2="1" y2="0">'
        '<stop offset="0" stop-color="#F2C979"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>'
        f'<clipPath id="pg3-floorClip"><polygon points="{SP(floor_pts)}"/></clipPath>'
        '<filter id="pg3-cardShadow" x="-20%" y="-20%" width="140%" height="160%">'
        '<feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#2F4A5A" flood-opacity="0.08"/></filter>'
    )
    defs, art = hero(k, tx, ty, "pg3", extra)

    # ---- 地板网格（0.75px #EADFCB，裁剪到地板菱形）----
    grid = [f'<g clip-path="url(#pg3-floorClip)">']
    for i in range(1, 8):
        u = i / 8.0
        a, b = P(*Fl(u, 0)), P(*Fl(u, 1))
        c, d = P(*Fl(0, u)), P(*Fl(1, u))
        grid.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" '
                    f'stroke="#EADFCB" stroke-width="0.75"/>')
        grid.append(f'<line x1="{c[0]:.1f}" y1="{c[1]:.1f}" x2="{d[0]:.1f}" y2="{d[1]:.1f}" '
                    f'stroke="#EADFCB" stroke-width="0.75"/>')
    grid.append('</g>')

    # ---- 房间外圈虚线选框 + 四角纸白锚点 ----
    rx0, ry0 = 63.0, 163.0
    rx1, ry1 = 327.0, 417.0
    room_sel = [f'<rect x="{rx0}" y="{ry0}" width="{rx1-rx0}" height="{ry1-ry0}" fill="none" '
                f'stroke="{DARK}" stroke-width="1" stroke-dasharray="5 4"/>']
    for ax, ay in [(rx0, ry0), (rx1, ry0), (rx0, ry1), (rx1, ry1)]:
        room_sel.append(f'<rect x="{ax-5}" y="{ay-5}" width="10" height="10" fill="{SOFA}" '
                        f'stroke="{DARK}" stroke-width="1.5"/>')

    # ---- 沙发主座虚线选框（顶面菱形外扩 1.18）----
    cx0, cy0 = Fl(0.45, 0.60)
    EX, EY = (SQ * 50, HQ * 50), (-SQ * 30, HQ * 30)
    h = 34
    top = [(cx0 + EX[0] + EY[0], cy0 + EX[1] + EY[1] - h),
           (cx0 + EX[0] - EY[0], cy0 + EX[1] - EY[1] - h),
           (cx0 - EX[0] - EY[0], cy0 - EX[1] - EY[1] - h),
           (cx0 - EX[0] + EY[0], cy0 - EX[1] + EY[1] - h)]
    pts = [P(*p) for p in top]
    gx = sum(p[0] for p in pts) / 4.0
    gy = sum(p[1] for p in pts) / 4.0
    pts = [(gx + (p[0] - gx) * 1.18, gy + (p[1] - gy) * 1.18) for p in pts]
    sofa_sel = (f'<polygon points="{SP([pts[2], pts[1], pts[0], pts[3]])}" fill="none" '
                f'stroke="{DARK}" stroke-width="1" stroke-dasharray="4 3"/>')

    # ---- 四向移动手柄（纸白底圆 + 四向箭头），沙发选框正下方 ----
    mx, my = 187.0, 372.0
    arrows = [
        f'<circle cx="{mx}" cy="{my}" r="13" fill="{SOFA}" stroke="{DARK}" stroke-width="1.5"/>',
        f'<circle cx="{mx}" cy="{my}" r="1.8" fill="{DARK}"/>',
        f'<polygon points="{mx},{my-9} {mx-3},{my-4} {mx+3},{my-4}" fill="{DARK}"/>',
        f'<polygon points="{mx},{my+9} {mx-3},{my+4} {mx+3},{my+4}" fill="{DARK}"/>',
        f'<polygon points="{mx-9},{my} {mx-4},{my-3} {mx-4},{my+3}" fill="{DARK}"/>',
        f'<polygon points="{mx+9},{my} {mx+4},{my-3} {mx+4},{my+3}" fill="{DARK}"/>',
    ]

    # ---- 播放状态 chip ----
    chip = [
        f'<rect x="214" y="440" width="136" height="30" rx="15" fill="{SOFA}" stroke="#E9E0CD" '
        f'stroke-width="1" filter="url(#pg3-cardShadow)"/>',
        f'<circle cx="232" cy="455" r="4" fill="{QQ}"/>',
        f'<text x="244" y="459" font-family="MiSans" font-size="11" fill="{DARK}">正在播放 · 晴天</text>',
    ]

    # ---- 家具库图标 ----
    def icon_sofa(c):
        return (f'<path d="M{c-14},624 L{c-14},612 Q{c-14},606 {c-8},606 L{c+8},606 Q{c+14},606 {c+14},612 '
                f'L{c+14},624 Z" fill="none" stroke="{DARK}" stroke-width="1.8" stroke-linejoin="round"/>'
                f'<line x1="{c-10}" y1="617" x2="{c+10}" y2="617" stroke="{DARK}" stroke-width="1.8"/>')

    def icon_vinyl(c):
        return (f'<rect x="{c-13}" y="604" width="26" height="20" rx="3" fill="none" stroke="{DARK}" stroke-width="1.8"/>'
                f'<circle cx="{c-4}" cy="614" r="5.5" fill="none" stroke="{DARK}" stroke-width="1.8"/>'
                f'<circle cx="{c-4}" cy="614" r="1.4" fill="{DARK}"/>'
                f'<path d="M{c+9},607 L{c+9},612 L{c+3},617" fill="none" stroke="{DARK}" stroke-width="1.8" '
                f'stroke-linecap="round" stroke-linejoin="round"/>')

    def icon_catbed(c):
        return (f'<path d="M{c-13},624 L{c-13},617 Q{c-13},607 {c},607 Q{c+13},607 {c+13},617 L{c+13},624 Z" '
                f'fill="none" stroke="{DARK}" stroke-width="1.8" stroke-linejoin="round"/>'
                f'<polygon points="{c-8},608 {c-5},601 {c-2},608" fill="none" stroke="{DARK}" stroke-width="1.8" '
                f'stroke-linejoin="round"/>'
                f'<polygon points="{c+2},608 {c+5},601 {c+8},608" fill="none" stroke="{DARK}" stroke-width="1.8" '
                f'stroke-linejoin="round"/>'
                f'<path d="M{c-4},624 Q{c-4},617 {c},617 Q{c+4},617 {c+4},624" fill="none" stroke="{DARK}" '
                f'stroke-width="1.8"/>')

    def icon_shelf(c):
        return (f'<rect x="{c-12}" y="604" width="24" height="22" rx="2" fill="none" stroke="{DARK}" stroke-width="1.8"/>'
                f'<line x1="{c-12}" y1="611" x2="{c+12}" y2="611" stroke="{DARK}" stroke-width="1.8"/>'
                f'<line x1="{c-12}" y1="618" x2="{c+12}" y2="618" stroke="{DARK}" stroke-width="1.8"/>'
                f'<rect x="{c-9}" y="606.5" width="3" height="4.5" fill="#E6B15A"/>'
                f'<rect x="{c-5}" y="606" width="3" height="5" fill="#6D99A6"/>'
                f'<rect x="{c+3}" y="613.5" width="3" height="4.5" fill="#D96A4D"/>')

    cells = [(75, "沙发", icon_sofa), (155, "黑胶机", icon_vinyl),
             (235, "猫窝", icon_catbed), (315, "书架", icon_shelf)]
    cell_els = []
    for c, name, fn in cells:
        cell_els.append(f'<rect x="{c-26}" y="592" width="52" height="52" rx="12" fill="#F5F1E8"/>')
        cell_els.append(fn(c))
        cell_els.append(f'<text x="{c}" y="658" text-anchor="middle" font-family="MiSans" font-size="10" '
                        f'fill="#7C93A0">{name}</text>')

    s = [HEADER,
         '<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">',
         defs,
         '<rect width="390" height="844" fill="#F5F1E8"/>',
         '<g id="Status Bar">'] + status_bar(DARK) + [
         '</g>',
         # ---------- Header ----------
         '<g id="Header">',
         f'<text x="24" y="90" font-family="MiSans Semibold" font-size="20" fill="{DARK}">建筑师模式</text>',
         '<text x="24" y="110" font-family="Inter" font-size="10" letter-spacing="2" fill="#8AA0AB">ARCHITECT MODE</text>',
         f'<rect x="308" y="66" width="58" height="30" rx="15" fill="{DARK}"/>',
         f'<text x="337" y="85" text-anchor="middle" font-family="MiSans" font-size="12" fill="{SOFA}">保存</text>',
         '</g>',
         # ---------- Edit Canvas ----------
         '<g id="Edit Canvas">',
         art,
         ] + grid + room_sel + [sofa_sel] + arrows + chip + [
         '</g>',
         # ---------- Panels ----------
         '<g id="Panels">',
         '<rect x="0" y="536" width="390" height="308" rx="28" fill="#F7F3EA"/>',
         '<line x1="0" y1="537" x2="390" y2="537" stroke="#E7DFCE" stroke-width="1"/>',
         # 家具库
         '<rect x="24" y="556" width="342" height="108" rx="12" fill="#FCFAF4" stroke="#E9E0CD" stroke-width="1"/>',
         f'<text x="40" y="582" font-family="MiSans Semibold" font-size="13" fill="{DARK}">家具库</text>',
         '<text x="350" y="582" text-anchor="end" font-family="MiSans" font-size="10" fill="#8AA0AB">12 件</text>',
         ] + cell_els + [
         # 地板材质
         '<rect x="24" y="676" width="342" height="84" rx="12" fill="#FCFAF4" stroke="#E9E0CD" stroke-width="1"/>',
         f'<text x="40" y="702" font-family="MiSans Semibold" font-size="13" fill="{DARK}">地板材质</text>',
         '<text x="350" y="702" text-anchor="end" font-family="MiSans" font-size="10" fill="#8AA0AB">蓝灰 · 使用中</text>',
         '<rect x="37" y="711" width="58" height="40" rx="11" fill="none" stroke="#2F4A5A" stroke-width="1.5"/>',
         '<rect x="40" y="714" width="52" height="34" rx="8" fill="#5F7887"/>',
         '<rect x="104" y="714" width="52" height="34" rx="8" fill="#C08F45"/>',
         '<rect x="168" y="714" width="52" height="34" rx="8" fill="#6D99A6"/>',
         f'<circle cx="89" cy="714" r="6" fill="{DARK}"/>',
         '<path d="M86,714 L88.4,716.6 L92,711.6" fill="none" stroke="#F7F3EA" stroke-width="1.5" '
         'stroke-linecap="round" stroke-linejoin="round"/>',
         # 灯光色温
         '<rect x="24" y="772" width="342" height="60" rx="12" fill="#FCFAF4" stroke="#E9E0CD" stroke-width="1"/>',
         f'<text x="40" y="794" font-family="MiSans Semibold" font-size="13" fill="{DARK}">灯光色温</text>',
         '<rect x="40" y="806" width="310" height="6" rx="3" fill="url(#pg3-temp)" stroke="#E9E0CD" stroke-width="0.5"/>',
         '<circle cx="245" cy="809" r="8" fill="#FFFFFF" stroke="#2F4A5A" stroke-width="1.5"/>',
         '<circle cx="245" cy="809" r="2.5" fill="#F2C979"/>',
         '<text x="40" y="826" font-family="MiSans" font-size="9" fill="#8AA0AB">暖黄 2700K</text>',
         '<text x="350" y="826" text-anchor="end" font-family="MiSans" font-size="9" fill="#8AA0AB">雪白 6000K</text>',
         '</g>',
         '</svg>',
    ]
    with open(os.path.join(OUT, "page-03-edit-v2.svg"), "w", encoding="utf-8") as f:
        f.write("\n".join(s))


write_page02()
write_page03()
print("done")
