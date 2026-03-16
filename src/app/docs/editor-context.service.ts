import { Injectable } from '@angular/core';
import { EditorView } from 'codemirror';

/** Ruby identifier characters: word chars plus `?` and `!` suffixes. */
const IDENT_RE = /[\w?!]/;

@Injectable({ providedIn: 'root' })
export class EditorContextService {
  getSymbolAt(view: EditorView, pos: number): string | null {
    const text = view.state.doc.toString();

    let start = pos;
    let end = pos;

    while (start > 0 && IDENT_RE.test(text[start - 1])) start--;
    while (end < text.length && IDENT_RE.test(text[end])) end++;

    if (start === end) return null;

    const word = text.slice(start, end);
    return word || null;
  }
}
