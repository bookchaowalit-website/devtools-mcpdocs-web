import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/mcp/route";

function rpc(body: unknown) {
  return POST(new Request("http://localhost/api/mcp", { method: "POST", body: JSON.stringify(body) }));
}

describe("MCP route", () => {
  it("echoes the JSON-RPC request id", async () => {
    const res = await rpc({ jsonrpc: "2.0", id: 7, method: "tools/list" });
    expect((await res.json()).id).toBe(7);
  });

  it("echoes the id on errors too, with the method-not-found code", async () => {
    const res = await rpc({ jsonrpc: "2.0", id: "abc", method: "resources/list" });
    const body = await res.json();
    expect(body.id).toBe("abc");
    expect(body.error.code).toBe(-32601);
  });

  it("rejects an unknown documentation section instead of answering the overview", async () => {
    const res = await rpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "get_protocol_docs", arguments: { section: "nope" } } });
    const body = await res.json();
    expect(body.error.code).toBe(-32602);
    expect(body.id).toBe(3);
  });

  it("initialize and tools/list describe only the three real tools", async () => {
    const init = await (await rpc({ jsonrpc: "2.0", id: 1, method: "initialize" })).json();
    expect(init.result.serverInfo.name).toBe("MCP Docs");
    const list = await (await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list" })).json();
    expect(list.result.tools.map((t: { name: string }) => t.name)).toEqual(["get_protocol_docs", "get_integration_guide", "search_docs"]);
  });

  it("get_protocol_docs and get_integration_guide answer from lib/reference", async () => {
    const docs = await (await rpc({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "get_protocol_docs", arguments: { section: "security" } } })).json();
    expect(docs.result.title).toBe("MCP Security Guide");
    const guide = await (await rpc({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "get_integration_guide" } })).json();
    expect(guide.result.platform).toBe("claude-desktop");
    const bad = await (await rpc({ jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "get_integration_guide", arguments: { platform: "toString" } } })).json();
    expect(bad.error.code).toBe(-32602);
  });

  it("search_docs filters the index and requires a query", async () => {
    const hit = await (await rpc({ jsonrpc: "2.0", id: 8, method: "tools/call", params: { name: "search_docs", arguments: { query: "SECURITY" } } })).json();
    expect(hit.result.results.map((r: { title: string }) => r.title)).toEqual(["Authentication", "Rate Limiting"]);
    const missing = await (await rpc({ jsonrpc: "2.0", id: 9, method: "tools/call", params: { name: "search_docs", arguments: {} } })).json();
    expect(missing.error.code).toBe(-32602);
  });

  it("rejects an unknown tool instead of pretending to call it", async () => {
    const res = await rpc({ jsonrpc: "2.0", id: 10, method: "tools/call", params: { name: "get_examples" } });
    expect((await res.json()).error.code).toBe(-32602);
  });

  it("answers a parse error for a body that is not JSON", async () => {
    const res = await POST(new Request("http://localhost/api/mcp", { method: "POST", body: "{" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe(-32700);
  });
});
