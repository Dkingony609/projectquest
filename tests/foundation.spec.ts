import { expect, test, type Page } from "@playwright/test";

test.use({ viewport: { width: 960, height: 720 } });

/** Release in the render loop so software-rendering latency cannot overshoot a doorway. */
async function walkUntil(
  page: Page,
  key: string,
  destination: {
    axis?: "playerX" | "playerZ";
    below?: number;
    nearby?: string;
  },
) {
  const stopped = page.evaluate(
    ({ key, destination }) =>
      new Promise<void>((resolve, reject) => {
        const started = performance.now();
        function frame() {
          const canvas = document.querySelector<HTMLCanvasElement>(
            '[data-testid="world-canvas"]',
          );
          const arrived =
            canvas &&
            (destination.nearby
              ? canvas.dataset.nearbyId === destination.nearby
              : Number(canvas.dataset[destination.axis!]) < destination.below!);
          if (arrived) {
            window.dispatchEvent(new KeyboardEvent("keyup", { key }));
            resolve();
          } else if (performance.now() - started > 45_000) {
            window.dispatchEvent(new KeyboardEvent("keyup", { key }));
            reject(
              new Error(
                `Walking ${key} did not reach ${JSON.stringify(destination)}`,
              ),
            );
          } else requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      }),
    { key, destination },
  );
  await page.keyboard.down(key);
  await stopped;
  await page.keyboard.up(key);
}

test("creates a character, enters the 3D workplace and walks to meet the mentor", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A career worth playing." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start your career" }).click();
  await page.getByLabel("What should your team call you?").fill("Amina");
  await page.getByRole("button", { name: "Skin tone 4", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Skin tone 4", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Choose your industry" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Construction & Infrastructure",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("This placement is not playable in the current slice."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Enter the workplace" }).click();
  const canvas = page.getByTestId("world-canvas");
  await expect(canvas).toBeVisible();
  await expect(page.locator(".pq-world")).toHaveAttribute(
    "data-world-ready",
    "true",
    { timeout: 30_000 },
  );
  const startZ = Number(await canvas.getAttribute("data-player-z"));
  await canvas.focus();
  await walkUntil(page, "w", { axis: "playerZ", below: 4 });
  expect(Number(await canvas.getAttribute("data-player-z"))).toBeLessThan(
    startZ,
  );
  await walkUntil(page, "a", { axis: "playerX", below: -5.05 });
  await walkUntil(page, "w", { nearby: "mentor" });
  await page.keyboard.press("e");
  const mentor = page.getByRole("dialog");
  await expect(
    mentor.getByRole("heading", { name: "Your first day starts here." }),
  ).toBeVisible();
  await expect(mentor.getByText("Alex Chen", { exact: true })).toBeVisible();
  await mentor.getByRole("button", { name: "Accept the assignment" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Assignment received." }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Main menu", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Continue as Amina" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
