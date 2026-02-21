"use client";

import { useEffect, useRef, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import mermaid from "mermaid";
import { apiRequest } from "@/lib/api";

// Initialize mermaid with dark theme
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
        primaryColor: '#06b6d4',
        primaryTextColor: '#e5e7eb',
        primaryBorderColor: '#374151',
        lineColor: '#6b7280',
        secondaryColor: '#1f2937',
        tertiaryColor: '#111827',
        background: '#0a0a0f',
        mainBkg: '#1f2937',
        nodeBorder: '#374151',
        clusterBkg: '#111827',
        clusterBorder: '#374151',
        titleColor: '#06b6d4',
        edgeLabelBackground: '#1f2937',
    },
    flowchart: {
        curve: 'basis',
        padding: 15,
    }
});

/**
 * Sanitize Mermaid code to fix common LLM-generated issues:
 * 1. Newlines inside node labels (convert to <br/> or single line)
 * 2. Unicode subscripts (convert to regular text)
 * 3. Special characters in labels (escape or quote)
 */
function sanitizeMermaidCode(code: string): string {
    let sanitized = code;

    // Fix: Replace Unicode subscripts with regular characters
    const subscriptMap: Record<string, string> = {
        '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
        '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
        'ₐ': 'a', 'ₑ': 'e', 'ₕ': 'h', 'ᵢ': 'i', 'ⱼ': 'j',
        'ₖ': 'k', 'ₗ': 'l', 'ₘ': 'm', 'ₙ': 'n', 'ₒ': 'o',
        'ₚ': 'p', 'ᵣ': 'r', 'ₛ': 's', 'ₜ': 't', 'ᵤ': 'u',
        'ᵥ': 'v', 'ₓ': 'x'
    };
    for (const [sub, normal] of Object.entries(subscriptMap)) {
        sanitized = sanitized.split(sub).join(normal);
    }

    // Fix: Multi-line node labels - convert to single line with <br/>
    // Match node definitions like [label\nmore\nlines] or (label\nmore)
    sanitized = sanitized.replace(/\[([^\]]*)\]/g, (match, content) => {
        // Replace newlines with <br/> for Mermaid
        const fixed = content.replace(/\n/g, '<br/>');
        return `["${fixed.replace(/"/g, "'")}"]`;
    });

    // Fix: Also handle parentheses-based labels
    sanitized = sanitized.replace(/\(([^)]*\n[^)]*)\)/g, (match, content) => {
        const fixed = content.replace(/\n/g, '<br/>');
        return `("${fixed.replace(/"/g, "'")}")`;
    });

    // Fix: Escape special characters in edge labels
    sanitized = sanitized.replace(/-->\|([^|]*)\|/g, (match, label) => {
        const fixed = label.replace(/\n/g, ' ').trim();
        return `-->|${fixed}|`;
    });

    // Fix: Remove empty lines in the middle of diagram definitions
    sanitized = sanitized.replace(/\n\s*\n/g, '\n');

    return sanitized;
}

/**
 * AI-powered Mermaid code fixer using backend API
 */
async function fixMermaidWithAI(code: string, error: string): Promise<string> {
    try {
        const response = await apiRequest<{ fixed_code: string }>('/api/fix-mermaid', {
            method: 'POST',
            body: JSON.stringify({ code, error }),
        });
        return response.fixed_code;
    } catch {
        // Fallback: just apply basic sanitization again
        return sanitizeMermaidCode(code);
    }
}

interface MathRendererProps {
    content: string;
    className?: string;
    inline?: boolean;
    onMermaidFixed?: (originalCode: string, fixedCode: string) => void;
}

