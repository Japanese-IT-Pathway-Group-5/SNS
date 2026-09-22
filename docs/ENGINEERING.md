# Engineering foundation

Status: implementation contract, not a scaffold. Read the product plan and design system before feature work.

## Patterns and boundaries

Use one SvelteKit app, strict TypeScript, Svelte 5 runes for new components, and server-side rendering. Prefer composition and small functions. No generic repository framework, custom dependency-injection container, separate API service, or global client-state library for the MVP.

```text
page / component
  -> SvelteKit server load or form action
    -> domain operation (membership + ownership + validation)
      -> Drizzle / D1 or storage helper / R2
```

Use `+page.server.ts` loads for protected reads and named form actions for page mutations, enhanced with `use:enhance`. Keep endpoints for media/auth and genuine non-page API needs. Server actions remain a supported baseline; do not introduce experimental remote-function APIs in individual feature branches. [SvelteKit forms](https://svelte.dev/docs/kit/form-actions)

- Derive identity from validated `event.locals`, never request author IDs. Resolve auth/DB access using request environment bindings. Keep server-only code in `$lib/server`.
- Authorization lives in domain operations too, so another route cannot accidentally bypass it. Layout guards alone are insufficient.
- Keep view components independent of DB clients and secrets. Return deliberate public DTOs, not raw auth/account/database records. Database schema types stay server-side; safe shared contracts live in `$lib/types`.
- Use component-local state for drafts and controls; URL search params for pagination and filters. Never store user-specific mutable state in server module globals. [SvelteKit state management](https://svelte.dev/docs/kit/state-management)
- Shared Zod schemas define boundary validation and limits. No duplicated regex/limit definitions in feature components. Browser validation improves UX; server validation remains authoritative.
- Expected form errors use `fail` with safe field/form messages and appropriate status; redirects stay outside broad catches. Unexpected errors are logged with a request ID and sanitized for users.
- Match existing code patterns before adding abstractions. Extract shared behavior when reuse or a domain boundary justifies it.

## Data and behavior contracts

- Posts: author, body, optional media reference, UTC created/updated timestamps, moderation state. Replies: parent post, author, body, timestamps and moderation state. Use generated IDs and foreign keys.
- Post body: up to 2,000 Unicode code points. Reply: 1-500 code points after whitespace validation. An image-only post is valid. Plain text only; preserve line breaks; never render user input with raw HTML.
- Paginate feeds/journals by stable `(createdAt, id)` cursors, initially 20 entries per page. Bound all reads and reply pagination. Use deterministic ordering with equal timestamps.
- Server create operations use a user-scoped submission identifier to avoid duplicate posts on retries; enforce uniqueness in D1. Never trust client state as proof a write succeeded.
- Update/delete queries constrain ownership and membership. Replies/media inherit parent visibility. Hidden posts disappear from all readers, detail routes, journals, replies and media delivery.
- Media is validated and tracked through pending/ready/cleanup states as described in the plan. Keep R2 keys server-controlled. Do not cache protected responses in a shared public cache.
- Empty, loading, failed, unauthorized and success states are part of each feature contract, not cleanup work for the last day.

## Files and conventions

Use PascalCase for Svelte components and kebab-case for ordinary TS modules. Keep tests beside their subject (`*.test.ts`); put browser journeys in `tests/e2e/`. Server modules group by `auth`, `db`, `posts`, `replies`, and `storage`. Route files orchestrate; domain modules own behavior. Avoid broad barrel exports that mix server and client modules.

Prettier owns formatting; ESLint with Svelte support owns linting; svelte-check owns framework/type checking. Do not hand-maintain a conflicting style guide. Pin compatible dependency versions and commit `pnpm-lock.yaml`; exact versions are selected during the deployed integration proof, not guessed from AI memory.

## Foundation implementation order

1. Scaffold SvelteKit/TypeScript and Cloudflare adapter; pin Node/pnpm; create `.env.example` with placeholders and local Wrangler bindings. Configure format/lint/check scripts.
2. Implement mint/cream/teal semantic tokens, UI primitives and `/dev/components`; review composer/post-card references plus a shared pixel loading/still state. Pin Tailwind/Bits UI/Lucide versions together. Original artwork is a separately tracked asset task; a text loading fallback keeps feature work unblocked.
3. Implement a representative validated form with accessible pending/error/success states and meaningful Vitest/Playwright checks. Use it as the copyable team reference.
4. Establish D1 migrations, request-bound auth, member policy and Google login on stable staging. Verify actual Worker runtime compatibility.
5. Configure CI, hooks, review ownership and deployment. Add deterministic local fixtures and a documented reset/seed process; never point tests at production.
6. Distribute feature issues once shared contracts and reference components exist. Continue in small vertical slices rather than waiting for an entire backend or frontend.

Target script contract after scaffolding: `pnpm dev`, `pnpm build`, `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm test:unit`, `pnpm test:e2e`. These commands do not exist yet; verify package.json before claiming to run them. Add migration/seed commands with explicit local/staging/production names.

## Testing and performance

Pixel assets: keep editable originals under `design/pixel/`, runtime PNG sheets/stills under `src/lib/assets/pixel/`, and a typed registry under `src/lib/pixel/`. These paths are planned, not existing. Each registry entry records asset URLs, logical dimensions, frame count/layout, FPS, playback duration and still fallback. Record creator/source, usage rights and export instructions alongside originals. Import assets through the build for fingerprinting; do not embed base64 art in feature components.

Use a small shared CSS sprite implementation with discrete frame stepping; no animation engine is required for the first asset set. Treat export dimensions and registry metadata as one contract. Keep initial-route sprite transfer under a proposed 50 KiB total, measure actual exports, and lazy-load nonessential scenes. Reserve display dimensions and avoid blocking content on art downloads. The status text must render without JavaScript or assets. Pause animations offscreen, respect reduced motion and the animation-off setting, and stop decorative loops after five seconds. Verify first/last frame alignment, immediate completion when work finishes, missing assets and slow-network behavior in the component showcase.

Use Vitest for policy, schema, pagination and domain failure behavior; local D1/R2 integration checks for actual persistence semantics; Playwright for login-state boundaries, creating/replying/deleting, draft isolation, keyboard use and upload failures. Real Google OAuth gets separate staging smoke checks. No production auth bypass.

Render initial feed HTML on the server. Use system fonts, named icon imports, bounded queries, indexed cursors, and lazy-loaded images with dimensions. Avoid client-side fetch waterfalls and downloading all journal history. Image processing must not freeze the composer; text remains usable during upload. Establish a repeatable mobile measurement profile in the scaffold PR, record route JS/image transfer sizes and loading timings, then compare meaningful changes against that baseline.

Foundation is ready when a fresh clone works from written instructions, component variants are reviewable, critical checks run in CI, isolated staging login works, and one feature can follow an existing end-to-end pattern. Docs alone do not satisfy this gate.
