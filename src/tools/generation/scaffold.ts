import { z } from "zod";

export const scaffoldSchema = z.object({
  spec: z.record(z.unknown()).describe("Structured app specification (same object passed to cs_plan and cs_manifest)."),
  category: z
    .enum(["infrastructure", "routing", "locations"])
    .describe("File category to generate. Call 3 times: infrastructure → routing → locations"),
});

const ROUTE_MAP: Record<string, string> = {
  "cs.cm.stack.custom_field": "/custom-field",
  "cs.cm.stack.sidebar": "/entry-sidebar",
  "cs.cm.stack.dashboard": "/stack-dashboard",
  "cs.cm.stack.asset_sidebar": "/asset-sidebar",
  "cs.cm.stack.full_page": "/full-page",
  "cs.cm.stack.field_modifier": "/field-modifier",
  "cs.cm.stack.content_type_sidebar": "/content-type-sidebar",
  "cs.cm.stack.rte": "/json-rte",
  "cs.cm.stack.config": "/app-configuration",
  "cs.cm.organization.full_page": "/global-full-page",
};

const COMPONENT_MAP: Record<string, { folder: string; component: string; importPath: string }> = {
  "cs.cm.stack.custom_field": { folder: "CustomField", component: "CustomField", importPath: "../CustomField/CustomField" },
  "cs.cm.stack.sidebar": { folder: "SidebarWidget", component: "EntrySidebar", importPath: "../SidebarWidget/EntrySidebar" },
  "cs.cm.stack.dashboard": { folder: "DashboardWidget", component: "StackDashboard", importPath: "../DashboardWidget/StackDashboard" },
  "cs.cm.stack.asset_sidebar": { folder: "AssetSidebarWidget", component: "AssetSidebar", importPath: "../AssetSidebarWidget/AssetSidebar" },
  "cs.cm.stack.full_page": { folder: "FullPage", component: "FullPage", importPath: "../FullPage/FullPage" },
  "cs.cm.stack.field_modifier": { folder: "FieldModifier", component: "FieldModifier", importPath: "../FieldModifier/FieldModifier" },
  "cs.cm.stack.content_type_sidebar": { folder: "ContentTypeSidebar", component: "ContentTypeSidebar", importPath: "../ContentTypeSidebar/ContentTypeSidebar" },
  "cs.cm.stack.rte": { folder: "JsonRtePlugin", component: "JsonRtePlugin", importPath: "../JsonRtePlugin/JsonRtePlugin" },
  "cs.cm.stack.config": { folder: "AppConfiguration", component: "AppConfiguration", importPath: "../AppConfiguration/AppConfiguration" },
  "cs.cm.organization.full_page": { folder: "GlobalFullPage", component: "GlobalFullPage", importPath: "../GlobalFullPage/GlobalFullPage" },
};

const VENUS_IMPORT = `// @ts-ignore — venus-components ships @types/react v17 causing JSX conflicts with React 18
import { Button, TextInput, FieldLabel, SkeletonTile } from "@contentstack/venus-components";`;

const VENUS_IMPORT_FULL_PAGE = `// @ts-ignore — venus-components ships @types/react v17 causing JSX conflicts with React 18
import { Button, TextInput, SkeletonTile } from "@contentstack/venus-components";`;

const VENUS_IMPORT_CONFIG = `// @ts-ignore — venus-components ships @types/react v17 causing JSX conflicts with React 18
import { Button, TextInput, FieldLabel } from "@contentstack/venus-components";`;

const VENUS_IMPORT_SIDEBAR = `// @ts-ignore — venus-components ships @types/react v17 causing JSX conflicts with React 18
import { Button, SkeletonTile } from "@contentstack/venus-components";`;

const VENUS_IMPORT_DASHBOARD = `// @ts-ignore — venus-components ships @types/react v17 causing JSX conflicts with React 18
import { Button, SkeletonTile } from "@contentstack/venus-components";`;

const VENUS_IMPORT_BASIC = `// @ts-ignore — venus-components ships @types/react v17 causing JSX conflicts with React 18
import { Button } from "@contentstack/venus-components";`;

function extractDirectories(files: Array<{ path: string }>): string[] {
  const dirs = new Set<string>();
  for (const f of files) {
    const lastSlash = f.path.lastIndexOf("/");
    if (lastSlash > 0) {
      const dir = f.path.substring(0, lastSlash);
      dirs.add(dir);
      const parts = dir.split("/");
      for (let i = 1; i < parts.length; i++) {
        dirs.add(parts.slice(0, i + 1).join("/"));
      }
    }
  }
  return [...dirs].sort();
}

