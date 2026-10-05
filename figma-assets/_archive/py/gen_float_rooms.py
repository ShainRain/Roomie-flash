# -*- coding: utf-8 -*-
"""生成悬浮版房间 SVG：剥离天空背景 / 颗粒层 / 阳光带（它们依赖满幅画布），
房间本体几何与云朵完全保留，输出透明底供"纪念碑谷式聚焦"页面使用。"""
import os, re

BASE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(BASE, "figma-assets")

for src, dst in [("hero-room-ghibli.svg", "hero-room-ghibli-float.svg"),
                 ("hero-room-duo.svg", "hero-room-duo-float.svg")]:
    with open(os.path.join(ASSETS, src), encoding="utf-8") as f:
        svg = f.read()
    # 去掉满幅天空背景
    svg = re.sub(r'<rect width="1440" height="1360" fill="url\(#[a-z]+-bgsky\)"/>\n?', "", svg)
    # 去掉满幅颗粒层（feTurbulence 会铺满整个矩形，破坏透明底）
    svg = re.sub(r'<rect width="1440" height="1360" fill="#000000"[^/]*/>\n?', "", svg)
    # 去掉阳光带（硬边起止于画布边缘，透明底下难看）
    svg = re.sub(r'<g id="Sunlight">.*?</g>\n?', "", svg, flags=re.S)
    with open(os.path.join(ASSETS, dst), "w", encoding="utf-8") as f:
        f.write(svg)
    print("wrote", dst, len(svg))
