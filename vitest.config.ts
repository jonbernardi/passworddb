import {defineConfig} from 'vitest/config';
import vue from '@vitejs/plugin-vue';

// Neither test project loads the Workers plugin or .dev.vars.
export default defineConfig({
    test: {
        projects: [
            {
                plugins: [vue()],
                test: {
                    name: 'client',
                    environment: 'jsdom',
                    include: ['tests/client/**/*.test.ts'],
                    setupFiles: ['tests/client/setup.ts'],
                    restoreMocks: true,
                },
            },
            {
                test: {
                    name: 'server',
                    environment: 'node',
                    include: ['tests/server/**/*.test.mjs'],
                    restoreMocks: true,
                },
            },
        ],
        coverage: {
            provider: 'v8',
            include: ['src/server/**/*.ts', 'src/client/services/**/*.ts', 'src/client/components/**/*.vue', 'src/client/App.vue'],
            exclude: ['src/server/types.ts'],
            reporter: ['text', 'html'],
            reportsDirectory: 'coverage/all',
        },
    },
});
