# ROOMIE Visual Design & Frontend Construction Specification

> Version: 1.0
> Purpose: convert the current ROOMIE visual direction into an executable frontend construction document for an AI coding agent.
>
> This document separates **existing product/spec requirements** from **new visual implementation proposals**. Existing requirements are derived from the ROOMIE development manual and mini-program specification; proposed pixel/spacing values are implementation guidance and should be validated by screenshot comparison.

---

## 0. Mission

ROOMIE should feel like a **small, warm, inhabited late-night listening room**, not a generic music app and not a game menu.

The reference direction is:

- dark night environment outside
- warm 2700K-style interior illumination
- walnut furniture and record shelves
- cream paper-like UI surfaces
- restrained Roomie green for interaction/status
- amber/yellow as a secondary emotional accent
- hand-crafted editorial feel
- close-up isometric 2.5D room perspective
- visible depth, occlusion and spatial staging
- low-pressure companionship rather than high-pressure social networking

The existing product specification already defines Roomie as a DIY virtual screening/listening room and prioritizes shared listening, low-pressure expression, and shareable room postcards. fileciteturn0file1L16-L30

---

# 1. Non-negotiable engineering constraints

## 1.1 Preserve existing behavior

Do not redesign or remove:

- 10 registered pages
- five-item custom tab bar
- global player singleton
- room movement / collision / A* pathfinding
- local mock synchronization
- friend invitation flow
- duo synchronization flow
- architect mode persistence
- record-wall persistence
- postcard generation/share path

The development manual defines these as current implementation boundaries and explicitly states that the runtime source of truth is `miniprogram/`. fileciteturn0file0L24-L39

## 1.2 Visual changes must not become fake functionality

Do not make a static illustration of the app and call it implemented.

Do not use a full-page screenshot as the app UI.

Do not replace interactive objects with baked text inside an image.

All interactive states must remain real WXML/WXSS/JS interactions.

## 1.3 Existing room mechanics remain authoritative

The room must continue to use the existing square-frame isometric stage, shared room-map constraints, depth-based scale, furniture z-order and character occlusion rules. fileciteturn0file1L61-L73

---

# 2. Visual hierarchy

Across the whole app, visual attention should follow this order:

1. Room / spatial scene
2. Character / social presence
3. Primary action
4. Music playback state
5. Supporting information
6. Navigation

The room is the brand object. UI should frame it rather than compete with it.

For the room itself, keep the existing priority order:

`character walkable area > player and projection wall > record wall > decorative objects`

This is consistent with the current development manual. fileciteturn0file0L78-L89

---

# 3. Master design tokens

These are implementation proposals derived from the current visual baseline. Existing global color values should remain compatible with the current tokens unless intentionally revised in the codebase. The current spec defines the core green, cream, sky-blue, amber and text colors. fileciteturn0file1L133-L155

## 3.1 Color system

```text
ROOMIE_GREEN       #22C55E
ROOMIE_GREEN_DARK  #16A34A
ROOMIE_GREEN_SOFT  #E8F9EF

NIGHT_950          #0B1320
NIGHT_900          #101B2A
NIGHT_850          #172437
NIGHT_800          #1E2E42

PAPER_100          #F7F3EA
PAPER_95           #FBF8F1
PAPER_90           #F1ECE0

INK_900            #1F2329
INK_700            #4B5563
INK_500            #8A8F98

WALNUT_900         #2B1A12
WALNUT_700         #4A2E1D
WALNUT_500         #7B5030

AMBER              #F5B83D
AMBER_SOFT         #FFF1CF

LINE               #ECE7DA
ERROR              #D96B55
```

### Usage rule

- Green: primary CTA, LIVE/online, sync state, positive confirmation.
- Amber: room light, collection/reward accents, emotional highlights.
- Cream: major information surfaces.
- Night blue: app shell and empty space surrounding the room.
- Walnut: room furniture and visual anchors.
- Avoid large green background areas except for primary CTA buttons.

