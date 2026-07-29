import type { TaskType } from "./types";

export const TASK_TYPES: TaskType[] = ["top_goal", "milestone", "task"];

export const TYPE_LABELS: Record<TaskType, string> = {
  top_goal: "יעד-על",
  milestone: "יעד ביניים",
  task: "משימה שוטפת",
};

export const TYPE_BADGE_CLASS: Record<TaskType, string> = {
  top_goal: "badge-top-goal",
  milestone: "badge-milestone",
  task: "badge-task",
};

// A milestone's parent must be a top_goal, a task's parent must be a milestone,
// and a top_goal has no parent — mirrors the server-side rule in routes/tasks.ts.
export const REQUIRED_PARENT_TYPE: Record<TaskType, TaskType | null> = {
  top_goal: null,
  milestone: "top_goal",
  task: "milestone",
};
