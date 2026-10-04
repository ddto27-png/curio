# Curio

A paper-inspired collection of creative projects, technology, and businesses worth making something of.

## First-release reset

This branch starts from the working main-branch prototype. It retains all 19 editorial entries, the original illustrations and paper design, the tear-off discovery interaction, three historical/regional place references, and the four navigation tabs: Explore ideas, Places, Saved ideas, About.

It replaces the hash router and dialog-only stories with generated HTML pages. Every story can be read and shared directly without JavaScript. JavaScript enhances filtering, tear gestures, map selection, and browser-local saving. The original foundation PR is a separate reference; this branch does not include its unfinished authentication or notes code.

## Build and verification

Node 22 or newer is the only requirement. There are no npm dependencies to install.

```sh
node scripts/check.mjs
```

This syntax-checks the modules, runs 17 automated tests, and builds 24 HTML pages into `dist/`. Tests cover catalog integrity, safe text rendering, save persistence and failure behavior, existing-save compatibility, category/theme filtering, URL state, navigation, story content, internal link targets, and reproducible output. They do not substitute for browser interaction, mobile visual, or deployed-host verification.

For an optional local preview:

```sh
node scripts/build.mjs
node scripts/serve.mjs
```

Open http://127.0.0.1:3000. This preview serves generated output only; it is not the intended public host.

## Vercel

`vercel.json` selects no framework, runs the full verification command, and publishes only `dist/`. No environment variables, database, or build-time network calls are needed. Directory routes have trailing slashes. Unknown paths use the generated 404 page, with no catch-all rewrite to the homepage.

Import `ddto27-png/curio` into Vercel, use the repository root, and choose the `codex/curio-first-release` branch for a preview. Keep the production branch on `main`; do not replace production until the preview is reviewed. The Vercel integration must be connected before an agent can create or verify a hosted preview. No deployment is implied merely by this configuration being present.

References: https://vercel.com/docs/project-configuration and https://vercel.com/docs/git

The GitHub Actions job `Build and test` runs the same verification on pull requests and pushes to main or this branch. Once it has run successfully, it can be selected as a required branch-protection check. This file does not configure branch protection itself.

## Editing

- `src/catalog.mjs`: published stories, sources, categories, themes, and featured IDs.
- `src/pages.mjs`: shared shell and page layouts.
- `src/about.mjs`: manifesto.
- `src/art.mjs`: original SVG illustrations.
- `src/cards.mjs`: escaped story-card markup.
- `src/discovery.mjs`: filtering and URL compatibility.
- `src/library.mjs`: browser-save persistence, with an injected storage interface.
- `public/app.mjs`: browser interactions.
- `public/styles.css`: original styling plus page layouts.
- `scripts/`: build, verification, and optional preview server.
- `tests/`: automated verification.
- `research/`: the two original reference collections, unchanged.

Generated pages: `/`, `/places/`, `/saved/`, `/about/`, and `/stories/<id>/`.

Old root hash links still redirect to the corresponding pages. Skip-to-content and collection anchors remain native anchors. Category and theme choices combine, and filter state is reflected in the URL.

## Honest boundaries

Saved ideas remain browser-local under the original `commonwealth-saved` key. No cloud synchronization, profile, account login, or private note storage is claimed. Keeping the storage key preserves existing saves only on the same origin; a different preview domain cannot read another domain's local storage. Concurrent writes from different tabs are not a transactional database.

The collection is a fixed initial edition. No weekly publication cadence is promised. Source facts are inherited from the original collection and have not been re-audited during this rebuild. Places are historical/regional context, not verified current visitor destinations. No contact email or new domain ownership is assumed.

## Next milestone

After checking the Vercel preview on desktop and mobile, implement and test one complete account-backed flow: sign in, save a story, add a private note, and retrieve it on another device. That step must include access-control tests with two users, recoverable drafts, clear failed-save behavior, and explicit guest-save import. Profile customization and a CMS come later.
