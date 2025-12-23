"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
    HiUser,
    HiColorSwatch,
    HiCode,
    HiBell,
    HiLockClosed,
    HiExclamation,
    HiCog,
    HiCheck
} from "react-icons/hi";
import { getUserProfile, isAuthenticated } from "@/lib/api";
import { getMonacoTheme, defineMonacoThemes } from "@/lib/settings";

// Dynamic import for Monaco
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// Sample code for preview
const PREVIEW_CODE = `def fibonacci(n: int) -> int:
    """Calculate nth Fibonacci number."""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Example usage
result = fibonacci(10)
print(f"Fib(10) = {result}")
`;

// Editor preview component
function EditorPreview({ theme, fontSize, lineNumbers, tabSize }: {
    theme: string;
    fontSize: number;
    lineNumbers: boolean;
    tabSize: number;
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="h-48 bg-[#0d0d14] animate-pulse" />;
    }

    return (
        <Editor
            height="200px"
            language="python"
            theme={getMonacoTheme(theme)}
            value={PREVIEW_CODE}
            options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: fontSize,
                lineNumbers: lineNumbers ? "on" : "off",
                tabSize: tabSize,
                scrollBeyondLastLine: false,
                folding: false,
                wordWrap: "on",
            }}
            beforeMount={defineMonacoThemes}
        />
    );
}

type SettingsSection = "account" | "editor" | "danger";

const sectionItems = [
    { id: "account" as const, label: "Account", icon: HiUser, color: "cyan" },
    { id: "editor" as const, label: "Editor", icon: HiCode, color: "green" },
    { id: "danger" as const, label: "Danger Zone", icon: HiExclamation, color: "red", danger: true },
];

