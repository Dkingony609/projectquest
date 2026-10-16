import { readFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import type { GameState } from "../src/game/types";

const legacySave = readFileSync(
  new URL("./fixtures/day1-v1-completed.json", import.meta.url),
  "utf8",
);

async function snapshot(page: Page): Promise<GameState> {
  return page.evaluate(
    () => JSON.parse(localStorage.getItem("projectquest.save.v1")!).snapshot,
  );
}

async function closePanel(page: Page) {
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

async function visit(page: Page, route: string, targetId: string) {
  await page
    .getByRole("button", { name: "Accessible navigation", exact: true })
    .click();
  await page
    .getByRole("button", { name: `Go to ${route}`, exact: false })
    .click();
  const canvas = page.getByTestId("world-canvas");
  await expect(canvas).toHaveAttribute("data-nearby-id", targetId, {
    timeout: 30_000,
  });
  await canvas.focus();
  await page.keyboard.press("e");
  await expect(page.getByRole("dialog")).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page, dialog: Locator) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  expect(
    await dialog.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return (
        bounds.left >= -1 &&
        bounds.right <= window.innerWidth + 1 &&
        element.scrollWidth <= element.clientWidth + 1 &&
        Array.from(element.querySelectorAll(".pq-dialog-content")).every(
          (content) => content.scrollWidth <= content.clientWidth + 1,
        )
      );
    }),
  ).toBe(true);
}

async function expectHandwritingLoaded(book: Locator, largeText = false) {
  const typography = await book.getByTestId("journal-body").evaluate(async (body) => {
    await Promise.all([
      document.fonts.load("400 18px Kalam"),
      document.fonts.load("700 22px Kalam"),
    ]);
    await document.fonts.ready;
    const style = getComputedStyle(body);
    return {
      family: style.fontFamily,
      size: Number.parseFloat(style.fontSize),
      loadedWeights: Array.from(document.fonts)
        .filter(
          (face) => face.family.replace(/["']/g, "") === "Kalam" && face.status === "loaded",
        )
        .map((face) => face.weight),
    };
  });
  expect(typography.family).toContain("Kalam");
  expect(typography.loadedWeights).toEqual(expect.arrayContaining(["400", "700"]));
  expect(typography.size).toBeGreaterThanOrEqual(largeText ? 21 : 18);
}

async function expectActivityEntry(book: Locator, summary: string) {
  await book.getByRole("button", { name: "Activity", exact: true }).click();
  const record = book.getByText(summary, { exact: true });
  const next = book.getByRole("button", { name: "Next spread" });
  while ((await record.count()) === 0 && (await next.isEnabled())) {
    await next.click();
  }
  await expect(record).toBeVisible();
}

test("uses the project tablet as working hardware and turns handwritten journal spreads without changing evidence", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Start your career" }).click();
  await page.getByLabel("What should your team call you?").fill("Nia");
  await page.getByRole("button", { name: "Choose your industry" }).click();
  await page.getByRole("button", { name: "Enter the workplace" }).click();
  await expect(page.locator(".pq-world")).toHaveAttribute(
    "data-world-ready",
    "true",
    { timeout: 30_000 },
  );
  await visit(page, "Alex · Mentor", "mentor");
  await page.getByRole("button", { name: "Accept the assignment" }).click();
  await closePanel(page);
  const canvas = page.getByTestId("world-canvas");
  await canvas.focus();
  await page.keyboard.press("t");
  const tablet = page.getByRole("dialog");
  await expect(tablet).toHaveAttribute("data-presentation", "tablet");
  await expect(page.locator(".pq-tablet-hardware")).toBeVisible();
  const tasks = tablet.getByRole("tab", { name: "Tasks", exact: true });
  await tasks.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    tablet.getByRole("tab", { name: "Schedule", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await tablet.getByRole("button", { name: "Inspect schedule" }).click();
  await expect(
    tablet.getByRole("heading", {
      name: "Source record · Foundation delivery schedule",
      exact: true,
    }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page, tablet);
  await tablet.screenshot({ path: testInfo.outputPath("project-tablet.png") });
  await tablet.getByRole("button", { name: "Put tablet away" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(canvas).toBeFocused();

  const inspected = await snapshot(page);
  expect(inspected.evidence).toEqual(["schedule"]);
  await page.keyboard.press("j");
  const journal = page.getByRole("dialog");
  await expect(journal).toHaveAttribute("data-presentation", "journal");
  const book = journal.getByTestId("mission-journal");
  await expectHandwritingLoaded(book);
  await expect(book.locator(".pq-journal-objective")).toHaveCount(9);
  await expect(
    book.locator('.pq-journal-objective[data-complete="true"]'),
  ).toHaveCount(2);
  await expect(
    book.getByRole("button", { name: "Previous spread" }),
  ).toBeDisabled();
  const firstPages = await book.getByTestId("journal-page-indicator").innerText();
  await book.getByRole("button", { name: "Next spread" }).click();
  await expect(book.getByTestId("journal-page-indicator")).not.toHaveText(
    firstPages,
  );
  await book.getByRole("button", { name: "Previous spread" }).click();
  await expect(book.getByTestId("journal-page-indicator")).toHaveText(firstPages);
  await journal.screenshot({ path: testInfo.outputPath("mission-journal.png") });
  await book.getByRole("button", { name: "Evidence", exact: true }).click();
  await expect(
    book.getByRole("heading", {
      name: "Source record · Foundation delivery schedule",
      exact: true,
    }),
  ).toBeVisible();
  await expectActivityEntry(book, inspected.events.at(-1)!.summary);
  await expectNoHorizontalOverflow(page, journal);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(canvas).toBeFocused();
  const afterReading = await snapshot(page);
  expect(afterReading.evidence).toEqual(inspected.evidence);
  expect(afterReading.journal).toEqual(inspected.journal);
  expect(afterReading.events).toEqual(inspected.events);
  expect(errors).toEqual([]);
});

test("keeps the Day 2 tablet editable and the book readable at 390px with high contrast and larger text", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((save) => {
    if (!localStorage.getItem("projectquest.save.v1")) {
      localStorage.setItem("projectquest.save.v1", save);
    }
  }, legacySave);
  await page.goto("/");
  await page.getByRole("button", { name: "Continue as Ari", exact: true }).click();
  await page.getByRole("button", { name: "Continue to Day 2" }).click();
  await expect(page.locator(".pq-world")).toHaveAttribute(
    "data-world-ready",
    "true",
    { timeout: 30_000 },
  );
  await page.getByRole("button", { name: "Open settings", exact: true }).click();
  await page.getByRole("checkbox", { name: "High contrast" }).check();
  await page.getByRole("checkbox", { name: "Larger text" }).check();
  await closePanel(page);
  await expect(page.locator(".game-root")).toHaveClass(/high-contrast/);
  await expect(page.locator(".game-root")).toHaveClass(/large-text/);
  await visit(page, "Alex · Mentor", "mentor");
  await page
    .getByRole("button", { name: "Accept the scheduling assignment" })
    .click();
  await closePanel(page);
  await page.getByRole("button", { name: "Project tablet" }).click();
  await page.getByRole("button", { name: "Inspect dependency schedule" }).click();
  await closePanel(page);
  await visit(page, "Sam · Delivery lead", "lead");
  await page
    .getByRole("button", {
      name: "Ask about survey duration and both successor teams",
      exact: true,
    })
    .click();
  await closePanel(page);
  await visit(page, "Taylor · Safety", "safety");
  await page
    .getByRole("button", {
      name: "Ask about inspection and pour acceptance gates",
      exact: true,
    })
    .click();
  await closePanel(page);
  await page.getByRole("button", { name: "Project tablet" }).click();
  const tablet = page.getByRole("dialog");
  await expect(tablet).toHaveAttribute("data-presentation", "tablet");
  await tablet.getByRole("tab", { name: "Dependency plan", exact: true }).click();
  await tablet
    .getByLabel("Setting-out survey duration (days)", { exact: true })
    .fill("2");
  for (const dependency of [
    "Safety inspection depends on Setting-out survey",
    "Off-site formwork preparation depends on Setting-out survey",
    "Foundation pour depends on Safety inspection",
    "Foundation pour depends on Off-site formwork preparation",
  ]) {
    await tablet.getByRole("checkbox", { name: dependency, exact: true }).check();
  }
  await tablet.getByLabel("Plan owner", { exact: true }).selectOption("Sam");
  await tablet.getByLabel("Follow-up check", { exact: true }).fill("11:00");
  await tablet.getByRole("button", { name: "Save schedule plan" }).click();
  await expect(
    tablet.getByRole("heading", { name: "Verified schedule plan recorded" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page, tablet);
  await tablet.screenshot({ path: testInfo.outputPath("portrait-tablet.png") });
  const planned = await snapshot(page);
  expect(planned.schedule!.plan!.chainDays).toBe(5);
  expect(planned.project.forecastFinishDay).toBe(14);
  expect(planned.project.actualCost).toBe(400);
  await tablet.getByRole("button", { name: "Put tablet away" }).click();
  await page.keyboard.press("j");
  const journal = page.getByRole("dialog");
  await expect(journal).toHaveAttribute("data-presentation", "journal");
  const book = journal.getByTestId("mission-journal");
  await expectHandwritingLoaded(book, true);
  await expect(
    book.locator('.pq-journal-objective[data-complete="true"]'),
  ).toHaveCount(5);
  await expectNoHorizontalOverflow(page, journal);
  await journal.screenshot({ path: testInfo.outputPath("portrait-journal.png") });
  await book.getByRole("button", { name: "Evidence", exact: true }).click();
  await expect(
    book.getByRole("heading", {
      name: "Source record · Two-successor dependency schedule",
      exact: true,
    }),
  ).toBeVisible();
  await expectActivityEntry(book, planned.events.at(-1)!.summary);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await snapshot(page)).schedule).toEqual(planned.schedule);
});
