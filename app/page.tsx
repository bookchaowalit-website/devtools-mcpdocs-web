"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { createLocalStore } from "@/lib/local-store";
import {
  FILTERS,
  LIFECYCLES,
  SEED,
  STORAGE_KEY,
  addRecord as addTo,
  filterRecords,
  parseRecords,
  removeRecord,
  serializeRecords,
  type Filter,
  type Lifecycle,
} from "@/lib/mcpdocs";

const store = createLocalStore({ key: STORAGE_KEY, seed: SEED, parse: parseRecords, serialize: serializeRecords });

export default function Home() {
  const items = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Filter>("All");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [draftStatus, setDraftStatus] = useState<Lifecycle>("Draft");

  const visible = useMemo(() => filterRecords(items, status, query), [items, query, status]);

  function addRecord() {
    if (!title.trim()) return;
    store.update((current) => addTo(current, { title, body, status: draftStatus }));
    setTitle(""); setBody(""); setDraftStatus("Draft");
  }

  return (
    <main className="protocol-shell">
      <header className="protocol-topbar"><Link href="/" className="protocol-mark">SCHEMA / LOG</Link><span>local MCP documentation bench</span><span>{items.length} records</span></header>
      <section className="protocol-hero"><div><h1>Make the contract<br /><em>legible.</em></h1><p>A small local register for tools, schemas, and the decisions around them. Write the shape down before the call is made.</p></div><div className="protocol-glyph" aria-hidden="true"><span>∷</span><i /><b>JSON<br />RPC</b></div></section>
      <section className="protocol-controls"><label><span>⌕</span><input aria-label="Search MCP docs" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records" /></label><div>{FILTERS.map((item) => <button type="button" aria-pressed={status === item} className={status === item ? "active" : ""} key={item} onClick={() => setStatus(item)}>{item}</button>)}</div></section>
      <section className="protocol-workbench"><form className="entry-sheet" onSubmit={(event) => { event.preventDefault(); addRecord(); }}><div className="sheet-head"><span>01 / New record</span><span>local only</span></div><h2>Describe a tool.</h2><p>Keep the name stable. Let the details explain what a caller can expect.</p><label><span>Tool or schema name</span><input aria-label="Tool or schema name" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. search_docs" /></label><label><span>Details</span><textarea aria-label="Details" value={body} onChange={(event) => setBody(event.target.value)} placeholder="What does it accept and return?" /></label><label><span>Lifecycle</span><select aria-label="Lifecycle" value={draftStatus} onChange={(event) => setDraftStatus(event.target.value as Lifecycle)}>{LIFECYCLES.map((item) => <option key={item}>{item}</option>)}</select></label><button className="record-button" type="submit">Add to register <b>↗</b></button></form><div className="record-sheet"><div className="sheet-head"><span>02 / Register</span><span>{visible.length} visible</span></div>{visible.length ? <div className="record-list">{visible.map((item, index) => <article className="record-row" key={item.id}><div className="record-index">{String(index + 1).padStart(2, "0")}</div><div><h3>{item.title}</h3><p>{item.body}</p></div><div className={`record-status ${item.status.toLowerCase()}`}>{item.status}</div><button className="delete-record" aria-label={`Delete ${item.title}`} type="button" onClick={() => store.update((current) => removeRecord(current, item.id))}>×</button></article>)}</div> : <div className="record-empty">No record matches this query.</div>}</div></section>
      <footer className="protocol-footer"><span>BOOKCHAOWALIT / MCP DOCS</span><span>STATE STAYS IN THIS BROWSER · NO HOSTED REGISTRY</span></footer>
    </main>
  );
}
