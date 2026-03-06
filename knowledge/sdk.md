<!-- knowledge-version: 1.0 | sdk: @contentstack/app-sdk@2.x | venus: @contentstack/venus-components@3.0.3 | updated: 2026-03-06 -->

# App SDK Capabilities Reference

## Three API Tiers

### Tier 1 — App SDK Chain Methods (no configuration)
Built-in SDK methods. No permissions needed.

### Tier 2 — `appSdk.api()` with App Permissions
Call ANY Contentstack service endpoint (CMA, APP, DEVELOPER_HUB).
`appSdk.api(url, option)` dispatches via `postRobot.sendToParent("apiAdapter", config)`.

Use `appSdk.endpoints` for base URLs:
- `appSdk.endpoints.CMA` — Content Management API
- `appSdk.endpoints.APP` — App Service API
- `appSdk.endpoints.DEVELOPER_HUB` — Developer Hub API

Use `appSdk.ids` for context:
- `appSdk.ids.apiKey` / `appSdk.ids.appUID` / `appSdk.ids.installationUID`
- `appSdk.ids.orgUID` / `appSdk.ids.userUID` / `appSdk.ids.locationUID`

### Tier 3 — `callProxyApi()` via Advanced Settings
Call external APIs via Contentstack proxy. Requires `advanced_settings` in manifest.
Uses `callProxyApi()` from `useApi()` hook — NEVER `fetch()` directly.

---

## Universal Capabilities (All Locations)

| Property / Method | Description |
|---|---|
| `api(url, option)` | Universal gateway to all Contentstack services |
| `endpoints` | `{ CMA, APP, DEVELOPER_HUB }` |
| `ids` | `{ apiKey, appUID, installationUID, locationUID, orgUID, userUID }` |
| `stack` | Full Stack instance |
| `store` | localStorage-backed key-value persistence |
| `currentUser` | Current user details (uid, name, email) |
| `getConfig()` | Read app installation configuration |
| `getCurrentRegion()` | Get region (NA, EU, etc.) |
| `getAppVersion()` | Get current app version |
| `getCurrentLocation()` | Get current UI location type string |

---

## Stack Methods (Available Everywhere)

### Data & Info
```tsx
stack.getData()           // Stack details (api_key, name, org_uid)
stack.getAllBranches()     // All branches
stack.getCurrentBranch()  // Current branch details
stack.getAllStacks({ orgUid }) // All stacks in org
```

### Entry Access — CORRECT: ContentType chain
```tsx
// IMPORTANT: stack.getEntries() does NOT exist — use ContentType chain:
stack.ContentType('blog').Entry.Query().where('title', 'Demo').limit(10).find()
stack.ContentType('blog').Entry.Query().count()
stack.ContentType('blog').Entry('entry_uid').fetch()
stack.ContentType('blog').Entry.create({ entry: { title: "New" } })
stack.ContentType('blog').Entry('entry_uid').update({ entry: { title: "Updated" } })
stack.ContentType('blog').Entry('entry_uid').delete()
stack.ContentType('blog').Entry('entry_uid').publish({ entry: { environments: ["prod"], locales: ["en-us"] } })
stack.ContentType('blog').Entry('entry_uid').unpublish({ ... })
```

### Asset Access — CORRECT: Asset chain
```tsx
// IMPORTANT: stack.getAssets() does NOT exist — use Asset chain:
stack.Asset.Query().find()
stack.Asset('asset_uid').fetch()
stack.Asset.uploadAsset(files, { parentFolderUid: 'folder_uid' })
stack.Asset('asset_uid').publish({ asset: { environments: ["prod"], locales: ["en-us"] } })
```

### Other Resources
```tsx
stack.getContentType(uid) / stack.getContentTypes(query, params)
stack.getEnvironment(name) / stack.getEnvironments()
stack.getLocale(code) / stack.getLocales()
stack.getWorkflow(uid) / stack.getWorkflows()
stack.getReleases() / stack.getPublishes()
stack.getGlobalField(uid) / stack.getGlobalFields()
```

---

## Location-Specific APIs

