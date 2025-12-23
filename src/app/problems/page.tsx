"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { hasQuest, getDifficultyColor } from "@/lib/data";
import { isProblemComplete, getStats } from "@/lib/progress";
import { getProblems, ProblemSummary, getUserProfile, isAuthenticated } from "@/lib/api";
import { HiSearch, HiUser, HiStar, HiCheckCircle, HiChevronLeft, HiChevronRight } from "react-icons/hi";

const ITEMS_PER_PAGE = 20;

export default function ProblemsPage() {
    const [problems, setProblems] = useState<ProblemSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");
    const [difficulty, setDifficulty] = useState<string[]>([]);
    const [showQuestsOnly, setShowQuestsOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [solvedCount, setSolvedCount] = useState(0);

    useEffect(() => {
        // Load stats - prefer API for logged in users, fallback to local storage
        async function loadStats() {
            if (isAuthenticated()) {
                try {
                    const profile = await getUserProfile();
                    setSolvedCount(profile.stats.problems_solved);
                    return;
                } catch (error) {
                    console.error("Failed to load profile:", error);
                }
            }
            // Fallback to local storage
            const stats = getStats();
            setSolvedCount(stats.solved);
        }
        loadStats();
    }, []);

    useEffect(() => {
        async function loadProblems() {
            setLoading(true);
            try {
                const res = await getProblems(page, ITEMS_PER_PAGE);
                setProblems(res.problems);
                setTotal(res.total);
            } catch (error) {
                console.error("Failed to load problems:", error);
            }
            setLoading(false);
        }
        loadProblems();
    }, [page]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [search, category, difficulty, showQuestsOnly]);

    const categories = [
        { name: "All", color: "gray" },
        { name: "Linear Algebra", color: "cyan" },
        { name: "Machine Learning", color: "purple" },
        { name: "Deep Learning", color: "pink" },
        { name: "NLP", color: "yellow" },
        { name: "Computer Vision", color: "green" },
        { name: "Data Preprocessing", color: "orange" },
    ];

    const filteredProblems = problems.filter((p) => {
        if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
        if (category !== "All" && p.category !== category) return false;
        if (difficulty.length > 0 && !difficulty.includes(p.difficulty)) return false;
        if (showQuestsOnly && !hasQuest(p.id)) return false;
        return true;
    });

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    return (
        <div className="min-h-screen bg-[#0d0d14] text-white">
            {/* Pixel Grid Background */}
            <div className="fixed inset-0 opacity-5 pointer-events-none" style={{
                backgroundImage: `radial-gradient(circle, #00ffff 1px, transparent 1px)`,
                backgroundSize: '30px 30px'
            }} />

            {/* Header - Terminal Style */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b-2 border-gray-800 bg-[#0a0a0f]/95 backdrop-blur-sm px-6 lg:px-20 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <img src="/images/mascot_icon.png" alt="NeuronLab" className="size-10 object-contain" />
                        <h2 className="text-cyan-400 text-xl font-bold tracking-widest uppercase">NeuronLab</h2>
                    </Link>

                    {/* Search - Terminal Style */}
                    <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
                        <div className="relative w-full">
                            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="> search problems..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[#1a1a2e] border-2 border-gray-700 text-white placeholder-gray-500 font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link className="text-gray-400 text-sm font-medium uppercase tracking-wider transition-colors hover:text-cyan-400" href="/about">[About]</Link>
                        <Link href="/profile" className="text-gray-400 hover:text-cyan-400 transition-colors">
                            <HiUser className="w-6 h-6" />
                        </Link>
                    </div>
                </div>
            </header>

            <div className="flex pt-20">
                {/* Sidebar - Terminal Style */}
                <aside className="hidden lg:block w-72 fixed left-0 top-20 bottom-0 p-6 border-r-2 border-gray-800 overflow-y-auto bg-[#0a0a0f]/50">
                    {/* Progress */}
                    <div className="mb-8 border-2 border-cyan-400/30 bg-[#1a1a2e]/50 p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-cyan-400">&gt;</span>
                            <span className="text-gray-400 text-sm font-mono uppercase">Progress</span>
                        </div>
                        <p className="text-3xl font-bold text-cyan-400">{solvedCount}<span className="text-gray-500">/{total}</span></p>
                        <div className="w-full bg-gray-800 h-2 mt-3">
                            <div
                                className="bg-cyan-400 h-2 transition-all"
                                style={{ width: `${total > 0 ? (solvedCount / total) * 100 : 0}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-purple-400">&gt;</span>
                            <span className="text-gray-400 text-sm font-mono uppercase">Categories</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            {categories.map((cat) => (
                                <button
                                    key={cat.name}
                                    onClick={() => setCategory(cat.name)}
                                    className={`text-left px-3 py-2 font-mono text-sm transition-all border-l-2 ${category === cat.name
                                        ? "border-cyan-400 bg-cyan-400/10 text-cyan-400"
                                        : "border-transparent text-gray-400 hover:border-gray-600 hover:text-white"
                                        }`}
                                >
                                    [{cat.name}]
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Difficulty */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-yellow-400">&gt;</span>
                            <span className="text-gray-400 text-sm font-mono uppercase">Difficulty</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            {[
                                { name: "easy", color: "text-green-400 border-green-400" },
                                { name: "medium", color: "text-yellow-400 border-yellow-400" },
                                { name: "hard", color: "text-red-400 border-red-400" }
                            ].map((d) => (
                                <label key={d.name} className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={difficulty.includes(d.name)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setDifficulty([...difficulty, d.name]);
                                            } else {
                                                setDifficulty(difficulty.filter((x) => x !== d.name));
                                            }
                                        }}
                                        className="w-4 h-4 bg-[#1a1a2e] border-2 border-gray-600 appearance-none checked:bg-cyan-400 checked:border-cyan-400"
                                    />
                                    <span className={`capitalize font-mono text-sm ${d.color.split(' ')[0]}`}>[{d.name}]</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Has Learning Path */}
                    <div className="border-2 border-yellow-400/30 bg-yellow-400/5 p-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showQuestsOnly}
                                onChange={(e) => setShowQuestsOnly(e.target.checked)}
                                className="w-4 h-4 bg-[#1a1a2e] border-2 border-gray-600 appearance-none checked:bg-yellow-400 checked:border-yellow-400"
                            />
                            <span className="text-yellow-400 font-mono text-sm">Has Quest</span>
                            <HiStar className="w-4 h-4 text-yellow-400" />
                        </label>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 lg:ml-72 p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">
                                <span className="text-gray-500">&gt; </span>
                                <span className="text-white">Problems</span>
                                <span className="text-cyan-400 animate-pulse">_</span>
                            </h1>
                            <p className="text-gray-500 font-mono text-sm mt-1">
                                {filteredProblems.length} of {total} problems // Page {page}/{totalPages}
                            </p>
                        </div>
                    </div>

                    {/* Problem Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-cyan-400 font-mono animate-pulse">Loading...</div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredProblems.map((problem) => (
                                    <Link
                                        key={problem.id}
                                        href={`/problem/${problem.id}`}
                                        className="border-2 border-gray-700 bg-[#1a1a2e]/50 p-5 flex flex-col gap-3 group hover:border-cyan-400/50 transition-all"
                                    >
                                        <div className="flex items-start justify-between">
                                            <span className="text-xs text-gray-500 font-mono">#{problem.id}</span>
                                            <div className="flex items-center gap-2">
                                                {hasQuest(problem.id) && (
                                                    <HiStar className="w-4 h-4 text-yellow-400" />
                                                )}
                                                {isProblemComplete(problem.id) && (
                                                    <HiCheckCircle className="w-4 h-4 text-green-400" />
                                                )}
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-semibold group-hover:text-cyan-400 transition-colors line-clamp-2">
                                            {problem.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-auto">
                                            <span className={`px-2 py-1 text-xs font-mono uppercase border ${problem.difficulty === 'easy'
                                                ? 'border-green-400/50 text-green-400'
                                                : problem.difficulty === 'medium'
                                                    ? 'border-yellow-400/50 text-yellow-400'
                                                    : 'border-red-400/50 text-red-400'
                                                }`}>
                                                {problem.difficulty}
                                            </span>
                                            <span className="px-2 py-1 text-xs font-mono text-purple-400 border border-purple-400/50">
                                                {problem.category}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* Pagination Controls - Terminal Style */}
                            <div className="flex items-center justify-center gap-2 mt-10">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="flex items-center gap-1 px-4 py-2 border-2 border-gray-700 text-gray-400 font-mono text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-cyan-400 hover:text-cyan-400 transition-all"
                                >
                                    <HiChevronLeft className="w-4 h-4" />
                                    <span>Prev</span>
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum: number;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (page <= 3) {
                                            pageNum = i + 1;
                                        } else if (page >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = page - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`w-10 h-10 font-mono text-sm border-2 transition-all ${page === pageNum
                                                    ? "bg-cyan-400 border-cyan-400 text-black"
                                                    : "border-gray-700 text-gray-400 hover:border-cyan-400 hover:text-cyan-400"
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="flex items-center gap-1 px-4 py-2 border-2 border-gray-700 text-gray-400 font-mono text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-cyan-400 hover:text-cyan-400 transition-all"
                                >
                                    <span>Next</span>
                                    <HiChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
