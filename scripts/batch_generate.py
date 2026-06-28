# Dragon Words — ComfyUI 批量生图脚本
# 用法:
#   1. 启动 ComfyUI (确保 API 在 localhost:8188)
#   2. 在 ComfyUI 中加载并测试一次 D&D 风格工作流
#   3. 导出为 API 格式: 设置 → 开启 Dev Mode → Save (API Format)
#   4. 把导出的 JSON 命名为 dnd_workflow_api.json 放在本脚本同目录
#   5. 先测试: python batch_generate.py --test
#   6. 跑全部: python batch_generate.py

import requests
import json
import time
import os
import argparse
import sys

COMFY_URL = "http://192.168.18.28:8188"
WORKFLOW_FILE = "dnd_workflow_api.json"
OUTPUT_DIR = "output_images"
PROMPT_FILE = "word_prompts.json"

# 提示词模板
# {word} 会被替换为具体单词
# 可根据单词类型调整: 实物词/抽象词/动作词
BASE_PROMPT = "{word}, D&D fantasy illustration, medieval fantasy art style, \
intricate detailed, rich colors, cinematic lighting, volumetric light, \
full frame composition, epic fantasy, dungeons and dragons style, \
oil painting texture, warm golden hour lighting, high fantasy, \
trending on ArtStation, no text, no letters"

NEGATIVE_PROMPT = "text, letters, watermark, signature, border, frame, \
ugly, deformed, blurry, low quality, worst quality, distorted, \
disfigured, bad anatomy, extra limbs, nude, modern, contemporary, photo"

# 单词分类关键词
CONCRETE_PROMPT_SUFFIX = ", detailed {word} in a medieval setting, ancient, treasure"
ABSTRACT_PROMPT_SUFFIX = ", allegorical visual representation of {word}, symbolic, magical aura"
ACTION_PROMPT_SUFFIX = ", adventurer {word}ing through ancient ruins, motion blur"


def check_comfyui_running():
    """检查 ComfyUI 是否在运行"""
    try:
        r = requests.get(f"{COMFY_URL}/queue", timeout=3)
        return True
    except requests.exceptions.ConnectionError:
        return False


def get_queue_size():
    """获取待处理队列大小"""
    try:
        r = requests.get(f"{COMFY_URL}/queue")
        data = r.json()
        return len(data.get("queue_running", [])) + len(data.get("queue_pending", []))
    except:
        return 0


def load_workflow(filepath):
    """加载 ComfyUI API 格式的工作流 JSON"""
    if not os.path.exists(filepath):
        print(f"❌ 找不到工作流文件: {filepath}")
        print("请先在 ComfyUI 中设计好 D&D 风格工作流，然后导出为 API 格式。")
        print("设置 → 开启 Dev Mode → Save (API Format)")
        return None
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def find_nodes(workflow):
    """在工作流中找到关键节点 ID"""
    prompt_node = None
    negative_node = None
    save_node = None
    
    for node_id, node in workflow.items():
        class_type = node.get("class_type", "")
        if "CLIPTextEncode" in class_type:
            # 第一个是正向提示词，第二个是负向
            if prompt_node is None:
                prompt_node = node_id
            elif negative_node is None:
                negative_node = node_id
        elif "SaveImage" in class_type or "PreviewImage" in class_type:
            save_node = node_id
    
    return prompt_node, negative_node, save_node


def get_prompt_template(word, word_type="concrete"):
    """为不同单词类型生成合适的提示词"""
    if word_type == "concrete":
        suffix = CONCRETE_PROMPT_SUFFIX.format(word=word)
    elif word_type == "abstract":
        suffix = ABSTRACT_PROMPT_SUFFIX.format(word=word)
    elif word_type == "action":
        suffix = ACTION_PROMPT_SUFFIX.format(word=word)
    else:
        suffix = ""
    
    prompt = BASE_PROMPT.format(word=word) + suffix
    return prompt


def queue_prompt(workflow, prompt_text, negative_text, filename_prefix):
    """将任务发送到 ComfyUI 队列"""
    wf = json.loads(json.dumps(workflow))
    
    prompt_node, negative_node, save_node = find_nodes(wf)
    
    if prompt_node:
        wf[prompt_node]["inputs"]["text"] = prompt_text
    if negative_node:
        wf[negative_node]["inputs"]["text"] = negative_text
    if save_node:
        wf[save_node]["inputs"]["filename_prefix"] = filename_prefix
    
    payload = {"prompt": wf}
    
    try:
        r = requests.post(f"{COMFY_URL}/prompt", json=payload)
        if r.status_code == 200:
            result = r.json()
            return result.get("prompt_id")
        else:
            print(f"  ❌ 请求失败: {r.status_code} {r.text}")
            return None
    except Exception as e:
        print(f"  ❌ 连接错误: {e}")
        return None


def wait_for_prompt(prompt_id, timeout=120):
    """等待指定 prompt 完成"""
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = requests.get(f"{COMFY_URL}/history/{prompt_id}")
            if r.status_code == 200 and r.json():
                data = r.json()
                if prompt_id in data:
                    status = data[prompt_id].get("status", {})
                    if status.get("completed") or status.get("status_str") == "success":
                        return True
                    if status.get("status_str") == "error":
                        print(f"  ❌ 生成出错")
                        return False
        except:
            pass
        time.sleep(1)
    return False


