<!-- knowledge-version: 1.0 | sdk: @contentstack/app-sdk@2.x | venus: @contentstack/venus-components@3.0.3 | updated: 2026-03-06 -->

# Manifest.json Format — Developer Hub Reference

## Top-Level Structure

```json
{
  "name": "My App",
  "description": "App description",
  "target_type": "stack",
  "visibility": "private",
  "ui_location": {
    "signed": false,
    "base_url": "http://localhost:3000",
    "locations": []
  }
}
```

`target_type`: `"stack"` (most apps) or `"organization"` (org-level apps).
`visibility`: `"private"` (default) or `"public"` (marketplace listing).
`base_url`: Where the app is hosted. Use `http://localhost:3000` for development.

---

## UI Location Entries

Each entry in `locations[]` must have `type` (the manifest_type string) and `meta[]`.

### Custom Field
```json
{
  "type": "cs.cm.stack.custom_field",
  "meta": [{
    "name": "My Custom Field",
    "path": "/custom-field",
    "data_type": "json",
    "multiple": false,
    "signed": false,
    "enabled": true
  }]
}
```
`data_type` required: `"text"` | `"json"` | `"number"` | `"boolean"` | `"date"`

### Entry Sidebar
```json
{
  "type": "cs.cm.stack.sidebar",
  "meta": [{ "name": "My Sidebar", "path": "/entry-sidebar", "signed": false, "enabled": true }]
}
```

### Stack Dashboard
```json
{
  "type": "cs.cm.stack.dashboard",
  "meta": [{ "name": "My Dashboard", "path": "/stack-dashboard", "signed": false, "enabled": true, "default_width": "half" }]
}
```
`default_width`: `"half"` | `"full"` (optional)

### Asset Sidebar
```json
{
  "type": "cs.cm.stack.asset_sidebar",
  "meta": [{ "name": "My Asset Sidebar", "path": "/asset-sidebar", "signed": false, "enabled": true, "width": 500 }]
}
```
`width`: number in pixels (optional)

### Full Page
```json
{
  "type": "cs.cm.stack.full_page",
  "meta": [{ "name": "My Full Page", "path": "/full-page", "signed": false, "enabled": true }]
}
```

### Field Modifier
```json
{
  "type": "cs.cm.stack.field_modifier",
  "meta": [{ "name": "My Field Modifier", "path": "/field-modifier", "signed": false, "enabled": true, "allowed_types": ["text", "json", "number"] }]
}
```
`allowed_types` required. Valid values: `"text"`, `"json"`, `"number"`, `"file"`, `"reference"`

### Content Type Sidebar
```json
{
  "type": "cs.cm.stack.content_type_sidebar",
  "meta": [{ "name": "My CT Sidebar", "path": "/content-type-sidebar", "signed": false, "enabled": true }]
}
```

### RTE Plugin
```json
{
  "type": "cs.cm.stack.rte",
  "meta": [{ "name": "My RTE Plugin", "path": "/json-rte", "signed": false, "enabled": true }]
}
```

### App Config
```json
{
  "type": "cs.cm.stack.config",
  "meta": [{ "path": "/app-configuration", "signed": false, "enabled": true }]
}
```
Note: No `name` field for App Config.

### Global Full Page
```json
{
  "type": "cs.cm.organization.full_page",
  "meta": [{ "name": "My Global Page", "path": "/global-full-page", "signed": false, "enabled": true }]
}
```

---

## App Permissions

```json
{
  "permissions": ["cm.entries.management:read", "cm.entries.management:write", "cm.entry:publish"]
}
```

Only add permissions the app actually uses. See `cs://security` for full permission strings.

---

## Advanced Settings

### Pattern A — App-level key (developer owns it)
```json
{
  "advanced_settings": {
    "variables": { "YOUTUBE_API_KEY": "" },
    "rewrites": [
      { "source": "/proxy/youtube/*rest", "destination": "https://www.googleapis.com/youtube/v3/*rest" }
    ]
  }
}
```
Reference in code headers: `"X-API-Key": "{{var.YOUTUBE_API_KEY}}"`

### Pattern B — Per-installation key (user provides via App Config)
```json
{
  "advanced_settings": {
    "mappings": { "SERVICE_KEY": "apiKey" },
    "rewrites": [
      { "source": "/proxy/service/*rest", "destination": "https://api.service.com/*rest" }
    ]
  }
}
```
- `"SERVICE_KEY"` = symbolic name (NOT a header name)
- `"apiKey"` = path in serverConfiguration (no prefix)
- Reference in code headers: `"Authorization": "{{map.SERVICE_KEY}}"`
- **REQUIRES** `cs.cm.stack.config` location in `locations[]`

### Mixed (both variables AND mappings)
```json
{
  "advanced_settings": {
    "variables": { "APP_KEY": "" },
    "mappings": { "USER_KEY": "userApiKey" },
    "rewrites": [
      { "source": "/proxy/service/*rest", "destination": "https://api.service.com/*rest" }
    ]
  }
}
```

Rewrite pattern: `{ "source": "/path/*rest", "destination": "https://api.example.com/*rest" }`
Rules are evaluated top-down, first match wins. Specific rules before wildcards.

---

## Webhook Configuration

```json
{
  "webhook": {
    "enabled": true,
    "target_url": "https://example.com/webhook",
    "channels": ["content_types.entries.create", "content_types.entries.environments.publish.success"],
    "custom_headers": {},
    "notifiers": [],
    "branch_scope": "$all"
  }
}
```
Note: `webhook` is a singular object (not an array).

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
`client_id` and `client_secret` are system-defined by Developer Hub — do NOT add them.

---

## Hosting Configuration

```json
{
  "hosting": {
    "provider": "external",
    "deployment_url": "http://localhost:3000"
  }
}
```

---

## Complete Example (YouTube Video Picker — Tier 3b)

```json
{
  "name": "YouTube Video Picker",
  "description": "Browse a YouTube channel and save video URL to an entry field",
  "target_type": "stack",
  "visibility": "private",
  "ui_location": {
    "signed": false,
    "base_url": "http://localhost:3000",
    "locations": [
      {
        "type": "cs.cm.stack.sidebar",
        "meta": [{ "name": "YouTube Video Picker", "path": "/entry-sidebar", "signed": false, "enabled": true }]
      },
      {
        "type": "cs.cm.stack.config",
        "meta": [{ "path": "/app-configuration", "signed": false, "enabled": true }]
      }
    ]
  },
  "permissions": ["cs.cm.stack.entry.read", "cs.cm.stack.entry.update"],
  "advanced_settings": {
    "variables": { "YOUTUBE_API_KEY": "" },
    "mappings": { "CHANNEL_ID": "installation.channel_id" },
    "rewrites": [
      { "source": "/proxy/youtube/*rest", "destination": "https://www.googleapis.com/youtube/v3/*rest" }
    ]
  },
  "hosting": {
    "provider": "external",
    "deployment_url": "http://localhost:3000"
  }
}
```
