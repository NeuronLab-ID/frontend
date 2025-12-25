import { Problem, Quest } from "@/types";

// API base for backend
const getApiBase = () => {
    if (typeof window !== 'undefined') {
        return `http://${window.location.hostname}:8000`;
    }
    return 'http://localhost:8000';
};

export async function getProblems(): Promise<Problem[]> {
    try {
        const res = await fetch(`${getApiBase()}/api/problems?limit=300`);
        if (res.ok) {
            const data = await res.json();
            return data.problems || [];
        }
    } catch (error) {
        console.error("Failed to fetch problems:", error);
    }
    return [];
}

export async function getProblem(id: number): Promise<Problem | null> {
    try {
        const res = await fetch(`${getApiBase()}/api/problems/${id}`);
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export async function getQuest(id: number): Promise<Quest | null> {
    try {
        const res = await fetch(`${getApiBase()}/api/quests/${id}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.quest || data;
    } catch {
        return null;
    }
}

export function hasQuest(problemId: number): boolean {
    // List of problem IDs that have quests
    const questIds = [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21,
        22, 23, 24, 25, 27, 28, 29, 30, 31, 32, 33, 34, 35, 37, 48, 55, 57, 58,
        65, 66, 67, 68, 74, 76, 83, 84, 117, 118, 119, 121, 195, 201
    ];
    return questIds.includes(problemId);
}

export function getCategories(): string[] {
    return [
        "Linear Algebra",
        "Machine Learning",
        "Deep Learning",
        "NLP",
        "Computer Vision",
        "Data Processing"
    ];
}

export function getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
        case "easy":
            return "text-green-400 bg-green-500/10";
        case "medium":
            return "text-yellow-400 bg-yellow-500/10";
        case "hard":
            return "text-red-400 bg-red-500/10";
        default:
            return "text-gray-400 bg-gray-500/10";
    }
}
