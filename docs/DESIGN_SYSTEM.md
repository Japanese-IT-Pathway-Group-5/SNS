# Design system

Status: selected implementation baseline, September 22, 2026. Components and CSS are not implemented yet. Change shared decisions here before introducing a competing pattern.

## Feeling and layout

A cozy, playful everyday journal with the warmth of a small handheld game. The user's "Don't Wake Roko" reference establishes pale mint, muted teal, peach, lime and cream, with friendly rounded shapes. Its illustration is smooth; our decorative art will use crisp pixel sprites. Create an original identity and mascot rather than incorporating the reference character, lettering or Playdate badge. Mascot design and product name remain open.

Text carries the interface; photos are optional. Keep reading surfaces quiet and concentrate pixel art in loading, empty and success states. Avoid dashboard widgets, decorative gradients, glass effects, large hero sections, and engagement counters inside the signed-in experience. This direction replaces the earlier off-white/forest-green palette.

- One column, maximum reading width 42rem; 1rem side padding on phones and 1.5rem on wider screens.
- Header: working app name, Home, My journal, and an account menu containing Settings. On small screens preserve text labels and comfortable targets; do not add a second navigation system.
- Home: inline composer, newest-first posts, explicit "Load older posts", and "You're caught up" when there are no more results.
- Post detail: complete entry and flat replies. Journal: the same post component grouped by date. Settings: profile, draft controls, logout, and removal/contact information.
- Feed entries use whitespace and subtle dividers rather than stacks of heavy cards. The composer uses a bordered warm-cream surface.
- Support 320px-wide layouts, 200% zoom, long words, emoji, and Japanese input without horizontal page scrolling. Do not truncate short entries to force detail-page visits.

## Styling stack

Use Tailwind CSS v4 through its SvelteKit/Vite integration. Own a small shared component layer; use Bits UI only for complex primitives such as dialogs and menus. Use native buttons, links, inputs and textareas for simple controls. No additional UI framework or second icon family.

