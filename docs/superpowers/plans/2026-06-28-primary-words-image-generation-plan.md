# 小学英语单词批量配图生成 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 505 个小学英语单词（2022 新课标二级词汇表）生成 D&D 奇幻风格配图，干扰少、主体突出

**Architecture:** 一个 Python 脚本完成全流程：从 words/ 目录的 Markdown 读取单词 → 按词性分类 → 生成 D&D 风格正向提示词 → 通过 ComfyUI API 队列生成 1024×1024 图片 → 下载并裁剪为 256×256 PNG → 输出到项目 assets 目录

**Tech Stack:** Python 3, requests (ComfyUI API), Pillow (图片裁剪), 现有 ComfyUI z_image_turbo 工作流

## Global Constraints

- 使用 `scripts/dnd_workflow_api.json` 工作流（Turbo 模型，8步，1024×1024）
- 图片干扰元素要少，单词主体突出，浅景深模糊背景
- 输出到 `src/assets/images/word-images/primary/` 目录，256×256 PNG
- 支持增量续跑（跳过已有文件）
- ComfyUI API 地址: `http://192.168.18.28:8188`
- ComfyUI 队列上限同时保持 5 个任务

---
### Task 1: 创建单词表解析器

**Files:**
- Modify: `scripts/batch_generate_words.py` (新建，复用现有 batch_generate.py 的 ComfyUI 连接逻辑)

**Interfaces:**
- Produces: `parse_word_list() -> list[str]` — 从 Markdown 提取单词列表

- [ ] **Step 1: 创建脚本骨架，实现单词解析函数**

写入 `scripts/batch_generate_words.py`：

```python
"""
Dragon Words — 小学英语单词 D&D 配图批量生成
用法:
  1. 启动 ComfyUI (确保 API 在 192.168.18.28:8188)
  2. 在 ComfyUI 中加载并测试一次 dnd_workflow_api.json 工作流
  3. 先测试: python scripts/batch_generate_words.py --test
  4. 跑全部: python scripts/batch_generate_words.py
"""
import re, json, time, os, sys, argparse
import requests
from PIL import Image

COMFY_URL = "http://192.168.18.28:8188"
WORKFLOW_FILE = "scripts/dnd_workflow_api.json"
OUTPUT_DIR = "src/assets/images/word-images/primary"
WORD_LIST_FILE = "words/2022新课标_二级词汇表_小学505词.md"


def parse_word_list(filepath: str) -> list[str]:
    \"\"\"从二级词汇表 Markdown 提取单词列表。
    
    Markdown 格式: | 序号 | 单词 |
    需要处理括号变体如 "a (an)" → "a"
    \"\"\"
    words = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            # 匹配表格行: | 数字 | 单词 |
            m = re.match(r'\|\s*\d+\s*\|\s*(.+?)\s*\|', line)
            if m:
                raw = m.group(1)
                # 去掉括号变体: "a (an)" → "a"
                word = re.sub(r'\s*\(.*?\)\s*', '', raw).strip()
                if word:
                    words.append(word)
    print(f"📖 读取到 {len(words)} 个单词")
    return words
```

- [ ] **Step 2: 添加主函数入口**

```python
def main():
    parser = argparse.ArgumentParser(description="小学单词 D&D 配图批量生成")
    parser.add_argument("--test", action="store_true", help="测试模式: 只生成前3张")
    parser.add_argument("--word", type=str, help="只生成指定单词")
    args = parser.parse_args()
    
    words = parse_word_list(WORD_LIST_FILE)
    if args.word:
        words = [args.word]
    if args.test:
        words = words[:3]
        print("⚠️ 测试模式: 只处理前 3 个单词")
    
    print(f"待处理单词: {words}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: 测试单词解析**

Run: `python scripts/batch_generate_words.py --test`
Expected: 输出前 3 个单词 ["a", "about", "after"]

---
### Task 2: 实现单词分类系统

**Files:**
- Modify: `scripts/batch_generate_words.py`

**Interfaces:**
- Consumes: `parse_word_list() -> list[str]`
- Produces: `classify_word(word: str) -> str` 返回分类标签: "animal" | "object" | "color" | "action" | "emotion" | "person" | "position" | "abstract"

- [ ] **Step 1: 添加分类字典和分类函数**

在 `parse_word_list` 之后添加：

```python
# 单词分类字典 — 按语义归类
# 涵盖 505 词中所有具体可分类的单词
ANIMAL_WORDS = {
    "animal", "ant", "bear", "bee", "bird", "cat", "chicken", "cow", "dog",
    "duck", "elephant", "fish", "horse", "lion", "monkey", "mouse", "panda",
    "pet", "pig", "rabbit", "sheep", "tiger", "whale", "bat", "snake",
}

