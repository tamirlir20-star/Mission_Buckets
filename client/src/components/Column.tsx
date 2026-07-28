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
  onOpenTask,
}: {
  status: TaskStatus;
  tasks: Task[];
  onOpenTask: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div ref={setNodeRef} className={`column${isOver ? " column-over" : ""}`}>
      <h2>
        {TITLES[status]} <span className="column-count">{tasks.length}</span>
      </h2>
      <div className="column-tasks">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onOpen={onOpenTask} />
        ))}
      </div>
    </div>
  );
}
