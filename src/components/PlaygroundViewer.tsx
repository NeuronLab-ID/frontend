"use client";

import { Sandpack } from "@codesandbox/sandpack-react";

interface PlaygroundViewerProps {
    code: string;
    title?: string;
    settings?: {
        editorHeight?: number;
        showEditor?: boolean;
        showConsole?: boolean;
    };
}

// NeuronLab custom theme based on our terminal aesthetic
const neuronLabTheme = {
    colors: {
        surface1: "#0d0d14",
        surface2: "#1a1a2e",
        surface3: "#252538",
        clickable: "#00ffff",
        base: "#ffffff",
        disabled: "#4B5563",
        hover: "#00ffff",
        accent: "#00ffff",
        error: "#f43f5e",
        errorSurface: "#1a0a0a",
    },
    syntax: {
        plain: "#ffffff",
        comment: { color: "#6b7280", fontStyle: "italic" as const },
        keyword: "#00ffff",
        tag: "#22d3ee",
        punctuation: "#9ca3af",
        definition: "#facc15",
        property: "#ec4899",
        static: "#4ade80",
        string: "#4ade80",
    },
    font: {
        body: "'JetBrains Mono', 'Fira Code', monospace",
        mono: "'JetBrains Mono', 'Fira Code', monospace",
        size: "13px",
        lineHeight: "1.6",
    },
};

export default function PlaygroundViewer({ code, title, settings }: PlaygroundViewerProps) {
    // Transform the code to use our NeuronLab theme colors
    const themedCode = transformToNeuronLabTheme(code);

    return (
        <div className="border-2 border-gray-700 bg-[#0d0d14] overflow-hidden">
            {title && (
                <div className="flex items-center gap-2 px-4 py-2 border-b-2 border-gray-700 bg-[#1a1a2e]">
                    <span className="text-cyan-400">&gt;</span>
                    <span className="text-sm font-mono text-gray-300">Playground: {title}</span>
                </div>
            )}
            <Sandpack
                template="react"
                theme={neuronLabTheme}
                files={{
                    "/App.js": themedCode,
                }}
                options={{
                    showNavigator: false,
                    showTabs: false,
                    showLineNumbers: false,
                    editorHeight: settings?.editorHeight || 500,
                    editorWidthPercentage: settings?.showEditor ? 35 : 0,
                    showConsole: settings?.showConsole || false,
                    showConsoleButton: false,
                    resizablePanels: false,
                }}
                customSetup={{
                    dependencies: {},
                }}
            />
        </div>
    );
}

/**
 * Transform the original deep-ml theme colors to NeuronLab theme
 */
function transformToNeuronLabTheme(code: string): string {
    // Replace deep-ml colors with NeuronLab colors
    const colorMappings: Record<string, string> = {
        // Background colors
        "'#0a0a0a'": "'#0d0d14'",
        "'#111111'": "'#1a1a2e'",
        "'#1a1a1a'": "'#252538'",
        "'#2a2a2a'": "'#374151'",

        // Primary/accent colors
        "'#8b5cf6'": "'#00ffff'",  // purple -> cyan

        // Text colors
        "'#fafafa'": "'#ffffff'",
        "'#a1a1aa'": "'#9ca3af'",
        "'#52525b'": "'#6b7280'",

        // Accent colors - keep colorful but adjust
        "'#38bdf8'": "'#22d3ee'",  // blue -> brighter cyan
        "'#fbbf24'": "'#facc15'",  // yellow
        "'#f472b6'": "'#ec4899'",  // pink
        "'#a3e635'": "'#4ade80'",  // green
        "'#fb923c'": "'#f97316'",  // orange
        "'#f43f5e'": "'#ef4444'",  // red
        "'#10b981'": "'#10b981'",  // positive green (keep)
    };

    let transformedCode = code;

    for (const [original, replacement] of Object.entries(colorMappings)) {
        transformedCode = transformedCode.split(original).join(replacement);
    }

    return transformedCode;
}
