# -*- coding: utf-8 -*-
"""Generate Roomie v3 pages (QQ Music design language) with embedded hero-art-qq-1080.png."""
import base64, os

BASE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(BASE, "figma-assets")

with open(os.path.join(ASSETS, "hero-art-qq-1080.png"), "rb") as f:
    IMG = "data:image/png;base64," + base64.b64encode(f.read()).decode("ascii")

GREEN = "#31C27C"
GREEN_D = "#27A66B"
INK = "#1D2120"
SUB = "#8A8F8C"
NAVOFF = "#9AA09C"
LINE = "#ECECEC"
BG = "#FFFFFF"
PAPER = "#FFFFFF"


def status_bar(color):
    return (
        '<g id="Status Bar">\n'
        f'<text x="28" y="34" font-family="Inter" font-size="13" font-weight="600" fill="{color}">9:41</text>\n'
        f'<g fill="{color}" opacity="0.85"><rect x="300" y="24" width="3" height="7" rx="1"/><rect x="305" y="22" width="3" height="9" rx="1"/><rect x="310" y="20" width="3" height="11" rx="1"/><rect x="315" y="18" width="3" height="13" rx="1"/></g>\n'
        f'<rect x="328" y="19" width="24" height="12" rx="3.5" fill="none" stroke="{color}" stroke-width="1"/><rect x="330" y="21" width="15" height="8" rx="2" fill="{color}"/><rect x="353.5" y="22.5" width="2.5" height="5" rx="1.2" fill="{color}"/>\n'
        '</g>'
    )


