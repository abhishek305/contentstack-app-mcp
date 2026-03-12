import { z } from "zod";

export const migrateSchema = z.object({
  analysis: z.record(z.unknown()).describe("Output object from cs_analyze tool"),
});

type MigrationStep = {
  order: number;
  category: "dependencies" | "structure" | "security" | "manifest" | "venus";
  description: string;
  files_affected: string[];
  verification: string;
}

const DO_NOT_CHANGE = [
  "Rendered HTML structure (element types, nesting, className assignments)",
  "User-visible text, labels, and button copy",
  "User interactions and event handler behavior",
  "Stored data shapes — changing data_type in a Custom Field breaks all existing content",
  "Route paths already registered in Developer Hub",
  "Entry field UIDs used by the app",
];

function buildMigrationSteps(analysis: Record<string, unknown>): MigrationStep[] {
  const issues = (analysis.issues as Array<{ severity: string; file: string; message: string; line?: number }>) || [];
  const framework = analysis.framework as string;
  const venusVersion = analysis.venus_version as string | null;
  const sdkVersion = analysis.sdk_version as string | null;

  const steps: MigrationStep[] = [];
  let order = 1;

  // Step 1: Dependencies
  const depIssues = issues.filter(
    (i) =>
      i.file === "package.json" &&
      (i.severity === "error" || i.severity === "warning")
  );

  const needsDep =
    depIssues.length > 0 ||
    framework === "cra" ||
    !venusVersion;

  if (needsDep) {
    const actions: string[] = [];
    if (framework === "cra") {
      actions.push("Remove react-scripts. Install vite, @vitejs/plugin-react, create vite.config.ts, update index.html");
    }
    if (!venusVersion) {
      actions.push("Install @contentstack/venus-components@^3.0.3");
    }
    if (sdkVersion && !sdkVersion.startsWith("^2")) {
      actions.push("Update @contentstack/app-sdk to ^2.0.0");
    }

    steps.push({
      order: order++,
      category: "dependencies",
      description: actions.join(". "),
      files_affected: ["package.json", ...(framework === "cra" ? ["vite.config.ts", "index.html"] : [])],
      verification: "npm install && npm run build",
    });
  }

  // Step 2: Structure
  const structureType = analysis.structure_type as string;
  if (structureType === "custom" || structureType === "unknown") {
    steps.push({
      order: order++,
      category: "structure",
      description:
        "Wrap ContentstackAppSDK.init() inside MarketplaceAppProvider. Create src/common/providers/MarketplaceAppProvider.tsx if missing. Create contexts, hooks (useAppSdk, useApi, useAppConfig, useInstallationData). Ensure App.tsx uses MarketplaceAppProvider.",
      files_affected: [
        "src/common/providers/MarketplaceAppProvider.tsx",
        "src/common/contexts/marketplaceContext.ts",
        "src/common/hooks/useAppSdk.tsx",
        "src/common/hooks/useApi.ts",
        "src/main.tsx",
        "src/containers/App/App.tsx",
      ],
      verification: "npm run build",
    });
  }

  // Steps based on issues
  const securityIssues = issues.filter(
    (i) =>
      (i.severity === "error" || i.severity === "warning") &&
      (i.message.includes("Hardcoded API key") ||
        i.message.includes("fetch()") ||
        i.message.includes("axios()") ||
        i.message.includes("ContentstackAppSDK.init()") ||
        i.message.includes("serverConfiguration"))
  );

  if (securityIssues.length > 0) {
    const secFiles = [...new Set(securityIssues.map((i) => i.file))];
    steps.push({
      order: order++,
      category: "security",
      description:
        "Remove hardcoded API keys from source code. Move to advanced_settings.variables (developer-owned) or mappings+serverConfiguration (user-owned). Replace raw fetch()/axios() calls with callProxyApi() from useApi() hook. Add rewrite rules to manifest.json. Move ContentstackAppSDK.init() into MarketplaceAppProvider if not done.",
      files_affected: [...secFiles, "manifest.json"],
      verification: "grep -r \"AIzaSy\\|sk-\\|xoxb-\\|Bearer \" src/ --include=\"*.ts\" --include=\"*.tsx\" | wc -l # expect 0",
    });
  }

  // Step: Manifest fixes
  const manifestIssues = issues.filter(
    (i) =>
      (i.severity === "error" || i.severity === "warning") &&
      i.file === "manifest.json"
  );

  if (manifestIssues.length > 0) {
    const fixes = manifestIssues.map((i) => `  • ${i.message}`).join("\n");
    steps.push({
      order: order++,
      category: "manifest",
      description: `Fix manifest.json issues:\n${fixes}`,
      files_affected: ["manifest.json"],
      verification: "Review manifest.json against cs://manifest format reference",
    });
  }

  // Step: Route/location mismatches
  const routeIssues = issues.filter(
    (i) =>
      (i.severity === "error" || i.severity === "warning") &&
      (i.file.includes("App.tsx") && i.message.includes("route"))
  );

  if (routeIssues.length > 0) {
    steps.push({
      order: order++,
      category: "structure",
      description:
        "Add missing routes to App.tsx. Each location in manifest.json must have a corresponding <Route> in App.tsx. Add React.lazy() wrapping and <Suspense> fallback if missing.",
      files_affected: ["src/containers/App/App.tsx"],
      verification: "npm run build",
    });
  }

  // Step: Venus migration
  const venusIssues = issues.filter(
    (i) =>
      (i.severity === "error" || i.severity === "warning") &&
      (i.message.includes("@ts-ignore") ||
        i.message.includes("venus") ||
        i.message.includes("Venus"))
  );

  if (venusIssues.length > 0 || !venusVersion) {
    const venusFiles = venusIssues.length > 0 ? [...new Set(venusIssues.map((i) => i.file))] : [];
    steps.push({
      order: order++,
      category: "venus",
      description:
        "Add @ts-ignore comment above every Venus import line. Replace raw HTML <input>, <button>, <select>, <table> with Venus equivalents (TextInput, Button, Select, Table). Import Venus CSS in src/main.tsx: import \"@contentstack/venus-components/build/main.css\". See cs://patterns for component decision matrix.",
      files_affected: [...venusFiles, "src/main.tsx"],
      verification: "npm run build  # 0 TypeScript errors from Venus imports expected",
    });
  }

  return steps;
}

