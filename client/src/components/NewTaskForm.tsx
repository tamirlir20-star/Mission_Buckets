import { useState } from "react";
import { api } from "../api";
import type { Task } from "../types";

export function NewTaskForm({
  username,
  onCreated,
}: {
  username: string;
  onCreated: (task: Task) => void;
}) {
  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const task = await api.createTask({ title: trimmed, createdBy: username });
    onCreated(task);
    setTitle("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button className="new-task-button" onClick={() => setOpen(true)}>
        + משימה חדשה
      </button>
    );
  }

  return (
    <form className="new-task-form" onSubmit={handleSubmit}>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="שם המשימה..."
        onBlur={() => {
          if (!title.trim()) setOpen(false);
        }}
      />
      <button type="submit" disabled={!title.trim()}>
        הוסף
      </button>
    </form>
  );
}
