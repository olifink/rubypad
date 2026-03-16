import { Injectable, DOCUMENT, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { filter, take } from 'rxjs/operators';
import { RunnerService } from '../runner/runner.service';

/** Minimal typings for the xterm.js Terminal (bundled inside public/rubywasm/). */
interface XTerminal {
  onData(handler: (data: string) => void): void;
  write(data: string | Uint8Array): void;
  clear(): void;
  reset(): void;
  open(el: HTMLElement): void;
  focus(): void;
  dispose(): void;
  options: Record<string, unknown>;
}
interface FitAddon {
  activate(terminal: XTerminal): void;
  fit(): void;
}
interface XTermModule {
  Terminal: new (options?: Record<string, unknown>) => XTerminal;
}
interface FitAddonModule {
  FitAddon: new () => FitAddon;
}

const PROMPT = '>> ';
const CONT_PROMPT = '.. ';

/** Simple heuristic: count Ruby block-opening keywords vs `end`. */
function isRubyComplete(code: string): boolean {
  let depth = 0;
  for (const line of code.split('\n')) {
    // Strip inline comments
    const stripped = line.replace(/#.*$/, '').trim();
    if (!stripped) continue;

    // Count block openers (but not postfix if/unless on same line as expression)
    const openers = (
      stripped.match(/\b(def|class|module|begin|case|do|while|until|for)\b/g) ?? []
    ).length;

    // Postfix-safe: count `if`/`unless` only when they are the first keyword on the line
    const leadingIf = /^(if|unless)\b/.test(stripped) ? 1 : 0;

    const closers = (stripped.match(/\bend\b/g) ?? []).length;
    depth += openers + leadingIf - closers;
  }
  return depth <= 0;
}

@Injectable({ providedIn: 'root' })
export class ReplService {
  private readonly doc = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly runner = inject(RunnerService);

  /** True once the ruby.wasm worker is ready (same signal as RunnerService). */
  readonly isReady = computed(() => this.runner.isReady());

  /** The xterm FitAddon instance, available after `startRepl()` resolves. */
  fitAddon: FitAddon | null = null;

  private terminal: XTerminal | null = null;
  private inputBuffer = '';
  private multilineBuffer = '';
  private waitingForOutput = false;

  constructor() {
    // Route worker repl-output messages to the terminal.
    this.runner.replOutput$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ out, err }) => {
        this.waitingForOutput = false;
        if (this.terminal) {
          if (out) this._writeLines(out);
          if (err) this._writeLines(err, true);
          this._writePrompt();
        }
      });

    // Route worker reset-done messages.
    this.runner.resetDone$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.terminal) {
          this.terminal.reset();
          this.inputBuffer = '';
          this.multilineBuffer = '';
          this.waitingForOutput = false;
          this._writePrompt();
          this.terminal.focus();
        }
      });
  }

  /**
   * Initialises an xterm.js terminal inside `hostEl` and connects it to the
   * Ruby Web Worker REPL. Safe to call only once. Resolves after the terminal is ready.
   */
  async startRepl(hostEl: HTMLElement, isDark: boolean): Promise<void> {
    // Inject xterm.css once.
    const cssHref = './rubywasm/xterm.css';
    if (!this.doc.querySelector(`link[href="${cssHref}"]`)) {
      const link = this.doc.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssHref;
      this.doc.head.appendChild(link);
    }

    const baseUrl = new URL('rubywasm/', this.doc.baseURI).href;
    const xtermFiles = this._resolveXtermFiles(baseUrl);

    const [{ Terminal }, { FitAddon }] = await Promise.all([
      import(/* @vite-ignore */ xtermFiles.xterm) as Promise<XTermModule>,
      import(/* @vite-ignore */ xtermFiles.fitAddon) as Promise<FitAddonModule>,
    ]);

    const theme = this._themeFor(isDark);

    const terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 14,
      fontFamily: '"Roboto Mono", "Courier New", monospace',
      lineHeight: 1.4,
      theme,
      convertEol: false,
    });

    const fit = new FitAddon();
    fit.activate(terminal);
    this.fitAddon = fit;

    terminal.open(hostEl);
    fit.fit();
    this.terminal = terminal;

    this._writePrompt();
    terminal.focus();

    // Handle user keystrokes locally.
    terminal.onData((chars: string) => {
      if (this.waitingForOutput) return; // ignore input while worker is running

      for (const ch of chars) {
        const code = ch.charCodeAt(0);

        if (ch === '\r') {
          // Enter
          terminal.write('\r\n');
          this._handleEnter();
        } else if (ch === '\x7f' || ch === '\b') {
          // Backspace
          if (this.inputBuffer.length > 0) {
            this.inputBuffer = this.inputBuffer.slice(0, -1);
            terminal.write('\b \b');
          }
        } else if (code === 0x03) {
          // Ctrl+C — cancel current input
          terminal.write('^C\r\n');
          this.inputBuffer = '';
          this.multilineBuffer = '';
          this._writePrompt();
        } else if (code >= 0x20 || ch === '\t') {
          // Printable character or tab
          this.inputBuffer += ch;
          terminal.write(ch);
        }
      }
    });
  }

  /** Updates the terminal colour scheme without restarting the REPL. */
  setTheme(isDark: boolean): void {
    if (this.terminal) {
      this.terminal.options['theme'] = this._themeFor(isDark);
    }
  }

  /**
   * Posts a soft-reset message to the worker, which clears user-defined constants.
   * The terminal is cleared and the prompt is re-shown when `reset-done` is received.
   */
  async resetRepl(): Promise<void> {
    if (!this.terminal) return;
    this.inputBuffer = '';
    this.multilineBuffer = '';
    this.runner.getWorker().postMessage({ type: 'reset' });
  }

  /**
   * Resets the REPL then executes `code` in the worker, displaying output in the terminal.
   * No-op if the terminal has not been started yet.
   */
  async runInRepl(code: string): Promise<void> {
    if (!this.terminal) return;
    await this.resetRepl();
    // Wait for reset-done before sending code.
    await new Promise<void>((resolve) => {
      this.runner.resetDone$.pipe(take(1)).subscribe(() => resolve());
    });
    this._sendCode(code);
  }

  private _handleEnter(): void {
    const line = this.inputBuffer;
    this.inputBuffer = '';

    if (this.multilineBuffer) {
      this.multilineBuffer += '\n' + line;
    } else {
      this.multilineBuffer = line;
    }

    if (!this.multilineBuffer.trim()) {
      // Empty submission
      this.multilineBuffer = '';
      this._writePrompt();
      return;
    }

    if (isRubyComplete(this.multilineBuffer)) {
      this._sendCode(this.multilineBuffer);
      this.multilineBuffer = '';
    } else {
      // Need more input — show continuation prompt.
      this._writeCont(CONT_PROMPT);
    }
  }

  private _sendCode(code: string): void {
    this.waitingForOutput = true;
    this.runner.getWorker().postMessage({ type: 'repl-input', code });
  }

  private _writePrompt(): void {
    this.terminal?.write(PROMPT);
  }

  private _writeCont(prompt: string): void {
    this.terminal?.write(prompt);
  }

  private _writeLines(text: string, _isErr = false): void {
    if (!this.terminal) return;
    // Convert bare LF → CRLF for xterm.
    const output = text.replace(/\n/g, '\r\n');
    this.terminal.write(output);
    // Ensure output ends with a newline before the prompt.
    if (!text.endsWith('\n')) {
      this.terminal.write('\r\n');
    }
  }

  private _themeFor(isDark: boolean): Record<string, string> {
    return isDark
      ? { background: '#1e1e1e', foreground: '#d4d4d4' }
      : { background: '#ffffff', foreground: '#1e1e1e', cursor: '#1e1e1e' };
  }

  /**
   * Returns the filenames for the xterm bundles inside public/rubywasm/.
   */
  private _resolveXtermFiles(baseUrl: string): { xterm: string; fitAddon: string } {
    return {
      xterm: `${baseUrl}xterm-DrSYbXEP.js`,
      fitAddon: `${baseUrl}xterm_addon-fit-DxKdSnof.js`,
    };
  }
}
