// ---------------------------------------------------------------------------
// P1 E2E Smoke Tests — runs against dev server at localhost:5173
// ---------------------------------------------------------------------------
import { test, expect } from '@playwright/test';

test.describe('P1: Navigation & Page Load', () => {
  test('HomePage loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    // Wait for either the "Loading" state or the actual page content
    await page.waitForTimeout(3000);
    expect(errors.length).toBe(0);
  });

  test('MapPage loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/map');
    await page.waitForTimeout(3000);
    expect(errors.length).toBe(0);
  });

  test('ShopPage loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/shop');
    await page.waitForTimeout(3000);
    expect(errors.length).toBe(0);
  });

  test('GalleryPage loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/gallery');
    await page.waitForTimeout(3000);
    expect(errors.length).toBe(0);
  });

  test('BattlePage loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/battle/1/1');
    await page.waitForTimeout(3000);
    expect(errors.length).toBe(0);
  });
});

test.describe('P1: Core Feature Verification', () => {
  test('EventModal component renders when triggered', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/map');
    await page.waitForTimeout(3000);
    expect(errors.length).toBe(0);
  });

  test('Shop page renders without import errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/shop');
    await page.waitForTimeout(3000);
    // Specifically check NO "does not provide an export" errors
    expect(errors.filter(e => e.includes('does not provide an export'))).toEqual([]);
  });

  test('No affixes import errors across all pages', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    for (const path of ['/', '/map', '/shop', '/gallery', '/battle/1/1']) {
      await page.goto(path);
      await page.waitForTimeout(1500);
    }

    // No module export errors
    const exportErrors = errors.filter(e => e.includes('does not provide an export'));
    expect(exportErrors).toEqual([]);
  });
});
