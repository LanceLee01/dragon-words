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
    "know", "learn", "listen", "live", "look", "make", "meet",
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
    "warm", "wonderful", "young", "love",
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
    "afternoon", "day", "evening", "morning", "night",
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
    # body parts + abstract time
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

# Dictionary of sentence-scene prompts for abstract/function words.
# Each entry uses the word in a simple D&D scene that Stable Diffusion
# can actually render meaningfully.
ABSTRACT_SCENES = {
    "a": "a brave knight holding a shining sword, D&D fantasy character portrait, detailed armor",
    "about": "a wizard reading a spellbook about ancient dragons, glowing pages, fantasy library",
    "after": "adventurers resting around a campfire after a long battle, twilight, fantasy scene",
    "again": "a phoenix rising again from ashes, reborn in flames, fantasy rebirth",
    "age": "an ancient wizard with a long white beard, showing age and wisdom, fantasy portrait",
    "ago": "an old crumbling castle wall, ancient runes, moss-covered stone, history long ago",
    "all": "a grand feast table with all kinds of food, abundance, fantasy celebration",
    "also": "two magical potions side by side, one glowing blue and also one glowing green",
    "always": "an eternal flame burning on an altar, always lit, never熄灭, fantasy",
    "and": "a knight and a dragon standing together, unlikely allies, fantasy scene",
    "answer": "a wise owl delivering an answer on a scroll, fantasy messenger",
    "any": "a treasure chest full of any gem you can imagine, rainbow sparkles, fantasy",
    "art": "a painter creating a magical landscape on canvas, paintbrush glowing, fantasy art studio",
    "ask": "a young adventurer asking a wise wizard for guidance, fantasy mentorship",
    "at": "a wizard standing at the entrance of an ancient cave, staff glowing, fantasy",
    "be": "a magical mirror showing what could be, reflection of a fantasy kingdom",
    "because": "a detective gnome explaining because of the clues found, holding evidence, fantasy mystery",
    "before": "a hero kneeling before a king, receiving a quest, fantasy court scene",
    "best": "a champion holding a golden trophy, declared the best warrior, fantasy arena",
    "but": "a knight wanting peace but forced to fight, torn expression, fantasy conflict",
    "by": "a hermit's hut by a mystical lake, reflection in still water, fantasy landscape",
    "can": "a young apprentice casting a spell, i can do it expression, fantasy training",
    "could": "a fortune teller looking into a crystal ball, what could be, fantasy divination",
    "dear": "a princess writing a letter to someone dear, candlelight, fantasy romance",
    "do": "a busy dwarf blacksmith, lots of tasks to do, hammer striking anvil, sparks",
    "does": "a magical clockwork bird, does it run on magic or gears?, fantasy steampunk",
    "down": "a waterfall cascading down a mountain, mist and rainbows, fantasy landscape",
    "early": "a village waking up early in the morning, rooster crowing, sunrise over fantasy town",
    "easy": "a lazy dragon sleeping on a pile of gold, an easy life, fantasy",
    "every": "a market stall selling every kind of magical item, colorful wares, fantasy bazaar",
    "far": "a distant castle far away on the horizon, traveler on a road, fantasy journey",
    "fast": "a cheetah-like beast running fast through the forest, speed lines, fantasy creature",
    "find": "an adventurer finding a hidden treasure in a cave, torchlight, excitement",
    "first": "a baby dragon hatching from its first egg, new life, fantasy",
    "for": "a feast prepared for the returning heroes, grand table, celebration",
    "from": "a messenger arriving from a distant kingdom, dusty cloak, urgent letter",
    "get": "a hero reaching out to get a magical sword from a stone",
    "go": "an adventurer packing bags, ready to go on a quest, fantasy journey",
    "good": "a kind fairy spreading good magic, flowers blooming around her, fantasy",
    "great": "a great dragon soaring over mountains, epic scale, fantasy",
    "half": "a half-eaten turkey leg on a plate, half-full goblet, fantasy feast remains",
    "hard": "a dwarf miner working hard with a pickaxe, sweat, determination, fantasy mine",
    "have": "a dragon hoard, having piles of gold, treasure, fantasy wealth",
    "he": "a young wizard, he casts a spell, glowing hands, fantasy portrait",
    "hello": "two fantasy friends greeting each other with hello, meeting on a village road",
    "help": "a healer elf helping a wounded knight, magical glow, compassion",
    "her": "a princess and her loyal unicorn, bond between them, fantasy",
    "here": "a magical map with a glowing X marking here, destination, fantasy adventure",
    "hi": "a friendly goblin waving hi at the viewer, cheerful, fantasy creature",
    "him": "a knight and his king, loyalty to him, fantasy castle",
    "his": "a warrior holding his magical sword aloft, proud, fantasy",
    "how": "a curious child asking how magic works, watching a wizard demonstrate",
    "i": "a wizard pointing at himself, it is I, fantasy self-portrait",
    "idea": "a lightbulb moment, a fairy bringing an idea to a thinker's head, glowing inspiration",
    "if": "a crossroads with two paths, if you go this way or that, fantasy decision",
    "in": "a treasure chest in a deep cave, surrounded by darkness, fantasy",
    "into": "a brave knight walking into a mysterious forest, disappearing into the mist",
    "is": "a magical crystal ball, it is glowing with inner light, fantasy",
    "it": "a mysterious glowing artifact, what is it?, fantasy mystery object",
    "its": "a dragon and its treasure hoard, possessive bond, fantasy",
    "job": "a guild master at work, serious job, fantasy profession",
    "just": "a young hero, just beginning their journey, training sword, dawn",
    "keep": "a dwarf keeping watch over a bridge, shield ready, fantasy guardian",
    "kind": "a kind witch sharing soup with villagers, generous, fantasy community",
    "know": "an ancient sage who knows all secrets, glowing eyes, all-knowing, fantasy",
    "last": "the last cookie on a plate, a goblin reaching for it, fantasy",
    "late": "a messenger arriving late at night, moonlit castle gates, urgency",
    "learn": "young wizards learning magic at a school, spellbooks, fantasy classroom",
    "let": "a fairy releasing a trapped butterfly, let it go free, kindness",
    "like": "two best friends who like each other, dwarves sharing a mug of ale",
    "listen": "an elf listening to the forest, hand to ear, nature connection",
    "live": "a fantasy village where people live peacefully, cozy cottages, hearth fires",
    "long": "a long winding road stretching to a far castle, epic journey",
    "look": "a scout looking through a telescope at a distant tower, fantasy",
    "lot": "a dragon with a lot of treasure, piles of gold and gems, wealth",
    "love": "two fantasy characters in love, romantic dance in a magical garden",
    "make": "an elf blacksmith making a sword, hammer and anvil, craft, fantasy forge",
    "many": "many little fairies flying together in a swarm, magical lights",
    "may": "a fairy granting a wish, may your dreams come true, magical",
    "me": "a mirror showing the viewer, it is me, fantasy mirror frame",
    "more": "a giant's table with more food than you can imagine, feast, fantasy",
    "most": "the most powerful wizard in the realm, surrounded by magic aura",
    "much": "a dragon with much gold, so much treasure it spills from the cave",
    "must": "a prophecy scroll, this quest must be completed, destiny, fantasy",
    "my": "a knight holding my shield, possessive, personal heraldry, fantasy",
    "near": "a village near a giant's castle, proximity, fantasy landscape",
    "never": "a frozen moment, a clock that never ticks, stopped time, fantasy",
    "next": "two doors, one leads to the next adventure, mystery, fantasy choice",
    "no": "a guard saying no entry, hand raised, forbidding, fantasy gate",
    "not": "a broken magic wand, this spell is not working, frustration, fantasy",
    "now": "an hourglass, sand falling, the time is now, urgency, fantasy",
    "of": "the crown of the dragon king, royal, fantasy artifact",
    "off": "an adventurer brushing dust off their cloak, fantasy tavern",
    "often": "a wizard often found in the library, surrounded by books, habit",
    "ok": "a fairy giving an OK sign, everything is fine, cheerful, fantasy",
    "old": "an old wise tree with a face, ancient forest spirit, fantasy",
    "on": "a sword on a stone pedestal, resting, fantasy still life",
    "only": "a single rose in an empty garden, the only one, loneliness, fantasy",
    "or": "a crossroads, this path or that one, choice, fantasy adventure",
    "other": "two doors, one open and the other closed, contrast, fantasy mystery",
    "our": "a group of heroes, our party united, fellowship, fantasy team",
    "out": "a miner coming out of a cave with gems, exiting, fantasy",
    "over": "a dragon flying over a castle, soaring above, fantasy",
    "own": "a knight with own castle, lord of the manor, proud, fantasy",
    "please": "a beggar elf asking please for a coin, pleading, fantasy street",
    "quite": "a quite impressive magic show, audience amazed, fantasy performance",
    "right": "a knight choosing the right path, correct direction, fantasy moral",
    "same": "twin wizards casting the same spell in unison, mirror magic",
    "say": "a town crier shouting to say the news, proclamation, fantasy village",
    "see": "a wizard using a crystal ball to see faraway lands, scrying, fantasy",
    "shall": "a king declaring we shall go to war, determination, fantasy speech",
    "she": "an elf princess, she weaves magic with her hands, graceful",
    "should": "a conscience angel on a shoulder, what should i do, fantasy moral",
    "show": "a wizard showing a magic trick to children, amazed faces, fantasy",
    "so": "a giant so tall he touches clouds, scale comparison, fantasy",
    "some": "some magical gems scattered on a velvet cloth, colorful, fantasy treasure",
    "sometimes": "a clock with changing faces, sometimes sun sometimes moon, passing time",
    "soon": "a sunrise over a castle, the adventure begins soon, anticipation",
    "still": "a frozen lake, still water reflecting mountains, calm, fantasy landscape",
    "such": "a wizard casting such powerful magic, lightning from hands, epic",
    "sure": "a confident knight nodding, sure of victory, determined, fantasy",
    "tell": "a bard telling a story to an audience, captivated listeners, fantasy tavern",
    "than": "a giant taller than a castle, size comparison, fantasy scale",
    "thank": "a villager thanking a hero with a gift, gratitude, fantasy",
    "that": "a wizard pointing at that distant tower, indicating, fantasy",
    "the": "the ancient dragon, the one and only, legendary beast, fantasy",
    "their": "a family of dwarves, their home in the mountain, belonging",
    "them": "a leader guiding them through the forest, fellowship, fantasy party",
    "then": "a before and after scene, then and now, split view, fantasy time",
    "there": "a wizard pointing there to the horizon, distant goal, fantasy",
    "these": "a merchant showing these magical items in his hands, fantasy market",
    "they": "a group of adventurers, they stand together, fellowship, fantasy",
    "thing": "a mysterious glowing thing in a chest, unknown artifact, fantasy",
    "think": "a wizard deep in thought, chin on hand, thinking, fantasy study",
    "this": "a wizard holding this magical orb in hand, presenting, fantasy",
    "those": "a knight pointing at those mountains in the distance, far goal",
    "time": "an hourglass with glowing sand, time magic, fantasy",
    "to": "a path leading to a magical castle, direction, fantasy journey",
    "today": "a calendar with today marked, a celebration happening now, fantasy",
    "too": "a goblin carrying too much treasure, overloaded, funny, fantasy",
    "try": "a young dragon trying to breathe fire for the first time, cute",
    "us": "a shield with us carved, our group, unity, fantasy fellowship",
    "very": "a very large giant next to a normal person, scale, fantasy",
    "want": "a child elf wanting a wand, reaching out, desire, fantasy shop",
    "was": "a ruin of what was once a great castle, memory of glory, fantasy",
    "way": "a long winding way through mountains, path, fantasy journey",
    "we": "a party of heroes, we stand united, fellowship, fantasy group",
    "well": "a village well in the town square, water bucket, fantasy daily life",
    "what": "a wizard examining a strange artifact, what is this?, curiosity",
    "when": "a sundial, when the shadow points here, time measurement, fantasy",
    "where": "a crossroads signpost, where to go?, directions, fantasy adventure",
    "which": "two doors, which one to choose, decision, fantasy mystery",
    "who": "a masked figure, who is behind the mask?, mystery, fantasy",
    "why": "a child asking why to a wizard, curiosity, learning, fantasy",
    "will": "a prophecy scroll, the hero will defeat the darkness, destiny",
    "with": "a knight with a shining shield and sword, equipped, fantasy",
    "wish": "a fairy granting a wish, shooting star, magic sparkles, fantasy",
    "yes": "a king nodding yes, approval, crowned, fantasy court",
    "yesterday": "a wizard's diary from yesterday, memory magic, split scene",
    "you": "a mirror showing you, reflection, addressed directly, fantasy frame",
    "your": "a knight presenting your sword, ownership, fantasy ceremony",
    "time": "an hourglass with glowing magical sand, time passing, fantasy clock tower",
    # position words
    "behind": "a hidden treasure behind a waterfall, secret cave behind the water, fantasy",
    "below": "a castle floating above clouds, kingdom below visible, sky islands fantasy",
    "beside": "a small cottage beside a giant tree, scale comparison, fantasy landscape",
    "between": "a bridge between two mountains, spanning the gap, fantasy architecture",
    "inside": "the inside of a wizard's tower, filled with books and potions, fantasy interior",
    "outside": "the outside view of a grand castle, towering walls and banners, fantasy exterior",
    "through": "sunlight streaming through a forest canopy, magical rays, fantasy forest",
    "under": "an underground dwarven city under the mountain, glowing crystals, fantasy cavern",
    "up": "a tower reaching up to the clouds, impossibly tall, fantasy architecture",
}


