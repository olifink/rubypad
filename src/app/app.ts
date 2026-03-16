import {
  Component,
  ChangeDetectionStrategy,
  DOCUMENT,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { EditorComponent, type SelectionInfo, type CursorInfo } from './editor/editor';
import { ConsoleComponent } from './console/console';
import { ReplComponent } from './repl/repl';
import { DocumentationComponent } from './docs/docs.component';
import { StorageService } from './storage/storage.service';
import { RunnerService } from './runner/runner.service';
import type { OutputLine } from './runner/runner.service';
import { ThemeService } from './theme/theme.service';
import { VirtualKeyboardService } from './virtual-keyboard/virtual-keyboard.service';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog';
import { ReplService } from './repl/repl.service';
import { ShareService } from './share/share.service';
import { ShareDialogComponent } from './share/share-dialog';
import type { ShareDialogData } from './share/share-dialog';
import { AiSettingsDialogComponent } from './ai-settings-dialog/ai-settings-dialog';
import { AiService } from './ai/ai.service';
import { NewFileDialogComponent } from './new-file-dialog/new-file-dialog';
import { AiPromptDialogComponent } from './ai-prompt-dialog/ai-prompt-dialog';
import type { AiPromptDialogData } from './ai-prompt-dialog/ai-prompt-dialog';

const DEFAULT_CODE = `# Welcome to RubyPad!
puts "Hello, RubyPad!"
`;

const MIN_RATIO = 0;
const MAX_RATIO = 1;

/** Extracts the 1-based line number from the last "line N" occurrence in a traceback. */
function parseErrorLine(errorLines: string[]): number | null {
  for (let i = errorLines.length - 1; i >= 0; i--) {
    const match = errorLines[i].match(/\bline (\d+)\b/);
    if (match) return parseInt(match[1], 10);
  }
  return null;
}

export type LayoutMode = 'editor' | 'both' | 'panel';
export type PanelId = 'output' | 'repl' | 'docs';

const PANEL_IDS: PanelId[] = ['output', 'repl', 'docs'];

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDividerModule,
    MatIconModule,
    MatSidenavModule,
    MatTooltipModule,
    MatTabsModule,
    EditorComponent,
    ConsoleComponent,
    ReplComponent,
    DocumentationComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: {
    '(document:keydown)': 'onKeyDown($event)',
  },
})
export class App {
  private readonly storage = inject(StorageService);
  private readonly document = inject(DOCUMENT);
  private readonly dialog = inject(MatDialog);
  private readonly shareService = inject(ShareService);
  protected readonly runner = inject(RunnerService);
  protected readonly replService = inject(ReplService);
  protected readonly theme = inject(ThemeService);
  protected readonly aiService = inject(AiService);
  private readonly _vk = inject(VirtualKeyboardService);

  private readonly workspaceRef = viewChild.required<ElementRef<HTMLElement>>('workspace');
  private readonly fileInputRef = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');
  private readonly editorRef = viewChild.required(EditorComponent);

  protected readonly initialCode = (() => {
    const shared = this.shareService.getSharedCode();
    if (shared) {
      this.storage.save(shared.code);
      return shared.code;
    }
    return this.storage.load() ?? DEFAULT_CODE;
  })();

  protected readonly sidenavOpen = signal(false);
  protected readonly outputLines = signal<OutputLine[]>([]);
  protected readonly splitRatio = signal(0.65);
  protected readonly layout = signal<LayoutMode>('both');
  protected readonly activePanelId = signal<PanelId>('output');
  protected readonly activePanelTabIndex = computed(() => PANEL_IDS.indexOf(this.activePanelId()));
  protected readonly cursorInfo = signal<CursorInfo | null>(null);
  protected readonly selection = signal<SelectionInfo | null>(null);
  protected readonly isRunning = signal(false);
  private readonly currentCode = signal(this.initialCode);

  constructor() {
    // Strip ?s= after Angular's router has completed its initial navigation.
    afterNextRender(() => this.shareService.stripShareParam());
  }

  protected readonly showEditor = computed(
    () => this.layout() === 'editor' || this.layout() === 'both',
  );
  protected readonly showPanel = computed(
    () => this.layout() === 'panel' || this.layout() === 'both',
  );
  protected readonly showDivider = computed(() => this.layout() === 'both');

  protected setLayout(mode: LayoutMode): void {
    this.layout.set(mode);
    if (mode === 'editor') this.splitRatio.set(1);
    else if (mode === 'panel') this.splitRatio.set(0);
    else this.splitRatio.set(0.65);
  }

  protected onCodeChange(code: string): void {
    this.currentCode.set(code);
    this.storage.save(code);
  }

  protected onCursorChange(info: CursorInfo): void {
    this.cursorInfo.set(info);
  }

  protected onSelectionChange(selection: SelectionInfo): void {
    this.selection.set(selection.text.trim() ? selection : null);
  }

  protected onPanelTabChange(index: number): void {
    this.activePanelId.set(PANEL_IDS[index] ?? 'output');
  }

