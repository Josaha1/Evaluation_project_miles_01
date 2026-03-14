import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../helpers/inertia-mock';
import { ProgressIndicator } from '@/Components/ProgressIndicator';

describe('ProgressIndicator', () => {
    it('renders with percentage display for step 1 of 3', () => {
        render(<ProgressIndicator currentStep={1} totalSteps={3} />);

        // Component renders percentage text and "ความคืบหน้า" label
        expect(screen.getByText('ความคืบหน้า')).toBeInTheDocument();
        // The "%" symbol is rendered in a separate span
        expect(screen.getByText('%')).toBeInTheDocument();
    });

    it('renders step numbers for each step', () => {
        render(<ProgressIndicator currentStep={1} totalSteps={3} />);

        // Step numbers rendered as pill indicators (may appear multiple times)
        expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
    });

    it('renders step text label', () => {
        render(<ProgressIndicator currentStep={2} totalSteps={3} />);

        // Should display "ตอนที่ X จาก Y" somewhere
        expect(screen.getByText(/ตอนที่/)).toBeInTheDocument();
    });

    it('renders with group progress info when totalGroups provided', () => {
        render(
            <ProgressIndicator
                currentStep={1}
                totalSteps={3}
                currentGroup={1}
                totalGroups={4}
            />
        );

        // Should show group-related info
        expect(screen.getByText(/หัวข้อ/)).toBeInTheDocument();
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