# ---------------------------------------------------------------- page 01
page01 = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">
<defs>
<clipPath id="q1-heroClip"><rect x="32" y="142" width="326" height="300" rx="16"/></clipPath>
<filter id="q1-cardShadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#1D2120" flood-opacity="0.07"/></filter>
<filter id="q1-greenShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#31C27C" flood-opacity="0.25"/></filter>
<filter id="q1-fabShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#31C27C" flood-opacity="0.35"/></filter>
</defs>
<rect width="390" height="844" fill="{BG}"/>
{status_bar(INK)}
<g id="Header">
<text x="24" y="88" font-family="Inter" font-size="28" font-weight="600" fill="{INK}">Roomie</text>
<text x="24" y="110" font-family="Inter" font-size="12" fill="{SUB}">Meet your people through music &amp; films</text>
</g>
<g id="Hero">
<rect x="16" y="126" width="358" height="372" rx="20" fill="#FFFFFF" filter="url(#q1-cardShadow)"/>
<g id="Hero Artwork" clip-path="url(#q1-heroClip)">
<image href="{IMG}" x="27" y="134" width="336" height="317.3" preserveAspectRatio="xMidYMid meet"/>
</g>
<text x="32" y="474" font-family="MiSans Semibold" font-size="14" fill="{INK}">晴天 · 周杰伦</text>
<text x="32" y="490" font-family="MiSans" font-size="10" fill="{SUB}">正在房间「深夜放映室」播放</text>
<circle cx="340" cy="470" r="17" fill="{GREEN}" filter="url(#q1-greenShadow)"/>
<polygon points="335,462 335,478 348,470" fill="#FFFFFF"/>
</g>
<g id="Feature Cards">
<g id="Card Discover">
<rect x="16" y="518" width="173" height="86" rx="16" fill="#F2FAF4"/>
<circle cx="52" cy="556" r="14" fill="none" stroke="{INK}" stroke-width="2"/>
<polygon points="57,551 47,561 52,566 62,556" fill="{GREEN}"/>
<circle cx="52" cy="556" r="2" fill="{INK}"/>
<text x="80" y="552" font-family="MiSans Semibold" font-size="14" fill="{INK}">发现房间</text>
<text x="80" y="572" font-family="MiSans" font-size="10.5" fill="{SUB}">遇见同频的人</text>
</g>
<g id="Card Cinema">
<rect x="201" y="518" width="173" height="86" rx="16" fill="#F2FAF4"/>
<rect x="222" y="544" width="30" height="22" rx="5" fill="none" stroke="{INK}" stroke-width="2"/>
<polygon points="233,549 233,561 243,555" fill="{GREEN}"/>
<text x="265" y="552" font-family="MiSans Semibold" font-size="14" fill="{INK}">一起放映</text>
<text x="265" y="572" font-family="MiSans" font-size="10.5" fill="{SUB}">同步看电影</text>
</g>
<g id="Card Shelf">
<rect x="16" y="616" width="173" height="86" rx="16" fill="#F2FAF4"/>
<rect x="38" y="646" width="7" height="24" rx="1.5" fill="{GREEN}"/>
<rect x="47" y="644" width="7" height="26" rx="1.5" fill="{INK}"/>
<polygon points="56,670 63,670 60,646 53,646" fill="{SUB}"/>
<text x="80" y="650" font-family="MiSans Semibold" font-size="14" fill="{INK}">兴趣书架</text>
<text x="80" y="670" font-family="MiSans" font-size="10.5" fill="{SUB}">收藏共同爱好</text>
</g>
<g id="Card Companion">
<rect x="201" y="616" width="173" height="86" rx="16" fill="#F2FAF4"/>
<path d="M228,648 L228,660 Q228,665 233,665 L245,665 Q250,665 250,660 L250,648 Z" fill="none" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>
<path d="M250,652 Q257,654 250,658" fill="none" stroke="{INK}" stroke-width="2"/>
<path d="M235,644 q2,-3 0,-6 M243,644 q2,-3 0,-6" fill="none" stroke="{GREEN}" stroke-width="2" stroke-linecap="round"/>
<text x="265" y="650" font-family="MiSans Semibold" font-size="14" fill="{INK}">今日陪伴</text>
<text x="265" y="670" font-family="MiSans" font-size="10.5" fill="{SUB}">有人在等你</text>
</g>
</g>
<g id="Bottom Nav">
<rect x="0" y="764" width="390" height="80" fill="#FFFFFF"/>
<line x1="0" y1="764" x2="390" y2="764" stroke="{LINE}" stroke-width="0.5"/>
<polygon points="28,790 39,780 50,790" fill="{GREEN}"/><rect x="32.5" y="789" width="13" height="12" fill="{GREEN}"/><rect x="36.5" y="794" width="5" height="7" fill="#FFFFFF"/>
<circle cx="117" cy="788" r="9.5" fill="none" stroke="{NAVOFF}" stroke-width="2"/><circle cx="117" cy="788" r="2.6" fill="{NAVOFF}"/>
<polygon points="268,794 268,801 274,794" fill="{NAVOFF}"/><rect x="264" y="781" width="18" height="14" rx="4" fill="none" stroke="{NAVOFF}" stroke-width="2"/>
<circle cx="351" cy="783" r="5" fill="none" stroke="{NAVOFF}" stroke-width="2"/><path d="M342.5,800 Q342.5,790.5 351,790.5 Q359.5,790.5 359.5,800" fill="none" stroke="{NAVOFF}" stroke-width="2" stroke-linecap="round"/>
<circle cx="195" cy="766" r="28" fill="{GREEN}" filter="url(#q1-fabShadow)"/>
<line x1="195" y1="758" x2="195" y2="774" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
<line x1="187" y1="766" x2="203" y2="766" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
<text x="39" y="816" text-anchor="middle" font-family="MiSans Semibold" font-size="10" fill="{GREEN}">首页</text>
<text x="117" y="816" text-anchor="middle" font-family="MiSans" font-size="10" fill="{NAVOFF}">房间</text>
<text x="195" y="816" text-anchor="middle" font-family="MiSans" font-size="10" fill="{NAVOFF}">创建</text>
<text x="273" y="816" text-anchor="middle" font-family="MiSans" font-size="10" fill="{NAVOFF}">消息</text>
<text x="351" y="816" text-anchor="middle" font-family="MiSans" font-size="10" fill="{NAVOFF}">我的</text>
<rect x="128" y="828" width="134" height="5" rx="2.5" fill="{INK}" opacity="0.2"/>
</g>
</svg>
'''

# ---------------------------------------------------------------- page 02
page02 = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">
<defs>
<linearGradient id="q2-topfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101B24" stop-opacity="0.6"/><stop offset="1" stop-color="#101B24" stop-opacity="0"/></linearGradient>
<radialGradient id="q2-screenglow"><stop offset="0" stop-color="#BFE3E6" stop-opacity="0.5"/><stop offset="1" stop-color="#BFE3E6" stop-opacity="0"/></radialGradient>
<filter id="q2-cardShadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="#0B151C" flood-opacity="0.35"/></filter>
<filter id="q2-greenShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#31C27C" flood-opacity="0.35"/></filter>
</defs>
<rect width="390" height="844" fill="#1C2E3A"/>
<g id="Artwork">
<image href="{IMG}" x="-251.8" y="0" width="893.6" height="844" preserveAspectRatio="xMidYMid meet"/>
<rect width="390" height="844" fill="#1C2E3A" opacity="0.16"/>
<ellipse cx="300" cy="255" rx="160" ry="130" fill="url(#q2-screenglow)"/>
</g>
<g id="Top Bar">
<rect x="0" y="0" width="390" height="120" fill="url(#q2-topfade)"/>
{status_bar(PAPER)}
<path d="M34,50 L24,58 L34,66" fill="none" stroke="{PAPER}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="131" y="42" width="128" height="32" rx="16" fill="{GREEN}" filter="url(#q2-greenShadow)"/>
<circle cx="148" cy="58" r="3.5" fill="#FFFFFF"/>
<text x="158" y="62" font-family="MiSans" font-size="11" fill="#FFFFFF">正在播放 · LIVE</text>
<g stroke="{PAPER}" stroke-width="1.6" fill="none"><line x1="349.6" y1="51.6" x2="356.4" y2="55.4"/><line x1="349.6" y1="64.4" x2="356.4" y2="60.6"/><circle cx="347" cy="49" r="2.6"/><circle cx="347" cy="67" r="2.6"/><circle cx="360" cy="58" r="2.6"/></g>
</g>
<g id="Mini Player">
<rect x="16" y="690" width="358" height="96" rx="20" fill="#FFFFFF" filter="url(#q2-cardShadow)"/>
<circle cx="60" cy="738" r="22" fill="{INK}"/>
<circle cx="60" cy="738" r="14" fill="none" stroke="#3A4340" stroke-width="1"/>
<circle cx="60" cy="738" r="7" fill="{GREEN}"/>
<circle cx="60" cy="738" r="1.6" fill="#FFFFFF"/>
<text x="96" y="726" font-family="MiSans Semibold" font-size="15" fill="{INK}">晴天</text>
<text x="96" y="744" font-family="MiSans" font-size="10.5" fill="{SUB}">周杰伦</text>
<rect x="96" y="754" width="156" height="3.5" rx="1.75" fill="{LINE}"/>
<rect x="96" y="754" width="77.7" height="3.5" rx="1.75" fill="{GREEN}"/>
<text x="96" y="771" font-family="Inter" font-size="9" fill="{SUB}">2:14</text>
<text x="252" y="771" text-anchor="end" font-family="Inter" font-size="9" fill="{SUB}">4:29</text>
<rect x="268" y="730" width="2.5" height="16" rx="1.25" fill="{INK}"/><polygon points="288,730 288,746 275,738" fill="{INK}"/>
<circle cx="320" cy="738" r="17" fill="{GREEN}" filter="url(#q2-greenShadow)"/>
<rect x="313.5" y="732" width="3.4" height="12" rx="1.7" fill="#FFFFFF"/><rect x="323.1" y="732" width="3.4" height="12" rx="1.7" fill="#FFFFFF"/>
<polygon points="352,730 352,746 365,738" fill="{INK}"/><rect x="369.5" y="730" width="2.5" height="16" rx="1.25" fill="{INK}"/>
<rect x="128" y="828" width="134" height="5" rx="2.5" fill="{PAPER}" opacity="0.35"/>
</g>
</svg>
'''

