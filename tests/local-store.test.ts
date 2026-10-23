import { describe, expect, it, vi } from "vitest";
import { createLocalStore } from "@/lib/local-store";

function memory(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return { data, getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => void (data[k] = v) };
}

const parse = (raw: string | null) => (raw ? (JSON.parse(raw) as string[]) : null);

describe("createLocalStore", () => {
  it("serves the seed on the server and before anything is stored", () => {
    const store = createLocalStore({ key: "k", seed: ["seed"], parse, serialize: JSON.stringify, storage: () => memory() });
    expect(store.getServerSnapshot()).toEqual(["seed"]);
    expect(store.getSnapshot()).toEqual(["seed"]);
  });

  it("reads stored data once and returns a stable snapshot", () => {
    const mem = memory({ k: '["saved"]' });
    const store = createLocalStore({ key: "k", seed: [], parse, serialize: JSON.stringify, storage: () => mem });
    const first = store.getSnapshot();
    expect(first).toEqual(["saved"]);
    expect(store.getSnapshot()).toBe(first);
  });

  it("writes updates through, notifies subscribers and stops after unsubscribe", () => {
    const mem = memory();
    const store = createLocalStore({ key: "k", seed: ["a"], parse, serialize: JSON.stringify, storage: () => mem });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.update((cur) => [...cur, "b"]);
    expect(store.getSnapshot()).toEqual(["a", "b"]);
    expect(mem.data.k).toBe('["a","b"]');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.update((cur) => cur.slice(1));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("falls back to the seed and memory when storage throws", () => {
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("quota"); } };
    const store = createLocalStore({ key: "k", seed: ["seed"], parse, serialize: JSON.stringify, storage: () => broken });
    expect(store.getSnapshot()).toEqual(["seed"]);
    store.update(() => ["kept"]);
    expect(store.getSnapshot()).toEqual(["kept"]);
  });

  it("works without a window (server)", () => {
    const store = createLocalStore({ key: "k", seed: ["seed"], parse, serialize: JSON.stringify });
    expect(store.getSnapshot()).toEqual(["seed"]);
  });
});
