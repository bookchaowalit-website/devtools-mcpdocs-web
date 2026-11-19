"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { AppFoot, AppTop, ListButton, Pill, PlusIcon, type Tone } from "@/components/app-shell";
import { createLocalStore } from "@/lib/local-store";
import {
  FILTERS,
  LIFECYCLES,
  SEED,
  STORAGE_KEY,
  addRecord as addTo,
  filterRecords,
  parseRecords,
  restoreRecord,
  serializeRecords,
  type Filter,
  type Lifecycle,
  type RecordItem,
} from "@/lib/mcpdocs";

const store = createLocalStore({ key: STORAGE_KEY, seed: SEED, parse: parseRecords, serialize: serializeRecords });

const TONE: Record<Lifecycle, Tone> = { Draft: "amber", Active: "green", Done: "grey" };
const EMPTY = { title: "", body: "", status: "Draft" as Lifecycle };

// nextShown / prevShown: the rows shown around it when it was removed, for putting focus back nearby.
type RemovedEntry = { item: RecordItem; beforeId: string | null; nextShown?: string; prevShown?: string };
type RemovedBatch = { items: RemovedEntry[]; viaKeyboard: boolean };
const removedLabel = (items: RemovedEntry[]) => (items.length === 1 ? `Removed “${items[0].item.title}”` : `Removed ${items.length} records`);

