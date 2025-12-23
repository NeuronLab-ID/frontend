"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    HiCheckCircle,
    HiFire,
    HiAcademicCap,
    HiStar,
    HiCog,
    HiPencil
} from "react-icons/hi";
import { getUserProfile, UserProfile, isAuthenticated } from "@/lib/api";

// Mock data for achievements
const mockAchievements = [
    { id: 1, name: "First Blood", description: "Solve your first problem", unlocked: true },
    { id: 2, name: "Streak Master", description: "7 day streak", unlocked: false },
    { id: 3, name: "Linear Algebra Pro", description: "Complete all Linear Algebra", unlocked: false },
    { id: 4, name: "Speed Demon", description: "Solve under 1 minute", unlocked: false },
    { id: 5, name: "Night Owl", description: "Solve at midnight", unlocked: false },
    { id: 6, name: "Collector", description: "Complete 50 problems", unlocked: false },
];

const categoryProgress = [
    { name: "Linear Algebra", solved: 0, total: 35, color: "cyan" },
    { name: "Machine Learning", solved: 0, total: 45, color: "purple" },
    { name: "Deep Learning", solved: 0, total: 52, color: "pink" },
    { name: "NLP", solved: 0, total: 38, color: "yellow" },
    { name: "Computer Vision", solved: 0, total: 40, color: "green" },
    { name: "Data Processing", solved: 0, total: 60, color: "orange" },
];

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [calendarData, setCalendarData] = useState<number[]>([]);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login?redirect=/profile');
            return;
        }

        // Generate calendar data on client only
        const data = [];
        for (let i = 0; i < 365; i++) {
            const activity = Math.random();
            let level = 0;
            if (activity > 0.7) level = 3;
            else if (activity > 0.5) level = 2;
            else if (activity > 0.3) level = 1;
            data.push(level);
        }
        setCalendarData(data);

        async function loadProfile() {
            try {
                const data = await getUserProfile();
                setProfile(data);

                if (data.stats.problems_solved > 0) {
                    mockAchievements[0].unlocked = true;
                }
            } catch (error) {
                console.error("Failed to load profile:", error);
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, [router]);

    const getActivityColor = (level: number) => {
        switch (level) {
            case 0: return "bg-gray-800";
            case 1: return "bg-cyan-900";
            case 2: return "bg-cyan-600";
            case 3: return "bg-cyan-400";
            default: return "bg-gray-800";
        }
    };

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

                    <div className="flex items-center gap-6">
                        <Link className="text-gray-400 text-sm font-medium uppercase tracking-wider transition-colors hover:text-cyan-400" href="/problems">[Problems]</Link>
                        <Link className="text-gray-400 hover:text-cyan-400 transition-colors" href="/settings">
                            <HiCog className="w-6 h-6" />
                        </Link>
                    </div>
                </div>
            </header>

            <main className="pt-28 pb-12 px-6 lg:px-20 max-w-7xl mx-auto relative z-10">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-cyan-400 font-mono animate-pulse">&gt; Loading profile...</div>
                    </div>
                ) : profile ? (
                    <>
                        {/* Profile Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                            <div className="flex items-center gap-6">
                                {/* Avatar */}
                                <div className="w-24 h-24 border-4 border-cyan-400 bg-[#1a1a2e] flex items-center justify-center text-4xl font-bold text-cyan-400 font-mono">
                                    {profile.user.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold">
                                        <span className="text-gray-500">&gt; </span>
                                        <span className="text-white">{profile.user.username}</span>
                                        <span className="text-cyan-400 animate-pulse">_</span>
                                    </h1>
                                    <p className="text-gray-500 font-mono">@{profile.user.username}</p>
                                    <p className="text-sm text-gray-600 font-mono">// joined {profile.user.created_at?.split('T')[0]}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button className="flex items-center gap-2 px-4 py-2 border-2 border-gray-700 text-gray-400 font-mono text-sm hover:border-cyan-400 hover:text-cyan-400 transition-all">
                                    <HiPencil className="w-4 h-4" />
                                    [Edit]
                                </button>
                                <Link href="/settings" className="flex items-center gap-2 px-4 py-2 border-2 border-gray-700 text-gray-400 font-mono text-sm hover:border-purple-400 hover:text-purple-400 transition-all">
                                    <HiCog className="w-4 h-4" />
                                    [Settings]
                                </Link>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                            <div className="border-2 border-green-400/30 bg-[#1a1a2e]/50 p-5">
                                <div className="flex items-center gap-3">
                                    <HiCheckCircle className="w-8 h-8 text-green-400" />
                                    <div>
                                        <p className="text-3xl font-bold text-green-400">{profile.stats.problems_solved ?? 0}</p>
                                        <p className="text-sm text-gray-500 font-mono">solved</p>
                                    </div>
                                </div>
                            </div>
                            <div className="border-2 border-orange-400/30 bg-[#1a1a2e]/50 p-5">
                                <div className="flex items-center gap-3">
                                    <HiFire className="w-8 h-8 text-orange-400" />
                                    <div>
                                        <p className="text-3xl font-bold text-orange-400">{profile.stats.total_submissions ?? 0}</p>
                                        <p className="text-sm text-gray-500 font-mono">submissions</p>
                                    </div>
                                </div>
                            </div>
                            <div className="border-2 border-purple-400/30 bg-[#1a1a2e]/50 p-5">
                                <div className="flex items-center gap-3">
                                    <HiAcademicCap className="w-8 h-8 text-purple-400" />
                                    <div>
                                        <p className="text-3xl font-bold text-purple-400">{profile.stats.paths_completed ?? 0}</p>
                                        <p className="text-sm text-gray-500 font-mono">paths</p>
                                    </div>
                                </div>
                            </div>
                            <div className="border-2 border-yellow-400/30 bg-[#1a1a2e]/50 p-5">
                                <div className="flex items-center gap-3">
                                    <HiStar className="w-8 h-8 text-yellow-400" />
                                    <div>
                                        <p className="text-3xl font-bold text-yellow-400">{profile.stats.rank ?? '-'}</p>
                                        <p className="text-sm text-gray-500 font-mono">rank</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Activity Calendar */}
                        <div className="border-2 border-cyan-400/30 bg-[#1a1a2e]/50 p-6 mb-10">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold">
                                    <span className="text-gray-500">&gt; </span>
                                    <span className="text-white">Activity</span>
                                </h2>
                                <select className="bg-[#0d0d14] border-2 border-gray-700 px-3 py-1 text-sm text-gray-400 font-mono">
                                    <option>2025</option>
                                    <option>2024</option>
                                </select>
                            </div>
                            <div className="overflow-x-auto">
                                <div className="flex gap-1" style={{ minWidth: "800px" }}>
                                    {Array.from({ length: 52 }).map((_, weekIndex) => (
                                        <div key={weekIndex} className="flex flex-col gap-1">
                                            {Array.from({ length: 7 }).map((_, dayIndex) => {
                                                const dataIndex = weekIndex * 7 + dayIndex;
                                                return (
                                                    <div
                                                        key={dayIndex}
                                                        className={`w-3 h-3 ${getActivityColor(calendarData[dataIndex] || 0)}`}
                                                        title={`${calendarData[dataIndex] || 0} contributions`}
                                                    />
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500 font-mono">
                                <span>Less</span>
                                <div className="w-3 h-3 bg-gray-800" />
                                <div className="w-3 h-3 bg-cyan-900" />
                                <div className="w-3 h-3 bg-cyan-600" />
                                <div className="w-3 h-3 bg-cyan-400" />
                                <span>More</span>
                            </div>
                        </div>

                        {/* Skills Progress */}
                        <div className="border-2 border-purple-400/30 bg-[#1a1a2e]/50 p-6 mb-10">
                            <h2 className="text-lg font-bold mb-6">
                                <span className="text-gray-500">&gt; </span>
                                <span className="text-white">Skills Progress</span>
                            </h2>
                            <div className="space-y-4">
                                {categoryProgress.sort((a, b) => (b.solved / b.total) - (a.solved / a.total)).map((cat) => (
                                    <div key={cat.name}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-gray-300 font-mono">[{cat.name}]</span>
                                            <span className="text-sm text-gray-500 font-mono">{cat.solved}/{cat.total}</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-800">
                                            <div
                                                className={`h-full bg-${cat.color}-400 transition-all`}
                                                style={{
                                                    width: `${(cat.solved / cat.total) * 100}%`,
                                                    backgroundColor: cat.color === 'cyan' ? '#22d3ee' :
                                                        cat.color === 'purple' ? '#a855f7' :
                                                            cat.color === 'pink' ? '#ec4899' :
                                                                cat.color === 'yellow' ? '#facc15' :
                                                                    cat.color === 'green' ? '#22c55e' : '#f97316'
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Recent Activity */}
                            <div className="border-2 border-green-400/30 bg-[#1a1a2e]/50 p-6">
                                <h2 className="text-lg font-bold mb-6">
                                    <span className="text-gray-500">&gt; </span>
                                    <span className="text-white">Recent Activity</span>
                                </h2>
                                <div className="space-y-3">
                                    {profile.recent_activity.length === 0 ? (
                                        <p className="text-gray-500 text-sm font-mono">// No activity yet. Start solving!</p>
                                    ) : (
                                        profile.recent_activity.map((activity, i: number) => (
                                            <div key={i} className="flex items-center gap-3 p-3 bg-[#0d0d14]/50 border border-gray-800">
                                                <HiCheckCircle className={`w-5 h-5 ${activity.passed ? "text-green-400" : "text-red-400"}`} />
                                                <div className="flex-1">
                                                    <p className="text-sm text-white font-mono">
                                                        {activity.passed ? "✓ Solved" : "✗ Attempted"} Problem #{activity.problem_id}
                                                    </p>
                                                    <p className="text-xs text-gray-600 font-mono">
                                                        {new Date(activity.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-0.5 text-xs font-mono border ${activity.passed
                                                    ? "border-green-400/50 text-green-400"
                                                    : "border-red-400/50 text-red-400"
                                                    }`}>
                                                    {activity.passed ? "PASS" : "FAIL"}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Achievements */}
                            <div className="border-2 border-yellow-400/30 bg-[#1a1a2e]/50 p-6">
                                <h2 className="text-lg font-bold mb-6">
                                    <span className="text-gray-500">&gt; </span>
                                    <span className="text-white">Achievements</span>
                                </h2>
                                <div className="grid grid-cols-3 gap-4">
                                    {mockAchievements.map((achievement) => (
                                        <div
                                            key={achievement.id}
                                            className={`flex flex-col items-center p-4 border-2 transition-all ${achievement.unlocked
                                                ? "border-yellow-400/50 bg-yellow-400/5 hover:border-yellow-400"
                                                : "border-gray-700 opacity-50"
                                                }`}
                                        >
                                            <div className={`w-12 h-12 border-2 flex items-center justify-center text-xl mb-2 ${achievement.unlocked
                                                ? "border-yellow-400 text-yellow-400"
                                                : "border-gray-600 text-gray-600"
                                                }`}>
                                                {achievement.unlocked ? "★" : "?"}
                                            </div>
                                            <p className="text-xs text-center text-gray-400 font-mono">{achievement.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500 font-mono">&gt; Failed to load profile_</p>
                    </div>
                )}
            </main>
        </div>
    );
}