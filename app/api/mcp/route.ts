import { NextResponse } from "next/server";
import { GUIDES, SECTIONS, isGuide, isSection, searchReference } from "@/lib/reference";

// Stateless JSON-RPC MCP endpoint over the static MCP reference notes in lib/reference.ts.
// The page's register lives in each visitor's browser, so the server cannot read it.

type RpcRequest = { id?: number | string | null; method?: string; params?: { name?: string; arguments?: Record<string, unknown> } };

const TOOLS = [
  {
    name: "get_protocol_docs",
    description: "Get a short MCP reference note by section",
    inputSchema: { type: "object", properties: { section: { type: "string", enum: Object.keys(SECTIONS) } } },
  },
  {
    name: "get_integration_guide",
    description: "Get a one-paragraph integration note for a platform",
    inputSchema: { type: "object", properties: { platform: { type: "string", enum: Object.keys(GUIDES) } } },
  },
  {
    name: "search_docs",
    description: "Search the reference notes by title, text or section",
    inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
  },
];

class RpcError extends Error {
  constructor(readonly code: number, message: string) {
    super(message);
  }
}

function callTool(name: string | undefined, args: Record<string, unknown> = {}) {
  switch (name) {
    case "get_protocol_docs": {
      const section = args.section ?? "overview";
      if (!isSection(section)) throw new RpcError(-32602, `Unknown section: ${String(section)}`);
      return { section, ...SECTIONS[section] };
    }
    case "get_integration_guide": {
      const platform = args.platform ?? "claude-desktop";
      if (!isGuide(platform)) throw new RpcError(-32602, `Unknown platform: ${String(platform)}`);
      return { platform, ...GUIDES[platform] };
    }
    case "search_docs": {
      if (typeof args.query !== "string" || !args.query.trim()) throw new RpcError(-32602, "query is required");
      const results = searchReference(args.query);
      return { query: args.query, count: results.length, results };
    }
    default:
      throw new RpcError(-32602, `Unknown tool: ${String(name)}`);
  }
}

export async function POST(request: Request) {
  let id: RpcRequest["id"] = null;
  try {
    const body = (await request.json()) as RpcRequest;
    id = body.id ?? null;
    let result: unknown;
    switch (body.method) {
      case "initialize":
        result = {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "MCP Docs", version: "1.0.0" },
        };
        break;
      case "tools/list":
        result = { tools: TOOLS };
        break;
      case "tools/call":
        result = callTool(body.params?.name, body.params?.arguments);
        break;
      default:
        throw new RpcError(-32601, `Unknown method: ${String(body.method)}`);
    }
    return NextResponse.json({ jsonrpc: "2.0", id, result });
  } catch (error) {
    const code = error instanceof RpcError ? error.code : -32700;
    const message = error instanceof RpcError ? error.message : "Parse error";
    return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } }, { status: 400 });
  }
}
