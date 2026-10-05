# -*- coding: utf-8 -*-
"""Generate 4 Roomie isometric house SVG variants (shared structure)."""
import os, random

OUT = r"C:\Roomie\figma-assets"
os.makedirs(OUT, exist_ok=True)

W, H = 480, 520

def P(i, j):
    """iso grid point: 8x8 diamond, top corner (240,242), tile (22,11)."""
    return (240 + 22 * (i - j), 242 + 11 * (i + j))

def f(v):
    s = f"{v:.1f}"
    if s.endswith(".0"):
        s = s[:-2]
    return s

def pts(points):
    return " ".join(f"{f(x)},{f(y)}" for x, y in points)

def poly(points, fill, extra=""):
    return f'<polygon points="{pts(points)}" fill="{fill}"{extra}/>'

def line(p1, p2, stroke, w, extra=""):
    return (f'<line x1="{f(p1[0])}" y1="{f(p1[1])}" x2="{f(p2[0])}" y2="{f(p2[1])}" '
            f'stroke="{stroke}" stroke-width="{w}"{extra}/>')

# 115deg linear gradient endpoints (CSS angle convention)
BG_GRAD = 'x1="0.047" y1="0.289" x2="0.953" y2="0.711"'

CREAM = "#F6F0E4"; CREAM_SHADE = "#EDE4D2"; LINEN = "#E7DCC8"
STONE = "#C8BBA4"; STONE_D = "#A89A80"
OAK = "#C49A6C"; OAK_D = "#A87F52"; OAK_L = "#CEA677"
MINT = "#C4DED2"; MINT_D = "#AFD0C2"; MINT_DD = "#9FC2B4"; MINT_BACK = "#B4D2C4"
INK = "#3E3A32"; INK_SOFT = "#7A7263"; GOLD = "#E8B04B"; QQ = "#31C27C"; QQ_D = "#1F9E63"


