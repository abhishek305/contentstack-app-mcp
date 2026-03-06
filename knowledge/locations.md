<!-- knowledge-version: 1.0 | sdk: @contentstack/app-sdk@2.x | venus: @contentstack/venus-components@3.0.3 | updated: 2026-03-06 -->

# UI Location Selection Guide

## Quick Decision Flowchart

1. Does the app need to store/display a value as part of the content type schema?
   → Yes → **Custom Field** (`cs.cm.stack.custom_field`)

2. Does the app need to read/analyze/augment an entry (across all fields)?
   → Yes → **Entry Sidebar** (`cs.cm.stack.sidebar`)

3. Does the app need to enhance an existing field (add actions/buttons to it)?
   → Yes → **Field Modifier** (`cs.cm.stack.field_modifier`)

4. Does the app need to extend the JSON Rich Text Editor toolbar?
   → Yes → **RTE** (`cs.cm.stack.rte`)

5. Does the app show stack-level overview information (not entry-specific)?
   → Yes → **Stack Dashboard** (`cs.cm.stack.dashboard`)

6. Does the app need full-screen space for complex UI?
   → Stack-level → **Full Page** (`cs.cm.stack.full_page`)
   → Org-level (cross-stack) → **Global Full Page** (`cs.cm.organization.full_page`)

7. Does the app work with assets (images/files)?
   → Yes → **Asset Sidebar** (`cs.cm.stack.asset_sidebar`)

8. Does the app analyze content type structure/schema?
   → Yes → **Content Type Sidebar** (`cs.cm.stack.content_type_sidebar`)

9. Does the app need a settings/configuration page?
   → Yes → **App Config** (`cs.cm.stack.config`) — usually paired with other locations

---

## Location Reference

### Custom Field (`cs.cm.stack.custom_field`)

- **manifest_type:** `cs.cm.stack.custom_field`
- **Route path:** `/custom-field`
- **SDK location key:** `location.CustomField`
- **SDK interface:** `{ field, fieldConfig, entry, frame, stack }`
- **Limits:** Up to 10 per app

**Use when:**
- The app IS a field — stores a value in the content type schema
- Examples: color picker, address field, JSON editor, Shopify product picker, Cloudinary image selector, markdown editor

**NOT for:**
- Reading/analyzing the whole entry (use Entry Sidebar)
- Adding actions to existing fields (use Field Modifier)

**Signal phrases:** "a field for...", "store X in the entry", "input widget", "picker field", "custom input"

**cbModal BAN:** **NEVER use `cbModal` inside a Custom Field.** Two hard bugs:
1. `cbModal` appends a div to `document.body` — `frame.enableAutoResizing()` detects this, increasing reported iframe height, causing the custom field to expand inline and push other fields down.
2. `cbModal` creates a separate `createRoot()` React root disconnected from the main app tree — `setFieldData` / `setCustomField` calls from inside the modal do not reliably flush back in React 18 concurrent mode, causing saved value to be lost.

**Correct alternative:** Use inline expand pattern (see `cs://sdk` — "Inline Picker Pattern").

---

### Entry Sidebar (`cs.cm.stack.sidebar`)

- **manifest_type:** `cs.cm.stack.sidebar`
- **Route path:** `/entry-sidebar`
- **SDK location key:** `location.SidebarWidget`
- **SDK interface:** `{ entry, stack }` — **No frame object**

**Use when:**
- App reads/analyzes/augments the current entry
- Needs access to multiple fields or the entire entry
- Examples: SEO recommendations, sentiment analysis, language translation, URL preview, related entries, word count, readability score, AI content suggestions

**NOT for:**
- Storing data as a content type field (use Custom Field)
- Stack-level overviews not tied to an entry (use Dashboard)

**Signal phrases:** "from an entry", "scan entry", "analyze entry", "all URLs in entry", "entry content", "show info about entry", "recommend", "entry preview", "validate entry"

---

### Field Modifier (`cs.cm.stack.field_modifier`)

- **manifest_type:** `cs.cm.stack.field_modifier`
- **Route path:** `/field-modifier`
- **SDK location key:** `location.FieldModifierLocation`
- **SDK interface:** `{ field, entry, frame, stack }`
- **Required manifest field:** `allowed_types: string[]` — e.g. `["text", "json", "number"]`

**Use when:**
- Enhancing existing fields (Text, JSON, Number, File, Reference) with extra functionality
- Adding action buttons or supplementary UI to standard fields
- Examples: AI generate button on text field, auto-fill, field validation helper

**NOT for:**
- Creating entirely new field types (use Custom Field)
- Entry-level analysis across all fields (use Entry Sidebar)

**Signal phrases:** "enhance field", "add action to field", "AI on field", "field button", "modify existing field"

**Frame API difference:** FieldModifier uses `frame.updateDimension({ height, width })` — NOT `frame.updateHeight()`.

---

### Stack Dashboard (`cs.cm.stack.dashboard`)

