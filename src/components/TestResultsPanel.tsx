"use client";

import { useState } from "react";
import { HiCheck, HiX, HiChevronUp, HiChevronDown } from "react-icons/hi";

export interface TestResult {
    test_number: number;
    passed: boolean;
    input?: string;
    expected?: string;
    actual?: string;
    error?: string;
    name?: string;
    execution_time?: number;
}

interface TestResultsPanelProps {
    results: TestResult[];
    isRunning?: boolean;
}

export function TestResultsPanel({ results, isRunning }: TestResultsPanelProps) {
    // Auto-expand failed tests
    const [expandedTests, setExpandedTests] = useState<Set<number>>(() => {
        const failedTests = new Set<number>();
        results.filter(r => !r.passed).forEach(r => failedTests.add(r.test_number));
        return failedTests;
    });
    const [collapsed, setCollapsed] = useState(false);

    const passedCount = results.filter(r => r.passed).length;
    const allPassed = results.length > 0 && passedCount === results.length;

    const toggleTest = (testNum: number) => {
        const newExpanded = new Set(expandedTests);
        if (newExpanded.has(testNum)) {
            newExpanded.delete(testNum);
        } else {
            newExpanded.add(testNum);
        }
        setExpandedTests(newExpanded);
    };

    if (results.length === 0 && !isRunning) {
        return (
            <div className="text-sm text-gray-500 font-mono">
                // Run your code to see test results
            </div>
        );
    }

    if (isRunning) {
        return (
            <div className="flex items-center gap-2 text-sm text-cyan-400 font-mono">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-400 border-t-transparent" />
                &gt; Running tests...
            </div>
        );
    }

    return (
        <div className="border-2 border-gray-700 overflow-hidden font-mono">
            {/* Header */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#1a1a2e] hover:bg-[#1a1a2e]/80 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="text-gray-400">&gt;</span>
                    <span className="text-base text-white font-bold">Test Results</span>
                    <span className={`text-xs px-2 py-0.5 font-bold border ${allPassed
                        ? "border-green-400/50 text-green-400"
                        : "border-red-400/50 text-red-400"
                        }`}>
                        {allPassed ? "PASS" : "FAIL"}
                    </span>
                    <span className="text-xs text-gray-500">
                        [{passedCount}/{results.length}]
                    </span>
                </div>
                <span className="text-gray-500">
                    {collapsed ? "▼" : "▲"}
                </span>
            </button>

            {/* Test Cases */}
            {!collapsed && (
                <div className="divide-y-2 divide-gray-800">
                    {results.map((result) => {
                        const isExpanded = expandedTests.has(result.test_number);
                        const testName = result.name || `Test ${result.test_number}`;

                        return (
                            <div key={result.test_number} className="bg-[#0d0d14]">
                                {/* Test Row */}
                                <button
                                    onClick={() => toggleTest(result.test_number)}
                                    className={`w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors border-l-2 ${result.passed
                                        ? "border-green-400"
                                        : "border-red-400"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {result.passed ? (
                                            <span className="text-green-400 font-bold">✓</span>
                                        ) : (
                                            <span className="text-red-400 font-bold">✗</span>
                                        )}
                                        <span className="text-sm text-gray-200">{testName}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {result.execution_time && (
                                            <span className="text-xs text-gray-600">
                                                {result.execution_time}ms
                                            </span>
                                        )}
                                        <span className="text-gray-600">
                                            {isExpanded ? "▲" : "▼"}
                                        </span>
                                    </div>
                                </button>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="px-4 py-3 bg-[#1a1a2e] border-t-2 border-gray-800">
                                        <div className="space-y-1 text-sm">
                                            {result.input && (
                                                <div>
                                                    <span className="text-gray-500">// Input: </span>
                                                    <span className="text-cyan-400">{result.input}</span>
                                                </div>
                                            )}
                                            {result.expected && (
                                                <div>
                                                    <span className="text-gray-500">// Expected: </span>
                                                    <span className="text-green-400">{result.expected}</span>
                                                </div>
                                            )}
                                            {result.actual !== undefined && (
                                                <div>
                                                    <span className="text-gray-500">// Actual: </span>
                                                    <span className={result.passed ? "text-green-400" : "text-red-400"}>
                                                        {result.actual || "None"}
                                                    </span>
                                                </div>
                                            )}
                                            {result.error && (
                                                <div>
                                                    <span className="text-gray-500">// Error: </span>
                                                    <span className="text-red-400">{result.error}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
