import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import type { GameState } from "../src/game/types";

// This literal pre-campaign fixture was exported by the original Day 1 reducer.
// It tests a real legacy save, rather than fabricating an already-unlocked Day 2.
const legacySave = readFileSync(
  new URL("./fixtures/day1-v1-completed.json", import.meta.url),
  "utf8",
);
const day1 = JSON.parse(legacySave).snapshot as GameState;
const responseLabels = [
  "Accept the revised sequence",
  "Request a second survey team",
  "Propose skipping the inspection",
  "Promise the original forecast",
];

test.use({ viewport: { width: 960, height: 720 } });

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

async function startFromLegacyDay1(page: Page) {
  await page.addInitScript((save) => {
    if (!localStorage.getItem("projectquest.save.v1")) {
      localStorage.setItem("projectquest.save.v1", save);
    }
  }, legacySave);
  await page.goto("/");
  await page
    .getByRole("button", { name: "Continue as Ari", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "The decision. The difference." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue to Day 2" }).click();
  await expect(page.locator(".pq-world")).toHaveAttribute(
    "data-world-ready",
    "true",
    { timeout: 30_000 },
  );
  const carried = await snapshot(page);
  expect(carried.missionId).toBe("CONST-I02");
  expect(carried.day).toBe(2);
  expect(carried.phase).toBe("arrival");
  expect(carried.project).toEqual(day1.project);
  expect(carried.career.xp).toBe(day1.career.xp);
  expect(carried.missionHistory).toHaveLength(1);
  expect(carried.missionHistory![0].actualCost).toBe(400);
  await visit(page, "Alex · Mentor", "mentor");
  await page
    .getByRole("button", { name: "Accept the scheduling assignment" })
    .click();
  await closePanel(page);
}

async function investigateAndPlan(page: Page, inspectCapacity = false) {
  await page.getByRole("button", { name: "Project tablet" }).click();
  await page
    .getByRole("button", { name: "Inspect dependency schedule" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Source record · Two-successor dependency schedule",
    }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Dependency plan", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Save schedule plan" }),
  ).toBeDisabled();
  await closePanel(page);

  await visit(page, "Sam · Delivery lead", "lead");
  await page
    .getByRole("button", {
      name: "Ask about survey duration and both successor teams",
      exact: true,
    })
    .click();
  for (const label of [
    "Ask about survey duration and both successor teams",
    "Ask Sam to keep the original date",
  ]) {
    await expect(
      page.getByRole("button", { name: label, exact: true }),
    ).toBeDisabled();
  }
  await expect(
    page.getByRole("heading", {
      name: "Source record · Sam’s verified survey and crew update",
    }),
  ).toBeVisible();
  await closePanel(page);

  await visit(page, "Taylor · Safety", "safety");
  await page
    .getByRole("button", {
      name: "Ask about inspection and pour acceptance gates",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Ask Taylor to remove the inspection gate",
      exact: true,
    }),
  ).toBeDisabled();
  await closePanel(page);

  if (inspectCapacity) {
    await visit(page, "Morgan · Supplier", "supplier");
    await page
      .getByRole("button", {
        name: "Ask about second-team capacity",
        exact: true,
      })
      .click();
    await closePanel(page);
  }

  await page.getByRole("button", { name: "Project tablet" }).click();
  await page.getByRole("tab", { name: "Dependency plan", exact: true }).click();
  await page
    .getByLabel("Setting-out survey duration (days)", { exact: true })
    .fill("2");
  for (const dependency of [
    "Safety inspection depends on Setting-out survey",
    "Off-site formwork preparation depends on Setting-out survey",
    "Foundation pour depends on Safety inspection",
    "Foundation pour depends on Off-site formwork preparation",
  ]) {
    await page.getByRole("checkbox", { name: dependency, exact: true }).check();
  }
  await page.getByLabel("Plan owner", { exact: true }).selectOption("Sam");
  await page.getByLabel("Follow-up check", { exact: true }).fill("11:00");
  await page.getByRole("button", { name: "Save schedule plan" }).click();
  await expect(
    page.getByRole("heading", { name: "Verified schedule plan recorded" }),
  ).toBeVisible();
  const planned = await snapshot(page);
  expect(planned.schedule!.plan!.chainDays).toBe(5);
  expect(planned.project.forecastFinishDay).toBe(14);
  expect(planned.project.baselineFinishDay).toBe(12);
  expect(planned.project.actualCost).toBe(400);
  await closePanel(page);
}

