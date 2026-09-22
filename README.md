# SNS: Everyday Social Journal

A web-based everyday social journal developed for the Japanese IT Pathway coursework (Group 5).

The application provides a quiet, text-first environment for documenting everyday moments within an invite-only pilot community. It intentionally omits public popularity metrics, streaks, trending algorithms, and infinite scrolling in favor of chronological delivery and personal archiving.

---

## Technologies Used

[![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?logo=svelte&logoColor=white)](https://kit.svelte.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Cloudflare D1](https://img.shields.io/badge/Cloudflare_D1-F38020?logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/d1/)
[![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-F38020?logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/r2/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)

---

## Getting Started

### Prerequisites

- Node.js (v20.x or later)
- pnpm (v10.x or later)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Japanese-IT-Pathway-Group-5/SNS.git
   cd SNS
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Generate Cloudflare Worker types:

   ```bash
   pnpm gen
   ```

4. Start the local development server:

   ```bash
   pnpm dev
   ```

The application will be accessible at `http://localhost:5173`.

---

## Development and UI Guidelines

The project uses a unified design system defined in `src/app.css` and implemented as reusable components under `src/lib/components/ui/`.

An interactive component showcase is available during local development at:

```
http://localhost:5173/dev/components
```

### Component Conventions

Contributors and automated coding assistants must avoid inline styling or native unstyled form elements. Use the shared primitives:

- `Button`: Standardized action triggers with variants (`primary`, `secondary`, `ghost`, `danger`), loading indicators, and link support.
- `Input` and `Textarea`: Accessible form controls with validation error display and Unicode character counters.
- `Card`: Surface container matching project border and background tokens.
- `Avatar` and `Badge`: Status and profile elements with graceful fallbacks.
- `ModalDialog`: Accessible dialog implementation built on Bits UI.
- `LoadingState` and `EmptyState`: Standardized application feedback states.

---

## Repository Documentation

Detailed technical and design specifications are maintained in the `docs` directory:

- [Project Plan](docs/PROJECT_PLAN.md): Core requirements, delivery milestones, scope definitions, and release criteria.
- [Design System](docs/DESIGN_SYSTEM.md): Color tokens, typography, spacing, and accessibility standards.
- [Engineering Foundation](docs/ENGINEERING.md): Architecture patterns, data contracts, and code organization rules.
- [Contributing Guidelines](CONTRIBUTING.md): Branching strategy, review requirements, and pull request checklist.
- [Agent Instructions](AGENTS.md): Operational rules and conventions for AI-assisted development.

---

## Available Scripts

| Command            | Description                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `pnpm dev`         | Starts the Vite local development server.                          |
| `pnpm check`       | Runs SvelteKit and TypeScript type diagnostics.                    |
| `pnpm lint`        | Runs Prettier formatting and ESLint rule checks.                   |
| `pnpm format`      | Automatically formats codebase files using Prettier.               |
| `pnpm test:unit`   | Executes unit and domain logic tests via Vitest.                   |
| `pnpm test:e2e`    | Runs end-to-end browser integration tests with Playwright.         |
| `pnpm build`       | Compiles the production build for Cloudflare Workers.              |
| `pnpm gen`         | Regenerates Cloudflare Worker TypeScript definitions via Wrangler. |
| `pnpm db:generate` | Generates SQL migration files from the Drizzle schema.             |
| `pnpm db:push`     | Applies schema updates to the database.                            |
