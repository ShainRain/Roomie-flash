// 由 tools/gen-room-master.js 生成,请勿手改
// Room Master Scene 单一数据源:几何/灯光层/家具(§5.1 schema)/唱片槽位/唱盘
module.exports = {
  "GEOMETRY": {
    "canvas": 828,
    "X0": 414,
    "Y0": 235,
    "SX": 480,
    "SY": 250,
    "WALL_H": 440,
    "depthTopMin": 32,
    "depthTopMax": 85
  },
  "LAYERS": {
    "L0": "/assets/img/room/room-base.webp",
    "L1": "/assets/img/room/ambient-shadow.webp",
    "L2": "/assets/img/room/cool-night-window.webp",
    "L3": "/assets/img/room/warm-light-room.webp",
    "L4": "/assets/img/room/shelf-edge-glow.webp",
    "L5": "/assets/img/room/lamp-pool.webp",
    "L6": "/assets/img/room/warm-veil-char.webp",
    "L7": "/assets/img/room/projector-beam.webp"
  },
  "FURNITURE": [
    {
      "id": "sofa",
      "key": "sofa",
      "label": "沙发",
      "name": "沙发",
      "asset": "/assets/img/room/furn-sofa.webp",
      "thumb": "/assets/img/room/furn-thumb-sofa.webp",
      "anchor": {
        "x": 29.71,
        "y": 39.25
      },
      "bounds": {
        "left": 16.38,
        "top": 26.57,
        "width": 26.67,
        "height": 25.36
      },
      "scale": 1,
      "rotation": 0,
      "z": 519,
      "lightResponse": {
        "warm": 0.85,
        "cool": 0.2,
        "emissive": 0
      },
      "occludesCharacter": true,
      "hitArea": {
        "left": 20.6,
        "top": 30.6,
        "width": 18.1,
        "height": 17.2
      },
      "collision": {
        "u0": 0.02,
        "v0": 0.3,
        "u1": 0.18,
        "v1": 0.6
      },
      "fixed": false,
      "interaction": "sit",
      "hotspot": {
        "id": "sofa",
        "icon": "▰",
        "name": "沙发",
        "left": 20.6,
        "top": 30.6,
        "width": 18.1,
        "height": 17.2
      }
    },
    {
      "id": "vinyl-player",
      "key": "vinyl-player",
      "label": "黑胶机",
      "name": "黑胶机",
      "asset": "/assets/img/room/furn-vinyl-player.webp",
      "thumb": "/assets/img/room/furn-thumb-vinyl-player.webp",
      "anchor": {
        "x": 84.2,
        "y": 43.18
      },
      "bounds": {
        "left": 63.91,
        "top": 23.55,
        "width": 40.58,
        "height": 39.25
      },
      "scale": 1,
      "rotation": 0,
      "z": 628,
      "lightResponse": {
        "warm": 0.9,
        "cool": 0.25,
        "emissive": 0.15
      },
      "occludesCharacter": true,
      "hitArea": {
        "left": 70.4,
        "top": 29.8,
        "width": 27.6,
        "height": 26.7
      },
      "collision": {
        "u0": 0.42,
        "v0": 0.02,
        "u1": 0.96,
        "v1": 0.18
      },
      "fixed": false,
      "interaction": "play-hint",
      "hotspot": {
        "id": "turntable",
        "icon": "◎",
        "name": "唱机柜",
        "left": 70.4,
        "top": 29.8,
        "width": 27.6,
        "height": 26.7
      }
    },
    {
      "id": "table",
      "key": "table",
      "label": "茶几",
      "name": "茶几",
      "asset": "/assets/img/room/furn-table.webp",
      "thumb": "/assets/img/room/furn-thumb-table.webp",
      "anchor": {
        "x": 37.83,
        "y": 52.96
      },
      "bounds": {
        "left": 28.55,
        "top": 44.63,
        "width": 18.55,
        "height": 16.67
      },
      "scale": 1,
      "rotation": 0,
      "z": 613,
      "lightResponse": {
        "warm": 0.9,
        "cool": 0.25,
        "emissive": 0
      },
      "occludesCharacter": true,
      "hitArea": null,
      "collision": {
        "u0": 0.28,
        "v0": 0.5,
        "u1": 0.44,
        "v1": 0.64
      },
      "fixed": true,
      "interaction": null,
      "hotspot": null
    },
    {
      "id": "cat-bed",
      "key": "cat-bed",
      "label": "猫窝",
      "name": "猫窝",
      "asset": "/assets/img/room/furn-cat-bed.webp",
      "thumb": "/assets/img/room/furn-thumb-cat-bed.webp",
      "anchor": {
        "x": 17.54,
        "y": 55.92
      },
      "bounds": {
        "left": 10.58,
        "top": 50.85,
        "width": 13.91,
        "height": 10.14
      },
      "scale": 1,
      "rotation": 0,
      "z": 610,
      "lightResponse": {
        "warm": 0.7,
        "cool": 0.2,
        "emissive": 0
      },
      "occludesCharacter": true,
      "hitArea": null,
      "collision": null,
      "fixed": false,
      "interaction": null,
      "hotspot": null
    },
    {
      "id": "lamp",
      "key": "lamp",
      "label": "落地灯",
      "name": "落地灯",
      "asset": "/assets/img/room/furn-lamp.webp",
      "thumb": "/assets/img/room/furn-thumb-lamp.webp",
      "anchor": {
        "x": 76,
        "y": 52
      },
      "bounds": {
        "left": 63,
        "top": 34,
        "width": 26,
        "height": 34
      },
      "scale": 1,
      "rotation": 0,
      "z": 697,
      "lightResponse": {
        "warm": 0.35,
        "cool": 0.15,
        "emissive": 0.95
      },
      "occludesCharacter": true,
      "hitArea": {
        "left": 67.2,
        "top": 39.4,
        "width": 17.7,
        "height": 23.1
      },
      "collision": {
        "u0": 0.85,
        "v0": 0.3,
        "u1": 0.95,
        "v1": 0.42
      },
      "fixed": false,
      "interaction": "lamp",
      "hotspot": {
        "id": "lamp",
        "icon": "☼",
        "name": "落地灯",
        "left": 67.2,
        "top": 39.4,
        "width": 17.7,
        "height": 23.1
      }
    },
    {
      "id": "plant",
      "key": "plant",
      "label": "绿植",
      "name": "绿植",
      "asset": "/assets/img/room/furn-plant.webp",
      "thumb": "/assets/img/room/furn-thumb-plant.webp",
      "anchor": {
        "x": 6.81,
        "y": 49.97
      },
      "bounds": {
        "left": -2.17,
        "top": 39.25,
        "width": 17.97,
        "height": 21.44
      },
      "scale": 1,
      "rotation": 0,
      "z": 607,
      "lightResponse": {
        "warm": 0.75,
        "cool": 0.3,
        "emissive": 0
      },
      "occludesCharacter": true,
      "hitArea": null,
      "collision": {
        "u0": 0.02,
        "v0": 0.74,
        "u1": 0.15,
        "v1": 0.92
      },
      "fixed": false,
      "interaction": null,
      "hotspot": null
    },
    {
      "id": "rug",
      "key": "rug",
      "label": "地毯",
      "name": "地毯",
      "asset": "/assets/img/room/furn-rug.webp",
      "thumb": "/assets/img/room/furn-thumb-rug.webp",
      "anchor": {
        "x": 50,
        "y": 60.4
      },
      "bounds": {
        "left": 27,
        "top": 52,
        "width": 46,
        "height": 17
      },
      "scale": 1,
      "rotation": 0,
      "z": 500,
      "lightResponse": {
        "warm": 0.6,
        "cool": 0.2,
        "emissive": 0
      },
      "occludesCharacter": false,
      "hitArea": null,
      "collision": null,
      "fixed": false,
      "interaction": null,
      "hotspot": null
    },
    {
      "id": "curtain",
      "key": "curtain",
      "label": "挂帘",
      "name": "挂帘",
      "asset": "/assets/img/room/furn-curtain.webp",
      "thumb": "/assets/img/room/furn-thumb-curtain.webp",
      "anchor": {
        "x": 93.2,
        "y": 31.6
      },
      "bounds": {
        "left": 89.88,
        "top": 10.1,
        "width": 6.67,
        "height": 35.09
      },
      "scale": 1,
      "rotation": 0,
      "z": 300,
      "lightResponse": {
        "warm": 0.5,
        "cool": 0.45,
        "emissive": 0
      },
      "occludesCharacter": false,
      "hitArea": null,
      "collision": null,
      "fixed": false,
      "interaction": null,
      "hotspot": null
    },
    {
      "id": "projector",
      "key": "projector",
      "label": "放映机",
      "name": "放映机",
      "asset": "/assets/img/room/furn-projector.webp",
      "thumb": "/assets/img/room/furn-thumb-projector.webp",
      "anchor": {
        "x": 37.1,
        "y": 54.03
      },
      "bounds": {
        "left": 33.19,
        "top": 50.54,
        "width": 7.83,
        "height": 6.97
      },
      "scale": 1,
      "rotation": 0,
      "z": 575,
      "lightResponse": {
        "warm": 0.5,
        "cool": 0.3,
        "emissive": 0.6
      },
      "occludesCharacter": true,
      "hitArea": {
        "left": 34.4,
        "top": 51.7,
        "width": 5.3,
        "height": 4.7
      },
      "collision": null,
      "fixed": false,
      "interaction": "projector",
      "hotspot": {
        "id": "projector",
        "icon": "✦",
        "name": "放映机",
        "left": 34.4,
        "top": 51.7,
        "width": 5.3,
        "height": 4.7
      }
    },
    {
      "id": "poster",
      "key": "poster",
      "label": "海报",
      "name": "海报",
      "asset": "/assets/img/room/furn-poster.webp",
      "thumb": "/assets/img/room/furn-thumb-poster.webp",
      "anchor": {
        "x": 56,
        "y": 13
      },
      "bounds": {
        "left": 52.9,
        "top": 0.13,
        "width": 6.09,
        "height": 24.43
      },
      "scale": 1,
      "rotation": 0,
      "z": 300,
      "lightResponse": {
        "warm": 0.8,
        "cool": 0.4,
        "emissive": 0
      },
      "occludesCharacter": false,
      "hitArea": null,
      "collision": null,
      "fixed": false,
      "interaction": null,
      "hotspot": null
    },
    {
      "id": "coffee",
      "key": "coffee",
      "label": "咖啡机",
      "name": "咖啡机",
      "asset": "/assets/img/room/furn-coffee.webp",
      "thumb": "/assets/img/room/furn-thumb-coffee.webp",
      "anchor": {
        "x": 88.6,
        "y": 32.2
      },
      "bounds": {
        "left": 86.64,
        "top": 28.76,
        "width": 3.59,
        "height": 6.76
      },
      "scale": 1,
      "rotation": 0,
      "z": 300,
      "lightResponse": {
        "warm": 0.7,
        "cool": 0.4,
        "emissive": 0.2
      },
      "occludesCharacter": false,
      "hitArea": null,
      "collision": null,
      "fixed": false,
      "interaction": null,
      "hotspot": null
    },
    {
      "id": "bookshelf",
      "key": "bookshelf",
      "label": "书架",
      "name": "书架",
      "asset": "/assets/img/room/furn-bookshelf.webp",
      "thumb": "/assets/img/room/furn-thumb-bookshelf.webp",
      "anchor": {
        "x": 77.8,
        "y": 37.3
      },
      "bounds": {
        "left": 68.55,
        "top": 28.48,
        "width": 18.55,
        "height": 16.84
      },
      "scale": 1,
      "rotation": 0,
      "z": 300,
      "lightResponse": {
        "warm": 0.8,
        "cool": 0.35,
        "emissive": 0
      },
      "occludesCharacter": false,
      "hitArea": null,
      "collision": null,
      "fixed": false,
      "interaction": null,
      "hotspot": null
    },
    {
      "id": "doll",
      "key": "doll",
      "label": "玩偶",
      "name": "玩偶",
      "asset": "/assets/img/room/furn-doll.webp",
      "thumb": "/assets/img/room/furn-thumb-doll.webp",
      "anchor": {
        "x": 26.81,
        "y": 52.54
      },
      "bounds": {
        "left": 24.49,
        "top": 46.5,
        "width": 4.64,
        "height": 12.08
      },
      "scale": 1,
      "rotation": 0,
      "z": 586,
      "lightResponse": {
        "warm": 0.7,
        "cool": 0.2,
        "emissive": 0
      },
      "occludesCharacter": true,
      "hitArea": null,
      "collision": null,
      "fixed": false,
      "interaction": null,
      "hotspot": null
    },
    {
      "id": "guitar",
      "key": "guitar",
      "label": "吉他角",
      "name": "吉他角",
      "asset": "/assets/img/room/furn-guitar.webp",
      "thumb": "/assets/img/room/furn-thumb-guitar.webp",
      "anchor": {
        "x": 56.67,
        "y": 70.5
      },
      "bounds": {
        "left": 46.52,
        "top": 57.07,
        "width": 20.29,
        "height": 26.87
      },
      "scale": 1,
      "rotation": 0,
      "z": 839,
      "lightResponse": {
        "warm": 0.85,
        "cool": 0.25,
        "emissive": 0
      },
      "occludesCharacter": true,
      "hitArea": {
        "left": 49.8,
        "top": 61.4,
        "width": 13.8,
        "height": 18.3
      },
      "collision": {
        "u0": 0.79,
        "v0": 0.7,
        "u1": 0.99,
        "v1": 0.85
      },
      "fixed": false,
      "interaction": "play-hint",
      "hotspot": {
        "id": "guitar",
        "icon": "♪",
        "name": "吉他角",
        "left": 49.8,
        "top": 61.4,
        "width": 13.8,
        "height": 18.3
      }
    }
  ],
  "FIXED_COLLIDERS": [
    {
      "id": "table",
      "furniture": null,
      "collision": {
        "u0": 0.28,
        "v0": 0.5,
        "u1": 0.44,
        "v1": 0.64
      }
    }
  ],
  "FIXTURE_OBJECTS": [
    {
      "id": "record-wall",
      "icon": "◉",
      "name": "唱片墙",
      "left": 3.62,
      "top": 0,
      "width": 40.58,
      "height": 49.88,
      "z": 340,
      "interaction": "records"
    },
    {
      "id": "floor-records",
      "icon": "●",
      "name": "地面唱片",
      "left": 42.5,
      "top": 63.5,
      "width": 8.5,
      "height": 7,
      "z": 100,
      "interaction": "play-hint"
    }
  ],
  "RECORD_SLOTS": [
    {
      "left": 30.68,
      "top": 0.04,
      "width": 13.04,
      "height": 11.59
    },
    {
      "left": 22.56,
      "top": 4.27,
      "width": 13.04,
      "height": 11.59
    },
    {
      "left": 14.44,
      "top": 8.5,
      "width": 13.04,
      "height": 11.59
    },
    {
      "left": 37.63,
      "top": 8.11,
      "width": 13.04,
      "height": 11.59
    },
    {
      "left": 29.52,
      "top": 12.34,
      "width": 13.04,
      "height": 11.59
    },
    {
      "left": 21.4,
      "top": 16.57,
      "width": 13.04,
      "height": 11.59
    },
    {
      "left": 13.29,
      "top": 20.79,
      "width": 13.04,
      "height": 11.59
    },
    {
      "left": 2.85,
      "top": 26.23,
      "width": 13.04,
      "height": 11.59
    },
    {
      "left": 36.47,
      "top": 20.41,
      "width": 13.04,
      "height": 11.59
    },
    {
      "left": 28.36,
      "top": 24.63,
      "width": 13.04,
      "height": 11.59
    },
    {
      "left": 20.24,
      "top": 28.86,
      "width": 13.04,
      "height": 11.59
    },
    {
      "left": 12.13,
      "top": 33.09,
      "width": 13.04,
      "height": 11.59
    }
  ],
  "PLATTER": {
    "left": 74.35,
    "top": 33.27
  },
  "WALL_NOW_PLAYING": {
    "left": 8,
    "top": 8
  },
  "CHAR": {
    "baseHeight": 128,
    "spriteAspect": 1.2777777777777777
  }
};
