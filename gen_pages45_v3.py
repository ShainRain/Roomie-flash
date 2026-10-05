# -*- coding: utf-8 -*-
# Roomie page-04 / page-05 v3 — QQ Music design language
# page-04: pure vector; page-05: embeds hero-art-1080.png as base64
import base64, os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "figma-assets")

GREEN = "#31C27C"
INK = "#1D2120"
SUB = "#8A8F8C"
LINE = "#ECECEC"
BG = "#F7F6F2"
NAVY = "#2F4A5A"
NAVY_D = "#263D4B"
SLATE = "#5F7887"
AMBER = "#E6B15A"
CORAL = "#D96A4D"
CREAM = "#F7F3EA"

STATUS_BAR = f'''<g id="Status Bar">
<text x="28" y="34" font-family="Inter" font-size="13" font-weight="600" fill="{INK}">9:41</text>
<g fill="{INK}" opacity="0.85"><rect x="300" y="24" width="3" height="7" rx="1"/><rect x="305" y="22" width="3" height="9" rx="1"/><rect x="310" y="20" width="3" height="11" rx="1"/><rect x="315" y="18" width="3" height="13" rx="1"/></g>
<rect x="328" y="19" width="24" height="12" rx="3.5" fill="none" stroke="{INK}" stroke-width="1"/><rect x="330" y="21" width="15" height="8" rx="2" fill="{INK}"/><rect x="353.5" y="22.5" width="2.5" height="5" rx="1.2" fill="{INK}"/>
</g>'''

HOME_IND = f'<rect x="128" y="826" width="134" height="5" rx="2.5" fill="{INK}" opacity="0.2"/>'

# ---------------------------------------------------------------- page 04

def pose_walk(cx, cy):
    return (f'<circle cx="{cx-2}" cy="{cy-13}" r="4.5" fill="{NAVY}"/>'
            f'<path d="M{cx-2},{cy-8} L{cx-1},{cy+3} M{cx-2},{cy-5} L{cx-9},{cy+1} M{cx-1},{cy-5} L{cx+6},{cy-9} M{cx-1},{cy+3} L{cx-7},{cy+14} M{cx-1},{cy+3} L{cx+7},{cy+12}" fill="none" stroke="{NAVY}" stroke-width="3.2" stroke-linecap="round"/>')

def pose_sit(cx, cy):
    return (f'<circle cx="{cx-7}" cy="{cy-11}" r="4.5" fill="{NAVY}"/>'
            f'<path d="M{cx-9},{cy-6} L{cx-9},{cy+5} L{cx+5},{cy+5} L{cx+5},{cy+14} M{cx-8},{cy-4} L{cx+1},{cy+2}" fill="none" stroke="{NAVY}" stroke-width="3.2" stroke-linecap="round"/>')

def pose_window(cx, cy):
    return (f'<rect x="{cx+1}" y="{cy-15}" width="17" height="19" rx="2" fill="none" stroke="{NAVY}" stroke-width="2.5"/>'
            f'<line x1="{cx+9.5}" y1="{cy-15}" x2="{cx+9.5}" y2="{cy+4}" stroke="{NAVY}" stroke-width="1.5"/>'
            f'<line x1="{cx+1}" y1="{cy-5.5}" x2="{cx+18}" y2="{cy-5.5}" stroke="{NAVY}" stroke-width="1.5"/>'
            f'<circle cx="{cx+14}" cy="{cy-11}" r="1.2" fill="{AMBER}"/>'
            f'<circle cx="{cx-9}" cy="{cy-4}" r="4.2" fill="{NAVY}"/>'
            f'<path d="M{cx-9},{cy+1} L{cx-9},{cy+14}" fill="none" stroke="{NAVY}" stroke-width="3.2" stroke-linecap="round"/>')

