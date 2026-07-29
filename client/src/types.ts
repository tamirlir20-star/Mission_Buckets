export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskType = "top_goal" | "milestone" | "task";

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  type: TaskType;
  parent_id: number | null;
  assignee: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  task_id: number;
  author: string;
  text: string;
  created_at: string;
}
