import { useDraggable } from "@dnd-kit/core";
import type { Task } from "../types";

export function TaskCard({ task, onOpen }: { task: Task; onOpen: (task: Task) => void }) {
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
      <div className="task-card-title">{task.title}</div>
      {task.assignee && <div className="task-card-assignee">👤 {task.assignee}</div>}
    </div>
  );
}
