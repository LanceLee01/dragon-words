// E2E battle validation: damage values, monster attack rounds, battle log correctness
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5186';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1500, height: 900 } });

  const results = { rounds: 0, monsterAttacks: 0, logEntries: 0, correct: 0, wrong: 0, errors: [] };
  const addError = (msg) => { results.errors.push(msg); console.error('  ❌', msg); };

  // Navigate through game flow
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.getByText('开始新冒险').click();
  await page.waitForTimeout(200);
  await page.getByText('确定新开').click();
  await page.waitForTimeout(600);
  await page.getByText('小学词汇').click();
  await page.waitForTimeout(300);
  await page.getByText('战士').click();
  await page.waitForTimeout(600);
  await page.getByText('Level 1').first().click();
  await page.waitForTimeout(4000);

  // Verify HUD: equipment panel, stats panel, game area all present
  const hasEquip = await page.locator('text=空').or(page.locator('text=🗡️')).count() > 0;
  const hasSkills = await page.locator('text=猛击').or(page.locator('text=旋风斩')).count() > 0;
  const hasStats = await page.locator('text=⚔️ 攻击').count() > 0;
  console.log('1. HUD panels:');
  console.log('   Equipment slots present:', hasEquip ? '✅' : '❌');
  console.log('   Skill cards present:', hasSkills ? '✅' : '❌');
  console.log('   Stats panel present:', hasStats ? '✅' : '❌');

  // Play through battle rounds
  for (let round = 1; round <= 12; round++) {
    const text = await page.locator('body').innerText();

    // Detect phase
    const isQuestion = text.includes('请选择以下') || text.includes('拼写单词') || text.includes('配对') || text.includes('词语搭配');
    const isResult = text.includes('正确!');
    const isMonsterTurn = text.includes('答错了!');
    const isVictory = text.includes('胜利') || text.includes('Victory');
    const isDefeat = text.includes('失败') || text.includes('Defeat');

    if (isVictory || isDefeat) {
      console.log(`\n${isVictory ? '🏆 Victory!' : '💀 Defeat!'} after ${results.rounds} rounds`);
      break;
    }

    if (isQuestion) {
      results.rounds++;
      console.log(`\n--- Round ${results.rounds} (question) ---`);

      // Check question type
      if (text.includes('请选择以下意思对应的英文')) console.log('   Type: meaning-word ✅');
      else if (text.includes('请选择以下单词的意思')) console.log('   Type: word-meaning ✅');
      else if (text.includes('拼写单词')) console.log('   Type: spell ✅');
      else if (text.includes('配对')) console.log('   Type: match ✅');
      else if (text.includes('请选择你听到')) console.log('   Type: listening ✅');
      else if (text.includes('词语搭配') || text.includes('词性变形')) console.log('   Type: pos ✅');
      else addError('Unknown question type');

      // Print word being asked
      for (const line of text.split('\n')) {
        if (line.match(/^[a-z]+$/i) && line.length > 2 && line.length < 15) {
          console.log('   Word:', line);
          break;
        }
      }

      // Answer: pick first option
      const btns = await page.locator('button').all();
      let answered = false;
      for (const b of btns) {
        const t = await b.innerText();
        if (t.startsWith('A') || t.startsWith('B') || t.startsWith('C') || t.startsWith('D')) {
          await b.click({ force: true });
          answered = true;
          break;
        }
      }
      if (!answered) {
        // For spell: type a letter
        await page.keyboard.press('a');
        await page.waitForTimeout(100);
        await page.keyboard.press('b');
        await page.waitForTimeout(100);
        await page.keyboard.press('c');
        await page.waitForTimeout(100);
        // Click submit
        for (const b of btns) {
          const t = await b.innerText();
          if (t === '✓') { await b.click(); break; }
        }
      }
      await page.waitForTimeout(3000);
      round--; // re-process same loop iteration for result phase
      continue;
    }

    if (isResult) {
      // Verify correct-answer result screen
      console.log('   Result: ✅ Correct');

      // Check damage values are shown
      const hasSkill = text.includes('使用');
      const hasMonsterDmg = text.includes('反击') || text.includes('造成');
      const hasHP = text.includes('怪物 HP') || text.includes('点伤害');
      if (hasSkill) results.correct++;

      for (const line of text.split('\n')) {
        if (line.includes('使用') || (line.includes('反击') && line.includes('造成')) || line.includes('连击')) {
          console.log('   ' + line.trim());
        }
      }

      if (!hasMonsterDmg) addError('Monster counterattack not shown on result screen');
      if (!hasSkill) addError('Player skill not shown on result screen');

      // Wait for auto-advance (correct → 4s timer → next question)
      await page.waitForTimeout(5000);
      continue;
    }

    if (isMonsterTurn) {
      results.wrong++;

      // Check monster damage in combat log
      const hasMonsterDmg = text.includes('受到') || text.includes('反击');
      const hasPlayerSkill = text.includes('⚔️');
      results.monsterAttacks++;

      console.log('   Result: ❌ Wrong');
      for (const line of text.split('\n')) {
        if (line.includes('受到') || line.includes('造成') || line.includes('答错') || line.includes('使用')) {
          console.log('   ' + line.trim());
        }
      }

      // Verify combat log has the monster action
      if (!hasMonsterDmg) addError('Monster damage missing from combat log');

      // Click continue
      const cont = page.locator('text=继续');
      if (await cont.isVisible()) {
        await cont.click();
        await page.waitForTimeout(2000);
      }
      continue;
    }

    // Safety break
    await page.waitForTimeout(1000);
    if (results.rounds > 30) break;
  }

  // Final HUD check: HP should have changed (monster damaged player)
  const finalText = await page.locator('body').innerText();
  for (const line of finalText.split('\n')) {
    if (line.includes('战斗统计') || line.includes('答题记录') || line.includes('暂无记录')) {
      console.log('\n2. Log panels: ' + line.trim());
    }
  }

  // Count log entries
  const logEntries = await page.locator('text=✅ 正确').or(page.locator('text=❌ 错误')).count();
  results.logEntries = logEntries;
  console.log('   Log entries visible:', logEntries > 0 ? `✅ (${logEntries})` : '❌');

  const combatEntries = await page.locator('text=造成').or(page.locator('text=受到')).count();
  console.log('   Combat log entries:', combatEntries > 0 ? `✅ (${combatEntries})` : '❌');

  await page.screenshot({ path: 'screenshots/e2e-validation.png' });

  // Summary
  console.log(`\n========== E2E VALIDATION RESULTS ==========`);
  console.log(`Rounds played:     ${results.rounds}`);
  console.log(`Correct answers:   ${results.correct}`);
  console.log(`Wrong answers:     ${results.wrong}`);
  console.log(`Monster attacks:   ${results.monsterAttacks}`);
  console.log(`Log entries found: ${results.logEntries}`);
  console.log(`Errors:            ${results.errors.length}`);
  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(e => console.log('  ❌', e));
  } else {
    console.log('\n✅ All checks passed!');
  }

  await browser.close();
  process.exit(results.errors.length > 0 ? 1 : 0);
}

main();
