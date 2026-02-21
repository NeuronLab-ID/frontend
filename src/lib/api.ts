/**
 * API client for NeuronLab backend
 */

import type { Problem } from "@/types";

// Dynamic API base - uses env var, or current hostname for same-network access
const getApiBase = () => {
    // 1. Use environment variable if set
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // 2. In browser, use current hostname (supports same-network access via 192.x.x.x)
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        return `http://${hostname}:8000`;
    }

    // 3. Fallback for SSR
    return 'http://localhost:8000';
};

const API_BASE = getApiBase();

// Token management
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
    authToken = token;
    if (typeof window !== 'undefined') {
        if (token) {
            localStorage.setItem('auth_token', token);
            // Also set cookie for middleware (7 day expiry)
            document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        } else {
            localStorage.removeItem('auth_token');
            // Clear cookie
            document.cookie = 'auth_token=; path=/; max-age=0';
        }
    }
}

export function getAuthToken(): string | null {
    if (!authToken && typeof window !== 'undefined') {
        authToken = localStorage.getItem('auth_token');
    }
    return authToken;
}

export function isAuthenticated(): boolean {
    return !!getAuthToken();
}

export function logout() {
    setAuthToken(null);
    authToken = null;
}

// API request helper
export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getAuthToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));

        // Check for token expiration/invalid token
        const errorDetail = typeof error.detail === 'string' ? error.detail : '';
        if (response.status === 401 ||
            errorDetail.toLowerCase().includes('invalid') ||
            errorDetail.toLowerCase().includes('expired') ||
            errorDetail.toLowerCase().includes('token')) {
            // Clear auth and redirect to login
            logout();
            if (typeof window !== 'undefined') {
                // Store current path to redirect back after login
                sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
                window.location.href = '/login';
            }
            throw new Error('Session expired. Please login again.');
        }

        // Handle FastAPI validation errors which return detail as an array
        let errorMessage: string;
        if (Array.isArray(error.detail)) {
            // Extract messages from validation error objects
            errorMessage = error.detail.map((e: { msg?: string; message?: string }) => e.msg || e.message || JSON.stringify(e)).join(', ');
        } else if (typeof error.detail === 'object') {
            errorMessage = error.detail.msg || error.detail.message || JSON.stringify(error.detail);
        } else {
            errorMessage = error.detail || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
    }

    return response.json();
}

// Auth endpoints
export interface LoginResponse {
    access_token: string;
    token_type: string;
}

export interface UserResponse {
    id: number;
    username: string;
    email: string;
    created_at: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiRequest<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    setAuthToken(response.access_token);
    return response;
}

export async function register(username: string, email: string, password: string): Promise<UserResponse> {
    return apiRequest<UserResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
    });
}

export async function getCurrentUser(): Promise<UserResponse> {
    return apiRequest<UserResponse>('/api/auth/me');
}

// Execute code endpoint
export interface TestResult {
    test_number: number;
    passed: boolean;
    input?: string;
    expected?: string;
    actual?: string;
    error?: string;
}

export interface ExecuteResponse {
    success: boolean;
    results: TestResult[];
    error?: string;
    hint?: string;
    execution_time: number;
}

export async function executeCode(problemId: number, code: string, framework?: string): Promise<ExecuteResponse> {
    return apiRequest<ExecuteResponse>('/api/execute', {
        method: 'POST',
        body: JSON.stringify({ problem_id: problemId, code, ...(framework && { framework }) }),
    });
}

// Problems endpoint (public)
export interface ProblemSummary {
    id: number;
    title: string;
    category: string;
    difficulty: string;
    has_quest: boolean;
}

export async function getProblems(page: number = 1, limit: number = 20, category?: string, search?: string): Promise<{ problems: ProblemSummary[]; total: number; page: number; limit: number }> {
    let url = `/api/problems?page=${page}&limit=${limit}`;
    if (category) {
        url += `&category=${encodeURIComponent(category)}`;
    }
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }
    return apiRequest(url);
}

// Get single problem details
export async function getProblem(problemId: number): Promise<Problem> {
    return apiRequest(`/api/problems/${problemId}`);
}

// Request AI hint for error
export interface HintResponse {
    hint: string | null;
}

export async function getHint(problemId: number, code: string, error: string): Promise<HintResponse> {
    return apiRequest<HintResponse>('/api/hint', {
        method: 'POST',
        body: JSON.stringify({ problem_id: problemId, code, error }),
    });
}

// Quest code execution
export async function executeQuestCode(problemId: number, step: number, code: string): Promise<ExecuteResponse> {
    return apiRequest<ExecuteResponse>('/api/quest/execute', {
        method: 'POST',
        body: JSON.stringify({ problem_id: problemId, step, code }),
    });
}

// Quest AI hint
export async function getQuestHint(problemId: number, step: number, code: string, error: string): Promise<HintResponse> {
    return apiRequest<HintResponse>('/api/quest/hint', {
        method: 'POST',
        body: JSON.stringify({ problem_id: problemId, step, code, error }),
    });
}

// Generate reasoning for test case
export interface TestCaseReasoningResponse {
    input: string;
    process: string;
    output: string;
}

export async function generateTestCaseReasoning(
    problemId: number,
    step: number,
    testInput: string,
    expectedOutput: string,
    functionSignature: string
): Promise<TestCaseReasoningResponse> {
    return apiRequest<TestCaseReasoningResponse>('/api/quest/reasoning', {
        method: 'POST',
        body: JSON.stringify({
            problem_id: problemId,
            step,
            test_input: testInput,
            expected_output: expectedOutput,
            function_signature: functionSignature
        }),
    });
}

// Quest progress
export interface QuestStepProgress {
    step: number;
    code: string;
    completed: boolean;
    created_at: string;
}

export interface QuestProgressResponse {
    progress: QuestStepProgress[];
}

export async function saveQuestProgress(problemId: number, step: number, code: string): Promise<{ message: string; step: number }> {
    return apiRequest<{ message: string; step: number }>('/api/quest/progress', {
        method: 'POST',
        body: JSON.stringify({ problem_id: problemId, step, code }),
    });
}

export async function getQuestProgress(problemId: number): Promise<QuestProgressResponse> {
    return apiRequest<QuestProgressResponse>(`/api/quest/progress/${problemId}`);
}

// Full problem reasoning
export interface FullReasoningStep {
    step: number;
    title: string;
    reasoning: string;
}

export interface FullReasoningData {
    steps: FullReasoningStep[];
    summary: string;
    web_references?: string;  // Perplexity search results (includes images)
}

export interface CachedReasoningResponse {
    exists: boolean;
    data: FullReasoningData | null;
    created_at?: string;
}

export async function getCachedFullReasoning(problemId: number): Promise<CachedReasoningResponse> {
    return apiRequest<CachedReasoningResponse>(`/api/quest/full-reasoning/${problemId}`);
}

export type ReasoningStreamEvent =
    | { type: 'step'; data: FullReasoningStep }
    | { type: 'summary'; data: string }
    | { type: 'done'; cached: boolean }
    | { type: 'error'; message: string }
    | { type: 'search'; data: { step: number; topic: string } }
    | { type: 'search_result'; data: { content: string } }
    | { type: 'search_complete'; data: { chars: number } };

export async function* streamFullReasoning(problemId: number, force: boolean = false, usePerplexity: boolean = false, usePerplexityReasoning: boolean = false, model: string = ""): AsyncGenerator<ReasoningStreamEvent> {
    const token = getAuthToken();
    const API_BASE = typeof window !== 'undefined'
        ? `http://${window.location.hostname}:8000`
        : 'http://localhost:8000';

    const params = new URLSearchParams();
    if (force) params.append('force', 'true');
    if (usePerplexity) params.append('usePerplexity', 'true');
    if (usePerplexityReasoning) params.append('usePerplexityReasoning', 'true');
    if (model) params.append('model', model);
    const queryString = params.toString();

    const url = `${API_BASE}/api/quest/full-reasoning/${problemId}/stream${queryString ? '?' + queryString : ''}`;
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to stream reasoning: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const event = JSON.parse(line.slice(6)) as ReasoningStreamEvent;
                    yield event;
                } catch {
                    // Skip invalid JSON
                }
            }
        }
    }
}