// The row shows one line of detail (App shell rule); a long one gets Show more to read it in full.
function RecordDetail({ body }: { body: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const [clipped, setClipped] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => { if (el.dataset.expanded !== "true") setClipped(el.scrollWidth > el.clientWidth); };
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    observer?.observe(el);
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    let live = true;
    fonts?.ready?.then(() => { if (live) measure(); });
    return () => {
      live = false;
      observer?.disconnect();
    };
  }, [body]);
  const long = expanded || clipped || body.includes("\n");
  return (
    <>
      <p ref={ref} id={id} className="as-row-detail" data-expanded={expanded ? "true" : undefined}>{body}</p>
      {long ? (
        <button type="button" className="as-plain as-row-more" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </>
  );
}

export default function Home() {
  const records = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState(EMPTY);
  // Every removal still inside the Undo window: one Undo puts them all back where they were.
  const [removed, setRemovedState] = useState<RemovedBatch | null>(null);
  const removedRef = useRef<RemovedBatch | null>(null);
  const setRemoved = (batch: RemovedBatch | null) => { removedRef.current = batch; setRemovedState(batch); };
  const [toastFocused, setToastFocused] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const newRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const wasComposing = useRef(false);
  const visible = useMemo(() => filterRecords(records, filter, query), [records, filter, query]);
  const countOf = (value: Filter) => (value === "All" ? records.length : records.filter((r) => r.status === value).length);

  // Opening the composer focuses its name field; closing it returns focus to New record.
  useEffect(() => {
    if (composing) titleRef.current?.focus();
    else if (wasComposing.current) newRef.current?.focus();
    wasComposing.current = composing;
  }, [composing]);
  useEffect(() => { if (removed?.viaKeyboard) undoRef.current?.focus(); }, [removed]);
  // When the toast closes, focus goes back near the removed row: the first of these rows still shown, else New record.
  const focusRowsNext = useRef<string[] | null>(null);
  useEffect(() => {
    const ids = focusRowsNext.current;
    if (removed || !ids) return;
    focusRowsNext.current = null;
    const rows = [...document.querySelectorAll<HTMLElement>(".as-row[data-record]")];
    const row = ids.map((id) => rows.find((entry) => entry.dataset.record === id)).find(Boolean);
    (row?.querySelector<HTMLButtonElement>(".as-danger") ?? newRef.current ?? titleRef.current)?.focus();
  }, [removed, records]);
  // While the toast shows, reserve its height at the bottom of the page and in scroll-padding.
  const toastShown = removed !== null;
  useLayoutEffect(() => {
    const toast = toastRef.current;
    if (!toastShown || !toast) return;
    const rootStyle = document.documentElement.style;
    const reserve = () => rootStyle.setProperty("--as-toast-space", `${toast.offsetHeight + 32}px`);
    reserve();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(reserve) : null;
    observer?.observe(toast);
    return () => { observer?.disconnect(); rootStyle.removeProperty("--as-toast-space"); };
  }, [toastShown]);
  // The toast closes 6 s after the latest removal, but never while it holds focus.
  useEffect(() => {
    if (!removed || toastFocused) return;
    const timer = window.setTimeout(() => { removedRef.current = null; setRemovedState(null); }, 6000);
    return () => window.clearTimeout(timer);
  }, [removed, toastFocused]);

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    store.update((current) => addTo(current, draft));
    // Show the new record: its own list, and no search that might hide it.
    if (filter !== "All" && filter !== draft.status) setFilter(draft.status);
    setQuery("");
    setAnnouncement(`Added “${draft.title.trim()}”.`);
    setDraft(EMPTY);
    setComposing(false);
  }
  function clearSearch() {
    setQuery("");
    searchRef.current?.focus();
  }
  function remove(record: RecordItem, viaKeyboard: boolean) {
    let entry: RemovedEntry | undefined;
    store.update((current) => {
      const index = current.findIndex((item) => item.id === record.id);
      if (index < 0) return current;
      entry = { item: current[index], beforeId: current[index + 1]?.id ?? null };
      return current.filter((item) => item.id !== record.id);
    });
    if (!entry) return;
    const shownAt = visible.findIndex((item) => item.id === record.id);
    entry.nextShown = visible[shownAt + 1]?.id;
    entry.prevShown = shownAt > 0 ? visible[shownAt - 1].id : undefined;
    const items = [...(removedRef.current?.items ?? []), entry];
    setRemoved({ items, viaKeyboard });
    setAnnouncement(`${removedLabel(items)}. Undo is available for a few seconds.`);
  }
  function closeToast(focusIds?: string[]) {
    const last = removedRef.current?.items.at(-1);
    focusRowsNext.current = focusIds ?? [last?.nextShown, last?.prevShown].filter((id): id is string => Boolean(id));
    setRemoved(null);
    setToastFocused(false);
  }
  function undo() {
    const items = removedRef.current?.items;
    if (!items?.length) return;
    // Latest removal first, so each record goes back before the row that followed it at the time.
    store.update((current) => items.reduceRight((list, { item, beforeId }) => restoreRecord(list, item, beforeId), current));
    setAnnouncement(items.length === 1 ? `Restored “${items[0].item.title}”.` : `Restored ${items.length} records.`);
    closeToast([items[items.length - 1].item.id]);
  }

  const title = filter === "All" ? "All records" : filter;
  const trimmed = query.trim();

  return (
    <div className="as">
      <a className="as-skip" href="#main">Skip to content</a>
      <AppTop name="MCP Docs" tagline="Write the contract down first" />

      <div className="as-body">
        <aside className="as-side" aria-label="Lists">
          <h2>Lifecycle</h2>
          <ul className="as-lists">
            {FILTERS.map((value) => (
              <ListButton key={value} label={value === "All" ? "All records" : value} count={countOf(value)} tone={value === "All" ? undefined : TONE[value]} current={filter === value} onSelect={() => setFilter(value)} />
            ))}
          </ul>
        </aside>

        <main id="main" className="as-main">
          <div className="as-head">
            <div>
              <h1>{title}</h1>
              <p aria-live="polite">{visible.length} {visible.length === 1 ? "record" : "records"}{trimmed ? ` matching “${trimmed}”` : ""}</p>
            </div>
            <div className="as-tools">
              <label className="as-search">
                <span className="as-sr">Search records</span>
                <input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" />
              </label>
              {composing ? null : <button ref={newRef} type="button" className="as-button" onClick={() => setComposing(true)}><PlusIcon />New record</button>}
            </div>
          </div>

          {composing ? (
            <form className="as-composer" onSubmit={add} aria-label="New record">
              <label className="as-field">Tool or schema name
                <input ref={titleRef} className="md-mono" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="e.g. search_docs" autoComplete="off" spellCheck={false} />
              </label>
              <label className="as-field">Details
                <textarea value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} placeholder="What does it accept and return?" />
              </label>
              <div className="as-composer-foot">
                <div className="as-segmented-wrap">
                  <span id="lifecycle-label">Lifecycle</span>
                  <div className="as-segmented" role="group" aria-labelledby="lifecycle-label">
                    {LIFECYCLES.map((status) => (
                      <button key={status} type="button" aria-pressed={draft.status === status} onClick={() => setDraft({ ...draft, status })}>{status}</button>
                    ))}
                  </div>
                </div>
                <div className="as-composer-actions">
                  <button type="button" className="as-plain" onClick={() => { setComposing(false); setDraft(EMPTY); }}>Cancel</button>
                  <button type="submit" className="as-button" disabled={!draft.title.trim()}>Add</button>
                </div>
              </div>
            </form>
          ) : null}

          {visible.length ? (
            <ul className="as-list" aria-label={title}>
              {visible.map((record) => (
                <li className="as-row" key={record.id} data-record={record.id}>
                  <div>
                    <h3 className="md-mono">{record.title}</h3>
                    <RecordDetail body={record.body} />
                  </div>
                  <Pill tone={TONE[record.status]}>{record.status}</Pill>
                  <button type="button" className="as-plain as-danger" aria-label={`Remove ${record.title}`} onClick={(event) => remove(record, event.detail === 0)}>Remove</button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="as-list as-empty">
              {trimmed ? (
                <>
                  <strong>Nothing matches</strong>
                  No record in {filter === "All" ? "the register" : title} mentions “{trimmed}”.
                  <div className="md-empty-actions">
                    <button type="button" className="as-plain" onClick={clearSearch}>Clear search</button>
                    {filter !== "All" ? <button type="button" className="as-plain" onClick={() => setFilter("All")}>Show all records</button> : null}
                  </div>
                </>
              ) : records.length === 0 ? (
                <><strong>No records yet</strong>Press New record to describe your first tool or schema.</>
              ) : (
                <><strong>Nothing in {title}</strong>No record is {title.toLowerCase()} yet. Press New record and pick {title} as its lifecycle.</>
              )}
            </div>
          )}

          <p className="as-note">Records are saved in this browser only: no hosted registry, account or sync. Clearing site data removes them.</p>
        </main>
      </div>

      <p className="as-sr" role="status" aria-live="polite">{announcement}</p>
      {removed ? (
        <div
          ref={toastRef}
          className="as-toast"
          role="group"
          aria-label="Undo remove"
          onFocus={() => setToastFocused(true)}
          onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setToastFocused(false); }}
          onKeyDown={(event) => { if (event.key === "Escape") closeToast(); }}
        >
          <span>{removedLabel(removed.items)}</span>
          <button ref={undoRef} type="button" className="as-plain" onClick={undo} aria-label={removed.items.length === 1 ? "Undo remove" : `Undo remove of ${removed.items.length} records`}>Undo</button>
        </div>
      ) : null}

      <AppFoot source="https://github.com/bookchaowalit-website/devtools-mcpdocs-web" />
    </div>
  );
}
