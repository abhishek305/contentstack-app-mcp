# Contentstack App Development MCP Server

An MCP (Model Context Protocol) server that provides structured context and tooling to help AI agents consistently create, update, and migrate Contentstack Marketplace apps while following internal standards.

## Purpose

This MCP acts as the **single source of truth** for:

- App architecture and UI location types
- SDK integration patterns
- Entry data persistence
- Venus component usage
- Manifest standards
- Security tier requirements

The goal is to ensure reliable, consistent results regardless of IDE, agent framework, or LLM model.

## Features

### Resources (Knowledge)

| URI | Description |
|-----|-------------|
| `cs://locations` | All 10 UI location types with manifest strings, SDK interfaces, route paths |
| `cs://sdk` | App SDK capabilities, initialization patterns, frame management |
| `cs://patterns` | Venus component mapping, boilerplate structure, hooks |
| `cs://manifest` | Developer Hub manifest format, advanced_settings configuration |
| `cs://security` | 4-tier security model, permissions, API key management |
| `cs://maintenance` | Migration checklist, analysis rules, verification patterns |
| `cs://spec-schema` | JSON schema for validating app specifications |

### Tools (Generation)

| Tool | Description |
|------|-------------|
| `cs_preflight` | Validates a structured spec, infers security tier, checks cross-field rules |
| `cs_plan` | Stateless confirmation gate — validates spec, returns confirmation_prompt for user approval |
| `cs_manifest` | Generates manifest.json from spec |
| `cs_scaffold` | Generates source files by category (infrastructure, routing, locations) |
| `cs_analyze` | Audits an existing app repository for issues |
| `cs_migrate` | Generates ordered migration steps from analysis |

### Prompts

| Prompt | Description |
|--------|-------------|
| `cs_workflow` | Orchestrates full app creation workflow |
| `cs_venus` | Returns correct Venus component JSX for a UI need |
| `cs_migrate_check` | Guides through analysis and migration process |

## Installation

```bash
npm install
npm run build
```

## Configuration

Add to your MCP client configuration (e.g., `~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "contentstack-apps": {
      "command": "node",
      "args": ["/path/to/contentstack-app-mcp/dist/server.js"]
    }
  }
}
```

## Workflow

### Creating a New App

1. Agent reads `cs://locations`, `cs://security`, `cs://patterns` resources
2. Agent drafts a structured spec from user intent
3. `cs_preflight({ spec })` — validates the spec
4. `cs_plan({ spec })` — returns confirmation prompt for user approval
5. After approval: `cs_manifest({ spec })` — generates manifest.json
6. `cs_scaffold({ spec, category: "infrastructure" })` — generates base files
7. `cs_scaffold({ spec, category: "routing" })` — generates routing/hooks
8. `cs_scaffold({ spec, category: "locations" })` — generates location components

### Migrating an Existing App

1. `cs_analyze({ repo_path })` — audits the repository
2. Review findings grouped by severity
3. `cs_migrate({ analysis })` — generates ordered migration steps
4. Execute steps one at a time, verify build passes after each

## Auto-Triggering (Cursor)

Create `.cursor/rules/contentstack-mcp-workflow.mdc` with `alwaysApply: true` to automatically invoke the MCP workflow when users ask to "build an app", "create a sidebar widget", etc.

## Development

```bash
npm run build    # Compile TypeScript
npm run dev      # Watch mode (if configured)
```

## License

MIT
