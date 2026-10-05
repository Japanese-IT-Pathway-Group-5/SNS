# Design system

Status: selected implementation baseline, September 22, 2026. Components and CSS are not implemented yet. Change shared decisions here before introducing a competing pattern.

## Feeling and layout

A cozy, playful everyday journal with the warmth of a small handheld game. The user's "Don't Wake Roko" reference establishes pale mint, muted teal, peach, lime and cream, with friendly rounded shapes. Its illustration is smooth; our decorative art will use crisp pixel sprites. Create an original identity and mascot rather than incorporating the reference character, lettering or Playdate badge. Mascot design and product name remain open.

Text carries the interface; photos are optional. Keep reading surfaces quiet and concentrate pixel art in loading, empty and success states. Avoid dashboard widgets, decorative gradients, glass effects, large hero sections, and engagement counters inside the signed-in experience. This direction replaces the earlier off-white/forest-green palette.

- The shared AppShell owns page spacing and reading-column alignment for Home, My journal, post detail and Settings. Below 1280px, use one column with a maximum reading width of 42rem, 1rem side padding on phones and 1.5rem on wider screens. At 1280px and above, use a centered 72rem content grid with a reading column, 2rem gap and a reserved 18rem right column. Keep that right column allocated even when its optional rightRail snippet is absent, so navigation does not recenter the reading column. Routes provide their main content without duplicating layout widths or page padding.
- Shared navigation on Home, post detail and Settings: full-width teal navbar with Claymore linked home, centered text search, an icon to create a post, and avatar/profile or sign-in controls. Put Home in the left sidebar. Desktop navigation defaults to a 15rem sidebar with a scrollable navigation area; its labeled toggle collapses it to a 4rem icon rail and releases that space to the content. Drag its invisible right edge to resize the expanded sidebar between 192 and 320px. Drag inward past 128px to collapse to the 64px icon rail; drag outward past that threshold to expand again. The handle stays available in both modes and supports Left/Right arrows in 16px steps (Left at the expanded minimum collapses; Right from collapsed restores the saved width), Home to collapse, End to maximize, and Enter to toggle. Keep accessible names, hover titles and active-page indicators in the rail. Inactive navigation uses the lighter surface-muted background on hover; the active page keeps accent-soft and its semibold accent label, including when hovered. Remember the non-sensitive collapsed state and expanded width on this device; unavailable storage must not prevent toggling or resizing. Animate collapse/expand and content padding together over 160ms; disable that transition during dragging and for reduced-motion preferences. Phones use the full-label keyboard-accessible drawer independently of the desktop preference. A My journal link should only appear once the archive page exists. Keep targets at least 44px and accessible names for icon controls.
- Search submits a bounded text query for public posts and preserves it across cursor pages. Show empty/error states and chronological results. Create post opens one shared composer dialog; guests sign in first. Keep one mounted composer per page so local drafts cannot overwrite each other.
- The create-post dialog follows the login styling: a compact teal header with the existing decorative artwork, a single mint body, cream fields that turn soft green with an offset teal outline on focus, and an outlined optional-photo control. Keep the author above the full-width writing field, retain public visibility and draft feedback, and allow the dialog to scroll on short screens.
- At the user's request, Home includes a right-hand Trending journals panel. It shows up to five authors active in the past seven days, with their latest visible entry and no public activity totals. Entries link to the actual post. Keep the reading column narrow; the panel sits beside it on wide screens and below it on smaller screens. Give the panel independent empty/failure states.
- Home: inline composer, newest-first posts, explicit "Load older posts", and "You're caught up" when there are no more results.
- Post detail: complete entry and flat replies. Journal: a compact profile header with the signed-in user?s avatar, name and optional saved description, followed by the same post component grouped by date. An Edit profile link opens /profile/edit for name, profile photo and description editing, with a 200-character description limit, pending/error states and preserved fields on failed saves. The edit page includes the banner drawing editor; it does not accept banner-photo uploads. Settings: private account email, a profile-editor link, reduced-motion preference and sign-out. Account-removal support remains follow-up work until a real contact/process is assigned.
- Feed entries use separate warm-cream journal containers with soft mint borders, rounded corners, comfortable text spacing and a quiet action divider. Keep them free of heavy shadows and popularity controls. The composer uses the same warm-cream surface.
- Shared PostCard displays author, linked accessible time, full text and an optional uncropped photo. At the user's request, its reply button includes the number of visible replies and expands an inline reading thread. Opening replies does not show or focus a writing field; a separate Write a reply action reveals it. Reply counts describe the conversation; likes and popularity totals remain absent. Older replies use explicit pagination. The feed uses explicit Older entries navigation and shows its end message only when no next cursor exists; load failures have a retry state distinct from an empty journal.
- Support 320px-wide layouts, 200% zoom, long words, emoji, and Japanese input without horizontal page scrolling. Do not truncate short entries to force detail-page visits.

## Styling stack

Account & settings uses compact Account and Preferences sections: the private account email, a profile-editor link, a named Reduce motion switch, and a direct sign-out form with device-draft feedback. Omit the duplicated avatar/name hero, membership date, static language badge and extra sign-out confirmation. Profile editing remains on its dedicated page; do not add inactive controls for deferred account features.

