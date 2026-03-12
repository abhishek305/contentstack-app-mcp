import { z } from "zod";
import fs from "fs";
import path from "path";

export const verifySchema = z.object({
  project_path: z.string().describe("Absolute path to the generated project root directory."),
});

type CheckResult = {
  name: string;
  passed: boolean;
  details: string;
};

const RAW_HTML_TO_VENUS: Record<string, string> = {
  "<input": "TextInput",
  "<button": "Button",
  "<select": "Select",
  "<table": "Table",
  "<label": "FieldLabel",
};

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

function readFileSync(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

function findSourceFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== "dist" && entry.name !== "build") {
        results.push(...findSourceFiles(fullPath));
      } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
        results.push(fullPath);
      }
    }
  } catch {
    // directory doesn't exist
  }
  return results;
}

function checkDirectoryStructure(projectPath: string): CheckResult {
  const requiredDirs = [
    "src",
    "src/containers",
    "src/common",
    "src/common/hooks",
    "src/common/providers",
    "src/common/contexts",
  ];

  const missing: string[] = [];
  for (const dir of requiredDirs) {
    const fullPath = path.join(projectPath, dir);
    if (!fs.existsSync(fullPath)) {
      missing.push(dir);
    }
  }

  if (missing.length === 0) {
    return { name: "directory_structure", passed: true, details: "All required directories exist" };
  }
  return { name: "directory_structure", passed: false, details: `Missing directories: ${missing.join(", ")}` };
}

function checkFileCompleteness(projectPath: string): CheckResult {
  const requiredFiles = [
    "package.json",
    "tsconfig.json",
    "index.html",
    "manifest.json",
    "src/main.tsx",
    "src/containers/App/App.tsx",
    "src/common/providers/MarketplaceAppProvider.tsx",
    "src/common/hooks/useAppSdk.tsx",
    "src/common/contexts/marketplaceContext.ts",
  ];

  const missing: string[] = [];
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(projectPath, file))) {
      missing.push(file);
    }
  }

  if (missing.length === 0) {
    return { name: "file_completeness", passed: true, details: "All required files present" };
  }
  return { name: "file_completeness", passed: false, details: `Missing files: ${missing.join(", ")}` };
}

function checkManifestRouteSync(projectPath: string): CheckResult {
  const manifestContent = readFileSync(path.join(projectPath, "manifest.json"));
  const appTsxContent = readFileSync(path.join(projectPath, "src/containers/App/App.tsx"));

  if (!manifestContent) {
    return { name: "manifest_route_sync", passed: false, details: "manifest.json not found" };
  }
  if (!appTsxContent) {
    return { name: "manifest_route_sync", passed: false, details: "src/containers/App/App.tsx not found" };
  }

  try {
    const manifest = JSON.parse(manifestContent);
    const locations = manifest?.ui_location?.locations || [];
    const mismatches: string[] = [];

    for (const loc of locations) {
      const locType = loc.type as string;
      const expectedRoute = ROUTE_MAP[locType];
      if (expectedRoute && !appTsxContent.includes(`"${expectedRoute}"`)) {
        mismatches.push(`manifest has ${locType} → expected route "${expectedRoute}" not found in App.tsx`);
      }
    }

    if (mismatches.length === 0) {
      return { name: "manifest_route_sync", passed: true, details: "All manifest locations have matching routes in App.tsx" };
    }
    return { name: "manifest_route_sync", passed: false, details: mismatches.join("; ") };
  } catch {
    return { name: "manifest_route_sync", passed: false, details: "Failed to parse manifest.json" };
  }
}

