# Fun Test 题库编写说明

本页面题库唯一真源为 `fun-test/quiz.source.yaml`。
请不要手动编辑 `fun-test/quiz-data.v1.json`，该文件由脚本生成。

## 快速流程

1. 修改 `fun-test/quiz.source.yaml`
2. 执行 `npm run generate-index`
3. 若脚本报错，按报错路径修复 YAML

## 顶层结构

```yaml
meta:
  id: string
  title: string
  description: string

dimensions:
  - key: logic
    label: 理性

questions:
  - id: q1
    type: single # single | multi | scale
    prompt: 问题文案
    # single/multi 使用 options
    options:
      - id: a
        text: 选项文案
        scores: { logic: 10, action: 2 }
    # multi 需要 cap（每维封顶）
    cap: { logic: 12, action: 8 }

  - id: q2
    type: scale
    prompt: 量表文案
    scale: [1, 2, 3, 4, 5]
    levelScores:
      "1": { logic: 0 }
      "2": { logic: 2 }
      "3": { logic: 5 }
      "4": { logic: 8 }
      "5": { logic: 10 }

titleRules:
  - id: title-a
    title: 称号名
    description: 称号描述
    rule:
      op: and # and | or
      items:
        - field: logic
          cmp: gte # gte|gt|lte|lt|eq|neq
          value: 75
        - op: or
          items:
            - field: action
              cmp: gte
              value: 60
            - field: social
              cmp: gte
              value: 55

fallbackTitleId: fallback
```

## 规则约束

- 所有分值必须是非负数。
- `scale` 题档位必须严格为 `[1,2,3,4,5]`。
- `multi` 题必须提供 `cap`。
- `field` 必须是已声明的维度 key。
- `fallbackTitleId` 必须能在 `titleRules` 中找到。

## 常见报错

- `未知维度`：`scores/cap/rule.field` 用了不存在的维度 key。
- `重复 question id`：题目 id 冲突。
- `cmp 非法`：比较符不在 `gte|gt|lte|lt|eq|neq` 中。
- `scale 必须严格等于 [1,2,3,4,5]`：量表档位配置不符合约束。
- `fallbackTitleId 未在 titleRules 中定义`：缺少兜底称号映射。