The existing specification explicitly requires green for primary operations and LIVE/online states, and reserves amber as an accent. fileciteturn0file1L143-L155

---

## 3.2 Typography

Keep the existing Chinese-first MiSans/system-font approach and English fallback family. fileciteturn0file1L147-L153

Proposed scale for the visual reference:

```text
Display XL     30–34 px / 700
Display        26–30 px / 700
Page Title     21–24 px / 700
Section Title  17–19 px / 700
Body           14–16 px / 400–500
Caption        11–13 px / 400
Micro          10–11 px / 500
```

Recommended line-height:

```text
Display: 1.15
Title:   1.25
Body:    1.45
Caption: 1.35
```

Do not introduce a new font family on individual pages.

---

## 3.3 Spacing

Base spacing unit: 4 px.

```text
4   micro
8   compact
12  small
16  normal
20  medium
24  card
32  section
40  hero
48  major separation
```

Keep outer page padding around 20–24 px on a ~375 px logical width baseline; convert to `rpx` through the project's existing responsive strategy.

Do not independently tune every page's spacing. Use shared tokens first.

---

## 3.4 Radius

Current specification uses 32rpx card radius and 999rpx pill radius. Keep that semantic structure. fileciteturn0file1L143-L146

Proposed semantic mapping:

```text
Pill            9999px
Large Card      24–32px
Medium Card     18–24px
Small Card      12–16px
Image Frame     16–20px
```

---

## 3.5 Shadow

Avoid modern glassmorphism or exaggerated neon glow.

Use 3 shadow families only:

```text
Paper card:
0 8px 24px rgba(20, 30, 40, .10)

Floating control:
0 6px 18px rgba(0, 0, 0, .16)

Room object:
soft directional shadow matching room light
```

---

# 4. Global app shell

Every major page shares:

```text
NIGHT BACKGROUND
    ↓
ROOMIE HEADER
    ↓
PAGE CONTENT
    ↓
FLOATING / CONTENT CONTROLS
    ↓
CUSTOM TAB BAR
```

## Header

Approximate vertical structure:

```text
Top safe-area       12–18 px
Brand               11–13 px tracking
Room ID subtitle    11–12 px
Page title          22–30 px
Optional subtitle   12–14 px
```

Header should feel like a small editorial masthead, not a standard enterprise navbar.

The existing spec requires page titles to use a Chinese main title plus a small English subtitle. fileciteturn0file1L149-L154

## LIVE pill

- Height: ~30–34 px
- Pill radius
- Cream/green surface
- Green dot
- Bold but small text

Do not use red for online/live semantics.

## Tab bar

Five items:

```text
房间 | 好友 | + | 消息 | 我
```

The center `+` is a raised green circle.

Do not let the tab bar visually overpower the room.

---

# 5. Room-world construction system

The room is the most important visual asset in the entire product.

## 5.1 Spatial layers

Recommended rendering order:

```text
Z 0   Night / atmospheric background
Z 10  Room base / walls / floor
Z 20  Large furniture
Z 30  Shelves / records / equipment
Z 40  Medium decorative objects
Z 50  Characters
Z 60  Foreground occluders
Z 70  Object interaction indicators
Z 100 Global UI overlay
Z 200 Toast / transient feedback
```

These values are implementation conventions; adapt them to the existing room scene structure.

## 5.2 Lighting

Primary room illumination comes from:

- projector
- floor/desk lamps
- warm edge lighting on shelves

Outside the room:

- cool, dark, low-contrast night environment

Inside:

- warm, medium contrast
- cream walls
- deep walnut furniture
- amber highlights

The current spec defines 2700K–6000K lighting control and states that default room lighting should use warm 2700K light while 6000K is reserved for architect-mode preview. fileciteturn0file0L84-L87 fileciteturn0file1L94-L99

## 5.3 Materials

At least five material families must remain visually distinguishable:

```text
painted wall
walnut wood
vinyl / record
metal
fabric / upholstery
```

Avoid making all objects look like the same flat vector material. This is an explicit room-visual requirement in the current specification. fileciteturn0file1L175-L180

---

# 6. Shared component library

Create or standardize the following components before redesigning individual pages.

## 6.1 `roomie-header`

Props:

```text
brand
roomId
pageTitle
pageSubtitle
showLive
showBack
showAction
```

## 6.2 `roomie-status-pill`

Variants:

```text
live
online
syncing
playing
saved
```

## 6.3 `roomie-paper-card`

Rules:

- cream surface
- subtle texture if technically practical
- soft shadow
- no excessive border
- 24–32px semantic radius

## 6.4 `roomie-player`

Must consume the global `Player` snapshot rather than implementing a duplicate timer/state machine. This matches the current specification. fileciteturn0file1L50-L59

## 6.5 `roomie-green-button`

Variants:

```text
primary
secondary-outline
compact
icon
```

## 6.6 `roomie-record`

Supports:

```text
cover
vinyl
selected
locked
playing
```

## 6.7 `roomie-room-frame`

Owns the common room stage proportions and visual treatment.

It should not own business logic.

## 6.8 `roomie-floating-bubble`

Used for:

```text
MOMO · 走近唱机
KIKI · 正在播放
+12 氛围值
同步中 · 95%
```

Keep copy short and visibly tied to an object or state.

---

# 7. Page-by-page construction specification

---

## 7.1 HOME — `pages/home/home`

### Goal

First impression: “there is a room here that someone can enter.”

### Layout

```text
Header
↓
Tonight statement
↓
Large isometric room hero
↓
Floating status / atmosphere pills
↓
Mission card
↓
Mini player
↓
Primary CTA
↓
Tab bar
```

### Hero

Hero room should consume roughly 48–56% of the initial page height on the target viewport.

Do not push the room below the fold.

### Hero room

Must clearly show:

- record wall
- projector / projection wall
- turntable
- sofa
- at least one lamp
- guitar / instrument corner
- character

The room should remain square and uncropped, consistent with the existing room-frame requirement. fileciteturn0file1L67-L70

### Hero text

Primary example:

`今晚，`
`MOMO 想放一首歌`

Secondary:

`你的房间正在等待一位 roomie …`

Do not use a giant app title above the room that steals visual focus.

### Status pill

Top-left of room:

`● 放映中 · 2 位 roomie`

Top-right:

`+12 氛围值`

### Mission

Paper card with:

```text
今晚的放映任务
让 KIKI 找到唱片墙          +80 XP
```

Keep mission copy compact.

### Player

Dark player card.

Primary hierarchy:

```text
album/record
song
artist
progress
play button
```

### CTA

`进入放映室 →`

Green filled capsule.

### Page-specific anti-patterns

Do not:

- turn the hero into a generic banner
- shrink the room into a thumbnail
- use five equal-weight information cards above it

---

## 7.2 FRIENDS — `pages/friends/friends`

### Concept

“Friends live around you tonight.”

### Top visual

Use multiple miniature isometric room windows / room clusters as the social visual anchor.

This is a visual implementation proposal; do not change the underlying friend data model.

### List structure

```text
在好友里的在线房间
    KIKI     在房间 · 晴天          来坐坐
    小鱼      在房间 · 看电影        来坐坐
    阿柯      听歌 · 午夜歌单        来坐坐

离线好友
    ...
```

### Card

Use cream cards with avatar + status + green action.

Avoid standard social-media follower UI.

### Main visual ratio

Top mini-room area: ~30–35%
Friends list: ~55–60%
Tab: remaining

---

## 7.3 SONG — `pages/song/song`

### Concept

“A record pulled out of the Roomie room.”

### Structure

```text
Header
↓
Large record / album visual
↓
Song metadata
↓
Progress
↓
Transport controls
↓
Lyrics / comments tabs
↓
Lyrics block
↓
Interaction row
↓
Tab
```

