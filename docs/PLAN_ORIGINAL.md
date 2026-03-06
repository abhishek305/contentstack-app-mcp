# Unified Contentstack App MCP — Execution Plan

## Architecture Overview

```mermaid
flowchart TD
  subgraph server [server.ts — stdio transport]
    reg[Registration]
  end

  subgraph generation [Generation Tools - Phase 1, always active]
    T1[cs_preflight]
    T2[cs_plan]
    T3[cs_manifest]
    T4[cs_scaffold]
    T5[cs_analyze]
    T6[cs_migrate]
  end

  subgraph api [API Tools - Phase 2, code written but NOT registered yet]
    A1[cs_create_app]
    A2[cs_update_app]
    A3[cs_get_app]
    A4[cs_install_app]
    A5[cs_delete_app]
    A6[cs_get_org]
    A7[cs_get_stacks]
    A8[cs_get_stack]
  end

  subgraph resources [Resources - fetched on demand]
    R1[cs://locations]
    R2[cs://sdk]
    R3[cs://patterns]
    R4[cs://manifest]
    R5[cs://security]
    R6[cs://maintenance]
    R7[cs://spec-schema]
  end

  reg --> generation
  server --> resources
  api -.->|"deferred — Phase 2 integration"| reg
```

## Project Location

New folder: `contentstack-app-mcp/`

---

## Critical Design Principle: Tools Are Deterministic TypeScript, Not AI

MCP tools are TypeScript functions — they validate, transform, and return structured data. They do NOT interpret natural language or infer from intent. That is the LLM agent's job.

**Correct flow:**

1. LLM reads `cs://locations` resource → understands location types
2. LLM drafts a structured spec from user's natural language request
3. LLM calls `cs_preflight({ spec })` → tool validates the spec
4. LLM calls `cs_plan({ spec })` → tool returns confirmation prompt
5. LLM shows confirmation to user, waits for approval
6. LLM calls `cs_manifest({ spec })` → generates manifest
7. LLM calls `cs_scaffold({ spec, category })` 3 times — "infrastructure", "routing", "locations" — writes returned files to disk each time

Tool descriptions are instructions TO the LLM about what to do before/after calling. The tool code itself only validates + transforms.

---

## Phase 1 — Project Scaffold

### `package.json`

```json
{
  "name": "contentstack-app-mcp",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/server.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "tsx watch src/server.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "1.27.1",
    "zod": "^3.25",
    "@cfworker/json-schema": "^4.1.1"
  },
  "devDependencies": {
    "typescript": "^5",
    "tsx": "latest",
    "@types/node": "latest"
  }
}
```

### Folder Structure

```
contentstack-app-mcp/
├── src/
│   ├── server.ts
│   ├── tools/
│   │   ├── generation/
│   │   │   ├── index.ts
│   │   │   ├── preflight.ts
│   │   │   ├── plan.ts
│   │   │   ├── manifest.ts
│   │   │   ├── scaffold.ts
│   │   │   ├── analyze.ts
│   │   │   └── migrate.ts
│   │   └── api/                   # code-only, NOT registered in Phase 1
│   │       ├── apiClient.ts
│   │       ├── create-app.ts
│   │       ├── update-app.ts
│   │       ├── get-app.ts
│   │       ├── install-app.ts
│   │       ├── delete-app.ts
│   │       ├── get-org.ts
│   │       ├── get-stacks.ts
│   │       └── get-stack.ts
│   ├── prompts/
│   │   ├── index.ts
│   │   ├── venus.ts               # cs_venus
│   │   ├── workflow.ts            # cs_workflow
│   │   └── migrate-check.ts       # cs_migrate_check
│   └── resources/
│       └── loader.ts
├── knowledge/
│   ├── locations.md               # cs://locations
│   ├── sdk.md                     # cs://sdk
│   ├── patterns.md                # cs://patterns (full Venus reference)
│   ├── manifest.md                # cs://manifest
│   ├── security.md                # cs://security
│   ├── maintenance.md             # cs://maintenance
│   └── spec-schema.json           # cs://spec-schema
├── .gitignore
├── package.json
└── tsconfig.json
```