COLOR_WORDS = {
    "black", "blue", "brown", "green", "orange", "pink", "red", "white",
    "yellow", "colour", "gold",
}

ACTION_WORDS = {
    "catch", "climb", "come", "cook", "cry", "cut", "dance", "draw",
    "drink", "eat", "fly", "get", "give", "go", "have", "hear", "help",
    "hurry", "jump", "keep", "know", "learn", "listen", "live", "look",
    "love", "make", "meet", "move", "open", "play", "put", "read", "ride",
    "run", "say", "see", "sell", "share", "show", "sing", "sit", "sleep",
    "speak", "stand", "stop", "study", "sweep", "swim", "take", "talk",
    "tell", "think", "travel", "try", "turn", "use", "visit", "wait",
    "wake", "walk", "want", "wash", "watch", "wear", "win", "work",
    "write", "begin", "bring", "buy", "call", "clean",
}

EMOTION_WORDS = {
    "angry", "bad", "beautiful", "cute", "excited", "fine", "good",
    "great", "happy", "hungry", "kind", "lovely", "nice", "old",
    "sad", "sorry", "strong", "tall", "thin", "tired", "warm",
    "wonderful", "young", "clever", "cool", "dear", "helpful",
    "interesting", "little", "new", "pretty", "quiet",
}

PERSON_WORDS = {
    "aunt", "baby", "boy", "brother", "child", "cousin", "doctor",
    "driver", "family", "farmer", "father", "friend", "girl",
    "grandfather", "grandmother", "kid", "man", "Miss", "mother",
    "Mr", "Mrs", "Ms", "nurse", "parent", "people", "person",
    "police", "sister", "student", "teacher", "uncle", "woman",
    "worker", "astronaut",
}

POSITION_WORDS = {
    "behind", "below", "beside", "between", "down", "in", "inside",
    "into", "left", "near", "next", "on", "out", "outside", "over",
    "through", "under", "up",
}

FOOD_WORDS = {
    "apple", "banana", "bread", "cake", "candy", "chicken", "dinner",
    "drink", "egg", "food", "fruit", "grape", "ice", "ice cream",
    "juice", "meat", "milk", "noodle", "orange", "potato", "rice",
    "soup", "tea", "tomato", "vegetable", "breakfast", "lunch",
}

NATURE_WORDS = {
    "air", "autumn", "beach", "earth", "farm", "field", "fire",
    "flower", "garden", "grass", "hill", "lake", "light", "moon",
    "mountain", "rain", "river", "sea", "season", "sky", "snow",
    "space", "spring", "star", "summer", "sun", "tree", "water",
    "weather", "wind", "winter", "world",
}

OBJECT_WORDS = {
    "bag", "ball", "basketball", "bed", "bike", "blackboard", "boat",
    "book", "box", "bus", "candle", "cap", "car", "card", "chair",
    "clock", "clothes", "coat", "computer", "cup", "desk", "doll",
    "door", "email", "exercise", "fan", "film", "floor", "football",
    "game", "gift", "glass", "hat", "key", "kite", "lamp", "letter",
    "map", "money", "music", "name", "paper", "party", "pen", "pencil",
    "phone", "photo", "piano", "picture", "ping-pong", "plane",
    "plant", "playground", "present", "prize", "question", "robot",
    "ruler", "school", "schoolbag", "ship", "shirt", "shoe", "shop",
    "skirt", "sock", "song", "story", "street", "supermarket",
    "sweater", "table", "taxi", "toy", "train", "tree", "trousers",
    "TV", "umbrella", "wall", "watch", "window",
}


def classify_word(word: str) -> str:
    \"\"\"返回单词分类: animal | color | action | emotion | person |
    position | food | nature | object | abstract\"\"\"
    w = word.lower()
    if w in ANIMAL_WORDS:
        return "animal"
    if w in COLOR_WORDS:
        return "color"
    if w in ACTION_WORDS:
        return "action"
    if w in EMOTION_WORDS:
        return "emotion"
    if w in PERSON_WORDS:
        return "person"
    if w in POSITION_WORDS:
        return "position"
    if w in FOOD_WORDS:
        return "food"
    if w in NATURE_WORDS:
        return "nature"
    if w in OBJECT_WORDS:
        return "object"
    return "abstract"