# ---------------------------------------------------------------- page 03
# floor diamond in canvas coords (image mapped x=-8,y=108,w=406,h=383.4)
L = (58.9, 357.6); T = (199.1, 302.7); R = (335.2, 357.6); B = (196.8, 416.6)

def grid_lines():
    out = []
    d1 = (R[0] - T[0], R[1] - T[1])  # direction family A
    d2 = (L[0] - T[0], L[1] - T[1])  # direction family B
    for i in range(1, 7):
        s = i / 7.0
        p = (T[0] + d2[0] * s, T[1] + d2[1] * s)
        out.append(f'<line x1="{p[0]:.1f}" y1="{p[1]:.1f}" x2="{p[0]+d1[0]:.1f}" y2="{p[1]+d1[1]:.1f}" stroke="#FFFFFF" stroke-opacity="0.4" stroke-width="0.75"/>')
        p = (T[0] + d1[0] * s, T[1] + d1[1] * s)
        out.append(f'<line x1="{p[0]:.1f}" y1="{p[1]:.1f}" x2="{p[0]+d2[0]:.1f}" y2="{p[1]+d2[1]:.1f}" stroke="#FFFFFF" stroke-opacity="0.4" stroke-width="0.75"/>')
    return "\n".join(out)

floor_poly = f"{T[0]},{T[1]} {R[0]},{R[1]} {B[0]},{B[1]} {L[0]},{L[1]}"

