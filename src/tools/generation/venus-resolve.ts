import { z } from "zod";
import fs from "fs";
import path from "path";

export const venusResolveSchema = z.object({
  ui_elements: z
    .array(z.string())
    .describe("List of UI elements needed, e.g. ['search input', 'data table', 'action button', 'loading skeleton']"),
  project_path: z
    .string()
    .optional()
    .describe("Optional project root path to look for venus-components stories locally"),
});

type VenusResolution = {
  ui_element: string;
  venus_component: string | null;
  import_name: string;
  ts_ignore: boolean;
  props: Record<string, string>;
  example_jsx: string;
  story_snippet: string | null;
  notes: string | null;
};

const VENUS_REGISTRY: Record<string, {
  component: string;
  import_name: string;
  props: Record<string, string>;
  example_jsx: string;
  story_file: string;
  notes?: string;
}> = {
  "text input": {
    component: "TextInput",
    import_name: "TextInput",
    props: { type: "'text'|'password'|'email'|'search'|'number'|'url'", value: "string", onChange: "(e: ChangeEvent) => void", placeholder: "string", width: "'small'|'medium'|'large'|'x-large'|'full'", version: "'v2'", error: "boolean", disabled: "boolean" },
    example_jsx: `<TextInput type="text" value={value} onChange={handleChange} placeholder="Enter text" width="full" version="v2" />`,
    story_file: "TextInput/TextInput.stories.tsx",
  },
  "search input": {
    component: "TextInput",
    import_name: "TextInput",
    props: { type: "'search'", value: "string", onChange: "(e: ChangeEvent) => void", placeholder: "string", width: "'full'", version: "'v2'" },
    example_jsx: `<TextInput type="search" value={query} onChange={(e: any) => setQuery(e.target.value)} placeholder="Search..." width="full" version="v2" />`,
    story_file: "TextInput/TextInput.stories.tsx",
  },
  "password input": {
    component: "TextInput",
    import_name: "TextInput",
    props: { type: "'password'", value: "string", onChange: "(e: ChangeEvent) => void", canShowPassword: "boolean" },
    example_jsx: `<TextInput type="password" value={password} onChange={handleChange} canShowPassword={true} width="full" version="v2" />`,
    story_file: "TextInput/TextInput.stories.tsx",
  },
  "button": {
    component: "Button",
    import_name: "Button",
    props: { buttonType: "'primary'|'secondary'|'tertiary'|'delete'|'bulk'|'white'", size: "'small'|'regular'|'large'", onClick: "() => void", disabled: "boolean", isLoading: "boolean", icon: "string", iconAlignment: "'left'|'right'" },
    example_jsx: `<Button buttonType="primary" onClick={handleClick}>Submit</Button>`,
    story_file: "Button/Button.stories.tsx",
  },
  "action button": {
    component: "Button",
    import_name: "Button",
    props: { buttonType: "'primary'|'secondary'", size: "'regular'", onClick: "() => void", icon: "string" },
    example_jsx: `<Button buttonType="primary" onClick={handleAction} icon="SaveWhite">Save</Button>`,
    story_file: "Button/Button.stories.tsx",
  },
  "delete button": {
    component: "Button",
    import_name: "Button",
    props: { buttonType: "'delete'", onClick: "() => void" },
    example_jsx: `<Button buttonType="delete" onClick={handleDelete}>Delete</Button>`,
    story_file: "Button/Button.stories.tsx",
  },
  "icon button": {
    component: "Button",
    import_name: "Button",
    props: { buttonType: "'secondary'", onlyIcon: "boolean", icon: "string", onClick: "() => void" },
    example_jsx: `<Button buttonType="secondary" onlyIcon={true} icon="Refresh" onClick={handleRefresh} />`,
    story_file: "Button/Button.stories.tsx",
  },
  "select": {
    component: "Select",
    import_name: "Select",
    props: { options: "Array<{label: string, value: string}>", value: "Option | Option[]", onChange: "(selected: Option) => void", placeholder: "string", isMulti: "boolean", isSearchable: "boolean", isClearable: "boolean", version: "'v1'", width: "string" },
    example_jsx: `<Select options={options} value={selected} onChange={setSelected} placeholder="Select..." isSearchable={true} version="v1" />`,
    story_file: "Select/Select.stories.tsx",
  },
  "dropdown": {
    component: "Select",
    import_name: "Select",
    props: { options: "Array<{label: string, value: string}>", value: "Option", onChange: "(selected: Option) => void", placeholder: "string", version: "'v1'" },
    example_jsx: `<Select options={options} value={selected} onChange={setSelected} placeholder="Choose..." version="v1" />`,
    story_file: "Select/Select.stories.tsx",
  },
  "multi select": {
    component: "Select",
    import_name: "Select",
    props: { options: "Array<{label: string, value: string}>", value: "Option[]", onChange: "(selected: Option[]) => void", isMulti: "true", isSearchable: "boolean", version: "'v1'" },
    example_jsx: `<Select options={options} value={selected} onChange={setSelected} isMulti={true} isSearchable={true} version="v1" />`,
    story_file: "Select/Select.stories.tsx",
  },
  "async select": {
    component: "AsyncSelect",
    import_name: "AsyncSelect",
    props: { loadOptions: "(input: string) => Promise<Option[]>", cacheOptions: "boolean", defaultOptions: "boolean | Option[]", onChange: "(selected: Option) => void" },
    example_jsx: `<AsyncSelect loadOptions={fetchOptions} cacheOptions={true} defaultOptions={true} onChange={handleSelect} />`,
    story_file: "Select/Select.stories.tsx",
  },
  "data table": {
    component: "Table",
    import_name: "Table",
    props: { columns: "Column[]", data: "any[]", uniqueKey: "string", totalCounts: "number", loading: "boolean" },
    example_jsx: `<Table columns={columns} data={rows} uniqueKey="id" totalCounts={rows.length} loading={isLoading} />`,
    story_file: "Table/Table.stories.tsx",
    notes: "Column format: { Header: 'Name', accessor: 'name', id: 'name' }",
  },
  "table": {
    component: "Table",
    import_name: "Table",
    props: { columns: "Column[]", data: "any[]", uniqueKey: "string", totalCounts: "number", loading: "boolean" },
    example_jsx: `<Table columns={columns} data={rows} uniqueKey="id" totalCounts={rows.length} loading={isLoading} />`,
    story_file: "Table/Table.stories.tsx",
    notes: "Column format: { Header: 'Name', accessor: 'name', id: 'name' }",
  },
  "infinite scroll table": {
    component: "InfiniteScrollTable",
    import_name: "InfiniteScrollTable",
    props: { columns: "Column[]", fetchTableData: "(params: {skip, limit, searchText}) => Promise<{items, count}>", totalCounts: "number", canSearch: "boolean", canRefresh: "boolean", uniqueKey: "string" },
    example_jsx: `<InfiniteScrollTable columns={columns} fetchTableData={loadData} totalCounts={total} canSearch={true} canRefresh={true} uniqueKey="uid" />`,
    story_file: "Table/InfiniteScrollTable.stories.tsx",
  },
  "checkbox": {
    component: "Checkbox",
    import_name: "Checkbox",
    props: { checked: "boolean", onChange: "(e: ChangeEvent) => void", label: "string", disabled: "boolean" },
    example_jsx: `<Checkbox checked={isChecked} onChange={(e: any) => setIsChecked(e.target.checked)} label="Enable feature" />`,
    story_file: "Checkbox/Checkbox.stories.tsx",
  },
  "toggle": {
    component: "ToggleSwitch",
    import_name: "ToggleSwitch",
    props: { checked: "boolean", onChange: "(checked: boolean) => void", label: "string" },
    example_jsx: `<ToggleSwitch checked={enabled} onChange={setEnabled} label="Enable" />`,
    story_file: "ToggleSwitch/ToggleSwitch.stories.tsx",
  },
  "date picker": {
    component: "DatePicker",
    import_name: "DatePicker",
    props: { initialDate: "string", onChange: "(date: Date | string) => void", version: "'v2'", formatType: "'mm dd yyyy'" },
    example_jsx: `<DatePicker initialDate={date} onChange={(d: any) => setDate(d)} version="v2" />`,
    story_file: "Datepicker/Datepicker.stories.tsx",
    notes: "v2 onChange returns a Date object. Normalize with: const formatted = new Date(d).toISOString().split('T')[0];",
  },
  "tabs": {
    component: "Tabs",
    import_name: "Tabs",
    props: { tabInfo: "Array<{title: string, content: ReactNode}>", activeTab: "number", type: "'basic'|'primary'", version: "'v2'", tabSize: "'regular'|'large'" },
    example_jsx: `<Tabs tabInfo={[{title: "Tab 1", content: <div>Content 1</div>}, {title: "Tab 2", content: <div>Content 2</div>}]} activeTab={0} type="basic" version="v2" />`,
    story_file: "Tabs/Tabs.stories.tsx",
  },
  "accordion": {
    component: "Accordion",
    import_name: "Accordion",
    props: { title: "string | ReactNode", renderExpanded: "boolean", addRightComponent: "() => ReactNode", version: "'v2'" },
    example_jsx: `<Accordion title="Details" renderExpanded={true} version="v2">{children}</Accordion>`,
    story_file: "Accordion/Accordion.stories.tsx",
  },
  "loading skeleton": {
    component: "SkeletonTile",
    import_name: "SkeletonTile",
    props: { numberOfTiles: "number", tileHeight: "number", tileWidth: "number", tileBottomSpace: "number", tileTopSpace: "number", tileleftSpace: "number" },
    example_jsx: `<SkeletonTile numberOfTiles={5} tileHeight={24} tileWidth={300} tileBottomSpace={12} />`,
    story_file: "SkeletonTile/SkeletonTile.stories.tsx",
  },
  "skeleton": {
    component: "SkeletonTile",
    import_name: "SkeletonTile",
    props: { numberOfTiles: "number", tileHeight: "number", tileWidth: "number", tileBottomSpace: "number" },
    example_jsx: `<SkeletonTile numberOfTiles={3} tileHeight={20} tileWidth={200} tileBottomSpace={12} />`,
    story_file: "SkeletonTile/SkeletonTile.stories.tsx",
  },
  "empty state": {
    component: "EmptyState",
    import_name: "EmptyState",
    props: { type: "'primary'|'secondary'", heading: "string", description: "string", actions: "ReactNode" },
    example_jsx: `<EmptyState type="primary" heading="No items found" description="Try adjusting your search" />`,
    story_file: "EmptyState/EmptyState.stories.tsx",
  },
  "tooltip": {
    component: "Tooltip",
    import_name: "Tooltip",
    props: { content: "string | ReactNode", position: "'top'|'bottom'|'left'|'right'|'bottom-start'|'bottom-end'" },
    example_jsx: `<Tooltip content="Helpful info" position="top"><Button buttonType="secondary">Hover me</Button></Tooltip>`,
    story_file: "Tooltip/Tooltip.stories.tsx",
  },
  "tag": {
    component: "Tag",
    import_name: "Tag",
    props: { label: "string", type: "'primary'|'success'|'warning'|'danger'|'info'", deletable: "boolean", onDelete: "() => void" },
    example_jsx: `<Tag label="Published" type="success" />`,
    story_file: "Tag/Tag.stories.tsx",
  },
  "notification": {
    component: "Notification",
    import_name: "Notification",
    props: { notificationContent: "{ text: string }", type: "'success'|'error'|'warning'|'info'" },
    example_jsx: `<Notification notificationContent={{ text: "Saved successfully" }} type="success" />`,
    story_file: "Notification/Notification.stories.tsx",
    notes: "Use Notification.render() for imperative toast notifications.",
  },
  "toast": {
    component: "Notification",
    import_name: "Notification",
    props: { notificationContent: "{ text: string }", type: "'success'|'error'|'warning'|'info'" },
    example_jsx: `<Notification notificationContent={{ text: "Operation completed" }} type="success" />`,
    story_file: "Notification/Notification.stories.tsx",
  },
  "modal": {
    component: "cbModal",
    import_name: "cbModal",
    props: { component: "(props: {closeModal}) => ReactNode", modalProps: "{ size: 'tiny'|'small'|'medium'|'large'|'max', shouldCloseOnOverlayClick: boolean }" },
    example_jsx: `cbModal({ component: (props: any) => <div>Modal content <Button onClick={props.closeModal}>Close</Button></div>, modalProps: { size: "medium" } })`,
    story_file: "Modal/Modal.stories.tsx",
    notes: "NEVER use cbModal inside a Custom Field location. Use inline expand pattern instead.",
  },
  "form field": {
    component: "Field + FieldLabel",
    import_name: "FieldLabel",
    props: { htmlFor: "string", children: "string" },
    example_jsx: `<div style={{ marginBottom: "16px" }}>\n  <FieldLabel htmlFor="my-field">Label</FieldLabel>\n  <TextInput type="text" value={val} onChange={handleChange} width="full" version="v2" />\n</div>`,
    story_file: "Field/Field.stories.tsx",
  },
  "label": {
    component: "FieldLabel",
    import_name: "FieldLabel",
    props: { htmlFor: "string", children: "string" },
    example_jsx: `<FieldLabel htmlFor="input-id">Field Name</FieldLabel>`,
    story_file: "FieldLabel/FieldLabel.stories.tsx",
  },
  "icon": {
    component: "Icon2",
    import_name: "Icon2",
    props: { icon: "string (e.g. 'Search', 'Settings', 'Plus', 'Delete', 'Eye', 'Refresh', 'Star', 'Close')", size: "'tiny'|'small'|'medium'|'large'" },
    example_jsx: `<Icon2 icon="Search" size="small" />`,
    story_file: "Icon2/Icon.stories.tsx",
  },
  "textarea": {
    component: "Textarea",
    import_name: "Textarea",
    props: { value: "string", onChange: "(e: ChangeEvent) => void", placeholder: "string", disabled: "boolean" },
    example_jsx: `<Textarea value={text} onChange={(e: any) => setText(e.target.value)} placeholder="Enter description..." />`,
    story_file: "Textarea/Textarea.stories.tsx",
  },
  "page layout": {
    component: "PageLayout",
    import_name: "PageLayout",
    props: { type: "'list'|'detail'|'form'", content: "ReactNode", header: "ReactNode", leftSidebar: "ReactNode" },
    example_jsx: `<PageLayout type="list" header={<PageHeader title="My Page" />} content={<div>Page content</div>} />`,
    story_file: "PageLayout/PageLayout.stories.tsx",
  },
  "page header": {
    component: "PageHeader",
    import_name: "PageHeader",
    props: { title: "string | ReactNode", content: "ReactNode", actions: "ReactNode" },
    example_jsx: `<PageHeader title="Dashboard" actions={<Button buttonType="primary">Create</Button>} />`,
    story_file: "PageHeader/PageHeader.stories.tsx",
  },
};

