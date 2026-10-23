import { describe, expect, it } from "vitest";
import { FILTERS, SEED, addRecord, filterRecords, parseRecords, removeRecord, serializeRecords, type RecordItem } from "@/lib/mcpdocs";

const rows: RecordItem[] = [
  { id: "a", title: "search_docs", body: "Full-text search", status: "Active" },
  { id: "b", title: "get_schema", body: "Returns a JSON schema", status: "Draft" },
  { id: "c", title: "old_tool", body: "Retired", status: "Done" },
];

describe("register logic", () => {
  it("every seed record is reachable through the filter for its own lifecycle", () => {
    // The seed used to say "Stable", which no filter or form option offers, so it vanished under every filter but All.
    for (const item of SEED) {
      const filter = FILTERS.find((f) => f === item.status);
      expect(filter, `no filter button for "${item.status}"`).toBeDefined();
      expect(filterRecords(SEED, filter!, "")).toContain(item);
    }
  });

  it("filters by lifecycle and searches name, details and status case-insensitively", () => {
    expect(filterRecords(rows, "Draft", "").map((r) => r.id)).toEqual(["b"]);
    expect(filterRecords(rows, "All", "SCHEMA").map((r) => r.id)).toEqual(["b"]);
    expect(filterRecords(rows, "All", "done").map((r) => r.id)).toEqual(["c"]);
    expect(filterRecords(rows, "Active", "schema")).toEqual([]);
  });

  it("adds a trimmed record on top and refuses a blank name", () => {
    const next = addRecord(rows, { title: "  list_tools ", body: "  ", status: "Draft" }, () => "new");
    expect(next[0]).toEqual({ id: "new", title: "list_tools", body: "No details added yet.", status: "Draft" });
    expect(next).toHaveLength(4);
    expect(addRecord(rows, { title: "   ", body: "x", status: "Done" })).toBe(rows);
  });

  it("removes a record by id", () => {
    expect(removeRecord(rows, "b").map((r) => r.id)).toEqual(["a", "c"]);
  });

  it("round-trips stored records and drops malformed rows", () => {
    expect(parseRecords(serializeRecords(rows))).toEqual(rows);
    expect(parseRecords(null)).toBeNull();
    expect(parseRecords("not json")).toBeNull();
    expect(parseRecords('{"a":1}')).toBeNull();
    expect(parseRecords('[null, {"id":1}, {"id":"x","title":"t","status":"Stable"}]')).toEqual([
      { id: "x", title: "t", body: "", status: "Draft" },
    ]);
  });
});
