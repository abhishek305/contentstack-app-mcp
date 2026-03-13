# Contentstack App MCP — User Guide

A complete guide to setting up and using the Contentstack App Development MCP Server.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Connecting to Your IDE](#connecting-to-your-ide)
4. [Your First App](#your-first-app)
5. [Migrating an Existing App](#migrating-an-existing-app)
6. [Remote Deployment (Hosted URL)](#remote-deployment-hosted-url)
7. [Tools Reference](#tools-reference)
8. [Resources Reference](#resources-reference)
9. [Prompts Reference](#prompts-reference)
10. [Limitations and Known Issues](#limitations-and-known-issues)
11. [FAQ](#faq)
12. [Updating the Knowledge Base](#updating-the-knowledge-base)

---

## Prerequisites

- **Node.js 18+** — [download](https://nodejs.org) (not required if using the hosted URL)
- **An MCP-compatible IDE** — any of the following:
  - [Cursor](https://cursor.com)
  - [Claude Desktop](https://claude.ai/download)
  - [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
  - [Windsurf](https://codeium.com/windsurf)
  - [Codex CLI](https://github.com/openai/codex)
  - [Continue.dev](https://continue.dev)
  - [Aider](https://aider.chat)

---

## Installation

### Option A: Hosted URL (easiest — no install)

A hosted version of the MCP server is available. No Node.js, no cloning, no build step — just paste a URL into your IDE config. See [Connecting to Your IDE](#connecting-to-your-ide) for the exact config.

### Option B: npx (local, no install)

The server is available as an npm package. Your MCP host will start it automatically — no manual installation needed. Just configure your IDE (see next section).

### Option C: Clone and build (local)

```bash
git clone https://github.com/abhishek305/contentstack-app-mcp.git
cd contentstack-app-mcp
npm install
npm run build
```

The compiled server is at `dist/server.js`.

---

## Connecting to Your IDE

### Cursor

1. Open your project in Cursor
2. Create `.cursor/mcp.json` in your project root (or edit `~/.cursor/mcp.json` for global)

**Remote (recommended — no Node.js needed):**

```json
{
  "mcpServers": {
    "contentstack-apps": {
      "url": "https://contentstack-app-mcp-remote.contentstackapps.com/api/mcp"
    }
  }
}
```

**Local (npx):**

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

**Local (cloned repo):**

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

3. (Optional) Copy the auto-trigger rule into your project for stronger workflow enforcement:

```bash
mkdir -p your-project/.cursor/rules
cp contentstack-app-mcp/.cursor/rules/contentstack-mcp-workflow.mdc \
   your-project/.cursor/rules/contentstack-mcp-workflow.mdc
```

4. Restart Cursor
5. Open Settings > Tools & MCP — you should see `contentstack-apps` listed

### Claude Desktop

1. Open Claude Desktop
2. Go to Settings > Developer > Edit Config

**macOS** — file is at `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows** — file is at `%APPDATA%\Claude\claude_desktop_config.json`

**Remote (recommended):**

```json
{
  "mcpServers": {
    "contentstack-apps": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://contentstack-app-mcp-remote.contentstackapps.com/api/mcp"]
    }
  }
}
```

> `mcp-remote` bridges Streamable HTTP to stdio for Claude Desktop.

**Local:**

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

3. Fully restart Claude Desktop (quit and reopen)

### Claude Code

Configure the MCP server using any of the approaches above (remote URL or local). Additionally, copy the `CLAUDE.md` template into your project root for auto-triggering:

```bash
cp contentstack-app-mcp/docs/templates/CLAUDE.md your-project/CLAUDE.md
```

### Other IDEs (Codex CLI, Continue.dev, Aider, Windsurf)

1. Configure the MCP server according to your IDE's documentation — use the remote URL or local approach
2. Copy the `AGENTS.md` template into your project root:

```bash
cp contentstack-app-mcp/docs/templates/AGENTS.md your-project/AGENTS.md
```

`AGENTS.md` is a cross-tool standard supported by most AI coding assistants.

---

## Your First App

Once the MCP server is connected, try this in your AI chat:

> Create a Contentstack dashboard widget that shows a list of recent entries with their status

Here's what happens behind the scenes:

1. **Research** — the AI reads `cs://locations`, `cs://security`, and `cs://patterns` to understand available locations, security requirements, and Venus components
2. **Spec drafting** — the AI creates a structured specification from your prompt
3. **Validation** — `cs_preflight` validates the spec and infers the security tier
4. **Confirmation** — `cs_plan` returns a plain-English summary. The AI shows it to you and waits for your approval
5. **Manifest** — after you approve, `cs_manifest` generates `manifest.json`
6. **Scaffolding** — `cs_scaffold` generates all source files in three batches (infrastructure, routing, locations), creating the directory structure first
7. **Venus resolution** — `cs_venus_resolve` maps UI needs (tables, buttons, loading states) to exact Venus component imports and JSX
8. **Verification** — `cs_verify` audits the project for 8 categories of issues. If anything fails, the AI fixes it and re-verifies
9. **Build and run** — `npm install && npm run build`, then `npm run dev`

You should see a working app at `http://localhost:3000`.

### Other examples to try

- "Build a sidebar widget that lets users pick YouTube videos and save the URL to the entry"
- "Create a custom field for color selection with a preview"
- "Build a full page app that searches photos from an API and displays them in a grid"

---

## Migrating an Existing App

If you have an existing Contentstack app that needs updating:

> Audit my app at ./my-contentstack-app for issues

This triggers:

1. **Analysis** — `cs_analyze` scans the repo for SDK patterns, Venus usage, security issues, manifest problems, and structural issues
2. **Review** — the AI shows findings grouped by severity (errors, warnings, info)
3. **Migration plan** — `cs_migrate` generates ordered, safe migration steps
4. **Execution** — the AI applies changes one at a time, verifying the build passes after each

You can also use more specific prompts:

- "Migrate my app to use Venus components"
- "Fix the security issues in my marketplace app"
- "Refactor my app to follow the boilerplate structure"

---

## Remote Deployment (Hosted URL)

The MCP server can be deployed remotely so your team doesn't need local Node.js. Anyone with the URL just adds one line to their IDE config.

A ready-to-deploy wrapper project is available at [contentstack-app-mcp-remote](https://github.com/abhishek305/contentstack-app-mcp-remote). It's a minimal Next.js app with a single API route that serves the MCP server over HTTP.

### Deploy to Contentstack Launch

1. Go to **Contentstack** > **Launch** > **+ New Project** > **Import from GitHub**
2. Select the `contentstack-app-mcp-remote` repo
3. Configure:

| Setting | Value |
|---|---|
| Framework | Next.js |
| Build command | `npm install && npm run build` |
| Output directory | `.next` |
| Node.js version | 20 |

4. Click **Deploy**

Your MCP endpoint will be at: `https://<your-launch-url>/api/mcp`

### Deploy to Vercel

```bash
git clone https://github.com/abhishek305/contentstack-app-mcp-remote.git
cd contentstack-app-mcp-remote
npm install
npx vercel deploy
```

Your MCP endpoint will be at: `https://<your-vercel-url>/api/mcp`

### Use the hosted URL

Once deployed, share this config with your team:

**Cursor** (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "contentstack-apps": {
      "url": "https://<your-hosted-url>/api/mcp"
    }
  }
}
```

**Claude Desktop** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "contentstack-apps": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://<your-hosted-url>/api/mcp"]
    }
  }
}
```

### How the remote wrapper works

The wrapper project contains a single Next.js API route that imports `registerContentstackMcp` from this package and serves it via [mcp-handler](https://github.com/vercel/mcp-handler) over Streamable HTTP. Same tools, same knowledge, same workflow — just over HTTP instead of stdio.

> **Note:** The default deployment has no authentication. For production, use `mcp-handler`'s `withMcpAuth` for OAuth, or Launch's password protection feature.

---

## Tools Reference

### cs_preflight

Validates a structured app spec and infers the security tier.

- **Input:** `{ spec: object }`
- **Output:** `{ valid, errors, warnings, security_tier, inferred_permissions, needs_app_config }`
- **When:** Step 3 of the create workflow — after drafting spec, before `cs_plan`

### cs_plan

Stateless confirmation gate. Returns a human-readable summary for user approval.

- **Input:** `{ spec: object }`
- **Output:** `{ success, confirmation_prompt, security_tier, warnings }`
- **When:** Step 4 — after `cs_preflight`. Show `confirmation_prompt` to user, wait for approval

### cs_manifest

Generates `manifest.json` in Developer Hub format.

- **Input:** `{ spec: object, base_url?: string }`
- **Output:** `{ manifest: object }` — write to disk as `manifest.json`
- **When:** Step 5 — after user approves the plan

### cs_scaffold

Generates source files by category with directory structure.

- **Input:** `{ spec: object, category: "infrastructure" | "routing" | "locations" }`
- **Output:** `{ category, directories: string[], files: [{ path, content }] }`
- **When:** Steps 6a-6c — call 3 times after `cs_manifest`. Create directories first, then write files

### cs_venus_resolve

Maps UI element names to exact Venus component names, props, imports, and usage examples.

- **Input:** `{ ui_elements: string[], project_path?: string }`
- **Output:** `{ resolutions: VenusResolution[], combined_import: string }`
- **When:** Step 7 — after scaffold, before `cs_verify`

### cs_verify

Post-generation audit. Checks 8 categories: directory structure, file completeness, manifest-route sync, Venus compliance, `@ts-ignore` imports, no raw fetch, SDK init location, no hardcoded keys.

- **Input:** `{ project_path: string }`
- **Output:** `{ passed: boolean, checks: CheckResult[], fix_instructions: string[] }`
- **When:** Step 8 — after writing all files. Repeat until `passed` is `true`

### cs_analyze

Audits an existing Contentstack app repo against best practices.

- **Input:** `{ repo_path: string }`
- **Output:** `{ structure_type, framework, sdk_version, venus_version, issues[], migration_needed }`
- **When:** Migration workflow step 1

### cs_migrate

Generates an ordered migration plan from `cs_analyze` output. Returns instructions only — does not modify files.

- **Input:** `{ analysis: object }` (output of `cs_analyze`)
- **Output:** `{ do_not_change: string[], steps: [...] }`
- **When:** Migration workflow step 2

---

## Resources Reference

| URI | Description |
|---|---|
| `cs://locations` | All 10 UI location types with manifest strings, SDK interfaces, route paths |
| `cs://sdk` | App SDK capabilities, initialization patterns, frame management |
| `cs://patterns` | Venus component mapping, boilerplate structure, hooks |
| `cs://manifest` | Developer Hub manifest format, `advanced_settings` configuration |
| `cs://security` | 4-tier security model, permissions, API key management |
| `cs://maintenance` | Migration checklist, analysis rules, verification patterns |
| `cs://spec-schema` | JSON schema for validating app specifications |

---

## Prompts Reference

| Prompt | Description |
|---|---|
| `cs_workflow` | Entry point — returns the full ordered create workflow for the given intent |
| `cs_venus` | Returns correct Venus component JSX for a described UI need |
| `cs_migrate_check` | Guides through analysis and migration of an existing app |

---

## Limitations and Known Issues

1. **Phase 2 API tools are coded but not active.** Eight Developer Hub API tools (`cs_create_app`, `cs_update_app`, `cs_install_app`, etc.) are implemented in the source but not registered in the server. They will let the AI create and manage apps directly in Developer Hub without a browser.

2. **Knowledge files are static.** If Contentstack updates the App SDK or Venus component library, the knowledge files in `knowledge/` must be manually updated and the server rebuilt.

3. **Venus story file reading has requirements.** `cs_venus_resolve` can read Storybook `*.stories.tsx` files for detailed prop examples, but only if `@contentstack/venus-components` is installed in the workspace (`node_modules`) or available as a source directory.

4. **stdio transport requires local Node.js.** The default local setup runs the server as a process. For teams without Node.js, use the hosted URL or deploy your own instance (see [Remote Deployment](#remote-deployment-hosted-url)).

5. **No authentication on remote deployments.** If you deploy to Vercel or Launch, you must add your own auth layer. The server does not include authentication out of the box.

6. **Tool descriptions guide LLM behavior.** The server is self-guiding through its tool descriptions and the `cs_workflow` prompt. Most LLMs follow them correctly, but rule files (`docs/templates/CLAUDE.md`, `docs/templates/AGENTS.md`, `.cursor/rules/`) — copied into user projects — provide stronger enforcement.

---

## FAQ

**Q: Does this work with VS Code?**
A: VS Code does not natively support MCP. Use Cursor (VS Code fork with MCP support), or install an MCP-compatible extension like Continue.dev.

**Q: Does it work with GPT / ChatGPT?**
A: Only if your client supports MCP. ChatGPT web does not support MCP. Codex CLI with GPT models does support MCP.

**Q: Why stdio instead of HTTP?**
A: stdio is the simplest, most portable MCP transport — no HTTP server, no port management, no auth needed. For remote access, use the hosted URL or deploy your own instance to Launch or Vercel (see [Remote Deployment](#remote-deployment-hosted-url)).

**Q: Can I use this without an AI agent?**
A: The MCP server is designed to be consumed by AI agents, not used directly. You can test it with the [MCP Inspector](https://github.com/modelcontextprotocol/inspector).

**Q: How do I add support for a new Venus component?**
A: Edit `knowledge/patterns.md` to add the component's props and example JSX, and optionally add it to the `VENUS_REGISTRY` in `src/tools/generation/venus-resolve.ts`. Then rebuild.

**Q: What if the AI ignores the MCP tools?**
A: Copy the appropriate template into your project root (`.cursor/rules/contentstack-mcp-workflow.mdc` for Cursor, `docs/templates/CLAUDE.md` for Claude Code, `docs/templates/AGENTS.md` for others). These explicitly instruct the AI to use the MCP tools.

---

## Updating the Knowledge Base

When the Contentstack SDK or Venus component library updates:

1. Edit the relevant file in `knowledge/` (e.g., `sdk.md`, `patterns.md`)
2. Update the version header at the top of the file:
   ```
   <!-- knowledge-version: 1.1 | sdk: @contentstack/app-sdk@2.x | ... -->
   ```
3. Rebuild: `npm run build`
4. Restart the MCP server in your IDE (Cursor: Command Palette > "Restart MCP Server")

`cs_analyze` automatically warns when the SDK version installed in a project doesn't match the knowledge file version.
