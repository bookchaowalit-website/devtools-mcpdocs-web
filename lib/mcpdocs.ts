// The MCP docs register: records kept in this browser (localStorage), plus pure helpers for the page.

export const LIFECYCLES = ["Draft", "Active", "Done"] as const;
export type Lifecycle = (typeof LIFECYCLES)[number];
export const FILTERS = ["All", ...LIFECYCLES] as const;
export type Filter = (typeof FILTERS)[number];

export type RecordItem = { id: string; title: string; body: string; status: Lifecycle };

export const STORAGE_KEY = "mcpdocs-v2";

export const SEED: RecordItem[] = [
  { id: "search_docs", title: "search_docs", body: "Full-text search over local MD", status: "Active" },
];

function isLifecycle(value: unknown): value is Lifecycle {
  return typeof value === "string" && (LIFECYCLES as readonly string[]).includes(value);
}

/** Parse stored records; drop malformed rows. Returns null when nothing usable is stored. */
export function parseRecords(raw: string | null): RecordItem[] | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(data)) return null;
  return data.flatMap((row): RecordItem[] => {
    if (!row || typeof row !== "object") return [];
    const { id, title, body, status } = row as Record<string, unknown>;
    if (typeof id !== "string" || typeof title !== "string") return [];
    return [{ id, title, body: typeof body === "string" ? body : "", status: isLifecycle(status) ? status : "Draft" }];
  });
}

export function serializeRecords(items: RecordItem[]): string {
  return JSON.stringify(items);
}

export function filterRecords(items: RecordItem[], filter: Filter, query: string): RecordItem[] {
  const needle = query.trim().toLowerCase();
  return items.filter(
    (item) =>
      (filter === "All" || item.status === filter) &&
      `${item.title} ${item.body} ${item.status}`.toLowerCase().includes(needle),
  );
}

/** Add a record at the top. A blank name is refused (returns the list unchanged). */
export function addRecord(
  items: RecordItem[],
  draft: { title: string; body: string; status: Lifecycle },
  makeId: () => string = () => Math.random().toString(36).slice(2, 9),
): RecordItem[] {
  const title = draft.title.trim();
  if (!title) return items;
  return [{ id: makeId(), title, body: draft.body.trim() || "No details added yet.", status: draft.status }, ...items];
}

export function removeRecord(items: RecordItem[], id: string): RecordItem[] {
  return items.filter((item) => item.id !== id);
}
