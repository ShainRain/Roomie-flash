# visual-validation — Roomie 视觉回归目录

任何视觉修改必须走 `rendered → diff → 修正 → 再 rendered` 循环，禁止"目检合格"。

## 目录

| 目录 | 内容 |
| --- | --- |
| `baseline/` | 视觉重置前的冻结截图（2026-10-05，对应 git tag `visual-reset-baseline-2026-10-05`）。只读，永不覆盖。 |
| `reference/` | 当前生效的验收基准（通常软引用/复制自 `reference-assets/ui-reference/`）。 |
| `rendered/` | 每次修改后的最新渲染截图（preview-app Chrome headless 或开发者工具）。 |
| `diff/` | reference vs rendered 的对比产物与差异记录。 |

## 每次迭代的记录格式

在 `diff/<page>-<YYYYMMDD>-<n>.md` 中记录：

```text
page:        home
reference:   reference/home.png
rendered:    rendered/home.png
iteration:   3
检查顺序（通过/失败 + 一句话）:
  1. 构图与空间比例
  2. 元素尺寸与位置
  3. 图片/资产比例
  4. 字体
  5. 颜色
  6. 阴影/光照
  7. 微交互
主要差异:
本次修改文件:
功能测试:  test-player / test-room-map / test-sync / check-bindings 结果
```

## 纪律

- 修复顺序固定：Geometry → Composition → Asset → Lighting → Typography → Micro Detail。
- 同一问题连续三轮未解决：停止调 CSS，重新判定问题属于 layout / asset / camera / lighting / material / architecture 哪一层。
- HTML 复刻截图 ≠ 真机证据；涉及真机（Canvas、相册、性能）的结论必须单独标注"依赖环境"。
