import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import { TYPE_LABELS } from "../taskTypes";
import type { Task, TaskStatus, TaskType } from "../types";
import { Column } from "./Column";
import { NewTaskForm } from "./NewTaskForm";
import { TaskModal } from "./TaskModal";

const STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];
const FILTERS: (TaskType | "all")[] = ["all", "top_goal", "milestone", "task"];
const POLL_INTERVAL_MS = 4000;

export function Board({ username, onSwitchUser }: { username: string; onSwitchUser: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<TaskType | "all">("all");
  const isModalOpen = useRef(false);

  useEffect(() => {
    isModalOpen.current = selectedTask !== null;
  }, [selectedTask]);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const data = await api.getTasks();
        if (!cancelled) setTasks(data);
      } catch {
        // network hiccup - will retry on next poll
      }
    }

    refresh();
    const interval = setInterval(() => {
      if (!isModalOpen.current) refresh();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const tasksById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  const visibleTasks = filter === "all" ? tasks : tasks.filter((t) => t.type === filter);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const taskId = Number(active.id);
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    await api.updateTask(taskId, { status: newStatus });
  }

  function handleTaskUpdated(updated: Task) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  function handleTaskDeleted(taskId: number) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  function handleTaskCreated(task: Task) {
    setTasks((prev) => [...prev, task]);
  }

  return (
    <div className="board-page">
      <header className="board-header">
        <h1>לוח משימות - פרויקט המשחק</h1>
        <div className="board-header-right">
          <NewTaskForm username={username} tasks={tasks} onCreated={handleTaskCreated} />
          <span className="current-user">
            שלום, {username}{" "}
            <button className="link-button" onClick={onSwitchUser}>
              (החלף שם)
            </button>
          </span>
        </div>
      </header>

      <div className="filter-tabs">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-tab${filter === f ? " active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "הכל" : TYPE_LABELS[f]}
          </button>
        ))}
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="board">
          {STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={visibleTasks.filter((t) => t.status === status)}
              tasksById={tasksById}
              onOpenTask={setSelectedTask}
            />
          ))}
        </div>
      </DndContext>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          username={username}
          tasks={tasks}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
          onOpenTask={setSelectedTask}
        />
      )}
    </div>
  );
}
