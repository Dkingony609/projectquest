import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 960, height: 640 } });

test('launches a real 3D workplace and moves the character', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'A career worth playing.' })).toBeVisible();
  await page.getByRole('button', { name: 'Explore the workplace' }).click();
  await expect(page.getByTestId('world-canvas')).toBeVisible();
  await expect(page.getByText('WORKPLACE CONNECTED')).toBeVisible();
  const position = page.locator('.world-status small');
  await expect(position).toBeVisible();
  const before = await position.textContent();
  await page.keyboard.down('w');
  await page.waitForTimeout(600);
  await page.keyboard.up('w');
  await expect.poll(() => position.textContent()).not.toBe(before);
  const canvas = page.getByTestId('world-canvas');
  await canvas.focus();
  const stopWest = page.evaluate(() => new Promise<void>((resolve, reject) => {
    const started = performance.now();
    function frame() {
      const world = document.querySelector<HTMLCanvasElement>('[data-testid="world-canvas"]');
      if (world && Number(world.dataset.playerX) < -5.05) {
        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' })); resolve(); return;
      }
      if (performance.now() - started > 45_000) { reject(new Error('West movement did not reach its destination')); return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }));
  await page.keyboard.down('a');
  await stopWest;
  await page.keyboard.up('a');
  const stopNorth = page.evaluate(() => new Promise<void>((resolve, reject) => {
    const started = performance.now();
    function frame() {
      const world = document.querySelector<HTMLCanvasElement>('[data-testid="world-canvas"]');
      if (world?.dataset.nearbyId === 'mentor') {
        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' })); resolve(); return;
      }
      if (performance.now() - started > 45_000) { reject(new Error('North movement did not reach the mentor')); return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }));
  await page.keyboard.down('w');
  await stopNorth;
  await page.keyboard.up('w');
  await page.keyboard.press('e');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'mentor', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Return to workplace' }).click();
  await canvas.screenshot({ path: 'test-results/foundation-world.png' });
  await page.getByRole('button', { name: 'Main menu' }).click();
  await expect(page.getByRole('button', { name: 'Explore the workplace' })).toBeVisible();
  expect(errors).toEqual([]);
});
