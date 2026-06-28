"""
Dragon Words -- primary school English word batch image generation
=================================================================
Reads 505 primary school English words, classifies by semantics,
generates D&D fantasy style prompts, sends to ComfyUI API for batch
generation, outputs 256x256 PNG to project assets directory.

Usage:
  1. Start ComfyUI (ensure API at 192.168.18.28:8188)
  2. Load and test scripts/dnd_workflow_api.json once
  3. Test mode: python scripts/batch_generate_words.py --test
  4. Full run: python scripts/batch_generate_words.py
  5. Single:   python scripts/batch_generate_words.py --word apple
"""
import argparse
import json
import os
import random
import re
import sys
import time
from collections import Counter

import requests
from PIL import Image

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
COMFY_URL = "http://192.168.18.28:8188"
WORKFLOW_FILE = "scripts/dnd_workflow_api.json"
OUTPUT_DIR = "src/assets/images/word-images/primary"
WORD_LIST_FILE = "words/2022新课标_二级词汇表_小学505词.md"
MAX_QUEUE = 5
HISTORY_POLL_INTERVAL = 3
MAX_HISTORY_POLLS = 20

# ---------------------------------------------------------------------------
# Helper: safe print for Windows GBK terminals
# ---------------------------------------------------------------------------
def sp(text):
    """Safe print - replaces any character that can't be encoded to stdout"""
    try:
        print(text)
    except UnicodeEncodeError:
        # Fall back: encode to ASCII, replace non-encodable chars
        safe = text.encode('ascii', 'replace').decode('ascii')
        print(safe)


# ---------------------------------------------------------------------------
# Word classification dictionaries
# ---------------------------------------------------------------------------
ANIMAL_WORDS = {
    "animal", "ant", "bear", "bee", "bird", "cat", "chicken", "cow", "dog",
    "duck", "elephant", "fish", "horse", "lion", "monkey", "mouse", "panda",
    "pet", "pig", "rabbit", "sheep", "tiger", "whale",
}

COLOR_WORDS = {
    "black", "blue", "brown", "green", "orange", "pink", "red", "white",
    "yellow", "gold",
}

ACTION_WORDS = {
    "begin", "bring", "buy", "call", "catch", "clean", "climb", "come",
    "cook", "cry", "cut", "dance", "draw", "drink", "eat", "find", "fly",
    "get", "give", "go", "have", "hear", "help", "hurry", "jump", "keep",
    "know", "learn", "listen", "live", "look", "love", "make", "meet",
    "move", "open", "play", "put", "read", "ride", "run", "say", "see",
    "sell", "share", "show", "sing", "sit", "sleep", "speak", "stand",
    "stop", "study", "sweep", "swim", "take", "talk", "tell", "think",
    "travel", "try", "turn", "use", "visit", "wait", "wake", "walk",
    "want", "wash", "watch", "wear", "win", "work", "write",
}

EMOTION_WORDS = {
    "angry", "bad", "beautiful", "clever", "cool", "cute", "dear",
    "excited", "fine", "good", "great", "happy", "helpful", "hungry",
    "interesting", "kind", "little", "lovely", "new", "nice", "old",
    "pretty", "quiet", "sad", "sorry", "strong", "tall", "thin", "tired",
    "warm", "wonderful", "young",
}

PERSON_WORDS = {
    "aunt", "baby", "boy", "brother", "child", "cousin", "doctor",
    "driver", "family", "farmer", "father", "friend", "girl",
    "grandfather", "grandmother", "kid", "man", "mother", "nurse",
    "parent", "people", "person", "police", "sister", "student",
    "teacher", "uncle", "woman", "worker", "astronaut", "Miss", "Mr",
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
    # time of day
    "afternoon", "day", "evening", "morning", "night", "time",
}

OBJECT_WORDS = {
    "bag", "ball", "basketball", "bed", "bike", "blackboard", "boat",
    "book", "box", "bus", "candle", "cap", "car", "card", "chair",
    "clock", "clothes", "coat", "computer", "cup", "desk", "doll",
    "door", "email", "exercise", "fan", "film", "floor", "football",
    "game", "gift", "glass", "hat", "home", "kite", "lamp", "letter",
    "map", "money", "music", "name", "paper", "party", "pen", "pencil",
    "phone", "photo", "piano", "picture", "ping-pong", "plane",
    "plant", "playground", "present", "question", "robot",
    "ruler", "school", "schoolbag", "ship", "shirt", "shoe", "shop",
    "skirt", "sock", "song", "story", "street", "supermarket",
    "sweater", "table", "taxi", "toy", "train", "trousers",
    "TV", "umbrella", "wall", "watch", "window", "key",
    # body parts
    "arm", "back", "body", "ear", "eye", "face", "foot", "hair",
    "hand", "head", "leg", "mouth", "nose", "tail",
}