// Export reasoning as markdown
export interface ExportMarkdownResponse {
    markdown: string;
    enhanced: boolean;
}

export async function exportReasoningMarkdown(problemId: number, useAi: boolean = false): Promise<ExportMarkdownResponse> {
    return apiRequest<ExportMarkdownResponse>(`/api/quest/export-markdown/${problemId}?use_ai=${useAi}`, {
        method: 'POST',
    });
}

// Export reasoning as LaTeX (.tex) document
export interface ExportLatexResponse {
    latex: string;
    ai_generated: boolean;
    model?: string;  // 'sonnet' or 'pplx_alpha'
}

export async function exportReasoningLatex(problemId: number, useSonnet: boolean = false): Promise<ExportLatexResponse> {
    return apiRequest<ExportLatexResponse>(`/api/quest/export-latex/${problemId}?useSonnet=${useSonnet}`, {
        method: 'POST',
    });
}

// Export reasoning as Jupyter notebook (.ipynb)
export interface ExportNotebookResponse {
    notebook: string;  // JSON string of notebook content
    ai_model: string;  // 'sonnet' or 'default'
    cached?: boolean;
}

export async function exportReasoningNotebook(problemId: number, useSonnet: boolean = false): Promise<ExportNotebookResponse> {
    return apiRequest<ExportNotebookResponse>(`/api/quest/export-notebook/${problemId}?useSonnet=${useSonnet}`, {
        method: 'POST',
    });
}

// Persist a mermaid AI fix to the reasoning database
export async function persistMermaidFix(problemId: number, originalCode: string, fixedCode: string): Promise<{ success: boolean; updated: boolean }> {
    return apiRequest<{ success: boolean; updated: boolean }>('/api/persist-mermaid-fix', {
        method: 'POST',
        body: JSON.stringify({ problem_id: problemId, original_code: originalCode, fixed_code: fixedCode }),
    });
}


// Submission history
export interface SubmissionRecord {
    id: number;
    code: string;
    passed: boolean;
    error?: string;
    execution_time: number;
    created_at: string;
}

export async function getSubmissions(problemId: number): Promise<SubmissionRecord[]> {
    return apiRequest<SubmissionRecord[]>(`/api/submissions/${problemId}`);
}

export async function saveSubmission(problemId: number, code: string, passed: boolean = false): Promise<{ id: number; message: string; passed: boolean }> {
    return apiRequest<{ id: number; message: string; passed: boolean }>('/api/submissions', {
        method: 'POST',
        body: JSON.stringify({ problem_id: problemId, code, passed }),
    });
}

