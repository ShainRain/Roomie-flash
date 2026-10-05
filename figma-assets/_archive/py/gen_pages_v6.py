# -*- coding: utf-8 -*-
"""Roomie v6 —— 基础前端页面结构性改良（QQ 音乐设计语言，390x844）。
页面定义：
  page-01-home-v6      听歌主页：音乐放映室主场景，放映墙播放当前歌曲封面
  page-02-song-v6      歌曲页面：放映墙内容的放大细化（黑胶转盘 / 歌词 / 评论）
  page-03-social-v6    社交页面：好友在线状态 + 邀请好友进房间
  page-04-duo-v6       双人同房间听歌场景（hero-art-duo-1080.png）
  page-05-personal-v6  个性化页面：唱片墙展示选择 + 形象更改（占位）
"""
import base64, os, re

BASE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(BASE, "figma-assets")

def b64(name):
    with open(os.path.join(ASSETS, name), "rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode("ascii")

IMG_ROOM = b64("hero-art-qq-float-1080.png")
IMG_DUO = b64("hero-art-duo-float-1080.png")

GREEN = "#31C27C"
INK = "#1D2120"
SUB = "#8A8F8C"
NAVOFF = "#9AA09C"
LINE = "#ECECEC"
BG = "#FFFFFF"
PAPER = "#FFFFFF"
AMBER = "#E6B15A"
CORAL = "#D96A4D"
TEAL = "#6D99A6"
CREAM = "#FBF6EE"

HEADER = '<?xml version="1.0" encoding="UTF-8"?>\n'


def status_bar(color):
    return (
        '<g id="Status Bar">\n'
        f'<text x="28" y="34" font-family="Inter" font-size="13" font-weight="600" fill="{color}">9:41</text>\n'
        f'<g fill="{color}" opacity="0.85"><rect x="300" y="24" width="3" height="7" rx="1"/><rect x="305" y="22" width="3" height="9" rx="1"/><rect x="310" y="20" width="3" height="11" rx="1"/><rect x="315" y="18" width="3" height="13" rx="1"/></g>\n'
        f'<rect x="328" y="19" width="24" height="12" rx="3.5" fill="none" stroke="{color}" stroke-width="1"/><rect x="330" y="21" width="15" height="8" rx="2" fill="{color}"/><rect x="353.5" y="22.5" width="2.5" height="5" rx="1.2" fill="{color}"/>\n'
        '</g>'
    )


def share_icon(x, y, color):
    return (f'<g stroke="{color}" stroke-width="1.6" fill="none"><line x1="{x+2.6}" y1="{y-6.4}" x2="{x+9.4}" y2="{y-2.6}"/>'
            f'<line x1="{x+2.6}" y1="{y+6.4}" x2="{x+9.4}" y2="{y+2.6}"/>'
            f'<circle cx="{x}" cy="{y-9}" r="2.6"/><circle cx="{x}" cy="{y+9}" r="2.6"/><circle cx="{x+13}" cy="{y}" r="2.6"/></g>')


def vinyl_thumb(cx, cy, r):
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{INK}"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r*0.64:.1f}" fill="none" stroke="#3A4340" stroke-width="1"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r*0.32:.1f}" fill="{GREEN}"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r*0.07:.1f}" fill="#FFFFFF"/>')


def bottom_nav(active):
    """active: home / friends / mine"""
    c_home = GREEN if active == "home" else NAVOFF
    c_fri = GREEN if active == "friends" else NAVOFF
    c_mine = GREEN if active == "mine" else NAVOFF
    w_home = "Semibold" if active == "home" else ""
    w_fri = "Semibold" if active == "friends" else ""
    w_mine = "Semibold" if active == "mine" else ""
    ff_home = "MiSans Semibold" if active == "home" else "MiSans"
    ff_fri = "MiSans Semibold" if active == "friends" else "MiSans"
    ff_mine = "MiSans Semibold" if active == "mine" else "MiSans"
    return f'''<g id="Bottom Nav">
<rect x="0" y="764" width="390" height="80" fill="#FFFFFF"/>
<line x1="0" y1="764" x2="390" y2="764" stroke="{LINE}" stroke-width="0.5"/>
<polygon points="28,790 39,780 50,790" fill="{c_home}"/><rect x="32.5" y="789" width="13" height="12" fill="{c_home}"/><rect x="36.5" y="794" width="5" height="7" fill="#FFFFFF"/>
<circle cx="112" cy="783" r="4.2" fill="none" stroke="{c_fri}" stroke-width="2"/>
<path d="M103.5,797 Q103.5,788.5 112,788.5 Q120.5,788.5 120.5,797" fill="none" stroke="{c_fri}" stroke-width="2" stroke-linecap="round"/>
<circle cx="124.5" cy="784.5" r="3.3" fill="none" stroke="{c_fri}" stroke-width="1.7"/>
<path d="M120.8,797 Q120.8,791 124.5,791 Q128.2,791 128.2,797" fill="none" stroke="{c_fri}" stroke-width="1.7" stroke-linecap="round"/>
<polygon points="268,794 268,801 274,794" fill="{NAVOFF}"/><rect x="264" y="781" width="18" height="14" rx="4" fill="none" stroke="{NAVOFF}" stroke-width="2"/>
<circle cx="351" cy="783" r="5" fill="none" stroke="{c_mine}" stroke-width="2"/><path d="M342.5,800 Q342.5,790.5 351,790.5 Q359.5,790.5 359.5,800" fill="none" stroke="{c_mine}" stroke-width="2" stroke-linecap="round"/>
<circle cx="195" cy="766" r="28" fill="{GREEN}"/>
<line x1="195" y1="758" x2="195" y2="774" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
<line x1="187" y1="766" x2="203" y2="766" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
<text x="39" y="816" text-anchor="middle" font-family="{ff_home}" font-size="10" fill="{c_home}">首页</text>
<text x="117" y="816" text-anchor="middle" font-family="{ff_fri}" font-size="10" fill="{c_fri}">好友</text>
<text x="195" y="816" text-anchor="middle" font-family="MiSans" font-size="10" fill="{NAVOFF}">创建</text>
<text x="273" y="816" text-anchor="middle" font-family="MiSans" font-size="10" fill="{NAVOFF}">消息</text>
<text x="351" y="816" text-anchor="middle" font-family="{ff_mine}" font-size="10" fill="{c_mine}">我的</text>
<rect x="128" y="828" width="134" height="5" rx="2.5" fill="{INK}" opacity="0.2"/>
</g>'''


