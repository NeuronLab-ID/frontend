import { useState, useEffect, useCallback, useRef } from "react";
import { generateManimAnimation, getManimStatus, getManimVideoUrl } from "@/lib/api";
import type { ManimAnimation, ManimStatus } from "@/types";

const POLL_INTERVAL_MS = 5000;

interface UseManimAnimationsResult {
    animations: ManimAnimation[];
    isGenerating: boolean;
    error: string | null;
    generateAll: (problemId: number) => Promise<void>;
    generateStep: (problemId: number, stepNumber: number) => Promise<void>;
    refreshStatus: (problemId: number) => Promise<void>;
    getVideoUrl: (problemId: number, stepNumber: number, videoType?: string) => string;
    getAnimationsByStep: (stepNumber: number) => { visualization?: ManimAnimation; calculation?: ManimAnimation };
}

export function useManimAnimations(): UseManimAnimationsResult {
     const [animations, setAnimations] = useState<ManimAnimation[]>([]);
     const [isGenerating, setIsGenerating] = useState(false);
     const [error, setError] = useState<string | null>(null);
     const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopPolling = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    }, []);

    const refreshStatus = useCallback(async (pid: number) => {
        try {
            const status: ManimStatus = await getManimStatus(pid);
            setAnimations(status.animations);

            const hasActive = status.renderingCount > 0 || status.animations.some(a => a.status === "pending");
            setIsGenerating(hasActive);

            if (!hasActive) {
                stopPolling();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch animation status");
            stopPolling();
        }
    }, [stopPolling]);

    const startPolling = useCallback((pid: number) => {
        stopPolling();
        pollIntervalRef.current = setInterval(() => {
            refreshStatus(pid);
        }, POLL_INTERVAL_MS);
    }, [stopPolling, refreshStatus]);

    const generateAll = useCallback(async (pid: number) => {
        setError(null);
        setIsGenerating(true);
        try {
            await generateManimAnimation(pid);
            startPolling(pid);
            await refreshStatus(pid);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate animations");
            setIsGenerating(false);
        }
    }, [startPolling, refreshStatus]);

    const generateStep = useCallback(async (pid: number, stepNumber: number) => {
        setError(null);
        setIsGenerating(true);
        try {
            await generateManimAnimation(pid, stepNumber);
            startPolling(pid);
            await refreshStatus(pid);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate animation");
            setIsGenerating(false);
        }
    }, [startPolling, refreshStatus]);

     const getVideoUrl = useCallback((pid: number, stepNumber: number, videoType?: string): string => {
         return getManimVideoUrl(pid, stepNumber, videoType);
     }, []);

     const getAnimationsByStep = useCallback((stepNumber: number) => {
         const stepAnims = animations.filter(a => a.stepNumber === stepNumber);
         return {
             visualization: stepAnims.find(a => a.videoType === "visualization"),
             calculation: stepAnims.find(a => a.videoType === "calculation"),
         };
     }, [animations]);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            stopPolling();
        };
    }, [stopPolling]);

     return {
         animations,
         isGenerating,
         error,
         generateAll,
         generateStep,
         refreshStatus,
         getVideoUrl,
         getAnimationsByStep,
     };
}
