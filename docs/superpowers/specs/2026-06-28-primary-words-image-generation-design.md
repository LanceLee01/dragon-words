# 小学英语单词 D&D 风格配图批量生成方案

> **日期：** 2026-06-28
> **项目：** l9eng（龙9英语）
> **目标：** 为 505 个小学英语单词生成 D&D 奇幻风格配图，干扰少、主体突出

---

## 1. 背景

l9eng 项目已有 505 个小学英语单词（2022 新课标二级词汇表）和 1600 个初中单词的词库数据。App 中每个单词需要一张配图来辅助记忆。项目已有 ComfyUI 生图工作流（基于 z_image_turbo_bf16 模型），此前用于生成怪物卡牌图片。

## 2. 需求

- 为 505 个小学单词各生成一张 D&D 奇幻风格配图
- **图片干扰元素要少，单词主体要突出**
- 使用浅景深模糊背景，主体居中聚焦
- 使用现有的 ComfyUI Turbo 工作流（8步推理，1024×1024）
- 输出到 `src/assets/images/word-images/primary/` 目录
- 支持增量续跑（断点续传）

## 3. 方案架构

```
┌─────────────────────────────────────────────────────┐
│              batch_generate_words.py                 │
├─────────────────────────────────────────────────────┤
│  ① 读取 505 词列表（从 words/ 目录 Markdown）         │
│  ② 按词性自动分类（动物/实物/颜色/动作/情绪/抽象/其他）│
│  ③ 根据分类生成 D&D 风格提示词（浅景深+主体居中）      │
│  ④ 逐批送入 ComfyUI 队列（队列上限 5 个任务）          │
│  ⑤ 下载完成后裁剪为 256×256 WebP 到 assets 目录       │
│  ⑥ 跳过已有文件，支持中断后续跑                       │
└─────────────────────────────────────────────────────┘
```

## 4. 单词分类策略

| 类别 | 数量（估算） | 示例 | 提示词策略 |
|------|------------|------|-----------|
| 🦁 动物 | ~30 | cat, dog, lion, elephant | 奇幻生物，居中特写 |
| 🍎 实物 | ~120 | apple, book, chair, bed | 物品置于石台上，居中 |
| 🎨 颜色 | ~12 | red, blue, green | 魔法光晕效果，纯色 |
| 🏃 动作 | ~40 | run, jump, swim | 冒险者动作姿态，居中 |
| 😊 情绪 | ~15 | happy, sad, angry | 角色面部特写，居中 |
| 📍 方位 | ~15 | in, on, under, behind | 空间构图表现位置关系 |
| 📝 抽象/虚词 | ~270 | about, after, the, and | 符文卷轴/象征性画面 |
| 🧍 人物/身份 | ~25 | teacher, doctor, mother | 奇幻职业角色肖像 |

## 5. 提示词模板

### 5.1 正向提示词（基础模板）

```
{word}, D&D fantasy illustration, simple blurred background,
subject in focus, centered composition, shallow depth of field,
minimalist, soft warm lighting, rich colors,
trending on ArtStation, no text, no letters
```

### 5.2 分类后缀

| 类别 | 追加后缀 |
|------|---------|
| 动物 | `, majestic {word} creature, centered, detailed fur, fantasy` |
| 实物 | `, {word} on dark stone pedestal, softly glowing, centered` |
| 颜色 | `, magical glowing {word} in center, abstract light, pure color` |
| 动作 | `, adventurer in dynamic pose {word}ing, centered action` |
| 情绪 | `, close-up portrait of a fantasy character feeling {word}, centered face` |
| 方位 | `, magical spatial representation of {word}, geometric floating shapes` |
| 抽象 | `, magical floating rune representing {word}, centered on dark background, glowing` |
| 人物 | `, fantasy character portrait of a {word}, centered, detailed clothing` |

### 5.3 负向提示词

Turbo 工作流使用 ConditioningZeroOut（无负向提示词），因此无需额外负向词。

## 6. 工作流配置

- **节点 ID**：`57:27` → CLIPTextEncode（正向提示词）
- **节点 ID**：`57:33` → ConditioningZeroOut（负向，Turbo 专用）
- **节点 ID**：`9` → SaveImage（文件名前缀）
- **模型**：`z_image_turbo_bf16.safetensors`
- **分辨率**：1024×1024
- **步数**：8
- **CFG**：1
- **Sampler**：res_multistep

## 7. 输出处理

```
ComfyUI output (1024×1024 PNG)
    ↓ 下载
scripts/output_images/{word}_00001_.png
    ↓ 裁剪 & 格式转换 (PIL, 256×256)
src/assets/images/word-images/primary/{word}.png
```

> **格式说明**：输出为 **256×256 PNG**（而非 WebP），以匹配 `words.ts` 中已有的 `imagePath: "/assets/images/word-images/primary/{word}.png"` 路径格式。如需转 WebP 可后续单独处理。

## 8. 错误处理与恢复

- **增量续跑**：启动时扫描 `src/assets/images/word-images/primary/` 目录，跳过已有文件
- **队列管理**：维持队列中最多 5 个待处理任务
- **超时重试**：每个任务等待最多 120 秒
- **网络容错**：ComfyUI 连接失败时等待 5 秒重试
- **总耗时估算**：505 张 × 8 步 / 每张约 3-5 秒 ≈ 25-40 分钟

## 9. 工作量估算

| 项目 | 估算 |
|------|------|
| 脚本编写 | ~200 行 Python |
| 单词分类 | 脚本内建分类字典，按词性+词义规则自动归类 |
| 批量生成时间 | 约 25-40 分钟（RTX 3060） |
| 断点续跑支持 | 已内置 |
