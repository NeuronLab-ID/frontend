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

        // Render display math ($$...$$ or \[...\])
        processedContent = processedContent.replace(/\$\$([\s\S]+?)\$\$/g, (_, latex) => {
            try {
                return `<span class="block my-4 overflow-x-auto">${katex.renderToString(latex.trim(), {
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
                return `<span class="block my-4 overflow-x-auto">${katex.renderToString(latex.trim(), {
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
                return katex.renderToString(latex.trim(), {
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
                return katex.renderToString(latex.trim(), {
                    displayMode: false,
                    throwOnError: false,
                    trust: true,
                });
            } catch {
                return `<code class="text-red-400">${latex}</code>`;
            }
        });

        // Convert markdown-style headers
        processedContent = processedContent.replace(/^### (.+)$/gm, '<span class="block text-lg font-semibold mt-6 mb-2 text-white">$1</span>');
        processedContent = processedContent.replace(/^## (.+)$/gm, '<span class="block text-xl font-bold mt-6 mb-3 text-white">$1</span>');

        // Convert **bold** to <strong>
        processedContent = processedContent.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white">$1</strong>');

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
