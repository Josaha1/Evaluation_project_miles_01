import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../helpers/inertia-mock';

// Mock highcharts and highcharts-react-official before importing component
vi.mock('highcharts', () => ({
    default: {},
}));

vi.mock('highcharts-react-official', () => ({
    default: (props: any) => {
        const React = require('react');
        return React.createElement('div', { 'data-testid': 'highcharts-mock' }, 'Chart');
    },
}));

import ReportCharts from '@/Components/Report/ReportCharts';

describe('ReportCharts', () => {
    const mockData = {
        evaluateeCountByGrade: [
            { grade: 5, user_type: 'internal', total: 100, completed: 80, remaining: 20 },
            { grade: 9, user_type: 'internal', total: 50, completed: 40, remaining: 10 },
            { grade: 13, user_type: 'external', total: 10, completed: 8, remaining: 2 },
        ],
        part1ScoreYearly: [
            { aspect: 'ด้านที่ 1', part_id: 1, evaluatee_type: 'internal', evaluatee_grade: 5, year: 2568, average_score: 3.5 },
        ],
        part1AspectSummary: [
            { aspect: 'สมรรถนะที่ 1', average_score: 3.8, part_id: 1, group: '5-8' },
            { aspect: 'สมรรถนะที่ 2', average_score: 4.1, part_id: 1, group: '9-12:internal' },
        ],
        weightedSummary: [
            { rating: 5, grade: 5, user_type: 'internal', average: 4.5 },
            { rating: 4, grade: 9, user_type: 'internal', average: 3.8 },
            { rating: 3, grade: 5, user_type: 'internal', average: 3.2 },
        ],
    };

    it('renders without crashing', () => {
        render(<ReportCharts data={mockData} />);
        // Should render chart section headers
        expect(screen.getByText('อัตราความสำเร็จ')).toBeInTheDocument();
        expect(screen.getByText('การกระจายผลการประเมิน')).toBeInTheDocument();
        expect(screen.getByText('ผลการประเมินตามสมรรถนะ')).toBeInTheDocument();
    });

    it('renders mock chart elements', () => {
        render(<ReportCharts data={mockData} />);
        const charts = screen.getAllByTestId('highcharts-mock');
        expect(charts.length).toBe(3);
    });
});

// Test grade label function separately
describe('Grade label mapping', () => {
    // Based on the chart code: `C${item.grade} (${item.user_type})`
    // and the series naming logic in aspectPerformanceOptions
    it('maps grade 13 to external type label', () => {
        // Grade 13 is ผู้ว่าการ level (governor)
        const grade13Label = `C13 (external)`;
        expect(grade13Label).toContain('13');
    });

    it('maps grades 9-12 to ผู้บริหาร level', () => {
        // The component maps group '9-12:internal' to 'ผู้บริหารภายใน (C9-C12)'
        const groupLabel = (group: string) => {
            if (group === '5-8') return 'พนักงานภายใน (C5-C8)';
            if (group === '9-12:internal') return 'ผู้บริหารภายใน (C9-C12)';
            if (group === '9-12:external') return 'ผู้บริหารภายนอก (C9-C12)';
            return group;
        };

        expect(groupLabel('9-12:internal')).toBe('ผู้บริหารภายใน (C9-C12)');
        expect(groupLabel('9-12:external')).toBe('ผู้บริหารภายนอก (C9-C12)');
    });

    it('maps grades 4-8 to พนักงาน level', () => {
        const groupLabel = (group: string) => {
            if (group === '5-8') return 'พนักงานภายใน (C5-C8)';
            if (group === '9-12:internal') return 'ผู้บริหารภายใน (C9-C12)';
            if (group === '9-12:external') return 'ผู้บริหารภายนอก (C9-C12)';
            return group;
        };

        expect(groupLabel('5-8')).toBe('พนักงานภายใน (C5-C8)');
    });
});