```

- [ ] **Step 2: 验证分类覆盖率**

在 main() 中添加：
```python
def show_classification_stats(words: list[str]):
    \"\"\"打印分类统计\"\"\"
    from collections import Counter
    counts = Counter(classify_word(w) for w in words)
    print(f"\n📊 分类统计 ({len(words)} 词):")
    for cat, n in counts.most_common():
        print(f"   {cat:10s}: {n:3d}")
    abstract_count = counts.get("abstract", 0)
    print(f"\n  抽象词占比: {abstract_count}/{len(words)} ({100*abstract_count//len(words)}%)")

# 在 main() 中 parse 后调用
```

---
### Task 3: 实现提示词生成器

**Files:**
- Modify: `scripts/batch_generate_words.py`

**Interfaces:**
- Consumes: `classify_word(word) -> str`
- Produces: `build_prompt(word, category) -> str`

- [ ] **Step 1: 添加提示词模板和生成函数**

```python
# 基础提示词模板 - 所有单词共用部分
BASE_PROMPT = "{word}, D&D fantasy illustration, simple blurred background, " \
              "subject in focus, centered composition, shallow depth of field, " \
              "minimalist, soft warm lighting, rich colors, " \
              "trending on ArtStation, no text, no letters"

# 分类后缀模板
PROMPT_SUFFIX = {
    "animal": ", majestic {word} creature, centered, detailed fur, fantasy",
    "food": ", {word} on dark stone pedestal, softly glowing, centered, fantasy still life",
    "object": ", {word} on dark stone pedestal, softly glowing, centered, fantasy still life",
    "nature": ", {word} in a fantasy landscape, centered, soft mist, magical atmosphere",
    "color": ", magical glowing {word} in center, abstract light, pure color, ethereal",
    "action": ", adventurer in dynamic pose {word}ing, centered action, motion blur",
    "emotion": ", close-up portrait of a fantasy character feeling {word}, centered face, expression",
    "person": ", fantasy character portrait of a {word}, centered, detailed clothing, heroic",
    "position": ", magical spatial representation of {word}, geometric floating shapes, centered",
    "abstract": ", magical floating rune representing {word}, centered on dark background, glowing symbols",
}


def build_prompt(word: str, category: str) -> str:
    \"\"\"根据单词和分类生成提示词\"\"\"
    prompt = BASE_PROMPT.format(word=word)
    suffix = PROMPT_SUFFIX.get(category, PROMPT_SUFFIX["abstract"])
    prompt += suffix.format(word=word)
    return prompt
```

- [ ] **Step 2: 打印测试提示词验证**

在 main() 的测试模式中添加：
```python
# 测试: 打印每个单词的提示词
if args.test:
    for w in words:
        cat = classify_word(w)
        prompt = build_prompt(w, cat)
        print(f"  [{cat:8s}] {w:15s} → {prompt[:70]}...")
```

Run: `python scripts/batch_generate_words.py --test`
Expected: 显示 3 个单词的分类和提示词

---
### Task 4: 集成 ComfyUI 队列与下载

**Files:**
- Modify: `scripts/batch_generate_words.py`
- Reference: `scripts/dnd_workflow_api.json`

**Interfaces:**
- Consumes: `build_prompt(word, category) -> str`, 现有 `scripts/dnd_workflow_api.json`
- Produces: 图片文件到 `src/assets/images/word-images/primary/`

- [ ] **Step 1: 添加 ComfyUI 连接和工作流加载函数**

```python
def check_comfyui() -> bool:
    \"\"\"检查 ComfyUI 是否运行\"\"\"
    try:
        r = requests.get(f"{COMFY_URL}/queue", timeout=3)
        return True
    except requests.exceptions.ConnectionError:
        return False


def load_workflow(filepath: str) -> dict:
    \"\"\"加载 ComfyUI API 工作流 JSON\"\"\"
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def get_queue_size() -> int:
    \"\"\"获取队列中任务数\"\"\"
    try:
        r = requests.get(f"{COMFY_URL}/queue")
        data = r.json()
        return len(data.get("queue_running", [])) + len(data.get("queue_pending", []))
    except:
        return 0
