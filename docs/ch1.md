这份文档《L9Eng 剧情内容与插图需求文档》非常详尽，已经为游戏《L9Eng》构建了一个完整的西式奇幻世界观和叙事框架。作为文案写手或项目负责人，你的目标很明确：**为游戏填充“每通过一关都有剧情”的完整叙事链，并产出对应的视觉资产清单。**

由于我无法直接修改代码库中的 `story.ts` 文件或绘制 PNG 图片，我将为你完成**核心的文案创作与规划工作**。

以下我将按照文档要求的格式，为你产出**Ch1（森林小径）的完整过渡剧情文案（JSON 数据结构）**，并整理出一份**全章节（Ch1-Ch15）的插图生产排期表**，以便你直接交付给开发和美术团队。

---

### 第一部分：剧情内容生产（以 Ch1 为例）

根据文档 **第4章：逐章剧情需求**，Ch1 需要补全 5 段过渡剧情。
**写作规范遵循：**
*   **风格**：西式奇幻，融入语言/词汇隐喻。
*   **人设**：精灵向导（温柔、睿智、担忧）。
*   **格式**：符合 `StoryBeat` 数据模型。

####  Ch1 - Lv1 通关后剧情 (过渡到 Lv2)
**触发器**：`level_1_clear`
**插图**：`story/ch1_lv1_clear.png` (森林小径，阳光透过树叶)

```json
{
  "id": "ch1_lv1_clear",
  "chapter": 1,
  "trigger": "level_1_clear",
  "format": "narration",
  "panels": [
    {
      "type": "image",
      "imagePath": "story/ch1_lv1_clear",
      "text": "清晨的薄雾在林间散去，哥布林溃逃时遗落的粗糙木棍散落一地。阳光透过树叶的缝隙，在地面上拼写出斑驳的光影。",
      "duration": 4000
    },
    {
      "type": "text",
      "character": "精灵向导",
      "emotion": "smile",
      "text": "做得好，冒险者。你的剑刃不仅斩断了荆棘，也斩断了这片森林最初的沉寂。看来你对‘词汇之力’的领悟比我想象的要快。",
      "duration": 4000
    },
    {
      "type": "text",
      "character": "精灵向导",
      "emotion": "worried",
      "text": "但不要大意。前方的路径会变得更加幽深，那些低等生物的喧嚣往往会引来更贪婪的耳朵。",
      "duration": 4000
    }
  ],
  "rewards": [
    { "type": "xp", "amount": 20 }
  ]
}
```

####  Ch1 - Lv2 通关后剧情 (过渡到 Lv3)
**触发器**：`level_2_clear`
**插图**：`story/ch1_lv2_clear.png` (被破坏的路牌)

```json
{
  "id": "ch1_lv2_clear",
  "chapter": 1,
  "trigger": "level_2_clear",
  "format": "narration",
  "panels": [
    {
      "type": "image",
      "imagePath": "story/ch1_lv2_clear",
      "text": "前方的道路上，一块古老的橡木路牌歪斜地插在泥土中。上面的字迹被利爪抓得模糊不清，仿佛语言本身在这里受到了亵渎。",
      "duration": 4000
    },
    {
      "type": "text",
      "character": "精灵向导",
      "emotion": "serious",
      "text": "看，‘宁静小径’的字样已经残缺。黑暗的爪牙正在抹去这里的记忆与方向。但我仍能辨认出那个扭曲的词根——",
      "duration": 4000
    },
    {
      "type": "text",
      "character": "精灵向导",
      "emotion": "worried",
      "text": "它指向森林深处。那里不仅有哥布林王的巢穴，似乎还藏着某种更古老的低语。",
      "duration": 4000
    }
  ],
  "rewards": [
    { "type": "gold", "amount": 15 }
  ]
}
```

####  Ch1 - Lv3 通关后剧情 (过渡到 Lv4)
**触发器**：`level_3_clear`
**插图**：`story/ch1_lv3_clear.png` (密林中的暗影)

