# -*- coding: utf-8 -*-
"""悬浮房间美术后处理：按 alpha 通道裁剪到内容包围盒 + 留白边，缩放到 1080 宽。"""
import os
from PIL import Image

BASE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(BASE, "figma-assets")

PAD = 30
for src, dst in [("hero-art-ghibli-float.png", "hero-art-qq-float-1080.png"),
                 ("hero-art-duo-float.png", "hero-art-duo-float-1080.png")]:
    im = Image.open(os.path.join(ASSETS, src)).convert("RGBA")
    bbox = im.getchannel("A").getbbox()
    l, t, r, b = bbox
    l = max(0, l - PAD); t = max(0, t - PAD)
    r = min(im.width, r + PAD); b = min(im.height, b + PAD)
    im = im.crop((l, t, r, b))
    w = 1080
    h = round(im.height * w / im.width)
    im = im.resize((w, h), Image.LANCZOS)
    im.save(os.path.join(ASSETS, dst), optimize=True)
    print(dst, im.size)
