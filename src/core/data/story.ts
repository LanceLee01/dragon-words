// ---------------------------------------------------------------------------
// Story Data Types & Key Story Beats — Chapter 1–15
// ---------------------------------------------------------------------------

export interface StoryBeat {
  id: string;
  chapter: number;
  trigger: 'chapter_start' | 'boss_pre' | 'boss_post' | 'hidden_event' | 'perfect_clear' | 'first_clear' | 'level_1_clear' | 'level_2_clear' | 'level_3_clear' | 'level_4_clear';
  format: 'comic' | 'dialogue' | 'narration';
  panels: StoryPanel[];
  rewards: StoryReward[];
  unlockFlags?: string[];
}

export interface StoryPanel {
  type: 'image' | 'text' | 'choice';
  imagePath?: string;
  text?: string;
  character?: string;
  emotion?: string;
  duration?: number;
  choices?: { text: string; nextPanelId: string; setFlag?: string }[];
}

export interface StoryReward {
  type: 'gold' | 'xp' | 'cosmetic' | 'galleryEntry';
  id?: string;
  amount: number;
}

// ---------------------------------------------------------------------------
// Key story beats for chapters 1–5 (complete per-level transitions)
// ---------------------------------------------------------------------------
export const STORY_BEATS: StoryBeat[] = [
  // ── Ch1 start: 冒险者醒来遇见精灵向导 (comic, 4 panels) ──────────────
  {
    id: 'ch1_start',
    chapter: 1,
    trigger: 'chapter_start',
    format: 'comic',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch1_open_01',
        text: '在一片古老森林的晨光中，冒险者缓缓苏醒……',
        duration: 3000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'smile',
        text: '你終於醒了！我是這片森林的精靈嚮導。你已經昏迷了三天三夜。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'serious',
        text: '黑暗勢力正在侵蝕這片大陸，古老的詞根之力被人竊取。唯有掌握語言力量的勇者，才能拯救這個世界。',
        duration: 5000,
      },
      {
        type: 'image',
        imagePath: 'story/ch1_open_04',
        text: '精靈伸出手，微笑著。「來吧，讓我教你這個世界的第一個詞語。」',
        duration: 3000,
      },
    ],
    rewards: [
      { type: 'xp', amount: 50 },
      { type: 'cosmetic', id: 'memory_fragment_1', amount: 1 },
    ],
    unlockFlags: ['story_ch1_seen'],
  },

  // ── Ch1 Lv1→Lv2: 精灵向导称赞冒险者 ────────────────────────────────
  {
    id: 'ch1_lv1_clear',
    chapter: 1,
    trigger: 'level_1_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch1_lv1_clear',
        text: '清晨的薄雾在林间散去，哥布林溃逃时遗落的粗糙木棍散落一地。阳光透过树叶的缝隙，在地面上拼写出斑驳的光影。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'smile',
        text: '做得好，冒险者。你的剑刃不仅斩断了荆棘，也斩断了这片森林最初的沉寂。看来你对「词汇之力」的领悟比我想象的要快。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'worried',
        text: '但不要大意。前方的路径会变得更加幽深，那些低等生物的喧嚣往往会引来更贪婪的耳朵。',
        duration: 4000,
      },
    ],
    rewards: [
      { type: 'xp', amount: 20 },
    ],
  },

  // ── Ch1 Lv2→Lv3: 被破坏的路牌 ─────────────────────────────────────
  {
    id: 'ch1_lv2_clear',
    chapter: 1,
    trigger: 'level_2_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch1_lv2_clear',
        text: '前方的道路上，一块古老的橡木路牌歪斜地插在泥土中。上面的字迹被利爪抓得模糊不清，仿佛语言本身在这里受到了亵渎。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'serious',
        text: '看，「宁静小径」的字样已经残缺。黑暗的爪牙正在抹去这里的记忆与方向。但我仍能辨认出那个扭曲的词根——',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'worried',
        text: '它指向森林深处。那里不仅有哥布林王的巢穴，似乎还藏着某种更古老的低语。',
        duration: 4000,
      },
    ],
    rewards: [
      { type: 'gold', amount: 15 },
    ],
  },

  // ── Ch1 Lv3→Lv4: 密林中的暗影 ─────────────────────────────────────
  {
    id: 'ch1_lv3_clear',
    chapter: 1,
    trigger: 'level_3_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch1_lv3_clear',
        text: '穿过灌木丛，一股令人不安的寂静笼罩了四周。树影在正午时分显得异常浓重，仿佛是用墨汁写就的阴影。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'worried',
        text: '嘘……空气中的魔力变得粘稠了。我能感觉到黑暗魔法的痕迹，就像被污染的墨水滴入了清水。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'serious',
        text: '哥布林王不仅仅是在收集财宝，他在试图用那些被窃取的词根拼凑出某种「命令」。我们必须阻止他念出那个名字。',
        duration: 4000,
      },
    ],
    rewards: [],
  },

  // ── Ch1 Lv4→Boss: 哥布林营地 ──────────────────────────────────────
  {
    id: 'ch1_lv4_clear',
    chapter: 1,
    trigger: 'level_4_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch1_lv4_clear',
        text: '拨开最后一片藤蔓，你看到了令人愤怒的景象。哥布林王的营地里堆满了掠夺来的物资，几只森林生灵被关在粗糙的笼子里。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'angry',
        text: '看看这些暴行！他们用「占有」这个词，玷污了森林原本的「共生」之意。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'serious',
        text: '听，远处传来了粗哑的咆哮。那就是哥布林王。它正试图用一根巨大的骨头敲击地面，发出某种扭曲的音节。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'proud',
        text: '准备战斗吧，冒险者。用你掌握的词汇之力，让这片土地重归宁静。',
        duration: 4000,
      },
    ],
    rewards: [],
  },

  // ── Ch1 通关: 发现词根碎片 ─────────────────────────────────────────
  {
    id: 'ch1_first_clear',
    chapter: 1,
    trigger: 'first_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch1_first_clear',
        text: '随着哥布林王的倒下，一阵微风吹过战场。在它王座的废墟中，一点微弱的蓝光吸引了你的注意。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'amazed',
        text: '这是……词根之力的残留？',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'serious',
        text: '虽然只是一小片碎片，但它证明了我们的方向是正确的。黑暗势力窃取的「词根之源」正在通过这些碎片泄露力量。',
        duration: 5000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'warm',
        text: '收好它，冒险者。这将是我们在旅途中收集的第一块拼图。',
        duration: 4000,
      },
    ],
    rewards: [
      { type: 'xp', amount: 50 },
      { type: 'gold', amount: 30 },
      { type: 'cosmetic', id: 'ch1_fragment', amount: 1 },
    ],
    unlockFlags: ['ch1_complete'],
  },

  // ══════════════════════════════════════════════════════════════════════
  // Ch2 — 城堡大厅
  // ══════════════════════════════════════════════════════════════════════

  // ── Ch2 start: 废弃的语言学院 ───────────────────────────────────────
  {
    id: 'ch2_chapter_start',
    chapter: 2,
    trigger: 'chapter_start',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch2_chapter_start',
        text: '穿过幽暗的森林，一座巍峨却破败的城堡矗立在荒原之上。曾经的白色石墙如今爬满了黑色的藤蔓，宛如一首被遗忘的挽歌。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'sad',
        text: '这里曾是大陆最辉煌的「语言学院」，无数学者在这里研究词汇的韵律与结构。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'worried',
        text: '但你看那墙壁上的裂痕……那是黑暗魔法粗暴撕裂了这里的防御结界。我们必须进去看看，知识的火种是否还存留。',
        duration: 4000,
      },
    ],
    rewards: [],
  },

  // ── Ch2 Lv1→Lv2: 残破魔法书 ───────────────────────────────────────
  {
    id: 'ch2_lv1_clear',
    chapter: 2,
    trigger: 'level_1_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch2_lv1_clear',
        text: '大厅的地板上散落着破碎的骨骼和生锈的武器。在壁炉的灰烬中，你发现了一本烧了一半的魔法书，书页焦黑。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'serious',
        text: '这是古代语言学的课本……《词根的起源》。上面记载着「词根之源」的基本理论。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'angry',
        text: '那些暴徒连知识都不放过。他们试图通过毁灭书籍来抹去历史，但这只会让真相更加渴望被诉说。',
        duration: 4000,
      },
    ],
    rewards: [
      { type: 'xp', amount: 25 },
    ],
  },

  // ── Ch2 Lv2→Lv3: 发光铭文墙 ───────────────────────────────────────
  {
    id: 'ch2_lv2_clear',
    chapter: 2,
    trigger: 'level_2_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch2_lv2_clear',
        text: '骷髅士兵从墙壁的阴影中消散。随着它们的倒下，墙壁上被尘封的铭文开始发出微弱的蓝光，仿佛在回应你的胜利。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'amazed',
        text: '看！这是古代的防御法阵。虽然力量微弱，但它还在运转。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'serious',
        text: '这些铭文在诉说着一个词——「坚守」。只要这些文字还在，这座城堡的记忆就没有完全死去。',
        duration: 4000,
      },
    ],
    rewards: [
      { type: 'gold', amount: 20 },
    ],
  },

  // ── Ch2 Lv3→Lv4: 教室场景 ─────────────────────────────────────────
  {
    id: 'ch2_lv3_clear',
    chapter: 2,
    trigger: 'level_3_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch2_lv3_clear',
        text: '推开一扇半掩的门，这是一间废弃的教室。黑板上还留着未擦去的练习题，桌椅东倒西歪，仿佛学生们是在一瞬间消失的。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'worried',
        text: '这里曾是练习「咒语构词法」的地方。你看那个笔记本……',
        duration: 4000,
      },
      {
        type: 'text',
        character: '系统',
        emotion: 'info',
        text: '你翻开一本遗落的笔记本，上面写着稚嫩的笔迹：「今天学会了「光」这个词，它真温暖。」',
        duration: 4000,
      },
    ],
    rewards: [],
  },

  // ── Ch2 Lv4→Boss: 死亡骑士 ────────────────────────────────────────
  {
    id: 'ch2_lv4_clear',
    chapter: 2,
    trigger: 'level_4_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch2_lv4_clear',
        text: '在大厅的尽头，死亡骑士手持一面被黑暗魔法污染的旗帜，挡住了去路。那面旗帜上的纹章已经被腐蚀，变成了狰狞的黑色。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'angry',
        text: '那是这座学院的荣耀旗帜！他们竟敢用亡灵的污秽来亵渎它。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'proud',
        text: '冒险者，用你纯净的词汇之力，洗刷这里的耻辱。让「死亡」也听听「生命」的宣言！',
        duration: 4000,
      },
    ],
    rewards: [],
  },

  // ── Ch2 通关: 发现密道 ─────────────────────────────────────────────
  {
    id: 'ch2_first_clear',
    chapter: 2,
    trigger: 'first_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch2_first_clear',
        text: '随着死亡骑士的铠甲轰然倒地，那面被污染的旗帜化为灰烬。失去了邪恶力量的支撑，大厅中央的地板突然塌陷，露出了一条通往地下的幽暗密道。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'serious',
        text: '这条密道……它直通地底，通往更深处的黑暗。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'worried',
        text: '敌人正在构筑防线，他们不希望我们继续前进。但这也是唯一的路。小心点，冒险者，地下的空气往往充满了谎言与陷阱。',
        duration: 4000,
      },
    ],
    rewards: [
      { type: 'xp', amount: 60 },
      { type: 'gold', amount: 40 },
    ],
    unlockFlags: ['ch2_complete'],
  },

  // ══════════════════════════════════════════════════════════════════════
  // Ch3 — 魔法学院
  // ══════════════════════════════════════════════════════════════════════

  // ── Ch3 start: 被破坏的学院大门 ─────────────────────────────────────
  {
    id: 'ch3_chapter_start',
    chapter: 3,
    trigger: 'chapter_start',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch3_chapter_start',
        text: '沿着密道前行，你们终于抵达了真正的魔法学院。然而，眼前的景象让人心碎。宏伟的大门被巨大的力量轰开，象征智慧的石柱倒在尘埃中。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'worried',
        text: '魔力的波动非常混乱。这里发生过一场惨烈的战斗，而且……',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'angry',
        text: '我能闻到黑暗魔法的臭味。他们不仅袭击了这里，还带走了最宝贵的东西。',
        duration: 4000,
      },
    ],
    rewards: [],
  },

  // ── Ch3 Lv1→Lv2: 混乱的庭院 ───────────────────────────────────────
  {
    id: 'ch3_lv1_clear',
    chapter: 3,
    trigger: 'level_1_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch3_lv1_clear',
        text: '庭院里一片狼藉，喷泉干涸，魔法植物枯萎。散落的卷轴被踩进泥土里，上面记载的咒语永远无法完成了。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'sad',
        text: '这些卷轴记录着学生们的心血。每一个被抹去的符号，都是一个破碎的梦想。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'serious',
        text: '但我们不能在这里停留太久。废墟深处还有微弱的生命气息，我们必须去确认。',
        duration: 4000,
      },
    ],
    rewards: [
      { type: 'xp', amount: 25 },
    ],
  },

  // ── Ch3 Lv2→Lv3: 受伤学徒 ─────────────────────────────────────────
  {
    id: 'ch3_lv2_clear',
    chapter: 3,
    trigger: 'level_2_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch3_lv2_clear',
        text: '在一堆瓦砾旁，你们发现了一名受伤的学徒。他紧紧抓着一块魔法水晶，眼神中充满了恐惧和希望。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '受伤学徒',
        emotion: 'worried',
        text: '快……快去圣殿！暗黑骑士团……他们闯入了词根圣殿！大法师为了保护封印已经……',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'amazed',
        text: '暗黑骑士团？他们竟然有胆量直面大法师？',
        duration: 4000,
      },
      {
        type: 'text',
        character: '系统',
        emotion: 'info',
        text: '学徒似乎已经用尽了力气，昏睡了过去。',
        duration: 3000,
      },
    ],
    rewards: [
      { type: 'gold', amount: 20 },
    ],
  },

  // ── Ch3 Lv3→Lv4: 大法师的魔法残影 ─────────────────────────────────
  {
    id: 'ch3_lv3_clear',
    chapter: 3,
    trigger: 'level_3_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch3_lv3_clear',
        text: '走廊的空气中残留着强烈的魔力爆炸痕迹。大法师的警告魔法影像在空气中闪烁，像是一段无法消逝的回声。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '大法师 (幻影)',
        emotion: 'angry',
        text: '「守住圣殿……词汇是文明的基石，绝不能落入黑暗之手！」',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'worried',
        text: '这是大法师最后的魔力残留。听这声音……他当时一定面临了巨大的压力。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'serious',
        text: '走吧，最后的防线就在眼前。',
        duration: 4000,
      },
    ],
    rewards: [],
  },

  // ── Ch3 通关: 大法师的嘱托 ─────────────────────────────────────────
  {
    id: 'ch3_first_clear',
    chapter: 3,
    trigger: 'first_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch3_first_clear',
        text: '战斗结束了。大法师虚弱地坐在词根圣殿的废墟中，他的法袍破损，魔杖断成了两截。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '大法师',
        emotion: 'sad',
        text: '我……没能守住。那股力量太强大了，像是一头饥饿的野兽。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '大法师',
        emotion: 'serious',
        text: '听着，年轻的冒险者。「词根之源」被夺走了。没有它，大陆的语言魔法将在三个月内彻底枯萎，所有的书本将变成白纸。',
        duration: 5000,
      },
      {
        type: 'text',
        character: '大法师',
        emotion: 'proud',
        text: '但你的眼中还有光。追上去……找回它……',
        duration: 4000,
      },
    ],
    rewards: [
      { type: 'xp', amount: 70 },
      { type: 'gold', amount: 50 },
      { type: 'cosmetic', id: 'ch3_key_fragment', amount: 1 },
    ],
    unlockFlags: ['ch3_complete', 'plot_ancient_word_stolen'],
  },

  // ── Ch3 boss_pre: 大法师透露词根之源失窃 (dialogue) ─────────────────
  {
    id: 'ch3_boss_pre',
    chapter: 3,
    trigger: 'boss_pre',
    format: 'dialogue',
    panels: [
      {
        type: 'text',
        character: '大法师',
        emotion: 'worried',
        text: '冒險者，你來得正好！我感應到詞根之源的波動……它已經被偷走了！',
        duration: 4000,
      },
      {
        type: 'text',
        character: '大法师',
        emotion: 'angry',
        text: '是暗黑騎士團幹的！他們闖入了聖殿，打傷了守衛，奪走了封印在 crystal 中的上古詞根。',
        duration: 5000,
      },
      {
        type: 'text',
        character: '大法师',
        emotion: 'sad',
        text: '沒有詞根之源，這片大陸的語言魔法將逐漸枯萎……你必須在他們完全掌握其力量之前奪回來！',
        duration: 5000,
      },
    ],
    rewards: [
      { type: 'xp', amount: 80 },
      { type: 'gold', amount: 30 },
    ],
    unlockFlags: ['lore_root_stolen'],
  },

  // ══════════════════════════════════════════════════════════════════════
  // Ch4 — 精灵森林
  // ══════════════════════════════════════════════════════════════════════

  // ── Ch4 start: 精灵向导的故乡 ───────────────────────────────────────
  {
    id: 'ch4_chapter_start',
    chapter: 4,
    trigger: 'chapter_start',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch4_chapter_start',
        text: '穿过阴冷的地底密道，你们终于重见天日。眼前是一片古老而幽深的森林，巨大的古树散发着微弱的荧光，照亮了前行的路。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'warm',
        text: '这里是我的故乡……精灵森林。这里的每一棵树都记录着千年的历史，每一片叶子都在低语着古老的歌谣。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'worried',
        text: '但是……你能感觉到吗？风中的旋律变得有些刺耳了。黑暗的阴影已经爬上了这些神圣的枝叶。',
        duration: 4000,
      },
    ],
    rewards: [],
  },

  // ── Ch4 Lv1→Lv2: 影狼的阴影 ───────────────────────────────────────
  {
    id: 'ch4_lv1_clear',
    chapter: 4,
    trigger: 'level_1_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch4_lv1_clear',
        text: '灌木丛中闪过几双猩红的眼睛，那是被黑暗魔法扭曲的影狼。它们的形态不再矫健，而是充满了暴戾与饥渴。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'sad',
        text: '曾经的森林守护者，如今却变成了这副模样……',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'serious',
        text: '这是语言之力失衡的恶果。当「和谐」被「混乱」取代，野兽就会失去理智。我们必须净化这里的源头。',
        duration: 4000,
      },
    ],
    rewards: [
      { type: 'xp', amount: 30 },
    ],
  },

  // ── Ch4 Lv2→Lv3: 枯萎林地 ─────────────────────────────────────────
  {
    id: 'ch4_lv2_clear',
    chapter: 4,
    trigger: 'level_2_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch4_lv2_clear',
        text: '你们踏入了一片诡异的林区。这里的树木不再发光，树皮干裂剥落，地面上刻满了扭曲、丑陋的文字，仿佛在流血。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'angry',
        text: '看那些刻痕！那是伪造的符文……是亵渎。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'worried',
        text: '黑暗势力试图用这种粗劣的模仿来篡改森林的记忆。这些文字没有任何意义，只有纯粹的破坏欲。',
        duration: 4000,
      },
    ],
    rewards: [
      { type: 'gold', amount: 25 },
    ],
  },

  // ── Ch4 Lv3→Lv4: 精灵斥候 ─────────────────────────────────────────
  {
    id: 'ch4_lv3_clear',
    chapter: 4,
    trigger: 'level_3_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch4_lv3_clear',
        text: '一名身穿绿叶铠甲的精灵斥候从树冠上轻盈地跃下，拦住了你们的去路。她的眼神警惕而锐利。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵斥候',
        emotion: 'serious',
        text: '止步，旅人。森林的守护灵感受到了词根之力的剧烈波动，以及……一个陌生人类的气息。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'warm',
        text: '是我，星辰之女。这位冒险者是我们的希望，请带我们去见树精长老。',
        duration: 4000,
      },
    ],
    rewards: [],
  },

  // ── Ch4 Lv4→Boss: 被侵蚀的树精长老 ────────────────────────────────
  {
    id: 'ch4_lv4_clear',
    chapter: 4,
    trigger: 'level_4_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch4_lv4_clear',
        text: '在精灵斥候的带领下，你们来到了世界树最古老的根须处。然而，眼前的景象令人震惊——巨大的树精长老被黑气缠绕，双眼发出不祥的红光。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'worried',
        text: '不……长老被侵蚀了！那些黑暗符文正在腐蚀它的意志！',
        duration: 4000,
      },
      {
        type: 'text',
        character: '系统',
        emotion: 'epic',
        text: '树精长老发出痛苦的咆哮，巨大的根须如蛇一般向你抽来。它的声音混杂着黑暗的低语：「离……开……或者……被……吞噬……」',
        duration: 5000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'angry',
        text: '我们必须打败它，才能净化这片森林！用词汇之力切断那些黑暗符文！',
        duration: 4000,
      },
    ],
    rewards: [],
  },

  // ── Ch4 通关: 精灵护符 ─────────────────────────────────────────────
  {
    id: 'ch4_first_clear',
    chapter: 4,
    trigger: 'first_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch4_first_clear',
        text: '树精长老的树枝轻轻触碰你的额头，一段古老的知识流入了你的脑海。精灵向导微笑着递给你一枚散发着清香的护符。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'proud',
        text: '这是长老赐予你的「精灵护符」。现在，你拥有了聆听古代铭文的能力。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'worried',
        text: '长老刚刚告诉我，暗黑骑士团的下一个目标是北方的矮人矿坑。他们想夺取那里的「火焰词根」。我们必须立刻动身！',
        duration: 5000,
      },
    ],
    rewards: [
      { type: 'xp', amount: 75 },
      { type: 'gold', amount: 55 },
      { type: 'cosmetic', id: 'elven_amulet', amount: 1 },
    ],
    unlockFlags: ['ch4_complete', 'ability_read_ancient'],
  },

  // ══════════════════════════════════════════════════════════════════════
  // Ch5 — 矮人矿坑
  // ══════════════════════════════════════════════════════════════════════

  // ── Ch5 start: 矿坑入口 ────────────────────────────────────────────
  {
    id: 'ch5_chapter_start',
    chapter: 5,
    trigger: 'chapter_start',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch5_chapter_start',
        text: '告别了森林，北方的山脉在地平线上投下巨大的阴影。热气从矮人矿坑的入口滚滚涌出，空气中弥漫着硫磺的味道。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'worried',
        text: '这里的温度高得不正常。矮人的矿坑通常深入地下，如果连入口都这么热，说明地下的火元素已经失控了。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '系统',
        emotion: 'info',
        text: '远处传来沉闷的敲击声，像是巨大的锤子在敲打铁砧，又像是某种巨兽的心跳。',
        duration: 4000,
      },
    ],
    rewards: [],
  },

  // ── Ch5 Lv1→Lv2: 碎裂的石像鬼 ─────────────────────────────────────
  {
    id: 'ch5_lv1_clear',
    chapter: 5,
    trigger: 'level_1_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch5_lv1_clear',
        text: '几尊原本用于守护矿坑入口的石像鬼雕像碎裂在地。它们的碎片上残留着黑色的魔法余烬，仿佛是被从内部强行唤醒后打碎的。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'serious',
        text: '看这些裂纹。它们是被黑暗魔法强行激活的傀儡。矮人族的守护者被敌人操控了，用来对付我们。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'worried',
        text: '这说明矮人族可能已经遭遇了不测，或者他们被迫退守到了更深层的要塞。',
        duration: 4000,
      },
    ],
    rewards: [
      { type: 'xp', amount: 30 },
    ],
  },

  // ── Ch5 Lv2→Lv3: 古代龙壁画 ───────────────────────────────────────
  {
    id: 'ch5_lv2_clear',
    chapter: 5,
    trigger: 'level_2_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch5_lv2_clear',
        text: '你们深入矿坑，发现了一个被挖开的古代墓穴。墙壁上的壁画虽然年代久远，但依然清晰可见：画着巨大的有翼生物和被锁链束缚的太阳。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'amazed',
        text: '这是……龙族的壁画。矮人族在这里挖掘的不仅仅是矿石，还有历史。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'serious',
        text: '这个符号……（指着壁画上的锁链）它和我们在学院废墟看到的很像。这一切都指向同一个源头——远古红龙。',
        duration: 4000,
      },
    ],
    rewards: [
      { type: 'gold', amount: 25 },
    ],
  },

  // ── Ch5 Lv3→Lv4: 矮人工匠 ─────────────────────────────────────────
  {
    id: 'ch5_lv3_clear',
    chapter: 5,
    trigger: 'level_3_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch5_lv3_clear',
        text: '在一片被岩浆包围的工坊里，一位幸存的矮人工匠正绝望地试图修复一扇被破坏的铁门。他看到你们，眼中闪过一丝希望。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '矮人工匠',
        emotion: 'angry',
        text: '该死的入侵者！他们不仅偷走了矿坑深处的「火焰词根」，还唤醒了沉睡的熔岩巨人！',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'worried',
        text: '熔岩巨人？那是用来守护核心熔炉的终极兵器。如果它暴走，整个山脉都会崩塌。',
        duration: 4000,
      },
    ],
    rewards: [],
  },

  // ── Ch5 Lv4→Boss: 失控的熔岩巨人 ──────────────────────────────────
  {
    id: 'ch5_lv4_clear',
    chapter: 5,
    trigger: 'level_4_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch5_lv4_clear',
        text: '矮人工匠用颤抖的手打开了核心熔炉的最后一扇铁门。热浪扑面而来，眼前是一座巨大的熔炉核心，岩浆在下方翻涌沸腾。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '矮人工匠',
        emotion: 'worried',
        text: '看那里……熔岩巨人就在核心旁边。它已经彻底失控了，挡在「火焰词根」的前面。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '系统',
        emotion: 'epic',
        text: '熔岩巨人从岩浆中缓缓站起，它的胸口镶嵌着一块被污染的赤红词根碎片——那就是暗黑骑士团留下的痕迹。',
        duration: 5000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'serious',
        text: '我们必须击败它，夺回那块碎片。那是通往真相的又一块拼图。',
        duration: 4000,
      },
    ],
    rewards: [],
  },

  // ── Ch5 first_clear: 矮人长老赠送符文钥匙 (narration) ────────────────
  {
    id: 'ch5_first_clear',
    chapter: 5,
    trigger: 'first_clear',
    format: 'narration',
    panels: [
      {
        type: 'text',
        character: '矮人长老',
        emotion: 'proud',
        text: '哈哈哈！年輕的冒險者，你果然沒有讓我失望。那座礦坑裡的怪物可不是一般人能對付的。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '矮人长老',
        emotion: 'smile',
        text: '拿著這個——這是古代矮人打造的符文鑰匙。它可以打開通往遺蹟深處的大門。',
        duration: 4000,
      },
      {
        type: 'image',
        imagePath: 'story/ch5_key',
        text: '一把閃爍著藍色符文的厚重鑰匙交到了你的手中。',
        duration: 3000,
      },
      {
        type: 'text',
        character: '矮人长老',
        emotion: 'serious',
        text: '前方路途險惡，但記住——每一個單詞都是一把鑰匙，每一種語言都是一扇門。',
        duration: 4000,
      },
    ],
    rewards: [
      { type: 'xp', amount: 120 },
      { type: 'gold', amount: 60 },
      { type: 'cosmetic', id: 'rune_key_token', amount: 1 },
    ],
    unlockFlags: ['story_ch5_clear'],
  },

  // ── Ch7 hidden_event: 双足飞龙巢穴发现龙蛋 (comic, with choice) ─────
  {
    id: 'ch7_hidden_dragon_egg',
    chapter: 7,
    trigger: 'hidden_event',
    format: 'comic',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch7_nest',
        text: '在雙足飛龍的巢穴深處，你發現了一枚微微發光的蛋……',
        duration: 3000,
      },
      {
        type: 'text',
        character: '系统',
        emotion: 'info',
        text: '這是一枚龍蛋！牠還活著，能感受到裡面微弱的心跳。飛龍父母似乎已經離去多日。',
        duration: 4000,
      },
      {
        type: 'choice',
        text: '你要如何處理這枚龍蛋？',
        choices: [
          { text: '小心翼翼地帶走龍蛋', nextPanelId: 'ch7_take_egg', setFlag: 'took_dragon_egg' },
          { text: '留在巢穴中，讓牠自然孵化', nextPanelId: 'ch7_leave_egg' },
        ],
      },
      {
        type: 'text',
        id: 'ch7_take_egg',
        character: '系统',
        emotion: 'warm',
        text: '你小心地用斗篷包裹住龍蛋。牠似乎感受到了你的體溫，輕輕晃動了一下。這或許會改變你的命運……',
        duration: 5000,
      },
      {
        type: 'text',
        id: 'ch7_leave_egg',
        character: '系统',
        emotion: 'sad',
        text: '你輕輕撫摸了一下龍蛋，轉身離開。身後傳來一聲輕微的碎裂聲……你回頭，卻什麼也沒看到。',
        duration: 4000,
      },
    ],
    rewards: [
      { type: 'xp', amount: 150 },
      { type: 'galleryEntry', id: 'dragon_egg', amount: 1 },
    ],
    unlockFlags: ['story_ch7_hidden'],
  },

  // ── Ch10 boss_post: 暗黑骑士揭露远古红龙 (dialogue) ─────────────────
  {
    id: 'ch10_boss_post',
    chapter: 10,
    trigger: 'boss_post',
    format: 'dialogue',
    panels: [
      {
        type: 'text',
        character: '暗黑骑士',
        emotion: 'laugh',
        text: '呵呵呵……你以為打敗我就結束了嗎？太天真了！',
        duration: 4000,
      },
      {
        type: 'text',
        character: '暗黑骑士',
        emotion: 'angry',
        text: '我只是個先鋒！真正的主人——遠古紅龍——即將甦醒！牠的力量遠遠超過你見過的任何生物！',
        duration: 5000,
      },
      {
        type: 'text',
        character: '暗黑骑士',
        emotion: 'serious',
        text: '詞根之源的真正力量……就是用來喚醒那頭遠古巨龍的。你們的世界，注定要毀滅！',
        duration: 5000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'worried',
        text: '他說的是真的……我曾經在古老的預言中讀到過。遠古紅龍一旦甦醒，整個大陸都將化為焦土。',
        duration: 5000,
      },
    ],
    rewards: [
      { type: 'xp', amount: 200 },
      { type: 'gold', amount: 100 },
    ],
    unlockFlags: ['lore_dragon_1_read'],
  },

  // ── Ch15 boss_pre: 远古红龙现身 (comic, 6 panels) ────────────────────
  {
    id: 'ch15_boss_pre',
    chapter: 15,
    trigger: 'boss_pre',
    format: 'comic',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch15_dragon_01',
        text: '天空驟然暗了下來……一股令人窒息的威壓從天而降。',
        duration: 3000,
      },
      {
        type: 'image',
        imagePath: 'story/ch15_dragon_02',
        text: '雲層中，一對巨大的金色瞳孔睜開，注視著大地。',
        duration: 3000,
      },
      {
        type: 'image',
        imagePath: 'story/ch15_dragon_03',
        text: '遠古紅龍——伊格尼斯——從雲層中降臨。牠的翅膀遮蔽了天空，每一次振翅都引發狂風呼嘯。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '远古红龙',
        emotion: 'angry',
        text: '渺小的人類……你們膽敢擾亂我的長眠。詞根之力終究還是回到了我的手中。',
        duration: 5000,
      },
      {
        type: 'text',
        character: '远古红龙',
        emotion: 'laugh',
        text: '現在，感受真正的力量吧！你們的語言、你們的魔法、你們的一切——都將在我的火焰中化為灰燼！',
        duration: 5000,
      },
      {
        type: 'image',
        imagePath: 'story/ch15_dragon_06',
        text: '巨龍張開巨口，灼熱的火焰在喉嚨深處凝聚。最終決戰——開始！',
        duration: 3000,
      },
    ],
    rewards: [
      { type: 'xp', amount: 500 },
      { type: 'gold', amount: 200 },
    ],
    unlockFlags: ['story_ch15_boss'],
  },

  // ── Ch15 ending: 封印结局 (narration + CG) ──────────────────────────
  {
    id: 'ending_seal',
    chapter: 15,
    trigger: 'perfect_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch15_seal_01',
        text: '你高舉符文鑰匙，所有詞根之力匯聚成一道耀眼的光芒……',
        duration: 3000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'cry',
        text: '就是現在！用語言的力量封印牠！',
        duration: 3000,
      },
      {
        type: 'text',
        character: '系统',
        emotion: 'epic',
        text: '你念出了上古封印之詞。每一個音節都化作金色的鎖鏈，纏繞住遠古紅龍的龐大身軀。',
        duration: 5000,
      },
      {
        type: 'image',
        imagePath: 'story/ch15_seal_04',
        text: '伊格尼斯發出震天的怒吼，但金色的鎖鏈越收越緊……最終，牠巨大的身軀化為一座石像，永遠沉睡在封印之中。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'smile',
        text: '結束了……你做到了。語言的力量擊敗了黑暗。大陸恢復了和平，而你的傳奇，將被永遠傳頌。',
        duration: 5000,
      },
      {
        type: 'image',
        imagePath: 'story/ch15_seal_06',
        text: '【封印結局】—— 遠古紅龍被封印，大陸重歸寧靜。但你知道，在遙遠的未來，或許還會有新的冒險等待著你……',
        duration: 5000,
      },
    ],
    rewards: [
      { type: 'xp', amount: 1000 },
      { type: 'gold', amount: 500 },
      { type: 'cosmetic', id: 'ending_seal_cg', amount: 1 },
      { type: 'galleryEntry', id: 'ending_seal', amount: 1 },
    ],
    unlockFlags: ['ending_seal_unlocked'],
  },

  // ── Ch15 ending: 驯服结局 (narration + CG) ──────────────────────────
  {
    id: 'ending_tame',
    chapter: 15,
    trigger: 'perfect_clear',
    format: 'narration',
    panels: [
      {
        type: 'image',
        imagePath: 'story/ch15_tame_01',
        text: '你放下武器，緩緩走向遠古紅龍。牠金色的瞳孔注視著你，火焰在喉嚨深處跳動。',
        duration: 3000,
      },
      {
        type: 'text',
        character: '系统',
        emotion: 'epic',
        text: '你沒有念出封印之詞，而是用最古老的龍語對牠說：「我理解你的孤獨。」',
        duration: 5000,
      },
      {
        type: 'text',
        character: '远古红龙',
        emotion: 'surprised',
        text: '……你……竟然會說龍語？千年了……你是第一個願意理解我的人類。',
        duration: 5000,
      },
      {
        type: 'image',
        imagePath: 'story/ch15_tame_04',
        text: '伊格尼斯低下巨大的頭顱，火焰熄滅，取而代之的是一滴晶瑩的淚珠。牠接納了你。',
        duration: 4000,
      },
      {
        type: 'text',
        character: '精灵向导',
        emotion: 'amazed',
        text: '不可思議……你沒有用力量征服牠，而是用理解和語言贏得了牠的信任。',
        duration: 4000,
      },
      {
        type: 'image',
        imagePath: 'story/ch15_tame_06',
        text: '【馴服結局】—— 遠古紅龍成為了你的夥伴。你們一起飛向天空，開啟全新的冒險。語言的力量，終究帶來了理解與和平。',
        duration: 5000,
      },
    ],
    rewards: [
      { type: 'xp', amount: 1200 },
      { type: 'gold', amount: 600 },
      { type: 'cosmetic', id: 'ending_tame_cg', amount: 1 },
      { type: 'galleryEntry', id: 'ending_tame', amount: 1 },
    ],
    unlockFlags: ['ending_tame_unlocked'],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getStoryBeatForTrigger(trigger: string, chapter: number): StoryBeat | undefined {
  return STORY_BEATS.find(b => b.trigger === trigger && b.chapter === chapter);
}

export function getStoryBeatsByChapter(chapter: number): StoryBeat[] {
  return STORY_BEATS.filter(b => b.chapter === chapter);
}
