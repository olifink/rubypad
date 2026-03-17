import { Injectable, signal, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';

/** A single line of output from a Ruby run, tagged as normal output or error. */
export interface OutputLine {
  text: string;
  isError: boolean;
}

/**
 * Normalises a single Ruby error line from the WASM runtime:
 * - Filters out internal `-e:in 'Kernel.eval'` stack frames.
 * - Rewrites `eval:N:in '<main>':` → `line N:` and
 *   `eval:N:in 'method':` → `line N (in 'method'):`.
 */
function cleanErrorLine(line: string): string | null {
  if (/^-e:/.test(line)) return null;
  return line
    .replace(/^eval:(\d+):in '<main>':\s*/, 'line $1: ')
    .replace(/^eval:(\d+):in '([^']+)':\s*/, 'line $1 (in \'$2\'): ');
}

@Injectable({ providedIn: 'root' })
export class RunnerService {
  private readonly destroyRef = inject(DestroyRef);

  /** True once the ruby.wasm runtime has initialised in the Web Worker. */
  readonly isReady = signal(false);

  private readonly worker: Worker;
  private readonly pending = new Map<string, (result: { out: string; err: string }) => void>();
  private msgCounter = 0;

  /** Observable that emits repl-output messages for ReplService to subscribe to. */
  readonly replOutput$ = new Subject<{ out: string; err: string; val?: string }>();
  /** Observable that emits reset-done messages for ReplService to subscribe to. */
  readonly resetDone$ = new Subject<void>();

  constructor() {
    this.worker = new Worker(new URL('../ruby.worker', import.meta.url), { type: 'module' });

    this.worker.addEventListener('message', (e: MessageEvent) => {
      const { type, id, out, err } = e.data as {
        type: string;
        id?: string;
        out?: string;
        err?: string;
      };

      if (type === 'ready') {
        this.isReady.set(true);
      } else if (type === 'error') {
        console.error('[RubyPad] Worker init error:', (e.data as { message?: string }).message);
      } else if (type === 'result' && id) {
        const resolve = this.pending.get(id);
        if (resolve) {
          this.pending.delete(id);
          resolve({ out: out ?? '', err: err ?? '' });
        }
      } else if (type === 'repl-output') {
        const { val } = e.data as { val?: string };
        this.replOutput$.next({ out: out ?? '', err: err ?? '', val });
      } else if (type === 'reset-done') {
        this.resetDone$.next();
      }
    });

    this.worker.addEventListener('error', (e: ErrorEvent) => {
      console.error('[RubyPad] Worker error:', e.message, e);
    });

    this.worker.postMessage({ type: 'init' });

    // Clean up worker on destroy
    this.destroyRef.onDestroy(() => this.worker.terminate());
  }

  /**
   * Executes the given Ruby code string via the Web Worker.
   * Returns captured stdout and stderr split into tagged output lines.
   */
  async run(code: string): Promise<OutputLine[]> {
    if (!this.isReady()) {
      return [
        {
          text: 'Ruby runtime is not ready yet. Please wait a moment and try again.',
          isError: true,
        },
      ];
    }

    const id = String(++this.msgCounter);
    return new Promise((resolve) => {
      this.pending.set(id, ({ out, err }) => {
        const lines: OutputLine[] = [];

        if (out) {
          const outLines = out.split('\n');
          if (outLines.at(-1) === '') outLines.pop();
          outLines.forEach((text) => lines.push({ text, isError: false }));
        }

        if (err) {
          const errLines = err.split('\n');
          if (errLines.at(-1) === '') errLines.pop();
          errLines
            .map(cleanErrorLine)
            .filter((text): text is string => text !== null)
            .forEach((text) => lines.push({ text, isError: true }));
        }

        resolve(lines.length > 0 ? lines : [{ text: '(no output)', isError: false }]);
      });

      this.worker.postMessage({ type: 'run', id, code });
    });
  }

  /** Returns the underlying Web Worker for use by ReplService. */
  getWorker(): Worker {
    return this.worker;
  }
}
