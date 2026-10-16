/** Finish-to-start day model for the learning scenario, not a construction estimate. */
export interface ScheduleInput {
  id: string;
  durationDays: number;
  dependencies: string[];
}
export interface ScheduleTiming {
  earlyStart: number;
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
  totalFloat: number;
  critical: boolean;
}
export interface ScheduleResult {
  tasks: Record<string, ScheduleTiming>;
  finishDay: number;
  criticalPath: string[];
}

export function calculateSchedule(
  tasks: readonly ScheduleInput[],
  startDay = 0,
): ScheduleResult {
  if (!tasks.length || tasks.length > 100 || !Number.isFinite(startDay))
    throw new Error("Provide a finite start day and 1–100 work packages.");
  const byId = new Map<string, ScheduleInput>();
  for (const task of tasks) {
    if (!task.id || byId.has(task.id))
      throw new Error("Work package IDs must be unique.");
    if (
      !Number.isInteger(task.durationDays) ||
      task.durationDays < 1 ||
      task.durationDays > 60
    )
      throw new Error("Durations must be whole working days from 1 to 60.");
    if (new Set(task.dependencies).size !== task.dependencies.length)
      throw new Error("A dependency can only be listed once.");
    byId.set(task.id, task);
  }
  const order: string[] = [],
    visiting = new Set<string>(),
    visited = new Set<string>();
  function visit(id: string) {
    if (visiting.has(id)) throw new Error("Dependency cycle detected.");
    if (visited.has(id)) return;
    const task = byId.get(id);
    if (!task) throw new Error(`Unknown predecessor: ${id}.`);
    visiting.add(id);
    for (const dependency of task.dependencies) visit(dependency);
    visiting.delete(id);
    visited.add(id);
    order.push(id);
  }
  for (const task of tasks) visit(task.id);
  const timing: Record<string, ScheduleTiming> = Object.create(null);
  for (const id of order) {
    const task = byId.get(id)!;
    const earlyStart = Math.max(
      startDay,
      ...task.dependencies.map((dependency) => timing[dependency].earlyFinish),
    );
    timing[id] = {
      earlyStart,
      earlyFinish: earlyStart + task.durationDays,
      lateStart: 0,
      lateFinish: 0,
      totalFloat: 0,
      critical: false,
    };
  }
  const finishDay = Math.max(
    ...Object.values(timing).map((task) => task.earlyFinish),
  );
  for (const id of [...order].reverse()) {
    const successors = tasks.filter((task) => task.dependencies.includes(id));
    const lateFinish = successors.length
      ? Math.min(...successors.map((task) => timing[task.id].lateStart))
      : finishDay;
    const lateStart = lateFinish - byId.get(id)!.durationDays;
    timing[id] = {
      ...timing[id],
      lateStart,
      lateFinish,
      totalFloat: lateStart - timing[id].earlyStart,
      critical: lateStart === timing[id].earlyStart,
    };
  }
  // Critical activities are listed in dependency order; parallel equal paths may both be critical.
  return {
    tasks: timing,
    finishDay,
    criticalPath: order.filter((id) => timing[id].critical),
  };
}
