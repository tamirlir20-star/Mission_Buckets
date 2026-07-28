import { Router } from "express";
import { db } from "../db.js";

export const tasksRouter = Router();

const VALID_STATUSES = new Set(["todo", "in_progress", "done"]);

interface TaskRow {
  id: number;
  title: string;
  description: string;
  status: string;
  assignee: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

tasksRouter.get("/", (_req, res) => {
  const tasks = db.prepare("SELECT * FROM tasks ORDER BY created_at ASC").all();
  res.json(tasks);
});

tasksRouter.post("/", (req, res) => {
  const { title, description = "", assignee = "", createdBy = "" } = req.body ?? {};
  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  const result = db
    .prepare(
      "INSERT INTO tasks (title, description, assignee, created_by) VALUES (?, ?, ?, ?)"
    )
    .run(title.trim(), description, assignee, createdBy);

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(task);
});

tasksRouter.patch("/:id", (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as
    | TaskRow
    | undefined;
  if (!existing) {
    res.status(404).json({ error: "task not found" });
    return;
  }

  const { title, description, status, assignee } = req.body ?? {};

  if (status !== undefined && !VALID_STATUSES.has(status)) {
    res.status(400).json({ error: "invalid status" });
    return;
  }

  const next = {
    title: typeof title === "string" && title.trim() ? title.trim() : existing.title,
    description: typeof description === "string" ? description : existing.description,
    status: typeof status === "string" ? status : existing.status,
    assignee: typeof assignee === "string" ? assignee : existing.assignee,
  };

  db.prepare(
    "UPDATE tasks SET title = ?, description = ?, status = ?, assignee = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(next.title, next.description, next.status, next.assignee, id);

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  res.json(task);
});

tasksRouter.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  if (result.changes === 0) {
    res.status(404).json({ error: "task not found" });
    return;
  }
  res.status(204).end();
});

tasksRouter.get("/:id/comments", (req, res) => {
  const id = Number(req.params.id);
  const comments = db
    .prepare("SELECT * FROM comments WHERE task_id = ? ORDER BY created_at ASC")
    .all(id);
  res.json(comments);
});

tasksRouter.post("/:id/comments", (req, res) => {
  const id = Number(req.params.id);
  const task = db.prepare("SELECT id FROM tasks WHERE id = ?").get(id);
  if (!task) {
    res.status(404).json({ error: "task not found" });
    return;
  }

  const { author, text } = req.body ?? {};
  if (typeof author !== "string" || !author.trim()) {
    res.status(400).json({ error: "author is required" });
    return;
  }
  if (typeof text !== "string" || !text.trim()) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  const result = db
    .prepare("INSERT INTO comments (task_id, author, text) VALUES (?, ?, ?)")
    .run(id, author.trim(), text.trim());

  const comment = db.prepare("SELECT * FROM comments WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(comment);
});