export async function deleteSubmission(submissionId: number): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/api/submissions/${submissionId}`, {
        method: 'DELETE',
    });
}

// AI-generated solution
export async function getSolution(problemId: number): Promise<{ solution: string }> {
    return apiRequest<{ solution: string }>(`/api/problems/${problemId}/solution`);
}

export interface UserProfile {
    user: {
        id: number;
        username: string;
        email: string;
        created_at: string;
        avatar_url?: string;
        display_name?: string;
        bio?: string;
    };
    stats: {
        problems_solved: number;
        total_submissions: number;
        success_rate: number;
        streak: number;
        paths_completed: number;
        rank: string;
    };
    difficulty_breakdown: {
        easy: number;
        medium: number;
        hard: number;
    };
    recent_activity: Array<{
        id: number;
        problem_id: number;
        passed: boolean;
        created_at: string;
    }>;
    calendar_data: Record<string, number>;
    category_progress: Array<{
        name: string;
        solved: number;
        total: number;
    }>;
    achievements: Array<{
        name: string;
        description: string;
        unlocked: boolean;
        unlocked_at?: string;
    }>;
}

export async function getUserProfile(): Promise<UserProfile> {
    return apiRequest<UserProfile>('/api/user/profile');
}

export async function updateUserProfile(updates: { display_name?: string; bio?: string; avatar_url?: string }): Promise<UserProfile> {
    return apiRequest<UserProfile>('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
}

// ========== Quest API ==========

export interface Quest {
    problem_id: number;
    title: string;
    category: string;
    difficulty: string;
    description: string;
    example: {
        input: string;
        output: string;
        reasoning: string;
    };
    starter_code: string;
    sub_quests: SubQuest[];
}

export interface SubQuest {
    step: number;
    title: string;
    relation_to_problem: string;
    prerequisites: string[];
    learning_objectives: string[];
    math_content: {
        definition: string;
        notation: string;
        theorem: string;
        proof_sketch: string;
        examples: string[];
    };
    key_formulas: Array<{
        name: string;
        latex: string;
        description: string;
    }>;
    exercise: {
        description: string;
        function_signature: string;
        starter_code: string;
        test_cases: Array<{
            input: string;
            expected: string;
            explanation: string;
        }>;
    };
    common_mistakes: string[];
    hint: string;
    references: string[];
}

export async function getQuest(problemId: number): Promise<Quest> {
    return apiRequest<Quest>(`/api/quests/${problemId}`);
}

export interface QuestCheckResponse {
    exists: boolean;
    local_dev: boolean;
}

export async function checkQuestExists(problemId: number): Promise<QuestCheckResponse> {
    return apiRequest<QuestCheckResponse>(`/api/quests/check/${problemId}`);
}

export async function createQuest(problemId: number, data: Quest): Promise<{ message: string; id: number }> {
    return apiRequest<{ message: string; id: number }>('/api/quests', {
        method: 'POST',
        body: JSON.stringify({ problem_id: problemId, data }),
    });
}

// ========== Manim Animation Endpoints ==========

export interface ManimAnimation {
    id: number;
    problemId: number;
    stepNumber: number;
    videoType: "visualization" | "calculation";
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
}

// ========== Manim Mapping Functions ==========

function mapManimAnimation(raw: Record<string, unknown>): ManimAnimation {
    return {
        id: raw.id as number,
        problemId: (raw.problem_id ?? raw.problemId) as number,
        stepNumber: (raw.step_number ?? raw.stepNumber) as number,
        videoType: (raw.video_type ?? raw.videoType ?? "calculation") as ManimAnimation['videoType'],
        status: raw.status as ManimAnimation['status'],
        videoUrl: (raw.video_url ?? raw.video_path ?? raw.videoUrl) as string | undefined,
        errorMessage: (raw.error_message ?? raw.errorMessage) as string | undefined,
        renderTimeMs: (raw.render_time_ms ?? raw.renderTimeMs) as number | undefined,
        createdAt: (raw.created_at ?? raw.createdAt) as string,
    };
}

function mapManimStatus(raw: Record<string, unknown>): ManimStatus {
    const rawAnimations = (raw.animations ?? []) as Record<string, unknown>[];
    return {
        problemId: (raw.problem_id ?? raw.problemId) as number,
        animations: rawAnimations.map(mapManimAnimation),
        totalSteps: (raw.total_steps ?? raw.totalSteps) as number,
        completedCount: (raw.completed_count ?? raw.completedCount) as number,
        renderingCount: (raw.rendering_count ?? raw.renderingCount) as number,
        errorCount: (raw.error_count ?? raw.errorCount) as number,
    };
}

export async function generateManimAnimation(problemId: number, stepNumber?: number, videoType?: string): Promise<ManimAnimation | ManimAnimation[]> {
    const response = await apiRequest<Record<string, unknown> | Record<string, unknown>[]>('/api/manim/generate', {
        method: 'POST',
        body: JSON.stringify({
            problem_id: problemId,
            ...(stepNumber !== undefined && { step_number: stepNumber }),
            ...(videoType !== undefined && { video_type: videoType }),
        }),
    });

    if (Array.isArray(response)) {
        return response.map(mapManimAnimation);
    }
    return mapManimAnimation(response);
}

export async function getManimStatus(problemId: number): Promise<ManimStatus> {
    const response = await apiRequest<Record<string, unknown>>(`/api/manim/status/${problemId}`);
    return mapManimStatus(response);
}

export function getManimVideoUrl(problemId: number, stepNumber: number, videoType?: string): string {
    const base = `${API_BASE}/api/manim/video/${problemId}/${stepNumber}`;
    return videoType ? `${base}?type=${videoType}` : base;
}
