export const migrateCheckPrompt = {
  name: "cs_migrate_check",
  description: "Pre-migration guidance. Analyzes an existing repo and generates an ordered migration plan with verification steps.",
  arguments: [
    {
      name: "repo_path",
      description: "Absolute path to the existing app repository to migrate",
      required: true,
    },
  ],
  handler: async (args: Record<string, string>) => {
    const repoPath = args.repo_path || "";

    return {
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are a Contentstack app migration expert. Migrate the app at: "${repoPath}"

Follow these steps in order.

## Step 1 — Analyze
Call cs_analyze({ repo_path: "${repoPath}" })

## Step 2 — Report Findings
Show the findings to the user grouped by severity:

**Errors (must fix):**
- List all issues with severity: "error"

**Warnings (should fix):**
- List all issues with severity: "warning"

**Info:**
- List all issues with severity: "info"

Also show:
- structure_type: boilerplate | custom | unknown
- framework: vite | cra | unknown
- sdk_version and venus_version installed
- knowledge_version_match: true/false (if false, knowledge files may be outdated)

Ask the user: "Shall I generate the migration plan and execute it step by step?"
WAIT for explicit user approval before proceeding.

## Step 3 — Generate Migration Plan
After user approval, call cs_migrate({ analysis }) using the full analysis output from Step 1.

Show the user:
- do_not_change list (these items must never be touched)
- All migration steps in order

## Step 4 — Execute Steps
For each step in the migration plan, in order:

1. Show the user what you're about to do (step description + files_affected)
2. Make the changes
3. Run the verification command from the step
4. If verification FAILS: stop immediately, report the error to the user, do NOT proceed to the next step
5. If verification PASSES: confirm success and proceed to the next step

## Critical Rules During Migration
- NEVER change rendered HTML structure (element types, nesting, className assignments)
- NEVER change user-visible text, labels, or button copy
- NEVER change user interactions or event handler behavior
- NEVER change stored data shapes (changing data_type breaks existing content)
- NEVER change route paths already registered in Developer Hub
- ONE step at a time — complete and verify before the next

## After All Steps Complete
Run: npm run build
Confirm 0 TypeScript errors and successful build.
Report total changes made to the user.`,
          },
        },
      ],
    };
  },
};
