import { useState } from "react";
import { api } from "../api";
import { REQUIRED_PARENT_TYPE, TASK_TYPES, TYPE_LABELS } from "../taskTypes";
import type { Task, TaskType } from "../types";

export function NewTaskForm({
  username,
  tasks,
  onCreated,
}: {
  username: string;
  tasks: Task[];
  onCreated: (task: Task) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("task");
  const [parentId, setParentId] = useState<number | "">("");

  const requiredParentType = REQUIRED_PARENT_TYPE[type];
  const eligibleParents = requiredParentType
    ? tasks.filter((t) => t.type === requiredParentType)
    : [];

  function resetAndClose() {
    setTitle("");
    setType("task");
    setParentId("");
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const task = await api.createTask({
      title: trimmed,
      createdBy: username,
      type,
      parentId: parentId === "" ? null : parentId,
    });
    onCreated(task);
    resetAndClose();
  }

  if (!open) {
    return (
      <button className="new-task-button" onClick={() => setOpen(true)}>
        + פריט חדש
      </button>
    );
  }

  return (
    <form className="new-task-form" onSubmit={handleSubmit}>
      <select
        value={type}
        onChange={(e) => {
          setType(e.target.value as TaskType);
          setParentId("");
        }}
      >
        {TASK_TYPES.map((t) => (
          <option key={t} value={t}>
            {TYPE_LABELS[t]}
          </option>
        ))}
      </select>

      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="שם..."
      />

      {requiredParentType && (
        <select value={parentId} onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : "")}>
          <option value="">בלי {TYPE_LABELS[requiredParentType]} (עצמאי)</option>
          {eligibleParents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      )}

      <button type="submit" disabled={!title.trim()}>
        הוסף
      </button>
      <button type="button" className="secondary" onClick={resetAndClose}>
        ביטול
      </button>
    </form>
  );
}
