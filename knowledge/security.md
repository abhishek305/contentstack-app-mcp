<!-- knowledge-version: 1.0 | sdk: @contentstack/app-sdk@2.x | venus: @contentstack/venus-components@3.0.3 | updated: 2026-03-06 -->

# Security & Permission Guide

## CRITICAL RULES (Never Violate)

1. **Never hardcode API keys, secrets, or credentials in frontend React code.** Apps run as iframes — any secret in the JS bundle is visible via browser dev tools.
2. **Never use `fetch()` or `axios()` directly.** Use `callProxyApi()` from `useApi()` hook.
3. **Never log sensitive data to console.**
4. **Never commit `.env` files with real secrets.**

---

## Security Tiers

### Tier 1 — App SDK Only (60–70% of apps)

No external API calls. No secrets. No permissions.

```json
{ "permissions": [] }
```

**Examples:** color picker field, display-only sidebar, basic dashboard stats.

When to use Tier 1:
- Simple custom fields (color picker, date picker, etc.)
- Read-only sidebars displaying entry metadata
- Basic dashboards using stack chain methods
- No external services

---

### Tier 2 — App Permissions (20–30% of apps)

Calls Contentstack service APIs (CMA, APP, DEVELOPER_HUB) beyond what SDK chain provides.

```json
{ "permissions": ["cm.entries.management:write", "cm.entry:publish"] }
```

Use `appSdk.api()` or `callCmaApi()` / `callServiceApi()` from `useApi()`.

When to use Tier 2:
- Entry create/update/delete/publish operations
- Content type management
- Taxonomy, label, role, audit log management
- Workflow management
- Any write operation on Contentstack data

**SDK Chain (Tier 1 — no permissions) vs appSdk.api() (Tier 2):**
- READ data → prefer SDK Chain (no permissions needed)
- WRITE/CREATE/UPDATE/DELETE → use appSdk.api() (needs permissions)

---

### Tier 3a — App-level External Key (5–10% of apps)

Developer owns the API key. Same for all installations.

```json
{
  "advanced_settings": {
    "variables": { "OPENAI_API_KEY": "" },
    "rewrites": [{ "source": "/openai/*path", "destination": "https://api.openai.com/*path" }]
  }
}
```

In code: `headers: { "Authorization": "Bearer {{var.OPENAI_API_KEY}}" }`

No App Config page needed for the key itself.

---

### Tier 3b — Per-installation Key (5% of apps)

User provides their own key via App Config. Different per installation.

```json
{
  "advanced_settings": {
    "mappings": { "SERVICE_KEY": "apiKey" },
    "rewrites": [{ "source": "/service/*path", "destination": "https://api.service.com/*path" }]
  }
}
```

In code: `headers: { "Authorization": "{{map.SERVICE_KEY}}" }`

**REQUIRES:** `cs.cm.stack.config` location (for key input) + App Config component.
User enters key → saved in `serverConfiguration.apiKey` → proxy injects at runtime.

---

## configuration vs serverConfiguration

When using `cs.cm.stack.config`:

| | `configuration` | `serverConfiguration` |
|---|---|---|
| **Sensitivity** | Non-sensitive | Sensitive (encrypted) |
| **Accessible from** | All UI locations via `useAppConfig()` | Only webhooks and proxy mappings |
| **Use for** | Feature flags, theme, selected content types | API keys, secrets, passwords, tokens |

**Rule:** If it's a secret → `serverConfiguration`. Everything else → `configuration`.

---

## Permission Reference

### Entry Operations
```
cm.entries.management:read   — Read entries
cm.entries.management:write  — Create/update/delete entries
cm.entry:publish             — Publish entries
cm.entry:unpublish           — Unpublish entries
cm.bulk-operations:publish   — Bulk publish/unpublish
cm.entries:import / :export  — Import/export entries
```

### Content Type Operations
```
cm.content-types.management:read   — List content types
cm.content-types.management:write  — Create/update/delete content types
cm.content-types:import / :export  — Import/export content types
```

### Asset Operations
```
cm.assets.management:read   — Read assets
cm.assets.management:write  — Create/update/delete assets
cm.assets:download          — Download assets
```

### Taxonomy, Label, Global Field
```
cm.taxonomies.management:read / :write
cm.labels.management:read / :write
cm.global-fields.management:read / :write
```

### Workflow, Release, Environment
```
cm.workflows.management:read / :write
cm.workflows.publishing-rules:read / :write
cm.releases.management:read / :write
cm.release:deploy
cm.environments.management:read / :write
```

### Webhook, Role, User, Audit
```
cm.webhooks.management:read / :write
cm.roles.management:read / :write
cm.stack.users:read / :write
cm.audit-logs:read
```

### Branch, Extension, Token
```
cm.branches.management:read
cm.extensions.management:read / :write
cm.stack.delivery-tokens:read / :write
cm.stack.management-tokens:read / :write
```

### Stack, Language, Publish Queue
```
cm.stacks.management:read / :write
cm.stack.settings:read
cm.languages.management:read / :write
cm.publish-queue.management:read
```

### Organization
```
organization.roles:read
organization.logs:read
```

---

## Minimal Permissions Rule

Only add permissions the app actually uses. Excess permissions:
- Require user consent during installation
- Increase security risk
- May cause rejection in marketplace review

---

## Webhook Event Channels

```
cs.apps.installations.install     — App installed
cs.apps.installations.uninstall   — App uninstalled
cs.apps.installations.update      — App installation updated

content_types.entries.create                              — Entry created
content_types.entries.update                              — Entry updated
content_types.entries.delete                              — Entry deleted
content_types.entries.environments.publish.success        — Entry published
content_types.entries.environments.unpublish.success      — Entry unpublished

content_types.create / update / delete                    — Content type events
assets.create / update / delete                           — Asset events
assets.environments.publish.success                       — Asset published
releases.environments.deploy                              — Release deployed
global_fields.create / update / delete                    — Global field events
branch.create-initiated / create-completed / delete-initiated / delete-completed
```

---

## Tier Decision Flowchart

```
Does the app call external APIs?
  Yes → Who owns the key?
    Developer (same for all) → Tier 3a (variables + rewrites)
    User (per-installation)  → Tier 3b (mappings + serverConfig + AppConfig page)
  No → Does the app need Contentstack write operations?
    Yes → Tier 2 (App Permissions)
    No  → Tier 1 (no extra config)
```

---

## OAuth Configuration

```json
{
  "oauth": {
    "redirect_uri": "https://example.com/oauth/callback",
    "user_token_config": {
      "enabled": true,
      "scopes": ["cm.entries:read", "cm.entries:write"],
      "allow_pkce": true
    },
    "app_token_config": { "enabled": false, "scopes": [] }
  }
}
```
`client_id` and `client_secret` are system-defined by Developer Hub — do NOT add them to manifest.
