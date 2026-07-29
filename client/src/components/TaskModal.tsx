import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { TASK_TYPES, TYPE_LABELS } from "../taskTypes";
import type { Comment, Task, TaskType } from "../types";

function descendantIds(rootId: number, tasks: Task[]): Set<number> {
  const childrenByParent = new Map<number, number[]>();
  for (const t of tasks) {
    if (t.parent_id === null) continue;
    const list = childrenByParent.get(t.parent_id) ?? [];
    list.push(t.id);
    childrenByParent.set(t.parent_id, list);
  }

  const result = new Set<number>();
  const stack = [...(childrenByParent.get(rootId) ?? [])];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (result.has(id)) continue;
    result.add(id);
    stack.push(...(childrenByParent.get(id) ?? []));
  }
  return result;
}

type QuickAddMode = "child" | "parent" | null;

export function TaskModal({
  task,
  username,
  tasks,
  onClose,
  onUpdated,
  onDeleted,
  onOpenTask,
  onTaskCreated,
}: {
  task: Task;
  username: string;
  tasks: Task[];
  onClose: () => void;
  onUpdated: (task: Task) => void;
  onDeleted: (taskId: number) => void;
  onOpenTask: (task: Task) => void;
  onTaskCreated: (task: Task) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [assignee, setAssignee] = useState(task.assignee);
  const [type, setType] = useState<TaskType>(task.type);
  const [parentId, setParentId] = useState<number | "">(task.parent_id ?? "");
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);

  const [quickAddMode, setQuickAddMode] = useState<QuickAddMode>(null);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickType, setQuickType] = useState<TaskType>("task");

  useEffect(() => {
    api.getComments(task.id).then(setComments).catch(() => {});
  }, [task.id]);

  const blockedParentIds = useMemo(() => descendantIds(task.id, tasks), [task.id, tasks]);
  const eligibleParents = tasks.filter((t) => t.id !== task.id && !blockedParentIds.has(t.id));
  const children = tasks.filter((t) => t.parent_id === task.id);
  const knownAssignees = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.assignee).filter(Boolean))).sort(),
    [tasks]
  );

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await api.updateTask(task.id, {
        title: title.trim() || task.title,
        description,
        assignee,
        type,
        parentId: parentId === "" ? null : parentId,
      });
      onUpdated(updated);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`למחוק את "${task.title}"?`)) return;
    await api.deleteTask(task.id);
    onDeleted(task.id);
    onClose();
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    const text = newComment.trim();
    if (!text) return;
    const comment = await api.addComment(task.id, { author: username, text });
    setComments((prev) => [...prev, comment]);
    setNewComment("");
  }

  function openQuickAdd(mode: QuickAddMode) {
    setQuickAddMode(mode);
    setQuickTitle("");
    setQuickType("task");
  }

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = quickTitle.trim();
    if (!trimmed) return;

    if (quickAddMode === "child") {
      const child = await api.createTask({
        title: trimmed,
        createdBy: username,
        type: quickType,
        parentId: task.id,
      });
      onTaskCreated(child);
    } else if (quickAddMode === "parent") {
      const newParent = await api.createTask({
        title: trimmed,
        createdBy: username,
        type: quickType,
        parentId: task.parent_id,
      });
      onTaskCreated(newParent);
      const updatedTask = await api.updateTask(task.id, { parentId: newParent.id });
      onUpdated(updatedTask);
      setParentId(newParent.id);
    }

    setQuickAddMode(null);
    setQuickTitle("");
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        <label>
          סוג
          <select value={type} onChange={(e) => setType(e.target.value as TaskType)}>
            {TASK_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>

        <label>
          כרטיס-על
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">ללא (עצמאי)</option>
            {eligibleParents.map((p) => (
              <option key={p.id} value={p.id}>
                {TYPE_LABELS[p.type]}: {p.title}
              </option>
            ))}
          </select>
        </label>

        <label>
          כותרת
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <label>
          תיאור
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <label>
          שיוך ל
          <div className="assignee-row">
            <input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="שם החבר..."
              list="known-assignees"
            />
            <button
              type="button"
              className={`assign-me-button${assignee === username ? " active" : ""}`}
              onClick={() => setAssignee(assignee === username ? "" : username)}
            >
              {assignee === username ? "✋ הסר שיוך" : "🙋 הקצה לעצמי"}
            </button>
          </div>
          <datalist id="known-assignees">
            {knownAssignees.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>

        <div className="modal-actions">
          <button onClick={handleSave} disabled={saving}>
            שמור
          </button>
          <button className="danger" onClick={handleDelete}>
            מחק
          </button>
        </div>

        <div className="quick-add-row">
          <button type="button" className="quick-add-button" onClick={() => openQuickAdd("child")}>
            + תת-משימה מתחת
          </button>
          <button type="button" className="quick-add-button" onClick={() => openQuickAdd("parent")}>
            + כרטיס-על חדש מעל
          </button>
        </div>

        {quickAddMode && (
          <form className="quick-add-form" onSubmit={handleQuickAdd}>
            <select value={quickType} onChange={(e) => setQuickType(e.target.value as TaskType)}>
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <input
              autoFocus
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="שם..."
            />
            <button type="submit" disabled={!quickTitle.trim()}>
              צור
            </button>
            <button type="button" className="secondary" onClick={() => setQuickAddMode(null)}>
              ביטול
            </button>
          </form>
        )}

        {children.length > 0 && (
          <>
            <hr />
            <h3>כרטיסים תחת זה</h3>
            <ul className="children-list">
              {children.map((child) => (
                <li key={child.id}>
                  <button
                    className="link-button"
                    onClick={() => {
                      onClose();
                      onOpenTask(child);
                    }}
                  >
                    {TYPE_LABELS[child.type]}: {child.title}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        <hr />

        <h3>תגובות</h3>
        <div className="comments">
          {comments.map((c) => (
            <div key={c.id} className="comment">
              <strong>{c.author}</strong>
              <span className="comment-text">{c.text}</span>
            </div>
          ))}
          {comments.length === 0 && <p className="empty">אין תגובות עדיין</p>}
        </div>

        <form onSubmit={handleAddComment} className="comment-form">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="הוסף תגובה..."
          />
          <button type="submit" disabled={!newComment.trim()}>
            שלח
          </button>
        </form>
      </div>
    </div>
  );
}
