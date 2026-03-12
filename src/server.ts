#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerContentstackMcp } from "./register.js";

const server = new McpServer({
  name: "contentstack-app-mcp",
  version: "1.0.0",
  description: "Contentstack Marketplace App development toolkit. Use when the user wants to build, create, migrate, refactor, audit, or fix a Contentstack app, sidebar widget, custom field, dashboard widget, or full page app. Start with the cs_workflow prompt to get the full ordered workflow.",
});

registerContentstackMcp(server);

// Phase 2: API Tools (NOT registered yet)
// To activate Developer Hub integration:
// 1. Set CONTENTSTACK_MANAGEMENT_TOKEN in env config
// 2. import { apiTools } from "./tools/api/index.js"
// 3. Register each: for (const tool of apiTools) { server.tool(...) }

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((e) => {
  process.stderr.write(`Server startup error: ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