def house(px, v):
    """Shared house markup. v: variant dict. px: id prefix."""
    g = []

    # ---- island shadow (L0: radial ink 15% -> 0, offset bottom-right) ----
    g.append(f'<ellipse cx="255" cy="478" rx="150" ry="24" fill="url(#{px}shadow)"/>')

    # ---- floating rock underside (2-3 broken strata) ----
    underside = [(64, 330), (240, 418), (416, 330), (408, 344), (352, 376), (336, 368),
                 (312, 398), (268, 428), (240, 442), (212, 428), (168, 398), (144, 368),
                 (128, 376), (72, 344)]
    g.append(poly(underside, STONE))
    # right/bottom facets darker (light 35deg top-left)
    g.append(poly([(240, 418), (416, 330), (408, 344), (352, 376), (336, 368),
                   (312, 398), (268, 428), (240, 442)], STONE_D, ' opacity="0.9"'))
    g.append(poly([(240, 418), (336, 368), (312, 398), (268, 428), (240, 442)],
                  "#B9AC94"))
    # strata cracks
    g.append('<path d="M84,344 L150,376 L212,428" fill="none" stroke="%s" stroke-width="0.75" opacity="0.7"/>' % STONE_D)
    g.append('<path d="M396,344 L330,376 L268,428" fill="none" stroke="%s" stroke-width="0.75" opacity="0.7"/>' % STONE_D)
    # detached chips
    g.append(poly([(176, 452), (188, 458), (176, 464), (164, 458)], STONE))
    g.append(poly([(176, 458), (188, 458), (188, 464), (176, 470)], STONE_D))
    g.append(poly([(312, 446), (322, 451), (312, 456), (302, 451)], STONE))
    g.append(poly([(312, 451), (322, 451), (322, 456), (312, 461)], STONE_D))

    # ---- platform 8x8 diamond + grid ----
    plat = [P(0, 0), P(8, 0), P(8, 8), P(0, 8)]
    g.append(poly(plat, "#F1EADB"))
    grid = []
    for k in range(1, 8):
        grid.append(line(P(k, 0), P(k, 8), STONE, 0.75))
        grid.append(line(P(0, k), P(8, k), STONE, 0.75))
    g.append('<g opacity="0.85">' + "".join(grid) + "</g>")
    # platform rim
    g.append(f'<polygon points="{pts(plat)}" fill="none" stroke="{STONE_D}" stroke-width="1"/>')

    # ---- chimney (on left wall top, back) ----
    g.append(poly([(118, 142), (130, 148), (130, 192), (118, 186)], STONE_D))
    g.append(poly([(130, 148), (142, 142), (142, 186), (130, 192)], STONE))
    g.append(poly([(118, 142), (130, 136), (142, 142), (130, 148)], LINEN))
    g.append(f'<polygon points="{pts([(116, 141), (130, 134), (144, 141), (130, 148)])}" fill="none" stroke="{STONE_D}" stroke-width="1.5"/>')

    # ---- walls ----
    left_wall = [(240, 132), (86, 209), (86, 319), (240, 242)]
    right_wall = [(240, 132), (240, 242), (394, 319), (394, 209)]
    g.append(poly(right_wall, CREAM_SHADE))
    g.append(poly(left_wall, CREAM))
    # wall top caps
    g.append(line((240, 132), (86, 209), LINEN, 3))
    g.append(line((240, 132), (394, 209), LINEN, 3))
    g.append(line((86, 209), (86, 319), STONE_D, 1, ' opacity="0.4"'))
    g.append(line((394, 209), (394, 319), STONE_D, 1, ' opacity="0.4"'))

    # ---- fireplace in left wall ----
    g.append(poly([(187, 210), (139, 235), (139, 293), (187, 268)], STONE))
    g.append(poly([(178.4, 220.8), (147.6, 236.2), (147.6, 282.2), (178.4, 266.8)], INK))
    # hearth glow (shared, mild; snow adds stronger glow + flame via extras)
    g.append(f'<ellipse cx="163" cy="252" rx="26" ry="20" fill="url(#{px}fireglow)"/>')
    g.append(v.get("fireplace_extra", ""))
    # mantel
    g.append(poly([(189, 206), (137, 232), (139, 235), (187, 210), (191, 208)], OAK_D))

    # ---- floor-to-ceiling window in right wall ----
    win = [(306, 171), (383, 209.5), (383, 305.5), (306, 267)]
    g.append(poly(win, f"url(#{px}win)"))
    g.append(v.get("window_extra", ""))
    # frame + mullions
    g.append(f'<polygon points="{pts(win)}" fill="none" stroke="{OAK_D}" stroke-width="3" stroke-linejoin="round"/>')
    g.append(line((344.5, 190.3), (344.5, 286.3), OAK_D, 2))
    g.append(line((306, 219), (383, 257.5), OAK_D, 2))
    # window light halo
    g.append(v.get("lamp_glow", ""))

    # ---- oak floor (inset 1 tile) ----
    floor = [P(0, 0), P(7, 0), P(7, 7), P(0, 7)]
    g.append(poly(floor, OAK))
    planks = []
    for k in range(1, 7):
        planks.append(line(P(k, 0), P(k, 7), OAK_D, 0.75, ' opacity="0.45"'))
    g.append("".join(planks))
    g.append(v.get("floor_overlay", ""))
    # window light spill onto floor (falls toward front-left of window)
    g.append(poly([(310, 270), (380, 304), (334, 346), (268, 314)], v["spill"],
                  f' opacity="{v["spill_op"]}"'))
    g.append(v.get("floor_glow", ""))

    # ---- loft slab (back corner) ----
    g.append(poly([(174, 213), (240, 246), (240, 254), (174, 221)], OAK_D))
    g.append(poly([(240, 246), (306, 213), (306, 221), (240, 254)], "#B08A5C"))
    g.append(poly([(240, 180), (306, 213), (240, 246), (174, 213)], OAK))
    # post
    g.append(poly([(237, 250), (243, 250), (243, 308), (237, 308)], OAK_D))
    # books on loft
    g.append(poly([(192, 208), (202, 203), (212, 208), (202, 213)], LINEN))
    g.append(poly([(192, 208), (202, 213), (202, 216), (192, 211)], STONE_D))
    g.append(poly([(202, 213), (212, 208), (212, 211), (202, 216)], INK_SOFT))
    g.append(poly([(196, 202), (205, 197.5), (214, 202), (205, 206.5)], MINT))

    # ---- sofa (mint) ----
    g.append('<ellipse cx="222" cy="334" rx="30" ry="8" fill="%s" opacity="0.10"/>' % INK)
    g.append(poly([(196, 238), (152, 260), (152, 308), (196, 286)], MINT_BACK))
    g.append(poly([(240, 286), (196, 308), (196, 330), (240, 308)], MINT_DD))
    g.append(poly([(196, 308), (152, 286), (152, 308), (196, 330)], MINT_D))
    g.append(poly([(196, 264), (240, 286), (196, 308), (152, 286)], MINT))
    g.append(line((174, 275), (174, 297), MINT_DD, 1, ' opacity="0.7"'))
    # backrest top roll
    g.append(poly([(196, 238), (152, 260), (158, 263), (202, 241)], MINT))

    # ---- cat (ink silhouette, sitting) ----
    g.append('<ellipse cx="229" cy="346" rx="10" ry="3" fill="%s" opacity="0.12"/>' % INK)
    g.append('<ellipse cx="226" cy="333" rx="8" ry="10" fill="%s"/>' % INK)
    g.append('<circle cx="222" cy="319" r="6.5" fill="%s"/>' % INK)
    g.append(poly([(217, 316), (219, 308), (223, 314)], INK))
    g.append(poly([(222, 314), (226, 307), (228, 315)], INK))
    g.append('<path d="M233,339 q9,3 11,-5" fill="none" stroke="%s" stroke-width="2.5" stroke-linecap="round"/>' % INK)
    g.append('<circle cx="220" cy="318" r="0.9" fill="%s"/>' % CREAM)
    g.append('<circle cx="224" cy="318" r="0.9" fill="%s"/>' % CREAM)

    # ---- vinyl player ----
    g.append('<ellipse cx="342" cy="326" rx="26" ry="7" fill="%s" opacity="0.10"/>' % INK)
    g.append(poly([(330, 321), (356, 308), (356, 296), (330, 309)], OAK_D))
    g.append(poly([(304, 308), (330, 321), (330, 309), (304, 296)], OAK))
    g.append(poly([(304, 296), (330, 309), (356, 296), (330, 283)], OAK_L))
    g.append('<ellipse cx="322" cy="292" rx="13" ry="6.5" fill="%s"/>' % INK)
    g.append(f'<ellipse cx="322" cy="292" rx="3.5" ry="1.8" fill="{v["vinyl_label"]}"/>')
    g.append('<circle cx="322" cy="292" r="0.8" fill="%s"/>' % CREAM)
    g.append(line((340, 284), (326, 292), INK_SOFT, 2))
    g.append('<circle cx="340" cy="284" r="2" fill="%s"/>' % INK_SOFT)
    g.append(v.get("vinyl_extra", ""))

    # ---- plant ----
    tilt = ' transform="rotate(-5 300 344)"' if v.get("plant_tilt") else ""
    g.append(f'<g{tilt}>')
    g.append('<ellipse cx="292" cy="331" rx="5" ry="12" transform="rotate(-25 292 331)" fill="%s"/>' % QQ)
    g.append('<ellipse cx="300" cy="325" rx="5" ry="14" fill="%s"/>' % QQ_D)
    g.append('<ellipse cx="308" cy="332" rx="5" ry="11" transform="rotate(25 308 332)" fill="%s"/>' % QQ)
    g.append('</g>')
    g.append(poly([(292, 344), (308, 344), (305, 358), (295, 358)], OAK_D))
    g.append('<ellipse cx="300" cy="344" rx="8" ry="3" fill="%s"/>' % STONE_D)

    return "\n".join(g)


