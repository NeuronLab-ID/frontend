import { Problem, Quest } from "@/types";

export async function getProblems(): Promise<Problem[]> {
    const problems: Problem[] = [];

    // Load all 270 problems
    for (let i = 1; i <= 270; i++) {
        try {
            const paddedId = i.toString().padStart(4, "0");
            const res = await fetch(`/data/problems/problem_${paddedId}.json`);
            if (res.ok) {
                const problem = await res.json();
                problems.push(problem);
            }
        } catch {
            // Skip missing problems
        }
    }

    return problems;
}

export async function getProblem(id: number): Promise<Problem | null> {
    try {
        const paddedId = id.toString().padStart(4, "0");
        const res = await fetch(`/data/problems/problem_${paddedId}.json`);
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export async function getQuest(id: number): Promise<Quest | null> {
    try {
        const paddedId = id.toString().padStart(4, "0");
        const res = await fetch(`/data/quests/quest_${paddedId}.json`);
        if (!res.ok) return null;
        return res.json();
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
