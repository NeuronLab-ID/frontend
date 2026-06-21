import { useState, useEffect, useCallback, useRef } from "react";
import { cancelManimJob, createManimJob, getManimBackends, getManimJob, getManimStatus, getManimVideoUrl, retryManimJob } from "@/lib/api";
import type {
    CreateManimJobResponse,
    ManimAnimation,
    ManimBackend,
    ManimBackendName,
    ManimJob,
    ManimJobStatus,
    ManimStatus,
    ManimVideoType,
} from "@/types";

const POLL_INTERVAL_MS = 5000;
const ACTIVE_JOB_STATUSES: ManimJobStatus[] = ["queued", "generating_code", "rendering", "cancelling"];
const TERMINAL_JOB_STATUSES: ManimJobStatus[] = [
    "succeeded",
    "failed_retryable",
    "failed_terminal",
    "cancelled",
    "orphaned",
];
const FAILED_DISPLAY_STATUSES: ManimJobStatus[] = ["failed_retryable", "failed_terminal", "orphaned"];

interface UseManimAnimationsResult {
    animations: ManimAnimation[];
    isGenerating: boolean;
    error: string | null;
    backends: ManimBackend[];
    defaultBackend: ManimBackendName;
    selectedBackend: ManimBackendName;
    setSelectedBackend: (backend: ManimBackendName) => void;
    jobs: ManimJob[];
    activeJobs: ManimJob[];
    failedJobs: ManimJob[];
    generateAll: (problemId: number) => Promise<void>;
    generateStep: (problemId: number, stepNumber: number, videoType?: ManimVideoType) => Promise<void>;
    cancelJob: (jobId: string) => Promise<void>;
    retryJob: (jobId: string) => Promise<void>;
    refreshStatus: (problemId: number) => Promise<void>;
    getVideoUrl: (problemId: number, stepNumber: number, videoType?: string) => string;
    getAnimationsByStep: (stepNumber: number) => { visualization?: ManimAnimation; calculation?: ManimAnimation };
}

function isActiveJobStatus(status: ManimJobStatus): boolean {
    return ACTIVE_JOB_STATUSES.includes(status);
}

function isTerminalJobStatus(status: ManimJobStatus): boolean {
    return TERMINAL_JOB_STATUSES.includes(status);
}

function isFailedDisplayStatus(status: ManimJobStatus): boolean {
    return FAILED_DISPLAY_STATUSES.includes(status);
}

function getJobProgress(job: ManimJob): number {
    return typeof job.progress === "number" ? job.progress : 0;
}

function hasActiveTrackedJobs(entries: Array<{ job: ManimJob }>): boolean {
    return entries.some(entry => isActiveJobStatus(entry.job.status));
}