async function commitResponse(page: Page, label: string) {
  await visit(page, "Coordination meeting", "report");
  await page.getByRole("button", { name: label, exact: true }).click();
  for (const option of responseLabels) {
    await expect(
      page.getByRole("button", { name: option, exact: true }),
    ).toBeDisabled();
  }
  await expect(
    page.getByRole("button", { name: label, exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
}

async function submitAndReview(page: Page) {
  await page
    .getByLabel("Day 2 forecast confidence", { exact: true })
    .selectOption("estimate");
  await page
    .getByLabel("Day 2 verification checkpoint", { exact: true })
    .fill("11:00");
  await page
    .getByLabel("Revised-sequence forecast day", { exact: true })
    .fill("14");
  await page
    .getByLabel("Revised-sequence extra cost", { exact: true })
    .fill("0");
  await page.getByLabel("Extra-team forecast day", { exact: true }).fill("13");
  await page.getByLabel("Extra-team extra cost", { exact: true }).fill("1200");
  await page
    .getByRole("button", { name: "Submit schedule recommendation" })
    .click();
  await expect(
    page.getByRole("button", { name: "Advance to 11:00" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", {
      name: "Keep the forecast conditional and request Alex’s approval",
      exact: true,
    })
    .click();
  for (const answer of [
    "Keep the forecast conditional and request Alex’s approval",
    "Guarantee the date without conditions",
    "Leave the confidence explanation to Alex",
  ]) {
    await expect(
      page.getByRole("button", { name: answer, exact: true }),
    ).toBeDisabled();
  }
}

async function resolve(page: Page) {
  await page.getByRole("button", { name: "Advance to 11:00" }).click();
  await expect(
    page.getByRole("heading", { name: "The sequence. The consequence." }),
  ).toBeVisible();
  await expect(page.getByTestId("save-status")).toHaveText("Progress saved");
}

test("migrates a real Day 1 save, commits approved survey support across reload, and replays only Day 2", async ({
  page,
}) => {
  await startFromLegacyDay1(page);
  await investigateAndPlan(page, true);
  await commitResponse(page, "Request a second survey team");
  const committed = await snapshot(page);
  expect(committed.schedule!.choice).toBe("extra_team");
  expect(committed.project.actualCost).toBe(400);

  await page.reload();
  await page
    .getByRole("button", { name: "Continue as Ari", exact: true })
    .click();
  await visit(page, "Coordination meeting", "report");
  for (const option of responseLabels) {
    await expect(
      page.getByRole("button", { name: option, exact: true }),
    ).toBeDisabled();
  }
  await expect(
    page.getByRole("button", {
      name: "Request a second survey team",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await submitAndReview(page);
  expect((await snapshot(page)).project.actualCost).toBe(400);
  await expect(
    page.getByText(/Alex conditionally approved support/),
  ).toBeVisible();
  await resolve(page);
  await expect(
    page.getByRole("heading", { name: "A schedule built on evidence" }),
  ).toBeVisible();
  const completed = await snapshot(page);
  expect(completed.project.actualCost).toBe(1600);
  expect(completed.project.forecastCost).toBe(121600);
  expect(completed.project.forecastFinishDay).toBe(13);
  expect(completed.project.stakeholderTrust).toBe(71);
  expect(completed.project.quality).toBe(100);
  expect(completed.career.xp).toBe(210);
  expect(completed.career.completedMissionIds).toEqual([
    "CONST-I01",
    "CONST-I02",
  ]);
  expect(completed.missionHistory!.map((mission) => mission.xpEarned)).toEqual([
    100, 110,
  ]);
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator(".pq-rubric article")).toHaveCount(4);
  await expect(dialog.getByText("+110 / 210", { exact: true })).toBeVisible();
  await expect(dialog.getByText("1,600 cr", { exact: true })).toBeVisible();

  await page.reload();
  await page
    .getByRole("button", { name: "Continue as Ari", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "The sequence. The consequence." }),
  ).toBeVisible();
  const resumed = await snapshot(page);
  expect(resumed.career).toEqual(completed.career);
  expect(resumed.events).toEqual(completed.events);
  expect(resumed.missionHistory).toEqual(completed.missionHistory);
  await expect(
    page.getByRole("button", { name: "Advance to 11:00" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Replay Day 2", exact: true }).click();
  const replayed = await snapshot(page);
  expect(replayed.missionId).toBe("CONST-I02");
  expect(replayed.phase).toBe("arrival");
  expect(replayed.career.xp).toBe(100);
  expect(replayed.project).toEqual(day1.project);
  expect(replayed.missionHistory).toHaveLength(1);
  expect(replayed.schedule!.choice).toBeNull();
  expect(replayed.schedule!.plan).toBeNull();
});

test("blocks an inspection bypass and persists its distinct coordination, trust and scoring consequences", async ({
  page,
}) => {
  await startFromLegacyDay1(page);
  await investigateAndPlan(page);
  await commitResponse(page, "Propose skipping the inspection");
  await submitAndReview(page);
  expect((await snapshot(page)).schedule!.proposal!.approval).toBe("rejected");
  await resolve(page);
  await expect(
    page.getByRole("heading", { name: "A setback with a traceable cause" }),
  ).toBeVisible();
  const completed = await snapshot(page);
  expect(completed.project.governance).toBe("breach");
  expect(completed.project.quality).toBe(100);
  expect(completed.project.forecastFinishDay).toBe(15);
  expect(completed.project.actualCost).toBe(900);
  expect(completed.project.stakeholderTrust).toBe(53);
  expect(completed.career.competencies.authority).toBe(0);
  expect(completed.career.xp).toBe(190);
  await expect(
    page
      .getByRole("dialog")
      .locator(".pq-outcome")
      .getByText(/Taylor blocked the proposed inspection bypass/),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Continue as Ari", exact: true })
    .click();
  expect((await snapshot(page)).project).toEqual(completed.project);
  expect((await snapshot(page)).career).toEqual(completed.career);
});

test("records the honest revised sequence without extra spending or loss of earlier project history", async ({
  page,
}) => {
  await startFromLegacyDay1(page);
  await investigateAndPlan(page);
  await commitResponse(page, "Accept the revised sequence");
  await submitAndReview(page);
  await resolve(page);
  const completed = await snapshot(page);
  expect(completed.project.baselineFinishDay).toBe(12);
  expect(completed.project.forecastFinishDay).toBe(14);
  expect(completed.project.actualCost).toBe(400);
  expect(completed.project.forecastCost).toBe(120400);
  expect(completed.project.stakeholderTrust).toBe(69);
  expect(completed.career.xp).toBe(210);
  expect(completed.missionHistory![0].forecastFinishDay).toBe(13);
  expect(completed.missionHistory![1].forecastFinishDay).toBe(14);
  await closePanel(page);
  await page.getByRole("button", { name: "Career", exact: true }).click();
  await expect(
    page.getByRole("dialog").locator(".pq-career-xp strong"),
  ).toHaveText("210");
  await expect(
    page
      .getByRole("dialog")
      .getByText("Day 1 · The Missing Materials · +100 XP", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("dialog")
      .getByText("Day 2 · The Slipping Milestone · +110 XP", { exact: true }),
  ).toBeVisible();
});

test("read-only Day 2 planning fits portrait and keeps keyboard focus on available controls", async ({
  page,
}) => {
  await page.addInitScript(
    (save) => localStorage.setItem("projectquest.save.v1", save),
    legacySave,
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Continue as Ari", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue to Day 2" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Project tablet" }).click();
  const planTab = page.getByRole("tab", {
    name: "Dependency plan",
    exact: true,
  });
  await planTab.click();
  await expect(page.getByLabel("Plan owner", { exact: true })).toBeDisabled();
  const sizing = await page.evaluate(() => ({
    width: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    fieldsFit: [
      ...document.querySelectorAll(".day2-plan input,.day2-plan select"),
    ].every((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= innerWidth;
    }),
  }));
  expect(sizing.documentWidth).toBeLessThanOrEqual(sizing.width);
  expect(sizing.fieldsFit).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("day2-portrait.png"),
    fullPage: true,
  });
  const close = page.getByRole("button", { name: "Close panel", exact: true });
  await close.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Put tablet away" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await planTab.focus();
  await page.keyboard.press("ArrowLeft");
  const sources = page.getByRole("tab", {
    name: "Schedule & sources",
    exact: true,
  });
  await expect(sources).toBeFocused();
  await expect(sources).toHaveAttribute("aria-selected", "true");
});
