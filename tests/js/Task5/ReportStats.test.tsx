import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../helpers/inertia-mock';
import ReportStats from '@/Components/Report/ReportStats';

describe('ReportStats', () => {
    const mockSummaryStats = {
        total_evaluatees: 607,
        total_completed: 450,
        total_remaining: 157,
        completion_rate: 74.1,
        score_distribution: {
            excellent: 50,
            very_good: 150,
            good: 180,
            fair: 50,
            poor: 20,
        },
        avg_scores_by_group: {
            internal_5_8: 3.5,
            internal_9_12: 3.8,
            external_9_12: 4.0,
        },
        overall_avg_score: 3.65,
        highest_score: 4.85,
        lowest_score: 1.20,
    };

    it('renders KPI cards with total_evaluatees (607)', () => {
        render(<ReportStats summaryStats={mockSummaryStats} />);
        expect(screen.getByText('607')).toBeInTheDocument();
        expect(screen.getByText('ผู้เข้าร่วมทั้งหมด')).toBeInTheDocument();
    });

    it('renders completion rate (74.1%)', () => {
        render(<ReportStats summaryStats={mockSummaryStats} />);
        expect(screen.getByText('74.1%')).toBeInTheDocument();
        expect(screen.getByText('อัตราความสำเร็จ')).toBeInTheDocument();
    });

    it('renders completed count in subtitle', () => {
        render(<ReportStats summaryStats={mockSummaryStats} />);
        expect(screen.getByText('เสร็จสิ้น 450 คน')).toBeInTheDocument();
    });

    it('renders overall average score', () => {
        render(<ReportStats summaryStats={mockSummaryStats} />);
        expect(screen.getByText('3.65')).toBeInTheDocument();
        expect(screen.getByText('คะแนนเฉลี่ย')).toBeInTheDocument();
    });

    it('renders remaining count', () => {
        render(<ReportStats summaryStats={mockSummaryStats} />);
        expect(screen.getByText('คงเหลือ 157 คน')).toBeInTheDocument();
    });
});
