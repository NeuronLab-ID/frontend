"use client";

import { HiExclamationCircle, HiRefresh, HiClock, HiFilm } from "react-icons/hi";

interface AnimationPlayerProps {
    videoUrl?: string;
    stepNumber: number;
    status: "pending" | "rendering" | "completed" | "error";
    errorMessage?: string;
    renderTimeMs?: number;
    videoType?: "visualization" | "calculation";
    onRetry?: () => void;
}

export function AnimationPlayer({ 
    videoUrl, 
    stepNumber, 
    status, 
    errorMessage, 
    renderTimeMs, 
    videoType,
    onRetry 
}: AnimationPlayerProps) {
    
    // Container base classes matching existing app theme
    const containerClasses = "rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 bg-zinc-50 dark:bg-zinc-800/50 transition-all duration-300";

    const typeLabel = videoType ? (
        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-2 ${
            videoType === "visualization" 
                ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
        }`}>
            <HiFilm className="w-3 h-3" />
            {videoType === "visualization" ? "Visualization" : "Calculation"}
        </div>
    ) : null;

    if (status === "pending") {
        return (
            <div className={containerClasses}>
                {typeLabel}
                <div className="flex items-center gap-3">
                    <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-zinc-500"></span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                        <HiFilm className="w-4 h-4" />
                        <span>Animation queued for step {stepNumber}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (status === "rendering") {
        return (
            <div className={containerClasses}>
                {typeLabel}
                <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent dark:border-indigo-400 dark:border-t-transparent"></div>
                    <span className="text-zinc-600 dark:text-zinc-300 text-sm font-medium animate-pulse">
                        Rendering step {stepNumber}...
                    </span>
                </div>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className={`${containerClasses} border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10`}>
                {typeLabel}
                <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                        <HiExclamationCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">
                                Animation Failed
                            </h4>
                            <p className="text-xs text-red-600 dark:text-red-400 line-clamp-3 break-words font-mono bg-red-100/50 dark:bg-red-950/30 p-2 rounded">
                                {errorMessage || "Unknown rendering error occurred"}
                            </p>
                        </div>
                    </div>
                    
                    {onRetry && (
                        <div className="flex justify-end mt-1">
                            <button
                                onClick={onRetry}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md
                                         bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700
                                         text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700
                                         hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm"
                            >
                                <HiRefresh className="w-3.5 h-3.5" />
                                Retry Animation
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Completed state
    return (
        <div className={containerClasses}>
            <div className="flex flex-col items-center gap-3 w-full">
                {typeLabel}
                <video
                    controls
                    preload="metadata"
                    autoPlay={false}
                    src={videoUrl}
                    className="w-full max-w-lg rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700/50 bg-black"
                >
                    Your browser does not support the video tag.
                </video>
                
                {renderTimeMs !== undefined && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-700/50 border border-zinc-200 dark:border-zinc-600/30">
                        <HiClock className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                        <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 font-medium">
                            {(renderTimeMs / 1000).toFixed(1)}s render
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