function checkVenusCompliance(projectPath: string): CheckResult {
  const srcDir = path.join(projectPath, "src");
  const sourceFiles = findSourceFiles(srcDir);
  const violations: string[] = [];

  const containerFiles = sourceFiles.filter(f =>
    f.includes("/containers/") && !f.includes("App.tsx")
  );

  for (const filePath of containerFiles) {
    const content = readFileSync(filePath);
    if (!content) continue;

    const relativePath = path.relative(projectPath, filePath);
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trimStart().startsWith("//") || line.trimStart().startsWith("*") || line.trimStart().startsWith("/*")) continue;

      for (const [rawHtml, venusName] of Object.entries(RAW_HTML_TO_VENUS)) {
        if (line.includes(rawHtml) && !line.includes("//")) {
          violations.push(`${relativePath}:${i + 1}: raw ${rawHtml}> found — use ${venusName} from Venus`);
        }
      }
    }
  }

  if (violations.length === 0) {
    return { name: "venus_compliance", passed: true, details: "No raw HTML elements found where Venus equivalents exist" };
  }
  return { name: "venus_compliance", passed: false, details: violations.join("\n") };
}

function checkTsIgnoreImports(projectPath: string): CheckResult {
  const srcDir = path.join(projectPath, "src");
  const sourceFiles = findSourceFiles(srcDir);
  const violations: string[] = [];

  for (const filePath of sourceFiles) {
    const content = readFileSync(filePath);
    if (!content) continue;
    if (!content.includes("@contentstack/venus-components")) continue;

    const relativePath = path.relative(projectPath, filePath);
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("@contentstack/venus-components") && lines[i].includes("import")) {
        const prevLine = i > 0 ? lines[i - 1] : "";
        if (!prevLine.includes("@ts-ignore")) {
          violations.push(`${relativePath}:${i + 1}: Venus import missing @ts-ignore comment on the line above`);
        }
      }
    }
  }

  if (violations.length === 0) {
    return { name: "ts_ignore_imports", passed: true, details: "All Venus imports have @ts-ignore" };
  }
  return { name: "ts_ignore_imports", passed: false, details: violations.join("\n") };
}

function checkNoRawFetch(projectPath: string): CheckResult {
  const srcDir = path.join(projectPath, "src");
  const sourceFiles = findSourceFiles(srcDir);
  const violations: string[] = [];

  const hooksDir = path.join(projectPath, "src/common/hooks");

  for (const filePath of sourceFiles) {
    if (filePath.startsWith(hooksDir)) continue;

    const content = readFileSync(filePath);
    if (!content) continue;

    const relativePath = path.relative(projectPath, filePath);
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trimStart().startsWith("//") || line.trimStart().startsWith("*")) continue;

      if (/\bfetch\s*\(/.test(line) && !line.includes("fetchTableData") && !line.includes("fetchData")) {
        violations.push(`${relativePath}:${i + 1}: raw fetch() call — use callProxyApi() or callCmaApi() from useApi() hook`);
      }
      if (/\baxios[\s.(]/.test(line)) {
        violations.push(`${relativePath}:${i + 1}: axios usage — use callProxyApi() or callCmaApi() from useApi() hook`);
      }
    }
  }

  if (violations.length === 0) {
    return { name: "no_raw_fetch", passed: true, details: "No raw fetch() or axios() calls found" };
  }
  return { name: "no_raw_fetch", passed: false, details: violations.join("\n") };
}

function checkSdkInitLocation(projectPath: string): CheckResult {
  const srcDir = path.join(projectPath, "src");
  const sourceFiles = findSourceFiles(srcDir);
  const violations: string[] = [];

  for (const filePath of sourceFiles) {
    const content = readFileSync(filePath);
    if (!content) continue;
    if (!content.includes("ContentstackAppSDK.init")) continue;

    const relativePath = path.relative(projectPath, filePath);
    if (!relativePath.includes("MarketplaceAppProvider") && !relativePath.includes("Provider")) {
      violations.push(`${relativePath}: ContentstackAppSDK.init() found outside MarketplaceAppProvider — must only be called in the provider`);
    }
  }

  if (violations.length === 0) {
    return { name: "sdk_init_location", passed: true, details: "ContentstackAppSDK.init() only in MarketplaceAppProvider" };
  }
  return { name: "sdk_init_location", passed: false, details: violations.join("\n") };
}

