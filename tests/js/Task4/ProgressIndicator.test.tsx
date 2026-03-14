import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../helpers/inertia-mock';
import { ProgressIndicator } from '@/Components/ProgressIndicator';

describe('ProgressIndicator', () => {
    it('renders correct percentage for step 1 of 3 (0% because formula is (currentStep-1)/totalSteps)', () => {
        render(<ProgressIndicator currentStep={1} totalSteps={3} />);

        // The component uses ((currentStep - 1) / totalSteps) * 100
        // For step 1 of 3: ((1-1)/3)*100 = 0%
        expect(screen.getByText('0%')).toBeInTheDocument();
        expect(screen.getByText('ตอนที่ 1 จาก 3')).toBeInTheDocument();
    });

    it('renders 33% for step 2 of 3', () => {
        render(<ProgressIndicator currentStep={2} totalSteps={3} />);

        // ((2-1)/3)*100 = 33%
        expect(screen.getByText('33%')).toBeInTheDocument();
    });

    it('renders 67% for step 3 of 3 (last step)', () => {
        render(<ProgressIndicator currentStep={3} totalSteps={3} />);

        // ((3-1)/3)*100 = 67%
        expect(screen.getByText('67%')).toBeInTheDocument();
    });

    it('renders step indicator text', () => {
        render(<ProgressIndicator currentStep={2} totalSteps={5} />);
        expect(screen.getByText('ตอนที่ 2 จาก 5')).toBeInTheDocument();
    });

    it('renders group progress when totalGroups provided', () => {
        render(
            <ProgressIndicator
                currentStep={1}
                totalSteps={3}
                currentGroup={1}
                totalGroups={4}
            />
        );

        // Group progress: ((1+1)/4)*100 = 50%
        expect(screen.getByText('50%')).toBeInTheDocument();
        expect(screen.getByText('หัวข้อที่ 2 จาก 4')).toBeInTheDocument();
    });

    it('does not render group progress when totalGroups is 1', () => {
        render(
            <ProgressIndicator
                currentStep={2}
                totalSteps={3}
                currentGroup={0}
                totalGroups={1}
            />
        );

        // Should not show group-level progress text
        expect(screen.queryByText(/หัวข้อที่/)).not.toBeInTheDocument();
    });
});
