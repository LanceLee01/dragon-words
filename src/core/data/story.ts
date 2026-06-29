// ---------------------------------------------------------------------------
// Story Data Types & Key Story Beats — Chapter 1–15
// ---------------------------------------------------------------------------

export interface StoryBeat {
  id: string;
  chapter: number;
  trigger: 'chapter_start' | 'boss_pre' | 'boss_post' | 'hidden_event' | 'perfect_clear' | 'first_clear';
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
// Key story beats for chapters 1, 3, 5, 7, 10, 13, 15
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
