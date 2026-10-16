import { expect, test, type Locator, type Page } from "@playwright/test";

test.use({ viewport: { width: 960, height: 720 } });

async function startCharacter(page: Page, name: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "Start your career", exact: true }).click();
  await page.getByLabel("What should your team call you?").fill(name);
}

async function enterWorkplace(page: Page) {
  await page.getByRole("button", { name: "Choose your industry" }).click();
  await page.getByRole("button", { name: "Enter the workplace" }).click();
}

async function readyWorld(page: Page) {
  await expect(page.locator(".pq-world")).toHaveAttribute("data-world-ready", "true", { timeout: 45_000 });
  await expect(page.locator(".pq-world")).toHaveAttribute("data-character-status", "ready");
  const canvas = page.getByTestId("world-canvas");
  await expect(canvas).toBeVisible();
  return canvas;
}

async function numericAttribute(element: Locator, attribute: string) {
  return Number(await element.getAttribute(attribute));
}

/** Release in the render loop, avoiding key overshoot on slower software GPUs. */
async function walkUntil(page: Page, key: string, destination: { zBelow?: number; xBelow?: number; nearby?: string }) {
  const stopped = page.evaluate(({ key, destination }) => new Promise<void>((resolve, reject) => {
    const started = performance.now();
    function frame() {
      const canvas = document.querySelector<HTMLCanvasElement>('[data-testid="world-canvas"]');
      const reached = canvas && (
        destination.nearby ? canvas.dataset.nearbyId === destination.nearby
          : destination.zBelow !== undefined ? Number(canvas.dataset.playerZ) < destination.zBelow
            : Number(canvas.dataset.playerX) < destination.xBelow!
      );
      if (reached) {
        window.dispatchEvent(new KeyboardEvent("keyup", { key }));
        resolve();
      } else if (performance.now() - started > 45_000) {
        window.dispatchEvent(new KeyboardEvent("keyup", { key }));
        reject(new Error(`Walking ${key} did not reach ${JSON.stringify(destination)}`));
      } else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }), { key, destination });
  await page.keyboard.down(key);
  await stopped;
  await page.keyboard.up(key);
}

test("customises a real rigged 3D human and retains the body and materials after reload", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await startCharacter(page, "Ada");
  const preview = page.getByTestId("character-preview");
  await expect(preview).toHaveAttribute("data-status", "ready", { timeout: 45_000 });
  await expect(preview.locator("canvas")).toBeVisible();
  await expect(preview.locator("img, svg, video")).toHaveCount(0);
  expect(await numericAttribute(preview, "data-skinned-meshes")).toBeGreaterThan(0);
  expect(await numericAttribute(preview, "data-bones")).toBeGreaterThanOrEqual(20);
  await page.getByLabel("Body type", { exact: true }).selectOption("female");
  await page.getByRole("button", { name: "Skin tone 4", exact: true }).click();
  await page.getByRole("button", { name: "Workwear 3", exact: true }).click();
  await page.getByRole("button", { name: "Hair colour 2", exact: true }).click();
  await expect(preview).toHaveAttribute("data-body", "female");
  const idleTime = await numericAttribute(preview, "data-mixer-time");
  await expect.poll(() => numericAttribute(preview, "data-mixer-time")).toBeGreaterThan(idleTime);
  await page.getByRole("button", { name: "Face", exact: true }).click();
  await expect(preview).toHaveAttribute("data-view", "face");
  await preview.screenshot({ path: testInfo.outputPath("female-face.png") });
  await page.getByRole("button", { name: "Hands", exact: true }).click();
  await expect(preview).toHaveAttribute("data-view", "hands");
  await preview.screenshot({ path: testInfo.outputPath("female-hands.png") });
  await page.getByRole("button", { name: "Full body", exact: true }).click();
  await page.getByRole("button", { name: "Rotate character right", exact: true }).click();
  await preview.screenshot({ path: testInfo.outputPath("female-full-body.png") });
  await enterWorkplace(page);
  const canvas = await readyWorld(page);
  await expect(canvas).toHaveAttribute("data-player-body", "female");
  await expect(canvas).toHaveAttribute("data-player-skin", "#764b38");
  await expect(canvas).toHaveAttribute("data-player-shirt", "#485f9a");
  await expect(canvas).toHaveAttribute("data-player-hair", "#654130");
  const appearance = await page.evaluate(() => JSON.parse(localStorage.getItem("projectquest.save.v1")!).snapshot.profile.appearance);
  expect(appearance).toEqual({ body: "female", skin: "#764b38", shirt: "#485f9a", hair: "#654130" });
  await page.reload();
  await page.getByRole("button", { name: "Continue as Ada", exact: true }).click();
  const reloadedCanvas = await readyWorld(page);
  await expect(reloadedCanvas).toHaveAttribute("data-player-body", "female");
  await expect(reloadedCanvas).toHaveAttribute("data-player-skin", "#764b38");
  await expect(reloadedCanvas).toHaveAttribute("data-player-shirt", "#485f9a");
  await expect(reloadedCanvas).toHaveAttribute("data-player-hair", "#654130");
  expect(errors).toEqual([]);
});