### Custom Field (`cs.cm.stack.custom_field`)
Gets: `field`, `fieldConfig`, `entry`, `frame`, `stack`

```tsx
// Field object
field.getData({ resolved?: boolean })  // Get field value
field.setData(value)                   // Set field value
field.setFocus()                       // Show user presence
field.onChange(callback)               // Listen for changes
field.uid / field.data_type / field.schema  // Metadata

// Entry object
entry.getData()               // Full entry data
entry.getDraftData()          // Unsaved draft data
entry.getField("uid")         // Another field's Field object
entry.onChange(callback)      // Listen to entry changes
entry.onSave(callback)        // Listen for saves
entry.onPublish(callback)     // Publish event
entry.onUnPublish(callback)   // Unpublish event
entry.content_type / entry.locale

// Frame object
frame.updateHeight(px)        // Set iframe height
frame.enableAutoResizing()    // Watch body.scrollHeight
frame.disableAutoResizing()   // Stop auto-reporting
```

### Inline Picker Pattern (Custom Field — replaces cbModal)
```tsx
const PICKER_HEIGHT = 440;

const openPicker = useCallback(() => {
  setIsPickerOpen(true);
  const frame = (appSdk as any)?.location?.CustomField?.frame;
  frame?.disableAutoResizing();
  frame?.updateHeight(PICKER_HEIGHT);
}, [appSdk]);

const closePicker = useCallback(() => {
  setIsPickerOpen(false);
  const frame = (appSdk as any)?.location?.CustomField?.frame;
  frame?.enableAutoResizing();
}, [appSdk]);

// In JSX: gate picker UI on isPickerOpen in the SAME React tree
{isPickerOpen && <MyPickerComponent onClose={closePicker} />}
```

### Entry Sidebar (`cs.cm.stack.sidebar`)
Gets: `entry`, `stack` — **No frame object**

```tsx
entry.getData()              // Get entry data
entry.getDraftData()         // Unsaved draft
entry.getField("uid")        // Access another field
entry.onChange(callback)     // Listen to changes
entry.onSave(callback)       // Listen for saves
entry.onPublish(callback)    // Publish event
entry.onUnPublish(callback)  // Unpublish event
entry.content_type / entry.locale
```

### Dashboard (`cs.cm.stack.dashboard`)
Gets: `frame`, `stack` — **No entry object**

```tsx
frame.updateHeight(px)              // Set widget height (full-width mode only)
frame.enableResizing()              // Show resize button
frame.onDashboardResize(callback)   // Listen for maximize/minimize
frame.enableAutoResizing()          // Auto-resize
frame.disableAutoResizing()         // Stop auto-resize
// Entry/asset access via stack chain:
stack.ContentType('blog').Entry.Query().find()
```

### App Config (`cs.cm.stack.config`)
Gets: `installation`, `stack`

```tsx
installation.getInstallationData()  // Read saved config
installation.setInstallationData({
  configuration: {},       // Non-sensitive — readable by all UI locations via useAppConfig()
  serverConfiguration: {}  // Sensitive — accessible only via webhooks + proxy mappings
})
installation.setValidity(isValid, { message })  // Block Save if invalid
// WRONG methods: stack.setData(), stack.getConfig(), stack.setConfig() — do NOT exist
```

**Platform Save Button:** Platform provides it. Do NOT add your own.
Call `setInstallationData()` on every input change.

### Field Modifier (`cs.cm.stack.field_modifier`)
Gets: `field`, `entry`, `frame`, `stack`

```tsx
field.getData({ resolved })  // Read field value
field.setData(value)         // Update field value
frame.updateDimension({ height, width })  // Resize — NOT updateHeight()
frame.preventFrameClose(state)           // Prevent accidental close
frame.closeModal()                       // Close app modal
// Field Modifier extends EXISTING fields — does NOT replace them
```

### Content Type Sidebar (`cs.cm.stack.content_type_sidebar`)
Gets: `ContentTypeSidebarWidget`

