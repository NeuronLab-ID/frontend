"use client";

import Link from "next/link";
import { HiGlobeAlt, HiCode, HiUserGroup, HiDocumentText, HiLightBulb, HiCalculator, HiLightningBolt, HiMail } from "react-icons/hi";
import { FaGithub } from "react-icons/fa";
import AuthNavButtons from "@/components/AuthNavButtons";

export default function AboutPage() {
    return (
        <div className="relative flex min-h-screen w-full flex-col bg-[#0d0d14] text-white overflow-x-hidden">
            {/* Pixel Grid Background */}
            <div className="fixed inset-0 opacity-10 pointer-events-none" style={{
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
                    <nav className="hidden md:flex items-center gap-8">
                        <Link className="text-gray-400 text-sm font-medium uppercase tracking-wider transition-colors hover:text-cyan-400 hover:underline underline-offset-4" href="/problems">[Problems]</Link>
                        <Link className="text-cyan-400 text-sm font-medium uppercase tracking-wider underline underline-offset-4" href="/about">[About]</Link>
                    </nav>
                    <AuthNavButtons />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow pt-28 px-6 lg:px-20 pb-20">
                <div className="max-w-5xl mx-auto flex flex-col gap-16">

                    {/* Hero Section */}
                    <section className="text-center py-12">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                            <span className="text-gray-500">&gt; </span>
                            <span className="text-white">About </span>
                            <span className="text-cyan-400">NeuronLab</span>
                            <span className="text-cyan-400 animate-pulse">_</span>
                        </h1>
                        <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto font-mono">
                            An open-source platform for mastering machine learning through hands-on coding challenges.
                            <span className="text-cyan-400"> Inspired by</span> and compatible with
                            <a href="https://deep-ml.com" className="text-purple-400 hover:underline" target="_blank" rel="noopener"> Deep-ML</a>.
                        </p>
                    </section>

                    {/* Mission Section */}
                    <section className="border-2 border-cyan-400/30 bg-[#1a1a2e]/50 p-8 md:p-12">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-cyan-400 text-2xl">◈</span>
                            <h2 className="text-2xl md:text-3xl font-bold text-white">Our Mission</h2>
                        </div>
                        <p className="text-gray-400 text-lg leading-relaxed font-mono">
                            We are on a mission to make high-quality machine learning education
                            <span className="text-cyan-400"> accessible</span> and
                            <span className="text-purple-400"> engaging</span> for everyone, regardless of their background.
                            We believe in <span className="text-yellow-400">learning by doing</span> and the power of community.
                        </p>
                    </section>

                    {/* Values Grid */}
                    <section>
                        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
                            <span className="text-gray-500">&gt; </span>
                            <span className="text-white">Our Values</span>
                            <span className="text-purple-400">_</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Value 1 */}
                            <div className="border-2 border-cyan-400/30 bg-[#1a1a2e]/50 p-6 hover:border-cyan-400 transition-all group">
                                <HiGlobeAlt className="text-cyan-400 text-3xl mb-4" />
                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">Accessibility</h3>
                                <p className="text-gray-400 text-sm font-mono">
                                    Open to everyone, ensuring that knowledge is never gated by background or resources.
                                </p>
                            </div>
                            {/* Value 2 */}
                            <div className="border-2 border-purple-400/30 bg-[#1a1a2e]/50 p-6 hover:border-purple-400 transition-all group">
                                <HiCode className="text-purple-400 text-3xl mb-4" />
                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">Practice-Oriented</h3>
                                <p className="text-gray-400 text-sm font-mono">
                                    Learn by coding real algorithms. Theory is important, but implementation is key.
                                </p>
                            </div>
                            {/* Value 3 */}
                            <div className="border-2 border-yellow-400/30 bg-[#1a1a2e]/50 p-6 hover:border-yellow-400 transition-all group">
                                <HiUserGroup className="text-yellow-400 text-3xl mb-4" />
                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">Community-Driven</h3>
                                <p className="text-gray-400 text-sm font-mono">
                                    Grow together with peers, share solutions, and support each other.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* What We Offer Section */}
                    <section className="border-t-2 border-b-2 border-gray-800 py-16">
                        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
                            <span className="text-gray-500">&gt; </span>
                            <span className="text-white">What We Offer</span>
                            <span className="text-green-400">_</span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Card 1 */}
                            <div className="border-2 border-gray-700 bg-gray-900/50 p-6 relative overflow-hidden group hover:border-cyan-400/50 transition-all">
                                <div className="absolute top-0 left-0 right-0 bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-500/50" />
                                    <span className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                    <span className="w-3 h-3 rounded-full bg-green-500/50" />
                                    <span className="text-gray-500 text-xs ml-2">problems.py</span>
                                </div>
                                <div className="pt-10">
                                    <HiDocumentText className="text-cyan-400 text-3xl mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">Interactive Problems</h3>
                                    <p className="text-gray-400 text-sm font-mono">
                                        270+ coding challenges from regression to deep neural networks.
                                    </p>
                                </div>
                            </div>
                            {/* Card 2 */}
                            <div className="border-2 border-gray-700 bg-gray-900/50 p-6 relative overflow-hidden group hover:border-purple-400/50 transition-all">
                                <div className="absolute top-0 left-0 right-0 bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-500/50" />
                                    <span className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                    <span className="w-3 h-3 rounded-full bg-green-500/50" />
                                    <span className="text-gray-500 text-xs ml-2">hints.py</span>
                                </div>
                                <div className="pt-10">
                                    <HiLightBulb className="text-purple-400 text-3xl mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">AI-Powered Hints</h3>
                                    <p className="text-gray-400 text-sm font-mono">
                                        GPT-4o provides progressive hints without spoiling the solution.
                                    </p>
                                </div>
                            </div>
                            {/* Card 3 */}
                            <div className="border-2 border-gray-700 bg-gray-900/50 p-6 relative overflow-hidden group hover:border-green-400/50 transition-all">
                                <div className="absolute top-0 left-0 right-0 bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-500/50" />
                                    <span className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                    <span className="w-3 h-3 rounded-full bg-green-500/50" />
                                    <span className="text-gray-500 text-xs ml-2">samples.py</span>
                                </div>
                                <div className="pt-10">
                                    <HiCalculator className="text-green-400 text-3xl mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">Math Samples</h3>
                                    <p className="text-gray-400 text-sm font-mono">
                                        Generate step-by-step examples for any formula to understand the math.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Open Source Section */}
                    <section className="text-center py-10">
                        <div className="border-2 border-purple-400/30 bg-purple-400/5 inline-block px-6 py-2 mb-6">
                            <span className="text-purple-400 font-mono text-sm uppercase tracking-wider">100% Open Source</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                            Built by the Community, for the Community
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto font-mono mb-8">
                            NeuronLab is a self-hosted alternative based on the original Deep-ML project.
                            Fork it, customize it, make it yours.
                        </p>
                        <a
                            href="https://github.com/neuronlab-id"
                            target="_blank"
                            rel="noopener"
                            className="inline-flex items-center gap-2 border-2 border-gray-600 hover:border-cyan-400 px-6 py-3 text-gray-400 hover:text-cyan-400 font-mono transition-all"
                        >
                            <FaGithub className="text-xl" />
                            <span>View on GitHub</span>
                        </a>
                    </section>

                    {/* Hire Me Section */}
                    <section className="border-2 border-green-400/30 bg-[#1a1a2e]/50 p-8 md:p-12">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-green-400 text-2xl">◈</span>
                            <h2 className="text-2xl md:text-3xl font-bold text-white">Hire Me</h2>
                        </div>
                        <p className="text-gray-400 text-lg leading-relaxed font-mono mb-6">
                            Interested in working together? I'm available for
                            <span className="text-green-400"> freelance projects</span>,
                            <span className="text-cyan-400"> consulting</span>, and
                            <span className="text-purple-400"> collaborations</span>.
                            Let's build something amazing together!
                        </p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="flex items-center gap-3 border-2 border-gray-700 bg-gray-900/50 px-5 py-3">
                                <HiMail className="text-green-400 text-xl" />
                                <span className="text-gray-500 font-mono text-sm">Contact:</span>
                                <a
                                    href="mailto:reky@cyb0x1.id"
                                    className="text-green-400 font-mono hover:text-green-300 hover:underline transition-colors"
                                >
                                    reky@cyb0x1.id
                                </a>
                            </div>
                            <span className="text-gray-500 font-mono text-sm">
                                — <span className="text-white">Naufal Reky Ardhana</span>
                            </span>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="border-2 border-cyan-400/30 bg-gradient-to-br from-cyan-400/5 to-purple-400/5 p-12 text-center">
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">
                            <span className="text-gray-500">&gt; </span>
                            <span className="text-white">Ready to Master ML?</span>
                            <span className="animate-pulse text-cyan-400">_</span>
                        </h2>
                        <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                            Join developers mastering ML through hands-on practice
                        </p>
                        <Link href="/problems" className="inline-flex items-center justify-center gap-2 border-2 border-cyan-400 bg-cyan-400 hover:bg-cyan-300 px-10 py-4 text-black text-lg font-bold uppercase tracking-wider transition-all hover:shadow-[0_0_40px_rgba(0,255,255,0.5)]">
                            <HiLightningBolt className="text-xl" />
                            <span>Start Learning</span>
                        </Link>
                    </section>
                </div>
            </main>

            {/* Footer - Terminal Style */}
            <footer className="border-t-2 border-gray-800 bg-[#0a0a0f] py-8 px-6 lg:px-20">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2 text-gray-500 text-sm font-mono">
                        <img src="/images/mascot_icon.png" alt="NeuronLab" className="size-6 object-contain" />
                        <span>© 2025 NeuronLab</span>
                        <span className="text-gray-700">|</span>
                        <span>Based on <a href="https://deep-ml.com" className="text-cyan-400 hover:underline" target="_blank" rel="noopener">Deep-ML</a></span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-500">
                        <Link className="hover:text-cyan-400 transition-colors font-mono text-sm" href="/about">[About]</Link>
                        <a className="hover:text-cyan-400 transition-colors font-mono text-sm" href="https://github.com/neuronlab-id" target="_blank" rel="noopener">[GitHub]</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