Tailwind documents its [SvelteKit integration](https://tailwindcss.com/docs/installation/framework-guides/sveltekit/). Bits UI provides unstyled Svelte primitives with accessibility-oriented behavior; wrappers still need keyboard and screen-reader verification. [Bits UI](https://bits-ui.com/docs/getting-started)

Put semantic theme tokens in `src/app.css` using Tailwind v4 `@theme`. Reset the default color namespace if necessary so feature code cannot silently introduce an unrelated palette. Feature components use semantic utilities such as `bg-surface`, `text-ink`, `text-muted`, `border-line`, and `bg-accent`; raw hex values belong only in the token file. Avoid dynamically constructed utility names such as `bg-${color}`; use explicit variant maps.

## Color tokens

Light mode first. Dark mode is deferred until a full semantic palette can be tested together. These are reference-inspired UI values, not exact sampled colors. Pastel teal, peach and lime supply personality; darker functional colors preserve readability.

| Token / utility suffix | Value   | Role                                               |
| ---------------------- | ------- | -------------------------------------------------- |
| canvas                 | #E8F8EF | Pale mint page background                          |
| surface                | #FFFCF5 | Warm cream composer, menus, dialogs                |
| surface-muted          | #DCEEE5 | Quiet hover and supporting areas                   |
| ink                    | #233E3C | Deep teal primary text                             |
| muted                  | #506965 | Metadata, helper text, placeholders                |
| accent                 | #326B66 | Dark teal primary action, links, focus ring        |
| accent-hover           | #275651 | Primary action hover                               |
| on-accent              | #FFFFFF | Text on primary actions                            |
| accent-soft            | #D3EAE3 | Subtle selected background with accent text        |
| teal-soft              | #78B4AE | Decorative art and brand accents; use ink text     |
| peach                  | #FFB78E | Gentle highlights and sprite details; use ink text |
| lime                   | #CEDF91 | Sprouts and supporting art; use ink text           |
| butter                 | #F3E5A5 | Small decorative highlights; use ink text          |
| line                   | #C7DDD3 | Decorative dividers only                           |
| control-border         | #6D8880 | Necessary input/control boundaries                 |
| danger                 | #A52C36 | Error/destructive text and buttons                 |
| on-danger              | #FFFFFF | Text on destructive buttons                        |

Do not use `line` for a control whose boundary is necessary to identify it. Text targets: at least 4.5:1 contrast; required control boundaries and focus indicators: at least 3:1 against adjacent colors. Test actual states and color pairs, not just these base swatches. Never rely on color alone. [WCAG text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

## Typography, spacing, shape and motion

- Use a system sans-serif stack: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans JP", sans-serif`. Noto Sans JP is an optional locally available fallback, not a required web-font download.
- Body and inputs: 1rem/1.6; metadata and helper text: 0.875rem/1.5; page heading: 1.5rem/1.3. Normal text weight 400, controls/headings 600. No all-caps section labels.
- Pixel lettering is optional for the future wordmark or tiny decorative labels only. Keep posts, navigation, buttons, forms and status messages in the readable system font. Do not introduce a blocking font download.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48px. Define layout exceptions centrally rather than accumulating arbitrary values.
- Radius: controls 8px, composer/dialog 12px, avatar circular. Minimal shadow, reserved for floating menus/dialogs.
- Controls target at least 44x44px. Visible 2px focus outline with offset. Body links are underlined.
- Transitions: 120-160ms for color/opacity; honor reduced-motion preferences. No entrance animation on every feed item and no layout shifts on hover.

## Icons

Use the current Lucide Svelte package, `@lucide/svelte`, with named imports verified against the pinned version. Default size 20px, metadata 16px, stroke width 1.75, color `currentColor`. Do not import the entire icon registry. [Lucide Svelte documentation](https://lucide.dev/guide/svelte)

Suggested vocabulary: house for Home, notebook for My journal, image for Add photo, message circle for Reply, ellipsis for entry actions, settings for Settings, trash for Delete, and X for Close. Verify exported names during scaffolding. Icons next to visible text are decorative (`aria-hidden`); icon-only buttons need an accessible label. Tooltips do not replace names. Use Google's official sign-in branding separately; do not approximate its logo with a generic icon.

Lucide remains the functional icon family. Original pixel sprites are decorative illustrations, not a competing set of navigation icons. Do not pixelate user-uploaded photos or replace clear action labels with mascot gestures.

## Pixel art and animation

Use one shared art style: 32x32 logical pixels for small objects and 48x48 for mascot scenes; transparent backgrounds, a consistent pixel grid, and a limited palette derived from the tokens above. Allow documented art-only shades for outlines/highlights without adding new UI colors. No blurred edges or independently styled mascots per feature.

- Export lossless PNG sprite sheets and a still PNG fallback. Keep frames equal-sized with stable registration; no jitter from changing canvas bounds. Display at native or integer multiples with crisp pixel rendering, never stretched to fit a container.
- Start with 4-8 frames at 6-10 frames per second. Use discrete frame changes; reserve continuous CSS transitions for ordinary control states. Success animation plays once for at most one second.
- Shared `PixelArt` renders a still; `PixelAnimation` plays registered assets; `LoadingState` pairs a sprite with real status text. Feature code chooses an asset/state and does not invent animation timing.
- Loading follows real pending work. Never delay navigation or publication to finish a loop. Keep an already-rendered page visible during background work; use inline loading for uploads, pagination and posting. An initial loading view is allowed only when the initial content genuinely cannot be shown.
- Reduced motion or the app's animation-off setting uses the still frame. Stop decorative loops after five seconds and when hidden/offscreen. No flashing, bouncing whole pages or perpetual mascot on every post.
- Always retain readable text: "Getting things ready...", "Posting...", "Posted". Announce state changes once, not every frame. Decorative sprites are hidden from assistive technology; meaningful still illustrations receive descriptive alternative text.
- A failed or missing sprite must leave a usable status label. Real upload progress may be shown when measurable; never invent percentages.

Initial asset list (concepts pending artwork):

| State                   | Pixel art idea                            | Behavior                                         |
| ----------------------- | ----------------------------------------- | ------------------------------------------------ |
| Initial content loading | Original little creature tending a sprout | Short pending loop, still after five seconds     |
| Publishing              | Notebook closing or envelope folding      | Pending animation stops on server result         |
| Published               | Tiny sprout sparkle                       | One brief play after confirmed success           |
| Empty journal           | Open notebook with a small sprout         | Still illustration                               |
| Uploading               | Little picture frame                      | Small inline animation alongside status/progress |

For the deadline, prioritize one reusable pending animation and one empty-journal still; the other scenes are polish. Review the original mascot silhouette and first sprite before expanding the asset set. Artwork production is a separate task; no sprites currently exist.

## Shared component contracts

Create these before splitting feature UI work. Variants live in components, not copied class strings in pages.

| Component                 | Contract                                                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Button                    | `primary`, `secondary`, `ghost`, `danger`; sizes `sm`, `md`; pending and disabled; default native type is `button`, submit explicit |
| TextField / TextArea      | Visible label, description, error association, disabled/required; forward native form attributes                                    |
| Avatar                    | Fixed dimensions, initials fallback; no broken-image layout shift                                                                   |
| Dialog / DropdownMenu     | Bits UI wrappers, shared tokens, focus restoration, Escape handling, keyboard navigation                                            |
| FormMessage               | Inline error/success with appropriate live-region behavior; never expose raw server errors                                          |
| EmptyState                | Short explanation and one useful next action                                                                                        |
| PixelArt / PixelAnimation | Registered asset, integer scale, fixed dimensions, still fallback, reduced-motion/animation-off support                             |
| LoadingState              | Real pending state, optional shared sprite, readable status and accessible announcement                                             |
| PostComposer              | Labeled textarea, audience text, optional image/alt description, submit, status, draft recovery                                     |
| PostCard                  | Author, semantic timestamp, preserved text line breaks, optional image, reply link, authorized actions                              |
| ReplyList / ReplyComposer | Flat replies, pagination, inherited audience, inline failures                                                                       |

Keep primitive components in `src/lib/components/ui/`, layout in `layout/`, and domain UI in `posts/`, `replies/`, `journal/`. Add a development-only component showcase at `/dev/components`, returning 404 outside development. Show variants, long content, loading, empty, error, disabled and keyboard-focus states. This is the team's visual reference; Storybook is not required initially.

## Composer behavior and copy

- Visible label: "Today's entry". Placeholder: "Anything from today?". No title/tag/category gate.
- At least text or one valid image is required. Post limit 2,000 Unicode code points; reply limit 500. Count identically on client/server; preserve line breaks and do not submit on Enter. Handle IME composition correctly.
- Optional "Need an idea?" reveals a static prompt such as "Something you noticed". No model call is needed.
- Show "Shared with pilot members". There is no audience selector until multiple audiences actually exist.
- Submit copy: "Post", then "Posting...". Disable duplicate submission. Do not announce success until the server confirms it. Preserve text on failure; explain when a file must be reselected.
- Autosave text locally, scoped to user and schema version; disclose "Draft saved on this device" and provide Discard. Clear on logout/publication/discard. Never briefly show another account's draft. If browser storage is unavailable, posting still works.
- Show upload preview and remove control. Offer an optional image description; use a meaningful generic fallback when absent rather than a filename. Reserve image space, avoid forced square cropping, and lazy-load below-fold images.
- Date grouping follows the viewer's local timezone; store timestamps in UTC and expose an exact date/time on detail. Provide a neutral server-rendered date until local formatting is available without hydration mismatch.
- Destructive actions ask a clear confirmation; success does not erase an unrelated draft. Errors say what to do next, without guilt or developer terminology.

## Acceptance before feature UI spreads

Review the composer and two reference posts (one line of text, one longer entry with photo) at 375px and 1280px. Include the mint/cream surfaces, peach/lime accents, one pixel loading state and its still fallback in the showcase. Verify contrast, keyboard traversal, focus visibility, form errors, reduced motion, missing-asset behavior, and readable Japanese/emoji. Use those references for every feature PR. No large UI library, animation package, font download, or analytics client without a concrete need and documented tradeoff.
