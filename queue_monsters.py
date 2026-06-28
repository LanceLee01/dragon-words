import json
import random
import requests
import time
import os

COMFY_UI = "http://192.168.18.28:8188"
OUTPUT_DIR = "D:/reasonix/l9eng/public/assets/images/monsters"

# Load workflow
with open("D:/reasonix/l9eng/image_z_image_turbo-dd.json", "r", encoding="utf-8") as f:
    wf = json.load(f)

monsters = [
    ("goblin", "D&D goblin monster, small green humanoid with sharp teeth and crude weapons, fantasy art, full body, creepy, dungeon lighting"),
    ("skeleton", "D&D skeleton warrior, undead with rusty armor and sword, glowing eyes, dark fantasy, spooky"),
    ("apprentice", "dark magic apprentice, robed figure with glowing staff, evil magic, fantasy art"),
    ("shadowwolf", "giant shadow wolf, glowing blue eyes, ethereal dark fur, lurking in darkness, fantasy monster"),
    ("gargoyle", "stone gargoyle monster with wings perched on cathedral, grey stone texture, fantasy gothic"),
    ("troglodyte", "cave troglodyte, lizard-like humanoid, underground dark fantasy creature"),
    ("harpy", "D&D harpy, bird-woman with sharp talons and wings, perched on cliff, fantasy monster"),
    ("ghost", "translucent ghost spirit, floating ethereal, haunted, glowing white-blue, fantasy"),
    ("ogre", "large ogre monster with club, fat green skin, ugly face, fantasy swamp creature"),
    ("succubus", "D&D succubus, seductive demon with wings and tail, dark purple tones, fantasy"),
    ("demonhound", "hell hound, demonic dog with fire, glowing red eyes, dark fantasy beast"),
    ("fallenAngel", "fallen angel with torn black wings, dark armor, tragic, fantasy epic"),
    ("timeGhost", "time ghost, clockwork phantom with glowing gears, ethereal blue, fantasy"),
    ("dragonborn", "dragonborn warrior, tall reptilian humanoid with scales and battleaxe, fantasy"),
    ("eliteGuard", "elite dragon guard in ornate armor with dragon emblem, fantasy epic"),
    ("goblinKing", "goblin king, larger goblin with crown and scepter, throne room, fantasy"),
    ("deathKnight", "death knight in black armor with flaming sword, undead horse, dark fantasy"),
    ("archmage_boss", "powerful evil archmage with arcane swirling magic, staff, fantasy epic"),
    ("treantElder", "ancient treant, walking tree with face, moss and branches, fantasy forest"),
    ("lavaGiant", "lava giant made of molten rock, fire, fantasy volcano creature, epic"),
    ("drowElf", "dark elf with dual scimitars, black skin, white hair, underground cavern, fantasy"),
    ("wyvern", "D&D wyvern dragon with wings and scorpion tail, fantasy flying monster, epic"),
    ("lichKing", "lich king, skeletal mage with crown and glowing phylactery, dark fantasy undead"),
    ("stormGiant", "storm giant, huge blue-skinned giant with lightning, clouds, fantasy epic"),
    ("darkKnight", "dark knight on nightmare horse, black armor, red eyes, gothic fantasy"),
    ("abyssalLord", "abyssal lord demon, huge horned demon with wings, fire, hell, fantasy epic"),
    ("archangel", "archangel with pure white wings and golden armor, holy light, epic fantasy"),
    ("timeKeeper", "time keeper, clockwork being with hourglass staff, gears, fantasy"),
    ("dracolich", "dracolich, skeletal undead dragon with purple necromantic glow, epic fantasy"),
    ("ancientRed", "ancient red dragon, massive scarlet dragon with fire breath, mountain lair, epic fantasy"),
]

os.makedirs(OUTPUT_DIR, exist_ok=True)

prompt_ids = {}

# Queue all 30 monsters
print("=" * 60)
print("QUEUING 30 MONSTERS...")
print("=" * 60)

for idx, (name, prompt_text) in enumerate(monsters):
    wf_copy = json.loads(json.dumps(wf))  # deep copy
    wf_copy['57:27']['inputs']['text'] = prompt_text
    wf_copy['9']['inputs']['filename_prefix'] = f'monster_{name}'
    wf_copy['57:3']['inputs']['seed'] = random.randint(1, 999999999)

    payload = {"prompt": wf_copy}
    
    try:
        resp = requests.post(f"{COMFY_UI}/prompt", json=payload, timeout=30)
        data = resp.json()
        pid = data.get("prompt_id", "unknown")
        prompt_ids[name] = pid
        print(f"  [{idx+1:2d}/30] {name:15s} -> prompt_id={pid[:16]}...  [QUEUED]")
    except Exception as e:
        print(f"  [{idx+1:2d}/30] {name:15s} -> FAILED: {e}")

print(f"\nQueued {len(prompt_ids)}/{len(monsters)} monsters successfully.")
print(f"\nWaiting 3 minutes for generation...")
time.sleep(180)

# Fetch history
print("\n" + "=" * 60)
print("DOWNLOADING IMAGES...")
print("=" * 60)

try:
    resp = requests.get(f"{COMFY_UI}/history", timeout=30)
    history = resp.json()

    downloaded = 0
    for name, pid in prompt_ids.items():
        if pid in history:
            outputs = history[pid].get("outputs", {})
            for node_id, node_output in outputs.items():
                images = node_output.get("images", [])
                for img in images:
                    filename = img.get("filename", "")
                    if filename:
                        url = f"{COMFY_UI}/view?filename={filename}&type=output"
                        outpath = os.path.join(OUTPUT_DIR, f"{name}.png")
                        try:
                            img_resp = requests.get(url, timeout=60)
                            if img_resp.status_code == 200:
                                with open(outpath, "wb") as f:
                                    f.write(img_resp.content)
                                print(f"  {name:15s} -> {filename:30s} -> {outpath}  [OK]")
                                downloaded += 1
                            else:
                                print(f"  {name:15s} -> {filename:30s} -> HTTP {img_resp.status_code}  [FAIL]")
                        except Exception as e:
                            print(f"  {name:15s} -> ERROR: {e}")
        else:
            print(f"  {name:15s} -> prompt_id not found in history  [MISSING]")

    print(f"\nDownloaded {downloaded}/{len(prompt_ids)} images to {OUTPUT_DIR}")

except Exception as e:
    print(f"Failed to fetch history: {e}")
    # Fallback: try to list output directory
    import glob
    files = glob.glob(os.path.join(OUTPUT_DIR, "*.png"))
    print(f"Files already in output dir: {len(files)}")
