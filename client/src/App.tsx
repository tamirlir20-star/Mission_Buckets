import { Board } from "./components/Board";
import { NameGate } from "./components/NameGate";
import { useUsername } from "./useUsername";

export function App() {
  const { username, setUsername, clearUsername } = useUsername();

  if (!username) {
    return <NameGate onSubmit={setUsername} />;
  }

  return <Board username={username} onSwitchUser={clearUsername} />;
}