def radial(pid, color, op):
    return (f'<radialGradient id="{pid}" cx="0.5" cy="0.5" r="0.5">'
            f'<stop offset="0" stop-color="{color}" stop-opacity="{op}"/>'
            f'<stop offset="1" stop-color="{color}" stop-opacity="0"/></radialGradient>')


def bg_gradient(pid, c1, c2):
    return (f'<linearGradient id="{pid}" {BG_GRAD}>'
            f'<stop offset="0" stop-color="{c1}"/>'
            f'<stop offset="1" stop-color="{c2}"/></linearGradient>')


def build(name, px, bg1, bg2, v, winstops, extra_defs="", bg_extras="", front_extras=""):
    defs = [bg_gradient(f"{px}bg", bg1, bg2),
            radial(f"{px}shadow", INK, 0.15),
            radial(f"{px}fireglow", v["glow"], v.get("fireglow_op", 0.3)),
            (f'<linearGradient id="{px}win" x1="0" y1="0" x2="0" y2="1">'
             + "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in winstops)
             + '</linearGradient>')]
    if extra_defs:
        defs.append(extra_defs)
    body = house(px, v)
    svg = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
        f'viewBox="0 0 {W} {H}">\n'
        f'<defs>{"".join(defs)}</defs>\n'
        f'<rect width="{W}" height="{H}" fill="url(#{px}bg)"/>\n'
        f'{bg_extras}\n'
        f'<g id="roomie-house">{body}</g>\n'
        f'{front_extras}\n'
        '</svg>\n'
    )
    path = os.path.join(OUT, name)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(svg)
    return path


