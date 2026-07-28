import type { Comment, Task, TaskStatus } from "./types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  getTasks: () => request<Task[]>("/api/tasks"),

  createTask: (data: { title: string; description?: string; assignee?: string; createdBy: string }) =>
    request<Task>("/api/tasks", { method: "POST", body: JSON.stringify(data) }),

  updateTask: (
    id: number,
    data: Partial<{ title: string; description: string; status: TaskStatus; assignee: string }>
  ) => request<Task>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteTask: (id: number) => request<void>(`/api/tasks/${id}`, { method: "DELETE" }),

  getComments: (taskId: number) => request<Comment[]>(`/api/tasks/${taskId}/comments`),

  addComment: (taskId: number, data: { author: string; text: string }) =>
    request<Comment>(`/api/tasks/${taskId}/comments`, { method: "POST", body: JSON.stringify(data) }),
};
