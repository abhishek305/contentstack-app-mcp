<!-- knowledge-version: 1.0 | sdk: @contentstack/app-sdk@2.x | venus: @contentstack/venus-components@3.0.3 | updated: 2026-03-06 -->

# Maintenance Guide — Analysis Checklist & Migration Rules

## cs_analyze Checklist

### package.json Checks

| Check | Severity | Rule |
|---|---|---|
| `@contentstack/app-sdk` version | WARNING | Compare against `knowledge-version` header. Flag if major version differs. |
| `@contentstack/venus-components` version | WARNING | Same — flag if major version differs. |
| Build tool: `vite` | INFO | Modern standard. No action needed. |
| Build tool: `react-scripts` | WARNING | CRA is outdated. Migration to Vite recommended. |
| React version < 18 | WARNING | React 18 is required for concurrent mode. |
| Missing `@contentstack/venus-components` | ERROR | All apps must use Venus for UI. |

### manifest.json Checks

| Check | Severity | Rule |
|---|---|---|
| All location `type` values are valid strings | ERROR | Must be one of 10 known `cs.cm.*` / `cs.org.*` strings. Unknown strings break the app. |
| Every declared `path` has a matching `<Route>` in App.tsx | ERROR | Missing route = blank screen when location loads. |
| `cs.cm.stack.field_modifier` has `allowed_types` | ERROR | Required field — missing causes runtime crash. |
| `advanced_settings.mappings` present without `cs.cm.stack.config` | ERROR | Mappings require an App Config page for key input. |
| `cs.cm.stack.custom_field` has `data_type` | ERROR | Required — missing causes content type schema errors. |
| `webhook.target_url` starts with `https://` | ERROR | HTTP webhooks are not accepted by Developer Hub. |
| `version` field not bumped on changes | WARNING | Should be bumped on every change (semantic versioning). |

### App.tsx / Routing Checks

| Check | Severity | Rule |
|---|---|---|
| Routes not wrapped in `React.lazy()` | WARNING | All location routes must be lazy-loaded. |
| Lazy routes not inside `<Suspense>` | WARNING | Missing Suspense causes unhandled errors during code-split loading. |
| Route paths without matching manifest entry | WARNING | Dead routes — no location will load them. |

### Source Code Scans (all .tsx, .ts, .jsx, .js)

| Pattern | Severity | Rule |
|---|---|---|
| `cbModal` in file co-located with CustomField provider | ERROR | cbModal in Custom Field causes iframe height bug + disconnected React root (value lost). |
| `fetch(` or `axios(` calls | ERROR | Never call external APIs directly. Use `callProxyApi()` from `useApi()`. |
| `import.*venus-components` without `@ts-ignore` above | WARNING | React 18 / Venus @types/react v17 conflict. Add @ts-ignore. |
| `ContentstackAppSDK.init()` outside MarketplaceAppProvider | ERROR | init() must only be called inside the provider. |
| String literals matching API key patterns (`sk-`, `AIzaSy`, `xoxb-`, `Bearer `) | ERROR | Hardcoded secrets in frontend code. Move to advanced_settings. |
| `stack.getEntries()` or `stack.getAssets()` calls | ERROR | These methods do NOT exist. Use ContentType chain / Asset chain. |
| `contentType.getSchema()` calls | ERROR | Does not exist. Schema is inside `contentType.getData()` response. |
| `organization.getStacks()` calls | ERROR | Does not exist. Use `stack.getAllStacks({ orgUid })`. |
| `frame.updateDimension()` called in CustomField context | WARNING | CustomField uses `frame.updateHeight()`. `updateDimension` is FieldModifier only. |

---

## Migration Order (Lowest Risk First)

Execute in this order. Verify build passes after each step before proceeding.

1. **dependencies** — Update package.json versions. Switch build tool if needed.
2. **structure** — Add missing folders, rename to boilerplate conventions.
3. **security** — Remove hardcoded keys, move to advanced_settings.
4. **manifest** — Fix location type strings, add missing locations, fix required fields.
5. **venus** — Replace raw HTML with Venus components, add @ts-ignore.

---

## Do-Not-Change Contract

When migrating an existing app, NEVER change:
- Rendered HTML structure (element types, nesting, className assignments)
- User-visible text, labels, and button copy
- User interactions and event handler behavior
- Stored data shapes — changing `data_type` in a Custom Field breaks all existing content
- Route paths that are already registered in Developer Hub
- Entry field UIDs used by the app

These changes require coordinated content migration and user notification — they are out of scope for a maintenance migration.

---

## Verification Commands (after each migration step)

```bash
# After dependencies step:
npm install && npm run build

# After security step:
grep -r "AIzaSy\|sk-\|xoxb-\|Bearer " src/ --include="*.ts" --include="*.tsx"
# → 0 results expected

# After manifest step:
# Run cs_preflight on the updated spec → valid: true expected

# After structure step:
npm run build
# → 0 TypeScript errors expected

# After venus step:
npm run build
# → 0 TypeScript errors from Venus imports expected
```

---

## Knowledge File Staleness Detection

The `cs_analyze` tool reads the `<!-- knowledge-version: ... -->` header in each knowledge file and compares the SDK and Venus versions listed there against the versions in the target repo's `package.json`.

If mismatch detected:
- Log as WARNING in analysis output (`knowledge_version_match: false`)
- Note which versions differ
- Suggest updating knowledge files before trusting migration guidance

Knowledge files must be manually updated when Contentstack SDK or Venus releases breaking changes. Update the `_version` header date and version strings when updating.