  protected async runCode(): Promise<void> {
    if (this.isRunning()) return;
    this.storage.flush();
    this.editorRef().clearErrorHighlight();

    // When the REPL tab is active, run inside the REPL so variables are inspectable.
    if (this.activePanelId() === 'repl') {
      if (this.layout() === 'editor') this.setLayout('both');
      void this.replService.runInRepl(this.currentCode());
      return;
    }

    this.isRunning.set(true);
    try {
      const lines = await this.runner.run(this.currentCode());
      this.outputLines.set(lines);
      this.activePanelId.set('output');
      // Switch to 'both' so the user sees the output.
      if (this.layout() === 'editor') this.setLayout('both');
      // Highlight the error line in the editor if the output contains a traceback.
      const errorLine = parseErrorLine(lines.filter((l) => l.isError).map((l) => l.text));
      if (errorLine !== null) {
        this.editorRef().goToLine(errorLine);
      }
    } finally {
      this.isRunning.set(false);
    }
  }

  protected clearOutput(): void {
    this.outputLines.set([]);
    this.editorRef().clearErrorHighlight();
  }

  protected newFile(): void {
    this.dialog
      .open(NewFileDialogComponent, {
        data: {
          title: 'New file',
          message: 'Your current code will be replaced.',
        },
        width: '480px',
      })
      .afterClosed()
      .subscribe(async (result: { confirmed: boolean; prompt: string } | undefined) => {
        if (!result?.confirmed) return;

        this.sidenavOpen.set(false);

        if (result.prompt) {
          try {
            const generatedCode = await this.aiService.generateCode(result.prompt);
            this.editorRef().setContent(generatedCode);
          } catch (err) {
            this.dialog.open(ConfirmDialogComponent, {
              data: {
                title: 'AI Generation Failed',
                message: err instanceof Error ? err.message : 'An unknown error occurred',
                confirmLabel: 'OK',
              },
            });
          }
        } else {
          this.editorRef().setContent(DEFAULT_CODE);
        }
      });
  }

  protected downloadCode(): void {
    const blob = new Blob([this.currentCode()], { type: 'text/x-ruby' });
    const url = URL.createObjectURL(blob);
    const a = this.document.createElement('a');
    a.href = url;
    a.download = 'main.rb';
    a.click();
    URL.revokeObjectURL(url);
  }

  protected shareCode(): void {
    this.dialog.open(ShareDialogComponent, {
      data: {
        code: this.currentCode(),
        packages: [],
      } satisfies ShareDialogData,
      width: '480px',
    });
  }

  protected openFile(): void {
    this.sidenavOpen.set(false);
    this.fileInputRef().nativeElement.click();
  }

  protected openAiSettings(): void {
    this.sidenavOpen.set(false);
    this.dialog.open(AiSettingsDialogComponent, {
      width: '440px',
    });
  }

  protected openAiPrompt(): void {
    if (!this.aiService.hasApiKey()) {
      this.openAiSettings();
      return;
    }

    const currentSelection = this.editorRef().getSelection();
    const isFixMode = !!currentSelection?.text.trim();

    this.dialog
      .open(AiPromptDialogComponent, {
        data: {
          isFixMode,
          selectedText: currentSelection?.text,
        } satisfies AiPromptDialogData,
        width: '480px',
      })
      .afterClosed()
      .subscribe(async (prompt: string | undefined) => {
        if (!prompt) return;

        try {
          const finalPrompt = isFixMode
            ? `Fix/Modify the following code according to this instruction: "${prompt}"\n\nCode to modify:\n\`\`\`ruby\n${currentSelection?.text}\n\`\`\``
            : prompt;

          const generatedCode = await this.aiService.generateCode(finalPrompt);
          this.editorRef().insertText(generatedCode);
        } catch (err) {
          this.dialog.open(ConfirmDialogComponent, {
            data: {
              title: isFixMode ? 'AI Fix Failed' : 'AI Insertion Failed',
              message: err instanceof Error ? err.message : 'An unknown error occurred',
              confirmLabel: 'OK',
            },
          });
        }
      });
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.editorRef().setContent(reader.result as string);
      input.value = '';
    };
    reader.readAsText(file);
  }

  protected onKeyDown(e: KeyboardEvent): void {
    const ctrl = e.ctrlKey || e.metaKey;
    if (!ctrl) return;

    if (e.key === 's') {
      e.preventDefault();
      this.storage.flush();
    } else if (e.key === 'r') {
      e.preventDefault();
      if (this.runner.isReady() && !this.isRunning()) void this.runCode();
    } else if (e.key === 'o') {
      e.preventDefault();
      this.openFile();
    } else if (e.key === '\\') {
      e.preventDefault();
      this.openAiPrompt();
    } else if (e.key === '?') {
      e.preventDefault();
      // Ctrl+? (Ctrl+Shift+/ on US keyboards): show the Docs tab and keep editor focus.
      this.activePanelId.set('docs');
      if (this.layout() === 'editor') this.setLayout('both');
      this.editorRef().focus();
    }
  }

  protected onDividerPointerDown(e: PointerEvent): void {
    e.preventDefault();
    const workspace = this.workspaceRef().nativeElement;

    const onMove = (ev: PointerEvent): void => {
      const rect = workspace.getBoundingClientRect();
      const ratio = (ev.clientY - rect.top) / rect.height;
      this.splitRatio.set(Math.min(Math.max(ratio, MIN_RATIO), MAX_RATIO));
    };

    const onUp = (): void => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }
}