```tsx
contentType.getData()        // Get content type data (includes .schema in response)
contentType.onSave(callback) // Listen for content type saves
// WRONG: contentType.getSchema() does NOT exist — schema is inside getData() response
```

### Asset Sidebar (`cs.cm.stack.asset_sidebar`)
Gets: `AssetSidebarWidget`

```tsx
getData()               // Get current asset data
setData(asset)          // Set asset data (title, description, tags)
syncAsset()             // Sync with parent
updateWidth(width)      // Adjust sidebar width
replaceAsset(file)      // Replace asset file
onSave(callback)        // Listen for saves
onChange(callback)      // Listen for changes
onPublish(callback)     // Publish event
onUnPublish(callback)   // Unpublish event
```

### Full Page (`cs.cm.stack.full_page`)
Gets: `stack` — all Stack methods available

### Global Full Page (`cs.cm.organization.full_page`)
Gets: `currentOrganization`

```tsx
currentOrganization     // Organization details (uid, name)
// WRONG: organization.getStacks() does NOT exist — use stack.getAllStacks({ orgUid })
```

### RTE (`cs.cm.stack.rte`)
Gets: `RTEPlugin`, `entry`

```tsx
RTEPlugin(pluginId, configFactory)  // Register plugin
// configFactory returns: { title, icon, render, displayOn, elementType }
// displayOn: ['toolbar']
// elementType: ['text'] inline | ['block'] block-level | ['void'] non-editable
// WRONG: RTE has no field.getData() or field.setData()
```

---

## App Configuration Data Flow

```tsx
// App Config — informs platform on every input change (no Save button):
const { installationData, setInstallationData } = useInstallationData();
setInstallationData({
  configuration: { theme: "dark", enableAI: true },     // readable everywhere via useAppConfig()
  serverConfiguration: { api_key: "sk-..." },           // encrypted, proxy-only access
});

// Any other UI location — reads non-sensitive config:
const appConfig = useAppConfig();
console.log(appConfig?.theme);    // "dark"
// serverConfiguration is NOT available in UI locations
```

---

## Advanced Settings — External API Proxy

### Pattern A: App-level key (same for all installations)
```tsx
// manifest: advanced_settings.variables + rewrites
// In component:
const { callProxyApi } = useApi();
const result = await callProxyApi("/openai/v1/chat/completions", {
  method: "POST",
  headers: { "Authorization": "Bearer {{var.OPENAI_API_KEY}}" },
  body: { model: "gpt-4o", messages: [...] }
});
```

### Pattern B: Per-installation key (user provides via App Config)
```tsx
// manifest: advanced_settings.mappings + rewrites + cs.cm.stack.config location
// App Config saves: serverConfiguration: { apiKey: "user-key-123" }
// manifest mappings: { "SERVICE_KEY": "apiKey" } (symbolic → serverConfig path)
// In component:
const { callProxyApi } = useApi();
const result = await callProxyApi("/service/v1/endpoint", {
  method: "GET",
  headers: { "Authorization": "{{map.SERVICE_KEY}}" },
});
```

### Decision: variables vs mappings
| Who owns the key? | Same for all installs? | Use | Template |
|---|---|---|---|
| Developer | Yes | `variables` | `{{var.NAME}}` |
| End-user | No | `mappings` + serverConfig | `{{map.NAME}}` |

Rewrite rule pattern: `{ "source": "/proxy/service/*rest", "destination": "https://api.service.com/*rest" }`
First match wins — put specific rules before wildcards.

---

## useApi Hook

```tsx
import { useApi } from "../../common/hooks/useApi";

const { callCmaApi, callProxyApi, callServiceApi } = useApi();

// Tier 2: CMA (requires permission in manifest)
const entries = await callCmaApi("/v3/content_types/blog/entries");

// Tier 3: External via proxy (requires advanced_settings)
const data = await callProxyApi("/proxy/youtube/search?q=hello", {
  headers: { "X-API-Key": "{{var.YOUTUBE_API_KEY}}" }
});

// Tier 2: Any Contentstack service
const taxonomy = await callServiceApi(appSdk.endpoints.CMA, "/v3/taxonomies");
```
