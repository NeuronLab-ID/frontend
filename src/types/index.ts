export interface Problem {
    id: number;
    title: string;
    category: string;
    difficulty: "easy" | "medium" | "hard";
    description: string;
    description_decoded?: string;
    learn_section?: string;
    learn_section_decoded?: string;
    example: {
        input: string;
        output: string;
        reasoning?: string;
    };
    starter_code: string;
    learn?: string;
    solution?: string;
    test_code?: string;
    test_cases?: {
        test: string;
        expected_output: string;
    }[];
    playground_enabled?: boolean;
    playground_code?: string;
    // Framework variants
    pytorch_starter_code?: string;
    pytorch_test_cases?: string;
    tinygrad_starter_code?: string;
    tinygrad_test_cases?: string;
    cuda_starter_code?: string;
    cuda_test_cases?: string;
    // Video
    video?: string;
}

export interface SubQuest {
    step: number;
    title: string;
    relation_to_problem: string;
    prerequisites: string[];
    learning_objectives: string[];
    math_content: {
        definition: string;
        notation?: string;
        theorem?: string;
        proof_sketch?: string;
        examples: string[];
    };
    key_formulas: {
        name: string;
        latex: string;
        description: string;
    }[];
    exercise: {
        description: string;
        function_signature: string;
        starter_code: string;
        test_cases: {
            input: string;
            expected: string;
            explanation: string;
        }[];
    };
    common_mistakes: string[];
    hint: string;
    references: string[];
}

export interface Quest extends Problem {
    sub_quests: SubQuest[];
}

export interface UserProgress {
    completedProblems: number[];
    questProgress: Record<number, number[]>;
    savedCode: Record<number, string>;
}

// ========== Manim Animation Types ==========

export type ManimBackendName = "cpu" | "egpu";

export type ManimVideoType = "visualization" | "calculation";

export type ManimJobStatus =
    | "queued"
    | "generating_code"
    | "rendering"
    | "cancelling"
    | "succeeded"
    | "failed_retryable"
    | "failed_terminal"
    | "cancelled"
    | "orphaned";

export interface ManimBackend {
    name: ManimBackendName;
    available: boolean;
    default: boolean;
    reason?: string | null;
}

export interface ManimBackends {
    defaultBackend: ManimBackendName;
    backends: ManimBackend[];
}

export interface CreateManimJobResponse {
    jobId: string;
    status: ManimJobStatus;
    statusUrl: string;
    eventsUrl: string;
}

export interface ManimJob {
    jobId: string;
    status: ManimJobStatus;
    problemId?: number;
    stepNumber?: number | null;
    videoType?: ManimVideoType | null;
    progress?: number | null;
    attempt?: number | null;
    maxAttempts?: number | null;
    errorMessage?: string | null;
    errorCode?: string | null;
    logsTail?: string | null;
    requestedBackend?: ManimBackendName | null;
    resolvedBackend?: ManimBackendName | null;
    statusUrl?: string;
    eventsUrl?: string;
    createdAt?: string | null;
    updatedAt?: string | null;
    queuedAt?: string | null;
    startedAt?: string | null;
    finishedAt?: string | null;
    cancelRequestedAt?: string | null;
}

export interface ManimAnimation {
    id: number;
    problemId: number;
    stepNumber: number;
    videoType: ManimVideoType;
    status: "pending" | "rendering" | "completed" | "error";
    videoUrl?: string;
    errorMessage?: string;
    renderTimeMs?: number;
    createdAt: string;
}

export interface ManimStatus {
    problemId: number;
    animations: ManimAnimation[];
    totalSteps: number;
    completedCount: number;
    renderingCount: number;
    errorCount: number;
    pendingCount: number;
}
