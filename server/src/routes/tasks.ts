import { Router, type NextFunction, type Request, type Response } from "express";
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

type Handler = (req: Request, res: Response) => Promise<void>;
const wrap = (handler: Handler) => (req: Request, res: Response, next: NextFunction) => {
  handler(req, res).catch(next);
};

tasksRouter.get(
  "/",
  wrap(async (_req, res) => {
    const result = await db.execute("SELECT * FROM tasks ORDER BY created_at ASC");
    res.json(result.rows);
  })
);

tasksRouter.post(
  "/",
  wrap(async (req, res) => {
    const { title, description = "", assignee = "", createdBy = "" } = req.body ?? {};
    if (typeof title !== "string" || !title.trim()) {
      res.status(400).json({ error: "title is required" });
      return;
    }

    const result = await db.execute({
      sql: "INSERT INTO tasks (title, description, assignee, created_by) VALUES (?, ?, ?, ?)",
      args: [title.trim(), description, assignee, createdBy],
    });

    const task = await db.execute({
      sql: "SELECT * FROM tasks WHERE id = ?",
      args: [Number(result.lastInsertRowid)],
    });
    res.status(201).json(task.rows[0]);
  })
);

tasksRouter.patch(
  "/:id",
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const existingResult = await db.execute({ sql: "SELECT * FROM tasks WHERE id = ?", args: [id] });
    const existing = existingResult.rows[0] as unknown as TaskRow | undefined;
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

    await db.execute({
      sql: "UPDATE tasks SET title = ?, description = ?, status = ?, assignee = ?, updated_at = datetime('now') WHERE id = ?",
      args: [next.title, next.description, next.status, next.assignee, id],
    });

    const task = await db.execute({ sql: "SELECT * FROM tasks WHERE id = ?", args: [id] });
    res.json(task.rows[0]);
  })
);

tasksRouter.delete(
  "/:id",
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const result = await db.execute({ sql: "DELETE FROM tasks WHERE id = ?", args: [id] });
    if (result.rowsAffected === 0) {
      res.status(404).json({ error: "task not found" });
      return;
    }
    res.status(204).end();
  })
);

tasksRouter.get(
  "/:id/comments",
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const result = await db.execute({
      sql: "SELECT * FROM comments WHERE task_id = ? ORDER BY created_at ASC",
      args: [id],
    });
    res.json(result.rows);
  })
);

tasksRouter.post(
  "/:id/comments",
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    const taskResult = await db.execute({ sql: "SELECT id FROM tasks WHERE id = ?", args: [id] });
    if (taskResult.rows.length === 0) {
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

    const result = await db.execute({
      sql: "INSERT INTO comments (task_id, author, text) VALUES (?, ?, ?)",
      args: [id, author.trim(), text.trim()],
    });

    const comment = await db.execute({
      sql: "SELECT * FROM comments WHERE id = ?",
      args: [Number(result.lastInsertRowid)],
    });
    res.status(201).json(comment.rows[0]);
  })
);
