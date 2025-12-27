"use client";

import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathRendererProps {
    content: string;
    className?: string;
    inline?: boolean;
}

export function MathRenderer({ content, className = "", inline = false }: MathRendererProps) {
    const containerRef = useRef<HTMLSpanElement | HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || !content) return;

        // Process the content to render LaTeX
        let processedContent = content;

        // Normalize escape sequences from Perplexity API (\\\\( -> $, \\\\[ -> $$)
        const normalizeEscapes = (text: string): string => {
            let r = text;
            r = r.split('\\\\n').join('\n');
            r = r.split('\\\\\\\\[').join('$$');
            r = r.split('\\\\\\\\]').join('$$');
            r = r.split('\\\\[').join('$$');
            r = r.split('\\\\]').join('$$');
            r = r.split('\\\\\\\\(').join('$');
            r = r.split('\\\\\\\\)').join('$');
            r = r.split('\\\\(').join('$');
            r = r.split('\\\\)').join('$');
            return r;
        };
        processedContent = normalizeEscapes(processedContent);

        // Helper to render inline KaTeX
        const renderInlineKatex = (text: string): string => {
            return text.replace(/\$([^$\n]+?)\$/g, (_: string, latex: string) => {
                try {
                    return katex.renderToString(latex.trim(), { displayMode: false, throwOnError: false, trust: true });
                } catch {
                    return `<code class="text-red-400">${latex}</code>`;
                }
            });
        };

        // Process markdown tables with embedded KaTeX FIRST
        const renderTableWithMath = (text: string): string => {
            const lines = text.split('\n');
            const result: string[] = [];
            let i = 0;
            while (i < lines.length) {
                const trimmed = lines[i].trim();
                if (trimmed.startsWith('|') && trimmed.includes('|', 1)) {
                    const tableLines: string[] = [];
                    while (i < lines.length && lines[i].trim().startsWith('|')) {
                        tableLines.push(lines[i].trim());
                        i++;
                    }
                    if (tableLines.length >= 2 && /^\|[\s\-:|]+\|$/.test(tableLines[1])) {
                        const headers = tableLines[0].split('|').slice(1, -1).map(c => renderInlineKatex(c.trim()));
                        const rows = tableLines.slice(2).map(row => row.split('|').slice(1, -1).map(c => renderInlineKatex(c.trim())));
                        const headerHtml = headers.map(c => `<th class="px-3 py-1.5 text-left text-cyan-400 font-bold border-b border-gray-600 text-sm">${c}</th>`).join('');
                        const rowsHtml = rows.map(row => `<tr class="hover:bg-gray-800/50">${row.map(c => `<td class="px-3 py-1.5 border-b border-gray-700 text-gray-300 text-sm">${c}</td>`).join('')}</tr>`).join('');
                        result.push(`<div class="mt-2 mb-2 overflow-x-auto"><table class="text-sm border border-gray-700 bg-[#0a0a0f]"><thead class="bg-gray-800"><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`);
                        continue;
                    }
                    result.push(...tableLines);
                    continue;
                }
                result.push(lines[i]);
                i++;
            }
            return result.join('\n');
        };
        processedContent = renderTableWithMath(processedContent);

        // Helper function to escape underscores in \text{} blocks for KaTeX
        const escapeTextUnderscores = (latex: string): string => {
            // Replace underscores in \text{...} with \_
            return latex.replace(/\\text\{([^}]*)\}/g, (match, text) => {
                // Replace underscores with escaped underscores
                const escapedText = text.replace(/_/g, '\\_');
                return `\\text{${escapedText}}`;
            }).replace(/\\texttt\{([^}]*)\}/g, (match, text) => {
                const escapedText = text.replace(/_/g, '\\_');
                return `\\texttt{${escapedText}}`;
            });
        };

        // Render display math ($$...$$ or \[...\])
        processedContent = processedContent.replace(/\$\$([\s\S]+?)\$\$/g, (_, latex) => {
            try {
                const escapedLatex = escapeTextUnderscores(latex.trim());
                return `<span class="block my-4 overflow-x-auto">${katex.renderToString(escapedLatex, {
                    displayMode: true,
                    throwOnError: false,
                    trust: true,
                })}</span>`;
            } catch {
                return `<code class="text-red-400">${latex}</code>`;
            }
        });

        // Render display math with \[...\]
        processedContent = processedContent.replace(/\\\[([\s\S]+?)\\\]/g, (_, latex) => {
            try {
                const escapedLatex = escapeTextUnderscores(latex.trim());
                return `<span class="block my-4 overflow-x-auto">${katex.renderToString(escapedLatex, {
                    displayMode: true,
                    throwOnError: false,
                    trust: true,
                })}</span>`;
            } catch {
                return `<code class="text-red-400">${latex}</code>`;
            }
        });

        // Render inline math ($...$)
        processedContent = processedContent.replace(/\$([^$\n]+?)\$/g, (_, latex) => {
            try {
                const escapedLatex = escapeTextUnderscores(latex.trim());
                return katex.renderToString(escapedLatex, {
                    displayMode: false,
                    throwOnError: false,
                    trust: true,
                });
            } catch {
                return `<code class="text-red-400">${latex}</code>`;
            }
        });

        // Render inline math with \(...\) - use lazy match up to \)
        processedContent = processedContent.replace(/\\\(([\s\S]+?)\\\)/g, (_, latex) => {
            try {
                const escapedLatex = escapeTextUnderscores(latex.trim());
                return katex.renderToString(escapedLatex, {
                    displayMode: false,
                    throwOnError: false,
                    trust: true,
                });
            } catch {
                return `<code class="text-red-400">${latex}</code>`;
            }
        });

        // Convert code blocks (```python ... ``` or ``` ... ```)
        processedContent = processedContent.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
            const langClass = lang ? `language-${lang}` : '';
            return `<pre class="bg-[#0a0a0f] border border-gray-700 p-3 my-3 overflow-x-auto text-sm ${langClass}"><code class="text-cyan-300">${code.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
        });

        // Convert inline code (`...`)
        processedContent = processedContent.replace(/`([^`]+)`/g, '<code class="bg-gray-800 text-cyan-400 px-1 py-0.5 text-sm">$1</code>');

        // Convert markdown-style headers (order matters - more # first)
        processedContent = processedContent.replace(/^#### (.+)$/gm, '<span class="block text-base font-semibold mt-4 mb-2 text-purple-400">$1</span>');
        processedContent = processedContent.replace(/^### (.+)$/gm, '<span class="block text-lg font-semibold mt-5 mb-2 text-cyan-400">$1</span>');
        processedContent = processedContent.replace(/^## (.+)$/gm, '<span class="block text-xl font-bold mt-6 mb-3 text-white">$1</span>');

        // Convert **bold** to <strong>
        processedContent = processedContent.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white">$1</strong>');

        // Convert bullet points
        processedContent = processedContent.replace(/^- (.+)$/gm, '<span class="block ml-4">• $1</span>');
        processedContent = processedContent.replace(/^\d+\. (.+)$/gm, '<span class="block ml-4 text-gray-300">$&</span>');

        // Convert newlines to <br> for better readability
        processedContent = processedContent.replace(/\n\n/g, '<br/><br/>');
        processedContent = processedContent.replace(/\n/g, '<br/>');

        containerRef.current.innerHTML = processedContent;
    }, [content]);

    if (inline) {
        return <span ref={containerRef as React.RefObject<HTMLSpanElement>} className={`math-content ${className}`} />;
    }
    return <div ref={containerRef as React.RefObject<HTMLDivElement>} className={`math-content ${className}`} />;
}

// Simple inline math renderer for single formulas
export function InlineMath({ latex }: { latex: string }) {
    try {
        const html = katex.renderToString(latex, {
            displayMode: false,
            throwOnError: false,
        });
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
        return <code className="text-red-400">{latex}</code>;
    }
}

// Block math renderer
export function BlockMath({ latex }: { latex: string }) {
    try {
        const html = katex.renderToString(latex, {
            displayMode: true,
            throwOnError: false,
        });
        return <div className="my-4 overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
        return <pre className="text-red-400">{latex}</pre>;
    }
}
