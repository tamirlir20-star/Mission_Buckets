import { useState } from "react";

export function NameGate({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onSubmit(trimmed);
  }

  return (
    <div className="name-gate">
      <form onSubmit={handleSubmit} className="name-gate-form">
        <h1>לוח משימות - פרויקט המשחק</h1>
        <p>מה השם שלך?</p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="לדוגמה: דני"
        />
        <button type="submit" disabled={!name.trim()}>
          כניסה
        </button>
      </form>
    </div>
  );
}