def generate_single(workflow, word, word_type="concrete", output_prefix=""):
    """生成单个单词的图片"""
    prompt_text = get_prompt_template(word, word_type)
    prefix = output_prefix or word.replace(" ", "_")
    
    print(f"  🎯 生成: '{word}' (类型: {word_type})")
    print(f"  提示词: {prompt_text[:80]}...")
    
    prompt_id = queue_prompt(workflow, prompt_text, NEGATIVE_PROMPT, prefix)
    if not prompt_id:
        return False
    
    print(f"  任务ID: {prompt_id} 等待中...")
    success = wait_for_prompt(prompt_id)
    
    if success:
        print(f"  ✅ '{word}' 生成完成")
    else:
        print(f"  ❌ '{word}' 生成失败或超时")
    
    return success


def generate_from_list(workflow, word_list, test_mode=False):
    """批量生成单词列表中的图片"""
    total = len(word_list)
    batch = 5  # 队列中保留的最大任务数
    completed = 0
    failed = 0
    
    print(f"\n{'='*60}")
    print(f"开始批量生成 {total} 个单词的配图")
    if test_mode:
        print("⚠️ 测试模式: 只生成前3个")
        total = min(total, 3)
    print(f"{'='*60}\n")
    
    for i, item in enumerate(word_list):
        if test_mode and i >= 3:
            break
        
        word = item.get("word", "")
        word_type = item.get("type", "concrete")
        
        print(f"\n[{i+1}/{total}] ", end="")
        ok = generate_single(workflow, word, word_type, word)
        
        if ok:
            completed += 1
        else:
            failed += 1
        
        # 等待队列不要堆积太多
        while get_queue_size() >= batch and i < total - 1:
            time.sleep(2)
    
    print(f"\n{'='*60}")
    print(f"✅ 完成: {completed} 成功, {failed} 失败")
    print(f"{'='*60}")


def generate_word_prompts(level_filter=None):
    """生成 1600 个单词的提示词文件（从项目数据读取）
    level_filter: 'primary' | 'middle' | None (全部)
    """
    # 尝试从项目的 words.ts 读取
    words_ts = "../src/core/data/words.ts"
    if os.path.exists(words_ts):
        print(f"📖 从 {words_ts} 读取单词列表...")
        # 简单的解析: 提取 english 和 type
        import re
        word_list = []
        with open(words_ts, "r", encoding="utf-8") as f:
            content = f.read()
            # 提取所有单词条目 — 格式: english: "word", level: "primary|middle"
            entries = re.findall(r'english:\s*"([^"]+)"', content)
            levels = re.findall(r'level:\s*"(primary|middle)"', content)

            for i, eng in enumerate(entries):
                lvl = levels[i] if i < len(levels) else "primary"
                if level_filter and lvl != level_filter:
                    continue
                if lvl == "primary":
                    wtype = "concrete"
                else:
                    wtype = "abstract"
                word_list.append({"word": eng, "type": wtype})

        if level_filter:
            print(f"  过滤后: {len(word_list)} 个 ({level_filter})")
        
        print(f"  读取到 {len(word_list)} 个单词")
        return word_list
    else:
        print(f"⚠️ 找不到 {words_ts}，使用内置示例单词")
        return [
            {"word": "courage", "type": "abstract"},
            {"word": "dragon", "type": "concrete"},
            {"word": "sword", "type": "concrete"},
            {"word": "freedom", "type": "abstract"},
            {"word": "run", "type": "action"},
            {"word": "castle", "type": "concrete"},
            {"word": "magic", "type": "abstract"},
            {"word": "shadow", "type": "concrete"},
        ]


def main():
    parser = argparse.ArgumentParser(description="Dragon Words ComfyUI 批量生图")
    parser.add_argument("--test", action="store_true", help="测试模式: 只生成前3张")
    parser.add_argument("--word", type=str, help="只生成指定单词")
    parser.add_argument("--level", type=str, choices=["primary", "middle"], help="只生成指定级别的单词 (primary/middle)")
    parser.add_argument("--workflow", type=str, default=WORKFLOW_FILE, help=f"工作流JSON文件 (默认: {WORKFLOW_FILE})")
    parser.add_argument("--output", type=str, default=OUTPUT_DIR, help=f"输出目录 (默认: {OUTPUT_DIR})")
    args = parser.parse_args()
    
    # 1. 检查 ComfyUI
    print("🔍 检查 ComfyUI...")
    if not check_comfyui_running():
        print(f"❌ ComfyUI 未运行! 请先启动 ComfyUI")
        print(f"   确保 API 在 {COMFY_URL} 可用")
        sys.exit(1)
    print(f"✅ ComfyUI 运行中 (队列: {get_queue_size()} 个待处理)")
    
    # 2. 加载工作流
    print(f"\n🔍 加载工作流: {args.workflow}")
    workflow = load_workflow(args.workflow)
    if not workflow:
        sys.exit(1)
    
    prompt_node, negative_node, save_node = find_nodes(workflow)
    print(f"   找到: 正向提示词节点={prompt_node}, 负向提示词节点={negative_node}, 保存节点={save_node}")
    
    if not prompt_node or not save_node:
        print("❌ 工作流中缺少必要的 CLIPTextEncode 或 SaveImage 节点")
        sys.exit(1)
    
    # 3. 创建输出目录
    os.makedirs(args.output, exist_ok=True)
    
    # 4. 获取单词列表
    if args.word:
        word_list = [{"word": args.word, "type": "concrete"}]
    else:
        word_list = generate_word_prompts(level_filter=args.level)
    
    # 5. 生成图片
    generate_from_list(workflow, word_list, test_mode=args.test)
    
    print(f"\n📁 图片保存在: {os.path.abspath(args.output)}/")


if __name__ == "__main__":
    main()
