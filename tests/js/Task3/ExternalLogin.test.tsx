import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../helpers/inertia-mock';
import { usePage } from '@inertiajs/react';
import ExternalLogin from '@/pages/ExternalLogin';

describe('ExternalLogin', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders login form with code input', () => {
        (usePage as any).mockReturnValue({
            props: {
                prefillCode: '',
                flash: {},
                errors: {},
            },
        });

        render(<ExternalLogin />);

        expect(screen.getByPlaceholderText('IEAT-XXXX-XXXXXX')).toBeInTheDocument();
    });

    it('renders submit button', () => {
        (usePage as any).mockReturnValue({
            props: {
                prefillCode: '',
                flash: {},
                errors: {},
            },
        });

        render(<ExternalLogin />);

        expect(screen.getAllByText('เข้าสู่ระบบ').length).toBeGreaterThanOrEqual(1);
    });

    it('shows error flash message when flash.error set', () => {
        (usePage as any).mockReturnValue({
            props: {
                prefillCode: '',
                flash: { error: 'รหัสไม่ถูกต้อง' },
                errors: {},
            },
        });

        render(<ExternalLogin />);

        expect(screen.getByText('รหัสไม่ถูกต้อง')).toBeInTheDocument();
    });

    it('renders page title', () => {
        (usePage as any).mockReturnValue({
            props: {
                prefillCode: '',
                flash: {},
                errors: {},
            },
        });

        render(<ExternalLogin />);

        expect(screen.getByText('ระบบประเมิน 360 องศา')).toBeInTheDocument();
    });
});