def classify_word(word):
    """Return category: animal|color|action|emotion|person|position|food|nature|object|abstract"""
    w = word.lower().strip()
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


# ---------------------------------------------------------------------------
# Prompt templates
# ---------------------------------------------------------------------------
BASE_PROMPT = (
    "{word}, D&D fantasy illustration, simple blurred background, "
    "subject in focus, centered composition, shallow depth of field, "
    "minimalist, soft warm lighting, rich colors, "
    "trending on ArtStation, no text, no letters"
)

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


def build_prompt(word, category):
    """Build D&D prompt for a word based on its category"""
    prompt = BASE_PROMPT.format(word=word)
    suffix = PROMPT_SUFFIX.get(category, PROMPT_SUFFIX["abstract"])
    prompt += suffix.format(word=word)
    return prompt


# ---------------------------------------------------------------------------
# Word list parser
# ---------------------------------------------------------------------------
def parse_word_list(filepath):
    """Parse the primary-school word list from Markdown table format.

    Format: | number | word |
    Handles parenthetical variants like 'a (an)' -> 'a'
    """
    words = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            m = re.match(r'\|\s*\d+\s*\|\s*(.+?)\s*\|', line)
            if m:
                raw = m.group(1)
                word = re.sub(r'\s*\(.*?\)\s*', '', raw).strip()
                if word:
                    words.append(word.lower())
    sp("Read %d words from %s" % (len(words), filepath))
    return words


# ---------------------------------------------------------------------------
# ComfyUI API helpers
# ---------------------------------------------------------------------------
def check_comfyui():
    """Check if ComfyUI is running"""
    try:
        r = requests.get("%s/queue" % COMFY_URL, timeout=3)
        return True
    except requests.exceptions.ConnectionError:
        return False


def get_queue_size():
    """Get number of tasks in queue (running + pending)"""
    try:
        r = requests.get("%s/queue" % COMFY_URL, timeout=5)
        data = r.json()
        return len(data.get("queue_running", [])) + len(data.get("queue_pending", []))
    except Exception:
        return 0


def load_workflow(filepath):
    """Load ComfyUI API-format workflow JSON"""
    if not os.path.exists(filepath):
        sp("[ERROR] Workflow file not found: %s" % filepath)
        return None
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def queue_word(workflow, word, prompt_text):
    """Submit a word generation task to ComfyUI queue, return prompt_id"""
    wf = json.loads(json.dumps(workflow))
    wf['57:27']['inputs']['text'] = prompt_text
    wf['9']['inputs']['filename_prefix'] = "word_%s" % word
    wf['57:3']['inputs']['seed'] = random.randint(1, 999999999)

    payload = {"prompt": wf}
    try:
        r = requests.post("%s/prompt" % COMFY_URL, json=payload, timeout=30)
        if r.status_code == 200:
            return r.json().get("prompt_id")
        else:
            sp("  [ERROR] HTTP %d: %s" % (r.status_code, r.text[:100]))
            return None
    except Exception as e:
        sp("  [ERROR] Request failed: %s" % e)
        return None


def download_word_image(word):
    """Download a word's image from ComfyUI history"""
    target = os.path.join(OUTPUT_DIR, "%s.png" % word)
    if os.path.exists(target):
        return True

    try:
        r = requests.get("%s/history" % COMFY_URL, timeout=30)
        history = r.json()
    except Exception as e:
        sp("  [ERROR] Failed to fetch history: %s" % e)
        return False

    for pid, data in history.items():
        outputs = data.get("outputs", {})
        for node_id, node_output in outputs.items():
            for img in node_output.get("images", []):
                fn = img.get("filename", "")
                if fn.startswith("word_%s_" % word) and fn.endswith(".png"):
                    url = "%s/view?filename=%s&type=output" % (COMFY_URL, fn)
                    try:
                        ir = requests.get(url, timeout=60)
                        if ir.status_code == 200:
                            os.makedirs(OUTPUT_DIR, exist_ok=True)
                            with open(target, "wb") as f:
                                f.write(ir.content)
                            return True
                    except Exception:
                        return False
    return False


def poll_download(word, max_polls=MAX_HISTORY_POLLS):
    """Poll history and download, retry up to max_polls times"""
    for i in range(max_polls):
        if download_word_image(word):
            return True
        time.sleep(HISTORY_POLL_INTERVAL)
    return False


