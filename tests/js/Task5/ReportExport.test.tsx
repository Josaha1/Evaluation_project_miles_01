import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../helpers/inertia-mock';
import ReportExport from '@/Components/Report/ReportExport';

describe('ReportExport', () => {
    const defaultProps = {
        fiscalYear: '2025',
        filters: {},
        totalRecords: 607,
    };

    it('renders export section', () => {
        render(<ReportExport {...defaultProps} />);
        expect(screen.getByText('ส่งออกรายงาน')).toBeInTheDocument();
    });

    it('shows fiscal year info converted to Buddhist Era (2568)', () => {
        render(<ReportExport {...defaultProps} />);
        // The component renders: parseInt(fiscalYear) + 543 = 2025 + 543 = 2568
        expect(screen.getByText('2568')).toBeInTheDocument();
    });

    it('renders export options', () => {
        render(<ReportExport {...defaultProps} />);
        expect(screen.getByText('ส่งออกทั้งหมด')).toBeInTheDocument();
        expect(screen.getByText('พนักงานภายใน (C5-C8)')).toBeInTheDocument();
        expect(screen.getByText('ผู้บริหาร (C9-C12)')).toBeInTheDocument();
    });

    it('renders total records in export options', () => {
        render(<ReportExport {...defaultProps} />);
        expect(screen.getByText('607 รายการ')).toBeInTheDocument();
    });

    it('renders raw data export section', () => {
        render(<ReportExport {...defaultProps} />);
        expect(screen.getByText('ส่งออกข้อมูลดิบ (Raw Data)')).toBeInTheDocument();
    });
});