export function useManimAnimations(): UseManimAnimationsResult {
    const [animations, setAnimations] = useState<ManimAnimation[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [backends, setBackends] = useState<ManimBackend[]>([]);
    const [defaultBackend, setDefaultBackend] = useState<ManimBackendName>("cpu");
    const [selectedBackend, setSelectedBackend] = useState<ManimBackendName>("cpu");
    const [jobs, setJobs] = useState<ManimJob[]>([]);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const activeJobsRef = useRef<Map<string, { problemId: number; job: ManimJob }>>(new Map());

    const stopPolling = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    }, []);

    const syncJobsState = useCallback(() => {
        const nextJobs = Array.from(activeJobsRef.current.values())
            .map(entry => entry.job)
            .sort((left, right) => getJobProgress(right) - getJobProgress(left));
        setJobs(nextJobs);
        setIsGenerating(nextJobs.some(job => isActiveJobStatus(job.status)));
    }, []);

    const refreshStatus = useCallback(async (pid: number) => {
        try {
            const status: ManimStatus = await getManimStatus(pid);
            setAnimations(status.animations);

            if (!hasActiveTrackedJobs(Array.from(activeJobsRef.current.values()))) {
                const hasLegacyActive = status.renderingCount > 0 || status.animations.some(animation => animation.status === "pending");
                setIsGenerating(hasLegacyActive);
                if (!hasLegacyActive) {
                    stopPolling();
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch animation status");
            stopPolling();
        }
    }, [stopPolling]);

    const pollJobs = useCallback(async () => {
        const entries = Array.from(activeJobsRef.current.entries()).filter(([, current]) => isActiveJobStatus(current.job.status));

        if (entries.length === 0) {
            syncJobsState();
            stopPolling();
            return;
        }

        try {
            const updatedJobs = await Promise.all(entries.map(([jobId]) => getManimJob(jobId)));
            const terminalProblemIds = new Set<number>();

            updatedJobs.forEach((job, index) => {
                const [jobId, current] = entries[index];
                activeJobsRef.current.set(jobId, { ...current, job });

                if (isTerminalJobStatus(job.status)) {
                    terminalProblemIds.add(current.problemId);
                }
            });

            syncJobsState();

            await Promise.all(Array.from(terminalProblemIds).map(problemId => refreshStatus(problemId)));

            if (!hasActiveTrackedJobs(Array.from(activeJobsRef.current.values()))) {
                stopPolling();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch animation job status");
            stopPolling();
            syncJobsState();
        }
    }, [refreshStatus, stopPolling, syncJobsState]);

    const startPolling = useCallback(() => {
        if (pollIntervalRef.current) {
            return;
        }

        pollIntervalRef.current = setInterval(() => {
            void pollJobs();
        }, POLL_INTERVAL_MS);
    }, [pollJobs]);

    const trackJob = useCallback((problemId: number, response: CreateManimJobResponse) => {
        const job: ManimJob = {
            jobId: response.jobId,
            status: response.status,
            problemId,
            statusUrl: response.statusUrl,
            eventsUrl: response.eventsUrl,
            progress: 0,
            requestedBackend: selectedBackend,
        };

        activeJobsRef.current.set(response.jobId, { problemId, job });
        syncJobsState();

        if (isActiveJobStatus(response.status)) {
            startPolling();
        } else {
            void refreshStatus(problemId);
        }
    }, [refreshStatus, selectedBackend, startPolling, syncJobsState]);

    const submitJob = useCallback(async (pid: number, stepNumber?: number, videoType?: ManimVideoType) => {
        setError(null);
        setIsGenerating(true);
        try {
            const response = await createManimJob(pid, stepNumber, videoType, selectedBackend);
            trackJob(pid, response);
            await pollJobs();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate animation");
            setIsGenerating(hasActiveTrackedJobs(Array.from(activeJobsRef.current.values())));
        }
    }, [pollJobs, selectedBackend, trackJob]);

    const generateAll = useCallback(async (pid: number) => {
        await submitJob(pid);
    }, [submitJob]);

    const generateStep = useCallback(async (pid: number, stepNumber: number, videoType?: ManimVideoType) => {
        await submitJob(pid, stepNumber, videoType);
    }, [submitJob]);

    const cancelJob = useCallback(async (jobId: string) => {
        setError(null);
        try {
            const result = await cancelManimJob(jobId);
            const current = activeJobsRef.current.get(jobId);
            if (current) {
                activeJobsRef.current.set(jobId, {
                    ...current,
                    job: { ...current.job, status: result.status },
                });
                syncJobsState();
                if (isActiveJobStatus(result.status)) {
                    startPolling();
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to cancel animation job");
        }
    }, [startPolling, syncJobsState]);

    const retryJob = useCallback(async (jobId: string) => {
        setError(null);
        const original = activeJobsRef.current.get(jobId);
        if (!original) {
            setError("Cannot retry: original job is no longer tracked");
            return;
        }
        try {
            const response = await retryManimJob(jobId);
            trackJob(original.problemId, response);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to retry animation job");
        }
    }, [trackJob]);

    const getVideoUrl = useCallback((pid: number, stepNumber: number, videoType?: string): string => {
        return getManimVideoUrl(pid, stepNumber, videoType);
    }, []);

    const getAnimationsByStep = useCallback((stepNumber: number) => {
        const stepAnims = animations.filter(animation => animation.stepNumber === stepNumber);
        return {
            visualization: stepAnims.find(animation => animation.videoType === "visualization"),
            calculation: stepAnims.find(animation => animation.videoType === "calculation"),
        };
    }, [animations]);

    useEffect(() => {
        let cancelled = false;

        async function loadBackends() {
            try {
                const availability = await getManimBackends();

                if (cancelled) {
                    return;
                }

                setBackends(availability.backends);
                setDefaultBackend(availability.defaultBackend);
                setSelectedBackend(availability.defaultBackend);
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Failed to fetch Manim backend availability");
                }
            }
        }

        void loadBackends();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        return () => {
            stopPolling();
        };
    }, [stopPolling]);

    const activeJobs = jobs.filter(job => isActiveJobStatus(job.status));
    const failedJobs = jobs.filter(job => isFailedDisplayStatus(job.status));

    return {
        animations,
        isGenerating,
        error,
        backends,
        defaultBackend,
        selectedBackend,
        setSelectedBackend,
        jobs,
        activeJobs,
        failedJobs,
        generateAll,
        generateStep,
        cancelJob,
        retryJob,
        refreshStatus,
        getVideoUrl,
        getAnimationsByStep,
    };
}
