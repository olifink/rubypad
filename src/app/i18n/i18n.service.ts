import { Injectable, computed, signal } from '@angular/core';

export type Language = 'en' | 'jp';

type TranslationKey =
    | 'settings'
    | 'closeSettings'
    | 'file'
    | 'newFile'
    | 'openFile'
    | 'downloadFile'
    | 'share'
    | 'appearance'
    | 'theme'
    | 'light'
    | 'dark'
    | 'system'
    | 'language'
    | 'languageEnglish'
    | 'languageJapanese'
    | 'openSettings'
    | 'aiFixTooltip'
    | 'aiInsertTooltip'
    | 'aiFixAria'
    | 'aiInsertAria'
    | 'layoutMode'
    | 'editorOnly'
    | 'editorAndPanel'
    | 'panelOnly'
    | 'codeEditor'
    | 'resizePanels'
    | 'outputPanel'
    | 'tabOutput'
    | 'tabRepl'
    | 'tabDocs'
    | 'aiGenerating'
    | 'running'
    | 'run'
    | 'loadingRuby'
    | 'runRubyCode'
    | 'consoleOutput'
    | 'runCodeToSeeOutput'
    | 'clearOutput'
    | 'loadingDocumentation'
    | 'openOfficialDocs'
    | 'noDocumentationFor'
    | 'moveCursorForDocs'
    | 'backToSymbolDocs'
    | 'showCheatSheet'
    | 'loadingRubyRepl'
    | 'rubyReplTerminal'
    | 'resetRepl'
    | 'shareDialogTitle'
    | 'includesPackage'
    | 'includesPackages'
    | 'shareableUrl'
    | 'copied'
    | 'copyLink'
    | 'copiedWithBang'
    | 'copy'
    | 'qrCodeAlt'
    | 'scanToOpenOnAnotherDevice'
    | 'close'
    | 'newFileTitle'
    | 'newFileReplaceMessage'
    | 'aiGenerationFailed'
    | 'unknownError'
    | 'ok'
    | 'aiFixFailed'
    | 'aiInsertionFailed'
    | 'aiSettingsTitle'
    | 'enterGeminiApiKey'
    | 'geminiApiKey'
    | 'enterApiKey'
    | 'showApiKey'
    | 'hideApiKey'
    | 'apiKeyStoredLocally'
    | 'cancel'
    | 'save'
    | 'aiPromptOptional'
    | 'newFilePromptPlaceholder'
    | 'leaveEmptyForBlank'
    | 'generateAndCreate'
    | 'createBlank'
    | 'aiPrompt'
    | 'aiFixTitle'
    | 'aiInsertTitle'
    | 'aiFixDescription'
    | 'aiInsertDescription'
    | 'currentSelection'
    | 'aiFixPromptPlaceholder'
    | 'aiInsertPromptPlaceholder'
    | 'fixCode'
    | 'insertCode'
    | 'confirm';

const STORAGE_KEY = 'rubypad_language';

