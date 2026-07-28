import { useState } from "react";

const STORAGE_KEY = "task-board-username";

export function useUsername() {
  const [username, setUsernameState] = useState(() => localStorage.getItem(STORAGE_KEY) ?? "");

  function setUsername(name: string) {
    localStorage.setItem(STORAGE_KEY, name);
    setUsernameState(name);
  }

  function clearUsername() {
    localStorage.removeItem(STORAGE_KEY);
    setUsernameState("");
  }

  return { username, setUsername, clearUsername };
}
