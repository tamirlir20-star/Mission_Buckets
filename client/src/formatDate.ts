// SQLite datetime('now') returns UTC without a timezone marker (e.g. "2026-07-29 06:03:43"),
// so we mark it as UTC explicitly before handing it to Date, otherwise browsers disagree
// on how to interpret the bare string.
export function formatDateTime(value: string): string {
  const iso = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  return new Date(iso).toLocaleString("he-IL", { dateStyle: "medium", timeStyle: "short" });
}

export function formatDate(value: string): string {
  const iso = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  return new Date(iso).toLocaleDateString("he-IL", { dateStyle: "short" });
}