function fuzzyMatch(input: string): string | null {
  const normalized = input.toLowerCase().trim();

  if (VENUS_REGISTRY[normalized]) return normalized;

  for (const key of Object.keys(VENUS_REGISTRY)) {
    if (normalized.includes(key) || key.includes(normalized)) return key;
  }

  const keywords: Record<string, string> = {
    "input": "text input",
    "textfield": "text input",
    "text field": "text input",
    "textinput": "text input",
    "btn": "button",
    "submit": "button",
    "dropdown": "select",
    "combobox": "select",
    "combo box": "select",
    "multiselect": "multi select",
    "typeahead": "async select",
    "autocomplete": "async select",
    "grid": "data table",
    "list table": "data table",
    "datagrid": "data table",
    "data grid": "data table",
    "check": "checkbox",
    "switch": "toggle",
    "datepicker": "date picker",
    "calendar": "date picker",
    "tab": "tabs",
    "collapsible": "accordion",
    "expandable": "accordion",
    "loader": "loading skeleton",
    "loading": "loading skeleton",
    "spinner": "loading skeleton",
    "placeholder": "loading skeleton",
    "no data": "empty state",
    "no results": "empty state",
    "blank state": "empty state",
    "hint": "tooltip",
    "popover": "tooltip",
    "chip": "tag",
    "badge": "tag",
    "pill": "tag",
    "alert": "notification",
    "snackbar": "notification",
    "dialog": "modal",
    "popup": "modal",
    "field label": "label",
    "form label": "label",
    "search": "search input",
    "text area": "textarea",
    "multiline": "textarea",
    "layout": "page layout",
    "header": "page header",
  };

  for (const [kw, target] of Object.entries(keywords)) {
    if (normalized.includes(kw)) return target;
  }

  return null;
}

