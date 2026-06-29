import { test } from '@playwright/test';

test('Screenshot: elite wolf battle', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    localStorage.setItem('dw_player', JSON.stringify({
      classId: 'warrior', level: 5, xp: 120, gold: 999,
      maxHp: 100, hp: 100, attack: 5, defense: 3, equipment: [],
      equippedWeaponId: 'warrior-weapon-t2',
      equippedArmorId: null, equippedAccessoryId: null,
      completedLevels: [], completedChapters: [],
      wordLevel: 'primary', advancedClassId: null,
      mistakeWords: [], wordStats: {},
    }));
    localStorage.setItem('dw_progress', JSON.stringify({ completedLevels: [], completedChapters: [] }));
    localStorage.setItem('dw_last_login', new Date().toISOString().slice(0, 10));
    localStorage.setItem('dw_login_streak', '5');
  });
  await page.reload();
  await page.waitForTimeout(1000);
  await page.goto('/battle/1/1?monster=wolf_elite');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'e2e/screenshots/elite-wolf-battle.png', fullPage: true });
});
