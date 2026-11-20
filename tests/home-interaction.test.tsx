// @vitest-environment happy-dom
import { act, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEY } from "@/lib/mcpdocs";

// Mounted tests for MCP Docs on the App shell: composer, lists, search, remove, undo and focus.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLDivElement;
const $ = <T extends Element = HTMLElement>(selector: string) => host.querySelector(selector) as T | null;
const button = (text: string, scope: ParentNode = host) => [...scope.querySelectorAll("button")].find((b) => b.textContent?.trim().startsWith(text)) as HTMLButtonElement;
const rows = () => [...host.querySelectorAll(".as-row h3")].map((h) => h.textContent);
const press = (el: Element, detail = 0) => act(() => { el.dispatchEvent(new MouseEvent("click", { bubbles: true, detail })); });
function type(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  act(() => {
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function mount(stored?: unknown) {
  localStorage.clear();
  if (stored !== undefined) localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  // The page keeps its store in module scope: a fresh import gives each test a fresh store.
  vi.resetModules();
  const Home = (await import("@/app/page")).default as ComponentType;
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root.render(<Home />));
}

beforeEach(async () => {
  await mount([
    { id: "a", title: "search_docs", body: "Full-text search over local MD", status: "Active" },
    { id: "b", title: "get_page", body: "Line one\nLine two", status: "Draft" },
    { id: "c", title: "old_tool", body: "Retired", status: "Done" },
  ]);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
});

describe("composer", () => {
  it("opens focused, keeps Add disabled without a name, adds on top, saves and returns focus", () => {
    press(button("New record"));
    expect(document.activeElement).toBe($(".as-composer input"));
    expect(button("Add", $(".as-composer")!).disabled).toBe(true);
    type($<HTMLInputElement>(".as-composer input")!, "list_tools");
    type($<HTMLTextAreaElement>(".as-composer textarea")!, "Returns every tool");
    press(button("Active", $(".as-composer")!));
    press(button("Add", $(".as-composer")!));
    expect(rows()[0]).toBe("list_tools");
    expect(document.activeElement?.textContent).toContain("New record");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)[0]).toMatchObject({ title: "list_tools", status: "Active" });
  });

  it("switches to the new record's list when added from another list, and Cancel clears the draft", () => {
    press(button("Done", $(".as-side")!));
    press(button("New record"));
    type($<HTMLInputElement>(".as-composer input")!, "draft_tool");
    press(button("Add", $(".as-composer")!));
    expect($("h1")!.textContent).toBe("Draft");
    expect(rows()).toContain("draft_tool");
    press(button("New record"));
    type($<HTMLInputElement>(".as-composer input")!, "never");
    press(button("Cancel", $(".as-composer")!));
    expect($(".as-composer")).toBeNull();
    press(button("New record"));
    expect($<HTMLInputElement>(".as-composer input")!.value).toBe("");
  });
});

describe("lists and search", () => {
  it("filters by lifecycle with counts, and shows a list-specific empty state", async () => {
    expect(button("All records", $(".as-side")!).textContent).toContain("3");
    press(button("Active", $(".as-side")!));
    expect(rows()).toEqual(["search_docs"]);
    act(() => root.unmount());
    host.remove();
    await mount([{ id: "a", title: "x", body: "y", status: "Active" }]);
    press(button("Done", $(".as-side")!));
    expect(host.textContent).toContain("Nothing in Done");
  });

  it("searches, and a no-match state offers Clear search (focus back in the field) and Show all", () => {
    press(button("Draft", $(".as-side")!));
    type($<HTMLInputElement>(".as-search input")!, "zzz");
    expect(host.textContent).toContain("Nothing matches");
    press(button("Show all records"));
    expect($("h1")!.textContent).toBe("All records");
    // The pressed button is gone; focus goes back to the search field with the query kept.
    expect(document.activeElement).toBe($(".as-search input"));
    expect($<HTMLInputElement>(".as-search input")!.value).toBe("zzz");
    press(button("Clear search"));
    expect(document.activeElement).toBe($(".as-search input"));
    expect(rows()).toHaveLength(3);
  });

  it("says so when the register is empty", async () => {
    act(() => root.unmount());
    host.remove();
    await mount([]);
    expect(host.textContent).toContain("No records yet");
  });

  it("offers Show more for a multi-line detail", () => {
    const more = button("Show more");
    press(more);
    expect(more.getAttribute("aria-expanded")).toBe("true");
    expect(button("Show less")).toBeTruthy();
  });
});

describe("remove and undo", () => {
  it("removes with a toast; Undo by keyboard restores the row in place and focuses its Remove", () => {
    press(host.querySelector('[aria-label="Remove get_page"]')!, 0);
    expect(rows()).toEqual(["search_docs", "old_tool"]);
    expect($(".as-toast")!.textContent).toContain("Removed “get_page”");
    expect(document.activeElement).toBe(button("Undo"));
    press(button("Undo"));
    expect(rows()).toEqual(["search_docs", "get_page", "old_tool"]);
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Remove get_page");
  });

  it("batches two removals into one Undo, and the toast closes after 6 s", () => {
    vi.useFakeTimers();
    press(host.querySelector('[aria-label="Remove search_docs"]')!, 1);
    press(host.querySelector('[aria-label="Remove get_page"]')!, 1);
    expect($(".as-toast")!.textContent).toContain("Removed 2 records");
    press(button("Undo"));
    expect(rows()).toEqual(["search_docs", "get_page", "old_tool"]);
    press(host.querySelector('[aria-label="Remove get_page"]')!, 1);
    act(() => { vi.advanceTimersByTime(6000); });
    expect($(".as-toast")).toBeNull();
    expect(rows()).toEqual(["search_docs", "old_tool"]);
  });

  it("Escape dismisses the toast", () => {
    press(host.querySelector('[aria-label="Remove old_tool"]')!, 0);
    act(() => { $(".as-toast")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
    expect($(".as-toast")).toBeNull();
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Remove get_page");
  });
});
