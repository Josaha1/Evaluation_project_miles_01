import { vi } from 'vitest';

export const mockRouter = {
    visit: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    reload: vi.fn(),
    get: vi.fn(),
};

export const mockUseForm = (initialData: Record<string, any> = {}) => {
    const data = { ...initialData };
    return {
        data,
        setData: vi.fn((key: string, value: any) => {
            (data as any)[key] = value;
        }),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        processing: false,
        errors: {} as Record<string, string>,
        reset: vi.fn(),
        clearErrors: vi.fn(),
        transform: vi.fn(),
    };
};

export function createPageProps<T extends Record<string, any>>(props: T) {
    return {
        ...props,
        auth: props.auth || { user: { id: 1, name: 'Test User', role: 'user', grade: '5' } },
        flash: props.flash || {},
        errors: props.errors || {},
    };
}

vi.mock('@inertiajs/react', async () => {
    const actual = await vi.importActual('@inertiajs/react') as any;
    return {
        ...actual,
        usePage: vi.fn(() => ({
            props: {
                auth: { user: { id: 1, name: 'Test User', role: 'user', grade: '5' } },
                flash: {},
                errors: {},
            },
        })),
        router: mockRouter,
        useForm: vi.fn((initialData: any) => mockUseForm(initialData)),
        Link: ({ children, href, ...props }: any) => {
            const React = require('react');
            return React.createElement('a', { href, ...props }, children);
        },
        Head: ({ title }: any) => {
            const React = require('react');
            return React.createElement('title', null, title);
        },
    };
});

vi.mock('ziggy-js', () => ({
    default: (name: string, params?: any) => `/${name.replace(/\./g, '/')}`,
}));

vi.mock('framer-motion', async () => {
    const React = require('react');
    return {
        motion: new Proxy({}, {
            get: (_target: any, prop: string) => {
                return React.forwardRef(({ children, ...props }: any, ref: any) => {
                    const filteredProps = Object.fromEntries(
                        Object.entries(props).filter(
                            ([key]) => !['initial', 'animate', 'exit', 'variants', 'transition',
                                'whileHover', 'whileTap', 'whileInView', 'layout', 'layoutId',
                                'onAnimationComplete'].includes(key)
                        )
                    );
                    return React.createElement(prop, { ...filteredProps, ref }, children);
                });
            },
        }),
        AnimatePresence: ({ children }: any) => children,
        useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
        useMotionValue: (initial: any) => ({ get: () => initial, set: vi.fn() }),
        useTransform: (value: any) => value,
        useInView: () => true,
    };
});

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warning: vi.fn(),
    },
    Toaster: () => null,
}));
