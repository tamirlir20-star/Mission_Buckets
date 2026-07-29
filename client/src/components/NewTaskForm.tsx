import { useState } from "react";
import { api } from "../api";
import { TASK_TYPES, TYPE_LABELS } from "../taskTypes";
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
    // Inherit the chosen parent's column so the new card nests under it immediately,
    // instead of landing in "todo" and needing to be dragged over manually.
    const parent = parentId === "" ? undefined : tasks.find((t) => t.id === parentId);
    const task = await api.createTask({
      title: trimmed,
      createdBy: username,
      type,
      parentId: parentId === "" ? null : parentId,
      status: parent?.status,
    });
    onCreated(task);
    resetAndClose();
  }

  if (!open) {
    return (
      <button className="new-task-button" onClick={() => setOpen(true)}>
        + כרטיס חדש
      </button>
    );
  }

  return (
    <form className="new-task-form" onSubmit={handleSubmit}>
      <select value={type} onChange={(e) => setType(e.target.value as TaskType)}>
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

      <select value={parentId} onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : "")}>
        <option value="">בלי כרטיס-על (עצמאי)</option>
        {tasks.map((t) => (
          <option key={t.id} value={t.id}>
            {TYPE_LABELS[t.type]}: {t.title}
          </option>
        ))}
      </select>

      <button type="submit" disabled={!title.trim()}>
        הוסף
      </button>
      <button type="button" className="secondary" onClick={resetAndClose}>
        ביטול
      </button>
    </form>
  );
}
