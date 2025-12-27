"use client";

import { useState, useEffect } from "react";
import { MathRenderer } from "@/components/MathRenderer";
import { HiSparkles, HiRefresh, HiExclamationCircle, HiTranslate, HiCheck, HiPrinter, HiGlobeAlt } from "react-icons/hi";
import { streamFullReasoning, getCachedFullReasoning, FullReasoningStep, isAuthenticated } from "@/lib/api";

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

    // Check for cached reasoning on mount
    useEffect(() => {
        async function checkCached() {
            if (!isAuthenticated()) return;
            try {
                const result = await getCachedFullReasoning(problemId);
                if (result.exists && result.data) {
                    setSteps(result.data.steps);
                    setSummary(result.data.summary);
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
                </div>
            )
            }

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
                                        <span>🌐 {searchStatus || 'Searching web for references...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>✓</span>
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

            {/* Steps - with id for printing */}
            <div id="reasoning-content">
                {steps.map((step, i) => (
                    <div
                        key={step.step}
                        className="border-2 border-purple-400/30 bg-[#1a1a2e] overflow-hidden"
                    >
                        <div className="flex items-center gap-2 px-4 py-2 bg-purple-400/10 border-b border-purple-400/30">
                            <div className="w-6 h-6 border-2 border-purple-400 flex items-center justify-center text-purple-400 text-xs font-bold">
                                {step.step}
                            </div>
                            <span className="text-purple-400 font-bold text-sm">{step.title}</span>
                            <HiCheck className="w-4 h-4 text-green-400 ml-auto" />
                        </div>
                        <div className="p-4">
                            <MathRenderer content={step.reasoning} className="text-gray-300 text-sm" />
                        </div>
                    </div>
                ))}

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
                    <div className="border-2 border-green-400/30 bg-green-400/5 p-4">
                        <h3 className="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
                            <HiCheck className="w-4 h-4" />
                            [Summary - Complete Solution Path]
                        </h3>
                        <MathRenderer content={summary} className="text-gray-300 text-sm" />
                    </div>
                )}
            </div>
        </div >
    );
}
