import { z } from "zod";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { readResource } from "../../resources/loader.js";

export const analyzeSchema = z.object({
  repo_path: z.string().describe("Absolute path to the app repository root directory"),
});

type Issue = {
  severity: "error" | "warning" | "info";
  file: string;
  line?: number;
  message: string;
}

type AnalysisResult = {
  structure_type: "boilerplate" | "custom" | "unknown";
  framework: "vite" | "cra" | "unknown";
  sdk_version: string | null;
  venus_version: string | null;
  knowledge_version_match: boolean;
  locations_in_manifest: string[];
  routes_in_app: string[];
  location_mismatches: string[];
  issues: Issue[];
  migration_needed: boolean;
}

const KNOWN_LOCATION_TYPES = new Set([
  "cs.cm.stack.custom_field",
  "cs.cm.stack.sidebar",
  "cs.cm.stack.dashboard",
  "cs.cm.stack.asset_sidebar",
  "cs.cm.stack.full_page",
  "cs.cm.stack.field_modifier",
  "cs.cm.stack.content_type_sidebar",
  "cs.cm.stack.rte",
  "cs.cm.stack.config",
  "cs.cm.organization.full_page",
]);

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

function getKnowledgeVersions(): { sdk: string | null; venus: string | null } {
  const locContent = readResource("cs://locations") || "";
  const match = locContent.match(/sdk: ([^\s|]+) \| venus: ([^\s|]+)/);
  return {
    sdk: match ? match[1].replace("@contentstack/app-sdk@", "") : null,
    venus: match ? match[2].replace("@contentstack/venus-components@", "") : null,
  };
}

function collectSourceFiles(dir: string, exts: string[]): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory() && entry !== "node_modules" && entry !== "dist" && entry !== "build") {
        results.push(...collectSourceFiles(fullPath, exts));
      } else if (stat.isFile() && exts.some((ext) => entry.endsWith(ext))) {
        results.push(fullPath);
      }
    } catch {
      // Skip unreadable entries
    }
  }
  return results;
}

