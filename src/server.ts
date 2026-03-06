import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { listResourceUris, readResource, resourceMimeType, RESOURCE_METADATA } from "./resources/loader.js";
import { generationTools } from "./tools/generation/index.js";
import { prompts } from "./prompts/index.js";

const server = new McpServer({
  name: "contentstack-app-mcp",
  version: "1.0.0",
});

// --- Resources (7 knowledge files) ---
for (const uri of listResourceUris()) {
  const meta = RESOURCE_METADATA[uri];
  server.resource(
    meta.name,
    uri,
    { description: meta.description, mimeType: resourceMimeType(uri) },
    async (resourceUri) => {
      const content = readResource(resourceUri.href);
      if (!content) {
        return {
          contents: [{
            uri: resourceUri.href,
            mimeType: resourceMimeType(resourceUri.href),
            text: `Resource not found: ${resourceUri.href}`,
          }],
        };
      }
      return {
        contents: [{
          uri: resourceUri.href,
          mimeType: resourceMimeType(resourceUri.href),
          text: content,
        }],
      };
    }
  );
}

// --- Generation Tools (8 tools, always active) ---
// Tool handlers return arbitrary objects; we wrap them in MCP content format here
for (const tool of generationTools) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handler = tool.handler as (args: any) => Promise<unknown>;
  server.tool(
    tool.name,
    tool.description,
    tool.schema.shape,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (args: any) => {
      const result = await handler(args);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );
}

// --- Prompts (3 prompts) ---
for (const prompt of prompts) {
  // All prompt arguments are strings — build a Zod shape of z.string()
  const argShape: Record<string, ReturnType<typeof z.string>> = prompt.arguments.reduce(
    (acc, arg) => {
      acc[arg.name] = z.string().describe(arg.description);
      return acc;
    },
    {} as Record<string, ReturnType<typeof z.string>>
  );

  server.prompt(
    prompt.name,
    prompt.description,
    argShape,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (args: any) => prompt.handler(args as Record<string, string>)
  );
}

// --- Phase 2: API Tools (NOT registered yet) ---
// To activate Developer Hub integration:
// 1. Set CONTENTSTACK_MANAGEMENT_TOKEN in ~/.cursor/mcp.json env block
// 2. import { apiTools } from "./tools/api/index.js"
// 3. Register each: for (const tool of apiTools) { server.tool(...) }

// --- Start ---
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((e) => {
  process.stderr.write(`Server startup error: ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
