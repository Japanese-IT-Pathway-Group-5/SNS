# SNS — Everyday Journal 🌱

> _"Your day doesn't have to be special to be worth sharing."_

Hey! Welcome to our group project repository for the Japanese IT Pathway class (Group 5).

We are building a cozy, low-pressure social journal for everyday life. Instead of endless scrolling, follower counts, and popularity contests, it's a simple shared space for our class to post small daily thoughts, photos, and chat in replies.

---

## 🚀 Getting Started

Make sure you have [Node.js](https://nodejs.org/) (v20+) and [pnpm](https://pnpm.io/) installed.

```bash
# 1. Clone the repo
git clone https://github.com/Japanese-IT-Pathway-Group-5/SNS.git
cd SNS

# 2. Install dependencies
pnpm install

# 3. Generate Cloudflare worker types
pnpm gen

# 4. Start the local dev server
pnpm dev
```

Now open [http://localhost:5173](http://localhost:5173) in your browser!

---

## 🎨 Component Showcase (For the Team & AI)

We set up a live component showcase at:
👉 **`http://localhost:5173/dev/components`**

**Important note for teammates:**
When you or your AI assistant build a new page or form, **please do not write raw `<button>` or random Tailwind colors**.
Everything you need is already built and ready to import from `$lib/components/ui`:

- `Button` (primary, secondary, danger, ghost)
- `Input` & `Textarea` (with error messages and character counter)
- `Card` (our cozy warm cream containers)
- `Avatar` & `Badge`
- `ModalDialog` (popups and confirmations)
- `LoadingState` & `EmptyState`

Check out `/dev/components` to see how they look and copy the code snippets directly.

---

## 🛠️ Tech Stack

- **Framework:** SvelteKit (Svelte 5 with Runes) + TypeScript
- **Hosting / Runtime:** Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite) + Drizzle ORM
- **Styling:** Tailwind CSS v4 (using our custom mint, cream, and teal palette in `src/app.css`)
- **Icons & Primitives:** Lucide Svelte + Bits UI
- **Testing:** Vitest & Playwright

---

## 📋 Helpful Docs

- [Project Plan](docs/PROJECT_PLAN.md) — What we are building, scope, and deadlines (October 5, 2026).
- [Design System](docs/DESIGN_SYSTEM.md) — Colors, typography, and UI rules.
- [Engineering Guidelines](docs/ENGINEERING.md) — Coding conventions and backend setup.
- [AI Assistant Instructions (AGENTS.md)](AGENTS.md) — Shared rules for Claude, Cursor, Copilot, etc.
- [Contributing](CONTRIBUTING.md) — Git workflow and how we make pull requests.

---

## 🧪 Available Scripts

- `pnpm dev` — Run dev server
- `pnpm check` — Run TypeScript and Svelte checks
- `pnpm lint` — Run ESLint and Prettier check
- `pnpm format` — Auto-format code
- `pnpm test:unit` — Run unit tests
- `pnpm build` — Test production build for Cloudflare