The eraser shows a contrasting footprint outline under the pointer or finger, sized in the same drawing coordinates as the stroke. It scales with artwork zoom and canvas height and follows keyboard drawing input; hide it when leaving the canvas or using the hand tool.

Brush size and opacity use labeled sliders with live values: 1-32 canvas pixels and 1-100 percent. Each stroke saves its selected opacity; pencil and marker retain their softer base appearance. Existing drawings without an opacity field keep their original appearance.

Drawing tools use distinct Font Awesome pen, pencil, highlighter and eraser icons with short labels. On phones, keep controls compact, give the fitted canvas only its natural height, and reserve the taller viewport for optional zoom. Hide keyboard instructions visually on touch layouts and keep the dialog actions at the bottom. Emit semantic theme variables statically so drawing palette swatches remain available even when referenced dynamically by SVG artwork.

The shared Create post dialog fills the viewport on phones, with square outer corners and the teal header flush to the screen edges. The header keeps its natural height, reserves a separate close-button column, respects the top safe area, and omits decorative background artwork on phones. Scroll the content instead of shrinking the header. Larger screens retain the centered composer modal.

The compact Edit profile button sits below the journal banner display, aligned to its right edge, and retains its Font Awesome edit icon. Keep it outside the artwork, including when the banner is empty.

Place page-level Go back controls above the title and subtitle. The phone drawing editor starts with the entire banner fitted to the screen width so both edges are visible. Its arrows icon makes the canvas frame taller while keeping the width fixed, with all four borders visible. Separate magnifier icons zoom the drawing inside that frame; the hand pans the zoomed artwork without moving the frame. Returning to normal height restores the banner aspect ratio. Actions follow the controls without a large automatic spacer.

All back navigation uses shared `BackButton.svelte`: the link button variant, a 16px Lucide left chevron at 60% opacity, teal text and an underline on hover, with visible keyboard focus. Keep contextual destination labels where helpful. This adapts the supplied React/shadcn reference in the existing Svelte UI directory without adding React dependencies.

Edit profile and Draw your banner use Font Awesome edit/paintbrush icons at the user's request. The drawing editor fills the viewport on phones and uses the shared modal on larger screens. Desktop pages reserve scrollbar space to keep their reading columns aligned between short and long pages.

Profile banners are drawings, not uploaded cover photos. Edit profile opens a larger drawing modal with pen, pencil, marker, eraser, colors, sizes and undo/redo. Use drawing updates the display preview; Save profile saves it to the account. Keep drawing controls out of the journal display. Drawing colors may be freely chosen within the artwork; control surfaces continue to use semantic tokens. Saved artwork uses the warm surface background.

The journal profile uses the user's requested Facebook-style composition: a full-width drawing banner above the profile, a circular avatar overlapping its lower-left edge, and the name and description below the banner. Keep the banner compact (128px on phones, 160px on larger screens) and independent of text length. The avatar is 80px on phones or 96px on larger screens with a canvas-colored separating ring. On desktop, name and description sit beside the avatar; on phones they sit below it. Edit profile stays outside the banner on the right. Reserve a description line when empty. The empty banner is a quiet illustration placeholder without input styling, a dashed border or editing controls. Keep the sidebar at its current width and collapsed state when entering or leaving the profile editor.

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

Lucide remains the functional icon family. At the user's request, the desktop sidebar collapse/expand control uses the already installed Font Awesome double-chevron icons; other sidebar navigation retains Lucide. The toggle sits above the navigation divider without a section heading. Posting stays available from the navbar and home composer rather than a duplicate sidebar shortcut. Search is available from the navbar only; the sidebar contains Home, My journal and account settings. Profile/sign-in controls appear in the navbar only, with no duplicate sidebar footer. Home remains active when viewing search results. Original pixel sprites are decorative illustrations, not a competing set of navigation icons. Do not pixelate user-uploaded photos or replace clear action labels with mascot gestures.

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
- Show "Posts are visible to everyone". There is no audience selector until multiple audiences actually exist.
- Submit copy: "Post", then "Posting...". Disable duplicate submission. Do not announce success until the server confirms it. Preserve text on failure; explain when a file must be reselected.
- Autosave text locally, scoped to user and schema version; disclose "Draft saved on this device" and provide Discard. Clear on logout/publication/discard. Never briefly show another account's draft. If browser storage is unavailable, posting still works.
- Show upload preview and remove control. Offer an optional image description; use a meaningful generic fallback when absent rather than a filename. Reserve image space, avoid forced square cropping, and lazy-load below-fold images.
- Date grouping follows the viewer's local timezone; store timestamps in UTC and expose an exact date/time on detail. Provide a neutral server-rendered date until local formatting is available without hydration mismatch.
- Destructive actions ask a clear confirmation; success does not erase an unrelated draft. Errors say what to do next, without guilt or developer terminology.

## Acceptance before feature UI spreads

Review the composer and two reference posts (one line of text, one longer entry with photo) at 375px and 1280px. Include the mint/cream surfaces, peach/lime accents, one pixel loading state and its still fallback in the showcase. Verify contrast, keyboard traversal, focus visibility, form errors, reduced motion, missing-asset behavior, and readable Japanese/emoji. Use those references for every feature PR. No large UI library, animation package, font download, or analytics client without a concrete need and documented tradeoff.
