import Link from "next/link";
import AuthNavButtons from "@/components/AuthNavButtons";

export default function LandingPage() {
  return (
    <div className="min-h-screen text-white flex flex-col overflow-x-hidden bg-[#0d0d14] selection:bg-cyan-400/30 font-mono">
      {/* Pixel grid background */}
      <div className="fixed inset-0 -z-10 opacity-10" style={{
        backgroundImage: `
          linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px'
      }} />

      {/* Glow effects */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[150px] -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-[120px] -z-10" />

      {/* TopNavBar - Pixel Style */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b-2 border-cyan-400/30 bg-[#0d0d14]/95 backdrop-blur-sm px-6 lg:px-20 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/mascot_icon.png" alt="NeuronLab" className="size-10 object-contain" />
            <h2 className="text-cyan-400 text-xl font-bold tracking-widest uppercase">NeuronLab</h2>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link className="text-gray-400 text-sm font-medium uppercase tracking-wider transition-colors hover:text-cyan-400 hover:underline underline-offset-4" href="/problems">[Problems]</Link>

            <Link className="text-gray-400 text-sm font-medium uppercase tracking-wider transition-colors hover:text-yellow-400 hover:underline underline-offset-4" href="/about">[About]</Link>
          </nav>
          <AuthNavButtons />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-24 px-6 lg:px-20 pb-20">
        <div className="max-w-7xl mx-auto flex flex-col gap-24">

          {/* HeroSection - Terminal Style */}
          <section className="relative py-16 lg:py-24 flex flex-col items-center text-center gap-8">
            {/* ASCII Art Logo */}
            <pre className="text-cyan-400 text-xs md:text-sm leading-tight hidden md:block opacity-80">
              {`
    ███╗   ██╗███████╗██╗   ██╗██████╗  ██████╗ ███╗   ██╗██╗      █████╗ ██████╗ 
    ████╗  ██║██╔════╝██║   ██║██╔══██╗██╔═══██╗████╗  ██║██║     ██╔══██╗██╔══██╗
    ██╔██╗ ██║█████╗  ██║   ██║██████╔╝██║   ██║██╔██╗ ██║██║     ███████║██████╔╝
    ██║╚██╗██║██╔══╝  ██║   ██║██╔══██╗██║   ██║██║╚██╗██║██║     ██╔══██║██╔══██╗
    ██║ ╚████║███████╗╚██████╔╝██║  ██║╚██████╔╝██║ ╚████║███████╗██║  ██║██████╔╝
    ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝╚═════╝ 
`}
            </pre>

            <div className="flex flex-col gap-6 max-w-4xl mx-auto z-10">
              <div className="inline-flex items-center gap-2 text-yellow-400 text-sm uppercase tracking-widest mx-auto">
                <span className="animate-pulse">●</span>
                <span>Self-Host Your ML Learning Journey</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-white">Master </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-magenta-400">Machine Learning</span>
                <br />
                <span className="text-white">Through </span>
                <span className="text-cyan-400">Practice_</span>
                <span className="animate-pulse text-cyan-400">▌</span>
              </h1>

              <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto border-l-2 border-cyan-400/50 pl-4">
                &gt; 270+ coding problems with step-by-step learning paths<br />
                &gt; Practice Linear Algebra, ML algorithms, Deep Learning<br />
                &gt; All in your browser — no setup required
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto z-10">
              <Link href="/problems" className="group flex items-center justify-center gap-2 border-2 border-cyan-400 bg-cyan-400 hover:bg-cyan-300 px-8 py-3 text-black text-base font-bold uppercase tracking-wider transition-all hover:shadow-[0_0_30px_rgba(0,255,255,0.5)]">
                <span>&gt; Start Learning</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link href="/problems" className="flex items-center justify-center border-2 border-purple-400/50 hover:border-purple-400 bg-purple-400/10 hover:bg-purple-400/20 px-8 py-3 text-purple-400 text-base font-bold uppercase tracking-wider transition-all">
                <span>[ Browse Problems ]</span>
              </Link>
            </div>

            {/* Stats - Pixel Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mt-8">
              <div className="border-2 border-cyan-400/30 bg-cyan-400/5 p-6 hover:border-cyan-400 hover:bg-cyan-400/10 transition-all group">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-cyan-400 text-2xl">◆</span>
                  <span className="text-4xl font-bold text-cyan-400 group-hover:animate-pulse">270</span>
                </div>
                <p className="text-gray-500 text-sm uppercase tracking-widest">Problems</p>
              </div>
              <div className="border-2 border-purple-400/30 bg-purple-400/5 p-6 hover:border-purple-400 hover:bg-purple-400/10 transition-all group">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-purple-400 text-2xl">◇</span>
                  <span className="text-4xl font-bold text-purple-400 group-hover:animate-pulse">52</span>
                </div>
                <p className="text-gray-500 text-sm uppercase tracking-widest">Learning Paths</p>
              </div>
              <div className="border-2 border-yellow-400/30 bg-yellow-400/5 p-6 hover:border-yellow-400 hover:bg-yellow-400/10 transition-all group">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-yellow-400 text-2xl">○</span>
                  <span className="text-4xl font-bold text-yellow-400 group-hover:animate-pulse">5</span>
                </div>
                <p className="text-gray-500 text-sm uppercase tracking-widest">Categories</p>
              </div>
            </div>
          </section>

          {/* Problem Preview - Jules Style */}
          <section className="relative py-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Code Editor Preview */}
              <div className="lg:col-span-2 border-2 border-gray-700 bg-[#1a1a2e] rounded-lg overflow-hidden">
                {/* Editor Header */}
                <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center gap-3">
                  <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/70" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <span className="w-3 h-3 rounded-full bg-green-500/70" />
                  </div>
                  <span className="text-gray-400 text-sm">matrix_multiply.py</span>
                  <span className="ml-auto text-xs text-cyan-400 border border-cyan-400/30 px-2 py-0.5 rounded">Linear Algebra</span>
                </div>

                {/* Code Content */}
                <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto">
                  <div className="flex flex-col whitespace-pre">
                    <div><span className="text-gray-600 inline-block w-8">1</span><span className="text-gray-500"># Objective: Implement matrix multiplication</span></div>
                    <div><span className="text-gray-600 inline-block w-8">2</span></div>
                    <div><span className="text-gray-600 inline-block w-8">3</span><span className="text-purple-400">def</span> <span className="text-yellow-400">matrix_multiply</span><span className="text-white">(A, B):</span></div>
                    <div><span className="text-gray-600 inline-block w-8">4</span><span className="text-gray-500">    &quot;&quot;&quot;Multiply two matrices A and B&quot;&quot;&quot;</span></div>
                    <div><span className="text-gray-600 inline-block w-8">5</span><span className="text-white">    rows_A = </span><span className="text-cyan-400">len</span><span className="text-white">(A)</span></div>
                    <div><span className="text-gray-600 inline-block w-8">6</span><span className="text-white">    cols_B = </span><span className="text-cyan-400">len</span><span className="text-white">(B[</span><span className="text-orange-400">0</span><span className="text-white">])</span></div>
                    <div><span className="text-gray-600 inline-block w-8">7</span><span className="text-white">    result = [[</span><span className="text-orange-400">0</span><span className="text-white">] * cols_B </span><span className="text-purple-400">for</span><span className="text-white"> _ </span><span className="text-purple-400">in</span> <span className="text-cyan-400">range</span><span className="text-white">(rows_A)]</span></div>
                    <div><span className="text-gray-600 inline-block w-8">8</span></div>
                    <div><span className="text-gray-600 inline-block w-8">9</span><span className="text-white">    </span><span className="text-purple-400">for</span><span className="text-white"> i </span><span className="text-purple-400">in</span> <span className="text-cyan-400">range</span><span className="text-white">(rows_A):</span></div>
                    <div><span className="text-gray-600 inline-block w-8">10</span><span className="text-white">        </span><span className="text-purple-400">for</span><span className="text-white"> j </span><span className="text-purple-400">in</span> <span className="text-cyan-400">range</span><span className="text-white">(cols_B):</span></div>
                    <div><span className="text-gray-600 inline-block w-8">11</span><span className="text-white">            </span><span className="text-gray-500"># Your code here</span></div>
                    <div><span className="text-gray-600 inline-block w-8">12</span><span className="text-white">            </span><span className="text-purple-400">pass</span></div>
                    <div><span className="text-gray-600 inline-block w-8">13</span></div>
                    <div><span className="text-gray-600 inline-block w-8">14</span><span className="text-white">    </span><span className="text-purple-400">return</span><span className="text-white"> result</span></div>
                  </div>
                </div>

                {/* LaTeX Formula Panel */}
                <div className="border-t-2 border-gray-700 bg-[#1a1a2e]/80 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-cyan-400 text-lg">∑</span>
                    <span className="text-gray-400 text-sm uppercase tracking-wider">Key Formula</span>
                    <span className="ml-auto text-xs text-purple-400 border border-purple-400/30 px-2 py-0.5 rounded">Matrix Multiplication</span>
                  </div>
                  <div className="text-center py-4 text-xl text-white font-serif">
                    <span className="text-cyan-400">C</span><sub className="text-gray-400">ij</sub>
                    <span className="text-white mx-2">=</span>
                    <span className="text-yellow-400">∑</span><sub className="text-gray-400">k=1</sub><sup className="text-gray-400">n</sup>
                    <span className="text-purple-400 mx-1">A</span><sub className="text-gray-400">ik</sub>
                    <span className="text-white mx-1">·</span>
                    <span className="text-green-400">B</span><sub className="text-gray-400">kj</sub>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center mt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 bg-cyan-400 rounded"></span>
                      <span className="text-gray-400">Result matrix</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 bg-purple-400 rounded"></span>
                      <span className="text-gray-400">Input A</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 bg-green-400 rounded"></span>
                      <span className="text-gray-400">Input B</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Callout */}
              <div className="border-2 border-purple-400/30 bg-purple-400/5 rounded-lg p-8 flex flex-col items-center justify-center text-center">
                <img src="/images/mascot_celebrate.png" alt="Celebrating Mascot" className="w-74 h-74 object-contain mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  NeuronLab solves ML problems you
                  <br />
                  <span className="underline decoration-cyan-400 decoration-2 underline-offset-4">want to learn</span>.
                </h3>
                <div className="flex flex-wrap gap-2 justify-center mt-6">
                  <span className="border-2 border-cyan-400 bg-cyan-400/10 text-cyan-400 px-3 py-1.5 text-sm font-bold">Matrix Ops</span>
                  <span className="border-2 border-purple-400 bg-purple-400/10 text-purple-400 px-3 py-1.5 text-sm font-bold">Regression</span>
                  <span className="border-2 border-yellow-400 bg-yellow-400/10 text-yellow-400 px-3 py-1.5 text-sm font-bold">Neural Nets</span>
                  <span className="border-2 border-green-400 bg-green-400/10 text-green-400 px-3 py-1.5 text-sm font-bold">Backprop</span>
                </div>
              </div>
            </div>

            {/* Tagline */}
            <p className="text-center text-gray-400 mt-8 text-lg">
              More time for the concepts you <span className="underline decoration-cyan-400">want</span> to master, and everything else.
            </p>
          </section>

          {/* AI Features Visualization */}
          <section>
            {/* Pixel Art Banner */}
            <div className="flex justify-center gap-8 mb-8">
              <img src="/images/pixel-coder.png" alt="Coder" className="w-75 h-75 object-contain hover:scale-110 transition-transform" />
              <img src="/images/pixel-brain.png" alt="AI Brain" className="w-75 h-75 object-contain hover:scale-110 transition-transform" />
              <img src="/images/pixel-stats.png" alt="Statistics" className="w-75 h-75 object-contain hover:scale-110 transition-transform" />
              <img src="/images/pixel-math.png" alt="Math" className="w-75 h-75 object-contain hover:scale-110 transition-transform" />
            </div>

            <div className="py-4 flex flex-col gap-4 text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold">
                <span className="text-gray-500">&gt; </span>
                <span className="text-white">AI-Powered Learning</span>
                <span className="text-purple-400">_</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Get unstuck with intelligent hints and practice with generated examples
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Hint Demo */}
              <div className="border-2 border-yellow-400/30 bg-[#1a1a2e] rounded-lg overflow-hidden group hover:border-yellow-400/60 transition-all">
                <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center gap-3">
                  <span className="text-yellow-400">💡</span>
                  <span className="text-gray-400 text-sm">AI Hint Generator</span>
                  <span className="ml-auto text-xs bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded">GPT-4o</span>
                </div>
                <div className="p-6">
                  {/* User stuck message */}
                  <div className="flex gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-cyan-400/20 flex items-center justify-center text-cyan-400 text-sm">👤</div>
                    <div className="flex-1 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                      <p className="text-gray-300 text-sm">I&apos;m stuck on implementing the dot product...</p>
                    </div>
                  </div>

                  {/* AI Response with typing animation */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center text-yellow-400 text-sm">🤖</div>
                    <div className="flex-1 bg-yellow-400/5 rounded-lg p-3 border border-yellow-400/30">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-yellow-400 text-xs font-bold uppercase">Hint</span>
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm">
                        Think about iterating through both vectors simultaneously.
                        For each index <span className="text-cyan-400 font-mono">i</span>, multiply
                        <span className="text-purple-400 font-mono"> A[i] * B[i]</span> and accumulate the sum.
                      </p>
                    </div>
                  </div>

                  {/* Hint levels */}
                  <div className="flex gap-2 mt-4 justify-end">
                    <button className="text-xs px-3 py-1 border border-gray-600 text-gray-400 rounded hover:border-yellow-400 hover:text-yellow-400 transition-colors">Hint 1</button>
                    <button className="text-xs px-3 py-1 border border-yellow-400 bg-yellow-400/10 text-yellow-400 rounded">Hint 2</button>
                    <button className="text-xs px-3 py-1 border border-gray-600 text-gray-400 rounded hover:border-yellow-400 hover:text-yellow-400 transition-colors">Hint 3</button>
                  </div>
                </div>
              </div>

              {/* Math Sample Generator Demo */}
              <div className="border-2 border-green-400/30 bg-[#1a1a2e] rounded-lg overflow-hidden group hover:border-green-400/60 transition-all">
                <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center gap-3">
                  <span className="text-green-400">📐</span>
                  <span className="text-gray-400 text-sm">Math Sample Generator</span>
                  <span className="ml-auto text-xs bg-green-400/20 text-green-400 px-2 py-0.5 rounded">5-7 steps</span>
                </div>
                <div className="p-6">
                  {/* Formula */}
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 mb-4">
                    <div className="text-gray-400 text-xs mb-2">Euclidean Distance</div>
                    <div className="text-center text-lg text-white font-serif">
                      d = √(<span className="text-cyan-400">x₂</span> - <span className="text-purple-400">x₁</span>)² + (<span className="text-cyan-400">y₂</span> - <span className="text-purple-400">y₁</span>)²
                    </div>
                  </div>

                  {/* Generated Example */}
                  <div className="bg-green-400/5 rounded-lg p-4 border border-green-400/30">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-green-400 text-xs font-bold uppercase">Generated Example</span>
                      <span className="text-green-400 animate-pulse">●</span>
                    </div>
                    <div className="space-y-2 text-sm font-mono">
                      <div><span className="text-gray-500">Given:</span> <span className="text-white">u = [2, 3] and v = [5, 7]</span></div>
                      <div><span className="text-gray-500">Step 1:</span> <span className="text-white">x₂ - x₁ = 5 - 2 = </span><span className="text-cyan-400">3</span></div>
                      <div><span className="text-gray-500">Step 2:</span> <span className="text-white">y₂ - y₁ = 7 - 3 = </span><span className="text-cyan-400">4</span></div>
                      <div><span className="text-gray-500">Step 3:</span> <span className="text-white">d = √(3² + 4²) = √25 = </span><span className="text-green-400 font-bold">5</span></div>
                    </div>
                  </div>

                  {/* Complexity selector */}
                  <div className="flex gap-2 mt-4">
                    <button className="text-xs px-3 py-1 border border-gray-600 text-gray-400 rounded hover:border-green-400 hover:text-green-400 transition-colors">2-3 steps</button>
                    <button className="text-xs px-3 py-1 border border-gray-600 text-gray-400 rounded hover:border-green-400 hover:text-green-400 transition-colors">3-5 steps</button>
                    <button className="text-xs px-3 py-1 border border-green-400 bg-green-400/10 text-green-400 rounded">5-7 steps</button>
                    <button className="ml-auto text-xs px-3 py-1 border border-green-400 text-green-400 rounded flex items-center gap-1 hover:bg-green-400/10 transition-colors">
                      <span className="inline-block group-hover:animate-spin">↻</span> Regenerate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works - Mascot Section */}
          <section className="relative py-20 overflow-hidden">
            {/* Floating Math Formulas Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Animated formulas - Left side */}
              <span className="absolute text-cyan-400/20 text-2xl font-serif animate-float-slow" style={{ top: '5%', left: '3%' }}>∑</span>
              <span className="absolute text-purple-400/20 text-3xl font-serif animate-float-medium" style={{ top: '12%', left: '12%' }}>∫</span>
              <span className="absolute text-yellow-400/20 text-xl font-serif animate-float-fast" style={{ top: '8%', left: '22%' }}>∂x</span>
              <span className="absolute text-pink-400/20 text-2xl font-serif animate-float-slow" style={{ top: '25%', left: '5%' }}>∇</span>
              <span className="absolute text-cyan-400/20 text-xl font-serif animate-float-medium" style={{ top: '35%', left: '18%' }}>λ</span>
              <span className="absolute text-green-400/20 text-3xl font-serif animate-float-fast" style={{ top: '45%', left: '8%' }}>σ²</span>
              <span className="absolute text-purple-400/20 text-2xl font-serif animate-float-slow" style={{ top: '55%', left: '15%' }}>π</span>
              <span className="absolute text-yellow-400/20 text-xl font-serif animate-float-medium" style={{ top: '65%', left: '3%' }}>α</span>
              <span className="absolute text-cyan-400/20 text-2xl font-serif animate-float-fast" style={{ top: '75%', left: '20%' }}>β</span>
              <span className="absolute text-pink-400/20 text-3xl font-serif animate-float-slow" style={{ top: '85%', left: '10%' }}>γ</span>
              <span className="absolute text-green-400/20 text-xl font-serif animate-float-medium" style={{ top: '92%', left: '25%' }}>ε</span>

              {/* Animated formulas - Right side */}
              <span className="absolute text-cyan-400/20 text-2xl font-serif animate-float-medium" style={{ top: '5%', right: '5%' }}>θ</span>
              <span className="absolute text-yellow-400/20 text-3xl font-serif animate-float-slow" style={{ top: '15%', right: '15%' }}>∏</span>
              <span className="absolute text-pink-400/20 text-xl font-serif animate-float-fast" style={{ top: '10%', right: '25%' }}>dx</span>
              <span className="absolute text-purple-400/20 text-2xl font-serif animate-float-medium" style={{ top: '28%', right: '8%' }}>∞</span>
              <span className="absolute text-green-400/20 text-xl font-serif animate-float-slow" style={{ top: '40%', right: '18%' }}>μ</span>
              <span className="absolute text-cyan-400/20 text-3xl font-serif animate-float-fast" style={{ top: '50%', right: '5%' }}>Σxᵢ</span>
              <span className="absolute text-yellow-400/20 text-2xl font-serif animate-float-medium" style={{ top: '60%', right: '22%' }}>∂f/∂x</span>
              <span className="absolute text-purple-400/20 text-xl font-serif animate-float-slow" style={{ top: '70%', right: '10%' }}>ω</span>
              <span className="absolute text-pink-400/20 text-2xl font-serif animate-float-fast" style={{ top: '80%', right: '20%' }}>δ</span>
              <span className="absolute text-green-400/20 text-3xl font-serif animate-float-medium" style={{ top: '88%', right: '8%' }}>η</span>
              <span className="absolute text-cyan-400/20 text-xl font-serif animate-float-slow" style={{ top: '95%', right: '28%' }}>ζ</span>

              {/* Extra symbols scattered */}
              <span className="absolute text-purple-400/15 text-4xl font-serif animate-float-slow" style={{ top: '20%', left: '35%' }}>∮</span>
              <span className="absolute text-cyan-400/15 text-4xl font-serif animate-float-medium" style={{ top: '75%', right: '35%' }}>∬</span>
              <span className="absolute text-yellow-400/15 text-2xl font-serif animate-float-fast" style={{ top: '50%', left: '2%' }}>√</span>
              <span className="absolute text-green-400/15 text-2xl font-serif animate-float-slow" style={{ top: '50%', right: '2%' }}>Δ</span>
            </div>

            {/* Content Grid */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              {/* Left Feature Cards */}
              <div className="flex flex-col gap-6">
                <div className="border-2 border-cyan-400/30 bg-[#1a1a2e]/80 rounded-lg p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-cyan-400 text-xl">📝</span>
                    <h3 className="text-lg font-bold text-white">270+ Problems</h3>
                  </div>
                  <p className="text-gray-400 text-sm">
                    From basic linear algebra to advanced deep learning architectures.
                  </p>
                </div>

                <div className="border-2 border-yellow-400/30 bg-[#1a1a2e]/80 rounded-lg p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-yellow-400 text-xl">💡</span>
                    <h3 className="text-lg font-bold text-white">AI Hints</h3>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Get stuck? GPT-4o provides progressive hints without spoiling the solution.
                  </p>
                </div>
              </div>

              {/* Center Mascot */}
              <div className="flex flex-col items-center justify-center">
                <img
                  src="/images/mascot.png"
                  alt="NeuronLab Mascot"
                  className="w-96 h-96 md:w-[28rem] md:h-[28rem] object-contain hover:scale-105 transition-transform"
                />
                <h2 className="text-2xl md:text-3xl font-bold text-center mt-4">
                  <span className="text-gray-500">&gt; </span>
                  <span className="text-white">How It Works</span>
                  <span className="text-cyan-400 animate-pulse">_</span>
                </h2>
              </div>

              {/* Right Feature Cards */}
              <div className="flex flex-col gap-6">
                <div className="border-2 border-purple-400/30 bg-[#1a1a2e]/80 rounded-lg p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-purple-400 text-xl">🧪</span>
                    <h3 className="text-lg font-bold text-white">Instant Testing</h3>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Run your code in a sandboxed environment with real test cases.
                  </p>
                </div>

                <div className="border-2 border-green-400/30 bg-[#1a1a2e]/80 rounded-lg p-5 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-green-400 text-xl">📐</span>
                    <h3 className="text-lg font-bold text-white">Math Samples</h3>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Generate step-by-step examples for any formula to understand the math.
                  </p>
                </div>
              </div>
            </div>

          </section>

          {/* Categories - Pixel Cards */}
          <section className="flex flex-col gap-10 py-10">
            <div className="flex flex-col gap-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold">
                <span className="text-gray-500">&gt; </span>
                <span className="text-white">What You&apos;ll Learn</span>
                <span className="text-cyan-400">_</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Comprehensive curriculum from mathematical foundations to deployment
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Category Cards */}
              {[
                { name: "Linear Algebra", icon: "/images/icon-linear-algebra.png", color: "cyan", count: 45 },
                { name: "Machine Learning", icon: "/images/icon-machine-learning.png", color: "purple", count: 80 },
                { name: "Deep Learning", icon: "/images/icon-deep-learning.png", color: "magenta", count: 65 },
                { name: "NLP", icon: "/images/icon-nlp.png", color: "yellow", count: 40 },
                { name: "Computer Vision", icon: "/images/icon-cv.png", color: "green", count: 40 },
              ].map((cat, i) => (
                <Link
                  key={i}
                  href="/problems"
                  className={`border-2 border-${cat.color}-400/30 bg-${cat.color}-400/5 p-6 hover:border-${cat.color}-400 hover:bg-${cat.color}-400/10 transition-all group cursor-pointer`}
                  style={{
                    borderColor: `var(--${cat.color}-color, rgba(${cat.color === 'cyan' ? '0,255,255' :
                      cat.color === 'purple' ? '168,85,247' :
                        cat.color === 'magenta' ? '255,0,255' :
                          cat.color === 'yellow' ? '250,204,21' :
                            '34,197,94'
                      },0.3))`
                  }}
                >
                  <img src={cat.icon} alt={cat.name} className="w-12 h-12 mb-4 object-contain mix-blend-lighten" />
                  <h3 className="text-lg font-bold text-white mb-1">{cat.name}</h3>
                  <p className="text-gray-500 text-sm uppercase tracking-wider">{cat.count} problems</p>
                </Link>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="border-2 border-cyan-400/30 bg-gradient-to-br from-cyan-400/5 to-purple-400/5 p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-cyan-400">&gt; </span>
              <span className="text-white">Ready to start coding?</span>
              <span className="animate-pulse text-cyan-400">_</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of developers mastering ML through hands-on practice
            </p>
            <Link href="/problems" className="inline-flex items-center justify-center gap-2 border-2 border-cyan-400 bg-cyan-400 hover:bg-cyan-300 px-10 py-4 text-black text-lg font-bold uppercase tracking-wider transition-all hover:shadow-[0_0_40px_rgba(0,255,255,0.5)]">
              <span>&gt; Get Started Free</span>
              <span>→</span>
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
            <a className="hover:text-cyan-400 transition-colors font-mono text-sm" href="/about">[About]</a>
            <a className="hover:text-cyan-400 transition-colors font-mono text-sm" href="https://github.com/neuronlab-id" target="_blank" rel="noopener">[GitHub]</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
