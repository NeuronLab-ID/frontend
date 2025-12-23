"use client";

import { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathRendererProps {
    content: string;
    className?: string;
}

export function MathRenderer({ content, className = "" }: MathRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || !content) return;

        // Process the content to render LaTeX
        let processedContent = content;

        // Render display math ($$...$$)
        processedContent = processedContent.replace(/\$\$([\s\S]+?)\$\$/g, (_, latex) => {
            try {
                return `<div class="my-4 overflow-x-auto">${katex.renderToString(latex.trim(), {
                    displayMode: true,
                    throwOnError: false,
                    trust: true,
                })}</div>`;
            } catch {
                return `<pre class="text-red-400">${latex}</pre>`;
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

        // Convert markdown-style headers
        processedContent = processedContent.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-2 text-white">$1</h3>');
        processedContent = processedContent.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3 text-white">$1</h2>');

        // Convert **bold** to <strong>
        processedContent = processedContent.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white">$1</strong>');

        // Convert newlines to <br> for better readability
        processedContent = processedContent.replace(/\n\n/g, '<br/><br/>');
        processedContent = processedContent.replace(/\n/g, '<br/>');

        containerRef.current.innerHTML = processedContent;
    }, [content]);

    return <div ref={containerRef} className={`math-content ${className}`} />;
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