function scanFileForIssues(
  filePath: string,
  content: string,
  isBoilerplate: boolean
): Issue[] {
  const issues: Issue[] = [];
  const lines = content.split("\n");
  const relPath = filePath.split("/src/").pop() || filePath;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const file = `src/${relPath}`;

    // Hardcoded API key patterns
    if (/['"`](sk-|AIzaSy|xoxb-|AKIA)[A-Za-z0-9]+['"`]/.test(line)) {
      issues.push({ severity: "error", file, line: lineNum, message: `Hardcoded API key pattern detected. Move to advanced_settings.variables or mappings.` });
    }

    // Raw fetch/axios calls to external URLs
    if (/fetch\s*\(\s*['"`]https?:\/\//.test(line)) {
      issues.push({ severity: "error", file, line: lineNum, message: `Direct fetch() to external URL detected. Use callProxyApi() from useApi() hook with advanced_settings rewrites.` });
    }
    if (/axios\s*\.\s*(get|post|put|delete|patch)\s*\(\s*['"`]https?:\/\//.test(line)) {
      issues.push({ severity: "error", file, line: lineNum, message: `Direct axios() call to external URL detected. Use callProxyApi() from useApi() hook.` });
    }

    // ContentstackAppSDK.init() outside provider
    if (/ContentstackAppSDK\.init\s*\(/.test(line)) {
      if (!filePath.includes("Provider") && !filePath.includes("provider")) {
        issues.push({ severity: "error", file, line: lineNum, message: `ContentstackAppSDK.init() called outside MarketplaceAppProvider. Move to MarketplaceAppProvider.tsx.` });
      }
    }

    // Venus import missing @ts-ignore
    if (/^import\s+.*from\s+['"`]@contentstack\/venus-components['"`]/.test(line)) {
      const prevLine = idx > 0 ? lines[idx - 1] : "";
      if (!prevLine.includes("@ts-ignore")) {
        issues.push({ severity: "warning", file, line: lineNum, message: `Venus import missing @ts-ignore. React 18 / Venus @types/react v17 conflict. Add: // @ts-ignore — venus-components ships its own @types/react (v17) causing JSX type conflicts with React 18` });
      }
    }

    // cbModal in CustomField context
    if (/cbModal/.test(line)) {
      if (filePath.includes("CustomField") || filePath.includes("custom-field") || filePath.includes("customField")) {
        issues.push({ severity: "error", file, line: lineNum, message: `cbModal used in Custom Field context. Causes iframe height bug + disconnected React root. Use inline expand pattern instead.` });
      }
    }

    // Non-existent SDK methods
    if (/stack\.getEntries\s*\(/.test(line)) {
      issues.push({ severity: "error", file, line: lineNum, message: `stack.getEntries() does not exist. Use stack.ContentType('uid').Entry.Query().find()` });
    }
    if (/stack\.getAssets\s*\(/.test(line)) {
      issues.push({ severity: "error", file, line: lineNum, message: `stack.getAssets() does not exist. Use stack.Asset.Query().find()` });
    }
    if (/contentType\.getSchema\s*\(/.test(line)) {
      issues.push({ severity: "error", file, line: lineNum, message: `contentType.getSchema() does not exist. Schema is inside contentType.getData() response.` });
    }
    if (/organization\.getStacks\s*\(/.test(line)) {
      issues.push({ severity: "error", file, line: lineNum, message: `organization.getStacks() does not exist. Use stack.getAllStacks({ orgUid }).` });
    }
  });

  return issues;
}

export const analyzeTool = {
  name: "cs_analyze",
  description:
    "Audits an existing repo against Contentstack best practices. Read cs://maintenance for the checklist.\nInput: { repo_path: string }\nOutput: { structure_type, framework, sdk_version, venus_version, issues[], migration_needed }",
  schema: analyzeSchema,
  handler: async (input: z.infer<typeof analyzeSchema>) => {
    try {
      const repoPath = input.repo_path;

      // 1. Validate repo_path first
      if (!existsSync(repoPath)) {
        return { success: false, error: `repo_path not found: ${repoPath}` };
      }
      if (!statSync(repoPath).isDirectory()) {
        return { success: false, error: `repo_path is not a directory: ${repoPath}` };
      }

      const issues: Issue[] = [];
      const knowledgeVersions = getKnowledgeVersions();

      // 2. Detect structure type
      const hasSrc = existsSync(path.join(repoPath, "src"));
      const hasBoilerplateApp = existsSync(path.join(repoPath, "src/containers/App/App.tsx"));
      const structure_type: "boilerplate" | "custom" | "unknown" = hasBoilerplateApp
        ? "boilerplate"
        : hasSrc
        ? "custom"
        : "unknown";

      // 3. Read package.json
      let sdk_version: string | null = null;
      let venus_version: string | null = null;
      let framework: "vite" | "cra" | "unknown" = "unknown";

      const pkgPath = path.join(repoPath, "package.json");
      if (existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
          const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

          sdk_version = allDeps["@contentstack/app-sdk"] || null;
          venus_version = allDeps["@contentstack/venus-components"] || null;

          if (allDeps["vite"] || allDeps["@vitejs/plugin-react"]) {
            framework = "vite";
          } else if (allDeps["react-scripts"]) {
            framework = "cra";
            issues.push({ severity: "warning", file: "package.json", message: "Build tool is Create React App (react-scripts). Migration to Vite recommended." });
          }

          if (!venus_version) {
            issues.push({ severity: "error", file: "package.json", message: "@contentstack/venus-components is not installed. All apps must use Venus for UI consistency." });
          }
        } catch {
          issues.push({ severity: "warning", file: "package.json", message: "Could not parse package.json" });
        }
      } else {
        issues.push({ severity: "error", file: "package.json", message: "package.json not found" });
      }

      // 4. Check knowledge version match
      let knowledge_version_match = true;
      if (sdk_version && knowledgeVersions.sdk) {
        const installed = sdk_version.replace(/[\^~>=]/g, "").split(".")[0];
        const known = knowledgeVersions.sdk.split(".")[0];
        if (installed !== known) {
          knowledge_version_match = false;
          issues.push({ severity: "warning", file: "knowledge/locations.md", message: `SDK version mismatch: installed ${sdk_version}, knowledge files reference ${knowledgeVersions.sdk}. Update knowledge files.` });
        }
      }

      // 5. Read and validate manifest.json
      const locations_in_manifest: string[] = [];
      const manifestPath = path.join(repoPath, "manifest.json");

      if (existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
          const locs = manifest?.ui_location?.locations || [];

          for (const loc of locs) {
            if (!KNOWN_LOCATION_TYPES.has(loc.type)) {
              issues.push({ severity: "error", file: "manifest.json", message: `Unknown location type "${loc.type}". Must be one of the 10 valid cs.cm.* strings.` });
            } else {
              locations_in_manifest.push(loc.type);
            }

            if (loc.type === "cs.cm.stack.field_modifier") {
              const hasAllowedTypes = loc.meta?.some((m: any) => Array.isArray(m.allowed_types) && m.allowed_types.length > 0);
              if (!hasAllowedTypes) {
                issues.push({ severity: "error", file: "manifest.json", message: `field_modifier location missing required allowed_types.` });
              }
            }
          }

          // Check mappings without config
          const hasMappings = manifest?.advanced_settings?.mappings && Object.keys(manifest.advanced_settings.mappings).length > 0;
          if (hasMappings && !locations_in_manifest.includes("cs.cm.stack.config")) {
            issues.push({ severity: "error", file: "manifest.json", message: "advanced_settings.mappings present but cs.cm.stack.config location is missing." });
          }
        } catch {
          issues.push({ severity: "warning", file: "manifest.json", message: "Could not parse manifest.json" });
        }
      } else {
        issues.push({ severity: "warning", file: "manifest.json", message: "manifest.json not found" });
      }

      // 6. Read routes from App.tsx (boilerplate only)
      const routes_in_app: string[] = [];
      if (structure_type === "boilerplate") {
        const appTsxPath = path.join(repoPath, "src/containers/App/App.tsx");
        if (existsSync(appTsxPath)) {
          const appContent = readFileSync(appTsxPath, "utf-8");
          const routeMatches = appContent.matchAll(/path=["']([^"']+)["']/g);
          for (const match of routeMatches) {
            routes_in_app.push(match[1]);
          }

          // Check lazy loading
          if (!appContent.includes("React.lazy(")) {
            issues.push({ severity: "warning", file: "src/containers/App/App.tsx", message: "Routes are not lazy-loaded. Wrap each component import in React.lazy()." });
          }
          if (!appContent.includes("<Suspense")) {
            issues.push({ severity: "warning", file: "src/containers/App/App.tsx", message: "No <Suspense> wrapper found. Lazy-loaded routes need a Suspense fallback." });
          }
        }
      }

      // 7. Check location/route consistency
      const location_mismatches: string[] = [];
      for (const locType of locations_in_manifest) {
        const expectedRoute = ROUTE_MAP[locType];
        if (expectedRoute && routes_in_app.length > 0 && !routes_in_app.includes(expectedRoute)) {
          location_mismatches.push(locType);
          issues.push({ severity: "error", file: "src/containers/App/App.tsx", message: `Location "${locType}" in manifest but route "${expectedRoute}" not found in App.tsx.` });
        }
      }

      // 8. Scan source files
      const srcDir = path.join(repoPath, "src");
      const sourceFiles = collectSourceFiles(srcDir, [".tsx", ".ts", ".jsx", ".js"]);

      for (const filePath of sourceFiles) {
        try {
          const content = readFileSync(filePath, "utf-8");
          const fileIssues = scanFileForIssues(filePath, content, structure_type === "boilerplate");
          issues.push(...fileIssues);
        } catch {
          // Skip unreadable files
        }
      }

      const migration_needed = issues.some((i) => i.severity === "error" || i.severity === "warning");

      return {
        success: true,
        structure_type,
        framework,
        sdk_version,
        venus_version,
        knowledge_version_match,
        locations_in_manifest,
        routes_in_app,
        location_mismatches,
        issues,
        migration_needed,
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  },
};
