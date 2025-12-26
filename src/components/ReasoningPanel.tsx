"use client";

import { useState, useEffect } from "react";
import { MathRenderer } from "@/components/MathRenderer";
import { HiSparkles, HiCheck, HiRefresh, HiExclamationCircle } from "react-icons/hi";
import { streamFullReasoning, getCachedFullReasoning, FullReasoningStep, isAuthenticated } from "@/lib/api";

interface ReasoningPanelProps {
    problemId: number;
    totalSteps: number;
}

export function ReasoningPanel({ problemId, totalSteps }: ReasoningPanelProps) {
    const [steps, setSteps] = useState<FullReasoningStep[]>([]);
    const [summary, setSummary] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isCached, setIsCached] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);

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

        try {
            for await (const event of streamFullReasoning(problemId, force)) {
                if (event.type === 'step') {
                    setSteps(prev => [...prev, event.data]);
                    setCurrentStep(event.data.step);
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

            {/* Generate Button */}
            {!hasGenerated && !loading && (
                <button
                    onClick={() => handleGenerate(false)}
                    className="w-full py-4 border-2 border-purple-400 bg-purple-400/10 hover:bg-purple-400 hover:text-black font-bold text-purple-400 transition-all flex items-center justify-center gap-2"
                >
                    <HiSparkles className="w-5 h-5" />
                    [Generate Full Solution Path]
                </button>
            )}

            {/* Regenerate Button */}
            {hasGenerated && !loading && (
                <button
                    onClick={handleRegenerate}
                    className="flex items-center gap-2 px-3 py-1 text-xs border border-gray-600 text-gray-400 hover:border-purple-400 hover:text-purple-400 transition-colors"
                >
                    <HiRefresh className="w-3 h-3" />
                    [Regenerate]
                </button>
            )}

            {/* Error */}
            {error && (
                <div className="border-2 border-red-400/30 bg-red-400/5 p-3 text-red-400 text-sm flex items-center gap-2">
                    <HiExclamationCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Loading Progress */}
            {loading && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-purple-400 text-sm">
                        <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                        Generating step {currentStep} of {totalSteps}...
                    </div>
                    <div className="h-1 bg-gray-800 overflow-hidden">
                        <div
                            className="h-full bg-purple-400 transition-all duration-300"
                            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Steps */}
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
    );
}