def build_prompt(word, category):
    """Build D&D prompt for a word based on its category.

    Concrete words (animal/food/object/nature/color/action/emotion/person):
        Rich descriptive D&D scene with the word as the main subject.

    Abstract words:
        Sentence-scene from ABSTRACT_SCENES dictionary, putting the word
        into a concrete visual context that Stable Diffusion can render.
    """
    word_lower = word.lower().strip()

    # Abstract words use sentence scenes
    if category == "abstract" and word_lower in ABSTRACT_SCENES:
        scene = ABSTRACT_SCENES[word_lower]
        prompt = ("%s, D&D fantasy illustration, detailed scene, "
                  "rich colors, warm lighting, epic fantasy style, "
                  "trending on ArtStation" % scene)
        return prompt

    # For position words - use the word in a spatial scene
    if category == "position":
        position_scene = ABSTRACT_SCENES.get(word_lower)
        if position_scene:
            prompt = ("%s, D&D fantasy illustration, detailed scene, "
                      "rich colors, warm lighting, epic fantasy style, "
                      "trending on ArtStation" % position_scene)
        else:
            prompt = ("%s, D&D fantasy illustration showing spatial relation, "
                      "fantasy scene, clear composition, "
                      "rich colors, epic fantasy style, trending on ArtStation" % word)
        return prompt

    # Concrete words - rich descriptive prompts
    if category in ("animal", "food", "object", "nature", "person"):
        prompt = ("a detailed D&D fantasy illustration of %s, "
                  "centered composition, soft warm lighting, "
                  "rich colors, intricate details, "
                  "trending on ArtStation, fantasy art" % word)
        return prompt

    if category == "color":
        prompt = ("a fantasy scene dominated by the color %s, "
                  "magical atmosphere, rich vibrant %s tones, "
                  "epic fantasy illustration, trending on ArtStation" % (word, word))
        return prompt

    if category == "action":
        # Add -ing for action verbs
        action_word = word
        # Known special cases
        special_ing = {
            "run": "running", "swim": "swimming", "begin": "beginning",
            "sit": "sitting", "put": "putting", "cut": "cutting",
            "get": "getting", "win": "winning", "stop": "stopping",
            "climb": "climbing", "dance": "dancing", "come": "coming",
            "have": "having", "live": "living", "make": "making",
            "take": "taking", "write": "writing", "ride": "riding",
            "give": "giving", "use": "using", "move": "moving",
            "wake": "waking", "come": "coming", "smile": "smiling",
            "clean": "cleaning", "cook": "cooking", "draw": "drawing",
            "eat": "eating", "find": "finding", "hear": "hearing",
            "jump": "jumping", "keep": "keeping", "know": "knowing",
            "learn": "learning", "listen": "listening", "look": "looking",
            "meet": "meeting", "open": "opening", "play": "playing",
            "read": "reading", "say": "saying", "see": "seeing",
            "sell": "selling", "show": "showing", "sing": "singing",
            "sleep": "sleeping", "speak": "speaking", "stand": "standing",
            "study": "studying", "talk": "talking", "tell": "telling",
            "think": "thinking", "travel": "traveling", "try": "trying",
            "turn": "turning", "visit": "visiting", "wait": "waiting",
            "walk": "walking", "want": "wanting", "wash": "washing",
            "watch": "watching", "wear": "wearing", "work": "working",
            "bring": "bringing", "buy": "buying", "call": "calling",
            "catch": "catching", "cry": "crying", "drink": "drinking",
            "fly": "flying", "go": "going", "help": "helping",
            "hurry": "hurrying", "share": "sharing", "sweep": "sweeping",
        }
        if word in special_ing:
            action_word = special_ing[word]
        else:
            action_word = word + "ing"
        prompt = ("a D&D fantasy character %s, dynamic action pose, "
                  "centered, motion, epic fantasy illustration, "
                  "rich colors, soft warm lighting, trending on ArtStation" % action_word)
        return prompt

    if category == "emotion":
        prompt = ("a D&D fantasy character portrait showing %s emotion, "
                  "expressive face, centered, soft warm lighting, "
                  "fantasy art, trending on ArtStation" % word)
        return prompt

    # Fallback for any uncategorized abstract word
    prompt = ("a D&D fantasy illustration, magical scene, "
              "centered composition, soft warm lighting, rich colors, "
              "trending on ArtStation, fantasy art, %s" % word)
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
    """Download a word's image from ComfyUI history (latest version only)."""
    target = os.path.join(OUTPUT_DIR, "%s.png" % word)
    if os.path.exists(target):
        return True

    try:
        r = requests.get("%s/history" % COMFY_URL, timeout=30)
        history = r.json()
    except Exception as e:
        sp("  [ERROR] Failed to fetch history: %s" % e)
        return False

    # Find the latest matching image (highest sequence number)
    best_fn = None
    best_seq = -1
    prefix = "word_%s_" % word
    for pid, data in history.items():
        outputs = data.get("outputs", {})
        for node_id, node_output in outputs.items():
            for img in node_output.get("images", []):
                fn = img.get("filename", "")
                if fn.startswith(prefix) and fn.endswith(".png"):
                    # Extract sequence: word_{word}_XXXXX_.png
                    # Remove prefix and .png to get "XXXXX_"
                    suffix = fn[len(prefix):-4]  # e.g. "00001_"
                    seq_str = suffix.rstrip("_")
                    try:
                        seq = int(seq_str)
                        if seq > best_seq:
                            best_seq = seq
                            best_fn = fn
                    except ValueError:
                        if best_fn is None:
                            best_fn = fn

    if best_fn:
        url = "%s/view?filename=%s&type=output" % (COMFY_URL, best_fn)
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