def pose_cat(cx, cy):
    return (f'<circle cx="{cx-10}" cy="{cy-8}" r="4.5" fill="{NAVY}"/>'
            f'<path d="M{cx-10},{cy-3} L{cx-10},{cy+9} M{cx-10},{cy-1} L{cx-1},{cy+3}" fill="none" stroke="{NAVY}" stroke-width="3.2" stroke-linecap="round"/>'
            f'<ellipse cx="{cx+8}" cy="{cy+9}" rx="7" ry="4.5" fill="{NAVY}"/>'
            f'<circle cx="{cx+13}" cy="{cy+4}" r="3.6" fill="{NAVY}"/>'
            f'<polygon points="{cx+10.5},{cy+2} {cx+11.8},{cy-2.5} {cx+13.2},{cy+1}" fill="{NAVY}"/>'
            f'<polygon points="{cx+13.8},{cy+1} {cx+15.4},{cy-2.5} {cx+16.4},{cy+2}" fill="{NAVY}"/>'
            f'<path d="M{cx+1},{cy+9} Q{cx-2},{cy+4} {cx+2},{cy+2}" fill="none" stroke="{NAVY}" stroke-width="2" stroke-linecap="round"/>')

def pose_vinyl(cx, cy):
    return (f'<circle cx="{cx+7}" cy="{cy+3}" r="10" fill="{NAVY}"/>'
            f'<circle cx="{cx+7}" cy="{cy+3}" r="6" fill="none" stroke="{SLATE}" stroke-width="1"/>'
            f'<circle cx="{cx+7}" cy="{cy+3}" r="3" fill="{GREEN}"/>'
            f'<circle cx="{cx+7}" cy="{cy+3}" r="0.9" fill="{NAVY}"/>'
            f'<circle cx="{cx-10}" cy="{cy-5}" r="4.5" fill="{NAVY}"/>'
            f'<path d="M{cx-10},{cy} L{cx-10},{cy+12}" fill="none" stroke="{NAVY}" stroke-width="3.2" stroke-linecap="round"/>'
            f'<path d="M{cx-14.5},{cy-5} A4.8,4.8 0 0 1 {cx-5.5},{cy-5}" fill="none" stroke="{CORAL}" stroke-width="2" stroke-linecap="round"/>')

def pose_hug(cx, cy):
    return (f'<path d="M{cx-3},{cy+12} Q{cx-14},{cy+12} {cx-13},{cy+2} Q{cx-12},{cy-5} {cx-7},{cy-4} Q{cx-2},{cy-3} {cx-3},{cy+12} Z" fill="{NAVY}"/>'
            f'<path d="M{cx+3},{cy+12} Q{cx+14},{cy+12} {cx+13},{cy+2} Q{cx+12},{cy-5} {cx+7},{cy-4} Q{cx+2},{cy-3} {cx+3},{cy+12} Z" fill="{NAVY}"/>'
            f'<circle cx="{cx-8}" cy="{cy-9}" r="4" fill="{NAVY}"/>'
            f'<circle cx="{cx+8}" cy="{cy-9}" r="4" fill="{NAVY}"/>'
            f'<path d="M{cx-10},{cy+2} Q{cx},{cy+6} {cx+10},{cy+2}" fill="none" stroke="{CORAL}" stroke-width="2" stroke-linecap="round"/>')

def pose_wave(cx, cy):
    return (f'<circle cx="{cx-1}" cy="{cy-12}" r="4.5" fill="{NAVY}"/>'
            f'<path d="M{cx-1},{cy-7} L{cx-1},{cy+4} M{cx-1},{cy+4} L{cx-6},{cy+14} M{cx-1},{cy+4} L{cx+4},{cy+14} M{cx-1},{cy-4} L{cx-8},{cy+2} M{cx-1},{cy-4} L{cx+7},{cy-13}" fill="none" stroke="{NAVY}" stroke-width="3.2" stroke-linecap="round"/>'
            f'<circle cx="{cx+7}" cy="{cy-13}" r="2.2" fill="{NAVY}"/>'
            f'<path d="M{cx+11},{cy-15} A7,7 0 0 1 {cx+14},{cy-9}" fill="none" stroke="{CORAL}" stroke-width="1.6" stroke-linecap="round"/>'
            f'<path d="M{cx+14},{cy-18} A11,11 0 0 1 {cx+18},{cy-10}" fill="none" stroke="{CORAL}" stroke-width="1.6" stroke-linecap="round"/>')

