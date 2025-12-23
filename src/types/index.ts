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
