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
