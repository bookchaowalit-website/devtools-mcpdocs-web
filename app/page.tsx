"use client";

import { useEffect, useMemo, useState } from "react";

type RecordItem = { id: string; title: string; body: string; status: string };
const SEED: RecordItem[] = [{ id: "search_docs", title: "search_docs", body: "Full-text search over local MD", status: "Stable" }];
const statuses = ["All", "Draft", "Active", "Done"];

function makeId() { return Math.random().toString(36).slice(2, 9); }

export default function Home() {
  const [items, setItems] = useState<RecordItem[]>(SEED);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [draftStatus, setDraftStatus] = useState("Draft");

  useEffect(() => { try { const saved = localStorage.getItem("mcpdocs-v2"); if (saved) setItems(JSON.parse(saved) as RecordItem[]); } catch { /* optional local state */ } }, []);
  useEffect(() => { localStorage.setItem("mcpdocs-v2", JSON.stringify(items)); }, [items]);
  const visible = useMemo(() => items.filter((item) => (status === "All" || item.status === status) && `${item.title} ${item.body} ${item.status}`.toLowerCase().includes(query.toLowerCase())), [items, query, status]);

  function addRecord() {
    if (!title.trim()) return;
    setItems((current) => [{ id: makeId(), title: title.trim(), body: body.trim() || "No details added yet.", status: draftStatus }, ...current]);
    setTitle(""); setBody(""); setDraftStatus("Draft");
  }

  return (
    <main className="protocol-shell">
      <header className="protocol-topbar"><a href="/" className="protocol-mark">SCHEMA / LOG</a><span>local MCP documentation bench</span><span>{items.length} records</span></header>
      <section className="protocol-hero"><div><h1>Make the contract<br /><em>legible.</em></h1><p>A small local register for tools, schemas, and the decisions around them. Write the shape down before the call is made.</p></div><div className="protocol-glyph" aria-hidden="true"><span>∷</span><i /><b>JSON<br />RPC</b></div></section>
      <section className="protocol-controls"><label><span>⌕</span><input aria-label="Search MCP docs" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records" /></label><div>{statuses.map((item) => <button className={status === item ? "active" : ""} key={item} onClick={() => setStatus(item)}>{item}</button>)}</div></section>
      <section className="protocol-workbench"><form className="entry-sheet" onSubmit={(event) => { event.preventDefault(); addRecord(); }}><div className="sheet-head"><span>01 / New record</span><span>local only</span></div><h2>Describe a tool.</h2><p>Keep the name stable. Let the details explain what a caller can expect.</p><label><span>Tool or schema name</span><input aria-label="Tool or schema name" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. search_docs" /></label><label><span>Details</span><textarea aria-label="Details" value={body} onChange={(event) => setBody(event.target.value)} placeholder="What does it accept and return?" /></label><label><span>Lifecycle</span><select aria-label="Lifecycle" value={draftStatus} onChange={(event) => setDraftStatus(event.target.value)}><option>Draft</option><option>Active</option><option>Done</option></select></label><button className="record-button" type="submit">Add to register <b>↗</b></button></form><div className="record-sheet"><div className="sheet-head"><span>02 / Register</span><span>{visible.length} visible</span></div>{visible.length ? <div className="record-list">{visible.map((item, index) => <article className="record-row" key={item.id}><div className="record-index">{String(index + 1).padStart(2, "0")}</div><div><h3>{item.title}</h3><p>{item.body}</p></div><div className={`record-status ${item.status.toLowerCase()}`}>{item.status}</div><button className="delete-record" aria-label={`Delete ${item.title}`} onClick={() => setItems((current) => current.filter((record) => record.id !== item.id))}>×</button></article>)}</div> : <div className="record-empty">No record matches this query.</div>}</div></section>
      <footer className="protocol-footer"><span>BOOKCHAOWALIT / MCP DOCS</span><span>STATE STAYS IN THIS BROWSER · NO HOSTED REGISTRY</span></footer>
    </main>
  );
}