def avatar(cx, cy, r, bg, kind):
    """可爱小头像：底色圆脸 + 发型 + 表情 + 特征（momo 蝴蝶结 / kiki 耳机 / nana 丸子头 / abo 眼镜）"""
    s = [f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{bg}"/>']
    face_r = r * 0.56
    fy = cy + r * 0.14
    # 后发（丸子头/披发垫在脸后）
    if kind == "nana":
        s.append(f'<circle cx="{cx - r*0.42:.1f}" cy="{cy - r*0.48:.1f}" r="{r*0.24:.1f}" fill="#3A3230"/>')
        s.append(f'<circle cx="{cx + r*0.42:.1f}" cy="{cy - r*0.48:.1f}" r="{r*0.24:.1f}" fill="#3A3230"/>')
    s.append(f'<circle cx="{cx}" cy="{fy:.1f}" r="{face_r:.1f}" fill="#F7D9BE"/>')
    # 刘海发盖
    s.append(f'<path d="M{cx - face_r:.1f},{fy - r*0.06:.1f} Q{cx},{fy - r*1.18:.1f} {cx + face_r:.1f},{fy - r*0.06:.1f} '
             f'Q{cx + face_r*0.4:.1f},{fy - r*0.34:.1f} {cx},{fy - r*0.30:.1f} '
             f'Q{cx - face_r*0.4:.1f},{fy - r*0.34:.1f} {cx - face_r:.1f},{fy - r*0.06:.1f} Z" fill="#3A3230"/>')
    # 眼睛 + 嘴 + 腮红
    er = max(1.1, r * 0.06)
    s.append(f'<circle cx="{cx - r*0.20:.1f}" cy="{fy + r*0.06:.1f}" r="{er:.1f}" fill="#3A3230"/>')
    s.append(f'<circle cx="{cx + r*0.20:.1f}" cy="{fy + r*0.06:.1f}" r="{er:.1f}" fill="#3A3230"/>')
    s.append(f'<path d="M{cx - r*0.10:.1f},{fy + r*0.24:.1f} Q{cx},{fy + r*0.34:.1f} {cx + r*0.10:.1f},{fy + r*0.24:.1f}" '
             f'fill="none" stroke="#A8543F" stroke-width="{max(1.0, r*0.06):.1f}" stroke-linecap="round"/>')
    s.append(f'<ellipse cx="{cx - r*0.34:.1f}" cy="{fy + r*0.22:.1f}" rx="{r*0.12:.1f}" ry="{r*0.07:.1f}" fill="#F2A58C" opacity="0.6"/>')
    s.append(f'<ellipse cx="{cx + r*0.34:.1f}" cy="{fy + r*0.22:.1f}" rx="{r*0.12:.1f}" ry="{r*0.07:.1f}" fill="#F2A58C" opacity="0.6"/>')
    if kind == "momo":
        s.append(f'<path d="M{cx - r*0.06:.1f},{cy - r*0.62:.1f} L{cx - r*0.52:.1f},{cy - r*0.98:.1f} L{cx - r*0.16:.1f},{cy - r*0.94:.1f} Z" fill="#D63A2F"/>')
        s.append(f'<path d="M{cx + r*0.06:.1f},{cy - r*0.62:.1f} L{cx + r*0.52:.1f},{cy - r*0.98:.1f} L{cx + r*0.16:.1f},{cy - r*0.94:.1f} Z" fill="#D63A2F"/>')
        s.append(f'<circle cx="{cx}" cy="{cy - r*0.72:.1f}" r="{r*0.14:.1f}" fill="#B52E24"/>')
    elif kind == "kiki":
        s.append(f'<path d="M{cx - r*0.62:.1f},{cy + r*0.02:.1f} Q{cx},{cy - r*1.02:.1f} {cx + r*0.62:.1f},{cy + r*0.02:.1f}" '
                 f'fill="none" stroke="{CORAL}" stroke-width="{r*0.12:.1f}" stroke-linecap="round"/>')
        s.append(f'<circle cx="{cx - r*0.62:.1f}" cy="{cy + r*0.06:.1f}" r="{r*0.18:.1f}" fill="{CORAL}"/>')
        s.append(f'<circle cx="{cx + r*0.62:.1f}" cy="{cy + r*0.06:.1f}" r="{r*0.18:.1f}" fill="{CORAL}"/>')
    elif kind == "abo":
        s.append(f'<circle cx="{cx - r*0.20:.1f}" cy="{fy + r*0.06:.1f}" r="{r*0.16:.1f}" fill="none" stroke="#3A3230" stroke-width="1.2"/>')
        s.append(f'<circle cx="{cx + r*0.20:.1f}" cy="{fy + r*0.06:.1f}" r="{r*0.16:.1f}" fill="none" stroke="#3A3230" stroke-width="1.2"/>')
        s.append(f'<line x1="{cx - r*0.04:.1f}" y1="{fy + r*0.06:.1f}" x2="{cx + r*0.04:.1f}" y2="{fy + r*0.06:.1f}" stroke="#3A3230" stroke-width="1.2"/>')
    return "".join(s)


# ================================================================= page 01
def page01():
    return f'''{HEADER}<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">
<defs>
<linearGradient id="v6h-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9E6F3"/><stop offset="0.55" stop-color="#E8F3F0"/><stop offset="1" stop-color="#F7F1E2"/></linearGradient>
<filter id="v6h-cardShadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#5B7482" flood-opacity="0.14"/></filter>
<filter id="v6h-greenShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="{GREEN}" flood-opacity="0.35"/></filter>
</defs>
<rect width="390" height="844" fill="url(#v6h-bg)"/>
{status_bar(INK)}
<g id="Top Bar">
<rect x="114" y="42" width="162" height="32" rx="16" fill="{GREEN}" filter="url(#v6h-greenShadow)"/>
<circle cx="132" cy="58" r="3.5" fill="#FFFFFF"/>
<text x="142" y="62" font-family="MiSans" font-size="11" fill="#FFFFFF">深夜放映室 · 放映中</text>
{share_icon(347, 58, INK)}
</g>
<g id="Room Stage">
<ellipse cx="195" cy="430" rx="104" ry="13" fill="#5B7482" opacity="0.10"/>
<ellipse cx="195" cy="430" rx="66" ry="8" fill="#5B7482" opacity="0.08"/>
<image href="{IMG_ROOM}" x="25" y="102" width="340" height="317.8" preserveAspectRatio="xMidYMid meet"/>
</g>
<g id="Wall Hint">
<circle cx="135" cy="461" r="2.5" fill="{GREEN}"/>
<text x="143" y="465" font-family="MiSans" font-size="10" fill="{SUB}">放映墙 · 正在播放《晴天》封面</text>
</g>
<g id="Friends Strip">
<rect x="16" y="486" width="358" height="56" rx="16" fill="#FFFFFF" filter="url(#v6h-cardShadow)"/>
{avatar(46, 514, 14, "#F5E3C0", "kiki")}
{avatar(66, 514, 14, "#F8D8CE", "nana")}
{avatar(86, 514, 14, "#DDE7EA", "abo")}
<text x="112" y="510" font-family="MiSans Semibold" font-size="12.5" fill="{INK}">3 位好友在线</text>
<text x="112" y="527" font-family="MiSans" font-size="10" fill="{SUB}">KIKI 正在听《晴天》</text>
<rect x="298" y="500" width="64" height="28" rx="14" fill="{GREEN}"/>
<text x="330" y="518" text-anchor="middle" font-family="MiSans Semibold" font-size="11" fill="#FFFFFF">一起听</text>
</g>
<g id="Mini Player">
<rect x="16" y="562" width="358" height="108" rx="20" fill="#FFFFFF" filter="url(#v6h-cardShadow)"/>
{vinyl_thumb(62, 616, 24)}
<text x="100" y="606" font-family="MiSans Semibold" font-size="15" fill="{INK}">晴天</text>
<text x="100" y="624" font-family="MiSans" font-size="10.5" fill="{SUB}">周杰伦 · 叶惠美</text>
<rect x="100" y="636" width="168" height="3.5" rx="1.75" fill="{LINE}"/>
<rect x="100" y="636" width="84" height="3.5" rx="1.75" fill="{GREEN}"/>
<text x="100" y="656" font-family="Inter" font-size="9" fill="{SUB}">2:14</text>
<text x="268" y="656" text-anchor="end" font-family="Inter" font-size="9" fill="{SUB}">4:29</text>
<rect x="282" y="608" width="2.5" height="16" rx="1.25" fill="{INK}"/><polygon points="302,608 302,624 289,616" fill="{INK}"/>
<circle cx="330" cy="616" r="17" fill="{GREEN}" filter="url(#v6h-greenShadow)"/>
<rect x="323.5" y="610" width="3.4" height="12" rx="1.7" fill="#FFFFFF"/><rect x="333.1" y="610" width="3.4" height="12" rx="1.7" fill="#FFFFFF"/>
<polygon points="352,608 352,624 365,616" fill="{INK}"/><rect x="369.5" y="608" width="2.5" height="16" rx="1.25" fill="{INK}"/>
</g>
{bottom_nav("home")}
</svg>
'''


# ================================================================= page 02
def page02():
    lyrics = [
        ("故事的小黄花 从出生那年就飘着", False),
        ("童年的荡秋千 随记忆一直晃到现在", True),
        ("吹着前奏 望着天空 我想起花瓣试着掉落", False),
        ("为你翘课的那一天 花落的那一天", False),
    ]
    lyric_svg = "\n".join(
        f'<text x="195" y="{516 + i * 29}" text-anchor="middle" font-family="{"MiSans Semibold" if on else "MiSans"}" '
        f'font-size="{14 if on else 12.5}" fill="{GREEN if on else SUB}">{t}</text>'
        for i, (t, on) in enumerate(lyrics)
    )
    return f'''{HEADER}<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">
<defs>
<radialGradient id="v6s-glow" cx="0.5" cy="0.36" r="0.55"><stop offset="0" stop-color="#F8D8CE" stop-opacity="0.85"/><stop offset="1" stop-color="#FBF6EE" stop-opacity="0"/></radialGradient>
<linearGradient id="v6s-cover" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FC4E8"/><stop offset="1" stop-color="#F5C6C6"/></linearGradient>
<filter id="v6s-discShadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#B84A64" flood-opacity="0.22"/></filter>
<filter id="v6s-greenShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="{GREEN}" flood-opacity="0.35"/></filter>
<clipPath id="v6s-coverClip"><circle cx="195" cy="292" r="60"/></clipPath>
</defs>
<rect width="390" height="844" fill="{CREAM}"/>
<ellipse cx="195" cy="300" rx="240" ry="220" fill="url(#v6s-glow)"/>
{status_bar(INK)}
<g id="Top Bar">
<path d="M22,56 L32,66 L42,56" fill="none" stroke="{INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<text x="195" y="56" text-anchor="middle" font-family="MiSans Semibold" font-size="16" fill="{INK}">晴天</text>
<text x="195" y="74" text-anchor="middle" font-family="MiSans" font-size="10" fill="{SUB}">周杰伦 · 叶惠美</text>
{share_icon(345, 60, INK)}
</g>
<g id="Vinyl Disc" filter="url(#v6s-discShadow)">
<circle cx="195" cy="292" r="115" fill="{INK}"/>
<circle cx="195" cy="292" r="115" fill="none" stroke="#3A4340" stroke-width="1"/>
<circle cx="195" cy="292" r="98" fill="none" stroke="#3A4340" stroke-width="1" opacity="0.7"/>
<circle cx="195" cy="292" r="84" fill="none" stroke="#3A4340" stroke-width="1" opacity="0.5"/>
<path d="M118,236 A110,110 0 0 1 160,192" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.18" stroke-linecap="round"/>
<g clip-path="url(#v6s-coverClip)">
<rect x="135" y="232" width="120" height="120" fill="url(#v6s-cover)"/>
<circle cx="172" cy="262" r="12" fill="#FFF3D0"/>
<ellipse cx="216" cy="278" rx="20" ry="9" fill="#FFFFFF" opacity="0.95"/>
<ellipse cx="206" cy="273" rx="13" ry="10" fill="#FFFFFF" opacity="0.95"/>
<ellipse cx="228" cy="273" rx="11" ry="8" fill="#FFFFFF" opacity="0.95"/>
<path d="M135,322 Q170,302 205,318 Q235,330 255,316 L255,352 L135,352 Z" fill="#4E9E5F"/>
<text x="195" y="340" text-anchor="middle" font-family="Noto Serif SC" font-size="13" fill="#FFFFFF" letter-spacing="4">晴天</text>
</g>
<circle cx="195" cy="292" r="60" fill="none" stroke="#B84A64" stroke-width="1" opacity="0.5"/>
<circle cx="195" cy="292" r="4" fill="{CREAM}" stroke="#B84A64" stroke-width="1"/>
</g>
<g id="Tonearm">
<circle cx="312" cy="182" r="10" fill="#E8DCC8" stroke="{INK}" stroke-width="1.5"/>
<circle cx="312" cy="182" r="3.5" fill="{INK}"/>
<line x1="312" y1="182" x2="238" y2="248" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>
<rect x="230" y="244" width="14" height="9" rx="3" fill="{INK}" transform="rotate(42 237 248)"/>
</g>
<text x="296" y="170" font-family="MiSans" font-size="12" fill="{CORAL}" transform="rotate(-10 296 170)">♪</text>
<g id="Tabs">
<text x="163" y="472" text-anchor="middle" font-family="MiSans Semibold" font-size="14" fill="{GREEN}">歌词</text>
<rect x="147" y="480" width="32" height="3" rx="1.5" fill="{GREEN}"/>
<text x="231" y="472" text-anchor="middle" font-family="MiSans" font-size="14" fill="{SUB}">评论</text>
</g>
<g id="Lyrics">
{lyric_svg}
</g>
<g id="Action Row">
<path d="M60,642 C54,634 42,638 44,648 C46,656 60,662 60,662 C60,662 74,656 76,648 C78,638 66,634 60,642 Z" fill="none" stroke="{INK}" stroke-width="1.8" stroke-linejoin="round"/>
<text x="60" y="680" text-anchor="middle" font-family="MiSans" font-size="9" fill="{SUB}">99w+</text>
<rect x="138" y="640" width="24" height="18" rx="9" fill="none" stroke="{INK}" stroke-width="1.8"/>
<polygon points="145,658 150,658 143,666" fill="none" stroke="{INK}" stroke-width="1.8" stroke-linejoin="round"/>
<circle cx="145.5" cy="649" r="1.3" fill="{INK}"/><circle cx="150.5" cy="649" r="1.3" fill="{INK}"/><circle cx="155.5" cy="649" r="1.3" fill="{INK}"/>
<text x="150" y="680" text-anchor="middle" font-family="MiSans" font-size="9" fill="{SUB}">评论 1.2w</text>
<line x1="240" y1="638" x2="240" y2="654" stroke="{INK}" stroke-width="1.8" stroke-linecap="round"/>
<polygon points="240,658 235,651 245,651" fill="{INK}"/>
<line x1="232" y1="662" x2="248" y2="662" stroke="{INK}" stroke-width="1.8" stroke-linecap="round"/>
<text x="240" y="680" text-anchor="middle" font-family="MiSans" font-size="9" fill="{SUB}">下载</text>
<circle cx="324" cy="649" r="2" fill="{INK}"/><circle cx="330" cy="649" r="2" fill="{INK}"/><circle cx="336" cy="649" r="2" fill="{INK}"/>
<text x="330" y="680" text-anchor="middle" font-family="MiSans" font-size="9" fill="{SUB}">更多</text>
</g>
<g id="Progress">
<text x="30" y="704" font-family="Inter" font-size="9.5" fill="{SUB}">2:14</text>
<text x="360" y="704" text-anchor="end" font-family="Inter" font-size="9.5" fill="{SUB}">4:29</text>
<rect x="62" y="698" width="266" height="3.5" rx="1.75" fill="#EBDFD2"/>
<rect x="62" y="698" width="133" height="3.5" rx="1.75" fill="{GREEN}"/>
<circle cx="195" cy="699.8" r="5" fill="#FFFFFF" stroke="{GREEN}" stroke-width="2"/>
</g>
<g id="Controls">
<polyline points="44,742 54,748 44,754" fill="none" stroke="{INK}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
<line x1="58" y1="742" x2="48" y2="748" stroke="{INK}" stroke-width="1.8" stroke-linecap="round"/>
<rect x="102" y="740" width="2.6" height="17" rx="1.3" fill="{INK}"/><polygon points="122,740 122,757 107,748.5" fill="{INK}"/>
<circle cx="195" cy="748" r="30" fill="{GREEN}" filter="url(#v6s-greenShadow)"/>
<rect x="186" y="737" width="5" height="22" rx="2.5" fill="#FFFFFF"/><rect x="199" y="737" width="5" height="22" rx="2.5" fill="#FFFFFF"/>
<polygon points="268,740 268,757 283,748.5" fill="{INK}"/><rect x="285.4" y="740" width="2.6" height="17" rx="1.3" fill="{INK}"/>
<line x1="330" y1="742" x2="348" y2="742" stroke="{INK}" stroke-width="1.8" stroke-linecap="round"/>
<line x1="330" y1="748" x2="348" y2="748" stroke="{INK}" stroke-width="1.8" stroke-linecap="round"/>
<line x1="330" y1="754" x2="342" y2="754" stroke="{INK}" stroke-width="1.8" stroke-linecap="round"/>
<circle cx="346" cy="753" r="2.4" fill="{GREEN}"/>
</g>
<rect x="128" y="828" width="134" height="5" rx="2.5" fill="{INK}" opacity="0.2"/>
</svg>
'''


# ================================================================= page 03
def page03():
    def friend_row(y0, av_bg, kind, name, status, btn, btn_style, online=True):
        name_c = INK if online else SUB
        sub_c = SUB if online else "#B9BEBB"
        dot = f'<circle cx="88" cy="{y0+45}" r="3" fill="{GREEN}"/>' if online else ""
        sx = 98 if online else 88
        if btn_style == "solid":
            btn_svg = (f'<rect x="290" y="{y0+12}" width="72" height="32" rx="16" fill="{GREEN}"/>'
                       f'<text x="326" y="{y0+32}" text-anchor="middle" font-family="MiSans Semibold" font-size="11.5" fill="#FFFFFF">{btn}</text>')
        elif btn_style == "chip":
            btn_svg = (f'<rect x="290" y="{y0+12}" width="72" height="32" rx="16" fill="#E8F7EF"/>'
                       f'<text x="326" y="{y0+32}" text-anchor="middle" font-family="MiSans Semibold" font-size="11.5" fill="{GREEN}">{btn}</text>')
        else:
            btn_svg = (f'<rect x="290" y="{y0+12}" width="72" height="32" rx="16" fill="none" stroke="#D8DAD6" stroke-width="1.2"/>'
                       f'<text x="326" y="{y0+32}" text-anchor="middle" font-family="MiSans" font-size="11.5" fill="{SUB}">{btn}</text>')
        dim = "" if online else ' opacity="0.55"'
        return (f'<g id="Friend {name}"{dim}>'
                + avatar(52, y0 + 28, 22, av_bg, kind)
                + f'<text x="88" y="{y0+24}" font-family="MiSans Semibold" font-size="14" fill="{name_c}">{name}</text>'
                + dot
                + f'<text x="{sx}" y="{y0+48}" font-family="MiSans" font-size="10.5" fill="{sub_c}">{status}</text>'
                + btn_svg + '</g>')

    return f'''{HEADER}<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">
<defs>
<linearGradient id="v6f-banner" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#31C27C"/><stop offset="1" stop-color="#27A66B"/></linearGradient>
<filter id="v6f-greenShadow" x="-30%" y="-40%" width="160%" height="200%"><feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="{GREEN}" flood-opacity="0.28"/></filter>
</defs>
<rect width="390" height="844" fill="{BG}"/>
{status_bar(INK)}
<g id="Header">
<text x="24" y="86" font-family="MiSans Semibold" font-size="26" fill="{INK}">好友</text>
<text x="25" y="108" font-family="Inter" font-size="11" font-weight="600" letter-spacing="3" fill="{SUB}">LISTEN TOGETHER</text>
</g>
<g id="Invite Banner" filter="url(#v6f-greenShadow)">
<rect x="16" y="128" width="358" height="88" rx="20" fill="url(#v6f-banner)"/>
<circle cx="330" cy="150" r="34" fill="#FFFFFF" opacity="0.12"/>
<circle cx="352" cy="196" r="22" fill="#FFFFFF" opacity="0.10"/>
<text x="40" y="164" font-family="MiSans Semibold" font-size="16" fill="#FFFFFF">邀请好友进房间</text>
<text x="40" y="188" font-family="MiSans" font-size="11" fill="#FFFFFF" opacity="0.85">一起听《晴天》，放映墙同步画面</text>
<circle cx="330" cy="172" r="20" fill="#FFFFFF"/>
<circle cx="330" cy="166" r="5.5" fill="none" stroke="{GREEN}" stroke-width="2"/>
<path d="M321,181 Q321,173.5 330,173.5 Q339,173.5 339,181" fill="none" stroke="{GREEN}" stroke-width="2" stroke-linecap="round"/>
<line x1="337" y1="160" x2="343" y2="160" stroke="{GREEN}" stroke-width="2" stroke-linecap="round"/>
<line x1="340" y1="157" x2="340" y2="163" stroke="{GREEN}" stroke-width="2" stroke-linecap="round"/>
</g>
<g id="Online">
<text x="24" y="252" font-family="MiSans Semibold" font-size="13" fill="{INK}">在线 · 3</text>
{friend_row(268, "#F5E3C0", "kiki", "KIKI", "在你的房间 · 一起听《晴天》", "房间中", "chip")}
{friend_row(346, "#F8D8CE", "nana", "NANA", "正在听《晴天》", "邀请", "solid")}
{friend_row(424, "#DDE7EA", "abo", "ABO", "正在逛唱片墙", "邀请", "solid")}
</g>
<line x1="24" y1="516" x2="366" y2="516" stroke="{LINE}" stroke-width="0.75"/>
<g id="Offline">
<text x="24" y="546" font-family="MiSans Semibold" font-size="13" fill="{SUB}">离线</text>
{friend_row(562, "#E8E4DA", "nana", "RITA", "2 小时前听过《花海》", "邀请", "outline", online=False)}
{friend_row(640, "#E8E4DA", "abo", "TAO", "昨天布置了唱片墙", "邀请", "outline", online=False)}
</g>
{bottom_nav("friends")}
</svg>
'''


# ================================================================= page 04
def page04():
    return f'''{HEADER}<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">
<defs>
<linearGradient id="v6d-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9E6F3"/><stop offset="0.55" stop-color="#E8F3F0"/><stop offset="1" stop-color="#F7F1E2"/></linearGradient>
<filter id="v6d-cardShadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#5B7482" flood-opacity="0.14"/></filter>
<filter id="v6d-greenShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="{GREEN}" flood-opacity="0.35"/></filter>
</defs>
<rect width="390" height="844" fill="url(#v6d-bg)"/>
{status_bar(INK)}
<g id="Top Bar">
<path d="M34,50 L24,58 L34,66" fill="none" stroke="{INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="108" y="42" width="174" height="32" rx="16" fill="{GREEN}" filter="url(#v6d-greenShadow)"/>
<circle cx="126" cy="58" r="3.5" fill="#FFFFFF"/>
<text x="136" y="62" font-family="MiSans" font-size="11" fill="#FFFFFF">和 KIKI 一起听 · LIVE</text>
<text x="358" y="62" text-anchor="middle" font-family="MiSans" font-size="11" fill="{INK}" opacity="0.75">退出</text>
</g>
<g id="Room Stage">
<ellipse cx="195" cy="430" rx="104" ry="13" fill="#5B7482" opacity="0.10"/>
<ellipse cx="195" cy="430" rx="66" ry="8" fill="#5B7482" opacity="0.08"/>
<image href="{IMG_DUO}" x="25" y="102" width="340" height="317.8" preserveAspectRatio="xMidYMid meet"/>
</g>
<g id="Sync Card">
<rect x="95" y="456" width="200" height="52" rx="16" fill="#FFFFFF" filter="url(#v6d-cardShadow)"/>
{avatar(123, 482, 14, "#F8D8CE", "momo")}
{avatar(143, 482, 14, "#F5E3C0", "kiki")}
<text x="167" y="478" font-family="MiSans Semibold" font-size="11.5" fill="{INK}">MOMO &amp; KIKI</text>
<text x="167" y="494" font-family="MiSans" font-size="9.5" fill="{SUB}">放映同步中 · 同频 98%</text>
</g>
<g id="Mini Player">
<rect x="16" y="562" width="358" height="108" rx="20" fill="#FFFFFF" filter="url(#v6d-cardShadow)"/>
{vinyl_thumb(62, 616, 24)}
<text x="100" y="606" font-family="MiSans Semibold" font-size="15" fill="{INK}">晴天</text>
<text x="100" y="624" font-family="MiSans" font-size="10.5" fill="{SUB}">歌单由 MOMO 控制</text>
<rect x="100" y="636" width="168" height="3.5" rx="1.75" fill="{LINE}"/>
<rect x="100" y="636" width="84" height="3.5" rx="1.75" fill="{GREEN}"/>
<text x="100" y="656" font-family="Inter" font-size="9" fill="{SUB}">2:14</text>
<text x="268" y="656" text-anchor="end" font-family="Inter" font-size="9" fill="{SUB}">4:29</text>
<rect x="282" y="608" width="2.5" height="16" rx="1.25" fill="{INK}"/><polygon points="302,608 302,624 289,616" fill="{INK}"/>
<circle cx="330" cy="616" r="17" fill="{GREEN}" filter="url(#v6d-greenShadow)"/>
<rect x="323.5" y="610" width="3.4" height="12" rx="1.7" fill="#FFFFFF"/><rect x="333.1" y="610" width="3.4" height="12" rx="1.7" fill="#FFFFFF"/>
<polygon points="352,608 352,624 365,616" fill="{INK}"/><rect x="369.5" y="608" width="2.5" height="16" rx="1.25" fill="{INK}"/>
</g>
<rect x="128" y="828" width="134" height="5" rx="2.5" fill="{INK}" opacity="0.2"/>
</svg>
'''


# ================================================================= page 05
# 角色展台小人（沿用 v5 的 MOMO，重新定位缩放）
S = 0.62
CX0, Y0 = 95.0, 268.0

def X(x): return round(CX0 + (x - 195.0) * S, 1)
def Y(y): return round(Y0 - (317.0 - y) * S, 1)
def R(r): return round(r * S, 1)

def P(d):
    toks = re.findall(r'[MLQCZ]|-?\d+\.?\d*', d)
    out, pair = [], []
    for t in toks:
        if t.isalpha():
            out.append(t)
        else:
            pair.append(float(t))
            if len(pair) == 2:
                out.append(f"{X(pair[0])},{Y(pair[1])}")
                pair = []
    return " ".join(out)

SKIN = "#F4CFB8"; SKIN_D = "#EAC3A9"; HAIR = "#3B3431"; HAIR_D = "#322B28"
BROWN = "#4A3B33"; TOP = "#F8EFDC"; TOP_D = "#F1E4CB"; COLLAR = "#FFFDF6"
RED_SKIRT = "#C0523E"; RED_SKIRT_D = "#A8432F"; BOW = "#D23A2C"; BOW_D = "#B02A1F"; BLUSH = "#EFA395"

def girl_character():
    p = []
    p.append(f'<ellipse cx="95" cy="{Y(316)}" rx="{R(24)}" ry="{R(7)}" fill="#D8DAD4" opacity="0.85"/>')
    p.append(f'<path d="{P("M187.5,297 L187.5,309 M202.5,297 L202.5,309")}" fill="none" stroke="{SKIN}" stroke-width="{R(6)/0.92*0.92:.1f}" stroke-linecap="round"/>')
    p.append(f'<ellipse cx="{X(187)}" cy="{Y(313)}" rx="{R(8)}" ry="{R(4.8)}" fill="{BROWN}"/>')
    p.append(f'<ellipse cx="{X(203)}" cy="{Y(313)}" rx="{R(8)}" ry="{R(4.8)}" fill="{BROWN}"/>')
    p.append(f'<path d="{P("M195,226 L195,238")}" fill="none" stroke="{SKIN}" stroke-width="4.5" stroke-linecap="round"/>')
    p.append(f'<path d="{P("M183,256 Q180,240 186,234 Q195,229 204,234 Q210,240 207,256 Z")}" fill="{TOP}" stroke="{BROWN}" stroke-width="0.8"/>')
    p.append(f'<ellipse cx="{X(180.5)}" cy="{Y(241)}" rx="{R(6.5)}" ry="{R(6)}" fill="{TOP}" stroke="{BROWN}" stroke-width="0.8"/>')
    p.append(f'<ellipse cx="{X(209.5)}" cy="{Y(241)}" rx="{R(6.5)}" ry="{R(6)}" fill="{TOP_D}" stroke="{BROWN}" stroke-width="0.8"/>')
    p.append(f'<path d="{P("M180.5,245 L177,261")}" fill="none" stroke="{SKIN}" stroke-width="3.2" stroke-linecap="round"/>')
    p.append(f'<path d="{P("M209.5,245 L213,261")}" fill="none" stroke="{SKIN_D}" stroke-width="3.2" stroke-linecap="round"/>')
    p.append(f'<path d="{P("M182,254 L208,254 L217,294 Q195,301 173,294 Z")}" fill="{RED_SKIRT}" stroke="{BROWN}" stroke-width="0.8"/>')
    p.append(f'<path d="{P("M208,254 L217,294 Q208,298 201,299 L203,254 Z")}" fill="{RED_SKIRT_D}" opacity="0.55"/>')
    p.append(f'<polygon points="{P("183,254 182.5,236 187.5,236 188,254")}" fill="{RED_SKIRT}" stroke="{BROWN}" stroke-width="0.6"/>')
    p.append(f'<polygon points="{P("202,254 202.5,236 207.5,236 207,254")}" fill="{RED_SKIRT_D}" stroke="{BROWN}" stroke-width="0.6"/>')
    p.append(f'<path d="{P("M188.5,232 Q195,238 201.5,232 L198.5,228.5 Q195,232 191.5,228.5 Z")}" fill="{COLLAR}" stroke="{BROWN}" stroke-width="0.6"/>')
    p.append(f'<circle cx="{X(195)}" cy="{Y(211)}" r="{R(19)}" fill="{HAIR}" stroke="{BROWN}" stroke-width="0.8"/>')
    p.append(f'<path d="{P("M206,196 Q214,205 213,224 L208,224 Q210,207 201,197 Z")}" fill="{HAIR_D}" opacity="0.6"/>')
    p.append(f'<circle cx="{X(195)}" cy="{Y(215)}" r="{R(14.5)}" fill="{SKIN}" stroke="{BROWN}" stroke-width="0.8"/>')
    p.append(f'<ellipse cx="{X(184)}" cy="{Y(221)}" rx="{R(3)}" ry="{R(1.8)}" fill="{BLUSH}" opacity="0.55"/>')
    p.append(f'<ellipse cx="{X(206)}" cy="{Y(221)}" rx="{R(3)}" ry="{R(1.8)}" fill="{BLUSH}" opacity="0.55"/>')
    p.append(f'<circle cx="{X(188.5)}" cy="{Y(217)}" r="{R(1.6)}" fill="{HAIR}"/>')
    p.append(f'<circle cx="{X(201.5)}" cy="{Y(217)}" r="{R(1.6)}" fill="{HAIR}"/>')
    p.append(f'<path d="{P("M191,222 Q195,225 199,222")}" fill="none" stroke="#A8543F" stroke-width="1" stroke-linecap="round"/>')
    p.append(f'<path d="{P("M177,210 Q178,195 195,193 Q212,195 213,210 Q209,202 204,205 Q200,199 195,204 Q190,199 186,205 Q181,202 177,210 Z")}" fill="{HAIR}" stroke="{BROWN}" stroke-width="0.8" stroke-linejoin="round"/>')
    p.append(f'<path d="{P("M193.5,190 C184,177 170,175 171,185 C172,194 185,195 193.5,192 Z")}" fill="{BOW}" stroke="{BROWN}" stroke-width="0.8" stroke-linejoin="round"/>')
    p.append(f'<path d="{P("M196.5,190 C206,177 220,175 219,185 C218,194 205,195 196.5,192 Z")}" fill="{BOW}" stroke="{BROWN}" stroke-width="0.8" stroke-linejoin="round"/>')
    p.append(f'<path d="{P("M185,182 Q188,186 185,190 M205,182 Q202,186 205,190")}" fill="none" stroke="{BOW_D}" stroke-width="0.8" stroke-linecap="round"/>')
    p.append(f'<circle cx="{X(195)}" cy="{Y(190)}" r="{R(4.2)}" fill="{BOW_D}" stroke="{BROWN}" stroke-width="0.8"/>')
    return "\n".join(p)


def page05():
    bodies = ["#2F4A5A", "#4A6752", "#3A3230", "#2F4A5A",
              "#4A6752", "#3A3230", "#2F4A5A", "#4A6752",
              "#3A3230", "#2F4A5A", "#4A6752", "#3A3230"]
    labels = [AMBER, "#F7F3EA", CORAL, TEAL,
              "#F7F3EA", AMBER, CORAL, "#F7F3EA",
              TEAL, "#F7F3EA", AMBER, CORAL]
    selected = {0, 1, 3, 4, 6, 9}
    cols = [63, 147, 231, 315]
    rows = [420, 510, 600]
    recs = []
    for i in range(12):
        cx = cols[i % 4]
        cy = rows[i // 4]
        sel = i in selected
        op = "" if sel else ' opacity="0.5"'
        recs.append(f'<g id="Record {i+1}"{op}>'
                    f'<circle cx="{cx}" cy="{cy}" r="34" fill="{bodies[i]}"/>'
                    f'<circle cx="{cx}" cy="{cy}" r="28" fill="none" stroke="#FFFFFF" stroke-opacity="0.14" stroke-width="1"/>'
                    f'<circle cx="{cx}" cy="{cy}" r="21" fill="none" stroke="#FFFFFF" stroke-opacity="0.10" stroke-width="1"/>'
                    f'<circle cx="{cx}" cy="{cy}" r="11.5" fill="{labels[i]}"/>'
                    f'<circle cx="{cx}" cy="{cy}" r="1.6" fill="{BG}"/>'
                    + (f'<circle cx="{cx}" cy="{cy}" r="39" fill="none" stroke="{GREEN}" stroke-width="2.5"/>'
                       f'<circle cx="{cx+26}" cy="{cy-26}" r="8.5" fill="{GREEN}" stroke="#FFFFFF" stroke-width="2"/>'
                       f'<path d="M{cx+22.2},{cy-26} L{cx+24.8},{cy-23.4} L{cx+29.8},{cy-28.6}" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
                       if sel else "")
                    + '</g>')
    recs_svg = "\n".join(recs)

    return f'''{HEADER}<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">
<defs>
<filter id="v6p-greenShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="{GREEN}" flood-opacity="0.25"/></filter>
</defs>
<rect width="390" height="844" fill="{BG}"/>
{status_bar(INK)}
<g id="Header">
<text x="24" y="86" font-family="MiSans Semibold" font-size="26" fill="{INK}">我的放映室</text>
<text x="25" y="108" font-family="Inter" font-size="11" font-weight="600" letter-spacing="3" fill="{SUB}">PERSONALIZE</text>
</g>
<g id="Character Card">
<rect x="16" y="124" width="358" height="180" rx="20" fill="{CREAM}"/>
<ellipse cx="95" cy="272" rx="46" ry="13" fill="#FFFFFF" stroke="#EFE6D6" stroke-width="1"/>
{girl_character()}
<text x="162" y="172" font-family="Inter" font-size="15" font-weight="600" fill="{INK}">MOMO · LV.7</text>
<rect x="162" y="184" width="64" height="22" rx="11" fill="#E8F7EF"/>
<text x="194" y="199" text-anchor="middle" font-family="MiSans Semibold" font-size="10.5" fill="{GREEN}">建筑师</text>
<rect x="162" y="220" width="88" height="30" rx="15" fill="#FFFFFF" stroke="#E3DCCF" stroke-width="1.2"/>
<text x="206" y="239" text-anchor="middle" font-family="MiSans" font-size="11" fill="{INK}">换发型</text>
<rect x="260" y="220" width="88" height="30" rx="15" fill="#FFFFFF" stroke="#E3DCCF" stroke-width="1.2"/>
<text x="304" y="239" text-anchor="middle" font-family="MiSans" font-size="11" fill="{INK}">换服装</text>
<text x="162" y="278" font-family="MiSans" font-size="9.5" fill="{AMBER}">✦ 更立体的可爱形象素材即将更新</text>
</g>
<g id="Vinyl Wall">
<text x="24" y="340" font-family="MiSans Semibold" font-size="15" fill="{INK}">唱片墙布置</text>
<text x="366" y="340" text-anchor="end" font-family="MiSans Semibold" font-size="12" fill="{GREEN}">已选 6 / 12 展示位</text>
<text x="24" y="360" font-family="MiSans" font-size="10" fill="{SUB}">从收藏的 24 张唱片中挑选，挂在房间的墙上</text>
{recs_svg}
</g>
<g id="Actions">
<rect x="45" y="664" width="300" height="48" rx="24" fill="{GREEN}" filter="url(#v6p-greenShadow)"/>
<text x="195" y="694" text-anchor="middle" font-family="MiSans Semibold" font-size="15" fill="#FFFFFF">保存布置</text>
</g>
{bottom_nav("mine")}
</svg>
'''


PAGES = [
    ("page-01-home-v6.svg", page01),
    ("page-02-song-v6.svg", page02),
    ("page-03-social-v6.svg", page03),
    ("page-04-duo-v6.svg", page04),
    ("page-05-personal-v6.svg", page05),
]

if __name__ == "__main__":
    for name, fn in PAGES:
        path = os.path.join(ASSETS, name)
        with open(path, "w", encoding="utf-8") as f:
            f.write(fn())
        print(name, os.path.getsize(path))
    import xml.dom.minidom as minidom
    for name, _ in PAGES:
        minidom.parse(os.path.join(ASSETS, name))
    print("XML OK")