test("renders five independently rigged humans with blended walking, idle and working NPC interactions", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await startCharacter(page, "Samir");
  await enterWorkplace(page);
  const canvas = await readyWorld(page);
  await expect(canvas).toHaveAttribute("data-human-count", "5");
  await expect(canvas).toHaveAttribute("data-independent-skeletons", "true");
  await expect(canvas).toHaveAttribute("data-player-body", "male");
  expect(await numericAttribute(canvas, "data-skinned-mesh-count")).toBeGreaterThanOrEqual(5);
  expect(await numericAttribute(canvas, "data-player-bone-count")).toBeGreaterThanOrEqual(20);
  // Genuine weighted human meshes have substantial authored topology, with a
  // conservative combined budget rather than unbounded scan geometry.
  expect(await numericAttribute(canvas, "data-character-triangles")).toBeGreaterThan(20_000);
  expect(await numericAttribute(canvas, "data-character-triangles")).toBeLessThan(600_000);
  await expect(canvas).toHaveAttribute("data-player-animation", "Idle");
  const startZ = await numericAttribute(canvas, "data-player-z");
  const mixerTime = await numericAttribute(canvas, "data-player-mixer-time");
  await canvas.focus();
  const walking = page.evaluate(({ startZ, mixerTime }) => new Promise<{ speed: number; weight: number; animation: string; mixerTime: number; z: number }>((resolve, reject) => {
    const started = performance.now();
    function frame() {
      const canvas = document.querySelector<HTMLCanvasElement>('[data-testid="world-canvas"]')!;
      const result = { speed: Number(canvas.dataset.playerSpeed), weight: Number(canvas.dataset.playerWalkWeight), animation: canvas.dataset.playerAnimation!, mixerTime: Number(canvas.dataset.playerMixerTime), z: Number(canvas.dataset.playerZ) };
      if (result.animation === "Walk" && result.weight > 0.5 && result.mixerTime > mixerTime && result.z < startZ - 0.3) {
        window.dispatchEvent(new KeyboardEvent("keyup", { key: "w" }));
        resolve(result);
      } else if (performance.now() - started > 20_000) {
        window.dispatchEvent(new KeyboardEvent("keyup", { key: "w" }));
        reject(new Error(`Walking did not blend and advance: ${JSON.stringify(result)}`));
      } else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }), { startZ, mixerTime });
  await page.keyboard.down("w");
  const walkFrame = await walking;
  expect(walkFrame.animation).toBe("Walk");
  expect(walkFrame.weight).toBeGreaterThan(0.5);
  expect(walkFrame.mixerTime).toBeGreaterThan(mixerTime);
  expect(walkFrame.speed).toBeGreaterThan(0);
  expect(walkFrame.z).toBeLessThan(startZ - 0.3);
  await page.keyboard.up("w");
  await expect(canvas).toHaveAttribute("data-player-animation", "Idle");
  await expect.poll(() => numericAttribute(canvas, "data-player-walk-weight")).toBeLessThan(0.05);
  await expect(canvas).toHaveAttribute("data-player-speed", "0.000");

  // A held direction at a collision boundary must settle to idle instead of
  // walking on the spot merely because a movement key is still down.
  await page.keyboard.down("s");
  await expect(canvas).toHaveAttribute("data-player-animation", "Walk");
  await expect.poll(() => numericAttribute(canvas, "data-player-z"), { timeout: 30_000 }).toBeGreaterThan(5.9);
  await expect(canvas).toHaveAttribute("data-player-animation", "Idle");
  await expect(canvas).toHaveAttribute("data-player-speed", "0.000");
  expect(await numericAttribute(canvas, "data-player-z")).toBeLessThanOrEqual(6.1);
  await page.keyboard.up("s");

  // Walk through the same doorway used in the foundation regression test;
  // the visual skeleton cannot change collision or interaction coordinates.
  await walkUntil(page, "w", { zBelow: 4 });
  await walkUntil(page, "a", { xBelow: -5.05 });
  await walkUntil(page, "w", { nearby: "mentor" });
  await page.keyboard.press("e");
  await expect(page.getByRole("heading", { name: "Your first day starts here." })).toBeVisible();
  await page.getByRole("button", { name: "Accept the assignment" }).click();
  await page.getByRole("button", { name: "Close panel", exact: true }).click();

  const yaw = await numericAttribute(canvas, "data-camera-orbit");
  const distance = await numericAttribute(canvas, "data-camera-distance");
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.6);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.72, box.y + box.height * 0.68, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => numericAttribute(canvas, "data-camera-orbit")).not.toBe(yaw);
  await page.mouse.wheel(0, -900);
  await expect.poll(() => numericAttribute(canvas, "data-camera-distance")).toBeLessThan(distance);
  await canvas.screenshot({ path: testInfo.outputPath("humans-in-workplace.png") });
  expect(errors).toEqual([]);
});