function generateInfrastructure(spec: Record<string, unknown>): Array<{ path: string; content: string }> {
  const appName = (spec.app_name as string) || "My App";
  const hasVenus =
    (spec.ui_locations as Array<Record<string, unknown>>).some(
      (l) => l.type !== "cs.cm.stack.rte"
    );

  return [
    {
      path: "package.json",
      content: JSON.stringify({
        name: appName.toLowerCase().replace(/\s+/g, "-"),
        version: "1.0.0",
        private: true,
        scripts: {
          dev: "vite",
          build: "tsc && vite build",
          preview: "vite preview"
        },
        dependencies: {
          "react": "^18.2.0",
          "react-dom": "^18.2.0",
          "react-router-dom": "^6.0.0",
          "@contentstack/app-sdk": "^2.0.0",
          ...(hasVenus ? { "@contentstack/venus-components": "^3.0.3" } : {})
        },
        devDependencies: {
          "@types/react": "^18.0.0",
          "@types/react-dom": "^18.0.0",
          "@vitejs/plugin-react": "^4.0.0",
          "typescript": "^5.0.0",
          "vite": "^5.0.0"
        }
      }, null, 2),
    },
    {
      path: "tsconfig.json",
      content: JSON.stringify({
        compilerOptions: {
          target: "ES2020",
          useDefineForClassFields: true,
          lib: ["ES2020", "DOM", "DOM.Iterable"],
          module: "ESNext",
          skipLibCheck: true,
          moduleResolution: "bundler",
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: "react-jsx",
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true
        },
        include: ["src"]
      }, null, 2),
    },
    {
      path: "vite.config.ts",
      content: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
  build: { outDir: "build" },
});
`,
    },
    {
      path: "index.html",
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    },
    {
      path: "src/main.tsx",
      content: `import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
${hasVenus ? 'import "@contentstack/venus-components/build/main.css";' : ""}
import App from "./containers/App/App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
`,
    },
    {
      path: "src/index.css",
      content: `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
`,
    },
  ];
}

function generateRouting(spec: Record<string, unknown>): Array<{ path: string; content: string }> {
  const locations = (spec.ui_locations as Array<Record<string, unknown>>) || [];

  const lazyImports = locations
    .map((loc) => {
      const info = COMPONENT_MAP[loc.type as string];
      if (!info) return null;
      return `const ${info.component} = React.lazy(() => import("${info.importPath}"));`;
    })
    .filter(Boolean)
    .join("\n");

  const routes = locations
    .map((loc) => {
      const info = COMPONENT_MAP[loc.type as string];
      const routePath = ROUTE_MAP[loc.type as string];
      if (!info || !routePath) return null;
      return `        <Route path="${routePath}" element={<${info.component} />} />`;
    })
    .filter(Boolean)
    .join("\n");

  return [
    {
      path: "src/common/contexts/marketplaceContext.ts",
      content: `import { createContext } from "react";

export const AppSdkContext = createContext<any>(null);
`,
    },
    {
      path: "src/common/providers/MarketplaceAppProvider.tsx",
      content: `import React, { useState, useEffect } from "react";
import ContentstackAppSDK from "@contentstack/app-sdk";
import { AppSdkContext } from "../contexts/marketplaceContext";

const MarketplaceAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appSdk, setAppSdk] = useState<any>(null);

  useEffect(() => {
    ContentstackAppSDK.init().then((sdk: any) => setAppSdk(sdk));
  }, []);

  if (!appSdk) {
    return (
      <div style={{ padding: "20px" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <AppSdkContext.Provider value={appSdk}>
      {children}
    </AppSdkContext.Provider>
  );
};

export default MarketplaceAppProvider;
`,
    },
    {
      path: "src/common/hooks/useAppSdk.tsx",
      content: `import { useContext } from "react";
import { AppSdkContext } from "../contexts/marketplaceContext";

export const useAppSdk = () => useContext(AppSdkContext);
`,
    },
    {
      path: "src/common/hooks/useApi.ts",
      content: `import { useAppSdk } from "./useAppSdk";

export const useApi = () => {
  const appSdk = useAppSdk() as any;

  const callCmaApi = async (path: string, options?: RequestInit) => {
    return appSdk.api(\`\${appSdk.endpoints.CMA}\${path}\`, options);
  };

  const callProxyApi = async (path: string, options?: RequestInit) => {
    return appSdk.api(path, options);
  };

  const callServiceApi = async (endpoint: string, path: string, options?: RequestInit) => {
    return appSdk.api(\`\${endpoint}\${path}\`, options);
  };

  return { callCmaApi, callProxyApi, callServiceApi };
};
`,
    },
    {
      path: "src/common/hooks/useAppConfig.ts",
      content: `import { useState, useEffect } from "react";
import { useAppSdk } from "./useAppSdk";

export const useAppConfig = () => {
  const appSdk = useAppSdk() as any;
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    appSdk?.getConfig().then((c: any) => setConfig(c));
  }, [appSdk]);

  return config;
};
`,
    },
    {
      path: "src/common/hooks/useInstallationData.ts",
      content: `import { useState, useEffect } from "react";
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
`,
    },
    {
      path: "src/components/ErrorBoundary.tsx",
      content: `import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("App error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px" }}>
          <h3>Something went wrong</h3>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
`,
    },
    {
      path: "src/containers/App/App.tsx",
      content: `import React, { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import MarketplaceAppProvider from "../../common/providers/MarketplaceAppProvider";
import { ErrorBoundary } from "../../components/ErrorBoundary";

${lazyImports}

const App = () => (
  <ErrorBoundary>
    <MarketplaceAppProvider>
      <Suspense fallback={<div style={{ padding: "20px" }}><p>Loading...</p></div>}>
        <Routes>
${routes}
        </Routes>
      </Suspense>
    </MarketplaceAppProvider>
  </ErrorBoundary>
);

export default App;
`,
    },
  ];
}

function generateLocationComponent(
  loc: Record<string, unknown>,
  spec: Record<string, unknown>
): Array<{ path: string; content: string }> {
  const locType = loc.type as string;
  const info = COMPONENT_MAP[locType];
  if (!info) return [];

  const hasProxy =
    (spec.variables && Object.keys(spec.variables as object).length > 0) ||
    (spec.mappings && Object.keys(spec.mappings as object).length > 0);

  const apiImport = hasProxy ? '\nimport { useApi } from "../../common/hooks/useApi";' : "";

  let componentBody = "";
  let venusImport = VENUS_IMPORT_BASIC;

  switch (locType) {
    case "cs.cm.stack.custom_field":
      venusImport = VENUS_IMPORT;
      componentBody = `const sdk = appSdk as any;
  const field = sdk.location?.CustomField?.field;
  const [value, setValue] = useState<string>(field?.getData() ?? "");

  const handleChange = (newValue: string) => {
    setValue(newValue);
    field?.setData(newValue);
  };

  return (
    <div style={{ padding: "16px" }}>
      <FieldLabel htmlFor="custom-field-input">Value</FieldLabel>
      <TextInput
        type="text"
        value={value}
        onChange={(e: any) => handleChange(e.target.value)}
        placeholder="Enter value"
        width="full"
        version="v2"
      />
    </div>
  );`;
      break;

    case "cs.cm.stack.sidebar":
      venusImport = VENUS_IMPORT_SIDEBAR;
      componentBody = `const sdk = appSdk as any;
  const sidebar = sdk.location?.SidebarWidget;
  const [entryData, setEntryData] = useState<any>(null);
  ${hasProxy ? "const { callProxyApi } = useApi();" : ""}

  useEffect(() => {
    const data = sidebar?.entry?.getData();
    setEntryData(data);
    sidebar?.entry?.onChange((updated: any) => setEntryData(updated));
  }, [sidebar]);

  if (!entryData) {
    return (
      <div style={{ padding: "16px" }}>
        <SkeletonTile numberOfTiles={3} tileHeight={20} tileWidth={200} tileBottomSpace={12} />
      </div>
    );
  }

  return (
    <div style={{ padding: "16px" }}>
      <h3 style={{ marginBottom: "12px" }}>${loc.label || "Sidebar Widget"}</h3>
      <pre style={{ fontSize: "12px", overflow: "auto" }}>
        {JSON.stringify(entryData, null, 2)}
      </pre>
    </div>
  );`;
      break;

    case "cs.cm.stack.dashboard":
      venusImport = VENUS_IMPORT_DASHBOARD;
      componentBody = `const sdk = appSdk as any;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sdk.location?.DashboardWidget?.frame?.updateHeight(400);
    setLoading(false);
  }, [sdk]);

  if (loading) {
    return (
      <div style={{ padding: "16px" }}>
        <SkeletonTile numberOfTiles={4} tileHeight={24} tileWidth={300} tileBottomSpace={12} />
      </div>
    );
  }

  return (
    <div style={{ padding: "16px" }}>
      <h3 style={{ marginBottom: "12px" }}>${loc.label || "Dashboard Widget"}</h3>
      <p>Stack-level overview content here.</p>
    </div>
  );`;
      break;

    case "cs.cm.stack.config":
      venusImport = VENUS_IMPORT_CONFIG;
      componentBody = `const sdk = appSdk as any;
  const installation = sdk.location?.AppConfigWidget?.installation;
  const [config, setConfig] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    installation?.getInstallationData().then((data: any) => {
      setConfig(data?.configuration || {});
    });
  }, [installation]);

  const updateConfig = (key: string, value: string) => {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    installation?.setInstallationData({ configuration: updated, serverConfiguration: {} });
  };

  return (
    <div style={{ padding: "16px", maxWidth: "600px" }}>
      <h3 style={{ marginBottom: "16px" }}>App Configuration</h3>
      <div style={{ marginBottom: "16px" }}>
        <FieldLabel htmlFor="config-setting">Setting</FieldLabel>
        <TextInput
          type="text"
          value={config.setting || ""}
          onChange={(e: any) => updateConfig("setting", e.target.value)}
          placeholder="Enter configuration value"
          width="full"
          version="v2"
        />
      </div>
    </div>
  );`;
      break;

    case "cs.cm.stack.full_page":
      venusImport = VENUS_IMPORT_FULL_PAGE;
      componentBody = `const sdk = appSdk as any;
  const [loading, setLoading] = useState(true);
  ${hasProxy ? "const { callProxyApi } = useApi();" : ""}

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "24px" }}>
        <SkeletonTile numberOfTiles={5} tileHeight={28} tileWidth={400} tileBottomSpace={16} />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2>${loc.label || "Full Page App"}</h2>
        <Button buttonType="secondary" onClick={() => {}}>Refresh</Button>
      </div>
      <p>Implement your full page application logic here.</p>
    </div>
  );`;
      break;

    default:
      venusImport = VENUS_IMPORT_BASIC;
      componentBody = `return (
    <div style={{ padding: "16px" }}>
      <h3>${loc.label || info.component}</h3>
      <p>Implement your ${locType} logic here.</p>
      <Button buttonType="primary" onClick={() => {}}>Action</Button>
    </div>
  );`;
  }

  const content = `import React, { useState, useEffect } from "react";
import { useAppSdk } from "../../common/hooks/useAppSdk";${apiImport}
${venusImport}

const ${info.component} = () => {
  const appSdk = useAppSdk();
  ${componentBody}
};

export default ${info.component};
`;

  return [{ path: `src/containers/${info.folder}/${info.component}.tsx`, content }];
}

export const scaffoldTool = {
  name: "cs_scaffold",
  description:
    "Generates source files by category with directory structure. Call 3 times: infrastructure → routing → locations. Read cs://patterns before calling.\nInput: { spec: object, category: 'infrastructure'|'routing'|'locations' }\nOutput: { category, directories: string[], files: [{ path, content }] }\nAgent MUST create all directories first, then write files.",
  schema: scaffoldSchema,
  handler: async (input: z.infer<typeof scaffoldSchema>) => {
    try {
      const spec = input.spec as Record<string, unknown>;

      if (!spec || Object.keys(spec).length === 0) {
        return {
          success: false,
          error: "spec is required and must be a non-empty object. Pass the same spec used in cs_plan.",
        };
      }

      let files: Array<{ path: string; content: string }> = [];

      switch (input.category) {
        case "infrastructure":
          files = generateInfrastructure(spec);
          break;
        case "routing":
          files = generateRouting(spec);
          break;
        case "locations": {
          const locations = (spec.ui_locations as Array<Record<string, unknown>>) || [];
          for (const loc of locations) {
            files.push(...generateLocationComponent(loc, spec));
          }
          break;
        }
      }

      const directories = extractDirectories(files);

      return {
        success: true,
        category: input.category,
        directories,
        files,
        note: `First create all ${directories.length} directories (mkdir -p), then write all ${files.length} files to disk. Then call cs_scaffold with the next category.`,
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  },
};
