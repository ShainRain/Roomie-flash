# -*- coding: utf-8 -*-
"""Roomie: page-04-character-v2.svg + page-05-postcard-v2.svg (390x844)。
无 transform / use / symbol，全部绝对坐标。房间小图复用 gen_hero.hero()。"""
import os

OUT = r"C:\Roomie\figma-assets"
os.makedirs(OUT, exist_ok=True)

# 复用 gen_hero.py 的 hero()（截取到 write_file1 定义之前，避免触发其文件写入）
_src = open(r"C:\Roomie\gen_hero.py", encoding="utf-8").read()
_ns = {}
exec(_src.split("def write_file1")[0], _ns)
hero = _ns["hero"]

BG, CREAM = "#F5F1E8", "#EADFCB"
DARK, TEAL, AMBER, CORAL, SOFA = "#2F4A5A", "#6D99A6", "#E6B15A", "#D96A4D", "#F7F3EA"
FLOOR = "#5F7887"
GRAY_T = "#8AA0AB"
HEADER = '<?xml version="1.0" encoding="UTF-8"?>\n'
INK = f' stroke="{DARK}" stroke-opacity="0.22" stroke-width="1.0"'


def status_bar():
    return [
        '<g id="Status Bar">',
        f'<text x="28" y="34" font-family="Inter" font-size="13" font-weight="600" fill="{DARK}">9:41</text>',
        f'<g fill="{DARK}" opacity="0.85">'
        '<rect x="300" y="24" width="3" height="7" rx="1"/><rect x="305" y="22" width="3" height="9" rx="1"/>'
        '<rect x="310" y="20" width="3" height="11" rx="1"/><rect x="315" y="18" width="3" height="13" rx="1"/></g>',
        f'<rect x="328" y="19" width="24" height="12" rx="3.5" fill="none" stroke="{DARK}" stroke-width="1"/>'
        f'<rect x="330" y="21" width="15" height="8" rx="2" fill="{DARK}"/>'
        f'<rect x="353.5" y="22.5" width="2.5" height="5" rx="1.2" fill="{DARK}"/>',
        '</g>',
    ]


def home_indicator():
    return f'<rect x="128" y="828" width="134" height="5" rx="2.5" fill="{DARK}" opacity="0.2"/>'


def vinyl(cx, cy, rx, ry):
    return (f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{DARK}"{INK}/>'
            f'<ellipse cx="{cx}" cy="{cy}" rx="{rx*0.62:.1f}" ry="{ry*0.62:.1f}" fill="none" '
            f'stroke="#1C2F3A" stroke-opacity="0.45" stroke-width="1"/>'
            f'<ellipse cx="{cx}" cy="{cy}" rx="{rx*0.28:.1f}" ry="{ry*0.28:.1f}" fill="{SOFA}"/>'
            f'<circle cx="{cx}" cy="{cy}" r="1" fill="{DARK}"/>')


