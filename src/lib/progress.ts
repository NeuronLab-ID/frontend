import { UserProgress } from "@/types";

const STORAGE_KEY = "deepml_progress";

export function getProgress(): UserProgress {
    if (typeof window === "undefined") {
        return { completedProblems: [], questProgress: {}, savedCode: {} };
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        return { completedProblems: [], questProgress: {}, savedCode: {} };
    }

    try {
        return JSON.parse(stored);
    } catch {
        return { completedProblems: [], questProgress: {}, savedCode: {} };
    }
}

export function saveProgress(progress: UserProgress): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function markProblemComplete(problemId: number): void {
    const progress = getProgress();
    if (!progress.completedProblems.includes(problemId)) {
        progress.completedProblems.push(problemId);
        saveProgress(progress);
    }
}

export function isProblemComplete(problemId: number): boolean {
    const progress = getProgress();
    return progress.completedProblems.includes(problemId);
}

export function markSubQuestComplete(questId: number, step: number): void {
    const progress = getProgress();
    if (!progress.questProgress[questId]) {
        progress.questProgress[questId] = [];
    }
    if (!progress.questProgress[questId].includes(step)) {
        progress.questProgress[questId].push(step);
        saveProgress(progress);
    }
}

export function getQuestProgress(questId: number): number[] {
    const progress = getProgress();
    return progress.questProgress[questId] || [];
}

export function saveCode(problemId: number, code: string): void {
    const progress = getProgress();
    progress.savedCode[problemId] = code;
    saveProgress(progress);
}

export function getSavedCode(problemId: number): string | null {
    const progress = getProgress();
    return progress.savedCode[problemId] || null;
}

export function getStats(): { solved: number; streak: number; paths: number } {
    const progress = getProgress();
    const solved = progress.completedProblems.length;
    const paths = Object.keys(progress.questProgress).length;

    // Simple streak calculation (placeholder)
    const streak = solved > 0 ? Math.min(solved, 7) : 0;

    return { solved, streak, paths };
}