export const migrateTool = {
  name: "cs_migrate",
  description:
    "Migration workflow step 2. Generates an ordered migration plan from cs_analyze output. Call with the output of cs_analyze. Returns instructions only — does NOT modify files.\nInput: { analysis: object } (output of cs_analyze)\nOutput: { do_not_change: string[], steps: [...] }",
  schema: migrateSchema,
  handler: async (input: z.infer<typeof migrateSchema>) => {
    try {
      const analysis = input.analysis as Record<string, unknown>;

      if (!analysis || !analysis.issues) {
        return {
          success: false,
          error: "analysis must be the output of cs_analyze (requires issues array)",
        };
      }

      const issues = (analysis.issues as Array<{ severity: string }>) || [];
      const actionableIssues = issues.filter(
        (i) => i.severity === "error" || i.severity === "warning"
      );

      if (actionableIssues.length === 0 && analysis.migration_needed === false) {
        return {
          success: true,
          do_not_change: DO_NOT_CHANGE,
          steps: [],
          note: "No migration needed — app follows best practices.",
        };
      }

      const steps = buildMigrationSteps(analysis);

      return {
        success: true,
        do_not_change: DO_NOT_CHANGE,
        steps,
        note: `Execute ${steps.length} migration steps in order. Run verification command after each step. STOP and report to user if any verification fails before proceeding to next step.`,
      };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  },
};