```json
{
  "id": "ch1_lv3_clear",
  "chapter": 1,
  "trigger": "level_3_clear",
  "format": "narration",
  "panels": [
    {
      "type": "image",
      "imagePath": "story/ch1_lv3_clear",
      "text": "穿过灌木丛，一股令人不安的寂静笼罩了四周。树影在正午时分显得异常浓重，仿佛是用墨汁写就的阴影。",
      "duration": 4000
    },
    {
      "type": "text",
      "character": "精灵向导",
      "emotion": "worried",
      "text": "嘘……空气中的魔力变得粘稠了。我能感觉到黑暗魔法的痕迹，就像被污染的墨水滴入了清水。",
      "duration": 4000
    },
    {
      "type": "text",
      "character": "精灵向导",
      "emotion": "serious",
      "text": "哥布林王不仅仅是在收集财宝，他在试图用那些被窃取的词根拼凑出某种‘命令’。我们必须阻止他念出那个名字。",
      "duration": 4000
    }
  ],
  "rewards": []
}
```

####  Ch1 - Lv4 通关后剧情 (过渡到 BOSS)
**触发器**：`level_4_clear`
**插图**：`story/ch1_lv4_clear.png` (哥布林营地，被囚禁的动物)

```json
{
  "id": "ch1_lv4_clear",
  "chapter": 1,
  "trigger": "level_4_clear",
  "format": "narration",
  "panels": [
    {
      "type": "image",
      "imagePath": "story/ch1_lv4_clear",
      "text": "拨开最后一片藤蔓，你看到了令人愤怒的景象。哥布林王的营地里堆满了掠夺来的物资，几只森林生灵被关在粗糙的笼子里。",
      "duration": 4000
    },
    {
      "type": "text",
      "character": "精灵向导",
      "emotion": "angry",
      "text": "看看这些暴行！他们用‘占有’这个词，玷污了森林原本的‘共生’之意。",
      "duration": 4000
    },
    {
      "type": "text",
      "character": "精灵向导",
      "emotion": "serious",
      "text": "听，远处传来了粗哑的咆哮。那就是哥布林王。它正试图用一根巨大的骨头敲击地面，发出某种扭曲的音节。",
      "duration": 4000
    },
    {
      "type": "text",
      "character": "精灵向导",
      "emotion": "proud",
      "text": "准备战斗吧，冒险者。用你掌握的词汇之力，让这片土地重归宁静。",
      "duration": 4000
    }
  ],
  "rewards": []
}
```

####  Ch1 - 首次通关剧情 (击败 BOSS)
**触发先行词**：`first_clear`
**插图**：`story/ch1_first_clear.png` (发光词根碎片)

```json
{
  "id": "ch1_first_clear",
  "chapter": 1,
  "trigger": "first_clear",
  "format": "narration",
  "panels": [
    {
      "type": "image",
      "imagePath": "story/ch1_first_clear",
      "text": "随着哥布林王的倒下，一阵微风吹过战场。在它王座的废墟中，一点微弱的蓝光吸引了你的注意。",
      "duration": 4000
    },
    {
      "type": "text",
      "character": "精灵向导",
      "emotion": "amazed",
      "text": "这是……词根之力的残留？",
      "duration": 4000
    },
    {
      "type": "text",
      "character": "精灵向导",
      "emotion": "serious",
      "text": "虽然只是一小片碎片，但它证明了我们的方向是正确的。黑暗势力窃取的‘词根之源’正在通过这些碎片泄露力量。",
      "duration": 5000
    },
    {
      "type": "text",
      "character": "精灵向导",
      "emotion": "warm",
      "text": "收好它，冒险者。这将是我们在旅途中收集的第一块拼图。",
      "duration": 4000
    }
  ],
  "rewards": [
    { "type": "xp", "amount": 50 },
    { "type": "gold", "amount": 30 },
    { "type": "cosmetic", "id": "ch1_fragment", "amount": 1 }
  ],
  "unlockFlags": ["ch1_complete"]
}
```

---

### 第二部分：插图生产排期表 (全章节)

根据文档 **第5章：插图清单汇总**，B 类插图共计约 70 张。为了控制初期成本并保证进度，我建议采用**分级生产策略**。

####  美术资源优先级排期

| 阶段 | 优先级 | 插图类型 | 包含章节 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| **第一期** | **P0 (核心)** | `chapter_start`, `boss_pre`, `first_clear` | **Ch1, Ch3, Ch5, Ch10, Ch15** | 覆盖核心剧情节点（如苏醒、黑化、钥匙获取、结局）。**必须精细绘制。** |
| **第二期** | **P1 (重要)** | `chapter_start`, `boss_pre`, `first_clear` | **Ch2, Ch4, Ch6, Ch7, Ch8, Ch9** | 补全主要场景的起承转合，保证每章都有视觉锚点。 |
| **第三期** | **P2 (过渡)** | `level_1_clear` ~ `level_4_clear` | **Ch1 - Ch15** | 这些可以先用简单的场景速写或甚至高质量的动态文字面板代替，后期再补全精细图。 |

