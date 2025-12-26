"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { SubQuest } from "@/types";
import { MathRenderer } from "@/components/MathRenderer";
import { HiLightBulb, HiExclamation, HiSparkles, HiCheck, HiChevronLeft, HiChevronRight, HiPlay, HiChevronDown, HiChevronUp } from "react-icons/hi";
import { executeQuestCode, getQuestHint, generateTestCaseReasoning, saveQuestProgress, isAuthenticated, QuestStepProgress } from "@/lib/api";
import { MathSampleGenerator } from "@/components/MathSampleGenerator";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface SideQuestModalProps {
    quest: SubQuest;
    problemId: number;
    totalSteps: number;
    onClose: () => void;
    onPrevious: () => void;
    onNext: () => void;
    hasPrevious: boolean;
    hasNext: boolean;
    completedSteps?: QuestStepProgress[];
    onStepCompleted?: (step: number, code: string) => void;
}

export function SideQuestModal({
    quest,
    problemId,
    totalSteps,
    onClose,
    onPrevious,
    onNext,
    hasPrevious,
    hasNext,
    completedSteps = [],
    onStepCompleted,
}: SideQuestModalProps) {
    const [code, setCode] = useState(quest.exercise?.starter_code || "");
    const [testResults, setTestResults] = useState<("pass" | "fail" | "pending")[]>(
        quest.exercise?.test_cases?.map(() => "pending") || []
    );
    const [showHint, setShowHint] = useState(false);
    const [running, setRunning] = useState(false);
    const [output, setOutput] = useState<string | null>(null);
    const [apiResults, setApiResults] = useState<{ passed: boolean; actual?: string; expected?: string; error?: string }[]>([]);
    const [aiHint, setAiHint] = useState<string | null>(null);
    const [loadingAiHint, setLoadingAiHint] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);
    const [isCompleted, setIsCompleted] = useState(false);
    const [reasoningStates, setReasoningStates] = useState<{
        [key: number]: {
            loading: boolean;
            expanded: boolean;
            data: { input: string; process: string; output: string } | null;
        };
    }>({});


    const prevStepRef = useRef(quest.step);
    const savedProgress = completedSteps.find(p => p.step === quest.step);

    useEffect(() => {
        if (prevStepRef.current === quest.step) {
            return;
        }
        prevStepRef.current = quest.step;

        const saved = completedSteps.find(p => p.step === quest.step);
        if (saved) {
            setCode(saved.code);
            setIsCompleted(true);
        } else {
            setCode(quest.exercise?.starter_code || "");
            setIsCompleted(false);
        }
        setTestResults(quest.exercise?.test_cases?.map(() => "pending") || []);
        setOutput(null);
        setApiResults([]);
        setShowHint(false);
        setAiHint(null);
        setLastError(null);
    }, [quest.step, quest.exercise?.starter_code, quest.exercise?.test_cases, completedSteps]);

    const handleRunCode = async () => {
        if (!isAuthenticated()) {
            setOutput("⚠️ Please login to run code");
            return;
        }

        setRunning(true);
        setOutput(null);
        setApiResults([]);
        setAiHint(null);

        try {
            const result = await executeQuestCode(problemId, quest.step, code);

            const newApiResults = result.results.map(r => ({
                passed: r.passed,
                actual: r.actual,
                expected: r.expected,
                error: r.error
            }));
            setApiResults(newApiResults);

            const newResults = quest.exercise?.test_cases?.map((_, i) => {
                const testResult = result.results[i];
                return testResult?.passed ? "pass" : "fail";
            }) || [];
            setTestResults(newResults as ("pass" | "fail" | "pending")[]);

            if (result.success) {
                setOutput(`All tests passed! (${result.execution_time.toFixed(2)}s)`);
                setLastError(null);
                setIsCompleted(true);

                try {
                    await saveQuestProgress(problemId, quest.step, code);
                    onStepCompleted?.(quest.step, code);
                } catch (e) {
                    console.error("Failed to save progress:", e);
                }
            } else if (result.error) {
                setOutput(`❌ ${result.error}`);
                setLastError(result.error);
            } else {
                const failedCount = newResults.filter(r => r === "fail").length;
                setOutput(`❌ ${failedCount} test(s) failed (${result.execution_time.toFixed(2)}s)`);
                const errorDetails = result.results
                    .filter(r => !r.passed)
                    .map((r, i) => `Test ${i + 1}: Expected ${r.expected}, got ${r.actual}${r.error ? ` (${r.error})` : ''}`)
                    .join('\n');
                setLastError(errorDetails || "Tests failed");
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Execution failed";
            setOutput(`❌ ${errorMsg}`);
            setLastError(errorMsg);
            setTestResults(quest.exercise?.test_cases?.map(() => "fail") || []);
        } finally {
            setRunning(false);
        }
    };

    const handleGetAiHint = async () => {
        if (!lastError) return;

        setLoadingAiHint(true);
        try {
            const result = await getQuestHint(problemId, quest.step, code, lastError);
            setAiHint(result.hint || "Unable to generate hint at this time.");
        } catch (error) {
            setAiHint(`Failed to get hint: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setLoadingAiHint(false);
        }
    };

    const handleGenerateReasoning = async (testCaseIndex: number, testCase: { input: string; expected: string }) => {
        // Toggle if already has data
        if (reasoningStates[testCaseIndex]?.data) {
            setReasoningStates(prev => ({
                ...prev,
                [testCaseIndex]: {
                    ...prev[testCaseIndex],
                    expanded: !prev[testCaseIndex]?.expanded
                }
            }));
            return;
        }

        // Start loading
        setReasoningStates(prev => ({
            ...prev,
            [testCaseIndex]: { loading: true, expanded: true, data: null }
        }));

        try {
            const result = await generateTestCaseReasoning(
                problemId,
                quest.step,
                testCase.input,
                testCase.expected,
                quest.exercise?.function_signature || ""
            );
            setReasoningStates(prev => ({
                ...prev,
                [testCaseIndex]: {
                    loading: false,
                    expanded: true,
                    data: result
                }
            }));
        } catch (error) {
            setReasoningStates(prev => ({
                ...prev,
                [testCaseIndex]: {
                    loading: false,
                    expanded: true,
                    data: {
                        input: `Failed to generate: ${error instanceof Error ? error.message : "Unknown error"}`,
                        process: "",
                        output: ""
                    }
                }
            }));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/80"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-[#0d0d14] border-2 border-gray-700 w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header - Terminal Style */}
                <div className="flex items-center justify-between p-4 border-b-2 border-gray-700 bg-[#1a1a2e]">
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-10 h-10 border-2 font-bold ${isCompleted || savedProgress
                            ? "border-green-400 bg-green-400/10 text-green-400"
                            : "border-cyan-400 bg-cyan-400/10 text-cyan-400"
                            }`}>
                            {isCompleted || savedProgress ? (
                                <HiCheck className="w-5 h-5" />
                            ) : (
                                quest.step
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">
                                &gt; Step [{quest.step}/{totalSteps}]
                                {(isCompleted || savedProgress) && <span className="text-green-400 ml-2">COMPLETE</span>}
                            </p>
                            <h2 className="text-lg font-bold text-white">{quest.title}</h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 border-2 border-gray-600 text-gray-400 hover:text-white hover:border-red-400 transition-colors flex items-center justify-center"
                    >
                        ✕
                    </button>
                </div>

                {/* Progress bar - Terminal style */}
                <div className="h-1 bg-gray-800">
                    <div
                        className="h-full bg-cyan-400 transition-all"
                        style={{ width: `${(quest.step / totalSteps) * 100}%` }}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0d0d14]">
                    {/* Relation to Problem */}
                    <div className="border-l-2 border-cyan-400/50 pl-4">
                        <p className="text-sm text-gray-400 italic">// {quest.relation_to_problem}</p>
                    </div>

                    {/* Mathematical Definition */}
                    {quest.math_content?.definition && (
                        <div className="border-2 border-purple-400/30 bg-purple-400/5 p-5">
                            <h3 className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wide">&gt; Definition</h3>
                            <MathRenderer content={quest.math_content.definition} className="text-gray-200" />
                        </div>
                    )}

                    {/* Theorem */}
                    {quest.math_content?.theorem && (
                        <div className="border-2 border-purple-400/30 bg-purple-400/5 p-5">
                            <h3 className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wide">&gt; Theorem</h3>
                            <MathRenderer content={quest.math_content.theorem} className="text-gray-200" />
                        </div>
                    )}

                    {/* Key Formulas */}
                    {quest.key_formulas && quest.key_formulas.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-cyan-400 mb-3 uppercase tracking-wide">&gt; Key Formulas</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {quest.key_formulas.map((formula, i) => (
                                    <div key={i} className="border-2 border-cyan-400/30 bg-[#1a1a2e] p-4">
                                        <p className="text-sm font-bold text-cyan-400 mb-1">[{formula.name}]</p>
                                        <MathRenderer content={formula.latex} className="text-gray-200" />
                                        <p className="text-xs text-gray-500 mt-2">// <MathRenderer content={formula.description} className="inline" inline={true} /></p>
                                        <MathSampleGenerator key={`${quest.step}-${formula.name}`} formulaName={formula.name} formulaLatex={formula.latex} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Practice Exercise */}
                    {quest.exercise && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wide">&gt; Practice Exercise</h3>

                            {/* Exercise description */}
                            <div className="border-2 border-yellow-400/30 bg-yellow-400/5 p-4">
                                <MathRenderer content={quest.exercise.description} className="text-yellow-200 text-sm" />
                            </div>

                            {/* Function signature */}
                            <div className="bg-[#1a1a2e] border-2 border-gray-700 p-3">
                                <code className="text-sm text-purple-400">{quest.exercise.function_signature}</code>
                            </div>

                            {/* Mini Code Editor */}
                            <div className="border-2 border-gray-700 overflow-hidden">
                                <div className="bg-[#1a1a2e] px-4 py-2 flex items-center justify-between border-b-2 border-gray-700">
                                    <span className="text-xs text-cyan-400">&gt; python3</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowHint(!showHint)}
                                            className="px-3 py-1 text-xs border-2 border-gray-600 text-gray-300 hover:border-cyan-400 hover:text-cyan-400 transition-colors"
                                        >
                                            [{showHint ? "Hide Hint" : "Show Hint"}]
                                        </button>
                                        <button
                                            onClick={handleRunCode}
                                            disabled={running}
                                            className="flex items-center gap-1 px-4 py-1 text-xs border-2 border-cyan-400 bg-cyan-400 text-black font-bold hover:bg-cyan-300 disabled:opacity-50 transition-colors"
                                        >
                                            {running ? (
                                                <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <HiPlay className="w-3 h-3" />
                                            )}
                                            [Run]
                                        </button>
                                    </div>
                                </div>
                                <Editor
                                    height="200px"
                                    language="python"
                                    theme="vs-dark"
                                    value={code}
                                    onChange={(v) => setCode(v || "")}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 13,
                                        lineNumbers: "on",
                                        scrollBeyondLastLine: false,
                                    }}
                                />
                            </div>

                            {/* Output */}
                            {output && (
                                <div className="space-y-2">
                                    <div className={`border-2 p-3 text-sm flex items-center gap-2 ${output.includes("All tests passed")
                                        ? "border-green-400/50 bg-green-400/5 text-green-400"
                                        : output.includes("⚠️")
                                            ? "border-yellow-400/50 bg-yellow-400/5 text-yellow-400"
                                            : "border-red-400/50 bg-red-400/5 text-red-400"
                                        }`}>
                                        {output.includes("All tests passed") && <HiCheck className="w-5 h-5 flex-shrink-0" />}
                                        {output}
                                    </div>

                                    {/* AI Hint Button */}
                                    {lastError && (
                                        <button
                                            onClick={handleGetAiHint}
                                            disabled={loadingAiHint}
                                            className="flex items-center gap-2 px-3 py-2 text-sm border-2 border-purple-400/50 text-purple-400 hover:bg-purple-400/10 disabled:opacity-50 transition-colors"
                                        >
                                            <HiSparkles className="w-4 h-4" />
                                            [{loadingAiHint ? "Getting AI Hint..." : "Get AI Hint"}]
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* AI Hint Display */}
                            {aiHint && (
                                <div className="border-2 border-purple-400/30 bg-purple-400/5 p-4 flex items-start gap-2">
                                    <HiSparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-purple-400 text-sm font-bold mb-1">&gt; AI Hint</p>
                                        <p className="text-purple-300 text-sm">{aiHint}</p>
                                    </div>
                                </div>
                            )}

                            {/* Hint */}
                            {showHint && quest.hint && (
                                <div className="border-2 border-cyan-400/30 bg-cyan-400/5 p-4 flex items-start gap-2">
                                    <HiLightBulb className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-cyan-300 text-sm">// {quest.hint}</p>
                                </div>
                            )}

                            {/* Test Cases */}
                            {quest.exercise.test_cases && quest.exercise.test_cases.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase">&gt; Test Cases</h4>
                                    {quest.exercise.test_cases.map((tc, i) => {
                                        const hasResult = apiResults[i] !== undefined;
                                        const isPassed = hasResult ? apiResults[i].passed : testResults[i] === "pass";
                                        const status = hasResult ? (isPassed ? "pass" : "fail") : testResults[i];

                                        return (
                                            <div key={i} className={`bg-[#1a1a2e] border-2 p-3 flex items-start gap-3 ${status === "pass"
                                                ? "border-green-400/30"
                                                : status === "fail"
                                                    ? "border-red-400/30"
                                                    : "border-gray-700"
                                                }`}>
                                                <div className={`w-6 h-6 border-2 flex items-center justify-center text-xs font-bold ${status === "pass"
                                                    ? "border-green-400 text-green-400"
                                                    : status === "fail"
                                                        ? "border-red-400 text-red-400"
                                                        : "border-gray-600 text-gray-500"
                                                    }`}>
                                                    {status === "pass" ? "✓" : status === "fail" ? "✗" : "○"}
                                                </div>
                                                <div className="flex-1 text-sm">
                                                    <code className="text-cyan-400">{tc.input}</code>
                                                    <div className="mt-1 space-y-0.5">
                                                        <p className="text-gray-500 text-xs">// Expected: <span className="text-green-400">{tc.expected}</span></p>
                                                        {apiResults[i] && (
                                                            <p className="text-gray-500 text-xs">
                                                                // Actual: <span className={apiResults[i].passed ? "text-green-400" : "text-red-400"}>
                                                                    {apiResults[i].actual || "None"}
                                                                </span>
                                                            </p>
                                                        )}
                                                        {apiResults[i]?.error && (
                                                            <p className="text-red-400 text-xs">// Error: {apiResults[i].error}</p>
                                                        )}
                                                    </div>
                                                    {/* Generate Reasoning Button */}
                                                    <button
                                                        onClick={() => handleGenerateReasoning(i, tc)}
                                                        className="mt-2 flex items-center gap-1 px-2 py-1 text-xs border border-purple-400/50 text-purple-400 hover:bg-purple-400/10 transition-colors"
                                                    >
                                                        <HiSparkles className="w-3 h-3" />
                                                        {reasoningStates[i]?.loading ? "Generating..." : reasoningStates[i]?.expanded ? "Hide Reasoning" : "Generate Reasoning"}
                                                        {reasoningStates[i]?.data && (
                                                            reasoningStates[i]?.expanded ? <HiChevronUp className="w-3 h-3" /> : <HiChevronDown className="w-3 h-3" />
                                                        )}
                                                    </button>
                                                    {/* Reasoning Panel */}
                                                    {reasoningStates[i]?.expanded && reasoningStates[i]?.data && (
                                                        <div className="mt-3 space-y-2 border-l-2 border-purple-400/30 pl-3">
                                                            {/* Input Section */}
                                                            <div className="bg-[#0d0d14] p-2 border border-blue-400/30">
                                                                <p className="text-xs font-bold text-blue-400 mb-1 flex items-center gap-1">
                                                                    <span className="text-blue-400">▸</span> INPUT
                                                                </p>
                                                                <MathRenderer content={reasoningStates[i].data.input} className="text-xs text-gray-300" />
                                                            </div>
                                                            {/* Process Section */}
                                                            <div className="bg-[#0d0d14] p-2 border border-yellow-400/30">
                                                                <p className="text-xs font-bold text-yellow-400 mb-1 flex items-center gap-1">
                                                                    <span className="text-yellow-400">▸</span> PROCESS
                                                                </p>
                                                                <MathRenderer content={reasoningStates[i].data.process} className="text-xs text-gray-300" />
                                                            </div>
                                                            {/* Output Section */}
                                                            <div className="bg-[#0d0d14] p-2 border border-green-400/30">
                                                                <p className="text-xs font-bold text-green-400 mb-1 flex items-center gap-1">
                                                                    <span className="text-green-400">▸</span> OUTPUT
                                                                </p>
                                                                <MathRenderer content={reasoningStates[i].data.output} className="text-xs text-gray-300" />
                                                            </div>
                                                        </div>
                                                    )}
                                                    {/* Loading state */}
                                                    {reasoningStates[i]?.loading && (
                                                        <div className="mt-3 flex items-center gap-2 text-purple-400 text-xs">
                                                            <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                                                            Analyzing test case...
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Common Mistakes */}
                    {quest.common_mistakes && quest.common_mistakes.length > 0 && (
                        <div className="border-2 border-red-400/30 bg-red-400/5 p-4">
                            <h4 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
                                <HiExclamation className="w-5 h-5" />
                                [Common Mistakes]
                            </h4>
                            <ul className="list-none text-sm text-red-300 space-y-1">
                                {quest.common_mistakes.map((m, i) => (
                                    <li key={i}>// {m}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Footer with navigation */}
                <div className="flex items-center justify-between p-4 border-t-2 border-gray-700 bg-[#1a1a2e]">
                    <button
                        onClick={onPrevious}
                        disabled={!hasPrevious}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-gray-600 text-gray-300 hover:border-cyan-400 hover:text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <HiChevronLeft className="w-4 h-4" />
                        [Previous]
                    </button>

                    <button className="px-6 py-2 border-2 border-green-400 bg-green-400 text-black font-bold hover:bg-green-300 transition-colors">
                        [Mark Complete]
                    </button>

                    <button
                        onClick={onNext}
                        disabled={!hasNext}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-gray-600 text-gray-300 hover:border-cyan-400 hover:text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        [Next]
                        <HiChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
