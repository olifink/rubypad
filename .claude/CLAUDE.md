# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**RubyPad** is a mobile-first, offline-capable Ruby IDE that runs entirely in the browser. It uses CRuby 4.0 WASM (via `ruby.wasm`) for execution in a Web Worker, CodeMirror 6 for editing, and Angular Material 3 for UI. Built as a PWA targeting Android tablets and Chromebooks.

## Commands

```bash
npm start          # Dev server (http://localhost:4200), service worker disabled
npm run build      # Production build → dist/rubypad/
npm test           # Run unit tests with Vitest via Angular CLI
npm run icons      # Regenerate PWA icons from source SVG (scripts/generate-icons.mjs)
npm run docs       # No-op stub — Ruby docs are hand-authored in public/assets/docs.json
```

Tests use Vitest with Angular's `@angular/build:unit-test` builder. Test files are `*.spec.ts` co-located with their source.

## Architecture

### Angular Application

Single-page Angular 21 app with no feature routes (only a root route). All components are standalone, use signals for state, and `ChangeDetectionStrategy.OnPush`.

**Root component** (`src/app/app.ts`) orchestrates layout (editor/both/panel modes with a draggable splitter), keyboard shortcuts (`Ctrl+R` run, `Ctrl+S` save, `Ctrl+O` open, `Ctrl+?` docs), and coordinates all services.

**Component → Service map:**

| Component | Path | Purpose |
|---|---|---|
| `App` | `src/app/app.ts` | Root shell; layout, shortcuts, file I/O |
| `EditorComponent` | `src/app/editor/` | CodeMirror 6 with Ruby syntax; emits `codeChange` + `cursorInfo`; dark/light theme via Compartment |
| `ConsoleComponent` | `src/app/console/` | Output display; auto-scrolls |
| `ReplComponent` | `src/app/repl/` | xterm.js REPL terminal; lazy-init on first render |
| `DocumentationComponent` | `src/app/docs/` | Symbol lookup at cursor via word-regex |

| Service | Path | Purpose |
|---|---|---|
| `RunnerService` | `src/app/runner/` | Spawns `ruby.worker`; exposes `isReady` signal + async `run(code)` returning `OutputLine[]`; routes worker messages to ReplService via Subjects |
| `ReplService` | `src/app/repl/` | Local input accumulation → worker `repl-input`; wires xterm.js; `resetRepl()` posts soft-reset |
| `ShareService` | `src/app/share/` | LZ-compresses `{ v:1, c:code }` into `?s=` query param |
| `StorageService` | `src/app/storage/` | Debounced + immediate flush to `localStorage` key `rubypad_code` |
| `ThemeService` | `src/app/theme/` | `light`/`dark`/`system` toggle; `effectiveIsDark` computed signal |
| `DocumentationService` | `src/app/docs/` | Loads `assets/docs.json`; merges with `KEYWORD_DOCS` for Ruby keywords |
| `EditorContextService` | `src/app/docs/` | Resolves word at cursor position via regex |
| `VirtualKeyboardService` | `src/app/virtual-keyboard/` | Virtual Keyboard API (`overlaysContent = true`); CSS `env(keyboard-inset-height)` |

### Ruby WASM Web Worker Bridge

The CRuby 4.0 WASM runtime runs in a dedicated Web Worker (`src/app/ruby.worker.ts`).
- `ruby.wasm` is self-hosted at `public/rubywasm/ruby.wasm` (copied from `node_modules/@ruby/4.0-wasm-wasi/dist/ruby.wasm` via `postinstall` script)
- Worker protocol: `{ type: 'init' | 'run' | 'repl-input' | 'reset', id?, code? }` → `{ type: 'ready' | 'result' | 'repl-output' | 'reset-done', id?, out?, err? }`
- Stdout/stderr are captured via `$stdout`/`$stderr` Ruby overrides using `JS.global[:__rubypad_out__]`

`RunnerService` owns the Worker lifecycle. `ReplService` sends messages via `runner.getWorker()`.

### REPL Design

- xterm.js terminal in `public/rubywasm/` (moved from pyscript/)
- Input accumulated locally (not forwarded char-by-char)
- Multi-line detection via keyword depth heuristic (def/class/if/begin vs end)
- On Enter: if complete → `{ type: 'repl-input', code }` → worker evaluates → output written to terminal
- Reset: `{ type: 'reset' }` → worker clears user constants → terminal cleared

### Theming & Styles

- `src/material-theme.scss` — Angular Material 3 dynamic theme (M3 system tokens, Red primary = Ruby red)
- `src/styles.css` — Global styles + `env(keyboard-inset-height)` viewport fix
- Fonts (Roboto, Roboto Mono, Material Icons) and all runtime assets are bundled locally for offline use

### Share URL Format

Share URLs encode a versioned JSON payload compressed with `lz-string`:
- Current: `{ v:1, c:"<code>" }` → LZ-compressed → `?s=<encoded>`
- Legacy (v0/v1 with packages): backward-compatible decode; packages field ignored in RubyPad

---

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection
