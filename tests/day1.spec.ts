import { expect, test, type Page } from "@playwright/test";
import type { GameState } from "../src/game/types";

test.use({ viewport: { width: 960, height: 720 } });

async function enterWorkplace(page: Page, name = "Nia") {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start your career", exact: true })
    .click();
  await page.getByLabel("What should your team call you?").fill(name);
  await page.getByRole("button", { name: "Choose your industry" }).click();
  await page.getByRole("button", { name: "Enter the workplace" }).click();
  await expect(page.locator(".pq-world")).toHaveAttribute(
    "data-world-ready",
    "true",
    { timeout: 30_000 },
  );
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

async function closePanel(page: Page) {
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

/** Read-only checks of persisted consequences; gameplay always uses the public UI. */
async function savedSnapshot(page: Page): Promise<GameState> {
  return page.evaluate(
    () => JSON.parse(localStorage.getItem("projectquest.save.v1")!).snapshot,
  );
}

async function investigate(
  page: Page,
  includeSafety = false,
  validateForms = false,
) {
  await visit(page, "Alex · Mentor", "mentor");
  await page.getByRole("button", { name: "Accept the assignment" }).click();
  await closePanel(page);
  await page.keyboard.press("t");
  await expect(
    page.getByRole("heading", { name: "Your project tablet" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Schedule", exact: true }).click();
  await page.getByRole("button", { name: "Inspect schedule" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Source record · Foundation delivery schedule",
    }),
  ).toBeVisible();
  await closePanel(page);
  await visit(page, "Sam · Delivery lead", "lead");
  await page
    .getByRole("button", { name: "Ask about crews and dependencies" })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Ask about crews and dependencies",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", {
      name: "Ask Sam to hold the original deadline",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    page.getByRole("heading", {
      name: "Source record · Sam’s crew and dependency check",
    }),
  ).toBeVisible();
  await closePanel(page);
  await visit(page, "Morgan · Supplier", "supplier");
  await page
    .getByRole("button", { name: "Ask for delivery evidence and confidence" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Source record · Morgan’s delivery estimate",
    }),
  ).toBeVisible();
  await closePanel(page);
  if (includeSafety) {
    await visit(page, "Taylor · Safety", "safety");
    await page
      .getByRole("button", { name: "Ask about alternate delivery checks" })
      .click();
    await closePanel(page);
  }
  await page.getByRole("button", { name: "Project tablet" }).click();
  if (validateForms) {
    await page.getByRole("button", { name: "Save delivery update" }).click();
    await expect(page.getByRole("alert")).toContainText(
      "Choose a status and owner",
    );
  }
  await page.getByLabel("Task status", { exact: true }).selectOption("blocked");
  await page.getByLabel("Task owner", { exact: true }).selectOption("Morgan");
  await page.getByLabel("Task due day", { exact: false }).fill("1");
  await page
    .getByLabel("Blocker / evidence summary", { exact: true })
    .fill(
      "Truck failure; Morgan estimates 10:30. Sam needs a crew contingency.",
    );
  await expect(
    page.getByRole("checkbox", { name: "Schedule", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "Sam · crews", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "Morgan · supplier", exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Save delivery update" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Delivery card updated." }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Issue register", exact: true }).click();
  if (validateForms) {
    await page.getByRole("button", { name: "Log issue", exact: false }).click();
    await expect(page.getByRole("alert")).toContainText(
      "Complete every issue field",
    );
  }
  await page
    .getByLabel("Issue title", { exact: true })
    .fill("Concrete delivery delayed: foundations and framing exposed");
  await page.getByLabel("Issue owner", { exact: true }).selectOption("Morgan");
  await page.getByLabel("Severity", { exact: true }).selectOption("high");
  await page.getByLabel("Due day", { exact: true }).fill("1");
  await page
    .getByLabel("Affected work", { exact: true })
    .selectOption("foundation");
  await page.getByLabel("Confidence", { exact: true }).selectOption("estimate");
  await page.getByLabel("Next check", { exact: false }).fill("10:30");
  await page.getByRole("button", { name: "Log issue", exact: false }).click();
  await expect(
    page.getByRole("heading", {
      name: /Recorded issue · Concrete delivery delayed/,
    }),
  ).toBeVisible();
  await closePanel(page);
}

async function recommend(page: Page, option: string) {
  await visit(page, "Coordination meeting", "report");
  await page.getByRole("button", { name: option, exact: false }).click();
  for (const response of [
    "Wait with a contingency",
    "Request an approved alternate",
    "Promise delivery on time",
    "Attempt to order without approval",
  ]) {
    await expect(
      page.getByRole("button", { name: response, exact: true }),
    ).toBeDisabled();
  }
  await page
    .getByLabel("Recommendation confidence", { exact: true })
    .selectOption("estimate");
  await page
    .getByLabel("Recommendation impact", { exact: true })
    .selectOption("foundation");
  await page
    .getByLabel("Recommendation next check", { exact: true })
    .fill("10:30");
  await page
    .locator("summary")
    .filter({ hasText: "Compare alternatives" })
    .click();
  await page.getByLabel("Wait forecast day", { exact: true }).fill("13");
  await page.getByLabel("Wait extra cost", { exact: true }).fill("400");
  await page.getByLabel("Alternate forecast day", { exact: true }).fill("12");
  await page.getByLabel("Alternate extra cost", { exact: true }).fill("2000");
  await page.getByRole("button", { name: "Submit recommendation" }).click();
  await expect(
    page.getByRole("button", { name: "Advance to 10:30" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", {
      name: "Verify at 10:30 and keep the plan conditional",
      exact: false,
    })
    .click();
}

async function resolve(page: Page) {
  await page.getByRole("button", { name: "Advance to 10:30" }).click();
  await expect(
    page.getByRole("heading", { name: "The decision. The difference." }),
  ).toBeVisible();
  await expect(page.getByText("9 / 9 objectives complete")).toBeVisible();
  await expect(page.getByTestId("save-status")).toHaveText("Progress saved");
}

test("completes the first-day wait assignment with source-backed tools, feedback and stable resume", async ({
  page,
}) => {
  await enterWorkplace(page);
  await investigate(page, false, true);
  await recommend(page, "Wait with a contingency");
  const before = await savedSnapshot(page);
  expect(before.project.actualCost).toBe(0);
  expect(before.minutes).toBe(540);
  await resolve(page);
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Your first project case study" }),
  ).toBeVisible();
  await expect(dialog.getByText("12 → 13", { exact: true })).toBeVisible();
  await expect(dialog.getByText("120,400 cr", { exact: true })).toBeVisible();
  await expect(dialog.locator(".pq-rubric article")).toHaveCount(4);
  for (const criterion of ["Accuracy", "Impact", "Authority", "Follow-up"]) {
    const result = dialog.locator(".pq-rubric article").filter({
      has: page.getByRole("heading", { name: criterion, exact: true }),
    });
    await expect(result.locator("header > strong")).toHaveText("3 / 3");
    expect(await result.locator(".pq-citations li").count()).toBeGreaterThan(0);
  }
  const completed = await savedSnapshot(page);
  expect(completed.career.xp).toBe(100);
  expect(completed.career.completedMissionIds).toEqual(["CONST-I01"]);
  expect(
    completed.events.filter((event) => event.type === "mission_completed"),
  ).toHaveLength(1);
  await page.reload();
  await page.getByRole("button", { name: "Continue as Nia" }).click();
  await expect(
    page.getByRole("heading", { name: "The decision. The difference." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Advance to 10:30" }),
  ).toHaveCount(0);
  const resumed = await savedSnapshot(page);
  expect(resumed.career).toEqual(completed.career);
  expect(resumed.events).toEqual(completed.events);
  await closePanel(page);
  await page.getByRole("button", { name: "Career", exact: true }).click();
  await expect(
    page.getByRole("dialog").locator(".pq-career-xp strong"),
  ).toHaveText("100");
});

test("an approved alternate protects the milestone only after approval and acceptance", async ({
  page,
}) => {
  await enterWorkplace(page, "Tomi");
  await investigate(page, true);
  await recommend(page, "Request an approved alternate");
  await expect(
    page.getByText(/Alex has conditionally approved the recommendation/),
  ).toBeVisible();
  const conditional = await savedSnapshot(page);
  expect(conditional.proposal?.approval).toBe("conditional");
  expect(conditional.project.actualCost).toBe(0);
  await resolve(page);
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("12 → 12", { exact: true })).toBeVisible();
  await expect(dialog.getByText("122,000 cr", { exact: true })).toBeVisible();
  const resolved = await savedSnapshot(page);
  expect(resolved.project.quality).toBe(100);
  expect(resolved.project.governance).toBe("compliant");
  expect(resolved.proposal?.approval).toBe("approved");
  expect(
    resolved.events.some((event) => event.type === "approval_verified"),
  ).toBe(true);
  expect(resolved.career.competencies).toEqual({
    accuracy: 3,
    impact: 3,
    authority: 3,
    followUp: 3,
  });
});

test("an attempted unauthorised order records a setback and supports a fresh recovery run", async ({
  page,
}) => {
  await enterWorkplace(page, "Kai");
  await investigate(page);
  await recommend(page, "Attempt to order without approval");
  await expect(
    page.getByText(/procurement request has not been approved/),
  ).toBeVisible();
  await resolve(page);
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "A setback you can learn from" }),
  ).toBeVisible();
  await expect(dialog.getByText("12 → 14", { exact: true })).toBeVisible();
  await expect(
    dialog.getByText(/Authority needs reflection and recovery/),
  ).toBeVisible();
  const failed = await savedSnapshot(page);
  expect(failed.project.governance).toBe("breach");
  expect(failed.project.actualCost).toBe(800);
  expect(failed.career.competencies.authority).toBe(0);
  await dialog
    .getByRole("button", { name: "Replay assignment", exact: true })
    .click();
  await expect(page.getByText("0 / 9 objectives complete")).toBeVisible();
  const replay = await savedSnapshot(page);
  expect(replay.profile.name).toBe("Kai");
  expect(replay.career.xp).toBe(0);
  expect(replay.events).toEqual([]);
});

test("rejects corrupt local progress without crashing and permits a new career", async ({
  page,
}) => {
  // Deliberate fault injection, never a shortcut through the mission.
  await page.addInitScript(() =>
    localStorage.setItem("projectquest.save.v1", "{broken JSON"),
  );
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("not valid JSON");
  await expect(page.getByRole("button", { name: /Continue as/ })).toHaveCount(
    0,
  );
  await page
    .getByRole("button", { name: "Start your career", exact: true })
    .click();
  await page.getByLabel("What should your team call you?").fill("Recovery");
  await page.getByRole("button", { name: "Choose your industry" }).click();
  await page.getByRole("button", { name: "Enter the workplace" }).click();
  await expect(page.getByTestId("save-status")).toHaveText("Progress saved");
  const recovered = await savedSnapshot(page);
  expect(recovered.phase).toBe("arrival");
  expect(recovered.profile.name).toBe("Recovery");
  expect(errors).toEqual([]);
});

test("portrait UI fits the viewport and settings keep keyboard focus within the dialog", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const settingsButton = page.getByRole("button", {
    name: "Accessibility & settings",
  });
  await settingsButton.click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Make it your workplace" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("button", { name: "Close panel" }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    dialog.getByRole("button", { name: "Return to menu" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("button", { name: "Close panel" }),
  ).toBeFocused();
  await page.getByRole("checkbox", { name: /High contrast/ }).check();
  await page.getByRole("checkbox", { name: /Lower graphics cost/ }).check();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(settingsButton).toBeFocused();
  await expect(page.locator(".game-root")).toHaveClass(/high-contrast/);
  await page
    .getByRole("button", { name: "Start your career", exact: true })
    .click();
  await page.getByLabel("What should your team call you?").fill("Ade");
  await page.getByRole("button", { name: "Choose your industry" }).click();
  await page.getByRole("button", { name: "Enter the workplace" }).click();
  await page.getByRole("button", { name: "Project tablet" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    dialog: document
      .querySelector('[role="dialog"]')!
      .getBoundingClientRect()
      .toJSON(),
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.dialog.x).toBeGreaterThanOrEqual(0);
  expect(dimensions.dialog.right).toBeLessThanOrEqual(dimensions.viewport);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