### Hero visual

Use the room/record visual language rather than a generic music-streaming gradient.

The existing player contract includes play/pause, previous/next, looping, seek, lyrics index and shared snapshots. Preserve it. fileciteturn0file1L50-L59

### Lyrics

Cream paper area over the night shell.

Current lyric line is green or darker/high-contrast.

Do not over-animate the lyrics.

---

## 7.4 DUO — `pages/duo/duo`

### Concept

Two people are physically present in the same room.

### Hero

Large isometric room occupying roughly 55–62% of the page.

MOMO + KIKI must exist inside the same scene.

### State overlay

Top-right:

`◉ 同频中 · 95%`

Secondary pill:

`+ MOMO 正在控制`

### Bottom

Shared player card.

Primary negative/secondary action:

`退出双人房`

Use outline/soft-warning treatment, not aggressive red unless required by existing semantics.

The current spec defines duo sync as an explicit page state with 95–99% demo sync values, shared player, control text and exit confirmation. fileciteturn0file1L85-L92

### Most important rule

Do not reduce the duo experience to two avatars side by side.

It must read as:

`two people + one room + one song`

---

## 7.5 ARCHITECT — `pages/architect/architect`

### Concept

A room designer's workbench.

### Layout

```text
Header
↓
Large isometric room preview
↓
Floating editor controls
↓
Cream control sheet
    家具 | 地板 | 灯光
↓
Furniture grid / floor swatches / temperature slider
↓
Save
↓
Tab / utility area
```

### Room preview

Keep the same camera, room geometry and furniture art language as HOME/ROOM.

Never generate a new “Architect style” room.

### Furniture

Current implementation has 12 furniture options and supports multi-select; preserve that behavior. fileciteturn0file1L94-L99

### Temperature

```text
2700K ───────── 6000K
```

The selected temperature should be visually obvious.

### Interaction

Save states:

```text
保存
→
已保存
```

Do not use only a transient toast to communicate success.

---

## 7.6 PROFILE / MY ROOM — `pages/profile/profile`

### Concept

“My personal room archive.”

### Structure

```text
Header
↓
Character profile card
↓
My record wall
↓
Achievements / badges
↓
My room thumbnail
↓
Character customization placeholders
↓
Tab
```

### Character card

MOMO / level / architect badge.

Example:

`MOMO   Lv.4   建筑师`

### Record wall

Show the selection count:

`已选 8/12`

Maximum 12 remains the functional limit. Zero-selection state must remain available. fileciteturn0file1L102-L107

### Room thumbnail

Use a real room image from the same room-world system.

Do not use an unrelated profile banner.

---

## 7.7 POSTCARD — `pages/postcard/postcard`

### Concept

A physical-feeling postcard sent out from the Roomie world.

### Main composition

```text
paper background
└── postcard sheet
    ├── room image
    ├── handwritten-style slogan
    ├── ROOM ID
    ├── stamp / record mark
    └── small decorative marks
```

Recommended slogan:

`有音乐的房间，抵千万句寒暄`

This matches the current postcard specification. fileciteturn0file1L109-L114

### Buttons

```text
保存到相册
分享
```

Primary share button: green.

Save button: cream/outline/green-border.

### Important

Do not use WebP directly for unstable Canvas/share paths; keep the specified JPG postcard asset route. fileciteturn0file0L69-L74

---

# 8. Room furniture asset specification

The room should use a stable reusable asset vocabulary.

## Required high-value assets

```text
record-shelf
record-wall
turntable
amplifier
projector
projection-screen
sofa
floor-lamp
guitar
speaker
coffee-table
plant
floor-record
side-table
```

### Asset roles

Each asset must define:

```text
id
asset-path
x
 y
scale
rotation
zIndex
clickArea
collisionArea
lightResponse
occludesCharacter
```