def pose_highfive(cx, cy):
    return (f'<circle cx="{cx-11}" cy="{cy-6}" r="3.8" fill="{NAVY}"/>'
            f'<circle cx="{cx+11}" cy="{cy-6}" r="3.8" fill="{NAVY}"/>'
            f'<path d="M{cx-11},{cy-1} L{cx-13},{cy+13} M{cx+11},{cy-1} L{cx+13},{cy+13} M{cx-10},{cy-2} L{cx-2},{cy-10} M{cx+10},{cy-2} L{cx+2},{cy-10}" fill="none" stroke="{NAVY}" stroke-width="3.2" stroke-linecap="round"/>'
            f'<path d="M{cx},{cy-18} L{cx},{cy-14.5} M{cx-5.5},{cy-15.5} L{cx-3.5},{cy-13.5} M{cx+5.5},{cy-15.5} L{cx+3.5},{cy-13.5}" fill="none" stroke="{AMBER}" stroke-width="2" stroke-linecap="round"/>')

def pose_coffee(cx, cy):
    return (f'<path d="M{cx-9},{cy-3} L{cx-9},{cy+7} Q{cx-9},{cy+11} {cx-5},{cy+11} L{cx+3},{cy+11} Q{cx+7},{cy+11} {cx+7},{cy+7} L{cx+7},{cy-3} Z" fill="none" stroke="{NAVY}" stroke-width="2.5" stroke-linejoin="round"/>'
            f'<path d="M{cx+7},{cy} Q{cx+13},{cy+2} {cx+7},{cy+5}" fill="none" stroke="{NAVY}" stroke-width="2.5"/>'
            f'<line x1="{cx-12}" y1="{cy+14.5}" x2="{cx+10}" y2="{cy+14.5}" stroke="{NAVY}" stroke-width="2" stroke-linecap="round"/>'
            f'<path d="M{cx-4},{cy-6} q2,-3 0,-6 M{cx+2},{cy-6} q2,-3 0,-6" fill="none" stroke="{CORAL}" stroke-width="2" stroke-linecap="round"/>')

POSES = [
    ("行走", pose_walk), ("坐下", pose_sit), ("望窗外", pose_window),
    ("摸猫", pose_cat), ("听黑胶", pose_vinyl), ("拥抱", pose_hug),
    ("挥手", pose_wave), ("击掌", pose_highfive), ("请喝咖啡", pose_coffee),
]

