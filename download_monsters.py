import json, requests, os, time

COMFY_UI = "http://192.168.18.28:8188"
OUTPUT_DIR = "D:/reasonix/l9eng/public/assets/images/monsters"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Monster name by prefix
monster_names = [
    "goblin", "skeleton", "apprentice", "shadowwolf", "gargoyle",
    "troglodyte", "harpy", "ghost", "ogre", "succubus",
    "demonhound", "fallenAngel", "timeGhost", "dragonborn", "eliteGuard",
    "goblinKing", "deathKnight", "archmage_boss", "treantElder", "lavaGiant",
    "drowElf", "wyvern", "lichKing", "stormGiant", "darkKnight",
    "abyssalLord", "archangel", "timeKeeper", "dracolich", "ancientRed"
]

def get_downloaded():
    """Return set of monster names already downloaded."""
    if not os.path.isdir(OUTPUT_DIR):
        return set()
    return {f.replace('.png','') for f in os.listdir(OUTPUT_DIR) if f.endswith('.png')}

def poll_and_download(max_wait=600):
    """Poll history every 15s, download new monster images."""
    start = time.time()
    while time.time() - start < max_wait:
        downloaded = get_downloaded()
        remaining = [m for m in monster_names if m not in downloaded]
        
        if not remaining:
            print(f"\nAll {len(monster_names)} monsters downloaded!")
            return True
        
        print(f"[{int(time.time()-start)}s] Downloaded: {len(downloaded)}/{len(monster_names)}, Remaining: {len(remaining)}")
        
        try:
            r = requests.get(f"{COMFY_UI}/history", timeout=30)
            history = r.json()
            
            new_count = 0
            for pid, data in history.items():
                outputs = data.get("outputs", {})
                for node_id, node_output in outputs.items():
                    for img in node_output.get("images", []):
                        fn = img.get("filename", "")
                        if fn.startswith("monster_") and fn.endswith(".png"):
                            # Extract monster name from filename: monster_goblin_00001_.png
                            parts = fn.split("_")
                            if len(parts) >= 2:
                                mname = parts[1]
                                if mname in remaining:
                                    outpath = os.path.join(OUTPUT_DIR, f"{mname}.png")
                                    if os.path.exists(outpath):
                                        continue
                                    url = f"{COMFY_UI}/view?filename={fn}&type=output"
                                    ir = requests.get(url, timeout=60)
                                    if ir.status_code == 200:
                                        with open(outpath, "wb") as f:
                                            f.write(ir.content)
                                        print(f"  DOWNLOADED: {mname:15s} <- {fn}")
                                        new_count += 1
                                    else:
                                        print(f"  FAIL HTTP {ir.status_code}: {fn}")
        except Exception as e:
            print(f"  Error polling: {e}")
        
        if remaining:
            time.sleep(15)
    
    # Final status
    downloaded = get_downloaded()
    missing = [m for m in monster_names if m not in downloaded]
    if missing:
        print(f"\nTIMEOUT after {max_wait}s. Missing {len(missing)}: {missing}")
    return False

poll_and_download()
