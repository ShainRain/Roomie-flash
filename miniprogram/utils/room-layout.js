// 由 tools/gen-room-scene.js 生成,请勿手改
module.exports = {
  "FURNITURE": [
    {
      "key": "sofa",
      "name": "沙发",
      "z": 639,
      "obstacle": "sofa",
      "hotspot": {
        "id": "sofa",
        "icon": "▰",
        "name": "沙发",
        "left": 29,
        "top": 54,
        "width": 18,
        "height": 13,
        "z": 641
      },
      "overlay": "/assets/img/furn-sofa.webp",
      "icon": "/assets/img/furn-icon-sofa.webp",
      "id": "sofa",
      "label": "沙发",
      "asset": "/assets/img/furn-sofa.webp",
      "thumb": "/assets/img/furn-icon-sofa.webp",
      "anchor": {
        "x": 38.42,
        "y": 55.7
      },
      "bounds": {
        "left": 30.81,
        "top": 47.84,
        "width": 15.22,
        "height": 15.73
      },
      "scale": 1,
      "rotation": 0,
      "lightResponse": {
        "warm": 0.85,
        "cool": 0.2,
        "emissive": 0
      },
      "occludesCharacter": true,
      "hitArea": {
        "left": 29,
        "top": 54,
        "width": 18,
        "height": 13
      },
      "collision": {
        "u0": 0.02,
        "v0": 0.3,
        "u1": 0.18,
        "v1": 0.6
      },
      "fixed": false,
      "interaction": "sit"
    },
    {
      "key": "vinyl-player",
      "name": "黑胶机",
      "z": 698,
      "obstacle": "credenza",
      "hotspot": {
        "id": "turntable",
        "icon": "◎",
        "name": "唱机柜",
        "left": 58,
        "top": 46,
        "width": 20,
        "height": 13,
        "z": 700
      },
      "overlay": "/assets/img/furn-vinyl-player.webp",
      "icon": "/assets/img/furn-icon-vinyl-player.webp",
      "id": "vinyl-player",
      "label": "黑胶机",
      "asset": "/assets/img/furn-vinyl-player.webp",
      "thumb": "/assets/img/furn-icon-vinyl-player.webp",
      "anchor": {
        "x": 69.52,
        "y": 57.7
      },
      "bounds": {
        "left": 57.94,
        "top": 45.57,
        "width": 23.16,
        "height": 24.25
      },
      "scale": 1,
      "rotation": 0,
      "lightResponse": {
        "warm": 0.9,
        "cool": 0.25,
        "emissive": 0.15
      },
      "occludesCharacter": true,
      "hitArea": {
        "left": 58,
        "top": 46,
        "width": 20,
        "height": 13
      },
      "collision": {
        "u0": 0.42,
        "v0": 0.02,
        "u1": 0.96,
        "v1": 0.18
      },
      "fixed": false,
      "interaction": "play-hint"
    },
    {
      "key": "cat-bed",
      "name": "猫窝",
      "z": 684,
      "obstacle": null,
      "hotspot": null,
      "overlay": "/assets/img/furn-cat-bed.webp",
      "icon": "/assets/img/furn-icon-cat-bed.webp",
      "id": "cat-bed",
      "label": "猫窝",
      "asset": "/assets/img/furn-cat-bed.webp",
      "thumb": "/assets/img/furn-icon-cat-bed.webp",
      "anchor": {
        "x": 31.47,
        "y": 65.73
      },
      "bounds": {
        "left": 27.5,
        "top": 62.68,
        "width": 7.94,
        "height": 6.11
      },
      "scale": 1,
      "rotation": 0,
      "lightResponse": {
        "warm": 0.7,
        "cool": 0.2,
        "emissive": 0
      },
      "occludesCharacter": true,
      "hitArea": null,
      "collision": null,
      "fixed": false,
      "interaction": null
    },
    {
      "key": "bookshelf",
      "name": "书架",
      "z": 400,
      "obstacle": null,
      "hotspot": null,
      "overlay": "/assets/img/furn-bookshelf.webp",
      "icon": "/assets/img/furn-icon-bookshelf.webp",
      "id": "bookshelf",
      "label": "书架",
      "asset": "/assets/img/furn-bookshelf.webp",
      "thumb": "/assets/img/furn-icon-bookshelf.webp",
      "anchor": {
        "x": 74.8,
        "y": 48.5
      },
      "bounds": {
        "left": 69.9,
        "top": 45.5,
        "width": 9.9,
        "height": 6.5
      },
      "scale": 1,
      "rotation": 0,
      "lightResponse": {
        "warm": 0.8,
        "cool": 0.35,
        "emissive": 0
      },
      "occludesCharacter": false,
      "hitArea": null,
      "collision": null,
      "fixed": false,
      "interaction": null
    },
    {
      "key": "lamp",
      "name": "落地灯",
      "z": 727,
      "obstacle": "lamp",
      "hotspot": {
        "id": "lamp",
        "icon": "☼",
        "name": "落地灯",
        "left": 55,
        "top": 50,
        "width": 12,
        "height": 18,
        "z": 730
      },
      "overlay": "/assets/img/furn-lamp.webp",
      "icon": "/assets/img/furn-icon-lamp.webp",
      "id": "lamp",
      "label": "落地灯",
      "asset": "/assets/img/furn-lamp.webp",
      "thumb": "/assets/img/furn-icon-lamp.webp",
      "anchor": {
        "x": 60,
        "y": 62
      },
      "bounds": {
        "left": 50.5,
        "top": 49,
        "width": 20,
        "height": 24
      },
      "scale": 1,
      "rotation": 0,
      "lightResponse": {
        "warm": 0.35,
        "cool": 0.15,
        "emissive": 0.95
      },
      "occludesCharacter": true,
      "hitArea": {
        "left": 55,
        "top": 50,
        "width": 12,
        "height": 18
      },
      "collision": {
        "u0": 0.85,
        "v0": 0.3,
        "u1": 0.95,
        "v1": 0.42
      },
      "fixed": false,
      "interaction": "lamp"
    },
    {
      "key": "plant",
      "name": "绿植",
      "z": 670,
      "obstacle": "plant",
      "hotspot": null,
      "overlay": "/assets/img/furn-plant.webp",
      "icon": "/assets/img/furn-icon-plant.webp",
      "id": "plant",
      "label": "绿植",
      "asset": "/assets/img/furn-plant.webp",
      "thumb": "/assets/img/furn-icon-plant.webp",
      "anchor": {
        "x": 25.35,
        "y": 61.69
      },
      "bounds": {
        "left": 20.22,
        "top": 54.76,
        "width": 10.26,
        "height": 13.85
      },
      "scale": 1,
      "rotation": 0,
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
      "interaction": null
    },
    {
      "key": "rug",
      "name": "地毯",
      "z": 610,
      "obstacle": null,
      "hotspot": null,
      "overlay": "/assets/img/furn-rug.webp",
      "icon": "/assets/img/furn-icon-rug.webp",
      "id": "rug",
      "label": "地毯",
      "asset": "/assets/img/furn-rug.webp",
      "thumb": "/assets/img/furn-icon-rug.webp",
      "anchor": {
        "x": 50,
        "y": 68.4
      },
      "bounds": {
        "left": 34.1,
        "top": 62.6,
        "width": 31.9,
        "height": 11.6
      },
      "scale": 1,
      "rotation": 0,
      "lightResponse": {
        "warm": 0.6,
        "cool": 0.2,
        "emissive": 0
      },
      "occludesCharacter": false,
      "hitArea": null,
      "collision": null,
      "fixed": false,
      "interaction": null
    },
    {
      "key": "curtain",
      "name": "挂帘",
      "z": 400,
      "obstacle": null,
      "hotspot": null,
      "overlay": "/assets/img/furn-curtain.webp",
      "icon": "/assets/img/furn-icon-curtain.webp",
      "id": "curtain",
      "label": "挂帘",
      "asset": "/assets/img/furn-curtain.webp",
      "thumb": "/assets/img/furn-icon-curtain.webp",
      "anchor": {
        "x": 81.3,
        "y": 41
      },
      "bounds": {
        "left": 79.5,
        "top": 32.5,
        "width": 4.5,
        "height": 18
      },
      "scale": 1,
      "rotation": 0,
      "lightResponse": {
        "warm": 0.5,
        "cool": 0.45,
        "emissive": 0
      },
      "occludesCharacter": false,
      "hitArea": null,
      "collision": null,
      "fixed": false,
      "interaction": null
    },
    {
      "key": "projector",
      "name": "放映机",
      "z": 690,
      "obstacle": null,
      "hotspot": {
        "id": "projector",
        "icon": "✦",
        "name": "放映机",
        "left": 38,
        "top": 56,
        "width": 9,
        "height": 9,
        "z": 692
      },
      "overlay": "/assets/img/furn-projector.webp",
      "icon": "/assets/img/furn-icon-projector.webp",
      "id": "projector",
      "label": "放映机",
      "asset": "/assets/img/furn-projector.webp",
      "thumb": "/assets/img/furn-icon-projector.webp",
      "anchor": {
        "x": 42.64,
        "y": 63.19
      },
      "bounds": {
        "left": 40.4,
        "top": 59.6,
        "width": 4.47,
        "height": 7.18
      },
      "scale": 1,
      "rotation": 0,
      "lightResponse": {
        "warm": 0.5,
        "cool": 0.3,
        "emissive": 0.6
      },
      "occludesCharacter": true,
      "hitArea": {
        "left": 38,
        "top": 56,
        "width": 9,
        "height": 9
      },
      "collision": null,
      "fixed": false,
      "interaction": "projector"
    },
    {
      "key": "poster",
      "name": "海报",
      "z": 400,
      "obstacle": null,
      "hotspot": null,
      "overlay": "/assets/img/furn-poster.webp",
      "icon": "/assets/img/furn-icon-poster.webp",
      "id": "poster",
      "label": "海报",
      "asset": "/assets/img/furn-poster.webp",
      "thumb": "/assets/img/furn-icon-poster.webp",
      "anchor": {
        "x": 52.3,
        "y": 27.7
      },
      "bounds": {
        "left": 50.6,
        "top": 20,
        "width": 3.5,
        "height": 16
      },
      "scale": 1,
      "rotation": 0,
      "lightResponse": {
        "warm": 0.8,
        "cool": 0.4,
        "emissive": 0
      },
      "occludesCharacter": false,
      "hitArea": null,
      "collision": null,
      "fixed": false,
      "interaction": null
    },
    {
      "key": "coffee",
      "name": "咖啡机",
      "z": 400,
      "obstacle": null,
      "hotspot": null,
      "overlay": "/assets/img/furn-coffee.webp",
      "icon": "/assets/img/furn-icon-coffee.webp",
      "id": "coffee",
      "label": "咖啡机",
      "asset": "/assets/img/furn-coffee.webp",
      "thumb": "/assets/img/furn-icon-coffee.webp",
      "anchor": {
        "x": 68.4,
        "y": 44
      },
      "bounds": {
        "left": 67.3,
        "top": 41.5,
        "width": 2.3,
        "height": 5
      },
      "scale": 1,
      "rotation": 0,
      "lightResponse": {
        "warm": 0.7,
        "cool": 0.4,
        "emissive": 0.2
      },
      "occludesCharacter": false,
      "hitArea": null,
      "collision": null,
      "fixed": false,
      "interaction": null
    },
    {
      "key": "doll",
      "name": "玩偶",
      "z": 681,
      "obstacle": null,
      "hotspot": null,
      "overlay": "/assets/img/furn-doll.webp",
      "icon": "/assets/img/furn-icon-doll.webp",
      "id": "doll",
      "label": "玩偶",
      "asset": "/assets/img/furn-doll.webp",
      "thumb": "/assets/img/furn-icon-doll.webp",
      "anchor": {
        "x": 36.8,
        "y": 63.7
      },
      "bounds": {
        "left": 34.8,
        "top": 60.7,
        "width": 3.9,
        "height": 6
      },
      "scale": 1,
      "rotation": 0,
      "lightResponse": {
        "warm": 0.7,
        "cool": 0.2,
        "emissive": 0
      },
      "occludesCharacter": true,
      "hitArea": null,
      "collision": null,
      "fixed": false,
      "interaction": null
    },
    {
      "key": "guitar",
      "name": "吉他角",
      "z": 810,
      "obstacle": "guitar-corner",
      "hotspot": {
        "id": "guitar",
        "icon": "♪",
        "name": "吉他角",
        "left": 47,
        "top": 72,
        "width": 13,
        "height": 12,
        "z": 812
      },
      "overlay": "/assets/img/furn-guitar.webp",
      "icon": "/assets/img/furn-icon-guitar.webp",
      "id": "guitar",
      "label": "吉他角",
      "asset": "/assets/img/furn-guitar.webp",
      "thumb": "/assets/img/furn-icon-guitar.webp",
      "anchor": {
        "x": 53.81,
        "y": 73.52
      },
      "bounds": {
        "left": 48.01,
        "top": 65.04,
        "width": 11.58,
        "height": 16.96
      },
      "scale": 1,
      "rotation": 0,
      "lightResponse": {
        "warm": 0.85,
        "cool": 0.25,
        "emissive": 0
      },
      "occludesCharacter": true,
      "hitArea": {
        "left": 47,
        "top": 72,
        "width": 13,
        "height": 12
      },
      "collision": {
        "u0": 0.79,
        "v0": 0.7,
        "u1": 0.99,
        "v1": 0.85
      },
      "fixed": false,
      "interaction": "play-hint"
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
      "left": 17,
      "top": 33,
      "width": 28,
      "height": 27,
      "z": 400,
      "collision": null,
      "fixed": true,
      "interaction": "records"
    },
    {
      "id": "floor-records",
      "icon": "●",
      "name": "地面唱片",
      "left": 43,
      "top": 69,
      "width": 11,
      "height": 7,
      "z": 100,
      "collision": null,
      "fixed": true,
      "interaction": "play-hint"
    }
  ],
  "RECORD_SLOTS": [
    {
      "left": 40.42,
      "top": 29.23,
      "width": 15.7,
      "height": 11.59
    },
    {
      "left": 35.69,
      "top": 31.71,
      "width": 15.7,
      "height": 11.59
    },
    {
      "left": 30.96,
      "top": 34.2,
      "width": 15.7,
      "height": 11.59
    },
    {
      "left": 26.23,
      "top": 36.69,
      "width": 15.7,
      "height": 11.59
    },
    {
      "left": 21.5,
      "top": 39.17,
      "width": 15.7,
      "height": 11.59
    },
    {
      "left": 16.76,
      "top": 41.66,
      "width": 15.7,
      "height": 11.59
    },
    {
      "left": 40.42,
      "top": 38.27,
      "width": 15.7,
      "height": 11.59
    },
    {
      "left": 35.69,
      "top": 40.76,
      "width": 15.7,
      "height": 11.59
    },
    {
      "left": 30.96,
      "top": 43.24,
      "width": 15.7,
      "height": 11.59
    },
    {
      "left": 26.23,
      "top": 45.73,
      "width": 15.7,
      "height": 11.59
    },
    {
      "left": 21.5,
      "top": 48.22,
      "width": 15.7,
      "height": 11.59
    },
    {
      "left": 16.76,
      "top": 50.71,
      "width": 15.7,
      "height": 11.59
    }
  ],
  "PLATTER": {
    "left": 63.9,
    "top": 51.67
  },
  "WALL_NOW_PLAYING": {
    "left": 20,
    "top": 30
  }
};
