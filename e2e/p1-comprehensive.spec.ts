// ---------------------------------------------------------------------------
// P1 Comprehensive E2E Tests — UI rendering & functional verification
// ---------------------------------------------------------------------------
import { test, expect } from '@playwright/test';

/** Navigate to a page and seed localStorage with player data */
async function gotoAndSeed(page: any, path: string) {
  await page.goto(path);
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    localStorage.setItem('dw_player', JSON.stringify({
      classId: 'warrior', level: 5, xp: 120, gold: 999,
      maxHp: 100, hp: 100, attack: 5, defense: 3,
      equipment: [],
      equippedWeaponId: 'warrior-weapon-t2',
      equippedArmorId: null, equippedAccessoryId: null,
      completedLevels: ['1-1','1-2','1-3','1-4','1-5'],
      completedChapters: [1],
      wordLevel: 'primary',
      advancedClassId: null,
      mistakeWords: [],
      wordStats: {},
    }));
    localStorage.setItem('dw_progress', JSON.stringify({
      completedLevels: ['1-1','1-2','1-3','1-4','1-5'],
      completedChapters: [1],
    }));
    localStorage.setItem('dw_last_login', new Date().toISOString().slice(0, 10));
    localStorage.setItem('dw_login_streak', '3');
  });
  // Reload to pick up seeded data
  await page.reload();
  await page.waitForTimeout(2000);
}

test.describe('P1: Navigation & Page Structure', () => {
  test('HomePage renders', async ({ page }) => {
    await gotoAndSeed(page, '/');
    await expect(page.locator('body')).not.toContainText('Loading');
    const text = await page.locator('body').innerText();
    expect(text.length).toBeGreaterThan(0);
  });

  test('MapPage renders', async ({ page }) => {
    await gotoAndSeed(page, '/map');
    await expect(page.locator('body')).not.toContainText('Loading');
  });

  test('ShopPage renders', async ({ page }) => {
    await gotoAndSeed(page, '/shop');
    await expect(page.locator('body')).not.toContainText('Loading');
  });

  test('GalleryPage renders', async ({ page }) => {
    await gotoAndSeed(page, '/gallery');
    await expect(page.locator('body')).not.toContainText('Loading');
  });

  test('BattlePage renders', async ({ page }) => {
    await gotoAndSeed(page, '/battle/1/1');
    await expect(page.locator('body')).not.toContainText('Loading');
  });
});

test.describe('P1: Console Error Free (All Pages)', () => {
  test('No console.errors on any page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    for (const path of ['/', '/map', '/shop', '/gallery', '/battle/1/1', '/select-class']) {
      await gotoAndSeed(page, path);
    }

    const appErrors = errors.filter(e => !e.includes('favicon'));
    expect(appErrors).toEqual([]);
  });
});

test.describe('P1: Responsive Layout', () => {
  test('Mobile 375px — all pages load', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    for (const path of ['/', '/map', '/shop', '/gallery']) {
      await gotoAndSeed(page, path);
    }
    expect(errors.length).toBe(0);
  });

  test('Desktop 1280px — all pages load', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    for (const path of ['/', '/map', '/shop', '/gallery']) {
      await gotoAndSeed(page, path);
    }
    expect(errors.length).toBe(0);
  });
});

test.describe('P1: Repeated Load Stability', () => {
  test('Navigate round-trip 2x without errors', async ({ page }) => {
    test.setTimeout(45000);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    for (let i = 0; i < 2; i++) {
      await gotoAndSeed(page, '/');
      await gotoAndSeed(page, '/map');
      await gotoAndSeed(page, '/shop');
    }

    expect(errors.length).toBe(0);
  });
});
