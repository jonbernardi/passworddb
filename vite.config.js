import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import inertia from '@inertiajs/vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.js'],
            refresh: true,
        }),
        tailwindcss(),
        inertia(),
        svelte(),
    ],
    resolve: {
        alias: {
            '~': path.resolve(__dirname, 'resources/js'),
            '@': path.resolve(__dirname, 'resources/js/components'),
            '@page': path.resolve(__dirname, 'resources/js/Pages'),
            '@css': path.resolve(__dirname, 'resources/css'),
            '@img': path.resolve(__dirname, 'resources/images'),
        },
    },
});
