// Static MCP reference notes served by /api/mcp. Short authored summaries, not the official specification.

export const SECTIONS = {
  overview: { title: "Model Context Protocol (MCP) - Overview", content: "MCP is an open protocol that enables AI applications to connect to external data sources and tools." },
  architecture: { title: "MCP Architecture", content: "MCP uses a client-server model with JSON-RPC 2.0 as the base protocol." },
  protocol: { title: "MCP Protocol Specification", content: "All MCP messages use JSON-RPC 2.0 format with standard methods like initialize, tools/list, and tools/call." },
  "best-practices": { title: "MCP Best Practices", content: "Keep tools focused, provide clear descriptions, handle errors gracefully, and validate all inputs." },
  security: { title: "MCP Security Guide", content: "Always use HTTPS, implement authentication, validate inputs, and use rate limiting to protect your server." },
} as const;
export type SectionId = keyof typeof SECTIONS;

export const GUIDES = {
  "claude-desktop": { title: "Integrating MCP with Claude Desktop", content: "Edit the Claude Desktop config file and add your server configuration." },
  "web-app": { title: "Integrating MCP with Web Applications", content: "Deploy your MCP server as an HTTP endpoint and make fetch requests to it." },
  server: { title: "Building MCP Servers", content: "Implement the required methods: initialize, tools/list, and tools/call." },
  custom: { title: "Custom MCP Integrations", content: "Build custom integrations using the MCP protocol specification." },
} as const;
export type GuideId = keyof typeof GUIDES;

export const SEARCH_INDEX = [
  { title: "JSON-RPC 2.0", section: "protocol", content: "The base protocol used by MCP" },
  { title: "Tools", section: "protocol", content: "Functions that can be called on servers" },
  { title: "Resources", section: "protocol", content: "Data sources exposed by servers" },
  { title: "Authentication", section: "security", content: "API keys, OAuth, JWT for MCP" },
  { title: "Transport Layer", section: "architecture", content: "HTTP, WebSocket, stdio transports" },
  { title: "Claude Desktop", section: "integration", content: "Integrating MCP with Claude Desktop" },
  { title: "Best Practices", section: "best-practices", content: "Server design and performance tips" },
  { title: "Error Handling", section: "best-practices", content: "Graceful error handling in MCP" },
  { title: "Rate Limiting", section: "security", content: "Protecting servers from abuse" },
];

export function isSection(value: unknown): value is SectionId {
  return typeof value === "string" && Object.hasOwn(SECTIONS, value);
}

export function isGuide(value: unknown): value is GuideId {
  return typeof value === "string" && Object.hasOwn(GUIDES, value);
}

export function searchReference(query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return SEARCH_INDEX.filter((item) =>
    [item.title, item.content, item.section].some((field) => field.toLowerCase().includes(needle)),
  );
}
