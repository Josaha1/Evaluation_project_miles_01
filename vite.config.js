import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: ['resources/views/**'],
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    server: {
        host: '0.0.0.0',
        port: 5174,
        strictPort: true,
        hmr: { host: 'localhost', port: 5174 },
        cors: true,
        warmup: {
            clientFiles: [
                'resources/js/app.tsx',
                'resources/js/Layouts/MainLayout.tsx',
                'resources/js/pages/Dashboard.tsx',
                'resources/js/pages/Auth/Login.tsx',
            ],
        },
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-dom/client',
            '@inertiajs/react',
            'framer-motion',
            'sonner',
            'axios',
            'lucide-react',
            'clsx',
            'tailwind-merge',
            'class-variance-authority',
            'ziggy-js',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-select',
            '@radix-ui/react-slot',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
        ],
    },
    build: {
        outDir: 'public_html/build',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    inertia: ['@inertiajs/react'],
                    ui: ['framer-motion', 'sonner', 'class-variance-authority', 'clsx', 'tailwind-merge'],
                    charts: ['highcharts', 'highcharts-react-official'],
                    forms: ['react-select'],
                },
            },
        },
    },
});
