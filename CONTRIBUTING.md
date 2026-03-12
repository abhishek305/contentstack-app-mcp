# Contributing to Contentstack App MCP

Thanks for your interest in improving the Contentstack App Development MCP Server.

## Getting Started

```bash
git clone https://github.com/abhishek305/contentstack-app-mcp.git
cd contentstack-app-mcp
npm install
npm run build
```

## Development

```bash
npm run dev       # Watch mode — recompiles on changes
npm run build     # One-time compile
npm start         # Run the built server (stdio transport)
```

## Project Structure

```
src/
├── server.ts              # Entry point — stdio transport + MCP setup
├── register.ts            # Server registration (resources, tools, prompts)
├── resources/loader.ts    # Knowledge file loader
├── tools/generation/      # 8 generation tools (preflight, plan, scaffold, etc.)
├── tools/api/             # 8 API tools (Phase 2 — not yet active)
└── prompts/               # 3 workflow prompts
knowledge/                 # Markdown knowledge files served as MCP resources
```

## Making Changes

1. Create a branch from `main`
2. Make your changes in `src/`
3. Run `npm run build` and fix any TypeScript errors
4. Test by connecting the built server to Cursor or another MCP host
5. Open a pull request with a clear description of the change

## Knowledge Files

If you're updating SDK patterns, Venus components, or manifest formats:

1. Edit the relevant file in `knowledge/`
2. Update the version header at the top of the file
3. Rebuild: `npm run build`

## Guidelines

- Keep tool descriptions concise — LLMs read them on every invocation
- All tool handlers must return structured objects (wrapped in MCP content format by `server.ts`)
- Use `process.env` for secrets — never hardcode credentials
- Venus component examples should reference Storybook patterns from `@contentstack/venus-components`

## Reporting Issues

Open a GitHub issue with:

- What you expected to happen
- What actually happened
- Which MCP host you're using (Cursor, Claude Desktop, etc.)
- The tool or resource involved
