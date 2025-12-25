"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HiMail, HiLockClosed, HiUser, HiEye, HiEyeOff } from "react-icons/hi";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { login, register } from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSignIn = async () => {
        setLoading(true);
        setError("");
        try {
            await login(email, password);
            // Check for redirect path from expired session
            const redirectPath = sessionStorage.getItem('redirectAfterLogin');
            if (redirectPath) {
                sessionStorage.removeItem('redirectAfterLogin');
                router.push(redirectPath);
            } else {
                router.push("/problems");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        setLoading(true);
        setError("");
        try {
            await register(username, email, password);
            await login(email, password);
            router.push("/problems");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#0a0a0f]" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#3c83f6]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

            {/* Login Card */}
            <div className="relative w-full max-w-md">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-3 mb-8">
                    <img src="/images/mascot_icon.png" alt="NeuronLab" className="size-10 object-contain" />
                    <h1 className="text-2xl font-bold text-white">NeuronLab</h1>
                </Link>

                {/* Card */}
                <div className="bg-[#12121a]/80 backdrop-blur-xl border border-[#282e39] rounded-2xl p-8">
                    {/* Tab Switcher */}
                    <div className="flex border-b border-[#282e39] mb-6">
                        <button
                            onClick={() => setActiveTab("signin")}
                            className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${activeTab === "signin" ? "text-white" : "text-gray-400"
                                }`}
                        >
                            Sign In
                            {activeTab === "signin" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3c83f6]" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("signup")}
                            className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${activeTab === "signup" ? "text-white" : "text-gray-400"
                                }`}
                        >
                            Sign Up
                            {activeTab === "signup" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3c83f6]" />
                            )}
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Sign In Form */}
                    {activeTab === "signin" && (
                        <form onSubmit={(e) => { e.preventDefault(); handleSignIn(); }} className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Email</label>
                                <div className="relative">
                                    <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full pl-10 pr-4 py-3 bg-[#1e1e2e] border border-[#282e39] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#3c83f6] transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Password</label>
                                <div className="relative">
                                    <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="w-full pl-10 pr-12 py-3 bg-[#1e1e2e] border border-[#282e39] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#3c83f6] transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                    >
                                        {showPassword ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember me & Forgot password */}
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="rounded bg-[#1e1e2e] border-[#282e39]" />
                                    <span className="text-gray-400">Remember me</span>
                                </label>
                                <a href="#" className="text-[#3c83f6] hover:underline">Forgot password?</a>
                            </div>

                            {/* Sign In Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-[#3c83f6] to-[#2563eb] text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {loading ? "Signing in..." : "Sign In"}
                            </button>
                        </form>
                    )}

                    {/* Sign Up Form */}
                    {activeTab === "signup" && (
                        <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }} className="space-y-4">
                            {/* Username */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Username</label>
                                <div className="relative">
                                    <HiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Choose a username"
                                        className="w-full pl-10 pr-4 py-3 bg-[#1e1e2e] border border-[#282e39] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#3c83f6] transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Email</label>
                                <div className="relative">
                                    <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full pl-10 pr-4 py-3 bg-[#1e1e2e] border border-[#282e39] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#3c83f6] transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Password</label>
                                <div className="relative">
                                    <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Create a password"
                                        className="w-full pl-10 pr-12 py-3 bg-[#1e1e2e] border border-[#282e39] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#3c83f6] transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                    >
                                        {showPassword ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Confirm Password</label>
                                <div className="relative">
                                    <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm your password"
                                        className="w-full pl-10 pr-4 py-3 bg-[#1e1e2e] border border-[#282e39] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#3c83f6] transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Create Account Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-[#3c83f6] to-[#2563eb] text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {loading ? "Creating account..." : "Create Account"}
                            </button>
                        </form>
                    )}

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-[#282e39]" />
                        <span className="text-sm text-gray-500">or continue with</span>
                        <div className="flex-1 h-px bg-[#282e39]" />
                    </div>

                    {/* Social Login */}
                    <div className="flex gap-3">
                        <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1e1e2e] border border-[#282e39] rounded-lg text-white hover:bg-[#282e39] transition-colors">
                            <FaGithub className="w-5 h-5" />
                            GitHub
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1e1e2e] border border-[#282e39] rounded-lg text-white hover:bg-[#282e39] transition-colors">
                            <FaGoogle className="w-5 h-5" />
                            Google
                        </button>
                    </div>
                </div>

                {/* Bottom text */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    {activeTab === "signin" ? (
                        <>Don&apos;t have an account? <button onClick={() => setActiveTab("signup")} className="text-[#3c83f6] hover:underline">Sign up</button></>
                    ) : (
                        <>Already have an account? <button onClick={() => setActiveTab("signin")} className="text-[#3c83f6] hover:underline">Sign in</button></>
                    )}
                </p>
            </div>
        </div>
    );
}
