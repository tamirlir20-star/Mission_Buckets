import { useDraggable } from "@dnd-kit/core";
import { api } from "../api";
import { TYPE_BADGE_CLASS, TYPE_LABELS } from "../taskTypes";
import type { Task } from "../types";

export function TaskCard({
  task,
  parent,
  columnTasks,
  nested = false,
  onOpen,
  onDeleted,
  onUpdated,
}: {
  task: Task;
  parent: Task | undefined;
  columnTasks: Task[];
  nested?: boolean;
  onOpen: (task: Task) => void;
  onDeleted: (taskId: number) => void;
  onUpdated: (task: Task) => void;
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

  const childrenInColumn = columnTasks.filter((t) => t.parent_id === task.id);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`למחוק את "${task.title}"?`)) return;
    await api.deleteTask(task.id);
    onDeleted(task.id);
  }

  async function handleToggleComplete(e: React.MouseEvent) {
    e.stopPropagation();
    const nextStatus = task.status === "done" ? "todo" : "done";
    const updated = await api.updateTask(task.id, { status: nextStatus });
    onUpdated(updated);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card${nested ? " task-card-nested" : ""}${isDragging ? " dragging" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(task);
      }}
      {...listeners}
      onPointerDown={(e) => {
        listeners?.onPointerDown?.(e);
        e.stopPropagation();
      }}
      {...attributes}
    >
      <div className="task-card-top">
        <span className={`badge ${TYPE_BADGE_CLASS[task.type]}`}>{TYPE_LABELS[task.type]}</span>
        <div className="task-card-buttons">
          <button
            className="task-card-complete"
            onClick={handleToggleComplete}
            onPointerDown={(e) => e.stopPropagation()}
            title={task.status === "done" ? "החזר לביצוע" : "סמן כהושלם"}
          >
            {task.status === "done" ? "↩" : "✓"}
          </button>
          <button
            className="task-card-delete"
            onClick={handleDelete}
            onPointerDown={(e) => e.stopPropagation()}
            title="מחק"
          >
            🗑
          </button>
        </div>
      </div>
      <div className="task-card-title">{task.title}</div>
      {parent && (
        <div className="parent-chip">
          <span className="parent-chip-icon">↳</span>
          {parent.title}
        </div>
      )}
      {task.assignee && <div className="task-card-assignee">👤 {task.assignee}</div>}

      {childrenInColumn.length > 0 && (
        <div className="nested-children">
          {childrenInColumn.map((child) => (
            <TaskCard
              key={child.id}
              task={child}
              parent={undefined}
              columnTasks={columnTasks}
              nested
              onOpen={onOpen}
              onDeleted={onDeleted}
              onUpdated={onUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
