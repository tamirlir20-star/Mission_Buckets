import { formatDateTime } from "../formatDate";
import { TYPE_BADGE_CLASS, TYPE_LABELS } from "../taskTypes";
import type { Task } from "../types";

export function CompletedHistory({
  tasks,
  onOpenTask,
}: {
  tasks: Task[];
  onOpenTask: (task: Task) => void;
}) {
  const completed = tasks
    .filter((t): t is Task & { completed_at: string } => t.completed_at !== null)
    .sort((a, b) => (a.completed_at < b.completed_at ? 1 : -1));

  if (completed.length === 0) {
    return <p className="empty">עדיין אין כרטיסים שהושלמו.</p>;
  }

  return (
    <div className="history-list">
      {completed.map((t) => (
        <div key={t.id} className="history-row" onClick={() => onOpenTask(t)}>
          <span className={`badge ${TYPE_BADGE_CLASS[t.type]}`}>{TYPE_LABELS[t.type]}</span>
          <span className="history-title">{t.title}</span>
          {t.assignee && <span className="history-assignee">👤 {t.assignee}</span>}
          <span className="history-date">{formatDateTime(t.completed_at)}</span>
        </div>
      ))}
    </div>
  );
}