export default function SettingsPage() {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState<SettingsSection>("account");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);

    // Form states
    const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [bio, setBio] = useState("");

    // Editor settings
    const [editorTheme, setEditorTheme] = useState("Monokai");
    const [tabSize, setTabSize] = useState<2 | 4>(4);
    const [lineNumbers, setLineNumbers] = useState(true);
    const [fontSize, setFontSize] = useState(14);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const { getEditorSettings } = require("@/lib/settings");
            const savedSettings = getEditorSettings();
            setEditorTheme(savedSettings.editorTheme);
            setFontSize(savedSettings.fontSize);
            setTabSize(savedSettings.tabSize);
            setLineNumbers(savedSettings.lineNumbers);
        }
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined" && !loading) {
            const { saveEditorSettings } = require("@/lib/settings");
            saveEditorSettings({
                editorTheme,
                fontSize,
                tabSize,
                lineNumbers,
            });
        }
    }, [editorTheme, fontSize, tabSize, lineNumbers, loading]);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login?redirect=/settings');
            return;
        }

        async function loadUserData() {
            try {
                const profile = await getUserProfile();
                setDisplayName(profile.user.username);
                setUsername(profile.user.username);
                setEmail(profile.user.email);
            } catch (error) {
                console.error("Failed to load user data:", error);
            } finally {
                setLoading(false);
            }
        }
        loadUserData();
    }, [router]);

    const accentColors = [
        { name: "Cyan", value: "#22d3ee" },
        { name: "Purple", value: "#a855f7" },
        { name: "Green", value: "#22c55e" },
        { name: "Yellow", value: "#facc15" },
        { name: "Pink", value: "#ec4899" },
    ];

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
                        <Link className="text-gray-400 text-sm font-medium uppercase tracking-wider transition-colors hover:text-purple-400" href="/profile">[Profile]</Link>
                    </div>
                </div>
            </header>

            <main className="pt-28 pb-12 px-6 lg:px-20 max-w-6xl mx-auto relative z-10">
                <div className="flex items-center gap-3 mb-8">
                    <HiCog className="w-6 h-6 text-cyan-400" />
                    <h1 className="text-2xl md:text-3xl font-bold">
                        <span className="text-gray-500">&gt; </span>
                        <span className="text-white">Settings</span>
                        <span className="text-cyan-400 animate-pulse">_</span>
                    </h1>
                </div>

                <div className="flex gap-8">
                    {/* Sidebar Navigation */}
                    <aside className="w-56 flex-shrink-0">
                        <nav className="space-y-1">
                            {sectionItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 font-mono text-sm text-left transition-all border-l-2 ${activeSection === item.id
                                        ? `border-${item.color}-400 bg-${item.color}-400/10 text-${item.color}-400`
                                        : item.danger
                                            ? "border-transparent text-red-400 hover:border-red-400/50 hover:bg-red-400/5"
                                            : "border-transparent text-gray-400 hover:border-gray-600 hover:text-white"
                                        }`}
                                    style={activeSection === item.id ? {
                                        borderColor: item.color === 'cyan' ? '#22d3ee' :
                                            item.color === 'purple' ? '#a855f7' :
                                                item.color === 'green' ? '#22c55e' :
                                                    item.color === 'yellow' ? '#facc15' :
                                                        item.color === 'pink' ? '#ec4899' : '#ef4444',
                                        backgroundColor: item.color === 'cyan' ? 'rgba(34, 211, 238, 0.1)' :
                                            item.color === 'purple' ? 'rgba(168, 85, 247, 0.1)' :
                                                item.color === 'green' ? 'rgba(34, 197, 94, 0.1)' :
                                                    item.color === 'yellow' ? 'rgba(250, 204, 21, 0.1)' :
                                                        item.color === 'pink' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: item.color === 'cyan' ? '#22d3ee' :
                                            item.color === 'purple' ? '#a855f7' :
                                                item.color === 'green' ? '#22c55e' :
                                                    item.color === 'yellow' ? '#facc15' :
                                                        item.color === 'pink' ? '#ec4899' : '#ef4444'
                                    } : {}}
                                >
                                    <item.icon className="w-5 h-5" />
                                    [{item.label}]
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* Content Area */}
                    <div className="flex-1 border-2 border-gray-700 bg-[#1a1a2e]/50 p-6">
                        {/* Account Section */}
                        {activeSection === "account" && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold">
                                    <span className="text-cyan-400">&gt; </span>Account Settings
                                </h2>

                                {/* Avatar */}
                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        <div className="w-20 h-20 border-4 border-cyan-400 bg-[#0d0d14] flex items-center justify-center text-2xl font-bold text-cyan-400 font-mono">
                                            {displayName.charAt(0)}
                                        </div>
                                        <button className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono text-cyan-400">
                                            [change]
                                        </button>
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{displayName}</p>
                                        <p className="text-sm text-gray-500 font-mono">@{username}</p>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 font-mono mb-2">&gt; display_name</label>
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            className="w-full px-4 py-3 bg-[#0d0d14] border-2 border-gray-700 text-white font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 font-mono mb-2">&gt; username</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono">@</span>
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="w-full pl-8 pr-10 py-3 bg-[#0d0d14] border-2 border-gray-700 text-white font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                                            />
                                            <HiCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 font-mono mb-2">&gt; email</label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full px-4 pr-24 py-3 bg-[#0d0d14] border-2 border-gray-700 text-white font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 border border-green-400/50 text-green-400 text-xs font-mono">
                                                VERIFIED
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 font-mono mb-2">&gt; bio</label>
                                        <textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            placeholder="// describe yourself..."
                                            rows={3}
                                            className="w-full px-4 py-3 bg-[#0d0d14] border-2 border-gray-700 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-cyan-400 transition-colors resize-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setSaved(true);
                                        setTimeout(() => setSaved(false), 3000);
                                    }}
                                    className="px-6 py-2 border-2 border-cyan-400 bg-cyan-400 text-black font-mono font-bold hover:bg-cyan-300 transition-colors flex items-center gap-2"
                                >
                                    {saved ? (
                                        <>
                                            <HiCheck className="w-4 h-4" />
                                            Saved!
                                        </>
                                    ) : (
                                        "[Save Changes]"
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Editor Section */}
                        {activeSection === "editor" && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold">
                                    <span className="text-green-400">&gt; </span>Editor Preferences
                                </h2>

                                {/* Editor Theme */}
                                <div>
                                    <label className="block text-sm text-gray-400 font-mono mb-2">&gt; editor_theme</label>
                                    <select
                                        value={editorTheme}
                                        onChange={(e) => setEditorTheme(e.target.value)}
                                        className="w-full px-4 py-3 bg-[#0d0d14] border-2 border-gray-700 text-white font-mono focus:outline-none focus:border-green-400 transition-colors"
                                    >
                                        <option>Monokai</option>
                                        <option>Dracula</option>
                                        <option>GitHub Dark</option>
                                        <option>One Dark</option>
                                        <option>VS Dark</option>
                                    </select>
                                </div>

                                {/* Tab Size */}
                                <div>
                                    <label className="block text-sm text-gray-400 font-mono mb-3">&gt; tab_size</label>
                                    <div className="flex gap-3">
                                        {([2, 4] as const).map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setTabSize(size)}
                                                className={`px-4 py-2 font-mono text-sm border-2 transition-all ${tabSize === size
                                                    ? "border-green-400 bg-green-400/10 text-green-400"
                                                    : "border-gray-700 text-gray-400 hover:border-gray-600"
                                                    }`}
                                            >
                                                [{size} spaces]
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Font Size */}
                                <div>
                                    <label className="block text-sm text-gray-400 font-mono mb-2">&gt; font_size: {fontSize}px</label>
                                    <input
                                        type="range"
                                        min="12"
                                        max="20"
                                        value={fontSize}
                                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                                        className="w-full accent-green-400"
                                    />
                                </div>

                                {/* Line Numbers Toggle */}
                                <div className="pt-2">
                                    <ToggleRow label="line_numbers" checked={lineNumbers} onChange={setLineNumbers} color="green" />
                                </div>

                                {/* Editor Preview */}
                                <div>
                                    <label className="block text-sm text-gray-400 font-mono mb-3">&gt; preview</label>
                                    <div className="border-2 border-green-400/30 overflow-hidden">
                                        <div className="bg-[#1a1a2e] px-3 py-2 border-b-2 border-gray-800">
                                            <span className="text-xs text-gray-500 font-mono">// preview.py</span>
                                        </div>
                                        <EditorPreview
                                            theme={editorTheme}
                                            fontSize={fontSize}
                                            lineNumbers={lineNumbers}
                                            tabSize={tabSize}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Danger Zone */}
                        {activeSection === "danger" && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-red-400">
                                    &gt; Danger Zone
                                </h2>

                                <div className="border-2 border-red-500/50 p-6 bg-red-500/5">
                                    <h3 className="font-bold text-red-400 font-mono mb-2">[DELETE_ACCOUNT]</h3>
                                    <p className="text-sm text-gray-400 font-mono mb-4">
                                        // WARNING: This action cannot be undone.<br />
                                        // All progress, solutions, and data will be permanently deleted.
                                    </p>
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="px-4 py-2 border-2 border-red-500 text-red-400 font-mono hover:bg-red-500/10 transition-colors"
                                    >
                                        [Delete Account]
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80" onClick={() => setShowDeleteModal(false)} />
                    <div className="relative bg-[#0d0d14] border-2 border-red-500 p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-red-400 font-mono mb-4">&gt; CONFIRM_DELETE</h3>
                        <p className="text-gray-400 font-mono text-sm mb-6">
                            // Are you absolutely sure?<br />
                            // This will permanently delete your account and all associated data.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2 border-2 border-gray-600 text-gray-400 font-mono hover:border-gray-500 hover:text-white transition-all"
                            >
                                [Cancel]
                            </button>
                            <button className="flex-1 px-4 py-2 border-2 border-red-500 bg-red-500 text-white font-mono hover:bg-red-600 transition-colors">
                                [Yes, Delete]
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Toggle Row Component
function ToggleRow({ label, checked, onChange, color = "cyan" }: { label: string; checked: boolean; onChange: (v: boolean) => void; color?: string }) {
    const colorStyles = {
        cyan: { bg: "bg-cyan-400", text: "text-cyan-400" },
        green: { bg: "bg-green-400", text: "text-green-400" },
        yellow: { bg: "bg-yellow-400", text: "text-yellow-400" },
        pink: { bg: "bg-pink-400", text: "text-pink-400" },
    };
    const style = colorStyles[color as keyof typeof colorStyles] || colorStyles.cyan;

    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-gray-400 font-mono text-sm">{label}</span>
            <button
                onClick={() => onChange(!checked)}
                className={`relative w-12 h-6 border-2 transition-colors ${checked
                    ? `${style.bg} border-transparent`
                    : "bg-gray-800 border-gray-700"
                    }`}
            >
                <div
                    className={`absolute top-0.5 w-4 h-4 bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-0.5"
                        }`}
                />
            </button>
        </div>
    );
}