const EN: Record<TranslationKey, string> = {
    settings: 'Settings',
    closeSettings: 'Close settings',
    file: 'File',
    newFile: 'New file',
    openFile: 'Open file',
    downloadFile: 'Download file',
    share: 'Share',
    appearance: 'Appearance',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    language: 'Language',
    languageEnglish: 'EN',
    languageJapanese: 'JP',
    openSettings: 'Open settings',
    aiFixTooltip: 'AI Fix (Ctrl+\\)',
    aiInsertTooltip: 'AI Insert (Ctrl+\\)',
    aiFixAria: 'AI Fix',
    aiInsertAria: 'AI Insert',
    layoutMode: 'Layout mode',
    editorOnly: 'Editor only',
    editorAndPanel: 'Editor and panel',
    panelOnly: 'Panel only',
    codeEditor: 'Code editor',
    resizePanels: 'Resize panels',
    outputPanel: 'Output panel',
    tabOutput: 'Output',
    tabRepl: 'REPL',
    tabDocs: 'Docs',
    aiGenerating: 'AI is generating code...',
    running: 'Running…',
    run: 'Run (Ctrl+R)',
    loadingRuby: 'Loading Ruby…',
    runRubyCode: 'Run Ruby code',
    consoleOutput: 'Console output',
    runCodeToSeeOutput: 'Run your code to see output here.',
    clearOutput: 'Clear output',
    loadingDocumentation: 'Loading documentation…',
    openOfficialDocs: 'Open official docs ↗',
    noDocumentationFor: 'No documentation available for',
    moveCursorForDocs: 'Move the cursor over a symbol to see documentation.',
    backToSymbolDocs: 'Back to symbol docs',
    showCheatSheet: 'Show cheat sheet',
    loadingRubyRepl: 'Loading Ruby…',
    rubyReplTerminal: 'Ruby REPL terminal',
    resetRepl: 'Reset REPL',
    shareDialogTitle: 'Share',
    includesPackage: 'Includes package:',
    includesPackages: 'Includes packages:',
    shareableUrl: 'Shareable URL',
    copied: 'Copied',
    copyLink: 'Copy link',
    copiedWithBang: 'Copied!',
    copy: 'Copy',
    qrCodeAlt: 'QR code for shareable URL',
    scanToOpenOnAnotherDevice: 'Scan to open on another device',
    close: 'Close',
    newFileTitle: 'New file',
    newFileReplaceMessage: 'Your current code will be replaced.',
    aiGenerationFailed: 'AI Generation Failed',
    unknownError: 'An unknown error occurred',
    ok: 'OK',
    aiFixFailed: 'AI Fix Failed',
    aiInsertionFailed: 'AI Insertion Failed',
    aiSettingsTitle: 'AI Settings',
    enterGeminiApiKey: 'Enter your Gemini API Key to enable AI features like code explanation and generation.',
    geminiApiKey: 'Gemini API Key',
    enterApiKey: 'Enter your API key',
    showApiKey: 'Show API key',
    hideApiKey: 'Hide API key',
    apiKeyStoredLocally:
        'Your API key is stored locally in your browser and is never sent to our servers. You can get a free API key from the Google AI Studio.',
    cancel: 'Cancel',
    save: 'Save',
    aiPromptOptional: 'AI Prompt (optional)',
    newFilePromptPlaceholder: 'e.g., Generate a simple web server using Ruby sockets',
    leaveEmptyForBlank: 'Leave empty to start with a blank file',
    generateAndCreate: 'Generate and Create',
    createBlank: 'Create Blank',
    aiPrompt: 'AI Prompt',
    aiFixTitle: 'AI Fix',
    aiInsertTitle: 'AI Insert',
    aiFixDescription: 'Describe how you want to modify the selected code.',
    aiInsertDescription: 'Describe the code you want to insert at the current cursor position.',
    currentSelection: 'Current Selection:',
    aiFixPromptPlaceholder: 'e.g., Rewrite this using a list comprehension',
    aiInsertPromptPlaceholder: 'e.g., A function to calculate the average of a list',
    fixCode: 'Fix Code',
    insertCode: 'Insert Code',
    confirm: 'Confirm',
};

const JP: Record<TranslationKey, string> = {
    settings: '設定',
    closeSettings: '設定を閉じる',
    file: 'ファイル',
    newFile: '新規ファイル',
    openFile: 'ファイルを開く',
    downloadFile: 'ファイルをダウンロード',
    share: '共有',
    appearance: '表示',
    theme: 'テーマ',
    light: '', // 'ライト',
    dark: '', //'ダーク',
    system: '', //'システム',
    language: '言語',
    languageEnglish: 'EN',
    languageJapanese: 'JP',
    openSettings: '設定を開く',
    aiFixTooltip: 'AI 修正 (Ctrl+\\)',
    aiInsertTooltip: 'AI 挿入 (Ctrl+\\)',
    aiFixAria: 'AI 修正',
    aiInsertAria: 'AI 挿入',
    layoutMode: 'レイアウトモード',
    editorOnly: 'エディターのみ',
    editorAndPanel: 'エディターとパネル',
    panelOnly: 'パネルのみ',
    codeEditor: 'コードエディター',
    resizePanels: 'パネルサイズを変更',
    outputPanel: '出力パネル',
    tabOutput: '出力',
    tabRepl: 'REPL',
    tabDocs: 'ドキュメント',
    aiGenerating: 'AI がコードを生成中...',
    running: '実行中…',
    run: '実行 (Ctrl+R)',
    loadingRuby: 'Ruby を読み込み中…',
    runRubyCode: 'Ruby コードを実行',
    consoleOutput: 'コンソール出力',
    runCodeToSeeOutput: 'コードを実行するとここに出力が表示されます。',
    clearOutput: '出力をクリア',
    loadingDocumentation: 'ドキュメントを読み込み中…',
    openOfficialDocs: '公式ドキュメントを開く ↗',
    noDocumentationFor: '次の項目のドキュメントはありません:',
    moveCursorForDocs: 'シンボル上にカーソルを置くとドキュメントを表示します。',
    backToSymbolDocs: 'シンボル説明に戻る',
    showCheatSheet: 'チートシートを表示',
    loadingRubyRepl: 'Ruby を読み込み中…',
    rubyReplTerminal: 'Ruby REPL ターミナル',
    resetRepl: 'REPL をリセット',
    shareDialogTitle: '共有',
    includesPackage: '含まれるパッケージ:',
    includesPackages: '含まれるパッケージ:',
    shareableUrl: '共有 URL',
    copied: 'コピー済み',
    copyLink: 'リンクをコピー',
    copiedWithBang: 'コピーしました',
    copy: 'コピー',
    qrCodeAlt: '共有 URL の QR コード',
    scanToOpenOnAnotherDevice: 'スキャンして別のデバイスで開く',
    close: '閉じる',
    newFileTitle: '新規ファイル',
    newFileReplaceMessage: '現在のコードは置き換えられます。',
    aiGenerationFailed: 'AI 生成に失敗しました',
    unknownError: '不明なエラーが発生しました',
    ok: 'OK',
    aiFixFailed: 'AI 修正に失敗しました',
    aiInsertionFailed: 'AI 挿入に失敗しました',
    aiSettingsTitle: 'AI 設定',
    enterGeminiApiKey: 'コード説明や生成などの AI 機能を有効にするため、Gemini API キーを入力してください。',
    geminiApiKey: 'Gemini API キー',
    enterApiKey: 'API キーを入力',
    showApiKey: 'API キーを表示',
    hideApiKey: 'API キーを非表示',
    apiKeyStoredLocally:
        'API キーはブラウザー内にローカル保存され、サーバーには送信されません。Google AI Studio で無料の API キーを取得できます。',
    cancel: 'キャンセル',
    save: '保存',
    aiPromptOptional: 'AI プロンプト（任意）',
    newFilePromptPlaceholder: '例: Ruby ソケットを使ったシンプルな Web サーバーを作成',
    leaveEmptyForBlank: '空欄のままだと空のファイルを作成します',
    generateAndCreate: '生成して作成',
    createBlank: '空ファイルを作成',
    aiPrompt: 'AI プロンプト',
    aiFixTitle: 'AI 修正',
    aiInsertTitle: 'AI 挿入',
    aiFixDescription: '選択したコードをどのように変更したいか説明してください。',
    aiInsertDescription: '現在のカーソル位置に挿入したいコードを説明してください。',
    currentSelection: '現在の選択:',
    aiFixPromptPlaceholder: '例: リスト内包表記を使って書き換えて',
    aiInsertPromptPlaceholder: '例: 配列の平均を計算する関数',
    fixCode: 'コードを修正',
    insertCode: 'コードを挿入',
    confirm: '確認',
};

@Injectable({ providedIn: 'root' })
export class I18nService {
    private readonly languageSignal = signal<Language>(this.loadLanguage());

    readonly language = computed(() => this.languageSignal());

    setLanguage(language: Language): void {
        this.languageSignal.set(language);
        this.persistLanguage(language);
    }

    t(key: TranslationKey): string {
        return (this.languageSignal() === 'jp' ? JP : EN)[key] ?? EN[key] ?? key;
    }

    private loadLanguage(): Language {
        try {
            const value = localStorage.getItem(STORAGE_KEY);
            if (value === 'en' || value === 'jp') {
                return value;
            }
        } catch {
            // localStorage may be unavailable.
        }

        return this.getBrowserLanguage();
    }

    private persistLanguage(language: Language): void {
        try {
            localStorage.setItem(STORAGE_KEY, language);
        } catch {
            // localStorage may be unavailable.
        }
    }

    private getBrowserLanguage(): Language {
        const preferredLanguages = globalThis.navigator?.languages ?? [globalThis.navigator?.language];

        for (const language of preferredLanguages) {
            if (language?.toLowerCase().startsWith('ja')) {
                return 'jp';
            }
        }

        return 'en';
    }
}