test("reports unavailable human assets without blocky substitutes and retries the actual 3D workplace", async ({ page }) => {
  await page.route("**/models/humans/*.glb", (route) => route.abort("failed"));
  await startCharacter(page, "Jordan");
  const preview = page.getByTestId("character-preview");
  await expect(preview).toHaveAttribute("data-status", "error");
  await expect(page.getByRole("button", { name: "Try preview again", exact: true })).toBeVisible();
  await enterWorkplace(page);
  const world = page.locator(".pq-world");
  await expect(world).toHaveAttribute("data-world-ready", "false");
  await expect(world).toHaveAttribute("data-character-status", "error");
  await expect(page.getByTestId("world-canvas")).toHaveCount(0);
  const accessible = page.getByRole("region", { name: "Accessible workplace", exact: true });
  await expect(accessible).toBeVisible();
  await accessible.getByRole("button", { name: /Alex Chen/ }).click();
  await expect(page.getByRole("heading", { name: "Your first day starts here." })).toBeVisible();
  await page.getByRole("button", { name: "Accept the assignment" }).click();
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await page.unroute("**/models/humans/*.glb");
  await page.getByRole("button", { name: "Retry 3D workplace", exact: true }).click();
  const canvas = await readyWorld(page);
  await expect(canvas).toHaveAttribute("data-human-count", "5");
  expect(await numericAttribute(canvas, "data-skinned-mesh-count")).toBeGreaterThanOrEqual(5);
  await expect(accessible).toHaveCount(0);
  await page.keyboard.press("j");
  await expect(page.getByRole("heading", { name: "Mission journal", exact: true })).toBeVisible();
  const phase = await page.evaluate(() => JSON.parse(localStorage.getItem("projectquest.save.v1")!).snapshot.phase);
  expect(phase).toBe("investigating");
});
