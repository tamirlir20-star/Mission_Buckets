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
  onOpenTask,
  onDeleted,
}: {
  status: TaskStatus;
  tasks: Task[];
  tasksById: Map<number, Task>;
  onOpenTask: (task: Task) => void;
  onDeleted: (taskId: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div ref={setNodeRef} className={`column${isOver ? " column-over" : ""}`}>
      <h2>
        {TITLES[status]} <span className="column-count">{tasks.length}</span>
      </h2>
      <div className="column-tasks">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            parent={task.parent_id ? tasksById.get(task.parent_id) : undefined}
            onOpen={onOpenTask}
            onDeleted={onDeleted}
          />
        ))}
      </div>
    </div>
  );
}