---

## Phase 2 — Knowledge Files

All 7 files are markdown/JSON, read at runtime from `knowledge/`. No recompile needed to update them.

### `knowledge/locations.md` → `cs://locations`

Each of 10 location types includes:

- `manifest_type` string (e.g., `cs.cm.stack.custom_field`)
- Route path (e.g., `/custom-field`)
- SDK location key (e.g., `location.CustomField`)
- Available SDK interface (`{ entry, field, fieldConfig, frame, stack }`)
- Field-level constraints — `cbModal` ban on CustomField

### `knowledge/sdk.md` → `cs://sdk`

SDK capabilities, inline picker pattern, FieldModifier frame API.

### `knowledge/patterns.md` → `cs://patterns`

Venus component reference, `@ts-ignore` pattern, hooks.

### `knowledge/manifest.md` → `cs://manifest`

Developer Hub manifest format, advanced_settings configuration.

### `knowledge/security.md` → `cs://security`

4-tier security model, permissions, API key management.

### `knowledge/maintenance.md` → `cs://maintenance`

Migration checklist, analysis rules, verification patterns.

### `knowledge/spec-schema.json` → `cs://spec-schema`

JSON schema for validating app specifications.

---

## Phase 4 — Generation Tools

### `cs_preflight`

Validates a structured spec and infers security tier + permissions.

- Input: `{ spec: object }`
- Output: `{ valid: boolean, errors: string[], warnings: string[], security_tier: 1|2|3, inferred_permissions: string[], needs_app_config: boolean }`

### `cs_plan`

Stateless confirmation gate — validates spec and returns confirmation_prompt.

- Input: `{ spec: object }`
- Output: `{ success, confirmation_prompt, security_tier, warnings }`

### `cs_manifest`

Generates manifest.json from spec.

- Input: `{ spec: object, base_url?: string }`
- Output: `{ manifest: object }`

### `cs_scaffold`

Generates source files by category.

- Input: `{ spec: object, category: "infrastructure" | "routing" | "locations" }`
- Output: `{ category: string, files: [{ path: string, content: string }] }`

### `cs_analyze`

Audits an existing repo against Contentstack best practices.

- Input: `{ repo_path: string }`
- Output: analysis object with issues, structure_type, versions

### `cs_migrate`

Generates ordered migration plan from cs_analyze output.

- Input: `{ analysis: object }`
- Output: `{ do_not_change: string[], steps: MigrationStep[] }`

---

## Phase 5 — API Tools (Code Only — NOT Registered)

> **Deferred:** These tools will be integrated in a future phase when Developer Hub API integration is evaluated.

| Tool             | Method | Endpoint                          |
| ---------------- | ------ | --------------------------------- |
| `cs_create_app`  | POST   | `/manifests`                      |
| `cs_update_app`  | PUT    | `/manifests/{app_uid}`            |
| `cs_get_app`     | GET    | `/manifests/{app_uid}`            |
| `cs_install_app` | POST   | `/manifests/{app_uid}/install`    |
| `cs_delete_app`  | DELETE | `/manifests/{app_uid}`            |
| `cs_get_org`     | GET    | `/organizations/{org_uid}`        |
| `cs_get_stacks`  | GET    | `/organizations/{org_uid}/stacks` |
| `cs_get_stack`   | GET    | `/stacks/{stack_api_key}`         |

---

## End-to-End Workflow

```mermaid
flowchart LR
  subgraph newApp [New App Workflow]
    N1[cs_preflight] --> N2[cs_plan]
    N2 -->|"user approves"| N3[cs_manifest]
    N3 --> N4[cs_scaffold]
    N4 -->|"agent writes files"| N5[npm install and dev]
  end

  subgraph existingApp [Existing App Workflow]
    E1[cs_analyze] -->|"show findings"| E2[cs_migrate]
    E2 -->|"execute steps"| E3[verify build]
  end
```
