"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAuthenticated } from "@/lib/api";

export default function AuthNavButtons() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setIsLoggedIn(isAuthenticated());
    }, []);

    // Don't render anything until mounted to avoid hydration mismatch
    if (!mounted) {
        return (
            <div className="flex items-center gap-4">
                <span className="hidden sm:block text-gray-400 text-sm font-bold uppercase tracking-wider">&gt; Login</span>
                <span className="flex items-center justify-center border-2 border-cyan-400 bg-cyan-400/10 px-6 py-2 text-cyan-400 text-sm font-bold uppercase tracking-wider">
                    Sign Up ►
                </span>
            </div>
        );
    }

    if (isLoggedIn) {
        return (
            <div className="flex items-center gap-4">
                <Link
                    className="hidden sm:block text-gray-400 text-sm font-bold uppercase tracking-wider hover:text-cyan-400 transition-colors"
                    href="/profile"
                >
                    &gt; Profile
                </Link>
                <Link
                    href="/problems"
                    className="flex items-center justify-center border-2 border-cyan-400 bg-cyan-400/10 hover:bg-cyan-400 hover:text-black px-6 py-2 text-cyan-400 text-sm font-bold uppercase tracking-wider transition-all"
                >
                    <span>Problems ►</span>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4">
            <Link
                className="hidden sm:block text-gray-400 text-sm font-bold uppercase tracking-wider hover:text-cyan-400 transition-colors"
                href="/login"
            >
                &gt; Login
            </Link>
            <Link
                href="/login"
                className="flex items-center justify-center border-2 border-cyan-400 bg-cyan-400/10 hover:bg-cyan-400 hover:text-black px-6 py-2 text-cyan-400 text-sm font-bold uppercase tracking-wider transition-all"
            >
                <span>Sign Up ►</span>
            </Link>
        </div>
    );
}
