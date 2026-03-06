export const workflowPrompt = {
  name: "cs_workflow",
  description: "Orchestrates the full app creation workflow. Guides through spec drafting → preflight → plan → manifest → scaffold → venus resolution → verify → build in the correct sequence.",
  arguments: [
    {
      name: "intent",
      description: "Natural language description of the app to build (e.g., 'Build a YouTube video picker sidebar widget that saves selected video URL to an entry field')",
      required: true,
    },
  ],
  handler: async (args: Record<string, string>) => {
    const intent = args.intent || "unspecified";

    return {
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are a Contentstack app builder. The user wants to: "${intent}"

Follow these steps in order. Do NOT skip steps or reorder them.

## Step 1 — Research
Read the following resources:
- cs://locations (understand all 10 UI location types, their manifest_type strings, SDK interfaces)
- cs://security (understand Tier 1/2/3a/3b security model and advanced_settings)
- cs://patterns (understand Venus components and code patterns)

## Step 2 — Draft Spec
From the user's intent, draft a structured spec object matching this shape:
{
  "app_name": "string (required)",
  "description": "string (optional)",
  "target_type": "stack | organization (required)",
  "ui_locations": [
    {
      "type": "one of 10 known cs.cm.* strings (required)",
      "data_type": "required if type=cs.cm.stack.custom_field",
      "allowed_types": ["required if type=cs.cm.stack.field_modifier"],
      "default_width": "optional for dashboard",
      "label": "optional display name"
    }
  ],
  "permissions": ["OAuth scope strings if needed"],
  "variables": { "KEY_NAME": "" },
  "mappings": { "SYMBOLIC_NAME": "serverConfig.path" },
  "rewrites": [{ "source": "/proxy/*rest", "destination": "https://api.example.com/*rest" }]
}

Rules:
- If app uses per-installation API key → add mappings AND cs.cm.stack.config to ui_locations
- If app uses developer-owned API key → add variables only
- If app calls Contentstack CMA write operations → add permissions
- NEVER add both cs.cm.stack.custom_field AND generic "reads/analyzes the entry" — use sidebar for whole-entry access

## Step 3 — Validate
Call cs_preflight({ spec }) with your drafted spec.
If errors are returned: fix the spec and call cs_preflight again.
If warnings: note them but proceed.

## Step 4 — Plan
Call cs_plan({ spec }) with the validated spec.
Show the returned confirmation_prompt to the user.
WAIT for explicit user approval ("yes", "proceed", "looks good") before continuing.

## Step 5 — Generate Manifest
After user approval, call cs_manifest({ spec }) using the same spec object.
Write the returned manifest object as manifest.json to disk.

## Step 6 — Scaffold (3 calls)
For each category (infrastructure, routing, locations):
  1. Call cs_scaffold({ spec, category })
  2. The response contains a "directories" array — create ALL directories first (mkdir -p)
  3. Then write ALL files from the "files" array to disk

Call in this order:
  cs_scaffold({ spec, category: "infrastructure" })
  cs_scaffold({ spec, category: "routing" })
  cs_scaffold({ spec, category: "locations" })

## Step 7 — Venus Resolution
For each location component generated in Step 6:
  1. Identify the UI elements the app needs (inputs, buttons, tables, selects, loading states, etc.)
  2. Call cs_venus_resolve({ ui_elements: [...list of needed elements...] })
  3. Review the returned resolutions — each contains the exact Venus component, props, and example JSX
  4. Update the location component to use the resolved Venus components
  5. Use the combined_import from the response (includes @ts-ignore)
  6. If any element has no Venus equivalent (venus_component: null), keep existing implementation

## Step 8 — Verify
Call cs_verify({ project_path }) to audit the generated project.
If "passed" is false:
  - Read each item in "fix_instructions"
  - Apply the fix
  - Call cs_verify({ project_path }) again to confirm
Repeat until all checks pass.
Do NOT proceed to Step 9 until cs_verify returns passed: true.

## Step 9 — Build and Run
Run: npm install && npm run build
If build fails: fix TypeScript errors and rebuild until it succeeds.
Only after successful build: npm run dev
Confirm the app starts on localhost:3000.

## Venus Rule
For every component in the generated UI, consult cs://patterns first.
Use Venus components for all standard UI elements.
Add @ts-ignore above every Venus import.
Never use raw <input>, <button>, <select>, <table> when a Venus equivalent exists.
When unsure if a Venus component exists, call cs_venus_resolve to check.

Begin with Step 1 now.`,
          },
        },
      ],
    };
  },
};
