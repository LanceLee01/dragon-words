# Dragon Words — 本地 ComfyUI 生图流程

## 准备工作

### 1. 安装 ComfyUI
如果还没装，推荐用一键包安装：
- 下载 ComfyUI (https://github.com/comfyanonymous/ComfyUI)
- 安装后启动，确保 `http://127.0.0.1:8188` 可访问

### 2. 下载模型
在 ComfyUI 的 `models/checkpoints/` 目录下放 SDXL 模型：
- **推荐:** Juggernaut XL Ragnarok (CivitAI)
- 或 DreamShaper XL / AlbedoBase XL (HuggingFace)

### 3. 搭建工作流
在 ComfyUI 中搭一个基础的 txt2img 工作流：
```
LoadCheckpoint → CLIPTextEncode(Positive) → KSampler → VAEDecode → SaveImage
              → CLIPTextEncode(Negative) ↗
```
- 分辨率: 512×512 (或 768×768)
- Sampler: DPM++ 2M Karras
- Steps: 25-30
- CFG: 5-7

### 4. 导出工作流
设置 → 开启 Dev Mode → Save (API Format) → 保存为 `scripts/dnd_workflow_api.json`

---

## 使用脚本

### 测试模式 (生成前3张)
```bash
cd scripts
python batch_generate.py --test
```

### 生成单个单词
```bash
python batch_generate.py --word courage
```

### 批量生成全部
```bash
python batch_generate.py
```

---

## 后处理

生成完成后，用以下脚本转 256×256 WebP：

```bash
# 安装 imageio 和 Pillow
pip install Pillow imageio

# 转换脚本
python -c "
import os, sys
from PIL import Image

input_dir = 'output_images'
output_dir = '../src/assets/images/word-images'
os.makedirs(output_dir, exist_ok=True)

for fname in os.listdir(input_dir):
    if fname.endswith('.png'):
        img = Image.open(f'{input_dir}/{fname}')
        img = img.resize((256, 256), Image.LANCZOS)
        webp_name = fname.replace('.png', '.webp')
        img.save(f'{output_dir}/{webp_name}', 'WEBP', quality=85)
        print(f'  Converted: {fname} → {webp_name}')
"
```

## 注意事项
- 1600 张 ≈ 2 小时 (RTX 3060)，建议过夜跑
- 如果中途中断，已完成的图片不会丢失，脚本跳过已存在的文件
- 不同单词可能需要调整 prompt 风格（实物/抽象/动作）
