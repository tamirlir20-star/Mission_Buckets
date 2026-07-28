import { useEffect, useState } from "react";
import { api } from "../api";
import type { Comment, Task } from "../types";

export function TaskModal({
  task,
  username,
  onClose,
  onUpdated,
  onDeleted,
}: {
  task: Task;
  username: string;
  onClose: () => void;
  onUpdated: (task: Task) => void;
  onDeleted: (taskId: number) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [assignee, setAssignee] = useState(task.assignee);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getComments(task.id).then(setComments).catch(() => {});
  }, [task.id]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await api.updateTask(task.id, {
        title: title.trim() || task.title,
        description,
        assignee,
      });
      onUpdated(updated);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`למחוק את המשימה "${task.title}"?`)) return;
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
            מחק משימה
          </button>
        </div>

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
