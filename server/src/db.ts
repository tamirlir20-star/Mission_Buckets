import "dotenv/config";
import { createClient } from "@libsql/client";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localDbPath = path.join(__dirname, "..", "data.sqlite");

const url = process.env.TURSO_DATABASE_URL ?? `file:${localDbPath}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = createClient(authToken ? { url, authToken } : { url });

await db.execute("PRAGMA foreign_keys = ON");

await db.executeMultiple(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    type TEXT NOT NULL DEFAULT 'task' CHECK (type IN ('top_goal', 'milestone', 'task')),
    parent_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    assignee TEXT NOT NULL DEFAULT '',
    created_by TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
`);

// Migration for databases created before `type`/`parent_id` existed (local files and the
// already-deployed Turso database both predate this schema). Must run before the
// parent_id index below, since that column may not exist yet on older databases.
const tableInfo = await db.execute("PRAGMA table_info(tasks)");
const existingColumns = new Set(tableInfo.rows.map((row) => row.name as string));
if (!existingColumns.has("type")) {
  await db.execute("ALTER TABLE tasks ADD COLUMN type TEXT NOT NULL DEFAULT 'task'");
}
if (!existingColumns.has("parent_id")) {
  await db.execute(
    "ALTER TABLE tasks ADD COLUMN parent_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL"
  );
}
if (!existingColumns.has("completed_at")) {
  await db.execute("ALTER TABLE tasks ADD COLUMN completed_at TEXT");
  // Backfill: anything already sitting in 'done' predates this column, so we can't know
  // the real completion time — use updated_at as the best available approximation.
  await db.execute("UPDATE tasks SET completed_at = updated_at WHERE status = 'done'");
}

await db.execute("CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id)");