- **manifest_type:** `cs.cm.stack.dashboard`
- **Route path:** `/stack-dashboard`
- **SDK location key:** `location.DashboardWidget`
- **SDK interface:** `{ frame, stack }` — **No entry object**
- **Optional manifest field:** `default_width: "half" | "full"`
- **Limits:** Up to 3 per app

**Use when:**
- Stack-level overview not tied to any specific entry
- Examples: To-do list, recently published entries, content analytics, real-time stack usage, publishing queue

**NOT for:**
- Entry-specific operations (use Entry Sidebar or Custom Field)
- Complex UI needing full screen (use Full Page)

**Signal phrases:** "dashboard widget", "overview", "stack stats", "recently published", "all entries summary"

---

### Full Page (`cs.cm.stack.full_page`)

- **manifest_type:** `cs.cm.stack.full_page`
- **Route path:** `/full-page`
- **SDK location key:** `location.FullPage`
- **SDK interface:** `{ stack }`

**Use when:**
- Complex UI needing full-screen space
- Examples: Workflow Board, Calendar, Release Preview, content migration, import/export, bulk operations

**Signal phrases:** "full page", "standalone page", "complex workflow", "calendar view", "board view", "migration tool", "import/export"

---

### Global Full Page (`cs.cm.organization.full_page`)

- **manifest_type:** `cs.cm.organization.full_page`
- **Route path:** `/global-full-page`
- **SDK location key:** `location.GlobalFullPage`
- **SDK interface:** `{ currentOrganization }`

**Use when:**
- Apps spanning multiple stacks
- Organization-level administration
- Examples: Content governance dashboard, admin dashboard, embedded Jira/Confluence

**Signal phrases:** "across stacks", "organization-level", "cross-stack", "all stacks", "org admin"

---

### Asset Sidebar (`cs.cm.stack.asset_sidebar`)

- **manifest_type:** `cs.cm.stack.asset_sidebar`
- **Route path:** `/asset-sidebar`
- **SDK location key:** `location.AssetSidebarWidget`
- **SDK interface:** `{ getData, setData, syncAsset, updateWidth, replaceAsset, onSave, onChange }`
- **Optional manifest field:** `width: number` (pixels)
- **Limits:** Up to 3 per app

**Use when:**
- Managing, transforming, or optimizing assets
- Examples: Image optimizer, metadata editor, watermark tool, image analysis, alt text generator

**Signal phrases:** "asset", "image", "file metadata", "image optimization", "asset sidebar"

---

### Content Type Sidebar (`cs.cm.stack.content_type_sidebar`)

- **manifest_type:** `cs.cm.stack.content_type_sidebar`
- **Route path:** `/content-type-sidebar`
- **SDK location key:** `location.ContentTypeSidebarWidget`
- **SDK interface:** `{ contentType }` (global stack available via UiLocation)

**Use when:**
- Analyzing or enhancing content type structure
- Examples: Developer Tools viewer, schema analyzer, documentation generator

**Signal phrases:** "content type schema", "content model", "field definitions", "schema analysis"

---

### RTE (`cs.cm.stack.rte`)

- **manifest_type:** `cs.cm.stack.rte`
- **Route path:** `/json-rte`
- **SDK location key:** `location.RTEPlugin`
- **SDK interface:** `{ RTEPlugin, entry }` — **NOT React component — registers via sdk.location.RTEPlugin**

**Use when:**
- Extending the JSON Rich Text Editor toolbar with custom buttons/embeds
- Examples: Custom embed plugin, AI writing assistant within RTE, special formatting tools

**Signal phrases:** "rich text", "RTE toolbar", "editor plugin", "embed in editor", "custom formatting"

---

### App Config (`cs.cm.stack.config`)

- **manifest_type:** `cs.cm.stack.config`
- **Route path:** `/app-configuration`
- **SDK location key:** `location.AppConfigWidget`
- **SDK interface:** `{ installation, stack }`

**When to auto-add:**
- If the app uses `advanced_settings.mappings` → **MUST** add App Config
- If the app needs user-configurable preferences

**Platform Save Button:** The platform provides the Save button. Do NOT add your own. Call `setInstallationData()` on every input change.

**Signal phrases:** "configure", "settings", "API key input", "preferences", "per-installation"

---

## Common Mistakes to Avoid

| Mistake | Wrong | Correct | Why |
|---|---|---|---|
| Reading whole entry | Custom Field | Entry Sidebar | Custom Field only sees its own field |
| Per-install API keys without config | Any + mappings | Always add `cs.cm.stack.config` | mappings require config location for key input |
| Stack overview from entry context | Dashboard | Entry Sidebar | Dashboard has no "current entry" |
| Adding AI button to existing field | Custom Field | Field Modifier | Custom Field replaces; Field Modifier enhances |
| cbModal in Custom Field | cbModal | Inline expand | iframe height + React root bugs |
