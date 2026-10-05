# Engineering foundation

Status: implementation contract, not a scaffold. Read the product plan and design system before feature work.

## Patterns and boundaries

Use one SvelteKit app, strict TypeScript, Svelte 5 runes for new components, and server-side rendering. Prefer composition and small functions. No generic repository framework, custom dependency-injection container, separate API service, or global client-state library for the MVP.

```text
page / component
  -> SvelteKit server load or form action
    -> domain operation (authenticated identity + ownership + validation)
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
- Update/delete queries constrain ownership; moderation requires the moderator role. Posts, replies, and media are publicly readable. Hidden posts disappear from all readers, detail routes, journals, replies and media delivery.
- Media is validated and tracked through pending/ready/cleanup states as described in the plan. Keep R2 keys server-controlled. Do not cache protected responses in a shared public cache.
- Empty, loading, failed, unauthorized and success states are part of each feature contract, not cleanup work for the last day.

## Files and conventions

The shared navbar and sidebar are `src/lib/components/ui/AppShell.svelte` and `Sidebar.svelte`; styles and theme tokens remain in `src/app.css`. This Svelte 5/Tailwind/TypeScript project adapts React/shadcn references to the existing Svelte UI layer. Do not create a parallel `/components/ui` tree or install React/Radix React components for these references. Lucide Svelte is pinned to `@lucide/svelte@1.45.0`; import individual icon exports to keep development/build work small. Existing Bits UI handles the navigation drawer and composer dialog; no motion library is required.

`ModalDialog` accepts optional `headerArtwork` and `headerClass` props for the illustrated composer header; its default title and description styles remain available for ordinary dialogs. Decorative header content must be hidden from assistive technology. `ImageAttachment` accepts `disabled` to lock selection, dropping, and removal during submission; its upload control is a native keyboard-accessible button.

Home accepts `?q=` with a trimmed maximum of 120 characters, validated by `src/lib/validation/search.ts` in the server load and posts domain operation. Search uses a bound literal substring query over visible post text, ordered and paginated by the existing cursor contract. It does not search private account data, replies or photos. SQLite's `lower()` folds ASCII case; non-ASCII text matches literal substrings. No migration or external search service is required. The shared composer submits to the root createPost action from every shell page and returns home on success.

Use PascalCase for Svelte components and kebab-case for ordinary TS modules. Keep tests beside their subject (`*.test.ts`); put browser journeys in `tests/e2e/`. Server modules group by `auth`, `db`, `posts`, `replies`, and `storage`. Route files orchestrate; domain modules own behavior. Avoid broad barrel exports that mix server and client modules.

Prettier owns formatting; ESLint with Svelte support owns linting; svelte-check owns framework/type checking. Do not hand-maintain a conflicting style guide. Pin compatible dependency versions and commit `pnpm-lock.yaml`; exact versions are selected during the deployed integration proof, not guessed from AI memory.

## Foundation implementation order

1. Scaffold SvelteKit/TypeScript and Cloudflare adapter; pin Node/pnpm; create `.env.example` with placeholders and local Wrangler bindings. Configure format/lint/check scripts.
2. Implement mint/cream/teal semantic tokens, UI primitives and `/dev/components`; review composer/post-card references plus a shared pixel loading/still state. Pin Tailwind/Bits UI/Lucide versions together. Original artwork is a separately tracked asset task; a text loading fallback keeps feature work unblocked.
3. Implement a representative validated form with accessible pending/error/success states and meaningful Vitest/Playwright checks. Use it as the copyable team reference.
4. Establish D1 migrations, request-bound auth, public-read/account-write policy, and Google plus email/password login on stable staging. Verify actual Worker runtime compatibility.
5. Configure CI, hooks, review ownership and deployment. Add deterministic local fixtures and a documented reset/seed process; never point tests at production.
6. Distribute feature issues once shared contracts and reference components exist. Continue in small vertical slices rather than waiting for an entire backend or frontend.

Target script contract after scaffolding: `pnpm dev`, `pnpm build`, `pnpm format:check`, `pnpm lint`, `pnpm check`, `pnpm test:unit`, `pnpm test:e2e`. These commands do not exist yet; verify package.json before claiming to run them. Add migration/seed commands with explicit local/staging/production names.

## Testing and performance

The composer sends its attachment to `/api/uploads/photo` as multipart field `file`, matching `validatePhotoUpload`. The profile-photo action uses its separate `photo` field; do not interchange the two contracts. The upload endpoint returns a pending `mediaId`, which the composer includes in the create-post action.

Feed and journal use the shared bordered `PostCard` container. `listPosts` includes `replyCount` as a correlated SQL count filtered to non-hidden replies on each visible post; it adds no schema, dependency or per-post request loop. Reply summaries now include the author's public image URL.

`PostReplies.svelte` fetches the existing paginated GET replies endpoint only when a conversation is first expanded. Closing the thread hides rather than unmounts it, retaining an unfinished reply. Write a reply explicitly reveals and focuses the shared textarea. Submission uses the existing post-detail server form action (including its membership and parent-visibility checks), retains text on failures, updates the local count and reloads replies after a confirmed successful redirect. Native form submission remains available when enhancement is unavailable. Guest participation links to sign-in; it does not change read/write permissions. Post detail also hides its reply form until explicit writing intent. UI verification for this change remains deferred at the user's request.

Issue #20 composer implementation: `Composer.svelte` uses the root `createPost` form action with `use:enhance`, keeps a submission ID across retries, retains text on failure, and clears only after confirmed success. The shared `Textarea` expands with its content and uses the exported Unicode code-point counter with `MAX_POST_LENGTH`. `maxCount` provides counting and over-limit feedback; it no longer sets native `maxlength` (which counts UTF-16 units). Callers must enforce their limit before submission and validate on the server; an explicitly supplied native `maxlength` is still forwarded. The shared Button uses a decorative Lucide pending spinner with a reduced-motion still state. No dependencies, schema, or theme tokens changed.

The development-only component showcase includes a sample composer. Run its focused browser checks with `pnpm exec playwright test --config tests/e2e/composer.config.ts`; they use the development server and mocked action responses, covering expansion, Japanese/emoji counts, pending and duplicate submission, failure/retry, confirmed-success clearing, unavailable storage, keyboard focus, and widths of 320, 375, and 1280 pixels. They do not verify authenticated D1/R2 persistence. Image-description persistence remains follow-up work for the photo feature.

Issue #22 device drafts: `src/lib/drafts/persistence.ts` saves plain text after a 400 ms pause to `composer_draft_v1_<encoded account ID>`. It restores on mount before scheduling edits, preserving whitespace, line breaks, Japanese and emoji. Existing `composer_draft_<account ID>` drafts are recovered and removed on the next edit/save or clear. Pending text flushes before submission, page hiding, and composer unmount; photos and credentials are never persisted. Publication and Discard cancel queued writes and clear both keys. Both logout forms use `clearUserDraft`, which notifies the mounted composer to cancel and clear before navigation, preventing its timer/unmount flush from restoring a removed draft. Storage failures retain in-memory text and show an honest device-save message; posting remains available. No dependencies, database schema, or tokens changed. Drafts remain device-local; coordination between multiple tabs and cross-device recovery are outside this issue.

Run the persistence unit checks with `pnpm test:unit --run src/lib/drafts/persistence.test.ts`. The composer browser suite also covers immediate reload recovery, account-key isolation, discard before debounce, failure recovery after reload, and logout-clear cancellation. Logout cancellation uses the shared browser event in the showcase; the full authenticated logout journey still needs staging verification.

Pixel assets: keep editable originals under `design/pixel/`, runtime PNG sheets/stills under `src/lib/assets/pixel/`, and a typed registry under `src/lib/pixel/`. These paths are planned, not existing. Each registry entry records asset URLs, logical dimensions, frame count/layout, FPS, playback duration and still fallback. Record creator/source, usage rights and export instructions alongside originals. Import assets through the build for fingerprinting; do not embed base64 art in feature components.

Use a small shared CSS sprite implementation with discrete frame stepping; no animation engine is required for the first asset set. Treat export dimensions and registry metadata as one contract. Keep initial-route sprite transfer under a proposed 50 KiB total, measure actual exports, and lazy-load nonessential scenes. Reserve display dimensions and avoid blocking content on art downloads. The status text must render without JavaScript or assets. Pause animations offscreen, respect reduced motion and the animation-off setting, and stop decorative loops after five seconds. Verify first/last frame alignment, immediate completion when work finishes, missing assets and slow-network behavior in the component showcase.

Use Vitest for policy, schema, pagination and domain failure behavior; local D1/R2 integration checks for actual persistence semantics; Playwright for login-state boundaries, creating/replying/deleting, draft isolation, keyboard use and upload failures. Real Google OAuth gets separate staging smoke checks. No production auth bypass.

Render initial feed HTML on the server. Use system fonts, named icon imports, bounded queries, indexed cursors, and lazy-loaded images with dimensions. Avoid client-side fetch waterfalls and downloading all journal history. Image processing must not freeze the composer; text remains usable during upload. Establish a repeatable mobile measurement profile in the scaffold PR, record route JS/image transfer sizes and loading timings, then compare meaningful changes against that baseline.

Foundation is ready when a fresh clone works from written instructions, component variants are reviewable, critical checks run in CI, isolated staging login works, and one feature can follow an existing end-to-end pattern. Docs alone do not satisfy this gate.

## Journal profile and stable columns

Drawing strokes accept an optional validated opacity between 0 and 1. The editor saves the opacity slider value on each new stroke; older strokes without it render at their original opacity. This extends the existing JSON format without another database migration.

Shared `ModalDialog` supports `fullscreenOnMobile`. Below 640px it anchors all four edges to the viewport, removes desktop centering transforms, includes padding in its constrained width and allows vertical scrolling. Both the drawing editor and Create post use this option to avoid conflicting desktop/modal positioning on phones.

The root layout owns a request-scoped sidebar context. Shell instances share its width and collapsed state across client navigation, restoring browser preferences once rather than replaying a collapse animation whenever a page opens. No per-user state is stored in a server module global.

The My journal profile header displays a shallow drawing banner beside the avatar and name, with a placeholder when empty, and a compact Edit profile link. The profile description reserves a line even when empty.

AppShell now owns the reading grid and an optional `rightRail` snippet. At desktop widths the 18rem right track remains allocated on Home, My journal, post detail and Settings, even when no panel is rendered; routes must not add another centering container or page padding. Smaller screens keep a single column.

My journal reads the signed-in user's description and banner through `$lib/server/profile/update.ts` and links to `/profile/edit` for all profile changes. Migrations `0004_profile_description.sql` and `0005_profile_banner.sql` add nullable `user.description` and `user.banner` columns without changing auth/session contracts. Apply `pnpm db:migrate:local` for development; apply the checked-in migrations to each deployment database before releasing this code. No new dependencies or tokens are required. These fields currently appear only in the owner's My journal header; public profile pages remain outside this change.

The protected `/profile/edit` load selects only name, image, description and banner. Its default form action derives the target from the session and validates names (1-80 characters) and descriptions (200 Unicode code points); blank descriptions clear the field. It returns to My journal after saving. Fields survive validation/storage failures, and client photo previews use temporary object URLs that are revoked when no longer needed.

`BannerEditor.svelte` opens the shared modal with an 800 by 320 drawing surface. Pen, pencil, translucent marker and eraser tools share color presets from semantic tokens, a custom drawing color and four sizes. Mouse/touch/stylus input uses pointer capture; keyboard arrows move the cursor and Space starts/ends a stroke. Undo/redo retains up to 30 edits; Clear is undoable. Use drawing stages the artwork in the profile form; Cancel or closing the modal discards that editing session. Save profile persists it, and failed saves preserve the drawing. Removing a banner is staged until Save profile.

Banner data is versioned JSON, not uploaded SVG or a cover photo. Server validation bounds it to 48 KiB, 120 strokes and 2,500 total integer-coordinate points, checks tools/colors/sizes, and rejects unknown fields. Rendering creates only fixed SVG circles/polylines with validated values; no raw markup is inserted. Eraser strokes paint with the canvas surface color. The drawing can be reopened and edited after saving. The existing profile multipart body limit covers the 5 MiB photo plus drawing and form overhead. Banner editing requires JavaScript, does not provide device-local draft recovery, and concurrent banner saves use the last successful write.

Profile photos reuse the byte-signature, size and dimension checks from the existing photo uploader (JPEG/PNG/WebP, up to 5 MiB), with the existing per-account upload limiter. The image URL is assigned by the server, never accepted from submitted fields. Database writes are scoped to the authenticated user and compare the previous image to prevent concurrent photo replacement from deleting an active image. New objects are cleaned up on failed writes; old local profile objects are cleaned up only after successful replacement/removal, using the shared retry helper. Cleanup failures remain logged for operational follow-up. No new schema beyond migration 0004 or dependencies are required.

`/api/profile/photo/[photoId]` publicly serves only an allowed-type object currently referenced by a user?s profile. Replaced, removed and unassigned objects return 404. Responses use no-store and nosniff. This is separate from post attachments, whose parent-visibility rules remain unchanged. User profile images are public, as disclosed on the edit page. Photos retain the existing uploader?s limitations: validation does not decode/re-encode or strip image metadata.

Run journal, edit-profile, profile/banner-validation, profile-domain and photo-endpoint unit tests. Browser verification covers the journal link, initial fields, photo preview/removal, drawing with pointer and keyboard input, undo/redo, cancelled edits, pending and failure/retry, saved artwork, sidebar state, unchanged reading-column alignment and 320px layout. Run the focused browser regression with `pnpm exec playwright test --config tests/e2e/profile.config.ts`; it mocks browser load/action responses and does not verify real authentication or R2 persistence.