# ============================================================ PAGE 04
def write_page04():
    s = [HEADER,
         '<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">',
         f'<rect width="390" height="844" fill="{BG}"/>']
    s += status_bar()

    # ---------- 背景装饰 ----------
    s.append('<g id="Deco">')
    s.append(vinyl(48, 205, 26, 10))
    s.append(vinyl(348, 252, 18, 7))
    s.append(f'<circle cx="322" cy="86" r="3.5" fill="{AMBER}"/>')
    s.append(f'<rect x="55.8" y="112" width="2.4" height="16" fill="{TEAL}"/>'
             f'<rect x="49" y="118.8" width="16" height="2.4" fill="{TEAL}"/>')
    s.append(f'<circle cx="356" cy="150" r="2.5" fill="{CORAL}"/>')
    s.append('</g>')

    # ---------- Header ----------
    s += ['<g id="Header">',
          f'<text x="24" y="86" font-family="MiSans Semibold" font-size="26" fill="{DARK}">角色展台</text>',
          f'<text x="25" y="110" font-family="Inter" font-size="12" font-weight="600" '
          f'letter-spacing="3" fill="#7C93A0">CHARACTER STAGE</text>',
          '</g>']

    # ---------- Stage ----------
    s.append('<g id="Stage">')
    # 虚线旋转环（在展台后层，左右弧段露出）
    s.append(f'<ellipse cx="195" cy="330" rx="104" ry="48" fill="none" stroke="{DARK}" '
             f'stroke-opacity="0.35" stroke-width="1.5" stroke-dasharray="5 8"/>')
    # 台身（地板蓝灰圆柱体，正面可见半弧）
    s.append(f'<path d="M107,330 L107,364 A88,40 0 0 0 283,364 L283,330 Z" fill="{FLOOR}"{INK}/>')
    s.append(f'<path d="M107,364 A88,40 0 0 0 283,364" fill="none" stroke="#4E6675" '
             f'stroke-width="1" stroke-opacity="0.6"/>')
    s.append(f'<line x1="107" y1="330" x2="107" y2="364" stroke="#4E6675" stroke-width="1" stroke-opacity="0.6"/>')
    s.append(f'<line x1="283" y1="330" x2="283" y2="364" stroke="#4E6675" stroke-width="1" stroke-opacity="0.6"/>')
    # 台面（Cream）
    s.append(f'<ellipse cx="195" cy="330" rx="88" ry="40" fill="{CREAM}"{INK}/>')
    s.append(f'<ellipse cx="195" cy="330" rx="74" ry="33" fill="none" stroke="#D8CBAE" stroke-width="1"/>')
    # 琥珀色旋转方向弧（前弧 30°->150°，箭头在左端）
    s.append(f'<path d="M285.1,354.0 A104,48 0 0 1 104.9,354.0" fill="none" stroke="{AMBER}" '
             f'stroke-width="4" stroke-linecap="round"/>')
    s.append(f'<polygon points="97.9,348.4 107.5,350.7 102.3,357.3" fill="{AMBER}"/>')
    # ---------- Character ----------
    s.append('<g id="Character">')
    s.append(f'<ellipse cx="196" cy="338" rx="25" ry="8" fill="#C9BBA0" opacity="0.8"/>')
    # 斗篷（正面微侧，下摆弧线）
    s.append(f'<path d="M171,336 L169,298 Q169,276 187,270 Q195,267 203,270 Q221,276 221,298 '
             f'L219,336 Q195,343 171,336 Z" fill="{DARK}" stroke="{DARK}" stroke-opacity="0.3" stroke-width="1"/>')
    # 兜帽
    s.append(f'<path d="M181,274 Q178,250 196,246 Q213,243 216,260 Q218,272 208,278 L186,279 Z" '
             f'fill="{DARK}" stroke="{DARK}" stroke-opacity="0.3" stroke-width="1"/>')
    # 帽口（无五官深色内衬）
    s.append(f'<path d="M189,272 Q187,258 197,255 Q208,253 210,263 Q211,271 204,275 L191,275 Z" fill="#263D4B"/>')
    # 条纹围巾：颈带 3 段
    s.append(f'<polygon points="180,280 194,278 195,286 181,288" fill="{CORAL}" stroke="{DARK}" '
             f'stroke-opacity="0.25" stroke-width="0.8"/>')
    s.append(f'<polygon points="194,278 207,277 208,285 195,286" fill="{SOFA}" stroke="{DARK}" '
             f'stroke-opacity="0.25" stroke-width="0.8"/>')
    s.append(f'<polygon points="207,277 220,279 219,287 208,285" fill="{CORAL}" stroke="{DARK}" '
             f'stroke-opacity="0.25" stroke-width="0.8"/>')
    # 围巾尾巴 2 段
    s.append(f'<polygon points="183,287 189,290 183,310 177,307" fill="{CORAL}" stroke="{DARK}" '
             f'stroke-opacity="0.25" stroke-width="0.8"/>')
    s.append(f'<polygon points="177,307 183,310 179,322 173,319" fill="{SOFA}" stroke="{DARK}" '
             f'stroke-opacity="0.25" stroke-width="0.8"/>')
    s.append('</g>')  # Character
    s.append('</g>')  # Stage

    # ---------- 名字行 ----------
    s.append('<g id="Name">'
             f'<text x="122" y="434" font-family="Inter" font-size="15" font-weight="600" fill="{DARK}">MOMO · LV.7</text>'
             f'<text x="230" y="434" font-family="MiSans Semibold" font-size="13" fill="{DARK}">建筑师</text>'
             '</g>')
    s.append(f'<text x="195" y="460" text-anchor="middle" font-family="MiSans" font-size="11" '
             f'fill="{GRAY_T}">今天想用哪个姿态招待朋友？</text>')

    # ---------- Pose Grid ----------
    def limb(d):
        return f'<path d="{d}" fill="none" stroke="{DARK}" stroke-width="3.2" stroke-linecap="round"/>'

    def pose_walk(cx, cy):
        return (f'<circle cx="{cx-2}" cy="{cy-13}" r="4.5" fill="{DARK}"/>'
                + limb(f'M{cx-2},{cy-8} L{cx-1},{cy+3} M{cx-2},{cy-5} L{cx-9},{cy+1} '
                       f'M{cx-1},{cy-5} L{cx+6},{cy-9} M{cx-1},{cy+3} L{cx-7},{cy+14} M{cx-1},{cy+3} L{cx+7},{cy+12}'))

    def pose_sit(cx, cy):
        return (f'<circle cx="{cx-7}" cy="{cy-11}" r="4.5" fill="{DARK}"/>'
                + limb(f'M{cx-9},{cy-6} L{cx-9},{cy+5} L{cx+5},{cy+5} L{cx+5},{cy+14} '
                       f'M{cx-8},{cy-4} L{cx+1},{cy+2}'))

    def pose_window(cx, cy):
        return (f'<rect x="{cx+1}" y="{cy-15}" width="17" height="19" rx="2" fill="none" '
                f'stroke="{DARK}" stroke-width="2.5"/>'
                f'<line x1="{cx+9.5}" y1="{cy-15}" x2="{cx+9.5}" y2="{cy+4}" stroke="{DARK}" stroke-width="1.5"/>'
                f'<line x1="{cx+1}" y1="{cy-5.5}" x2="{cx+18}" y2="{cy-5.5}" stroke="{DARK}" stroke-width="1.5"/>'
                f'<circle cx="{cx+14}" cy="{cy-11}" r="1.2" fill="{AMBER}"/>'
                f'<circle cx="{cx-9}" cy="{cy-4}" r="4.2" fill="{DARK}"/>'
                + limb(f'M{cx-9},{cy+1} L{cx-9},{cy+14}'))

    def pose_cat(cx, cy):
        return (f'<circle cx="{cx-10}" cy="{cy-8}" r="4.5" fill="{DARK}"/>'
                + limb(f'M{cx-10},{cy-3} L{cx-10},{cy+9} M{cx-10},{cy-1} L{cx-1},{cy+3}')
                + f'<ellipse cx="{cx+8}" cy="{cy+9}" rx="7" ry="4.5" fill="{DARK}"/>'
                  f'<circle cx="{cx+13}" cy="{cy+4}" r="3.6" fill="{DARK}"/>'
                  f'<polygon points="{cx+10.5},{cy+2} {cx+11.8},{cy-2.5} {cx+13.2},{cy+1}" fill="{DARK}"/>'
                  f'<polygon points="{cx+13.8},{cy+1} {cx+15.4},{cy-2.5} {cx+16.4},{cy+2}" fill="{DARK}"/>'
                  f'<path d="M{cx+1},{cy+9} Q{cx-2},{cy+4} {cx+2},{cy+2}" fill="none" stroke="{DARK}" '
                  f'stroke-width="2" stroke-linecap="round"/>')

    def pose_vinyl(cx, cy):
        return (f'<circle cx="{cx+7}" cy="{cy+3}" r="10" fill="{DARK}"/>'
                f'<circle cx="{cx+7}" cy="{cy+3}" r="6" fill="none" stroke="{FLOOR}" stroke-width="1"/>'
                f'<circle cx="{cx+7}" cy="{cy+3}" r="3" fill="{SOFA}"/>'
                f'<circle cx="{cx+7}" cy="{cy+3}" r="0.9" fill="{DARK}"/>'
                f'<circle cx="{cx-10}" cy="{cy-5}" r="4.5" fill="{DARK}"/>'
                + limb(f'M{cx-10},{cy} L{cx-10},{cy+12}')
                + f'<path d="M{cx-14.5},{cy-5} A4.8,4.8 0 0 1 {cx-5.5},{cy-5}" fill="none" '
                  f'stroke="{CORAL}" stroke-width="2" stroke-linecap="round"/>')

    def pose_hug(cx, cy):
        return (f'<path d="M{cx-3},{cy+12} Q{cx-14},{cy+12} {cx-13},{cy+2} Q{cx-12},{cy-5} {cx-7},{cy-4} '
                f'Q{cx-2},{cy-3} {cx-3},{cy+12} Z" fill="{DARK}"/>'
                f'<path d="M{cx+3},{cy+12} Q{cx+14},{cy+12} {cx+13},{cy+2} Q{cx+12},{cy-5} {cx+7},{cy-4} '
                f'Q{cx+2},{cy-3} {cx+3},{cy+12} Z" fill="{DARK}"/>'
                f'<circle cx="{cx-8}" cy="{cy-9}" r="4" fill="{DARK}"/>'
                f'<circle cx="{cx+8}" cy="{cy-9}" r="4" fill="{DARK}"/>'
                f'<path d="M{cx-10},{cy+2} Q{cx},{cy+6} {cx+10},{cy+2}" fill="none" stroke="{SOFA}" '
                f'stroke-width="2" stroke-linecap="round"/>')

    def pose_wave(cx, cy):
        return (f'<circle cx="{cx-1}" cy="{cy-12}" r="4.5" fill="{DARK}"/>'
                + limb(f'M{cx-1},{cy-7} L{cx-1},{cy+4} M{cx-1},{cy+4} L{cx-6},{cy+14} '
                       f'M{cx-1},{cy+4} L{cx+4},{cy+14} M{cx-1},{cy-4} L{cx-8},{cy+2} M{cx-1},{cy-4} L{cx+7},{cy-13}')
                + f'<circle cx="{cx+7}" cy="{cy-13}" r="2.2" fill="{DARK}"/>'
                  f'<path d="M{cx+11},{cy-15} A7,7 0 0 1 {cx+14},{cy-9}" fill="none" stroke="{CORAL}" '
                  f'stroke-width="1.6" stroke-linecap="round"/>'
                  f'<path d="M{cx+14},{cy-18} A11,11 0 0 1 {cx+18},{cy-10}" fill="none" stroke="{CORAL}" '
                  f'stroke-width="1.6" stroke-linecap="round"/>')

    def pose_highfive(cx, cy):
        return (f'<circle cx="{cx-11}" cy="{cy-6}" r="3.8" fill="{DARK}"/>'
                f'<circle cx="{cx+11}" cy="{cy-6}" r="3.8" fill="{DARK}"/>'
                + limb(f'M{cx-11},{cy-1} L{cx-13},{cy+13} M{cx+11},{cy-1} L{cx+13},{cy+13} '
                       f'M{cx-10},{cy-2} L{cx-2},{cy-10} M{cx+10},{cy-2} L{cx+2},{cy-10}')
                + f'<path d="M{cx},{cy-18} L{cx},{cy-14.5} M{cx-5.5},{cy-15.5} L{cx-3.5},{cy-13.5} '
                  f'M{cx+5.5},{cy-15.5} L{cx+3.5},{cy-13.5}" fill="none" stroke="{AMBER}" '
                  f'stroke-width="2" stroke-linecap="round"/>')

    def pose_coffee(cx, cy):
        return (f'<path d="M{cx-9},{cy-3} L{cx-9},{cy+7} Q{cx-9},{cy+11} {cx-5},{cy+11} L{cx+3},{cy+11} '
                f'Q{cx+7},{cy+11} {cx+7},{cy+7} L{cx+7},{cy-3} Z" fill="none" stroke="{DARK}" '
                f'stroke-width="2.5" stroke-linejoin="round"/>'
                f'<path d="M{cx+7},{cy} Q{cx+13},{cy+2} {cx+7},{cy+5}" fill="none" stroke="{DARK}" stroke-width="2.5"/>'
                f'<line x1="{cx-12}" y1="{cy+14.5}" x2="{cx+10}" y2="{cy+14.5}" stroke="{DARK}" '
                f'stroke-width="2" stroke-linecap="round"/>'
                f'<path d="M{cx-4},{cy-6} q2,-3 0,-6 M{cx+2},{cy-6} q2,-3 0,-6" fill="none" stroke="{CORAL}" '
                f'stroke-width="2" stroke-linecap="round"/>')

    poses = [(pose_walk, "行走"), (pose_sit, "坐下"), (pose_window, "望窗外"),
             (pose_cat, "摸猫"), (pose_vinyl, "听黑胶"), (pose_hug, "拥抱"),
             (pose_wave, "挥手"), (pose_highfive, "击掌"), (pose_coffee, "请喝咖啡")]
    s.append('<g id="Pose Grid">')
    xs = [79, 195, 311]
    ys = [505, 593, 681]
    for i, (fn, label) in enumerate(poses):
        cx, cy = xs[i % 3], ys[i // 3]
        s.append(f'<g id="Pose {label}">'
                 f'<circle cx="{cx}" cy="{cy}" r="31" fill="{SOFA}" stroke="#E9E0CD" stroke-width="1"/>'
                 + fn(cx, cy)
                 + f'<text x="{cx}" y="{cy+45}" text-anchor="middle" font-family="MiSans" '
                   f'font-size="10.5" fill="{GRAY_T}">{label}</text>'
                 '</g>')
    s.append('</g>')

    # ---------- Actions ----------
    s += ['<g id="Actions">',
          f'<text x="195" y="758" text-anchor="middle" font-family="MiSans" font-size="11" '
          f'fill="{GRAY_T}">和好友一起看同一部电影</text>',
          f'<rect x="45" y="770" width="300" height="48" rx="24" fill="{DARK}"/>',
          f'<text x="195" y="800" text-anchor="middle" font-family="MiSans Semibold" font-size="15" '
          f'fill="#FFFFFF">邀请好友来家里</text>',
          home_indicator(),
          '</g>',
          '</svg>']
    with open(os.path.join(OUT, "page-04-character-v2.svg"), "w", encoding="utf-8") as f:
        f.write("\n".join(s))


# ============================================================ PAGE 05
def write_page05():
    k, tx, ty = 0.5, 15.0, 148.0
    extra = ('<filter id="pg5-cardShadow" x="-20%" y="-20%" width="140%" height="160%">'
             '<feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="#2F4A5A" flood-opacity="0.12"/></filter>'
             '<clipPath id="pg5-photoClip"><rect x="61" y="184" width="268" height="268" rx="4"/></clipPath>')
    defs, art = hero(k, tx, ty, "pg5", extra)

    s = [HEADER,
         '<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">',
         defs,
         f'<rect width="390" height="844" fill="{BG}"/>']
    s += status_bar()

    # ---------- Header ----------
    s += ['<g id="Header">',
          f'<text x="45" y="98" font-family="MiSans Semibold" font-size="22" fill="{DARK}">建筑明信片</text>',
          f'<text x="46" y="120" font-family="Inter" font-size="11" font-weight="600" '
          f'letter-spacing="2.5" fill="#7C93A0">POSTCARD FROM MY ROOM</text>',
          '</g>']

    # ---------- Postcard ----------
    s.append('<g id="Postcard">')
    s.append(f'<rect x="45" y="168" width="300" height="380" rx="8" fill="{SOFA}" filter="url(#pg5-cardShadow)"/>')
    s.append('<g id="Room Artwork" clip-path="url(#pg5-photoClip)">')
    s.append(f'<rect x="61" y="184" width="268" height="268" fill="{BG}"/>')
    s.append(art)
    s.append('</g>')
    s.append('<rect x="61" y="184" width="268" height="268" rx="4" fill="none" stroke="#E9E0CD" stroke-width="1"/>')
    # 手写感一行
    s.append(f'<text x="195" y="512" text-anchor="middle" font-family="MiSans" font-size="14.5" '
             f'fill="{DARK}">有音乐的房间，抵千万句寒暄。</text>')
    s.append(f'<line x1="165" y1="526" x2="225" y2="526" stroke="{CORAL}" stroke-width="1.5" '
             f'stroke-linecap="round" opacity="0.6"/>')
    s.append('</g>')

    # ---------- Room ID 小票牌（压在明信片右上角） ----------
    s.append('<g id="Room ID">')
    s.append(f'<rect x="233" y="142" width="120" height="34" rx="8" fill="{SOFA}" stroke="{DARK}" stroke-width="1.5"/>')
    s.append(f'<rect x="238" y="147" width="110" height="24" rx="5" fill="none" stroke="{DARK}" '
             f'stroke-opacity="0.5" stroke-width="0.75" stroke-dasharray="3 3"/>')
    s.append(f'<text x="293" y="163" text-anchor="middle" font-family="Inter" font-size="11" '
             f'font-weight="600" fill="{DARK}">ROOM ID 0731</text>')
    s.append('</g>')

    # ---------- Actions ----------
    s += ['<g id="Actions">',
          f'<rect x="45" y="632" width="144" height="48" rx="24" fill="{DARK}"/>',
          f'<text x="117" y="662" text-anchor="middle" font-family="MiSans Semibold" font-size="14" '
          f'fill="#FFFFFF">保存图片</text>',
          f'<rect x="201" y="632" width="144" height="48" rx="24" fill="none" stroke="{DARK}" stroke-width="1.5"/>',
          f'<text x="273" y="662" text-anchor="middle" font-family="MiSans Semibold" font-size="14" '
          f'fill="{DARK}">分享给好友</text>',
          '</g>']

    # ---------- Footer ----------
    s += ['<g id="Footer">',
          vinyl(64, 778, 24, 9),
          f'<circle cx="340" cy="786" r="4" fill="{AMBER}"/>',
          f'<rect x="350.8" y="598" width="2.4" height="14" fill="{TEAL}"/>'
          f'<rect x="345" y="603.8" width="14" height="2.4" fill="{TEAL}"/>',
          f'<text x="195" y="736" text-anchor="middle" font-family="MiSans" font-size="11" '
          f'fill="{GRAY_T}">一间安静的放映室 · Roomie</text>',
          home_indicator(),
          '</g>',
          '</svg>']
    with open(os.path.join(OUT, "page-05-postcard-v2.svg"), "w", encoding="utf-8") as f:
        f.write("\n".join(s))


write_page04()
write_page05()
print("done")
