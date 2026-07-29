import { useDraggable } from "@dnd-kit/core";
import { TYPE_BADGE_CLASS, TYPE_LABELS } from "../taskTypes";
import type { Task } from "../types";

export function TaskCard({
  task,
  parent,
  onOpen,
}: {
  task: Task;
  parent: Task | undefined;
  onOpen: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 10,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card${isDragging ? " dragging" : ""}`}
      onClick={() => onOpen(task)}
      {...listeners}
      {...attributes}
    >
      <span className={`badge ${TYPE_BADGE_CLASS[task.type]}`}>{TYPE_LABELS[task.type]}</span>
      <div className="task-card-title">{task.title}</div>
      {parent && <div className="task-card-parent">↳ {parent.title}</div>}
      {task.assignee && <div className="task-card-assignee">👤 {task.assignee}</div>}
    </div>
  );
}
