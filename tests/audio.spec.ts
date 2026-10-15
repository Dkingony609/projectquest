import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 960, height: 720 } });

test("plays the original soundtrack after a gesture, meters real output, and persists volume and mute", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Accessibility & settings" }).click();
  const root = page.locator(".game-root");
  await expect(root).toHaveAttribute("data-audio-state", "running");
  await expect(root).toHaveAttribute("data-audio-loaded", "true", {
    timeout: 30_000,
  });
  await expect(root).toHaveAttribute("data-audio-playing", "true");
  await expect
    .poll(async () => Number(await root.getAttribute("data-audio-level")))
    .toBeGreaterThan(0.0001);
  await page.getByRole("slider", { name: "Music volume", exact: true }).focus();
  await page.keyboard.press("Home");
  await expect(
    page.getByRole("slider", { name: "Music volume", exact: true }),
  ).toHaveValue("0");
  await expect(root).toHaveAttribute("data-audio-playing", "false");
  await expect
    .poll(async () => Number(await root.getAttribute("data-audio-level")))
    .toBeLessThan(0.00001);
  await page.keyboard.press("End");
  await expect(root).toHaveAttribute("data-audio-playing", "true");
  await page
    .getByRole("checkbox", { name: "Mute all audio", exact: true })
    .check();
  await expect(root).toHaveAttribute("data-audio-playing", "false");
  await expect
    .poll(async () => Number(await root.getAttribute("data-audio-level")))
    .toBeLessThan(0.00001);
  await page.reload();
  await page.getByRole("button", { name: "Accessibility & settings" }).click();
  await expect(
    page.getByRole("checkbox", { name: "Mute all audio", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("slider", { name: "Music volume", exact: true }),
  ).toHaveValue("1");
  const loaded = await page.evaluate(async () => {
    const ui = await document.fonts.load("600 16px Manrope");
    const display = await document.fonts.load(
      'italic 400 32px "DM Serif Display"',
    );
    return {
      ui: ui.length,
      display: display.length,
      body: getComputedStyle(document.body).fontFamily,
    };
  });
  expect(loaded.ui).toBeGreaterThan(0);
  expect(loaded.display).toBeGreaterThan(0);
  expect(loaded.body).toContain("Manrope");
  expect(errors).toEqual([]);
});

test("keeps settings and the menu usable when audio is unsupported", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "AudioContext", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(window, "webkitAudioContext", {
      value: undefined,
      configurable: true,
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Accessibility & settings" }).click();
  await expect(
    page.getByText("This browser does not support game audio.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Start your career", exact: true }),
  ).toBeVisible();
});