The existing development manual explicitly requires newly added furniture to document occupied area, click area, occlusion order and collision boundary. fileciteturn0file0L87-L89

---

# 9. Character visual specification

MOMO:

- orange round character
- temporary demo asset

KIKI:

- yellow character
- temporary demo asset

Both:

- same sprite dimensions
- consistent shadow
- same light direction
- transparent background
- same baseline / foot contact
- depth scale approximately 0.8–1.05 according to room depth

The existing specification defines these character constraints and sprite states. fileciteturn0file1L63-L70

Temporary reference assets must be replaced by authorized/original assets before external release. fileciteturn0file1L153-L156

---

# 10. Interaction / motion language

Motion should be subtle.

## Press

```text
scale 0.98
120–160ms
```

## Card entrance

```text
opacity 0 → 1
translateY 8px → 0
180–240ms
```

## Room character movement

Use the existing pathfinding / movement system.

Do not replace movement with generic CSS transforms that bypass `room-map.js`.

## Light transition

```text
250–450ms
```

The room should change atmosphere, not geometry.

## Sync state

Green status should gently pulse or animate at very low amplitude.

Do not use flashy game-like particles.

---

# 11. Asset production rules

Reference images should be decomposed into production assets rather than used as full-screen screenshots.

Recommended folders:

```text
reference-assets/
├── ui-reference/
│   ├── home.png
│   ├── friends.png
│   ├── song.png
│   ├── duo.png
│   ├── architect.png
│   ├── profile.png
│   └── postcard.png
│
├── room-world/
│   ├── room-base.webp
│   ├── furniture/
│   ├── characters/
│   ├── lighting/
│   └── decorations/
│
└── ui-assets/
    ├── icons/
    ├── records/
    ├── textures/
    └── postcard/
```

The existing development manual already reserves `reference-assets/room-inspiration/` for visual review and keeps runtime assets separate from design/reference material. fileciteturn0file0L35-L39

Do not place real third-party posters, watermarks, platform branding or copyrighted album art from inspiration photos directly into the release build. The current specification explicitly requires original, abstract or authorized substitutes. fileciteturn0file1L177-L180

---

# 12. Screenshot validation system

Never accept “looks close enough” as the final criterion.

## Directory

```text
visual-validation/
├── reference/
├── rendered/
└── diff/
```

Each page:

```text
reference/home.png
rendered/home.png
diff/home.png
```

## Review order

Check in this order:

1. overall composition
2. room size and position
3. major block heights
4. spacing
5. typography
6. image scale/crop
7. color
8. shadow
9. icon placement
10. micro details

Never spend ten minutes tuning icon sizes while the room is 20% too small.

## Visual review notes

For each screenshot, record:

```text
Layout: pass/fail
Room scale: pass/fail
Typography: pass/fail
Color: pass/fail
Material: pass/fail
Character depth: pass/fail
UI hierarchy: pass/fail
Interaction visibility: pass/fail
```

The existing manual requires visual changes to be backed by preview/screenshot evidence and distinguishes visual evidence from logic verification. fileciteturn0file0L93-L97

---

# 13. Agent implementation sequence

## Phase 1 — audit

Do not modify UI yet.

Inspect:

```text
miniprogram/app.wxss
app.json
custom-tab-bar/
components/mini-player/
pages/home/
pages/friends/
pages/song/
pages/duo/
pages/architect/
pages/profile/
pages/postcard/
pages/room/
pages/create/
pages/messages/
```

Return:

- page tree
- shared components
- current design tokens
- current room asset architecture
- current navigation
- current player architecture
- current visual inconsistencies

## Phase 2 — foundations

Implement only:

- color tokens
- typography tokens
- spacing
- radius
- shadows
- shared header
- shared cards
- shared buttons
- shared status pill
- shared player styling
- tab styling

Then screenshot.

## Phase 3 — Home as visual master

Do not proceed until Home establishes the final visual language.

