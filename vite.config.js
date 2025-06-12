import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
           
        }),
        react(),
        tailwindcss(),
    ],
    esbuild:{
        jsx: 'automatic',
    },
    build: {
        outDir: 'public_html/build', // ต้องตรงกับตำแหน่งที่อัปโหลด
        emptyOutDir: true,
    },
});
