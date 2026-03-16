# RubyPad

**RubyPad** is a mobile-first, offline-capable Ruby IDE that runs entirely in the browser. Built for Android tablets, Chromebooks, and web users — no install required.

---

## Architecture

- **Framework:** Angular 21 (signals-based reactivity, standalone components, OnPush)
- **UI:** Angular Material 3 with dynamic theming (Ruby red primary)
- **Editor:** CodeMirror 6 with Ruby syntax (`@codemirror/legacy-modes`) and Material dark/light themes
- **Runtime:** CRuby 4.0 via `@ruby/wasm-wasi` — runs in a dedicated Web Worker to keep the UI responsive
- **REPL:** xterm.js terminal wired to the shared Ruby VM; multi-line input with keyword-depth heuristic
- **PWA:** Service worker + offline asset caching; "Add to Home Screen" on Android/Chromebook

---

## Features

- **Run Ruby code** — `Ctrl+R` executes the editor contents; stdout/stderr captured and shown in the Output tab
- **Interactive REPL** — persistent Ruby VM shared with the runner; soft-reset clears user-defined constants
- **Documentation** — inline Ruby keyword and stdlib docs with links to ruby-doc.org; updates as you move the cursor
- **AI Fix** — Gemini-powered error explanation and fix suggestions
- **Share URL** — LZ-compressed `?s=` query param encodes the current code; one-click copy + QR code
- **Open / Save** — open `.rb`/`.txt` files from disk; download current code as `.rb`
- **Theming** — light / dark / system toggle
- **Virtual keyboard** — viewport shrinks correctly on Android; FAB repositions above the keyboard

---

## Commands

```bash
npm start       # Dev server at http://localhost:4200 (service worker disabled)
npm run build   # Production build → dist/rubypad/
npm test        # Unit tests with Vitest via Angular CLI
npm run icons   # Regenerate PWA icons from source SVG (scripts/generate-icons.mjs)
```

Tests are `*.spec.ts` files co-located with their source.

---

## How it works

### Ruby WASM Web Worker

`ruby.wasm` (~17 MB, CRuby 4.0) is self-hosted at `public/rubywasm/ruby.wasm` and fetched at runtime — it is never bundled by Angular. A `postinstall` script copies it from `node_modules/@ruby/4.0-wasm-wasi/dist/ruby.wasm`.

A single Web Worker (`src/app/ruby.worker.ts`) owns the `DefaultRubyVM` instance. `$stdout` and `$stderr` are replaced with custom Ruby objects that push strings into JS-side buffers via the `js` gem's `JS.global` bridge.

Worker message protocol:

| Direction | Message |
|---|---|
| → Worker | `{ type: 'init' }` |
| → Worker | `{ type: 'run', id, code }` |
| → Worker | `{ type: 'repl-input', code }` |
| → Worker | `{ type: 'reset' }` |
| ← Worker | `{ type: 'ready' }` |
| ← Worker | `{ type: 'result', id, out, err }` |
| ← Worker | `{ type: 'repl-output', out, err }` |
| ← Worker | `{ type: 'reset-done' }` |
| ← Worker | `{ type: 'error', message }` |

### Services

| Service | Path | Purpose |
|---|---|---|
| `RunnerService` | `src/app/runner/` | Spawns the worker; `isReady` signal; async `run(code) → OutputLine[]`; routes repl/reset messages via Subjects |
| `ReplService` | `src/app/repl/` | xterm.js wiring; local line accumulation; multi-line Ruby completeness heuristic; `resetRepl()` posts soft-reset |
| `ShareService` | `src/app/share/` | `buildShareUrl(code)` → LZ-compressed `?s=` param; `getSharedCode()` decodes (backward-compatible with legacy URLs) |
| `StorageService` | `src/app/storage/` | Debounced + immediate flush to `localStorage` key `rubypad_code` |
| `ThemeService` | `src/app/theme/` | `light`/`dark`/`system` toggle; `effectiveIsDark` computed signal |
| `DocumentationService` | `src/app/docs/` | Loads `assets/docs.json`; merges with `KEYWORD_DOCS` for Ruby keywords |
| `EditorContextService` | `src/app/docs/` | Word-at-cursor regex for symbol resolution |
| `VirtualKeyboardService` | `src/app/virtual-keyboard/` | Virtual Keyboard API (`overlaysContent = true`); `env(keyboard-inset-height)` viewport fix |

### Share URL format

```
{ v:1, c:"<ruby code>" }  →  LZ-compressed  →  ?s=<encoded>
```

Legacy v0/v1 URLs (from the original PyPad) decode silently; the packages field is ignored.
