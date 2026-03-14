import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../helpers/inertia-mock';
import { usePage } from '@inertiajs/react';
import ExternalDashboard from '@/pages/ExternalDashboard';

describe('ExternalDashboard', () => {
    const mockEvaluatees = [
        { id: 1, name: 'สมชาย ใจดี', position: 'ผู้จัดการ', evaluation_title: 'ประเมิน 360', is_completed: true, access_code_id: 101 },
        { id: 2, name: 'สมหญิง รักงาน', position: 'หัวหน้า', evaluation_title: 'ประเมิน 360', is_completed: false, access_code_id: 102 },
        { id: 3, name: 'สมศักดิ์ ทำดี', position: 'พนักงาน', evaluation_title: 'ประเมิน 360', is_completed: false, access_code_id: 103 },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (usePage as any).mockReturnValue({
            props: {
                organization: { id: 1, name: 'การนิคมอุตสาหกรรมแห่งประเทศไทย' },
                evaluatees: mockEvaluatees,
                currentEvaluateeId: 2,
            },
        });
    });

    it('renders organization name', () => {
        render(<ExternalDashboard />);
        expect(screen.getByText('การนิคมอุตสาหกรรมแห่งประเทศไทย')).toBeInTheDocument();
    });

    it('renders evaluatee list (3 items)', () => {
        render(<ExternalDashboard />);
        expect(screen.getByText('สมชาย ใจดี')).toBeInTheDocument();
        expect(screen.getByText('สมหญิง รักงาน')).toBeInTheDocument();
        expect(screen.getByText('สมศักดิ์ ทำดี')).toBeInTheDocument();
    });

    it('shows completion indicators', () => {
        render(<ExternalDashboard />);
        // Completed item shows เสร็จสิ้น
        expect(screen.getByText('เสร็จสิ้น')).toBeInTheDocument();
        // Current evaluatee shows เริ่มประเมิน
        expect(screen.getByText('เริ่มประเมิน')).toBeInTheDocument();
    });

    it('calculates correct progress (1/3)', () => {
        render(<ExternalDashboard />);
        // The component shows "completedCount/totalCount รายการ"
        expect(screen.getByText('1/3 รายการ')).toBeInTheDocument();
    });
});
