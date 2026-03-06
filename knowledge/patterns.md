<!-- knowledge-version: 1.0 | sdk: @contentstack/app-sdk@2.x | venus: @contentstack/venus-components@3.0.3 | updated: 2026-03-06 -->

# Contentstack App Patterns & Venus Component Reference

## Project Setup

Every Contentstack app is a **React 18 + TypeScript + Vite** application.

```json
// package.json key dependencies
{
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "@contentstack/app-sdk": "^2.0.0",
  "@contentstack/venus-components": "^3.0.3",
  "react-router-dom": "^6.0.0"
}
```

```tsx
// src/main.tsx — root entry point
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@contentstack/venus-components/build/main.css"; // import CSS once here
import App from "./containers/App/App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

---

## Project Structure

```
src/
├── main.tsx
├── index.css
├── common/
│   ├── contexts/
│   │   ├── marketplaceContext.ts
│   │   └── customFieldExtensionContext.ts
│   ├── providers/
│   │   ├── MarketplaceAppProvider.tsx
│   │   └── CustomFieldExtensionProvider.tsx
│   ├── hooks/
│   │   ├── useAppSdk.tsx
│   │   ├── useApi.ts
│   │   ├── useAppConfig.ts
│   │   ├── useInstallationData.ts
│   │   └── useCustomField.tsx
│   └── types/
│       └── types.ts
├── components/
│   └── ErrorBoundary.tsx
└── containers/
    ├── App/App.tsx
    ├── CustomField/
    ├── SidebarWidget/
    ├── DashboardWidget/
    ├── AssetSidebarWidget/
    ├── FullPage/
    ├── GlobalFullPage/
    └── AppConfiguration/
```

---

## Core Patterns

### MarketplaceAppProvider — SDK Initialization

```tsx
// src/common/providers/MarketplaceAppProvider.tsx
// ContentstackAppSDK.init() MUST ONLY be called here — NEVER in components
import ContentstackAppSDK from "@contentstack/app-sdk";
import { AppSdkContext } from "../contexts/marketplaceContext";

const MarketplaceAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appSdk, setAppSdk] = useState<any>(null);

  useEffect(() => {
    ContentstackAppSDK.init().then((sdk) => setAppSdk(sdk));
  }, []);

  if (!appSdk) return <SkeletonLoader />;

  return (
    <AppSdkContext.Provider value={appSdk}>
      {children}
    </AppSdkContext.Provider>
  );
};
```

### App.tsx — Lazy-loaded Routes

```tsx
// src/containers/App/App.tsx
import React, { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import MarketplaceAppProvider from "../../common/providers/MarketplaceAppProvider";
// @ts-ignore — venus-components ships its own @types/react (v17) causing JSX type conflicts with React 18
import { SkeletonTile } from "@contentstack/venus-components";

const CustomField = React.lazy(() => import("../CustomField/CustomField"));
const SidebarWidget = React.lazy(() => import("../SidebarWidget/EntrySidebar"));
const StackDashboard = React.lazy(() => import("../DashboardWidget/StackDashboard"));
const AppConfiguration = React.lazy(() => import("../AppConfiguration/AppConfiguration"));

const App = () => (
  <MarketplaceAppProvider>
    <Suspense fallback={<SkeletonTile numberOfTiles={3} tileHeight={40} tileWidth="100%" tileBottomSpace={10} tileTopSpace={10} tileleftSpace={0} />}>
      <Routes>
        <Route path="/custom-field" element={<CustomField />} />
        <Route path="/entry-sidebar" element={<SidebarWidget />} />
        <Route path="/stack-dashboard" element={<StackDashboard />} />
        <Route path="/app-configuration" element={<AppConfiguration />} />
      </Routes>
    </Suspense>
  </MarketplaceAppProvider>
);
```

### useAppSdk — SDK Access in Components

```tsx
// src/common/hooks/useAppSdk.tsx
import { useContext } from "react";
import { AppSdkContext } from "../contexts/marketplaceContext";

export const useAppSdk = () => useContext(AppSdkContext);

// Usage in any component:
const appSdk = useAppSdk();
const sdk = appSdk as any; // sdk.location is not typed
const sidebar = sdk.location?.SidebarWidget;
```

### useApi — API Calls

```tsx
// src/common/hooks/useApi.ts
import { useAppSdk } from "./useAppSdk";

export const useApi = () => {
  const appSdk = useAppSdk() as any;

  const callCmaApi = async (path: string, options?: RequestInit) => {
    return appSdk.api(`${appSdk.endpoints.CMA}${path}`, options);
  };

  const callProxyApi = async (path: string, options?: RequestInit) => {
    return appSdk.api(path, options); // proxy rewrites handle URL mapping
  };

  const callServiceApi = async (endpoint: string, path: string, options?: RequestInit) => {
    return appSdk.api(`${endpoint}${path}`, options);
  };

  return { callCmaApi, callProxyApi, callServiceApi };
};
```

### useInstallationData — App Config Hook

```tsx
// src/common/hooks/useInstallationData.ts
import { useAppSdk } from "./useAppSdk";

export const useInstallationData = () => {
  const appSdk = useAppSdk() as any;
  const installation = appSdk?.location?.AppConfigWidget?.installation;
  const [installationData, setInstallationDataState] = useState<any>(null);

  useEffect(() => {
    installation?.getInstallationData().then((data: any) => setInstallationDataState(data));
  }, [installation]);

  const setInstallationData = (data: { configuration: any; serverConfiguration: any }) => {
    installation?.setInstallationData(data);
    setInstallationDataState(data);
  };

  return { installationData, setInstallationData };
};
```

### useCustomField — Custom Field Data

```tsx
// src/common/hooks/useCustomField.tsx
import { useContext } from "react";
import { CustomFieldExtensionContext } from "../contexts/customFieldExtensionContext";

export const useCustomField = () => {
  const { customField, setFieldData, loading } = useContext(CustomFieldExtensionContext);
  return { customField, setFieldData, loading };
};
```

### useAppLocation — Detect Active Location

```tsx
// Detect which UI location is currently active
const useAppLocation = () => {
  const appSdk = useAppSdk() as any;
  return appSdk?.getCurrentLocation();
};
// Returns: "CustomField" | "SidebarWidget" | "DashboardWidget" | "AppConfigWidget" | etc.
```

---

## UI Location Route Paths

| Location Type | Route Path |
|---|---|
| `cs.cm.stack.custom_field` | `/custom-field` |
| `cs.cm.stack.sidebar` | `/entry-sidebar` |
| `cs.cm.stack.dashboard` | `/stack-dashboard` |
| `cs.cm.stack.asset_sidebar` | `/asset-sidebar` |
| `cs.cm.stack.full_page` | `/full-page` |
| `cs.cm.stack.config` | `/app-configuration` |
| `cs.cm.stack.rte` | `/json-rte` |
| `cs.cm.stack.field_modifier` | `/field-modifier` |
| `cs.cm.stack.content_type_sidebar` | `/content-type-sidebar` |
| `cs.cm.organization.full_page` | `/global-full-page` |

---

## Venus Component Library

**MUST USE** for all standard UI elements. Import CSS once in `main.tsx`.

```tsx
// @ts-ignore — venus-components ships its own @types/react (v17) causing JSX type conflicts with React 18
import { Button, TextInput, Select, Table } from "@contentstack/venus-components";
```

**The `@ts-ignore` comment is required** on EVERY Venus import in a React 18 project.

### Decision Matrix

| UI Need | Venus Component | Key Props |
|---|---|---|
| Primary action | `Button buttonType="primary"` | `onClick`, `disabled`, `isLoading` |
| Secondary action | `Button buttonType="secondary"` | |
| Danger action | `Button buttonType="destructive"` | |
| Icon-only button | `Button onlyIcon icon="Refresh"` | |
| Text input | `TextInput` | `value`, `onChange`, `width="full"`, `version="v2"` |
| Multi-line text | `Textarea` | `value`, `onChange` |
| Single select | `Select` | `options`, `value`, `onChange` |
| Multi-select | `Select isMulti` | `options`, `value`, `onChange` |
| Async search | `AsyncSelect` | `loadOptions`, `cacheOptions` |
| Checkbox | `Checkbox` | `checked`, `onChange`, `label` |
| Radio | `Radio` | |
| Toggle | `ToggleSwitch` | `checked`, `onChange`, `label` |
| Static data table | `Table` | `columns`, `data`, `uniqueKey`, `totalCounts` |
| Infinite scroll table | `InfiniteScrollTable` | `columns`, `fetchTableData`, `totalCounts` |
| Modal (non-CustomField) | `cbModal()` | `component`, `modalProps` |
| Slide-in panel | `SideBarModal` | `modalContentPosition="right"` |
| Tabs | `Tabs` | `tabInfo`, `activeTab`, `type`, `version` |
| Date picker | `DatePicker` | `version="v2"`, `initialDate`, `formatType`, `onChange` |
| Date+time | `DateTimepicker` | `version="v2"` |
| Form field wrapper | `Field` + `FieldLabel` | |
| Error message | `ValidationMessage` | `text`, `type="error"` |
| Tooltip | `Tooltip` | `content`, `position` |
| Tag/chip | `Tag` | `label`, `type`, `deletable` |
| Loading skeleton | `SkeletonTile` | `numberOfTiles`, `tileHeight`, `tileWidth`, `tileBottomSpace`, `tileTopSpace`, `tileleftSpace` |
| Empty state | `EmptyState` | `heading`, `description`, `actions`, `moduleIcon` |
| Accordion section | `Accordion` | `title`, `children`, `renderExpanded` |
| Toast notification | `Notification` | via `Notification.success()` / `.error()` |
| Page layout | `PageLayout` | `type`, `content`, `header`, `leftSidebar` |
| Page header | `PageHeader` | `title`, `content`, `actions` |
| Icon | `Icon2` | `icon="IconName"`, `size` |
| Dropdown menu | `Dropdown` | `list`, `closeAfterSelect` |

---

## Component Props Reference

### Button
```tsx
// @ts-ignore — venus-components ships its own @types/react (v17) causing JSX type conflicts with React 18
import { Button } from "@contentstack/venus-components";

<Button
  buttonType="primary"    // 'primary'|'secondary'|'tertiary'|'destructive'|'outline'|'link'
  size="regular"          // 'small'|'regular'
  onClick={handleClick}
  disabled={false}
  isLoading={false}
  icon="Plus"             // icon name (optional)
  iconAlignment="left"    // 'left'|'right'|'both'
  isFullWidth={false}
  onlyIcon={false}        // icon-only button
>
  Button Text
</Button>
```

### TextInput
```tsx
<TextInput
  width="full"            // 'small'|'medium'|'large'|'x-large'|'full'
  type="text"             // 'text'|'password'|'email'|'number'|'search'
  value={value}
  onChange={handleChange}
  onBlur={handleBlur}
  placeholder="Enter text"
  error={hasError}
  disabled={false}
  required={false}
  maxLength={100}
  showCharacterCount={true}
  version="v2"
/>
```

### Select
```tsx
<Select
  options={[
    { label: "Option 1", value: "opt1" },
    { label: "Option 2", value: "opt2" }
  ]}
  value={selectedValue}
  onChange={handleChange}
  placeholder="Select..."
  isMulti={false}
  isSearchable={true}
  isClearable={true}
  isDisabled={false}
  menuPlacement="auto"    // 'auto'|'bottom'|'top'
  version="v2"
/>
```

### AsyncSelect
```tsx
<AsyncSelect
  loadOptions={async (inputValue) => {
    const data = await fetchData(inputValue);
    return data.map(item => ({ label: item.name, value: item.id }));
  }}
  cacheOptions
  defaultOptions
  value={selectedValue}
  onChange={handleChange}
  placeholder="Search..."
/>
```

### Table (static data)
```tsx
<Table
  columns={[
    { Header: "Name", accessor: "name", default: true },
    { Header: "Status", accessor: "status" },
    { Header: "Actions", accessor: "actions", Cell: ({ row }) => <Button>Edit</Button> }
  ]}
  data={tableData}
  uniqueKey="uid"
  totalCounts={totalCount}
  loading={isLoading}
  canPaginate={true}
  fetchTableData={({ skip, limit }) => loadData(skip, limit)}
  onRowClick={handleRowClick}
  isRowSelect={false}
/>
```

### InfiniteScrollTable
```tsx
<InfiniteScrollTable
  columns={[
    { Header: "Name", accessor: "name", default: true },
    { Header: "Status", accessor: "status" }
  ]}
  fetchTableData={async ({ startIndex, stopIndex, searchText }) => {
    const data = await loadPage(startIndex, stopIndex - startIndex, searchText);
    return { data: data.items };
  }}
  totalCounts={totalCount}
  uniqueKey="uid"
  loading={isLoading}
  canSearch={true}
  canRefresh={true}
  name="My Table"
/>
```

### cbModal (NOT for Custom Fields)
```tsx
import { cbModal, ModalHeader, ModalBody, ModalFooter, Button } from "@contentstack/venus-components";

const openModal = () => {
  cbModal({
    component: ({ closeModal }) => (
      <>
        <ModalHeader title="Confirm Action" closeModal={closeModal} />
        <ModalBody><p>Are you sure?</p></ModalBody>
        <ModalFooter>
          <Button buttonType="secondary" onClick={closeModal}>Cancel</Button>
          <Button buttonType="primary" onClick={() => { handleConfirm(); closeModal(); }}>Confirm</Button>
        </ModalFooter>
      </>
    ),
    modalProps: {
      size: "small",  // 'tiny'|'xsmall'|'small'|'medium'|'large'|'max'
      shouldCloseOnOverlayClick: true,
      shouldCloseOnEscape: true
    }
  });
};
```

### Tabs
```tsx
<Tabs
  tabInfo={[
    {
      id: "tab1",
      title: "Details",
      componentData: <DetailsPanel />,
      disabled: false
    },
    {
      id: "tab2",
      title: "History",
      componentData: <HistoryPanel />
    }
  ]}
  activeTab="tab1"
  type="primary"           // 'primary'|'secondary'|'tertiary'
  version="v2"
  tabSize="regular"        // 'small'|'regular'
/>
```

### Accordion
```tsx
<Accordion
  title="Section Title"
  renderExpanded={false}   // start open?
  isAccordionOpen={undefined}  // controlled open state
  onTitleClick={handleClick}
  noChevron={false}
  addRightComponent={<Button buttonType="tertiary">Add</Button>}
  version="v2"
>
  <div>Accordion content here</div>
</Accordion>
```

### Notification (Toast)
```tsx
import { Notification } from "@contentstack/venus-components";

// Success toast
Notification({
  notificationContent: { text: "Saved successfully!", description: "Your changes have been saved." },
  type: "success"
});

// Error toast
Notification({
  notificationContent: { text: "Error", error: { "Save failed": ["Network error"] } },
  type: "error"
});

// Also: type "warning" | "info"
// notificationProps: { position, autoClose, hideProgressBar }
```

### SkeletonTile (Loading State)
```tsx
<SkeletonTile
  numberOfTiles={3}
  tileHeight={40}
  tileWidth="100%"         // number or string
  tileBottomSpace={10}
  tileTopSpace={10}
  tileleftSpace={0}
  tileRadius={7}           // border radius
/>
```

### EmptyState
```tsx
<EmptyState
  type="primary"           // 'primary'|'secondary'|'tertiary'
  moduleIcon="Entry"       // icon name
  heading="No items found"
  headingType="large"      // 'large'|'small'
  description="Get started by creating your first item."
  actions={<Button buttonType="primary" onClick={handleCreate}>Create</Button>}
  forPage="list"           // 'card'|'list'|'fullPage'|'empty'|'search'
/>
```

### PageLayout (Full Page apps)
```tsx
<PageLayout
  type="list"              // string — layout type
  version="v2"
  content={{
    component: <MainContent />
  }}
  header={{
    title: "My App",
    component: <HeaderActions />
  }}
  leftSidebar={{
    component: <Sidebar />
  }}
/>
```

### PageHeader
```tsx
<PageHeader
  title={{ label: "Page Title", editable: false }}
  content="Page description or subtitle"
  actions={[
    { label: "Save", onClick: handleSave, type: "primary" },
    { label: "Cancel", onClick: handleCancel, type: "secondary" }
  ]}
/>
```

### Icon2
```tsx
import { Icon2 } from "@contentstack/venus-components";

<Icon2
  icon="Check"             // icon name string — see icon reference below
  size="medium"            // 'original'|'tiny'|'mini'|'small'|'medium'|'large'|'extraSmall'
  onClick={handleClick}
  disabled={false}
  withTooltip={true}
  tooltipContent="Checkmark"
  tooltipPosition="top"
/>
```

Common icon names: `Check`, `Plus`, `Refresh`, `Search`, `Delete`, `Edit`, `Info`, `Warning`,
`ArrowRight`, `ArrowLeft`, `ArrowDown`, `ArrowUp`, `Close`, `Settings`, `Upload`, `Download`,
`HelpDocs`, `Entry`, `Asset`, `Preview`, `Copy`, `Lock`, `Unlock`, `Star`, `Tag`

### DatePicker
```tsx
<DatePicker
  version="v2"
  testId="date-picker"
  initialDate={storedValue ?? undefined}  // string 'yyyy-mm-dd' or undefined (NOT null)
  formatType="yyyy-mm-dd"
  onChange={handleDateChange}
  withFooter={true}
  closeOnOverlayClick={true}
/>

// onChange normalizer — receives Date | string | null:
const handleDateChange = (value: string | Date | null) => {
  if (!value) { setFieldData(null); return; }
  if (value instanceof Date) {
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const dd = String(value.getDate()).padStart(2, "0");
    setFieldData(`${yyyy}-${mm}-${dd}`);
  } else {
    setFieldData(String(value));
  }
};
```

### Field + FieldLabel + ValidationMessage
```tsx
<Field>
  <FieldLabel htmlFor="api-key">API Key</FieldLabel>
  <TextInput id="api-key" value={apiKey} onChange={handleChange} error={hasError} />
  {hasError && <ValidationMessage text="Invalid API key format" type="error" />}
</Field>
```

### ToggleSwitch
```tsx
<ToggleSwitch checked={isEnabled} onChange={handleToggle} label="Enable feature" disabled={false} />
```

### Tooltip
```tsx
<Tooltip content="Helpful information" position="top">
  <span>Hover me</span>
</Tooltip>
```

### Tag
```tsx
<Tag
  label="Published"
  type="primary"   // 'primary'|'secondary'|'success'|'warning'|'danger'
  deletable={false}
  onDelete={handleDelete}
/>
```

---

## TypeScript Compatibility

Venus ships `@types/react` v17, which conflicts with React 18. Error:
```
'Button' cannot be used as a JSX component — its type is not a valid JSX element type
```

**Fix:** Add `@ts-ignore` on the import line:
```tsx
// @ts-ignore — venus-components ships its own @types/react (v17) causing JSX type conflicts with React 18
import { Button, DatePicker, Select, Table } from "@contentstack/venus-components";
```

**Fallback HTML for loading/error states** (avoid Venus type conflicts in non-critical UI):
| Avoid | Use instead |
|---|---|
| `<Heading>` | `<h2>`, `<h3>` |
| `<Paragraph>` | `<p>` |
| `<FieldLabel>` in error boundary | `<label className="field-label" htmlFor="...">` |

**SDK `location` type issue:**
```tsx
const sdk = appSdk as any; // required — location property not in TypeScript type
const customField = sdk.location?.CustomField;
```

---

## cbModal Ban in Custom Fields

NEVER use `cbModal` inside a Custom Field location. Two bugs:
1. `cbModal` appends to `document.body` — `frame.enableAutoResizing()` detects height change → iframe expands inline in entry editor
2. `cbModal` creates a separate React root disconnected from main tree → `setFieldData` doesn't flush in React 18 concurrent mode

Use inline expand pattern instead (see `cs://sdk` — "Inline Picker Pattern").

---

## When No Venus Equivalent Exists

1. Search the decision matrix above
2. Check if a combination of Venus components achieves the goal
3. If truly no equivalent — ask the user:

> "No Venus component covers [X]. Options:
> 1. Build a simple custom component
> 2. Skip this feature
> 3. Use a third-party library (specify which)
>
> Which would you prefer?"

**Never build custom UI without explicit user confirmation.**