####  Ch1 - Ch5 具体插图需求清单 (示例前5章)

请插画师按照以下规格准备文件（**16:9 横版，1920×1080**）：

**Ch1: 森林小径**
*   `ch1_open_01.png`: (已有) 冒险者苏醒晨光。
*   `ch1_open_04.png`: (已有) 精灵向导伸手。
*   `ch1_lv1_clear.png`: 森林小径，阳光透过树叶（斑驳光影）。
*   `ch1_lv2_clear.png`: 被破坏的路牌（特写，字迹模糊）。
*   `ch1_lv3_clear.png`: 密林中的暗影（营造不安氛围）。
*   `ch1_lv4_clear.png`: 哥布林营地，包含笼子和掠夺物。
*   `ch1_first_clear.png`: 发光的蓝色词根碎片特写。

**Ch2: 城堡大厅**
*   `ch2_chapter_start.png`: 废弃城堡远景（破败但可见昔日辉煌）。
*   `ch2_lv1_clear.png`: 残破魔法书特写（烧焦边缘）。
*   `ch2_lv2_clear.png`: 发光铭文墙（墙壁上有微光文字）。
*   `ch2_lv3_clear.png`: 学院教室场景（桌椅翻倒，黑板上有粉笔字）。
*   `ch2_lv4_clear.png`: 死亡骑士与黑暗旗帜（全身像，压迫感）。
*   `ch2_first_clear.png`: 地面裂开的密道入口。

**Ch3: 魔法学院**
*   `ch3_chapter_start.png`: 被破坏的学院大门（断墙，倒下的守卫）。
*   `ch3_lv1_clear.png`: 混乱的庭院（散落卷轴，枯萎植物）。
*   `ch3_lv2_clear.png`: 受伤的学徒（年轻，穿着法师袍，躺在地上）。
*   `ch3_lv3_clear.png`: 大法师的魔法残影（半透明影像，重复动作）。
*   `ch3_first_clear.png`: 废墟中的大法师（虚弱，坐在瓦砾中）。

**Ch4: 精灵森林**
*   `ch4_chapter_start.png`: 荧光森林（蓝色/绿色光点，梦幻感）。
*   `ch4_lv1_clear.png`: 影狼的阴影（只画阴影或剪影，不露全貌）。
*   `ch4_lv2_clear.png`: 枯萎林地（树木干枯，树皮有扭曲文字）。
*   `ch4_lv3_clear.png`: 精灵斥候（身穿绿色皮甲，手持弓箭，警惕表情）。
*   `ch4_lv4_clear.png`: 树精长老（巨大的古树，树皮有人脸，全身像）。
*   `ch4_first_clear.png`: 精灵护符（挂在项链上，发光）。

**Ch5: 矮人矿坑**
*   `ch5_chapter_start.png`: 矿坑入口（黑暗洞口，有热气蒸腾）。
*   `ch5_lv1_clear.png`: 碎裂的石像鬼（石头碎片，被破坏的雕像）。
*   `ch5_lv2_clear.png`: 古代龙壁画（墙壁上的古老绘画，风格粗犷）。
*   `ch5_lv3_clear.png`: 矮人工匠（胡子很长，拿着铁锤，焦急表情）。
*   `ch5_lv4_clear.png`: 熔岩巨人（巨大的岩石生物，胸口嵌着红宝石般的词根）。
*   `ch5_key.png`: (已有) 符文钥匙。

---

###  下一步行动建议

1.  **交付文案**：你可以直接复制第一部分的 JSON 代码块，交给程序员写入 `story.ts` 数据文件中。
2.  **启动美术**：将第二部分的表格发给美术组长，优先制作 **P0 (核心)** 级别的插图，以确保主线剧情的沉浸感。
3.  **扩展剧情**：如果 Ch1 的文案风格符合预期，我可以继续为你生成 Ch2、Ch3 等后续章节的完整 JSON 剧情数据。