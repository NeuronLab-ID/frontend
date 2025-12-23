/**
 * Editor Settings storage and utilities
 */

export interface EditorSettings {
    theme: "dark" | "light" | "system";
    editorTheme: string;
    codeFont: string;
    fontSize: number;
    tabSize: 2 | 4;
    lineNumbers: boolean;
    autoSave: boolean;
    vimMode: boolean;
}

const DEFAULT_SETTINGS: EditorSettings = {
    theme: "dark",
    editorTheme: "Monokai",
    codeFont: "JetBrains Mono",
    fontSize: 14,
    tabSize: 4,
    lineNumbers: true,
    autoSave: true,
    vimMode: false,
};

const SETTINGS_KEY = "neuronlab_editor_settings";

export function getEditorSettings(): EditorSettings {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;

    try {
        const stored = localStorage.getItem(SETTINGS_KEY);
        if (stored) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.error("Failed to load editor settings:", e);
    }
    return DEFAULT_SETTINGS;
}

export function saveEditorSettings(settings: Partial<EditorSettings>): EditorSettings {
    const current = getEditorSettings();
    const updated = { ...current, ...settings };

    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error("Failed to save editor settings:", e);
    }

    return updated;
}

// Map friendly theme names to Monaco theme IDs
export function getMonacoTheme(themeName: string): string {
    const themeMap: Record<string, string> = {
        "Monokai": "monokai",
        "Dracula": "dracula",
        "GitHub Dark": "github-dark",
        "One Dark": "one-dark",
        "VS Dark": "vs-dark",
        "VS Light": "vs",
        "Light": "vs",
    };
    return themeMap[themeName] || "vs-dark";
}

// Define custom Monaco themes
export function defineMonacoThemes(monaco: any) {
    // Monokai theme
    monaco.editor.defineTheme("monokai", {
        base: "vs-dark",
        inherit: true,
        rules: [
            { token: "comment", foreground: "75715E", fontStyle: "italic" },
            { token: "keyword", foreground: "F92672" },
            { token: "string", foreground: "E6DB74" },
            { token: "number", foreground: "AE81FF" },
            { token: "type", foreground: "66D9EF" },
            { token: "function", foreground: "A6E22E" },
            { token: "variable", foreground: "F8F8F2" },
            { token: "operator", foreground: "F92672" },
        ],
        colors: {
            "editor.background": "#272822",
            "editor.foreground": "#F8F8F2",
            "editorCursor.foreground": "#F8F8F0",
            "editor.selectionBackground": "#49483E",
            "editor.lineHighlightBackground": "#3E3D32",
            "editorLineNumber.foreground": "#90908A",
        },
    });

    // Dracula theme
    monaco.editor.defineTheme("dracula", {
        base: "vs-dark",
        inherit: true,
        rules: [
            { token: "comment", foreground: "6272A4", fontStyle: "italic" },
            { token: "keyword", foreground: "FF79C6" },
            { token: "string", foreground: "F1FA8C" },
            { token: "number", foreground: "BD93F9" },
            { token: "type", foreground: "8BE9FD" },
            { token: "function", foreground: "50FA7B" },
            { token: "variable", foreground: "F8F8F2" },
            { token: "operator", foreground: "FF79C6" },
        ],
        colors: {
            "editor.background": "#282A36",
            "editor.foreground": "#F8F8F2",
            "editorCursor.foreground": "#F8F8F0",
            "editor.selectionBackground": "#44475A",
            "editor.lineHighlightBackground": "#44475A",
            "editorLineNumber.foreground": "#6272A4",
        },
    });

    // GitHub Dark theme
    monaco.editor.defineTheme("github-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
            { token: "comment", foreground: "8B949E", fontStyle: "italic" },
            { token: "keyword", foreground: "FF7B72" },
            { token: "string", foreground: "A5D6FF" },
            { token: "number", foreground: "79C0FF" },
            { token: "type", foreground: "FFA657" },
            { token: "function", foreground: "D2A8FF" },
            { token: "variable", foreground: "C9D1D9" },
        ],
        colors: {
            "editor.background": "#0D1117",
            "editor.foreground": "#C9D1D9",
            "editorCursor.foreground": "#C9D1D9",
            "editor.selectionBackground": "#264F78",
            "editor.lineHighlightBackground": "#161B22",
            "editorLineNumber.foreground": "#6E7681",
        },
    });

    // One Dark theme
    monaco.editor.defineTheme("one-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
            { token: "comment", foreground: "5C6370", fontStyle: "italic" },
            { token: "keyword", foreground: "C678DD" },
            { token: "string", foreground: "98C379" },
            { token: "number", foreground: "D19A66" },
            { token: "type", foreground: "E5C07B" },
            { token: "function", foreground: "61AFEF" },
            { token: "variable", foreground: "ABB2BF" },
        ],
        colors: {
            "editor.background": "#282C34",
            "editor.foreground": "#ABB2BF",
            "editorCursor.foreground": "#528BFF",
            "editor.selectionBackground": "#3E4451",
            "editor.lineHighlightBackground": "#2C313A",
            "editorLineNumber.foreground": "#636D83",
        },
    });
}
