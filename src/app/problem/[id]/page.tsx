"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Problem, Quest } from "@/types";
import { getDifficultyColor, hasQuest } from "@/lib/data";
import { saveCode, getSavedCode, markProblemComplete } from "@/lib/progress";
import { MathRenderer } from "@/components/MathRenderer";
import { SideQuestModal } from "@/components/SideQuestModal";
import PlaygroundViewer from "@/components/PlaygroundViewer";
import { ReasoningPanel } from "@/components/ReasoningPanel";
import { TestResultsPanel } from "@/components/TestResultsPanel";
import { HiBookOpen, HiLightBulb, HiExclamationCircle, HiClock, HiTrash, HiChevronLeft, HiPlay, HiRefresh, HiSave, HiSparkles } from "react-icons/hi";
import { executeCode, isAuthenticated, TestResult, getHint, getSubmissions, SubmissionRecord, saveSubmission, deleteSubmission, getSolution } from "@/lib/api";
import { getEditorSettings, getMonacoTheme, EditorSettings, defineMonacoThemes } from "@/lib/settings";

// Dynamically import Monaco to avoid SSR issues
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export default function ProblemPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const problemId = parseInt(id);

    const [problem, setProblem] = useState<Problem | null>(null);
    const [quest, setQuest] = useState<Quest | null>(null);
    const [code, setCode] = useState("");
    const [output, setOutput] = useState<string[]>([]);
    const [running, setRunning] = useState(false);
    const [sideQuestsOpen, setSideQuestsOpen] = useState(false);
    const [activeStep, setActiveStep] = useState(1);
    const [activeTab, setActiveTab] = useState<"problem" | "solution" | "playground">("problem");
    const [showQuestModal, setShowQuestModal] = useState(false);
    const [learnOpen, setLearnOpen] = useState(false);
    const [hint, setHint] = useState<string | null>(null);
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [lastError, setLastError] = useState<string | null>(null);
    const [loadingHint, setLoadingHint] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
    const [editorSettings, setEditorSettings] = useState<EditorSettings | null>(null);
    const [questProgress, setQuestProgress] = useState<{ step: number; code: string; completed: boolean; created_at: string }[]>([]);
    const [problemSolved, setProblemSolved] = useState(false);
    const [solution, setSolution] = useState<string | null>(null);
    const [loadingSolution, setLoadingSolution] = useState(false);
    const [showPlaygroundModal, setShowPlaygroundModal] = useState(false);
    const [showReasoningModal, setShowReasoningModal] = useState(false);

    // Load editor settings
    useEffect(() => {
        setEditorSettings(getEditorSettings());
    }, []);

    useEffect(() => {
        async function load() {
            // Load problem from backend API
            try {
                const { getProblem } = await import("@/lib/api");
                const p = await getProblem(problemId);
                setProblem({ ...p, id: problemId });

                // Load saved code or use starter code
                const saved = getSavedCode(problemId);
                setCode(saved || p.starter_code || "");
            } catch (error) {
                console.error("Failed to load problem:", error);
            }

            // Load quest from API
            try {
                const { getQuest, getQuestProgress } = await import("@/lib/api");
                const response = await getQuest(problemId) as any;
                // Handle new API format: {quest: {...}, source: "..."}
                const questData = response.quest || response;
                if (questData && questData.sub_quests) {
                    setQuest({ ...questData, id: response.problem_id || problemId } as Quest);
                }

                try {
                    const progressData = await getQuestProgress(problemId);
                    setQuestProgress(progressData.progress);
                } catch {
                    // Not logged in or no progress - that's OK
                }
            } catch {
                // Quest not found - that's OK
            }
        }
        load();
    }, [problemId]);

    const fetchSolution = async () => {
        setLoadingSolution(true);
        try {
            const result = await getSolution(problemId);
            setSolution(result.solution);
        } catch (error) {
            console.error("Failed to fetch solution:", error);
            setSolution("// Failed to generate solution. Please try again later.");
        } finally {
            setLoadingSolution(false);
        }
    };

    const handleRunCode = async () => {
        if (!isAuthenticated()) {
            setOutput(["⚠️ Please login to run code"]);
            setHint("You need to be logged in to execute code. Click 'Login' in the navbar.");
            return;
        }

        setRunning(true);
        setOutput(["Running code..."]);
        setHint(null);
        setTestResults([]);

        try {
            const result = await executeCode(problemId, code);

            const outputLines: string[] = [];
            result.results.forEach((tr) => {
                if (tr.passed) {
                    outputLines.push(`✓ Test ${tr.test_number}: Passed`);
                } else {
                    outputLines.push(`✗ Test ${tr.test_number}: Failed`);
                    if (tr.expected && tr.actual) {
                        outputLines.push(`  Expected: ${tr.expected}`);
                        outputLines.push(`  Got: ${tr.actual}`);
                    }
                    if (tr.error) {
                        outputLines.push(`  Error: ${tr.error}`);
                    }
                }
            });

            if (result.error) {
                outputLines.push("");
                // Parse and format the error nicely
                const errorText = result.error;
                if (errorText.includes("SyntaxError")) {
                    outputLines.push("⚠ Syntax Error detected:");
                    // Extract just the relevant syntax error line
                    const lines = errorText.split("\n");
                    lines.forEach(line => {
                        if (line.trim() && !line.includes("Traceback") && !line.includes("File \"/app")) {
                            if (line.includes("SyntaxError:") || line.includes("line ") || line.includes("^") || line.includes("return") || line.includes("def ") || line.includes("if ") || line.includes("for ")) {
                                outputLines.push(line.trim());
                            }
                        }
                    });
                } else {
                    outputLines.push(`Error: ${errorText}`);
                }
                setLastError(errorText);
            }

            if (result.success) {
                outputLines.push("");
                outputLines.push("All tests passed!");
                markProblemComplete(problemId);
                setLastError(null);
                setProblemSolved(true);

                // Save the successful submission to database
                try {
                    await saveSubmission(problemId, code, true);
                } catch (e) {
                    console.error("Failed to save submission:", e);
                }

                // Fetch the AI-generated solution
                fetchSolution();
            } else if (!result.error && result.results.length > 0) {
                // Only try to get error from results if there are results
                const failedTest = result.results.find(r => !r.passed);
                if (failedTest) {
                    const errorMsg = failedTest.error ||
                        `Test failed: Expected ${failedTest.expected}, Got ${failedTest.actual}`;
                    setLastError(errorMsg);
                }
            }

            outputLines.push("");
            outputLines.push(`Execution time: ${result.execution_time.toFixed(3)}s`);

            setOutput(outputLines);
            setTestResults(result.results || []);
            setHint(null);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Unknown error";
            setOutput([
                "❌ Execution failed",
                errorMsg
            ]);
            setLastError(errorMsg);
        } finally {
            setRunning(false);
        }
    };

    const handleExplainError = async () => {
        if (!lastError || !isAuthenticated()) return;

        setLoadingHint(true);
        try {
            const response = await getHint(problemId, code, lastError);
            if (response.hint) {
                setHint(response.hint);
            } else {
                setHint("Unable to generate hint at this time.");
            }
        } catch (error) {
            setHint("Failed to get hint. Please try again.");
        } finally {
            setLoadingHint(false);
        }
    };

    const handleSaveCode = async () => {
        saveCode(problemId, code);

        if (isAuthenticated()) {
            try {
                const allPassed = testResults.length > 0 && testResults.every(r => r.passed);
                await saveSubmission(problemId, code, allPassed);

                if (allPassed) {
                    markProblemComplete(problemId);
                }
            } catch (error) {
                console.error("Failed to save submission:", error);
            }
        }
    };

    const handleReset = () => {
        if (problem) {
            setCode(problem.starter_code || "");
            setOutput([]);
        }
    };

    const loadHistory = async () => {
        if (!isAuthenticated()) return;
        try {
            const history = await getSubmissions(problemId);
            // Ensure we have an array (API might return { submissions: [] } or [])
            const submissionsArray = Array.isArray(history) ? history : (history as any)?.submissions || [];
            setSubmissions(submissionsArray);
            setShowHistory(true);
        } catch (error) {
            console.error("Failed to load history:", error);
        }
    };

    const loadSubmission = (submission: SubmissionRecord) => {
        setCode(submission.code);
        setShowHistory(false);
        setOutput([`Loaded submission from ${new Date(submission.created_at).toLocaleString()}`]);
    };

    const handleDeleteSubmission = async (submissionId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await deleteSubmission(submissionId);
            setSubmissions(submissions.filter(s => s.id !== submissionId));
        } catch (error) {
            console.error("Failed to delete submission:", error);
        }
    };

    const getDescription = () => {
        if (!problem) return "";
        return problem.description_decoded || problem.description || "";
    };

    const getLearnContent = () => {
        if (!problem) return "";
        return problem.learn_section_decoded || problem.learn_section || problem.learn || "";
    };

    const getDifficultyStyle = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'border-green-400/50 text-green-400';
            case 'medium': return 'border-yellow-400/50 text-yellow-400';
            case 'hard': return 'border-red-400/50 text-red-400';
            default: return 'border-gray-400/50 text-gray-400';
        }
    };

    if (!problem) {
        return (
            <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
                <div className="text-cyan-400 font-mono animate-pulse">&gt; Loading problem...</div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#0d0d14] text-white flex flex-col overflow-hidden font-mono">
            {/* Top Bar - Terminal Style */}
            <header className="border-b-2 border-gray-800 bg-[#0a0a0f] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/problems" className="text-gray-500 hover:text-cyan-400 transition-colors">
                        <HiChevronLeft className="w-5 h-5" />
                    </Link>
                    <span className="text-gray-500">[Problems]</span>
                    <span className="text-gray-600">/</span>
                    <span className="text-gray-400">#{problemId}</span>
                    <span className="text-white font-bold truncate max-w-md">{problem.title}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRunCode}
                        disabled={running}
                        className="flex items-center gap-2 px-5 py-2 border-2 border-cyan-400 bg-cyan-400 text-black font-bold hover:bg-cyan-300 transition-colors disabled:opacity-50"
                    >
                        {running ? (
                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <HiPlay className="w-4 h-4" />
                        )}
                        [Run]
                    </button>
                </div>
            </header>

            {/* Main Content - Split View */}
            <div className="flex-1 flex min-h-0 relative">
                {/* Left Panel - Problem Description */}
                <div className="w-2/5 flex-shrink-0 border-r-2 border-gray-800 flex flex-col overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b-2 border-gray-800 bg-[#0a0a0f]">
                        <button
                            onClick={() => setActiveTab("problem")}
                            className={`px-4 py-3 text-sm font-bold transition-colors ${activeTab === "problem"
                                ? "text-cyan-400 border-b-2 border-cyan-400 -mb-[2px]"
                                : "text-gray-500 hover:text-gray-300"
                                }`}
                        >
                            [Problem]
                        </button>
                        <button
                            onClick={() => setActiveTab("solution")}
                            className={`px-4 py-3 text-sm font-bold flex items-center gap-1 transition-colors ${activeTab === "solution"
                                ? problemSolved ? "text-green-400 border-b-2 border-green-400 -mb-[2px]" : "text-cyan-400 border-b-2 border-cyan-400 -mb-[2px]"
                                : problemSolved ? "text-green-400/60 hover:text-green-400" : "text-gray-500 hover:text-gray-300"
                                }`}
                        >
                            [Solution] {problemSolved ? "✓" : "🔒"}
                        </button>
                        {problem.playground_enabled && (
                            <button
                                onClick={() => setShowPlaygroundModal(true)}
                                className="px-4 py-3 text-sm font-bold flex items-center gap-1 transition-colors text-purple-400 hover:text-purple-300 hover:bg-purple-400/10"
                            >
                                [Playground] ▶
                            </button>
                        )}
                        {quest && (
                            <button
                                onClick={() => setShowReasoningModal(true)}
                                className="px-4 py-3 text-sm font-bold flex items-center gap-1 transition-colors text-purple-400 hover:text-purple-300 hover:bg-purple-400/10"
                            >
                                <HiSparkles className="w-4 h-4" />
                                [Reasoning]
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 bg-[#0d0d14]/50">
                        {activeTab === "problem" && (
                            <div className="space-y-6">
                                {/* Title & Badges */}
                                <div>
                                    <h1 className="text-2xl font-bold mb-3">
                                        <span className="text-gray-500">&gt; </span>
                                        {problem.title}
                                        <span className="text-cyan-400 animate-pulse">_</span>
                                    </h1>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`px-2 py-1 text-xs font-bold uppercase border ${getDifficultyStyle(problem.difficulty)}`}>
                                            {problem.difficulty}
                                        </span>
                                        <span className="px-2 py-1 text-xs font-bold text-purple-400 border border-purple-400/50">
                                            {problem.category}
                                        </span>
                                        {quest && (
                                            <span className="px-2 py-1 text-xs font-bold text-yellow-400 border border-yellow-400/50 flex items-center gap-1">
                                                ★ Quest
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="text-gray-300 leading-relaxed">
                                    <p>{getDescription()}</p>
                                </div>

                                {/* Example */}
                                {problem.example && (
                                    <div className="space-y-3">
                                        <h3 className="font-bold text-green-400">&gt; Example:</h3>
                                        <div className="border-2 border-gray-700 bg-[#1a1a2e] p-4 space-y-3">
                                            <div>
                                                <span className="text-gray-500 text-sm">// Input:</span>
                                                <pre className="text-cyan-400 mt-1 text-sm">{problem.example.input}</pre>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 text-sm">// Output:</span>
                                                <pre className="text-green-400 mt-1 text-sm">{problem.example.output}</pre>
                                            </div>
                                            {problem.example.reasoning && (
                                                <div>
                                                    <span className="text-gray-500 text-sm">// Reasoning:</span>
                                                    <p className="text-gray-300 mt-1 text-sm">{problem.example.reasoning}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Learn the Math - Collapsible */}
                                {getLearnContent() && (
                                    <div className="border-2 border-purple-400/30 overflow-hidden">
                                        <button
                                            onClick={() => setLearnOpen(!learnOpen)}
                                            className="w-full flex items-center justify-between p-4 bg-purple-400/5 hover:bg-purple-400/10 transition-colors"
                                        >
                                            <span className="flex items-center gap-2 font-bold text-purple-400">
                                                <HiBookOpen className="w-5 h-5" />
                                                [Learn the Math]
                                            </span>
                                            <span className={`text-purple-400 transition-transform ${learnOpen ? "rotate-180" : ""}`}>▼</span>
                                        </button>

                                        {learnOpen && (
                                            <div className="p-4 border-t-2 border-purple-400/30 bg-[#1a1a2e]/50">
                                                <MathRenderer content={getLearnContent()} className="text-gray-300 text-sm" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Side Quests Section */}
                                {quest && quest.sub_quests && (
                                    <div className="border-2 border-yellow-400/30 overflow-hidden">
                                        <button
                                            onClick={() => setSideQuestsOpen(!sideQuestsOpen)}
                                            className="w-full flex items-center justify-between p-4 bg-yellow-400/5 hover:bg-yellow-400/10 transition-colors"
                                        >
                                            <span className="flex items-center gap-2 font-bold text-yellow-400">
                                                <HiLightBulb className="w-5 h-5" />
                                                [Side Quests - Learning Path]
                                            </span>
                                            <span className={`text-yellow-400 transition-transform ${sideQuestsOpen ? "rotate-180" : ""}`}>▼</span>
                                        </button>

                                        {sideQuestsOpen && (
                                            <div className="p-4 border-t-2 border-yellow-400/30 bg-[#1a1a2e]/50">
                                                {/* Step buttons */}
                                                <div className="flex gap-2 mb-4 flex-wrap">
                                                    {quest.sub_quests.map((sq) => {
                                                        const isStepCompleted = questProgress.some(p => p.step === sq.step && p.completed);
                                                        return (
                                                            <button
                                                                key={sq.step}
                                                                onClick={() => {
                                                                    setActiveStep(sq.step);
                                                                    setShowQuestModal(true);
                                                                }}
                                                                className={`w-10 h-10 border-2 font-bold transition-colors ${isStepCompleted
                                                                    ? "border-green-400 bg-green-400/10 text-green-400"
                                                                    : activeStep === sq.step
                                                                        ? "border-cyan-400 bg-cyan-400/10 text-cyan-400"
                                                                        : "border-gray-600 text-gray-400 hover:border-gray-500"
                                                                    }`}
                                                            >
                                                                {isStepCompleted ? "✓" : sq.step}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                <button
                                                    onClick={() => setShowQuestModal(true)}
                                                    className="w-full py-3 border-2 border-yellow-400 bg-yellow-400/10 hover:bg-yellow-400 hover:text-black font-bold text-yellow-400 transition-all"
                                                >
                                                    [Open Step {activeStep}] {quest.sub_quests.find(sq => sq.step === activeStep)?.title}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "solution" && (
                            problemSolved ? (
                                loadingSolution ? (
                                    <div className="text-center py-20">
                                        <div className="w-8 h-8 mx-auto border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
                                        <p className="text-cyan-400">&gt; Generating AI solution...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-green-400">✓</span>
                                            <span className="text-green-400 font-bold">Solution Unlocked!</span>
                                        </div>
                                        <div className="border-2 border-green-400/30 bg-[#1a1a2e] p-4">
                                            <p className="text-xs text-gray-500 mb-2">// AI-Generated Reference Solution:</p>
                                            <pre className="text-sm text-gray-200 whitespace-pre-wrap font-mono overflow-x-auto">{solution || "// Solution not available"}</pre>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-20">
                                    <div className="w-16 h-16 mx-auto border-2 border-gray-600 flex items-center justify-center text-gray-600 text-2xl mb-4">
                                        🔒
                                    </div>
                                    <p className="text-gray-500">// Solve the problem to unlock</p>
                                </div>
                            )
                        )}

                    </div>
                </div>

                {/* Right Panel - Code Editor */}
                <div className="w-3/5 flex flex-col h-full overflow-hidden">
                    {/* Editor Header */}
                    <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-[#1a1a2e] border-b-2 border-gray-800">
                        <span className="text-sm text-cyan-400">&gt; python3</span>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <button
                                    onClick={loadHistory}
                                    className="flex items-center gap-1 px-3 py-1 text-sm text-gray-400 hover:text-cyan-400 transition-colors border border-gray-700 hover:border-cyan-400/50"
                                >
                                    <HiClock className="w-4 h-4" />
                                    [History]
                                </button>
                                {/* History Dropdown */}
                                {showHistory && (
                                    <div className="absolute right-0 top-full mt-1 w-72 bg-[#1a1a2e] border-2 border-gray-700 shadow-xl z-50 max-h-72 overflow-y-auto">
                                        <div className="p-2.5 border-b-2 border-gray-700 flex items-center justify-between">
                                            <span className="text-sm text-cyan-400 font-bold">&gt; Submissions</span>
                                            <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-white">✕</button>
                                        </div>
                                        {submissions.length === 0 ? (
                                            <p className="p-4 text-sm text-gray-500 text-center">// No submissions yet</p>
                                        ) : (
                                            <div className="divide-y divide-gray-700">
                                                {submissions.map((sub) => (
                                                    <div
                                                        key={sub.id}
                                                        className={`p-3 hover:bg-white/5 transition-colors flex items-start gap-3 border-l-2 ${!sub.passed ? "border-red-500" : "border-green-500"}`}
                                                    >
                                                        <button
                                                            onClick={() => loadSubmission(sub)}
                                                            className="flex-1 text-left min-w-0"
                                                        >
                                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                                <span className={`text-xs px-2 py-0.5 font-bold border ${sub.passed ? "border-green-400/50 text-green-400" : "border-red-400/50 text-red-400"}`}>
                                                                    {sub.passed ? "PASS" : "FAIL"}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    {new Date(sub.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-400 truncate">
                                                                {sub.code.split('\n').find(l => l.trim().startsWith('def ') || l.trim()) || 'No code'}
                                                            </p>
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteSubmission(sub.id, e)}
                                                            className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <HiTrash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-400 hover:text-yellow-400 transition-colors border border-gray-700 hover:border-yellow-400/50"
                            >
                                <HiRefresh className="w-4 h-4" />
                                [Reset]
                            </button>
                            <button
                                onClick={handleSaveCode}
                                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-400 hover:text-green-400 transition-colors border border-gray-700 hover:border-green-400/50"
                            >
                                <HiSave className="w-4 h-4" />
                                [Save]
                            </button>
                        </div>
                    </div>

                    {/* Monaco Editor */}
                    <div className="flex-1 min-h-0">
                        <Editor
                            height="100%"
                            language="python"
                            theme={editorSettings ? getMonacoTheme(editorSettings.editorTheme) : "vs-dark"}
                            value={code}
                            onChange={(value) => setCode(value || "")}
                            beforeMount={(monaco) => {
                                defineMonacoThemes(monaco);
                            }}
                            options={{
                                minimap: { enabled: false },
                                fontSize: editorSettings?.fontSize || 14,
                                fontFamily: editorSettings?.codeFont || "JetBrains Mono",
                                lineNumbers: editorSettings?.lineNumbers ? "on" : "off",
                                tabSize: editorSettings?.tabSize || 4,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                            }}
                        />
                    </div>

                    {/* Output Panel */}
                    <div className="flex-shrink-0 min-h-[240px] max-h-[320px] bg-[#0a0a0f] border-t-2 border-gray-800 p-4 overflow-y-auto">
                        {/* AI Hint */}
                        {hint && (
                            <div className="mb-3 p-3 border-2 border-cyan-400/30 bg-cyan-400/5">
                                <div className="flex items-start gap-2">
                                    <HiLightBulb className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-300">{hint}</p>
                                    </div>
                                    <button
                                        onClick={() => setHint(null)}
                                        className="text-gray-500 hover:text-white transition-colors"
                                        title="Close hint"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm text-gray-500">&gt; Output</p>
                            {/* Explain Error Button */}
                            {lastError && !hint && (
                                <button
                                    onClick={handleExplainError}
                                    disabled={loadingHint}
                                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold border-2 border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10 transition-colors disabled:opacity-50"
                                >
                                    {loadingHint ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                            <span>Getting hint...</span>
                                        </>
                                    ) : (
                                        <>
                                            <HiLightBulb className="w-3.5 h-3.5" />
                                            <span>[Explain Error]</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Test Results Panel */}
                        <TestResultsPanel results={testResults} isRunning={running} />
                    </div>
                </div>
            </div>

            {/* Side Quest Modal */}
            {showQuestModal && quest && quest.sub_quests && (
                <SideQuestModal
                    quest={quest.sub_quests.find(sq => sq.step === activeStep)!}
                    problemId={problemId}
                    totalSteps={quest.sub_quests.length}
                    onClose={() => setShowQuestModal(false)}
                    onPrevious={() => {
                        const prevStep = activeStep - 1;
                        if (prevStep >= 1) setActiveStep(prevStep);
                    }}
                    onNext={() => {
                        const nextStep = activeStep + 1;
                        if (nextStep <= quest.sub_quests.length) setActiveStep(nextStep);
                    }}
                    hasPrevious={activeStep > 1}
                    hasNext={activeStep < quest.sub_quests.length}
                    completedSteps={questProgress}
                    onStepCompleted={(step, code) => {
                        setQuestProgress(prev => {
                            const existing = prev.find(p => p.step === step);
                            if (existing) {
                                return prev.map(p => p.step === step ? { ...p, code, completed: true } : p);
                            }
                            return [...prev, { step, code, completed: true, created_at: new Date().toISOString() }];
                        });
                    }}
                />
            )}

            {/* Fullscreen Playground Modal */}
            {showPlaygroundModal && problem?.playground_enabled && problem?.playground_code && (
                <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-700 bg-[#0d0d14]">
                        <div className="flex items-center gap-3">
                            <span className="text-purple-400 text-xl">▶</span>
                            <div>
                                <h2 className="text-lg font-bold text-purple-400">[Playground] {problem.title}</h2>
                                <p className="text-sm text-gray-500">// Interactive algorithm visualization</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowPlaygroundModal(false)}
                            className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white border-2 border-gray-700 hover:border-cyan-400 transition-colors"
                        >
                            [ESC] Close
                        </button>
                    </div>

                    {/* Modal Content */}
                    <div className="flex-1 overflow-auto p-4">
                        <PlaygroundViewer
                            code={problem.playground_code}
                            title={problem.title}
                            settings={{ editorHeight: 700, showEditor: false }}
                        />
                    </div>
                </div>
            )}

            {/* Fullscreen Reasoning Modal */}
            {showReasoningModal && quest && (
                <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b-2 border-gray-700 bg-[#0d0d14]">
                        <div className="flex items-center gap-3">
                            <HiSparkles className="text-purple-400 text-xl" />
                            <div>
                                <h2 className="text-lg font-bold text-purple-400">[Reasoning] {problem?.title}</h2>
                                <p className="text-sm text-gray-500">// Step-by-step mathematical solution path</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowReasoningModal(false)}
                            className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white border-2 border-gray-700 hover:border-purple-400 transition-colors"
                        >
                            [ESC] Close
                        </button>
                    </div>

                    {/* Modal Content */}
                    <div className="flex-1 overflow-auto p-6">
                        <ReasoningPanel
                            problemId={problemId}
                            totalSteps={quest.sub_quests?.length || 0}
                            problemName={problem?.title}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
