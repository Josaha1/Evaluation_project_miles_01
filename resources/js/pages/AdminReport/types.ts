// ============================================================================
// AdminReport Types & Helpers
// TypeScript interfaces for the admin evaluation report page (360-degree)
// ============================================================================

// --- Tab & Layout types ---

export type TabId = 'dashboard' | 'analytics' | 'reports' | 'exports' | 'assignments';
export type LayoutMode = 'cards' | 'table';

// --- Page props (sent from backend via Inertia) ---

export interface PageProps {
    filters: {
        fiscal_year?: string;
        division?: string;
        grade?: string;
        user_id?: string;
    };
    availableYears: string[];
    availableDivisions: { id: number; name: string }[];
    availableGrades: number[];
    availableUsers: { id: number; name: string }[];
    availableDepartments: { id: number; title: string }[];
    availablePositions: { id: number; title: string }[];
    fiscalYear: string;

    dashboardStats: {
        totalParticipants: number;
        completedEvaluations: number;
        pendingEvaluations: number;
        overallCompletionRate: number;
        averageScore: number;
        totalQuestions: number;
        totalAnswers: number;
        uniqueEvaluators: number;
        uniqueEvaluatees: number;
        evaluationTypes: number;
        lastUpdated: string;
    };

    evaluationMetrics: {
        byGrade: Array<{
            grade: number;
            total: number;
            completed: number;
            averageScore: number;
            completionRate: number;
        }>;
        byDivision: Array<{
            division: string;
            divisionId: number;
            total: number;
            completed: number;
            averageScore: number;
            completionRate: number;
        }>;
        byAngle: Array<{
            angle: string;
            total: number;
            completed: number;
            averageScore: number;
        }>;
        trends: Array<{
            date: string;
            completions: number;
            averageScore: number;
        }>;
    };

    detailedResults: DetailedResult[];

    externalOrgMetrics: Array<{
        org_id: number;
        org_name: string;
        total_responses: number;
        avg_score: number;
        evaluatee_count: number;
        evaluator_count?: number;
    }>;
}

// --- Detailed result per evaluatee ---

export interface DetailedResult {
    id: number;
    evaluateeName: string;
    evaluateeGrade: number;
    evaluateeDivision: string;
    evaluateePosition: string;
    scores: {
        self: number;
        top: number;
        bottom: number;
        left: number;
        right: number;
        average: number;
    };
    completionStatus: {
        totalAngles: number;
        completedAngles: number;
        completionRate: number;
        lastActivity: string;
    };
}

// --- Filter state used by useReportFilters hook ---

export interface FilterState {
    search: string;
    division: string;
    grade: string;
    externalOrg: string;
}

// ============================================================================
// Helper functions
// ============================================================================

/**
 * Maps a grade number to its Thai label.
 *  - 13        → ผู้ว่าการ
 *  - 9 to 12   → ผู้บริหาร
 *  - 4 to 8    → พนักงาน
 *  - otherwise → ระดับ {grade}
 */
export function getGradeLabel(grade: number): string {
    if (grade === 13) return 'ผู้ว่าการ';
    if (grade >= 9 && grade <= 12) return 'ผู้บริหาร';
    if (grade >= 4 && grade <= 8) return 'พนักงาน';
    return `ระดับ ${grade}`;
}

/**
 * Maps evaluation angle codes to Thai labels.
 */
export function getAngleLabel(angle: string): string {
    const labels: Record<string, string> = {
        self: 'ตนเอง',
        top: 'ผู้บังคับบัญชา',
        bottom: 'ผู้ใต้บังคับบัญชา',
        left: 'เพื่อนร่วมงาน',
        right: 'องค์กรภายนอก',
    };
    return labels[angle] ?? angle;
}

/**
 * Returns a Tailwind color class based on a score (1-5 scale).
 *  - >= 4.5 → green
 *  - >= 3.5 → blue
 *  - >= 2.5 → yellow
 *  - < 2.5  → red
 */
export function getScoreColor(score: number): string {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-blue-600';
    if (score >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
}

/**
 * Returns a Tailwind color class based on completion rate (0-100).
 *  - >= 90  → green
 *  - >= 70  → blue
 *  - >= 50  → yellow
 *  - < 50   → red
 */
export function getCompletionColor(rate: number): string {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-blue-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
}