def gen_page04():
    grid = []
    cols = [75, 195, 315]
    rows = [428, 530, 632]
    for i, (label, fn) in enumerate(POSES):
        cx = cols[i % 3]
        cy_card = rows[i // 3]
        x = cx - 51
        cy_icon = cy_card + 34
        grid.append(f'<g id="Pose {label}">'
                    f'<rect x="{x}" y="{cy_card}" width="102" height="86" rx="16" fill="#FFFFFF"/>'
                    + fn(cx, cy_icon) +
                    f'<text x="{cx}" y="{cy_card+70}" text-anchor="middle" font-family="MiSans" font-size="10.5" fill="{SUB}">{label}</text></g>')
    grid_svg = "\n".join(grid)

    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">
<defs>
<filter id="q4-greenShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="{GREEN}" flood-opacity="0.25"/></filter>
</defs>
<rect width="390" height="844" fill="{BG}"/>
{STATUS_BAR}
<g id="Deco">
<circle cx="338" cy="120" r="3.5" fill="{AMBER}"/>
<rect x="55.8" y="128" width="2.4" height="14" fill="{GREEN}" opacity="0.6"/><rect x="50" y="133.8" width="14" height="2.4" fill="{GREEN}" opacity="0.6"/>
<circle cx="356" cy="160" r="2.5" fill="{CORAL}"/>
</g>
<g id="Header">
<text x="24" y="86" font-family="MiSans Semibold" font-size="26" fill="{INK}">角色展台</text>
<text x="25" y="108" font-family="Inter" font-size="11" font-weight="600" letter-spacing="3" fill="{SUB}">CHARACTER STAGE</text>
</g>
<g id="Stage">
<ellipse cx="195" cy="296" rx="104" ry="46" fill="none" stroke="{GREEN}" stroke-opacity="0.55" stroke-width="1.5" stroke-dasharray="5 8"/>
<path d="M107,296 L107,330 A88,40 0 0 0 283,330 L283,296 Z" fill="#EAEBE8"/>
<path d="M107,330 A88,40 0 0 0 283,330" fill="none" stroke="#D5D8D4" stroke-width="1"/>
<line x1="107" y1="296" x2="107" y2="330" stroke="#D5D8D4" stroke-width="1"/>
<line x1="283" y1="296" x2="283" y2="330" stroke="#D5D8D4" stroke-width="1"/>
<ellipse cx="195" cy="296" rx="88" ry="40" fill="#FFFFFF" stroke="#E6E7E4" stroke-width="1"/>
<ellipse cx="195" cy="296" rx="74" ry="33" fill="none" stroke="#EFEFEC" stroke-width="1"/>
<path d="M283.7,320 A104,46 0 0 1 106.3,320" fill="none" stroke="{AMBER}" stroke-width="4" stroke-linecap="round"/>
<polygon points="99.4,314.4 109.0,316.7 103.8,323.3" fill="{AMBER}"/>
<g id="Character">
<ellipse cx="196" cy="304" rx="25" ry="8" fill="#D8DAD4" opacity="0.8"/>
<path d="M171,302 L169,264 Q169,242 187,236 Q195,233 203,236 Q221,242 221,264 L219,302 Q195,309 171,302 Z" fill="{NAVY}" stroke="{NAVY}" stroke-opacity="0.3" stroke-width="1"/>
<path d="M181,240 Q178,216 196,212 Q213,209 216,226 Q218,238 208,244 L186,245 Z" fill="{NAVY}" stroke="{NAVY}" stroke-opacity="0.3" stroke-width="1"/>
<path d="M189,238 Q187,224 197,221 Q208,219 210,229 Q211,237 204,241 L191,241 Z" fill="{NAVY_D}"/>
<polygon points="180,246 194,244 195,252 181,254" fill="{CORAL}" stroke="{NAVY}" stroke-opacity="0.25" stroke-width="0.8"/>
<polygon points="194,244 207,243 208,251 195,252" fill="{CREAM}" stroke="{NAVY}" stroke-opacity="0.25" stroke-width="0.8"/>
<polygon points="207,243 220,245 219,253 208,251" fill="{CORAL}" stroke="{NAVY}" stroke-opacity="0.25" stroke-width="0.8"/>
<polygon points="183,253 189,256 183,276 177,273" fill="{CORAL}" stroke="{NAVY}" stroke-opacity="0.25" stroke-width="0.8"/>
<polygon points="177,273 183,276 179,288 173,285" fill="{CREAM}" stroke="{NAVY}" stroke-opacity="0.25" stroke-width="0.8"/>
</g>
</g>
<g id="Name">
<text x="118" y="388" font-family="Inter" font-size="15" font-weight="600" fill="{INK}">MOMO · LV.7</text>
<text x="232" y="388" font-family="MiSans Semibold" font-size="13" fill="{INK}">建筑师</text>
</g>
<text x="195" y="412" text-anchor="middle" font-family="MiSans" font-size="11" fill="{SUB}">今天想用哪个姿态招待朋友？</text>
<g id="Pose Grid">
{grid_svg}
</g>
<g id="Actions">
<text x="195" y="736" text-anchor="middle" font-family="MiSans" font-size="11" fill="{SUB}">和好友一起看同一部电影</text>
<rect x="45" y="750" width="300" height="48" rx="24" fill="{GREEN}" filter="url(#q4-greenShadow)"/>
<text x="195" y="780" text-anchor="middle" font-family="MiSans Semibold" font-size="15" fill="#FFFFFF">邀请好友来家里</text>
{HOME_IND}
</g>
</svg>'''
    p = os.path.join(OUT, "page-04-character-v3.svg")
    with open(p, "w", encoding="utf-8") as f:
        f.write(svg)
    print("wrote", p, len(svg), "bytes")

# ---------------------------------------------------------------- page 05

def gen_page05():
    png = os.path.join(OUT, "hero-art-1080.png")
    with open(png, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")

    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">
<defs>
<clipPath id="q5-photoClip"><rect x="61" y="182" width="268" height="268" rx="4"/></clipPath>
<filter id="q5-cardShadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="{INK}" flood-opacity="0.08"/></filter>
<filter id="q5-greenShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="{GREEN}" flood-opacity="0.25"/></filter>
</defs>
<rect width="390" height="844" fill="{BG}"/>
{STATUS_BAR}
<g id="Header">
<text x="45" y="96" font-family="MiSans Semibold" font-size="22" fill="{INK}">建筑明信片</text>
<text x="46" y="118" font-family="Inter" font-size="11" font-weight="600" letter-spacing="2.5" fill="{SUB}">POSTCARD FROM MY ROOM</text>
</g>
<g id="Postcard">
<rect x="45" y="166" width="300" height="384" rx="8" fill="#FFFFFF" filter="url(#q5-cardShadow)"/>
<g id="Artwork" clip-path="url(#q5-photoClip)">
<image href="data:image/png;base64,{b64}" x="53" y="181.9" width="284" height="268.2" preserveAspectRatio="xMidYMid meet"/>
</g>
<rect x="61" y="182" width="268" height="268" rx="4" fill="none" stroke="#EFEFEC" stroke-width="1"/>
<text x="195" y="500" text-anchor="middle" font-family="MiSans" font-size="14.5" fill="#3A3F3D">有音乐的房间，抵千万句寒暄。</text>
<line x1="172" y1="516" x2="218" y2="516" stroke="{CORAL}" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>
</g>
<g id="Room ID">
<rect x="223" y="134" width="130" height="38" rx="8" fill="#FFFFFF" stroke="#DFE1DE" stroke-width="1.2"/>
<rect x="228" y="139" width="120" height="28" rx="5" fill="none" stroke="#C6CAC5" stroke-width="0.75" stroke-dasharray="3 3"/>
<text x="244" y="158" font-family="Inter" font-size="9.5" font-weight="600" letter-spacing="1" fill="{GREEN}">ROOM ID</text>
<text x="300" y="159" font-family="Inter" font-size="12" font-weight="600" fill="{INK}">0731</text>
</g>
<g id="Actions">
<rect x="45" y="596" width="144" height="48" rx="24" fill="{GREEN}" filter="url(#q5-greenShadow)"/>
<text x="117" y="626" text-anchor="middle" font-family="MiSans Semibold" font-size="14" fill="#FFFFFF">保存图片</text>
<rect x="201" y="596" width="144" height="48" rx="24" fill="#FFFFFF" stroke="#D8DAD6" stroke-width="1.2"/>
<text x="273" y="626" text-anchor="middle" font-family="MiSans Semibold" font-size="14" fill="{INK}">分享给好友</text>
</g>
<g id="Footer">
<circle cx="48" cy="700" r="3" fill="{AMBER}"/>
<rect x="337" y="694" width="2" height="12" fill="{GREEN}" opacity="0.6"/><rect x="332" y="699" width="12" height="2" fill="{GREEN}" opacity="0.6"/>
<text x="195" y="704" text-anchor="middle" font-family="MiSans" font-size="11" fill="{SUB}">一间安静的放映室 · Roomie</text>
{HOME_IND}
</g>
</svg>'''
    p = os.path.join(OUT, "page-05-postcard-v3.svg")
    with open(p, "w", encoding="utf-8") as f:
        f.write(svg)
    print("wrote", p, len(svg), "bytes")

if __name__ == "__main__":
    gen_page04()
    gen_page05()