# ---------- shared variant base ----------
base = dict(glow="#FFD98A", spill="#FFD98A", spill_op=0.28, vinyl_label=GOLD)

# ================= 1. SUNSET =================
rng = random.Random(7)
motes = "".join(
    f'<circle cx="{rng.randint(60,420)}" cy="{rng.randint(120,300)}" r="{rng.choice([1,1.5,2])}" fill="{GOLD}" opacity="0.5"/>'
    for _ in range(6))
v = dict(base, plant_tilt=True, fireglow_op=0.35,
         floor_overlay=poly([P(0, 0), P(7, 0), P(7, 7), P(0, 7)], "#FFD98A", ' opacity="0.14"'))
sun_defs = radial("sunset-sun", "#FFD98A", 0.55)
sun_bg = (f'<circle cx="98" cy="88" r="92" fill="url(#sunset-sun)"/>'
          f'<circle cx="98" cy="88" r="26" fill="#FFE9BE" opacity="0.9"/>'
          f'<polygon points="0,40 480,300 480,384 0,124" fill="#FFD98A" opacity="0.10"/>'
          + motes)
build("house-sunset.svg", "sunset-", "#F2D9A0", "#F6E8C8", v,
      [(0, "#FFE9BE"), (1, "#FFD98A")],
      extra_defs=sun_defs, bg_extras=sun_bg)

# ================= 2. RAINY =================
rng = random.Random(11)
rain = []
for i in range(30):
    x = rng.randint(-10, 490); y = rng.randint(-10, 500)
    rain.append(line((x, y), (x - 7, y + 26), "#DCE6EC", 1, ' opacity="0.4" stroke-linecap="round"'))
rain_lines = "".join(rain)
fog = (poly([(308, 173), (381, 210.5), (381, 303.5), (308, 265)], "#E8EEF2", ' opacity="0.38"')
       + line((322, 190), (322, 260), "#F6F0E4", 2, ' opacity="0.35"')
       + line((362, 212), (362, 286), "#F6F0E4", 2, ' opacity="0.3"'))
vinyl_spin = ('<path d="M311,289 a13,6.5 0 0 1 8,-4.5" fill="none" stroke="#F6F0E4" stroke-width="1" opacity="0.6"/>'
              '<path d="M333,295 a13,6.5 0 0 1 -8,4.5" fill="none" stroke="#F6F0E4" stroke-width="1" opacity="0.6"/>'
              '<path d="M306,284 a18,9 0 0 1 6,-6" fill="none" stroke="#C8BBA4" stroke-width="1" opacity="0.5" stroke-dasharray="2 3"/>')
v = dict(base, glow="#FFC97A", spill="#FFC97A", spill_op=0.32, vinyl_label=QQ,
         window_extra=fog, vinyl_extra=vinyl_spin,
         lamp_glow='<ellipse cx="344" cy="240" rx="80" ry="60" fill="url(#rainy-lamp)"/>')
rain_defs = radial("rainy-lamp", "#FFC97A", 0.4)
build("house-rainy.svg", "rainy-", "#6B7B8C", "#9AA8B2", v,
      [(0, "#8FA0AE"), (0.55, "#C9B18A"), (1, "#FFC97A")],
      extra_defs=rain_defs, bg_extras=f'<g id="rain">{rain_lines}</g>')

