// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
    site: 'https://purepar.ru',
    output: 'server',
    adapter: node({
        mode: 'middleware'
    }),
    vite: {
        build: {
            minify: true,
            sourcemap: false,
            chunkSizeWarningLimit: 500,
            terserOptions: {
                compress: {
                    drop_console: true,
                    drop_debugger: true
                }
            }
        }
    },
    compressHTML: true,
    integrations: [sitemap()],
    prefetch: {
        defaultStrategy: "viewport"
    }
});
