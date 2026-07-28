import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import type { Task, TaskStatus } from "../types";
import { Column } from "./Column";
import { NewTaskForm } from "./NewTaskForm";
import { TaskModal } from "./TaskModal";

const STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];
const POLL_INTERVAL_MS = 4000;

export function Board({ username, onSwitchUser }: { username: string; onSwitchUser: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
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
          <NewTaskForm username={username} onCreated={handleTaskCreated} />
          <span className="current-user">
            שלום, {username}{" "}
            <button className="link-button" onClick={onSwitchUser}>
              (החלף שם)
            </button>
          </span>
        </div>
      </header>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="board">
          {STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={tasks.filter((t) => t.status === status)}
              onOpenTask={setSelectedTask}
            />
          ))}
        </div>
      </DndContext>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          username={username}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
        />
      )}
    </div>
  );
}