page03 = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">
<defs>
<linearGradient id="q3-temp" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F2C979"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>
<clipPath id="q3-floorClip"><polygon points="{floor_poly}"/></clipPath>
<filter id="q3-cardShadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#1D2120" flood-opacity="0.1"/></filter>
<filter id="q3-greenShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#31C27C" flood-opacity="0.25"/></filter>
</defs>
<rect width="390" height="844" fill="{BG}"/>
{status_bar(INK)}
<g id="Header">
<text x="24" y="90" font-family="MiSans Semibold" font-size="20" fill="{INK}">建筑师模式</text>
<text x="24" y="110" font-family="Inter" font-size="10" letter-spacing="2" fill="{SUB}">ARCHITECT MODE</text>
<rect x="308" y="66" width="58" height="30" rx="15" fill="{GREEN}" filter="url(#q3-greenShadow)"/>
<text x="337" y="85" text-anchor="middle" font-family="MiSans Semibold" font-size="12" fill="#FFFFFF">保存</text>
</g>
<g id="Edit Canvas">
<image href="{IMG}" x="-8" y="108" width="406" height="383.4" preserveAspectRatio="xMidYMid meet"/>
<g clip-path="url(#q3-floorClip)">
{grid_lines()}
</g>
<rect x="54" y="166" width="282" height="254" fill="none" stroke="{GREEN}" stroke-width="1.2" stroke-dasharray="5 4"/>
<rect x="49" y="161" width="10" height="10" fill="#FFFFFF" stroke="{GREEN}" stroke-width="1.5"/>
<rect x="331" y="161" width="10" height="10" fill="#FFFFFF" stroke="{GREEN}" stroke-width="1.5"/>
<rect x="49" y="415" width="10" height="10" fill="#FFFFFF" stroke="{GREEN}" stroke-width="1.5"/>
<rect x="331" y="415" width="10" height="10" fill="#FFFFFF" stroke="{GREEN}" stroke-width="1.5"/>
<rect x="112" y="305" width="118" height="82" fill="none" stroke="{GREEN}" stroke-width="1" stroke-dasharray="4 3"/>
<circle cx="171" cy="406" r="13" fill="#FFFFFF" stroke="{GREEN}" stroke-width="1.5"/>
<circle cx="171" cy="406" r="1.8" fill="{GREEN}"/>
<polygon points="171,397 168,402 174,402" fill="{INK}"/>
<polygon points="171,415 168,410 174,410" fill="{INK}"/>
<polygon points="162,406 167,403 167,409" fill="{INK}"/>
<polygon points="180,406 175,403 175,409" fill="{INK}"/>
<rect x="206" y="444" width="140" height="30" rx="15" fill="#FFFFFF" filter="url(#q3-cardShadow)"/>
<circle cx="224" cy="459" r="4" fill="{GREEN}"/>
<text x="236" y="463" font-family="MiSans" font-size="11" fill="{INK}">正在播放 · 晴天</text>
</g>
<g id="Panels">
<rect x="0" y="536" width="390" height="308" rx="28" fill="#FFFFFF"/>
<line x1="28" y1="537" x2="362" y2="537" stroke="{LINE}" stroke-width="0.5"/>
<rect x="24" y="556" width="342" height="108" rx="16" fill="#F2FAF4"/>
<text x="40" y="582" font-family="MiSans Semibold" font-size="13" fill="{INK}">家具库</text>
<text x="350" y="582" text-anchor="end" font-family="MiSans" font-size="10" fill="{SUB}">12 件</text>
<rect x="49" y="592" width="52" height="52" rx="12" fill="#FFFFFF"/>
<path d="M61,624 L61,612 Q61,606 67,606 L83,606 Q89,606 89,612 L89,624 Z" fill="none" stroke="{INK}" stroke-width="1.8" stroke-linejoin="round"/><line x1="65" y1="617" x2="85" y2="617" stroke="{INK}" stroke-width="1.8"/>
<text x="75" y="658" text-anchor="middle" font-family="MiSans" font-size="10" fill="{SUB}">沙发</text>
<rect x="129" y="592" width="52" height="52" rx="12" fill="#FFFFFF"/>
<rect x="142" y="604" width="26" height="20" rx="3" fill="none" stroke="{INK}" stroke-width="1.8"/><circle cx="151" cy="614" r="5.5" fill="none" stroke="{INK}" stroke-width="1.8"/><circle cx="151" cy="614" r="1.4" fill="{GREEN}"/><path d="M164,607 L164,612 L158,617" fill="none" stroke="{INK}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
<text x="155" y="658" text-anchor="middle" font-family="MiSans" font-size="10" fill="{SUB}">黑胶机</text>
<rect x="209" y="592" width="52" height="52" rx="12" fill="#FFFFFF"/>
<path d="M222,624 L222,617 Q222,607 235,607 Q248,607 248,617 L248,624 Z" fill="none" stroke="{INK}" stroke-width="1.8" stroke-linejoin="round"/><polygon points="227,608 230,601 233,608" fill="none" stroke="{INK}" stroke-width="1.8" stroke-linejoin="round"/><polygon points="237,608 240,601 243,608" fill="none" stroke="{INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M231,624 Q231,617 235,617 Q239,617 239,624" fill="none" stroke="{GREEN}" stroke-width="1.8"/>
<text x="235" y="658" text-anchor="middle" font-family="MiSans" font-size="10" fill="{SUB}">猫窝</text>
<rect x="289" y="592" width="52" height="52" rx="12" fill="#FFFFFF"/>
<rect x="303" y="604" width="24" height="22" rx="2" fill="none" stroke="{INK}" stroke-width="1.8"/><line x1="303" y1="611" x2="327" y2="611" stroke="{INK}" stroke-width="1.8"/><line x1="303" y1="618" x2="327" y2="618" stroke="{INK}" stroke-width="1.8"/><rect x="306" y="606.5" width="3" height="4.5" fill="{GREEN}"/><rect x="310" y="606" width="3" height="5" fill="#6D99A6"/><rect x="318" y="613.5" width="3" height="4.5" fill="#E6B15A"/>
<text x="315" y="658" text-anchor="middle" font-family="MiSans" font-size="10" fill="{SUB}">书架</text>
<rect x="24" y="676" width="342" height="84" rx="16" fill="#F2FAF4"/>
<text x="40" y="702" font-family="MiSans Semibold" font-size="13" fill="{INK}">地板材质</text>
<text x="350" y="702" text-anchor="end" font-family="MiSans" font-size="10" fill="{SUB}">蓝灰 · 使用中</text>
<rect x="37" y="711" width="58" height="40" rx="11" fill="none" stroke="{GREEN}" stroke-width="1.5"/>
<rect x="40" y="714" width="52" height="34" rx="8" fill="#5F7887"/>
<rect x="104" y="714" width="52" height="34" rx="8" fill="#C08F45"/>
<rect x="168" y="714" width="52" height="34" rx="8" fill="#6D99A6"/>
<circle cx="92" cy="714" r="6" fill="{GREEN}"/>
<path d="M89,714 L91.4,716.6 L95,711.6" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="24" y="772" width="342" height="60" rx="16" fill="#F2FAF4"/>
<text x="40" y="794" font-family="MiSans Semibold" font-size="13" fill="{INK}">灯光色温</text>
<rect x="40" y="802" width="310" height="6" rx="3" fill="url(#q3-temp)"/>
<circle cx="245" cy="805" r="8" fill="{GREEN}" stroke="#FFFFFF" stroke-width="2"/>
<text x="40" y="826" font-family="MiSans" font-size="9" fill="{SUB}">暖黄 2700K</text>
<text x="350" y="826" text-anchor="end" font-family="MiSans" font-size="9" fill="{SUB}">雪白 6000K</text>
</g>
</svg>
'''

for name, content in [
    ("page-01-home-v5.svg", page01),
    ("page-02-live-v5.svg", page02),
    ("page-03-edit-v5.svg", page03),
]:
    path = os.path.join(ASSETS, name)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(name, len(content))

# validate
import xml.dom.minidom as minidom
for name in ["page-01-home-v5.svg", "page-02-live-v5.svg", "page-03-edit-v5.svg"]:
    minidom.parse(os.path.join(ASSETS, name))
    print(name, "XML OK")
