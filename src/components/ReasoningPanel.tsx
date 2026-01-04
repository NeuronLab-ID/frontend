"use client";

import { useState, useEffect, useCallback } from "react";
import { MathRenderer } from "@/components/MathRenderer";
import { HiSparkles, HiRefresh, HiExclamationCircle, HiTranslate, HiCheck, HiPrinter, HiGlobeAlt, HiBookOpen, HiChevronDown, HiChevronRight, HiDownload } from "react-icons/hi";
import { streamFullReasoning, getCachedFullReasoning, FullReasoningStep, isAuthenticated, exportReasoningMarkdown, exportReasoningLatex } from "@/lib/api";

interface ReadingState {
    expandedSteps: number[];
    readSteps: number[];
    lastReadStep: number | null;
    summaryExpanded: boolean;
    summaryRead: boolean;
}

const READING_STATE_KEY_PREFIX = "reasoning_reading_state_";

interface ReasoningPanelProps {
    problemId: number;
    totalSteps: number;
    problemName?: string;
}

export function ReasoningPanel({ problemId, totalSteps, problemName = "Solution" }: ReasoningPanelProps) {
    const [steps, setSteps] = useState<FullReasoningStep[]>([]);
    const [summary, setSummary] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isCached, setIsCached] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [isTranslated, setIsTranslated] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [originalSteps, setOriginalSteps] = useState<FullReasoningStep[]>([]);
    const [originalSummary, setOriginalSummary] = useState<string>("");
    const [useWebSearch, setUseWebSearch] = useState(false);
    const [usePerplexityAI, setUsePerplexityAI] = useState(false);
    const [searchingWeb, setSearchingWeb] = useState(false);
    const [searchStatus, setSearchStatus] = useState<string>("");
    const [searchComplete, setSearchComplete] = useState(false);
    const [webReferences, setWebReferences] = useState<string>("");
    const [showWebReferences, setShowWebReferences] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Reading state for collapsible steps
    const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
    const [readSteps, setReadSteps] = useState<Set<number>>(new Set());
    const [lastReadStep, setLastReadStep] = useState<number | null>(null);
    const [summaryExpanded, setSummaryExpanded] = useState(false);
    const [summaryRead, setSummaryRead] = useState(false);

    // Load reading state from localStorage
    useEffect(() => {
        const savedState = localStorage.getItem(`${READING_STATE_KEY_PREFIX}${problemId}`);
        if (savedState) {
            try {
                const state: ReadingState = JSON.parse(savedState);
                setExpandedSteps(new Set(state.expandedSteps || []));
                setReadSteps(new Set(state.readSteps || []));
                setLastReadStep(state.lastReadStep ?? null);
                setSummaryExpanded(state.summaryExpanded ?? false);
                setSummaryRead(state.summaryRead ?? false);
            } catch {
                // Invalid state, ignore
            }
        }
    }, [problemId]);

    // Save reading state to localStorage
    const saveReadingState = useCallback(() => {
        const state: ReadingState = {
            expandedSteps: Array.from(expandedSteps),
            readSteps: Array.from(readSteps),
            lastReadStep,
            summaryExpanded,
            summaryRead,
        };
        localStorage.setItem(`${READING_STATE_KEY_PREFIX}${problemId}`, JSON.stringify(state));
    }, [problemId, expandedSteps, readSteps, lastReadStep, summaryExpanded, summaryRead]);

    // Save state whenever it changes
    useEffect(() => {
        if (hasGenerated) {
            saveReadingState();
        }
    }, [expandedSteps, readSteps, lastReadStep, summaryExpanded, summaryRead, hasGenerated, saveReadingState]);

    // Toggle step expansion
    const toggleStep = (stepNum: number) => {
        setExpandedSteps(prev => {
            const next = new Set(prev);
            if (next.has(stepNum)) {
                next.delete(stepNum);
            } else {
                next.add(stepNum);
                // Mark as read when expanded
                setReadSteps(r => new Set(r).add(stepNum));
                setLastReadStep(stepNum);
            }
            return next;
        });
    };

    // Toggle summary expansion
    const toggleSummary = () => {
        setSummaryExpanded(prev => {
            if (!prev) {
                setSummaryRead(true);
            }
            return !prev;
        });
    };

    // Expand/collapse all steps
    const expandAllSteps = () => {
        const allStepNums = steps.map(s => s.step);
        setExpandedSteps(new Set(allStepNums));
        setReadSteps(new Set(allStepNums));
        setSummaryExpanded(true);
        setSummaryRead(true);
    };

    const collapseAllSteps = () => {
        setExpandedSteps(new Set());
        setSummaryExpanded(false);
    };

    // Check for cached reasoning on mount
    useEffect(() => {
        async function checkCached() {
            if (!isAuthenticated()) return;
            try {
                const result = await getCachedFullReasoning(problemId);
                if (result.exists && result.data) {
                    setSteps(result.data.steps);
                    setSummary(result.data.summary);
                    // Also load web references from cached data
                    if (result.data.web_references) {
                        setWebReferences(result.data.web_references);
                    }
                    setHasGenerated(true);
                    setIsCached(true);
                }
            } catch {
                // Ignore errors
            }
        }
        checkCached();
    }, [problemId]);

    const handleGenerate = async (force: boolean = false) => {
        if (!isAuthenticated()) {
            setError("Please login to generate reasoning");
            return;
        }

        setLoading(true);
        setError(null);
        setSteps([]);
        setSummary("");
        setCurrentStep(0);
        setIsCached(false);
        setIsTranslated(false);
        setSearchingWeb(false);
        setSearchStatus("");
        setSearchComplete(false);
        setWebReferences("");
        setShowWebReferences(false);

        try {
            for await (const event of streamFullReasoning(problemId, force, useWebSearch, usePerplexityAI)) {
                if (event.type === 'step') {
                    setSteps(prev => {
                        const newSteps = [...prev, event.data];
                        // Sort by step number to ensure correct order
                        return newSteps.sort((a, b) => a.step - b.step);
                    });
                    setCurrentStep(event.data.step);
                    setSearchingWeb(false);

                    // Auto-scroll to show the steps when first step arrives
                    if (event.data.step === 1) {
                        setTimeout(() => {
                            document.getElementById('reasoning-content')?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                            });
                        }, 100);
                    }
                } else if (event.type === 'search') {
                    setSearchingWeb(true);
                    setSearchStatus(event.data?.topic || "Searching...");
                } else if (event.type === 'search_result') {
                    // Store the full search result (includes images)
                    setWebReferences(event.data?.content || "");
                } else if (event.type === 'search_complete') {
                    setSearchingWeb(false);
                    setSearchComplete(true);
                    setSearchStatus(`✓ Found ${(event.data?.chars || 0).toLocaleString()} chars of context`);
                } else if (event.type === 'summary') {
                    setSummary(event.data);
                } else if (event.type === 'done') {
                    setIsCached(event.cached);
                    setHasGenerated(true);
                } else if (event.type === 'error') {
                    setError(event.message);
                }
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to generate reasoning");
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerate = () => {
        handleGenerate(true);  // Force regenerate
    };

    // Translate text using MS Edge translate API, preserving code and LaTeX
    const translateText = async (texts: string[]): Promise<string[]> => {
        // Helper to protect code/LaTeX from translation
        const protectAndTranslate = async (text: string): Promise<string> => {
            const placeholders: string[] = [];
            let protectedText = text;

            // Protect code blocks (```...```)
            protectedText = protectedText.replace(/```[\s\S]*?```/g, (match) => {
                placeholders.push(match);
                return `__CODE_BLOCK_${placeholders.length - 1}__`;
            });

            // Protect display math ($$...$$)
            protectedText = protectedText.replace(/\$\$[\s\S]*?\$\$/g, (match) => {
                placeholders.push(match);
                return `__DISPLAY_MATH_${placeholders.length - 1}__`;
            });

            // Protect inline math ($...$)
            protectedText = protectedText.replace(/\$[^$\n]+?\$/g, (match) => {
                placeholders.push(match);
                return `__INLINE_MATH_${placeholders.length - 1}__`;
            });

            // Protect \(...\) inline math
            protectedText = protectedText.replace(/\\\([\s\S]*?\\\)/g, (match) => {
                placeholders.push(match);
                return `__PAREN_MATH_${placeholders.length - 1}__`;
            });

            // Protect \[...\] display math
            protectedText = protectedText.replace(/\\\[[\s\S]*?\\\]/g, (match) => {
                placeholders.push(match);
                return `__BRACKET_MATH_${placeholders.length - 1}__`;
            });

            // Protect inline code (`...`)
            protectedText = protectedText.replace(/`[^`]+`/g, (match) => {
                placeholders.push(match);
                return `__INLINE_CODE_${placeholders.length - 1}__`;
            });

            // Translate the protected text
            const response = await fetch('https://edge.microsoft.com/translate/translatetext?from=en&to=id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([protectedText]),
            });

            if (!response.ok) throw new Error('Translation failed');

            const result = await response.json();
            let translated = result[0]?.translations?.[0]?.text || protectedText;

            // Restore placeholders
            translated = translated.replace(/__CODE_BLOCK_(\d+)__/g, (_: string, i: string) => placeholders[parseInt(i)]);
            translated = translated.replace(/__DISPLAY_MATH_(\d+)__/g, (_: string, i: string) => placeholders[parseInt(i)]);
            translated = translated.replace(/__INLINE_MATH_(\d+)__/g, (_: string, i: string) => placeholders[parseInt(i)]);
            translated = translated.replace(/__PAREN_MATH_(\d+)__/g, (_: string, i: string) => placeholders[parseInt(i)]);
            translated = translated.replace(/__BRACKET_MATH_(\d+)__/g, (_: string, i: string) => placeholders[parseInt(i)]);
            translated = translated.replace(/__INLINE_CODE_(\d+)__/g, (_: string, i: string) => placeholders[parseInt(i)]);

            return translated;
        };

        // Translate each text one by one to preserve individual placeholders
        const results: string[] = [];
        for (const text of texts) {
            results.push(await protectAndTranslate(text));
        }
        return results;
    };

    const handleTranslate = async () => {
        if (translating) return;

        if (isTranslated) {
            // Revert to original
            setSteps(originalSteps);
            setSummary(originalSummary);
            setIsTranslated(false);
            return;
        }

        setTranslating(true);
        setError(null);

        try {
            // Store originals
            setOriginalSteps([...steps]);
            setOriginalSummary(summary);

            // Translate all step reasonings and summary
            const textsToTranslate = [...steps.map(s => s.reasoning), summary].filter(Boolean);
            const translated = await translateText(textsToTranslate);

            // Update steps with translated content
            const translatedSteps = steps.map((step, i) => ({
                ...step,
                reasoning: translated[i] || step.reasoning
            }));

            setSteps(translatedSteps);
            setSummary(translated[translated.length - 1] || summary);
            setIsTranslated(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Translation failed");
        } finally {
            setTranslating(false);
        }
    };

    // Convert LaTeX delimiters for Google Docs compatibility
    const convertLatexForGoogleDocs = (text: string): string => {
        // Convert \(...\) to $...$
        let result = text.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
        // Convert \[...\] to $$...$$
        result = result.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
        return result;
    };

    // Export reasoning as markdown file
    const handleExportMarkdown = () => {
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        let markdown = `# ${problemName} - Solution Reasoning\n\n`;
        markdown += `> Generated by NeuronLab AI | ${currentDate}\n`;
        markdown += `> Open in Google Docs with Auto-LaTeX Equations add-on for best experience\n\n`;

        // Add steps
        steps.forEach((step) => {
            markdown += `## Step ${step.step}: ${step.title}\n\n`;
            markdown += convertLatexForGoogleDocs(step.reasoning) + '\n\n';
        });

        // Add summary
        if (summary) {
            markdown += `---\n\n## Summary\n\n`;
            markdown += convertLatexForGoogleDocs(summary) + '\n\n';
        }

        // Add web references if available
        if (webReferences) {
            markdown += `---\n\n## References\n\n`;
            markdown += convertLatexForGoogleDocs(webReferences) + '\n';
        }

        // Create and download file
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${problemName?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'reasoning'}_solution.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // AI Enhanced Export using Perplexity
    const handleAiEnhancedExport = async () => {
        setExporting(true);
        setShowExportMenu(false);
        try {
            const result = await exportReasoningMarkdown(problemId, true);

            // Download the enhanced markdown
            const blob = new Blob([result.markdown], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${problemName?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'reasoning'}_enhanced.md`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('AI Enhanced Export failed:', err);
            // Fall back to quick export
            handleExportMarkdown();
        } finally {
            setExporting(false);
        }
    };

    // Convert content to LaTeX-safe format
    const convertToLatex = (text: string): string => {
        // First, protect existing LaTeX math blocks
        const mathBlocks: string[] = [];
        let result = text;

        // Protect display math $$...$$ and \[...\]
        result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
            mathBlocks.push(`\\[\n${math.trim()}\n\\]`);
            return `__MATH_BLOCK_${mathBlocks.length - 1}__`;
        });
        result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
            mathBlocks.push(`\\[\n${math.trim()}\n\\]`);
            return `__MATH_BLOCK_${mathBlocks.length - 1}__`;
        });

        // Protect inline math $...$ and \(...\)
        result = result.replace(/\$([^$\n]+?)\$/g, (_, math) => {
            mathBlocks.push(`$${math}$`);
            return `__MATH_BLOCK_${mathBlocks.length - 1}__`;
        });
        result = result.replace(/\\\(([^)]+?)\\\)/g, (_, math) => {
            mathBlocks.push(`$${math}$`);
            return `__MATH_BLOCK_${mathBlocks.length - 1}__`;
        });

        // Escape LaTeX special characters (outside math)
        result = result.replace(/([&%$#_{}])/g, '\\$1');
        result = result.replace(/~/g, '\\textasciitilde{}');
        result = result.replace(/\^/g, '\\textasciicircum{}');
        result = result.replace(/\\/g, '\\textbackslash{}');

        // Convert markdown headers to LaTeX sections
        result = result.replace(/^### (.*$)/gm, '\\subsubsection{$1}');
        result = result.replace(/^## (.*$)/gm, '\\subsection{$1}');
        result = result.replace(/^# (.*$)/gm, '\\section{$1}');

        // Convert markdown bold/italic
        result = result.replace(/\*\*([^*]+)\*\*/g, '\\textbf{$1}');
        result = result.replace(/\*([^*]+)\*/g, '\\textit{$1}');

        // Convert markdown code blocks to lstlisting
        result = result.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
            const language = lang || 'python';
            return `\\begin{lstlisting}[language=${language}]\n${code.trim()}\n\\end{lstlisting}`;
        });

        // Convert inline code to texttt
        result = result.replace(/`([^`]+)`/g, '\\texttt{$1}');

        // Convert markdown lists
        result = result.replace(/^- (.*)$/gm, '\\item $1');

        // Restore math blocks
        result = result.replace(/__MATH_BLOCK_(\d+)__/g, (_, i) => mathBlocks[parseInt(i)]);

        return result;
    };

    // Export as LaTeX (.tex) file for Overleaf - uses dedicated AI endpoint
    const handleExportLatex = async () => {
        setExporting(true);
        setShowExportMenu(false);

        try {
            // Call dedicated LaTeX export endpoint (uses AI for valid syntax)
            const result = await exportReasoningLatex(problemId);

            // Download the LaTeX file
            const blob = new Blob([result.latex], { type: 'application/x-tex;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${problemName?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'reasoning'}_solution.tex`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            if (result.ai_generated) {
                console.log('LaTeX generated with AI enhancement for valid syntax');
            }
        } catch (err) {
            console.error('LaTeX export failed:', err);
            alert('Failed to export LaTeX. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    // Export as LaTeX with Sonnet + Web Search (slower, more accurate)
    const handleExportLatexSonnet = async () => {
        setExporting(true);
        setShowExportMenu(false);

        try {
            // Call LaTeX export with Sonnet mode (uses Claude 4.5 + web search for syntax validation)
            const result = await exportReasoningLatex(problemId, true);

            const blob = new Blob([result.latex], { type: 'application/x-tex;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${problemName?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'reasoning'}_solution_sonnet.tex`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log(`LaTeX generated with ${result.model || 'AI'} for validated syntax`);
        } catch (err) {
            console.error('Sonnet LaTeX export failed:', err);
            alert('Failed to export LaTeX with Sonnet. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-purple-400 flex items-center gap-2">
                    <HiSparkles className="w-5 h-5" />
                    [Solution Reasoning]
                </h2>
                {hasGenerated && (
                    <span className="text-xs text-gray-500">
                        {isCached ? "// Cached" : "// Generated"}
                    </span>
                )}
            </div>

            {/* Description */}
            {!hasGenerated && !loading && (
                <div className="border-l-2 border-purple-400/50 pl-4 py-2 bg-purple-400/5">
                    <p className="text-sm text-gray-400">
                        Generate a step-by-step mathematical reasoning path that explains how each quest step
                        contributes to solving the overall problem. The AI will analyze each step sequentially
                        and provide a comprehensive explanation with formulas.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                        // Reasoning is generated once and cached for future visits
                    </p>
                </div>
            )}

            {/* Generate Button with Web Search Option */}
            {!hasGenerated && !loading && (
                <div className="space-y-3">
                    {/* Web Search Toggle */}
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={useWebSearch}
                                onChange={(e) => setUseWebSearch(e.target.checked)}
                                className="sr-only"
                            />
                            <div className={`w-10 h-5 rounded-full transition-colors ${useWebSearch ? 'bg-green-400' : 'bg-gray-700'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform mt-0.5 ${useWebSearch ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <HiGlobeAlt className={`w-4 h-4 ${useWebSearch ? 'text-green-400' : 'text-gray-500'}`} />
                            <span className={`text-sm ${useWebSearch ? 'text-green-400' : 'text-gray-400'}`}>
                                {useWebSearch ? 'Web Search: ON' : 'Enable Web Search'}
                            </span>
                        </div>
                        <span className="text-xs text-gray-500 hidden sm:inline">
                            // Web context for examples
                        </span>
                    </label>

                    {/* Perplexity AI Reasoning Toggle */}
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={usePerplexityAI}
                                onChange={(e) => setUsePerplexityAI(e.target.checked)}
                                className="sr-only"
                            />
                            <div className={`w-10 h-5 rounded-full transition-colors ${usePerplexityAI ? 'bg-purple-500' : 'bg-gray-700'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform mt-0.5 ${usePerplexityAI ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <HiSparkles className={`w-4 h-4 ${usePerplexityAI ? 'text-purple-400' : 'text-gray-500'}`} />
                            <span className={`text-sm ${usePerplexityAI ? 'text-purple-400' : 'text-gray-400'}`}>
                                {usePerplexityAI ? 'Perplexity AI: ON' : 'Use Perplexity AI'}
                            </span>
                        </div>
                        <span className="text-xs text-gray-500 hidden sm:inline">
                            // Claude 4.5 Sonnet Thinking
                        </span>
                    </label>

                    {/* Generate Button */}
                    <button
                        onClick={() => handleGenerate(false)}
                        className="w-full py-4 border-2 border-purple-400 bg-purple-400/10 hover:bg-purple-400 hover:text-black font-bold text-purple-400 transition-all flex items-center justify-center gap-2"
                    >
                        <HiSparkles className="w-5 h-5" />
                        [Generate Full Solution Path]
                        {useWebSearch && <span className="text-xs opacity-70">(+ Web)</span>}
                        {usePerplexityAI && <span className="text-xs opacity-70">(+ Claude 4.5)</span>}
                    </button>
                </div>
            )}

            {/* Regenerate, Translate, and Print Buttons */}
            {hasGenerated && !loading && (
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={handleRegenerate}
                        className="flex items-center gap-2 px-3 py-1 text-xs border border-gray-600 text-gray-400 hover:border-purple-400 hover:text-purple-400 transition-colors"
                    >
                        <HiRefresh className="w-3 h-3" />
                        [Regenerate]
                        {usePerplexityAI && <span className="text-purple-400">(Sonnet)</span>}
                    </button>
                    <button
                        onClick={() => setUseWebSearch(!useWebSearch)}
                        className={`flex items-center gap-2 px-3 py-1 text-xs border transition-colors ${useWebSearch
                            ? "border-green-400 text-green-400 bg-green-400/10"
                            : "border-gray-600 text-gray-400 hover:border-green-400 hover:text-green-400"
                            }`}
                    >
                        <HiGlobeAlt className="w-3 h-3" />
                        {useWebSearch ? "[Web: ON]" : "[Web]"}
                    </button>
                    <button
                        onClick={() => setUsePerplexityAI(!usePerplexityAI)}
                        className={`flex items-center gap-2 px-3 py-1 text-xs border transition-colors ${usePerplexityAI
                            ? "border-purple-500 text-purple-400 bg-purple-500/10"
                            : "border-gray-600 text-gray-400 hover:border-purple-500 hover:text-purple-400"
                            }`}
                    >
                        <HiSparkles className="w-3 h-3" />
                        {usePerplexityAI ? "[Sonnet 4.5: ON]" : "[Sonnet 4.5]"}
                    </button>
                    <button
                        onClick={handleTranslate}
                        disabled={translating}
                        className={`flex items-center gap-2 px-3 py-1 text-xs border transition-colors ${isTranslated
                            ? "border-cyan-400 text-cyan-400 bg-cyan-400/10"
                            : "border-gray-600 text-gray-400 hover:border-cyan-400 hover:text-cyan-400"
                            } ${translating ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        <HiTranslate className="w-3 h-3" />
                        {translating ? "[Translating...]" : isTranslated ? "[Show English]" : "[Terjemahkan]"}
                    </button>
                    <button
                        onClick={() => {
                            const printContent = document.getElementById('reasoning-content');
                            if (!printContent) return;

                            const printWindow = window.open('', '_blank');
                            if (!printWindow) return;

                            printWindow.document.write(`
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <title>${problemName} - Solution Reasoning</title>
                                    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
                                    <style>
                                        body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                                        h1 { color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; }
                                        h2 { color: #06b6d4; margin-top: 30px; }
                                        pre { background: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; }
                                        code { font-family: monospace; }
                                        table { border-collapse: collapse; margin: 10px 0; }
                                        th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
                                        th { background: #f3f4f6; }
                                        .step { margin-bottom: 30px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
                                        .step-title { font-weight: bold; color: #7c3aed; margin-bottom: 10px; }
                                        @media print { body { padding: 20px; } }
                                    </style>
                                </head>
                                <body>
                                    <h1>${problemName} - Solution Reasoning</h1>
                                    ${printContent.innerHTML}
                                </body>
                                </html>
                            `);
                            printWindow.document.close();
                            printWindow.onload = () => {
                                printWindow.print();
                            };
                        }}
                        className="flex items-center gap-2 px-3 py-1 text-xs border border-gray-600 text-gray-400 hover:border-green-400 hover:text-green-400 transition-colors"
                    >
                        <HiPrinter className="w-3 h-3" />
                        [Print]
                    </button>
                    {/* Export Markdown Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            disabled={exporting}
                            className={`flex items-center gap-2 px-3 py-1 text-xs border transition-colors ${exporting
                                ? "border-cyan-400 text-cyan-400 bg-cyan-400/10"
                                : "border-gray-600 text-gray-400 hover:border-cyan-400 hover:text-cyan-400"
                                }`}
                            title="Export as Markdown (Google Docs compatible)"
                        >
                            {exporting ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                    [Exporting...]
                                </>
                            ) : (
                                <>
                                    <HiDownload className="w-3 h-3" />
                                    [Export .md]
                                    <HiChevronDown className="w-3 h-3" />
                                </>
                            )}
                        </button>
                        {/* Dropdown Menu */}
                        {showExportMenu && !exporting && (
                            <div className="absolute right-0 top-full mt-1 w-56 bg-[#1a1a2e] border-2 border-gray-700 shadow-xl z-50">
                                <button
                                    onClick={() => {
                                        handleExportMarkdown();
                                        setShowExportMenu(false);
                                    }}
                                    className="w-full px-4 py-2 text-left text-xs text-gray-300 hover:bg-cyan-400/10 hover:text-cyan-400 transition-colors flex items-center gap-2"
                                >
                                    <HiDownload className="w-3 h-3" />
                                    <div>
                                        <div className="font-bold">[Quick Export]</div>
                                        <div className="text-gray-500 text-[10px]">Instant download</div>
                                    </div>
                                </button>
                                <button
                                    onClick={handleAiEnhancedExport}
                                    className="w-full px-4 py-2 text-left text-xs text-gray-300 hover:bg-purple-400/10 hover:text-purple-400 transition-colors flex items-center gap-2 border-t border-gray-700"
                                >
                                    <HiSparkles className="w-3 h-3" />
                                    <div>
                                        <div className="font-bold">[AI Enhanced .md]</div>
                                        <div className="text-gray-500 text-[10px]">Perplexity + better LaTeX</div>
                                    </div>
                                </button>
                                <button
                                    onClick={handleExportLatex}
                                    className="w-full px-4 py-2 text-left text-xs text-gray-300 hover:bg-green-400/10 hover:text-green-400 transition-colors flex items-center gap-2 border-t border-gray-700"
                                >
                                    <HiDownload className="w-3 h-3" />
                                    <div>
                                        <div className="font-bold">[Export .tex]</div>
                                        <div className="text-gray-500 text-[10px]">Fast AI LaTeX (pplx_alpha)</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleExportLatexSonnet()}
                                    className="w-full px-4 py-2 text-left text-xs text-gray-300 hover:bg-purple-400/10 hover:text-purple-400 transition-colors flex items-center gap-2 border-t border-gray-700"
                                >
                                    <HiSparkles className="w-3 h-3" />
                                    <div>
                                        <div className="font-bold">[Export .tex + Sonnet]</div>
                                        <div className="text-gray-500 text-[10px]">Claude 4.5 + Web Search</div>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )
            }

            {/* Expand/Collapse All Controls */}
            {hasGenerated && !loading && steps.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                    <button
                        onClick={expandAllSteps}
                        className="flex items-center gap-1 px-2 py-1 border border-gray-600 text-gray-400 hover:border-purple-400 hover:text-purple-400 transition-colors"
                    >
                        <HiChevronDown className="w-3 h-3" />
                        [Expand All]
                    </button>
                    <button
                        onClick={collapseAllSteps}
                        className="flex items-center gap-1 px-2 py-1 border border-gray-600 text-gray-400 hover:border-purple-400 hover:text-purple-400 transition-colors"
                    >
                        <HiChevronRight className="w-3 h-3" />
                        [Collapse All]
                    </button>
                    <span className="text-gray-500 ml-2">
                        // {readSteps.size}/{steps.length} read
                        {lastReadStep && <span className="text-purple-400"> • Last: Step {lastReadStep}</span>}
                    </span>
                </div>
            )}

            {/* Error */}
            {
                error && (
                    <div className="border-2 border-red-400/30 bg-red-400/5 p-3 text-red-400 text-sm flex items-center gap-2">
                        <HiExclamationCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )
            }

            {/* Loading Progress */}
            {
                loading && (
                    <div className="space-y-3">
                        {/* Search Status */}
                        {useWebSearch && (searchingWeb || searchComplete) && (
                            <div className={`flex items-center gap-2 text-sm px-3 py-2 border ${searchComplete ? 'border-green-400/30 bg-green-400/5 text-green-400' : 'border-yellow-400/30 bg-yellow-400/5 text-yellow-400'}`}>
                                {searchingWeb ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                                        <HiGlobeAlt className="w-4 h-4" />
                                        <span>{searchStatus || 'Searching web for references...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <HiCheck className="w-4 h-4" />
                                        <span>{searchStatus}</span>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Step Generation Status */}
                        <div className="flex items-center gap-2 text-purple-400 text-sm">
                            <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                            {currentStep === 0 && !searchComplete ? (
                                <span>Preparing reasoning generation...</span>
                            ) : (
                                <span>Generating step {currentStep} of {totalSteps}...</span>
                            )}
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1 bg-gray-800 overflow-hidden">
                            <div
                                className="h-full bg-purple-400 transition-all duration-300"
                                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                            />
                        </div>
                    </div>
                )
            }

            {/* Web References (from Perplexity Search) */}
            {webReferences && (
                <div className="border-2 border-green-400/30 bg-[#1a1a2e] overflow-hidden">
                    <button
                        onClick={() => setShowWebReferences(!showWebReferences)}
                        className="w-full flex items-center justify-between gap-2 px-4 py-2 bg-green-400/10 border-b border-green-400/30 hover:bg-green-400/20 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <HiBookOpen className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 font-bold text-sm">Web References (Perplexity)</span>
                            <span className="text-xs text-gray-500">({webReferences.length.toLocaleString()} chars)</span>
                        </div>
                        <span className="text-green-400 text-xs">{showWebReferences ? '▼ Hide' : '▶ Show'}</span>
                    </button>
                    {showWebReferences && (
                        <div className="p-4 max-h-[500px] overflow-y-auto">
                            <MathRenderer content={webReferences} />
                        </div>
                    )}
                </div>
            )}

            {/* Steps - with id for printing */}
            <div id="reasoning-content">
                {steps.map((step) => {
                    const isExpanded = expandedSteps.has(step.step);
                    const isRead = readSteps.has(step.step);
                    const isLastRead = lastReadStep === step.step;

                    return (
                        <div
                            key={step.step}
                            className={`border-2 bg-[#1a1a2e] overflow-hidden transition-colors ${isLastRead
                                ? 'border-cyan-400/50'
                                : isRead
                                    ? 'border-purple-400/30'
                                    : 'border-gray-600/50'
                                }`}
                        >
                            <button
                                onClick={() => toggleStep(step.step)}
                                className={`w-full flex items-center gap-2 px-4 py-2 border-b transition-colors ${isExpanded
                                    ? 'bg-purple-400/10 border-purple-400/30'
                                    : isRead
                                        ? 'bg-purple-400/5 border-purple-400/20 hover:bg-purple-400/10'
                                        : 'bg-gray-800/50 border-gray-600/30 hover:bg-gray-700/50'
                                    }`}
                            >
                                {/* Expand/Collapse Icon */}
                                {isExpanded ? (
                                    <HiChevronDown className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                ) : (
                                    <HiChevronRight className={`w-4 h-4 flex-shrink-0 ${isRead ? 'text-purple-400' : 'text-gray-500'}`} />
                                )}

                                {/* Step Number Badge */}
                                <div className={`w-6 h-6 border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${isRead ? 'border-purple-400 text-purple-400' : 'border-gray-500 text-gray-500'
                                    }`}>
                                    {step.step}
                                </div>

                                {/* Step Title */}
                                <span className={`font-bold text-sm text-left flex-1 ${isRead ? 'text-purple-400' : 'text-gray-400'
                                    }`}>
                                    {step.title}
                                </span>

                                {/* Status Indicators */}
                                <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                                    {isLastRead && (
                                        <span className="text-[10px] text-cyan-400 px-1.5 py-0.5 border border-cyan-400/50 bg-cyan-400/10">
                                            LAST READ
                                        </span>
                                    )}
                                    {isRead ? (
                                        <HiCheck className="w-4 h-4 text-green-400" />
                                    ) : (
                                        <span className="text-[10px] text-gray-500">NEW</span>
                                    )}
                                </div>
                            </button>

                            {/* Collapsible Content */}
                            {isExpanded && (
                                <div className="p-4">
                                    <MathRenderer content={step.reasoning} className="text-gray-300 text-sm" />
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Waiting Steps */}
                {loading && Array.from({ length: totalSteps - steps.length }).map((_, i) => (
                    <div
                        key={`waiting-${i}`}
                        className="border-2 border-gray-700 bg-[#1a1a2e]/50 p-4 flex items-center gap-2 text-gray-500"
                    >
                        <div className="w-6 h-6 border-2 border-gray-600 flex items-center justify-center text-xs">
                            {steps.length + i + 1}
                        </div>
                        <span className="text-sm">// Waiting...</span>
                    </div>
                ))}

                {/* Summary */}
                {summary && (
                    <div className={`border-2 bg-[#1a1a2e] overflow-hidden transition-colors ${summaryRead ? 'border-green-400/30' : 'border-gray-600/50'
                        }`}>
                        <button
                            onClick={toggleSummary}
                            className={`w-full flex items-center gap-2 px-4 py-2 border-b transition-colors ${summaryExpanded
                                ? 'bg-green-400/10 border-green-400/30'
                                : summaryRead
                                    ? 'bg-green-400/5 border-green-400/20 hover:bg-green-400/10'
                                    : 'bg-gray-800/50 border-gray-600/30 hover:bg-gray-700/50'
                                }`}
                        >
                            {/* Expand/Collapse Icon */}
                            {summaryExpanded ? (
                                <HiChevronDown className="w-4 h-4 text-green-400 flex-shrink-0" />
                            ) : (
                                <HiChevronRight className={`w-4 h-4 flex-shrink-0 ${summaryRead ? 'text-green-400' : 'text-gray-500'}`} />
                            )}

                            <HiCheck className={`w-4 h-4 ${summaryRead ? 'text-green-400' : 'text-gray-500'}`} />
                            <span className={`font-bold text-sm text-left flex-1 ${summaryRead ? 'text-green-400' : 'text-gray-400'}`}>
                                [Summary - Complete Solution Path]
                            </span>

                            {/* Status Indicator */}
                            <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                                {summaryRead ? (
                                    <HiCheck className="w-4 h-4 text-green-400" />
                                ) : (
                                    <span className="text-[10px] text-gray-500">NEW</span>
                                )}
                            </div>
                        </button>

                        {/* Collapsible Content */}
                        {summaryExpanded && (
                            <div className="p-4 bg-green-400/5">
                                <MathRenderer content={summary} className="text-gray-300 text-sm" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
}