function tryReadStoryFile(componentStoryPath: string, projectPath?: string): string | null {
  const searchPaths = [
    projectPath ? path.join(projectPath, "venus-components/src/components", componentStoryPath) : null,
    projectPath ? path.join(projectPath, "node_modules/@contentstack/venus-components/src/components", componentStoryPath) : null,
    projectPath ? path.join(projectPath, "../venus-components/src/components", componentStoryPath) : null,
  ].filter(Boolean) as string[];

  for (const p of searchPaths) {
    try {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, "utf-8");
        const defaultExportMatch = content.match(/export\s+const\s+Default\s*=[\s\S]*?(?=\nexport\s|\n\/\/|$)/);
        if (defaultExportMatch) {
          return defaultExportMatch[0].substring(0, 500);
        }
        return content.substring(0, 500);
      }
    } catch {
      continue;
    }
  }
  return null;
}

export const venusResolveTool = {
  name: "cs_venus_resolve",
  description:
    "Resolves UI element names to exact Venus component names, props, imports, and usage examples. Call BEFORE writing or customizing any UI code.\nInput: { ui_elements: string[], project_path?: string }\nOutput: { resolutions: VenusResolution[], combined_import: string }",
  schema: venusResolveSchema,
  handler: async (input: z.infer<typeof venusResolveSchema>) => {
    try {
      const resolutions: VenusResolution[] = [];
      const importNames = new Set<string>();

      for (const element of input.ui_elements) {
        const matchKey = fuzzyMatch(element);

        if (!matchKey || !VENUS_REGISTRY[matchKey]) {
          resolutions.push({
            ui_element: element,
            venus_component: null,
            import_name: "",
            ts_ignore: false,
            props: {},
            example_jsx: "",
            story_snippet: null,
            notes: `No Venus equivalent found for "${element}". Check cs://patterns or ask user before creating a custom component.`,
          });
          continue;
        }

        const entry = VENUS_REGISTRY[matchKey];
        importNames.add(entry.import_name);

        const storySnippet = tryReadStoryFile(entry.story_file, input.project_path);

        resolutions.push({
          ui_element: element,
          venus_component: entry.component,
          import_name: entry.import_name,
          ts_ignore: true,
          props: entry.props,
          example_jsx: entry.example_jsx,
          story_snippet: storySnippet,
          notes: entry.notes || null,
        });
      }

      const importList = [...importNames].sort().join(", ");
      const combinedImport = importNames.size > 0
        ? `// @ts-ignore — venus-components ships @types/react v17 causing JSX conflicts with React 18\nimport { ${importList} } from "@contentstack/venus-components";`
        : "";

      return {
        success: true,
        resolutions,
        combined_import: combinedImport,
        total_resolved: resolutions.filter(r => r.venus_component !== null).length,
        total_unresolved: resolutions.filter(r => r.venus_component === null).length,
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  },
};
