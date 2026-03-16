/// <reference lib="webworker" />

import { DefaultRubyVM } from '@ruby/wasm-wasi/dist/browser';

type VM = Awaited<ReturnType<typeof DefaultRubyVM>>['vm'];

let vm: VM | null = null;
const outBuf: string[] = [];
const errBuf: string[] = [];

/** Ruby snippet that redirects $stdout/$stderr to JS-side buffers.
 *  We must define `write` on the object BEFORE assigning it to $stdout/$stderr
 *  because Ruby validates the write method exists at assignment time. */
const STDOUT_SETUP = `
require 'js'

_out = Object.new
def _out.write(s)
  JS.global[:__rubypad_out__].call(:push, s.to_s)
  s.to_s.length
end
def _out.flush; self; end
def _out.sync=(v); v; end
def _out.puts(*args)
  if args.empty?
    write("\\n")
  else
    args.each { |a| write(a.to_s + "\\n") }
  end
  nil
end
def _out.print(*args)
  args.each { |a| write(a.to_s) }
  nil
end
$stdout = _out

_err = Object.new
def _err.write(s)
  JS.global[:__rubypad_err__].call(:push, s.to_s)
  s.to_s.length
end
def _err.flush; self; end
def _err.sync=(v); v; end
def _err.puts(*args)
  if args.empty?
    write("\\n")
  else
    args.each { |a| write(a.to_s + "\\n") }
  end
  nil
end
$stderr = _err
`.trim();

function installBuffers(): void {
  (self as unknown as Record<string, unknown>)['__rubypad_out__'] = {
    push: (s: string) => outBuf.push(s),
  };
  (self as unknown as Record<string, unknown>)['__rubypad_err__'] = {
    push: (s: string) => errBuf.push(s),
  };
}

function collectOutput(): { out: string; err: string } {
  const out = outBuf.join('');
  const err = errBuf.join('');
  outBuf.length = 0;
  errBuf.length = 0;
  return { out, err };
}

self.addEventListener('message', async (e: MessageEvent) => {
  const { type, id, code } = e.data as { type: string; id?: string; code?: string };

  if (type === 'init') {
    try {
      installBuffers();
      // Stream-compile the WASM module, then hand the compiled Module to DefaultRubyVM.
      const resp = await fetch('/rubywasm/ruby.wasm');
      const wasmModule = await WebAssembly.compileStreaming(resp);
      ({ vm } = await DefaultRubyVM(wasmModule));
      // Install stdout/stderr capture after VM is ready.
      installBuffers(); // re-install in case vm.eval resets globals
      vm.eval(STDOUT_SETUP);
      postMessage({ type: 'ready' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[ruby.worker] init failed:', message, err);
      postMessage({ type: 'error', message });
    }
  } else if (type === 'run') {
    outBuf.length = 0;
    errBuf.length = 0;
    try {
      vm!.eval(code!);
    } catch (err: unknown) {
      errBuf.push(err instanceof Error ? err.message : String(err));
    }
    const { out, err } = collectOutput();
    postMessage({ type: 'result', id, out, err });
  } else if (type === 'repl-input') {
    outBuf.length = 0;
    errBuf.length = 0;
    try {
      vm!.eval(code!);
    } catch (err: unknown) {
      errBuf.push(err instanceof Error ? err.message : String(err));
    }
    const { out, err } = collectOutput();
    postMessage({ type: 'repl-output', out, err });
  } else if (type === 'reset') {
    outBuf.length = 0;
    errBuf.length = 0;
    try {
      // Soft reset: remove user-defined constants (best-effort).
      vm!.eval(`
Object.constants.each do |c|
  next if [:Object, :Module, :Class, :BasicObject, :Kernel, :NilClass,
            :TrueClass, :FalseClass, :Numeric, :Integer, :Float, :String,
            :Symbol, :Array, :Hash, :Range, :Regexp, :Proc, :Method,
            :IO, :File, :Dir, :Encoding, :Fiber, :Thread, :Exception,
            :StandardError, :RuntimeError, :TypeError, :NameError,
            :NoMethodError, :ArgumentError, :IndexError, :KeyError,
            :StopIteration, :RangeError, :IOError, :Errno, :Math,
            :Comparable, :Enumerable, :Enumerator, :GC, :ObjectSpace,
            :Signal, :Process, :JS].include?(c)
    begin; Object.send(:remove_const, c); rescue; end
  end
end
GC.compact rescue nil
      `.trim());
    } catch {
      // best-effort
    }
    postMessage({ type: 'reset-done' });
  }
});