export function MathRenderer({ content, className = "", inline = false, onMermaidFixed }: MathRendererProps) {
    const containerRef = useRef<HTMLSpanElement | HTMLDivElement>(null);
    const [mermaidRendered, setMermaidRendered] = useState(false);

    // Store callback in ref for imperative DOM handler access
    const onMermaidFixedRef = useRef(onMermaidFixed);
    useEffect(() => { onMermaidFixedRef.current = onMermaidFixed; }, [onMermaidFixed]);

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

        // Helper to render inline KaTeX for both $ and \(...\) delimiters
        const renderInlineKatex = (text: string): string => {
            let result = text;
            // Render $...$ inline math
            result = result.replace(/\$([^$\n]+?)\$/g, (_: string, latex: string) => {
                try {
                    return katex.renderToString(latex.trim(), { displayMode: false, throwOnError: false, trust: true });
                } catch {
                    return `<code class="text-red-400">${latex}</code>`;
                }
            });
            // Render \(...\) inline math - use [\s\S]+? to match any char including parens
            result = result.replace(/\\\(([\s\S]+?)\\\)/g, (_: string, latex: string) => {
                try {
                    return katex.renderToString(latex.trim(), { displayMode: false, throwOnError: false, trust: true });
                } catch {
                    return `<code class="text-red-400">${latex}</code>`;
                }
            });
            return result;
        };

        // Helper to process a table cell: render markdown and KaTeX
        const processTableCell = (cell: string): string => {
            let result = cell.trim();

            // Check if cell contains LaTeX or markdown that needs processing
            const hasLatex = result.includes('$') || result.includes('\\(');
            const hasBold = result.includes('**');

            if (hasLatex || hasBold) {
                // Process bold markdown first
                result = result.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white">$1</strong>');
                // Then render LaTeX
                result = renderInlineKatex(result);
            } else {
                // No special content - escape HTML for safety
                result = escapeHtml(result);
            }

            return result;
        };

        // Helper to escape HTML special characters
        const escapeHtml = (text: string): string => {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        };

        // Storage for protected HTML blocks (tables, already-rendered content)
        const protectedBlocks: string[] = [];
        const protectBlock = (html: string): string => {
            const placeholder = `\x00TABLE_BLOCK_${protectedBlocks.length}\x00`;
            protectedBlocks.push(html);
            return placeholder;
        };
        const restoreBlocks = (text: string): string => {
            let result = text;
            for (let i = 0; i < protectedBlocks.length; i++) {
                result = result.split(`\x00TABLE_BLOCK_${i}\x00`).join(protectedBlocks[i]);
            }
            return result;
        };

        // Smart table row splitter that ignores | inside LaTeX \(...\) or $...$
        const splitTableRow = (row: string): string[] => {
            const cells: string[] = [];
            let current = '';
            let inLatexParen = 0;  // Track \( and \) nesting
            let inLatexDollar = false;  // Track $ delimiters

            for (let j = 0; j < row.length; j++) {
                const char = row[j];
                const prev = j > 0 ? row[j - 1] : '';
                const next = j < row.length - 1 ? row[j + 1] : '';

                // Check for \( start
                if (char === '\\' && next === '(') {
                    inLatexParen++;
                    current += char;
                    continue;
                }
                // Check for \) end
                if (char === ')' && prev === '\\' && inLatexParen > 0) {
                    inLatexParen--;
                    current += char;
                    continue;
                }
                // Check for $ toggle (but not $$)
                if (char === '$' && prev !== '$' && next !== '$') {
                    inLatexDollar = !inLatexDollar;
                    current += char;
                    continue;
                }

                // Only split on | if not inside LaTeX
                if (char === '|' && inLatexParen === 0 && !inLatexDollar) {
                    cells.push(current);
                    current = '';
                } else {
                    current += char;
                }
            }
            cells.push(current);  // Add the last cell

            // Remove first and last empty cells (from leading/trailing |)
            if (cells.length > 0 && cells[0].trim() === '') cells.shift();
            if (cells.length > 0 && cells[cells.length - 1].trim() === '') cells.pop();

            return cells;
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
                        // Get the number of columns from header
                        const headerCells = splitTableRow(tableLines[0]);
                        const numCols = headerCells.length;

                        // Process headers
                        const headers = headerCells.map(c => processTableCell(c));
                        // Process data rows - ensure same number of columns
                        const rows = tableLines.slice(2).map(row => {
                            const cells = splitTableRow(row);
                            // Pad or trim to match header column count
                            while (cells.length < numCols) cells.push('');
                            return cells.slice(0, numCols).map(c => processTableCell(c));
                        });
                        const headerHtml = headers.map(c => `<th class="px-3 py-1.5 text-left text-cyan-400 font-bold border-b border-gray-600 text-sm">${c}</th>`).join('');
                        const rowsHtml = rows.map(row => `<tr class="hover:bg-gray-800/50">${row.map(c => `<td class="px-3 py-1.5 border-b border-gray-700 text-gray-300 text-sm">${c}</td>`).join('')}</tr>`).join('');
                        const tableHtml = `<div class="mt-2 mb-2 overflow-x-auto"><table class="text-sm border border-gray-700 bg-[#0a0a0f]"><thead class="bg-gray-800"><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
                        // Protect the table HTML from subsequent regex processing
                        result.push(protectBlock(tableHtml));
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

        // Helper function to properly escape underscores in \text{} blocks for KaTeX
        // KaTeX's \text{} requires underscores to be escaped as \_
        // Handle both raw underscores and already-escaped underscores (avoid double-escaping)
        const normalizeTextUnderscores = (latex: string): string => {
            // Process \text{...} and \texttt{...} blocks
            return latex.replace(/\\text\{([^}]*)\}/g, (match, text) => {
                // First, temporarily replace already-escaped \_ with a placeholder
                let processed = text.replace(/\\_/g, '\x00UNDERSCORE\x00');
                // Then escape any raw underscores
                processed = processed.replace(/_/g, '\\_');
                // Restore the placeholders back to \_
                processed = processed.replace(/\x00UNDERSCORE\x00/g, '\\_');
                return `\\text{${processed}}`;
            }).replace(/\\texttt\{([^}]*)\}/g, (match, text) => {
                let processed = text.replace(/\\_/g, '\x00UNDERSCORE\x00');
                processed = processed.replace(/_/g, '\\_');
                processed = processed.replace(/\x00UNDERSCORE\x00/g, '\\_');
                return `\\texttt{${processed}}`;
            });
        };

        // Render display math ($$...$$ or \[...\])
        processedContent = processedContent.replace(/\$\$([\s\S]+?)\$\$/g, (_, latex) => {
            try {
                const normalizedLatex = normalizeTextUnderscores(latex.trim());
                return `<span class="block my-4 overflow-x-auto">${katex.renderToString(normalizedLatex, {
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
                const normalizedLatex = normalizeTextUnderscores(latex.trim());
                return `<span class="block my-4 overflow-x-auto">${katex.renderToString(normalizedLatex, {
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
                const normalizedLatex = normalizeTextUnderscores(latex.trim());
                return katex.renderToString(normalizedLatex, {
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
                const normalizedLatex = normalizeTextUnderscores(latex.trim());
                return katex.renderToString(normalizedLatex, {
                    displayMode: false,
                    throwOnError: false,
                    trust: true,
                });
            } catch {
                return `<code class="text-red-400">${latex}</code>`;
            }
        });

        // Convert code blocks (```python ... ``` or ``` ... ```) - BUT exclude mermaid blocks
        processedContent = processedContent.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
            // Handle mermaid blocks specially - they will be rendered by useEffect
            if (lang === 'mermaid') {
                const diagramId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                return `<div class="mermaid-container my-4 p-4 bg-[#111827] border border-gray-700 rounded-lg overflow-x-auto" data-mermaid-id="${diagramId}" data-mermaid-code="${encodeURIComponent(code.trim())}"><div class="mermaid" id="${diagramId}">${code.trim()}</div></div>`;
            }
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

        // Convert markdown images ![alt](url) to <img> tags
        processedContent = processedContent.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
            return `<figure class="my-4"><img src="${url}" alt="${alt}" class="max-w-full h-auto rounded border border-gray-700" loading="lazy" />${alt ? `<figcaption class="text-xs text-gray-500 mt-1 text-center">${alt}</figcaption>` : ''}</figure>`;
        });

        // Convert standalone Perplexity S3 image URLs to <img> tags
        // Matches URLs like: https://ppl-ai-code-interpreter-files.s3.amazonaws.com/.../filename.png
        processedContent = processedContent.replace(
            /(?<!\()(https:\/\/ppl-ai-code-interpreter-files\.s3\.amazonaws\.com\/[^\s<>"]+\.(?:png|jpg|jpeg|gif|svg|webp))(?!\))/gi,
            (url) => {
                return `<figure class="my-4"><img src="${url}" alt="Generated Chart" class="max-w-full h-auto rounded border border-gray-700" loading="lazy" /><figcaption class="text-xs text-gray-500 mt-1 text-center">📊 Generated Chart</figcaption></figure>`;
            }
        );

        // Note: We rely on CSS (white-space: pre-wrap) to preserve newlines
        // Do NOT insert <br/> tags as they break KaTeX SVG rendering

        // Restore protected table HTML blocks
        processedContent = restoreBlocks(processedContent);

        containerRef.current.innerHTML = processedContent;
        setMermaidRendered(false); // Trigger mermaid rendering
    }, [content]);

    // Second useEffect to render mermaid diagrams after content is set
    useEffect(() => {
        if (!containerRef.current || mermaidRendered) return;

        const mermaidContainers = containerRef.current.querySelectorAll('.mermaid-container');
        if (mermaidContainers.length === 0) return;

        const renderMermaidDiagrams = async () => {
            for (const container of mermaidContainers) {
                const mermaidDiv = container.querySelector('.mermaid') as HTMLElement;
                const originalCode = container.getAttribute('data-mermaid-code');

                if (mermaidDiv && originalCode) {
                    const decodedCode = decodeURIComponent(originalCode);
                    const diagramId = mermaidDiv.id || `mermaid-${Math.random().toString(36).substr(2, 9)}`;

                    // Step 1: Try rendering with sanitization
                    const sanitizedCode = sanitizeMermaidCode(decodedCode);

                    try {
                        // Clear previous content
                        mermaidDiv.innerHTML = '';

                        // Render the diagram with sanitized code
                        const { svg } = await mermaid.render(diagramId + '-svg', sanitizedCode);
                        mermaidDiv.innerHTML = svg;

                        // Add success indicator
                        container.classList.add('mermaid-rendered');
                    } catch (error) {
                        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                        console.error('Mermaid render error:', errorMsg);

                        // Store error info for the fix button
                        container.setAttribute('data-mermaid-error', errorMsg);

                        // Create unique button ID
                        const buttonId = `fix-btn-${diagramId}`;

                        // Show error with "Fix with AI" button
                        mermaidDiv.innerHTML = `
                            <div class="space-y-2">
                                <div class="flex items-center gap-2 text-red-400 text-xs">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                    </svg>
                                    <span>Diagram Error: ${errorMsg.substring(0, 100)}${errorMsg.length > 100 ? '...' : ''}</span>
                                </div>
                                <button 
                                    id="${buttonId}"
                                    class="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                                >
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                    </svg>
                                    Fix with AI
                                </button>
                                <details class="text-xs">
                                    <summary class="text-gray-500 cursor-pointer hover:text-gray-400">Show code</summary>
                                    <pre class="text-gray-600 p-2 mt-1 bg-[#0a0a0f] rounded overflow-x-auto max-h-40">${decodedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                                </details>
                            </div>
                        `;

                        // Attach click handler for the Fix button
                        setTimeout(() => {
                            const fixButton = document.getElementById(buttonId);
                            if (fixButton) {
                                fixButton.addEventListener('click', async () => {
                                    fixButton.innerHTML = `
                                        <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                        </svg>
                                        Fixing...
                                    `;
                                    fixButton.setAttribute('disabled', 'true');

                                    try {
                                        const fixedCode = await fixMermaidWithAI(decodedCode, errorMsg);
                                        const fixedId = `fixed-${diagramId}-svg`;

                                        // Try rendering the fixed code
                                        const { svg } = await mermaid.render(fixedId, fixedCode);
                                        mermaidDiv.innerHTML = svg;
                                        container.classList.add('mermaid-rendered');
                                        // Persist the fix to database
                                        if (onMermaidFixedRef.current) {
                                            onMermaidFixedRef.current(decodedCode, fixedCode);
                                        }
                                    } catch (fixError) {
                                        const fixErrorMsg = fixError instanceof Error ? fixError.message : 'Unknown error';
                                        mermaidDiv.innerHTML = `
                                            <div class="text-red-400 text-xs p-2">
                                                <p>AI fix also failed: ${fixErrorMsg}</p>
                                                <details class="mt-2">
                                                    <summary class="text-gray-500 cursor-pointer">Show original code</summary>
                                                    <pre class="text-gray-600 p-2 mt-1 bg-[#0a0a0f] rounded overflow-x-auto max-h-40">${decodedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                                                </details>
                                            </div>
                                        `;
                                    }
                                });
                            }
                        }, 50);
                    }
                }
            }
            setMermaidRendered(true);
        };

        // Small delay to ensure DOM is ready
        setTimeout(renderMermaidDiagrams, 100);
    }, [content, mermaidRendered]);

    if (inline) {
        return <span ref={containerRef as React.RefObject<HTMLSpanElement>} className={`math-content whitespace-pre-wrap ${className}`} />;
    }
    return <div ref={containerRef as React.RefObject<HTMLDivElement>} className={`math-content whitespace-pre-wrap ${className}`} />;
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
