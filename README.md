# Contentstack App MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/MCP-compatible-purple.svg)](https://modelcontextprotocol.io)

An [MCP](https://modelcontextprotocol.io) server that gives AI coding agents everything they need to build, migrate, and audit [Contentstack Marketplace](https://www.contentstack.com/marketplace) apps — correctly, every time.

## The Problem

AI agents writing Contentstack apps from scratch will:
- Hallucinate SDK methods that don't exist
- Skip Venus components and write raw HTML instead
- Hardcode API keys in frontend code
- Dump files flat without proper directory structure
- Miss manifest-to-route sync and security rules

This MCP server eliminates all of that by providing deterministic tools, structured knowledge, and a self-verifying workflow.

## Quick Start

### Option A: npx (recommended)

```bash
npx contentstack-app-mcp
```

### Option B: Clone and build

```bash
git clone https://github.com/abhishek305/contentstack-app-mcp.git
cd contentstack-app-mcp
npm install
npm run build
```

## Configure Your IDE

### Cursor

Add to `.cursor/mcp.json` in your project (or `~/.cursor/mcp.json` globally):

```json
{
  "mcpServers": {
    "contentstack-apps": {
      "command": "npx",
      "args": ["-y", "contentstack-app-mcp"]
    }
  }
}
```

Or if you cloned the repo:

```json
{
  "mcpServers": {
    "contentstack-apps": {
      "command": "node",
      "args": ["/absolute/path/to/contentstack-app-mcp/dist/server.js"]
    }
  }
}
```

Then copy the auto-trigger rule into your project:

```bash
cp contentstack-app-mcp/.cursor/rules/contentstack-mcp-workflow.mdc \
   your-project/.cursor/rules/contentstack-mcp-workflow.mdc
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "contentstack-apps": {
      "command": "npx",
      "args": ["-y", "contentstack-app-mcp"]
    }
  }
}
```

### Claude Code

The MCP config is the same as Claude Desktop. Additionally, copy the `CLAUDE.md` file from this repo into your project root for auto-triggering:

```bash
cp contentstack-app-mcp/CLAUDE.md your-project/CLAUDE.md
```

### Other IDEs (Codex CLI, Continue.dev, Aider, Windsurf)

Copy `AGENTS.md` from this repo into your project root:

```bash
cp contentstack-app-mcp/AGENTS.md your-project/AGENTS.md
```

This is a cross-tool standard that most AI coding assistants recognize.

### Remote (Vercel)

If the server is deployed remotely, use the URL-based config:

```json
{
  "mcpServers": {
    "contentstack-apps": {
      "url": "https://your-deployment.vercel.app/api/mcp"
    }
  }
}
```

See [GUIDE.md](GUIDE.md) for Vercel deployment instructions.

## What's Inside

### Resources (Knowledge)

| URI | What the AI Learns |
|---|---|
| `cs://locations` | All 10 UI location types — which to pick for any use case |
| `cs://sdk` | Correct SDK methods, hooks, initialization, frame management |
| `cs://patterns` | Venus component mapping with props and examples |
| `cs://manifest` | Exact manifest.json format for Developer Hub |
| `cs://security` | 4-tier security model — variables, mappings, permissions |
| `cs://maintenance` | Migration checklist and verification patterns |
| `cs://spec-schema` | JSON Schema for app specifications |

### Tools

| Tool | Purpose |
|---|---|
| `cs_preflight` | Validates app spec, infers security tier |
| `cs_plan` | Returns human-readable summary — waits for your approval |
| `cs_manifest` | Generates manifest.json |
| `cs_scaffold` | Generates full React app source (3 calls by category) |
| `cs_venus_resolve` | Maps UI needs to exact Venus components with JSX |
| `cs_verify` | Audits the project — returns fix instructions if anything's wrong |
| `cs_analyze` | Audits an existing app repo for issues |
| `cs_migrate` | Generates ordered migration plan from audit output |

### Prompts

| Prompt | Purpose |
|---|---|
| `cs_workflow` | Full create workflow — the AI's entry point |
| `cs_venus` | Returns Venus component JSX for a UI need |
| `cs_migrate_check` | Guides through analysis and migration |

## How It Works

```
 You type: "Build a sidebar widget for YouTube video picking"
                              │
                              ▼
 1.  AI reads cs://locations, cs://security, cs://patterns
 2.  AI drafts a structured spec
 3.  cs_preflight    → validates spec, infers security tier
 4.  cs_plan         → shows summary → YOU APPROVE
 5.  cs_manifest     → writes manifest.json
 6.  cs_scaffold ×3  → creates directories + writes all source files
 7.  cs_venus_resolve → resolves every UI element to Venus component
 8.  cs_verify       → audits project, AI fixes issues, repeats until clean
 9.  npm install && npm run build
10.  npm run dev
```

You only interact at step 4. Everything else is automated.

## Auto-Triggering

The MCP server is self-guiding — its tool descriptions tell any LLM the correct workflow order. This works on every platform.

For even stronger guidance, copy the appropriate rule file into your project:

| Your IDE | Copy This File |
|---|---|
| Cursor | `.cursor/rules/contentstack-mcp-workflow.mdc` |
| Claude Code | `CLAUDE.md` |
| Codex CLI / Continue.dev / Aider | `AGENTS.md` |

With these in place, prompts like "build a custom field", "migrate my app", or "audit this extension" trigger the full MCP workflow automatically.

## Limitations

- **Phase 2 API tools** (create/update/install apps in Developer Hub) are coded but not yet active
- **Knowledge files are static** — update and rebuild when SDK or Venus changes
- **Venus story files** require `@contentstack/venus-components` in workspace or `node_modules` for `cs_venus_resolve` to read Storybook examples
- **No auth on remote** — if you deploy to Vercel, secure it yourself

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

[MIT](LICENSE)
