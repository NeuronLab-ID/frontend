"use client";

import { useState } from "react";
import { MathRenderer } from "@/components/MathRenderer";
import { HiRefresh, HiBeaker, HiChartBar } from "react-icons/hi";
import { apiRequest } from "@/lib/api";

interface MathSampleGeneratorProps {
    formulaName: string;
    formulaLatex: string;
    difficulty?: "easy" | "medium" | "hard";
}

interface SampleResponse {
    success: boolean;
    steps: string[];
    result: string;
    error?: string;
}

export function MathSampleGenerator({ formulaName, formulaLatex, difficulty = "easy" }: MathSampleGeneratorProps) {
    const [showOptions, setShowOptions] = useState(false);
    const [showSample, setShowSample] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sample, setSample] = useState<{ steps: string[]; result: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState(difficulty);

    const generateSample = async (difficultyOverride?: string) => {
        setLoading(true);
        setError(null);
        setShowSample(true);

        const difficultyToUse = difficultyOverride || selectedDifficulty;

        try {
            const response = await apiRequest<SampleResponse>("/api/generate-sample", {
                method: "POST",
                body: JSON.stringify({
                    formula_name: formulaName,
                    formula_latex: formulaLatex,
                    difficulty: difficultyToUse
                })
            });

            if (response.success) {
                setSample({
                    steps: response.steps,
                    result: response.result
                });
            } else {
                setError(response.error || "Failed to generate sample");
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to generate sample");
        } finally {
            setLoading(false);
        }
    };

    const stepOptions = [
        { value: "easy", label: "2-3 steps", color: "green" },
        { value: "medium", label: "3-5 steps", color: "yellow" },
        { value: "hard", label: "5-7 steps", color: "red" }
    ];

    return (
        <div className="mt-3 font-mono">
            {/* Toggle Options Button */}
            <button
                onClick={() => setShowOptions(!showOptions)}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 border border-cyan-400/30 px-2 py-1 hover:bg-cyan-400/10 transition-colors"
            >
                <HiChartBar className="w-3 h-3" />
                [{showOptions ? "Hide Options" : "Generate AI Example"}]
            </button>

            {/* Step Selection Options */}
            {showOptions && !showSample && (
                <div className="mt-3 bg-[#1a1a2e] p-4 border-2 border-cyan-400/30">
                    <p className="text-xs text-gray-500 mb-3">// select_complexity:</p>
                    <div className="flex flex-wrap gap-2">
                        {stepOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    const newDifficulty = option.value as "easy" | "medium" | "hard";
                                    setSelectedDifficulty(newDifficulty);
                                    generateSample(newDifficulty);
                                }}
                                disabled={loading}
                                className={`px-3 py-2 text-xs border-2 transition-colors disabled:opacity-50 ${selectedDifficulty === option.value
                                    ? option.color === "green"
                                        ? "border-green-400 bg-green-400/10 text-green-400"
                                        : option.color === "yellow"
                                            ? "border-yellow-400 bg-yellow-400/10 text-yellow-400"
                                            : "border-red-400 bg-red-400/10 text-red-400"
                                    : "border-gray-600 text-gray-400 hover:border-cyan-400/50 hover:text-cyan-400"
                                    }`}
                            >
                                <HiBeaker className="w-3 h-3 inline mr-1" />
                                [{option.label}]
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Generated Sample Display */}
            {showSample && (
                <div className="mt-3 bg-[#1a1a2e] p-4 border-2 border-purple-400/30">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-purple-400">&gt; AI_Example</span>
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedDifficulty}
                                onChange={(e) => setSelectedDifficulty(e.target.value as "easy" | "medium" | "hard")}
                                className="text-xs bg-[#0d0d14] text-gray-300 border-2 border-gray-700 px-2 py-1 focus:outline-none focus:border-cyan-400"
                            >
                                {stepOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => generateSample()}
                                disabled={loading}
                                className="text-xs text-gray-400 hover:text-cyan-400 flex items-center gap-1 px-2 py-1 border border-gray-700 hover:border-cyan-400 disabled:opacity-50 transition-colors"
                            >
                                <HiRefresh className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                                [{loading ? "..." : "Regen"}]
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm mb-2 border-l-2 border-red-400 pl-2">// Error: {error}</div>
                    )}

                    {sample && (
                        <div className="space-y-2">
                            {sample.steps.map((step, i) => (
                                <div key={i} className="text-sm text-gray-300 border-l-2 border-gray-700 pl-3">
                                    <span className="text-gray-600 mr-2">{i + 1}.</span>
                                    <MathRenderer content={step} className="text-gray-200 inline" />
                                </div>
                            ))}

                            <div className="pt-3 mt-2 border-t-2 border-gray-700">
                                <span className="text-xs text-green-400 font-bold">// Answer: </span>
                                <MathRenderer content={sample.result} className="text-green-400 inline" />
                            </div>
                        </div>
                    )}

                    {!sample && !error && loading && (
                        <div className="text-cyan-400 text-sm flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                            &gt; generating_example...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
