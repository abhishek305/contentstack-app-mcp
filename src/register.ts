import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listResourceUris, readResource, resourceMimeType, RESOURCE_METADATA } from "./resources/loader.js";
import { generationTools } from "./tools/generation/index.js";
import { prompts } from "./prompts/index.js";

export function registerContentstackMcp(server: McpServer): void {
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

  for (const prompt of prompts) {
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
}
