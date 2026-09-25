## Description

<!-- Brief summary of what this PR does and why it was introduced. -->

## Linked Issue

<!-- Reference the issue this PR closes, e.g. Fixes #123 -->

Fixes #

## Type of Change

- [ ] `feat`: New feature or user-facing improvement
- [ ] `fix`: Bug fix
- [ ] `docs`: Documentation or specifications update
- [ ] `refactor`: Internal code reorganization without changing behavior
- [ ] `test`: Added or updated test coverage
- [ ] `chore`: Tooling, dependencies, or configuration

## Pre-merge Quality Checklist

Please run and confirm all checks passed locally before requesting review:

- [ ] `pnpm format:check` (Prettier code formatting)
- [ ] `pnpm lint` (ESLint with Svelte plugins)
- [ ] `pnpm check` (Wrangler types & svelte-check)
- [ ] `pnpm test:unit` (Vitest unit & domain tests)
- [ ] `pnpm build` (Cloudflare Worker build succeeds)
- [ ] No secrets, credentials, or private keys committed
- [ ] Error, pending, and empty UI states implemented (if UI change)

## Verification & Screenshots

<!-- Provide evidence of verification: terminal output summary, browser screenshots, or steps tested. -->
