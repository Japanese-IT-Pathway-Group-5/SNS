# Working together

Start with [the project plan](docs/PROJECT_PLAN.md), [design system](docs/DESIGN_SYSTEM.md), and [engineering conventions](docs/ENGINEERING.md). The everyday-journal concept is agreed; the application scaffold is the next implementation milestone.

## Task and review flow

Pick an issue with an owner, expected behavior, acceptance checks and allowed scope. Use a short branch, open a draft PR early, and request another teammate's review. Keep `main` releasable. Assign actual maintainers to CODEOWNERS during setup; no placeholder owner entries should be presented as enforcement.

Foundation files (tokens, shared UI, schema, dependencies and workflows) need coordination through the issue/PR. Record interface changes before dependent features proceed. The owner of a feature remains responsible for understanding and verifying AI-generated code.

## Working with an AI coding assistant

Use root `AGENTS.md` as the shared instruction source. If a tool does not discover that file automatically, explicitly attach it and the relevant docs to the task. Tool-specific instruction files, if needed, should point to these sources instead of copying rules that can drift. Do not assume all assistants have the same context or automatic discovery behavior.

Suggested task prompt:

```text
Read AGENTS.md and the linked project/design/engineering docs.
Task: [issue and user-visible outcome]
Acceptance criteria: [specific observable cases]
Scope: [feature/files; identify shared contracts affected]
Inspect existing components and the reference feature before editing.
Reuse semantic tokens and shared components. Follow existing server policies.
Do not add unrelated features. Run available relevant checks and report
what changed, checks actually run, and anything still unverified.
```

Give assistants one focused task at a time. Reference the same composer/post-card examples across UI tasks. Do not supply production secrets or real private journal entries in prompts or fixtures. Review generated dependencies, migrations and permissions particularly carefully.

## PR checklist

- Linked issue, behavior summary, acceptance evidence and remaining limitations.
- Shared components/tokens reused; mobile screenshot for UI changes.
- Mint/cream/teal palette followed; pixel art uses shared assets/components. Include still/reduced-motion and missing-asset states when changing animation. Keep asset metadata and editable sources in sync; do not create a separate mascot style for a feature.
- Loading/empty/error states, keyboard operation and clear audience text checked.
- Server access control and validation covered where relevant.
- Applicable checks actually run; no invented test results or blanket suppressions.
- Schema/environment/dependency changes documented with migration/release implications.
- No real user content, credentials, generated build output or unrelated changes.

Setup commands will be added with the scaffold. Until then there is no runnable app or test suite. Follow the foundation implementation order in ENGINEERING.md rather than inventing a separate setup per feature.
