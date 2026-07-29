import { useEffect, useState } from "react";
import { api } from "../api";
import { REQUIRED_PARENT_TYPE, TASK_TYPES, TYPE_LABELS } from "../taskTypes";
import type { Comment, Task, TaskType } from "../types";

export function TaskModal({
  task,
  username,
  tasks,
  onClose,
  onUpdated,
  onDeleted,
  onOpenTask,
}: {
  task: Task;
  username: string;
  tasks: Task[];
  onClose: () => void;
  onUpdated: (task: Task) => void;
  onDeleted: (taskId: number) => void;
  onOpenTask: (task: Task) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [assignee, setAssignee] = useState(task.assignee);
  const [type, setType] = useState<TaskType>(task.type);
  const [parentId, setParentId] = useState<number | "">(task.parent_id ?? "");
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getComments(task.id).then(setComments).catch(() => {});
  }, [task.id]);

  const requiredParentType = REQUIRED_PARENT_TYPE[type];
  const eligibleParents = requiredParentType
    ? tasks.filter((t) => t.type === requiredParentType && t.id !== task.id)
    : [];
  const children = tasks.filter((t) => t.parent_id === task.id);

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

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        <label>
          סוג
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
        </label>

        {requiredParentType && (
          <label>
            {TYPE_LABELS[requiredParentType]}
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">ללא (עצמאי)</option>
              {eligibleParents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
        )}

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
          <input
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="שם החבר..."
          />
        </label>

        <div className="modal-actions">
          <button onClick={handleSave} disabled={saving}>
            שמור
          </button>
          <button className="danger" onClick={handleDelete}>
            מחק
          </button>
        </div>

        {children.length > 0 && (
          <>
            <hr />
            <h3>פריטים תחת זה</h3>
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
