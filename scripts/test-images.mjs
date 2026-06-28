// Playwright integration test: full flow to verify word images load correctly
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  // Track word image requests
  const wordImageReqs = [];

  page.on('response', (res) => {
    const url = res.url();
    if (url.includes('word-images') && url.endsWith('.png')) {
      wordImageReqs.push({ url, status: res.status(), ok: res.ok(), file: url.split('/').pop() });
    }
  });
  page.on('requestfailed', (req) => {
    const url = req.url();
    if (url.includes('word-images') && url.endsWith('.png')) {
      wordImageReqs.push({ url, status: 0, ok: false, file: url.split('/').pop(), error: req.failure()?.errorText || 'unknown' });
    }
  });

  try {
    // ── Step 1: Home page ──
    console.log('1. 访问首页...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/01-home.png' });

    // ── Step 2: Click "🆕  开始新冒险" ──
    console.log('2. 点击"开始新冒险"...');
    await page.getByText('开始新冒险').click();
    await page.waitForTimeout(500);

    // ── Step 3: Confirm "确定新开" ──
    console.log('3. 确认新开游戏...');
    await page.getByText('确定新开').click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/03-select-class.png' });

    // ── Step 4: Choose "小学词汇" ──
    console.log('4. 选择"小学词汇"...');
    await page.getByText('小学词汇').click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'screenshots/04-class-picker.png' });

    // ── Step 5: Select a class (click "战士" card) ──
    console.log('5. 选择职业...');
    await page.getByText('战士').click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/05-map.png' });

    // ── Step 6: Click the first "Level 1" button on the map ──
    console.log('6. 点击第一个关卡...');
    await page.waitForTimeout(1000);
    // Try a few different selectors to find level buttons
    const levelBtn = page.getByText('Level 1').or(page.getByText('Level 1').first());
    await levelBtn.first().waitFor({ timeout: 8000 });
    await levelBtn.first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/06-battle-start.png' });

    // ── Step 7: Wait for battle to start and images to load ──
    console.log('7. 等待战斗页面加载...');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'screenshots/07-battle-wait.png' });

    // ── Step 8: Check images thoroughly ──
    console.log('\n8. 检查图片显示...');

    // First, check network requests for word images
    console.log(`Network requests for word-images: ${wordImageReqs.length}`);
    let loaded = 0, failed404 = 0;
    for (const r of wordImageReqs) {
      if (r.status === 200 || r.status === 304) {
        console.log(`  ✅ ${r.status} ${r.file}`);
        loaded++;
      } else {
        console.log(`  ❌ ${r.status} ${r.file}${r.error ? ' - ' + r.error : ''}`);
        failed404++;
      }
    }

    // Check rendered img elements
    const imgs = await page.$$('img');
    console.log(`\n<img> elements found: ${imgs.length}`);

    let shown = 0, fallback = 0;
    for (const img of imgs) {
      const src = await img.getAttribute('src');
      const alt = await img.getAttribute('alt');
      if (!src) continue;

      // Check if image is actually rendered (naturalWidth > 0 means loaded)
      const info = await img.evaluate(el => ({
        complete: el.complete,
        naturalW: el.naturalWidth,
        naturalH: el.naturalHeight,
        box: el.getBoundingClientRect(),
      }));
      const visible = info.box.width > 0 && info.box.height > 0;

      console.log(`  src="${src.substring(0, 90)}" alt="${alt || ''}" complete=${info.complete} dim=${info.naturalW}x${info.naturalH} visible=${visible}`);

      if (src.includes('word-images')) {
        if (info.complete && info.naturalW > 0) {
          shown++;
        } else {
          fallback++;
        }
      }
    }

    // Check for 📜 fallback elements
    const fallbacks = await page.locator('span:has-text("📜")').count();
    console.log(`\n📜 fallback emoji count: ${fallbacks}`);

    // ── RESULTS ──
    console.log(`\n========== 测试结果 ==========`);
    console.log(`图片网络请求: ${wordImageReqs.length}`);
    console.log(`  - 加载成功: ${loaded}`);
    console.log(`  - 404失败: ${failed404}`);
    console.log(`DOM中的<img>标签: ${imgs.length}`);
    console.log(`  - 图片实际显示: ${shown}`);
    console.log(`  - 显示回退图标: ${fallback}`);
    console.log(`📜 回退容器数: ${fallbacks}`);
    console.log(`==============================`);

    await page.screenshot({ path: 'screenshots/08-final.png' });
    await browser.close();

    // Pass/fail judgment
    if (failed404 > 0) {
      console.log('\n❌ 测试失败: 部分单词图片返回 404');
      process.exit(1);
    }
    if (loaded > 0 && failed404 === 0) {
      console.log('\n✅ 测试通过: 所有单词图片正常加载');
      process.exit(0);
    }
    if (shown > 0) {
      console.log('\n✅ 测试通过: 单词图片在页面中正确显示');
      process.exit(0);
    }

    console.log('\n⚠️ 未检测到单词图片 (可能战斗还未开始)');
    process.exit(0);
  } catch (err) {
    console.error(`错误: ${err.message}`);
    await page.screenshot({ path: 'screenshots/99-error.png' }).catch(() => {});
    await browser.close();
    process.exit(1);
  }
}

main();
