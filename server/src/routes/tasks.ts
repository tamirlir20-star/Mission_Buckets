import { Router, type NextFunction, type Request, type Response } from "express";
import { db } from "../db.js";

export const tasksRouter = Router();

const VALID_STATUSES = new Set(["todo", "in_progress", "done"]);
const VALID_TYPES = new Set(["top_goal", "milestone", "task"]);

interface TaskRow {
  id: number;
  title: string;
  description: string;
  status: string;
  type: string;
  parent_id: number | null;
  assignee: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

type Handler = (req: Request, res: Response) => Promise<void>;
const wrap = (handler: Handler) => (req: Request, res: Response, next: NextFunction) => {
  handler(req, res).catch(next);
};

type ParentResolution = { ok: true; parentId: number | null } | { ok: false; error: string };

// Any card can be a sub-item of any other card (like nesting cards in Trello) — the only
// rules are that a card can't be its own parent, and reparenting can't create a cycle.
async function resolveParent(parentId: unknown, selfId?: number): Promise<ParentResolution> {
  if (parentId === null || parentId === undefined || parentId === "") {
    return { ok: true, parentId: null };
  }

  const id = Number(parentId);
  if (!Number.isInteger(id) || id === selfId) {
    return { ok: false, error: "invalid parent_id" };
  }

  const parentResult = await db.execute({ sql: "SELECT * FROM tasks WHERE id = ?", args: [id] });
  const parent = parentResult.rows[0] as unknown as TaskRow | undefined;
  if (!parent) {
    return { ok: false, error: "parent not found" };
  }

  if (selfId !== undefined) {
    // Walk up from the proposed parent toward the root; if we hit selfId, this
    // reparenting would make selfId a descendant of itself.
    let current: TaskRow | undefined = parent;
    const visited = new Set<number>();
    while (current && current.parent_id !== null) {
      if (current.parent_id === selfId) {
        return { ok: false, error: "would create a cycle" };
      }
      if (visited.has(current.parent_id)) break;
      visited.add(current.parent_id);
      const nextResult = await db.execute({
        sql: "SELECT * FROM tasks WHERE id = ?",
        args: [current.parent_id],
      });
      current = nextResult.rows[0] as unknown as TaskRow | undefined;
    }
  }

  return { ok: true, parentId: id };
}

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
    const {
      title,
      description = "",
      assignee = "",
      createdBy = "",
      type = "task",
      parentId = null,
    } = req.body ?? {};

    if (typeof title !== "string" || !title.trim()) {
      res.status(400).json({ error: "title is required" });
      return;
    }
    if (typeof type !== "string" || !VALID_TYPES.has(type)) {
      res.status(400).json({ error: "invalid type" });
      return;
    }

    const parentResolution = await resolveParent(parentId);
    if (!parentResolution.ok) {
      res.status(400).json({ error: parentResolution.error });
      return;
    }

    const result = await db.execute({
      sql: "INSERT INTO tasks (title, description, assignee, created_by, type, parent_id) VALUES (?, ?, ?, ?, ?, ?)",
      args: [title.trim(), description, assignee, createdBy, type, parentResolution.parentId],
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

    const { title, description, status, assignee, type, parentId } = req.body ?? {};

    if (status !== undefined && !VALID_STATUSES.has(status)) {
      res.status(400).json({ error: "invalid status" });
      return;
    }
    if (type !== undefined && !VALID_TYPES.has(type)) {
      res.status(400).json({ error: "invalid type" });
      return;
    }

    let nextParentId = existing.parent_id;
    if (parentId !== undefined) {
      const parentResolution = await resolveParent(parentId, id);
      if (!parentResolution.ok) {
        res.status(400).json({ error: parentResolution.error });
        return;
      }
      nextParentId = parentResolution.parentId;
    }

    const next = {
      title: typeof title === "string" && title.trim() ? title.trim() : existing.title,
      description: typeof description === "string" ? description : existing.description,
      status: typeof status === "string" ? status : existing.status,
      assignee: typeof assignee === "string" ? assignee : existing.assignee,
      type: typeof type === "string" ? type : existing.type,
      parentId: nextParentId,
    };

    await db.execute({
      sql: "UPDATE tasks SET title = ?, description = ?, status = ?, assignee = ?, type = ?, parent_id = ?, updated_at = datetime('now') WHERE id = ?",
      args: [next.title, next.description, next.status, next.assignee, next.type, next.parentId, id],
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