```

- [ ] **Step 2: 添加队列提交函数**

注意：工作流中节点 ID 固定为：
- `57:27` → CLIPTextEncode（正向提示词）
- `57:33` → ConditioningZeroOut（负向，Turbo 不需要）
- `9` → SaveImage（文件名前缀）
- `57:3` → KSampler（需设置随机 seed）

```python
def queue_word(workflow: dict, word: str, prompt_text: str) -> str | None:
    \"\"\"将单词提交到 ComfyUI 队列，返回 prompt_id\"\"\"
    import random
    wf = json.loads(json.dumps(workflow))  # deep copy
    
    # 设置正向提示词
    wf['57:27']['inputs']['text'] = prompt_text
    # 设置文件名前缀以便后续识别
    wf['9']['inputs']['filename_prefix'] = f"word_{word}"
    # 随机种子
    wf['57:3']['inputs']['seed'] = random.randint(1, 999999999)
    
    payload = {"prompt": wf}
    try:
        r = requests.post(f"{COMFY_URL}/prompt", json=payload, timeout=30)
        if r.status_code == 200:
            return r.json().get("prompt_id")
        else:
            print(f"  ❌ HTTP {r.status_code}: {r.text}")
            return None
    except Exception as e:
        print(f"  ❌ 请求失败: {e}")
        return None
```

- [ ] **Step 3: 添加下载函数**

```python
def download_word_image(word: str, history_dir: str = "") -> bool:
    \"\"\"从 ComfyUI 下载指定单词的图片到目标目录。
    图片文件名为 word_{word}_XXXXX_.png，提取后保存为 {word}.png
    \"\"\"
    try:
        r = requests.get(f"{COMFY_URL}/history", timeout=30)
        history = r.json()
    except Exception as e:
        print(f"  ❌ 获取 history 失败: {e}")
        return False
    
    target = os.path.join(OUTPUT_DIR, f"{word}.png")
    if os.path.exists(target):
        return True  # 已有
    
    for pid, data in history.items():
        outputs = data.get("outputs", {})
        for node_id, node_output in outputs.items():
            for img in node_output.get("images", []):
                fn = img.get("filename", "")
                # 匹配 word_{word}_ 前缀
                if fn.startswith(f"word_{word}_") and fn.endswith(".png"):
                    url = f"{COMFY_URL}/view?filename={fn}&type=output"
                    try:
                        ir = requests.get(url, timeout=60)
                        if ir.status_code == 200:
                            os.makedirs(OUTPUT_DIR, exist_ok=True)
                            with open(target, "wb") as f:
                                f.write(ir.content)
                            print(f"  ✅ 下载: {word}.png")
                            return True
                    except Exception as e:
                        print(f"  ❌ 下载失败: {e}")
                        return False
    return False
```

- [ ] **Step 4: 实现批量生成主循环**

```python
def batch_generate(workflow: dict, words: list[str], test_mode: bool = False):
    \"\"\"批量生成所有单词的图片\"\"\"
    MAX_QUEUE = 5  # 同时队列中的最大任务数
    completed = 0
    failed = 0
    skipped = 0
    total = len(words)
    
    # 检查已有文件
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    existing = {f.replace('.png','') for f in os.listdir(OUTPUT_DIR) if f.endswith('.png')}
    
    print(f"\n{'='*60}")
    print(f"开始批量生成 {total} 个单词 (已有 {len(existing)} 个)")
    if test_mode:
        print("⚠️ 测试模式")
    print(f"{'='*60}\n")
    
    # 提交所有任务（不等待逐个完成，批量提交更高效）
    prompt_map = {}  # word -> prompt_id
    for i, word in enumerate(words):
        if word in existing:
            print(f"  [{i+1}/{total}] {word:15s} ⏭️ 已存在，跳过")
            skipped += 1
            continue
        
        cat = classify_word(word)
        prompt = build_prompt(word, cat)
        
        # 等待队列有空位
        while get_queue_size() >= MAX_QUEUE:
            time.sleep(3)
        
        pid = queue_word(workflow, word, prompt)
        if pid:
            prompt_map[pid] = word
            print(f"  [{i+1}/{total}] {word:15s} [{cat:8s}] 📤 已入队列")
        else:
            print(f"  [{i+1}/{total}] {word:15s} ❌ 入队列失败")
            failed += 1
    
    if test_mode:
        print(f"\n⏳ 测试模式: 等待 30 秒让图片生成...")
        time.sleep(30)
    else:
        print(f"\n⏳ 所有任务已提交，等待生成完成...")
        # 等待队列清空
        while get_queue_size() > 0:
            time.sleep(5)
        print(f"  队列清空，再等 10 秒让图片写入...")
        time.sleep(10)
    
    # 下载所有图片
    print(f"\n{'='*60}")
    print(f"开始下载...")
    print(f"{'='*60}\n")
    
    for pid, word in prompt_map.items():
        if download_word_image(word):
            completed += 1
        else:
            # 尝试下载最新历史
            print(f"  {word}: 尝试轮询下载...")
            for _ in range(10):
                if download_word_image(word):
                    completed += 1
                    break
                time.sleep(3)
            else:
                print(f"  {word}: ❌ 下载失败")
                failed += 1
    
    # 裁剪所有新图片为 256×256
    print(f"\n{'='*60}")
    print(f"裁剪图片至 256×256...")
    print(f"{'='*60}\n")
    resize_count = 0
    for word in words:
        src = os.path.join(OUTPUT_DIR, f"{word}.png")
        if os.path.exists(src):
            try:
                img = Image.open(src)
                img = img.resize((256, 256), Image.LANCZOS)
                img.save(src, "PNG")
                resize_count += 1
            except Exception as e:
                print(f"  ❌ 裁剪失败 {word}: {e}")
    
    print(f"\n{'='*60}")
    print(f"✅ 完成: {completed} 新生成, {skipped} 已跳过, {failed} 失败")
    print(f"📐 已裁剪 {resize_count} 张为 256×256")
    print(f"📁 图片保存在: {os.path.abspath(OUTPUT_DIR)}/")
    print(f"{'='*60}")
