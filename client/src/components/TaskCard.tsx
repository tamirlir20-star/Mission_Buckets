import { useDraggable } from "@dnd-kit/core";
import { api } from "../api";
import { TYPE_BADGE_CLASS, TYPE_LABELS } from "../taskTypes";
import type { Task } from "../types";

export function TaskCard({
  task,
  parent,
  onOpen,
  onDeleted,
}: {
  task: Task;
  parent: Task | undefined;
  onOpen: (task: Task) => void;
  onDeleted: (taskId: number) => void;
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

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`למחוק את "${task.title}"?`)) return;
    await api.deleteTask(task.id);
    onDeleted(task.id);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card${isDragging ? " dragging" : ""}`}
      onClick={() => onOpen(task)}
      {...listeners}
      {...attributes}
    >
      <div className="task-card-top">
        <span className={`badge ${TYPE_BADGE_CLASS[task.type]}`}>{TYPE_LABELS[task.type]}</span>
        <button
          className="task-card-delete"
          onClick={handleDelete}
          onPointerDown={(e) => e.stopPropagation()}
          title="מחק"
        >
          🗑
        </button>
      </div>
      <div className="task-card-title">{task.title}</div>
      {parent && (
        <div className="parent-chip">
          <span className="parent-chip-icon">↳</span>
          {parent.title}
        </div>
      )}
      {task.assignee && <div className="task-card-assignee">👤 {task.assignee}</div>}
    </div>
  );
}