## Phase 4 — Room world

Unify room visual asset structure, character scale, z-order and lighting.

## Phase 5 — remaining six visual references

Implement:

```text
Friends
Song
Duo
Architect
Profile
Postcard
```

## Phase 6 — cross-page consistency

Check:

- same header
- same button language
- same status pill
- same player
- same record style
- same room camera
- same night/warm contrast
- same character rendering

## Phase 7 — regression

Run existing tests:

```powershell
node tools/test-player.js
node tools/test-sync.js
node tools/test-room-map.js
node tools/check-bindings.js
```

Then JS syntax check across the project.

The current development manual specifies these validation commands. fileciteturn0file0L100-L121

---

# 14. Definition of visual done

A page is visually complete only when:

1. its layout is recognizably the same composition as the designated reference;
2. it uses the shared Roomie design tokens;
3. its room scene uses the common room-world system;
4. major visual assets are real layered assets, not a screenshot background;
5. interactive states remain real and functional;
6. a screenshot has been captured at the target viewport;
7. the screenshot has been compared against its reference;
8. major mismatches have been corrected;
9. functional regression checks remain green.

The project's existing completion definition similarly requires correct routes/state, synchronized behavior, explicit empty/error states, validation and visual/manual evidence. fileciteturn0file0L124-L134

---

# 15. Agent instruction block — paste into Kimi Code / Codex

```text
你现在负责 ROOMIE 的视觉工程实现。

不要重新设计产品。
不要删功能。
不要改变现有路由、状态机、room-map、room-sync、播放器逻辑。

你的工作是：

REFERENCE IMAGE
→ DESIGN TOKENS
→ SHARED COMPONENTS
→ PAGE LAYOUT
→ REAL ASSETS
→ SCREENSHOT
→ VISUAL COMPARISON
→ ITERATION

而不是：

REFERENCE IMAGE
→ 猜 CSS
→ 一次性完成

执行顺序必须是：

1. 审计现有代码，不改代码。
2. 输出当前页面结构与视觉问题。
3. 建立全局 Design Tokens。
4. 建立公共 Header / Card / Button / Status / Player / Record 组件。
5. 先完成 Home。
6. 截图并比较 reference/home.png。
7. 修正 Home，直到房间比例、层级、字体、间距和整体视觉达到稳定基准。
8. 将 Home 的视觉系统迁移到 Roomie 其它页面。
9. 继续 Friends / Song / Duo / Architect / Profile / Postcard。
10. 每个页面都必须截图验证。
11. 最后运行全部现有测试与 JS syntax check。

最高视觉优先级：

等距微距房间
> 角色与空间
> 唱片墙 / 放映墙
> 主要 CTA
> 播放器
> 其它 UI

ROOMIE 必须像一个“可以进入的小型音乐房间”。

不要把它做成普通音乐 App。
不要把它做成普通游戏菜单。
不要用整张图片伪装 UI。
不要让每个页面拥有不同的视觉风格。

视觉风格固定为：

深夜蓝 + 胡桃木 + 米白纸张 + 2700K 暖光 + Roomie 绿色 + 少量琥珀色。

外部冷，内部暖。
UI 克制，房间成为主角。

参考图中的海报、品牌、唱片封面和水印不能直接进入最终运行时资产。
使用原创抽象封面、几何图形或授权素材替代。

每次修改都必须告诉我：
- 修改了什么
- 为什么改
- 截图在哪里
- 与参考图的主要差异还剩什么
- 测试是否通过
```

---

# 16. Recommended first implementation target

Do **not** start with all 7 pages simultaneously.

First make these three assets stable:

```text
A. global app shell
B. Home page
C. shared room-world visual system
```

Once those three are visually stable, the other pages become compositions of the same system instead of seven independent redesign projects.

This approach is also aligned with the existing Roomie requirement that the room, player, characters, furniture and visual language stay consistent across the interaction loop. fileciteturn0file1L189-L201
