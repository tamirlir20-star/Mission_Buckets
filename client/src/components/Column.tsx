import { useDroppable } from "@dnd-kit/core";
import type { Task, TaskStatus } from "../types";
import { TaskCard } from "./TaskCard";

const TITLES: Record<TaskStatus, string> = {
  todo: "לביצוע",
  in_progress: "בתהליך",
  done: "הושלם",
};

export function Column({
  status,
  tasks,
  tasksById,
  username,
  onOpenTask,
  onDeleted,
  onUpdated,
}: {
  status: TaskStatus;
  tasks: Task[];
  tasksById: Map<number, Task>;
  username: string;
  onOpenTask: (task: Task) => void;
  onDeleted: (taskId: number) => void;
  onUpdated: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  // A card whose parent is also in this column is rendered nested inside that parent
  // instead of as its own top-level card, so the hierarchy is visible directly on the board.
  const idsInColumn = new Set(tasks.map((t) => t.id));
  const rootTasks = tasks.filter((t) => t.parent_id === null || !idsInColumn.has(t.parent_id));

  return (
    <div ref={setNodeRef} className={`column${isOver ? " column-over" : ""}`}>
      <h2>
        {TITLES[status]} <span className="column-count">{tasks.length}</span>
      </h2>
      <div className="column-tasks">
        {rootTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            parent={task.parent_id ? tasksById.get(task.parent_id) : undefined}
            columnTasks={tasks}
            username={username}
            onOpen={onOpenTask}
            onDeleted={onDeleted}
            onUpdated={onUpdated}
          />
        ))}
      </div>
    </div>
  );
}
