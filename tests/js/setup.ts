import '@testing-library/jest-dom';

// Mock window.route (ziggy)
(globalThis as any).route = (name: string, params?: any) => {
    if (params) {
        const paramStr = typeof params === 'object'
            ? Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&')
            : params;
        return `/${name.replace(/\./g, '/')}?${paramStr}`;
    }
    return `/${name.replace(/\./g, '/')}`;
};