function checkNoHardcodedKeys(projectPath: string): CheckResult {
  const srcDir = path.join(projectPath, "src");
  const sourceFiles = findSourceFiles(srcDir);
  const violations: string[] = [];

  const keyPatterns = [
    /['"]blt[a-f0-9]{16}['"]/,
    /['"]cs[a-f0-9]{32}['"]/,
    /['"]AIzaSy[A-Za-z0-9_-]{33}['"]/,
    /['"]sk[-_][A-Za-z0-9]{20,}['"]/,
    /['"]ghp_[A-Za-z0-9]{36}['"]/,
    /['"]AKIA[A-Z0-9]{16}['"]/,
  ];

  for (const filePath of sourceFiles) {
    const content = readFileSync(filePath);
    if (!content) continue;

    const relativePath = path.relative(projectPath, filePath);
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      for (const pattern of keyPatterns) {
        if (pattern.test(lines[i])) {
          violations.push(`${relativePath}:${i + 1}: possible hardcoded API key or secret — use advanced_settings variables/mappings`);
          break;
        }
      }
    }
  }

  if (violations.length === 0) {
    return { name: "no_hardcoded_keys", passed: true, details: "No API key patterns found in source" };
  }
  return { name: "no_hardcoded_keys", passed: false, details: violations.join("\n") };
}

export const verifyTool = {
  name: "cs_verify",
  description:
    "Step 8 of the create workflow. Post-generation verification. Audits the scaffolded project for structural, Venus compliance, security, and consistency issues. Call after writing all files. Repeat until passed=true.\nInput: { project_path: string }\nOutput: { passed: boolean, checks: CheckResult[], fix_instructions: string[] }\nIf passed is false, fix each issue in fix_instructions and call cs_verify again.",
  schema: verifySchema,
  handler: async (input: z.infer<typeof verifySchema>) => {
    try {
      const projectPath = input.project_path;

      if (!fs.existsSync(projectPath)) {
        return {
          success: false,
          error: `project_path does not exist: ${projectPath}`,
        };
      }

      if (!fs.statSync(projectPath).isDirectory()) {
        return {
          success: false,
          error: `project_path is not a directory: ${projectPath}`,
        };
      }

      const checks: CheckResult[] = [
        checkDirectoryStructure(projectPath),
        checkFileCompleteness(projectPath),
        checkManifestRouteSync(projectPath),
        checkVenusCompliance(projectPath),
        checkTsIgnoreImports(projectPath),
        checkNoRawFetch(projectPath),
        checkSdkInitLocation(projectPath),
        checkNoHardcodedKeys(projectPath),
      ];

      const failedChecks = checks.filter(c => !c.passed);
      const passed = failedChecks.length === 0;

      const fixInstructions: string[] = failedChecks.map(c => {
        switch (c.name) {
          case "directory_structure":
            return `Create missing directories: ${c.details.replace("Missing directories: ", "")}`;
          case "file_completeness":
            return `Create missing files: ${c.details.replace("Missing files: ", "")}`;
          case "manifest_route_sync":
            return `Fix route mismatches: ${c.details}`;
          case "venus_compliance":
            return `Replace raw HTML with Venus components:\n${c.details}`;
          case "ts_ignore_imports":
            return `Add @ts-ignore comment above Venus imports:\n${c.details}`;
          case "no_raw_fetch":
            return `Replace raw fetch/axios with useApi() hook:\n${c.details}`;
          case "sdk_init_location":
            return `Move ContentstackAppSDK.init() to MarketplaceAppProvider:\n${c.details}`;
          case "no_hardcoded_keys":
            return `Remove hardcoded keys and use advanced_settings:\n${c.details}`;
          default:
            return c.details;
        }
      });

      return {
        success: true,
        passed,
        checks,
        fix_instructions: fixInstructions,
        summary: passed
          ? `All ${checks.length} checks passed.`
          : `${failedChecks.length} of ${checks.length} checks failed. Fix issues and run cs_verify again.`,
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  },
};
