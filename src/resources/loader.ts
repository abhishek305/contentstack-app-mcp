import { fileURLToPath } from "url";
import path from "path";
import { readFileSync, existsSync } from "fs";

// MUST use import.meta.url — Cursor controls the process cwd, not us
const __dir = path.dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = path.join(__dir, "../../knowledge");

const RESOURCE_MAP: Record<string, string> = {
  "cs://locations": "locations.md",
  "cs://sdk": "sdk.md",
  "cs://patterns": "patterns.md",
  "cs://manifest": "manifest.md",
  "cs://security": "security.md",
  "cs://maintenance": "maintenance.md",
  "cs://spec-schema": "spec-schema.json",
};

export function listResourceUris(): string[] {
  return Object.keys(RESOURCE_MAP);
}

export function readResource(uri: string): string | null {
  const filename = RESOURCE_MAP[uri];
  if (!filename) return null;

  const filePath = path.join(KNOWLEDGE_DIR, filename);
  if (!existsSync(filePath)) return null;

  return readFileSync(filePath, "utf-8");
}

export function resourceMimeType(uri: string): string {
  if (uri.endsWith("spec-schema")) return "application/json";
  return "text/markdown";
}

export const RESOURCE_METADATA: Record<string, { name: string; description: string }> = {
  "cs://locations": {
    name: "UI Location Selection Guide",
    description: "All 10 UI location types with manifest_type strings, SDK interface, route paths, signal phrases, and cbModal constraints. Read before selecting UI locations.",
  },
  "cs://sdk": {
    name: "App SDK Capabilities Reference",
    description: "Available SDK methods by UI location type, useApi hook patterns, Advanced Settings proxy patterns, and App Config data flow.",
  },
  "cs://patterns": {
    name: "Code Patterns & Venus Component Reference",
    description: "Complete Venus component decision matrix, all component prop references, TypeScript @ts-ignore fix, boilerplate hooks, and inline picker pattern. Read before generating any UI code.",
  },
  "cs://manifest": {
    name: "Manifest.json Format Reference",
    description: "Developer Hub manifest format for all 10 location types, advanced_settings patterns, webhook, OAuth, and hosting configuration.",
  },
  "cs://security": {
    name: "Security & Permission Guide",
    description: "4-tier security model, permission strings, configuration vs serverConfiguration, and minimal permissions rule.",
  },
  "cs://maintenance": {
    name: "Maintenance & Migration Guide",
    description: "cs_analyze checklist (what to check and at what severity), migration order, do-not-change contract, and verification commands.",
  },
  "cs://spec-schema": {
    name: "App Specification Schema",
    description: "JSON Schema for app specs — all required/optional fields, cross-field validation rules, security tier inference, and examples.",
  },
};
