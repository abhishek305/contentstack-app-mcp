# Contentstack App Development

When the user asks to:
- build, create, develop, generate, or scaffold a Contentstack app, marketplace app, UI extension, custom field, sidebar widget, dashboard widget, full page app, or any Contentstack location-based component
- migrate, refactor, upgrade, convert, or modernize an existing Contentstack app
- update, fix, audit, analyze, or check a Contentstack app for issues

## Creating a new app — use the contentstack-apps MCP tools in this order:

1. Read `cs://locations` — understand all UI location types before choosing one
2. Read `cs://security` — determine correct security tier for external APIs
3. Read `cs://patterns` — understand Venus components before writing any UI code
4. Draft a structured spec from the user's intent
5. Call `cs_preflight({ spec })` — validate the spec
6. Call `cs_plan({ spec })` — get confirmation_prompt, show it to the user, WAIT for approval
7. After approval: call `cs_manifest({ spec })` — generate manifest.json, write to disk
8. For each scaffold category (infrastructure, routing, locations):
   a. Call `cs_scaffold({ spec, category })`
   b. Create ALL directories from the returned `directories` array FIRST
   c. Then write ALL files from the returned `files` array
9. Call `cs_venus_resolve({ ui_elements: [...] })` for the UI elements needed in the app
   - Update location components to use resolved Venus components
   - Use the `combined_import` (includes @ts-ignore)
10. Call `cs_verify({ project_path })` to audit the generated project
    - If `passed` is false: fix each issue in `fix_instructions`, then call `cs_verify` again
    - Repeat until all checks pass
11. Run `npm install && npm run build` — fix errors if build fails
12. Only after successful build: `npm run dev`

## Migrating or auditing an existing app:

1. Call `cs_analyze({ repo_path })` — audit the repo
2. Show findings to user grouped by severity
3. Call `cs_migrate({ analysis })` — get ordered migration steps
4. Execute steps one at a time, verify build passes after each

## Rules:
- NEVER write Contentstack app code from scratch without going through cs_preflight first
- NEVER dump files without creating directories first — always use the `directories` array from cs_scaffold
- NEVER use raw fetch() or axios() — always use callProxyApi() from useApi() hook
- NEVER use Venus components without the @ts-ignore import comment
- NEVER use cbModal inside a Custom Field location
- NEVER skip cs_verify — always verify before running npm install
- ALWAYS call cs_venus_resolve before writing or customizing UI code
- ALWAYS use Venus components (cs://patterns) for all standard UI elements
- ALWAYS run npm run build before npm run dev — fix TypeScript errors first