```

- [ ] **Step 5: 组装完整 main()**

```python
def main():
    parser = argparse.ArgumentParser(description="小学单词 D&D 配图批量生成")
    parser.add_argument("--test", action="store_true", help="测试模式: 只生成前3张")
    parser.add_argument("--word", type=str, help="只生成指定单词")
    args = parser.parse_args()
    
    # 1. 检查 ComfyUI
    print("🔍 检查 ComfyUI...")
    if not check_comfyui():
        print(f"❌ ComfyUI 未运行! 请先启动 (API: {COMFY_URL})")
        sys.exit(1)
    print(f"✅ ComfyUI 运行中 (队列: {get_queue_size()} 个)")
    
    # 2. 加载工作流
    print(f"\n🔍 加载工作流: {WORKFLOW_FILE}")
    workflow = load_workflow(WORKFLOW_FILE)
    print(f"   已加载, 共 {len(workflow)} 个节点")
    
    # 3. 读取单词
    words = parse_word_list(WORD_LIST_FILE)
    
    # 4. 分类统计
    show_classification_stats(words)
    
    # 5. 单词筛选
    if args.word:
        words = [args.word]
    if args.test:
        words = words[:3]
        print("⚠️ 测试模式: 只处理前 3 个单词")
        for w in words:
            cat = classify_word(w)
            prompt = build_prompt(w, cat)
            print(f"\n  [{cat:8s}] {w}")
            print(f"  提示词: {prompt}")
    
    # 6. 开始批量生成
    batch_generate(workflow, words, test_mode=args.test)


if __name__ == "__main__":
    main()
```

---
### Task 5: 测试运行并修复问题

**Files:**
- Test: `scripts/batch_generate_words.py`

- [ ] **Step 1: 确保 ComfyUI 在运行**

检查 ComfyUI 是否启动：
```bash
curl http://192.168.18.28:8188/queue
```
Expected: 返回 JSON（即使为空队列）

- [ ] **Step 2: 测试模式运行**

```bash
cd D:/reasonix/l9eng
python scripts/batch_generate_words.py --test
```

Expected:
- 打印 3 个单词的分类和提示词
- 提交 3 个任务到 ComfyUI
- 等待生成
- 下载图片到 `src/assets/images/word-images/primary/`

- [ ] **Step 3: 检查输出图片**

```bash
ls -la src/assets/images/word-images/primary/
```
Expected: 3 个 PNG 文件，256×256

- [ ] **Step 4: 全量运行**

```bash
python scripts/batch_generate_words.py
```
Expected: 处理全部 505 个单词，约 25-40 分钟

---
### Task 6: 更新 words.ts 路径（如需）

**Files:**
- Read: `src/core/data/words.ts`
- Possibly Modify: `src/core/data/words.ts`

如果 `imagePath` 引用的路径与输出目录不匹配，需要修正。现有路径格式为：
```typescript
imagePath: `/assets/images/word-images/${w.level}/${w.english}.png`
```

- [ ] **Step 1: 验证路径匹配**

```bash
# 检查是否有任意 primary 单词的路径指向了非 primary 目录
grep "word-images/" src/core/data/words.ts | head -5
```

- [ ] **Step 2: 如果需要，更新路径**

如果 words.ts 中的路径和实际输出目录不一致，修正 words.ts 中的 `imagePath`。

---