# ================= 3. SNOW =================
rng = random.Random(23)
snow_back = "".join(
    f'<circle cx="{rng.randint(0,480)}" cy="{rng.randint(0,520)}" r="{f(rng.uniform(1.2,2.4))}" fill="#FFFFFF" opacity="{f(rng.uniform(0.6,0.95))}"/>'
    for _ in range(32))
snow_front = "".join(
    f'<circle cx="{rng.randint(0,480)}" cy="{rng.randint(0,520)}" r="{f(rng.uniform(1.8,2.8))}" fill="#FFFFFF" opacity="0.9"/>'
    for _ in range(8))
curtains = ('<path d="M306,171 L326,178.5 Q322,220 326,272 L306,267 Q310,220 306,171 Z" fill="#FBF8F1" opacity="0.95"/>'
            '<path d="M383,209.5 L364,202.5 Q368,255 364,300 L383,305.5 Q379,255 383,209.5 Z" fill="#FBF8F1" opacity="0.95"/>')
flame = ('<path d="M163,262 q-6,-10 0,-20 q6,10 0,20 Z" fill="#E8B04B"/>'
         '<path d="M163,260 q-3.5,-6 0,-12 q3.5,6 0,12 Z" fill="#FFD98A"/>')
v = dict(base, glow="#FFE9C4", spill="#FFE9C4", spill_op=0.3, vinyl_label="#FBF8F1",
         fireglow_op=0.6, window_extra=curtains, fireplace_extra=flame)
build("house-snow.svg", "snow-", "#DCE6EC", "#F2F4F4", v,
      [(0, "#FFF6E4"), (1, "#FFE9C4")],
      bg_extras=f'<g id="snow-back">{snow_back}</g>',
      front_extras=f'<g id="snow-front">{snow_front}</g>')

# ================= 4. GALAXY =================
rng = random.Random(42)
stars = []
for _ in range(36):
    x = rng.randint(0, 480); y = rng.randint(0, 300)
    stars.append(f'<circle cx="{x}" cy="{y}" r="{f(rng.uniform(0.7,1.4))}" fill="#FFFFFF" opacity="{f(rng.uniform(0.5,0.9))}"/>')
bright = ('<g stroke="#FFFFFF" stroke-width="1" opacity="0.95">'
          '<circle cx="92" cy="72" r="2" fill="#FFFFFF" stroke="none"/>'
          '<line x1="92" y1="64" x2="92" y2="80"/><line x1="84" y1="72" x2="100" y2="72"/></g>'
          '<g stroke="#FFFFFF" stroke-width="0.8" opacity="0.9">'
          '<circle cx="402" cy="56" r="1.6" fill="#FFFFFF" stroke="none"/>'
          '<line x1="402" y1="50" x2="402" y2="62"/><line x1="396" y1="56" x2="408" y2="56"/></g>')
aurora = ('<path d="M-20,120 C120,70 260,150 500,90 L500,140 C260,200 120,120 -20,170 Z" '
          'fill="url(#galaxy-aurora)"/>')
v = dict(base, glow="#BFE8D2", spill="#BFE8D2", spill_op=0.2, vinyl_label=QQ,
         fireglow_op=0.12,
         floor_glow='<ellipse cx="240" cy="326" rx="120" ry="38" fill="url(#galaxy-floorglow)"/>')
gal_defs = (f'<linearGradient id="galaxy-aurora" x1="0" y1="0" x2="0" y2="1">'
            f'<stop offset="0" stop-color="#C4DED2" stop-opacity="0.22"/>'
            f'<stop offset="1" stop-color="#C4DED2" stop-opacity="0"/></linearGradient>'
            + radial("galaxy-floorglow", "#BFE8D2", 0.18))
build("house-galaxy.svg", "galaxy-", "#232B3E", "#3A4A66", v,
      [(0, "#3A4A66"), (0.6, "#4E6A5E"), (1, "#BFE8D2")],
      extra_defs=gal_defs,
      bg_extras=f'<g id="stars">{"".join(stars)}{bright}</g>{aurora}')

print("done")