# ---------------------------------------------------------------------------
# Batch generation
# ---------------------------------------------------------------------------
def batch_generate(workflow, words, test_mode=False):
    """Batch generate images for all words"""
    completed = 0
    failed = 0
    skipped = 0
    total = len(words)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    existing = {f.replace('.png', '') for f in os.listdir(OUTPUT_DIR) if f.endswith('.png')}

    sp("")
    sp("=" * 60)
    sp("Batch generating %d words (existing: %d)" % (total, len(existing)))
    if test_mode:
        sp("[TEST MODE] Processing first 3 only")
    sp("=" * 60)
    sp("")

    # Phase 1: Submit all tasks
    prompt_map = {}
    for i, word in enumerate(words):
        if word in existing:
            sp("  [%d/%d] %-15s [SKIP] already exists" % (i + 1, total, word))
            skipped += 1
            continue

        cat = classify_word(word)
        prompt = build_prompt(word, cat)

        while get_queue_size() >= MAX_QUEUE:
            time.sleep(2)

        pid = queue_word(workflow, word, prompt)
        if pid:
            prompt_map[pid] = word
            sp("  [%d/%d] %-15s [%-8s] QUEUED (pid=%s...)" % (
                i + 1, total, word, cat, pid[:12]))
        else:
            sp("  [%d/%d] %-15s [FAIL] queue failed" % (i + 1, total, word))
            failed += 1

    # Phase 2: Wait for completion
    wait_time = 30 if test_mode else 5
    sp("[WAIT] Waiting %ds for generation..." % wait_time)
    time.sleep(wait_time)

    while get_queue_size() > 0:
        sp("  Queue still has %d tasks, waiting..." % get_queue_size())
        time.sleep(5)

    time.sleep(5)

    # Phase 3: Download
    sp("")
    sp("=" * 60)
    sp("Downloading images...")
    sp("=" * 60)
    sp("")

    for pid, word in prompt_map.items():
        ok = poll_download(word)
        if ok:
            sp("  [OK] %-15s downloaded" % word)
            completed += 1
        else:
            sp("  [FAIL] %-15s download failed" % word)
            failed += 1

    # Phase 4: Resize to 256x256
    sp("")
    sp("=" * 60)
    sp("Resizing images to 256x256...")
    sp("=" * 60)
    sp("")
    resize_count = 0
    for word in words:
        src = os.path.join(OUTPUT_DIR, "%s.png" % word)
        if os.path.exists(src):
            try:
                img = Image.open(src)
                img = img.resize((256, 256), Image.LANCZOS)
                img.save(src, "PNG")
                resize_count += 1
            except Exception as e:
                sp("  [ERROR] Resize failed for %s: %s" % (word, e))

    sp("")
    sp("=" * 60)
    sp("DONE: %d new, %d skipped, %d failed" % (completed, skipped, failed))
    sp("Resized %d images to 256x256" % resize_count)
    sp("Images saved in: %s" % os.path.abspath(OUTPUT_DIR))
    sp("=" * 60)


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------
def show_classification_stats(words):
    """Print classification statistics"""
    counts = Counter(classify_word(w) for w in words)
    sp("")
    sp("Classification stats (%d words):" % len(words))
    for cat, n in counts.most_common():
        sp("  %-10s: %3d" % (cat, n))
    abstract_count = counts.get("abstract", 0)
    sp("")
    sp("Abstract words: %d/%d (%d%%)" % (
        abstract_count, len(words), 100 * abstract_count // len(words)))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Primary school word D&D image batch generator")
    parser.add_argument("--test", action="store_true", help="Test mode: generate first 3 only")
    parser.add_argument("--word", type=str, help="Generate a single word only")
    args = parser.parse_args()

    # 1. Check ComfyUI
    sp("[CHECK] Checking ComfyUI...")
    if not check_comfyui():
        sp("[ERROR] ComfyUI not running! Please start it first (API: %s)" % COMFY_URL)
        sys.exit(1)
    sp("[OK] ComfyUI running (queue: %d)" % get_queue_size())

    # 2. Load workflow
    sp("[INFO] Loading workflow: %s" % WORKFLOW_FILE)
    workflow = load_workflow(WORKFLOW_FILE)
    if not workflow:
        sys.exit(1)
    sp("  Loaded, %d nodes" % len(workflow))

    # 3. Parse words
    words = parse_word_list(WORD_LIST_FILE)

    # 4. Classification stats
    show_classification_stats(words)

    # 5. Filter words
    if args.word:
        words = [args.word]
    if args.test:
        words = words[:3]
        sp("[TEST MODE] Processing first 3 words")
        for w in words:
            cat = classify_word(w)
            prompt = build_prompt(w, cat)
            sp("  [%-8s] %s" % (cat, w))
            sp("    Prompt: %s..." % prompt[:100])

    # 6. Generate
    batch_generate(workflow, words, test_mode=args.test)


if __name__ == "__main__":
    main()
